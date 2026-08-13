# El ganador y la función

- **Tipo**: `wayfinder:task` (AFK, con aceptación HITL en el iPhone)
- **Estado**: cerrado
- **Asignado**: sesión de Claude (orquestación) · `gpt-5.6-sol` (implementación y review)
- **Bloqueado por**: [El giro, de verdad](015-el-giro-de-verdad.md)
- **Mapa**: [La sala de cine](../map.md)

## Question

**La rebanada en la que el mapa llega a su destino**: al cerrar, la app decidió
una función real. Gira, corona, y la noche queda escrita.

**El ganador en marquesina.** El póster dentro de un marco de latón **sin
ornamento encima** — el art déco rodea la imagen, no la invade, que fue la
decisión de [El ritual del giro](001-el-ritual-del-giro.md). El póster sale de
`image.tmdb.org` por la ruta que la siembra guardó, servido directo sin pasar
por la optimización de imágenes de Next. *Sheep Detectives* no tiene ninguna:
lleva póster dibujado con **marco punteado** y la nota *sin póster oficial*.

**El tercer momento de TMDB: la disponibilidad.** Las insignias de dónde verlo
son chips con punto de color, y debajo la atribución obligatoria
*Disponibilidad · JustWatch* **en cada ficha con proveedores** — es una de las
tres restricciones que hereda de
[Pósters y streaming en México](002-posters-y-streaming-en-mexico.md), junto con
la atribución de TMDB y la caché de **6 meses como máximo**. La tabla
`disponibilidad` vive fuera de las salas para que dos salas no pidan dos veces
lo mismo, y se refresca al usarse desde una **acción**, porque una query de
Convex no puede hablar con la red.

**La hoja inferior nace aquí.** Es la pieza que suben el ganador, el catálogo y
el alta — se construye **una sola vez**, aislada, con sus dos usos futuros
anotados: [El muro de pósters](017-el-muro-de-posters.md) la sube para tocar un
título, y [El cajón del alta](018-el-cajon-del-alta.md) baja su gemela para
meterlos.

**«Esta vemos» cierra la noche.** El botón escribe una fila en `funciones` con
su fecha y enciende `visto` en el título. Ese interruptor es el que sostiene el
candado: encenderlo **desbloquea la siguiente de la saga**. La distinción que
fijó [La forma de los datos](006-la-forma-de-los-datos.md) empieza a valer desde
esta rebanada — `visto` **con** funciones es «lo vimos aquí», `visto` **sin**
ninguna es «ya lo habíamos visto antes».

**El cartel de instalación se dispara justo aquí**, y en ningún otro lado. Lo
pidió [La sala instalada](010-la-sala-instalada.md): **invitación, no
requisito**, y aparece **cuando se cierra la primera función**, con el ritual ya
cumplido y la sala ya ganada. Muestra el **código en grande**, advierte que la
app instalada lo va a pedir una vez —porque no hereda lo que Safari guardó— y
enseña *Compartir → Añadir a pantalla de inicio*. Enseñarlo antes sería un muro
delante de una sala que todavía no se ganó el lugar.

**Fuera**: el historial como pantalla, que es de
[La cabina y el historial](019-la-cabina-y-el-historial.md). Aquí la función se
escribe; verla listada llega después.

Al cerrar: desplegada, y **una función real decidida en el iPhone** — el destino
del mapa. Esa noche se registra en el ticket con lo que salió.

## Resolución

**La maquinaria del destino está construida y desplegada; la noche todavía no se
ha vivido.** Implementó `gpt-5.6-sol`·`high`, review adversarial del mismo
modelo, veto del orquestador y medición en navegador a 390×844.

### Lo que quedó construido

El ganador en marquesina con su póster dentro del marco de latón, **sin
ornamento encima**. *Sheep Detectives* sale con marco punteado y la nota *sin
póster oficial*, que era su papel desde la siembra. Los chips de disponibilidad
en el orden flatrate → renta → compra, **sin logos de proveedor** —sólo punto de
color y nombre—, y la línea *Disponibilidad · JustWatch* aparece **sólo cuando
hay un chip que atribuir**, nunca de adorno. Caché de 7 días para refrescar y
**tope duro de 6 meses**, que es la cláusula heredada de
[Pósters y streaming en México](002-posters-y-streaming-en-mexico.md).

**La hoja inferior nació aquí** y quedó aislada a la primera: la reusaron sin
tocarla [El muro de pósters](017-el-muro-de-posters.md) y
[El cajón del alta](018-el-cajon-del-alta.md), que era exactamente la apuesta.

**`disponibilidad:deTitulo` nunca acepta un `tmdbId` del cliente.** Recibe el id
del título y lo resuelve del lado del servidor. Aceptarlo habría convertido
nuestro `TMDB_READ_TOKEN` en un proxy abierto a TMDB para cualquiera con la URL
del backend.

**`funciones:cerrar` rearma la cartelera del lado del servidor** al encender
`visto` — es lo que desbloquea la siguiente de la saga, y el candado no puede
depender de que el cliente lo recalcule.

El cartel de instalación se dispara aquí y en ningún otro lado, con el código en
grande y la advertencia de que la app instalada lo va a pedir una vez.

### Verificado

El póster del ganador sale **fuera del optimizador de Next**: 1 petición a
`image.tmdb.org` y **0 a `/_next/image`**. La distinción de
[La forma de los datos](006-la-forma-de-los-datos.md) queda viva desde aquí —
`visto` con función es «lo vimos aquí», `visto` sin ninguna es «ya lo habíamos
visto».

Después del despliegue, `.marco` se partió en `.marco-laton` y `.filete-muro`
para arreglar el defecto que encontró el iPhone en la 017. **La geometría del
marco del ganador quedó intacta**, comprobado leyendo la regla y no girando la
sala, que la habría ensuciado.

### Lo que no se cumplió del criterio de cierre

**No se ha decidido una función real.** Producción marca hoy **38 títulos y 0
vistos**: la sala nunca ha coronado nada. El renglón que este ticket pide —«esa
noche se registra en el ticket con lo que salió»— **queda en blanco a
propósito**, esperando la primera función de verdad. La rebanada se cierra
porque su maquinaria está construida, revisada, desplegada y aceptada en
pantalla; el destino del mapa lo camina el dueño, no yo.
