# Proxy Manager

A cross-platform desktop application built with Electron.js for managing system-wide proxy connections. Similar to FoxyProxy but as a standalone desktop app for macOS and Windows.

## Features

- **Proxy Profile Management**: Add, edit, delete, and manage multiple proxy profiles supporting HTTP, HTTPS, SOCKS4, SOCKS5, and PAC (Proxy Auto-Config) scripts
- **Quick Switcher**: Instantly switch between proxy profiles with a dropdown selector
- **URL Pattern Rules**: Define wildcard or regex-based patterns to route specific domains/URLs through particular proxies
- **Real-time Logging**: View connection logs, errors, and traffic summaries with export functionality
- **System Tray Integration**: Minimize to tray on Windows/macOS with quick actions
- **Auto-proxy Mode**: Automatically detect and switch proxies based on network changes (configurable)
- **Settings Management**: Auto-start on boot, theme selection (light/dark), import/export configurations
- **Proxy Testing**: Test proxy connections before applying them
- **Secure Storage**: Credentials stored securely using electron-store

## Prerequisites

- Node.js (v16 or higher recommended)
- npm or yarn package manager

## Installation

1. Clone or download this repository
2. Navigate to the project directory:
   ```bash
   cd Proxyapp
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

## Running the Application

### Development Mode

To run the application in development mode:

```bash
npm start
```

Or with developer tools enabled:

```bash
npm run dev
```

### Production Build

To build distributable packages:

**For macOS:**
```bash
npm run build:mac
```

**For Windows:**
```bash
npm run build:win
```

**For both platforms:**
```bash
npm run build:all
```

Built packages will be in the `dist/` directory:
- macOS: `.dmg` file
- Windows: `.exe` installer

## Project Structure

```
Proxyapp/
├── main.js                 # Main Electron process
├── preload.js              # Preload script for secure IPC
├── index.html              # Main UI HTML
├── renderer.js             # Renderer process logic
├── styles.css              # Application styles
├── package.json            # Dependencies and build config
├── modules/
│   ├── proxyManager.js     # Proxy profile management
│   ├── rulesEngine.js      # URL pattern matching engine
│   └── logger.js           # Logging module
├── assets/                 # Icons and assets
└── dist/                   # Build output (generated)
```

## Usage

### Adding a Proxy Profile

1. Click on the "Profiles" tab in the sidebar
2. Click "+ Add Profile"
3. Fill in the proxy details:
   - **Name**: A friendly name for the profile
   - **Type**: HTTP, HTTPS, SOCKS4, SOCKS5, or PAC
   - **Host**: Proxy server address
   - **Port**: Proxy server port
   - **Username/Password**: Optional authentication
   - **Bypass List**: Comma-separated list of domains to bypass
   - **PAC URL**: For PAC type, provide the PAC script URL
4. Click "Test Proxy" to verify the connection
5. Click "Save" to add the profile

### Enabling/Disabling Proxy

1. Select a profile from the dropdown in the quick switcher
2. Click "Enable" to apply the proxy system-wide
3. Click "Disable" to turn off the proxy

### Creating URL Rules

1. Click on the "Rules" tab
2. Click "+ Add Rule"
3. Configure the rule:
   - **Rule Name**: Descriptive name
   - **URL Pattern**: Wildcard pattern (e.g., `*.example.com`) or regex
   - **Pattern Type**: Wildcard or Regex
   - **Proxy Profile**: Select which profile to use for matching URLs
   - **Priority**: Higher priority rules are evaluated first
4. Click "Save"

### Viewing Logs

- Go to the "Logs" tab to see real-time connection logs
- Use "Export" to save logs to a file
- Use "Clear" to clear the log view

### Settings

- **Auto-start on boot**: Launch the app when the system starts
- **Minimize to tray**: Keep the app running in the system tray
- **Auto-proxy mode**: Automatically switch proxies based on network
- **Theme**: Switch between light and dark themes
- **Import/Export**: Backup or restore your configuration

## System Requirements

### macOS
- macOS 10.13 (High Sierra) or later
- Administrator privileges required for system-wide proxy changes

### Windows
- Windows 10 or later
- Administrator privileges required for system-wide proxy changes

## Important Notes

1. **Administrator Rights**: The application requires administrator/sudo privileges to modify system proxy settings. On first run, you may be prompted for your password.

2. **Network Interface Detection**: On macOS, the app automatically detects your active network interface (Wi-Fi, Ethernet, etc.). If detection fails, it defaults to "Wi-Fi".

3. **Proxy Application**: 
   - On macOS: Uses `networksetup` commands to configure system proxies
   - On Windows: Uses `netsh winhttp` commands to configure system proxies

4. **Security**: 
   - Proxy credentials are stored in the application's secure store
   - Configuration files are stored locally in the app's data directory
   - Consider using password protection for sensitive configurations

## Troubleshooting

### Proxy Not Applying

- Ensure you have administrator privileges
- Check if another application is managing system proxy settings
- Verify the proxy server details are correct
- Use the "Test Proxy" button to verify connectivity

### Permission Errors

On macOS, you may need to grant Terminal/iTerm full disk access:
- System Preferences → Security & Privacy → Privacy → Full Disk Access

### Build Issues

If you encounter build errors:
- Ensure all dependencies are installed: `npm install`
- Check Node.js version compatibility
- For macOS builds, ensure you're on macOS (or use CI/CD)
- For Windows builds, ensure you're on Windows (or use CI/CD)

## Development

### Adding Features

The application is modular and easy to extend:
- `modules/proxyManager.js`: Proxy profile operations
- `modules/rulesEngine.js`: URL pattern matching logic
- `modules/logger.js`: Logging functionality
- `main.js`: Main process and IPC handlers
- `renderer.js`: UI logic and event handling

### Testing

Currently, proxy testing is done through the UI. Future enhancements could include:
- Automated test suite
- Unit tests for modules
- Integration tests for proxy application

## License

MIT License - feel free to use and modify as needed.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues, bugs, or feature requests, please open an issue on the repository.

## Acknowledgments

- Built with [Electron](https://www.electronjs.org/)
- Uses [electron-store](https://github.com/sindresorhus/electron-store) for configuration
- Uses [electron-log](https://github.com/megahertz/electron-log) for logging
- Proxy agent functionality via [proxy-agent](https://github.com/TooTallNate/proxy-agents)

