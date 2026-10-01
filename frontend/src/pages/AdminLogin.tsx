import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Lock } from "lucide-react";
import { apiPost, ApiError } from "@/lib/api";
import { formatApiError, type AdminUser } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminLogin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: () => apiPost<AdminUser>("/auth/login", { email: email.trim(), password }),
    onSuccess: (user) => {
      queryClient.setQueryData(["auth-me"], user);
      navigate("/admin");
    },
    onError: (e) => {
      setError(
        e instanceof ApiError
          ? formatApiError((e.body as { detail?: unknown } | null)?.detail)
          : "Login failed. Please try again.",
      );
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-obsidian px-6" data-testid="admin-login-page">
      <div className="grain-overlay pointer-events-none fixed inset-0 opacity-[0.05] mix-blend-overlay" />
      <div className="w-full max-w-md">
        <div className="mb-10 flex flex-col items-center gap-4 text-center">
          <Logo />
          <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-500">
            <Lock className="h-3 w-3 text-gold" /> Studio Admin Access
          </p>
        </div>

        <form
          className="rounded-2xl border border-border bg-panel p-8"
          data-testid="admin-login-form"
          onSubmit={(e) => {
            e.preventDefault();
            setError("");
            mutation.mutate();
          }}
        >
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="admin-email">Email</Label>
              <Input
                id="admin-email"
                type="email"
                autoComplete="username"
                placeholder="cropcreation1@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="admin-login-email-input"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password">Password</Label>
              <Input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="admin-login-password-input"
                required
              />
            </div>
          </div>

          {error && (
            <p className="mt-4 rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-2.5 text-sm text-red-300" data-testid="admin-login-error">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={mutation.isPending || !email || !password}
            className="mt-7 w-full rounded-full bg-gold py-6 text-sm font-semibold text-obsidian transition-transform duration-300 hover:scale-[1.02] hover:bg-gold-bright active:scale-95 disabled:opacity-50"
            data-testid="admin-login-submit-button"
          >
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
          </Button>
        </form>

        <p className="mt-6 text-center">
          <Link to="/" className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500 transition-colors hover:text-gold-soft" data-testid="admin-login-back-link">
            ← Back to site
          </Link>
        </p>
      </div>
    </div>
  );
}
