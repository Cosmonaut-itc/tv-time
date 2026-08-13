# El ritual del giro

- **Tipo**: `wayfinder:prototype` (HITL)
- **Estado**: **cerrado**
- **Asignado**: sesión de Claude (charting + prototipo)
- **Bloqueado por**: —
- **Mapa**: [La sala de cine](../map.md)

## Question

¿Cómo se siente el ritual de decidir? Construir un prototipo interactivo, entregado como Artifact, de la tragamonedas art déco: los tres carretes que giran y se detienen en 3 finalistas, el redoble del giro final, el ganador en marquesina y el botón de veto.

Lo que el prototipo tiene que dejar resuelto:

- **Ritmo.** Cuánto dura el giro antes de aburrir y cuánto antes de sentirse trucado. Si los carretes paran uno por uno o los tres juntos.
- **Marquesina.** Cómo se ve un póster real dentro de la estética art déco sin que choquen — el póster es una imagen ajena metida en un marco de época.
- **Veto.** Dónde vive el botón, qué pasa visualmente al usarlo, y cómo se muestra que ya lo gastaste.
- **Paleta y tipografía definitivas**: vino profundo, dorado latón, crema, negro terciopelo.
- **Vertical**: se diseña para un celular en la mano, no para escritorio encogido.

Datos falsos, sin backend. El objetivo es reaccionar a algo concreto, no construir nada reutilizable.

## Resolución

Prototipo jugable: [El ritual del giro](https://claude.ai/code/artifact/60bbb8d9-0e17-4024-b8bd-99579b2a7101) · fuente en [`prototypes/ritual-del-giro.html`](../../prototypes/ritual-del-giro.html).

- **Ritmo**: no se fija uno solo — **los tres ajustes se quedan como preferencia de la sala** (duración del giro, paro uno-por-uno o junto, conteo del proyector). Arranca en **dramático**, que es lo que eligieron.
- **Marquesina**: el póster va dentro de un marco de latón sin ornamento encima; el art déco rodea la imagen, no la invade. Las insignias de servicio son chips con punto de color, y bajo ellas la atribución obligatoria *Disponibilidad · JustWatch*.
- **Veto**: vive junto al ganador, y su saldo vive en el foso como dos fichas de latón que se apagan. **Dos por noche, compartidos y sin dueño** — corrige el "uno por persona" del charting.
- **Paleta y tipografía**: terciopelo `#12080C`, foso `#0B0507`, vino `#4E1122`/`#8E2438`, latón `#C9A227`, crema `#F2E5C6`. Vertical de celular, una sola columna.
- **Butacas**: **Félix** y **Sofía**.
- **Sagas**: cada película entra individualmente pero **bloqueada hasta que la anterior esté vista** — el prototipo lo implementa con un cajón de cartelera donde se ve *compite / tras X / vista* y se puede marcar. Una saga aporta un solo candidato por giro.
- **Series**: compiten enteras. Sin episodios, sin candado, sin "dónde íbamos".

Un bug que costó encontrarlo y conviene no repetir en la app: un `<svg>` inline arrastra el descender de su línea de texto, así que cada celda del carrete quedaba unos píxeles más alta de lo que pedía su `aspect-ratio`; sobre 14 celdas eso desplaza el carrete casi un cuadro entero. Se arregla con `line-height: 0` en la celda, el SVG en `display: block`, y midiendo la celda real con `getBoundingClientRect()` en vez de asumir la altura.

Suposiciones del prototipo que **no** son decisiones: la trilogía original como alcance de *Star Wars*, y el orden de estreno como orden de saga.
