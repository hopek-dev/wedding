import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Geist_Mono, Luxurious_Script, Pinyon_Script, Raleway, Tinos } from "next/font/google";
import "./globals.css";
import { AppChrome } from "@/components/app-chrome";
import { Toaster } from "sonner";

// Typography matches the wedding website: a calligraphy script for the
// couple's names and light, airy Raleway for everything else.
const raleway = Raleway({
  variable: "--font-raleway",
  weight: ["300", "400", "500", "600"],
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Times-style serif used for the gold V&H monogram on the invitation.
const tinos = Tinos({
  variable: "--font-tinos",
  weight: "400",
  subsets: ["latin"],
});

// The invitation's printed text: a refined serif in capitals and italics, plus a
// handwritten script for the "and" and the reply line.
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  subsets: ["latin"],
});
const luxurious = Luxurious_Script({ variable: "--font-luxurious", weight: "400", subsets: ["latin"] });

const pinyonScript = Pinyon_Script({
  variable: "--font-script",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Haughton Tettey Hitched!",
  description: "Wedding planning dashboard",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Hitched!",
  },
};

export const viewport: Viewport = {
  themeColor: "#1b1a13",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${raleway.variable} ${geistMono.variable} ${pinyonScript.variable} ${tinos.variable} ${cormorant.variable} ${luxurious.variable} dark h-full antialiased`}
      style={{ colorScheme: "dark" }}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col bg-muted/30">
        <AppChrome>{children}</AppChrome>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
