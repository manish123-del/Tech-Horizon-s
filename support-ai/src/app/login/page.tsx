"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else router.push("/");
    setLoading(false);
  }

  async function handleGoogle() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google" });
    if (error) setError(error.message);
    setLoading(false);
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-bold mb-4">Sign in</h1>
      {error && <p className="text-red-500 mb-2">{error}</p>}
      <form onSubmit={handleLogin} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded border border-neutral-700 bg-neutral-900 p-2"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded border border-neutral-700 bg-neutral-900 p-2"
        />
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Loading..." : "Login"}
        </Button>
      </form>
      <hr className="my-4" />
      <Button onClick={handleGoogle} variant="secondary" className="w-full">
        Continue with Google
      </Button>
    </main>
  );
}
