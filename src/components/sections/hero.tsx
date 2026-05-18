import { ArrowDown, ArrowRight } from "lucide-react";

const tickers = [
  "NIFTY50 +0.8%", "RELIANCE +1.2%", "INFY -0.3%", "HDFC +2.1%", "TCS +0.6%",
  "BAJFINANCE +1.8%", "ICICIBANK +0.9%", "ADANIENT -0.5%", "SBIN +1.1%", "WIPRO +0.4%",
];

export function Hero() {
  return (
    <section data-section="dark" className="relative bg-[var(--navy)] min-h-screen flex flex-col items-center justify-center text-center px-6 pt-32 pb-16 overflow-hidden">
      <div className="max-w-4xl mx-auto">
        <div className="eyebrow mb-10">SEBI Registered · Data Driven · Quantitative</div>

        <h1 className="font-display font-light text-[var(--text-on-dark)] text-[56px] sm:text-[72px] md:text-[88px] lg:text-[96px] leading-[1.02] tracking-[-0.02em]">
          Smart money runs<br />
          on <em className="italic font-light">data.</em>
        </h1>

        <p className="mt-10 text-[18px] text-[var(--text-muted-dark)] max-w-[480px] mx-auto leading-relaxed">
          Data-driven model portfolios for India&apos;s long-term wealth.
        </p>

        <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
          <a href="#plans" className="btn-gold">Start Investing <ArrowRight size={16} /></a>
          <a href="#about" className="btn-ghost-light">Learn More <ArrowDown size={16} /></a>
        </div>
      </div>

      <div className="mt-20 w-full max-w-5xl">
        <div className="marquee">
          <div className="marquee-track">
            {[...tickers, ...tickers].map((t, i) => (
              <span key={i} className="text-xs tracking-widest text-[#475569] font-mono uppercase">
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-16 flex items-center gap-6 sm:gap-10 flex-wrap justify-center">
        {["Data Driven", "Quantitative Process", "SEBI Registered"].map((s, i, arr) => (
          <div key={s} className="flex items-center gap-6 sm:gap-10">
            <span className="text-[13px] uppercase tracking-[0.08em] text-[var(--text-on-dark)]">{s}</span>
            {i < arr.length - 1 && <span className="hidden sm:block w-px h-4 bg-[var(--gold)]" />}
          </div>
        ))}
      </div>
    </section>
  );
}
