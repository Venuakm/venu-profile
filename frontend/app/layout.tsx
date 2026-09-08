import type { Metadata, Viewport } from "next";
import { Anton, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider, themeScript } from "@/components/theme";
import "./globals.css";

const display = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

const sans = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Venu Akkamgari - Full Stack Developer",
    template: "%s - Venu Akkamgari",
  },
  description:
    "Full Stack Developer building fast, large-scale commerce platforms with Next.js, Node.js and MongoDB.",
  openGraph: {
    type: "website",
    title: "Venu Akkamgari - Full Stack Developer",
    description:
      "Full Stack Developer building fast, large-scale commerce platforms with Next.js, Node.js and MongoDB.",
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#07080b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        {/* Applies the stored theme before first paint to avoid a flash. */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="noise antialiased">
        <ThemeProvider>{children}</ThemeProvider>
        <Toaster
          theme="system"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "color-mix(in srgb, var(--c-surface) 92%, transparent)",
              border: "1px solid var(--c-line)",
              backdropFilter: "blur(16px)",
              color: "var(--c-chalk)",
            },
          }}
        />
      </body>
    </html>
  );
}
