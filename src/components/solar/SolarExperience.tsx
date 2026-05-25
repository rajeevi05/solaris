import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Lenis from "lenis";
import { SolarScene, SECTIONS } from "./SolarScene";
import { useFocus, focusStore } from "./focus";
import { EARTH_SATELLITES } from "./data";
import type { PlanetData } from "./data";

export function SolarExperience() {
  const progressRef = useRef(0);
  const [mounted, setMounted] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [manual, setManual] = useState(false);
  const [resetSignal, setResetSignal] = useState(0);
  const lenisRef = useRef<Lenis | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useFocus();

  useEffect(() => {
    setMounted(true);
    const lenis = new Lenis({
      duration: 1.4,
      smoothWheel: true,
      wheelMultiplier: 0.9,
    });
    lenisRef.current = lenis;
    let raf = 0;
    const tick = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const p = max > 0 ? window.scrollY / max : 0;
      progressRef.current = p;
      const idx = Math.min(SECTIONS.length - 1, Math.floor(p * SECTIONS.length + 0.001));
      setActiveIndex(idx);
    };
    onScroll();
    lenis.on("scroll", onScroll);

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);

  const scrollToSection = useCallback((i: number) => {
    const total = SECTIONS.length;
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    const target = (i / (total - 1)) * max;
    lenisRef.current?.scrollTo(target, { duration: 1.6 });
    focusStore.set(null);
  }, []);

  const handleReset = useCallback(() => {
    focusStore.set(null);
    setResetSignal((s) => s + 1);
  }, []);

  return (
    <div className="relative bg-black text-white">
      <div className="fixed inset-0 z-0">
        {mounted && (
          <SolarScene progressRef={progressRef} manual={manual} resetSignal={resetSignal} />
        )}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)",
          }}
        />
      </div>

      <header className="fixed top-0 left-0 right-0 z-20 px-6 md:px-10 py-5 flex items-center justify-between text-[11px] tracking-[0.3em] uppercase text-cyan-200/80 mix-blend-screen pointer-events-none">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.9)] animate-pulse" />
          <span>Solaris / Mission 0142</span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-white/60">
          <span>LAT 0.0000</span>
          <span>LON 0.0000</span>
          <span>AU {progressRefLabel(activeIndex).toFixed(2)}</span>
          {focused && <span className="text-cyan-200">TGT / {focused.toUpperCase()}</span>}
        </div>
      </header>

      <nav className="fixed right-4 md:right-6 top-1/2 -translate-y-1/2 z-30 hidden md:flex flex-col items-end gap-2 pointer-events-auto">
        {SECTIONS.map((s, i) => {
          const active = i === activeIndex;
          return (
            <button
              key={s.title}
              onClick={() => scrollToSection(i)}
              className="group flex items-center gap-3 py-1.5 pl-3 pr-1 rounded-full transition-colors hover:bg-white/[0.04]"
              aria-label={`Jump to ${s.title}`}
            >
              <span
                className={`text-[10px] tracking-[0.25em] uppercase transition-all ${
                  active
                    ? "text-cyan-200 opacity-100"
                    : "text-white/40 opacity-0 group-hover:opacity-100"
                }`}
              >
                {s.title}
              </span>
              <span
                className={`block w-2 h-2 rounded-full transition-all ${
                  active
                    ? "bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.9)] scale-125"
                    : "bg-white/25 group-hover:bg-white/60"
                }`}
              />
            </button>
          );
        })}
      </nav>

      <div ref={scrollerRef} className="relative z-10 pointer-events-none">
        {SECTIONS.map((s, i) => (
          <section
            key={s.title}
            className="relative min-h-screen w-full flex items-center px-6 md:px-16"
          >
            {!manual && !focused && (
              <SectionCard index={i} active={i === activeIndex} section={s} />
            )}
          </section>
        ))}
      </div>

      <AnimatePresence>
        {focused && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="fixed left-1/2 -translate-x-1/2 bottom-28 z-30 pointer-events-auto"
          >
            <div className="flex items-center gap-3 rounded-full bg-cyan-300/10 backdrop-blur-xl px-5 py-2.5 text-[10px] tracking-[0.3em] uppercase text-cyan-100 shadow-[0_0_24px_rgba(103,232,249,0.25)]">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-pulse" />
              Focused / {focused}
              <button
                onClick={() => setFocused(null)}
                className="ml-2 text-white/60 hover:text-white transition-colors"
              >
                Release x
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-6 left-6 z-30 flex flex-col gap-2 pointer-events-none">
        <div className="flex flex-wrap gap-2 pointer-events-auto">
          <button
            onClick={() => setManual((m) => !m)}
            className={`group flex items-center gap-3 rounded-full px-4 py-2.5 text-[10px] tracking-[0.3em] uppercase backdrop-blur-xl transition-all ${
              manual
                ? "bg-cyan-300/15 text-cyan-100 shadow-[0_0_20px_rgba(103,232,249,0.35)]"
                : "bg-white/[0.04] text-white/70 hover:text-white hover:bg-white/[0.07]"
            }`}
          >
            <span
              className={`block w-1.5 h-1.5 rounded-full ${
                manual ? "bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.9)]" : "bg-white/40"
              }`}
            />
            {manual ? "Manual / 360 deg" : "Free Flight"}
          </button>
          <button
            onClick={handleReset}
            className="group flex items-center gap-3 rounded-full bg-white/[0.04] px-4 py-2.5 text-[10px] tracking-[0.3em] uppercase text-white/70 hover:text-white hover:bg-white/[0.07] backdrop-blur-xl transition-all"
          >
            <span className="block w-1.5 h-1.5 rounded-full bg-white/50 group-hover:bg-cyan-300 transition-colors" />
            Recenter
          </button>
        </div>
        <div className="text-[9px] tracking-[0.3em] uppercase text-white/40 pl-4 max-w-[320px] leading-relaxed">
          {manual
            ? "Drag / Scroll / Right-drag / Click any body to focus"
            : "Scroll to travel / Click planets, moons, satellites, asteroids, or comets"}
        </div>
      </div>

      <AnimatePresence>
        {activeIndex === 0 && !manual && !focused && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 text-[10px] tracking-[0.4em] uppercase text-white/60 pointer-events-none"
          >
            <span>Scroll to Engage</span>
            <motion.span
              animate={{ y: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 1.6 }}
              className="block w-px h-8 bg-gradient-to-b from-cyan-300 to-transparent"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function progressRefLabel(i: number) {
  return [0, 0.39, 0.72, 1.0, 1.52, 5.2, 9.58, 19.2, 30.05, 50, 999][i] ?? 0;
}

type Section = (typeof SECTIONS)[number] & { planet?: PlanetData };

function SectionCard({
  index,
  active,
  section,
}: {
  index: number;
  active: boolean;
  section: Section;
}) {
  const isEdge = index === 0 || index >= SECTIONS.length - 2;
  const align = isEdge ? "center" : index % 2 === 0 ? "left" : "right";

  return (
    <div
      className={`w-full flex ${
        align === "center" ? "justify-center" : align === "left" ? "justify-start" : "justify-end"
      }`}
    >
      <AnimatePresence mode="wait">
        {active && (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -16, filter: "blur(6px)" }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className={`pointer-events-auto max-w-md w-full backdrop-blur-xl bg-white/[0.04] rounded-2xl p-7 md:p-8 shadow-[0_8px_60px_rgba(80,140,255,0.15)] relative overflow-hidden ${
              align === "center" ? "text-center" : ""
            }`}
          >
            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-400/10 via-transparent to-fuchsia-400/10" />
            <div className="relative">
              <div className="text-[10px] tracking-[0.4em] uppercase text-cyan-300/80">
                {section.eyebrow}
              </div>
              <h2 className="mt-3 text-4xl md:text-5xl font-light tracking-tight bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                {section.title}
              </h2>
              <p className="mt-4 text-sm md:text-base leading-relaxed text-white/70 font-light">
                {section.body}
              </p>

              {section.planet && (
                <div className="mt-6 grid grid-cols-3 gap-3">
                  {section.planet.stats.map((s: { label: string; value: string }) => (
                    <div key={s.label} className="rounded-lg bg-white/[0.03] px-3 py-2">
                      <div className="text-[9px] tracking-[0.25em] uppercase text-white/40">
                        {s.label}
                      </div>
                      <div className="mt-1 text-sm text-white/90 font-light">{s.value}</div>
                    </div>
                  ))}
                </div>
              )}

              {section.planet?.name === "Earth" && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {["Moon", ...EARTH_SATELLITES.map((s) => s.name)].map((name) => {
                    const focusKey = name === "Moon" ? "Earth / Moon" : `Earth / ${name}`;

                    return (
                      <button
                        key={name}
                        onClick={() => focusStore.set(focusKey)}
                        className="rounded-full bg-cyan-300/10 px-3 py-2 text-[9px] tracking-[0.24em] uppercase text-cyan-100 backdrop-blur-xl transition-colors hover:bg-cyan-300/20 hover:text-white"
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="mt-6 flex items-center gap-3 text-[10px] tracking-[0.3em] uppercase text-white/40">
                <span>
                  {String(index + 1).padStart(2, "0")} / {String(SECTIONS.length).padStart(2, "0")}
                </span>
                <span className="flex-1 h-px bg-gradient-to-r from-white/30 to-transparent" />
                <span className="text-cyan-300/80">Live</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
