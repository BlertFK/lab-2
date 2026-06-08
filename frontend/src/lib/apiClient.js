import axios from "axios";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const instance = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach token to every request
instance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401 try refresh, else redirect to login
instance.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
          localStorage.setItem("token", data.accessToken);
          if (data.refreshToken) localStorage.setItem("refreshToken", data.refreshToken);
          original.headers.Authorization = `Bearer ${data.accessToken}`;
          return instance(original);
        } catch {
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error.response?.data || error);
  }
);

// Convenience wrappers that return data directly
export const apiClient = {
  get: (url, params) => instance.get(url, { params }).then((r) => r.data),
  post: (url, body) => instance.post(url, body).then((r) => r.data),
  put: (url, body) => instance.put(url, body).then((r) => r.data),
  patch: (url, body) => instance.patch(url, body).then((r) => r.data),
  delete: (url) => instance.delete(url).then((r) => r.data),
  upload: (url, formData, onProgress) =>
    instance
      .post(url, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => onProgress && onProgress(Math.round((e.loaded * 100) / e.total)),
      })
      .then((r) => r.data),
};

export default instance;
