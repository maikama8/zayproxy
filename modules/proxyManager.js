/**
 * Proxy Manager Module
 * Handles proxy profile management and validation
 */

class ProxyManager {
  constructor(store) {
    this.store = store;
  }

  /**
   * Get all proxy profiles
   */
  getProfiles() {
    return this.store.get('profiles', []);
  }

  /**
   * Get a specific profile by ID
   */
  getProfile(profileId) {
    const profiles = this.getProfiles();
    return profiles.find(p => p.id === profileId);
  }

  /**
   * Add a new proxy profile
   */
  addProfile(profile) {
    const profiles = this.getProfiles();
    
    // Validate profile
    if (!this.validateProfile(profile)) {
      throw new Error('Invalid profile data');
    }

    profile.id = Date.now().toString();
    profile.createdAt = new Date().toISOString();
    profiles.push(profile);
    
    this.store.set('profiles', profiles);
    return profile;
  }

  /**
   * Update an existing profile
   */
  updateProfile(profile) {
    const profiles = this.getProfiles();
    const index = profiles.findIndex(p => p.id === profile.id);
    
    if (index === -1) {
      throw new Error('Profile not found');
    }

    if (!this.validateProfile(profile)) {
      throw new Error('Invalid profile data');
    }

    profile.updatedAt = new Date().toISOString();
    profiles[index] = profile;
    this.store.set('profiles', profiles);
    return profile;
  }

  /**
   * Delete a profile
   */
  deleteProfile(profileId) {
    const profiles = this.getProfiles();
    const filtered = profiles.filter(p => p.id !== profileId);
    this.store.set('profiles', filtered);
    return true;
  }

  /**
   * Validate profile data
   */
  validateProfile(profile) {
    if (!profile.name || !profile.host || !profile.port) {
      return false;
    }

    const validTypes = ['HTTP', 'HTTPS', 'SOCKS4', 'SOCKS5', 'PAC'];
    if (!validTypes.includes(profile.type)) {
      return false;
    }

    const port = parseInt(profile.port);
    if (isNaN(port) || port < 1 || port > 65535) {
      return false;
    }

    return true;
  }

  /**
   * Set active profile
   */
  setActiveProfile(profileId) {
    const profile = this.getProfile(profileId);
    if (profile) {
      this.store.set('activeProfile', profile);
      return profile;
    }
    return null;
  }

  /**
   * Get active profile
   */
  getActiveProfile() {
    return this.store.get('activeProfile');
  }
}

module.exports = ProxyManager;

