import { Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import { FadeUp } from "../motion-primitives";

const plans = [
  {
    name: "Explorer",
    price: "₹999",
    ideal: "First-time systematic investors",
    features: [
      "1 model portfolio (Momentum Core)",
      "Quarterly rebalancing alerts",
      "Stock weightage calculator",
      "Email support",
    ],
    slug: "explorer",
    featured: false,
  },
  {
    name: "Navigator",
    price: "₹2,499",
    ideal: "Growing portfolios ₹5L–₹25L",
    features: [
      "3 model portfolios",
      "Monthly rebalancing + real-time alerts",
      "Weightage calculator",
      "Priority WhatsApp support",
      "Sector rotation signals",
    ],
    slug: "navigator",
    featured: true,
  },
  {
    name: "Voyager",
    price: "₹5,999",
    ideal: "HNIs ₹25L+",
    features: [
      "All model portfolios",
      "High-frequency rebalancing alerts",
      "1-on-1 quarterly review call",
      "Custom risk profiling",
      "Dedicated advisor access",
    ],
    slug: "voyager",
    featured: false,
  },
];

export function Plans() {
  return (
    <section id="plans" data-section="light" className="bg-white py-32 md:py-40 px-6 md:px-10">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto">
          <FadeUp>
            <div className="eyebrow mb-6">Access Voyyage</div>
            <h2 className="font-display font-light text-[#1A1A1A] text-[44px] md:text-[56px] leading-[1.05] tracking-tight">
              Choose your portfolio.
            </h2>
            <p className="mt-6 text-[17px] text-[#6B7280] leading-[1.8]">
              Each plan grants access to our data-driven model portfolios. Select the tier that fits your capital and ambition.
            </p>
          </FadeUp>
        </div>

        <div className="mt-20 grid md:grid-cols-3 gap-6 lg:gap-8">
          {plans.map((p, i) => (
            <FadeUp key={p.slug} delay={i * 0.08}>
              <div
                className={`relative h-full bg-white p-10 transition-all duration-300 hover:-translate-y-1.5 ${
                  p.featured
                    ? "border-t-2 border-[var(--gold)] shadow-[0_30px_60px_-30px_rgba(13,27,42,0.25)] border-x border-b border-[var(--border)]"
                    : "border border-[var(--border)] rounded-md"
                }`}
                style={p.featured ? { borderRadius: "0 0 6px 6px" } : {}}
              >
                {p.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--gold)] text-[var(--navy)] text-[11px] uppercase tracking-[0.15em] px-3 py-1 font-medium">
                    Most Popular
                  </div>
                )}
                <div className="text-[12px] uppercase tracking-[0.15em] text-[var(--gold)]">{p.name}</div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="font-display text-[56px] font-light text-[#1A1A1A] leading-none">{p.price}</span>
                  <span className="text-[14px] text-[#6B7280]">/mo</span>
                </div>
                <p className="mt-2 text-[13px] text-[#6B7280]">Ideal for: {p.ideal}</p>

                <div className="my-8 h-px bg-[var(--border)]" />

                <ul className="space-y-4">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-3 text-[15px] text-[#1A1A1A]">
                      <Check size={18} className="text-[var(--gold)] flex-shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to="/portfolios"
                  search={{ plan: p.slug }}
                  className={`mt-10 inline-flex items-center gap-2 text-[13px] uppercase tracking-[0.08em] font-medium ${
                    p.featured ? "btn-gold" : "text-[var(--navy)] border border-[var(--navy)] px-7 py-3.5 rounded-md hover:bg-[var(--navy)] hover:text-white transition-colors"
                  }`}
                >
                  Get Started <ArrowRight size={16} />
                </Link>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
