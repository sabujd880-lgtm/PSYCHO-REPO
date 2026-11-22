// public/js/api.js
// Centralized Client API layer for Personal Psychology Platform

const API_CONFIG = {
  // Use environment variable from window if injected, or default to backend port 5000 / relative
  baseUrl: (window.ENV && window.ENV.API_BASE_URL) || 
           (window.location.port === '5000' ? '' : 'http://localhost:5000')
};

const API = {
  formatUrl(endpoint) {
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      return endpoint;
    }
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    // If endpoint already starts with /api and baseUrl is set
    return `${API_CONFIG.baseUrl}${cleanEndpoint}`;
  },

  async get(endpoint) {
    const url = this.formatUrl(endpoint);
    try {
      const res = await fetch(url);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || errData.error || `HTTP Error ${res.status}: ${res.statusText}`);
      }
      const json = await res.json();
      return json.data !== undefined ? json.data : json;
    } catch (err) {
      console.error(`API GET ${url} failed:`, err);
      showToast(err.message, 'error');
      throw err;
    }
  },

  async post(endpoint, data) {
    const url = this.formatUrl(endpoint);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || errData.error || `HTTP Error ${res.status}`);
      }
      const json = await res.json();
      return json.data !== undefined ? json.data : json;
    } catch (err) {
      console.error(`API POST ${url} failed:`, err);
      showToast(err.message, 'error');
      throw err;
    }
  },

  async put(endpoint, data) {
    const url = this.formatUrl(endpoint);
    try {
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || errData.error || `HTTP Error ${res.status}`);
      }
      const json = await res.json();
      return json.data !== undefined ? json.data : json;
    } catch (err) {
      console.error(`API PUT ${url} failed:`, err);
      showToast(err.message, 'error');
      throw err;
    }
  },

  async delete(endpoint) {
    const url = this.formatUrl(endpoint);
    try {
      const res = await fetch(url, { method: 'DELETE' });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || errData.error || `HTTP Error ${res.status}`);
      }
      const json = await res.json();
      return json.data !== undefined ? json.data : json;
    } catch (err) {
      console.error(`API DELETE ${url} failed:`, err);
      showToast(err.message, 'error');
      throw err;
    }
  }
};

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 4000);
}
