import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./components/ui/navbar";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "ClockHub",
  description: "Autenticación, RBAC, horarios y auditoría",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="bg-black">
      <body className="min-h-screen bg-black text-white antialiased">
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
