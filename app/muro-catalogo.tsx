"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { memo, useCallback, useMemo, useRef, useState } from "react";
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
      src={`https://image.tmdb.org/t/p/w185${titulo.posterPath}`}
      alt=""
      width={185}
      height={278}
      loading="lazy"
    />
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
}: {
  abierta: boolean;
  onCerrar: () => void;
  onAgregar: (disparador: HTMLButtonElement) => void;
  salaId: Id<"salas">;
  titulos: readonly TituloDeSala[];
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

  if (!abierta) return null;

  return (
    <aside className="catalogo" aria-label="El catálogo">
      <div className="encabezado">
        <h2>EL CATÁLOGO</h2>
        <span className="donde">cajón sobre la sala</span>
        <button className="catalogo-cerrar" type="button" onClick={onCerrar}>Cerrar</button>
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
                // eslint-disable-next-line @next/next/no-img-element -- Ticket 002 marca una zona gris: TMDB se sirve directo, sin el optimizador de Next.
                <img src={`https://image.tmdb.org/t/p/w342${tituloAbierto.posterPath}`} alt="" width={342} height={513} loading="lazy" />
              ) : <PosterCrudo titulo={tituloAbierto} />}
            </div>
            {!tituloAbierto.posterPath && <p className="fuente sin-poster">sin póster oficial</p>}
            <div className="ficha">
              <h2>{tituloAbierto.nombre}</h2>
              <p className="meta">{tituloAbierto.anio ?? "s/f"} · {tituloAbierto.tipo === "serie" ? "Serie" : "Película"}</p>
              <ChipsDisponibilidad key={tituloAbierto._id} salaId={salaId} tituloId={tituloAbierto._id as Id<"titulos">} />
              {tituloAbierto.agregadoPor && <p className="autoria-catalogo">Agregó {tituloAbierto.agregadoPor}</p>}
            </div>
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
