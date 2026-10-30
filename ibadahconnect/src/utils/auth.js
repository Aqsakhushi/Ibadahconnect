// Simple localStorage-based auth helpers (no Redux needed)

const USER_KEY = 'ibadahUser';
const FALLBACK_KEYS = ['currentUser', 'user'];

// Keep the user object consistent (always has an "id" field)
const normalize = (user) => {
  if (!user) return user;
  if (!user.id && user._id) user.id = user._id;
  return user;
};

// Read the logged-in user from localStorage
export const getCurrentUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (raw) return normalize(JSON.parse(raw));

    // Fallback: older keys that the login page might use
    for (const key of FALLBACK_KEYS) {
      const fallbackRaw = localStorage.getItem(key);
      if (!fallbackRaw) continue;
      const parsed = JSON.parse(fallbackRaw);
      const user = parsed?.user || parsed; // unwrap if stored as { user: {...}, token }
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      return normalize(user);
    }
    return null;
  } catch {
    return null;
  }
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