use std::collections::HashMap;
use std::fs;
use std::path::Path;
use std::sync::{LazyLock, Mutex};
use std::time::Duration;
use serde::Serialize;
use serde_json::Value;

/// Rust-side mirror of the frontend `closeToTray` setting. We keep it in app
/// state so the `CloseRequested` handler can decide synchronously whether to
/// hide or exit — no event roundtrip, no race window for the frontend listener
/// to attach, no lost signals on fast quits.
struct AppState {
    close_to_tray: Mutex<bool>,
}

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
    "old.07.gg",
    "cdn.runescape.com",
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

#[tauri::command]
fn set_close_to_tray(state: tauri::State<'_, AppState>, enabled: bool) {
    if let Ok(mut guard) = state.close_to_tray.lock() {
        *guard = enabled;
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    use tauri::{include_image, Manager, WindowEvent};
    use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
    use tauri::menu::{Menu, MenuItem};

    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_fs::init())
        .manage(AppState { close_to_tray: Mutex::new(false) })
        .invoke_handler(tauri::generate_handler![
            proxy_fetch,
            runelite_status,
            runelite_read_profiles,
            runelite_read_loot_tracker,
            set_close_to_tray,
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Build system tray
            let show_item = MenuItem::with_id(app, "show", "Show RuneWise", true, None::<&str>)?;
            let star_item = MenuItem::with_id(app, "stars", "Star Radar", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_item, &star_item, &quit_item])?;

            // Monochrome template tray icon so macOS tints it like every other
            // native menu bar app (follows system appearance; white on dark
            // menu bar, black on light). include_image! decodes the PNG at
            // compile time via tauri-macros — no runtime feature flags needed.
            let tray_icon = include_image!("icons/tray-icon.png");

            // Standard macOS menu-bar UX: left click toggles the window,
            // right click shows the context menu. `show_menu_on_left_click(false)`
            // stops the menu from stealing the left click; Tauri still pops the
            // menu on secondary click because `.menu(&menu)` is attached.
            let mut tray_builder = TrayIconBuilder::new()
                .icon(tray_icon)
                .tooltip("RuneWise")
                .menu(&menu)
                .show_menu_on_left_click(false);
            #[cfg(target_os = "macos")]
            {
                tray_builder = tray_builder.icon_as_template(true);
            }
            let _tray = tray_builder
                .on_tray_icon_event(|tray, event| {
                    // Fire on mouse-up for the left button only — matches the
                    // timing users expect from AppKit menu bar items and avoids
                    // double-firing against the Down event.
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let visible = window.is_visible().unwrap_or(false);
                            let focused = window.is_focused().unwrap_or(false);
                            if visible && focused {
                                let _ = window.hide();
                            } else {
                                let _ = window.show();
                                let _ = window.unminimize();
                                let _ = window.set_focus();
                            }
                        }
                    }
                })
                .on_menu_event(|app, event| match event.id().as_ref() {
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "stars" => {
                        // Navigate main window to stars view via JS
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                            let _ = window.eval("window.location.hash = '#stars'");
                        }
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .build(app)?;

            Ok(())
        })
        .on_window_event(|window, event| {
            if window.label() != "main" {
                return;
            }
            if let WindowEvent::CloseRequested { api, .. } = event {
                // Decide synchronously from Rust state — the frontend keeps
                // this in sync via `set_close_to_tray` whenever the setting
                // toggles, so there's no listener race / dropped event path.
                let app = window.app_handle();
                let state = app.state::<AppState>();
                let close_to_tray = state
                    .close_to_tray
                    .lock()
                    .map(|g| *g)
                    .unwrap_or(false);
                if close_to_tray {
                    api.prevent_close();
                    let _ = window.hide();
                }
                // Else let the default close happen — on macOS that hides the
                // window but keeps the process alive via the tray, which is
                // fine; Cmd+Q or tray → Quit exits fully.
            }
        })
        .build(tauri::generate_context!())
        .expect("error while running tauri application")
        .run(|app_handle, event| {
            // macOS: when every window is hidden (close-to-tray path), clicking
            // the dock icon fires `applicationShouldHandleReopen:` with
            // `hasVisibleWindows == false`. Without this handler the click is
            // a no-op and the only way back in is the menu bar tray, which is
            // surprising for an app that still shows in the dock.
            #[cfg(target_os = "macos")]
            if let tauri::RunEvent::Reopen { has_visible_windows, .. } = event {
                if !has_visible_windows {
                    if let Some(window) = app_handle.get_webview_window("main") {
                        let _ = window.show();
                        let _ = window.unminimize();
                        let _ = window.set_focus();
                    }
                }
            }
            #[cfg(not(target_os = "macos"))]
            let _ = (app_handle, event);
        });
}
