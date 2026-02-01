// JSONP Helper for Google Apps Script Integration
// This file provides CORS-free communication with Apps Script Web App using JSONP

// Replace with your actual Web App URL after deployment
const GS_EXEC_URL = 'https://script.google.com/macros/s/REPLACE_WITH_YOUR_DEPLOYMENT_ID/exec';

/**
 * Make a JSONP call to avoid CORS issues
 * @param {string} url - The endpoint URL
 * @param {Object} params - Query parameters to send
 * @returns {Promise} Promise that resolves with the response data
 */
function jsonpCall(url, params) {
  return new Promise((resolve, reject) => {
    const cb = 'cb_' + Math.random().toString(36).slice(2);
    params = { ...params, callback: cb };
    const qs = new URLSearchParams(params).toString();
    window[cb] = (data) => { resolve(data); cleanup(); };
    function cleanup() {
      try { delete window[cb]; } catch {}
      if (script && script.parentNode) script.parentNode.removeChild(script);
    }
    const script = document.createElement('script');
    script.src = url + '?' + qs;
    script.onerror = () => { cleanup(); reject(new Error('JSONP load error')); };
    document.body.appendChild(script);
  });
}

/**
 * Send a contact form message via JSONP
 * @param {string} name - Sender name
 * @param {string} email - Sender email
 * @param {string} message - Message content
 * @returns {Promise} Promise that resolves with the response
 */
function sendContactViaJsonp(name, email, message) {
  return jsonpCall(GS_EXEC_URL, {
    action: 'contact',
    name,
    email,
    message
  });
}

/**
 * List all posts via JSONP
 * @returns {Promise} Promise that resolves with the posts array
 */
function listPostsViaJsonp() {
  return jsonpCall(GS_EXEC_URL, { action: 'list' });
}
