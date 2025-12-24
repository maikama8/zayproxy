# Error Logging Configuration

## Overview

Comprehensive error logging has been enabled throughout the Proxy Manager application. All errors, warnings, and debug information are now logged to both the console and log files.

## Log File Locations

### macOS
- **Main log file**: `~/Library/Logs/proxy-manager/main.log`
- **Renderer log file**: `~/Library/Logs/proxy-manager/renderer.log`
- **User data directory**: `~/Library/Application Support/proxy-manager/`

### Windows
- **Main log file**: `%APPDATA%\proxy-manager\logs\main.log`
- **Renderer log file**: `%APPDATA%\proxy-manager\logs\renderer.log`
- **User data directory**: `%APPDATA%\proxy-manager\`

## Logging Levels

The application uses multiple logging levels:

1. **silly** - Most verbose, logs everything (file only)
2. **debug** - Debug information for troubleshooting
3. **info** - General informational messages
4. **warn** - Warning messages
5. **error** - Error messages
6. **verbose** - Verbose logging

## Features Enabled

### 1. Global Error Handlers

- **Uncaught Exceptions**: All uncaught exceptions are logged with full stack traces
- **Unhandled Promise Rejections**: Promise rejections are caught and logged
- **Renderer Process Crashes**: Renderer crashes are detected and logged
- **Window Load Failures**: Failed page loads are logged with error codes

### 2. Detailed Function Logging

All major functions now log:
- **Start/end of operations**: Track when functions begin and complete
- **Parameters**: Log important parameters (with sensitive data redacted)
- **Success/failure**: Log operation outcomes
- **Error details**: Full error messages and stack traces

### 3. Proxy Operations Logging

- Proxy enable/disable attempts
- System command execution (macOS/Windows)
- Command success/failure
- Network interface detection
- Profile switching

### 4. IPC Communication Logging

- All IPC handlers log their operations
- Test proxy operations with detailed results
- Import/export operations
- Settings updates

### 5. Renderer Process Logging

- Console errors and warnings
- Unhandled promise rejections in renderer
- Data loading operations
- UI update operations

## Log File Configuration

- **Max file size**: 10MB per log file
- **Log format**: `[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}`
- **Rotation**: Automatic log rotation when max size reached

## Viewing Logs

### Option 1: View Log File Directly

```bash
# macOS
tail -f ~/Library/Logs/proxy-manager/main.log

# Windows (PowerShell)
Get-Content $env:APPDATA\proxy-manager\logs\main.log -Tail 50 -Wait
```

### Option 2: Use Application Logs Tab

1. Open the Proxy Manager application
2. Navigate to the "Logs" tab
3. View real-time logs in the UI
4. Export logs using the "Export" button

### Option 3: Check Console Output

When running in development mode (`npm run dev`), logs also appear in the terminal/console.

## Log Messages by Category

### Startup/Shutdown
- App initialization
- Window creation
- Tray creation
- App quit

### Proxy Operations
- Enable/disable proxy
- Profile switching
- System proxy configuration
- Command execution results

### Network Operations
- Proxy testing
- Connection attempts
- HTTP requests
- Response handling

### User Actions
- Profile creation/update/delete
- Rule creation/update/delete
- Settings changes
- Import/export operations

## Troubleshooting with Logs

### If Proxy Won't Enable

1. Check logs for permission errors
2. Look for network interface detection issues
3. Verify command execution errors
4. Check for platform-specific issues

### If App Crashes

1. Check `main.log` for uncaught exceptions
2. Check `renderer.log` for renderer crashes
3. Look for stack traces in error messages
4. Check for missing dependencies

### If Commands Fail

1. Look for command execution errors
2. Check for timeout errors
3. Verify command syntax in logs
4. Check for permission issues

## Example Log Entries

```
[2024-01-15 10:30:45.123] [INFO] === Proxy Manager Starting ===
[2024-01-15 10:30:45.124] [INFO] Platform: darwin
[2024-01-15 10:30:45.125] [INFO] Node version: 18.17.0
[2024-01-15 10:30:45.126] [INFO] Electron version: 28.0.0
[2024-01-15 10:30:45.200] [INFO] Creating main window...
[2024-01-15 10:30:45.350] [INFO] Window loaded successfully
[2024-01-15 10:30:46.100] [INFO] Attempting to enable proxy...
[2024-01-15 10:30:46.101] [DEBUG] Executing command 1/3: networksetup -setwebproxy "Wi-Fi" proxy.example.com 8080
[2024-01-15 10:30:46.250] [DEBUG] Command succeeded
[2024-01-15 10:30:46.251] [INFO] Proxy enabled: My Proxy (proxy.example.com:8080)
```

## Disabling Verbose Logging

To reduce log verbosity, edit `main.js` and change:

```javascript
log.transports.file.level = 'info'; // Instead of 'silly'
```

This will only log info, warn, and error messages.

## Security Note

- Passwords are NOT logged (redacted in all log messages)
- Sensitive data is excluded from logs
- Log files are stored locally and not transmitted

