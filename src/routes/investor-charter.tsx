import { createFileRoute } from "@tanstack/react-router";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import {
  Eye,
  Target,
  CheckCircle2,
  XCircle,
  FileText,
  ArrowRight,
  ShieldAlert,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Scale,
  Check,
  ChevronRight,
  Info
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/investor-charter")({
  head: () => ({
    meta: [
      { title: "Investor Charter — Voyyage" },
      { name: "description", content: "SEBI Investor Charter for Research Analysts (RAs). Learn about investor rights, responsibilities, and grievance redressal." },
      { property: "og:title", content: "Investor Charter — Voyyage" },
      { property: "og:description", content: "SEBI Investor Charter for Research Analysts (RAs)." },
    ],
  }),
  component: InvestorCharterPage,
});

function InvestorCharterPage() {
  const sections = [
    { id: "vision-mission", label: "Vision & Mission" },
    { id: "business-transacted", label: "Business Transacted" },
    { id: "services", label: "Services & Disclosures" },
    { id: "grievances", label: "Grievance Redressal" },
    { id: "rights", label: "Investor Rights" },
    { id: "expectations", label: "Do's & Don'ts" },
    { id: "complaints", label: "Complaint Data" },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Nav />
      
      {/* Hero Header */}
      <section className="relative bg-gradient-to-b from-[var(--snow)] to-white pt-36 pb-20 border-b border-[var(--gold)]/10">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="eyebrow mb-4">SEBI Compliance</div>
          <h1 className="font-display font-light text-[#1A1A1A] text-4xl sm:text-5xl md:text-6xl tracking-tight max-w-4xl leading-tight">
            Investor Charter
          </h1>
          <p className="mt-4 text-md text-gray-500 max-w-2xl font-sans">
            In respect of Research Analysts (RAs) registered with the Securities and Exchange Board of India (SEBI).
          </p>
        </div>
      </section>

      {/* Main Layout */}
      <main className="max-w-7xl mx-auto px-6 md:px-10 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          
          {/* Sticky Table of Contents Sidebar (Desktop only) */}
          <aside className="hidden lg:block lg:col-span-1">
            <div className="sticky top-28 self-start bg-white p-6 rounded-lg border border-[var(--gold)]/10 shadow-sm">
              <h3 className="font-display text-lg text-[var(--navy)] font-medium mb-4 pb-2 border-b border-[var(--gold)]/10">
                Contents
              </h3>
              <ul className="space-y-3">
                {sections.map((sec) => (
                  <li key={sec.id}>
                    <a
                      href={`#${sec.id}`}
                      className="group flex items-center gap-2 text-sm text-gray-600 hover:text-[var(--gold)] transition-colors font-medium"
                    >
                      <ChevronRight size={14} className="text-gray-400 group-hover:text-[var(--gold)] transition-transform group-hover:translate-x-0.5" />
                      {sec.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Main Content Areas */}
          <div className="lg:col-span-3 space-y-20">
            
            {/* Section A: Vision and Mission */}
            <section id="vision-mission" className="scroll-mt-28 space-y-8">
              <div className="border-b border-gray-100 pb-4">
                <div className="eyebrow mb-2">Section A</div>
                <h2 className="font-display text-3xl text-[var(--navy)] font-semibold">
                  Vision and Mission Statements for Investors
                </h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* Vision Card */}
                <div className="bg-white p-8 rounded-lg border border-[var(--gold)]/20 shadow-sm flex flex-col gap-4 relative overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="absolute top-0 left-0 h-1 w-full bg-[var(--gold)]" />
                  <div className="w-12 h-12 bg-[var(--gold)]/10 rounded-full flex items-center justify-center text-[var(--gold)]">
                    <Eye size={24} />
                  </div>
                  <h3 className="font-display text-2xl text-[var(--navy)] font-medium">Vision</h3>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    Invest with knowledge & safety.
                  </p>
                </div>

                {/* Mission Card */}
                <div className="bg-white p-8 rounded-lg border border-[var(--gold)]/20 shadow-sm flex flex-col gap-4 relative overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="absolute top-0 left-0 h-1 w-full bg-[var(--navy)]" />
                  <div className="w-12 h-12 bg-[var(--navy)]/10 rounded-full flex items-center justify-center text-[var(--navy)]">
                    <Target size={24} />
                  </div>
                  <h3 className="font-display text-2xl text-[var(--navy)] font-medium">Mission</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Every investor should be able to invest in the right investment products based on their needs, manage and monitor them to meet their goals, access reports, and enjoy financial wellness.
                  </p>
                </div>
              </div>
            </section>

            {/* Section B: Details of Business Transacted */}
            <section id="business-transacted" className="scroll-mt-28 space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <div className="eyebrow mb-2">Section B</div>
                <h2 className="font-display text-3xl text-[var(--navy)] font-semibold">
                  Details of Business Transacted by the Research Analyst with Respect to Investors
                </h2>
              </div>

              <div className="bg-white p-8 rounded-lg border border-gray-100 shadow-sm">
                <p className="text-gray-600 mb-6 leading-relaxed">
                  The Research Analyst shall undertake the following core functions to support and protect investor interests:
                </p>
                
                <ul className="space-y-4">
                  {[
                    "Publish research reports based on research activities.",
                    "Provide an independent and unbiased view on securities.",
                    "Offer unbiased recommendations while disclosing financial interests in recommended securities.",
                    "Provide research recommendations based on analysis of publicly available information and known observations.",
                    "Conduct annual audits.",
                    "Ensure all advertisements comply with the Advertisement Code for Research Analysts.",
                    "Maintain records of interactions with all clients, including prospective clients, where discussions regarding research services have taken place."
                  ].map((item, idx) => (
                    <li key={idx} className="flex gap-3 items-start">
                      <div className="w-5 h-5 mt-0.5 rounded-full bg-[var(--gold)]/10 flex items-center justify-center text-[var(--gold)] shrink-0">
                        <Check size={12} strokeWidth={3} />
                      </div>
                      <span className="text-sm text-gray-700 leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Section C: Details of Services Provided */}
            <section id="services" className="scroll-mt-28 space-y-8">
              <div className="border-b border-gray-100 pb-4">
                <div className="eyebrow mb-2">Section C</div>
                <h2 className="font-display text-3xl text-[var(--navy)] font-semibold">
                  Details of Services & Disclosures Provided to Investors
                </h2>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Onboarding Box */}
                <div className="bg-white p-8 rounded-lg border border-gray-100 shadow-sm space-y-4">
                  <h3 className="text-lg font-semibold text-[var(--navy)] pb-2 border-b border-gray-100">
                    Client Onboarding
                  </h3>
                  <ul className="space-y-3">
                    {[
                      "Sharing terms and conditions of research services.",
                      "Completing KYC requirements for fee-paying clients."
                    ].map((item, idx) => (
                      <li key={idx} className="flex gap-2 items-start text-sm text-gray-600">
                        <span className="text-[var(--gold)] font-bold mt-0.5">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* AI Box */}
                <div className="bg-[var(--snow)] p-8 rounded-lg border border-[var(--gold)]/10 shadow-sm space-y-4 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--navy)] pb-2 border-b border-gray-200">
                      AI Integration & Tools Usage
                    </h3>
                    <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                      To ensure modern transparency, the Research Analyst shall explicitly disclose the extent of usage of Artificial Intelligence (AI) tools in providing research services.
                    </p>
                  </div>
                  <div className="flex gap-3 items-center text-xs text-[var(--gold)] font-semibold mt-4">
                    <Info size={16} />
                    <span>Always fully disclosed to active clients</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-lg border border-gray-100 shadow-sm">
                <h3 className="text-lg font-semibold text-[var(--navy)] mb-4">
                  Disclosures to Clients
                </h3>
                <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                  The Research Analyst is bound by SEBI regulations to make transparent disclosures at all stages:
                </p>
                
                <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
                  {[
                    "Disclose all material information necessary for informed decision-making, including business activities, disciplinary history, terms and conditions of services, associate entities, and risks/conflicts.",
                    "While distributing third-party research reports, disclose material conflict of interest of the provider or the directing web address.",
                    "Disclose conflicts of interest between research services and other activities of the Research Analyst.",
                    "Distribute research reports and recommendations without discrimination.",
                    "Maintain confidentiality of research reports until publication in the public domain.",
                    "Respect client privacy and protect confidential information from unauthorized use.",
                    "Disclose service timelines and strictly adhere to them.",
                    "Provide adequate caution notices when recommending complex or high-risk financial products.",
                    "Treat all clients with honesty, integrity, and utmost professional care.",
                    "Maintain strict confidentiality unless disclosure is required by law or client consent is explicitly provided."
                  ].map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-start text-xs text-gray-600 py-1">
                      <span className="text-[var(--gold)] font-bold">•</span>
                      <span className="leading-relaxed">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Section D: Grievance Redressal Mechanism */}
            <section id="grievances" className="scroll-mt-28 space-y-8">
              <div className="border-b border-gray-100 pb-4">
                <div className="eyebrow mb-2">Section D</div>
                <h2 className="font-display text-3xl text-[var(--navy)] font-semibold">
                  Grievance Redressal Mechanism
                </h2>
              </div>

              <div className="bg-amber-50/50 border border-amber-200/60 rounded-lg p-6 flex gap-4 items-start">
                <ShieldAlert className="text-amber-600 shrink-0 mt-1" size={20} />
                <div>
                  <h4 className="text-sm font-semibold text-amber-900">Timeline for Resolution</h4>
                  <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                    Any complaint or grievance raised by an investor must be addressed and resolved by the Research Analyst immediately, and in any case, not later than <strong>21 days</strong> from the date of receipt.
                  </p>
                </div>
              </div>

              {/* Steps Layout */}
              <div className="space-y-6">
                
                {/* Step 1 */}
                <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm flex flex-col md:flex-row gap-6">
                  <div className="w-12 h-12 rounded-full bg-[var(--navy)]/10 text-[var(--navy)] flex items-center justify-center shrink-0 font-bold text-lg">
                    1
                  </div>
                  <div className="space-y-2 flex-grow">
                    <h3 className="text-md font-semibold text-[var(--navy)]">File a Complaint with the Research Analyst</h3>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      In case of any grievance or complaint, investors may first approach the concerned Research Analyst directly.
                    </p>
                    <div className="pt-2 flex flex-wrap gap-4 text-xs font-mono text-gray-700">
                      <span className="flex items-center gap-1"><Mail size={12} className="text-gray-400" /> varunsontakke18@gmail.com</span>
                      <span className="flex items-center gap-1"><Phone size={12} className="text-gray-400" /> +91 9552609280</span>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm flex flex-col md:flex-row gap-6">
                  <div className="w-12 h-12 rounded-full bg-[var(--navy)]/10 text-[var(--navy)] flex items-center justify-center shrink-0 font-bold text-lg">
                    2
                  </div>
                  <div className="space-y-4 flex-grow">
                    <div>
                      <h3 className="text-md font-semibold text-[var(--navy)]">File Through SCORES 2.0 or Email RAASB</h3>
                      <p className="text-xs text-gray-600 leading-relaxed mt-1">
                        If the complaint is not resolved, you may escalate to SEBI's centralized grievance redressal platform SCORES. A two-level review process is followed:
                      </p>
                      <ol className="list-decimal pl-4 mt-2 text-xs text-gray-500 space-y-1">
                        <li>First Review — Designated Body (RAASB - Research Analyst Administration and Supervisory Body)</li>
                        <li>Second Review — SEBI</li>
                      </ol>
                    </div>
                    
                    <div className="flex flex-wrap gap-3">
                      <a
                        href="https://scores.sebi.gov.in"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-gold !py-2.5 !px-5 !text-xs inline-flex items-center gap-2"
                      >
                        Visit SCORES 2.0 <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm flex flex-col md:flex-row gap-6">
                  <div className="w-12 h-12 rounded-full bg-[var(--navy)]/10 text-[var(--navy)] flex items-center justify-center shrink-0 font-bold text-lg">
                    3
                  </div>
                  <div className="space-y-4 flex-grow">
                    <div>
                      <h3 className="text-md font-semibold text-[var(--navy)]">SMARTODR Platform</h3>
                      <p className="text-xs text-gray-600 leading-relaxed mt-1">
                        If you remain dissatisfied with the resolution provided by the market participant, you may file a complaint through the SMARTODR platform for online conciliation or arbitration.
                      </p>
                    </div>
                    <div>
                      <a
                        href="https://smartodr.in"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="border border-[var(--gold)] text-[var(--navy)] px-5 py-2.5 rounded-md text-xs font-medium hover:bg-[var(--gold)]/10 transition-colors inline-flex items-center gap-2"
                      >
                        Visit SMARTODR Portal <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Physical Address */}
              <div className="bg-white p-8 rounded-lg border border-gray-100 shadow-sm flex flex-col md:flex-row gap-6 items-start">
                <div className="w-10 h-10 rounded-full bg-[var(--gold)]/10 flex items-center justify-center text-[var(--gold)] shrink-0">
                  <MapPin size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[var(--navy)]">SEBI Physical Complaint Address</h4>
                  <p className="text-xs text-gray-500 mt-2 font-medium">Office of Investor Assistance and Education</p>
                  <p className="text-xs text-gray-600 leading-relaxed mt-1">
                    Securities and Exchange Board of India (SEBI)<br />
                    SEBI Bhavan, Plot No. C4-A, 'G' Block,<br />
                    Bandra-Kurla Complex, Bandra (E), Mumbai – 400051
                  </p>
                </div>
              </div>
            </section>

            {/* Section E: Rights of Investors */}
            <section id="rights" className="scroll-mt-28 space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <div className="eyebrow mb-2">Section E</div>
                <h2 className="font-display text-3xl text-[var(--navy)] font-semibold">
                  Rights of Investors
                </h2>
              </div>

              <div className="bg-white p-8 rounded-lg border border-gray-100 shadow-sm">
                <p className="text-sm text-gray-600 mb-6">
                  Investors possess the following regulatory and fair-treatment rights when dealing with Research Analysts:
                </p>

                <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
                  {[
                    "Right to Privacy and Confidentiality of client information.",
                    "Right to Transparent Practices and honest dealings.",
                    "Right to Fair and Equitable Treatment without discrimination.",
                    "Right to Adequate Information for making well-informed decisions.",
                    "Right to receive statutory, regulatory, and continuing disclosures.",
                    "Right to Fair and True Advertisements, free from misleading representations.",
                    "Right to Awareness about Service Parameters and turnaround times/timelines.",
                    "Right to be Heard and receive satisfactory and timely Grievance Redressal.",
                    "Right to Exit from services according to agreed-upon refund/discontinuation terms.",
                    "Right to clear guidance and caution notices when dealing with complex or high-risk financial products.",
                    "Vulnerable Consumer Rights: Right to access services properly, including for differently-abled consumers.",
                    "Right to provide constructive feedback on services and products utilized.",
                    "Right against coercive, unfair, or heavily one-sided clauses in financial service agreements."
                  ].map((right, idx) => (
                    <div key={idx} className="flex gap-2 items-start text-xs text-gray-600 border-b border-gray-50 pb-2">
                      <Scale size={14} className="text-[var(--gold)] shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{right}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Section F: Expectations from Investors */}
            <section id="expectations" className="scroll-mt-28 space-y-8">
              <div className="border-b border-gray-100 pb-4">
                <div className="eyebrow mb-2">Section F</div>
                <h2 className="font-display text-3xl text-[var(--navy)] font-semibold">
                  Expectations from Investors (Responsibilities)
                </h2>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Do's */}
                <div className="bg-emerald-50/20 border border-emerald-500/20 p-8 rounded-lg space-y-6">
                  <div className="flex gap-3 items-center text-emerald-800 pb-2 border-b border-emerald-500/10">
                    <CheckCircle2 className="text-emerald-600 shrink-0" size={24} />
                    <h3 className="font-display text-xl font-medium">Do&apos;s</h3>
                  </div>
                  
                  <ol className="space-y-4 text-xs text-emerald-950 leading-relaxed">
                    {[
                      "Always deal with SEBI-registered Research Analysts.",
                      "Ensure the Research Analyst has a valid, active registration certificate.",
                      "Verify the SEBI registration number using official SEBI search.",
                      "Review all disclosures made in research reports before investing in the recommended securities.",
                      "Pay Research Analyst fees only through official banking channels and maintain signed receipts.",
                      "Check and verify research recommendations before executing any trades or participating in public offers.",
                      "Ask relevant questions and clear all doubts before acting on recommendations.",
                      "Seek clarification on recommendations involving complex or high-risk financial products.",
                      "Be aware of your right to discontinue services according to the terms.",
                      "Provide feedback on services received to help improve transparency.",
                      "Remember that you are not bound by any clause that violates regulatory provisions.",
                      "Inform SEBI immediately if a Research Analyst offers assured or guaranteed returns."
                    ].map((item, idx) => (
                      <li key={idx} className="flex gap-2 items-start">
                        <span className="font-mono font-bold text-emerald-600 shrink-0 w-4 text-right">{idx + 1}.</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ol>

                  <div className="pt-2">
                    <a
                      href="https://www.sebi.gov.in/sebiweb/other/OtherAction.do?doRecognisedFpi=yes&intmId=14"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-700 hover:text-emerald-900 font-medium underline inline-flex items-center gap-1"
                    >
                      SEBI List of Registered RAs <ExternalLink size={10} />
                    </a>
                  </div>
                </div>

                {/* Don'ts */}
                <div className="bg-rose-50/20 border border-rose-500/20 p-8 rounded-lg space-y-6">
                  <div className="flex gap-3 items-center text-rose-800 pb-2 border-b border-rose-500/10">
                    <XCircle className="text-rose-600 shrink-0" size={24} />
                    <h3 className="font-display text-xl font-medium">Don&apos;ts</h3>
                  </div>

                  <ol className="space-y-4 text-xs text-rose-950 leading-relaxed">
                    {[
                      "Do not provide funds for investment directly to the Research Analyst.",
                      "Do not fall prey to misleading advertisements or unverified market rumors.",
                      "Do not get attracted by limited-period discounts, incentives, gifts, or promotional offers.",
                      "Do not share trading, demat, or banking login credentials and passwords with the Research Analyst."
                    ].map((item, idx) => (
                      <li key={idx} className="flex gap-2 items-start">
                        <span className="font-mono font-bold text-rose-600 shrink-0 w-4 text-right">{idx + 1}.</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </section>

            {/* Section G: Complaint Data Display */}
            <section id="complaints" className="scroll-mt-28 space-y-8">
              <div className="border-b border-gray-100 pb-4">
                <div className="eyebrow mb-2">Section G</div>
                <h2 className="font-display text-3xl text-[var(--navy)] font-semibold">
                  Complaint Data to be Displayed by Research Analysts
                </h2>
              </div>

              {/* Table 1 */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-gray-100 pb-2">
                  <h3 className="text-md font-semibold text-[var(--navy)]">
                    Monthly Complaint Disclosure Format
                  </h3>
                  <span className="text-xs text-gray-500 font-mono">
                    Data for the month ending: May 31, 2026
                  </span>
                </div>
                
                <div className="border rounded-lg overflow-hidden bg-white">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/70">
                        <TableHead className="w-12 text-center text-xs">Sr. No.</TableHead>
                        <TableHead className="text-xs">Received From</TableHead>
                        <TableHead className="text-center text-xs">Pending at End of Last Month</TableHead>
                        <TableHead className="text-center text-xs">Received</TableHead>
                        <TableHead className="text-center text-xs">Resolved*</TableHead>
                        <TableHead className="text-center text-xs">Total Pending#</TableHead>
                        <TableHead className="text-center text-xs">Pending Complaints &gt; 3 Months</TableHead>
                        <TableHead className="text-center text-xs">Average Resolution Time^ (Days)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[
                        { sr: 1, from: "Directly from Investors", pendingLast: 0, received: 0, resolved: 0, total: 0, over3m: 0, avgTime: 0 },
                        { sr: 2, from: "SEBI (SCORES)", pendingLast: 0, received: 0, resolved: 0, total: 0, over3m: 0, avgTime: 0 },
                        { sr: 3, from: "Other Sources (if any)", pendingLast: 0, received: 0, resolved: 0, total: 0, over3m: 0, avgTime: 0 },
                      ].map((row) => (
                        <TableRow key={row.sr}>
                          <TableCell className="text-center text-xs text-gray-500">{row.sr}</TableCell>
                          <TableCell className="text-xs font-medium text-gray-700">{row.from}</TableCell>
                          <TableCell className="text-center text-xs">{row.pendingLast}</TableCell>
                          <TableCell className="text-center text-xs">{row.received}</TableCell>
                          <TableCell className="text-center text-xs">{row.resolved}</TableCell>
                          <TableCell className="text-center text-xs">{row.total}</TableCell>
                          <TableCell className="text-center text-xs">{row.over3m}</TableCell>
                          <TableCell className="text-center text-xs">{row.avgTime}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-gray-50 font-semibold border-t">
                        <TableCell></TableCell>
                        <TableCell className="text-xs text-gray-900">Grand Total</TableCell>
                        <TableCell className="text-center text-xs">0</TableCell>
                        <TableCell className="text-center text-xs">0</TableCell>
                        <TableCell className="text-center text-xs">0</TableCell>
                        <TableCell className="text-center text-xs">0</TableCell>
                        <TableCell className="text-center text-xs">0</TableCell>
                        <TableCell className="text-center text-xs">0</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
                
                <div className="text-[10px] text-gray-500 space-y-1.5 leading-relaxed pt-1 pl-1">
                  <p>* Includes complaints from previous months resolved during the current month.</p>
                  <p># Includes complaints pending as of the last day of the month.</p>
                  <p>^ Average Resolution Time = Total days taken to resolve all complaints in the month ÷ Number of complaints resolved during the month.</p>
                  <p>• Note: Number of complaints received due to impersonation by another entity should be disclosed separately. Such complaints may be adjusted from the total complaint count after following SEBI/RAASB guidelines.</p>
                </div>
              </div>

              {/* Table 2 */}
              <div className="space-y-4 pt-4">
                <h3 className="text-md font-semibold text-[var(--navy)] border-b border-gray-100 pb-2">
                  Trend of Monthly Disposal of Complaints
                </h3>
                
                <div className="border rounded-lg overflow-hidden bg-white">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/70">
                        <TableHead className="w-12 text-center text-xs">Sr. No.</TableHead>
                        <TableHead className="text-xs">Month</TableHead>
                        <TableHead className="text-center text-xs">Carried Forward from Previous Month</TableHead>
                        <TableHead className="text-center text-xs">Received</TableHead>
                        <TableHead className="text-center text-xs">Resolved*</TableHead>
                        <TableHead className="text-center text-xs">Pending#</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[
                        { sr: 1, month: "April 2026", forward: 0, received: 0, resolved: 0, pending: 0 },
                        { sr: 2, month: "May 2026", forward: 0, received: 0, resolved: 0, pending: 0 },
                      ].map((row) => (
                        <TableRow key={row.sr}>
                          <TableCell className="text-center text-xs text-gray-500">{row.sr}</TableCell>
                          <TableCell className="text-xs font-medium text-gray-700">{row.month}</TableCell>
                          <TableCell className="text-center text-xs">{row.forward}</TableCell>
                          <TableCell className="text-center text-xs">{row.received}</TableCell>
                          <TableCell className="text-center text-xs">{row.resolved}</TableCell>
                          <TableCell className="text-center text-xs">{row.pending}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-gray-50 font-semibold border-t">
                        <TableCell></TableCell>
                        <TableCell className="text-xs text-gray-900">Grand Total</TableCell>
                        <TableCell className="text-center text-xs">0</TableCell>
                        <TableCell className="text-center text-xs">0</TableCell>
                        <TableCell className="text-center text-xs">0</TableCell>
                        <TableCell className="text-center text-xs">0</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
                
                <div className="text-[10px] text-gray-500 space-y-1.5 leading-relaxed pt-1 pl-1">
                  <p>* Inclusive of complaints from previous months resolved during the current month.</p>
                  <p># Inclusive of complaints pending as of the last day of the month.</p>
                </div>
              </div>

              {/* Table 3 */}
              <div className="space-y-4 pt-4">
                <h3 className="text-md font-semibold text-[var(--navy)] border-b border-gray-100 pb-2">
                  Trend of Annual Disposal of Complaints
                </h3>
                
                <div className="border rounded-lg overflow-hidden bg-white">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/70">
                        <TableHead className="w-12 text-center text-xs">Sr. No.</TableHead>
                        <TableHead className="text-xs">Year</TableHead>
                        <TableHead className="text-center text-xs">Carried Forward from Previous Year</TableHead>
                        <TableHead className="text-center text-xs">Received</TableHead>
                        <TableHead className="text-center text-xs">Resolved*</TableHead>
                        <TableHead className="text-center text-xs">Pending#</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[
                        { sr: 1, year: "2021–22", forward: 0, received: 0, resolved: 0, pending: 0 },
                        { sr: 2, year: "2022–23", forward: 0, received: 0, resolved: 0, pending: 0 },
                        { sr: 3, year: "2023–24", forward: 0, received: 0, resolved: 0, pending: 0 },
                        { sr: 4, year: "2024–25", forward: 0, received: 0, resolved: 0, pending: 0 },
                        { sr: 5, year: "2025–26", forward: 0, received: 0, resolved: 0, pending: 0 },
                      ].map((row) => (
                        <TableRow key={row.sr}>
                          <TableCell className="text-center text-xs text-gray-500">{row.sr}</TableCell>
                          <TableCell className="text-xs font-medium text-gray-700">{row.year}</TableCell>
                          <TableCell className="text-center text-xs">{row.forward}</TableCell>
                          <TableCell className="text-center text-xs">{row.received}</TableCell>
                          <TableCell className="text-center text-xs">{row.resolved}</TableCell>
                          <TableCell className="text-center text-xs">{row.pending}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-gray-50 font-semibold border-t">
                        <TableCell></TableCell>
                        <TableCell className="text-xs text-gray-900">Grand Total</TableCell>
                        <TableCell className="text-center text-xs">0</TableCell>
                        <TableCell className="text-center text-xs">0</TableCell>
                        <TableCell className="text-center text-xs">0</TableCell>
                        <TableCell className="text-center text-xs">0</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
                
                <div className="text-[10px] text-gray-500 space-y-1.5 leading-relaxed pt-1 pl-1">
                  <p>* Inclusive of complaints from previous years resolved during the current year.</p>
                  <p># Inclusive of complaints pending as of the last day of the year.</p>
                </div>
              </div>
            </section>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
