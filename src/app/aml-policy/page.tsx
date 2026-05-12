import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const AML_SECTIONS = [
    {
        title: "1. Introduction",
        paragraphs: [
            "This AML (Anti-Money Laundering) and KYC (Know Your Customer) Policy describes the measures adopted by Playforges (\"Company\", \"we\", \"our\", or \"platform\") to prevent and combat money laundering, terrorist financing, fraud, and other illegal activities associated with the use of our sweepstakes platform.",
            "Playforges is committed to complying with all applicable laws and regulations related to anti-money laundering and customer identity verification.",
            "By using the Playforges platform, users agree to comply with this AML and KYC Policy.",
        ],
    },
    {
        title: "2. Purpose of This Policy",
        paragraphs: ["The purpose of this policy is to:"],
        bullets: [
            "prevent the platform from being used for illegal activities;",
            "identify and verify users;",
            "monitor suspicious transactions and activities;",
            "reduce fraud risks;",
            "ensure compliance with applicable laws and regulations.",
        ],
    },
    {
        title: "3. Eligibility and Restrictions",
        paragraphs: ["Playforges only allows access to individuals who:"],
        bullets: [
            "are of legal age in their jurisdiction;",
            "provide accurate and complete information;",
            "are not listed on international sanctions lists;",
            "do not use the platform on behalf of another person without legal authorization.",
        ],
        footer: "The Company reserves the right to restrict or suspend access to users from prohibited or high-risk jurisdictions.",
    },
    {
        title: "4. KYC (Know Your Customer) Procedures",
        paragraphs: ["Playforges may require identity verification before:"],
        bullets: [
            "approving withdrawals;",
            "granting certain rewards or prizes;",
            "providing access to specific features;",
            "processing transactions considered high risk.",
        ],
    },
    {
        title: "4.1 Required Documents",
        paragraphs: ["The Company may request one or more of the following documents:"],
        bullets: [
            "government-issued ID card or passport;",
            "driver's license;",
            "proof of address;",
            "selfie or biometric verification;",
            "proof of payment method ownership;",
            "additional documents deemed necessary.",
        ],
    },
    {
        title: "4.2 Verification Methods",
        paragraphs: ["Playforges may use third-party verification providers to confirm:"],
        bullets: [
            "document authenticity;",
            "user identity;",
            "source of funds;",
            "fraud history;",
            "international sanctions screening.",
        ],
    },
    {
        title: "5. Transaction Monitoring",
        paragraphs: ["Playforges monitors user activity to identify suspicious behavior, including:"],
        bullets: [
            "unusual or repetitive transactions;",
            "use of multiple accounts;",
            "attempts to bypass verification procedures;",
            "suspicious payment methods;",
            "activities associated with fraud or chargebacks;",
            "use of VPNs or identity masking tools.",
        ],
        footer: "The Company reserves the right to investigate any suspicious activity.",
    },
    {
        title: "6. Reporting Suspicious Activities",
        paragraphs: ["If suspicious activity is identified, Playforges may:"],
        bullets: [
            "temporarily suspend the account;",
            "block transactions or withdrawals;",
            "request additional documentation;",
            "report activity to competent authorities;",
            "permanently terminate the user account.",
        ],
        footer: "Playforges is not obligated to inform users about ongoing AML investigations where prohibited by law.",
    },
    {
        title: "7. Source of Funds",
        paragraphs: [
            "Upon request, users must demonstrate that the funds used on the platform originate from lawful sources.",
            "Accepted documents may include:",
        ],
        bullets: [
            "bank statements;",
            "salary or payroll documents;",
            "tax documentation;",
            "business activity documentation;",
            "other relevant financial records.",
        ],
        footer: "Failure to provide requested documents may result in account suspension or termination.",
    },
    {
        title: "8. Prohibited and Fraudulent Activities",
        paragraphs: ["The following activities are strictly prohibited:"],
        bullets: [
            "use of false identities;",
            "operation of multiple accounts;",
            "manipulation of sweepstakes promotions;",
            "use of bots or automated systems;",
            "financial fraud;",
            "abusive chargebacks;",
            "using the platform for money laundering purposes.",
        ],
        footer: "Violations may result in confiscation of funds, permanent suspension, and reporting to law enforcement or regulatory authorities.",
    },
    {
        title: "9. Data Retention",
        paragraphs: [
            "Playforges may retain documents and information collected for AML/KYC purposes for the period required by applicable law.",
            "All data is securely stored and used solely for:",
        ],
        bullets: [
            "legal compliance;",
            "fraud prevention;",
            "anti-money laundering purposes;",
            "dispute resolution.",
        ],
    },
    {
        title: "10. Data Protection",
        paragraphs: [
            "Playforges processes personal data in accordance with applicable data protection laws, including the General Data Protection Regulation (GDPR), where applicable.",
            "For more information, users should refer to the platform's Privacy Policy.",
        ],
    },
    {
        title: "11. Right to Suspend or Terminate Accounts",
        paragraphs: ["Playforges reserves the right to:"],
        bullets: [
            "refuse account registration;",
            "suspend user access;",
            "block withdrawals;",
            "cancel transactions;",
            "permanently close suspicious accounts.",
        ],
        footer: "These measures may be applied without prior notice when there are reasonable grounds to suspect violations of this policy or applicable laws.",
    },
    {
        title: "12. Changes to This Policy",
        paragraphs: [
            "Playforges may update or modify this AML and KYC Policy at any time.",
            "The latest version will be published on the website, and continued use of the platform constitutes acceptance of any modifications.",
        ],
    },
    {
        title: "13. Contact Information",
        contact: [
            "Playforges",
            "Operated by: Sentinel Technologies Platform LLC",
            "Jurisdiction: Wyoming, United States",
            "Identification Number: 2026-001857558",
            "Office Address: 30 N Gould St Ste R Sheridan, WY 82801 USA",
            "Email: lorenzo@playforges.com",
            "Website: https://www.playforges.us",
        ],
    },
];

export default function AmlPolicyPage() {
    return (
        <div className="flex-1 h-full overflow-y-auto custom-scrollbar bg-[#050505]">
            <div className="max-w-4xl mx-auto p-6 md:p-12 pb-32">
                <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 text-sm font-medium">
                    <ArrowLeft size={16} />
                    Back to Home
                </Link>

                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-8">AML Policy</h1>

                <div className="p-6 md:p-10 bg-[#0f212e] rounded-3xl border border-white/5 shadow-xl">
                    <div className="space-y-8 text-slate-300">
                        {AML_SECTIONS.map((section) => (
                            <section key={section.title} className="space-y-4">
                                <h2 className="text-2xl font-bold text-white">{section.title}</h2>

                                {section.paragraphs?.map((paragraph) => (
                                    <p key={paragraph} className="leading-relaxed">
                                        {paragraph}
                                    </p>
                                ))}

                                {section.bullets && (
                                    <ul className="list-disc space-y-2 pl-6 leading-relaxed">
                                        {section.bullets.map((item) => (
                                            <li key={item}>{item}</li>
                                        ))}
                                    </ul>
                                )}

                                {section.footer && (
                                    <p className="leading-relaxed">
                                        {section.footer}
                                    </p>
                                )}

                                {section.contact && (
                                    <div className="space-y-2 rounded-2xl bg-[#071d2a] p-5 border border-white/5">
                                        {section.contact.map((item) => (
                                            <p key={item} className="leading-relaxed">
                                                {item}
                                            </p>
                                        ))}
                                    </div>
                                )}
                            </section>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
