"use client";

export function MeshBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -left-1/4 top-0 h-[280px] w-[280px] rounded-full bg-violet-600/20 blur-[80px] sm:h-[420px] sm:w-[420px] sm:blur-[100px] lg:h-[600px] lg:w-[600px] lg:blur-[120px]" />
      <div className="absolute -right-1/4 top-1/3 h-[240px] w-[240px] rounded-full bg-indigo-600/15 blur-[70px] sm:h-[360px] sm:w-[360px] sm:blur-[90px] lg:h-[500px] lg:w-[500px] lg:blur-[100px]" />
      <div className="absolute bottom-0 left-1/3 h-[200px] w-[200px] rounded-full bg-fuchsia-600/10 blur-[70px] sm:h-[300px] sm:w-[300px] sm:blur-[90px] lg:h-[400px] lg:w-[400px] lg:blur-[100px]" />
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}
