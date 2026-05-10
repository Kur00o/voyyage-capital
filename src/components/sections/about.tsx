import { FadeUp } from "../motion-primitives";

const stats = [
  { value: "MBA Finance", label: "Founder's Qualification" },
  { value: "PMS", label: "Industry Background" },
  { value: "100% Data", label: "Driven Process" },
  { value: "0 Gut Calls", label: "Only Rules" },
];

const paragraphs = [
  "While most were figuring out life, I was already in the markets. Studying price movements, reading charts, looking for patterns that others were too busy to notice. That obsession never left.",
  "It only got sharper.",
  "An MBA in Finance, followed by hands-on experience at a Portfolio Management Services firm, managing real portfolios for real clients. That time inside the industry was invaluable. But it also revealed something uncomfortable about the Indian investment industry.",
  "Everyone was running behind AUM. The bigger the number, the better the story. And the story was almost always built on narratives, on gut calls, on what some analysts felt would happen next quarter. Very few people were asking the harder question: What does the data actually say?",
  "Because here is the truth about investing that the industry does not want to say out loud — investing is not art. It is science. Markets have patterns. Price has memory. Risk has structure. And when you strip away the noise, the narratives, and the emotions, what remains is a process. A repeatable, disciplined, data-driven process that does not need to guess because it already knows what to look for.",
  "That belief is what Voyyage was built on.",
  "Voyyage exists because Indian investors deserve better than stories. They deserve a firm that treats their money with the same rigor that the best quantitative funds in the world apply to theirs. A firm where every allocation, every entry, every exit is governed by rules and data and nothing else.",
  "We are not here to manage AUM. We are here to generate alpha.",
];

export function About() {
  return (
    <section id="about" data-section="light" className="bg-[var(--snow)] py-32 md:py-40 px-6 md:px-10">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
          <div>
            <FadeUp>
              <div className="eyebrow mb-6">Who We Are</div>
              <h2 className="font-display font-light text-[#1A1A1A] text-[44px] md:text-[56px] leading-[1.05] tracking-tight">
                It started at 17.
              </h2>
            </FadeUp>

            <div className="mt-10 space-y-6 text-[17px] text-[#4B5563] leading-[1.8]">
              {paragraphs.map((p, i) => (
                <FadeUp key={i} delay={i * 0.04}>
                  <p>{p}</p>
                </FadeUp>
              ))}
              <FadeUp delay={0.1}>
                <p className="text-[#1A1A1A] font-medium">And for us, winning is the only option.</p>
              </FadeUp>
            </div>
          </div>

          <div className="lg:sticky lg:top-32 lg:self-start">
            <FadeUp>
              <div className="grid grid-cols-2 gap-px bg-[var(--border)]">
                {stats.map((s) => (
                  <div key={s.label} className="bg-[var(--snow)] p-10 md:p-12">
                    <div className="font-display text-[var(--gold)] text-[40px] md:text-[48px] leading-tight font-light">
                      {s.value}
                    </div>
                    <div className="mt-3 text-[13px] uppercase tracking-[0.08em] text-[#6B7280]">
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </FadeUp>
          </div>
        </div>

        <FadeUp>
          <blockquote className="mt-32 text-center font-display italic text-[28px] md:text-[32px] text-[var(--navy)] max-w-3xl mx-auto leading-snug">
            “Investing is not art. It is science.”
          </blockquote>
        </FadeUp>
      </div>
    </section>
  );
}
