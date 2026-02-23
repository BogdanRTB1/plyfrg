"use client";

import { motion } from "framer-motion";
import { Rocket, Zap, Globe, Coins, ArrowRight, Code, BarChart, Gem, Gamepad2 } from "lucide-react";
import Particles from "./Particles";
import Link from "next/link";

export default function BecomeCreatorContent() {
    const benefits = [
        {
            icon: <Globe className="text-blue-400" size={28} />,
            title: "Global Distribution",
            desc: "Reach millions of players worldwide from day one with our massive built-in audience."
        },
        {
            icon: <Coins className="text-amber-400" size={28} />,
            title: "85% Revenue Share",
            desc: "Keep the lion's share of your earnings. We believe creators should be rewarded."
        },
        {
            icon: <Zap className="text-sky-400" size={28} />,
            title: "Powerful SDK",
            desc: "Integrate achievements, leaderboards, and multiplayer with just a few lines of code."
        },
        {
            icon: <BarChart className="text-purple-400" size={28} />,
            title: "Real-time Analytics",
            desc: "Track player engagement, retention, and monetization with our powerful dashboard."
        },
        {
            icon: <Gem className="text-emerald-400" size={28} />,
            title: "Crypto Monetization",
            desc: "Native support for crypto payments, NFTs, and custom tokens within your game."
        },
        {
            icon: <Gamepad2 className="text-pink-400" size={28} />,
            title: "Cross-platform",
            desc: "Deploy once, run anywhere. Seamlessly support Web, Desktop, and Mobile players."
        }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.3
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } }
    };

    return (
        <div className="flex-1 h-full overflow-y-auto bg-[#050505] relative custom-scrollbar z-0">
            {/* Dynamic Background */}
            <div className="absolute inset-0 pointer-events-none z-[-1]">
                <Particles
                    particleColors={["#ffffff", "#00b9f0"]}
                    particleCount={200}
                    particleSpread={10}
                    speed={0.1}
                    particleBaseSize={100}
                    moveParticlesOnHover={true}
                    alphaParticles={false}
                    disableRotation={false}
                />
            </div>
            {/* Ambient Gradients */}
            <div className="absolute top-0 right-[-10%] w-[60%] h-[600px] bg-[#00b9f0]/10 blur-[120px] rounded-full pointer-events-none z-[-1]" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[500px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none z-[-1]" />

            <div className="max-w-[1400px] mx-auto px-6 py-20 lg:py-32 relative z-10 flex flex-col pt-32">

                {/* Hero Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-40">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={containerVariants}
                        className="flex flex-col items-start text-left"
                    >
                        <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/10 text-[#00b9f0] text-sm font-bold mb-8 backdrop-blur-md shadow-[0_0_20px_rgba(0,185,240,0.15)]">
                            <Rocket size={16} />
                            <span>PlayForges Creator Program</span>
                        </motion.div>

                        <motion.h1 variants={itemVariants} className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.1] tracking-tight mb-8">
                            Build the <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00b9f0] to-[#8adffc] drop-shadow-sm">
                                Future of Gaming
                            </span>
                        </motion.h1>

                        <motion.p variants={itemVariants} className="text-slate-400 text-lg md:text-xl max-w-xl mb-10 leading-relaxed font-medium">
                            Join thousands of developers building immersive experiences. Monetize your passion, leverage bleeding-edge tools, and reach a global audience instantly.
                        </motion.p>

                        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-[#00b9f0] via-blue-500 to-sky-600 rounded-xl blur opacity-60 group-hover:opacity-100 transition duration-500 group-hover:duration-200"></div>
                                <button className="relative w-full sm:w-auto flex items-center justify-center gap-3 bg-[#0f212e] text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-[#152a3a] transition-colors">
                                    <span>Start Creating</span>
                                    <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                                </button>
                            </div>
                            <button className="flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 px-8 py-4 rounded-xl font-bold text-lg transition-all backdrop-blur-sm">
                                <Code size={20} />
                                <span>Read Docs</span>
                            </button>
                        </motion.div>
                    </motion.div>

                    {/* Hero Visual Mockup */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, rotateY: 15 }}
                        animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                        transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                        className="relative hidden lg:block perspective-1000"
                    >
                        <div className="relative w-full aspect-square max-w-lg mx-auto">
                            {/* Main Floating Card */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[300px] bg-gradient-to-br from-[#0f212e]/90 to-[#050505]/95 rounded-3xl border border-white/10 backdrop-blur-xl shadow-2xl p-6 flex flex-col justify-between overflow-hidden group">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00b9f0] to-blue-600 opacity-50"></div>

                                <div className="flex justify-between items-center mb-8 relative z-10">
                                    <div>
                                        <h3 className="text-white font-bold text-lg">Revenue Overview</h3>
                                        <p className="text-slate-400 text-sm">Last 30 Days</p>
                                    </div>
                                    <div className="h-10 w-10 rounded-full bg-[#00b9f0]/20 flex items-center justify-center text-[#00b9f0]">
                                        <BarChart size={20} />
                                    </div>
                                </div>

                                <div className="relative z-10">
                                    <div className="text-4xl font-black text-white mb-2">$24,592.80</div>
                                    <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold">
                                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-400/20">↑</span>
                                        +14.5% vs last month
                                    </div>
                                </div>

                                {/* Abstract Chart Graphic */}
                                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0f212e] to-transparent z-0"></div>
                                <svg className="absolute bottom-0 left-0 right-0 w-full opacity-30" viewBox="0 0 100 40" preserveAspectRatio="none">
                                    <path d="M0,40 L0,20 Q10,10 20,25 T40,15 T60,30 T80,10 T100,20 L100,40 Z" fill="url(#chart-gradient)" />
                                    <defs>
                                        <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#00b9f0" stopOpacity="1" />
                                            <stop offset="100%" stopColor="#00b9f0" stopOpacity="0" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                            </div>

                            {/* Floating Card 2 */}
                            <motion.div
                                animate={{ y: [-10, 10, -10] }}
                                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute -top-10 -right-10 bg-[#0f212e]/80 backdrop-blur-xl rounded-2xl p-4 border border-white/10 shadow-xl flex items-center gap-4"
                            >
                                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                                    <Gem className="text-purple-400" size={24} />
                                </div>
                                <div>
                                    <div className="text-sm text-slate-400 font-medium">New Item Sold</div>
                                    <div className="text-white font-bold">Legendary Sword</div>
                                </div>
                            </motion.div>

                            {/* Floating Card 3 */}
                            <motion.div
                                animate={{ y: [10, -10, 10] }}
                                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                                className="absolute -bottom-10 -left-10 bg-[#0f212e]/80 backdrop-blur-xl rounded-2xl p-4 border border-white/10 shadow-xl flex items-center gap-4"
                            >
                                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                                    <Rocket className="text-amber-400" size={24} />
                                </div>
                                <div>
                                    <div className="text-sm text-slate-400 font-medium">Game Status</div>
                                    <div className="text-white font-bold flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                        Live & Trending
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>

                {/* Features Section */}
                <div className="mb-32">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-3xl md:text-5xl font-black text-white mb-6">Why Build on <span className="text-[#00b9f0]">PlayForges?</span></h2>
                        <p className="text-slate-400 text-lg md:text-xl max-w-3xl mx-auto">We provide the most developer-friendly ecosystem, empowering you to focus on what matters most: making incredible games.</p>
                    </motion.div>

                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {benefits.map((feature, idx) => (
                            <motion.div
                                key={idx}
                                variants={itemVariants}
                                className="bg-[#101923]/80 backdrop-blur-sm border border-white/5 p-8 rounded-3xl hover:bg-[#152331]/90 hover:border-white/10 transition-all group hover:-translate-y-1 duration-300"
                            >
                                <div className="bg-white/5 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-white/10 transition-colors">
                                    {feature.icon}
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-[#00b9f0] transition-colors">{feature.title}</h3>
                                <p className="text-slate-400 text-base leading-relaxed">
                                    {feature.desc}
                                </p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>

                {/* Bottom CTA Banner */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="relative rounded-[40px] overflow-hidden p-1"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-[#00b9f0] via-blue-600 to-purple-600 opacity-30 animate-pulse"></div>
                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay"></div>

                    <div className="relative bg-[#050B14]/90 backdrop-blur-2xl rounded-[36px] p-12 lg:p-20 text-center border border-white/10 flex flex-col items-center">
                        <h2 className="text-4xl md:text-6xl font-black text-white mb-6">Ready to <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00b9f0] to-[#8adffc]">Forge Your Legacy?</span></h2>
                        <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-12">
                            Join the fastest growing web3 gaming platform today. Deployment takes less than 10 minutes.
                        </p>

                        <button className="flex items-center gap-4 bg-white text-[#0f212e] px-10 py-5 rounded-2xl font-black text-xl hover:bg-slate-200 transition-colors shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-105 duration-300">
                            Apply as Creator
                            <ArrowRight size={24} />
                        </button>
                    </div>
                </motion.div>

            </div>
        </div>
    );
}

