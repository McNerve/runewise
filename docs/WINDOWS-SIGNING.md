# Windows installers: SmartScreen & code signing

RuneWise ships as a small Tauri `.exe` installer via GitHub Releases. On first run, **Windows SmartScreen** may show “Windows protected your PC” because the binary is not yet widely recognized.

## For players

1. Click **More info**
2. Click **Run anyway**
3. Prefer downloads only from the official [GitHub Releases](https://github.com/McNerve/runewise/releases) page

This is a reputation gate (new publisher / low download volume), not a malware detection of RuneWise itself.

## For maintainers

To reduce SmartScreen friction long-term:

1. **Code-sign** the installer and updater binaries with an Authenticode certificate (EV preferred for faster reputation).
2. Configure the Tauri / GitHub Actions release workflow to sign after build (certificate stored as repo secrets; never commit `.pfx` files).
3. Keep publisher name stable across releases so Windows reputation accumulates.
4. Optional: Microsoft Store distribution (different packaging, stronger trust path).

Until signing secrets are present, the release workflow skips Authenticode (unsigned builds still publish). Document the More info → Run anyway path in README and release notes.

## GitHub Actions secrets (repo or org)

Set these on the `McNerve/runewise` repository (Settings → Secrets and variables → Actions). All are optional until a cert is purchased.

| Secret | Purpose |
|--------|---------|
| `WINDOWS_CERTIFICATE` | Base64-encoded `.pfx` (or `.p12`) PKCS#12 bundle |
| `WINDOWS_CERTIFICATE_PASSWORD` | Password for the PFX |
| `WINDOWS_CERTIFICATE_SHA1` | Optional thumbprint if using a pre-installed store cert |
| `TAURI_SIGNING_PRIVATE_KEY` | Already used — minisign key for **updater** payloads (not Authenticode) |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Password for the minisign key |

### Encode a PFX for `WINDOWS_CERTIFICATE`

```powershell
# Windows PowerShell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\path\to\cert.pfx")) | Set-Clipboard
```

```bash
# macOS / Linux
base64 -i cert.pfx | pbcopy   # or xclip
```

Paste the single-line base64 into the secret. Never commit the PFX or password.

## How release.yml uses them

On the **Windows** matrix leg, after `tauri-action` builds:

1. If `WINDOWS_CERTIFICATE` is non-empty, the job decodes it to a temp PFX.
2. `signtool` (Windows SDK) signs `*.exe` / `*.msi` artifacts in the bundle output with `/fd SHA256` and dual timestamp (`digicert` / `sectigo` fallbacks).
3. If the secret is missing, the step is skipped and the job continues (unsigned).

Tauri updater signatures (`TAURI_SIGNING_*`) remain independent of Authenticode — both can be present.

## Local smoke test (optional)

With Windows SDK / VS Build Tools installed:

```powershell
signtool sign /f cert.pfx /p YOUR_PASSWORD /fd SHA256 /tr http://timestamp.digicert.com /td SHA256 path\to\RuneWise_*.exe
signtool verify /pa path\to\RuneWise_*.exe
```

## Certificate options

| Type | Notes |
|------|--------|
| **EV code signing** | Hardware token / cloud HSM often required; best SmartScreen reputation |
| **OV / standard** | Cheaper; reputation builds with download volume over time |
| **Azure Trusted Signing** | Cloud-based; good fit for CI without shipping a USB token |

## Related

- Auto-update: `@tauri-apps/plugin-updater` (see `src-tauri/tauri.conf.json`)
- CI: `.github/workflows/release.yml`
- Product backlog: `docs/NEXT.md`
