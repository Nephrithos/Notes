import api from "./api"; // Ensure your Axios instance 'api' is correctly imported
import type { Theme } from "@/components/ui/theme-provider"; // Import Theme type from your provider

// Define a type for your user profile data
export interface UserProfileData {
  username: string;
  email: string;
  first_name?: string | null; // Mark as optional/nullable if they can be null/empty
  last_name?: string | null; // Mark as optional/nullable
  profile?: {
    // Assuming 'profile' is a nested object from your Django serializer
    first_name: string | null;
    last_name: string | null;
    mode_preference: Theme | null;
  } | null;
}

// Function to fetch current user profile
export const fetchUserProfile = async (): Promise<UserProfileData> => {
  try {
    // Adjust this URL to match your Django backend endpoint (e.g., /api/user/profile/)
    const response = await api.get<UserProfileData>("/user/profile/");
    return response.data;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
};

// Function to update user profile
export const updateProfile = async (
  profileData: Partial<UserProfileData>,
): Promise<UserProfileData> => {
  try {
    // Use PATCH for partial updates, PUT if sending the entire object
    // Adjust this URL to match your Django backend endpoint
    const response = await api.patch<UserProfileData>(
      "/user/profile/",
      profileData,
    );
    return response.data;
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

// You might also add a specific function for just mode preference if useful elsewhere
export const updateProfileModePreference = async (
  modePreference: Theme,
): Promise<UserProfileData> => {
  try {
    const response = await api.patch<UserProfileData>("/user/profile/", {
      profile: {
        // This structure must match what your Django serializer expects for PATCH
        mode_preference: modePreference,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error updating mode preference:", error);
    throw error;
  }
};
