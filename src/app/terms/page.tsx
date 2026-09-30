import React from "react";
import { siteConfig } from "@/lib/config";

export const metadata = {
  title: "Terms of Service",
  description: "Terms of service and digital reading access license agreement for Noveraile Publishing.",
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 space-y-8">
      <div className="pb-6 border-b border-brand-border">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-brand-ink">
          Terms of Service
        </h1>
        <p className="text-xs text-brand-muted mt-2">Last updated: January 2026</p>
      </div>

      <div className="prose max-w-none font-serif text-brand-slate text-base leading-relaxed space-y-6">
        <h2 className="text-xl font-bold text-brand-ink">1. Agreement to Terms</h2>
        <p>
          By accessing or purchasing digital publications from {siteConfig.name} ({siteConfig.domain}), you agree to be bound by these Terms of Service, all applicable laws, and regulations.
        </p>

        <h2 className="text-xl font-bold text-brand-ink">2. License Grant & Restrictions</h2>
        <p>
          Upon verified payment, {siteConfig.name} grants you a non-exclusive, non-transferable, revocable personal license to view the purchased digital publication through our protected online cloud reader.
        </p>
        <p>
          You agree NOT to:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Extract, mass-scrape, reverse-engineer, or attempt to circumvent digital rights controls.</li>
          <li>Redistribute, sublicense, resell, or publicly display full book contents.</li>
          <li>Share reader account credentials for concurrent multi-party commercial utilization.</li>
        </ul>

        <h2 className="text-xl font-bold text-brand-ink">3. Intellectual Property</h2>
        <p>
          All textual materials, formulas, question banks, cover artwork, and digital reader software remain the exclusive intellectual property of {siteConfig.name} and its contributing authors.
        </p>

        <h2 className="text-xl font-bold text-brand-ink">4. Independent Publisher Disclaimers</h2>
        <p>
          {siteConfig.disclaimer.examPrep}
        </p>

        <h2 className="text-xl font-bold text-brand-ink">5. Disclaimer of Warranties ("As-Is")</h2>
        <p>
          TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, ALL DIGITAL PUBLICATIONS, STUDY MATERIALS, PRACTICE QUESTIONS, AND READER SERVICES ARE PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.
        </p>
        <p>
          {siteConfig.name} EXPRESSLY DISCLAIMS ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT. WE DO NOT WARRANT OR GUARANTEE THAT THE PUBLICATIONS WILL ENSURE PASSING SCORES ON ANY OFFICIAL LICENSURE OR CERTIFICATION EXAMINATION, OR THAT SERVICE ACCESS WILL BE UNINTERRUPTED OR ERROR-FREE.
        </p>

        <h2 className="text-xl font-bold text-brand-ink">6. Limitation of Liability</h2>
        <p>
          UNDER NO CIRCUMSTANCES, INCLUDING NEGLIGENCE, SHALL {siteConfig.name}, ITS DIRECTORS, OFFICERS, EMPLOYEES, AFFILIATES, AGENTS, CONTRACTORS, OR CONTRIBUTING AUTHORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, LOSS OF CAREER OPPORTUNITIES, LOSS OF DATA, OR COST OF SUBSTITUTE GOODS ARISING OUT OF OR IN CONNECTION WITH YOUR USE OR INABILITY TO USE OUR SERVICES OR PUBLICATIONS.
        </p>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL THE TOTAL AGGREGATE LIABILITY OF {siteConfig.name} EXCEED THE ACTUAL AMOUNT PAID BY YOU FOR THE SPECIFIC PUBLICATION OR TRANSACTION GIVING RISE TO THE CLAIM DURING THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
        </p>

        <h2 className="text-xl font-bold text-brand-ink">7. Purchases, Pricing & Refund Policy</h2>
        <p>
          All prices are quoted in USD or locally converted currencies at prevailing rates. We honor a transparent 14-Day Reader Satisfaction Guarantee on all digital purchases subject to the terms detailed in our{" "}
          <a href="/refunds" className="text-brand-ink font-semibold underline hover:text-amber-800">
            Refund Policy
          </a>
          .
        </p>

        <h2 className="text-xl font-bold text-brand-ink">8. Indemnification</h2>
        <p>
          You agree to defend, indemnify, and hold harmless {siteConfig.name}, its affiliates, licensors, and service providers from and against any claims, liabilities, damages, judgments, awards, losses, costs, expenses, or legal fees arising out of or relating to your violation of these Terms of Service or unauthorized redistribution of our copyrighted materials.
        </p>

        <h2 className="text-xl font-bold text-brand-ink">9. Governing Law & Dispute Resolution</h2>
        <p>
          These Terms of Service and any dispute arising from them shall be governed by and construed in accordance with applicable laws, without regard to its conflict of law principles. Any dispute, controversy, or claim shall first be submitted to good-faith informal negotiation by contacting our legal team.
        </p>

        <h2 className="text-xl font-bold text-brand-ink">10. Contact Information</h2>
        <p>
          If you have questions, feedback, or legal inquiries regarding these Terms of Service, please contact us at:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Email: <a href={`mailto:${siteConfig.contactEmail}`} className="underline font-semibold text-brand-ink">{siteConfig.contactEmail}</a></li>
          <li>Publisher Portal: {siteConfig.domain}</li>
        </ul>
      </div>
    </div>
  );
}
