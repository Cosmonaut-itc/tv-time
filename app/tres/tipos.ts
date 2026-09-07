/**
 * Contrato entre la sala en tres dimensiones (`app/tres/sala.ts`) y la
 * cartelera de React (`app/escenario-3d.tsx`, que la monta, y
 * `app/sala-cartelera.tsx`, que la manda). Es la misma frontera que tenía el
 * objeto `sala3D` del prototipo `prototypes/el-cine-3d.html`: la máquina de
 * fases vive en React y aquí sólo se obedece.
 */
import type { TituloDeSala } from "../cartelera";

/** Fases que entiende la sala 3D. `vuelta vacía` de la app entra como `reposo`. */
export type FaseDeLaSala3D =
  | "reposo"
  | "conteo"
  | "girando"
  | "finalistas"
  | "ganador"
  | "vetando"
  | "funcion";

/** Patrón de los focos de la marquesina; `todo` los deja encendidos. */
export type ModoDeFocos = "reposo" | "girando" | "fiesta" | "todo";

export type OpcionesDeSala3D = {
  /** Un solo contexto WebGL: cubre desde arriba del tablero hasta el pie del escenario. */
  lienzo: HTMLCanvasElement;
  /** El contenedor cuyo borde superior e izquierdo es el (0,0) del lienzo (`main.sala`). */
  tablero: HTMLElement;
  /** La `section.escenario`: su rect es la banda del escenario y recibe el arrastre del cartel. */
  escenario: HTMLElement;
  /** Los `.foco` del DOM en el orden en que se dibujan, para colocar los halos. */
  focos: () => HTMLElement[];
  /** Se avisa al perder el contexto WebGL: la sala ya se apagó sola y manda el CSS de hoy. */
  alPerderContexto: () => void;
};

export type Sala3D = {
  /** Abre o cierra el telón con la curva de 1.15 s, desde donde va. */
  telon(abierto: boolean): void;
  /** Esconde tambores, ganador y conteo. */
  reposo(): void;
  /** Número del conteo con su haz; `null` lo apaga. */
  conteo(numero: number | null): void;
  /**
   * Monta un tambor por finalista. `candidatos` es la cartelera elegible, de
   * donde salen los pósters de relleno. `quietos` = sin primer acto: el
   * finalista queda ya de frente.
   */
  montarTambores(
    finalistas: readonly TituloDeSala[],
    candidatos: readonly TituloDeSala[],
    quietos: boolean,
  ): void;
  /** Arranca el giro con el ritmo base en ms, paro uno por uno o juntos, y `corto` con movimiento reducido. */
  girarTambores(base: number, paroJuntos: boolean, corto: boolean): void;
  /** La luz del proyector se posa en el tambor `indice`; `null` en ninguno. */
  elegido(indice: number | null): void;
  /** El póster del finalista vuela de su tambor al marco. */
  ganador(titulo: TituloDeSala): void;
  /** Sello «Vetada» sobre el cartel. */
  sello(visible: boolean): void;
  /** Como `reposo`, sin tocar el telón. */
  limpiar(): void;
  /** Un paso del patrón de focos; se llama desde el reloj de la app. */
  focos(paso: number, modo: ModoDeFocos): void;
  setFase(fase: FaseDeLaSala3D): void;
  /** Enciende (mide y pinta) o apaga (0 cuadros) la sala. */
  encender(encendida: boolean): void;
  /** Pide permiso de giroscopio; sólo tras un gesto del usuario. */
  pedirGiroscopio(): Promise<void>;
  /** Vuelve a medir el lienzo, la banda y los focos. */
  medir(): void;
  /** Quita listeners y observadores, libera geometrías, materiales, texturas y el contexto. */
  destruir(): void;
};
