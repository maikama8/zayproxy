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

// Modal elements
let profileModal;
let ruleModal;
let profileForm;
let ruleForm;

let profiles = [];
let rules = [];
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
    
    console.log('Step 6: Starting log refresh...');
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

  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', async () => {
      settings = {
        autoStart: autoStartCheckbox ? autoStartCheckbox.checked : false,
        minimizeToTray: minimizeToTrayCheckbox ? minimizeToTrayCheckbox.checked : true,
        autoProxy: autoProxyCheckbox ? autoProxyCheckbox.checked : false,
        theme: themeSelect ? themeSelect.value : 'light'
      };
      await window.electronAPI.updateSettings(settings);
      document.body.className = settings.theme === 'dark' ? 'dark-theme' : '';
      alert('Settings saved!');
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

  // Modal close handlers
  document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {
    btn.addEventListener('click', () => {
      if (profileModal) profileModal.style.display = 'none';
      if (ruleModal) ruleModal.style.display = 'none';
    });
  });

  window.addEventListener('click', (e) => {
    if (profileModal && e.target === profileModal) {
      profileModal.style.display = 'none';
    }
    if (ruleModal && e.target === ruleModal) {
      ruleModal.style.display = 'none';
    }
  });
  
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
      
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');
      
      if (sections && sections.length > 0) {
        sections.forEach(sec => sec.classList.remove('active'));
        const targetSection = document.getElementById(`${section}Section`);
        if (targetSection) {
          targetSection.classList.add('active');
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
    profilesList.innerHTML = '<div class="empty-state">No profiles configured. Click "Add Profile" to create one.</div>';
    return;
  }

  profiles.forEach(profile => {
    const card = document.createElement('div');
    card.className = 'profile-card';
    if (activeProfile && activeProfile.id === profile.id) {
      card.classList.add('active');
    }

    card.innerHTML = `
      <div class="card-header">
        <h3>${profile.name}</h3>
        <div class="card-badge">${profile.type}</div>
      </div>
      <div class="card-body">
        <div class="card-info">
          <span>${profile.host}:${profile.port}</span>
          ${profile.username ? `<span>Auth: ${profile.username}</span>` : ''}
        </div>
        <div class="card-actions">
          <button class="btn btn-sm btn-secondary" onclick="editProfile('${profile.id}')">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="deleteProfile('${profile.id}')">Delete</button>
          <button class="btn btn-sm btn-primary" onclick="testProfile('${profile.id}')">Test</button>
        </div>
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
    rulesList.innerHTML = '<div class="empty-state">No rules configured. Click "Add Rule" to create one.</div>';
    return;
  }

  rules.forEach(rule => {
    const card = document.createElement('div');
    card.className = 'rule-card';
    if (!rule.enabled) {
      card.classList.add('disabled');
    }

    const profile = profiles.find(p => p.id === rule.profileId);
    const profileName = profile ? profile.name : 'Unknown';

    card.innerHTML = `
      <div class="card-header">
        <h3>${rule.name || rule.pattern}</h3>
        <div class="card-badge">${rule.type || 'wildcard'}</div>
      </div>
      <div class="card-body">
        <div class="card-info">
          <span>Pattern: ${rule.pattern}</span>
          <span>Profile: ${profileName}</span>
          <span>Priority: ${rule.priority || 0}</span>
        </div>
        <div class="card-actions">
          <button class="btn btn-sm btn-secondary" onclick="editRule('${rule.id}')">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="deleteRule('${rule.id}')">Delete</button>
        </div>
      </div>
    `;

    rulesList.appendChild(card);
  });
}

// Update status
function updateStatus() {
  if (!statusIndicator || !statusText || !statusProfile) {
    console.warn('Status elements not found');
    return;
  }
  
  if (enabled && activeProfile) {
    statusIndicator.className = 'status-indicator active';
    statusText.textContent = 'Connected';
    statusProfile.textContent = `${activeProfile.name} (${activeProfile.host}:${activeProfile.port})`;
    if (enableBtn) enableBtn.disabled = true;
    if (disableBtn) disableBtn.disabled = false;
  } else {
    statusIndicator.className = 'status-indicator';
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
  
  logs.slice(-100).reverse().forEach(log => {
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry log-${log.level}`;
    const date = new Date(log.timestamp);
    logEntry.innerHTML = `
      <span class="log-time">${date.toLocaleTimeString()}</span>
      <span class="log-level">[${log.level.toUpperCase()}]</span>
      <span class="log-message">${escapeHtml(log.message)}</span>
    `;
    logsView.appendChild(logEntry);
  });

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
  
  profileModal.style.display = 'flex';
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
    profileModal.style.display = 'none';
  } catch (error) {
    alert('Error saving profile: ' + error.message);
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
  
  ruleModal.style.display = 'flex';
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
    ruleModal.style.display = 'none';
  } catch (error) {
    alert('Error saving rule: ' + error.message);
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

