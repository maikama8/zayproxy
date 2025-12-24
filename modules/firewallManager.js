/**
 * Firewall Manager Module
 * Handles application firewall rules and platform-specific blocking
 */

const { exec, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Generate UUID v4
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

class FirewallManager {
  constructor(store, logger) {
    this.store = store;
    this.logger = logger;
    this.platform = process.platform;
    this.rules = this.store.get('firewallRules', []);
  }

  /**
   * Get all firewall rules
   */
  getRules() {
    return this.store.get('firewallRules', []);
  }

  /**
   * Add a new firewall rule
   */
  addRule(rule) {
    const rules = this.getRules();
    
    if (!this.validateRule(rule)) {
      throw new Error('Invalid firewall rule data');
    }

    rule.id = rule.id || uuidv4();
    rule.createdAt = new Date().toISOString();
    rule.enabled = rule.enabled !== false; // Default to enabled
    
    rules.push(rule);
    this.store.set('firewallRules', rules);
    this.rules = rules;
    
    this.logger.log(`Firewall rule added: ${rule.name}`, 'info');
    return rule;
  }

  /**
   * Update an existing rule
   */
  updateRule(rule) {
    const rules = this.getRules();
    const index = rules.findIndex(r => r.id === rule.id);
    
    if (index === -1) {
      throw new Error('Firewall rule not found');
    }

    if (!this.validateRule(rule)) {
      throw new Error('Invalid firewall rule data');
    }

    rule.updatedAt = new Date().toISOString();
    rules[index] = rule;
    this.store.set('firewallRules', rules);
    this.rules = rules;
    
    this.logger.log(`Firewall rule updated: ${rule.name}`, 'info');
    return rule;
  }

  /**
   * Delete a rule
   */
  deleteRule(ruleId) {
    const rules = this.getRules();
    const rule = rules.find(r => r.id === ruleId);
    
    if (rule) {
      // Remove firewall rule from OS before deleting
      this.removeFirewallRule(rule).catch(err => {
        console.error('Error removing firewall rule:', err);
      });
    }
    
    const filtered = rules.filter(r => r.id !== ruleId);
    this.store.set('firewallRules', filtered);
    this.rules = filtered;
    
    this.logger.log(`Firewall rule deleted: ${ruleId}`, 'info');
    return true;
  }

  /**
   * Toggle rule enabled state
   */
  toggleRule(ruleId) {
    const rules = this.getRules();
    const index = rules.findIndex(r => r.id === ruleId);
    
    if (index === -1) {
      throw new Error('Firewall rule not found');
    }

    rules[index].enabled = !rules[index].enabled;
    this.store.set('firewallRules', rules);
    this.rules = rules;
    
    this.logger.log(`Firewall rule ${rules[index].enabled ? 'enabled' : 'disabled'}: ${rules[index].name}`, 'info');
    return rules[index];
  }

  /**
   * Validate rule data
   */
  validateRule(rule) {
    if (!rule.name || !rule.path) {
      return false;
    }
    
    // Check if path exists
    try {
      if (!fs.existsSync(rule.path)) {
        return false;
      }
    } catch (e) {
      return false;
    }
    
    return true;
  }

  /**
   * Apply all enabled firewall rules
   */
  async applyAllRules() {
    const rules = this.getRules().filter(r => r.enabled);
    
    if (rules.length === 0) {
      this.logger.log('No active firewall rules to apply', 'info');
      return { success: true, applied: 0 };
    }

    this.logger.log(`Applying ${rules.length} firewall rule(s)...`, 'info');
    
    const results = [];
    for (const rule of rules) {
      try {
        await this.applyFirewallRule(rule);
        results.push({ rule: rule.name, success: true });
      } catch (error) {
        results.push({ rule: rule.name, success: false, error: error.message });
        this.logger.log(`Failed to apply firewall rule ${rule.name}: ${error.message}`, 'error');
      }
    }

    const successCount = results.filter(r => r.success).length;
    this.logger.log(`Firewall rules applied: ${successCount}/${rules.length} successful`, 'info');
    
    return { success: successCount === rules.length, applied: successCount, total: rules.length, results };
  }

  /**
   * Remove all firewall rules from OS
   */
  async removeAllRules() {
    const rules = this.getRules();
    
    for (const rule of rules) {
      try {
        await this.removeFirewallRule(rule);
      } catch (error) {
        console.error(`Error removing rule ${rule.name}:`, error);
      }
    }
    
    this.logger.log('All firewall rules removed from OS', 'info');
  }

  /**
   * Apply a single firewall rule (platform-specific)
   */
  async applyFirewallRule(rule) {
    if (this.platform === 'win32') {
      return await this.applyFirewallRuleWindows(rule);
    } else if (this.platform === 'darwin') {
      return await this.applyFirewallRuleMac(rule);
    } else {
      throw new Error(`Unsupported platform: ${this.platform}`);
    }
  }

  /**
   * Remove a single firewall rule (platform-specific)
   */
  async removeFirewallRule(rule) {
    if (this.platform === 'win32') {
      return await this.removeFirewallRuleWindows(rule);
    } else if (this.platform === 'darwin') {
      return await this.removeFirewallRuleMac(rule);
    } else {
      throw new Error(`Unsupported platform: ${this.platform}`);
    }
  }

  /**
   * Apply firewall rule on Windows using netsh advfirewall
   */
  async applyFirewallRuleWindows(rule) {
    return new Promise((resolve, reject) => {
      const ruleName = `ZayProxy Block - ${rule.name}`;
      // Escape the path for Windows
      const escapedPath = rule.path.replace(/\\/g, '\\\\');
      
      // Remove existing rule if it exists
      exec(`netsh advfirewall firewall delete rule name="${ruleName}"`, () => {
        // Ignore errors if rule doesn't exist
        
        // Add new block rule
        const command = `netsh advfirewall firewall add rule name="${ruleName}" dir=out action=block program="${escapedPath}" enable=yes`;
        
        exec(command, { timeout: 10000 }, (error, stdout, stderr) => {
          if (error) {
            // Check if it's a permission error
            if (error.message.includes('denied') || error.message.includes('access')) {
              reject(new Error('Administrator privileges required. Please run as administrator.'));
            } else {
              reject(error);
            }
            return;
          }
          
          this.logger.log(`Windows firewall rule applied: ${rule.name}`, 'info');
          resolve({ success: true, rule: rule.name });
        });
      });
    });
  }

  /**
   * Remove firewall rule on Windows
   */
  async removeFirewallRuleWindows(rule) {
    return new Promise((resolve, reject) => {
      const ruleName = `ZayProxy Block - ${rule.name}`;
      const command = `netsh advfirewall firewall delete rule name="${ruleName}"`;
      
      exec(command, { timeout: 5000 }, (error) => {
        if (error && !error.message.includes('No rules match')) {
          reject(error);
          return;
        }
        
        this.logger.log(`Windows firewall rule removed: ${rule.name}`, 'info');
        resolve({ success: true });
      });
    });
  }

  /**
   * Apply firewall rule on macOS using pfctl
   * Note: macOS per-app blocking is complex and requires root access.
   * This implementation creates pf anchor files that need to be loaded manually with sudo.
   * For production, consider using a helper script or third-party firewall tools.
   */
  async applyFirewallRuleMac(rule) {
    return new Promise((resolve, reject) => {
      try {
        // macOS per-app blocking requires root access via pfctl
        // We'll create a pf anchor file that can be loaded with sudo
        
        // Extract the actual binary path from .app bundle if needed
        let binaryPath = rule.path;
        if (rule.path.endsWith('.app')) {
          // For .app bundles, try to find the executable
          const possiblePaths = [
            path.join(rule.path, 'Contents', 'MacOS', path.basename(rule.path, '.app')),
            path.join(rule.path, 'Contents', 'MacOS', path.basename(rule.path, '.app').replace(/\s/g, ''))
          ];
          
          for (const possiblePath of possiblePaths) {
            if (fs.existsSync(possiblePath)) {
              binaryPath = possiblePath;
              break;
            }
          }
        }
        
        const anchorName = `zayproxy_${rule.id.replace(/-/g, '_')}`;
        const anchorDir = path.join(require('os').homedir(), '.zayproxy', 'firewall');
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(anchorDir)) {
          fs.mkdirSync(anchorDir, { recursive: true });
        }
        
        const anchorFile = path.join(anchorDir, `${anchorName}.pf`);
        const binaryName = path.basename(binaryPath);
        
        // Create pf rule to block outbound traffic from this binary
        // Note: This requires the anchor to be loaded into pf with sudo
        const pfRule = `# ZayProxy Firewall Rule: ${rule.name}\n` +
          `# Binary: ${binaryPath}\n` +
          `block out quick proto {tcp, udp} from any to any\n` +
          `# Note: This is a simplified rule. Full per-app blocking requires process matching.\n`;
        
        fs.writeFileSync(anchorFile, pfRule);
        
        this.logger.log(`macOS firewall anchor created: ${rule.name}`, 'info');
        this.logger.log(`Anchor file: ${anchorFile}`, 'info');
        this.logger.log(`To apply: sudo pfctl -a zayproxy/${anchorName} -f ${anchorFile}`, 'warn');
        
        // Store anchor file path in rule for later removal
        rule.anchorFile = anchorFile;
        this.updateRule(rule);
        
        resolve({ 
          success: true, 
          rule: rule.name,
          warning: 'macOS per-app blocking requires administrator privileges. The firewall rule file has been created, but you need to load it manually with sudo or use a third-party firewall tool like Little Snitch.',
          anchorFile,
          instructions: `To apply this rule, run in Terminal:\nsudo pfctl -a zayproxy/${anchorName} -f ${anchorFile}`
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Remove firewall rule on macOS
   */
  async removeFirewallRuleMac(rule) {
    return new Promise((resolve) => {
      try {
        // Remove anchor file if it exists in rule
        if (rule.anchorFile && fs.existsSync(rule.anchorFile)) {
          fs.unlinkSync(rule.anchorFile);
        }
        
        // Also try to remove from default location
        const anchorName = `zayproxy_${rule.id.replace(/-/g, '_')}`;
        const anchorDir = path.join(require('os').homedir(), '.zayproxy', 'firewall');
        const anchorFile = path.join(anchorDir, `${anchorName}.pf`);
        
        if (fs.existsSync(anchorFile)) {
          fs.unlinkSync(anchorFile);
        }
        
        // Try to remove from pf (requires sudo, but attempt anyway)
        exec(`sudo pfctl -a zayproxy/${anchorName} -F all 2>/dev/null || true`, () => {
          // Ignore errors - may not have sudo or rule may not be loaded
        });
        
        this.logger.log(`macOS firewall anchor removed: ${rule.name}`, 'info');
        resolve({ success: true });
      } catch (error) {
        // Ignore errors
        this.logger.log(`Note: Could not fully remove macOS firewall rule: ${error.message}`, 'warn');
        resolve({ success: true });
      }
    });
  }

  /**
   * Get firewall status
   */
  getStatus() {
    const rules = this.getRules();
    const activeRules = rules.filter(r => r.enabled);
    const blockedApps = activeRules.filter(r => r.blocked !== false);
    
    return {
      total: rules.length,
      active: activeRules.length,
      blocked: blockedApps.length,
      enabled: activeRules.length > 0
    };
  }

  /**
   * Enable all rules
   */
  enableAll() {
    const rules = this.getRules();
    rules.forEach(rule => {
      rule.enabled = true;
    });
    this.store.set('firewallRules', rules);
    this.rules = rules;
    this.logger.log('All firewall rules enabled', 'info');
    return true;
  }

  /**
   * Disable all rules
   */
  disableAll() {
    const rules = this.getRules();
    rules.forEach(rule => {
      rule.enabled = false;
    });
    this.store.set('firewallRules', rules);
    this.rules = rules;
    this.logger.log('All firewall rules disabled', 'info');
    return true;
  }
}

module.exports = FirewallManager;

