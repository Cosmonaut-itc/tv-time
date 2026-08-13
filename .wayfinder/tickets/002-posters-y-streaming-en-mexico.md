# Pósters y streaming en México

- **Tipo**: `wayfinder:research` (AFK)
- **Estado**: **cerrado**
- **Asignado**: subagente de research (disparado durante el charting)
- **Bloqueado por**: —
- **Mapa**: [La sala de cine](../map.md)

## Question

¿TMDB alcanza para lo que promete la sala, o hace falta otra fuente?

Preguntas concretas a responder contra documentación primaria:

1. **Disponibilidad en México.** ¿`/movie/{id}/watch/providers` y su equivalente de TV devuelven la región `MX` con `flatrate`, `rent` y `buy` por separado? ¿Cubre Netflix, Prime Video, Disney+/Star+, HBO Max y Apple TV en México?
2. **Precios de renta.** ¿La API da el precio en MXN, o sólo el proveedor? Si no lo da, ¿existe alternativa razonable o hay que mandar al usuario a JustWatch?
3. **Enlace profundo.** ¿Da un link directo al título dentro de cada servicio, o sólo un link a JustWatch? ¿Se puede abrir la app nativa desde el celular?
4. **Términos de uso.** Qué exige TMDB para una app personal: atribución visible, límites de tasa, si se pueden cachear los datos y por cuánto tiempo, y si el uso no comercial requiere aprobación.
5. **Credenciales.** Qué se necesita exactamente para obtener una API key y si hay que declarar algo del proyecto.
6. **Búsqueda en español.** Cómo se comporta `search/multi` con `language=es-MX` y `region=MX` para películas y series a la vez, y qué tan bien resuelve títulos en español contra títulos originales.
7. **Imágenes.** Tamaños de póster disponibles, cómo se construye la URL, y si conviene servirlos por el optimizador de imágenes de Next.js o directamente.
8. **Alternativas**, sólo si TMDB falla en algo de lo anterior: JustWatch, Watchmode, u OMDb — con su costo y sus límites.

Entregar los hallazgos como Markdown en `docs/research/` con citas a las fuentes primarias.

## Resolución

**TMDB alcanza sola.** El informe de investigación permanece fuera de este
repositorio; las conclusiones que gobiernan el producto quedan registradas a
continuación.

Lo que quedó confirmado:

- `MX` es región soportada en `watch/providers`, con `flatrate`, `rent` y `buy` en arrays separados, tanto para película como para serie. Los cinco servicios de la casa están en el catálogo de proveedores.
- `search/multi` devuelve películas y series juntas y se distinguen por `media_type`. **No acepta `region`**, sólo `language=es-MX` — `search/movie` sí lo acepta, `search/multi` no.
- Credenciales: basta una cuenta y aceptar los términos; sirve igual la API key v3 o el token Bearer v4. No hace falta aprobación especial para watch/providers.
- Pósters vía `image.tmdb.org/t/p/{size}/{file_path}`, con `poster_sizes` de `w92` a `original`. La base se documenta como valor de `/configuration`, no como contrato fijo.
- Sin límite de tasa duro desde diciembre de 2019; sólo hay que respetar los `429`.

Restricciones que hereda el proyecto:

- **Caché máximo de 6 meses** por términos de uso de TMDB.
- **Atribución de TMDB** con el texto exacto de sus términos, y su logo menos prominente que el de la app.
- **Atribución de JustWatch visible en cada ficha** donde se muestren proveedores — no basta un aviso en "Acerca de". Incumplirlo les da derecho a revocar el acceso.

Dos huecos, ninguno bloqueante:

- **No hay precio en MXN** para renta o compra. Sólo JustWatch (contrato privado, sin precio público) o Watchmode ($349 USD/mes el primer tier de pago) lo dan.
- **No hay deep link nativo** al título dentro de cada app; el campo `link` apunta a la propia página de TMDB.

Consecuencia de diseño ya aplicada: el prototipo muestra "Disponibilidad · JustWatch" bajo las insignias. El texto de atribución de TMDB falta y hay que colocarlo.

Zona gris señalada por el research y que conviene no tentar: no está documentado si TMDB considera "derivative work" el reprocesamiento de sus imágenes por un optimizador tipo Next.js. Ante la duda, servir los pósters desde `image.tmdb.org` sin pasarlos por el optimizador.
