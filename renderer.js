// DOM Elements - will be initialized after DOM is ready
let navItems;
let sections;
let profileSwitcher;
let enableBtn;
let disableBtn;
let statusIndicator;
let statusText;
let statusProfile;
let profilesList;
let rulesList;
let logsView;
let addProfileBtn;
let addRuleBtn;
let clearLogsBtn;
let exportLogsBtn;
let saveSettingsBtn;
let exportConfigBtn;
let importConfigBtn;
let themeToggle;
let themeSelect;

// Modal elements
let profileModal;
let ruleModal;
let profileForm;
let ruleForm;

let profiles = [];
let rules = [];
let firewallRules = [];
let activeProfile = null;
let enabled = false;
let settings = {};

// Initialize DOM elements
function initializeDOMElements() {
  navItems = document.querySelectorAll('.nav-item');
  sections = document.querySelectorAll('.content-section');
  profileSwitcher = document.getElementById('profileSwitcher');
  enableBtn = document.getElementById('enableBtn');
  disableBtn = document.getElementById('disableBtn');
  statusIndicator = document.getElementById('statusIndicator');
  statusText = document.getElementById('statusText');
  statusProfile = document.getElementById('statusProfile');
  profilesList = document.getElementById('profilesList');
  rulesList = document.getElementById('rulesList');
  logsView = document.getElementById('logsView');
  addProfileBtn = document.getElementById('addProfileBtn');
  addRuleBtn = document.getElementById('addRuleBtn');
  clearLogsBtn = document.getElementById('clearLogsBtn');
  exportLogsBtn = document.getElementById('exportLogsBtn');
  saveSettingsBtn = document.getElementById('saveSettingsBtn');
  exportConfigBtn = document.getElementById('exportConfigBtn');
  importConfigBtn = document.getElementById('importConfigBtn');

  // Modal elements
  profileModal = document.getElementById('profileModal');
  ruleModal = document.getElementById('ruleModal');
  profileForm = document.getElementById('profileForm');
  ruleForm = document.getElementById('ruleForm');
  
  // Theme elements
  themeToggle = document.getElementById('themeToggle');
  themeSelect = document.getElementById('themeSelect');

  // Log which elements were found
  console.log('DOM element check:', {
    profileSwitcher: !!profileSwitcher,
    enableBtn: !!enableBtn,
    disableBtn: !!disableBtn,
    addProfileBtn: !!addProfileBtn,
    addRuleBtn: !!addRuleBtn,
    profileModal: !!profileModal,
    ruleModal: !!ruleModal
  });

  // Verify critical elements exist (don't throw, just log)
  const criticalElements = [
    profileSwitcher, enableBtn, disableBtn, statusIndicator, statusText, 
    statusProfile, profilesList, rulesList, logsView, addProfileBtn, 
    addRuleBtn, clearLogsBtn, exportLogsBtn, saveSettingsBtn, 
    exportConfigBtn, importConfigBtn, profileModal, ruleModal, 
    profileForm, ruleForm
  ];

  const missingElements = [];
  criticalElements.forEach((el, index) => {
    if (!el) {
      const elementNames = [
        'profileSwitcher', 'enableBtn', 'disableBtn', 'statusIndicator', 
        'statusText', 'statusProfile', 'profilesList', 'rulesList', 
        'logsView', 'addProfileBtn', 'addRuleBtn', 'clearLogsBtn', 
        'exportLogsBtn', 'saveSettingsBtn', 'exportConfigBtn', 
        'importConfigBtn', 'profileModal', 'ruleModal', 'profileForm', 'ruleForm'
      ];
      missingElements.push(elementNames[index]);
    }
  });

  if (missingElements.length > 0) {
    console.error('Missing DOM elements:', missingElements);
    // Don't throw, just warn - continue anyway
    console.warn('Continuing despite missing elements...');
  } else {
    console.log('All DOM elements initialized successfully');
  }
}

// Error handler for renderer
window.addEventListener('error', (event) => {
  console.error('Renderer error:', event.error);
  console.error('Error message:', event.message);
  console.error('Error filename:', event.filename);
  console.error('Error lineno:', event.lineno);
  console.error('Error colno:', event.colno);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  console.error('Promise:', event.promise);
});

// Initialize
async function init() {
  try {
    console.log('=== RENDERER INITIALIZATION START ===');
    console.log('Document ready state:', document.readyState);
    console.log('window.electronAPI available:', !!window.electronAPI);
    
    // Check if electronAPI is available
    if (!window.electronAPI) {
      const errorMsg = 'window.electronAPI is not available!';
      console.error(errorMsg);
      alert('Error: Electron API not available. Please restart the application.');
      return;
    }
    
    console.log('Step 1: Initializing DOM elements...');
    // Initialize DOM elements first
    try {
      initializeDOMElements();
      console.log('✓ DOM elements initialized');
    } catch (error) {
      console.error('✗ Failed to initialize DOM elements:', error);
      throw error;
    }
    
    console.log('Step 2: Loading data...');
    // Load data
    try {
      await loadData();
      console.log('✓ Data loaded');
    } catch (error) {
      console.error('✗ Failed to load data:', error);
      throw error;
    }
    
    console.log('Step 3: Setting up event listeners...');
    // Setup event listeners
    try {
      setupEventListeners();
      console.log('✓ Event listeners setup');
    } catch (error) {
      console.error('✗ Failed to setup event listeners:', error);
      throw error;
    }
    
    console.log('Step 4: Setting up navigation...');
    try {
      setupNavigation();
      console.log('✓ Navigation setup');
    } catch (error) {
      console.error('✗ Failed to setup navigation:', error);
      throw error;
    }
    
    console.log('Step 5: Updating UI...');
    // Update UI
    try {
      updateUI();
      console.log('✓ UI updated');
    } catch (error) {
      console.error('✗ Failed to update UI:', error);
      throw error;
    }
    
    console.log('Step 6: Initializing theme...');
    await initializeTheme();
    
    console.log('Step 7: Starting log refresh...');
    startLogRefresh();
    
    console.log('=== RENDERER INITIALIZATION COMPLETE ===');
    console.log('Renderer initialized successfully');

    // Listen for proxy state changes
    window.electronAPI.onProxyStateChanged((data) => {
      try {
        enabled = data.enabled;
        if (data.profile) {
          activeProfile = data.profile;
        }
        updateUI();
      } catch (error) {
        console.error('Error handling proxy state change:', error);
      }
    });

    window.electronAPI.onProfileChanged((profile) => {
      try {
        activeProfile = profile;
        updateUI();
      } catch (error) {
        console.error('Error handling profile change:', error);
      }
    });
  } catch (error) {
    console.error('Error during initialization:', error);
    alert(`Initialization error: ${error.message}`);
  }
}

// Load data from main process
async function loadData() {
  try {
    profiles = await window.electronAPI.getProfiles();
    rules = await window.electronAPI.getRules();
    activeProfile = await window.electronAPI.getActiveProfile();
    enabled = await window.electronAPI.getEnabledState();
    settings = await window.electronAPI.getSettings();
    console.log('Data loaded:', { profiles: profiles.length, rules: rules.length });
  } catch (error) {
    console.error('Error loading data:', error);
    throw error;
  }
}

// Setup event listeners
function setupEventListeners() {
  console.log('Setting up event listeners...');
  console.log('Elements check:', {
    profileSwitcher: !!profileSwitcher,
    enableBtn: !!enableBtn,
    disableBtn: !!disableBtn,
    addProfileBtn: !!addProfileBtn
  });
  
  // Profile switcher
  if (profileSwitcher) {
    profileSwitcher.addEventListener('change', async (e) => {
      console.log('Profile switcher changed:', e.target.value);
      if (e.target.value) {
        await window.electronAPI.switchProfile(e.target.value);
        await loadData();
        updateUI();
      }
    });
  } else {
    console.error('profileSwitcher not found!');
  }

  // Enable/Disable buttons - use both onclick and addEventListener
  if (enableBtn) {
    enableBtn.onclick = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Enable button clicked');
      try {
        await window.electronAPI.enableProxy();
        await loadData();
        updateUI();
      } catch (error) {
        console.error('Error enabling proxy:', error);
        alert('Error: ' + error.message);
      }
      return false;
    };
    
    enableBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Enable button clicked (listener)');
      try {
        await window.electronAPI.enableProxy();
        await loadData();
        updateUI();
      } catch (error) {
        console.error('Error enabling proxy:', error);
        alert('Error: ' + error.message);
      }
      return false;
    });
  } else {
    console.error('enableBtn not found!');
  }

  if (disableBtn) {
    disableBtn.onclick = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Disable button clicked');
      try {
        await window.electronAPI.disableProxy();
        await loadData();
        updateUI();
      } catch (error) {
        console.error('Error disabling proxy:', error);
        alert('Error: ' + error.message);
      }
      return false;
    };
    
    disableBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Disable button clicked (listener)');
      try {
        await window.electronAPI.disableProxy();
        await loadData();
        updateUI();
      } catch (error) {
        console.error('Error disabling proxy:', error);
        alert('Error: ' + error.message);
      }
      return false;
    });
  } else {
    console.error('disableBtn not found!');
  }

  // Add profile
  if (addProfileBtn) {
    addProfileBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Add profile button clicked');
      openProfileModal();
      return false;
    };
    
    addProfileBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Add profile button clicked (listener)');
      openProfileModal();
    });
  } else {
    console.error('addProfileBtn not found!');
  }

  // Add rule
  if (addRuleBtn) {
    addRuleBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Add rule button clicked');
      openRuleModal();
      return false;
    };
    
    addRuleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Add rule button clicked (listener)');
      openRuleModal();
    });
  } else {
    console.error('addRuleBtn not found!');
  }

  // Firewall buttons
  const addFirewallRuleBtn = document.getElementById('addFirewallRuleBtn');
  const applyFirewallBtn = document.getElementById('applyFirewallBtn');
  
  if (addFirewallRuleBtn) {
    addFirewallRuleBtn.addEventListener('click', () => {
      openFirewallRuleModal();
    });
  }

  if (applyFirewallBtn) {
    applyFirewallBtn.addEventListener('click', async () => {
      if (confirm('This will modify your system firewall settings. Continue?')) {
        applyFirewallBtn.disabled = true;
        applyFirewallBtn.textContent = 'Applying...';
        try {
          const result = await window.electronAPI.applyFirewallRules();
          if (result.success) {
            alert(`Firewall rules applied successfully! ${result.applied}/${result.total} rules active.`);
            await loadData();
            updateUI();
          } else {
            alert(`Some firewall rules failed to apply. Check logs for details.`);
          }
        } catch (error) {
          alert(`Error applying firewall rules: ${error.message}`);
        } finally {
          applyFirewallBtn.disabled = false;
          applyFirewallBtn.textContent = 'Apply Firewall Rules';
        }
      }
    });
  }

  // Firewall form
  const firewallRuleForm = document.getElementById('firewallRuleForm');
  if (firewallRuleForm) {
    firewallRuleForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await saveFirewallRule();
    });
  }

  // Browse application button
  const browseAppBtn = document.getElementById('browseAppBtn');
  if (browseAppBtn) {
    browseAppBtn.addEventListener('click', async () => {
      const fileInfo = await window.electronAPI.selectApplicationFile();
      if (fileInfo) {
        document.getElementById('firewallRulePath').value = fileInfo.path;
        if (!document.getElementById('firewallRuleName').value) {
          document.getElementById('firewallRuleName').value = fileInfo.name;
        }
      }
    });
  }

  // Clear logs
  if (clearLogsBtn) {
    clearLogsBtn.addEventListener('click', () => {
      console.log('Clear logs button clicked');
      if (logsView) {
        logsView.innerHTML = '';
      }
    });
  }

  // Export logs
  if (exportLogsBtn) {
    exportLogsBtn.addEventListener('click', async () => {
      console.log('Export logs button clicked');
      await window.electronAPI.exportLogs();
    });
  }

  // Settings
  const autoStartCheckbox = document.getElementById('autoStart');
  const minimizeToTrayCheckbox = document.getElementById('minimizeToTray');
  const autoProxyCheckbox = document.getElementById('autoProxy');
  const themeSelect = document.getElementById('themeSelect');
  
  if (autoStartCheckbox) autoStartCheckbox.checked = settings.autoStart || false;
  if (minimizeToTrayCheckbox) minimizeToTrayCheckbox.checked = settings.minimizeToTray !== false;
  if (autoProxyCheckbox) autoProxyCheckbox.checked = settings.autoProxy || false;
  if (themeSelect) themeSelect.value = settings.theme || 'light';

  // Theme toggle
  if (themeToggle) {
    themeToggle.addEventListener('change', (e) => {
      const isDark = e.target.checked;
      applyTheme(isDark ? 'dark' : 'light');
      if (themeSelect) {
        themeSelect.value = isDark ? 'dark' : 'light';
      }
    });
  }
  
  // Theme select
  if (themeSelect) {
    themeSelect.addEventListener('change', (e) => {
      const theme = e.target.value;
      if (theme === 'system') {
        // Get system theme
        window.electronAPI.getSystemTheme().then(systemTheme => {
          applyTheme(systemTheme);
          if (themeToggle) {
            themeToggle.checked = systemTheme === 'dark';
          }
        });
      } else {
        applyTheme(theme);
        if (themeToggle) {
          themeToggle.checked = theme === 'dark';
        }
      }
    });
  }

  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', async () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      settings = {
        autoStart: autoStartCheckbox ? autoStartCheckbox.checked : false,
        minimizeToTray: minimizeToTrayCheckbox ? minimizeToTrayCheckbox.checked : true,
        autoProxy: autoProxyCheckbox ? autoProxyCheckbox.checked : false,
        theme: themeSelect ? themeSelect.value : currentTheme
      };
      await window.electronAPI.updateSettings(settings);
      applyTheme(settings.theme === 'system' ? (await window.electronAPI.getSystemTheme()) : settings.theme);
      // Show toast notification instead of alert
      showToast('Settings saved!', 'success');
    });
  }

  if (exportConfigBtn) {
    exportConfigBtn.addEventListener('click', async () => {
      await window.electronAPI.exportConfig();
      alert('Configuration exported!');
    });
  }

  if (importConfigBtn) {
    importConfigBtn.addEventListener('click', async () => {
      const success = await window.electronAPI.importConfig();
      if (success) {
        await loadData();
        updateUI();
        alert('Configuration imported!');
      } else {
        alert('Failed to import configuration');
      }
    });
  }

  // Profile form
  if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await saveProfile();
    });
  }

  // Rule form
  if (ruleForm) {
    ruleForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await saveRule();
    });
  }

  // Test profile button
  const testProfileBtn = document.getElementById('testProfileBtn');
  if (testProfileBtn) {
    testProfileBtn.addEventListener('click', async () => {
      const profile = getProfileFromForm();
      if (!profile.host || !profile.port) {
        alert('Please fill in host and port first');
        return;
      }
      const result = await window.electronAPI.testProxy(profile);
      if (result.success) {
        alert(`Proxy test successful! IP: ${result.ip}`);
      } else {
        alert(`Proxy test failed: ${result.error}`);
      }
    });
  }

  // Modal close handlers - daisyUI modals
  document.querySelectorAll('.modal-cancel').forEach(btn => {
    btn.addEventListener('click', () => {
      if (profileModal) profileModal.close();
      if (ruleModal) ruleModal.close();
      const firewallModal = document.getElementById('firewallRuleModal');
      if (firewallModal) firewallModal.close();
    });
  });

  // Modal backdrop clicks are handled by daisyUI automatically
  
  console.log('Event listeners setup complete');
}

// Setup navigation
function setupNavigation() {
  if (!navItems || navItems.length === 0) {
    console.error('Navigation items not found');
    return;
  }
  
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const section = item.dataset.section;
      
      // Update nav items - reset all to default state
      navItems.forEach(nav => {
        // Remove active state classes only
        nav.classList.remove('active', 'bg-primary', 'text-primary-content');
      });
      
      // Set active state on clicked item
      item.classList.add('active', 'bg-primary', 'text-primary-content');
      
      // Update sections - use hidden class for daisyUI
      if (sections && sections.length > 0) {
        sections.forEach(sec => {
          sec.classList.add('hidden');
        });
        const targetSection = document.getElementById(`${section}Section`);
        if (targetSection) {
          targetSection.classList.remove('hidden');
        }
      }
    });
  });
  
  console.log('Navigation setup complete');
}

// Update UI
function updateUI() {
  updateProfileSwitcher();
  updateProfilesList();
  updateRulesList();
  updateFirewallRulesList();
  updateFirewallStatus();
  updateStatus();
  updateLogs();
}

// Update profile switcher
function updateProfileSwitcher() {
  if (!profileSwitcher) {
    console.warn('Profile switcher not found');
    return;
  }
  
  profileSwitcher.innerHTML = '<option value="">Select a profile...</option>';
  profiles.forEach(profile => {
    const option = document.createElement('option');
    option.value = profile.id;
    option.textContent = profile.name;
    if (activeProfile && activeProfile.id === profile.id) {
      option.selected = true;
    }
    profileSwitcher.appendChild(option);
  });

  // Update rule form profile selector
  const ruleProfileSelect = document.getElementById('ruleProfile');
  ruleProfileSelect.innerHTML = '<option value="">Select a profile...</option>';
  profiles.forEach(profile => {
    const option = document.createElement('option');
    option.value = profile.id;
    option.textContent = profile.name;
    ruleProfileSelect.appendChild(option);
  });
}

// Update profiles list
function updateProfilesList() {
  if (!profilesList) {
    console.warn('Profiles list not found');
    return;
  }
  
  profilesList.innerHTML = '';
  
  if (profiles.length === 0) {
    profilesList.innerHTML = `
      <div class="col-span-full text-center py-12">
        <p class="text-base-content/60">No profiles configured. Click "Add Profile" to create one.</p>
      </div>
    `;
    return;
  }

  profiles.forEach(profile => {
    const isActive = activeProfile && activeProfile.id === profile.id;
    const card = document.createElement('div');
    card.className = `glass-card p-6 ${isActive ? 'ring-2 ring-primary' : ''}`;

    const typeColors = {
      'HTTP': 'badge-info',
      'HTTPS': 'badge-success',
      'SOCKS4': 'badge-warning',
      'SOCKS5': 'badge-error',
      'PAC': 'badge-secondary'
    };

    card.innerHTML = `
      <div class="flex items-start justify-between mb-4">
        <div class="flex-1">
          <h3 class="text-lg font-semibold mb-2">${escapeHtml(profile.name)}</h3>
          <div class="flex items-center gap-2 mb-2">
            <span class="badge ${typeColors[profile.type] || 'badge-neutral'}">${escapeHtml(profile.type)}</span>
            ${isActive ? '<span class="badge badge-success">Active</span>' : ''}
          </div>
          <p class="text-sm text-base-content/70">${escapeHtml(profile.host)}:${escapeHtml(profile.port)}</p>
          ${profile.username ? `<p class="text-xs text-base-content/60 mt-1">Auth: ${escapeHtml(profile.username)}</p>` : ''}
        </div>
      </div>
      <div class="flex gap-2">
        <button class="btn btn-sm btn-secondary" onclick="editProfile('${profile.id}')">Edit</button>
        <button class="btn btn-sm btn-error" onclick="deleteProfile('${profile.id}')">Delete</button>
        <button class="btn btn-sm btn-primary" onclick="testProfile('${profile.id}')">Test</button>
      </div>
    `;

    profilesList.appendChild(card);
  });
}

// Update rules list
function updateRulesList() {
  if (!rulesList) {
    console.warn('Rules list not found');
    return;
  }
  
  rulesList.innerHTML = '';
  
  if (rules.length === 0) {
    rulesList.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-8 text-base-content/60">
          No rules configured. Click "Add Rule" to create one.
        </td>
      </tr>
    `;
    return;
  }

  rules.forEach(rule => {
    const profile = profiles.find(p => p.id === rule.profileId);
    const profileName = profile ? profile.name : 'Unknown';
    const row = document.createElement('tr');
    row.className = !rule.enabled ? 'opacity-50' : '';

    row.innerHTML = `
      <td class="font-medium">${escapeHtml(rule.name || rule.pattern)}</td>
      <td><code class="text-xs bg-base-200 px-2 py-1 rounded">${escapeHtml(rule.pattern)}</code></td>
      <td>${escapeHtml(profileName)}</td>
      <td><span class="badge badge-neutral">${rule.priority || 0}</span></td>
      <td>
        <span class="badge ${rule.enabled ? 'badge-success' : 'badge-error'}">
          ${rule.enabled ? 'Enabled' : 'Disabled'}
        </span>
      </td>
      <td>
        <div class="flex gap-2">
          <button class="btn btn-xs btn-secondary" onclick="editRule('${rule.id}')">Edit</button>
          <button class="btn btn-xs btn-error" onclick="deleteRule('${rule.id}')">Delete</button>
        </div>
      </td>
    `;

    rulesList.appendChild(row);
  });
}

// Update status
function updateStatus() {
  if (!statusIndicator || !statusText || !statusProfile) {
    console.warn('Status elements not found');
    return;
  }
  
  if (enabled && activeProfile) {
    statusIndicator.className = 'status-indicator w-3 h-3 rounded-full bg-success';
    statusText.textContent = 'Connected';
    statusProfile.textContent = `${activeProfile.name} (${activeProfile.host}:${activeProfile.port})`;
    if (enableBtn) enableBtn.disabled = true;
    if (disableBtn) disableBtn.disabled = false;
  } else {
    statusIndicator.className = 'status-indicator w-3 h-3 rounded-full bg-error';
    statusText.textContent = 'Disconnected';
    statusProfile.textContent = activeProfile ? `${activeProfile.name} (not active)` : 'No active profile';
    if (enableBtn) enableBtn.disabled = false;
    if (disableBtn) disableBtn.disabled = true;
  }
}

// Update logs
async function updateLogs() {
  if (!logsView) {
    console.warn('Logs view not found');
    return;
  }
  
  const logs = await window.electronAPI.getLogs();
  logsView.innerHTML = '';
  
  if (logs.length === 0) {
    logsView.innerHTML = '<p class="text-center text-base-content/60 py-8">No logs yet</p>';
    return;
  }
  
  logs.slice(-100).reverse().forEach(log => {
    const logEntry = document.createElement('div');
    const date = new Date(log.timestamp);
    const levelColors = {
      'info': 'text-info',
      'warn': 'text-warning',
      'error': 'text-error',
      'debug': 'text-base-content/60'
    };
    
    logEntry.className = `flex gap-3 py-2 px-3 border-b border-base-300 last:border-0 hover:bg-base-200/50 transition-smooth`;
    logEntry.innerHTML = `
      <span class="text-xs text-base-content/50 font-mono">${date.toLocaleTimeString()}</span>
      <span class="text-xs font-semibold ${levelColors[log.level] || 'text-base-content'}">[${log.level.toUpperCase()}]</span>
      <span class="flex-1 text-sm">${escapeHtml(log.message)}</span>
    `;
    logsView.appendChild(logEntry);
  });
  
  // Auto-scroll to bottom
  logsView.scrollTop = logsView.scrollHeight;
}

// Start log refresh interval
function startLogRefresh() {
  setInterval(updateLogs, 2000);
}

// Parse proxy string (format: IP:port:username:password or IP:port)
function parseProxyString(str) {
  const parts = str.trim().split(':');
  if (parts.length >= 2) {
    return {
      host: parts[0],
      port: parts[1],
      username: parts[2] || '',
      password: parts[3] || ''
    };
  }
  return null;
}

// Theme functions
function applyTheme(theme) {
  const html = document.documentElement;
  html.setAttribute('data-theme', theme);
  if (theme === 'dark') {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }
}

function showToast(message, type = 'info') {
  // Simple toast using daisyUI alert
  const toast = document.createElement('div');
  toast.className = `alert alert-${type} fixed top-4 right-4 z-50 shadow-lg max-w-md`;
  toast.innerHTML = `
    <span>${escapeHtml(message)}</span>
    <button class="btn btn-sm btn-circle" onclick="this.parentElement.remove()">✕</button>
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// Initialize theme on load
async function initializeTheme() {
  try {
    const savedTheme = settings.theme || 'dark';
    if (savedTheme === 'system') {
      const systemTheme = await window.electronAPI.getSystemTheme();
      applyTheme(systemTheme);
      if (themeToggle) themeToggle.checked = systemTheme === 'dark';
    } else {
      applyTheme(savedTheme);
      if (themeToggle) themeToggle.checked = savedTheme === 'dark';
    }
    if (themeSelect) themeSelect.value = savedTheme;
  } catch (error) {
    console.error('Error initializing theme:', error);
    applyTheme('dark'); // Default to dark
  }
}

// Open profile modal
function openProfileModal(profile = null) {
  document.getElementById('profileModalTitle').textContent = profile ? 'Edit Proxy Profile' : 'Add Proxy Profile';
  document.getElementById('profileForm').reset();
  
  if (profile) {
    document.getElementById('profileId').value = profile.id;
    document.getElementById('profileName').value = profile.name;
    document.getElementById('profileType').value = profile.type;
    document.getElementById('profileHost').value = profile.host;
    document.getElementById('profilePort').value = profile.port;
    document.getElementById('profileUsername').value = profile.username || '';
    document.getElementById('profilePassword').value = profile.password || '';
    document.getElementById('profileBypass').value = profile.bypass ? (Array.isArray(profile.bypass) ? profile.bypass.join(', ') : profile.bypass) : '';
    document.getElementById('profilePAC').value = profile.pacUrl || '';
  }
  
  // Add paste event listener for auto-fill on Host field
  const hostInput = document.getElementById('profileHost');
  const portInput = document.getElementById('profilePort');
  const usernameInput = document.getElementById('profileUsername');
  const passwordInput = document.getElementById('profilePassword');
  
  // Setup paste handler for host input
  if (hostInput) {
    hostInput.addEventListener('paste', (e) => {
      // Use clipboard API to get pasted text
      navigator.clipboard.readText().then(pastedText => {
        const parsed = parseProxyString(pastedText);
        
        if (parsed) {
          e.preventDefault();
          e.stopPropagation();
          
          // Fill in the fields
          hostInput.value = parsed.host;
          if (portInput) portInput.value = parsed.port;
          if (usernameInput) usernameInput.value = parsed.username;
          if (passwordInput) passwordInput.value = parsed.password;
          
          // Auto-detect proxy type based on port (common ports)
          const typeSelect = document.getElementById('profileType');
          if (typeSelect) {
            const port = parseInt(parsed.port);
            if (port === 1080 || port === 1081) {
              typeSelect.value = 'SOCKS5';
            } else if (port === 8080 || port === 3128 || port === 8888) {
              typeSelect.value = 'HTTP';
            } else {
              typeSelect.value = 'HTTP'; // Default
            }
          }
          
          // Auto-generate name if empty
          const nameInput = document.getElementById('profileName');
          if (nameInput && !nameInput.value) {
            nameInput.value = `${parsed.host}:${parsed.port}`;
          }
        }
      }).catch(() => {
        // Fallback: try to get from input value after paste
        setTimeout(() => {
          const pastedText = hostInput.value;
          const parsed = parseProxyString(pastedText);
          
          if (parsed && pastedText.includes(':')) {
            hostInput.value = parsed.host;
            if (portInput) portInput.value = parsed.port;
            if (usernameInput) usernameInput.value = parsed.username;
            if (passwordInput) passwordInput.value = parsed.password;
            
            const typeSelect = document.getElementById('profileType');
            if (typeSelect) {
              const port = parseInt(parsed.port);
              if (port === 1080 || port === 1081) {
                typeSelect.value = 'SOCKS5';
              } else {
                typeSelect.value = 'HTTP';
              }
            }
            
            const nameInput = document.getElementById('profileName');
            if (nameInput && !nameInput.value) {
              nameInput.value = `${parsed.host}:${parsed.port}`;
            }
          }
        }, 10);
      });
    });
  }
  
    if (profileModal) {
      profileModal.showModal();
    }
}

// Save profile
async function saveProfile() {
  const profile = getProfileFromForm();
  
  try {
    if (profile.id) {
      await window.electronAPI.updateProfile(profile);
    } else {
      await window.electronAPI.addProfile(profile);
    }
    
    await loadData();
    updateUI();
    if (profileModal) profileModal.close();
    showToast('Profile saved successfully!', 'success');
  } catch (error) {
    showToast('Error saving profile: ' + error.message, 'error');
  }
}

// Get profile from form
function getProfileFromForm() {
  const bypass = document.getElementById('profileBypass').value
    .split(',')
    .map(s => s.trim())
    .filter(s => s);

  return {
    id: document.getElementById('profileId').value || null,
    name: document.getElementById('profileName').value,
    type: document.getElementById('profileType').value,
    host: document.getElementById('profileHost').value,
    port: parseInt(document.getElementById('profilePort').value),
    username: document.getElementById('profileUsername').value || null,
    password: document.getElementById('profilePassword').value || null,
    bypass: bypass.length > 0 ? bypass : null,
    pacUrl: document.getElementById('profilePAC').value || null
  };
}

// Open rule modal
function openRuleModal(rule = null) {
  document.getElementById('ruleModalTitle').textContent = rule ? 'Edit URL Rule' : 'Add URL Rule';
  document.getElementById('ruleForm').reset();
  
  if (rule) {
    document.getElementById('ruleId').value = rule.id;
    document.getElementById('ruleName').value = rule.name || '';
    document.getElementById('rulePattern').value = rule.pattern;
    document.getElementById('ruleType').value = rule.type || 'wildcard';
    document.getElementById('ruleProfile').value = rule.profileId;
    document.getElementById('rulePriority').value = rule.priority || 0;
    document.getElementById('ruleEnabled').checked = rule.enabled !== false;
  }
  
  if (ruleModal) {
    ruleModal.showModal();
  }
}

// Save rule
async function saveRule() {
  const rule = {
    id: document.getElementById('ruleId').value || null,
    name: document.getElementById('ruleName').value,
    pattern: document.getElementById('rulePattern').value,
    type: document.getElementById('ruleType').value,
    profileId: document.getElementById('ruleProfile').value,
    priority: parseInt(document.getElementById('rulePriority').value) || 0,
    enabled: document.getElementById('ruleEnabled').checked
  };
  
  try {
    if (rule.id) {
      await window.electronAPI.updateRule(rule);
    } else {
      rule.name = rule.name || rule.pattern;
      await window.electronAPI.addRule(rule);
    }
    
    await loadData();
    updateUI();
    if (ruleModal) ruleModal.close();
    showToast('Rule saved successfully!', 'success');
  } catch (error) {
    showToast('Error saving rule: ' + error.message, 'error');
  }
}

// Edit profile
window.editProfile = async function(profileId) {
  const profile = profiles.find(p => p.id === profileId);
  if (profile) {
    openProfileModal(profile);
  }
};

// Delete profile
window.deleteProfile = async function(profileId) {
  if (confirm('Are you sure you want to delete this profile?')) {
    await window.electronAPI.deleteProfile(profileId);
    await loadData();
    updateUI();
  }
};

// Test profile
window.testProfile = async function(profileId) {
  const profile = profiles.find(p => p.id === profileId);
  if (profile) {
    const result = await window.electronAPI.testProxy(profile);
    if (result.success) {
      alert(`Proxy test successful!\nIP: ${result.ip}`);
    } else {
      alert(`Proxy test failed:\n${result.error}`);
    }
  }
};

// Edit rule
window.editRule = async function(ruleId) {
  const rule = rules.find(r => r.id === ruleId);
  if (rule) {
    openRuleModal(rule);
  }
};

// Delete rule
window.deleteRule = async function(ruleId) {
  if (confirm('Are you sure you want to delete this rule?')) {
    await window.electronAPI.deleteRule(ruleId);
    await loadData();
    updateUI();
  }
};

// Firewall Functions
function updateFirewallRulesList() {
  const tbody = document.getElementById('firewallRulesBody');
  if (!tbody) {
    console.warn('Firewall rules body not found');
    return;
  }

  tbody.innerHTML = '';

  if (firewallRules.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty-state">No firewall rules configured. Click "Add Rule" to create one.</td></tr>';
    return;
  }

  firewallRules.forEach(rule => {
    const row = document.createElement('tr');
    row.className = rule.enabled ? '' : 'disabled';
    
    const statusBadge = rule.enabled 
      ? `<span class="badge badge-blocked">Blocked</span>`
      : `<span class="badge badge-allowed">Allowed</span>`;
    
    row.innerHTML = `
      <td>${escapeHtml(rule.name)}</td>
      <td class="path-cell">${escapeHtml(rule.path)}</td>
      <td>${statusBadge}</td>
      <td class="actions-cell">
        <button class="btn btn-sm btn-secondary" onclick="editFirewallRule('${rule.id}')">Edit</button>
        <button class="btn btn-sm ${rule.enabled ? 'btn-warning' : 'btn-success'}" onclick="toggleFirewallRule('${rule.id}')">
          ${rule.enabled ? 'Disable' : 'Enable'}
        </button>
        <button class="btn btn-sm btn-danger" onclick="deleteFirewallRule('${rule.id}')">Delete</button>
      </td>
    `;
    
    tbody.appendChild(row);
  });
}

function updateFirewallStatus() {
  const statusBadge = document.getElementById('firewallStatusBadge');
  const statusText = document.getElementById('firewallStatusText');
  const statusCount = document.getElementById('firewallStatusCount');
  
  if (!statusBadge || !statusText || !statusCount) {
    return;
  }

  const activeRules = firewallRules.filter(r => r.enabled);
  const blockedCount = activeRules.filter(r => r.blocked !== false).length;
  
  if (activeRules.length > 0) {
    statusBadge.className = 'status-badge active';
    statusText.textContent = 'Active';
    statusCount.textContent = `${blockedCount} app(s) blocked`;
  } else {
    statusBadge.className = 'status-badge';
    statusText.textContent = 'Inactive';
    statusCount.textContent = '0 rules active';
  }
}

function openFirewallRuleModal(rule = null) {
  const modal = document.getElementById('firewallRuleModal');
  const title = document.getElementById('firewallRuleModalTitle');
  const form = document.getElementById('firewallRuleForm');
  
  if (!modal || !title || !form) {
    console.error('Firewall modal elements not found');
    return;
  }

  title.textContent = rule ? 'Edit Firewall Rule' : 'Add Firewall Rule';
  form.reset();
  
  if (rule) {
    document.getElementById('firewallRuleId').value = rule.id;
    document.getElementById('firewallRuleName').value = rule.name;
    document.getElementById('firewallRulePath').value = rule.path;
    document.getElementById('firewallRuleBlocked').checked = rule.blocked !== false;
    document.getElementById('firewallRuleLogAttempts').checked = rule.logAttempts || false;
    document.getElementById('firewallRuleEnabled').checked = rule.enabled !== false;
  }
  
  if (modal) {
    modal.showModal();
  }
}

async function saveFirewallRule() {
  const firewallModal = document.getElementById('firewallRuleModal');
  const rule = {
    id: document.getElementById('firewallRuleId').value || null,
    name: document.getElementById('firewallRuleName').value,
    path: document.getElementById('firewallRulePath').value,
    blocked: document.getElementById('firewallRuleBlocked').checked,
    logAttempts: document.getElementById('firewallRuleLogAttempts').checked,
    enabled: document.getElementById('firewallRuleEnabled').checked
  };

  try {
    if (rule.id) {
      await window.electronAPI.updateFirewallRule(rule);
    } else {
      await window.electronAPI.addFirewallRule(rule);
    }
    
    await loadData();
    updateUI();
    if (firewallModal) firewallModal.close();
    showToast('Firewall rule saved successfully!', 'success');
  } catch (error) {
    showToast('Error saving firewall rule: ' + error.message, 'error');
  }
}

window.editFirewallRule = async function(ruleId) {
  const rule = firewallRules.find(r => r.id === ruleId);
  if (rule) {
    openFirewallRuleModal(rule);
  }
};

window.toggleFirewallRule = async function(ruleId) {
  try {
    await window.electronAPI.toggleFirewallRule(ruleId);
    await loadData();
    updateUI();
  } catch (error) {
    alert('Error toggling firewall rule: ' + error.message);
  }
};

window.deleteFirewallRule = async function(ruleId) {
  if (confirm('Are you sure you want to delete this firewall rule? This will remove the firewall block from your system.')) {
    try {
      await window.electronAPI.deleteFirewallRule(ruleId);
      await loadData();
      updateUI();
    } catch (error) {
      alert('Error deleting firewall rule: ' + error.message);
    }
  }
};

// Utility functions
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initialize on load - try multiple strategies
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  // DOM is already loaded, initialize immediately
  init();
}

// Fallback: also try on window load
window.addEventListener('load', () => {
  // Double-check initialization happened
  if (!enableBtn || typeof enableBtn.addEventListener !== 'function') {
    console.warn('Elements not initialized, retrying...');
    setTimeout(() => {
      try {
        initializeDOMElements();
        setupEventListeners();
      } catch (e) {
        console.error('Fallback initialization failed:', e);
      }
    }, 100);
  }
});

