
export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-cignalRed flex flex-col items-center justify-center text-white gap-6">
      {/* ▼ CHANGE LOADING TITLE HERE */}
      <h1 className="text-3xl md:text-4xl font-bold tracking-wide">
        Descallar Satellite Services
      </h1>
      <p className="text-sm md:text-base text-red-100">
        Loading Preparing your dashboard...
      </p>
      <div className="flex gap-2">
        <span className="h-2 w-2 rounded-full bg-white animate-bounce [animation-delay:-0.3s]" />
        <span className="h-2 w-2 rounded-full bg-white animate-bounce [animation-delay:-0.15s]" />
        <span className="h-2 w-2 rounded-full bg-white animate-bounce" />
      </div>
    </div>
  );
}
