// Thin wrapper over utils/api.js so the codebase has ONE shared auth/refresh
// pipeline. CMS pages and FileUploader still import { apiClient } from here.
//
// utils/api.js exposes apiFetch(endpoint, options) using the fetch API with
// localStorage tokens and silent refresh. We reuse it for every verb, plus
// add a FormData upload helper.

import { apiFetch, API_BASE, getAccessToken } from "../utils/api";

const withQuery = (url, params) => {
  if (!params || Object.keys(params).length === 0) return url;
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null)
  ).toString();
  return qs ? `${url}${url.includes("?") ? "&" : "?"}${qs}` : url;
};

export const apiClient = {
  get: (url, params) => apiFetch(withQuery(url, params), { method: "GET" }),
  post: (url, body) =>
    apiFetch(url, { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined }),
  put: (url, body) =>
    apiFetch(url, { method: "PUT", body: body !== undefined ? JSON.stringify(body) : undefined }),
  patch: (url, body) =>
    apiFetch(url, { method: "PATCH", body: body !== undefined ? JSON.stringify(body) : undefined }),
  delete: (url) => apiFetch(url, { method: "DELETE" }),

  // multipart upload — bypasses JSON Content-Type. Uses XHR so callers can
  // pass onProgress and see byte-level progress events.
  upload: (url, formData, onProgress) =>
    new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${API_BASE}${url}`);
      const token = getAccessToken();
      if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded * 100) / e.total));
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(xhr.responseText ? JSON.parse(xhr.responseText) : {});
          } catch {
            resolve({ raw: xhr.responseText });
          }
        } else {
          let msg = `Upload failed (${xhr.status})`;
          try {
            const data = JSON.parse(xhr.responseText || "{}");
            msg = data.error?.message || data.message || msg;
          } catch { /* ignore */ }
          const err = new Error(msg);
          err.status = xhr.status;
          reject(err);
        }
      };
      xhr.onerror = () => reject(new Error("Network error during upload"));
      xhr.send(formData);
    }),
};

// Backward-compat: previous code did `import instance from "../lib/apiClient"`
// for one-off axios calls. Provide a minimal compatible default export that
// forwards verbs to apiClient.
export default apiClient;
