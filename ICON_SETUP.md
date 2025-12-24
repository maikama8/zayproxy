# App Name and Icon Configuration Guide

## App Name

The app name is configured in **`package.json`**:

### 1. Display Name (shown to users)
```json
"build": {
  "productName": "Proxy Manager",  // ← Change this to your desired app name
  ...
}
```

### 2. Internal Name
```json
"name": "proxy-manager",  // ← Internal package name
```

### 3. Bundle Identifier (macOS/Windows)
```json
"build": {
  "appId": "com.proxymanager.app",  // ← Change to your domain (e.g., "com.yourcompany.proxymanager")
  ...
}
```

## App Icon

### Icon Files Location
Place your icon files in the **`assets/`** folder:

```
assets/
  ├── icon.png          (Main app icon - 512x512 or larger recommended)
  ├── icon.icns         (macOS icon - required for .dmg builds)
  ├── icon.ico          (Windows icon - required for .exe builds)
  ├── tray-icon.png     (macOS tray icon - 22x22 or 32x32)
  └── tray-icon.ico     (Windows tray icon)
```

### Icon Requirements

**macOS:**
- Main icon: `icon.icns` (or `icon.png` will be converted)
- Size: 512x512 minimum, 1024x1024 recommended
- Format: .icns (Icon Composer format) or .png

**Windows:**
- Main icon: `icon.ico`
- Size: 256x256 minimum
- Format: .ico (multi-resolution)

**Tray Icons:**
- macOS: `tray-icon.png` (22x22 or 32x32)
- Windows: `tray-icon.ico` (16x16 or 32x32)

### Update package.json for Build

Add icon configuration to the `build` section in `package.json`:

```json
"build": {
  "appId": "com.proxymanager.app",
  "productName": "Proxy Manager",
  "icon": "assets/icon.png",  // ← Add this line
  "mac": {
    "icon": "assets/icon.icns",  // ← macOS specific icon
    ...
  },
  "win": {
    "icon": "assets/icon.ico",  // ← Windows specific icon
    ...
  },
  ...
}
```

### Current Icon References

**In main.js (line 76):**
```javascript
const iconPath = path.join(__dirname, 'assets', 'icon.png');
```

**In main.js (line 178-180):**
```javascript
let iconPath = process.platform === 'win32'
  ? path.join(__dirname, 'assets', 'tray-icon.ico')
  : path.join(__dirname, 'assets', 'tray-icon.png');
```

## Quick Setup Steps

1. **Create/Get Your Icons:**
   - Create or download icon files
   - Recommended sizes:
     - Main icon: 1024x1024 PNG
     - macOS: Convert to .icns
     - Windows: Convert to .ico

2. **Place Icons:**
   ```bash
   # Place your icons in the assets folder
   assets/icon.png
   assets/icon.icns  (for macOS)
   assets/icon.ico    (for Windows)
   assets/tray-icon.png
   assets/tray-icon.ico
   ```

3. **Update package.json:**
   - Change `productName` to your desired app name
   - Add `icon` path in build configuration
   - Update `appId` if needed

4. **Rebuild:**
   ```bash
   npm run build:mac    # For macOS
   npm run build:win    # For Windows
   ```

## Icon Conversion Tools

**macOS:**
- Use `iconutil` (built-in):
  ```bash
  mkdir icon.iconset
  # Add icon files at different sizes
  iconutil -c icns icon.iconset
  ```

**Windows:**
- Use online converters or tools like:
  - IcoFX
  - GIMP (with ICO plugin)
  - Online: convertio.co, cloudconvert.com

**Online Icon Generators:**
- https://www.electron.build/icons
- https://www.icoconverter.com/

