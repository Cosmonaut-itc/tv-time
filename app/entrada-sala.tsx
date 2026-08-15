"use client";

import { useMutation } from "convex/react";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { codigoTieneFormatoValido, normalizarCodigo } from "@/convex/codigo";
import { debeOlvidarCodigo } from "./entrada-sala-logica";
import {
  CLAVE_LLAVERO,
  leerLlavero,
  nombreDeSala,
  olvidarSala,
  recordarSala,
  type SalaDelLlavero,
} from "./llavero-logica";
import LogoTmdb from "./logo-tmdb";
import MascotaClaude from "./mascota-claude";
import { nocheDe } from "./noche";
import SalaCartelera, { type CuentaDeSala } from "./sala-cartelera";

const CLAVE_CODIGO = "cine.codigo";
const CLAVE_BUTACA = "cine.butaca";

type SalaAbierta = { salaId: Id<"salas">; codigo: string; butacas: string[] };
type Fase = "cargando" | "taquilla" | "butaca" | "sala";

function leerGuardado(clave: string): string | null {
  try {
    return window.localStorage.getItem(clave);
  } catch {
    return null;
  }
}

function guardar(clave: string, valor: string): boolean {
  try {
    window.localStorage.setItem(clave, valor);
    return true;
  } catch {
    // Safari puede negar almacenamiento; la entrada actual sigue funcionando.
    return false;
  }
}

function olvidar(clave: string): void {
  try {
    window.localStorage.removeItem(clave);
  } catch {
    // No hay nada más que limpiar si el navegador negó el almacenamiento.
  }
}

function butacaGuardadaDeEstaNoche(salaId: Id<"salas">, butacas: string[]): string | null {
  const guardada = leerGuardado(CLAVE_BUTACA);
  if (!guardada) return null;
  try {
    const valor = JSON.parse(guardada) as { butaca?: unknown; noche?: unknown; salaId?: unknown };
    return typeof valor.butaca === "string" &&
      valor.noche === nocheDe(Date.now()) &&
      valor.salaId === salaId &&
      butacas.includes(valor.butaca)
      ? valor.butaca
      : null;
  } catch {
    return null;
  }
}

export default function EntradaSala({ codigoCompartido }: { codigoCompartido?: string }) {
  const entrar = useMutation(api.taquilla.entrar);
  const [fase, setFase] = useState<Fase>("cargando");
  const [codigo, setCodigo] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [sala, setSala] = useState<SalaAbierta | null>(null);
  const [butaca, setButaca] = useState<string | null>(null);
  const [cuentaDeSala, setCuentaDeSala] = useState<CuentaDeSala | null>(null);
  const [llavero, setLlavero] = useState<SalaDelLlavero[]>(() =>
    typeof window === "undefined" ? [] : leerLlavero(leerGuardado(CLAVE_LLAVERO)),
  );
  // El llavero se escribe en el navegador, y escribir es un efecto: hacerlo
  // dentro del updater de `setLlavero` lo repetiría en cada render de prueba de
  // React. La copia viva vive aquí y el guardado devuelve si de verdad ocurrió.
  const llaveroVigente = useRef(llavero);

  const actualizarLlavero = useCallback(
    (cambio: (actual: SalaDelLlavero[]) => SalaDelLlavero[]): boolean => {
      const actualizado = cambio(llaveroVigente.current);
      llaveroVigente.current = actualizado;
      setLlavero(actualizado);
      return guardar(CLAVE_LLAVERO, JSON.stringify(actualizado));
    },
    [],
  );

  const abrir = useCallback(
    async (codigoPorProbar: string, veniaDelLlavero = false) => {
      const normalizado = normalizarCodigo(codigoPorProbar);
      setCodigo(normalizado);
      if (!codigoTieneFormatoValido(normalizado)) {
        setFase("taquilla");
        setMensaje("Escribe los 6 caracteres del código.");
        return;
      }

      setEnviando(true);
      setMensaje("");
      try {
        const resultado = await entrar({ codigo: normalizado });
        if (resultado.estado !== "abierta") {
          if (debeOlvidarCodigo(resultado.estado)) olvidar(CLAVE_CODIGO);
          if (veniaDelLlavero) {
            actualizarLlavero((actual) => {
              const recordada = actual.find((otra) => otra.codigo === normalizado);
              return recordada ? olvidarSala(actual, recordada.salaId) : actual;
            });
          }
          setFase("taquilla");
          setMensaje(resultado.mensaje);
          return;
        }

        guardar(CLAVE_CODIGO, resultado.codigo);
        const abierta = {
          salaId: resultado.salaId,
          codigo: resultado.codigo,
          butacas: resultado.butacas,
        };
        const recordada = butacaGuardadaDeEstaNoche(resultado.salaId, resultado.butacas);
        actualizarLlavero((actual) => recordarSala(actual, {
          salaId: resultado.salaId,
          codigo: resultado.codigo,
          butacas: resultado.butacas,
          titulos: actual.find((otra) => otra.salaId === resultado.salaId)?.titulos ?? 0,
        }));
        setSala(abierta);
        setButaca(recordada);
        setFase(recordada ? "sala" : "butaca");
      } catch {
        setFase("taquilla");
        setMensaje("La taquilla no pudo responder. Intenta otra vez.");
      } finally {
        setEnviando(false);
      }
    },
    [actualizarLlavero, entrar],
  );

  useEffect(() => {
    const compartido = codigoCompartido ? normalizarCodigo(codigoCompartido) : null;
    if (compartido) {
      guardar(CLAVE_CODIGO, compartido);
      window.history.replaceState(null, "", "/");
    }

    const recordado = compartido ?? leerGuardado(CLAVE_CODIGO);
    // El diferido deja que el cleanup de StrictMode cancele la primera pasada;
    // así una sola carga de desarrollo no consume dos intentos del freno.
    const inicio = window.setTimeout(() => {
      if (recordado) void abrir(recordado);
      else setFase("taquilla");
    }, 0);
    return () => window.clearTimeout(inicio);
  }, [abrir, codigoCompartido]);

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    void abrir(codigo);
  }

  function elegirButaca(nombre: string) {
    // Es el instante del toque; no participa en el resultado del render.
    // eslint-disable-next-line react-hooks/purity
    const instante = Date.now();
    if (!sala) return;
    guardar(CLAVE_BUTACA, JSON.stringify({ butaca: nombre, noche: nocheDe(instante), salaId: sala.salaId }));
    setButaca(nombre);
    setFase("sala");
  }

  function cambiarCodigo(nuevoCodigo: string): boolean {
    const guardado = guardar(CLAVE_CODIGO, nuevoCodigo);
    if (sala) {
      actualizarLlavero((llaveroActual) => recordarSala(llaveroActual, {
        ...sala,
        codigo: nuevoCodigo,
        titulos: llaveroActual.find((otra) => otra.salaId === sala.salaId)?.titulos ?? 0,
      }));
    }
    setSala((actual) => actual ? { ...actual, codigo: nuevoCodigo } : actual);
    return guardado;
  }

  const cambiarCuentaDeSala = useCallback((cuenta: CuentaDeSala | null) => {
    setCuentaDeSala(cuenta);
    if (!sala || !cuenta) return;
    actualizarLlavero((actual) => recordarSala(actual, {
      ...sala,
      titulos: cuenta.titulos,
    }));
  }, [actualizarLlavero, sala]);

  function cambiarDeSala(codigoDeSala: string) {
    olvidar(CLAVE_BUTACA);
    setButaca(null);
    setCuentaDeSala(null);
    setFase("cargando");
    void abrir(codigoDeSala, true);
  }

  // La única sala que se guarda sin entrar en ella: por eso hay que decirle al
  // llavero cuál es la sala puesta, para que la poda no se lleve justo esa.
  function recordarSalaNueva(salaNueva: SalaDelLlavero): boolean {
    return actualizarLlavero((actual) => recordarSala(actual, salaNueva, sala?.salaId));
  }

  function salirDeLaSala() {
    olvidar(CLAVE_CODIGO);
    olvidar(CLAVE_BUTACA);
    if (sala) actualizarLlavero((actual) => olvidarSala(actual, sala.salaId));
    setSala(null);
    setButaca(null);
    setCuentaDeSala(null);
    setCodigo("");
    setMensaje("");
    setFase("taquilla");
  }

  return (
    <main className="sala">
      <header className="marquesina">
        <div className="focos" aria-hidden="true">
          {Array.from({ length: 13 }, (_, indice) => <i className="foco on" key={indice} />)}
        </div>
        <div className="rotulo">
          <h1>EL CINE</h1>
          <span className="abanico" aria-hidden="true" />
          <p className="fecha">
            {fase === "sala" && cuentaDeSala ? (
              <>
                <b>{cuentaDeSala.titulos}</b> {cuentaDeSala.titulos === 1 ? "título" : "títulos"} ·{" "}
                <b>{cuentaDeSala.enCartelera}</b> en cartelera ·{" "}
                {cuentaDeSala.vistas === 1 ? "1 vista" : `${cuentaDeSala.vistas} vistas`}
              </>
            ) : "función privada"}
          </p>
        </div>
        <div className="focos" aria-hidden="true">
          {Array.from({ length: 13 }, (_, indice) => <i className="foco" key={indice} />)}
        </div>
      </header>

      {fase === "sala" && sala && butaca ? (
        <SalaCartelera
          salaId={sala.salaId}
          codigo={sala.codigo}
          butaca={butaca}
          butacas={sala.butacas}
          onCambiarButaca={elegirButaca}
          onCambiarCuenta={cambiarCuentaDeSala}
          onCambiarCodigo={cambiarCodigo}
          onSalir={salirDeLaSala}
          llavero={llavero}
          onCambiarDeSala={cambiarDeSala}
          onRecordarSala={recordarSalaNueva}
        />
      ) : <section className="entrada" aria-live="polite">
        {fase === "cargando" && <p className="estado-entrada">Abriendo la taquilla…</p>}

        {fase === "taquilla" && (
          <form className="boleto" onSubmit={enviar}>
            <p className="etiqueta-entrada">Código de la sala</p>
            <label className="solo-lectores" htmlFor="codigo">Código de 6 caracteres</label>
            <input
              id="codigo"
              className="codigo"
              value={codigo}
              onChange={(evento) => setCodigo(normalizarCodigo(evento.target.value).slice(0, 6))}
              autoCapitalize="characters"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              inputMode="text"
              maxLength={6}
              placeholder="T4K9RM"
              aria-describedby={mensaje ? "mensaje-taquilla" : undefined}
              autoFocus
            />
            <button className="btn-entrar" disabled={enviando || codigo.length !== 6}>
              {enviando ? "Buscando…" : "Entrar a la sala"}
            </button>
            {mensaje && <p className="mensaje-taquilla" id="mensaje-taquilla">{mensaje}</p>}
          </form>
        )}

        {/* La taquilla es una sola puerta con una sola pregunta, pero quien ya
            estuvo adentro no debería tener que acordarse del código: el llavero
            del aparato también se enseña aquí, no sólo dentro de la cabina. */}
        {fase === "taquilla" && llavero.length > 0 && (
          <section className="llavero-taquilla" aria-label="Salas de este aparato">
            <p className="etiqueta-entrada">Salas de este aparato</p>
            <div className="llavero">
              {llavero.map((recordada) => (
                <button className="boleto-llavero" type="button" key={recordada.salaId}
                  disabled={enviando} onClick={() => cambiarDeSala(recordada.codigo)}>
                  <span className="nombre">{nombreDeSala(recordada.butacas)}</span>
                  <span className="cuenta">{recordada.titulos ? `${recordada.titulos} títulos` : "vacía"}</span>
                  <span className="clave">{recordada.codigo}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {fase === "butaca" && sala && (
          <div className="puerta-butaca">
            <p className="etiqueta-entrada">¿Quién abre la noche?</p>
            <h2>ELIGE TU BUTACA</h2>
            <div className="butacas">
              {sala.butacas.map((nombre) => (
                <button className="butaca" key={nombre} onClick={() => elegirButaca(nombre)}>
                  <span aria-hidden="true">●</span>
                  {nombre}
                </button>
              ))}
            </div>
          </div>
        )}

      </section>}
      {/* Dentro de la sala el pie es la firma de la casa; la atribución de TMDB
          se queda en la taquilla, que es donde el dueño la quiso. Las dos piezas
          de TMDB —texto y logo— siguen viajando juntas, porque la cláusula pide
          las dos y no una: la frase dice exactamente que TMDB no respalda esto. */}
      {fase === "sala" ? (
        <div className="firma-casa">
          <p>
            Hecho con amor por Félix y Claude
            <MascotaClaude />
          </p>
        </div>
      ) : (
        <div className="fuente-tmdb">
          <LogoTmdb />
          <p>
            Este producto usa TMDB y sus API, pero TMDB no lo respalda, certifica ni aprueba.
          </p>
        </div>
      )}
    </main>
  );
}
