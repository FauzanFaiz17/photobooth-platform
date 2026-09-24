import { LoaderIcon } from "lucide-react";
import type { ReactElement } from "react";
import comingsoon from "../assets/coming-soon.png"
import comingsoon2 from "../assets/coming-soon2.png"

export default function RequestPage(): ReactElement {
  return (
    <main className="h-full overflow-y-hidden relative flex justify-center items-center bg-background px-5 text-foreground overflow-x-hidden antialiased selection:bg-primary selection:text-primary-foreground sm:px-8 font-['Geist_Variable',sans-serif] bg-[radial-gradient(var(--gallery-dot)_1px,transparent_1px)] bg-size-[22px_22px]  [--foreground:#513e45] [--card:#fffcf9] [--muted:#f5e9e8] [--muted-foreground:#77616a] [--border:#e9d6d7] [--primary:#a84665] [--primary-foreground:#fff9f6] [--gallery-dot:#eadbd8]  dark:[--foreground:#f8eaf0] dark:[--card:#342930] dark:[--muted:#3c3038] dark:[--muted-foreground:#c5adb8] dark:[--border:#59424d] dark:[--primary:#eeb3c4] dark:[--primary-foreground:#39212a] dark:[--gallery-dot:#44353d]">
      <div
        className="pointer-events-none absolute md:right-1/2 md:top-24 -right-12 top-24 flex rotate-12 flex-col items-center rounded-[45%_45%_42%_42%] border-2 border-dashed border-[#dec87f] bg-background md:px-6 md:py-5 px-2 py-3 text-[#795b33] lg:flex"
        aria-hidden="true"
      >
        <LoaderIcon
          className="mb-2 animate-spin size-8 md:size-10"
          strokeWidth={1.5}
        />
        <span className="text-sm font-bold animate-pulse">coming soon!</span>
      </div>
      <div className="absolute -bottom-5 -left-10 rotate-20">
        <img 
        src={comingsoon}
        alt="comingsoon"
        width={1000}
        height={1000}
        className="w-52"
        />
      </div>
      <div className="absolute top-5 -right-10 rotate-20">
        <img 
        src={comingsoon2}
        alt="comingsoon"
        width={1000}
        height={1000}
        className="w-52"
        />
      </div>
      <div className="relative z-10 max-w-3xl space-y-10">
        <div className="space-y-6">
          <h1 className="text-[clamp(2.5rem,6vw,4.5rem)] font-extrabold leading-[1.12] tracking-[-0.055em] font-[ui-rounded,'Geist_Variable',sans-serif] text-center">
            Segera Hadir <br />{" "}
            <span className="text-primary">Fitur Berikutnya.</span>
          </h1>
        </div>

        <div className="flex items-center justify-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="block size-3 border border-border shadow-[0_1px_0_var(--border)] animate-bounce transition duration-200 rounded-full bg-primary"
              style={{ animationDelay: `${i * 0.15}s` }}
              aria-hidden="true"
            />
          ))}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute left-1/2 top-1/2 h-150 w-150 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#fafaf9]/[0.03] blur-3xl" />
      </div>
    </main>
  );
}
