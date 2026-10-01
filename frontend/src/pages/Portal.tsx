import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, UserRound } from "lucide-react";
import { apiPost, ApiError } from "@/lib/api";
import { formatApiError, type SessionUser } from "@/lib/auth";
import { SITE } from "@/lib/site";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Portal() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");

  const goHome = (user: SessionUser) => {
    queryClient.setQueryData(["auth-me"], user);
    toast.success(`Welcome, ${user.name}!`);
    navigate(user.role === "admin" ? "/admin" : "/my-photos");
  };

  const onError = (e: unknown) => {
    setError(
      e instanceof ApiError
        ? formatApiError((e.body as { detail?: unknown } | null)?.detail)
        : "Something went wrong. Please try again.",
    );
  };

  const loginMutation = useMutation({
    mutationFn: () => apiPost<SessionUser>("/auth/login", { email: loginForm.email.trim(), password: loginForm.password }),
    onSuccess: goHome,
    onError,
  });

  const registerMutation = useMutation({
    mutationFn: () =>
      apiPost<SessionUser>("/auth/register", {
        name: registerForm.name.trim(),
        email: registerForm.email.trim(),
        password: registerForm.password,
      }),
    onSuccess: goHome,
    onError,
  });

  const pending = loginMutation.isPending || registerMutation.isPending;

  return (
    <div className="flex min-h-screen items-center justify-center bg-obsidian px-6 py-12" data-testid="portal-page">
      <div className="grain-overlay pointer-events-none fixed inset-0 opacity-[0.05] mix-blend-overlay" />
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <Link to="/" data-testid="portal-brand-link">
            <Logo />
          </Link>
          <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-500">
            <UserRound className="h-3 w-3 text-gold" /> Client Portal — your photos &amp; films
          </p>
        </div>

        <Tabs defaultValue="signin" onValueChange={() => setError("")}>
          <TabsList className="w-full border border-border bg-panel" data-testid="portal-tabs">
            <TabsTrigger value="signin" className="flex-1" data-testid="portal-tab-signin">
              Sign In
            </TabsTrigger>
            <TabsTrigger value="register" className="flex-1" data-testid="portal-tab-register">
              Create Account
            </TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <form
              className="mt-5 rounded-2xl border border-border bg-panel p-8"
              data-testid="portal-login-form"
              onSubmit={(e) => {
                e.preventDefault();
                setError("");
                loginMutation.mutate();
              }}
            >
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="portal-email">Email</Label>
                  <Input
                    id="portal-email"
                    type="email"
                    autoComplete="username"
                    placeholder="you@example.com"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm((f) => ({ ...f, email: e.target.value }))}
                    data-testid="portal-login-email-input"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="portal-password">Password</Label>
                  <Input
                    id="portal-password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm((f) => ({ ...f, password: e.target.value }))}
                    data-testid="portal-login-password-input"
                    required
                  />
                </div>
              </div>
              {error && (
                <p className="mt-4 rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-2.5 text-sm text-red-300" data-testid="portal-login-error">
                  {error}
                </p>
              )}
              <Button
                type="submit"
                disabled={pending || !loginForm.email || !loginForm.password}
                className="mt-7 w-full rounded-full bg-gold py-6 text-sm font-semibold text-obsidian transition-transform duration-300 hover:scale-[1.02] hover:bg-gold-bright active:scale-95 disabled:opacity-50"
                data-testid="portal-login-submit-button"
              >
                {loginMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register">
            <form
              className="mt-5 rounded-2xl border border-border bg-panel p-8"
              data-testid="portal-register-form"
              onSubmit={(e) => {
                e.preventDefault();
                setError("");
                registerMutation.mutate();
              }}
            >
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="portal-reg-name">Your name</Label>
                  <Input
                    id="portal-reg-name"
                    placeholder="Full name"
                    value={registerForm.name}
                    onChange={(e) => setRegisterForm((f) => ({ ...f, name: e.target.value }))}
                    data-testid="portal-register-name-input"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="portal-reg-email">Email</Label>
                  <Input
                    id="portal-reg-email"
                    type="email"
                    autoComplete="username"
                    placeholder="The email you shared with the studio"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm((f) => ({ ...f, email: e.target.value }))}
                    data-testid="portal-register-email-input"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="portal-reg-password">Create password</Label>
                  <Input
                    id="portal-reg-password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Minimum 6 characters"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm((f) => ({ ...f, password: e.target.value }))}
                    data-testid="portal-register-password-input"
                    required
                    minLength={6}
                  />
                </div>
              </div>
              <p className="mt-4 rounded-lg border border-gold/25 bg-gold/5 px-4 py-2.5 text-xs leading-relaxed text-gold-soft" data-testid="portal-register-hint">
                Access is approved by the studio. If your email isn&apos;t approved yet,{" "}
                <a href={SITE.whatsapp} target="_blank" rel="noreferrer" className="underline">
                  WhatsApp us
                </a>{" "}
                and we&apos;ll enable it for you.
              </p>
              {error && (
                <p className="mt-4 rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-2.5 text-sm text-red-300" data-testid="portal-register-error">
                  {error}
                </p>
              )}
              <Button
                type="submit"
                disabled={pending || !registerForm.name || !registerForm.email || registerForm.password.length < 6}
                className="mt-7 w-full rounded-full bg-gold py-6 text-sm font-semibold text-obsidian transition-transform duration-300 hover:scale-[1.02] hover:bg-gold-bright active:scale-95 disabled:opacity-50"
                data-testid="portal-register-submit-button"
              >
                {registerMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create My Account"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <p className="mt-6 text-center">
          <Link
            to="/"
            className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500 transition-colors hover:text-gold-soft"
            data-testid="portal-back-link"
          >
            ← Back to site
          </Link>
        </p>
      </div>
    </div>
  );
}
