import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { checkAuthStatus, logout, myLogin } from "../services/auth";
import type { UserProfileData } from "../services/auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// 1. Define a proper User type based on UserProfileData
// This ensures type safety for the 'user' state in AuthContext
interface AuthContextType {
  isAuthenticated: boolean;
  user: UserProfileData | null;
  isLoadingAuth: boolean;
  loginUser: (username: string, password: string) => Promise<void>;
  logoutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserProfileData | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();

  // 2. Refined Auth Status Check on App Load (Initial Mount & Path Change)
  // This useEffect now runs a full check to set initial auth state.
  // The 'authPages' check is removed because Layout.tsx will handle redirects
  // if a user lands on a protected route without being authenticated.
  useEffect(() => {
    const check = async () => {
      if (location.pathname === "/" || location.pathname === "/register") {
        setIsAuthenticated(false);
        setUser(null);
        setIsLoadingAuth(false);
        return;
      }
      try {
        const userData = await checkAuthStatus();
        if (userData) {
          setIsAuthenticated(true);
          setUser(userData);
          // console.log("Initial Auth Check: User is authenticated.");
        } else {
          setIsAuthenticated(false);
          setUser(null);
          // console.log("Initial Auth Check: User is NOT authenticated.");
        }
      } catch (error: unknown) {
        console.error("Auth check failed:", error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoadingAuth(false);
      }
    };
    check();
    // Dependency array should be empty if this effect runs only once on mount,
    // or include location.pathname if you want it to re-run on route changes.
    // Given Layout.tsx handles redirection, running it once on mount is often sufficient.
  }, []);

  // 3. Login Mutation
  const loginMutation = useMutation({
    mutationFn: myLogin, // This calls the backend /token/ endpoint
    onSuccess: async (data) => {
      // console.log("Backend login (myLogin) successful:", data.message);
      // After successfully getting a token (via HttpOnly cookie),
      // immediately fetch the detailed user profile to get is_profile_setup_completed
      const userProfile = await checkAuthStatus();

      if (userProfile) {
        setIsAuthenticated(true);
        setUser(userProfile);
        queryClient.invalidateQueries(["auth"]);
        queryClient.invalidateQueries(["userProfile"]);

        // Navigate based on profile setup status
        if (userProfile.profile?.is_profile_setup_completed === false) {
          // console.log(
          //   "Login successful: Profile setup not completed, redirecting to /profile",
          // );
          navigate("/profile");
        } else {
          // console.log(
          //   "Login successful: Profile setup completed, redirecting to /home",
          // );
          navigate("/home");
        }
      } else {
        // This case should ideally not happen if login was successful and checkAuthStatus works
        // but included for robustness. Means token was set but profile couldn't be fetched.
        console.error(
          "Login successful but could not fetch user profile details.",
        );
        setIsAuthenticated(false); // Treat as unauthenticated
        setUser(null);
        navigate("/"); // Redirect to login
      }
    },
    onError: (error: any) => {
      console.error("Login failed:", error.response?.data || error.message);
      setIsAuthenticated(false);
      setUser(null);
      // Re-throw to allow LoginForm to display specific errors (e.g., "Invalid credentials")
      throw error;
    },
  });

  // 4. Logout Mutation - Refine Navigation
  const logoutMutation = useMutation({
    mutationFn: logout, // This calls the backend /logout/ endpoint
    onSuccess: () => {
      // console.log("Logout successful.");
      setIsAuthenticated(false);
      setUser(null);
      queryClient.invalidateQueries(["auth"]);
      queryClient.clear(); // Clear all cached queries on logout for a clean slate
      navigate("/");
    },
    onError: (error) => {
      console.error("Logout failed:", error);
      // Even if logout fails on server, we typically clear local state
      // and redirect to ensure a perceived logged-out state
      setIsAuthenticated(false);
      setUser(null);
      navigate("/");
    },
  });

  const loginUser = async (username: string, password: string) => {
    return loginMutation.mutateAsync({ username, password });
  };

  const logoutUser = async () => {
    return logoutMutation.mutateAsync();
  };

  // Provide the correct context values
  const contextValue = {
    isAuthenticated,
    user,
    isLoadingAuth,
    loginUser,
    logoutUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {/* While loading, you might show a splash screen or loading indicator */}
      {isLoadingAuth ? <div>Loading authentication...</div> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
