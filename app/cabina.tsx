"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useRef, useState, type RefObject } from "react";
import { limpiarNombreDeButaca } from "@/convex/taquilla_logica";
import { advertenciaTrasGuardarCodigo } from "./cabina-logica";
import HojaInferior from "./hoja-inferior";
import { nombreDeSala, type SalaDelLlavero } from "./llavero-logica";

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
  llavero,
  onCambiarDeSala,
  onRecordarSala,
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
  llavero: readonly SalaDelLlavero[];
  onCambiarDeSala: (codigo: string) => void;
  onRecordarSala: (sala: SalaDelLlavero) => boolean;
}) {
  const ajustes = useQuery(api.salas.ajustesDeSala, { salaId });
  const guardarAjustes = useMutation(api.salas.guardarAjustes);
  const rotarCodigo = useMutation(api.taquilla.rotarCodigo);
  const [confirmandoRotacion, setConfirmandoRotacion] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");
  const [advertenciaCodigo, setAdvertenciaCodigo] = useState<string | null>(null);
  const [salaNuevaAbierta, setSalaNuevaAbierta] = useState(false);
  const [pasoSalaNueva, setPasoSalaNueva] = useState<"formulario" | "codigo">("formulario");
  const [primeraButaca, setPrimeraButaca] = useState("");
  const [segundaButaca, setSegundaButaca] = useState("");
  const [errorSalaNueva, setErrorSalaNueva] = useState("");
  const [salaNueva, setSalaNueva] = useState<SalaDelLlavero | null>(null);
  const [salaNuevaEnLlavero, setSalaNuevaEnLlavero] = useState(true);
  const disparadorRotacion = useRef<HTMLButtonElement>(null);
  const disparadorSalaNueva = useRef<HTMLButtonElement>(null);
  const tituloSalaNueva = useRef<HTMLHeadingElement>(null);
  const crearSala = useMutation(api.taquilla.crearSala);

  // El paso cambia debajo del dedo y el foco se quedaría en un botón que ya no
  // está: quien no ve la pantalla se enteraría del código sólo por accidente.
  useEffect(() => {
    if (pasoSalaNueva === "codigo") tituloSalaNueva.current?.focus();
  }, [pasoSalaNueva]);

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

  function abrirSalaNueva() {
    setPasoSalaNueva("formulario");
    setPrimeraButaca("");
    setSegundaButaca("");
    setErrorSalaNueva("");
    setSalaNueva(null);
    setSalaNuevaEnLlavero(true);
    setSalaNuevaAbierta(true);
  }

  function cerrarSalaNueva() {
    setSalaNuevaAbierta(false);
  }

  async function crearLaSala() {
    // La misma limpieza que hace la mutación, para que el aparato no vea pasar
    // un nombre que el servidor va a rechazar sin poder explicar por qué.
    const primera = limpiarNombreDeButaca(primeraButaca);
    const segunda = limpiarNombreDeButaca(segundaButaca);
    if (!primera || !segunda) {
      setErrorSalaNueva("Escriban los dos nombres: una sala no se abre a medias.");
      return;
    }
    if (primera.toLocaleLowerCase("es") === segunda.toLocaleLowerCase("es")) {
      setErrorSalaNueva("Las dos butacas necesitan nombres distintos para tener dos voces.");
      return;
    }

    setOcupado(true);
    setErrorSalaNueva("");
    try {
      const creada = await crearSala({ salaId, codigoActual: codigo, butacas: [primera, segunda] });
      const nueva = { ...creada, titulos: 0 };
      setSalaNueva(nueva);
      setSalaNuevaEnLlavero(onRecordarSala(nueva));
      setPasoSalaNueva("codigo");
    } catch {
      setErrorSalaNueva("No pudimos abrir la sala nueva. Intenta de nuevo.");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <>
    <HojaInferior
      abierta={abierta && !salaNuevaAbierta}
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

        <section className="salas-cabina" aria-label="Otras salas">
          <p className="etiqueta-entrada">Otras salas</p>
          <div className="llavero">
            {llavero.map((otra) => {
              const actual = otra.salaId === salaId;
              return (
                <button className="boleto-llavero" type="button" key={otra.salaId}
                  aria-current={actual || undefined} disabled={actual}
                  onClick={() => {
                    onCambiarDeSala(otra.codigo);
                    onCerrar();
                  }}>
                  <span className="nombre">{nombreDeSala(otra.butacas)}</span>
                  <span className="cuenta">{otra.titulos ? `${otra.titulos} títulos` : "vacía"}</span>
                  <span className="clave">{otra.codigo}</span>
                </button>
              );
            })}
          </div>
          <button ref={disparadorSalaNueva} className="opcion laton" type="button"
            disabled={ocupado} onClick={abrirSalaNueva}>Abrir una sala nueva</button>
        </section>

        {error && <p className="razon-veto error">{error}</p>}
        <button className="salir-cabina" type="button" onClick={onSalir}>Salir de la sala</button>
      </div>
    </HojaInferior>
    <HojaInferior
      abierta={salaNuevaAbierta}
      etiqueta="Abrir una sala nueva"
      devolverFocoA={disparadorSalaNueva}
      className="sala-nueva"
      onCerrar={cerrarSalaNueva}
    >
      <div className="cabina-contenido">
        {pasoSalaNueva === "formulario" ? <>
          <p className="etiqueta-entrada">Detrás del código, nunca desde la taquilla</p>
          <h2>OTRA SALA</h2>
          <section>
            <p>Nace vacía y con su propio código. La sala donde estás no se toca.</p>
            <div className="campo">
              <label htmlFor="primera-butaca">Primera butaca</label>
              <input id="primera-butaca" type="text" maxLength={14} placeholder="Nombre" autoComplete="off"
                value={primeraButaca} onChange={(evento) => setPrimeraButaca(evento.target.value)} />
            </div>
            <div className="campo">
              <label htmlFor="segunda-butaca">Segunda butaca</label>
              <input id="segunda-butaca" type="text" maxLength={14} placeholder="Nombre" autoComplete="off"
                value={segundaButaca} onChange={(evento) => setSegundaButaca(evento.target.value)} />
            </div>
            {errorSalaNueva && <p className="error-sala-nueva" role="alert">{errorSalaNueva}</p>}
            <button className="opcion laton" type="button" disabled={ocupado} onClick={() => void crearLaSala()}>
              {ocupado ? "Abriendo…" : "Abrir la sala"}
            </button>
            <p className="aviso-cabina">Las butacas son voces, no permisos: cada título recuerda quién lo agregó.</p>
          </section>
        </> : salaNueva && <>
          <p className="etiqueta-entrada">La sala existe</p>
          <h2 ref={tituloSalaNueva} tabIndex={-1}>SU CÓDIGO</h2>
          <section className="codigo-cabina">
            <p className="etiqueta-entrada">Apúntenlo o mándenlo ahora</p>
            <strong>{salaNueva.codigo}</strong>
            <p>Es la única llave de la sala nueva. Nadie puede recuperarla por ustedes.</p>
            <button className="opcion" type="button"
              onClick={() => { void navigator.clipboard?.writeText(salaNueva.codigo).catch(() => {}); }}>
              Copiar el código
            </button>
          </section>
          <section>
            <p className="etiqueta-entrada">Butacas de la sala nueva</p>
            <p className="butacas-nuevas">{nombreDeSala(salaNueva.butacas)}</p>
          </section>
          <div className="puertas">
            <button className="opcion laton" type="button" onClick={() => {
              onCambiarDeSala(salaNueva.codigo);
              cerrarSalaNueva();
              onCerrar();
            }}>Entrar a la sala nueva</button>
            <button className="opcion" type="button" onClick={cerrarSalaNueva}>
              Quedarme con {nombreDeSala(butacas)}
            </button>
          </div>
          {salaNuevaEnLlavero ? (
            <p className="aviso-cabina">Quedarte aquí no la pierde: ya está en el llavero.</p>
          ) : (
            <p className="alerta-codigo-cabina" role="alert">
              Este aparato no pudo guardar el llavero, así que la sala nueva no queda
              anotada en ningún lado: copien el código antes de cerrar.
            </p>
          )}
        </>}
      </div>
    </HojaInferior>
    </>
  );
}
