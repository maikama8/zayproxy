/**
 * Rules Engine Module
 * Handles URL pattern matching and rule evaluation
 */

class RulesEngine {
  constructor(store) {
    this.store = store;
  }

  /**
   * Get all rules
   */
  getRules() {
    return this.store.get('rules', []);
  }

  /**
   * Add a new rule
   */
  addRule(rule) {
    const rules = this.getRules();
    
    if (!this.validateRule(rule)) {
      throw new Error('Invalid rule data');
    }

    rule.id = Date.now().toString();
    rule.createdAt = new Date().toISOString();
    rule.enabled = rule.enabled !== false; // Default to true
    
    rules.push(rule);
    this.store.set('rules', rules);
    return rule;
  }

  /**
   * Update an existing rule
   */
  updateRule(rule) {
    const rules = this.getRules();
    const index = rules.findIndex(r => r.id === rule.id);
    
    if (index === -1) {
      throw new Error('Rule not found');
    }

    if (!this.validateRule(rule)) {
      throw new Error('Invalid rule data');
    }

    rule.updatedAt = new Date().toISOString();
    rules[index] = rule;
    this.store.set('rules', rules);
    return rule;
  }

  /**
   * Delete a rule
   */
  deleteRule(ruleId) {
    const rules = this.getRules();
    const filtered = rules.filter(r => r.id !== ruleId);
    this.store.set('rules', filtered);
    return true;
  }

  /**
   * Validate rule data
   */
  validateRule(rule) {
    if (!rule.pattern || !rule.profileId) {
      return false;
    }

    // Validate pattern (can be wildcard or regex)
    try {
      if (rule.type === 'regex') {
        new RegExp(rule.pattern);
      }
    } catch (e) {
      return false;
    }

    return true;
  }

  /**
   * Match URL against rules
   * Returns the matching profile ID or null
   */
  matchUrl(url) {
    const rules = this.getRules();
    const enabledRules = rules.filter(r => r.enabled !== false);
    
    // Sort rules by priority (higher priority first)
    enabledRules.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    for (const rule of enabledRules) {
      if (this.testPattern(url, rule.pattern, rule.type || 'wildcard')) {
        return rule.profileId;
      }
    }

    return null;
  }

  /**
   * Test if a URL matches a pattern
   */
  testPattern(url, pattern, type) {
    if (type === 'regex') {
      try {
        const regex = new RegExp(pattern);
        return regex.test(url);
      } catch (e) {
        return false;
      }
    } else {
      // Wildcard matching
      // Convert wildcard pattern to regex
      // * matches any characters, ? matches single character
      const regexPattern = pattern
        .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape special regex chars
        .replace(/\*/g, '.*') // Convert * to .*
        .replace(/\?/g, '.'); // Convert ? to .
      
      const regex = new RegExp(`^${regexPattern}$`, 'i');
      return regex.test(url);
    }
  }

  /**
   * Get rules for a specific profile
   */
  getRulesForProfile(profileId) {
    const rules = this.getRules();
    return rules.filter(r => r.profileId === profileId);
  }
}

module.exports = RulesEngine;

