"use client";
/* eslint-disable */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
}

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = "Confirm",
    cancelText = "Cancel",
    isDanger = false
}: ConfirmModalProps) {
    const [mounted, setMounted] = useState(false);
    const [show, setShow] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            requestAnimationFrame(() => {
                setShow(true);
            });
        } else {
            document.body.style.overflow = 'unset';
            setShow(false);
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!mounted) return null;

    // Keep rendered for a moment to allow exit animation if we were handling unmounting delay.
    // For now, simple return null on !isOpen acts instantly, but we want the enter animation.
    if (!isOpen) return null;

    return createPortal(
        <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-300 ${show ? "opacity-100 visible" : "opacity-0 invisible"}`} onClick={onClose}>
            <div
                className={`bg-[#0f212e]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl transform transition-all duration-300 ${show ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 translate-y-4"}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex flex-col items-center text-center">
                    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                    <p className="text-slate-400 text-sm mb-6">{description}</p>

                    <div className="flex w-full gap-3">
                        <button
                            className="flex-1 px-4 py-2.5 rounded-xl text-slate-400 font-bold text-sm bg-white/5 hover:bg-white/10 hover:text-white transition-colors"
                            onClick={onClose}
                        >
                            {cancelText}
                        </button>
                        <button
                            className={`flex-1 px-4 py-2.5 rounded-xl font-bold text-sm text-white transition-all shadow-lg hover:-translate-y-0.5 ${isDanger
                                ? "bg-red-500 hover:bg-red-600 shadow-red-500/20"
                                : "bg-[#00b9f0] hover:bg-[#38bdf8] text-[#0f212e]"
                                }`}
                            onClick={onConfirm}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
