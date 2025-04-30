import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import GlobalHeader from "@/components/common/GlobalHeader";
import styles from "./layout.module.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OSM Tracker",
  description: "Track objects on OpenStreetMap",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
            <div className={styles.appContainer}>
              <GlobalHeader />
              {children}
            </div>
        </ThemeProvider>
      </body>
    </html>
  );
}