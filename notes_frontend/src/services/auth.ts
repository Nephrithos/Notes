import api from "./api";
import type { Theme } from "@/components/ui/theme-provider";

export interface UserProfileData {
  id: number;
  username: string;
  email: string;
  profile: {
    first_name: string | null;
    last_name: string | null;
    mode_preference: Theme | null;
    is_profile_setup_completed: boolean;
  } | null;
}

interface LoginPayload {
  username: string;
  password: string;
}

interface LoginResponse {
  message: string;
}

/**
 * Handles user login.
 * @param credentials - User's username and password.
 * @returns A promise resolving to the LoginResponse from the backend.
 */

export const myLogin = async (
  credentials: LoginPayload,
): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>("/token/", {
    username: credentials.username, // Access properties from the single object
    password: credentials.password, // Access properties from the single object
  });
  return response.data;
};

/**
 * Handles user logout. Sends a request to the backend to invalidate the session/token.
 * Clears any client-side cached profile data.
 * @returns A promise resolving to the backend's response.
 */

export const logout = async (): Promise<any> => {
  const response = await api.post("/logout/"); // Call your Django logout endpoint
  return response.data;
};

/**
 * Checks the current authentication status and fetches the detailed user profile.
 * This is the primary function to get user data after authentication (e.g., after login or on app load).
 * @returns A promise resolving to UserProfileData if authenticated, or null if not.
 */

export const checkAuthStatus = async (): Promise<any> => {
  try {
    // console.log("Attempting to check auth status...");
    const response = await api.get("/me/"); // Replace with your actual user info endpoint
    // console.log("Auth check response:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "Auth check failed:",
      error.response?.status,
      error.response?.data || error.message,
    );
    return null;
  }
};

/**
 * Handles user registration.
 * @param email - User's email.
 * @param username - User's desired username.
 * @param password - User's password.
 * @param password2 - User's password confirmation.
 * @returns A promise resolving to the backend's response after registration.
 */

export const myRegister = async (
  email: string,
  username: string,
  password: string,
  password2: string,
): Promise<any> => {
  // Assuming your registration endpoint sends credentials and *doesn't* return tokens
  // If it does, you might still set a token in a cookie from the backend.
  const response = await api.post("/register/", {
    // Adjust this endpoint to your actual registration endpoint
    email,
    username,
    password,
    password2,
  });

  window.location.href = "/";
  return response.data;
};
