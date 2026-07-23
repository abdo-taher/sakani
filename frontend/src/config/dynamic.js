/**
 * Dynamic Configuration for Frontend
 * Automatically detects the environment and sets appropriate URLs
 */

class DynamicConfig {
  constructor() {
    this.config = null;
    this.initialized = false;
  }

  /**
   * Detect current environment based on hostname
   */
  detectEnvironment() {
    const hostname = window.location.hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'local';
    } else if (hostname.includes('staging')) {
      return 'staging';
    } else {
      return 'production';
    }
  }

  /**
   * Get API base URL dynamically
   */
  getApiUrl() {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    
    // Local development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${protocol}//localhost:8000/api`;
    }
    
    // Production/Staging - add api. subdomain
    let apiHost = hostname;
    if (!apiHost.startsWith('api.')) {
      // Remove www. if present and add api.
      apiHost = apiHost.replace(/^www\./, '');
      apiHost = `api.${apiHost}`;
    }
    
    return `${protocol}//${apiHost}/api`;
  }

  /**
   * Get frontend URL dynamically
   */
  getFrontendUrl() {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    
    // Remove api. prefix if present
    let frontendHost = hostname.replace(/^api\./, '');
    
    return `${protocol}//${frontendHost}`;
  }

  /**
   * Initialize configuration by fetching from backend
   */
  async initialize() {
    if (this.initialized) {
      return this.config;
    }

    try {
      const apiUrl = this.getApiUrl();
      const response = await fetch(`${apiUrl}/config`);
      
      if (response.ok) {
        const serverConfig = await response.json();
        this.config = {
          ...serverConfig,
          frontend_url: this.getFrontendUrl(),
          api_url: this.getApiUrl(),
          environment: this.detectEnvironment(),
        };
      } else {
        throw new Error('Failed to fetch server config');
      }
    } catch (error) {
      console.warn('Failed to fetch dynamic config, using fallback:', error);
      
      // Fallback configuration
      this.config = {
        api_url: this.getApiUrl(),
        frontend_url: this.getFrontendUrl(),
        app_name: 'Sakani',
        environment: this.detectEnvironment(),
      };
    }

    this.initialized = true;
    return this.config;
  }

  /**
   * Get configuration (async)
   */
  async getConfig() {
    if (!this.initialized) {
      await this.initialize();
    }
    return this.config;
  }

  /**
   * Get configuration (sync - returns cached or fallback)
   */
  getConfigSync() {
    if (this.config) {
      return this.config;
    }

    // Return fallback sync config
    return {
      api_url: this.getApiUrl(),
      frontend_url: this.getFrontendUrl(),
      app_name: 'Sakani',
      environment: this.detectEnvironment(),
    };
  }
}

// Create singleton instance
const dynamicConfig = new DynamicConfig();

export default dynamicConfig;