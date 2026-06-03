import { Linkedin, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer data-section="dark" className="bg-[var(--navy)] text-[var(--text-on-dark)]">
      <div className="max-w-7xl mx-auto px-6 md:px-10 pt-24 pb-10">
        <div className="grid md:grid-cols-3 gap-12">
          <div>
            <img src="/logo.png" alt="Voyyage Logo" className="h-14 w-auto object-contain" />
            <p className="mt-4 text-[var(--text-muted-dark)] text-sm leading-relaxed max-w-xs">
              Data-driven quantitative research for the modern Indian investor.
            </p>
            <div className="mt-6 space-y-2 text-xs text-[var(--text-muted-dark)] leading-relaxed">
              <p><strong className="text-[var(--text-on-dark)] font-medium">Name of Research Analyst:</strong> Varun Rajesh Sontakke</p>
              <p><strong className="text-[var(--text-on-dark)] font-medium">Registered office:</strong> F-201, Konark Indrayu Enclave - 2, NIBM Undri road, Kondhawa, Pune - 411048</p>
              <p><strong className="text-[var(--text-on-dark)] font-medium">Mobile number:</strong> +91 9552609280</p>
              <p><strong className="text-[var(--text-on-dark)] font-medium">SEBI Registration number:</strong> INH000026053</p>
              <p><strong className="text-[var(--text-on-dark)] font-medium">BSE Enlistment number:</strong> 7106</p>
            </div>
          </div>

          <div>
            <div className="eyebrow mb-6">Quick Links</div>
            <ul className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: "About", href: "/#about" },
                { label: "Philosophy", href: "/#philosophy" },
                { label: "Privacy Policy", href: "#" },
                { label: "Terms of Use", href: "#" },
                { label: "Disclaimer", href: "/disclaimer" },
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

        <div className="mt-20 pt-8 border-t border-[var(--gold)]/10 space-y-6">
          <div className="text-xs text-[var(--text-muted-dark)] max-w-4xl mx-auto text-center space-y-4">
            <p>
              Voyyage is the brand name for Mr. Varun Rajesh Sontakke, SEBI Registered Part time Research Analyst
            </p>
            <p className="leading-relaxed">
              <strong className="text-[var(--text-on-dark)] font-medium">SEBI Office Address:</strong><br />
              SEBI Bhavan BKC - Plot No.C4-A, 'G' Block<br />
              Bandra-Kurla Complex, Bandra (East),<br />
              Mumbai – 400051, Maharashtra
            </p>
          </div>
          
          <div className="text-center space-y-3 pt-6 border-t border-[var(--gold)]/10">
            <p className="text-xs text-[#475569] max-w-3xl mx-auto leading-relaxed">
              Investments are subject to market risks. Please read all scheme-related documents carefully before investing. Past performance is not indicative of future results.
            </p>
            <p className="text-xs text-[#475569]">© {new Date().getFullYear()} Voyyage. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
