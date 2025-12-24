# Quick Start Guide

## First Time Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run the Application**
   ```bash
   npm start
   ```

## Quick Steps

### 1. Add Your First Proxy Profile

1. Click on "Profiles" in the sidebar
2. Click "+ Add Profile"
3. Fill in:
   - Name: `My Proxy`
   - Type: `HTTP` (or your proxy type)
   - Host: `your-proxy-server.com`
   - Port: `8080` (or your port)
   - Username/Password: If required
4. Click "Test Proxy" to verify it works
5. Click "Save"

### 2. Enable the Proxy

1. Select your profile from the dropdown at the top
2. Click "Enable" button
3. The proxy is now active system-wide

### 3. Create URL Rules (Optional)

1. Go to "Rules" tab
2. Click "+ Add Rule"
3. Enter a pattern like `*.example.com`
4. Select which proxy profile to use
5. Save

### 4. View Logs

- Go to "Logs" tab to see connection activity
- Export logs if needed for troubleshooting

## Building for Distribution

### macOS
```bash
npm run build:mac
```
Output: `dist/Proxy Manager-1.0.0.dmg`

### Windows
```bash
npm run build:win
```
Output: `dist/Proxy Manager Setup 1.0.0.exe`

## Important Notes

- **Admin Rights Required**: The app needs administrator privileges to change system proxy settings
- **Network Interface**: On macOS, it auto-detects your active network (Wi-Fi/Ethernet)
- **Icons**: Add custom icons to `assets/` folder:
  - `icon.png` - Main app icon (128x128 or larger)
  - `tray-icon.png` - macOS tray icon (22x22 or similar)
  - `tray-icon.ico` - Windows tray icon

## Troubleshooting

**App won't apply proxy:**
- Ensure you're running with admin rights
- Check if another app is managing system proxy
- Verify proxy server details are correct

**Tray icon not showing:**
- Add tray icons to `assets/` folder (see above)
- App will still work without custom icons

**Build errors:**
- Make sure all dependencies installed: `npm install`
- Check Node.js version (16+ recommended)

