"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { anuncioDeRuleta, razonSinRuleta, textoBotonRuleta } from "./ruleta-logica";
import DatosFicha from "./datos-ficha";
import CartelDeFicha from "./cartel-de-ficha";
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
  enRuleta,
  eligiendo,
  razon,
  onAlternarRuleta,
  onAbrir,
}: {
  titulo: TituloDeSala;
  bloqueada: boolean;
  enRuleta: boolean;
  eligiendo: boolean;
  razon: string | null;
  onAlternarRuleta: (titulo: TituloDeSala) => void;
  onAbrir: (titulo: TituloDeSala, disparador: HTMLElement) => void;
}) {
  const estado = titulo.visto ? "✓ vista" : bloqueada ? "🔒 falta la anterior" : null;
  const apagada = eligiendo && !enRuleta && Boolean(razon);
  return (
    <button
      className={`celda${titulo.visto ? " esta-vista" : ""}${bloqueada ? " bloqueada" : ""}${enRuleta ? " en-ruleta" : ""}${apagada ? " apagada" : ""}`}
      type="button"
      aria-label={`${titulo.nombre}${estado ? `, ${estado}` : ""}`}
      aria-pressed={eligiendo ? enRuleta : undefined}
      aria-disabled={apagada || undefined}
      onClick={(evento) => eligiendo ? onAlternarRuleta(titulo) : onAbrir(titulo, evento.currentTarget)}
    >
      <PosterDelMuro titulo={titulo} />
      <span className="filete-muro" />
      {estado && <span className="banda alto">{estado}</span>}
    </button>
  );
}, (anterior, siguiente) =>
  mismaCeldaDeTitulo(anterior, siguiente) &&
  anterior.onAbrir === siguiente.onAbrir &&
  anterior.enRuleta === siguiente.enRuleta &&
  anterior.eligiendo === siguiente.eligiendo &&
  anterior.razon === siguiente.razon &&
  anterior.onAlternarRuleta === siguiente.onAlternarRuleta,
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
  marcadas,
  vetados,
  onAlternarRuleta,
  onVaciarRuleta,
  onGirarRuleta,
  puedeGirar,
}: {
  abierta: boolean;
  onCerrar: () => void;
  onAgregar: (disparador: HTMLButtonElement) => void;
  salaId: Id<"salas">;
  titulos: readonly TituloDeSala[];
  butacas: readonly string[];
  marcadas: readonly string[];
  vetados: ReadonlySet<string>;
  onAlternarRuleta: (titulo: TituloDeSala) => void;
  onVaciarRuleta: () => void;
  onGirarRuleta: () => void;
  puedeGirar: boolean;
}) {
  const registrarDesdeCatalogo = useMutation(api.funciones.registrarDesdeCatalogo);
  const deshacer = useMutation(api.funciones.deshacer);
  const marcarVisto = useMutation(api.titulos.marcarVisto);
  const quitar = useMutation(api.titulos.quitar);
  const [filtro, setFiltro] = useState<FiltroDelMuro>("todo");
  const [busqueda, setBusqueda] = useState("");
  const [pilaAbierta, setPilaAbierta] = useState<string | null>(null);
  const [tituloAbiertoId, setTituloAbiertoId] = useState<string | null>(null);
  const [funcionRegistrada, setFuncionRegistrada] = useState<{ funcionId: Id<"funciones">; fecha: number } | null>(null);
  const sesionFicha = useRef(0);
  const [confirmando, setConfirmando] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");
  const devolverFocoA = useRef<HTMLElement | null>(null);
  const buscador = useRef<HTMLInputElement>(null);
  const [aviso, setAviso] = useState("");
  const [anuncio, setAnuncio] = useState("");
  const avisoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const anuncioCuadro = useRef<number | null>(null);
  const eligiendo = marcadas.length > 0;
  const razones = useMemo(() => new Map(eligiendo
    ? titulos.map((titulo) => [titulo._id, razonSinRuleta(titulo, titulos, vetados, marcadas)] as const)
    : []), [eligiendo, titulos, vetados, marcadas]);
  const muro = useMemo(
    () => derivarMuro(titulos, { filtro, busqueda }),
    [busqueda, filtro, titulos],
  );
  const [recienMarcada, setRecienMarcada] = useState<string | null>(null);
  const tituloAbierto = titulos.find(({ _id }) => _id === tituloAbiertoId) ?? null;

  const razonRuleta = tituloAbierto ? razonSinRuleta(tituloAbierto, titulos, vetados, marcadas) : null;

  const limpiarAviso = useCallback(() => {
    if (avisoTimer.current !== null) clearTimeout(avisoTimer.current);
    avisoTimer.current = null;
    setAviso("");
  }, []);
  const anunciar = useCallback((frase: string) => {
    if (anuncioCuadro.current !== null) cancelAnimationFrame(anuncioCuadro.current);
    // Reescribir permite anunciar también dos activaciones de la misma razón.
    setAnuncio("");
    anuncioCuadro.current = requestAnimationFrame(() => setAnuncio(frase));
  }, []);
  const alternarMarcada = useCallback((titulo: TituloDeSala) => {
    const marcada = marcadas.includes(titulo._id);
    const razon = marcada ? null : eligiendo
      ? razones.get(titulo._id) ?? null
      : razonSinRuleta(titulo, titulos, vetados, marcadas);
    limpiarAviso();
    if (razon) {
      setAviso(razon);
      avisoTimer.current = setTimeout(() => setAviso(""), 2600);
      anunciar(razon);
      return;
    }
    setRecienMarcada(marcada ? null : titulo._id);
    onAlternarRuleta(titulo);
    anunciar(anuncioDeRuleta(titulo.nombre, !marcada, marcadas.length + (marcada ? -1 : 1)));
  }, [marcadas, eligiendo, razones, titulos, vetados, limpiarAviso, anunciar, onAlternarRuleta]);

  useEffect(() => () => {
    if (avisoTimer.current !== null) clearTimeout(avisoTimer.current);
    if (anuncioCuadro.current !== null) cancelAnimationFrame(anuncioCuadro.current);
  }, []);

  const abrirFicha = useCallback((titulo: TituloDeSala, disparador: HTMLElement) => {
    sesionFicha.current += 1;
    setFuncionRegistrada(null);
    devolverFocoA.current = disparador;
    setTituloAbiertoId(titulo._id);
    setConfirmando(false);
    setError("");
  }, []);
  const alternarPila = useCallback((saga: string) => {
    setPilaAbierta((actual) => actual === saga ? null : saga);
  }, []);
  const cerrarFicha = useCallback(() => {
    sesionFicha.current += 1;
    setFuncionRegistrada(null);
    setTituloAbiertoId(null);
    setConfirmando(false);
    setError("");
  }, []);

  const cerrarCatalogo = useCallback(() => {
    limpiarAviso();
    cerrarFicha();
    onCerrar();
  }, [limpiarAviso, cerrarFicha, onCerrar]);

  async function registrarFuncion() {
    if (!tituloAbierto || ocupado) return;
    const sesion = sesionFicha.current;
    setOcupado(true);
    setError("");
    try {
      const funcion = await registrarDesdeCatalogo({ salaId, tituloId: tituloAbierto._id as Id<"titulos"> });
      if (sesionFicha.current === sesion) {
        setFuncionRegistrada(funcion);
        setConfirmando(false);
      }
    } catch {
      if (sesionFicha.current === sesion) setError("No pudimos guardar la función.");
    } finally {
      setOcupado(false);
    }
  }

  async function deshacerFuncion() {
    if (!funcionRegistrada || ocupado) return;
    const sesion = sesionFicha.current;
    setOcupado(true);
    setError("");
    try {
      await deshacer({ salaId, funcionId: funcionRegistrada.funcionId });
      if (sesionFicha.current === sesion) setFuncionRegistrada(null);
    } catch {
      if (sesionFicha.current === sesion) setError("No pudimos deshacer la función.");
    } finally {
      setOcupado(false);
    }
  }

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
      setFuncionRegistrada(null);
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
      if (evento.key === "Escape" && !document.querySelector('.hoja.abierta')) cerrarCatalogo();
    }
    document.addEventListener("keydown", cerrarConEscape);
    return () => document.removeEventListener("keydown", cerrarConEscape);
  }, [abierta, cerrarCatalogo]);

  if (!abierta) return null;

  return (
    <aside className={`catalogo${eligiendo ? " eligiendo" : ""}`} aria-label="El catálogo">
      <p className="solo-lectores" role="status">{anuncio}</p>
      <div className="encabezado">
        <h2>EL CATÁLOGO</h2>
        <button className="btn-cerrar" type="button" aria-label="Cerrar el catálogo" onClick={cerrarCatalogo}>✕</button>
      </div>
      <label className="campo">
        <span className="lupa" aria-hidden="true">⌕</span>
        <span className="solo-lectores">Buscar en el catálogo</span>
        <input
          ref={buscador}
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
                      <CeldaDeTitulo titulo={titulo} bloqueada={bloqueada} enRuleta={marcadas.includes(titulo._id)} eligiendo={eligiendo} razon={razones.get(titulo._id) ?? null} onAlternarRuleta={alternarMarcada} onAbrir={abrirFicha} key={titulo._id} />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <CeldaDeTitulo titulo={celda.titulo} bloqueada={celda.bloqueada} enRuleta={marcadas.includes(celda.titulo._id)} eligiendo={eligiendo} razon={razones.get(celda.titulo._id) ?? null} onAlternarRuleta={alternarMarcada} onAbrir={abrirFicha} key={celda.titulo._id} />
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
        {marcadas.length === 0 ? (
          <button className="agregar" type="button" onClick={(evento) => onAgregar(evento.currentTarget)}>
            ＋ Agregar al catálogo
          </button>
        ) : (
          <div className="barra-ruleta" role="group" aria-label="La ruleta">
            <button className="vaciar" type="button" aria-label="Vaciar la ruleta" onClick={() => {
              limpiarAviso();
              setRecienMarcada(null);
              onVaciarRuleta();
              anunciar("La ruleta quedó vacía.");
              buscador.current?.focus({ preventScroll: true });
            }}>✕</button>
            <div className="ranuras">
              {[0, 1, 2].map((indice) => {
                const titulo = titulos.find(({ _id }) => _id === marcadas[indice]);
                return titulo ? (
                  <button className={`ranura${recienMarcada === titulo._id ? " recien" : ""}`} key={titulo._id} type="button" onAnimationEnd={() => setRecienMarcada(null)} aria-label={`Quitar ${titulo.nombre} de la ruleta`} onClick={() => alternarMarcada(titulo)}>
                    <PosterDelMuro titulo={titulo} />
                  </button>
                ) : <span className="ranura vacia" key={`vacia-${indice}`} aria-hidden="true" />;
              })}
            </div>
            <button className="girar-estas" type="button" disabled={marcadas.length !== 3 || !puedeGirar} onClick={() => { limpiarAviso(); cerrarFicha(); onGirarRuleta(); }}>{textoBotonRuleta(marcadas.length)}</button>
          </div>
        )}
      </div>
      <p className={`aviso-ruleta${aviso ? " on" : ""}`} aria-hidden="true">{aviso}</p>

      <HojaInferior
        abierta={tituloAbierto !== null}
        etiqueta="Ficha del título"
        devolverFocoA={devolverFocoA}
        onCerrar={cerrarFicha}
      >
        {tituloAbierto && (
          <div className="catalogo-ficha">
            <CartelDeFicha titulo={tituloAbierto}>
              <div className={`marco-laton${tituloAbierto.posterPath ? "" : " punteado"}`}>
                {tituloAbierto.posterPath ? (
                  <PosterDeFicha key={tituloAbierto.posterPath} posterPath={tituloAbierto.posterPath} />
                ) : <PosterCrudo titulo={tituloAbierto} />}
              </div>
            </CartelDeFicha>
            {!tituloAbierto.posterPath && <p className="fuente sin-poster">sin póster oficial</p>}
            <div className="ficha">
              <h2>{tituloAbierto.nombre}</h2>
              <DatosFicha key={`datos-${tituloAbierto._id}`} salaId={salaId} tituloId={tituloAbierto._id as Id<"titulos">} anio={tituloAbierto.anio} tipo={tituloAbierto.tipo} />
              <ChipsDisponibilidad key={`disponibilidad-${tituloAbierto._id}`} salaId={salaId} tituloId={tituloAbierto._id as Id<"titulos">} />
              {tituloAbierto.agregadoPor && <p className="autoria-catalogo">Agregó {tituloAbierto.agregadoPor}</p>}
            </div>
            {tituloAbierto.visto && <CalificacionesTitulo key={tituloAbierto._id} salaId={salaId} titulo={tituloAbierto} butacas={butacas} />}
            {funcionRegistrada ? (
              <div className="confirmacion" role="status">
                <span>Vista el <b>{new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short" }).format(funcionRegistrada.fecha)}</b></span>
                <button className="deshacer" type="button" disabled={ocupado} onClick={() => void deshacerFuncion()}>Deshacer</button>
              </div>
            ) : (
              <div className="acciones">
                <button className="btn-ver" type="button" disabled={ocupado} onClick={() => void registrarFuncion()}>Esta vemos</button>
                {!tituloAbierto.visto && (
                  <button className="btn-ruleta" type="button" disabled={ocupado || Boolean(razonRuleta)} onClick={() => {
                    alternarMarcada(tituloAbierto);
                    cerrarFicha();
                  }}>A la ruleta</button>
                )}
              </div>
            )}
            {!tituloAbierto.visto && razonRuleta && <p className="razon-veto">{razonRuleta}</p>}
            <div className="acciones-quietas">
              <button type="button" disabled={ocupado} onClick={() => void cambiarVisto()}>
                {tituloAbierto.visto ? "Volver a la cartelera" : "Ya la habíamos visto"}
              </button>
              <button className={`quitar${confirmando ? " confirma" : ""}`} type="button" disabled={ocupado} onClick={() => void confirmarQuitar()}>
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
