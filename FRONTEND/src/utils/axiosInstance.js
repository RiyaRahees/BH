import axios from "axios";

const API_URL =
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000/api"
    : "https://kerala.bharathmarriage.com/api";

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Request interceptor: Attach access token to headers
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      originalRequest.url?.endsWith("/auth/refresh-token") ||
      originalRequest.url?.endsWith("/auth/login") ||
      originalRequest.url?.endsWith("/auth/register")
    ) {
      return Promise.reject(error);
    }

    if (
      error.response?.status === 403 &&
      error.response.data?.error?.toLowerCase().includes("banned")
    ) {
      localStorage.clear();

      if (window.location.pathname !== "/banned") {
        window.location.href = "/banned";
      }

      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        const refreshResponse = await axios.post(
          `${API_URL}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );

        const { accessToken } = refreshResponse.data;

        localStorage.setItem("accessToken", accessToken);

        axiosInstance.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        processQueue(null, accessToken);
        isRefreshing = false;

        return axiosInstance(originalRequest);
      } catch (err) {
        processQueue(err);
        isRefreshing = false;

        localStorage.clear();

        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }

        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;