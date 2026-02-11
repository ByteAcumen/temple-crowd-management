import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { ChatbotWidget } from "@/components/ui/chatbot-widget";

const dmSans = DM_Sans({
    subsets: ["latin"],
    weight: ["400", "500", "700"],
    variable: "--font-sans"
});

export const metadata: Metadata = {
    title: "Temple Crowd Management",
    description: "Smart temple booking and crowd management system",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${dmSans.variable} ${dmSans.className}`}>
                <Providers>
                    {children}
                    <ChatbotWidget />
                </Providers>
            </body>
        </html>
    );
}
