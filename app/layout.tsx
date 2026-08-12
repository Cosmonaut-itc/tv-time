import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { enlacesTelon } from "./telon-arranque";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "El cine",
  description: "La sala privada donde el azar decide qué ver.",
  // Una sala privada no se indexa: ni en producción ni en las previews.
  robots: { index: false, follow: false, nocache: true },
  appleWebApp: {
    capable: true,
    // El nombre que queda bajo el icono en la pantalla de inicio.
    title: "Cine",
    // Opaca a propósito: contra el terciopelo se ve igual que translúcida y no
    // obliga a que cada pantalla respete las áreas seguras. Si la v1 quiere que
    // la sala suba hasta el notch, esto pasa a "black-translucent" y las
    // pantallas empiezan a usar env(safe-area-inset-*).
    statusBarStyle: "black",
    // El telón cerrado mientras la app arranca. Tiene que venir escrito en el
    // HTML que sirve el servidor: iOS no ve los links que aparecen después por
    // JavaScript —probado en un iPhone real, arranca en negro—, y lee esto en
    // el momento de «Añadir a pantalla de inicio».
    //
    // El comodín va primero porque los específicos que vienen después lo
    // ganan cuando su media query coincide, y así ningún iPhone fuera de la
    // tabla se queda sin telón.
    startupImage: enlacesTelon(),
  },
};

export const viewport: Viewport = {
  // El terciopelo desde el primer cuadro: nada de blanco en ningún momento.
  themeColor: "#12080C",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-MX" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
