import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Klinika - Система управления пациентами",
  description: "Интегрированная система управления клиникой с поддержкой мессенджеров",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
