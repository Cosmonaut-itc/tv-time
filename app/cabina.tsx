"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useRef, useState, type RefObject } from "react";
import { advertenciaTrasGuardarCodigo } from "./cabina-logica";
import HojaInferior from "./hoja-inferior";

type Ajustes = { ritmo: "rapido" | "normal" | "dramatico"; paro: "uno" | "tres"; conteo: boolean };

export default function Cabina({
  abierta,
  salaId,
  codigo,
  butaca,
  butacas,
  devolverFocoA,
  onCerrar,
  onCambiarButaca,
  onCambiarCodigo,
  onSalir,
}: {
  abierta: boolean;
  salaId: Id<"salas">;
  codigo: string;
  butaca: string;
  butacas: readonly string[];
  devolverFocoA: RefObject<HTMLElement | null>;
  onCerrar: () => void;
  onCambiarButaca: (butaca: string) => void;
  onCambiarCodigo: (codigo: string) => boolean;
  onSalir: () => void;
}) {
  const ajustes = useQuery(api.salas.ajustesDeSala, { salaId });
  const guardarAjustes = useMutation(api.salas.guardarAjustes);
  const rotarCodigo = useMutation(api.taquilla.rotarCodigo);
  const [confirmandoRotacion, setConfirmandoRotacion] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");
  const [advertenciaCodigo, setAdvertenciaCodigo] = useState<string | null>(null);
  const disparadorRotacion = useRef<HTMLButtonElement>(null);

  async function cambiarAjustes(cambio: Partial<Ajustes>) {
    if (!ajustes || ocupado) return;
    setOcupado(true);
    setError("");
    try {
      await guardarAjustes({ salaId, ajustes: { ...ajustes, ...cambio } });
    } catch {
      setError("No pudimos guardar los ajustes de la sala.");
    } finally {
      setOcupado(false);
    }
  }

  async function confirmarRotacion() {
    if (!confirmandoRotacion) {
      setConfirmandoRotacion(true);
      return;
    }
    if (ocupado) return;
    setOcupado(true);
    setError("");
    try {
      const resultado = await rotarCodigo({ salaId, codigoActual: codigo });
      const guardado = onCambiarCodigo(resultado.codigo);
      setAdvertenciaCodigo(advertenciaTrasGuardarCodigo(guardado));
      setConfirmandoRotacion(false);
    } catch {
      setError("No pudimos rotar el código. Intenta de nuevo.");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <HojaInferior
      abierta={abierta}
      etiqueta="La cabina"
      devolverFocoA={devolverFocoA}
      enfocarAlAbrir={disparadorRotacion}
      className="cabina-ajustes"
      onCerrar={onCerrar}
    >
      <div className="cabina-contenido">
        <p className="etiqueta-entrada">Preferencias de la sala</p>
        <h2>LA CABINA</h2>

        <section className="ajustes-cabina" aria-label="Ajustes del giro">
          <p>Ritmo del giro</p>
          <div className="controles-cabina" role="group" aria-label="Ritmo del giro">
            {(["rapido", "normal", "dramatico"] as const).map((ritmo) => (
              <button key={ritmo} type="button" disabled={ocupado || ajustes === undefined}
                aria-pressed={ajustes?.ritmo === ritmo} onClick={() => void cambiarAjustes({ ritmo })}>
                {ritmo}
              </button>
            ))}
          </div>
          <p>Paro de los carretes</p>
          <div className="controles-cabina" role="group" aria-label="Paro de los carretes">
            <button type="button" disabled={ocupado || ajustes === undefined}
              aria-pressed={ajustes?.paro === "uno"} onClick={() => void cambiarAjustes({ paro: "uno" })}>Uno por uno</button>
            <button type="button" disabled={ocupado || ajustes === undefined}
              aria-pressed={ajustes?.paro === "tres"} onClick={() => void cambiarAjustes({ paro: "tres" })}>Juntos</button>
          </div>
          <label className="interruptor-cabina">
            <input type="checkbox" checked={ajustes?.conteo ?? false} disabled={ocupado || ajustes === undefined}
              onChange={(evento) => void cambiarAjustes({ conteo: evento.target.checked })} />
            Conteo del proyector
          </label>
        </section>

        <section className="codigo-cabina" aria-label="Código de la sala">
          <p className="etiqueta-entrada">Código para mandarlo por WhatsApp</p>
          <strong>{codigo}</strong>
          {advertenciaCodigo && (
            <p className="alerta-codigo-cabina" role="alert">{advertenciaCodigo}</p>
          )}
          <p>Guárdenlo: el link se limpia y el navegador puede olvidarlo.</p>
          <button ref={disparadorRotacion} className={`opcion${confirmandoRotacion ? " confirma" : ""}`}
            type="button" disabled={ocupado} onClick={() => void confirmarRotacion()}>
            {confirmandoRotacion ? "¿Seguro? Rotar el código" : "Rotar el código"}
          </button>
          {confirmandoRotacion && <p className="aviso-cabina">Este aparato seguirá dentro. Al otro se le pedirá el código nuevo al recargar.</p>}
        </section>

        <section className="butaca-cabina" aria-label="Cambiar de butaca">
          <p className="etiqueta-entrada">Butaca de esta noche</p>
          <div className="controles-cabina">
            {butacas.map((nombre) => <button key={nombre} type="button" aria-pressed={butaca === nombre}
              onClick={() => onCambiarButaca(nombre)}>{nombre}</button>)}
          </div>
        </section>

        {error && <p className="razon-veto error">{error}</p>}
        <button className="salir-cabina" type="button" onClick={onSalir}>Salir de la sala</button>
      </div>
    </HojaInferior>
  );
}
