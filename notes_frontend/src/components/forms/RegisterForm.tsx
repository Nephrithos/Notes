"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link } from "react-router";
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
import { myRegister } from "../../services/auth.ts";
import { ModeToggle } from "../ui/mode-toggle.tsx";

const formSchema = z
  .object({
    email: z
      .string()
      .min(5, { message: "This field has to be filled" })
      .email("This is not a vaild email."),
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
    password2: z.string().min(1, { message: "This is required" }),
  })
  .refine((data) => data.password === data.password2, {
    // <--- Zod Refine for password match
    message: "Passwords do not match.",
    path: ["password2"],
  });

type RegistrationFormValues = z.infer<typeof formSchema>;

export function RegistrationForm() {
  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      username: "",
      password: "",
      password2: "",
    },
    mode: "onChange",
  });

  const onSubmit = async (values: RegistrationFormValues) => {
    try {
      await myRegister(
        values.email,
        values.username,
        values.password,
        values.password2,
      );
      // console.log(values);

      // console.log("Form clicked");
    } catch (error) {
      console.error("Login failed:", error.response?.data || error.message);
      return null;
    }
  };

  return (
    <>
      <div className="p-4 max-w-2xl mx-auto flex justify-center">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Sign Up to Notes</CardTitle>
            <CardDescription></CardDescription>
            <CardAction>
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
                  <FormField
                    control={form.control}
                    name="email" // Matches the Zod schema field name
                    render={({ field }) => (
                      <FormItem className="grid gap-2">
                        <FormLabel htmlFor="email">Email</FormLabel>{" "}
                        {/* Use htmlFor */}
                        <FormControl>
                          <Input
                            id="email" // Connects Label to Input
                            type="text"
                            placeholder="Enter Your Email"
                            required
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem className="grid gap-2">
                        <FormLabel htmlFor="username">Username</FormLabel>{" "}
                        <FormControl>
                          <Input
                            id="username"
                            type="text"
                            placeholder="Enter Your Username"
                            required
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem className="grid gap-2">
                        <div className="flex items-center">
                          <FormLabel htmlFor="password">
                            Password
                          </FormLabel>{" "}
                        </div>
                        <FormControl>
                          <Input
                            id="password"
                            type="password"
                            required
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password2"
                    render={({ field }) => (
                      <FormItem className="grid gap-2">
                        <div className="flex items-center">
                          <FormLabel htmlFor="password2">
                            Confirm Password
                          </FormLabel>
                        </div>
                        <FormControl>
                          <Input
                            id="password2"
                            type="password"
                            required
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit" className="w-full">
                  Sign Up
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <Button variant="outline" className="w-full">
              <Link to="/">Back to Login</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}

export default RegistrationForm;
