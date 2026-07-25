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

Until signing is wired, document the More info → Run anyway path in README and release notes.

## Related

- Auto-update: `@tauri-apps/plugin-updater` (see `src-tauri/tauri.conf.json`)
- CI: `.github/workflows/`
