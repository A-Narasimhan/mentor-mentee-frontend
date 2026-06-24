// WHY THIS FILE EXISTS:
// Instead of writing fetch() everywhere in your app with copy-pasted headers,
// we create ONE central place. Every request automatically gets the auth token
// attached. If you ever change how auth works, you change it HERE only.

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = async (endpoint, options = {}) => {
 
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',  
    ...(token && { Authorization: `Bearer ${token}` }), 
    ...options.headers, 
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      throw new Error(
        `API returned HTML instead of JSON. ` +
        `Check that REACT_APP_API_URL is correct: "${BASE_URL}"`
      );
    }

    const data = await response.json();

    if (response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      return;
    }

    if (!response.ok) {
      throw new Error(data.message || `HTTP error ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API call to ${endpoint} failed:`, error.message);
    throw error;
  }
};

export default api;