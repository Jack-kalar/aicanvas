import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Canvas",
  description: "Smart Canvas Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://cdn.concisecss.com/concise.min.css" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
