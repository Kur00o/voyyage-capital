import { useEffect, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
// 
type NavLink = {
  label: string;
  to?: string;
  href?: string;
  router?: boolean;
  button?: boolean;
};

const links: NavLink[] = [
  { to: "/#about", label: "About" },
  { to: "/#philosophy", label: "Philosophy" },
  { to: "/#plans", label: "Plans" },
  { to: "/#start", label: "Get Started" },
  { href: "https://insightpier.com/analyst/varunsontakke/articles/manage", label: "Blogs" },
  { to: "/analytics", label: "Terminal", router: true, button: true },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [overLight, setOverLight] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === "/";

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
      // detect light section beneath nav
      const el = document.elementFromPoint(window.innerWidth / 2, 40);
      const section = el?.closest("[data-section]") as HTMLElement | null;
      setOverLight(section?.dataset.section === "light" || !isHome);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  const dark = !overLight;
  const textColor = dark ? "text-[var(--text-on-dark)]" : "text-[#1A1A1A]";
  const wordmarkColor = dark ? "text-[var(--text-on-dark)]" : "text-[var(--navy)]";

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500`}
      style={{
        backdropFilter: scrolled ? "blur(12px)" : "none",
        background: scrolled
          ? dark
            ? "rgba(13,27,42,0.85)"
            : "rgba(255,255,255,0.85)"
          : "transparent",
        borderBottom: scrolled ? `1px solid ${dark ? "rgba(201,169,110,0.08)" : "rgba(27,43,75,0.08)"}` : "1px solid transparent",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <img src="/logo.png" alt="Voyyage Logo" className="h-12 w-auto object-contain" />
        </Link>

        <nav className="hidden md:flex items-center gap-10">
          {links.map((l) =>
            l.button && l.to ? (
              <Link
                key={l.to}
                to={l.to}
                className="rounded-[4px] bg-[#c9a96e] px-5 py-2.5 text-[13px] font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#b8945c]"
              >
                {l.label}
              </Link>
            ) : l.router && l.to ? (
              <Link key={l.to} to={l.to} className={`nav-link font-medium ${textColor}`}>
                {l.label}
              </Link>
            ) : l.href ? (
              <a key={l.href} href={l.href} target="_blank" rel="noreferrer" className={`nav-link font-medium ${textColor}`}>
                {l.label}
              </a>
            ) : (
              <a key={l.to} href={l.to} className={`nav-link font-medium ${textColor}`}>
                {l.label}
              </a>
            ),
          )}
        </nav>

        <button
          onClick={() => setOpen(true)}
          className={`md:hidden nav-link ${textColor}`}
        >
          menu
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-y-0 right-0 w-full max-w-sm bg-[var(--navy)] z-50 p-10 flex flex-col gap-8"
          >
            <button onClick={() => setOpen(false)} className="nav-link text-[var(--text-on-dark)] self-end">close</button>
            {links.map((l) =>
              l.router && l.to ? (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className="font-display text-3xl text-[var(--text-on-dark)]"
                >
                  {l.label}
                </Link>
              ) : l.href ? (
                <a
                  key={l.href}
                  href={l.href}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setOpen(false)}
                  className="font-display text-3xl text-[var(--text-on-dark)]"
                >
                  {l.label}
                </a>
              ) : (
                <a
                  key={l.to}
                  href={l.to}
                  onClick={() => setOpen(false)}
                  className="font-display text-3xl text-[var(--text-on-dark)]"
                >
                  {l.label}
                </a>
              ),
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
