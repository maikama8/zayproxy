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

// Browser elements
let browserWebview;
let browserUrl;
let browserGoBtn;
let browserBackBtn;
let browserForwardBtn;
let browserRefreshBtn;
let proxyDetectedAlert;
let importProxyBtn;
let detectedProxyData = null;
let quickAccessUrls = [];

// Modal elements
let profileModal;
let ruleModal;
let profileForm;
let ruleForm;
let quickAccessModal;
let quickAccessItemModal;

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
  
  // Browser elements
  browserWebview = document.getElementById('browserWebview');
  browserUrl = document.getElementById('browserUrl');
  browserGoBtn = document.getElementById('browserGoBtn');
  browserBackBtn = document.getElementById('browserBackBtn');
  browserForwardBtn = document.getElementById('browserForwardBtn');
  browserRefreshBtn = document.getElementById('browserRefreshBtn');
  proxyDetectedAlert = document.getElementById('proxyDetectedAlert');
  importProxyBtn = document.getElementById('importProxyBtn');

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
    quickAccessUrls = await window.electronAPI.getQuickAccessUrls() || [];
    console.log('Data loaded:', { profiles: profiles.length, rules: rules.length, quickAccess: quickAccessUrls.length });
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
      const quickAccessModalEl = document.getElementById('quickAccessModal');
      if (quickAccessModalEl) quickAccessModalEl.close();
      const quickAccessItemModalEl = document.getElementById('quickAccessItemModal');
      if (quickAccessItemModalEl) quickAccessItemModalEl.close();
    });
  });

  // Modal backdrop clicks are handled by daisyUI automatically
  
  // Browser event listeners
  setupBrowserEventListeners();
  
  // Quick access management
  setupQuickAccessListeners();
  
  console.log('Event listeners setup complete');
}

// Setup quick access management
function setupQuickAccessListeners() {
  const manageBtn = document.getElementById('manageQuickAccessBtn');
  const addBtn = document.getElementById('addQuickAccessBtn');
  const quickAccessForm = document.getElementById('quickAccessItemForm');
  
  console.log('Setting up quick access listeners...', {
    manageBtn: !!manageBtn,
    addBtn: !!addBtn,
    quickAccessForm: !!quickAccessForm
  });
  
  if (!manageBtn) {
    console.error('manageQuickAccessBtn not found!');
    return;
  }
  
  // Use onclick and addEventListener for maximum compatibility
  manageBtn.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Manage quick access button clicked (onclick)');
    try {
      openQuickAccessModal();
    } catch (error) {
      console.error('Error opening quick access modal:', error);
    }
    return false;
  };
  
  manageBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Manage quick access button clicked (listener)');
    try {
      openQuickAccessModal();
    } catch (error) {
      console.error('Error opening quick access modal:', error);
    }
  });
  
  if (addBtn) {
    addBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openQuickAccessItemModal();
    });
  }
  
  if (quickAccessForm) {
    quickAccessForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await saveQuickAccessItem();
    });
  }
  
  // Modal close handlers - get fresh references
  const modal = document.getElementById('quickAccessModal');
  const itemModal = document.getElementById('quickAccessItemModal');
  
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.close();
      }
    });
  }
  
  if (itemModal) {
    itemModal.addEventListener('click', (e) => {
      if (e.target === itemModal) {
        itemModal.close();
      }
    });
  }
}

// Update quick access buttons display
function updateQuickAccessButtons() {
  const container = document.getElementById('quickAccessContainer');
  if (!container) return;
  
  container.innerHTML = '';
  
  quickAccessUrls.forEach((item) => {
    const button = document.createElement('button');
    button.className = 'btn btn-xs btn-ghost';
    button.textContent = item.name;
    button.onclick = () => navigateBrowserUrl(item.url);
    container.appendChild(button);
  });
}

// Open quick access management modal
function openQuickAccessModal() {
  const modal = document.getElementById('quickAccessModal');
  if (!modal) {
    console.error('quickAccessModal element not found');
    return;
  }
  
  const list = document.getElementById('quickAccessList');
  if (!list) {
    console.error('quickAccessList element not found');
    return;
  }
  
  list.innerHTML = '';
  
  if (!quickAccessUrls || quickAccessUrls.length === 0) {
    list.innerHTML = '<p class="text-sm text-base-content/60">No quick access links. Click "Add New Link" to create one.</p>';
  } else {
    quickAccessUrls.forEach((item, index) => {
      const div = document.createElement('div');
      div.className = 'flex items-center justify-between p-3 bg-base-200 rounded-lg mb-2';
      div.innerHTML = `
        <div class="flex-1">
          <div class="font-semibold">${escapeHtml(item.name)}</div>
          <div class="text-xs text-base-content/60">${escapeHtml(item.url)}</div>
        </div>
        <div class="flex gap-2">
          <button class="btn btn-xs btn-secondary" onclick="editQuickAccessItem(${index})">Edit</button>
          <button class="btn btn-xs btn-error" onclick="deleteQuickAccessItem(${index})">Delete</button>
        </div>
      `;
      list.appendChild(div);
    });
  }
  
  modal.showModal();
}

// Open add/edit quick access item modal
function openQuickAccessItemModal(index = null) {
  const modal = document.getElementById('quickAccessItemModal');
  if (!modal) {
    console.error('quickAccessItemModal element not found');
    return;
  }
  
  const form = document.getElementById('quickAccessItemForm');
  const title = document.getElementById('quickAccessItemModalTitle');
  const indexInput = document.getElementById('quickAccessItemIndex');
  const nameInput = document.getElementById('quickAccessItemName');
  const urlInput = document.getElementById('quickAccessItemUrl');
  
  if (!form || !title || !indexInput || !nameInput || !urlInput) {
    console.error('Quick access item modal elements not found');
    return;
  }
  
  form.reset();
  
  if (index !== null && quickAccessUrls && quickAccessUrls[index]) {
    title.textContent = 'Edit Quick Access Link';
    indexInput.value = index;
    nameInput.value = quickAccessUrls[index].name;
    urlInput.value = quickAccessUrls[index].url;
  } else {
    title.textContent = 'Add Quick Access Link';
    indexInput.value = '';
  }
  
  modal.showModal();
}

// Save quick access item
async function saveQuickAccessItem() {
  const indexInput = document.getElementById('quickAccessItemIndex');
  const nameInput = document.getElementById('quickAccessItemName');
  const urlInput = document.getElementById('quickAccessItemUrl');
  
  if (!nameInput || !urlInput) return;
  
  const name = nameInput.value.trim();
  const url = urlInput.value.trim();
  const index = indexInput.value ? parseInt(indexInput.value) : null;
  
  if (!name || !url) {
    showToast('Please fill in all fields', 'error');
    return;
  }
  
  // Validate URL
  try {
    new URL(url);
  } catch (e) {
    showToast('Please enter a valid URL', 'error');
    return;
  }
  
  const newItem = { name, url };
  
  if (index !== null && index >= 0 && index < quickAccessUrls.length) {
    quickAccessUrls[index] = newItem;
  } else {
    quickAccessUrls.push(newItem);
  }
  
  try {
    await window.electronAPI.updateQuickAccessUrls(quickAccessUrls);
    await loadData();
    updateQuickAccessButtons();
    const itemModal = document.getElementById('quickAccessItemModal');
    if (itemModal) itemModal.close();
    const modal = document.getElementById('quickAccessModal');
    if (modal) {
      openQuickAccessModal(); // Refresh the list
    }
    showToast('Quick access link saved successfully!', 'success');
  } catch (error) {
    showToast('Error saving quick access link: ' + error.message, 'error');
  }
}

// Edit quick access item
window.editQuickAccessItem = function(index) {
  openQuickAccessItemModal(index);
};

// Delete quick access item
window.deleteQuickAccessItem = async function(index) {
  if (index < 0 || index >= quickAccessUrls.length) return;
  
  if (quickAccessUrls && quickAccessUrls[index] && confirm(`Are you sure you want to delete "${quickAccessUrls[index].name}"?`)) {
    quickAccessUrls.splice(index, 1);
    
    try {
      await window.electronAPI.updateQuickAccessUrls(quickAccessUrls);
      await loadData();
      updateQuickAccessButtons();
      openQuickAccessModal(); // Refresh the list
      showToast('Quick access link deleted', 'success');
    } catch (error) {
      showToast('Error deleting quick access link: ' + error.message, 'error');
    }
  }
};

// Setup browser event listeners
function setupBrowserEventListeners() {
  if (!browserWebview) {
    console.warn('Browser webview not found, skipping browser setup');
    return;
  }
  
  // Wait for webview to load
  browserWebview.addEventListener('dom-ready', () => {
    console.log('Browser webview ready');
    setupProxyDetection();
  });
  
  browserWebview.addEventListener('did-navigate', (e) => {
    if (browserUrl) {
      browserUrl.value = e.url;
    }
    hideProxyAlert();
  });
  
  browserWebview.addEventListener('did-navigate-in-page', (e) => {
    if (browserUrl) {
      browserUrl.value = e.url;
    }
    hideProxyAlert();
  });
  
  if (browserGoBtn) {
    browserGoBtn.addEventListener('click', () => {
      navigateBrowserUrl();
    });
  }
  
  const scanPageBtn = document.getElementById('scanPageBtn');
  if (scanPageBtn) {
    scanPageBtn.addEventListener('click', async () => {
      await scanPageForProxies();
    });
  }
  
  if (browserUrl) {
    browserUrl.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        navigateBrowserUrl();
      }
    });
  }
  
  if (browserBackBtn) {
    browserBackBtn.addEventListener('click', () => {
      if (browserWebview) {
        browserWebview.goBack();
      }
    });
  }
  
  if (browserForwardBtn) {
    browserForwardBtn.addEventListener('click', () => {
      if (browserWebview) {
        browserWebview.goForward();
      }
    });
  }
  
  if (browserRefreshBtn) {
    browserRefreshBtn.addEventListener('click', () => {
      if (browserWebview) {
        browserWebview.reload();
      }
    });
  }
  
  if (importProxyBtn) {
    importProxyBtn.addEventListener('click', () => {
      importDetectedProxy();
    });
  }
  
  // Listen for proxy detection events from main process
  if (window.electronAPI && window.electronAPI.onProxyDetected) {
    window.electronAPI.onProxyDetected((proxyData) => {
      handleProxyDetected(proxyData);
    });
  }
}

// Navigate browser to URL
function navigateBrowserUrl(customUrl = null) {
  if (!browserUrl || !browserWebview) return;
  
  let url = customUrl || browserUrl.value.trim();
  if (!url) return;
  
  // Add https:// if no protocol
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  
  browserUrl.value = url;
  browserWebview.src = url;
}

// Global function for quick access buttons
window.navigateBrowserUrl = navigateBrowserUrl;

// Scan page for proxies (manual scan button)
async function scanPageForProxies() {
  if (!browserWebview) {
    showToast('Browser not ready', 'error');
    return;
  }
  
  try {
    console.log('Scanning page for proxies...');
    const results = await browserWebview.executeJavaScript(`
      (function() {
        const proxies = [];
        const bodyText = document.body.innerText || document.body.textContent || '';
        
        // Find all IP:PORT patterns
        const ipPortPattern = /(\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}):(\\d{1,5})/g;
        const matches = [...bodyText.matchAll(ipPortPattern)];
        
        matches.forEach((match, index) => {
          if (index >= 50) return; // Limit to 50 proxies
          
          const host = match[1];
          const port = parseInt(match[2]);
          
          if (port > 0 && port <= 65535) {
            // Check if this is part of a larger pattern with credentials
            const contextStart = Math.max(0, match.index - 50);
            const contextEnd = Math.min(bodyText.length, match.index + match[0].length + 50);
            const context = bodyText.substring(contextStart, contextEnd);
            
            // Try to find IP:PORT:USER:PASS pattern
            const fullPattern = new RegExp(host.replace(/\\./g, '\\\\.') + ':' + port + ':(\\\\S+):(\\\\S+)');
            const fullMatch = context.match(fullPattern);
            
            proxies.push({
              host: host,
              port: port,
              username: fullMatch ? fullMatch[1] : null,
              password: fullMatch ? fullMatch[2] : null,
              type: 'HTTP',
              context: context.substring(0, 100)
            });
          }
        });
        
        return proxies;
      })();
    `);
    
    console.log('Scan results:', results);
    
    if (results && results.length > 0) {
      // Show first proxy or let user choose
      const firstProxy = results[0];
      handleProxyDetected(firstProxy);
      showToast(`Found ${results.length} proxy(ies). Using first one.`, 'success');
    } else {
      showToast('No proxies found on this page', 'info');
    }
  } catch (error) {
    console.error('Error scanning page:', error);
    showToast('Error scanning page: ' + error.message, 'error');
  }
}

// Setup proxy detection in webview
function setupProxyDetection() {
  if (!browserWebview) {
    console.warn('Browser webview not available for proxy detection');
    return;
  }
  
  console.log('Setting up proxy detection...');
  
  // Inject proxy detection script into the webview on every page load
  const injectDetection = () => {
    console.log('Attempting to inject proxy detection script...');
    browserWebview.executeJavaScript(`
      (function() {
        console.log('Proxy detection script injected successfully');
        
        // Function to extract proxy data from text
        function extractProxyData(text) {
          // Try IP:PORT:USER:PASS format first
          const fullMatch = text.match(/(\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}):(\\d{1,5})(?::([^:\\s@]+):([^\\s@]+))?/);
          if (fullMatch) {
            const host = fullMatch[1];
            const port = parseInt(fullMatch[2]);
            if (port > 0 && port <= 65535) {
              return {
                host: host,
                port: port,
                username: fullMatch[3] || null,
                password: fullMatch[4] || null,
                type: 'HTTP'
              };
            }
          }
          
          // Try IP:PORT format
          const simpleMatch = text.match(/(\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}):(\\d{1,5})/);
          if (simpleMatch) {
            const host = simpleMatch[1];
            const port = parseInt(simpleMatch[2]);
            if (port > 0 && port <= 65535) {
              return {
                host: host,
                port: port,
                username: null,
                password: null,
                type: 'HTTP'
              };
            }
          }
          
          return null;
        }
        
        // Listen for clicks on any element
        document.addEventListener('click', function(e) {
          const target = e.target;
          let text = target.textContent || target.innerText || target.value || '';
          
          // Also check parent elements up to 3 levels
          let element = target;
          for (let i = 0; i < 3 && element && element.parentElement; i++) {
            const parentText = element.parentElement.textContent || element.parentElement.innerText || '';
            if (parentText.length > text.length && parentText.length < 500) {
              text = parentText;
              element = element.parentElement;
            } else {
              break;
            }
          }
          
          const proxyData = extractProxyData(text);
          
          if (proxyData) {
            console.log('Proxy detected on click:', proxyData);
            
            // Try to find username/password in nearby elements
            const row = target.closest('tr, div, li, td, span, p');
            if (row) {
              const rowText = row.textContent || row.innerText || '';
              const fullMatch = rowText.match(/(\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}):(\\d{1,5}):([^:\\s@]+):([^\\s@]+)/);
              if (fullMatch) {
                proxyData.host = fullMatch[1];
                proxyData.port = parseInt(fullMatch[2]);
                proxyData.username = fullMatch[3];
                proxyData.password = fullMatch[4];
              }
            }
            
            // Detect proxy type from context
            const context = (target.closest('table, div, section, tbody, tr')?.textContent || '').toLowerCase();
            if (context.includes('socks5') || context.includes('socks 5')) {
              proxyData.type = 'SOCKS5';
            } else if (context.includes('socks4') || context.includes('socks 4')) {
              proxyData.type = 'SOCKS4';
            } else if (context.includes('https')) {
              proxyData.type = 'HTTPS';
            }
            
            // Send to parent window via IPC
            try {
              const { ipcRenderer } = require('electron');
              if (ipcRenderer) {
                console.log('Sending proxy data via IPC:', proxyData);
                ipcRenderer.sendToHost('proxy-detected', proxyData);
              }
            } catch (err) {
              console.error('Error sending proxy data via IPC:', err);
            }
          }
        }, true);
        
        console.log('Click event listener attached');
      })();
    `).then(() => {
      console.log('Proxy detection script injected successfully');
    }).catch(err => {
      console.error('Failed to inject proxy detection script:', err);
    });
  };
  
  // Inject on initial load
  browserWebview.addEventListener('dom-ready', () => {
    console.log('Webview DOM ready, injecting proxy detection');
    setTimeout(injectDetection, 1000);
  });
  
  // Also inject on navigation
  browserWebview.addEventListener('did-navigate', () => {
    console.log('Webview navigated, re-injecting proxy detection');
    setTimeout(injectDetection, 1000);
  });
  
  browserWebview.addEventListener('did-navigate-in-page', () => {
    setTimeout(injectDetection, 1000);
  });
  
  // Listen for IPC messages from the webview
  browserWebview.addEventListener('ipc-message', (event) => {
    console.log('IPC message received from webview:', event.channel, event.args);
    if (event.channel === 'proxy-detected') {
      console.log('Proxy detected via IPC:', event.args[0]);
      handleProxyDetected(event.args[0]);
    }
  });
  
  console.log('Proxy detection setup complete');
}

// Handle detected proxy
function handleProxyDetected(proxyData) {
  console.log('handleProxyDetected called with:', proxyData);
  
  if (!proxyData || !proxyData.host || !proxyData.port) {
    console.warn('Invalid proxy data received:', proxyData);
    return;
  }
  
  detectedProxyData = proxyData;
  console.log('Stored proxy data:', detectedProxyData);
  
  const alertEl = document.getElementById('proxyDetectedAlert');
  const infoEl = document.getElementById('proxyDetectedInfo');
  
  if (alertEl) {
    alertEl.classList.remove('hidden');
    console.log('Showing proxy detected alert');
  } else {
    console.error('proxyDetectedAlert element not found');
  }
  
  if (infoEl) {
    const authText = proxyData.username ? ` (${proxyData.username}:****)` : '';
    infoEl.textContent = `${proxyData.host}:${proxyData.port} (${proxyData.type || 'HTTP'})${authText}`;
  }
  
  // Send to main process for storage
  if (window.electronAPI && window.electronAPI.extractProxyFromPage) {
    window.electronAPI.extractProxyFromPage(proxyData).then(() => {
      console.log('Proxy data sent to main process');
    }).catch(err => {
      console.error('Error sending proxy data to main process:', err);
    });
  }
  
  // Show a toast notification
  showToast(`Proxy detected: ${proxyData.host}:${proxyData.port}`, 'success');
}

// Hide proxy alert
function hideProxyAlert() {
  if (proxyDetectedAlert) {
    proxyDetectedAlert.classList.add('hidden');
  }
  detectedProxyData = null;
}

// Import detected proxy to profiles
async function importDetectedProxy() {
  if (!detectedProxyData) return;
  
  // Switch to profiles section
  const profilesNav = document.querySelector('[data-section="profiles"]');
  if (profilesNav) {
    profilesNav.click();
  }
  
  // Wait a bit for section to show
  setTimeout(() => {
    // Open profile modal with detected data
    const proxyProfile = {
      name: `${detectedProxyData.host}:${detectedProxyData.port}`,
      type: detectedProxyData.type || 'HTTP',
      host: detectedProxyData.host,
      port: detectedProxyData.port,
      username: detectedProxyData.username || null,
      password: detectedProxyData.password || null
    };
    
    openProfileModal(null); // Open new profile modal
    fillProfileForm(proxyProfile);
    
    // Hide alert
    hideProxyAlert();
  }, 300);
}

// Fill profile form with data
function fillProfileForm(profile) {
  const nameInput = document.getElementById('profileName');
  const typeSelect = document.getElementById('profileType');
  const hostInput = document.getElementById('profileHost');
  const portInput = document.getElementById('profilePort');
  const usernameInput = document.getElementById('profileUsername');
  const passwordInput = document.getElementById('profilePassword');
  
  if (nameInput) nameInput.value = profile.name || '';
  if (typeSelect) typeSelect.value = profile.type || 'HTTP';
  if (hostInput) hostInput.value = profile.host || '';
  if (portInput) portInput.value = profile.port || '';
  if (usernameInput) usernameInput.value = profile.username || '';
  if (passwordInput) passwordInput.value = profile.password || '';
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
  updateQuickAccessButtons();
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

