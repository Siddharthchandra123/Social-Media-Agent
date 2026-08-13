import type { Metadata, Viewport } from "next";
import { Commissioner, Fraunces, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/state/theme-provider";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
});

const sans = Commissioner({
  variable: "--font-sans",
  subsets: ["latin"],
  axes: ["slnt"],
});

const mono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "SocialAgent — AI social media content studio",
    template: "%s · SocialAgent",
  },
  description:
    "Generate, review, and publish AI-assisted social media content for LinkedIn, X, Instagram, and Facebook.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#14151c" },
    { media: "(prefers-color-scheme: light)", color: "#f3f4f9" },
  ],
};

const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem("theme");
    var dark = stored
      ? stored === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", dark);
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen bg-background text-foreground">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}