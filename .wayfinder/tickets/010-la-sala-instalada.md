# La sala instalada

- **Tipo**: `wayfinder:task` (AFK para construirla y medirla, HITL para probarla en sus celulares)
- **Estado**: cerrado
- **Asignado**: sesión de Codex (telón web y validación física)
- **Bloqueado por**: —
- **Mapa**: [La sala de cine](../map.md)

## Question

La PWA dejó de ser un adorno. [La taquilla](007-la-taquilla.md) verificó que **Safari borra el almacenamiento del sitio tras 7 días sin visita**, y que una app instalada en la pantalla de inicio queda exenta de ese contador porque no cuenta como uso de Safari. En iPhone, el «te recuerdo para siempre» que se decidió **sólo es verdad instalada**.

Hay que dejarla instalable, verificar que se comporta, y decidir cómo se pide.

- **Lo mínimo para que iOS y Android la ofrezcan**: manifest con nombre, iconos, `display: standalone`, `theme-color` y `start_url`. Verificar en un iPhone real, no en el simulador ni en Lighthouse.
- **La pantalla de arranque.** Abrir una app art déco a una pantalla blanca rompe el hechizo. El terciopelo `#12080C` y la marquesina tienen que estar desde el primer cuadro — `theme-color`, fondo del manifest, y qué se ve mientras Convex conecta.
- **El salto de almacenamiento.** La app instalada no hereda lo que Safari guardó: al instalarla hay que volver a escribir el código. ¿La sala lo advierte antes de que lo descubran solos? ¿Muestra el código en grande justo antes de invitar a instalar?
- **Cómo se invita a instalar.** iOS no ofrece un botón: hay que enseñar «Compartir → Añadir a pantalla de inicio». ¿Es un cartel que aparece una vez, algo del cajón de ajustes, o nada y se los dices tú?
- **Qué pasa sin red.** No es un reproductor y el catálogo vive en Convex, así que fuera de línea probablemente no haya sala — pero abrir el icono y encontrar un error del navegador es feo. ¿Vale una pantalla propia de «la sala está a oscuras»? **Ojo**: [Cuando la cartelera se queda corta](009-cuando-la-cartelera-se-queda-corta.md) ya definió *la marquesina apagada* — el cartel del catálogo agotado. Son estados opuestos (una sala que funciona y no tiene qué dar contra una que no puede ni encender), se van a parecer en el dibujo, y hay que diseñarlas juntas para que se distingan de un vistazo.
- **Lo que NO se hace**: sin notificaciones push, sin caché offline del catálogo. La app instalada existe para que el código sobreviva y el icono esté a la mano, no para funcionar en el avión.

Al cerrar, el ticket registra qué se verificó en qué dispositivo real.

## Resolución

**Instalar deja de ser un adorno: es la única forma de que el código sobreviva.** Los dos usan iPhone, así que hay una sola historia de instalación que contar y no dos.

### El icono: el arco de la marquesina

Un arco de latón sobre terciopelo con tres focos, sin letras. Se probaron tres bocetos a 60 px sobre fondos de pantalla reales antes de elegir — a ese tamaño sólo sobreviven dos formas gruesas, y las letras se convierten en manchas. Vive en **[`app/icon.svg`](../../app/icon.svg) como fuente única**: sirve de favicon tal cual y `pnpm graficos` lo rasteriza a los PNG que piden iOS y el manifest ([`scripts/generar-graficos.ts`](../../scripts/generar-graficos.ts)). El nombre bajo el icono es **«Cine»** — iOS corta como a 12 caracteres.

### La pantalla de arranque: el PNG es opcional, el fallback es web

La prueba física derribó la promesa anterior. En un **iPhone 17 Pro Max con iOS 26.6**, el video aportado por el usuario muestra la secuencia **negro → blanco → página**: el PNG anunciado mediante `apple-touch-startup-image` no apareció. La compatibilidad actual de ese mecanismo no está suficientemente documentada; el detalle y las hipótesis reproducibles quedan en [`docs/research/apple-touch-startup-image-ios26.md`](../../docs/research/apple-touch-startup-image-ios26.md).

Se conserva un solo PNG, `/telon/1320x2868-ios26-v1.png`, como mejora opcional y sin `media`; **no forma parte de la promesa visual**. La superficie controlable empieza cuando llega el HTML: [`app/telon-de-entrada.ts`](../../app/telon-de-entrada.ts) se renderiza en el servidor antes del contenido y el CSS abre ambas cortinas.

En Simulator, Safari y el lanzamiento frío de la PWA mostraron el telón web cerrado y luego la apertura bilateral. La preview exacta de `9910b77` se instaló después en el iPhone real y el usuario confirmó el mismo resultado: **el fallback web aparece y completa la salida del telón**. Esa comprobación HITL cierra el criterio; no se atribuye al PNG nativo.

### Cómo se invita a instalar

**Invitación, no requisito.** Nadie tropieza con un muro de «instálame» antes de ver la sala. El cartel aparece **cuando se cierra la primera función** —después del *«Esta vemos»*, con el ritual ya cumplido y la sala ya ganada— y ahí mismo **muestra el código en grande y advierte que la app instalada lo va a pedir una vez**, porque la instalada no hereda lo que Safari guardó. Enseñar «Compartir → Añadir a pantalla de inicio» sólo tiene sentido después de que la sala se ganó el lugar.

### La sala a oscuras, y por qué no se parece a la marquesina apagada

Son dos estados opuestos que se iban a confundir, y **la decisión de diseño es separarlos con el telón** cuando existan esas pantallas:

- **La marquesina apagada** ([Cuando la cartelera se queda corta](009-cuando-la-cartelera-se-queda-corta.md)): la sala funciona, no tiene qué dar. Se dibuja **entera, con las luces apagadas y un botón que sirve**.
- **La sala a oscuras** (sin red): la sala no puede ni encender. **El telón nunca se abre.**

El telón web construido ahora abre por tiempo de CSS; todavía no representa conectividad ni espera a Convex. El comportamiento sin red y un eventual service worker mínimo siguen pendientes: si se construye, cacheará sólo el cascarón y jamás el catálogo, porque un catálogo desactualizado es peor que uno ausente.

### Lo que quedó construido hoy

Sólo lo que no depende de pantallas que aún no existen:

| Archivo | Qué hace |
|---|---|
| [`app/manifest.ts`](../../app/manifest.ts) | `standalone`, vertical, `es-MX`, terciopelo en `theme_color` y `background_color`, los tres iconos |
| [`app/icon.svg`](../../app/icon.svg) | el arco — fuente única, y favicon |
| [`app/apple-icon.png`](../../app/apple-icon.png) + `public/icono/cine-{192,512,1024}.png` | rasterizados con `pnpm graficos` |
| [`app/telon-de-entrada.ts`](../../app/telon-de-entrada.ts) + [`app/globals.css`](../../app/globals.css) | telón web server-rendered, espera breve y apertura bilateral |
| [`app/layout.tsx`](../../app/layout.tsx) | telón antes del contenido, `appleWebApp`, un PNG opcional, `themeColor` y `colorScheme: dark` |

Se borró el `favicon.ico` del scaffold de Next: el arco es la única fuente.

**Pasa a [El corte de la v1](012-el-corte-de-la-v1.md)** lo que necesita pantallas que todavía no existen: el cartel de instalación (necesita la función cerrada), la pantalla de *sala a oscuras* y el service worker del cascarón.

### Verificado

- **Servido y comprobado en local** (`next start`): robots, manifest, `theme-color #12080C`, un solo link `apple-touch-startup-image` y el telón antes del contenido en el HTML inicial.
- **Preview Vercel de `9910b77`**: acceso compartible comprobado sin publicar producción; HTML con el telón antes del contenido, manifest `standalone`, PNG opcional y robots respondiendo 200.
- **Simulator iPhone 17 Pro Max, iOS 26.5**: Safari muestra cerrado → apertura bilateral → abierto; el lanzamiento frío de la PWA muestra intervalo de iOS → telón web cerrado → apertura bilateral → abierto.
- **iPhone real 17 Pro Max, iOS 26.6**: el video muestra negro → blanco → página; el PNG de `apple-touch-startup-image` no aparece.
- **iPhone real 17 Pro Max, iOS 26.6, preview final de `9910b77` (12 de agosto de 2026)**: el usuario la comprobó directamente y confirmó telón web cerrado → apertura completa de cortinas y cenefa → contenido. La evidencia de esta última aceptación es HITL reportada por el usuario; no se recibió una segunda grabación para análisis de cuadros.
