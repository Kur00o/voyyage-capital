import { ArrowRight } from "lucide-react";
import { FadeUp } from "../motion-primitives";

const steps = [
  {
    n: "01",
    title: "Subscribe to Voyyage",
    body: "Click the Subscribe button to begin your registration on our secure payment portal.",
  },
  {
    n: "02",
    title: "Complete Your KYC",
    body: "KYC is mandatory. Enter your name exactly as it appears on your PAN card, including your middle name if applicable, and complete your Aadhaar OTP verification. This keeps your account fully compliant and secure.",
  },
  {
    n: "03",
    title: "Get Access and Start Investing Smarter",
    body: "Once your payment is confirmed, your access details will be sent to you instantly via WhatsApp, SMS, and Email. Log in, explore the model portfolios, and let the data do the work.",
  },
];

export function GetStarted() {
  return (
    <section id="start" data-section="light" className="bg-[var(--snow)] py-32 md:py-40 px-6 md:px-10">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto">
          <FadeUp>
            <div className="eyebrow mb-6">Getting Started</div>
            <h2 className="font-display font-light text-[#1A1A1A] text-[40px] md:text-[52px] leading-[1.05] tracking-tight">
              Joining Voyyage takes less than 5 minutes.
            </h2>
            <p className="mt-6 text-[17px] text-[#6B7280] leading-[1.8]">
              Follow these three steps and get access to data-driven research today.
            </p>
          </FadeUp>
        </div>

        <div className="mt-24 space-y-20">
          {steps.map((s, i) => (
            <FadeUp key={s.n} delay={i * 0.05}>
              <div className="relative grid md:grid-cols-[1fr_2fr] gap-8 md:gap-16 items-start">
                <div className="relative">
                  <div
                    className="absolute -top-12 left-0 font-display font-light text-[#F0F0F0] leading-none select-none pointer-events-none"
                    style={{ fontSize: "140px" }}
                  >
                    {s.n}
                  </div>
                  <div className="relative pt-6">
                    <div className="text-[12px] uppercase tracking-[0.15em] text-[var(--gold)]">Step {parseInt(s.n)}</div>
                  </div>
                </div>
                <div>
                  <h3 className="font-display text-[32px] md:text-[36px] text-[#1A1A1A] font-light leading-tight">{s.title}</h3>
                  <p className="mt-5 text-[16px] text-[#6B7280] leading-[1.8] max-w-2xl">{s.body}</p>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>

        <FadeUp>
          <div className="mt-24 text-center">
            <a href="/#plans" className="btn-gold inline-flex items-center gap-2">
              Start Your Journey Now <ArrowRight size={16} />
            </a>
            <p className="mt-8 text-[13px] italic text-[#9CA3AF] max-w-xl mx-auto">
              Your name must match exactly with your PAN card for successful KYC verification. Please keep your Aadhaar-linked mobile number handy for the OTP.
            </p>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
