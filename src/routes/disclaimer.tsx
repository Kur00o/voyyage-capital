import { createFileRoute } from '@tanstack/react-router'
import { Nav } from '../components/nav'
import { Footer } from '../components/footer'

export const Route = createFileRoute('/disclaimer')({
  component: Disclaimer,
})

function Disclaimer() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Nav />
      <main className="pt-32 pb-24">
        <div className="max-w-4xl mx-auto px-6 md:px-10">
          <h1 className="font-display text-4xl md:text-5xl mb-12 text-[#1A1A1A]">Disclaimer</h1>
          
          <div className="prose prose-slate max-w-none space-y-6 text-[#1A1A1A]">
            <ul className="list-disc pl-5 space-y-4 text-sm leading-relaxed">
              <li>Varun Rajesh Sontakke is registered with SEBI as a Part-Time Research Analyst with Registration Number <strong>INH000026053</strong> on <strong>13th April 2026</strong>, pursuant to which he provides Research Analyst services to clients.</li>
              <li>I am not affiliated with any other intermediaries and do not receive any brokerage or commission from any third party.</li>
              <li>SEBI has issued no penalties or directions under the SEBI Act or by any other regulatory body.</li>
              <li>I do not recommend any stock broker or other intermediary to a client, nor do I receive any remuneration, compensation, or consideration in any form from any stock broker or intermediary.</li>
              <li>Investment in equity shares carries inherent risks. Sincere efforts have been made to present the correct investment perspective. The information contained herein is based on analysis and sources considered reliable. However, I do not guarantee its consistency or completeness. This material is for personal information only, and I am not responsible for any loss incurred due to its use. I assume no responsibility whatsoever for any financial profits or losses arising from the recommendations provided.</li>
              <li>I do not provide any promise or assurance of a favorable view for any particular industry, sector, or business group. Investors should consider all risk factors, including their financial condition and risk-return profile, before investing.</li>
              <li>The information and views presented on this website and through all services provided are believed to be reliable, but I accept no responsibility or liability for errors of fact or opinion. Users have the right to choose products and services that best suit their needs.</li>
              <li>I or persons related to me may hold positions in the stocks recommended.</li>
              <li>Research recommendations are provided to all clients entitled to receive research reports. Any client (paid or unpaid), third party, or other recipient has no right to forward, share, distribute, or reproduce calls, SMS messages, reports, or any information provided by us through any medium. Violations may result in legal action.</li>
              <li>I ensure that individuals employed as research analysts operate independently from employees involved in sales, trading, dealing, corporate finance advisory, or other activities that may affect the independence of research reports and recommendations. However, these individuals may receive feedback from sales or trading personnel to assess the impact of research reports.</li>
              <li>Any opinion provided regarding a specific position shall be considered an opinion only and not investment advice. I am not liable for any losses incurred from acting upon such opinions.</li>
              <li>I do not have any association with issuers of products or securities. This ensures there are no actual or potential conflicts of interest and that the objectivity and independence of research services are maintained.</li>
              <li>Investments in the securities market are subject to market risks. Please read all relevant documents carefully before investing.</li>
              <li>Registration granted by SEBI and certification from NISM do not guarantee the performance of the intermediary or provide any assurance of returns to investors.</li>
              <li>By accessing this website or any associated/group websites, you acknowledge that you have read, understood, and agreed to be legally bound by this disclaimer and user agreement.</li>
              <li>Due care and caution have been exercised in compiling data for this website. Users are advised to consult certified experts before making investment decisions. However, I do not guarantee the consistency, adequacy, or completeness of any information and am not responsible for errors, omissions, or outcomes resulting from its use. I expressly state that I bear no financial liability whatsoever to any user arising from the use of information provided on this website.</li>
              <li>I am not responsible for any errors, omissions, or representations on any pages of this website or linked pages. I do not endorse any advertisers featured on the website. Users should independently verify all information before entering into any arrangements.</li>
              <li>Information on this website is updated periodically. However, I exclude all warranties, whether express or implied, regarding the quality, consistency, efficacy, completeness, performance, fitness, or contents of the website, including comments, feedback, and advertisements.</li>
              <li>This website may contain material submitted by users. I accept no responsibility for the content or consistency of such material and make no representations regarding the availability or existence of goods and services advertised therein. I also make no warranty that the website is free from viruses or other harmful elements and assume no liability in this regard.</li>
              <li>Portions of this website may contain advertisements and material submitted by third parties. Advertisers are responsible for ensuring compliance with all applicable legal requirements. While advertisements are subject to our terms and conditions, I accept no liability in respect of any advertisements.</li>
              <li>There are risks associated with internet-based information and research dissemination services. Service interruptions may occur due to failures in hardware, software, internet connections, or mobile networks. While efforts are made to ensure timely delivery of messages, delays or failures caused by network providers or technical issues are beyond my control and responsibility.</li>
              <li>Stock trading is inherently risky. You agree to assume complete responsibility for all trading decisions and outcomes.</li>
              <li>Simulated results do not represent actual trading performance. No representation is made that any account will achieve profits or losses similar to those shown.</li>
              <li>You assume the entire cost and risk of any trading activity you undertake. You are solely responsible for your investment decisions. If you choose to act with or without advice from a licensed financial advisor, such decisions and consequences are entirely your responsibility. Neither I nor my employees shall be liable for the use of information provided herein.</li>
              <li>Investors are encouraged to use the services as a resource to support their own independent research regarding companies, stocks, sectors, markets, and other information presented.</li>
              <li>I, my management, associate companies, and employees assume no responsibility for the accuracy, validity, or correctness of expert recommendations or research information. Although efforts are made to verify information, no guarantees are made regarding its consistency. Information presented on this website is obtained from sources believed to be reliable; however, errors and inaccuracies may occur.</li>
              <li>I hold the necessary license to provide research recommendations as a Research Analyst. Use of this website and all information contained herein is governed by these Terms and Conditions. Information provided is based on sources considered reliable, but no representation is made regarding its consistency or completeness. Users should conduct independent research and not rely solely on the information provided. Use of the service is entirely at your own risk. Trading securities involves a high degree of risk. No warranties or assurances are provided regarding the accuracy, timeliness, reliability, or profitability of any information, methods, or systems presented.</li>
              <li>By visiting, browsing, or subscribing to this website, you acknowledge and accept this disclaimer and all related terms and conditions.</li>
              <li>Content posted on social media platforms, including Twitter/X, Facebook, Telegram, and YouTube, is intended solely for educational and illustrative purposes and should not be considered recommendations or investment advice. Any stocks mentioned are for illustration purposes only.</li>
              <li>I expressly disclaim any implied warranties under the laws of any jurisdiction. I intend to be subject only to the jurisdiction of the courts of Haryana, India. If you do not agree with any part of this disclaimer, please do not access or use the website. While access from outside India is not restricted, I assume no legal liability under the laws of any jurisdiction other than India.</li>
              <li>I reserve the right to modify this website, disclaimer, terms, and conditions at any time without prior notice.</li>
            </ul>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
