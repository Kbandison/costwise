import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center text-center px-6">
      <h1
        className="text-8xl font-bold text-gradient mb-4"
        style={{ fontFamily: "var(--font-display-family)" }}
      >
        404
      </h1>
      <p className="text-lg text-[var(--text-secondary)] mb-8">
        This page doesn&apos;t exist.
      </p>
      <Link href="/" className="btn-primary">
        Back to home
      </Link>
    </div>
  );
}
