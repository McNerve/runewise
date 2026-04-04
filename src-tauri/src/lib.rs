use std::collections::HashMap;
use std::fs;
use std::path::Path;
use std::sync::LazyLock;
use std::time::Duration;
use serde::Serialize;
use serde_json::Value;

static HTTP_CLIENT: LazyLock<reqwest::Client> = LazyLock::new(|| {
    reqwest::Client::builder()
        .timeout(Duration::from_secs(15))
        .user_agent("runewise - osrs companion app")
        .build()
        .expect("failed to build HTTP client")
});

#[derive(Serialize)]
struct ProxyResponse {
    status: u16,
    body: String,
    headers: HashMap<String, String>,
}

#[derive(Serialize)]
struct RuneLiteStatus {
    found: bool,
    directory: Option<String>,
    checked_paths: Vec<String>,
}

#[derive(Serialize)]
struct RuneLiteProfile {
    id: String,
    display_name: String,
}

#[derive(Serialize)]
struct LootDrop {
    id: i64,
    name: String,
    quantity: i64,
    price: i64,
}

#[derive(Serialize)]
struct LootEntry {
    r#type: String,
    name: String,
    kills: i64,
    drops: Vec<LootDrop>,
}

const ALLOWED_HOSTS: &[&str] = &[
    "secure.runescape.com",
    "prices.runescape.wiki",
    "oldschool.runescape.wiki",
    "api.wiseoldman.net",
    "public.starminers.site",
    "templeosrs.com",
    "maps.runescape.wiki",
];

fn runelite_paths() -> Result<(Option<String>, Vec<String>), String> {
    let home = std::env::var("HOME").map_err(|e| e.to_string())?;
    let checked_paths = vec![
        format!("{home}/.runelite/profiles2/profiles.json"),
        format!("{home}/.runelite/profiles/profiles.json"),
    ];

    for path in &checked_paths {
        if std::path::Path::new(path).exists() {
            return Ok((Some(path.clone()), checked_paths));
        }
    }

    Ok((None, checked_paths))
}

fn safe_display_name(raw: Option<&str>, index: usize) -> String {
    match raw {
        Some(value) if !value.contains('@') => value.to_string(),
        _ => format!("Profile {}", index + 1),
    }
}

fn parse_stat_line(contents: &str, label: &str) -> Option<i64> {
    contents.lines().find_map(|line| {
        line.strip_suffix(label)
            .map(str::trim)
            .and_then(|value| value.parse::<i64>().ok())
    })
}

#[tauri::command]
async fn proxy_fetch(
    url: String,
    headers: Option<HashMap<String, String>>,
) -> Result<ProxyResponse, String> {
    let parsed = url::Url::parse(&url).map_err(|e| e.to_string())?;
    if parsed.scheme() != "https" {
        return Err("Only HTTPS requests are allowed".to_string());
    }
    let host = parsed.host_str().unwrap_or("");
    if !ALLOWED_HOSTS.iter().any(|&h| host == h) {
        return Err(format!("Blocked request to unauthorized host: {}", host));
    }

    let mut req = HTTP_CLIENT.get(&url);

    if let Some(hdrs) = headers {
        for (key, value) in hdrs {
            req = req.header(&key, &value);
        }
    }

    let response = req.send().await.map_err(|e| e.to_string())?;
    let status = response.status().as_u16();

    let resp_headers: HashMap<String, String> = response
        .headers()
        .iter()
        .filter_map(|(k, v)| v.to_str().ok().map(|val| (k.to_string(), val.to_string())))
        .collect();

    let body = response.text().await.map_err(|e| e.to_string())?;

    Ok(ProxyResponse {
        status,
        body,
        headers: resp_headers,
    })
}

#[tauri::command]
fn runelite_status() -> Result<RuneLiteStatus, String> {
    let (profiles_file, checked_paths) = runelite_paths()?;
    let directory = profiles_file
        .as_ref()
        .and_then(|path| path.rsplit_once('/').map(|(dir, _)| dir.to_string()));

    Ok(RuneLiteStatus {
        found: profiles_file.is_some(),
        directory,
        checked_paths,
    })
}

#[tauri::command]
fn runelite_read_profiles() -> Result<Vec<RuneLiteProfile>, String> {
    let (profiles_file, _) = runelite_paths()?;
    let Some(path) = profiles_file else {
        return Ok(Vec::new());
    };

    let raw = fs::read_to_string(path).map_err(|e| e.to_string())?;
    let json: Value = serde_json::from_str(&raw).map_err(|e| e.to_string())?;

    let entries = match json {
        Value::Array(entries) => entries,
        Value::Object(map) => map
            .get("profiles")
            .and_then(|value| value.as_array())
            .cloned()
            .unwrap_or_default(),
        _ => Vec::new(),
    };

    Ok(entries
        .iter()
        .enumerate()
        .map(|(index, entry)| RuneLiteProfile {
            id: entry
                .get("id")
                .and_then(|value| value.as_str())
                .map(ToString::to_string)
                .unwrap_or_else(|| index.to_string()),
            display_name: safe_display_name(
                entry.get("name").and_then(|value| value.as_str()),
                index,
            ),
        })
        .collect())
}

#[tauri::command]
fn runelite_read_loot_tracker(profile_id: String) -> Result<Vec<LootEntry>, String> {
    if profile_id.contains("..") || profile_id.contains('/') || profile_id.contains('\\') {
        return Err("Invalid profile ID".to_string());
    }
    let (profiles_file, _) = runelite_paths()?;
    let Some(path) = profiles_file else {
        return Ok(Vec::new());
    };

    let root = path
        .rsplit_once('/')
        .map(|(dir, _)| dir.to_string())
        .ok_or_else(|| "Invalid RuneLite profile path".to_string())?;
    let loot_path = format!("{root}/{profile_id}/loot-tracker.log");
    let raw = match fs::read_to_string(&loot_path) {
        Ok(contents) => contents,
        Err(_) => {
            let home = std::env::var("HOME").map_err(|e| e.to_string())?;
            let bossing_root = format!("{home}/.runelite/bossing-info");
            let bossing_path = Path::new(&bossing_root);
            if !bossing_path.exists() {
                return Ok(Vec::new());
            }

            let mut entries = Vec::new();
            for character_dir in fs::read_dir(bossing_path).map_err(|e| e.to_string())? {
                let character_dir = character_dir.map_err(|e| e.to_string())?;
                if !character_dir.path().is_dir() {
                    continue;
                }

                let loot_dir = character_dir.path().join("boss-loot");
                if !loot_dir.exists() {
                    continue;
                }

                for file in fs::read_dir(&loot_dir).map_err(|e| e.to_string())? {
                    let file = file.map_err(|e| e.to_string())?;
                    let path = file.path();
                    let Some(name) = path.file_name().and_then(|value| value.to_str()) else {
                        continue;
                    };
                    if !name.ends_with(".json") || name.ends_with("-ignored.json") {
                        continue;
                    }

                    let boss_name = name.trim_end_matches(".json").to_string();
                    let loot_raw = fs::read_to_string(&path).map_err(|e| e.to_string())?;
                    let loot_json: Value =
                        serde_json::from_str(&loot_raw).map_err(|e| e.to_string())?;
                    let stats_path = character_dir.path().join(format!("{boss_name}.txt"));
                    let stats_raw = fs::read_to_string(stats_path).unwrap_or_default();
                    let kills = parse_stat_line(&stats_raw, "Total Kc")
                        .or_else(|| parse_stat_line(&stats_raw, "Loot Kills Tracked"))
                        .unwrap_or(0);

                    let drops = loot_json
                        .as_object()
                        .map(|items| {
                            items
                                .iter()
                                .filter_map(|(item_id, quantity)| {
                                    let id = item_id.parse::<i64>().ok()?;
                                    let qty = quantity.as_i64().unwrap_or(0);
                                    Some(LootDrop {
                                        id,
                                        name: format!("Item {id}"),
                                        quantity: qty,
                                        price: 0,
                                    })
                                })
                                .collect()
                        })
                        .unwrap_or_default();

                    entries.push(LootEntry {
                        r#type: "BOSSING_INFO".to_string(),
                        name: boss_name,
                        kills,
                        drops,
                    });
                }
            }

            return Ok(entries);
        }
    };

    let mut entries = Vec::new();
    for line in raw.lines() {
        if line.trim().is_empty() {
            continue;
        }

        let Ok(entry) = serde_json::from_str::<Value>(line) else {
            continue;
        };

        let drops = entry
            .get("drops")
            .and_then(|value| value.as_array())
            .map(|items| {
                items
                    .iter()
                    .map(|drop| LootDrop {
                        id: drop.get("id").and_then(|value| value.as_i64()).unwrap_or(0),
                        name: drop
                            .get("name")
                            .and_then(|value| value.as_str())
                            .unwrap_or("Unknown")
                            .to_string(),
                        quantity: drop
                            .get("qty")
                            .and_then(|value| value.as_i64())
                            .or_else(|| drop.get("quantity").and_then(|value| value.as_i64()))
                            .unwrap_or(1),
                        price: drop.get("price").and_then(|value| value.as_i64()).unwrap_or(0),
                    })
                    .collect()
            })
            .unwrap_or_default();

        entries.push(LootEntry {
            r#type: entry
                .get("type")
                .and_then(|value| value.as_str())
                .unwrap_or("NPC")
                .to_string(),
            name: entry
                .get("name")
                .and_then(|value| value.as_str())
                .unwrap_or("Unknown")
                .to_string(),
            kills: entry.get("kills").and_then(|value| value.as_i64()).unwrap_or(1),
            drops,
        });
    }

    Ok(entries)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            proxy_fetch,
            runelite_status,
            runelite_read_profiles,
            runelite_read_loot_tracker
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
