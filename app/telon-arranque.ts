import { APARATOS, rutaTelon } from "./telon.ts";

export type VarianteTelon =
  | "matriz-jpeg"
  | "png-unico"
  | "jpeg-unico"
  | "png-media-safari";

export type ImagenArranque = string | { url: string; media?: string };

export function enlacesTelon(
  variante = process.env.TELON_VARIANTE ?? "matriz-jpeg"
): ImagenArranque[] {
  if (variante === "png-unico") {
    return ["/telon/1320x2868-ios26-v1.png"];
  }
  if (variante === "jpeg-unico") {
    return ["/telon/1320x2868.jpg"];
  }
  if (variante === "png-media-safari") {
    return [
      {
        url: "/telon/1320x2868-ios26-v1.png",
        media:
          "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)",
      },
    ];
  }
  if (variante === "matriz-jpeg") {
    return [
      "/telon/comodin.jpg",
      ...APARATOS.map(({ ancho, alto, dpr }) => ({
        url: rutaTelon(ancho, alto, dpr),
        media: `(device-width: ${ancho}px) and (device-height: ${alto}px) and (-webkit-device-pixel-ratio: ${dpr})`,
      })),
    ];
  }
  throw new Error(`Variante de telón desconocida: ${variante}`);
}
