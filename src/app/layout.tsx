import type { Metadata } from "next";
import { Inter, Playfair_Display, JetBrains_Mono } from "next/font/google";
import { AuthProvider, ThemeProvider } from "@/components/providers";
import { LanguageProvider } from "@/context/LanguageContext";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { CartProvider } from "@/context";
import { ToastProvider } from "@/components/molecules/Toast";
import "./globals.css";
import connectDB from "@/lib/db/mongodb";
import SystemConfig from "@/lib/db/models/SystemConfig";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  try {
    await connectDB();
    const config = await SystemConfig.findOne({ key: "seo_global" });
    const settings = config?.value || {};

    const siteTitle = settings.siteTitle || "Core Creator - Global Art & Craft eLearning & Marketplace";
    const title = {
      default: siteTitle,
      template: `%s ${settings.separator || "|"} ${siteTitle}`,
    };
    const description = settings.siteDescription || "The ultimate platform for artists, learners, and art lovers. Buy authentic artworks, learn new skills, and sell your creations globally.";

    return {
      title,
      description,
      keywords: settings.keywords ? settings.keywords.split(",").map((k: string) => k.trim()) : [
        "art marketplace",
        "art courses",
        "learn painting",
        "buy art online",
        "art workshops",
        "handmade crafts",
        "artist community",
      ],
      authors: [{ name: "Core Creator" }],
      openGraph: {
        title: siteTitle,
        description,
        type: "website",
        locale: "en_US",
        siteName: "Core Creator",
      },
      twitter: {
        card: "summary_large_image",
        title: siteTitle,
        description,
      },
      robots: {
        index: true,
        follow: true,
      },
    };
  } catch (e) {
    console.error("Failed to fetch SEO config:", e);
    return {
      title: "Core Creator - Global Art & Craft eLearning & Marketplace",
      description: "The ultimate platform for artists, learners, and art lovers.",
    };
  }
}

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isMaintenanceMode } from "@/lib/system";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Check Maintenance Mode
  const maintenance = await isMaintenanceMode();
  if (maintenance) {
    const headersList = await headers();
    const pathname = headersList.get("x-pathname") || "";
    const session = await getServerSession(authOptions);

    // Allow Admin access and bypass for login/maintenance pages
    const isAdmin = session?.user?.role === "admin";
    const isMaintenancePage = pathname === "/maintenance";
    const isAuthPage = pathname.startsWith("/admin/login"); // Allow admin login

    if (!isAdmin && !isMaintenancePage && !isAuthPage) {
      redirect("/maintenance");
    }

    // If on maintenance page but is admin, redirect to dashboard (optional, but good UX)
    if (isAdmin && isMaintenancePage) {
      redirect("/admin/dashboard");
    }
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <meta name="theme-color" content="#2563eb" />
      </head>
      <body
        className={`${inter.variable} ${playfair.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <AuthProvider>
          <LanguageProvider>
            <CurrencyProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
              >
                <CartProvider>
                  <ToastProvider>{children}</ToastProvider>
                </CartProvider>
              </ThemeProvider>
            </CurrencyProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

