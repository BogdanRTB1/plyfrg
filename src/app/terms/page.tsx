import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
    return (
        <div className="flex-1 h-full overflow-y-auto custom-scrollbar bg-[#050505]">
            <div className="max-w-4xl mx-auto p-6 md:p-12 pb-32">
                <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 text-sm font-medium">
                    <ArrowLeft size={16} />
                    Back to Home
                </Link>

                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-8">Terms & Conditions</h1>

                <div className="prose prose-invert prose-slate max-w-none">
                    <div className="p-6 bg-[#0f212e] rounded-2xl border border-white/5 space-y-6">
                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
                            <p className="text-slate-400 leading-relaxed text-sm md:text-base">
                                By accessing and using PlayForges, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you must not use our services.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">2. Eligibility</h2>
                            <p className="text-slate-400 leading-relaxed text-sm md:text-base">
                                You must be at least 18 years old or the age of legal majority in your jurisdiction to use PlayForges. By creating an account, you represent and warrant that you meet this requirement.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">3. User Accounts</h2>
                            <p className="text-slate-400 leading-relaxed text-sm md:text-base">
                                You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">4. Virtual Currency and Wagers</h2>
                            <p className="text-slate-400 leading-relaxed text-sm md:text-base">
                                All wagers and transactions are final. PlayForges is not responsible for any losses incurred during gameplay. Our games use a Provably Fair mechanism to ensure completely random and unbiased outcomes.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
