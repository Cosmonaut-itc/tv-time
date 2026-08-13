# La sala instalada

- **Tipo**: `wayfinder:task` (AFK para construirla y medirla, HITL para probarla en sus celulares)
- **Estado**: abierto
- **Asignado**: sesión de Claude (sala instalada)
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

Un arco de latón sobre terciopelo con tres focos, sin letras. Se probaron tres bocetos a 60 px sobre fondos de pantalla reales antes de elegir — a ese tamaño sólo sobreviven dos formas gruesas, y las letras se convierten en manchas. Vive en **[`app/icon.svg`](../../app/icon.svg) como fuente única**: sirve de favicon tal cual y `pnpm iconos` lo rasteriza a los PNG que piden iOS y el manifest ([`scripts/generar-iconos.mjs`](../../scripts/generar-iconos.mjs)). El nombre bajo el icono es **«Cine»** — iOS corta como a 12 caracteres.

### La pantalla de arranque: se dibuja sola en el aparato

Aquí se cayó una suposición. **Safari ignora `background_color` del manifest y no arma pantalla de arranque solo**: exige un `apple-touch-startup-image` con la resolución exacta de esa pantalla, o abre en blanco. Lo normal es fabricar catorce PNG y volver a fabricarlos cada septiembre que sale un iPhone.

En vez de eso, [`app/telon-de-arranque.tsx`](../../app/telon-de-arranque.tsx) **dibuja el telón cerrado en un canvas del tamaño justo del aparato que está mirando** y lo inyecta como imagen de arranque antes de que nadie toque «Añadir a pantalla de inicio». Cero archivos en el repo, cualquier iPhone presente o futuro. Y como la web misma arranca con el telón cerrado, el paso de lo nativo a la web **no tiene costura**: las cortinas ya estaban cerradas.

El telón es terciopelo con pliegues, una juntura central en sombra —eso es lo que dice «cerrado»—, una cenefa arriba y **CINE** en latón al pie. La penumbra muerde fuerte hacia los bordes hasta fundirse con el `#12080C` del `theme_color`: es una sala a oscuras, y no un rojo encendido en la cara a media noche.

### Cómo se invita a instalar

**Invitación, no requisito.** Nadie tropieza con un muro de «instálame» antes de ver la sala. El cartel aparece **cuando se cierra la primera función** —después del *«Esta vemos»*, con el ritual ya cumplido y la sala ya ganada— y ahí mismo **muestra el código en grande y advierte que la app instalada lo va a pedir una vez**, porque la instalada no hereda lo que Safari guardó. Enseñar «Compartir → Añadir a pantalla de inicio» sólo tiene sentido después de que la sala se ganó el lugar.

### La sala a oscuras, y por qué no se parece a la marquesina apagada

Son dos estados opuestos que se iban a confundir, y **lo que los separa es el telón**:

- **La marquesina apagada** ([Cuando la cartelera se queda corta](009-cuando-la-cartelera-se-queda-corta.md)): la sala funciona, no tiene qué dar. Se dibuja **entera, con las luces apagadas y un botón que sirve**.
- **La sala a oscuras** (sin red): la sala no puede ni encender. **El telón nunca se abre.** Con red, las cortinas se abren cuando responde Convex.

Sin red y con la app ya abierta, [`useOffline()`](https://nextjs.org/docs) de Next deja las navegaciones pendientes y reintenta al volver la red — sin service worker. Pero **abrir el icono sin red sí falla**, y ahí hace falta un service worker **mínimo, escrito a mano, que cachee sólo el cascarón y jamás el catálogo**: el catálogo desactualizado es peor que el catálogo ausente.

### Lo que quedó construido hoy

Sólo lo que no depende de pantallas que aún no existen:

| Archivo | Qué hace |
|---|---|
| [`app/manifest.ts`](../../app/manifest.ts) | `standalone`, vertical, `es-MX`, terciopelo en `theme_color` y `background_color`, los tres iconos |
| [`app/icon.svg`](../../app/icon.svg) | el arco — fuente única, y favicon |
| [`app/apple-icon.png`](../../app/apple-icon.png) + `public/icono/cine-{192,512,1024}.png` | rasterizados con `pnpm iconos` |
| [`app/telon-de-arranque.tsx`](../../app/telon-de-arranque.tsx) | el telón dibujado en el aparato |
| [`app/layout.tsx`](../../app/layout.tsx) | `appleWebApp`, `themeColor`, `colorScheme: dark` |

Se borró el `favicon.ico` del scaffold de Next: el arco es la única fuente.

**Pasa a [El corte de la v1](012-el-corte-de-la-v1.md)**, porque cada pieza necesita una pantalla que todavía no existe: el cartel de instalación (necesita la función cerrada), las cortinas que se abren (necesitan la sala), la pantalla de *sala a oscuras* y el service worker del cascarón.

### Verificado

- **Servido y comprobado en local** (`next start`): el `<head>` emite `apple-touch-icon` 180×180, `icon` SVG, `manifest`, `theme-color #12080C`, `apple-mobile-web-app-title: Cine` y `status-bar-style: black`; `/manifest.webmanifest` responde `application/manifest+json` y los tres PNG responden 200.
- **En iPhone real**: <!-- pendiente: modelo, iOS, y qué se vio -->

