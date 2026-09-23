import type { ReactElement } from "react";

export default function RequestPage(): ReactElement {
  return (
    <main className="relative flex h-full  flex-col items-center justify-center overflow-hidden  px-6 text-center">
      <div className="relative z-10 max-w-3xl space-y-10">
        <div className="space-y-6">
          <p className="text-xs font-semibold uppercase tracking-[0.25em]">
            Segera Hadir
          </p>
          <h1 className="text-5xl font-bold leading-[0.95] tracking-tight  sm:text-7xl lg:text-8xl">
            Fitur Berikutnya
          </h1>
          <p className="mx-auto max-w-lg text-base leading-relaxed  sm:text-lg">
            Kami sedang menyiapkan sesuatu yang istimewa untuk pengalaman
            photobooth Anda. Tetap tunggu.
          </p>
        </div>

        <div className="flex items-center justify-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="block size-1.5 rounded-full bg-[#fafaf9]/20"
              aria-hidden="true"
            />
          ))}
        </div>
      </div>

      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
      >
        <div className="absolute left-1/2 top-1/2 h-150 w-150 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#fafaf9]/[0.03] blur-3xl" />
      </div>
    </main>
  );
}
