import * as THREE from "three";
import { destruirGrupo } from "./recursos.ts";
import { ALTO_VISTA, ANCHO_MINIMO, FOV, TOPE, TERCIOPELO, LATON, LATON_TENUE, CREMA } from "./medidas.ts";
import { CURVA_TELON } from "./curvas.ts";

  function envolventeTelon(proporcion: number, distancia: number, zMin: number, zMax: number) {
    const normalizar = (v: number[]) => { const l = Math.hypot(...v); return v.map((n) => n / l); };
    const cruz = (a: number[], b: number[]) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    const tangente = Math.tan(FOV * Math.PI / 360);
    let x = 0, y = 0;
    for (const ax of [-TOPE, 0, TOPE]) for (const ay of [-TOPE, 0, TOPE]) {
      const c = [Math.sin(ax) * distancia, Math.sin(ay) * distancia, Math.cos(ax) * Math.cos(ay) * distancia];
      const n = normalizar(c), derecha = normalizar(cruz([0, 1, 0], n)), arriba = cruz(n, derecha);
      for (const z of [zMin, zMax]) for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
        const r = n.map((v, i) => -v + tangente * (sx * proporcion * derecha[i] + sy * arriba[i]));
        const t = (z - c[2]) / r[2];
        x = Math.max(x, Math.abs(c[0] + t * r[0]));
        y = Math.max(y, Math.abs(c[1] + t * r[1]));
      }
    }
    return { x, y };
  }

export function crearTelon(grupo: THREE.Group) {
    /* Medidas de referencia: sólo crecen si la caja pide más cobertura.
       El ancho cerrado se deriva del borde para conservar 0.10 de cruce. */
    const ANCHO = 2.41, ALTO = 5.4, Z = 1.6;
    const CENEFA_ANCHO = 4.9, CENEFA_ALTO = 1.3;
    const BORDE = 2.36, H_ALZA = 0.48;
    const ALTO_IPHONE = Math.max(ALTO_VISTA, ANCHO_MINIMO / (366 / 490));
    const DISTANCIA_IPHONE = ALTO_IPHONE / 2 / Math.tan(FOV * Math.PI / 360);
    const MEDIO_ALTO_IPHONE = ALTO_IPHONE / 2 * (DISTANCIA_IPHONE - Z) / DISTANCIA_IPHONE;
    let Y_ALZA = 0;
    /* 0.105 y no 0.11: medido sobre el píxel, la cintura de 0.11 dejaba el
       hueco en el 77.7 % y el encargo pide ≥ 78 %. Este medio punto lo pone
       en el 79 % con margen, y a ojo es la misma cintura. */
    const F_CINTURA = 0.105;         // la cintura del paño, en fracción de W
    const PLIEGUES = 11;

    const uniformes = {
      recogida: { value: 0 },
      /* Medio ancho del escenario que se ve en el plano del paño. Lo pone
         `encuadrar` desde `medir`: la silueta está escrita en fracciones del
         ancho del escenario W, así que el módulo necesita saber cuánto se ve
         para que la cintura mida 0.11·W y el hueco quede en el 78 % de W. */
      encuadre: { value: 1.95 },
      borde: { value: BORDE },
      ancho: { value: ANCHO },
      medioAlto: { value: ALTO / 2 },
      suelo: { value: -MEDIO_ALTO_IPHONE },
      cenefa: { value: 1.701 },
    };

    const vertice = `
      uniform float uRecogida;
      uniform float uLado;
      uniform float uPliegues;
      uniform float uAncho;
      uniform float uEncuadre;
      uniform float uBorde;
      uniform float uMedioAlto;
      uniform float uSuelo;
      uniform float uCenefa;
      varying vec2 vUv;
      varying vec3 vV;
      varying vec3 vBx;
      varying vec3 vBz;
      varying float vS;
      varying float vGrad;
      varying float vPaso;
      varying float vH;

      const float H_ALZA = 0.48;
      const float F_ARRIBA = 0.30;
      const float F_CINTURA = 0.105;
      const float F_SUELO = 0.16;

      /* ── La silueta del paño recogido ────────────────────────────────
         Devuelve el ancho VISIBLE del paño en fracción del ancho del
         escenario W, contado desde el canto exterior del escenario, para una
         altura h del hueco (h = 1 bajo la cenefa, h = 0 en el suelo):

           h = 1        0.30·W   la tela sube ancha hasta el fruncido
           h = H_ALZA   0.11·W   la CINTURA que ciñe el alzapaño; el hueco
                                 entre los dos paños queda en el 78 % de W
           h = 0        0.16·W   el ABANICO del dobladillo, asentado al suelo

         Arriba de la cintura el borde interior dibuja el SWAG: casi una
         diagonal, con la potencia 1.45 que la hace salir plana de la cintura
         —ahí la tela está estrangulada— y abrirse de golpe al llegar a la
         cenefa. Es la curva medida sobre la referencia: a media altura del
         swag el borde ha recorrido el 37 % del camino, no el 50 %.

         Abajo la tela vuelve a abrirse en ABANICO, casi recto y con un punto
         de vuelo al final (el 0.80/0.20), que es como cae el dobladillo.

         El hueco resultante es un arco: cerrado arriba —donde la cenefa tapa
         de todos modos—, máximo a la altura del alzapaño y algo más cerrado
         en el suelo. */
      float silueta(float h) {
        float a = clamp((h - H_ALZA) / (1.0 - H_ALZA), 0.0, 1.0);
        float b = clamp((H_ALZA - h) / H_ALZA, 0.0, 1.0);
        float swag = mix(F_CINTURA, F_ARRIBA, pow(a, 1.45));
        float abanico = mix(F_CINTURA, F_SUELO, b * (0.80 + 0.20 * b));
        return h >= H_ALZA ? swag : abanico;
      }

      void main() {
        vUv = uv;
        vec3 p = position;
        /* «s» corre por la tela: 0 en el borde exterior, 1 en el interior.
           Silueta y pliegues se escriben en «s», que es coordenada material:
           así los pliegues viajan con el paño y se aprietan cuando se recoge,
           en vez de deslizarse por debajo de la tela. */
        float s = uLado < 0.0 ? uv.x : 1.0 - uv.x;
        vS = s;
        p.y = (uv.y - 0.5) * 2.0 * uMedioAlto;
        float h = clamp((p.y - uSuelo) / (uCenefa - uSuelo), 0.0, 1.0);

        /* Ancho del paño a esta altura. Cerrado es la cortina recta de
           siempre (uAncho); abierto, la silueta. «sobra» es lo que la tela
           se sale del canto del escenario: se suma para que lo VISIBLE mida
           exactamente lo que pide la silueta. Un solo «mix»: ni salto ni
           cambio de topología entre los dos estados. */
        float W = 2.0 * uEncuadre;
        float sobra = max(uBorde - uEncuadre, 0.0);
        float w = mix(uAncho, silueta(h) * W + sobra, uRecogida);
        p.x = uLado * (uBorde - s * w);

        /* Los pliegues, con la amplitud atada al apretón: el paño recogido
           está seis veces más junto y sus pliegues son más hondos. Tope
           0.168 de onda + 0.030 de barriga = z 1.798, que respeta el margen
           contra la cenefa (1.848 en su valle más adelantado). */
        float aprieto = clamp(uAncho / max(w, 0.15), 1.0, 4.2);
        float fase = s * uPliegues * 6.2831853;
        float amp = min(0.052 * (0.30 + 0.70 * aprieto), 0.168);
        p.z += sin(fase) * amp + 0.030 * uRecogida * sin(3.14159265 * s);
        vH = h;                       // el fragmento la usa para el fruncido de la cintura

        /* La cresta se ilumina por píxel, no por vértice: al fragmento le
           bastan la pendiente de la onda («vGrad»), el paso del pliegue
           («vPaso», para saber cuánta cresta cabe) y la base de la normal
           llevada a vista. */
        /* Con tope: el paño recogido aprieta tanto el pliegue que sin él la
           cresta se pone de canto (84°) y la tela se lee como lámina
           acanalada en vez de terciopelo. */
        vGrad = min(amp * uPliegues * 6.2831853 / max(w, 0.15), 3.2);
        vPaso = w / uPliegues;
        vBx = normalMatrix * vec3(uLado, 0.0, 0.0);
        vBz = normalMatrix * vec3(0.0, 0.0, 1.0);

        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vV = -mv.xyz;
        gl_Position = projectionMatrix * mv;
      }`;

    const cabecera = `
      uniform vec3 uOscuro;
      uniform vec3 uMedio;
      uniform vec3 uClaro;
      uniform float uLado;
      uniform float uRecogida;
      uniform float uPliegues;
      uniform float uAncho;
      varying vec2 vUv;
      varying vec3 vV;
      varying vec3 vBx;
      varying vec3 vBz;
      varying float vS;
      varying float vGrad;
      varying float vPaso;
      varying float vH;
      `;

    /* El terciopelo, común a paños y cenefa: crestas claras, valles hondos y
       un satén estrecho encima. Más contraste que la tira lisa de antes —la
       referencia enseña la tela acanalada— sin salirse del vino de la casa. */
    const tela = `
      vec3 terciopelo(out float f, out float ndv) {
        float fase = vS * uPliegues * 6.2831853;
        /* Familias de pliegues: la tela no se frunce con regla. Una onda
           lenta encima de la del pliegue hace que unas crestas salgan más
           que otras, que es lo que separa el terciopelo del peine. */
        float familia = 0.70 + 0.30 * sin(vS * 5.3 + 1.7);
        f = sin(fase) * 0.5 + 0.5;
        vec3 n = normalize(vBx * (cos(fase) * vGrad * familia) + vBz);
        ndv = clamp(dot(n, normalize(vV)), 0.0, 1.0);
        /* La sala alumbra desde delante y un poco por la izquierda alta: el
           claro no cae en la cresta sino en su ladera, y por eso la tela
           parece tela. Luz fija en espacio de vista, como el latón. */
        float ndl = clamp(dot(n, normalize(vec3(-0.36, 0.34, 0.87))), 0.0, 1.0);
        float g = pow(clamp(0.32 * f + 0.74 * ndl, 0.0, 1.0), 1.30);
        vec3 c = mix(uOscuro * 0.62, uMedio, smoothstep(0.02, 0.60, g));
        c = mix(c, uClaro, smoothstep(0.64, 1.0, g));
        /* El pelo del terciopelo se oscurece al sesgo, no se aclara. */
        c *= mix(1.0, 0.72, pow(1.0 - ndv, 2.6));
        /* El satén se ensancha cuando el paso del pliegue se estrecha: el
           terciopelo apretado no resuelve una cresta de un píxel y, de paso,
           así el brillo no titila al girar el aparato. */
        float finura = smoothstep(0.045, 0.17, vPaso);
        c += vec3(1.0, 0.90, 0.82) * pow(ndl, mix(10.0, 30.0, finura)) * (0.12 + 0.26 * ndv) * familia;
        return c;
      }`;

    const fragmento = cabecera + tela + `
      const float H_ALZA = 0.48;
      void main() {
        float f, ndv;
        vec3 c = terciopelo(f, ndv) * 0.86;
        /* Cuanto más apretado el paño, más honda la sombra entre pliegues. */
        float aprieto = clamp(uAncho / max(vPaso * uPliegues, 0.15), 1.0, 4.2);
        c *= mix(1.0, 0.84, clamp((aprieto - 1.0) / 3.2, 0.0, 1.0));
        /* El apretón de la cuerda, resuelto en el fragmento y no en la
           geometría: el paño ya está contra su tope de onda (0.168) y un
           milímetro más de pliegue se comería el margen contra la cenefa.
           Dos cosas en una banda estrecha alrededor de la cintura: el valle
           se hunde y la cresta se aviva —eso es el fruncido— y, medio dedo
           por debajo, la sombra que la cuerda tira sobre la tela. Sólo con
           el telón recogido, que es cuando hay alzapaño. */
        float dCintura = vH - H_ALZA;
        float banda = exp(-dCintura * dCintura * 170.0) * uRecogida;
        c *= mix(1.0, 0.55 + 0.70 * f * f, banda * 0.80);
        float bajo = clamp(-dCintura / 0.085, 0.0, 1.0);
        c *= mix(1.0, 0.60, exp(-dCintura * dCintura * 240.0) * uRecogida * (0.35 + 0.65 * bajo));
        c *= mix(0.38, 1.0, (1.0 - smoothstep(0.86, 1.0, vUv.y)));   // la sombra de la cenefa
        c *= mix(1.0, 0.62, (1.0 - smoothstep(0.0, 0.22, vUv.y)));   // sombras al foso
        /* Cerrado, el borde interior es la costura del centro y se hunde;
           recogido es el filo libre del swag y recoge luz. */
        c *= mix(1.0, 0.40, smoothstep(0.90, 1.0, vS) * (1.0 - 0.62 * uRecogida));
        c += uClaro * smoothstep(0.962, 1.0, vS) * uRecogida * 0.30;
        gl_FragColor = vec4(c, 1.0);
      }`;

    [-1, 1].forEach((lado) => {
      const malla = new THREE.Mesh(
        new THREE.PlaneGeometry(ANCHO, ALTO, 96, 128),
        new THREE.ShaderMaterial({
          uniforms: {
            uRecogida: uniformes.recogida,
            uEncuadre: uniformes.encuadre,
            uLado: { value: lado },
            uPliegues: { value: PLIEGUES },
            uAncho: uniformes.ancho,
            uBorde: uniformes.borde,
            uMedioAlto: uniformes.medioAlto,
            uSuelo: uniformes.suelo,
            uCenefa: uniformes.cenefa,
            uOscuro: { value: TERCIOPELO.oscuro },
            uMedio: { value: TERCIOPELO.medio },
            uClaro: { value: TERCIOPELO.claro },
          },
          vertexShader: vertice,
          fragmentShader: fragmento,
          side: THREE.DoubleSide,
        }),
      );
      malla.position.set(0, 0, Z);
      // La envolvente del shader supera la caja de la geometría base.
      malla.frustumCulled = false;
      grupo.add(malla);
    });

    /* Cenefa: la misma tela, con el fruncido más denso (22 pliegues sobre
       4.9 en vez de 16 sobre 4.6), el borde recortado en nueve festones más
       profundos y regulares, y un ribete de latón cosido al canto. */
    const cenefa = new THREE.Mesh(
      new THREE.PlaneGeometry(CENEFA_ANCHO, CENEFA_ALTO, 128, 2),
      new THREE.ShaderMaterial({
        uniforms: {
          uRecogida: { value: 0 },
          uEncuadre: uniformes.encuadre,
          uLado: { value: -1 },
          uPliegues: { value: 22 },
          uAncho: { value: CENEFA_ANCHO },
          uBorde: { value: CENEFA_ANCHO / 2 },
          uMedioAlto: { value: CENEFA_ALTO / 2 },
          uSuelo: uniformes.suelo,
          uCenefa: uniformes.cenefa,
          uOscuro: { value: TERCIOPELO.oscuro },
          uMedio: { value: TERCIOPELO.medio },
          uClaro: { value: TERCIOPELO.claro },
          uLaton: { value: LATON },
        },
        vertexShader: vertice,
        fragmentShader: cabecera + `uniform vec3 uLaton;` + tela + `
          void main() {
            float feston = 0.54 - 0.44 * pow(abs(sin(vUv.x * 3.14159265 * 9.0)), 0.60);
            float d = vUv.y - feston;
            if (d < 0.0) discard;
            float f, ndv;
            vec3 c = terciopelo(f, ndv) * 0.90;
            c *= mix(0.58, 1.0, smoothstep(0.0, 0.20, d));   // el canto del festón, a sombra
            float ribete = 1.0 - smoothstep(0.005, 0.022, d);
            c = mix(c, uLaton * (0.50 + 0.90 * pow(f, 1.6)), ribete * 0.92);
            gl_FragColor = vec4(c, 1.0);
          }`,
        side: THREE.DoubleSide,
      }),
    );
    /* Z mínimo 1.848 > 1.798 de los paños; el faldón más hondo conserva la
       cobertura al adelantarlo, incluso con el parallax de ±3°. */
    cenefa.position.set(0, 2.1, 1.9);
    cenefa.frustumCulled = false;
    grupo.add(cenefa);

    /* ── Alzapaño ──────────────────────────────────────────────────────
       La cuerda dorada que CIÑE cada paño por la cintura, con su borla. No
       es un aro pegado delante de la tela: la curva tiene fondo. El tramo
       frontal pasa por z 1.855 —delante de la cresta más alta del paño,
       1.798— y los dos extremos se hunden hasta 1.375, detrás del valle más
       hondo (1.432), así que la prueba de profundidad esconde media vuelta
       DETRÁS del paño y la cuerda se lee rodeándolo. Aparece en el último
       30 % de la apertura —opacidad y escala— y se va al cerrar. Sin luces
       en la escena, como el marco del ganador: difusa y especular contra una
       luz fija en espacio de vista, para que el brillo corra por la torzal
       al ladear el aparato. */
    const Z_CINTURA = 1.615;      // el plano medio del paño: la cuerda lo cruza
    const R_CUERDA = 0.052;       // cuerda, no alambre (antes 0.026)
    const FONDO_CUERDA = 0.24;    // cuánto se hunde por detrás de la tela
    const opacidadAlza = { value: 0 };

    const vertAlza = `
      varying vec2 vUv; varying vec3 vN; varying vec3 vP;
      void main() {
        vUv = uv;
        vN = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vP = mv.xyz;
        gl_Position = projectionMatrix * mv;
      }`;

    /* El latón de la casa, común a los tres materiales del alzapaño:
       difusa + especular contra la luz fija en espacio de vista. «relieve»
       es el bombeo de la hebra —1 en el lomo del cabo, 0 en el surco—: el
       surco se traga la luz y el lomo se la queda, que es lo que separa una
       cuerda torcida de un tubo liso. */
    const latonAlza = `
      uniform vec3 uLaton; uniform vec3 uTenue; uniform vec3 uCrema;
      uniform float uOpacidad;
      varying vec2 vUv; varying vec3 vN; varying vec3 vP;
      vec3 metal(float relieve, float ancho) {
        vec3 n = normalize(vN);
        vec3 v = normalize(-vP);
        vec3 luz = normalize(vec3(-0.28, 0.62, 0.78));
        float dif = clamp(dot(n, luz), 0.0, 1.0);
        float refl = clamp(dot(reflect(-luz, n), v), 0.0, 1.0);
        float esp = pow(refl, ancho);
        /* El lóbulo ancho impide que el latón se apague en la mitad que no
           mira a la luz: sin él la cuerda se lee marrón oliva en vez de
           dorada. Es el mismo «halo» del marco del ganador. */
        float halo = pow(refl, 7.0);
        float filo = pow(1.0 - clamp(dot(n, v), 0.0, 1.0), 2.2);
        float hebra = 0.52 + 0.48 * relieve;
        return mix(uTenue, uLaton, 0.32 + 0.68 * dif) * (0.42 + 0.80 * dif) * hebra
             + uCrema * esp * (0.18 + 0.82 * relieve * relieve) * 0.95
             + uLaton * halo * 0.26 * (0.15 + 0.85 * relieve * relieve)
             + uLaton * filo * 0.35 * hebra;
      }`;

    const unifAlza = () => ({
      uLaton: { value: LATON },
      uTenue: { value: LATON_TENUE },
      uCrema: { value: CREMA },
      uOpacidad: opacidadAlza,
    });

    /* El nudo y la cabeza de la borla: latón liso, sin torzal. */
    const matLaton = new THREE.ShaderMaterial({
      uniforms: unifAlza(),
      vertexShader: vertAlza,
      fragmentShader: latonAlza + `
        void main() { gl_FragColor = vec4(metal(1.0, 34.0), uOpacidad); }`,
      transparent: true,
      depthWrite: true,
    });

    /* La cuerda: tres cabos que dan uTorsion vueltas de un extremo al otro.
       En el TubeGeometry uv.x corre a lo largo del tubo y uv.y da la vuelta,
       así que la fase del cabo es uv.y * 3 − uv.x * uTorsion: estrías
       helicoidales de verdad, sin textura ninguna. */
    const matCuerda = new THREE.ShaderMaterial({
      uniforms: Object.assign(unifAlza(), { uTorsion: { value: 13 } }),
      vertexShader: vertAlza,
      fragmentShader: latonAlza + `
        uniform float uTorsion;
        void main() {
          float cabo = fract(vUv.y * 3.0 - vUv.x * uTorsion);
          float s = abs(cabo - 0.5) * 2.0;
          float relieve = 0.5 + 0.5 * cos(3.14159265 * s);
          gl_FragColor = vec4(metal(relieve, 30.0), uOpacidad);
        }`,
      transparent: true,
      depthWrite: true,
    });

    /* La falda de la borla. El cono nace unitario y el vértice le da el
       perfil —cuello estrecho arriba, cuerpo y vuelo en el dobladillo—
       reconstruyendo el punto desde uv: el ángulo en uv.x, la altura en
       uv.y (0 abajo, 1 arriba). Así el perfil se cambia sin tocar la
       geometría y la borla cuelga de y = 0 hacia abajo. */
    const matFalda = new THREE.ShaderMaterial({
      uniforms: Object.assign(unifAlza(), {
        uAlto: { value: 0.28 }, uRadio: { value: 0.118 }, uHilos: { value: 30 },
      }),
      vertexShader: `
        uniform float uAlto; uniform float uRadio;
        varying vec2 vUv; varying vec3 vN; varying vec3 vP;
        float perfil(float v) {
          float t = 1.0 - clamp(v, 0.0, 1.0);
          float cuerpo = mix(0.34, 1.0, pow(t, 0.62));
          float vuelo = 0.15 * exp(-(1.0 - t) * (1.0 - t) * 44.0);
          return uRadio * (cuerpo + vuelo);
        }
        void main() {
          vUv = uv;
          float th = uv.x * 6.2831853;
          float r = perfil(uv.y);
          float dr = (perfil(uv.y + 0.02) - perfil(uv.y - 0.02)) / (0.04 * uAlto);
          vec3 p = vec3(sin(th) * r, (uv.y - 1.0) * uAlto, cos(th) * r);
          vN = normalize(normalMatrix * normalize(vec3(sin(th), -dr, cos(th))));
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          vP = mv.xyz;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: latonAlza + `
        uniform float uHilos;
        void main() {
          float hilo = vUv.x * uHilos;
          float k = floor(hilo);
          /* Cada fleco se corta a su aire: el dobladillo de una borla no es
             recto. La rifa es la de siempre, sin textura. */
          float recorte = 0.11 * fract(sin(k * 91.37) * 43758.5453);
          if (vUv.y < recorte) discard;
          float s = abs(fract(hilo) - 0.5) * 2.0;
          float relieve = 0.5 + 0.5 * cos(3.14159265 * s);
          vec3 c = metal(relieve, 24.0);
          c *= mix(0.64, 1.0, smoothstep(0.0, 0.62, vUv.y));
          gl_FragColor = vec4(c, uOpacidad);
        }`,
      transparent: true,
      depthWrite: true,
    });

    /* La curva de la cintura: una elipse que además VIAJA en z. «u» es el
       seno del ángulo: el arco de delante (u > 0) baja y se adelanta hasta
       FONDO_CUERDA, el de detrás (u < 0) sube y se hunde otro tanto, y los
       dos extremos (u = 0) pasan justo por el plano de la tela, que es
       donde la cuerda rodea el canto del paño. El exponente 0.72 aplana la
       ida y la vuelta: la cuerda se queda delante en los dos tercios
       centrales y se hunde de golpe cerca de los extremos.
       El signo de «lado» pone el ángulo 0 —donde va el nudo— del lado del
       hueco en los dos paños. 72 × 8 segmentos = 1152 triángulos. */
    function curvaCintura(lado: number, rx: number, ry: number, rz: number) {
      const puntos = [];
      const N = 32;
      for (let i = 0; i < N; i += 1) {
        const a = (i / N) * Math.PI * 2;
        const u = Math.sin(a);
        const fondo = (u < 0 ? -1 : 1) * Math.pow(Math.abs(u), 0.72);
        puntos.push(new THREE.Vector3(-lado * Math.cos(a) * rx, -u * ry, fondo * rz));
      }
      const curva = new THREE.CatmullRomCurve3(puntos, true, 'catmullrom', 0.5) as THREE.CatmullRomCurve3 & { largo: number };
      /* El largo de la poligonal, para repartir el torzal a paso constante
         sin pedirle a la curva que se mida (y sin depender de three). */
      let largo = 0;
      for (let i = 0; i < N; i += 1) {
        const p = puntos[i], q = puntos[(i + 1) % N];
        largo += Math.hypot(q.x - p.x, q.y - p.y, q.z - p.z);
      }
      curva.largo = largo;
      return curva;
    }

    /* El cordón corto del que cuelga la borla, del nudo hacia el hueco. */
    function curvaColgante() {
      return new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0.01, 0),
        new THREE.Vector3(0.004, -0.035, 0.006),
        new THREE.Vector3(0.002, -0.075, 0.009),
        new THREE.Vector3(0, -0.112, 0.010),
      ], false, 'catmullrom', 0.5);
    }

    const A_NUDO = 0.38 * Math.PI;   // el nudo, en el arco de delante y del lado del hueco

    const alzapanos = [-1, 1].map((lado) => {
      const raiz = new THREE.Group();
      raiz.position.set(0, Y_ALZA, Z_CINTURA);
      raiz.rotation.z = lado * 0.16;      // la cuerda cae un punto hacia el hueco
      raiz.visible = false;
      raiz.renderOrder = 6;
      const cuerda = new THREE.Mesh(
        new THREE.TubeGeometry(curvaCintura(lado, 0.3, 0.1, FONDO_CUERDA), 72, R_CUERDA, 8, true),
        matCuerda,
      );
      const nudo = new THREE.Mesh(new THREE.SphereGeometry(0.062, 14, 10), matLaton);
      nudo.scale.set(1, 0.80, 0.92);
      /* La borla cuelga del nudo y se balancea sola: ±2.6° cada 2.6 s. */
      const borla = new THREE.Group();
      const colgante = new THREE.Mesh(
        new THREE.TubeGeometry(curvaColgante(), 10, 0.021, 6, false), matCuerda,
      );
      const cabeza = new THREE.Mesh(new THREE.SphereGeometry(0.072, 16, 12), matLaton);
      cabeza.position.set(0, -0.158, 0.010);
      cabeza.scale.set(1, 0.86, 1);
      const cuello = new THREE.Mesh(new THREE.SphereGeometry(0.030, 10, 6), matLaton);
      cuello.position.set(0, -0.222, 0.010);
      cuello.scale.set(1, 0.60, 1);
      const falda = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 30, 6, true), matFalda);
      falda.position.set(0, -0.228, 0.010);
      borla.add(colgante, cabeza, cuello, falda);
      raiz.add(cuerda, nudo, borla);
      grupo.add(raiz);
      return { lado, raiz, cuerda, nudo, borla };
    });

    /* Lo que sabe el telón del encuadre: el medio ancho del escenario en el
       plano de la tela. Con él la cintura mide 0.11·W en cualquier caja y el
       cordón abraza justo esa cintura. */
    let radiosCuerda: { rx: number; ry: number } | null = null;
    function encuadrar(medioAncho: number, medioAlto = MEDIO_ALTO_IPHONE) {
      const m = medioAncho;
      const d = medioAlto / Math.tan(FOV * Math.PI / 360) + Z;
      const cobertura = envolventeTelon(m / medioAlto, d, 1.432, 1.798);
      const coberturaCenefa = envolventeTelon(m / medioAlto, d, 1.848, 1.952);
      const borde = Math.max(BORDE, cobertura.x + 0.09);
      uniformes.encuadre.value = m;
      uniformes.borde.value = borde;
      uniformes.ancho.value = borde + 0.05;
      uniformes.medioAlto.value = Math.max(ALTO / 2, cobertura.y + 0.09);
      uniformes.suelo.value = -medioAlto;
      // La cenefa sigue al techo visible; conserva espesor, festones y Z.
      const techo = Math.max(2.75 + medioAlto - MEDIO_ALTO_IPHONE, coberturaCenefa.y + 0.09);
      const anchoCenefa = Math.max(CENEFA_ANCHO, 2 * borde, 2 * (coberturaCenefa.x + 0.09));
      cenefa.material.uniforms.uAncho.value = anchoCenefa;
      cenefa.material.uniforms.uBorde.value = anchoCenefa / 2;
      cenefa.position.y = techo - CENEFA_ALTO / 2;
      // Festón más bajo (uv.y = 0.10), proyectado al plano de los paños.
      uniformes.cenefa.value = (techo - 0.90 * CENEFA_ALTO) * (d - Z) / (d - 1.9);
      Y_ALZA = -medioAlto + H_ALZA * (uniformes.cenefa.value + medioAlto);
      const dentro = m * (1 - 2 * F_CINTURA);
      const fuera = m + 0.03;
      /* La cuerda abraza la cintura y nada más: si se pasa de ancho deja de
         leerse como cuerda y se convierte en un aro colgado del aire. El
         extremo de dentro cae justo en el filo libre del swag —ahí se ve
         rodear el canto— y el de fuera se hunde detrás de la tela, que sigue
         hasta el borde. */
      const rx = (fuera - dentro) / 2;
      const ry = Math.max(0.07, rx * 0.34);
      const rehacerCuerda = !radiosCuerda ||
        Math.abs(rx - radiosCuerda.rx) > 1e-4 || Math.abs(ry - radiosCuerda.ry) > 1e-4;
      const cx = (fuera + dentro) / 2;
      const uNudo = Math.sin(A_NUDO);
      alzapanos.forEach((a) => {
        a.raiz.position.set(a.lado * cx, Y_ALZA, Z_CINTURA);
        if (rehacerCuerda) {
          const curva = curvaCintura(a.lado, rx, ry, FONDO_CUERDA);
          a.cuerda.geometry.dispose();
          a.cuerda.geometry = new THREE.TubeGeometry(curva, 72, R_CUERDA, 8, true);
          /* Un paso de torzal por cada 2.6 radios de cuerda: el surco mide lo
             mismo que el cabo mida la cintura lo que mida. */
          matCuerda.uniforms.uTorsion.value = Math.max(8, Math.round(curva.largo / (2.6 * R_CUERDA)));
        }
        a.nudo.position.set(
          -a.lado * Math.cos(A_NUDO) * rx,
          -uNudo * ry,
          Math.pow(uNudo, 0.72) * FONDO_CUERDA,
        );
        a.borla.position.set(a.nudo.position.x, a.nudo.position.y - 0.03, a.nudo.position.z + 0.012);
      });
      if (rehacerCuerda) radiosCuerda = { rx, ry };
    }
    encuadrar(uniformes.encuadre.value);

    /* La apertura es una transición CSS de verdad, no una persecución
       exponencial: 1.15 s cronometrados con `CURVA_TELON`, la misma
       `cubic-bezier(0.66, 0, 0.2, 1)` que la hoja de estilo de la casa. Si
       llega una orden contraria a medio camino, el tramo arranca desde el
       valor de ahora y vuelve a durar 1.15 s —igual que hace el navegador al
       reemplazar una transición en vuelo—, así que nunca hay salto. */
    // El reloj recorta cuadros lentos a 50 ms a propósito y se pausa al esconder la pestaña.
    const DURACION = 1.15;
    let desde = 0, hasta = 0, t0 = -1;

    return {
      grupo,
      destruir() { destruirGrupo(grupo); },
      encuadrar,
      abrir(t: number, v: boolean) {
        const meta = v ? 1 : 0;
        if (meta === hasta && (t0 >= 0 || uniformes.recogida.value === meta)) return;
        desde = uniformes.recogida.value;
        hasta = meta;
        t0 = t;
      },
      update(t: number, dt: number) {
        void dt; // El telón sigue el tiempo absoluto, no integra el delta.
        if (t0 >= 0) {
          const a = Math.min(1, Math.max(0, (t - t0) / DURACION));
          uniformes.recogida.value = desde + (hasta - desde) * CURVA_TELON(a);
          if (a >= 1) { uniformes.recogida.value = hasta; t0 = -1; }
        }
        /* Los paños no se esconden nunca: abiertos siguen colgando a los
           lados, y por eso el conteo sigue apareciendo por debajo de la tela
           mientras el telón viaja. Lo único que aparece y desaparece es el
           alzapaño, en el último 30 % de la apertura. */
        const r = uniformes.recogida.value;
        const k = Math.min(1, Math.max(0, (r - 0.7) / 0.3));
        const suave = k * k * (3 - 2 * k);
        opacidadAlza.value = suave;
        alzapanos.forEach((a, i) => {
          a.raiz.visible = suave > 0.01;
          a.raiz.scale.setScalar(0.55 + 0.45 * suave);
          /* La borla cuelga a plomo aunque la cuerda vaya ladeada, y se
             balancea sola: ±2.6° con período 2.6 s, desfasada por lado. */
          a.borla.rotation.z = -a.lado * 0.16
            + Math.sin(t * 2.417 + i * 1.7) * 0.046 * suave;
        });
      },
      get abierto() { return uniformes.recogida.value > 0.5; },
    };
  }
