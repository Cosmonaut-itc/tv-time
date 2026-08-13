"use client";

import { useMutation } from "convex/react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { codigoTieneFormatoValido, normalizarCodigo } from "@/convex/codigo";
import { debeOlvidarCodigo } from "./entrada-sala-logica";
import LogoTmdb from "./logo-tmdb";
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

function guardar(clave: string, valor: string): void {
  try {
    window.localStorage.setItem(clave, valor);
  } catch {
    // Safari puede negar almacenamiento; la entrada actual sigue funcionando.
  }
}

function olvidar(clave: string): void {
  try {
    window.localStorage.removeItem(clave);
  } catch {
    // No hay nada más que limpiar si el navegador negó el almacenamiento.
  }
}

function butacaGuardadaDeEstaNoche(butacas: string[]): string | null {
  const guardada = leerGuardado(CLAVE_BUTACA);
  if (!guardada) return null;
  try {
    const valor = JSON.parse(guardada) as { butaca?: unknown; noche?: unknown };
    return typeof valor.butaca === "string" &&
      valor.noche === nocheDe(Date.now()) &&
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

  const abrir = useCallback(
    async (codigoPorProbar: string) => {
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
        const recordada = butacaGuardadaDeEstaNoche(resultado.butacas);
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
    [entrar],
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
    guardar(CLAVE_BUTACA, JSON.stringify({ butaca: nombre, noche: nocheDe(instante) }));
    setButaca(nombre);
    setFase("sala");
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
          onCambiarCuenta={setCuentaDeSala}
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
      {/* Los términos de TMDB piden las dos piezas juntas —el texto y el
          logo—, no una de las dos. Va en español porque esta sala se lee en
          español, y la frase dice exactamente lo que la cláusula exige que
          diga: que TMDB no respalda esto. */}
      <div className="fuente-tmdb">
        <LogoTmdb />
        <p>
          Este producto usa TMDB y sus API, pero TMDB no lo respalda, certifica ni aprueba.
        </p>
      </div>
    </main>
  );
}
