"use client";

import { useState, useEffect, useRef } from "react";
import { Search, ArrowLeft, Send, Check, MessageCircle, Clock, Filter, User } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function AdminSupportContent() {
    const [tickets, setTickets] = useState<any[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

    useEffect(() => {
        const fetchTickets = async () => {
            const { data } = await supabase
                .from('support_tickets')
                .select('*, profiles:user_id(full_name, avatar_url, email)')
                .order('updated_at', { ascending: false });
            
            if (data) setTickets(data);
            setLoading(false);
        };

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        fetchTickets();

        // Real-time for ticket updates
        const ticketSub = supabase
            .channel('public:support_tickets')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, () => {
                fetchTickets();
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
            supabase.removeChannel(ticketSub);
        };
    }, []);

    useEffect(() => {
        if (selectedTicket) {
            fetchMessages(selectedTicket.id);
            
            // Real-time for messages
            const msgSub = supabase
                .channel('admin:messages')
                .on('postgres_changes', { 
                    event: 'INSERT', 
                    schema: 'public', 
                    table: 'support_messages',
                    filter: `ticket_id=eq.${selectedTicket.id}`
                }, (payload) => {
                    const m = payload.new;
                    setMessages(prev => {
                        if (prev.some(msg => msg.id === m.id)) return prev;
                        return [...prev, m];
                    });
                })
                .subscribe();

            return () => {
                supabase.removeChannel(msgSub);
            };
        } else {
            setMessages([]);
        }
    }, [selectedTicket]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const fetchMessages = async (tId: string) => {
        const { data } = await supabase
            .from('support_messages')
            .select('*')
            .eq('ticket_id', tId)
            .order('created_at', { ascending: true });
        if (data) setMessages(data);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedTicket || !user) return;

        const content = newMessage;
        setNewMessage("");

        const { error } = await supabase.from('support_messages').insert({
            ticket_id: selectedTicket.id,
            sender_id: user.id,
            content: content,
            is_ai: false
        });

        if (error) {
            toast.error("Failed to send message");
            setNewMessage(content);
        } else {
            // Update ticket status to open if it was ai_handling
            if (selectedTicket.status === 'ai_handling') {
                await supabase.from('support_tickets')
                    .update({ status: 'open', updated_at: new Date().toISOString() })
                    .eq('id', selectedTicket.id);
            } else {
                await supabase.from('support_tickets')
                    .update({ updated_at: new Date().toISOString() })
                    .eq('id', selectedTicket.id);
            }
        }
    };

    const closeTicket = async (tId: string) => {
        const { error } = await supabase
            .from('support_tickets')
            .update({ status: 'closed', updated_at: new Date().toISOString() })
            .eq('id', tId);
        if (!error) {
            toast.success("Ticket closed");
            if (selectedTicket?.id === tId) setSelectedTicket(null);
        }
    };

    if (loading) return <div className="p-20 text-center text-slate-500">Loading Support Manager...</div>;

    return (
        <div className="flex h-[calc(100vh-80px)] bg-[#050505] text-white">
            {/* Ticket List */}
            <div className={`w-full md:w-80 border-r border-white/5 flex flex-col ${selectedTicket ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-white/5 bg-[#0a0a0a]">
                    <h2 className="text-xl font-black flex items-center gap-2 mb-4">
                        <MessageCircle size={20} className="text-[#00b9f0]" />
                        Support Tickets
                    </h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input 
                            type="text" 
                            placeholder="Search tickets..." 
                            className="w-full bg-[#151515] border border-white/10 rounded-lg py-2 pl-10 pr-4 text-xs focus:outline-none focus:border-[#00b9f0] transition-all"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                    {tickets.length === 0 ? (
                        <div className="p-10 text-center text-slate-600 italic text-sm">No tickets found</div>
                    ) : (
                        tickets.map(t => (
                            <button
                                key={t.id}
                                onClick={() => setSelectedTicket(t)}
                                className={`w-full text-left p-4 rounded-xl transition-all border ${selectedTicket?.id === t.id ? 'bg-[#00b9f0]/10 border-[#00b9f0]/30' : 'bg-[#1a1a1a]/50 border-white/5 hover:bg-[#1a1a1a]'}`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-[10px] font-bold text-slate-500 font-mono">#{t.id.slice(0, 8)}</span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${t.status === 'open' ? 'bg-amber-500/20 text-amber-500' : t.status === 'ai_handling' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-500'}`}>
                                        {t.status}
                                    </span>
                                </div>
                                <h4 className="font-bold text-sm truncate mb-1">{t.profiles?.full_name || t.profiles?.email || 'Unknown User'}</h4>
                                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                    <Clock size={10} />
                                    {new Date(t.updated_at).toLocaleString()}
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className={`flex-1 flex flex-col relative ${!selectedTicket ? 'hidden md:flex' : 'flex'}`}>
                {selectedTicket ? (
                    <>
                        <div className="p-4 border-b border-white/5 bg-[#0a0a0a] flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button onClick={() => setSelectedTicket(null)} className="md:hidden p-2 hover:bg-white/5 rounded-lg text-slate-400"><ArrowLeft size={20} /></button>
                                <div>
                                    <h3 className="font-bold text-lg flex items-center gap-2">
                                        {selectedTicket.profiles?.full_name || selectedTicket.profiles?.email}
                                        <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-slate-500 font-mono">Agent ID: Admin</span>
                                    </h3>
                                    <p className="text-xs text-[#00b9f0] font-medium">{selectedTicket.profiles?.email}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => closeTicket(selectedTicket.id)}
                                className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-xs font-bold transition-all border border-red-500/20"
                            >
                                Close Ticket
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[url('/bg-pattern.svg')] bg-repeat opacity-95 custom-scrollbar">
                            {messages.map(m => (
                                <div key={m.id} className={`flex ${m.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] p-4 rounded-2xl ${m.sender_id === user?.id ? 'bg-[#00b9f0] text-black font-bold' : 'bg-[#1a1a1a] border border-white/10 text-slate-200'}`}>
                                        <p className="text-sm leading-relaxed">{m.content}</p>
                                        <div className={`text-[10px] mt-2 font-medium opacity-60 flex items-center justify-end gap-1`}>
                                            {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            {m.sender_id === user?.id && <Check size={12} />}
                                            {m.is_ai && <span className="bg-blue-500/20 text-blue-400 px-1 rounded ml-1">AI</span>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-4 bg-[#0a0a0a] border-t border-white/5">
                            <form onSubmit={handleSendMessage} className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type your reply as Admin..."
                                    className="flex-1 bg-[#151515] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00b9f0] transition-all"
                                />
                                <button 
                                    type="submit" 
                                    disabled={!newMessage.trim()}
                                    className="p-3 bg-[#00b9f0] text-black rounded-xl hover:bg-[#38bdf8] disabled:opacity-50 transition-all shadow-lg shadow-[#00b9f0]/10"
                                >
                                    <Send size={18} />
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-10 bg-[#050505]">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 text-slate-700">
                            <MessageCircle size={40} />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Select a Ticket</h3>
                        <p className="text-slate-500 max-w-sm text-sm">Choose a support request from the list on the left to start responding to users.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
