import * as THREE from "three";

export const col = (hex: string) => {
    const n = parseInt(hex.slice(1), 16);
    return new THREE.Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
  };

export const TERCIOPELO = { oscuro: col('#3c0c1a'), medio: col('#6b1a2e'), claro: col('#8e2438') };
export const LATON = col('#c9a227');
export const LATON_TENUE = col('#8a6f1c');
export const CREMA = col('#f2e5c6');

  /* Medidas de la sala, en unidades de escena. Ocho pósters dan la vuelta a
     cada tambor: el arco de enfrente enseña uno entero y los vecinos se
     curvan hacia la sombra, como el vidrio del carrete. */
export const CELDAS = 8;
export const POSTER_ALTO = 1.92;
export const POSTER_ANCHO = 1.28;
export const RADIO = (POSTER_ALTO * CELDAS) / (Math.PI * 2);
export const ALTO_VISTA = 6.0;
export const ANCHO_MINIMO = 4.6;
export const FOV = 34;
export const GANADOR_ALTO = 2.79;
export const GANADOR_CANTO = 0.13;
export const ALTO_MARCO_GANADOR = GANADOR_ALTO + 2 * GANADOR_CANTO;
// Borde superior de la pose histórica aprobada, delante de la cenefa.
export const TECHO_GANADOR = 0.62 + ALTO_MARCO_GANADOR * 0.80 / 2;
export const GANADOR_Z = 2.4;
export const TOPE = (3 * Math.PI) / 180;
  /* El telón recogido se come el 11 % del ancho por lado, así que el arco
     libre mide el 78 % del escenario. El trío se junta un 8 % y se achica un
     6 % —el margen que da el encargo— para que los rótulos de los pósters
     exteriores queden enteros dentro del arco; los cantos de esos pósters sí
     pasan por detrás de la tela, y eso lee como proscenio. */
export const SEPARACION = (POSTER_ANCHO + 0.16) * 0.92;
export const ESCALA_TAMBOR = 0.94;
