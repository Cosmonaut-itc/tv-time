"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import DatosFicha from "./datos-ficha";
import CalificacionesTitulo from "./calificaciones-titulo";
import ChipsDisponibilidad from "./chips-disponibilidad";
import type { TituloDeSala } from "./cartelera";
import HojaInferior from "./hoja-inferior";
import {
  derivarMuro,
  mismaCeldaDePila,
  mismaCeldaDeTitulo,
  type FiltroDelMuro,
  type PilaDelMuro,
} from "./muro-logica";
import PosterCrudo from "./poster-crudo";
import { urlDePoster } from "./posters";

const FILTROS: readonly { valor: FiltroDelMuro; etiqueta: string }[] = [
  { valor: "todo", etiqueta: "Todo" },
  { valor: "sinVer", etiqueta: "Sin ver" },
  { valor: "vistas", etiqueta: "Vistas" },
];

function PosterDelMuro({ titulo }: { titulo: TituloDeSala }) {
  if (!titulo.posterPath) return <PosterCrudo titulo={titulo} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- Ticket 002 marca una zona gris: TMDB se sirve directo, sin el optimizador de Next.
    <img
      crossOrigin="anonymous"
      src={urlDePoster(titulo.posterPath, "w185")}
      alt=""
      width={185}
      height={278}
      loading="lazy"
    />
  );
}

// Conserva la foto de la celda hasta que la de detalle esté lista, también si falla.
function PosterDeFicha({ posterPath }: { posterPath: string }) {
  const [grandeLista, setGrandeLista] = useState(false);
  return (
    <div className="poster-ficha">
      {/* eslint-disable-next-line @next/next/no-img-element -- TMDB se sirve directo para compartir la petición con WebGL. */}
      <img crossOrigin="anonymous" src={urlDePoster(posterPath, "w185")} alt="" width={342} height={513} />
      {/* eslint-disable-next-line @next/next/no-img-element -- La foto de detalle se revela sin retirar el respaldo. */}
      <img
        crossOrigin="anonymous"
        src={urlDePoster(posterPath, "w342")}
        alt=""
        width={342}
        height={513}
        hidden={!grandeLista}
        onLoad={() => setGrandeLista(true)}
        onError={() => setGrandeLista(false)}
      />
    </div>
  );
}

const CeldaDeTitulo = memo(function CeldaDeTitulo({
  titulo,
  bloqueada,
  onAbrir,
}: {
  titulo: TituloDeSala;
  bloqueada: boolean;
  onAbrir: (titulo: TituloDeSala, disparador: HTMLElement) => void;
}) {
  const estado = titulo.visto ? "✓ vista" : bloqueada ? "🔒 falta la anterior" : null;
  return (
    <button
      className={`celda${titulo.visto ? " esta-vista" : ""}${bloqueada ? " bloqueada" : ""}`}
      type="button"
      aria-label={`${titulo.nombre}${estado ? `, ${estado}` : ""}`}
      onClick={(evento) => onAbrir(titulo, evento.currentTarget)}
    >
      <PosterDelMuro titulo={titulo} />
      <span className="filete-muro" />
      {estado && <span className="banda alto">{estado}</span>}
    </button>
  );
}, (anterior, siguiente) =>
  mismaCeldaDeTitulo(anterior, siguiente) &&
  anterior.onAbrir === siguiente.onAbrir,
);

const CeldaDePila = memo(function CeldaDePila({
  pila,
  abierta,
  onAlternar,
}: {
  pila: PilaDelMuro;
  abierta: boolean;
  onAlternar: (saga: string) => void;
}) {
  const completa = pila.vistas === pila.titulos.length;
  return (
    <button
      className={`celda pila${abierta ? " abierta" : ""}${completa ? " esta-vista" : ""}`}
      type="button"
      aria-label={`${pila.saga}, ${pila.vistas} de ${pila.titulos.length} vistas`}
      aria-expanded={abierta}
      onClick={() => onAlternar(pila.saga)}
    >
      <PosterDelMuro titulo={pila.cara} />
      <span className="filete-muro" />
      {completa && <span className="banda alto">✓ vista</span>}
      <span className="banda"><span>{pila.saga}</span><b>{pila.vistas}/{pila.titulos.length}</b></span>
    </button>
  );
}, (anterior, siguiente) =>
  mismaCeldaDePila(anterior.pila, siguiente.pila) &&
  anterior.abierta === siguiente.abierta &&
  anterior.onAlternar === siguiente.onAlternar,
);

export default function MuroCatalogo({
  abierta,
  onCerrar,
  onAgregar,
  salaId,
  titulos,
  butacas,
}: {
  abierta: boolean;
  onCerrar: () => void;
  onAgregar: (disparador: HTMLButtonElement) => void;
  salaId: Id<"salas">;
  titulos: readonly TituloDeSala[];
  butacas: readonly string[];
}) {
  const marcarVisto = useMutation(api.titulos.marcarVisto);
  const quitar = useMutation(api.titulos.quitar);
  const [filtro, setFiltro] = useState<FiltroDelMuro>("todo");
  const [busqueda, setBusqueda] = useState("");
  const [pilaAbierta, setPilaAbierta] = useState<string | null>(null);
  const [tituloAbiertoId, setTituloAbiertoId] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");
  const devolverFocoA = useRef<HTMLElement | null>(null);
  const muro = useMemo(
    () => derivarMuro(titulos, { filtro, busqueda }),
    [busqueda, filtro, titulos],
  );
  const tituloAbierto = titulos.find(({ _id }) => _id === tituloAbiertoId) ?? null;

  const abrirFicha = useCallback((titulo: TituloDeSala, disparador: HTMLElement) => {
    devolverFocoA.current = disparador;
    setTituloAbiertoId(titulo._id);
    setConfirmando(false);
    setError("");
  }, []);
  const alternarPila = useCallback((saga: string) => {
    setPilaAbierta((actual) => actual === saga ? null : saga);
  }, []);
  const cerrarFicha = useCallback(() => {
    setTituloAbiertoId(null);
    setConfirmando(false);
    setError("");
  }, []);

  async function cambiarVisto() {
    if (!tituloAbierto || ocupado) return;
    setOcupado(true);
    setError("");
    try {
      await marcarVisto({
        salaId,
        tituloId: tituloAbierto._id as Id<"titulos">,
        visto: !tituloAbierto.visto,
      });
    } catch {
      setError("No pudimos guardar este cambio.");
    } finally {
      setOcupado(false);
    }
  }

  async function confirmarQuitar() {
    if (!tituloAbierto || ocupado) return;
    if (!confirmando) {
      setConfirmando(true);
      return;
    }
    setOcupado(true);
    setError("");
    try {
      await quitar({ salaId, tituloId: tituloAbierto._id as Id<"titulos"> });
      cerrarFicha();
    } catch {
      setError("No pudimos quitar este título.");
      setConfirmando(false);
    } finally {
      setOcupado(false);
    }
  }

  useEffect(() => {
    if (!abierta) return;
    function cerrarConEscape(evento: KeyboardEvent) {
      if (evento.key === "Escape" && !document.querySelector('.hoja.abierta')) onCerrar();
    }
    document.addEventListener("keydown", cerrarConEscape);
    return () => document.removeEventListener("keydown", cerrarConEscape);
  }, [abierta, onCerrar]);

  if (!abierta) return null;

  return (
    <aside className="catalogo" aria-label="El catálogo">
      <div className="encabezado">
        <h2>EL CATÁLOGO</h2>
        <button className="btn-cerrar" type="button" aria-label="Cerrar el catálogo" onClick={onCerrar}>✕</button>
      </div>
      <label className="campo">
        <span className="lupa" aria-hidden="true">⌕</span>
        <span className="solo-lectores">Buscar en el catálogo</span>
        <input
          value={busqueda}
          onChange={(evento) => setBusqueda(evento.target.value)}
          placeholder="Buscar…"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          enterKeyHint="search"
        />
        {busqueda && <button className="limpiar" type="button" aria-label="Limpiar búsqueda" onClick={() => setBusqueda("")}>✕</button>}
      </label>
      <div className="chips" role="group" aria-label="Filtrar catálogo">
        {FILTROS.map(({ valor, etiqueta }) => (
          <button
            className={`chip${filtro === valor ? " sel" : ""}`}
            type="button"
            key={valor}
            aria-pressed={filtro === valor}
            onClick={() => setFiltro(valor)}
          >
            {etiqueta} <b>{muro.cuentas[valor]}</b>
          </button>
        ))}
      </div>
      {muro.celdas.length > 0 ? (
        <main className="muro">
          {muro.celdas.map((celda) =>
            celda.tipo === "pila" ? (
              <div className="grupo-del-muro" key={celda.saga}>
                <CeldaDePila pila={celda} abierta={pilaAbierta === celda.saga} onAlternar={alternarPila} />
                {pilaAbierta === celda.saga && (
                  <div className="tira">
                    <span className="rotulo-tira" aria-hidden="true" />
                    {celda.visibles.map(({ titulo, bloqueada }) => (
                      <CeldaDeTitulo titulo={titulo} bloqueada={bloqueada} onAbrir={abrirFicha} key={titulo._id} />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <CeldaDeTitulo titulo={celda.titulo} bloqueada={celda.bloqueada} onAbrir={abrirFicha} key={celda.titulo._id} />
            ),
          )}
        </main>
      ) : (
        busqueda.trim() ? (
          <p className="nada">Nada con <b>«{busqueda}»</b> en el catálogo.</p>
        ) : (
          <p className="nada">No hay títulos para el filtro <b>«{FILTROS.find(({ valor }) => valor === filtro)?.etiqueta}»</b>.</p>
        )
      )}

      <div className="llamada">
        <button type="button" onClick={(evento) => onAgregar(evento.currentTarget)}>
          ＋ Agregar al catálogo
        </button>
      </div>

      <HojaInferior
        abierta={tituloAbierto !== null}
        etiqueta="Ficha del título"
        devolverFocoA={devolverFocoA}
        onCerrar={cerrarFicha}
      >
        {tituloAbierto && (
          <div className="catalogo-ficha">
            <div className={`marco-laton${tituloAbierto.posterPath ? "" : " punteado"}`}>
              {tituloAbierto.posterPath ? (
                <PosterDeFicha key={tituloAbierto.posterPath} posterPath={tituloAbierto.posterPath} />
              ) : <PosterCrudo titulo={tituloAbierto} />}
            </div>
            {!tituloAbierto.posterPath && <p className="fuente sin-poster">sin póster oficial</p>}
            <div className="ficha">
              <h2>{tituloAbierto.nombre}</h2>
              <DatosFicha key={tituloAbierto._id} salaId={salaId} tituloId={tituloAbierto._id as Id<"titulos">} anio={tituloAbierto.anio} tipo={tituloAbierto.tipo} />
              <ChipsDisponibilidad key={tituloAbierto._id} salaId={salaId} tituloId={tituloAbierto._id as Id<"titulos">} />
              {tituloAbierto.agregadoPor && <p className="autoria-catalogo">Agregó {tituloAbierto.agregadoPor}</p>}
            </div>
            {tituloAbierto.visto && <CalificacionesTitulo key={tituloAbierto._id} salaId={salaId} titulo={tituloAbierto} butacas={butacas} />}
            <div className="acciones">
              <button className="btn-ver" type="button" disabled={ocupado} onClick={() => void cambiarVisto()}>
                {tituloAbierto.visto ? "Volver a la cartelera" : "Ya la vimos"}
              </button>
              <button className={`btn-veto${confirmando ? " confirma" : ""}`} type="button" disabled={ocupado} onClick={() => void confirmarQuitar()}>
                {confirmando ? "¿Seguro? Quitar" : "Quitar"}
              </button>
            </div>
            {error && <p className="razon-veto error">{error}</p>}
          </div>
        )}
      </HojaInferior>
    </aside>
  );
}
