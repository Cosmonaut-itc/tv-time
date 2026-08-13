"use client";

import type { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import {
  derivarCartelera,
  type FiltroCartelera,
  type TituloDeSala,
} from "./cartelera";

const SIN_VETOS = new Set<string>();

const FILTROS: readonly { valor: FiltroCartelera; etiqueta: string }[] = [
  { valor: "pelicula", etiqueta: "Peli" },
  { valor: "serie", etiqueta: "Serie" },
  { valor: "loQueSea", etiqueta: "Lo que sea" },
];

type PropiedadesDeCelda = { titulo: TituloDeSala };

function CeldaDeCarteleraBase({ titulo }: PropiedadesDeCelda) {
  return (
    <div className="titulo-fila compite" role="listitem">
      <span className="nombre">
        {titulo.saga && titulo.orden !== undefined ? `${titulo.orden}. ` : ""}
        {titulo.nombre}
      </span>
      {titulo.agregadoPor && <span className="autor">{titulo.agregadoPor}</span>}
      <span className="marca">compite</span>
    </div>
  );
}

function mismaCelda(anterior: PropiedadesDeCelda, siguiente: PropiedadesDeCelda) {
  return (
    anterior.titulo._id === siguiente.titulo._id &&
    anterior.titulo.nombre === siguiente.titulo.nombre &&
    anterior.titulo.saga === siguiente.titulo.saga &&
    anterior.titulo.orden === siguiente.titulo.orden &&
    anterior.titulo.agregadoPor === siguiente.titulo.agregadoPor
  );
}

const CeldaDeCartelera = memo(CeldaDeCarteleraBase, mismaCelda);

export default function SalaCartelera({ salaId }: { salaId: Id<"salas"> }) {
  const titulos = useQuery(api.titulos.deSala, { salaId });
  const [filtro, setFiltro] = useState<FiltroCartelera>("loQueSea");
  const [cajonAbierto, setCajonAbierto] = useState(false);
  const botonAbrir = useRef<HTMLButtonElement>(null);
  const botonCerrar = useRef<HTMLButtonElement>(null);
  const cartelera = useMemo(
    () => derivarCartelera(titulos ?? [], { filtro, vetados: SIN_VETOS }),
    [filtro, titulos],
  );

  useEffect(() => {
    if (cajonAbierto) botonCerrar.current?.focus();
  }, [cajonAbierto]);

  function cerrarCajon() {
    botonAbrir.current?.focus();
    setCajonAbierto(false);
  }

  return (
    <>
      <section className="escenario" aria-label="Ruleta dormida">
        <div className="telon izq" aria-hidden="true" />
        <div className="telon der" aria-hidden="true" />
        <div className="pantalla">
          <div className="reposo" aria-live="polite">
            <div className="cifra">{titulos === undefined ? "—" : cartelera.candidatos.length}</div>
            <p>títulos compitiendo</p>
          </div>
        </div>
      </section>

      <div className="foso">
        <div className="filtros" role="group" aria-label="Qué puede girar">
          {FILTROS.map(({ valor, etiqueta }) => (
            <button
              className="filtro"
              type="button"
              key={valor}
              aria-pressed={filtro === valor}
              onClick={() => setFiltro(valor)}
            >
              {etiqueta} {titulos === undefined ? "—" : cartelera.cuentas[valor]}
            </button>
          ))}
        </div>
        {cartelera.anuncio && (
          <p className="etiqueta-entrada">{cartelera.anuncio}</p>
        )}
        <button className="btn-palanca" type="button" disabled>
          Comenzar la función
        </button>
      </div>

      <div className="bitacora">
        <span>Estado <b>reposo</b></span>
        <span>En cartelera <b>{titulos === undefined ? "—" : cartelera.candidatos.length}</b></span>
        <span>Giros <b>0</b></span>
      </div>

      <button
        ref={botonAbrir}
        className="cabina-abrir cartelera-abrir"
        type="button"
        aria-label="Ver la cartelera"
        aria-expanded={cajonAbierto}
        aria-controls="cartelera-cajon"
        onClick={() => setCajonAbierto(true)}
      >
        ☰
      </button>

      <aside
        className={`cabina${cajonAbierto ? " abierta" : ""}`}
        id="cartelera-cajon"
        aria-hidden={!cajonAbierto}
        inert={!cajonAbierto}
      >
        <h2>CARTELERA</h2>
        <p className="nota">
          Lo que puede ganar esta noche. De cada saga sólo compite la siguiente sin ver;
          lo vetado hoy vuelve mañana.
        </p>
        <div className="lista" role={titulos === undefined ? undefined : "list"}>
          {titulos === undefined ? (
            <p className="estado-cartelera">Preparando la cartelera…</p>
          ) : (
            cartelera.candidatos.map((titulo) => (
              <CeldaDeCartelera titulo={titulo} key={titulo._id} />
            ))
          )}
        </div>
        <button
          ref={botonCerrar}
          className="opcion"
          type="button"
          onClick={cerrarCajon}
        >
          Cerrar
        </button>
      </aside>
    </>
  );
}
