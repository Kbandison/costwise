import Link from "next/link";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-950 via-black to-black">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-purple-500">404</h1>
          <h2 className="mt-4 text-3xl font-semibold text-white">
            Page Not Found
          </h2>
          <p className="mt-2 text-gray-400">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-3 font-medium text-white transition-all hover:from-purple-600 hover:to-pink-700"
          >
            <Home className="h-5 w-5" />
            Go Home
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-medium text-white backdrop-blur-xl transition-all hover:border-white/20 hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5" />
            Go Back
          </Link>
        </div>
      </div>
    </div>
  );
}
