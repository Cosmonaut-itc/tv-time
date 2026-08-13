# La sala a oscuras

- **Tipo**: `wayfinder:task` (AFK, con aceptación HITL en el iPhone)
- **Estado**: abierto
- **Asignado**: —
- **Bloqueado por**: [El ganador y la función](016-el-ganador-y-la-funcion.md)
- **Mapa**: [La sala de cine](../map.md)

## Question

Lo último que [La sala instalada](010-la-sala-instalada.md) dejó pendiente, y no
se pudo hacer entonces porque necesitaba pantallas que no existían: **qué se ve
al abrir la app sin red**.

**El telón nunca se abre.** Ésa es la decisión de diseño, y es lo único que
distingue este estado de la **marquesina apagada** de
[El muro de pósters](017-el-muro-de-posters.md). Son estados opuestos que se
iban a confundir:

- **La marquesina apagada** — la sala funciona y no tiene qué dar. Se dibuja
  **entera, con las luces apagadas y un botón que sirve**.
- **La sala a oscuras** — la sala no puede ni encender. **El telón se queda
  cerrado.**

Comparten dibujo y no deben compartir nombre.

**El telón de entrada ya construido abre por tiempo de CSS**
([`app/telon-de-entrada.ts`](../../app/telon-de-entrada.ts) y
[`app/globals.css`](../../app/globals.css)): todavía no representa conectividad
ni espera a Convex. Esta rebanada le enseña la diferencia — abrir cuando la sala
llega, quedarse cerrado cuando no.

**El service worker, si se construye, cachea sólo el cascarón.** Nunca el
catálogo: un catálogo desactualizado es peor que uno ausente, y una sala que
enseña títulos que ya no están es una sala que miente. Escrito a mano y mínimo;
Next no lo genera solo.

**Cuidado con el aparato de prueba.** Lo aprendido en
[`docs/research/apple-touch-startup-image-ios26.md`](../../docs/research/apple-touch-startup-image-ios26.md)
vale entero aquí: el Simulator y el iPhone real no coinciden, `screen.*` miente
en Safari, y una conclusión sacada sin volver a instalar en el aparato no vale.
El modo avión del iPhone real es la única prueba que cuenta.

**Es la última rebanada de la v1.** Al cerrarla no queda nada decidido sin
construir, y el mapa se cierra con ella.

Al cerrar: desplegada, y la app abierta **en modo avión desde el icono
instalado** del iPhone real, con el telón quedándose cerrado y explicándose.
