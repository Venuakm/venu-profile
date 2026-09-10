import type { Metadata, Viewport } from "next";
import { Anton, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider, themeScript } from "@/components/theme";
import { siteUrl } from "@/lib/site";
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
  metadataBase: new URL(siteUrl()),
  title: {
    default: "Venu Akkamgari | Full Stack Developer",
    template: "%s | Venu Akkamgari",
  },
  description:
    "Official website of Venu Akkamgari, Full Stack Developer and NIT Uttarakhand CSE graduate. Next.js, Node.js, MongoDB and ONDC commerce platforms.",
  applicationName: "Venu Akkamgari",
  authors: [{ name: "Venu Akkamgari", url: siteUrl() }],
  creator: "Venu Akkamgari",
  publisher: "Venu Akkamgari",
  keywords: [
    "Venu Akkamgari",
    "Venu Akkamgari portfolio",
    "Venu Akkamgari developer",
    "Akkamgari Venu",
    "Full Stack Developer",
  ],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteUrl(),
    siteName: "Venu Akkamgari",
    title: "Venu Akkamgari | Full Stack Developer",
    description:
      "Official website of Venu Akkamgari, Full Stack Developer and NIT Uttarakhand CSE graduate.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Venu Akkamgari | Full Stack Developer",
    description:
      "Official website of Venu Akkamgari, Full Stack Developer and NIT Uttarakhand CSE graduate.",
  },
  alternates: { canonical: siteUrl() },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
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
