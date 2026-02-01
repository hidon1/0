// Replace with your actual Web App URL after deployment
// Note: Update this URL after deploying your Apps Script Web App
const GS_EXEC_URL = 'https://script.google.com/macros/s/REPLACE_WITH_YOUR_DEPLOYMENT_ID/exec';

/**
 * Makes a JSONP call to avoid CORS issues
 * @param {string} url - The URL to call
 * @param {object} params - Query parameters to include
 * @returns {Promise} - Promise that resolves with the response data
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
 * Send contact form data via JSONP
 * @param {string} name - Contact name
 * @param {string} email - Contact email
 * @param {string} message - Contact message
 * @returns {Promise} - Promise that resolves with the response
 */
function sendContactJsonp(name, email, message) {
  return jsonpCall(GS_EXEC_URL, {
    action: 'contact',
    name,
    email,
    message
  });
}

/**
 * List all posts via JSONP
 * @returns {Promise} - Promise that resolves with the posts array
 */
function listPostsJsonp() {
  return jsonpCall(GS_EXEC_URL, { action: 'list' });
}
