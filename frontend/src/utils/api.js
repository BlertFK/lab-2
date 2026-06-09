// Blert: minimal axios-free API client with the new auth response envelope.
// Tokens live in localStorage; the wrapper auto-attaches Bearer on every request
// and tries one silent refresh on 401 before propagating the error.

export const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000/api";

const ACCESS_KEY  = "token";          // legacy name kept so existing reads keep working
const REFRESH_KEY = "refreshToken";

export const getAccessToken  = () => localStorage.getItem(ACCESS_KEY);
export const getRefreshToken = () => localStorage.getItem(REFRESH_KEY);

export const setTokens = ({ accessToken, refreshToken }) => {
  if (accessToken) localStorage.setItem(ACCESS_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
  localStorage.setItem("authExpiresAt", String(Date.now() + 15 * 60 * 1000));
};

export const clearTokens = () => {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem("authExpiresAt");
};

// Read the API error envelope: new shape is {error:{code,message,details?}},
// legacy shape is {message:"..."}.
function extractMessage(data) {
  if (!data) return "Something went wrong";
  if (data.error && data.error.message) return data.error.message;
  if (data.message) return data.message;
  return "Something went wrong";
}

async function rawFetch(endpoint, options = {}) {
  const headers = { "Content-Type": "application/json", ...options.headers };
  const token = getAccessToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  const text = await res.text();
  const data = text ? safeJson(text) : {};

  if (!res.ok) {
    const err = new Error(extractMessage(data));
    err.status = res.status;
    err.code   = data?.error?.code;
    err.details = data?.error?.details;
    throw err;
  }
  return data;
}

function safeJson(text) {
  try { return JSON.parse(text); } catch { return { message: text }; }
}

let refreshInFlight = null;

async function tryRefresh() {
  if (refreshInFlight) return refreshInFlight;
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  refreshInFlight = rawFetch("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  })
    .then((data) => {
      setTokens(data);
      return data;
    })
    .catch(() => {
      clearTokens();
      return null;
    })
    .finally(() => { refreshInFlight = null; });

  return refreshInFlight;
}

export const apiFetch = async (endpoint, options = {}) => {
  try {
    return await rawFetch(endpoint, options);
  } catch (err) {
    if (err.status !== 401 || endpoint.startsWith("/auth/")) throw err;
    const refreshed = await tryRefresh();
    if (!refreshed) throw err;
    return rawFetch(endpoint, options);
  }
};
