# El alta de títulos

- **Tipo**: `wayfinder:prototype` (HITL)
- **Estado**: cerrado
- **Asignado**: sesión de Claude (alta)
- **Bloqueado por**: — (se desbloqueó al cerrar [La lista de series](005-la-lista-de-series.md))
- **Mapa**: [La sala de cine](../map.md)

## Question

Agregar un título es la única acción de la sala que no es girar, y tiene tres formas distintas escondidas dentro. ¿Cómo se ven?

- **Una película o una serie sueltas.** Buscas en TMDB, aparecen resultados con póster, eliges. ¿Es una pantalla, un cajón que sube desde el foso, o algo dentro de la propia sala? ¿Qué pasa mientras TMDB tarda?
- **Una saga completa de un jalón.** TMDB agrupa las sagas en *collections* (`/collection/{id}`, con `parts`), así que el alcance y el orden pueden venir de ahí en vez de escribirse a mano. Hay que verificarlo contra la API y decidir si se acepta su orden tal cual o se puede reordenar. **Ojo**: [La lista de series](005-la-lista-de-series.md) demostró que la colección sola no alcanza — *Star Wars* como las doce, la Tierra Media con *El Hobbit* y los dragones con el live action abarcan **varias colecciones cada una**. Hace falta poder unir colecciones, o armar una saga a mano, o ambas.
- **El punto de partida de la saga.** Al agregarla, elegir desde dónde arranca el candado. Ya está decidido a dónde van las anteriores: al historial, en su propia mitad de **«ya las habíamos visto»**, sin fecha y separadas de las funciones reales (ver `Historial` en `CONTEXT.md`). Falta cómo se ve ese selector — una lista con checkboxes, un deslizador, "vimos hasta la 3".

Preguntas que el prototipo tiene que dejar contestadas:

- ¿Quién agrega queda registrado como autoría de la butaca? (Sí, por `CONTEXT.md` — falta ver dónde se muestra sin ensuciar la ficha.)
- ¿Se puede agregar algo que TMDB no encuentra —*Sheep Detectives*— y cómo se ve un título sin póster dentro del marco art déco?
- ¿Se puede quitar un título, o sólo marcarlo visto?
- ¿La saga se puede agregar como una sola entrada si no quieren película por película?

Entregar como Artifact, con la estética ya fijada en [El ritual del giro](001-el-ritual-del-giro.md).

## Resolución

Prototipo jugable: [El alta de títulos](https://claude.ai/code/artifact/12bd87c8-73b7-4c30-a355-c94d1dae52ff) · fuente en [`prototypes/alta-de-titulos.html`](../../prototypes/alta-de-titulos.html). TMDB va falseado con 24 títulos reales; la búsqueda tarda 750 ms a propósito. Las tres formas del alta se recorrieron en un navegador de verdad antes de enseñarlo.

### El envase: un cajón que sube del foso

Sube sobre la sala con velo detrás, el catálogo se ve al fondo, y cerrarlo es un gesto. Se eligió contra la pantalla propia porque **agregar es un paréntesis, no un viaje**: la sala nunca se pierde de vista.

**Al agregar un título suelto el cajón se queda abierto.** La fila se sella en dorado, cambia a ✓ y la búsqueda sigue viva. Se agrega de tres en tres, no de uno en uno; cierra quien terminó.

**La autoría se muestra una sola vez**, en el chip de la cabecera del cajón — *Agrega FÉLIX ⇄*, que además cambia de butaca de un toque. En la ficha del catálogo queda como una línea gris pequeña, nunca como insignia.

**Mientras TMDB tarda** corren tres focos de la marquesina y se pintan cintas vacías del tamaño de los resultados. Nada de ruedas giratorias: el hueco tiene la forma de lo que va a llegar.

**Se busca mientras se escribe, sin perder el hilo.** El campo se monta una sola vez y sólo se repinta la lista de resultados: se puede teclear de corrido sin que el foco salte ni se pierda el cursor a media palabra. Se espera a que la mano pare (220 ms) antes de preguntarle a TMDB, y los resultados viejos se quedan atenuados en lugar de desaparecer — la pantalla no parpadea entre búsqueda y búsqueda. En el catálogo, marcar visto o quitar toca **sólo esa ficha** (y sus hermanas de saga, cuando el candado se mueve); quitar se desliza a la izquierda y se va. Es una regla para toda la app, no un detalle del cajón: **ninguna interacción repinta una lista entera**.

### La saga se arma uniendo, no importando

Una colección de TMDB no alcanza y el prototipo lo trata como el caso normal, no como la excepción:

1. En los resultados, la primera película de cada colección lleva un **listón de latón** — «⛓ Parte de «Star Wars: trilogía original» — agregar las 3 con candado». Una sola vez por colección, no bajo cada parte.
2. Dentro, **⛓ Añadir a esta saga** abre un selector con las demás colecciones **y las películas sueltas**. Un mismo camino resuelve *Star Wars* (tres colecciones + *Rogue One*), la Tierra Media (dos colecciones) y los dragones (una colección + el live action, que en TMDB no pertenece a ninguna).
3. **La saga siempre se reordena por fecha de estreno** y su nombre lo escribe la sala: «Star Wars», no «Star Wars: trilogía original». Cada parte se puede sacar con la ✕.
4. Lo que **aún no se estrena aparece en gris** y no se puede agregar — *Duna: Parte Tres* con «aún no se estrena». Es la tercera regla de [La lista de series](005-la-lista-de-series.md), aplicada por la interfaz y no por la memoria.

### El punto de partida es una línea, no un formulario

Entre película y película hay una **línea de latón** que se toca: arriba de ella queda lo que ya habían visto, apagado y con «ya la habíamos visto»; abajo, lo que entra a la cartelera. El botón final lo dice en voz alta — *Agregar 7 títulos · 3 en cartelera*.

Ese corte es exactamente `visto: true` sin ninguna función: la mitad sin fecha del historial que definió [La forma de los datos](006-la-forma-de-los-datos.md). El prototipo lo enseña crudo en **el foso**, un panel que lista lo que se escribiría en `titulos` — fue la forma de comprobar que la pantalla y el esquema dicen lo mismo.

**Las ya vistas se quedan en el catálogo, apagadas**, con sello VISTA y un toque para devolverlas a la cartelera. Se eligió contra esconderlas porque una saga a medias sólo se entiende viéndola completa.

### Las respuestas cortas

- **La saga sí puede entrar como una sola entrada.** Un interruptor lo dice sin rodeos: *compite una vez, sin candado ni orden*. Se queda porque cuesta poco y apaga el candado cuando estorba. **Póster e insignia salen de la primera película**, con el nombre de la saga encima. No toca el esquema: es un título normal, sin `saga` ni `orden`, con el `tmdbId` de la primera.
- **Lo que TMDB no encuentra entra a mano**, y el nombre que buscaste llega escrito en el formulario. El póster dibujado lleva **marco punteado** y la nota *sin póster oficial*: nadie lo confunde con una ficha de TMDB. Puede unirse a una saga que ya exista en el catálogo.
- **Quitar borra de verdad**, con la confirmación de dos toques que exige [La taquilla](007-la-taquilla.md) — el segundo toque se pone en vino y dice «¿Seguro? Quitar». Si tenía funciones, el recuerdo se va con él: la sala es de dos personas de confianza y una papelera sería una pantalla más que mantener. Marcar visto no confirma nada, porque no destruye nada.
- **Quitar de en medio de una saga deja huecos en `orden`** (1, 2, 4…). No hace falta renumerar: el candado compara `orden <`, no cuenta.

### Lo que destapó

Con las vistas quedándose en el catálogo, una lista de 38 títulos tiene una parte apagada permanente, y **nadie ha decidido cómo se ordena el catálogo** ni si se filtra. El prototipo agrupa por saga porque tenía que elegir algo. Es pantalla de catálogo, no de alta: queda en la niebla del mapa.
