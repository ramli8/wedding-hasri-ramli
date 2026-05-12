import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Wedding Hasri & Ramli",
  description: "Wedding Management System — Hasri & Ramli",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning
      style={{ colorScheme: "light" }}
    >
      <body
        className={`${jakarta.variable} antialiased`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html >
  );
}
