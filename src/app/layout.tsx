import type { Metadata } from "next";
import { Faustina, Source_Sans_3 } from "next/font/google";
// Layout raíz mínimo: la web pública añade su cabecera, pie y estilos en
// (sitio)/layout.tsx y el panel de gestión los suyos en admin/layout.tsx.
const serif = Faustina({
  subsets: ["latin"],
  variable: "--font-display",
  style: ["normal", "italic"],
  display: "swap",
});
const sans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});
export const metadata: Metadata = {
  icons: { icon: "/logo.svg" },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${serif.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
