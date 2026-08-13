"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAction, useMutation, useQuery } from "convex/react";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import {
  derivarCartelera,
  VETOS_POR_NOCHE,
  type FiltroCartelera,
  type TituloDeSala,
} from "./cartelera";
import {
  decidirCambioDelGiro,
  elegirIndiceGanador,
  mensajeDeVueltaVacia,
  prepararGiro,
  RITMOS,
} from "./giro";
import { nocheDe, nocheLocalEsMasReciente, proximoCorte } from "./noche";
import HojaInferior from "./hoja-inferior";

const FILTROS: readonly { valor: FiltroCartelera; etiqueta: string }[] = [
  { valor: "pelicula", etiqueta: "Peli" },
  { valor: "serie", etiqueta: "Serie" },
  { valor: "loQueSea", etiqueta: "Lo que sea" },
];

type FaseDelGiro =
  | "reposo"
  | "conteo"
  | "girando"
  | "finalistas"
  | "ganador"
  | "función"
  | "vuelta vacía"
  | "vetando";

type ProveedorDisponibilidad = { nombre: string; logoPath: string };
type EstadoDisponibilidad =
  | { estado: "buscando" }
  | { estado: "sin tmdb" }
  | { estado: "sin datos" }
  | {
      estado: "datos";
      flatrate: ProveedorDisponibilidad[];
      renta: ProveedorDisponibilidad[];
      compra: ProveedorDisponibilidad[];
    };

type ChipDisponibilidad = {
  proveedor: ProveedorDisponibilidad;
  prefijo?: "Renta" | "Compra";
};

function normalizarProveedor(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function colorDeProveedor(nombre: string): string {
  const normalizado = normalizarProveedor(nombre);
  if (normalizado.includes("netflix")) return "#E50914";
  if (normalizado.includes("prime")) return "#00A8E1";
  if (normalizado.includes("disney")) return "#1F6FEB";
  if (normalizado.includes("hbo max") || normalizado === "max") return "#8A2BE2";
  if (normalizado.includes("apple tv")) return "#C9C9C9";
  return "var(--laton)";
}

function chipsDe(
  disponibilidad: EstadoDisponibilidad | null,
): ChipDisponibilidad[] {
  if (disponibilidad?.estado !== "datos") return [];
  if (disponibilidad.flatrate.length > 0) {
    return disponibilidad.flatrate.map((proveedor) => ({ proveedor }));
  }
  if (disponibilidad.renta.length > 0) {
    return disponibilidad.renta
      .slice(0, 3)
      .map((proveedor) => ({ proveedor, prefijo: "Renta" }));
  }
  return disponibilidad.compra
    .slice(0, 3)
    .map((proveedor) => ({ proveedor, prefijo: "Compra" }));
}

function appEstaInstalada(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

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

function PosterCrudo({ titulo }: { titulo: TituloDeSala }) {
  return (
    <svg viewBox="0 0 300 450" aria-hidden="true" focusable="false">
      <rect width="300" height="450" fill="#1E1014" />
      <circle cx="150" cy="175" r="82" fill="none" stroke="#C9A227" strokeWidth="2" />
      <path d="M52 330 H248" stroke="#8A6F1C" strokeWidth="3" />
      <text x="150" y="360" textAnchor="middle" fill="#F2E5C6" fontSize="18">
        {titulo.nombre.slice(0, 24).toUpperCase()}
      </text>
      {titulo.anio && (
        <text x="150" y="390" textAnchor="middle" fill="#9A8E75" fontSize="14">
          {titulo.anio}
        </text>
      )}
    </svg>
  );
}

function tiraDe(
  candidatos: readonly TituloDeSala[],
  finalista: TituloDeSala,
): TituloDeSala[] {
  const vueltas = Array.from(
    { length: 14 },
    () => candidatos[Math.floor(Math.random() * candidatos.length)],
  );
  return [...vueltas, finalista];
}

export default function SalaCartelera({
  salaId,
  codigo,
}: {
  salaId: Id<"salas">;
  codigo: string;
}) {
  const titulos = useQuery(api.titulos.deSala, { salaId });
  const [momentoConsulta, setMomentoConsulta] = useState(() => Date.now());
  const noche = useQuery(api.noches.vigente, { salaId, momento: momentoConsulta });
  const vetarTitulo = useMutation(api.noches.vetar);
  const cerrarFuncion = useMutation(api.funciones.cerrar);
  const buscarDisponibilidad = useAction(api.disponibilidad.deTitulo);
  const [filtro, setFiltro] = useState<FiltroCartelera>("loQueSea");
  const [fase, setFase] = useState<FaseDelGiro>("reposo");
  const [giros, setGiros] = useState(0);
  const [finalistas, setFinalistas] = useState<TituloDeSala[]>([]);
  const [tirasDelGiro, setTirasDelGiro] = useState<TituloDeSala[][]>([]);
  const [elegido, setElegido] = useState<number | null>(null);
  const [ganador, setGanador] = useState<TituloDeSala | null>(null);
  const [numeroConteo, setNumeroConteo] = useState(3);
  const [mensajeVacio, setMensajeVacio] = useState("");
  const [filtroSenalado, setFiltroSenalado] = useState(false);
  const [selloVisible, setSelloVisible] = useState(false);
  const [errorVeto, setErrorVeto] = useState("");
  const [errorFuncion, setErrorFuncion] = useState("");
  const [siguienteDesbloqueado, setSiguienteDesbloqueado] = useState<
    string | null
  >(null);
  const [disponibilidad, setDisponibilidad] =
    useState<EstadoDisponibilidad | null>(null);
  const [instalacionAbierta, setInstalacionAbierta] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [nocheLocal, setNocheLocal] = useState<{
    corte: number;
    vetosGastados: number;
    vetados: Id<"titulos">[];
  } | null>(null);
  const [cajonAbierto, setCajonAbierto] = useState(false);
  const botonAbrir = useRef<HTMLButtonElement>(null);
  const botonCerrar = useRef<HTMLButtonElement>(null);
  const escenario = useRef<HTMLElement>(null);
  const palanca = useRef<HTMLButtonElement>(null);
  const tiras = useRef<Array<HTMLDivElement | null>>([]);
  const montado = useRef(false);
  const secuenciaGiro = useRef(0);
  const secuenciaDisponibilidad = useRef(0);
  const giroEnVuelo = useRef<{
    id: number;
    finalistas: readonly TituloDeSala[];
  } | null>(null);
  const esperas = useRef(new Map<number, () => void>());
  const pintados = useRef(new Map<number, () => void>());

  const estadoNoche = nocheLocalEsMasReciente(noche, nocheLocal)
    ? { ...noche, ...nocheLocal }
    : noche;
  const vetados = useMemo(
    () => new Set<string>(estadoNoche?.vetados ?? []),
    [estadoNoche?.vetados],
  );
  const cartelera = useMemo(
    () => derivarCartelera(titulos ?? [], { filtro, vetados }),
    [filtro, titulos, vetados],
  );
  const vetosDisponibles =
    VETOS_POR_NOCHE - (estadoNoche?.vetosGastados ?? 0);
  const titulosRef = useRef(titulos);
  const nocheRef = useRef(noche);
  const filtroRef = useRef(filtro);
  const vetadosRef = useRef<ReadonlySet<string>>(vetados);
  const idsQueSiguenCompitiendoRef = useRef<ReadonlySet<string>>(
    new Set(cartelera.candidatos.map(({ _id }) => _id)),
  );

  useEffect(() => {
    titulosRef.current = titulos;
    nocheRef.current = noche;
    filtroRef.current = filtro;
    vetadosRef.current = vetados;
    idsQueSiguenCompitiendoRef.current = new Set(
      cartelera.candidatos.map(({ _id }) => _id),
    );
  }, [cartelera.candidatos, filtro, noche, titulos, vetados]);

  useEffect(() => {
    const secuencia = secuenciaDisponibilidad.current + 1;
    secuenciaDisponibilidad.current = secuencia;
    if (fase !== "ganador" || !ganador) return;

    void buscarDisponibilidad({
      salaId,
      tituloId: ganador._id as Id<"titulos">,
    })
      .then((resultado) => {
        if (
          montado.current &&
          secuenciaDisponibilidad.current === secuencia
        ) {
          setDisponibilidad(resultado);
        }
      })
      .catch(() => {
        if (
          montado.current &&
          secuenciaDisponibilidad.current === secuencia
        ) {
          setDisponibilidad({ estado: "sin datos" });
        }
      });
  }, [buscarDisponibilidad, fase, ganador, salaId]);

  function esperar(ms: number): Promise<void> {
    return new Promise((resolver) => {
      const id = window.setTimeout(() => {
        esperas.current.delete(id);
        resolver();
      }, ms);
      esperas.current.set(id, resolver);
    });
  }

  function siguientePintado(): Promise<void> {
    return new Promise((resolver) => {
      const id = window.requestAnimationFrame(() => {
        pintados.current.delete(id);
        resolver();
      });
      pintados.current.set(id, resolver);
    });
  }

  useEffect(() => {
    montado.current = true;
    const esperasPendientes = esperas.current;
    const pintadosPendientes = pintados.current;
    return () => {
      montado.current = false;
      secuenciaGiro.current += 1;
      secuenciaDisponibilidad.current += 1;
      giroEnVuelo.current = null;
      for (const [id, resolver] of esperasPendientes) {
        window.clearTimeout(id);
        resolver();
      }
      esperasPendientes.clear();
      for (const [id, resolver] of pintadosPendientes) {
        window.cancelAnimationFrame(id);
        resolver();
      }
      pintadosPendientes.clear();
    };
  }, []);

  useEffect(() => {
    const ahora = Date.now();
    const temporizador = window.setTimeout(() => {
      const alCorte = Date.now();
      setNocheLocal((local) =>
        local && local.corte < nocheDe(alCorte) ? null : local,
      );
      setMomentoConsulta(alCorte);
    }, Math.max(0, proximoCorte(ahora) - ahora));
    return () => window.clearTimeout(temporizador);
  }, [momentoConsulta]);

  useEffect(() => {
    if (cajonAbierto) botonCerrar.current?.focus();
  }, [cajonAbierto]);

  useEffect(() => {
    if (fase === "vetando") escenario.current?.focus();
  }, [fase]);

  useEffect(() => {
    const luces = Array.from(document.querySelectorAll<HTMLElement>(".foco"));
    const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    luces.forEach((luz) => luz.classList.remove("on"));
    if (reducido) {
      luces.forEach((luz) => luz.classList.add("on"));
      return;
    }

    let paso = 0;
    const modo = fase === "ganador" ? "fiesta" : ocupado ? "girando" : "reposo";
    const intervalo = window.setInterval(
      () => {
        luces.forEach((luz, indice) => {
          const encendida =
            modo === "fiesta"
              ? paso % 2 === 0
              : (indice + paso) % (modo === "girando" ? 3 : 4) === 0;
          luz.classList.toggle("on", encendida);
        });
        paso += 1;
      },
      modo === "fiesta" ? 240 : modo === "girando" ? 110 : 620,
    );
    return () => window.clearInterval(intervalo);
  }, [fase, ocupado]);

  function cerrarCajon() {
    botonAbrir.current?.focus();
    setCajonAbierto(false);
  }

  function cambiarFiltro(nuevo: FiltroCartelera) {
    if (ocupado) return;
    setFiltro(nuevo);
    setFase("reposo");
    setFinalistas([]);
    setTirasDelGiro([]);
    setGanador(null);
    setElegido(null);
    setMensajeVacio("");
    setFiltroSenalado(false);
    setErrorVeto("");
    setErrorFuncion("");
    setDisponibilidad(null);
    setSiguienteDesbloqueado(null);
  }

  async function ejecutarGiro(
    candidatos: readonly TituloDeSala[],
    saltaPrimerActo: boolean,
    mensajeSiVacio: string,
  ) {
    const nocheActual = nocheRef.current;
    if (!nocheActual || !montado.current) return;
    const id = secuenciaGiro.current + 1;
    secuenciaGiro.current = id;
    const preparacion = prepararGiro(candidatos, saltaPrimerActo);
    const nuevosFinalistas = preparacion.finalistas;
    giroEnVuelo.current = {
      id,
      finalistas: nuevosFinalistas,
    };
    const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setOcupado(true);
    setErrorVeto("");
    setErrorFuncion("");
    setFiltroSenalado(false);
    setMensajeVacio("");
    setGanador(null);
    setElegido(null);
    setGiros((actuales) => actuales + 1);

    setFase("reposo");
    await esperar(reducido ? 20 : 520);
    if (!giroPuedeContinuar(id)) return;

    if (nocheActual.ajustes.conteo) {
      setFase("conteo");
      for (const numero of [3, 2, 1]) {
        setNumeroConteo(numero);
        await esperar(reducido ? 90 : 480);
        if (!giroPuedeContinuar(id)) return;
      }
    }

    if (candidatos.length === 0) {
      setFase("vuelta vacía");
      setMensajeVacio(mensajeSiVacio);
      setFiltroSenalado(true);
      setOcupado(false);
      giroEnVuelo.current = null;
      return;
    }

    setFinalistas(nuevosFinalistas);
    setTirasDelGiro(
      nuevosFinalistas.map((finalista) =>
        preparacion.primerActo ? tiraDe(candidatos, finalista) : [finalista],
      ),
    );
    setFase(preparacion.primerActo ? "girando" : "finalistas");
    await siguientePintado();
    if (!giroPuedeContinuar(id)) return;
    await esperar(reducido ? 20 : 380);
    if (!giroPuedeContinuar(id)) return;

    const base = RITMOS[nocheActual.ajustes.ritmo];
    if (preparacion.primerActo) {
      const paraJuntos = nocheActual.ajustes.paro === "tres";
      nuevosFinalistas.forEach((_, indice) => {
        const tira = tiras.current[indice];
        const alto = tira
          ?.querySelector<HTMLElement>(".celda")
          ?.getBoundingClientRect().height;
        if (!tira || !alto) return;
        const duracion = reducido
          ? 30
          : base + (paraJuntos ? 0 : indice * base * 0.45);
        tira.style.transition = `transform ${duracion}ms cubic-bezier(.12,.72,.16,1)`;
        tira.style.transform = `translateY(-${alto * 14}px)`;
      });

      await esperar(reducido ? 60 : base * (paraJuntos ? 1 : 1.9) + 260);
      if (!giroPuedeContinuar(id)) return;
      setFase("finalistas");
    }

    const ganadorIndice = elegirIndiceGanador(nuevosFinalistas.length);
    if (!reducido) {
      const saltos = 9 + ganadorIndice;
      for (let salto = 0; salto <= saltos; salto += 1) {
        setElegido(
          nuevosFinalistas.length === 1 && salto % 2 === 1
            ? null
            : salto % nuevosFinalistas.length,
        );
        const escalaDelRitmo = base / RITMOS.dramatico;
        await esperar((110 + salto * 42) * escalaDelRitmo);
        if (!giroPuedeContinuar(id)) return;
      }
    }
    setElegido(ganadorIndice);
    await esperar(reducido ? 40 : 700);
    if (!giroPuedeContinuar(id)) return;
    giroEnVuelo.current = null;
    setDisponibilidad({ estado: "buscando" });
    setGanador(nuevosFinalistas[ganadorIndice]);
    setFase("ganador");
    setOcupado(false);
  }

  function reiniciarGiroConCarteleraFresca() {
    const titulosActuales = titulosRef.current;
    const nocheActual = nocheRef.current;
    if (!montado.current || !titulosActuales || !nocheActual) {
      if (montado.current) setOcupado(false);
      return;
    }
    const filtroActual = filtroRef.current;
    const vetadosActuales = vetadosRef.current;
    const carteleraActual = derivarCartelera(titulosActuales, {
      filtro: filtroActual,
      vetados: vetadosActuales,
    });
    void ejecutarGiro(
      carteleraActual.candidatos,
      carteleraActual.saltaPrimerActo,
      mensajeDeVueltaVacia(
        titulosActuales,
        filtroActual,
        carteleraActual.cuentas,
        vetadosActuales,
      ),
    );
  }

  function giroPuedeContinuar(id: number): boolean {
    const giro = giroEnVuelo.current;
    if (!montado.current || secuenciaGiro.current !== id || giro?.id !== id) {
      return false;
    }
    if (
      decidirCambioDelGiro(giro, idsQueSiguenCompitiendoRef.current) ===
      "reiniciar"
    ) {
      secuenciaGiro.current += 1;
      giroEnVuelo.current = null;
      reiniciarGiroConCarteleraFresca();
      return false;
    }
    return true;
  }

  function girar() {
    if (!titulos || !noche || ocupado) return;
    void ejecutarGiro(
      cartelera.candidatos,
      cartelera.saltaPrimerActo,
      mensajeDeVueltaVacia(titulos, filtro, cartelera.cuentas, vetados),
    );
  }

  const vetoDesactivadoPorUnico = cartelera.candidatos.length <= 1;
  const razonVeto = vetoDesactivadoPorUnico
    ? "Con un solo título en la cartelera, el veto se apaga."
    : vetosDisponibles === 0
      ? "Ya gastaron los dos vetos de la noche."
      : "";

  async function vetarGanador() {
    if (
      !ganador ||
      !titulos ||
      !noche ||
      ocupado ||
      vetoDesactivadoPorUnico ||
      vetosDisponibles === 0
    ) {
      return;
    }

    secuenciaGiro.current += 1;
    giroEnVuelo.current = null;
    setOcupado(true);
    setFase("vetando");
    setErrorVeto("");
    try {
      const resultado = await vetarTitulo({
        salaId,
        tituloId: ganador._id as Id<"titulos">,
        filtro,
      });
      if (!montado.current) return;
      setNocheLocal(resultado);
      setSelloVisible(true);
      const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      await esperar(reducido ? 200 : 950);
      if (!montado.current) return;
      setSelloVisible(false);
      await esperar(reducido ? 20 : 600);
      if (!montado.current) return;

      const nuevosVetados = new Set<string>(resultado.vetados);
      const nuevaCartelera = derivarCartelera(titulos, {
        filtro,
        vetados: nuevosVetados,
      });
      setOcupado(false);
      await ejecutarGiro(
        nuevaCartelera.candidatos,
        nuevaCartelera.saltaPrimerActo,
        mensajeDeVueltaVacia(
          titulos,
          filtro,
          nuevaCartelera.cuentas,
          nuevosVetados,
        ),
      );
    } catch (error) {
      if (!montado.current) return;
      const detalle = error instanceof Error ? error.message : "";
      setErrorVeto(
        detalle.includes("un solo título")
          ? "Con un solo título en la cartelera, el veto se apaga."
          : detalle.includes("dos vetos")
            ? "Ya gastaron los dos vetos de la noche."
            : "El veto no pudo guardarse. La terna sigue en pie.",
      );
      setFase("ganador");
      setOcupado(false);
    }
  }

  async function elegirFuncion() {
    if (!ganador || ocupado) return;

    setOcupado(true);
    setErrorVeto("");
    setErrorFuncion("");
    try {
      const resultado = await cerrarFuncion({
        salaId,
        tituloId: ganador._id as Id<"titulos">,
      });
      if (!montado.current) return;

      setSiguienteDesbloqueado(resultado.siguiente);
      setFase("función");
      setOcupado(false);
      if (resultado.primeraFuncion && !appEstaInstalada()) {
        setInstalacionAbierta(true);
      }
    } catch {
      if (!montado.current) return;
      setErrorFuncion(
        "La función no pudo guardarse. La ganadora sigue en pie.",
      );
      setFase("ganador");
      setOcupado(false);
    }
  }

  const mostrandoCarretes =
    fase === "girando" || fase === "finalistas" || fase === "vetando";
  const chipsDisponibles = chipsDe(disponibilidad);
  const sinProveedoresEnMexico =
    disponibilidad?.estado === "datos" && chipsDisponibles.length === 0;

  return (
    <>
      <section
        ref={escenario}
        className={`escenario${fase !== "reposo" ? " abierto" : ""}`}
        aria-label="Ritual del giro"
        tabIndex={-1}
      >
        <div className="telon izq" aria-hidden="true" />
        <div className="telon der" aria-hidden="true" />
        <div className="pantalla">
          {fase === "reposo" && (
            <div className="reposo">
              <div className="cifra">
                {titulos === undefined ? "—" : cartelera.candidatos.length}
              </div>
              <p>títulos compitiendo</p>
            </div>
          )}

          {fase === "conteo" && (
            <div className="conteo" aria-hidden="true">
              <div className="aro" />
              <div className="cruz-h" />
              <div className="cruz-v" />
              <span key={numeroConteo}>{numeroConteo}</span>
            </div>
          )}

          {mostrandoCarretes && (
            <div className="carretes" aria-hidden="true">
              {finalistas.map((finalista, indice) => (
                <div
                  className={`carrete${elegido === indice ? " elegido" : ""}${
                    elegido !== null && elegido !== indice ? " descartado" : ""
                  }`}
                  key={`${giros}-${finalista._id}`}
                >
                  <div
                    className="tira"
                    ref={(elemento) => {
                      tiras.current[indice] = elemento;
                    }}
                  >
                    {tirasDelGiro[indice]?.map((titulo, vuelta) => (
                        <div className="celda" key={`${vuelta}-${titulo._id}`}>
                          <PosterCrudo titulo={titulo} />
                        </div>
                      ))}
                  </div>
                  <div className="vidrio" />
                </div>
              ))}
            </div>
          )}

          {fase === "ganador" && ganador && (
            <div className="ganador">
              <div className={`marco${ganador.posterPath ? "" : " punteado"}`}>
                {ganador.posterPath ? (
                  // eslint-disable-next-line @next/next/no-img-element -- Ticket 002 marca una zona gris: TMDB se sirve directo, sin el optimizador de Next.
                  <img
                    src={`https://image.tmdb.org/t/p/w342${ganador.posterPath}`}
                    alt=""
                    width={342}
                    height={513}
                    decoding="async"
                    loading="eager"
                  />
                ) : (
                  <PosterCrudo titulo={ganador} />
                )}
              </div>
              {!ganador.posterPath && (
                <p className="fuente sin-poster">sin póster oficial</p>
              )}
              <div className="ficha">
                {ganador.saga && (
                  <p className="saga">
                    {ganador.saga}
                    {ganador.orden !== undefined ? ` · ${ganador.orden}` : ""}
                  </p>
                )}
                <h2>{ganador.nombre}</h2>
                <p className="meta">
                  {ganador.tipo === "serie" ? "Serie" : "Película"}
                  {ganador.anio ? ` · ${ganador.anio}` : ""}
                </p>
                {chipsDisponibles.length > 0 && (
                  <>
                    <div className="servicios">
                      {chipsDisponibles.map(({ proveedor, prefijo }) => (
                        <span
                          className={`chip${prefijo ? " renta" : ""}`}
                          key={`${prefijo ?? "suscripción"}-${proveedor.nombre}`}
                        >
                          <i
                            className="punto"
                            style={{ background: colorDeProveedor(proveedor.nombre) }}
                          />
                          {prefijo ? `${prefijo} · ` : ""}
                          {proveedor.nombre}
                        </span>
                      ))}
                    </div>
                    <p className="fuente">Disponibilidad · JustWatch</p>
                  </>
                )}
                {disponibilidad?.estado === "buscando" && (
                  <p className="fuente">buscando disponibilidad…</p>
                )}
                {sinProveedoresEnMexico && (
                  <p className="fuente">sin disponibilidad en México</p>
                )}
                {(disponibilidad?.estado === "sin datos" ||
                  disponibilidad?.estado === "sin tmdb") && (
                  <p className="fuente">sin datos de disponibilidad</p>
                )}
              </div>
              <div className="acciones">
                <button
                  className="btn-ver"
                  type="button"
                  disabled={ocupado}
                  onClick={() => void elegirFuncion()}
                >
                  Esta vemos
                </button>
                <button
                  className="btn-veto"
                  type="button"
                  disabled={ocupado || Boolean(razonVeto)}
                  onClick={() => void vetarGanador()}
                >
                  Veto
                </button>
              </div>
              {(razonVeto || errorVeto || errorFuncion) && (
                <p
                  className={
                    errorVeto || errorFuncion
                      ? "razon-veto error"
                      : "razon-veto"
                  }
                >
                  {errorFuncion || errorVeto || razonVeto}
                </p>
              )}
            </div>
          )}

          {fase === "función" && ganador && (
            <div className="reposo funcion">
              <div className="cifra" aria-hidden="true">🍿</div>
              <p className="titulo-funcion">{ganador.nombre}</p>
              <p className="disfruten">disfruten la función</p>
              {siguienteDesbloqueado && (
                <p className="desbloqueo">
                  se desbloquea · {siguienteDesbloqueado}
                </p>
              )}
            </div>
          )}

          {fase === "vuelta vacía" && (
            <div className="reposo vuelta-vacia">
              <div className="cifra">↟</div>
              <p>{mensajeVacio}</p>
            </div>
          )}
          {/* La región vive siempre montada: un role="status" que aparece ya
              con texto adentro no siempre se anuncia. */}
          <p className="solo-lectores" role="status" aria-atomic="true">
            {fase === "ganador" && ganador
              ? `Ganó ${ganador.nombre}.`
              : fase === "función" && ganador
                ? `Eligieron ${ganador.nombre}.${
                    siguienteDesbloqueado
                      ? ` Se desbloquea ${siguienteDesbloqueado}.`
                      : ""
                  }`
              : fase === "vuelta vacía"
                ? mensajeVacio
                : ""}
          </p>
        </div>
        {selloVisible && (
          <div className="sello" aria-hidden="true">
            Vetada
          </div>
        )}
      </section>

      <div className="foso">
        <div className="filtros" role="group" aria-label="Qué puede girar">
          {FILTROS.map(({ valor, etiqueta }) => (
            <button
              className={`filtro${
                filtroSenalado && filtro === valor ? " senalada" : ""
              }`}
              type="button"
              key={valor}
              aria-pressed={filtro === valor}
              onClick={() => cambiarFiltro(valor)}
              disabled={ocupado}
            >
              {etiqueta} {titulos === undefined ? "—" : cartelera.cuentas[valor]}
            </button>
          ))}
        </div>
        {cartelera.anuncio && fase === "reposo" && (
          <p className="etiqueta-entrada">{cartelera.anuncio}</p>
        )}
        <button
          ref={palanca}
          className="btn-palanca"
          type="button"
          disabled={titulos === undefined || noche === undefined || ocupado}
          onClick={girar}
        >
          {/* No dice «otra noche»: la noche es la ventana de los vetos y va de
              cinco a cinco de la mañana, así que este botón no la empieza —
              el corte es el mismo y los vetos siguen gastados. Lo que hace es
              elegir qué ponen después de la que acaban de ver. */}
          {fase === "función"
            ? "Poner otra función"
            : giros
              ? "Girar otra vez"
              : "Comenzar la función"}
        </button>
        <div
          className={`panel-vetos${vetosDisponibles === 0 ? " agotado" : ""}`}
        >
          <span className="etiqueta">Vetos de la noche</span>
          <span
            className="fichas"
            title={`${vetosDisponibles} de ${VETOS_POR_NOCHE} disponibles`}
          >
            {Array.from({ length: VETOS_POR_NOCHE }, (_, indice) => (
              <i
                className={`ficha-veto${
                  indice < vetosDisponibles ? "" : " usada"
                }`}
                key={indice}
              />
            ))}
          </span>
        </div>
      </div>

      <div className="bitacora">
        <span>Estado <b>{fase}</b></span>
        <span>En cartelera <b>{titulos === undefined ? "—" : cartelera.candidatos.length}</b></span>
        <span>Giros <b>{giros}</b></span>
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

      <HojaInferior
        abierta={instalacionAbierta}
        etiqueta="Instalar la sala"
        devolverFocoA={palanca}
        onCerrar={() => setInstalacionAbierta(false)}
      >
        <div className="cartel-instalacion">
          <p className="etiqueta-entrada">Lleven la sala con ustedes</p>
          <p className="codigo-instalacion">{codigo}</p>
          <p>
            La app instalada pedirá este código una vez: no hereda lo que
            Safari guardó.
          </p>
          <p className="pasos-instalacion">
            Compartir <span aria-hidden="true">→</span> Añadir a pantalla de
            inicio
          </p>
          <button
            className="btn-palanca"
            type="button"
            onClick={() => setInstalacionAbierta(false)}
          >
            Cerrar
          </button>
        </div>
      </HojaInferior>
    </>
  );
}
