"use client";

import type React from "react";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Lock, Loader2, AlertCircle, CheckCircle, Mail } from "lucide-react";
import Image from "next/image";

function ForgotPassContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [email, setEmail] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "valid" | "invalid">(
    "loading",
  );
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }

    fetch(`/api/auth/forgot-password/verify?token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.email) {
          setEmail(data.email);
          setStatus("valid");
        } else {
          setStatus("invalid");
        }
      })
      .catch(() => setStatus("invalid"));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/forgot-password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to reset password");
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Verifying your link...</p>
        </div>
      </div>
    );
  }

  if (status === "invalid" || !token) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-sm border border-destructive/20 mb-4">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>
                This link is invalid or has expired. Please request a new
                password reset.
              </p>
            </div>
            <Button asChild className="w-full">
              <Link href="/forgot-password">Request new link</Link>
            </Button>
            <Button asChild variant="outline" className="w-full mt-2">
              <Link href="/login">Back to login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex gap-2 p-3 rounded-xl bg-secondary/10 text-secondary text-sm border border-secondary/20 mb-4">
              <CheckCircle className="w-5 h-5 shrink-0" />
              <p>Password updated successfully. Redirecting to login...</p>
            </div>
            <Button asChild className="w-full">
              <Link href="/login">Go to login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <Link
          href="/"
          className="flex items-center justify-center gap-3 mb-8 group"
        >
          <div className="w-14 h-14 flex items-center justify-center">
            <Image
              src="/logo.svg"
              alt="Buffindia Logo"
              width={56}
              height={56}
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-3xl font-bold tracking-tight text-foreground">
              Buff<span className="text-primary">india</span>
            </span>
            <span className="text-xs text-muted-foreground -mt-1">
              Transforming Waste into Value
            </span>
          </div>
        </Link>

        <Card className="glass border-border/50 shadow-2xl backdrop-blur-xl">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-center">
              Reset password
            </CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              Set a new password for your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {email && (
              <div className="flex gap-2 p-3 rounded-xl bg-muted/50 border border-border/50 mb-4">
                <Mail className="w-5 h-5 shrink-0 text-muted-foreground" />
                <p className="text-sm">
                  Changing password for{" "}
                  <span className="font-medium text-foreground">{email}</span>
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-sm border border-destructive/20">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="newPassword">New password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <PasswordInput
                    id="newPassword"
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10 h-12 bg-muted/50 border-border/50 rounded-xl"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <PasswordInput
                    id="confirmPassword"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 h-12 bg-muted/50 border-border/50 rounded-xl"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-xl"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Reset password"
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              <Link
                href="/login"
                className="text-primary font-medium hover:underline"
              >
                Back to login
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ForgotPassPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      }
    >
      <ForgotPassContent />
    </Suspense>
  );
}
