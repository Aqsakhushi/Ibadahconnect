// Simple localStorage-based auth helpers (no Redux needed)

const USER_KEY = 'user';
const TOKEN_KEYS = ['token', 'authToken', 'ibadahToken', 'ibadah_token', 'accessToken', 'jwt'];
const USER_KEYS = [USER_KEY, 'ibadahUser', 'currentUser'];

// Keep the user object consistent (always has an "id" field)
const normalize = (user) => {
  if (!user) return user;
  if (!user.id && user._id) user.id = user._id;
  return user;
};

// Read the logged-in user from localStorage
export const getCurrentUser = () => {
  try {
    for (const key of USER_KEYS) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      const user = parsed?.user || parsed;
      if (key !== USER_KEY) localStorage.setItem(USER_KEY, JSON.stringify(user));
      return normalize(user);
    }
    return null;
  } catch {
    return null;
  }
};

export const getToken = () => localStorage.getItem('token') || '';

export const isTokenExpired = (token, now = Date.now()) => {
  if (!token) return false;
  try {
    const payloadPart = token.split('.')[1];
    if (!payloadPart) return true;
    const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')));
    return !Number.isFinite(payload.exp) || payload.exp * 1000 <= now;
  } catch {
    return true;
  }
};

export const saveAuth = (user, token) => {
  if (user) saveUser(user);
  if (token) {
    localStorage.setItem('token', token);
    for (const key of TOKEN_KEYS) {
      if (key !== 'token') localStorage.removeItem(key);
    }
  }
};

export const clearAuth = () => {
  for (const key of [...TOKEN_KEYS, ...USER_KEYS]) {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }
};

export const logout = () => {
  clearAuth();
  sessionStorage.removeItem('postLoginRedirect');
  sessionStorage.removeItem('authExpiredMessage');
};

// Partially update the stored user (keeps existing fields)
export const syncLocalUser = (updates = {}) => {
  const current = getCurrentUser() || {};
  const merged = normalize({ ...current, ...updates });
  localStorage.setItem(USER_KEY, JSON.stringify(merged));
  return merged;
};

// Save the full user object (call this right after login)
export const saveUser = (user) => {
  if (!user) return;
  localStorage.setItem(USER_KEY, JSON.stringify(normalize(user)));
};

// Clear stored user (call this on logout)
export const clearUser = () => {
  localStorage.removeItem(USER_KEY);
};