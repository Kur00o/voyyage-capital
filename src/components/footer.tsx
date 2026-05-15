import { Linkedin, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer data-section="dark" className="bg-[var(--navy)] text-[var(--text-on-dark)]">
      <div className="max-w-7xl mx-auto px-6 md:px-10 pt-24 pb-10">
        <div className="grid md:grid-cols-3 gap-12">
          <div>
            <div className="font-display text-3xl">Voyyage</div>
            <p className="mt-4 text-[var(--text-muted-dark)] text-sm leading-relaxed max-w-xs">
              Data-driven model portfolios for the modern Indian investor.
            </p>
            <p className="mt-6 text-xs text-[var(--text-muted-dark)] tracking-wider">
              SEBI Registered Research Analyst | Reg. No. INH000XXXXX
            </p>
          </div>

          <div>
            <div className="eyebrow mb-6">Quick Links</div>
            <ul className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: "About", href: "/#about" },
                { label: "Philosophy", href: "/#philosophy" },
                { label: "Plans", href: "/#plans" },
                { label: "Get Started", href: "/analytics" },
                { label: "Privacy Policy", href: "#" },
                { label: "Terms of Use", href: "#" },
              ].map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="text-[var(--text-muted-dark)] hover:text-[var(--gold)] transition-colors">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="eyebrow mb-6">Get in touch</div>
            <a href="mailto:hello@voyyage.in" className="text-sm text-[var(--text-on-dark)] hover:text-[var(--gold)] transition-colors">
              hello@voyyage.in
            </a>
            <div className="mt-6 flex gap-4">
              <a href="#" className="w-10 h-10 border border-white/20 rounded-md flex items-center justify-center hover:border-[var(--gold)] hover:text-[var(--gold)] transition-colors">
                <Linkedin size={16} />
              </a>
              <a href="#" className="w-10 h-10 border border-white/20 rounded-md flex items-center justify-center hover:border-[var(--gold)] hover:text-[var(--gold)] transition-colors">
                <Twitter size={16} />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-20 pt-8 border-t border-[var(--gold)]/10 text-center space-y-3">
          <p className="text-xs text-[#475569]">© 2025 Voyyage Investment Technologies Pvt. Ltd. All rights reserved.</p>
          <p className="text-xs text-[#475569] max-w-3xl mx-auto leading-relaxed">
            Investments are subject to market risks. Please read all scheme-related documents carefully before investing. Past performance is not indicative of future results.
          </p>
        </div>
      </div>
    </footer>
  );
}
