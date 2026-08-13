import type { MetadataRoute } from "next";

// El manifest existe por una razón concreta: en iPhone, Safari borra el
// almacenamiento del sitio tras 7 días sin visita, y una app instalada en la
// pantalla de inicio queda exenta. Sin instalar, el «te recuerdo para siempre»
// del código de la sala es mentira. Ver .wayfinder/tickets/010-la-sala-instalada.md
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "El cine",
    // iOS corta el nombre bajo el icono como a 12 caracteres.
    short_name: "Cine",
    description: "La sala privada donde el azar decide qué ver.",
    lang: "es-MX",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    // El terciopelo de la sala. Safari ignora background_color y arma su
    // pantalla de arranque con la imagen que le inyecta el telón; Android sí
    // lo respeta y de ahí saca su splash.
    background_color: "#12080C",
    theme_color: "#12080C",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/icono/cine-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icono/cine-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
