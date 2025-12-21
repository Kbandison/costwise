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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-950 via-black to-black">
      <div className="glass-card max-w-lg rounded-2xl border border-white/10 p-8 text-center backdrop-blur-xl">
        <div className="mb-6">
          <AlertTriangle className="mx-auto h-16 w-16 text-red-500" />
        </div>

        <h1 className="mb-2 text-3xl font-bold text-white">
          Something went wrong
        </h1>
        <p className="mb-6 text-gray-400">
          An unexpected error occurred. Please try again or return to the home
          page.
        </p>

        {error.message && (
          <div className="mb-6 rounded-lg bg-red-500/10 p-4 text-left">
            <p className="text-sm text-red-400">{error.message}</p>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-3 font-medium text-white transition-all hover:from-purple-600 hover:to-pink-700"
          >
            <RefreshCw className="h-5 w-5" />
            Try Again
          </button>

          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-medium text-white transition-all hover:border-white/20 hover:bg-white/10"
          >
            <Home className="h-5 w-5" />
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
