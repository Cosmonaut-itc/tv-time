# La sala a oscuras

- **Tipo**: `wayfinder:task` (AFK, con aceptación HITL en el iPhone)
- **Estado**: cerrado
- **Asignado**: sesión de Claude (orquestación) · `gpt-5.6-sol` (implementación y review)
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

## Resolución

**La última rebanada de la v1, y la única que el iPhone real reprobó dos veces
antes de pasar.** Implementó `gpt-5.6-sol`·`high`, con review adversarial del
mismo modelo en cada vuelta. PR 9 en la acumuladora, PR 12 con el arreglo.

### Lo que quedó construido

**El telón dejó de abrir por reloj.** Abre porque la sala llegó, y la llegada es
**la conexión real de Convex**, no `navigator.onLine`. Es una puerta de un solo
sentido: perder la red a media noche de cine no vuelve a cerrar el telón. Cuando
no puede abrir, se queda cerrado y se explica **por CSS**, sin depender de que
corra JavaScript.

Un **service worker escrito a mano** guarda el cascarón —el documento y los
estáticos que ese documento referencia—, **nunca el catálogo**. Esa regla no se
relajó: una sala que enseña títulos que ya no están es una sala que miente.

### Lo que el iPhone real encontró, dos veces

**Primera:** en modo avión, la PWA instalada enseñaba **la pantalla de error de
Safari** en vez del telón. La causa es que la app instalada en iOS corre en su
**propia partición de almacenamiento**, así que su `CacheStorage` nace vacío: el
worker quedaba activo sin nada guardado, la navegación hacía `throw` y eso
rechaza `respondWith`. Se arregló con un **documento de respaldo autosuficiente
incrustado en el propio worker**, con sus estilos en línea; ese respaldo nunca
entra en `CacheStorage`.

**Segunda:** las revisiones adversariales del arreglo encontraron cuatro huecos
más, y la corrección de uno introdujo un quinto:

- Las dos lecturas de caché **compartían un `try`**, así que un fallo puntual de
  la primera se llevaba por delante el cascarón de `/` aunque estuviera
  disponible. Ahora la escalera tiene **tres peldaños independientes**.
- La navegación ganó un **límite de 30 s**: un `fetch` puede quedarse pendiente
  sin resolver ni rechazar —portal cautivo, cambio de red— y como toda la
  recuperación colgaba del rechazo, la PWA se quedaba **cargando en blanco**,
  otra forma del mismo fallo que esta rebanada existe para eliminar.
- El cartel promete que el telón se abrirá solo, y `online` **no lo garantiza**:
  marca una transición del navegador, no prueba que el origen conteste. Ahora el
  respaldo **sondea el origen con un `HEAD`** y sólo recarga cuando de verdad
  responde, con retroceso de 5, 10, 20 y 30 s. `online` se conserva como atajo,
  nunca como única vía.
- Ese sondeo lleva **su propio límite de 5 s**, porque sin él un `HEAD` colgado
  dejaba la cadena muerta en el primer intento y reintroducía el mismo defecto un
  nivel más abajo.

El arnés de `tests/service-worker.test.ts` inyecta fallos de apertura y de
lectura, redes pendientes y un reloj manual, y **comprueba la recuperación por su
efecto observable**, no por cadenas del script.

### Una cosa congelada a propósito

El respaldo dice **«No hay red»**, y las dos revisiones señalaron que eso es
falso cuando la red existe pero el origen no contesta. **La redacción se dejó
como está esperando decisión del dueño**: describir el estado con precisión
técnica puede ser peor producto que una frase corta que acierta el 95 % de las
veces. Es lo único de esta rebanada que sigue abierto.

### Verificado

**El dueño abrió la app en modo avión desde el icono instalado de su iPhone
real** —con red primero, cerrándola, y volviéndola a abrir sin red— y el telón se
quedó cerrado explicándose. Es el criterio de cierre de la rebanada, y el
Simulator no habría servido: el aviso de
[`docs/research/apple-touch-startup-image-ios26.md`](../../docs/research/apple-touch-startup-image-ios26.md)
resultó cierto otra vez, porque la partición de almacenamiento de la PWA es
justo lo que el navegador de escritorio no reproduce.

**Con ella se cierra el mapa de la v1**: no queda nada decidido sin construir.
