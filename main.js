const { app, BrowserWindow, ipcMain, Tray, Menu, dialog, shell, nativeTheme } = require('electron');
const path = require('path');
const { exec, execSync } = require('child_process');
const Store = require('electron-store');
const log = require('electron-log');
const ProxyManager = require('./modules/proxyManager');
const RulesEngine = require('./modules/rulesEngine');
const Logger = require('./modules/logger');
const FirewallManager = require('./modules/firewallManager');

// Configure logging - enable comprehensive error logging
log.transports.file.level = 'silly'; // Log everything to file
log.transports.console.level = 'debug';
log.transports.file.maxSize = 10 * 1024 * 1024; // 10MB max file size
log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}';

// Enable error logging to file
log.errorHandler.startCatching({
  showDialog: false, // Don't show error dialog, just log it
  onError: (error) => {
    log.error('Uncaught Exception:', error);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  log.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  log.error('Uncaught Exception:', error);
});

// Log app startup
log.info('=== ZayProxy Starting ===');
log.info('Platform:', process.platform);
log.info('Node version:', process.versions.node);
log.info('Electron version:', process.versions.electron);

// Initialize store
const store = new Store({
  name: 'proxy-config',
  defaults: {
    profiles: [],
    rules: [],
    firewallRules: [],
    settings: {
      theme: 'light',
      autoStart: false,
      passwordProtection: false,
      autoProxy: false,
      minimizeToTray: true
    },
    activeProfile: null,
    enabled: false
  }
});

let mainWindow;
let tray = null;
let proxyManager;
let rulesEngine;
let logger;
let isQuitting = false;

// Initialize managers
function initializeManagers() {
  proxyManager = new ProxyManager(store);
  rulesEngine = new RulesEngine(store);
  logger = new Logger();
  firewallManager = new FirewallManager(store, logger);
  
  // Apply firewall rules on startup if any are enabled
  const firewallRules = store.get('firewallRules', []);
  const activeRules = firewallRules.filter(r => r.enabled);
  if (activeRules.length > 0) {
    log.info(`Found ${activeRules.length} active firewall rule(s), applying on startup...`);
    firewallManager.applyAllRules().catch(err => {
      log.error('Error applying firewall rules on startup:', err);
    });
  }
}

// Create main window
function createWindow() {
  try {
    log.info('Creating main window...');
    const iconPath = path.join(__dirname, 'assets', 'icon.png');
    const fs = require('fs');
    const icon = fs.existsSync(iconPath) ? iconPath : undefined;

    mainWindow = new BrowserWindow({
      width: 1000,
      height: 700,
      minWidth: 800,
      minHeight: 600,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: false,
        contextIsolation: true
      },
      icon: icon,
      show: false
    });

    mainWindow.loadFile('index.html');
    log.info('Window loaded successfully');

    mainWindow.once('ready-to-show', () => {
      log.info('Window ready to show');
      mainWindow.show();
    });

    mainWindow.on('close', (event) => {
      if (!isQuitting && store.get('settings.minimizeToTray')) {
        event.preventDefault();
        mainWindow.hide();
        log.info('Window minimized to tray');
        return false;
      }
      log.info('Window closing');
    });

    // Handle renderer process errors
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      log.error('Window failed to load:', { errorCode, errorDescription, validatedURL });
    });

    mainWindow.webContents.on('crashed', (event, killed) => {
      log.error('Renderer process crashed:', { killed });
    });

    // Capture console messages from renderer
    mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
      const levelMap = { 0: 'debug', 1: 'info', 2: 'warn', 3: 'error' };
      const logLevel = levelMap[level] || 'info';
      log[logLevel](`[Renderer] ${message}`, { line, sourceId });
    });

    // Capture console.log/error from renderer
    mainWindow.webContents.on('did-finish-load', () => {
      log.info('Renderer finished loading');
      // Inject error handler into renderer
      mainWindow.webContents.executeJavaScript(`
        (function() {
          const originalError = console.error;
          const originalWarn = console.warn;
          const originalLog = console.log;
          
          console.error = function(...args) {
            originalError.apply(console, args);
            window.electronAPI?.logError?.(args.join(' '));
          };
          
          console.warn = function(...args) {
            originalWarn.apply(console, args);
            window.electronAPI?.logWarn?.(args.join(' '));
          };
          
          console.log = function(...args) {
            originalLog.apply(console, args);
            if (args[0] && typeof args[0] === 'string' && args[0].includes('error')) {
              window.electronAPI?.logError?.(args.join(' '));
            }
          };
          
          window.addEventListener('error', (e) => {
            window.electronAPI?.logError?.('Uncaught Error: ' + e.message + ' at ' + e.filename + ':' + e.lineno);
          });
          
          window.addEventListener('unhandledrejection', (e) => {
            window.electronAPI?.logError?.('Unhandled Rejection: ' + (e.reason?.message || e.reason));
          });
        })();
      `).catch(err => log.error('Failed to inject error handler:', err));
    });

    // Open DevTools only in dev mode
    if (process.argv.includes('--dev') || !app.isPackaged) {
      mainWindow.webContents.openDevTools();
      log.info('Developer tools opened (dev mode)');
    }
  } catch (error) {
    log.error('Error creating window:', error);
    dialog.showErrorBox('Window Creation Error', `Failed to create window: ${error.message}`);
  }
}

// Create system tray
function createTray() {
  const fs = require('fs');
  const { nativeImage } = require('electron');
  
  let iconPath;
  let icon;
  
  if (process.platform === 'win32') {
    iconPath = path.join(__dirname, 'assets', 'tray-icon.ico');
    if (!fs.existsSync(iconPath)) {
      iconPath = path.join(__dirname, 'assets', 'icon.ico');
    }
  } else {
    // macOS: prefer template icon, fallback to regular icon
    iconPath = path.join(__dirname, 'assets', 'tray-icon.png');
    if (!fs.existsSync(iconPath)) {
      iconPath = path.join(__dirname, 'assets', 'icon.png');
    }
  }

  // Try to create tray with icon
  try {
    if (fs.existsSync(iconPath)) {
      icon = nativeImage.createFromPath(iconPath);
      
      // On macOS, mark as template image for proper menu bar appearance
      // Template images are black/transparent and macOS colors them automatically
      if (process.platform === 'darwin' && icon) {
        icon.setTemplateImage(true);
      }
      
      tray = new Tray(icon);
      log.info(`Tray created with icon: ${iconPath}`);
    } else {
      // Create a simple default icon for macOS menu bar
      if (process.platform === 'darwin') {
        // Try to use the main app icon as fallback
        const fallbackPath = path.join(__dirname, 'assets', 'icon.png');
        if (fs.existsSync(fallbackPath)) {
          icon = nativeImage.createFromPath(fallbackPath);
          if (icon) {
            // Resize to appropriate menu bar size (22x22 for Retina = 44x44 pixels)
            icon = icon.resize({ width: 22, height: 22 });
            icon.setTemplateImage(true);
            tray = new Tray(icon);
            log.info('Tray created with resized app icon as template');
          }
        } else {
          // Last resort: create a minimal icon
          // Create a 22x22 black square (template icon)
          const size = 22;
          const iconBuffer = Buffer.alloc(size * size * 4); // RGBA
          for (let i = 0; i < size * size; i++) {
            iconBuffer[i * 4] = 0;     // R
            iconBuffer[i * 4 + 1] = 0; // G
            iconBuffer[i * 4 + 2] = 0; // B
            iconBuffer[i * 4 + 3] = 255; // A (opaque)
          }
          icon = nativeImage.createFromBuffer(iconBuffer, { width: size, height: size });
          icon.setTemplateImage(true);
          tray = new Tray(icon);
          log.info('Tray created with minimal default template icon');
        }
      } else {
        // Windows: try to use main icon
        const fallbackPath = path.join(__dirname, 'assets', 'icon.png');
        if (fs.existsSync(fallbackPath)) {
          tray = new Tray(fallbackPath);
          log.info(`Tray created with fallback icon: ${fallbackPath}`);
        }
      }
    }
  } catch (e) {
    log.error('Could not create system tray:', e);
    return;
  }

  if (!tray) {
    log.error('Tray creation failed - no icon available');
    return;
  }

  // Configure tray behavior
  if (process.platform === 'darwin') {
    tray.setIgnoreDoubleClickEvents(true);
  }

  updateTrayMenu();

  // macOS: left-click toggles window, right-click shows menu
  // Windows: left-click shows menu
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });

  tray.setToolTip('ZayProxy - Proxy Manager');
  log.info('System tray initialized and visible in menu bar');
}

// Update tray menu
function updateTrayMenu() {
  // Don't update if tray doesn't exist
  if (!tray) {
    return;
  }
  
  const activeProfile = store.get('activeProfile');
  const enabled = store.get('enabled');
  const profiles = store.get('profiles', []);

  const template = [
    {
      label: enabled ? 'Proxy: Enabled' : 'Proxy: Disabled',
      enabled: false
    },
    {
      label: activeProfile ? `Active: ${activeProfile.name}` : 'No Active Profile',
      enabled: false
    },
    { type: 'separator' },
    {
      label: 'Enable Proxy',
      type: 'checkbox',
      checked: enabled,
      click: () => {
        if (enabled) {
          disableProxy();
        } else {
          enableProxy();
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Switch Profile',
      submenu: profiles.map(profile => ({
        label: profile.name,
        type: 'radio',
        checked: activeProfile && activeProfile.id === profile.id,
        click: () => {
          switchProfile(profile.id);
        }
      }))
    },
    { type: 'separator' },
    {
      label: 'Firewall',
      submenu: [
        {
          label: 'Enable All Blocks',
          click: () => {
            firewallManager.enableAll();
            firewallManager.applyAllRules().catch(err => {
              log.error('Error applying firewall rules:', err);
            });
            updateTrayMenu();
          }
        },
        {
          label: 'Disable All Blocks',
          click: () => {
            firewallManager.disableAll();
            updateTrayMenu();
          }
        },
        { type: 'separator' },
        ...firewallManager.getRules().map(rule => ({
          label: `${rule.enabled ? '✓' : '○'} ${rule.name}`,
          type: 'checkbox',
          checked: rule.enabled,
          click: () => {
            firewallManager.toggleRule(rule.id);
            updateTrayMenu();
          }
        }))
      ]
    },
    { type: 'separator' },
    {
      label: 'Show Window',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ];

  tray.setContextMenu(Menu.buildFromTemplate(template));
}

// Get all network interface names (macOS)
function getAllNetworkInterfaces() {
  try {
    if (process.platform === 'darwin') {
      const result = execSync('networksetup -listallnetworkservices').toString();
      const lines = result.split('\n').filter(line => line.trim());
      const interfaces = [];
      // Skip the first line which is a header
      for (let i = 1; i < lines.length; i++) {
        const interfaceName = lines[i].trim();
        if (interfaceName && !interfaceName.includes('*')) {
          interfaces.push(interfaceName);
        }
      }
      // If no interfaces found, use common defaults
      if (interfaces.length === 0) {
        interfaces.push('Wi-Fi', 'Ethernet');
      }
      return interfaces;
    }
    return [];
  } catch (error) {
    log.error('Error getting network interfaces:', error);
    return ['Wi-Fi', 'Ethernet']; // Default fallback
  }
}

// Get network interface name (macOS) - for backward compatibility
function getNetworkInterface() {
  const interfaces = getAllNetworkInterfaces();
  return interfaces.length > 0 ? interfaces[0] : 'Wi-Fi';
}

// Apply system proxy (macOS) - to ALL network interfaces for system-wide effect
async function applySystemProxyMac(profile) {
  log.info('Applying macOS proxy system-wide...', { profile: profile.name, host: profile.host, port: profile.port });
  const interfaces = getAllNetworkInterfaces();
  
  if (interfaces.length === 0) {
    const error = new Error('Could not determine network interfaces');
    log.error(error.message);
    throw error;
  }

  log.info(`Applying proxy to ${interfaces.length} network interface(s): ${interfaces.join(', ')}`);

  return new Promise((resolve, reject) => {
    const commands = [];
    
    // Apply proxy to ALL network interfaces for system-wide effect
    interfaces.forEach(interfaceName => {
      if (profile.type === 'HTTP' || profile.type === 'HTTPS') {
        commands.push(
          `networksetup -setwebproxy "${interfaceName}" ${profile.host} ${profile.port}`,
          `networksetup -setsecurewebproxy "${interfaceName}" ${profile.host} ${profile.port}`
        );
        
        if (profile.username && profile.password) {
          commands.push(
            `networksetup -setwebproxystate "${interfaceName}" on authenticated ${profile.username} ${profile.password}`,
            `networksetup -setsecurewebproxystate "${interfaceName}" on authenticated ${profile.username} ${profile.password}`
          );
        } else {
          commands.push(
            `networksetup -setwebproxystate "${interfaceName}" on`,
            `networksetup -setsecurewebproxystate "${interfaceName}" on`
          );
        }

        // Set bypass list if provided
        if (profile.bypass && profile.bypass.length > 0) {
          const bypassString = profile.bypass.join(', ');
          commands.push(`networksetup -setproxybypassservers "${interfaceName}" "${bypassString}"`);
        }
      } else if (profile.type === 'SOCKS4' || profile.type === 'SOCKS5') {
        commands.push(`networksetup -setsocksfirewallproxy "${interfaceName}" ${profile.host} ${profile.port}`);
        
        if (profile.username && profile.password) {
          commands.push(`networksetup -setsocksfirewallproxystate "${interfaceName}" on authenticated ${profile.username} ${profile.password}`);
        } else {
          commands.push(`networksetup -setsocksfirewallproxystate "${interfaceName}" on`);
        }
      }
    });

    // Execute commands sequentially
    let currentIndex = 0;
    const errors = [];
    
    function executeNext() {
      if (currentIndex >= commands.length) {
        if (errors.length > 0) {
          log.warn(`Some proxy commands failed:`, errors);
          // Still resolve - some commands might have succeeded
        }
        log.info('All proxy commands executed');
        resolve();
        return;
      }

      const command = commands[currentIndex];
      log.debug(`Executing command ${currentIndex + 1}/${commands.length}: ${command}`);
      
      exec(command, { timeout: 5000 }, (error, stdout, stderr) => {
        if (error) {
          log.error(`Command failed: ${command}`, { error: error.message, stderr });
          errors.push({ command, error: error.message });
        } else {
          log.debug(`Command succeeded: ${command}`);
          if (stdout) log.debug(`Command output: ${stdout}`);
        }
        currentIndex++;
        executeNext();
      });
    }
    
    executeNext();
  });
}

// Apply system proxy (Windows)
async function applySystemProxyWindows(profile) {
  log.info('Applying Windows proxy...', { profile: profile.name, host: profile.host, port: profile.port, type: profile.type });
  
  return new Promise((resolve, reject) => {
    // Note: This requires admin privileges
    let command;
    
    if (profile.type === 'HTTP' || profile.type === 'HTTPS') {
      command = `netsh winhttp set proxy proxy-server="${profile.host}:${profile.port}"`;
      
      if (profile.bypass && profile.bypass.length > 0) {
        command += ` bypass-list="${profile.bypass.join(';')}"`;
      }
    } else if (profile.type === 'SOCKS4' || profile.type === 'SOCKS5') {
      // Windows doesn't natively support SOCKS via netsh, use registry instead
      // This is a simplified approach - full implementation might need more work
      log.warn(`SOCKS proxy type may not work correctly on Windows via netsh: ${profile.type}`);
      command = `netsh winhttp set proxy proxy-server="${profile.host}:${profile.port}"`;
    } else {
      const error = new Error(`Unsupported proxy type for Windows: ${profile.type}`);
      log.error(error.message);
      reject(error);
      return;
    }

    log.debug(`Executing Windows command: ${command}`);
    exec(command, { timeout: 5000 }, (error, stdout, stderr) => {
      if (error) {
        log.error('Failed to set proxy on Windows:', { 
          error: error.message, 
          code: error.code,
          stderr 
        });
        reject(error);
        return;
      }
      log.info('Windows proxy set successfully');
      if (stdout) log.debug(`Command output: ${stdout}`);
      resolve();
    });
  });
}

// Disable system proxy (macOS) - from ALL network interfaces
async function disableSystemProxyMac() {
  const interfaces = getAllNetworkInterfaces();
  
  return new Promise((resolve) => {
    const commands = [];
    
    // Disable proxy on ALL interfaces
    interfaces.forEach(interfaceName => {
      commands.push(
        `networksetup -setwebproxystate "${interfaceName}" off`,
        `networksetup -setsecurewebproxystate "${interfaceName}" off`,
        `networksetup -setsocksfirewallproxystate "${interfaceName}" off`
      );
    });

    let completed = 0;
    commands.forEach(cmd => {
      exec(cmd, { timeout: 5000 }, () => {
        completed++;
        if (completed === commands.length) {
          resolve();
        }
      });
    });
  });
}

// Disable system proxy (Windows)
async function disableSystemProxyWindows() {
  return new Promise((resolve, reject) => {
    exec('netsh winhttp reset proxy', { timeout: 5000 }, (error) => {
      if (error) {
        log.error('Failed to reset proxy on Windows:', error);
        reject(error);
        return;
      }
      resolve();
    });
  });
}

// Enable proxy
async function enableProxy() {
  const activeProfile = store.get('activeProfile');
  
  log.info('Attempting to enable proxy...', { profile: activeProfile?.name });
  
  if (!activeProfile) {
    const errorMsg = 'Please select a proxy profile first.';
    log.warn(errorMsg);
    dialog.showErrorBox('No Active Profile', errorMsg);
    return;
  }

  try {
    log.info(`Applying proxy for platform: ${process.platform}`);
    if (process.platform === 'darwin') {
      await applySystemProxyMac(activeProfile);
      log.info('macOS proxy applied successfully');
    } else if (process.platform === 'win32') {
      await applySystemProxyWindows(activeProfile);
      log.info('Windows proxy applied successfully');
    } else {
      throw new Error(`Unsupported platform: ${process.platform}`);
    }

    store.set('enabled', true);
    logger.log(`Proxy enabled: ${activeProfile.name}`, 'info');
    log.info(`Proxy enabled: ${activeProfile.name} (${activeProfile.host}:${activeProfile.port})`);
    
    // Verify proxy is actually enabled
    if (process.platform === 'darwin') {
      try {
        const interfaces = getAllNetworkInterfaces();
        let proxyActive = false;
        for (const iface of interfaces) {
          const result = execSync(`networksetup -getwebproxy "${iface}"`).toString();
          if (result.includes('Enabled: Yes')) {
            proxyActive = true;
            break;
          }
        }
        log.info(`Proxy verification: ${proxyActive ? 'ACTIVE' : 'NOT ACTIVE'}`);
      } catch (e) {
        log.warn('Could not verify proxy status:', e.message);
      }
    }
    
    if (mainWindow) {
      mainWindow.webContents.send('proxy-state-changed', { enabled: true, profile: activeProfile });
    }
    
    updateTrayMenu();
  } catch (error) {
    log.error('Error enabling proxy:', error);
    log.error('Error stack:', error.stack);
    const errorMsg = `Failed to enable proxy: ${error.message}`;
    dialog.showErrorBox('Proxy Error', errorMsg);
    logger.log(errorMsg, 'error');
  }
}

// Disable proxy
async function disableProxy() {
  log.info('Attempting to disable proxy...');
  try {
    if (process.platform === 'darwin') {
      await disableSystemProxyMac();
      log.info('macOS proxy disabled successfully');
    } else if (process.platform === 'win32') {
      await disableSystemProxyWindows();
      log.info('Windows proxy disabled successfully');
    } else {
      log.warn(`Unsupported platform for proxy disable: ${process.platform}`);
    }

    store.set('enabled', false);
    logger.log('Proxy disabled', 'info');
    log.info('Proxy disabled');
    
    if (mainWindow) {
      mainWindow.webContents.send('proxy-state-changed', { enabled: false });
    }
    
    updateTrayMenu();
  } catch (error) {
    log.error('Error disabling proxy:', error);
    log.error('Error stack:', error.stack);
    const errorMsg = `Failed to disable proxy: ${error.message}`;
    dialog.showErrorBox('Proxy Error', errorMsg);
    logger.log(errorMsg, 'error');
  }
}

// Switch profile
async function switchProfile(profileId) {
  const profiles = store.get('profiles', []);
  const profile = profiles.find(p => p.id === profileId);
  
  if (!profile) {
    dialog.showErrorBox('Profile Not Found', 'The selected profile could not be found.');
    return;
  }

  const wasEnabled = store.get('enabled');
  
  // Disable current proxy if enabled
  if (wasEnabled) {
    await disableProxy();
  }

  store.set('activeProfile', profile);
  
  // Re-enable if it was enabled before
  if (wasEnabled) {
    await enableProxy();
  }

  logger.log(`Switched to profile: ${profile.name}`, 'info');
  
  if (mainWindow) {
    mainWindow.webContents.send('profile-changed', profile);
  }
  
  updateTrayMenu();
}

// IPC Handlers
ipcMain.handle('get-profiles', () => {
  return store.get('profiles', []);
});

ipcMain.handle('get-active-profile', () => {
  return store.get('activeProfile');
});

ipcMain.handle('get-enabled-state', () => {
  return store.get('enabled');
});

ipcMain.handle('get-rules', () => {
  return store.get('rules', []);
});

ipcMain.handle('get-settings', () => {
  return store.get('settings');
});

ipcMain.handle('get-system-theme', () => {
  return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
});

ipcMain.handle('get-logs', () => {
  return logger.getLogs();
});

ipcMain.handle('add-profile', (event, profile) => {
  const profiles = store.get('profiles', []);
  profile.id = Date.now().toString();
  profiles.push(profile);
  store.set('profiles', profiles);
  logger.log(`Added profile: ${profile.name}`, 'info');
  return profile;
});

ipcMain.handle('update-profile', (event, profile) => {
  const profiles = store.get('profiles', []);
  const index = profiles.findIndex(p => p.id === profile.id);
  if (index !== -1) {
    profiles[index] = profile;
    store.set('profiles', profiles);
    logger.log(`Updated profile: ${profile.name}`, 'info');
    
    // Update active profile if it's the one being updated
    const activeProfile = store.get('activeProfile');
    if (activeProfile && activeProfile.id === profile.id) {
      store.set('activeProfile', profile);
    }
    return true;
  }
  return false;
});

ipcMain.handle('delete-profile', (event, profileId) => {
  const profiles = store.get('profiles', []);
  const filtered = profiles.filter(p => p.id !== profileId);
  store.set('profiles', filtered);
  
  // Clear active profile if it was deleted
  const activeProfile = store.get('activeProfile');
  if (activeProfile && activeProfile.id === profileId) {
    store.set('activeProfile', null);
    store.set('enabled', false);
  }
  
  logger.log(`Deleted profile: ${profileId}`, 'info');
  return true;
});

ipcMain.handle('add-rule', (event, rule) => {
  const rules = store.get('rules', []);
  rule.id = Date.now().toString();
  rules.push(rule);
  store.set('rules', rules);
  logger.log(`Added rule: ${rule.pattern}`, 'info');
  return rule;
});

ipcMain.handle('update-rule', (event, rule) => {
  const rules = store.get('rules', []);
  const index = rules.findIndex(r => r.id === rule.id);
  if (index !== -1) {
    rules[index] = rule;
    store.set('rules', rules);
    logger.log(`Updated rule: ${rule.pattern}`, 'info');
    return true;
  }
  return false;
});

ipcMain.handle('delete-rule', (event, ruleId) => {
  const rules = store.get('rules', []);
  const filtered = rules.filter(r => r.id !== ruleId);
  store.set('rules', filtered);
  logger.log(`Deleted rule: ${ruleId}`, 'info');
  return true;
});

ipcMain.handle('update-settings', (event, settings) => {
  store.set('settings', settings);
  logger.log('Settings updated', 'info');
  return true;
});

ipcMain.handle('switch-profile', async (event, profileId) => {
  await switchProfile(profileId);
  return true;
});

ipcMain.handle('enable-proxy', async () => {
  await enableProxy();
  return true;
});

ipcMain.handle('disable-proxy', async () => {
  await disableProxy();
  return true;
});

ipcMain.handle('test-proxy', async (event, profile) => {
  const { ProxyAgent } = require('proxy-agent');
  const fetch = require('node-fetch');
  
  log.info('Testing proxy...', { profile: profile.name, host: profile.host, port: profile.port, type: profile.type });
  
  try {
    let agent;
    let proxyUrl;
    
    // Build proxy URL based on type
    if (profile.type === 'SOCKS4' || profile.type === 'SOCKS5') {
      proxyUrl = `${profile.type.toLowerCase()}://${profile.host}:${profile.port}`;
    } else {
      // HTTP/HTTPS
      proxyUrl = `http://${profile.host}:${profile.port}`;
    }
    
    log.debug(`Proxy URL: ${proxyUrl}`);
    
    // Add authentication if provided
    if (profile.username && profile.password) {
      const authUrl = `${profile.username}:${profile.password}@${proxyUrl}`;
      agent = new ProxyAgent(authUrl);
    } else {
      agent = new ProxyAgent(proxyUrl);
    }

    log.debug('Making test request to httpbin.org/ip...');
    const response = await fetch('http://httpbin.org/ip', {
      agent,
      timeout: 10000
    });

    if (response.ok) {
      const data = await response.json();
      log.info(`Proxy test successful: ${profile.name}`, { ip: data.origin });
      logger.log(`Proxy test successful: ${profile.name}`, 'info');
      return { success: true, ip: data.origin };
    } else {
      const error = new Error(`HTTP ${response.status}`);
      log.error('Proxy test failed - HTTP error:', { status: response.status, profile: profile.name });
      throw error;
    }
  } catch (error) {
    log.error('Proxy test failed:', { 
      profile: profile.name, 
      error: error.message,
      stack: error.stack 
    });
    logger.log(`Proxy test failed: ${profile.name} - ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
});

ipcMain.handle('export-config', async (event) => {
  const { filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Export Configuration',
    defaultPath: 'proxy-config.json',
    filters: [{ name: 'JSON Files', extensions: ['json'] }]
  });

  if (filePath) {
    const config = {
      profiles: store.get('profiles', []),
      rules: store.get('rules', []),
      firewallRules: store.get('firewallRules', []),
      settings: store.get('settings')
    };
    
    const fs = require('fs').promises;
    await fs.writeFile(filePath, JSON.stringify(config, null, 2));
    logger.log('Configuration exported', 'info');
    return true;
  }
  return false;
});

ipcMain.handle('import-config', async (event) => {
  const { filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: 'Import Configuration',
    filters: [{ name: 'JSON Files', extensions: ['json'] }],
    properties: ['openFile']
  });

  if (filePaths && filePaths.length > 0) {
    try {
      const fs = require('fs').promises;
      const data = await fs.readFile(filePaths[0], 'utf8');
      const config = JSON.parse(data);
      
      if (config.profiles) store.set('profiles', config.profiles);
      if (config.rules) store.set('rules', config.rules);
      if (config.firewallRules) store.set('firewallRules', config.firewallRules);
      if (config.settings) store.set('settings', config.settings);
      
      logger.log('Configuration imported', 'info');
      return true;
    } catch (error) {
      logger.log(`Import failed: ${error.message}`, 'error');
      return false;
    }
  }
  return false;
});

ipcMain.handle('export-logs', async (event) => {
  const { filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Export Logs',
    defaultPath: 'proxy-logs.txt',
    filters: [{ name: 'Text Files', extensions: ['txt'] }]
  });

  if (filePath) {
    const logs = logger.getLogs();
    const fs = require('fs').promises;
    const logText = logs.map(log => `[${log.timestamp}] [${log.level}] ${log.message}`).join('\n');
    await fs.writeFile(filePath, logText);
    logger.log('Logs exported', 'info');
    return true;
  }
  return false;
});

// Handle renderer logging
ipcMain.handle('log-error', (event, message) => {
  log.error('[Renderer Error]', message);
  return true;
});

ipcMain.handle('log-warn', (event, message) => {
  log.warn('[Renderer Warn]', message);
  return true;
});

// Firewall IPC Handlers
ipcMain.handle('get-firewall-rules', () => {
  return firewallManager.getRules();
});

ipcMain.handle('get-firewall-status', () => {
  return firewallManager.getStatus();
});

ipcMain.handle('add-firewall-rule', (event, rule) => {
  try {
    return firewallManager.addRule(rule);
  } catch (error) {
    log.error('Error adding firewall rule:', error);
    throw error;
  }
});

ipcMain.handle('update-firewall-rule', (event, rule) => {
  try {
    return firewallManager.updateRule(rule);
  } catch (error) {
    log.error('Error updating firewall rule:', error);
    throw error;
  }
});

ipcMain.handle('delete-firewall-rule', (event, ruleId) => {
  try {
    return firewallManager.deleteRule(ruleId);
  } catch (error) {
    log.error('Error deleting firewall rule:', error);
    throw error;
  }
});

ipcMain.handle('toggle-firewall-rule', (event, ruleId) => {
  try {
    return firewallManager.toggleRule(ruleId);
  } catch (error) {
    log.error('Error toggling firewall rule:', error);
    throw error;
  }
});

ipcMain.handle('apply-firewall-rules', async (event) => {
  try {
    log.info('Applying firewall rules...');
    const result = await firewallManager.applyAllRules();
    return result;
  } catch (error) {
    log.error('Error applying firewall rules:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('enable-all-firewall-rules', () => {
  try {
    firewallManager.enableAll();
    return true;
  } catch (error) {
    log.error('Error enabling all firewall rules:', error);
    return false;
  }
});

ipcMain.handle('disable-all-firewall-rules', () => {
  try {
    firewallManager.disableAll();
    return true;
  } catch (error) {
    log.error('Error disabling all firewall rules:', error);
    return false;
  }
});

ipcMain.handle('select-application-file', async (event) => {
  try {
    const { filePaths, canceled } = await dialog.showOpenDialog(mainWindow, {
      title: 'Select Application',
      properties: ['openFile'],
      filters: process.platform === 'win32' 
        ? [{ name: 'Executables', extensions: ['exe'] }]
        : [{ name: 'Applications', extensions: ['app'] }, { name: 'All Files', extensions: ['*'] }]
    });

    if (canceled || !filePaths || filePaths.length === 0) {
      return null;
    }

    const filePath = filePaths[0];
    const stats = require('fs').statSync(filePath);
    const fileName = require('path').basename(filePath, process.platform === 'win32' ? '.exe' : '.app');
    
    return {
      path: filePath,
      name: fileName,
      size: stats.size
    };
  } catch (error) {
    log.error('Error selecting application file:', error);
    return null;
  }
});

// App lifecycle
app.whenReady().then(() => {
  log.info('App ready, initializing...');
  try {
    initializeManagers();
    log.info('Managers initialized');
    createWindow();
    createTray();
    log.info('App initialized successfully');
  } catch (error) {
    log.error('Error during app initialization:', error);
    log.error('Stack trace:', error.stack);
    dialog.showErrorBox('Initialization Error', `Failed to initialize app: ${error.message}`);
  }
});

app.on('activate', () => {
  log.info('App activated');
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('window-all-closed', () => {
  log.info('All windows closed');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  log.info('App quitting...');
  isQuitting = true;
  disableProxy();
});

app.on('will-quit', () => {
  log.info('App will quit');
});

// Log when app quits
process.on('exit', (code) => {
  log.info(`App exiting with code: ${code}`);
});

// Additional error handlers for IPC
ipcMain.on('error', (event, error) => {
  log.error('IPC error from renderer:', error);
});


