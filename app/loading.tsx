export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-950 via-black to-black">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-purple-500/20 border-t-purple-500"></div>
        </div>
        <p className="text-gray-400">Loading...</p>
      </div>
    </div>
  );
}
