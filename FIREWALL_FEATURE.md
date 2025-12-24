# Application Firewall Feature

## Overview

The Application Firewall feature allows you to selectively block specific desktop applications from accessing the internet (outbound traffic) while allowing others to connect normally. This works alongside the existing system-wide proxy features.

## Features Implemented

### 1. UI Components
- ✅ New "Firewall" tab in sidebar navigation
- ✅ Firewall rules table with columns: App Name, Executable Path, Status, Actions
- ✅ Status indicator showing active/inactive and count of blocked apps
- ✅ "Add Rule" button with modal dialog
- ✅ File picker for selecting application executables
- ✅ Edit, Delete, and Toggle actions for each rule

### 2. Rule Management
- ✅ Persistent storage using electron-store (`firewallRules` key)
- ✅ Rule structure: `{ id, name, path, blocked, logAttempts, enabled, createdAt, updatedAt }`
- ✅ Enable/disable toggle per rule
- ✅ Delete rules (removes from OS and storage)
- ✅ Auto-apply rules on app startup

### 3. Platform-Specific Implementation

#### Windows (Full Implementation)
- ✅ Uses `netsh advfirewall` commands
- ✅ Creates outbound block rules per application
- ✅ Full per-app blocking support
- ✅ Automatic rule removal on delete

**Command Format:**
```cmd
netsh advfirewall firewall add rule name="ZayProxy Block - AppName" dir=out action=block program="C:\Path\To\App.exe" enable=yes
```

#### macOS (Basic Implementation with Warnings)
- ⚠️ Creates pf anchor files for firewall rules
- ⚠️ Requires manual sudo command to apply (due to macOS security restrictions)
- ⚠️ Shows clear warnings about limitations
- ✅ Anchor files stored in `~/.zayproxy/firewall/`
- ✅ Provides instructions for manual application

**Note:** macOS per-app blocking is complex and requires root access. The app creates the necessary configuration files but cannot automatically apply them without administrator privileges. Users are provided with clear instructions.

**Alternative:** For full per-app blocking on macOS, consider using third-party tools like:
- Little Snitch
- Lulu
- Radio Silence

### 4. Apply/Refresh Functionality
- ✅ "Apply Firewall Rules" button
- ✅ Processes all active rules
- ✅ Shows success/error feedback
- ✅ Automatic application on startup
- ✅ Status indicators

### 5. Logging Integration
- ✅ Logs when rules are added/updated/deleted
- ✅ Logs when rules are applied
- ✅ Logs errors with details
- ✅ All firewall events appear in Logs tab

### 6. Tray Menu Integration
- ✅ Firewall submenu in system tray
- ✅ "Enable All Blocks" option
- ✅ "Disable All Blocks" option
- ✅ List of all rules with checkboxes for quick toggle

### 7. Security & UX
- ✅ Warning dialog before applying rules
- ✅ Confirmation dialogs for destructive actions
- ✅ Clear error messages
- ✅ Permission error handling
- ✅ Graceful fallbacks

### 8. Cleanup
- ✅ Removes firewall rules from OS on delete
- ✅ Optional cleanup on app quit (commented out by default)
- ✅ Handles errors gracefully

## File Structure

### New Files
- `modules/firewallManager.js` - Core firewall logic and platform-specific implementations

### Modified Files
- `main.js` - Added FirewallManager initialization, IPC handlers, tray menu integration
- `renderer.js` - Added firewall UI functions and event handlers
- `preload.js` - Added firewall API methods
- `index.html` - Added Firewall tab and modal
- `styles.css` - Added firewall-specific styles
- `package.json` - Removed uuid dependency (using built-in crypto)

## Usage

### Adding a Firewall Rule

1. Click on the "Firewall" tab in the sidebar
2. Click "+ Add Rule"
3. Click "Browse..." to select an application executable
4. The app name will be auto-detected from the file
5. Configure options:
   - Block all outbound internet access (checked by default)
   - Log blocked connection attempts (optional)
   - Enable this rule (checked by default)
6. Click "Save"

### Applying Rules

1. After adding rules, click "Apply Firewall Rules"
2. Confirm the action
3. The app will attempt to apply all active rules
4. On Windows: Rules are applied immediately (requires admin)
5. On macOS: You'll receive instructions to apply manually

### Managing Rules

- **Edit**: Click "Edit" to modify a rule
- **Toggle**: Click "Enable/Disable" to toggle a rule without deleting
- **Delete**: Click "Delete" to remove a rule (also removes from OS firewall)

## Platform-Specific Notes

### Windows
- **Full Support**: Per-app blocking works completely
- **Requirements**: Administrator privileges required
- **How it works**: Uses Windows Advanced Firewall (netsh advfirewall)
- **Rule naming**: `ZayProxy Block - [AppName]`

### macOS
- **Limited Support**: Creates configuration files but requires manual application
- **Requirements**: Root access (sudo) to apply rules
- **How it works**: Creates pf (packet filter) anchor files
- **Location**: `~/.zayproxy/firewall/`
- **Manual Application**: Users must run provided sudo commands

**macOS Instructions:**
After creating a rule, you'll see instructions like:
```
To apply this rule, run in Terminal:
sudo pfctl -a zayproxy/[anchor_name] -f [anchor_file]
```

## Security Considerations

1. **Administrator Privileges**: Required on both platforms
2. **System Modification**: This feature modifies system firewall settings
3. **User Responsibility**: Users should understand what applications they're blocking
4. **macOS Limitations**: Manual intervention required due to macOS security model

## Troubleshooting

### Windows: "Access Denied" Error
- Ensure the app is running with administrator privileges
- Right-click the app → "Run as administrator"

### macOS: Rules Not Applied
- Check if you've run the provided sudo command
- Verify the anchor file exists in `~/.zayproxy/firewall/`
- Consider using a third-party firewall tool for easier management

### Rules Not Working
- Verify the executable path is correct
- Check if the application is running
- Review logs for error messages
- On Windows, check Windows Firewall rules manually

## Future Enhancements

Potential improvements:
- Automatic sudo prompt handling for macOS
- Integration with macOS System Preferences
- Real-time connection attempt monitoring
- Per-rule statistics (blocked attempts count)
- Import/export firewall rules
- Rule templates for common applications

## Code References

- **Firewall Manager**: `modules/firewallManager.js`
- **IPC Handlers**: `main.js` (lines ~914-1015)
- **UI Functions**: `renderer.js` (firewall functions)
- **HTML Structure**: `index.html` (firewall section and modal)
- **Styles**: `styles.css` (firewall-specific styles)

