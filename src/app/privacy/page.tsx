import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
    return (
        <div className="flex-1 h-full overflow-y-auto custom-scrollbar bg-[#050505]">
            <div className="max-w-4xl mx-auto p-6 md:p-12 pb-32">
                <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 text-sm font-medium">
                    <ArrowLeft size={16} />
                    Back to Home
                </Link>

                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-8">Privacy Policy</h1>

                <div className="prose prose-invert prose-slate max-w-none">
                    <div className="p-6 bg-[#0f212e] rounded-2xl border border-white/5 space-y-6">
                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">1. Information We Collect</h2>
                            <p className="text-slate-400 leading-relaxed text-sm md:text-base">
                                We gather basic information needed to run our services effectively, such as the email address you use to sign up, username, and account interactions. We also use strictly necessary cookies to keep you logged in.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">2. How We Use Your Information</h2>
                            <p className="text-slate-400 leading-relaxed text-sm md:text-base">
                                The information collected is used solely to provide, maintain, and improve our services, communicate with you, and personalize your experience. We do not sell your personal data to third parties.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">3. Data Security</h2>
                            <p className="text-slate-400 leading-relaxed text-sm md:text-base">
                                We implement appropriate technical securely measures designed to protect your personal information against accidental, unlawful, or unauthorized destruction, loss, alteration, access, disclosure, or use.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">4. Your Rights</h2>
                            <p className="text-slate-400 leading-relaxed text-sm md:text-base">
                                You have the right to access, update, or delete your account information at any time. For extended data requests or account termination, please contact our support team.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
