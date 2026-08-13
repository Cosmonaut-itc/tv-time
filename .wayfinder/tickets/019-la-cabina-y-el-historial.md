# La cabina y el historial

- **Tipo**: `wayfinder:task` (AFK, con aceptación HITL en el iPhone)
- **Estado**: cerrado
- **Asignado**: sesión de Claude (orquestación) · `gpt-5.6-sol` (implementación y review)
- **Bloqueado por**: [El ganador y la función](016-el-ganador-y-la-funcion.md)
- **Mapa**: [La sala de cine](../map.md)

## Question

Lo decidido que todavía no tiene pantalla. Son dos cosas y caben juntas porque
las dos viven en cajones que se abren sobre la sala y ninguna toca el ritual.

### La cabina

**Los tres ajustes del giro son preferencia de la sala**, no del aparato:
duración del giro, paro uno-por-uno o junto, y conteo del proyector. Ya viven en
`salas.ajustes` y [El giro, de verdad](015-el-giro-de-verdad.md) ya los lee —
falta el cajón que los cambia. Que sean de la sala y no del navegador es lo que
hace que entrar desde la laptop se sienta igual que desde el celular.

**El código se muestra aquí, en grande**, con qué mandarlo. No estaba en la
pregunta original de [La taquilla](007-la-taquilla.md): lo obliga la combinación
de las otras respuestas — si el link se limpia solo y el navegador puede
olvidar, la única copia del código quedaría en un WhatsApp viejo.

**El código se puede cambiar** desde dentro. El aparato que lo cambia se queda
dentro; el otro vuelve a entrar con el nuevo. Es la tercera de las tres defensas
de la taquilla, y la única que seguía sin construirse — el freno llegó con
[Entrar a la sala](013-entrar-a-la-sala.md) y la confirmación de lo que borra
con [El muro de pósters](017-el-muro-de-posters.md).

También el botón discreto de **salir**, y el cambio de butaca de un toque para
las noches en que agrega Sofía desde el celular de Félix.

### El historial

**Son dos mitades y hay que verlas como dos.** Lo dijo el glosario de
[El idioma de la sala](004-el-idioma-de-la-sala.md) y lo sostiene el esquema sin
duplicar nada:

- **Las funciones** — filas de `funciones` con su fecha, nacidas del botón
  *«Esta vemos»* y nunca del giro. Un título puede tener varias: verla dos veces
  son dos funciones.
- **«Ya lo habíamos visto»** — `visto: true` **sin ninguna función**. No tiene
  fecha porque nadie la sabe, y entra por la línea de latón del
  [El cajón del alta](018-el-cajon-del-alta.md).

Vaciar el historial pide confirmar, como todo lo que borra.

**Fuera**: calificaciones, rachas y *«hace un año vieron…»*. Están en la niebla
del mapa a propósito — no se sabe su forma hasta que el historial exista, y
existe al cerrar este ticket. Si al construirlo se ve la forma, se gradúa
entonces; no antes.

Al cerrar: desplegada, y el código rotado de verdad desde el iPhone,
comprobando que el aparato que lo cambió se queda dentro.

## Resolución

**Lo decidido ya tiene pantalla.** Implementó `gpt-5.6-sol`·`high`, review
adversarial del mismo modelo, veto del orquestador y aceptación en navegador a
390×844. PR 8 de la rama acumuladora.

### La cabina

Abre sobre la sala con los tres ajustes del giro —duración, paro uno-por-uno o
junto, y conteo del proyector—, el código en grande con qué mandarlo, la
rotación con confirmación, el cambio de butaca de un toque y la salida discreta.

**Los ajustes viven en `salas.ajustes` y viajan por Convex**: cambiarlos desde un
aparato los cambia en el otro sin recargar. Eso es lo que hace que entrar desde
la laptop se sienta igual que desde el celular, y por eso no se guardaron en el
navegador.

**El código nuevo lo genera Convex, nunca el navegador**, y `codigoActual`
prueba la pertenencia antes de rotar: **conocer el `salaId` no basta para
quedarse con la sala**. Es la respuesta construida a la objeción que la review de
[La sala y su cartelera](014-la-sala-y-su-cartelera.md) había levantado y que
entonces se rechazó por prematura. Con esto quedan de pie las tres defensas de
[La taquilla](007-la-taquilla.md): el alfabeto, el freno y la rotación.

Cuando el navegador **niega almacenamiento**, la cabina lo dice en voz alta en
vez de rotar el código y perder la sala en silencio — que es la forma exacta en
que esta pantalla podía convertirse en una trampa.

### El historial

Se ve como dos mitades, que es como las nombró
[El idioma de la sala](004-el-idioma-de-la-sala.md): **las funciones** con su
fecha, y **«ya lo habíamos visto»** sin ninguna. Cada mitad se vacía por
separado y su confirmación dice qué desaparece **y qué le pasa a la cartelera**.

Vaciar las funciones de un título visto **lo convierte en «ya lo habíamos
visto»; no lo devuelve a la cartelera**. Es la consecuencia honesta del esquema:
borrar el recuerdo de la noche no borra el hecho de haberla visto.

### Lo que sigue en la niebla

Calificaciones, rachas y *«hace un año vieron…»* siguen sin graduarse. El ticket
decía que se verían al construir el historial; se construyó y **no se vio la
forma**, así que se quedan en la niebla del mapa en lugar de inventarles una.

### El criterio de cierre, cumplido

**El dueño rotó el código desde su iPhone y funcionó.** Comprobado contra
producción: el código anterior ya no abre nada —la taquilla responde *«No hay
ninguna sala con ese código»* y descuenta un intento del freno—, mientras la
sala sigue viva y completa bajo el mismo `salaId`. El aparato que rotó se quedó
dentro, que es la mitad difícil de la maniobra.

Con esto, **las tres defensas de [La taquilla](007-la-taquilla.md) están
construidas y las tres se han ejercitado de verdad**.
