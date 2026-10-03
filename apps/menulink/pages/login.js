import { useState } from "react";
export default function Login() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/sign-in/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
          callbackURL: "/dashboard/menulink",
        }),
      });
      if (!response.ok)
        throw new Error("Sign-in failed. Check your email and password.");
      window.location.assign("/dashboard/menulink");
    } catch (issue) {
      setError(issue.message);
      setBusy(false);
    }
  }
  return (
    <main className="mx-auto max-w-sm px-5 py-16">
      <h1 className="mb-6 text-3xl font-semibold">Sign in to MenuLink</h1>
      <form onSubmit={submit} className="grid gap-4">
        <label className="grid gap-2">
          Email
          <input
            name="email"
            type="email"
            autoComplete="username"
            required
            className="rounded-xl border p-3"
          />
        </label>
        <label className="grid gap-2">
          Password
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="rounded-xl border p-3"
          />
        </label>
        <button
          disabled={busy}
          className="rounded-xl bg-stone-900 p-3 text-white"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
        <p role="alert">{error}</p>
      </form>
    </main>
  );
}
