import React from "react";
import Link from "next/link";
import { siteConfig } from "@/lib/config";
import { HelpCircle, BookOpen, ShieldCheck, Smartphone, Mail, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Help Center & Reader FAQ",
  description: "Answers to frequently asked questions about accessing your digital library, reading across devices, and order support.",
};

export default function HelpPage() {
  const faqs = [
    {
      category: "Digital Delivery & Access",
      items: [
        {
          q: "How do I access my books after purchase?",
          a: "All purchases are delivered immediately into your secure Noveraile Cloud Library. Once your checkout is complete, click 'Start Reading' or visit My Library from the top navigation to open your book."
        },
        {
          q: "Can I download a raw PDF file?",
          a: "Noveraile books are delivered via our protected browser-based cloud reader rather than raw downloadable files. This ensures you always access the most current edition, preserves rich interactive layouts, and provides seamless progress synchronization across your devices."
        },
        {
          q: "Do my books expire?",
          a: "No. All individual digital book purchases grant lifetime access to that edition within your personal Noveraile account."
        }
      ]
    },
    {
      category: "Device Support & The Cloud Reader",
      items: [
        {
          q: "Which devices are supported?",
          a: "The Noveraile Protected Reader works seamlessly on all modern web browsers (Chrome, Safari, Firefox, Edge) across desktop PCs, Macs, iPads, Android tablets, iPhones, and Android smartphones."
        },
        {
          q: "Does my reading position save automatically?",
          a: "Yes. When you advance pages, your position is automatically synced with our servers so you can pick up precisely where you left off on any device."
        },
        {
          q: "Can I adjust fonts or switch to night mode?",
          a: "Yes. The top toolbar of the reader offers Light Paper, Warm Sepia, and Midnight Dark themes, as well as multiple font scaling levels."
        }
      ]
    },
    {
      category: "Exam Preparation & Certification Titles",
      items: [
        {
          q: "Are Noveraile exam study manuals officially affiliated with test boards?",
          a: siteConfig.disclaimer.examPrep
        },
        {
          q: "How often are exam blueprints updated?",
          a: "Our Scholarforge ED. editorial team continuously monitors credentialing body announcements. When new blueprint domain weights take effect, revised digital editions are prepared."
        }
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 space-y-12">
      <div className="text-center pb-8 border-b border-brand-border">
        <span className="text-xs font-semibold text-brand-500 uppercase tracking-widest block mb-2">
          Reader Support
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-brand-ink">
          Help Center & FAQs
        </h1>
        <p className="text-sm sm:text-base text-brand-slate mt-3 max-w-xl mx-auto font-light">
          Everything you need to know about accessing your digital publications, account settings, and reader features.
        </p>
      </div>

      <div className="space-y-10">
        {faqs.map((group, idx) => (
          <div key={idx} className="space-y-4">
            <h2 className="font-serif text-xl font-bold text-brand-ink pb-2 border-b border-gray-100 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-brand-500" />
              <span>{group.category}</span>
            </h2>

            <div className="space-y-3">
              {group.items.map((item, i) => (
                <div key={i} className="bg-white rounded-2xl border border-brand-border p-6 shadow-xs">
                  <h3 className="font-serif text-base font-bold text-brand-ink">
                    {item.q}
                  </h3>
                  <p className="text-xs sm:text-sm text-brand-slate mt-2 leading-relaxed font-light">
                    {item.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Support Contact Box */}
      <div className="bg-brand-50 rounded-2xl p-8 border border-brand-border text-center">
        <h3 className="font-serif text-xl font-bold text-brand-ink mb-2">
          Still have a question?
        </h3>
        <p className="text-xs text-brand-slate max-w-md mx-auto mb-5">
          Our editorial support desk is ready to assist you with order inquiries or account access.
        </p>
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-ink text-white font-semibold text-xs hover:bg-brand-900 transition-colors shadow-sm"
        >
          <Mail className="w-4 h-4" />
          <span>Contact Customer Support</span>
        </Link>
      </div>
    </div>
  );
}
