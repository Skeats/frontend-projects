import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kiki's Nonograms v2",
  description: "A puzzle game where you fill in grids based on number clues to reveal hidden pictures.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
