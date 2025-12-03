import React, { useEffect, useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { ModeToggle } from "@/components/ui/mode-toggle"; // Adjust path if necessary
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronLeft, UserIcon } from "lucide-react";

// Import your logout function from auth.ts
import { logout } from "../../services/auth";
// Import fetchUserProfile from user.ts for authentication checking
import { fetchUserProfile } from "../../services/user";

export function Layout() {
    const navigate = useNavigate();

    // Keep this useEffect to ensure only authenticated users can access routes wrapped by this Layout
    useEffect(() => {
        const checkAuthAndRedirect = async () => {
            try {
                const userProfile = await fetchUserProfile();
                // If userProfile is null, it means the user is not authenticated.
                // Redirect to the login page.
                if (!userProfile) {
                    navigate("/"); // Redirect to login/home if not authenticated
                }
            } catch (error) {
                console.error("Auth check in Layout failed:", error);
                // On any error during profile fetch (e.g., 401 Unauthorized), redirect to login.
                navigate("/");
            }
        };

        checkAuthAndRedirect();
    }, [navigate]); // Add navigate to the dependency array

    const handleLogout = async () => {
        try {
            await logout(); // Call your logout API/function
            navigate("/"); // Redirect to login/home page after logout
        } catch (error) {
            console.error("Logout failed:", error);
            alert("Logout failed. Please try again."); // Provide user feedback
        }
    };

    const handleProfileClick = () => {
        navigate("/profile"); // Navigate to the user profile page
    };

    const handleGoBack = () => {
        navigate(-1); // Navigates one step back in history
    };

    return (
        <div className="flex flex-col min-h-screen">
            {/* Fixed Header */}
            <header className="fixed top-0 left-0 right-0 z-50 p-4 bg-background border-b flex justify-between items-center shadow-sm">
                {/* Back Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleGoBack}
                    className="rounded-full"
                >
                    <ChevronLeft className="h-6 w-6" />
                    <span className="sr-only">Go Back</span>
                </Button>

                {/* Right-aligned content: Dropdown and ModeToggle */}
                <div className="flex items-center gap-3">
                    {/* REMOVED: Welcome message here */}

                    {/* User Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full"
                            >
                                <UserIcon className="h-5 w-5" />
                                <span className="sr-only">User menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>My Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleProfileClick}>
                                Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleLogout}>
                                Log out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* ModeToggle Component */}
                    <ModeToggle />
                </div>
            </header>

            {/* Main Content Area */}
            {/* Add padding-top to ensure content is not hidden behind the fixed header */}
            <main className="flex-grow pt-20">
                <Outlet />{" "}
                {/* This is where the specific page content will be rendered */}
            </main>
        </div>
    );
}
