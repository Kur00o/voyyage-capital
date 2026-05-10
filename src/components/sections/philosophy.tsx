import { FadeUp } from "../motion-primitives";

const pillars = [
  {
    title: "Trend",
    body: "A good company in a bad trend is still a bad trade. We only invest in stocks in a confirmed uptrend with strong price momentum behind them. The market has to already be agreeing with the thesis before we enter.",
  },
  {
    title: "Catalyst",
    body: "Price does not move without a reason. We identify stocks with clear, data-backed growth triggers — whether that is an earnings inflection, a sector tailwind, an order book expansion, or a structural shift in the business.",
  },
  {
    title: "Entry Point",
    body: "Even the right stock at the wrong price is a mistake. This pillar ensures we are entering at a point that offers the best possible risk-to-reward, where the upside is meaningful and the downside is defined.",
  },
];

export function Philosophy() {
  return (
    <section id="philosophy" data-section="dark" className="bg-[var(--navy)] py-32 md:py-40 px-6 md:px-10">
      <div className="max-w-6xl mx-auto text-center">
        <FadeUp>
          <div className="eyebrow mb-6">Our Framework</div>
          <h2 className="font-display font-light text-[var(--text-on-dark)] text-[44px] md:text-[56px] leading-[1.05] tracking-tight">
            The Voyyage Vector Framework.
          </h2>
        </FadeUp>

        <FadeUp delay={0.1}>
          <p className="mt-10 text-[17px] text-[var(--text-muted-dark)] max-w-[640px] mx-auto leading-[1.8]">
            A vector in mathematics has two properties: Direction and Magnitude. Exactly what we look for. Trend direction from the chart. Growth magnitude from fundamentals and catalysts. When both are strong and aligned, you have a VECTOR stock.
          </p>
        </FadeUp>

        <FadeUp delay={0.15}>
          <div className="mt-16 text-[12px] uppercase tracking-[0.15em] text-[var(--gold)]">Every stock must have both:</div>
          <div className="mt-6 grid sm:grid-cols-2 gap-5 max-w-3xl mx-auto">
            {[
              { k: "Magnitude", v: "Strong fundamentals and real growth" },
              { k: "Direction", v: "A clear, data-confirmed path forward" },
            ].map((p) => (
              <div key={p.k} className="bg-[var(--midnight)] border-t-2 border-[var(--gold)] p-6 text-left">
                <div className="text-[12px] uppercase tracking-[0.15em] text-[var(--gold)]">{p.k}</div>
                <div className="mt-2 text-[15px] text-[var(--text-on-dark)] leading-relaxed">{p.v}</div>
              </div>
            ))}
          </div>
        </FadeUp>

        <FadeUp delay={0.2}>
          <div className="mt-24 flex items-center gap-6 justify-center">
            <span className="hidden sm:block h-px w-16 bg-[var(--gold)]/40" />
            <span className="text-[14px] uppercase tracking-[0.15em] text-[var(--gold)]">Three Pillars. Every Stock. No Exceptions.</span>
            <span className="hidden sm:block h-px w-16 bg-[var(--gold)]/40" />
          </div>
        </FadeUp>

        <div className="mt-12 grid md:grid-cols-3 gap-6 text-left">
          {pillars.map((p, i) => (
            <FadeUp key={p.title} delay={0.1 + i * 0.08}>
              <div className="group bg-[var(--midnight)] border-t-2 border-[var(--gold)] p-10 h-full transition-transform duration-300 hover:-translate-y-1.5">
                <div className="font-display text-[36px] text-[var(--text-on-dark)] font-light">{p.title}</div>
                <p className="mt-6 text-[15px] text-[var(--text-muted-dark)] leading-[1.8]">{p.body}</p>
              </div>
            </FadeUp>
          ))}
        </div>

        <FadeUp delay={0.1}>
          <p className="mt-24 text-[16px] text-[var(--text-muted-dark)] max-w-[620px] mx-auto leading-[1.8]">
            These three pillars are not a checklist. They are a scoring system. Every stock is run through our data models and assigned a score. Only the highest scoring stocks make it into the portfolio. And once they are in, we do not sit still. Voyyage runs a high-frequency rebalancing model. When a stock no longer satisfies the framework, it is replaced. When a stronger opportunity scores higher, capital moves to it. This is not a buy and hold portfolio. It is a living, breathing system built to stay ahead of the market at all times.
          </p>
        </FadeUp>

        <FadeUp delay={0.15}>
          <blockquote className="mt-20 font-display italic text-[24px] md:text-[28px] text-[var(--text-on-dark)] max-w-2xl mx-auto leading-snug">
            “Speed and discipline together are the real edge.”
          </blockquote>
        </FadeUp>
      </div>
    </section>
  );
}
