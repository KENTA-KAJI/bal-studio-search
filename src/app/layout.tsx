import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BAL STUDIO Search",
  description: "BAL STUDIO video search application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
