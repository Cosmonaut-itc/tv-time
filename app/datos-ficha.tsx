"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { FichaMapeada } from "@/convex/fichas_logica";
import { useAction } from "convex/react";
import { useEffect, useState } from "react";

export default function DatosFicha({ salaId, tituloId, anio, tipo }: {
  salaId: Id<"salas">;
  tituloId: Id<"titulos">;
  anio?: number;
  tipo: "pelicula" | "serie";
}) {
  const buscar = useAction(api.fichas.deTitulo);
  const [datos, setDatos] = useState<FichaMapeada | null>(null);
  const [abierta, setAbierta] = useState(false);
  useEffect(() => {
    let vigente = true;
    void buscar({ salaId, tituloId }).then((resultado) => {
      if (vigente && resultado.estado === "datos") setDatos(resultado);
    }).catch(() => {
      // La ficha sigue siendo útil si TMDB no responde.
    });
    return () => { vigente = false; };
  }, [buscar, salaId, tituloId]);

  return <>
    <p className="meta">{anio ?? "s/f"} · {tipo === "serie" ? "Serie" : "Película"}{datos?.calificacion !== undefined && <> · TMDB <b>{datos.calificacion.toFixed(1)}</b></>}</p>
    {datos?.sinopsis && <p
      className={`sinopsis${abierta ? " abierta" : ""}`}
      role="button"
      tabIndex={0}
      aria-expanded={abierta}
      onClick={() => setAbierta(true)}
      onKeyDown={(evento) => {
        if (evento.key === "Enter" || evento.key === " ") {
          evento.preventDefault();
          setAbierta(true);
        }
      }}
    >{datos.sinopsis}</p>}
  </>;
}
