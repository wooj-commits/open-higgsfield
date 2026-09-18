"use client";

import { useState, type FormEvent } from "react";

function safeNext(path: string): string {
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("://")) return "/";
  return path;
}

export function SignInForm({ nextPath, missing }: { nextPath: string; missing: string[] }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const blocked = missing.length > 0;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (blocked) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password, next: safeNext(nextPath) }),
      });
      const payload = (await response.json()) as { error?: string; next?: string };
      if (!response.ok) {
        setError(payload.error ?? "Could not sign in");
        return;
      }
      window.location.assign(safeNext(payload.next ?? nextPath));
    } catch {
      setError("Could not reach the studio");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="ohf-signin-card" onSubmit={(event) => void onSubmit(event)}>
      {blocked ? (
        <p className="ohf-signin-alert" role="alert">
          Sign-in is off until these environment variables are set: {missing.join(", ")}. There is no
          default password.
        </p>
      ) : (
        <>
          <label className="ohf-signin-field">
            <span>Username</span>
            <input
              name="username"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </label>
          <label className="ohf-signin-field">
            <span>Password</span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={12}
            />
          </label>
          {error && (
            <p className="ohf-signin-alert" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="ohf-signin-submit" disabled={busy}>
            {busy ? "Signing in…" : "Enter the studio"}
          </button>
        </>
      )}
    </form>
  );
}
