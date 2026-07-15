# Void Notes - .exe Build Guide

## Quick Build (one command)

```bash
npm run dist:win
```

Produces: `release/Void Notes Setup 0.3.0.exe` (~88 MB, NSIS installer)

---

## What `dist:win` does

### Phase 1: `npm run build` (TypeScript + Vite)

```
tsc                    -> type-check all TS files
vite build             -> bundle React renderer -> dist/
tsc -p tsconfig.electron.json  -> compile Electron main/preload -> dist-electron/
```

### Phase 2: `npx electron-builder --win --publish never`

1. Packages `dist/` + `dist-electron/` + Electron runtime into `release/win-unpacked/`
2. Compresses into `.nsis.7z`
3. Runs `makensis.exe` to produce NSIS installer
4. Output: `release/Void Notes Setup 0.3.0.exe`

---

## The 7za Wrapper Fix (CRITICAL)

### Problem

`winCodeSign-2.6.0.7z` (cached by electron-builder) contains macOS `.dylib` symlinks. The system `7za.exe` passes `-snld` (store NTFS symlinks as links), which requires admin privileges on Windows. `7za.exe` silently fails during extraction -> `electron-builder` gets incomplete files -> NSIS produces a ~1 MB installer instead of ~88 MB.

### Fix: C wrapper around `7za.exe`

`scripts/7za-wrapper.c`:
- Strips `-snld` from arguments
- Returns exit code 0 for symlink errors (exit code 2)
- Passes all other args through to `7za-real.exe`

### One-time setup (after `npm install`)

```bash
cd node_modules/7zip-bin/win/x64

# Rename original 7za to 7za-real (only if not already done)
if exist 7za.exe if not exist 7za-real.exe mv 7za.exe 7za-real.exe

# Compile wrapper
gcc -o 7za.exe ../../../../scripts/7za-wrapper.c -mwindows -static -O2
```

### Requirements for build machine

- **MinGW GCC** (`gcc` must be in PATH)
- **PowerShell or cmd** (admin NOT required)
- Electron 35, electron-builder 25

### File layout after fix

```
node_modules/7zip-bin/win/x64/
  7za-real.exe   <- original 7zip (1.2 MB)
  7za.exe        <- C wrapper (176 KB compiled)
```

---

## electron-builder Config (`package.json`)

```json
"build": {
  "appId": "com.pixelcodegh.VoidNotes",
  "productName": "Void Notes",
  "directories": { "output": "release" },
  "win": {
    "target": [{ "target": "nsis", "arch": ["x64"] }],
    "requestedExecutionLevel": "asInvoker"
  },
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true,
    "createDesktopShortcut": true,
    "createStartMenuShortcut": true,
    "shortcutName": "Void Notes"
  }
}
```

Key points:
- `requestedExecutionLevel: "asInvoker"` -- no admin required
- `oneClick: false` -- shows install wizard
- No `files` array -- electron-builder auto-picks `dist/`, `dist-electron/`, `node_modules/electron/dist/`

---

## Common Issues

### "Cannot create symbolic link" / "A required privilege is not held by the client"
Apply 7za-wrapper fix (see above)

### Installer is ~1 MB instead of ~88 MB
7za-wrapper is not applied or failed to compile. Verify:
```bash
dir node_modules\7zip-bin\win\x64\7za*
```
Should show both `7za.exe` (~176 KB) and `7za-real.exe` (~1.2 MB).

### "Void Notes.exe" process locking
Before build:
```bash
taskkill /F /IM "Void Notes.exe"
rm -rf release
```

### Build cache issues
Clear electron-builder cache:
```bash
rm -rf %USERPROFILE%\.electron-builder\Cache
```

---

## CI (GitHub Actions)

Not needed -- `winCodeSign` extraction works on GitHub runners because they have admin privileges. The `7za-wrapper` fix is only for local Windows dev machines without admin.

---

## GitHub Release

```bash
# Tag and push
git tag v0.3.0 -f
git push origin v0.3.0 -f

# Build installer
npm run dist:win

# Generate latest.yml for auto-update
node scripts/gen-latest-yml.cjs

# Upload both files
gh release upload v0.3.0 "release/Void Notes Setup 0.3.0.exe" "release/latest.yml"
```

---

## Auto-Update (electron-updater)

Void Notes uses `electron-updater` with the GitHub provider for automatic updates.

### How it works

1. On app launch, `electron/updater.ts` checks for new releases via GitHub API
2. If a newer version is found, the update dialog appears (unless auto-update is enabled in Settings)
3. User clicks "Update" or "Restart to Install" after download
4. The new NSIS installer replaces the app and relaunches

### Release checklist

1. Bump version in `package.json`, `src/plugins/updater.ts`
2. Build: `npm run dist:win`
3. Generate manifest: `node scripts/gen-latest-yml.cjs`
4. Tag and push: `git tag vX.Y.Z && git push origin vX.Y.Z`
5. Create GitHub release with the `.exe` attached
6. Upload both files:
   ```bash
   gh release upload vX.Y.Z "release/Void Notes Setup X.Y.Z.exe" "release/latest.yml"
   ```

### latest.yml format

```yaml
version: 0.3.0
files:
  - url: Void Notes Setup 0.3.0.exe
    sha512: <base64-sha512>
    size: <bytes>
path: Void Notes Setup 0.3.0.exe
sha512: <base64-sha512>
releaseDate: 2026-07-13T...
```

### Verification

After building and generating latest.yml:
```bash
dir release\latest.yml
dir "release\Void Notes Setup 0.3.0.exe"
```
Both must exist. The `.exe` should be >80 MB, latest.yml must contain a valid SHA512 hash.
