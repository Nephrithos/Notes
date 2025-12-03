"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/context/AuthContext"; // Keep useAuth
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom"; // CORRECTED: Import Link from react-router-dom
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
// import { myLogin } from "../../services/auth.ts"; // REMOVED: myLogin is called within AuthContext's loginUser
import { ModeToggle } from "../ui/mode-toggle.tsx";

const formSchema = z.object({
  username: z
    .string()
    .min(2, {
      message: "Username must be at least 2 characters.",
    })
    .max(100, {
      message: "Username must not exceed 100 characters.",
    }),
  password: z
    .string()
    .min(6, {
      message: "Password must be at least 6 characters.",
    })
    .max(30, {
      message: "Password must not exceed 30 characters.",
    }),
});

type LoginFormValues = z.infer<typeof formSchema>;

export function LoginForm() {
  const { loginUser } = useAuth(); // Keep this as it's the interface to your auth logic
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
    mode: "onChange",
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      // loginUser will now handle calling myLogin, fetching user profile,
      // and redirecting based on is_profile_setup_completed.
      await loginUser(values.username, values.password);
      // No need for navigate('/') here, as loginUser in AuthContext will handle it.
    } catch (error: any) { // Add :any to error to access properties safely
      console.error("Login failed:", error.response?.data || error.message);
      // You might want to display a user-friendly error message here
      // For example, using a toast notification or setting a form error.
      form.setError("root.serverError", {
        message: error.response?.data?.detail ||
          "Login failed. Please check your credentials.",
      });
    }
  };

  return (
    <>
      <div className="p-4 max-w-2xl mx-auto flex justify-center">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Login to your account</CardTitle>
            <CardDescription>
              Enter your credentials below to log in to your account.
            </CardDescription>
            <CardAction>
              {/* Assuming CardAction is a custom component, otherwise remove or replace */}
              <ModeToggle />
            </CardAction>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="flex flex-col gap-6">
                  {/* --- Username Field --- */}
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem className="grid gap-2">
                        <FormLabel htmlFor="username">Username</FormLabel>
                        <FormControl>
                          <Input
                            id="username"
                            type="text"
                            placeholder="your_username"
                            required
                            {...field}
                          />
                        </FormControl>
                        <FormMessage /> {/* Displays validation errors */}
                      </FormItem>
                    )}
                  />
                  {/* --- Password Field --- */}
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem className="grid gap-2">
                        <div className="flex items-center">
                          <FormLabel htmlFor="password">Password</FormLabel>
                          <Link
                            to="/forgot-password"
                            className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                          >
                            Forgot your password?
                          </Link>
                        </div>
                        <FormControl>
                          <Input
                            id="password"
                            type="password"
                            required
                            {...field}
                          />
                        </FormControl>
                        <FormMessage /> {/* Displays validation errors */}
                      </FormItem>
                    )}
                  />
                </div>
                {/* Display server-side errors */}
                {form.formState.errors.root?.serverError && (
                  <p className="text-red-500 text-sm">
                    {form.formState.errors.root.serverError.message}
                  </p>
                )}
                {/* --- Submit Button within the form --- */}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? "Logging in..." : "Login"}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex-col gap-2">
            {/* --- "Sign Up" Button (outside the login form's submit flow) --- */}
            <Button variant="outline" className="w-full" asChild>
              {/* Add asChild here */}
              <Link to="/register">Sign Up</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}

export default LoginForm;
