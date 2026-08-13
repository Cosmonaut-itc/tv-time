"use client";

/**
 * TEMPORAL — la taquilla ocupa este lugar en la v1. Sustituye a la página de
 * scaffold de Next, que no servía a nadie.
 *
 * Contesta la única pregunta que no se puede contestar desde una Mac: cuál de
 * los telones del `<head>` reclama este iPhone. Vive en la raíz porque
 * `start_url` es `/`: es lo que se ve al abrir el icono instalado.
 */

import { useEffect, useState } from "react";

export default function Diagnostico() {
  const [datos, setDatos] = useState<string[][]>([]);
  const [telon, setTelon] = useState<string | null>(null);

  useEffect(() => {
    const links = Array.from(
      document.querySelectorAll<HTMLLinkElement>(
        'link[rel="apple-touch-startup-image"]'
      )
    );
    // El que iOS usaría: el último cuya media query coincida, o el comodín.
    const coincide = links.filter(
      (l) => !l.media || window.matchMedia(l.media).matches
    );
    const elegido = coincide.at(-1) ?? null;

    setDatos([
      ["pantalla", `${window.screen.width} × ${window.screen.height} pt`],
      ["densidad", String(window.devicePixelRatio)],
      ["ventana", `${window.innerWidth} × ${window.innerHeight}`],
      [
        "instalada",
        window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true
          ? "sí — desde el icono"
          : "no — esto es Safari",
      ],
      ["telones en el head", String(links.length)],
      ["coinciden", String(coincide.length)],
      [
        "el que gana",
        elegido ? new URL(elegido.href).pathname.replace("/telon/", "") : "NINGUNO",
      ],
    ]);
    setTelon(elegido?.href ?? null);
  }, []);

  return (
    <main
      style={{
        minHeight: "100dvh",
        background: "#12080C",
        color: "#E8CE86",
        fontFamily: "ui-monospace, Menlo, monospace",
        fontSize: 15,
        padding: "32px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      <h1 style={{ fontSize: 17, letterSpacing: "0.14em", margin: 0 }}>
        DIAGNÓSTICO DEL TELÓN
      </h1>

      <dl style={{ display: "grid", gap: 10, margin: 0 }}>
        {datos.map(([clave, valor]) => (
          <div
            key={clave}
            style={{ display: "flex", justifyContent: "space-between", gap: 16 }}
          >
            <dt style={{ color: "#8A6E18" }}>{clave}</dt>
            <dd style={{ margin: 0, textAlign: "right" }}>{valor}</dd>
          </div>
        ))}
      </dl>

      {telon && (
        // El telón que le tocaría a este aparato, para verlo con los ojos.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={telon}
          alt="El telón que reclama este aparato"
          style={{ width: 150, alignSelf: "center", border: "1px solid #8A6E18" }}
        />
      )}
    </main>
  );
}
