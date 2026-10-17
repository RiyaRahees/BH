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
    // If request already has an explicit Authorization header, preserve it
    if (config.headers?.Authorization) {
      return config;
    }

    const isAdminPath = typeof window !== 'undefined' && window.location.pathname.includes('/admin');
    const isFranchisePath = typeof window !== 'undefined' && window.location.pathname.includes('/franchise');
    const isAdminRoute = config.url?.includes('/admin');
    const isFranchiseRoute = config.url?.includes('/franchise');
    let token = null;
    
    if ((isAdminRoute || isAdminPath) && localStorage.getItem("adminAccessToken")) {
      token = localStorage.getItem("adminAccessToken");
    } else if ((isFranchiseRoute || isFranchisePath) && localStorage.getItem("franchiseToken")) {
      token = localStorage.getItem("franchiseToken");
    } else {
      token = localStorage.getItem("accessToken");
    }

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
      originalRequest.url?.includes("/auth/refresh-token") ||
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/register")
    ) {
      return Promise.reject(error);
    }

    if (
      error.response?.status === 403 &&
      (error.response.data?.error?.toLowerCase().includes("banned") || 
       error.response.data?.error?.toLowerCase().includes("blocked"))
    ) {
      localStorage.clear();

      if (window.location.pathname !== "/banned" && error.response.data?.error?.toLowerCase().includes("banned")) {
        window.location.href = "/banned";
      } else if (window.location.pathname !== "/login" && error.response.data?.error?.toLowerCase().includes("blocked")) {
        window.location.href = "/login";
      }

      return Promise.reject(error);
    }

    const isAdminRoute = originalRequest.url?.includes('/admin');

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Admin tokens don't have refresh mechanism in this app. 
      // If an admin API returns 401, they must re-login.
      if (isAdminRoute) {
        localStorage.removeItem('adminAccessToken');
        localStorage.removeItem('adminRole');
        localStorage.removeItem('isAdminLoggedIn');
        
        const currentPath = window.location.pathname;
        if (currentPath.includes('/super-admin') && currentPath !== "/super-admin/login") {
           window.location.href = "/super-admin/login";
        } else if (currentPath.includes('/admin') && currentPath !== "/admin/login") {
           window.location.href = "/admin/login";
        }
        return Promise.reject(error);
      }

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

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        processQueue(null, accessToken);
        isRefreshing = false;

        return axiosInstance(originalRequest);
      } catch (err) {
        processQueue(err);
        isRefreshing = false;

        const isAdminPath = typeof window !== 'undefined' && (window.location.pathname.includes("/admin") || window.location.pathname.includes("/super-admin") || window.location.pathname.includes("/franchise"));

        if (!isAdminPath) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("user");

          if (window.location.pathname !== "/login") {
            window.location.href = "/login";
          }
        }

        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;