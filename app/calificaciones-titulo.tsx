"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useState } from "react";
import type { TituloDeSala } from "./cartelera";

const ESTRELLAS = [1, 2, 3, 4, 5];

export default function CalificacionesTitulo({ salaId, titulo, butacas }: {
  salaId: Id<"salas">;
  titulo: TituloDeSala;
  butacas: readonly string[];
}) {
  const calificar = useMutation(api.titulos.calificar);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");

  async function guardar(butaca: string, estrellas: number) {
    if (ocupado) return;
    setOcupado(true);
    setError("");
    try {
      await calificar({ salaId, tituloId: titulo._id as Id<"titulos">, butaca, estrellas });
    } catch {
      setError("No pudimos guardar la calificación.");
    } finally {
      setOcupado(false);
    }
  }

  return <>
    <div className="voces">
      {butacas.map((butaca) => {
        const actual = titulo.calificaciones?.find((voz) => voz.butaca === butaca)?.estrellas ?? 0;
        return <div className="voz" key={butaca}>
          <span>{butaca}</span>
          <div className="estrellas" role="radiogroup" aria-label={`Calificación de ${butaca}`}>
            {ESTRELLAS.map((estrellas) => <button
              key={estrellas}
              type="button"
              role="radio"
              aria-checked={actual === estrellas}
              aria-label={`${estrellas} de 5`}
              aria-disabled={ocupado}
              tabIndex={estrellas === (actual || 1) ? 0 : -1}
              className={actual >= estrellas ? "on" : ""}
              onClick={() => void guardar(butaca, actual === estrellas ? 0 : estrellas)}
              onKeyDown={(evento) => {
                const movimiento = ["ArrowRight", "ArrowDown"].includes(evento.key) ? 1 : ["ArrowLeft", "ArrowUp"].includes(evento.key) ? -1 : 0;
                if (!movimiento) return;
                evento.preventDefault();
                const siguiente = (estrellas - 1 + movimiento + 5) % 5;
                (evento.currentTarget.parentElement?.children[siguiente] as HTMLButtonElement)?.focus();
                void guardar(butaca, siguiente + 1);
              }}
            >★</button>)}
          </div>
        </div>;
      })}
    </div>
    {error && <p className="razon-veto error" role="alert">{error}</p>}
  </>;
}
