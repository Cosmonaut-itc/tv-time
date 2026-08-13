# La forma de los datos

- **Tipo**: `wayfinder:grilling` (HITL)
- **Estado**: cerrado
- **Asignado**: sesión de Claude (esquema)
- **Bloqueado por**: — (~~El idioma de la sala~~ y ~~Pósters y streaming en México~~, ambos cerrados)
- **Mapa**: [La sala de cine](../map.md)

## Question

¿Cómo se ve el esquema de Convex y qué se guarda de TMDB?

- Tablas e índices para salas, títulos, funciones e historial, con el multi-sala por dentro que ya se decidió. El vocabulario está cerrado en [`CONTEXT.md`](../../CONTEXT.md) — el esquema debe hablar ese idioma.
- **La cartelera es un recorte, no una tabla.** Se calcula restando al catálogo lo visto, lo bloqueado por saga, lo vetado esta noche y el filtro. Hay que decidir si eso se resuelve en una query de Convex o en el cliente, y si aguanta cuando el catálogo crezca.
- **La noche es un objeto o no lo es.** Corta a las 5 a.m. y gobierna dos cosas efímeras: los dos vetos y la lista de vetados de hoy. ¿Se guarda una fila por noche, o se derivan de un `timestamp` y viven sólo en el navegador? Si viven en el navegador, cambiar de celular repone los vetos gratis.
- **Qué se cachea de TMDB y por cuánto.** El póster casi no cambia; la disponibilidad sí. ¿Se guarda una copia en Convex y se refresca por cron, o se pide en vivo en cada carga?
- **Quién habla con TMDB**: una acción de Convex con la key del lado del servidor, o el cliente directo. La key no puede terminar en el navegador.
- Qué pasa si TMDB está caído o el título no existe ahí. Ya está decidido el caso del título ausente —entra a mano, con póster dibujado y sin disponibilidad— así que el esquema tiene que admitir un título **sin `tmdbId`**.
- **Cómo se representa una saga.** Ya está decidido que existen: cada película es un título con su saga y su orden, y sólo compite si todas las anteriores están vistas. Falta decidir si la saga es una tabla propia o un campo, y cómo se consulta "la siguiente sin ver" sin recorrer el catálogo entero.
- **El historial manda sobre la ruleta.** Si el candado se resuelve leyendo funciones vistas, marcar algo visto tiene que ser barato y reversible — es la operación que desbloquea títulos. Y son **dos** clases de visto: la función con fecha y el «ya lo habíamos visto» sin fecha; el esquema tiene que distinguirlas sin duplicar la tabla.

## Resolución

**Cinco tablas**, escritas y empujadas a Convex en [`convex/schema.ts`](../../convex/schema.ts): `salas`, `titulos`, `funciones`, `noches`, `disponibilidad`. Siete índices, todos creados y verificados contra el deployment de desarrollo.

### Las dos ausencias deliberadas

**No hay tabla `cartelera`.** Es un recorte del momento y se calcula en el cliente sobre los títulos de la sala: una sola consulta trae el catálogo y el navegador le resta lo visto, lo bloqueado, lo vetado y el filtro. Con 38 títulos —o 380— son microsegundos, y el carrete ya necesita la lista completa en memoria para girar. Una tabla sería un caché que hay que invalidar cada vez que alguien marca algo visto, justo la operación más frecuente.

**No hay tabla `giros`.** Un giro no deja rastro; guardarlos contradiría el glosario.

### Lo visto es un interruptor, no una tabla

`titulos.visto` es un booleano, y `funciones` guarda aparte las noches con su fecha. Las dos mitades del historial salen de la combinación, sin duplicar nada:

| | con funciones | sin ninguna función |
| --- | --- | --- |
| **`visto: true`** | lo vieron aquí | «ya lo habíamos visto antes» |
| **`visto: false`** | lo vieron y lo devolvieron — el recuerdo sobrevive | nunca lo han visto |

Es lo que exigía el ticket: marcar visto es apagar o encender un campo — barato y reversible — y es la operación que desbloquea la siguiente película de la saga.

### Decisiones tomadas

- **La saga son dos campos** (`saga`, `orden`), no una tabla: no tiene nada que guardar que no sea su nombre. Índice `por_sala_y_saga` para no recorrer el catálogo entero buscando la siguiente sin ver.
- **`tmdbId` y `posterPath` son opcionales.** *Sheep Detectives* entra igual, con póster dibujado y sin disponibilidad.
- **`posterPath` guarda la ruta de TMDB, no una URL completa** — se sirve desde `image.tmdb.org` sin pasar por la optimización de imágenes de Next, según la zona gris que dejó [Pósters y streaming en México](002-posters-y-streaming-en-mexico.md).
- **Las butacas viven en la sala**, no en el código: otra sala tendrá otros dos nombres. `titulos.agregadoPor` es autoría, no permisos.
- **La noche es una fila, creada perezosamente.** Se identifica por `corte`: el timestamp de las 5:00 de México que la abre. Sin vetos gastados no hay noche que guardar. Se eligió contra la alternativa del navegador porque cambiar de celular —o entrar en incógnito— reponía los dos vetos gratis, y un veto que se repone solo es una sugerencia. **Consecuencia aceptada**: al recargar se pierde el ganador (un giro no deja rastro) pero no los vetos gastados.
- **Los ajustes de la cabina viven en la sala**, para que entrar desde la laptop se sienta igual que desde el celular.
- **Cada sala nace vacía.** El catálogo es de la sala; lo único compartido por debajo es la caché de TMDB, indexada por `tmdbId` y fuera de las salas.
- **El código no tiene índice único** — Convex no los tiene. La unicidad la defiende la mutación que crea la sala; es material de [La taquilla](007-la-taquilla.md).

### El refresco perezoso, corregido

La decisión fue *«al usarse, si ya tiene una semana»*, pero **una query de Convex no puede llamar a TMDB**: son deterministas y sin red. El refresco no puede vivir dentro de la lectura. Queda así:

1. La pantalla pinta la copia guardada, sea de hoy o de hace un mes.
2. Si `actualizada` tiene más de 7 días, el cliente dispara una **acción**, que sí puede salir a la red con el `TMDB_READ_TOKEN`.
3. La acción escribe por mutación y la insignia se actualiza sola cuando llega.

Nadie espera mirando un hueco, y mostrar un dato de hace ocho días es exactamente lo que el glosario llama **pista, no promesa**. El tope de 7 días queda muy por debajo de los 6 meses que permite TMDB.

### Lo que destapó

El recorte de la cartelera puede quedarse con menos de tres títulos —basta filtrar por *serie* y vetar uno— y nadie decidió qué hace el giro entonces. Salió como [Cuando la cartelera se queda corta](009-cuando-la-cartelera-se-queda-corta.md).
