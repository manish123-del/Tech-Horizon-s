import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { supabase } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Support AI Assistant",
  description: "AI Voice Assistant and Customer Support Chatbot"
};

function Header() {
  const user = useUser();

  async function handleLogout() {
    await supabase.auth.signOut();
    // page will re-render via auth listener
  }

  return (
    <header className="flex items-center justify-between p-4 border-b border-neutral-800">
      <Link href="/">
        <h1 className="text-xl font-bold">Support AI</h1>
      </Link>
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <span className="text-sm">{user.email}</span>
            <button onClick={handleLogout} className="text-sm underline">
              Logout
            </button>
          </>
        ) : (
          <Link href="/login" className="text-sm underline">
            Login
          </Link>
        )}
        <button
          aria-label="Toggle dark mode"
          onClick={() => document.documentElement.classList.toggle("light")}
          className="text-sm"
        >
          🌙/☀️
        </button>
      </div>
    </header>
  );
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-black text-white">
        <Header />
        {children}
      </body>
    </html>
  );
}
