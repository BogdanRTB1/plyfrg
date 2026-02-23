import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Toaster } from "sonner";
import LoadingScreen from "@/components/LoadingScreen";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PlayForges",
  description: "Create. Play. Win Together.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} bg-[#050505] text-white overflow-hidden h-screen font-sans`}>
        <LoadingScreen />
        <Toaster position="top-center" richColors theme="dark" />
        {/* Sidebar (Fixed Left) */}
        <Sidebar />

        {/* Main Content Area (Right Side) */}
        <main className="flex-1 flex flex-col h-full ml-[260px] relative bg-[#050505] transition-all duration-300">
          <Header />
          {/* Page Content - flex-1 allows it to fill remaining height, overflow-hidden forces page to handle scroll */}
          <div className="flex-1 overflow-hidden relative flex flex-col">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
