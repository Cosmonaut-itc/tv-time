# Contexto — la sala de cine

Glosario del proyecto. Sólo vocabulario: nada de decisiones de implementación.

El vocabulario quedó cerrado en [El idioma de la sala](.wayfinder/tickets/004-el-idioma-de-la-sala.md). No hay términos pendientes; si el código necesita una palabra que no está aquí, es señal de que apareció un concepto nuevo y hay que discutirlo antes de nombrarlo solo.

## El espacio

**Sala** — El espacio privado de una pareja: su catálogo, sus butacas y su historial. Hay muchas salas posibles; cada una se identifica por su código.

**Código** — Los 6 caracteres que identifican una sala. No es una contraseña de una persona: es el nombre secreto de la sala. Quien lo tiene, entra.

**Taquilla** — La pantalla de entrada, donde se escribe el código. Es la raíz del sitio.

**Butaca** — Cada uno de los dos miembros de la pareja: **Félix** y **Sofía**. Es la **persona**, no el dispositivo — comparten un celular y aun así son dos. El aparato sólo recuerda cuál se usó la última vez, y se cambia con un toque. No posee vetos —esos son de la noche— pero sí **autoría**: cada título recuerda qué butaca lo agregó. Existe para que la sala tenga dos voces, no para repartir permisos.

## Lo que se puede ver

**Título** — Una película o una serie. Son **la misma clase de cosa** con un campo que las distingue: las dos compiten, tienen póster, disponibilidad e historial. Lo único que las separa es que una película puede pertenecer a una saga y una serie no.

**Catálogo** — Todo lo que la sala ha juntado, lo visto y lo no visto, lo bloqueado y lo libre. Es la colección completa y sólo crece.

**Cartelera** — Lo que puede ganar esta noche: el catálogo menos lo visto, menos lo bloqueado por su saga, menos lo vetado hoy, y pasado por el filtro *peli / serie / lo que sea*. Es un recorte del momento, no una lista guardada.

**Saga** — Un conjunto ordenado de títulos que sólo tiene sentido ver en orden. Sus miembros entran a la cartelera **uno por uno**: cada uno permanece bloqueado hasta que el anterior está visto, así que una saga aporta a lo sumo un candidato por giro y pesa lo mismo que una película suelta. Una serie **no** es una saga — compite entera, sin episodios y sin candado, incluso si la dejaron a la mitad.

**Disponibilidad** — Dónde se puede ver un título en México: con qué suscripción, o a qué precio de renta o compra. Es un dato ajeno que envejece, y la sala lo ofrece como **pista, no como promesa**: se muestra el servicio sin fechas ni advertencias. Decidir qué ver es su trabajo; garantizar catálogos ajenos, no.

## El ritual

**Noche** — La unidad de tiempo de la sala. Va de las **5 de la mañana a las 5 de la mañana** siguiente, porque ver algo a la una es todavía la noche del día anterior. Cada noche repone los vetos y devuelve a la cartelera lo que se vetó.

**Giro** — El acto de dejar que el azar elija. Ocurre en dos actos: el primero reduce la cartelera a los finalistas, el segundo elige entre ellos. Cuando la cartelera trae dos o menos no hay nada que reducir y **el primer acto se salta**. Un giro no deja rastro: girar no es decidir.

**Finalista** — Cada uno de los títulos que llegan al segundo acto de un giro. Son **tres cuando la cartelera alcanza**; con dos es un duelo y con uno el azar no tiene nada que elegir, pero se gira igual.

**Duelo** — El giro de una cartelera de dos. No es una variante del ritual ni un modo aparte: es el mismo giro sin primer acto, anunciado antes de jalar la palanca.

**Veto** — El derecho a rechazar lo que el azar eligió. Son **dos por noche, de la sala**, no de una butaca: nadie los reclama y nadie los defiende. Vetar tira la terna entera y arranca un giro nuevo desde cero, y **lo vetado queda fuera el resto de la noche** — de otro modo el azar podría devolverlo en el siguiente giro y el veto no serviría de nada. **Con un solo título en la cartelera el veto se apaga**: existe para salvar la noche, no para dejarla sin función.

**Función** — Una noche en que sí vieron algo. Nace del botón *«Esta vemos»*, nunca del giro: si giraron tres veces y se durmieron, no hubo función y la mañana los encuentra con todo como estaba. Un mismo título puede tener varias funciones si lo ven más de una vez.

**Historial** — La memoria de la sala. Tiene dos mitades que no se mezclan: las **funciones**, que ocurrieron aquí y llevan su fecha, y lo **ya visto antes**, que se marca al agregar una saga por su punto de partida y no lleva fecha porque nunca fue una noche. Las dos sacan un título de la cartelera; sólo la primera es un recuerdo. Devolver un título a la cartelera le quita el «visto» pero **no borra sus funciones**: el recuerdo es de la noche, no del título.
