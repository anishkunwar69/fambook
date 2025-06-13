import Providers from "@/lib/providers";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Lora, Poppins } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fambook",
  description: "Fambook is a social media platform for families to share their memories and connect with others.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <script dangerouslySetInnerHTML={{
          __html: `
            // Prevent zoom on focus
            document.addEventListener('touchstart', function(event) {
              if (event.target.tagName === 'INPUT' || event.target.tagName === 'SELECT' || event.target.tagName === 'TEXTAREA') {
                // Prevent zooming
                document.documentElement.style.touchAction = 'manipulation';
                
                // Restore after focus is lost
                event.target.addEventListener('blur', function() {
                  document.documentElement.style.touchAction = '';
                }, { once: true });
              }
            });
          `
        }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} ${lora.variable} antialiased`}
      >
        <Providers>
          {children}
          <Toaster position="bottom-right" />
        </Providers>
      </body>
    </html>
  );
}