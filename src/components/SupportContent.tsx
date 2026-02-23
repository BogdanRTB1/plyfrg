"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, HelpCircle, Ticket, Mail, Send, Check, ChevronDown, ChevronUp, Search, ArrowLeft, Sparkles, Zap, Shield, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'support' | 'system';
    timestamp: Date;
}

export default function SupportContent() {
    const [view, setView] = useState<'home' | 'chat' | 'faq' | 'tickets'>('home');
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', text: 'Welcome to PlayForges Support! How can we help you today?', sender: 'support', timestamp: new Date() }
    ]);
    const [newMessage, setNewMessage] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, view]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            text: newMessage,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setNewMessage("");
        setIsTyping(true);

        setTimeout(() => {
            const supportMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: "Thank you for your message. An agent will be with you shortly.",
                sender: 'support',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, supportMsg]);
            setIsTyping(false);
        }, 1500);
    };

    const faqs = [
        { q: "How do I deposit funds?", a: "To deposit funds, go to your Wallet in the top navigation bar and select 'Deposit'. We support various crypto and fiat payment methods." },
        { q: "What is the minimum withdrawal amount?", a: "The minimum withdrawal amount is $10 or equivalent in cryptocurrency. Processing times vary by method." },
        { q: "How can I verify my account?", a: "Go to Settings > Profile and complete the verification steps. You may need to provide ID documents." },
        { q: "Is my personal information secure?", a: "Yes, we use industry-standard encryption to protect your data. Check our Privacy Policy for details." },
        { q: "Can I limit my daily betting?", a: "Absolutely. Visit the 'Responsible Gaming' section in your account settings to set deposit and loss limits." }
    ];

    const [openFaq, setOpenFaq] = useState<number | null>(null);

    return (
        <div className="flex-1 h-full overflow-y-auto bg-[#050505] relative custom-scrollbar">
            {/* Dynamic Background */}
            <div className="absolute inset-0 pointer-events-none fixed">
                <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#00b9f0]/10 rounded-full blur-[150px] mix-blend-screen opacity-50"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[150px] mix-blend-screen opacity-50"></div>
            </div>

            <div className="max-w-5xl mx-auto p-6 md:p-12 relative z-10 min-h-screen flex flex-col">

                <AnimatePresence mode="wait">
                    {/* HOME VIEW: DASHBOARD GRID */}
                    {view === 'home' && (
                        <motion.div
                            key="home"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
                            transition={{ duration: 0.3 }}
                            className="flex-1 flex flex-col justify-center"
                        >
                            <div className="text-center mb-16">
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[#00b9f0] text-sm font-bold mb-6"
                                >
                                    <Sparkles size={14} />
                                    <span>24/7 Priority Support</span>
                                </motion.div>
                                <motion.h1
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="text-5xl md:text-6xl font-black text-white tracking-tight mb-4"
                                >
                                    How can we <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00b9f0] to-blue-500">help you?</span>
                                </motion.h1>
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="max-w-xl mx-auto relative group"
                                >
                                    <div className="absolute inset-0 bg-[#00b9f0] rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                                    <div className="relative flex items-center bg-[#0f1923] border border-white/10 rounded-2xl p-2 shadow-2xl">
                                        <Search className="ml-4 text-slate-500" size={20} />
                                        <input
                                            type="text"
                                            placeholder="Search for answers..."
                                            className="w-full bg-transparent border-none text-white px-4 py-3 focus:outline-none placeholder-slate-500 text-lg"
                                        />
                                    </div>
                                </motion.div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <motion.button
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                    onClick={() => setView('chat')}
                                    className="col-span-1 md:col-span-2 lg:col-span-1 bg-gradient-to-br from-[#00b9f0]/20 to-[#00b9f0]/5 border border-[#00b9f0]/30 p-8 rounded-3xl text-left hover:scale-[1.02] transition-all group relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-24 bg-[#00b9f0]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-[#00b9f0]/20 transition-colors"></div>
                                    <div className="relative z-10">
                                        <div className="w-14 h-14 bg-[#00b9f0] rounded-2xl flex items-center justify-center text-[#050505] mb-6 shadow-lg shadow-[#00b9f0]/20 group-hover:shadow-[#00b9f0]/40 transition-shadow">
                                            <MessageSquare size={28} />
                                        </div>
                                        <h3 className="text-2xl font-bold text-white mb-2">Live Chat</h3>
                                        <p className="text-[#00b9f0]/80 font-medium mb-4">Wait time: &lt; 1 min</p>
                                        <p className="text-slate-300 text-sm leading-relaxed pb-8">
                                            Connect instantly with our support team for urgent issues.
                                        </p>
                                    </div>
                                    <div className="absolute bottom-6 right-6 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                                        <div className="bg-[#00b9f0] text-black px-4 py-2 rounded-lg font-bold text-sm shadow-lg shadow-[#00b9f0]/20">Start Chat</div>
                                    </div>
                                </motion.button>

                                <motion.button
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                    onClick={() => setView('faq')}
                                    className="bg-[#1a1a1a] border border-white/5 hover:border-purple-500/50 p-8 rounded-3xl text-left hover:bg-[#202020] transition-all group relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl group-hover:bg-purple-500/10 transition-colors"></div>
                                    <div className="w-12 h-12 bg-purple-500/10 text-purple-500 rounded-xl flex items-center justify-center mb-6 border border-purple-500/20">
                                        <HelpCircle size={24} />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Knowledge Base</h3>
                                    <p className="text-slate-400 text-sm">Browsed frequently asked questions and guides.</p>
                                </motion.button>

                                <motion.button
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.6 }}
                                    onClick={() => setView('tickets')}
                                    className="bg-[#1a1a1a] border border-white/5 hover:border-amber-500/50 p-8 rounded-3xl text-left hover:bg-[#202020] transition-all group relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl group-hover:bg-amber-500/10 transition-colors"></div>
                                    <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center mb-6 border border-amber-500/20">
                                        <Ticket size={24} />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">My Tickets</h3>
                                    <p className="text-slate-400 text-sm">Track the status of your ongoing support requests.</p>
                                </motion.button>

                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.7 }}
                                    className="lg:col-span-3 flex justify-center mt-8 gap-8"
                                >
                                    <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                                        <Shield size={16} />
                                        <span>Official Support Channel</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                                        <Zap size={16} />
                                        <span>Average Response: 2m</span>
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>
                    )}

                    {/* LIVE CHAT VIEW */}
                    {view === 'chat' && (
                        <motion.div
                            key="chat"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 50 }}
                            className="flex-1 flex flex-col min-h-[600px]"
                        >
                            <div className="flex items-center gap-4 mb-6">
                                <button
                                    onClick={() => setView('home')}
                                    className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 hover:text-white transition-colors"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                <div>
                                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                        Live Support
                                        <span className="flex h-3 w-3 relative">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                        </span>
                                    </h2>
                                    <p className="text-slate-400 text-sm">Connected with <span className="text-white font-bold">Agent Michael</span></p>
                                </div>
                            </div>

                            <div className="flex-1 bg-[#1a1a1a]/80 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-2xl relative">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00b9f0] via-blue-500 to-[#00b9f0]"></div>

                                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[url('/bg-pattern.svg')] bg-repeat opacity-90">
                                    {messages.map((msg) => (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            key={msg.id}
                                            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[70%] p-4 rounded-2xl text-base leading-relaxed shadow-lg ${msg.sender === 'user'
                                                    ? 'bg-[#00b9f0] text-[#050505] font-bold'
                                                    : 'bg-[#252525] text-slate-200 border border-white/5'
                                                    }`}
                                            >
                                                {msg.text}
                                                <div className={`text-[10px] mt-2 font-medium flex items-center justify-end gap-1 ${msg.sender === 'user' ? 'text-[#050505]/60' : 'text-slate-500'
                                                    }`}>
                                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    {msg.sender === 'user' && <Check size={12} />}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                    {isTyping && (
                                        <div className="flex justify-start">
                                            <div className="bg-[#252525] border border-white/5 p-4 rounded-2xl flex items-center gap-1.5 shadow-lg">
                                                <span className="w-2 h-2 bg-[#00b9f0] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                                <span className="w-2 h-2 bg-[#00b9f0] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                                <span className="w-2 h-2 bg-[#00b9f0] rounded-full animate-bounce"></span>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                <div className="p-4 bg-[#151515] border-t border-white/10">
                                    <form onSubmit={handleSendMessage} className="relative flex gap-3 items-center">
                                        <button type="button" className="p-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors shrink-0">
                                            <Zap size={20} />
                                        </button>
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Type your message..."
                                            className="flex-1 bg-[#252525] border border-white/5 rounded-xl px-5 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-[#00b9f0] focus:ring-1 focus:ring-[#00b9f0]/50 transition-all font-medium min-w-0"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!newMessage.trim()}
                                            className="p-3 bg-[#00b9f0] text-[#050505] rounded-xl hover:bg-[#38bdf8] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#00b9f0]/20 shrink-0"
                                        >
                                            <Send size={20} />
                                        </button>
                                    </form>
                                    <div className="text-center mt-2">
                                        <p className="text-[10px] text-slate-600">Enter to send. Shift + Enter for new line.</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* FAQ VIEW */}
                    {view === 'faq' && (
                        <motion.div
                            key="faq"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 50 }}
                            className="flex-1 max-w-3xl mx-auto w-full"
                        >
                            <div className="flex items-center gap-4 mb-8">
                                <button
                                    onClick={() => setView('home')}
                                    className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 hover:text-white transition-colors"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                <h2 className="text-3xl font-black text-white">Knowledge Base</h2>
                            </div>

                            <div className="bg-[#1a1a1a] border border-white/10 rounded-3xl overflow-hidden p-8 shadow-2xl">
                                <div className="space-y-4">
                                    {faqs.map((faq, idx) => (
                                        <div
                                            key={idx}
                                            className="border border-white/5 rounded-2xl overflow-hidden transition-all hover:border-[#00b9f0]/30 bg-[#222]"
                                        >
                                            <button
                                                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                                className="w-full text-left p-6 flex items-center justify-between group"
                                            >
                                                <span className="font-bold text-lg text-slate-100 group-hover:text-[#00b9f0] transition-colors">{faq.q}</span>
                                                {openFaq === idx ? <ChevronUp size={20} className="text-[#00b9f0]" /> : <ChevronDown size={20} className="text-slate-500" />}
                                            </button>
                                            <AnimatePresence>
                                                {openFaq === idx && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="px-6 pb-6 text-slate-400 leading-relaxed border-t border-white/5 pt-4">
                                                            {faq.a}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* TICKETS VIEW */}
                    {view === 'tickets' && (
                        <motion.div
                            key="tickets"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 50 }}
                            className="flex-1 max-w-4xl mx-auto w-full"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => setView('home')}
                                        className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 hover:text-white transition-colors"
                                    >
                                        <ArrowLeft size={20} />
                                    </button>
                                    <h2 className="text-3xl font-black text-white">Support Tickets</h2>
                                </div>
                                <button className="bg-amber-500 hover:bg-amber-400 text-black px-6 py-3 rounded-xl font-bold transition-all hover:scale-105 shadow-lg shadow-amber-500/20">
                                    Create New Ticket
                                </button>
                            </div>

                            <div className="bg-[#1a1a1a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl min-h-[400px] flex flex-col items-center justify-center text-center p-8">
                                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 text-slate-600">
                                    <FileText size={48} />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">No Active Tickets</h3>
                                <p className="text-slate-500 max-w-md">
                                    You don't have any open support tickets at the moment. If you need assistance, you can start a chat or create a new ticket.
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
