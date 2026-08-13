"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAction, useMutation } from "convex/react";
import {
  Fragment,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import {
  ESPERA_BUSQUEDA_MS,
  claveTmdb,
  estaEstrenado,
  etiquetaDelBotonDeSaga,
  etiquetaDeEstrenoPendiente,
  hoyEnMexico,
  mismaFilaDeBusqueda,
  mismaParteDeSaga,
  ordenarPartesPorEstreno,
  prepararAltaDeSaga,
  sagaExistenteEnColeccion,
  siguienteOrdenDeSaga,
  type TipoTitulo,
  type TituloEncontrado,
  type TituloParaAlta,
} from "./alta-logica";
import type { TituloDeSala } from "./cartelera";
import HojaInferior from "./hoja-inferior";
import PosterCrudo from "./poster-crudo";

type VistaDelAlta = "buscar" | "saga" | "manual";

function PosterDeAlta({ titulo }: { titulo: TituloEncontrado | { nombre: string; anio?: number } }) {
  if ("posterPath" in titulo && titulo.posterPath) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- El contrato vigente sirve TMDB directo, sin el optimizador de Next.
      <img
        src={`https://image.tmdb.org/t/p/w185${titulo.posterPath}`}
        alt=""
        width={185}
        height={278}
        loading="lazy"
      />
    );
  }
  return (
    <PosterCrudo
      titulo={{
        _id: "previa-alta",
        tipo: "pelicula",
        nombre: titulo.nombre,
        ...(titulo.anio === undefined ? {} : { anio: titulo.anio }),
        visto: false,
      }}
    />
  );
}

const FilaDeBusqueda = memo(function FilaDeBusqueda({
  titulo,
  hoy,
  agregado,
  sellado,
  ocupado,
  onAgregar,
}: {
  titulo: TituloEncontrado;
  hoy: string;
  agregado: boolean;
  sellado: boolean;
  ocupado: boolean;
  onAgregar: (titulo: TituloEncontrado) => void;
}) {
  const estrenado = estaEstrenado(titulo.fechaEstreno, hoy);
  const desactivado = agregado || !estrenado || ocupado;
  const meta = [
    titulo.anio ?? "s/f",
    titulo.tipo === "serie" ? "Serie" : "Película",
    agregado ? "ya está" : !estrenado ? etiquetaDeEstrenoPendiente(titulo.fechaEstreno) : null,
  ].filter(Boolean).join(" · ");

  return (
    <button
      className={`resultado${sellado ? " puesto" : ""}`}
      type="button"
      disabled={desactivado}
      onClick={() => onAgregar(titulo)}
    >
      <PosterDeAlta titulo={titulo} />
      <span>
        <span className="nom">{titulo.nombre}</span>
        <span className="met">{meta}</span>
      </span>
      <span className="sumar" aria-hidden="true">
        {agregado ? "✓" : !estrenado ? "⏳" : ocupado ? "…" : "＋"}
      </span>
    </button>
  );
}, (anterior, siguiente) =>
  mismaFilaDeBusqueda(anterior.titulo, siguiente.titulo) &&
  anterior.hoy === siguiente.hoy &&
  anterior.agregado === siguiente.agregado &&
  anterior.sellado === siguiente.sellado &&
  anterior.ocupado === siguiente.ocupado &&
  anterior.onAgregar === siguiente.onAgregar,
);

const FilaDeParteEstrenada = memo(function FilaDeParteEstrenada({
  parte,
  indice,
  vista,
  corteActivo,
  onSacar,
  onCambiarCorte,
}: {
  parte: TituloEncontrado;
  indice: number;
  vista: boolean;
  corteActivo: boolean;
  onSacar: (id: number) => void;
  onCambiarCorte: (corte: number) => void;
}) {
  return (
    <>
      <div className={`parte${vista ? " antes" : ""}`}>
        <span className="idx">{indice + 1}</span>
        <PosterDeAlta titulo={parte} />
        <span>
          <span className="nom">{parte.nombre}</span>
          <span className="anio">{parte.anio ?? "s/f"}{vista ? " · ya la habíamos visto" : ""}</span>
        </span>
        <button className="quitar" type="button" aria-label={`Sacar ${parte.nombre} de la saga`} onClick={() => onSacar(parte.id)}>✕</button>
      </div>
      <button className={`corte${corteActivo ? " activo" : ""}`} type="button" onClick={() => onCambiarCorte(indice + 1)}>
        <span className="linea" /> {corteActivo ? "Empezamos aquí" : "Vimos hasta aquí"} <span className="linea" />
      </button>
    </>
  );
}, (anterior, siguiente) =>
  mismaParteDeSaga(anterior.parte, siguiente.parte) &&
  anterior.indice === siguiente.indice &&
  anterior.vista === siguiente.vista &&
  anterior.corteActivo === siguiente.corteActivo &&
  anterior.onSacar === siguiente.onSacar &&
  anterior.onCambiarCorte === siguiente.onCambiarCorte,
);

const FilaDeParteSinEstreno = memo(function FilaDeParteSinEstreno({
  parte,
  onSacar,
}: {
  parte: TituloEncontrado;
  onSacar: (id: number) => void;
}) {
  return (
    <div className="parte sin-estrenar">
      <span className="idx">—</span>
      <PosterDeAlta titulo={parte} />
      <span>
        <span className="nom">{parte.nombre}</span>
        <span className="anio">{parte.anio ?? "s/f"} · {etiquetaDeEstrenoPendiente(parte.fechaEstreno)}</span>
      </span>
      <button className="quitar" type="button" aria-label={`Sacar ${parte.nombre} de la saga`} onClick={() => onSacar(parte.id)}>✕</button>
    </div>
  );
}, (anterior, siguiente) =>
  mismaParteDeSaga(anterior.parte, siguiente.parte) &&
  anterior.onSacar === siguiente.onSacar,
);

function useBusquedaTmdb({
  activa,
  consulta,
  salaId,
}: {
  activa: boolean;
  consulta: string;
  salaId: Id<"salas">;
}) {
  const buscar = useAction(api.tmdb.buscar);
  const [resultados, setResultados] = useState<TituloEncontrado[] | null>(null);
  const [consultaResuelta, setConsultaResuelta] = useState("");
  const [solicitando, setSolicitando] = useState(false);
  const [error, setError] = useState("");
  const secuencia = useRef(0);

  useEffect(() => {
    const id = ++secuencia.current;
    const limpia = consulta.trim();
    if (!activa || limpia.length < 2) {
      return;
    }

    const temporizador = window.setTimeout(() => {
      setSolicitando(true);
      setError("");
      void buscar({ salaId, consulta: limpia })
        .then((encontrados) => {
          if (secuencia.current !== id) return;
          setResultados(encontrados as TituloEncontrado[]);
          setConsultaResuelta(limpia);
          setSolicitando(false);
        })
        .catch(() => {
          if (secuencia.current !== id) return;
          setError("TMDB no pudo responder. Intenta otra vez.");
          setConsultaResuelta(limpia);
          setSolicitando(false);
        });
    }, ESPERA_BUSQUEDA_MS);

    return () => {
      window.clearTimeout(temporizador);
      if (secuencia.current === id) secuencia.current += 1;
    };
  }, [activa, buscar, consulta, salaId]);

  const limpia = consulta.trim();
  const vigente = activa && limpia.length >= 2;
  return {
    resultados: vigente ? resultados : null,
    buscando: vigente && (solicitando || consultaResuelta !== limpia),
    error: vigente && consultaResuelta === limpia ? error : "",
  };
}

function ListaDeResultados({
  resultados,
  buscando,
  error,
  consulta,
  hoy,
  idsAgregados,
  idsSellados,
  idsOcupados,
  onAgregar,
  onAbrirColeccion,
  textoVacio,
}: {
  resultados: TituloEncontrado[] | null;
  buscando: boolean;
  error: string;
  consulta: string;
  hoy: string;
  idsAgregados: ReadonlySet<string>;
  idsSellados: ReadonlySet<string>;
  idsOcupados: ReadonlySet<string>;
  onAgregar: (titulo: TituloEncontrado) => void;
  onAbrirColeccion: (coleccion: { id: number; nombre: string }) => void;
  textoVacio: string;
}) {
  if (buscando && !resultados?.length) {
    return (
      <>
        <p className="nota"><span className="corriendo"><i /><i /><i /></span> Preguntándole a TMDB…</p>
        <div className="cintas" aria-hidden="true">
          {Array.from({ length: 4 }, (_, indice) => <div className="cinta" key={indice} />)}
        </div>
      </>
    );
  }
  if (error) return <p className="error-alta" role="alert">{error}</p>;
  if (resultados === null) return <p className="nota">Películas y series · en español · México</p>;
  if (resultados.length === 0) {
    return <div className="sin-resultados">TMDB no encuentra <b>«{consulta}»</b>.<br />{textoVacio}</div>;
  }

  const coleccionesMostradas = new Set<number>();
  return (
    <div className={buscando ? "resultados buscando" : "resultados"}>
      {resultados.map((titulo) => {
        const clave = claveTmdb(titulo.tipo, titulo.id);
        const primeraDeColeccion = Boolean(
          titulo.coleccion &&
          estaEstrenado(titulo.fechaEstreno, hoy) &&
          !coleccionesMostradas.has(titulo.coleccion.id),
        );
        if (primeraDeColeccion && titulo.coleccion) coleccionesMostradas.add(titulo.coleccion.id);
        return (
          <Fragment key={`${titulo.tipo}-${titulo.id}`}>
            <FilaDeBusqueda
              titulo={titulo}
              hoy={hoy}
              agregado={idsAgregados.has(clave)}
              sellado={idsSellados.has(clave)}
              ocupado={idsOcupados.has(clave)}
              onAgregar={onAgregar}
            />
            {primeraDeColeccion && titulo.coleccion && estaEstrenado(titulo.fechaEstreno, hoy) && (
              <button
                className="liston"
                type="button"
                onClick={() => onAbrirColeccion(titulo.coleccion!)}
              >
                ⛓ Parte de «{titulo.coleccion.nombre}» — agregar con candado
              </button>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

export default function AltaTitulos({
  abierta,
  onCerrar,
  devolverFocoA,
  salaId,
  butaca,
  butacas,
  onCambiarButaca,
  titulos,
}: {
  abierta: boolean;
  onCerrar: () => void;
  devolverFocoA: RefObject<HTMLElement | null>;
  salaId: Id<"salas">;
  butaca: string;
  butacas: readonly string[];
  onCambiarButaca: (butaca: string) => void;
  titulos: readonly TituloDeSala[];
}) {
  const altaEnLote = useMutation(api.titulos.altaEnLote);
  const traerColeccion = useAction(api.tmdb.coleccion);
  const buscador = useRef<HTMLInputElement>(null);
  const butacaActual = useRef(butaca);
  const [vista, setVista] = useState<VistaDelAlta>("buscar");
  const [consulta, setConsulta] = useState("");
  const [idsSellados, setIdsSellados] = useState<ReadonlySet<string>>(new Set());
  const [idsOcupados, setIdsOcupados] = useState<ReadonlySet<string>>(new Set());
  const [errorAlta, setErrorAlta] = useState("");
  const [partes, setPartes] = useState<TituloEncontrado[]>([]);
  const [nombreSaga, setNombreSaga] = useState("");
  const [corte, setCorte] = useState(0);
  const [unaEntrada, setUnaEntrada] = useState(false);
  const [uniendo, setUniendo] = useState(false);
  const [consultaUnion, setConsultaUnion] = useState("");
  const [coleccionOcupada, setColeccionOcupada] = useState(false);
  const [guardandoSaga, setGuardandoSaga] = useState(false);
  const [manualNombre, setManualNombre] = useState("");
  const [manualTipo, setManualTipo] = useState<TipoTitulo>("pelicula");
  const [manualAnio, setManualAnio] = useState("");
  const [manualSaga, setManualSaga] = useState("");
  const [guardandoManual, setGuardandoManual] = useState(false);
  const hoy = abierta ? hoyEnMexico() : "";
  const idsDelCatalogo = useMemo(
    () => new Set(titulos.flatMap(({ tipo, tmdbId }) =>
      tmdbId === undefined ? [] : [claveTmdb(tipo, tmdbId)]
    )),
    [titulos],
  );
  const idsAgregados = useMemo(
    () => new Set([...idsDelCatalogo, ...idsSellados]),
    [idsDelCatalogo, idsSellados],
  );
  const busqueda = useBusquedaTmdb({
    activa: abierta && vista === "buscar",
    consulta,
    salaId,
  });
  const busquedaUnion = useBusquedaTmdb({
    activa: abierta && vista === "saga" && uniendo,
    consulta: consultaUnion,
    salaId,
  });

  useEffect(() => {
    butacaActual.current = butaca;
  }, [butaca]);

  const cerrar = useCallback(() => {
    setVista("buscar");
    setPartes([]);
    setUniendo(false);
    setErrorAlta("");
    onCerrar();
  }, [onCerrar]);

  const agregarSuelto = useCallback((titulo: TituloEncontrado) => {
    if (!estaEstrenado(titulo.fechaEstreno, hoy)) return;
    const clave = claveTmdb(titulo.tipo, titulo.id);
    setIdsOcupados((actuales) => new Set(actuales).add(clave));
    setErrorAlta("");
    const porAgregar: TituloParaAlta = {
      tipo: titulo.tipo,
      nombre: titulo.nombre,
      ...(titulo.anio === undefined ? {} : { anio: titulo.anio }),
      tmdbId: titulo.id,
      ...(titulo.posterPath === undefined ? {} : { posterPath: titulo.posterPath }),
      visto: false,
    };
    void altaEnLote({ salaId, agregadoPor: butacaActual.current, titulos: [porAgregar] })
      .then(() => setIdsSellados((actuales) => new Set(actuales).add(clave)))
      .catch(() => setErrorAlta("No pudimos agregar este título."))
      .finally(() => setIdsOcupados((actuales) => {
        const siguientes = new Set(actuales);
        siguientes.delete(clave);
        return siguientes;
      }));
  }, [altaEnLote, hoy, salaId]);

  const incorporarPartes = useCallback((nuevas: readonly TituloEncontrado[]) => {
    setPartes((actuales) => {
      const dentro = new Set([
        ...actuales.map(({ tipo, id }) => claveTmdb(tipo, id)),
        ...idsDelCatalogo,
      ]);
      return ordenarPartesPorEstreno([
        ...actuales,
        ...nuevas.filter(({ id, tipo }) =>
          tipo === "pelicula" && !dentro.has(claveTmdb(tipo, id))
        ),
      ]);
    });
  }, [idsDelCatalogo]);

  const abrirColeccion = useCallback((coleccion: { id: number; nombre: string }) => {
    if (coleccionOcupada) return;
    setColeccionOcupada(true);
    setErrorAlta("");
    void traerColeccion({ salaId, coleccionId: coleccion.id })
      .then((respuesta) => {
        const partesDeColeccion = respuesta.partes as TituloEncontrado[];
        const sagaExistente = sagaExistenteEnColeccion(titulos, partesDeColeccion);
        const disponibles = partesDeColeccion.filter(({ tipo, id }) =>
          !idsDelCatalogo.has(claveTmdb(tipo, id))
        );
        if (disponibles.length === 0) {
          setErrorAlta("Esa colección ya está completa en el catálogo.");
          return;
        }
        setPartes(ordenarPartesPorEstreno(disponibles));
        setNombreSaga(sagaExistente ?? respuesta.nombre);
        setCorte(0);
        setUnaEntrada(false);
        setUniendo(false);
        setVista("saga");
      })
      .catch(() => setErrorAlta("No pudimos traer esa colección de TMDB."))
      .finally(() => setColeccionOcupada(false));
  }, [coleccionOcupada, idsDelCatalogo, salaId, titulos, traerColeccion]);

  const unirColeccion = useCallback((coleccion: { id: number; nombre: string }) => {
    if (coleccionOcupada) return;
    setColeccionOcupada(true);
    setErrorAlta("");
    void traerColeccion({ salaId, coleccionId: coleccion.id })
      .then((respuesta) => incorporarPartes(respuesta.partes as TituloEncontrado[]))
      .catch(() => setErrorAlta("No pudimos unir esa colección."))
      .finally(() => setColeccionOcupada(false));
  }, [coleccionOcupada, incorporarPartes, salaId, traerColeccion]);

  const unirPelicula = useCallback((titulo: TituloEncontrado) => {
    if (!estaEstrenado(titulo.fechaEstreno, hoy)) return;
    incorporarPartes([titulo]);
  }, [hoy, incorporarPartes]);

  const sacarParte = useCallback((id: number) => {
    const estrenadas = partes.filter(({ fechaEstreno }) => estaEstrenado(fechaEstreno, hoy));
    const indiceEstrenado = estrenadas.findIndex((parte) => parte.id === id);
    setPartes((actuales) => actuales.filter((parte) => parte.id !== id));
    if (indiceEstrenado >= 0) {
      setCorte((actual) => indiceEstrenado < actual ? Math.max(0, actual - 1) : actual);
    }
  }, [hoy, partes]);

  const cambiarCorte = useCallback((nuevoCorte: number) => setCorte(nuevoCorte), []);

  async function guardarSaga() {
    if (guardandoSaga) return;
    setGuardandoSaga(true);
    setErrorAlta("");
    try {
      const lote = prepararAltaDeSaga({
        nombre: nombreSaga,
        partes,
        corte,
        unaEntrada,
        ordenInicial: siguienteOrdenDeSaga(titulos, nombreSaga.trim()),
      }, hoy);
      await altaEnLote({ salaId, agregadoPor: butacaActual.current, titulos: lote });
      cerrar();
    } catch (error) {
      setErrorAlta(error instanceof Error && error.message.startsWith("La saga")
        ? error.message
        : "No pudimos agregar esta saga.");
    } finally {
      setGuardandoSaga(false);
    }
  }

  async function guardarManual() {
    if (guardandoManual || !manualNombre.trim()) return;
    setGuardandoManual(true);
    setErrorAlta("");
    try {
      const saga = manualTipo === "pelicula" && manualSaga ? manualSaga : undefined;
      const titulo: TituloParaAlta = {
        tipo: manualTipo,
        nombre: manualNombre.trim(),
        ...(manualAnio ? { anio: Number(manualAnio) } : {}),
        ...(saga ? { saga, orden: siguienteOrdenDeSaga(titulos, saga) } : {}),
        visto: false,
      };
      await altaEnLote({ salaId, agregadoPor: butacaActual.current, titulos: [titulo] });
      setManualNombre("");
      setManualTipo("pelicula");
      setManualAnio("");
      setManualSaga("");
      cerrar();
    } catch {
      setErrorAlta("No pudimos agregar este título a mano.");
    } finally {
      setGuardandoManual(false);
    }
  }

  function irAManual() {
    if (busqueda.resultados?.length === 0) setManualNombre(consulta.trim());
    setErrorAlta("");
    setVista("manual");
  }

  function sagaVacia() {
    setPartes([]);
    setNombreSaga("");
    setCorte(0);
    setUnaEntrada(false);
    setUniendo(true);
    setErrorAlta("");
    setVista("saga");
  }

  function volverABuscar() {
    setVista("buscar");
    setErrorAlta("");
    window.requestAnimationFrame(() => buscador.current?.focus());
  }

  function alternarButaca() {
    const indice = butacas.indexOf(butaca);
    const siguiente = butacas[(indice + 1) % butacas.length];
    if (siguiente) {
      butacaActual.current = siguiente;
      onCambiarButaca(siguiente);
    }
  }

  const partesOrdenadas = ordenarPartesPorEstreno(partes);
  const estrenadas = partesOrdenadas.filter(({ fechaEstreno }) => estaEstrenado(fechaEstreno, hoy));
  const sinEstrenar = partesOrdenadas.filter(({ fechaEstreno }) => !estaEstrenado(fechaEstreno, hoy));
  const enCartelera = unaEntrada ? 1 : Math.max(0, estrenadas.length - corte);
  const sagasExistentes = [...new Set(titulos.flatMap(({ saga }) => saga ? [saga] : []))]
    .sort((izquierda, derecha) => izquierda.localeCompare(derecha));
  const idsDePartes = new Set(partes.map(({ tipo, id }) => claveTmdb(tipo, id)));

  return (
    <HojaInferior
      abierta={abierta}
      etiqueta="Alta de títulos"
      devolverFocoA={devolverFocoA}
      enfocarAlAbrir={buscador}
      className="alta cajon"
      onCerrar={cerrar}
    >
      <div className="cabecera">
        <h2>{vista === "saga" ? "UNA SAGA" : vista === "manual" ? "A MANO" : "AGREGAR"}</h2>
        <button className="butaca butaca-alta" type="button" onClick={alternarButaca}>
          Agrega <b>{butaca.toLocaleUpperCase()}</b> ⇄
        </button>
        <button className="cerrar" type="button" aria-label="Cerrar" onClick={cerrar}>✕</button>
      </div>

      <div className="cuerpo">
        <section className="panel-alta" hidden={vista !== "buscar"}>
          <label className="campo">
            <span className="lupa" aria-hidden="true">⌕</span>
            <span className="solo-lectores">Buscar en TMDB</span>
            <input
              ref={buscador}
              value={consulta}
              onChange={(evento) => setConsulta(evento.target.value)}
              placeholder="Duna, Star Wars, Severance…"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              enterKeyHint="search"
            />
          </label>
          <ListaDeResultados
            {...busqueda}
            consulta={consulta}
            hoy={hoy}
            idsAgregados={idsAgregados}
            idsSellados={idsSellados}
            idsOcupados={idsOcupados}
            onAgregar={agregarSuelto}
            onAbrirColeccion={abrirColeccion}
            textoVacio="Puede entrar a mano."
          />
          {errorAlta && <p className="error-alta" role="alert">{errorAlta}</p>}
          <div className="fila-botones">
            <button type="button" onClick={irAManual}>✎ No está en TMDB</button>
            <button type="button" onClick={sagaVacia}>⛓ Armar una saga a mano</button>
          </div>
        </section>

        <section className="panel-alta" hidden={vista !== "saga"}>
          <h3 className="titulo-seccion">CÓMO SE LLAMA LA SAGA</h3>
          <input
            className="nombre-saga"
            value={nombreSaga}
            onChange={(evento) => setNombreSaga(evento.target.value)}
            placeholder="Star Wars, La Tierra Media…"
          />
          <p className="explica">
            Todo en orden de estreno. Toca una línea de latón: arriba entra como ya visto,
            sin fecha; abajo entra a la cartelera.
          </p>

          {!uniendo && (
            <>
              {!unaEntrada && (
                <button className={`corte${corte === 0 ? " activo" : ""}`} type="button" onClick={() => setCorte(0)}>
                  <span className="linea" /> Desde el principio <span className="linea" />
                </button>
              )}
              {unaEntrada && estrenadas[0] ? (
                <div className="parte">
                  <span className="idx">⛓</span>
                  <PosterDeAlta titulo={estrenadas[0]} />
                  <span><span className="nom">{nombreSaga || "Sin nombre"}</span><span className="anio">{estrenadas.length} películas · una sola entrada</span></span>
                </div>
              ) : estrenadas.map((parte, indice) => (
                <FilaDeParteEstrenada
                  key={parte.id}
                  parte={parte}
                  indice={indice}
                  vista={indice < corte}
                  corteActivo={corte === indice + 1}
                  onSacar={sacarParte}
                  onCambiarCorte={cambiarCorte}
                />
              ))}
              {sinEstrenar.map((parte) => (
                <FilaDeParteSinEstreno key={parte.id} parte={parte} onSacar={sacarParte} />
              ))}

              <button className={`interruptor${unaEntrada ? " on" : ""}`} type="button" onClick={() => setUnaEntrada((actual) => !actual)}>
                <span className="caja">{unaEntrada ? "✓" : ""}</span>
                <span className="txt">Agregar la saga como una sola entrada<small>Compite una vez, sin candado ni orden</small></span>
              </button>
              <div className="fila-botones"><button type="button" onClick={() => setUniendo(true)}>⛓ Añadir a esta saga</button></div>
              <div className="fila-botones">
                <button type="button" onClick={volverABuscar}>← Volver</button>
                <button className="principal" type="button" disabled={guardandoSaga || estrenadas.length === 0 || !nombreSaga.trim()} onClick={() => void guardarSaga()}>
                  {etiquetaDelBotonDeSaga({ cantidadDeEstrenadas: estrenadas.length, enCartelera, unaEntrada })}
                </button>
              </div>
            </>
          )}

          {uniendo && (
            <div className="unir-saga">
              <h3 className="titulo-seccion">AÑADIR A «{nombreSaga || "LA SAGA"}»</h3>
              <p className="explica">Busca otra colección o una película suelta. La saga se reordena sola por estreno.</p>
              <label className="campo">
                <span className="lupa" aria-hidden="true">⌕</span>
                <span className="solo-lectores">Buscar para unir a la saga</span>
                <input
                  value={consultaUnion}
                  onChange={(evento) => setConsultaUnion(evento.target.value)}
                  placeholder="Otra colección o película…"
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                />
              </label>
              <ListaDeResultados
                {...busquedaUnion}
                consulta={consultaUnion}
                hoy={hoy}
                idsAgregados={new Set([...idsDelCatalogo, ...idsDePartes])}
                idsSellados={new Set()}
                idsOcupados={new Set()}
                onAgregar={unirPelicula}
                onAbrirColeccion={unirColeccion}
                textoVacio="Prueba con otro nombre."
              />
              {errorAlta && <p className="error-alta" role="alert">{errorAlta}</p>}
              <div className="fila-botones">
                <button className="principal" type="button" disabled={coleccionOcupada} onClick={() => setUniendo(false)}>Listo</button>
              </div>
            </div>
          )}
          {!uniendo && errorAlta && <p className="error-alta" role="alert">{errorAlta}</p>}
        </section>

        <section className="panel-alta" hidden={vista !== "manual"}>
          <p className="explica">Para lo que TMDB no conoce. Entra con marco punteado y sin póster oficial.</p>
          <div className="campos">
            <label>Nombre
              <input value={manualNombre} onChange={(evento) => setManualNombre(evento.target.value)} placeholder="Sheep Detectives" autoComplete="off" />
            </label>
            <div className="dosdos">
              <label>Qué es
                <select value={manualTipo} onChange={(evento) => {
                  const tipo = evento.target.value as TipoTitulo;
                  setManualTipo(tipo);
                  if (tipo === "serie") setManualSaga("");
                }}>
                  <option value="pelicula">Película</option>
                  <option value="serie">Serie</option>
                </select>
              </label>
              <label>Año
                <input value={manualAnio} inputMode="numeric" placeholder="2019" onChange={(evento) => setManualAnio(evento.target.value.replace(/\D/g, "").slice(0, 4))} />
              </label>
            </div>
            {manualTipo === "pelicula" && sagasExistentes.length > 0 && (
              <label>¿Es parte de una saga?
                <select value={manualSaga} onChange={(evento) => setManualSaga(evento.target.value)}>
                  <option value="">No</option>
                  {sagasExistentes.map((saga) => <option value={saga} key={saga}>{saga}</option>)}
                </select>
              </label>
            )}
          </div>
          <div className="previa">
            <PosterDeAlta titulo={{ nombre: manualNombre || "Sin título", ...(manualAnio ? { anio: Number(manualAnio) } : {}) }} />
            <p>Mismo tamaño, marco punteado y la nota <i>sin póster oficial</i>. Nadie la confunde con una ficha de TMDB.</p>
          </div>
          {errorAlta && <p className="error-alta" role="alert">{errorAlta}</p>}
          <div className="fila-botones">
            <button type="button" onClick={volverABuscar}>← Volver</button>
            <button className="principal" type="button" disabled={guardandoManual || !manualNombre.trim()} onClick={() => void guardarManual()}>Agregar al catálogo</button>
          </div>
        </section>
      </div>
    </HojaInferior>
  );
}
