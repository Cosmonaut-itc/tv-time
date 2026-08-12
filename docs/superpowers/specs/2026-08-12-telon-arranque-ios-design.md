# Diseño: telón de arranque en iOS

Fecha: 2026-08-12

## Objetivo

Determinar con evidencia si el telón puede aparecer al abrir la web app desde
la pantalla de inicio de un iPhone 17 Pro Max con iOS 26.6 y, si puede,
conservar la implementación mínima que lo consigue. El simulador acelera la
iteración, pero no sustituye la verificación final en el aparato real.

El trabajo parte de los hallazgos empíricos del handoff: iOS ignora el link
inyectado por JavaScript, Safari y la app instalada observan geometrías
distintas, y la implementación actual con varios JPEG estáticos arranca en
negro. No se repiten como hipótesis abiertas.

## Fronteras

- Los links de arranque vienen en el HTML inicial y apuntan a recursos
  rasterizados. No se recupera el enfoque de canvas ni la inyección cliente.
- Cada experimento se publica en una preview HTTPS con origen propio. El
  dominio `cine.felixddhs.dev` queda reservado para la solución final.
- `noindex` permanece activo en producción y previews. No se introducen
  credenciales en el repo.
- El diagnóstico, las demoras artificiales y el arnés experimental son
  temporales. No llegan al despliegue final.
- No se cierra el ticket con evidencia exclusiva del simulador.

## Enfoque elegido

Se usa una puerta de existencia seguida por aislamiento causal.

La primera candidata combina las condiciones con mayor respaldo disponible:
preview HTTPS, un único link estático sin `media`, PNG opaco de 1320 × 2868,
respuesta `200 image/png`, URL de recurso nueva y un primer render demorado en
el fixture para que una pantalla válida permanezca visible en varios cuadros.
Esta vuelta cambia más de una variable y sólo responde si la función puede
existir en el entorno de prueba.

Si aparece, las vueltas siguientes cambian una sola variable para identificar
qué era necesaria: formato PNG/JPEG, origen HTTPS/HTTP cuando todavía aporte
información, link único o selección con `media`, y el mapeo de la geometría que
Safari cree ver a los píxeles reales del panel.

Si no aparece, el mismo PNG se prueba con un HTML mínimo fuera del metadata de
Next. Ese control separa un problema de integración de un problema del
consumidor cerrado de iOS. Un fallo en ambos casos sólo permite afirmar el
alcance exacto probado; no demuestra por sí solo que todos los iOS 26 hayan
eliminado la función.

## Componentes

### Selector experimental

Un módulo pequeño y explícito describe la variante activa para una preview:
recurso, formato y media query opcional. `app/layout.tsx` consume esa
descripción para emitir el link estático. Sólo existe una variante activa por
build, de modo que cada preview sea reproducible y no comparta la caché de
instalación con otra.

La selección no depende de datos secretos. El resultado de cada build se
puede identificar en el HTML servido y en la URL versionada del recurso.

### Recursos rasterizados

El generador conserva el SVG paramétrico como fuente. Durante el experimento
genera el PNG opaco de 1320 × 2868 con compresión máxima sin pérdida y valida
dimensiones y formato. JPEG sólo se reintroduce como control, no como supuesto
de compatibilidad.

### Fixture de observación

La página temporal conserva los datos que distinguen Safari de standalone y
añade una señal inequívoca de cuándo React tomó la pantalla. Para las rondas
del laboratorio retrasa ese primer render; el retraso no forma parte de la
experiencia final.

Si Next sigue negro con la candidata máxima, una ruta o documento HTML mínimo
emite sólo los metadatos imprescindibles y el mismo link. No introduce
manifest, fuentes, scripts ni múltiples imágenes salvo la capacidad mínima
necesaria para instalar y lanzar la web app.

## Flujo experimental

Cada ronda conserva: identificador de variante, URL de preview, HTML del
`<head>`, headers y dimensiones del recurso, runtime/dispositivo, estado de
"Abrir como app web", pasos de reinstalación, video del lanzamiento frío y
cuadros relevantes.

1. Capturar la línea base actual en iOS Simulator 26.5.
2. Desplegar la candidata máxima y repetir una instalación limpia en el mismo
   simulador.
3. Si aparece, aislar variables una por vuelta hasta obtener la variante
   mínima que conserva el telón.
4. Si no aparece, ejecutar el fixture HTML mínimo en simulador.
5. Entregar una única URL candidata para iPhone 17 Pro Max con iOS 26.6.
6. El dueño borra la instalación anterior, abre la URL en Safari, confirma
   "Abrir como app web", instala, graba un lanzamiento frío y devuelve la
   grabación o el resultado observado.
7. Si aparece, conservar la solución demostrada. Si no aparece, volver a la
   hipótesis que distingue esa ronda o documentar el límite cuando ya no haya
   un control con poder de discriminación.

La reinstalación es obligatoria en cada vuelta porque iOS materializa la
selección durante la instalación. Un relanzamiento de un web clip ya instalado
no prueba una variante nueva.

## Hipótesis

La matriz de evidencia externa y los experimentos mínimos están en
[`docs/research/apple-touch-startup-image-ios26.md`](../../research/apple-touch-startup-image-ios26.md).
El orden operativo prioriza:

1. Existencia bajo HTTPS, PNG, link único y sin media query.
2. Integración Next frente a HTML mínimo.
3. Formato PNG frente a JPEG.
4. Selección única frente a múltiples media queries.
5. Geometría de instalación 414 × 896 frente a panel 440 × 956.
6. Manifest/meta sólo si las rondas anteriores dejan esa interacción abierta.

Dos controles adicionales evitan falsos negativos: el primer render se demora
durante el laboratorio y cada video parte de un lanzamiento realmente frío.

## Manejo de resultados y errores

- Un error de build, recurso, MIME, instalación o grabación invalida la ronda;
  no cuenta como evidencia de producto.
- Una divergencia entre simulador y aparato real se registra como límite de
  fidelidad del simulador. Manda el iPhone real.
- Después de tres cambios de solución fallidos sin una hipótesis confirmada se
  detienen los parches y se reevalúa la arquitectura experimental.
- No se declara que iOS 26 eliminó la función con un solo modelo o runtime. La
  redacción exacta será "no funcionó en los entornos y variantes verificados"
  salvo que aparezca evidencia primaria o comparativa más amplia.

## Limpieza y entrega

Antes del despliegue final se restaura la página de producto desde el respaldo
del scaffold, se eliminan selector, fixture y demoras, y se conservan sólo el
recurso y metadata que haya demostrado funcionar. Si ninguna variante
funciona, se elimina toda promesa de startup image no sustentada y la llegada
queda sobre el fallback `#12080C`.

El cierre actualiza `.wayfinder/tickets/010-la-sala-instalada.md` con la
implementación o el callejón sin salida, el modelo, la versión de iOS y lo que
muestra la grabación. Después agrega la decisión a `.wayfinder/map.md` y marca
el ticket cerrado únicamente si la evidencia real satisface su criterio.

## Verificación final

- `pnpm lint` sin errores.
- `pnpm build` exitoso.
- HTML final con manifest, meta de web app, `noindex`, theme color y exactamente
  los links de arranque justificados por el experimento.
- Recursos finales con `200`, MIME, dimensiones y formato esperados.
- Preview candidata reinstalada y lanzada en iOS Simulator 26.5, con video y
  cuadros inspeccionados.
- Instalación nueva y lanzamiento frío grabado en iPhone 17 Pro Max con iOS
  26.6.
- Página diagnóstica, demora y fixture ausentes del despliegue final.
- Ticket y mapa coherentes con el resultado observado, sin afirmar más que la
  evidencia.
