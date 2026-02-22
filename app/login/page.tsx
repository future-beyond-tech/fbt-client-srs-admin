// ✅ Made fully responsive (mobile → tablet → desktop) - Functionality untouched
"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { loginSchema, type LoginFormValues } from "@/lib/validations/auth";
import { setAuthSession } from "@/lib/auth/storage";
import { parseUserFromJwt } from "@/lib/auth/jwt-claims";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormError } from "@/components/ui/form-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/providers/toast-provider";
import { getApiErrorMessage } from "@/lib/api/error-message";

interface LoginResponse {
  token?: string;
  user?: {
    username?: string;
    role?: string;
  };
  message?: string;
}

function LoginPageContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showSessionExpiredMessage, setShowSessionExpiredMessage] = useState(false);

  useEffect(() => {
    if (searchParams.get("session_expired") === "1") {
      setShowSessionExpiredMessage(true);
      if (typeof window !== "undefined") {
        window.history.replaceState({}, "", "/login");
      }
    }
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setServerError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
        credentials: "include",
      });

      const payload = (await response.json().catch(() => null)) as LoginResponse | null;

      if (!response.ok) {
        throw new Error(
          typeof payload?.message === "string" && payload.message.trim()
            ? payload.message
            : "Login failed. Please try again.",
        );
      }

      if (!payload?.token || typeof payload.token !== "string") {
        throw new Error("Login token not found in response.");
      }

      const derivedUser = parseUserFromJwt(payload.token);

      setAuthSession(payload.token, {
        username:
          typeof payload.user?.username === "string" && payload.user.username.trim()
            ? payload.user.username
            : derivedUser.username,
        role:
          typeof payload.user?.role === "string" && payload.user.role.trim()
            ? payload.user.role
            : derivedUser.role,
      });

      toast({
        title: "Welcome back",
        description: "Login successful.",
        variant: "success",
      });

      window.location.assign("/dashboard");
    } catch (error: unknown) {
      const message = getApiErrorMessage(error, "Login failed. Please try again.");
      setServerError(message);
    }
  };

  return (
    <div className="flex min-h-screen min-h-[100dvh] items-center justify-center px-4 py-6 sm:p-6 lg:p-8">
      <Card className="w-full max-w-md border-t-4 border-t-primary shadow-soft">
        <CardHeader className="space-y-1 px-4 pb-4 pt-6 sm:p-6">
          <CardTitle className="text-center text-xl text-primary sm:text-2xl">
            Shree Raamalingam Sons
          </CardTitle>
          <p className="text-center text-sm text-muted-foreground">
            Sign in to admin dashboard
          </p>
        </CardHeader>
        <CardContent className="px-4 pb-6 sm:px-6">
          {showSessionExpiredMessage && (
            <div
              role="alert"
              className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
            >
              Your session has expired. Please sign in again to continue.
            </div>
          )}
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="Enter username"
                className="min-h-touch"
                autoComplete="username"
                {...register("username")}
              />
              <FormError message={errors.username?.message} />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  className="min-h-touch pr-11"
                  autoComplete="current-password"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-1 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <FormError message={errors.password?.message} />
            </div>

            <FormError message={serverError} />

            <Button
              type="submit"
              className="min-h-touch w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in..." : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
