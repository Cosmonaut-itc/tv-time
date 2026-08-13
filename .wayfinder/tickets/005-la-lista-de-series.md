# La lista de series

- **Tipo**: `wayfinder:task` (HITL)
- **Estado**: cerrado
- **Asignado**: sesión de Claude (sagas)
- **Bloqueado por**: —
- **Mapa**: [La sala de cine](../map.md)

## Question

La lista de películas existe; la de series "no está armada". Sin ella, el filtro *peli / serie / lo que sea* no tiene nada que filtrar y la v1 no se puede probar de verdad.

Trabajo manual: sacarles la lista de series entre los dos y dejarla escrita junto a las 13 películas, con el título tal como lo dirían ellos (ya se resolverá contra TMDB después).

Punto de partida — las 13 películas ya conocidas:

Dune · Cómo entrenar a tu dragón · Star Wars · Pobres Criaturas · Sheep Detectives · El señor de los anillos · Eternal Sunshine of the Spotless Mind · A Monster Calls · Forrest Gump · Spider-Man (Andrew Garfield) · Soul · Spider-Man: Into the Spider-Verse · The Big Short

~~Ojo con los que no son un solo título…~~ **Resuelto**: las sagas entran **película por película, con candado** — la siguiente no compite hasta que la anterior esté vista (ver `Saga` en [`CONTEXT.md`](../../CONTEXT.md)). Las series compiten enteras, sin episodios.

~~También hace falta el dato pendiente: los nombres de las dos butacas.~~ **Félix y Sofía.**

**Series**: *Severance* (Apple TV) · *Widow's Bay* (Apple TV) · *Andor* (Disney+). Las tres están en servicios que ya pagan. Ya viven en el prototipo.

~~Lo que queda por hacer aquí: alcance, orden y punto de arranque de cada saga.~~ **Resuelto abajo.**

## Resolución

**38 títulos: 7 películas sueltas, 6 sagas (28 películas) y 3 series.** Nadie ha visto nada — el historial nace vacío y cada saga arranca en su número 1.

### Tres reglas, sin excepciones

1. **Amplio de alcance.** Cuando algo tiene parientes, entran. *Star Wars* es el cine completo, no la trilogía; la Tierra Media incluye *El Hobbit*; los dragones incluyen el live action de 2025. El candado hace barato ser generoso: de cada saga compite una sola película a la vez, así que 28 películas encadenadas aportan 6 candidatos, no 28.
2. **Todo por orden de estreno.** Las seis sagas, sin distinguir entre precuelas, spin-offs y remakes. Se descartó el orden cronológico: arrancar *Star Wars* en *La amenaza fantasma* es el peor primer plato de los doce, y quema por adelantado la revelación del Episodio V. En la Tierra Media y en los dragones la misma regla deja el remake y la precuela como epílogo, que es donde el mundo los conoció.
3. **Sólo lo estrenado.** *Dune: Parte Tres* (18 dic 2026) y *Beyond the Spider-Verse* (18 jun 2027) **no entran todavía**. La sala no guarda lo que no se puede ver, y así no hay que almacenar ni respetar fechas de estreno. Cuando salgan, se agregan y se acomodan al final de su saga.

### El catálogo

**Sueltas (7)** — *Pobres Criaturas* (2023) · *Sheep Detectives* · *Eternal Sunshine of the Spotless Mind* (2004) · *A Monster Calls* (2016) · *Forrest Gump* (1994) · *Soul* (2020) · *The Big Short* (2015)

**Series (3)** — *Severance* (Apple TV) · *Widow's Bay* (Apple TV) · *Andor* (Disney+)

**Sagas (28)**, en su orden:

| Saga | Cadena |
| --- | --- |
| **Star Wars** (12) | IV · V · VI · I · II · III · VII · Rogue One · VIII · Solo · IX · El Mandaloriano y Grogu |
| **Tierra Media** (6) | La comunidad del anillo · Las dos torres · El retorno del rey · El Hobbit I · El Hobbit II · El Hobbit III |
| **Dragones** (4) | Cómo entrenar a tu dragón · Cómo entrenar a tu dragón 2 · El mundo oculto · el live action (2025) |
| **Spider-Man (Garfield)** (2) | The Amazing Spider-Man · El poder de Electro |
| **Dune** (2) | Dune · Dune: Parte Dos |
| **Spider-Verse** (2) | Into the Spider-Verse · Across the Spider-Verse |

*Spider-Man de Garfield* y *Spider-Verse* son **dos sagas distintas**, no una.

### Estado inicial

- **Nada visto.** Ni películas ni series. La mitad de «ya visto antes» del historial arranca vacía, así que el selector de punto de partida de [El alta de títulos](008-el-alta-de-titulos.md) no tiene que resolver ningún caso para el arranque — pero sigue haciendo falta para las sagas que agreguen después.
- ***Severance* y *Andor* van a medias.** Primer caso real de la regla de [El idioma de la sala](004-el-idioma-de-la-sala.md): una serie empezada **compite como cualquier otra**. No se marca, no se aparta, y la sala no lleva cuenta de episodios. No requiere nada del modelo de datos.
- La cartelera de la primera noche: **16 candidatos** — 7 sueltas + 3 series + 6 cabezas de saga.

### Cabos sueltos para tickets posteriores

- ***Sheep Detectives*** sigue sin identificar en TMDB. Es el caso de prueba de «un título sin `tmdbId`» que [La forma de los datos](006-la-forma-de-los-datos.md) tiene que admitir y [El alta de títulos](008-el-alta-de-titulos.md) tiene que saber dibujar sin póster.
- **Ninguna de las sagas grandes calza con una sola colección de TMDB.** *Star Wars* como las doce, la Tierra Media con *El Hobbit* y los dragones con el live action abarcan varias colecciones cada una — o ninguna. El alta por colección no puede ser el único camino.
- Se excluyó *Star Wars: The Clone Wars* (2008), la animada. «Todo el cine de Star Wars» aquí significa las doce de acción real.
