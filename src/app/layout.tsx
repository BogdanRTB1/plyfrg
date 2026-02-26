import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Toaster } from "sonner";
import LoadingScreen from "@/components/LoadingScreen";
import ScrollReset from "@/components/ScrollReset";
import { MobileNavProvider } from "@/components/MobileNavProvider";

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
        <ScrollReset />
        <MobileNavProvider>
          {/* Sidebar (Fixed Left) */}
          <Sidebar />

          {/* Main Content Area (Right Side) */}
          <main className="flex-1 flex flex-col h-full md:ml-[260px] ml-0 w-full md:w-auto relative bg-[#050505] transition-all duration-300">
            <Header />
            {/* Page Content - flex-1 allows it to fill remaining height, overflow-hidden forces page to handle scroll */}
            <div className="flex-1 overflow-hidden relative flex flex-col">
              {children}
            </div>
          </main>
        </MobileNavProvider>
      </body>
    </html>
  );
}
