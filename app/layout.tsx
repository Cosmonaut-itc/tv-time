import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ProveedorConvex from "./proveedor-convex";
import TelonDeEntrada from "./telon-de-entrada";
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
    // Mejora opcional: iOS 26.6 no mostró este PNG en el iPhone real probado.
    // El telón web renderizado por el servidor es el fallback controlado.
    startupImage: "/telon/1320x2868-ios26-v1.png",
  },
};

export const viewport: Viewport = {
  // El terciopelo como color de interfaz mientras la página web está activa.
  themeColor: "#12080C",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-MX" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <TelonDeEntrada />
        <ProveedorConvex>{children}</ProveedorConvex>
      </body>
    </html>
  );
}
