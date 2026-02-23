"use client";

import { motion } from "framer-motion";

export function AnimatedPage({ children }: { children: React.ReactNode }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="flex-1 overflow-hidden flex flex-col"
        >
            {children}
        </motion.div>
    );
}
