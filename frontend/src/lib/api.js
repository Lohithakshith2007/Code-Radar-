const API_BASE = `${import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"}/api`;
const TOKEN_KEY = "code_radar_token";

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export async function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = getAuthToken();
  if (token) headers.set("Authorization", `Token ${token}`);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(`${API_BASE}${path}`, { ...options, headers });
}

export async function responseError(response, fallback = "Request failed.") {
  const data = await response.json().catch(() => ({}));
  const detail = data.error || data.detail;
  return new Error(Array.isArray(detail) ? detail.join(" ") : detail || fallback);
}
