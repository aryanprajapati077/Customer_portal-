"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
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
import {
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  AlertCircle,
  Sparkles,
  Shield,
  Recycle,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

function FloatingParticle({
  delay,
  size,
  left,
  duration,
}: {
  delay: number;
  size: number;
  left: number;
  duration: number;
}) {
  return (
    <div
      className="absolute opacity-20"
      style={{
        left: `${left}%`,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
      }}
    >
      <div className="animate-float-up" style={{ width: size, height: size }}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="w-full h-full text-primary"
        >
          <rect
            x="6"
            y="2"
            width="12"
            height="18"
            rx="2"
            fill="currentColor"
            opacity="0.3"
          />
          <rect x="8" y="2" width="8" height="4" fill="currentColor" />
          <circle cx="12" cy="21" r="2" fill="currentColor" opacity="0.5" />
        </svg>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const result = await login(email, password);

    if (result.success) {
      router.push("/dashboard");
    } else {
      setError(result.error || "Login failed");
    }

    setIsLoading(false);
  };

  const fillDemoCredentials = () => {
    setEmail("demo@buffindia.com");
    setPassword("demo123");
    setShowDemo(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Custom animation styles */}
      <style jsx>{`
        @keyframes float-up {
          0% {
            transform: translateY(100vh) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.2;
          }
          90% {
            opacity: 0.2;
          }
          100% {
            transform: translateY(-100px) rotate(360deg);
            opacity: 0;
          }
        }
        .animate-float-up {
          animation: float-up linear infinite;
        }
        @keyframes pulse-ring {
          0% {
            transform: scale(0.8);
            opacity: 0.5;
          }
          50% {
            transform: scale(1.2);
            opacity: 0;
          }
          100% {
            transform: scale(0.8);
            opacity: 0.5;
          }
        }
        .animate-pulse-ring {
          animation: pulse-ring 3s ease-in-out infinite;
        }
      `}</style>

      {/* Animated Background with floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-primary/5 to-secondary/5 rounded-full blur-3xl" />

        {/* Floating cigarette butt particles transforming */}
        {[...Array(12)].map((_, i) => (
          <FloatingParticle
            key={i}
            delay={i * 1.5}
            size={20 + Math.random() * 20}
            left={Math.random() * 100}
            duration={15 + Math.random() * 10}
          />
        ))}
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo with pulse effect */}
        <Link
          href="/"
          className="flex items-center justify-center gap-3 mb-8 group"
        >
          <div className="relative">
            <div className="absolute -inset-4 rounded-full bg-primary/20 animate-pulse-ring" />
            <div className="w-14 h-14 flex items-center justify-center transition-all duration-500 group-hover:scale-110">
              <Image
                src="/logo.svg"
                alt="Buffindia Logo"
                width={56}
                height={56}
                className="w-full h-full object-contain"
              />
            </div>
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

        {/* Feature badges */}
        <div className="flex justify-center gap-3 mb-6">
          {[
            { icon: Recycle, label: "Sustainable" },
            { icon: Shield, label: "Secure" },
            { icon: Sparkles, label: "Real-time" },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50"
            >
              <item.icon className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* Login Card */}
        <Card className="glass border-border/50 shadow-2xl backdrop-blur-xl">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
              Customer Portal
            </CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              Sign in to track your sustainability impact
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-sm border border-destructive/20">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 bg-muted/50 border-border/50 focus:border-primary focus:ring-primary/20 rounded-xl"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <PasswordInput
                      id="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 h-12 bg-muted/50 border-border/50 focus:border-primary focus:ring-primary/20 rounded-xl"
                      required
                    />
                  </div>
                </div>
                <p className="text-right text-sm">
                  <Link
                    href="/forgot-password"
                    className="text-primary font-medium hover:underline"
                  >
                    Forgot password?
                  </Link>
                </p>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground hover:from-primary/95 hover:to-primary/85 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 rounded-xl text-base font-semibold group"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Sign In to Dashboard
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>

            {/* Demo Credentials Section */}
            <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-secondary/10 to-primary/10 border border-border/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">
                  Try Demo Account
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-primary hover:text-primary/80"
                  onClick={fillDemoCredentials}
                >
                  Use Demo
                </Button>
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>
                  <span className="font-medium">Email:</span> demo@buffindia.com
                </p>
                <p>
                  <span className="font-medium">Password:</span> demo123
                </p>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-muted/30 border border-border/30">
              <p className="text-xs text-muted-foreground text-center">
                Admin?{" "}
                <Link
                  href="/setup"
                  className="text-primary font-medium hover:underline"
                >
                  View Google Sheets Setup Guide
                </Link>
              </p>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link
                  href="/#contact"
                  className="text-primary font-medium hover:underline"
                >
                  Contact us
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
