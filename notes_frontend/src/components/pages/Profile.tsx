"use client";

import React, { useEffect, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";

import { fetchUserProfile, updateProfile } from "../../services/user";
import type { UserProfileData } from "../../services/user";
import { useTheme } from "@/components/ui/theme-provider";
import type { Theme } from "@/components/ui/theme-provider";

const profileFormSchema = z.object({
    username: z.string().min(1, { message: "Username is required." }),
    email: z.string().email({ message: "Invalid email address." }),
    first_name: z.string().max(150).nullable().optional(),
    last_name: z.string().max(150).nullable().optional(),
    mode_preference: z.enum(["light", "dark", "system"]).default("system"),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export function UserProfilePage() {
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const { setTheme: setAppTheme, theme: currentAppTheme } = useTheme();

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
            username: "",
            email: "",
            first_name: "",
            last_name: "",
            mode_preference: "system",
        },
        mode: "onChange",
    });

    useEffect(() => {
        const loadUserProfile = async () => {
            try {
                setLoading(true);
                setFetchError(null);
                const data = await fetchUserProfile();

                const formDefaults: ProfileFormValues = {
                    username: data.username,
                    email: data.email,
                    first_name: data.profile?.first_name || "",
                    last_name: data.profile?.last_name || "",
                    mode_preference: data.profile?.mode_preference ||
                        "system" as Theme,
                };

                form.reset(formDefaults);

                if (
                    formDefaults.mode_preference &&
                    formDefaults.mode_preference !== currentAppTheme
                ) {
                    setAppTheme(formDefaults.mode_preference);
                }
            } catch (err: any) {
                console.error("Failed to fetch user profile:", err);
                setFetchError(
                    err.response?.data?.detail ||
                    "Failed to load profile data. Please log in.",
                );
            } finally {
                setLoading(false);
            }
        };

        loadUserProfile();
    }, []);

    async function onSubmit(values: ProfileFormValues) {
        try {
            const dataToSend: Partial<UserProfileData> = {
                email: values.email,
                profile: {
                    first_name: values.first_name,
                    last_name: values.last_name,
                    mode_preference: values.mode_preference,
                    // --- CRUCIAL ADDITION HERE ---
                    is_profile_setup_completed: true, // <--- Explicitly tell the backend to mark as complete
                },
            };

            const updatedProfile = await updateProfile(dataToSend);
            console.log("Profile updated successfully:", updatedProfile);

            if (values.mode_preference !== currentAppTheme) {
                setAppTheme(values.mode_preference);
            }
            localStorage.setItem("vite-ui-theme", values.mode_preference);

            // Redirect to /home after successful profile update
            window.location.replace("/home");
        } catch (error: any) {
            console.error("Failed to update profile:", error);
            const errorMessage = error.response?.data?.detail ||
                error.message ||
                "An unknown error occurred while updating profile.";
            // You might want to display this errorMessage to the user (e.g., using a toast)
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen text-lg font-medium">
                Loading profile...
            </div>
        );
    }

    if (fetchError) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-red-600 text-center text-lg p-4 border border-red-300 rounded-md">
                    Error: {fetchError}
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 mt-20 max-w-xl">
            <h2 className="text-3xl font-bold mb-6 text-center">
                User Profile
            </h2>
            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                >
                    <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Username</FormLabel>
                                <FormControl>
                                    <Input {...field} disabled />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input
                                        type="email"
                                        placeholder="your@example.com"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="first_name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>First Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="John" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="last_name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Last Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Doe" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Mode Preference - Changed to Select (Dropdown) */}
                    <FormField
                        control={form.control}
                        name="mode_preference"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Theme Preference</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a theme" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="light">
                                            Light
                                        </SelectItem>
                                        <SelectItem value="dark">
                                            Dark
                                        </SelectItem>
                                        <SelectItem value="system">
                                            System
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="flex justify-end gap-2 mt-6">
                        <Button
                            type="submit"
                            disabled={form.formState.isSubmitting}
                        >
                            {form.formState.isSubmitting
                                ? "Saving..."
                                : "Save Changes"}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
