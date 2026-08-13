# Telón web y fallback PWA — Implementation Plan

**Goal:** Conservar la apertura animada del telón al abrir la web en Safari y usar el mismo telón, renderizado en el HTML inicial, como fallback fiable cuando la sala se abre desde una PWA instalada.

**Architecture:** El layout del servidor emite una capa decorativa antes del contenido de la ruta. CSS dibuja las dos cortinas cerradas sin depender de JavaScript ni de descargar una imagen; después las abre con la curva del prototipo. Una media query `display-mode: standalone` mantiene el telón cerrado un poco más para que su primer cuadro funcione como llegada de la PWA. El contenido de la página permanece debajo y no cambia.

**Public seam:** El HTML inicial servido por `/` contiene el telón cerrado; Safari reproduce la apertura y una instalación standalone reproduce la misma apertura después de la transición controlada por iOS.

## Global Constraints

- Mantener intacta la animación y el contenido que vive debajo del telón; el fallback no sustituye la página.
- El telón debe venir renderizado por el servidor en el HTML inicial; no usar canvas, detección tardía ni inyección cliente.
- Reutilizar la apertura de dos cortinas y la curva de `prototypes/icono-de-la-sala.html`.
- En Safari normal la apertura debe ejecutarse; en `display-mode: standalone` debe existir primero un cuadro cerrado claramente visible.
- Mantener `metadata.robots` con `index: false`, `follow: false` y `nocache: true`.
- Mantener `themeColor`, `background_color` y el fondo inicial en `#12080C`.
- `apple-touch-startup-image` queda sólo como mejora opcional: los comentarios y el ticket no pueden prometer que iOS 26.6 lo mostrará.
- Eliminar la demora artificial `TELON_DEMORA_MS` al cerrar: prolonga el intervalo previo al primer HTML.
- Comentarios en español y centrados en el porqué.
- No incluir secretos, URLs privadas, videos ni cuadros en Git.
- No tocar archivos ajenos a los enumerados por cada tarea.

### Task 1: Telón renderizado en el primer HTML

**Files:**
- Create: `app/telon-de-entrada.ts`
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`
- Create: `tests/telon-de-entrada.test.ts`

1. Escribir un test del seam público con `renderToStaticMarkup`: el componente emite una capa `aria-hidden` y exactamente dos cortinas.
2. Confirmar el rojo porque el componente todavía no existe.
3. Implementar el componente sin estado cliente, usando `createElement` para que el mismo módulo TypeScript pueda probarse sin un transformador TSX.
4. Portar a CSS global las cortinas, cenefa y apertura de 1.1 s con la curva `cubic-bezier(0.4, 0, 0.2, 1)`.
5. Dar a standalone una espera inicial mayor mediante `@media (display-mode: standalone)` y respetar `prefers-reduced-motion`.
6. Montar la capa antes de `{children}` en el root layout y fijar el fondo inicial de `html`/`body` en terciopelo.
7. Ejecutar `pnpm test`, `pnpm lint`, `pnpm build` y revisar el HTML de `next start` para confirmar que el marcador aparece antes del contenido de la ruta.

### Task 2: Validación visual separada en Safari y PWA

**Files:**
- Evidence only: `/tmp/telon-web-pwa/`

1. Levantar el build local sin `TELON_DEMORA_MS` en el puerto 3111.
2. Abrir `/` directamente en Safari del simulador dedicado iPhone 17 Pro Max iOS 26.5, grabar una recarga y comprobar cuadro por cuadro que el telón cerrado abre hacia los lados.
3. Reinstalar la misma URL con “Abrir como app web” activo, grabar un lanzamiento frío y comprobar cuadro por cuadro que, después del intervalo de iOS, aparece el telón web cerrado antes de abrirse.
4. Guardar videos, cuadros y clasificación sólo bajo `/tmp/telon-web-pwa/`; no inferir éxito por el DOM.
5. Si Safari o standalone no muestran la apertura, volver a Task 1 con una sola hipótesis y una corrección acotada.

### Task 3: Retirar el laboratorio y registrar la decisión real

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/layout.tsx`
- Modify: `app/telon.ts`
- Delete: `app/diagnostico-telon.tsx`
- Delete: `app/laboratorio-telon.ts`
- Delete: `tests/laboratorio-telon.test.ts`
- Delete: `app/telon-arranque.ts`
- Delete: `tests/telon-arranque.test.ts`
- Delete: `public/lab-telon-minimo.html`
- Modify: `.wayfinder/tickets/010-la-sala-instalada.md`
- Modify: `.wayfinder/map.md`
- Add: `docs/research/apple-touch-startup-image-ios26.md`

1. Restaurar `app/page.tsx` desde el respaldo citado en el plan anterior; el telón del layout debe conservar la animación aunque cambie el contenido.
2. Retirar diagnóstico, demora y selector de experimentos. Dejar un único PNG en `metadata.appleWebApp.startupImage` como mejora opcional, sin promesa de soporte.
3. Reescribir la resolución obsoleta del ticket con la evidencia del iPhone 17 Pro Max/iOS 26.6 y el fallback web; cerrar el ticket sólo con hechos observados.
4. Añadir la decisión del ticket 010 al mapa.
5. Ejecutar `pnpm test`, `pnpm lint`, `pnpm build`, `next start` y probes HTTP de robots, manifest, theme-color, startup link y telón en el HTML inicial.
6. Confirmar con `rg` que no quedan diagnóstico, demora ni fixture; revisar `git diff --check`, diff completo y ausencia de secretos/evidencia binaria.

### Task 4: Salida completa y continua del telón

**Files:**
- Modify: `app/globals.css`
- Modify: `tests/telon-de-entrada.test.ts` sólo si aparece un seam público útil
- Evidence only: `/tmp/telon-web-pwa/pulido/`

1. Sustituir el encogimiento `scaleX(0.16)` por la salida completa de cada cortina hacia su borde: izquierda fuera por `-101%`, derecha fuera por `101%`.
2. Animar la cenefa superior hacia `translateY(-101%)` con la misma espera y duración, de modo que ninguna pieza desaparezca dentro del viewport.
3. Retirar u ocultar la capa contenedora sólo cuando las tres piezas ya estén completamente fuera; no puede existir un corte visible al terminar.
4. Conservar la duración de 1.1 s, la curva aprobada, la espera corta de Safari, la espera standalone y `prefers-reduced-motion`.
5. Ejecutar tests, lint, build y `git diff --check`.
6. Grabar y extraer cuadros densos de Safari y standalone; confirmar que las cortinas y la cenefa cruzan el borde progresivamente y que ningún cuadro muestra franjas que desaparecen de golpe.
