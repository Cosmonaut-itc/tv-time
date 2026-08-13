# El idioma de la sala

- **Tipo**: `wayfinder:grilling` (HITL)
- **Estado**: **cerrado**
- **Asignado**: sesión de Claude (idioma de la sala)
- **Bloqueado por**: —
- **Mapa**: [La sala de cine](../map.md)

## Question

¿Cómo se llaman las cosas y qué reglas las gobiernan? Fijar el modelo de dominio en `CONTEXT.md` antes de que el código invente su propio vocabulario.

Términos a resolver y sus fronteras:

- **Sala** vs **Cartelera** vs **Catálogo**: ¿son lo mismo? ¿La sala contiene la cartelera?
- **Título**: ¿película y serie son el mismo concepto con un campo distinto, o dos cosas diferentes?
- **Función**: ¿es el evento de ver algo, o el resultado del giro? ¿Existe una función que se decidió pero no se vio?
- **Giro**, **finalista**, **veto**: qué es exactamente un veto — ¿rechaza al ganador, o rechaza toda la terna?
- **Butaca**: ~~¿sigue existiendo?~~ **Sí** — sobrevive por personalidad, no por permisos: no posee vetos, pero cada título recuerda qué butaca lo agregó (ya en `CONTEXT.md`). Queda por decidir si es la persona o el dispositivo, y qué pasa si entran los dos desde celulares distintos.
- **Historial**: ¿guarda funciones o guarda títulos vistos? No es lo mismo si vieron la misma película dos veces.

Escenarios que hay que poder responder sin dudar:

1. Giran, sale *Dune*, ella la veta, vuelven a girar y sale *Soul* — pero al final no ven nada y se duermen. ¿Qué quedó guardado?
2. Ven *Dune* completa. Un mes después quieren volver a verla. ¿Cómo regresa a la ruleta?
3. Él agrega *Sheep Detectives* y TMDB no la encuentra. ¿Existe un título sin póster? ¿La ruleta puede sacarlo?
4. Empiezan una serie y la dejan a la mitad. ¿Sigue en la ruleta compitiendo contra películas?
5. Una película está en Netflix hoy y el mes que viene ya no. ¿Cuándo se refresca la disponibilidad y qué ve el usuario mientras tanto?

## Resolución

El glosario completo vive en [`CONTEXT.md`](../../CONTEXT.md). Lo que se decidió, en tres rondas:

- **Catálogo ≠ Cartelera.** El catálogo es todo lo acumulado; la cartelera es el recorte que puede ganar esta noche. El prototipo usaba una sola palabra para las dos cosas y ya se estaba confundiendo.
- **Un solo Título** con un campo que dice película o serie. Sólo la película puede pertenecer a una saga.
- **El veto tira la terna entera** y arranca un giro nuevo desde cero — es caro y ceremonioso a propósito. Y **lo vetado queda fuera el resto de la noche**: sin eso, el azar podía devolver la misma película en el giro siguiente y el veto no valía nada.
- **La Función nace del botón, no del giro.** Si giraron tres veces y se durmieron, la noche no existió: nada al historial, los vetos se reponen, todo sigue en cartelera. Girar no es decidir.
- **La Noche corta a las 5 de la mañana**, porque ver algo a la una es todavía la noche anterior. Es lo que repone los vetos y devuelve lo vetado — automático, nadie tiene que acordarse de cerrar nada.
- **La Butaca es la persona**, no el aparato. Comparten un celular y aun así son dos; el dispositivo sólo recuerda cuál se usó la última vez.
- **Un título sin TMDB entra igual**, con póster dibujado y sin disponibilidad automática. *Sheep Detectives* no se queda fuera por culpa de una base de datos ajena.
- **La serie a medias compite como cualquiera.** No existe un estado «en curso»: una serie está vista o no lo está.
- **La disponibilidad es pista, no promesa.** Se muestra el servicio sin fechas ni letra chica.

Un término nuevo salió de la discusión y no estaba en la pregunta: **Noche**. Era el sujeto tácito de «dos vetos por noche» y nadie lo había definido.

Los cinco escenarios quedan contestados; el segundo se responde por derivación y conviene dejarlo escrito: devolver *Dune* a la cartelera le quita el «visto» pero **no borra la función** en que la vieron. El recuerdo pertenece a la noche, no al título — por eso el mismo título puede acumular varias funciones.
