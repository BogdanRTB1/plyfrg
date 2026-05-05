import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookOpen, Layers, Gauge, Shield, Wallet, Mail } from "lucide-react";

export const metadata: Metadata = {
    title: "Creator Program Documentation | PlayForges",
    description: "Apply, publish custom games, and understand revenue, compliance, and the Creator Studio on PlayForges.",
};

export default function CreatorProgramDocsPage() {
    return (
        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar bg-[#050B14] min-h-0">
            <div className="max-w-3xl mx-auto space-y-10 px-4 py-10 sm:px-6 sm:py-14 lg:py-16">
                <div>
                    <Link
                        href="/become-creator"
                        className="inline-flex items-center gap-2 text-sm font-bold text-[#00b9f0] hover:text-[#8adffc] mb-6"
                    >
                        <ArrowLeft size={18} />
                        Back to Become a Creator
                    </Link>
                    <div className="flex items-center gap-3 text-[#00b9f0] mb-4">
                        <BookOpen size={28} />
                        <span className="text-xs font-black uppercase tracking-widest text-slate-500">Documentation</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">
                        PlayForges Creator Program
                    </h1>
                    <p className="text-slate-400 text-base leading-relaxed">
                        This guide explains how to join the program, build games in Creator Studio, publish to the casino lobby, and how earnings and compliance work on the platform.
                    </p>
                </div>

                <section className="rounded-2xl border border-white/10 bg-[#0b1622]/80 p-6 sm:p-8 space-y-4">
                    <h2 className="text-lg font-black text-white flex items-center gap-2">
                        <Shield size={20} className="text-emerald-400" />
                        1. Eligibility &amp; application
                    </h2>
                    <ul className="list-disc pl-5 text-slate-300 space-y-2 text-sm leading-relaxed">
                        <li>Sign in with your PlayForges account and complete the creator application (social links, audience, and sample work where requested).</li>
                        <li>Approvals are reviewed manually; you will get access to Creator Studio once your profile is listed in the <code className="text-amber-200/90">creators</code> table after approval.</li>
                        <li>Only use assets and themes you have rights to publish; no misleading branding or copyrighted IP without permission.</li>
                    </ul>
                </section>

                <section className="rounded-2xl border border-white/10 bg-[#0b1622]/80 p-6 sm:p-8 space-y-4">
                    <h2 className="text-lg font-black text-white flex items-center gap-2">
                        <Layers size={20} className="text-purple-400" />
                        2. Creator Studio &amp; game types
                    </h2>
                    <p className="text-slate-300 text-sm leading-relaxed">
                        Creator Studio lets you configure templates for supported game types (for example slots, crash, wheel, mines, cases, scratch, and Hi-Lo). Each type has tabs for design, math / odds where applicable, and preview before publish.
                    </p>
                    <ul className="list-disc pl-5 text-slate-300 space-y-2 text-sm leading-relaxed">
                        <li><strong className="text-white">Symbols &amp; paytable (slots)</strong>: Define icons, payouts for 3/4/5 of a kind, wild/scatter behaviour, and volatility presets.</li>
                        <li><strong className="text-white">Publishing</strong>: A lobby cover image and display name are required so your game appears correctly in trending and creator profiles.</li>
                        <li><strong className="text-white">Preview</strong>: Use in-client preview to test configuration before players see the live build.</li>
                    </ul>
                </section>

                <section className="rounded-2xl border border-white/10 bg-[#0b1622]/80 p-6 sm:p-8 space-y-4">
                    <h2 className="text-lg font-black text-white flex items-center gap-2">
                        <Gauge size={20} className="text-amber-400" />
                        3. House edge &amp; fairness
                    </h2>
                    <p className="text-slate-300 text-sm leading-relaxed">
                        Exported games are tuned against platform RTP and house-edge guardrails so play stays sustainable and consistent with server-side logic. Severe outliers are clamped at publish time; your Creator Studio previews should match published behaviour within those rules.
                    </p>
                </section>

                <section className="rounded-2xl border border-white/10 bg-[#0b1622]/80 p-6 sm:p-8 space-y-4">
                    <h2 className="text-lg font-black text-white flex items-center gap-2">
                        <Wallet size={20} className="text-sky-400" />
                        4. Revenue &amp; payouts
                    </h2>
                    <ul className="list-disc pl-5 text-slate-300 space-y-2 text-sm leading-relaxed">
                        <li>Earnings attributable to your games accrue according to platform rules (house profit share on attributed play).</li>
                        <li>Use the Finances area in Creator Studio to review per-game metrics and aggregated balances.</li>
                        <li>Withdrawal or redeem flows must use verified contact details and valid payout instructions as prompted in-product.</li>
                    </ul>
                </section>

                <section className="rounded-2xl border border-white/10 bg-[#0b1622]/80 p-6 sm:p-8 space-y-4">
                    <h2 className="text-lg font-black text-white flex items-center gap-2">
                        <Mail size={20} className="text-pink-400" />
                        5. Support &amp; updates
                    </h2>
                    <p className="text-slate-300 text-sm leading-relaxed mb-4">
                        Product behaviour and percentages may evolve; critical changes will be communicated in-app or via registered email where applicable.
                    </p>
                    <p className="text-slate-500 text-xs leading-relaxed">
                        These docs are informational and do not replace the Terms of Service or any separate agreement you accept when using creator features.
                    </p>
                </section>

                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                    <Link
                        href="/become-creator"
                        className="inline-flex justify-center rounded-xl bg-gradient-to-r from-[#00b9f0] to-sky-600 px-8 py-4 font-black text-[#050B14] hover:brightness-110 transition-all text-center"
                    >
                        Apply as Creator
                    </Link>
                    <Link
                        href="/support"
                        className="inline-flex justify-center rounded-xl border border-white/15 bg-white/[0.04] px-8 py-4 font-bold text-white hover:bg-white/10 transition-all text-center"
                    >
                        Contact Support
                    </Link>
                </div>
            </div>
        </div>
    );
}
