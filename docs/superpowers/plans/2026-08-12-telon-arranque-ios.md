# Telón de arranque en iOS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Obtener y aislar una variante de `apple-touch-startup-image` que muestre el telón en iOS 26.6, o documentar con precisión que las variantes verificadas no funcionan.

**Architecture:** Un selector puro emite una sola variante reproducible por build de preview; el SVG existente genera un PNG candidato y la página diagnóstica puede retrasar la respuesta sólo durante el laboratorio. Cada preview tiene origen propio, el simulador filtra fallos y el iPhone real decide el cierre.

**Tech Stack:** Next.js 16.3 App Router, React 19, TypeScript sobre Node 26, Sharp transitivo, Vercel CLI 54.18, Xcode/Simulator iOS 26.5 y AVFoundation.

## Global Constraints

- Leer `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-metadata.md` antes de editar metadata de Next 16.3.0.
- Los links de arranque deben venir en el HTML inicial; no usar canvas ni inyección cliente.
- Mantener `metadata.robots` con `index: false`, `follow: false` y `nocache: true` en producción y previews.
- No escribir credenciales en el repo; `CONVEX_DEPLOY_KEY` permanece en Vercel y `TMDB_READ_TOKEN` sólo en Convex.
- Usar previews HTTPS aisladas; no publicar experimentos en `cine.felixddhs.dev`.
- Comentarios en español y centrados en el porqué.
- Cambiar una sola variable por ronda después de la puerta de existencia.
- El simulador no satisface la aceptación; el cierre exige iPhone 17 Pro Max, iOS 26.6 y grabación de un lanzamiento frío tras reinstalar.
- No tocar ni reformatear archivos fuera de los nombrados en cada tarea.

---

## Mapa de archivos

- Crear `app/telon-arranque.ts`: selector puro de la variante y única traducción de variante a links.
- Modificar `app/layout.tsx`: consumir el selector sin cambiar robots, fuentes ni viewport.
- Modificar `scripts/generar-graficos.ts`: generar el PNG candidato desde `telonSVG`.
- Crear `tests/telon-arranque.test.ts`: contrato del selector y de cada experimento.
- Crear `tests/telon-grafico.test.ts`: firma PNG y dimensiones del candidato.
- Crear `app/diagnostico-telon.tsx`: conservar aislada la UI cliente actual.
- Crear `app/laboratorio-telon.ts`: validar la demora experimental.
- Modificar `app/page.tsx`: wrapper servidor temporal que demora la respuesta y monta el diagnóstico.
- Crear `tests/laboratorio-telon.test.ts`: contrato de la variable de demora.
- Crear condicionalmente `public/lab-telon-minimo.html`: control sin metadata de Next; se elimina antes del cierre.
- Modificar al cerrar `.wayfinder/tickets/010-la-sala-instalada.md` y `.wayfinder/map.md`.
- Restaurar al cerrar `app/page.tsx` desde `/private/tmp/claude-501/-Users-felixddhs-VSCODE-REPOS-tv-time/7459c823-30bc-4f34-a6a0-66ca507beff2/scratchpad/page-scaffold.tsx.bak` mediante un parche estrecho.

### Task 1: Selector reproducible de startup images

**Files:**
- Create: `app/telon-arranque.ts`
- Create: `tests/telon-arranque.test.ts`
- Modify: `app/layout.tsx`
- Modify: `package.json`

**Interfaces:**
- Consumes: `APARATOS` y `rutaTelon(ancho, alto, dpr)` de `app/telon.ts`.
- Produces: `type VarianteTelon`, `type ImagenArranque` y `enlacesTelon(variante?: string): ImagenArranque[]`.

- [ ] **Step 1: Añadir el runner y escribir el test fallido**

Agregar a `package.json`:

```json
"test": "node --test tests/*.test.ts"
```

Crear `tests/telon-arranque.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { enlacesTelon } from "../app/telon-arranque.ts";

test("la matriz conserva el contrato actual", () => {
  const enlaces = enlacesTelon("matriz-jpeg");
  assert.equal(enlaces.length, 12);
  assert.equal(enlaces[0], "/telon/comodin.jpg");
});

test("png-unico emite exactamente un recurso sin media", () => {
  assert.deepEqual(enlacesTelon("png-unico"), [
    "/telon/1320x2868-ios26-v1.png",
  ]);
});

test("jpeg-unico cambia sólo el formato y la URL", () => {
  assert.deepEqual(enlacesTelon("jpeg-unico"), [
    "/telon/1320x2868.jpg",
  ]);
});

test("png-media-safari une la geometría de instalación con el panel real", () => {
  assert.deepEqual(enlacesTelon("png-media-safari"), [
    {
      url: "/telon/1320x2868-ios26-v1.png",
      media:
        "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)",
    },
  ]);
});

test("una variante desconocida invalida el build", () => {
  assert.throws(() => enlacesTelon("inventada"), /Variante de telón desconocida/);
});
```

- [ ] **Step 2: Ejecutar el test y confirmar el rojo**

Run: `pnpm test`

Expected: FAIL porque `app/telon-arranque.ts` no existe.

- [ ] **Step 3: Implementar el selector mínimo**

Crear `app/telon-arranque.ts`:

```ts
import { APARATOS, rutaTelon } from "./telon";

export type VarianteTelon =
  | "matriz-jpeg"
  | "png-unico"
  | "jpeg-unico"
  | "png-media-safari";

export type ImagenArranque = string | { url: string; media?: string };

export function enlacesTelon(
  variante = process.env.TELON_VARIANTE ?? "matriz-jpeg"
): ImagenArranque[] {
  if (variante === "png-unico") {
    return ["/telon/1320x2868-ios26-v1.png"];
  }
  if (variante === "jpeg-unico") {
    return ["/telon/1320x2868.jpg"];
  }
  if (variante === "png-media-safari") {
    return [
      {
        url: "/telon/1320x2868-ios26-v1.png",
        media:
          "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)",
      },
    ];
  }
  if (variante === "matriz-jpeg") {
    return [
      "/telon/comodin.jpg",
      ...APARATOS.map(({ ancho, alto, dpr }) => ({
        url: rutaTelon(ancho, alto, dpr),
        media: `(device-width: ${ancho}px) and (device-height: ${alto}px) and (-webkit-device-pixel-ratio: ${dpr})`,
      })),
    ];
  }
  throw new Error(`Variante de telón desconocida: ${variante}`);
}
```

En `app/layout.tsx`, sustituir la construcción inline y los imports de `APARATOS`/`rutaTelon` por `import { enlacesTelon } from "./telon-arranque";` y `startupImage: enlacesTelon()`.

- [ ] **Step 4: Verificar verde, tipos y metadata actual**

Run: `pnpm test && pnpm lint && TELON_VARIANTE=matriz-jpeg pnpm build`

Expected: PASS, lint sin errores y build con exit 0.

- [ ] **Step 5: Commit estrecho**

```bash
git add package.json app/layout.tsx app/telon-arranque.ts tests/telon-arranque.test.ts
git commit -m "test: hace reproducibles las variantes del telón"
```

### Task 2: PNG candidato generado desde la fuente única

**Files:**
- Create: `tests/telon-grafico.test.ts`
- Modify: `scripts/generar-graficos.ts`
- Create: `public/telon/1320x2868-ios26-v1.png` through `pnpm graficos`

**Interfaces:**
- Consumes: `telonSVG(1320, 2868): string`.
- Produces: PNG opaco con firma PNG, ancho 1320 y alto 2868.

- [ ] **Step 1: Escribir el test binario fallido**

Crear `tests/telon-grafico.test.ts`:

```ts
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("el candidato es un PNG 1320 por 2868", async () => {
  const png = await readFile("public/telon/1320x2868-ios26-v1.png");
  assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  assert.equal(png.readUInt32BE(16), 1320);
  assert.equal(png.readUInt32BE(20), 2868);
  assert.equal(png[25], 2, "el PNG debe ser RGB opaco, no indexado ni alpha");
});
```

- [ ] **Step 2: Confirmar que falla por recurso ausente**

Run: `pnpm test`

Expected: FAIL con `ENOENT` para `1320x2868-ios26-v1.png`.

- [ ] **Step 3: Generar el PNG sin alterar la matriz JPEG**

Al final de `scripts/generar-graficos.ts`, añadir:

```ts
const candidatoIOS26 = await sharp(Buffer.from(telonSVG(1320, 2868)))
  .flatten({ background: "#12080C" })
  .png({ compressionLevel: 9, adaptiveFiltering: true })
  .toBuffer();
await escribir(
  "public/telon/1320x2868-ios26-v1.png",
  candidatoIOS26,
  "1320×2868  candidato iOS 26"
);
```

Run: `pnpm graficos`

- [ ] **Step 4: Verificar el artefacto y regresión**

Run: `pnpm test && file public/telon/1320x2868-ios26-v1.png && pnpm lint`

Expected: tests PASS; `file` informa PNG 1320 x 2868 RGB; lint sin errores.

- [ ] **Step 5: Commit estrecho**

```bash
git add scripts/generar-graficos.ts tests/telon-grafico.test.ts public/telon/1320x2868-ios26-v1.png
git commit -m "feat: genera el telón PNG candidato para iOS"
```

### Task 3: Demora de laboratorio observable y validada

**Files:**
- Create: `app/diagnostico-telon.tsx`
- Create: `app/laboratorio-telon.ts`
- Create: `tests/laboratorio-telon.test.ts`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `TELON_DEMORA_MS` de runtime.
- Produces: `demoraTelon(valor?: string): number`; `app/page.tsx` demora sólo la respuesta experimental.

- [ ] **Step 1: Escribir el test de configuración fallido**

Crear `tests/laboratorio-telon.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { demoraTelon } from "../app/laboratorio-telon.ts";

test("sin variable no demora", () => assert.equal(demoraTelon(undefined), 0));
test("acepta una demora acotada", () => assert.equal(demoraTelon("1500"), 1500));
test("rechaza valores ambiguos o excesivos", () => {
  for (const valor of ["x", "-1", "5001", "1.5"]) {
    assert.throws(() => demoraTelon(valor), /TELON_DEMORA_MS inválida/);
  }
});
```

- [ ] **Step 2: Confirmar el rojo**

Run: `pnpm test`

Expected: FAIL porque `app/laboratorio-telon.ts` no existe.

- [ ] **Step 3: Separar cliente y wrapper servidor**

Mover sin reformatear el contenido actual de `app/page.tsx` a `app/diagnostico-telon.tsx`.

Crear `app/laboratorio-telon.ts`:

```ts
export function demoraTelon(
  valor = process.env.TELON_DEMORA_MS
): number {
  if (valor === undefined || valor === "") return 0;
  const ms = Number(valor);
  if (!Number.isInteger(ms) || ms < 0 || ms > 5000) {
    throw new Error(`TELON_DEMORA_MS inválida: ${valor}`);
  }
  return ms;
}
```

Reemplazar `app/page.tsx` por:

```tsx
import { setTimeout as esperar } from "node:timers/promises";
import Diagnostico from "./diagnostico-telon";
import { demoraTelon } from "./laboratorio-telon";

export const dynamic = "force-dynamic";

export default async function Page() {
  const demora = demoraTelon();
  if (demora > 0) await esperar(demora);
  return <Diagnostico />;
}
```

- [ ] **Step 4: Verificar rojo-verde y demora HTTP real**

Run: `pnpm test && pnpm lint && TELON_VARIANTE=png-unico pnpm build`

Start: `TELON_VARIANTE=png-unico TELON_DEMORA_MS=1500 PORT=3111 pnpm start`

Probe: `curl -sS -o /dev/null -w '%{time_starttransfer}\n' http://127.0.0.1:3111/`

Expected: tests PASS, build exit 0 y TTFB de al menos 1.4 s. Terminar sólo el proceso que escucha en 3111.

- [ ] **Step 5: Commit estrecho**

```bash
git add app/page.tsx app/diagnostico-telon.tsx app/laboratorio-telon.ts tests/laboratorio-telon.test.ts
git commit -m "test: prolonga el arranque sólo en el laboratorio"
```

### Task 4: Preview HTTPS y ciclo completo en simulador iOS 26.5

**Files:**
- Read: `docs/research/apple-touch-startup-image-ios26.md`
- Evidence only: `/tmp/telon-ios26/`

**Interfaces:**
- Consumes: `TELON_VARIANTE=png-unico`, `TELON_DEMORA_MS=1500` y proyecto Vercel ya enlazado.
- Produces: URL de preview, HTML/headers capturados, video y cuadros del lanzamiento.

- [ ] **Step 1: Consultar skills de despliegue y control local antes de actuar**

Leer completos `vercel:deployments-cicd` y `computer-use:computer-use`; aplicar sus preflights sin cambiar el dominio de producción.

- [ ] **Step 2: Verificar localmente la candidata exacta**

Run:

```bash
TELON_VARIANTE=png-unico pnpm build
TELON_VARIANTE=png-unico TELON_DEMORA_MS=1500 PORT=3111 pnpm start
curl -sS http://127.0.0.1:3111/ | rg -o '<link[^>]+apple-touch-startup-image[^>]*>'
curl -sSI http://127.0.0.1:3111/telon/1320x2868-ios26-v1.png
```

Expected: exactamente un link, sin `media`, a la URL PNG; `200` y `Content-Type: image/png`.

- [ ] **Step 3: Desplegar preview sin alias de producción**

Run:

```bash
pnpm exec vercel deploy --yes \
  --build-env TELON_VARIANTE=png-unico \
  --env TELON_VARIANTE=png-unico \
  --env TELON_DEMORA_MS=1500
```

Guardar la URL devuelta en `/tmp/telon-ios26/preview-url.txt`. No ejecutar `vercel --prod`, `vercel alias` ni cambios de dominio.

- [ ] **Step 4: Validar el artefacto remoto antes de instalar**

Run `curl` contra la URL guardada para comprobar HTTP 200/HSTS, `noindex`, un solo startup link, PNG 200, `image/png` y dimensiones descargadas 1320 × 2868.

- [ ] **Step 5: Crear un simulador desechable dedicado**

Run:

```bash
xcrun simctl create "Cine Telón Lab" \
  com.apple.CoreSimulator.SimDeviceType.iPhone-17-Pro-Max \
  com.apple.CoreSimulator.SimRuntime.iOS-26-5
```

Guardar el UDID exacto en `/tmp/telon-ios26/simulator-udid.txt`, arrancarlo y completar únicamente el onboarding de Safari. No borrar ni resetear los simuladores preexistentes.

- [ ] **Step 6: Instalar desde Safari y registrar el toggle**

Abrir la preview con `xcrun simctl openurl`, usar Safari → Compartir → Añadir a pantalla de inicio, comprobar que “Abrir como app web” esté activo y añadir. Capturar una screenshot de la hoja de instalación como evidencia del estado.

- [ ] **Step 7: Grabar un lanzamiento frío**

Volver a Home, asegurar que la web app no esté abierta en el selector, iniciar `xcrun simctl io <UDID> recordVideo --codec=h264 /tmp/telon-ios26/png-unico.mov`, tocar el icono una vez y detener la grabación con SIGINT después de que aparezca el diagnóstico.

- [ ] **Step 8: Extraer e inspeccionar cuadros**

Compilar el extractor existente:

```bash
swiftc \
  /private/tmp/claude-501/-Users-felixddhs-VSCODE-REPOS-tv-time/7459c823-30bc-4f34-a6a0-66ca507beff2/scratchpad/frames.swift \
  -o /tmp/telon-ios26/extraer-cuadros
mkdir -p /tmp/telon-ios26/png-unico-frames
/tmp/telon-ios26/extraer-cuadros \
  /tmp/telon-ios26/png-unico.mov \
  /tmp/telon-ios26/png-unico-frames
```

Inspeccionar los cuadros con `view_image`. Registrar `TELÓN`, `NEGRO` o `INDETERMINADO`, tiempos y archivo de evidencia; no inferir éxito por el DOM.

### Task 5: Aislar la causa o ejecutar el control HTML mínimo

**Files:**
- Modify between previews: build variable only, unless the control is required.
- Create conditionally: `public/lab-telon-minimo.html`
- Evidence only: `/tmp/telon-ios26/`

**Interfaces:**
- Consumes: resultado observado de Task 4.
- Produces: candidata mínima o evidencia de que Next no es causa suficiente.

- [ ] **Step 1: Si aparece el PNG, comparar sólo PNG con JPEG**

Desplegar una preview nueva con `TELON_VARIANTE=jpeg-unico` y el mismo `TELON_DEMORA_MS=1500`. Reinstalar en el simulador y repetir video/cuadros. Si JPEG aparece, H2 cae; si sólo PNG aparece, conservar PNG y registrar la diferencia.

- [ ] **Step 2: Si el link único funciona, probar la media mentirosa de Safari**

Desplegar `TELON_VARIANTE=png-media-safari`, reinstalar y repetir. La media 414 × 896 @3 debe apuntar a los píxeles 1320 × 2868. Si aparece, la corrección de mapeo sigue viable; si falla mientras `png-unico` funciona, conservar el link único.

- [ ] **Step 3: Si el PNG único no aparece, escribir el control mínimo**

Crear `public/lab-telon-minimo.html`:

```html
<!doctype html>
<html lang="es-MX">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex, nofollow, noarchive" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-title" content="Telón lab" />
    <meta name="theme-color" content="#12080C" />
    <link
      rel="apple-touch-startup-image"
      href="/telon/1320x2868-ios26-v1.png"
    />
    <title>Telón lab</title>
  </head>
  <body style="margin:0;min-height:100vh;background:#E8CE86;color:#12080C">
    CONTROL HTML MÍNIMO
  </body>
</html>
```

Desplegar otra preview, instalar específicamente `/lab-telon-minimo.html` con “Abrir como app web” activo y repetir video/cuadros.

- [ ] **Step 4: Aplicar el límite de tres intentos**

Si tres soluciones distintas fallan sin confirmar hipótesis, detener los cambios. Clasificar el resultado contra H1–H10 y discutir arquitectura/evidencia antes de una cuarta solución.

- [ ] **Step 5: Elegir una sola candidata física**

Elegir la variante con evidencia más fuerte del simulador. Si el simulador no muestra ninguna, elegir el PNG único HTTPS porque es el control con más respaldo primario y menor superficie. Entregar una sola URL, no una lista de previews.

### Task 6: Verificación en iPhone real y cierre condicional

**Files:**
- Modify: `app/layout.tsx`
- Modify: `scripts/generar-graficos.ts`
- Restore: `app/page.tsx`
- Delete: `app/diagnostico-telon.tsx`, `app/laboratorio-telon.ts`, `tests/laboratorio-telon.test.ts`
- Delete conditionally: `public/lab-telon-minimo.html`
- Modify: `.wayfinder/tickets/010-la-sala-instalada.md`
- Modify: `.wayfinder/map.md`

**Interfaces:**
- Consumes: grabación/resultado del iPhone 17 Pro Max con iOS 26.6.
- Produces: implementación final sin laboratorio y ticket/mapa respaldados por evidencia física.

- [ ] **Step 1: Entregar el protocolo físico exacto y esperar evidencia**

Pedir al dueño: borrar la instalación previa; abrir la URL candidata en Safari; Compartir → Añadir a pantalla de inicio; dejar “Abrir como app web” activo; añadir; cerrar Safari; iniciar grabación; tocar una vez el icono; devolver la grabación y describir qué vio. No editar el ticket todavía.

- [ ] **Step 2: Inspeccionar la grabación real cuadro por cuadro**

Usar el extractor Swift y clasificar los cuadros de transición. El resultado es `TELÓN` sólo si el dibujo aparece antes de la página; que el diagnóstico pinte el mismo PNG no cuenta.

- [ ] **Step 3: Consolidar el código según el resultado**

Si aparece, reemplazar el selector experimental por exactamente la variante demostrada y conservar una prueba de ese contrato. Si ninguna variante aparece, retirar `startupImage` y sus imports/comentarios de promesa, conservando `themeColor: "#12080C"`, manifest e iconos.

Restaurar `app/page.tsx` desde el respaldo citado en el mapa de archivos mediante `apply_patch`. Eliminar diagnóstico, demora, selector experimental no usado y control HTML mínimo. Mantener el generador sólo para los recursos finales justificados.

- [ ] **Step 4: Actualizar ticket y mapa sin exceder la evidencia**

Reescribir `### La pantalla de arranque`, llenar `**En iPhone real**` con “iPhone 17 Pro Max, iOS 26.6” y lo observado, y marcar `Estado: cerrado` sólo si el criterio literal queda satisfecho. Añadir a `Decisions so far` una línea para el ticket 010 que describa la decisión final.

- [ ] **Step 5: Ejecutar verificación fresca completa**

Run:

```bash
pnpm test
pnpm lint
pnpm build
PORT=3111 pnpm start
curl -sS http://127.0.0.1:3111/ | rg 'robots|theme-color|apple-touch-startup-image|manifest'
curl -sSI http://127.0.0.1:3111/manifest.webmanifest
```

Comprobar que la página diagnóstica, `TELON_DEMORA_MS`, el fixture y la copy experimental no aparecen con `rg`. Terminar sólo el PID que escucha en 3111.

- [ ] **Step 6: Revisar el diff completo y hacer commit final**

Run: `git diff --check && git status --short && git diff -- app scripts public tests .wayfinder docs/research`

Verificar que no se incluyan credenciales, `.vercel`, videos, cuadros ni cambios ajenos. Después:

```bash
git add app scripts public tests .wayfinder docs/research/apple-touch-startup-image-ios26.md
git commit -m "feat: cierra la pantalla de arranque en iOS"
```

- [ ] **Step 7: Destruir sólo el simulador desechable**

Leer el UDID guardado, comprobar que el nombre es exactamente `Cine Telón Lab`, apagarlo y ejecutar `xcrun simctl delete <UDID>`. No tocar los simuladores preexistentes.
