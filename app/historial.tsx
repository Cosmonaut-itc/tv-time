"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { memo, useCallback, useState, type RefObject } from "react";
import HojaInferior from "./hoja-inferior";
import {
  formatearFechaDeFuncion,
  mismaFichaDelHistorial,
  mismaFilaDeFuncion,
  type FuncionDelHistorial,
  type TituloDelHistorial,
} from "./historial-logica";

const FilaDeFuncion = memo(function FilaDeFuncion({ funcion }: { funcion: FuncionDelHistorial }) {
  return <li className="fila-historial"><span>{funcion.titulo.nombre}</span><time dateTime={new Date(funcion.fecha).toISOString()}>{formatearFechaDeFuncion(funcion.fecha)}</time></li>;
}, (anterior, siguiente) => mismaFilaDeFuncion(anterior.funcion, siguiente.funcion));

const FilaDeYaVisto = memo(function FilaDeYaVisto({ titulo }: { titulo: TituloDelHistorial }) {
  return <li className="fila-historial"><span>{titulo.nombre}</span><em>sin fecha</em></li>;
}, (anterior, siguiente) => mismaFichaDelHistorial(anterior.titulo, siguiente.titulo));

export default function Historial({
  abierta, salaId, devolverFocoA, onCerrar,
}: {
  abierta: boolean;
  salaId: Id<"salas">;
  devolverFocoA: RefObject<HTMLElement | null>;
  onCerrar: () => void;
}) {
  const historial = useQuery(api.funciones.historialDeSala, { salaId });
  const vaciarFunciones = useMutation(api.funciones.vaciarFunciones);
  const vaciarYaVisto = useMutation(api.funciones.vaciarYaVisto);
  const [confirmando, setConfirmando] = useState<"funciones" | "yaVisto" | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");

  const vaciar = useCallback(async (mitad: "funciones" | "yaVisto") => {
    if (confirmando !== mitad) {
      setConfirmando(mitad);
      return;
    }
    setOcupado(true);
    setError("");
    try {
      await (mitad === "funciones" ? vaciarFunciones({ salaId }) : vaciarYaVisto({ salaId }));
      setConfirmando(null);
    } catch {
      setError("No pudimos vaciar esta parte del historial.");
    } finally {
      setOcupado(false);
    }
  }, [confirmando, salaId, vaciarFunciones, vaciarYaVisto]);

  const funciones = (historial?.funciones ?? []) as FuncionDelHistorial[];
  const yaVisto = (historial?.yaVisto ?? []) as TituloDelHistorial[];
  return <HojaInferior abierta={abierta} etiqueta="El historial" devolverFocoA={devolverFocoA} className="historial" onCerrar={onCerrar}>
    <div className="historial-contenido">
      <p className="etiqueta-entrada">El recuerdo de la sala</p>
      <h2>EL HISTORIAL</h2>
      <section>
        <h3>LAS FUNCIONES</h3>
        <p>Nacieron de «Esta vemos».</p>
        {funciones.length ? <ul>{funciones.map((funcion) => <FilaDeFuncion funcion={funcion} key={funcion._id} />)}</ul> : <p className="nada-historial">Todavía no hay funciones.</p>}
        <button className={`opcion${confirmando === "funciones" ? " confirma" : ""}`} type="button" disabled={ocupado || !funciones.length} onClick={() => void vaciar("funciones")}>
          {confirmando === "funciones" ? "¿Seguro? Desaparecen las funciones; los títulos siguen vistos y no vuelven a la cartelera" : "Vaciar las funciones"}
        </button>
      </section>
      <section>
        <h3>YA LO HABÍAMOS VISTO</h3>
        <p>Sin función y sin fecha.</p>
        {yaVisto.length ? <ul>{yaVisto.map((titulo) => <FilaDeYaVisto titulo={titulo} key={titulo._id} />)}</ul> : <p className="nada-historial">No hay títulos en esta mitad.</p>}
        <button className={`opcion${confirmando === "yaVisto" ? " confirma" : ""}`} type="button" disabled={ocupado || !yaVisto.length} onClick={() => void vaciar("yaVisto")}>
          {confirmando === "yaVisto" ? "¿Seguro? Vuelven a la cartelera estos títulos sin función" : "Vaciar «Ya lo habíamos visto»"}
        </button>
      </section>
      {error && <p className="razon-veto error">{error}</p>}
    </div>
  </HojaInferior>;
}
