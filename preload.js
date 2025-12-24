const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Profiles
  getProfiles: () => ipcRenderer.invoke('get-profiles'),
  getActiveProfile: () => ipcRenderer.invoke('get-active-profile'),
  addProfile: (profile) => ipcRenderer.invoke('add-profile', profile),
  updateProfile: (profile) => ipcRenderer.invoke('update-profile', profile),
  deleteProfile: (profileId) => ipcRenderer.invoke('delete-profile', profileId),
  
  // Rules
  getRules: () => ipcRenderer.invoke('get-rules'),
  addRule: (rule) => ipcRenderer.invoke('add-rule', rule),
  updateRule: (rule) => ipcRenderer.invoke('update-rule', rule),
  deleteRule: (ruleId) => ipcRenderer.invoke('delete-rule', ruleId),
  
  // Proxy control
  getEnabledState: () => ipcRenderer.invoke('get-enabled-state'),
  switchProfile: (profileId) => ipcRenderer.invoke('switch-profile', profileId),
  enableProxy: () => ipcRenderer.invoke('enable-proxy'),
  disableProxy: () => ipcRenderer.invoke('disable-proxy'),
  testProxy: (profile) => ipcRenderer.invoke('test-proxy', profile),
  
  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  updateSettings: (settings) => ipcRenderer.invoke('update-settings', settings),
  getSystemTheme: () => ipcRenderer.invoke('get-system-theme'),
  
  // Logs
  getLogs: () => ipcRenderer.invoke('get-logs'),
  exportLogs: () => ipcRenderer.invoke('export-logs'),
  
  // Config
  exportConfig: () => ipcRenderer.invoke('export-config'),
  importConfig: () => ipcRenderer.invoke('import-config'),
  
  // Events
  onProxyStateChanged: (callback) => {
    ipcRenderer.on('proxy-state-changed', (event, data) => callback(data));
  },
  onProfileChanged: (callback) => {
    ipcRenderer.on('profile-changed', (event, profile) => callback(profile));
  },
  
  // Logging helpers
  logError: (message) => {
    ipcRenderer.invoke('log-error', message);
  },
  logWarn: (message) => {
    ipcRenderer.invoke('log-warn', message);
  },
  
  // Firewall
  getFirewallRules: () => ipcRenderer.invoke('get-firewall-rules'),
  getFirewallStatus: () => ipcRenderer.invoke('get-firewall-status'),
  addFirewallRule: (rule) => ipcRenderer.invoke('add-firewall-rule', rule),
  updateFirewallRule: (rule) => ipcRenderer.invoke('update-firewall-rule', rule),
  deleteFirewallRule: (ruleId) => ipcRenderer.invoke('delete-firewall-rule', ruleId),
  toggleFirewallRule: (ruleId) => ipcRenderer.invoke('toggle-firewall-rule', ruleId),
  applyFirewallRules: () => ipcRenderer.invoke('apply-firewall-rules'),
  enableAllFirewallRules: () => ipcRenderer.invoke('enable-all-firewall-rules'),
  disableAllFirewallRules: () => ipcRenderer.invoke('disable-all-firewall-rules'),
  selectApplicationFile: () => ipcRenderer.invoke('select-application-file')
});

