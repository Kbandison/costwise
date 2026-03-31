"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Error boundary caught:", error);
  }, [error]);

  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-6">
      <div className="max-w-lg rounded-2xl border border-[var(--lux-border)] bg-[var(--bg-secondary)] p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>

        <h1
          className="text-2xl font-bold text-[var(--text-primary)] mb-2"
          style={{ fontFamily: "var(--font-display-family)" }}
        >
          Something went wrong
        </h1>
        <p className="text-[var(--text-secondary)] text-sm mb-6">
          An unexpected error occurred. Please try again.
        </p>

        {error.message && (
          <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-left">
            <p className="text-sm text-red-400">{error.message}</p>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button onClick={reset} className="btn-primary">
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          <Link href="/" className="btn-secondary">
            <Home className="w-4 h-4" />
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
