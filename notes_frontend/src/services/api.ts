import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
  withCredentials: true, // Absolutely crucial for sending/receiving HttpOnly cookies
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token); // For cookie-based, 'token' is usually null
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const isAuthError = status === 401;

    // Define specific public API endpoints that should NOT trigger token refresh/redirect logic on 401
    // These are typically for initial login, registration, or checking auth status on public pages.
    const publicEndpoints = [
      `${api.defaults.baseURL}/token/`, // Your main login endpoint
      `${api.defaults.baseURL}/register/`, // Your registration endpoint (if it might return 401)
      `${api.defaults.baseURL}/user/me/`, // Your endpoint for checkAuthStatus when *initially* loading
      // Add any other endpoints here that should simply return 401 error to the calling component
    ];

    // Check if the current request is for a public endpoint
    const isRequestToPublicEndpoint = publicEndpoints.includes(
      originalRequest.url,
    );

    // 1. Handle cases where no further refresh/retry/redirect should occur:
    //    - If the request was for refreshing the token itself and it failed.
    //    - If the request has already been retried once (to prevent infinite loops).
    //    - NEW: If the request is to a public endpoint and it received a 401 (e.g., login failure).
    if (
      originalRequest.url === `${api.defaults.baseURL}/token/refresh/` ||
      originalRequest._retry ||
      (isAuthError && isRequestToPublicEndpoint) // CRITICAL ADDITION HERE
    ) {
      if (isAuthError || status === 403) {
        // If it's a 401/403 on refresh, a retried request, or a direct login attempt failing:
        // Force a full logout, as the session is clearly invalid or the login failed.
        console.error(
          "Auth error on refresh/login/retried request. Forcing logout.",
        );
        window.location.href = "/"; // Force logout to clear state and redirect to login
      }
      return Promise.reject(error); // Reject the promise, letting the original caller handle the error
    }

    // 2. Handle the initial 401 Unauthorized error for PROTECTED resources:
    //    - This block is only entered if it's a 401 AND it's not a public endpoint request.
    if (isAuthError) {
      // This condition is now implicitly "isAuthError for a PROTECTED endpoint"
      originalRequest._retry = true; // Mark this request so it's not endlessly retried if it fails again

      if (isRefreshing) {
        // If a refresh is already in progress, queue the current failed request
        console.log(
          "Adding request to refresh queue, waiting for token refresh...",
        );
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            // New cookies should be set by now. Retry the original request.
            return api(originalRequest);
          })
          .catch((err) => {
            // If the queued request eventually fails (e.g., refresh failed), reject it
            return Promise.reject(err);
          });
      }

      // No refresh in progress, initiate one
      isRefreshing = true;
      console.log("Initiating token refresh...");

      try {
        // This request will automatically send the HttpOnly refresh token cookie
        // due to `withCredentials: true` on the `api` instance.
        // Backend should set new HttpOnly access/refresh cookies on success.
        const refreshResponse = await api.post(
          `${api.defaults.baseURL}/token/refresh/`,
          {}, // Empty body, refresh token is in cookie
        );

        console.log("Token refreshed successfully via cookies.");

        // Process all queued requests. They will retry with the new cookies.
        processQueue(null, null);

        // Finally, retry the original failed request. It will now use the new cookies.
        return api(originalRequest);
      } catch (refreshError: any) {
        console.error(
          "Refresh token failed. Redirecting to login:",
          refreshError.response?.status,
          refreshError.response?.data || refreshError.message,
        );
        // Refresh failed: reject all queued requests and force logout
        processQueue(refreshError);
        window.location.href = "/"; // Force logout
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false; // Reset the flag
      }
    }

    // For any other non-401 errors, or if the 401 was for a public endpoint and already handled (by the first if block)
    return Promise.reject(error);
  },
);

export default api;
