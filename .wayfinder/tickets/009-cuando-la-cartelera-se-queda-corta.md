# Cuando la cartelera se queda corta

- **Tipo**: `wayfinder:grilling` (HITL)
- **Estado**: cerrado
- **Asignado**: sesión de Claude (cartelera corta)
- **Bloqueado por**: —
- **Mapa**: [La sala de cine](../map.md)

## Question

El giro reduce la cartelera a **tres finalistas**. Nadie ha decidido qué pasa cuando no hay tres.

Y pasa fácil, con el catálogo real de [La lista de series](005-la-lista-de-series.md):

- **Filtro en *serie***: hay exactamente 3. Un veto deja 2, dos vetos dejan 1.
- **Noche avanzada**: dos vetos gastados sobre una cartelera ya pequeña.
- **El caso terminal**: vieron todo lo elegible y la cartelera queda en 0.

Preguntas a resolver:

- ¿Con 2 elegibles el giro muestra dos finalistas, o repite uno para llenar la terna, o se salta el primer acto y va directo al ganador?
- ¿Con 1 elegible se gira de todos modos —el ritual por el ritual— o la sala lo dice sin girar?
- ¿Con 0, qué se ve? No es un error: es una sala que ya vio todo lo que tenía. Merece un cartel propio, no una pantalla vacía.
- ¿El botón de girar se apaga cuando no hay con qué, o gira y explica?
- ¿Vetar debería estar prohibido cuando quedan menos de N? Un veto que deja la cartelera en 0 arruina la noche que pretendía salvar.

No es un problema de datos —el recorte se calcula igual— sino del ritual. Se descubrió al cerrar [La forma de los datos](006-la-forma-de-los-datos.md).

## Resolución

La respuesta corta: **la cartelera corta no es un error, es una función más rara**. El ritual no se sustituye por pantallas de aviso — se acorta, se anuncia y sigue siendo un giro. Lo único que sí desaparece es lo que podría dejar la noche sin película.

### El giro se acorta, no se rompe

El primer acto existe para reducir la cartelera a tres finalistas. Cuando ya hay tres o menos **no hay nada que reducir y el primer acto se salta**:

- **Con 2 es un duelo**: las dos entran directo al giro que decide. Se descartó la terna con la tercera casilla vacía — un acto que reduce dos a dos es teatro sin función.
- **Con 1 se gira igual.** El resultado se sabe de antemano y la ruleta da sus vueltas de todos modos, porque **el producto es la ceremonia**: quitarla justo cuando el catálogo está flaco castiga a la sala por ser pequeña. La marquesina lo admite con gracia — *«no había de otra»*.
- **La sala lo dice antes de jalar la palanca**, no al girar: *«esta noche, duelo»* con dos, *«no había de otra»* con una. Saberlo antes cambia si quieres gastar un veto, así que esconderlo sería esconder justo el dato que importa.

Esto entra al glosario en [`CONTEXT.md`](../../CONTEXT.md): **Giro** ya no promete tres finalistas, **Finalista** son *hasta* tres, y **Duelo** queda definido como el mismo giro sin primer acto — no un modo aparte.

### El veto no puede vaciar la sala

**Con un solo título en la cartelera el veto se apaga**, con la razón escrita al lado. Es la regla que faltaba: un veto que deja la noche en cero arruina justo la noche que pretendía salvar. Se descartó apagarlo ya con dos —te dejaría con dos vetos sin gastar y sin poder rechazar nada— y se descartó el veto libre con opción de deshacer, que mete una pantalla de arrepentimiento en mitad del ritual.

La consecuencia importa más que la regla: **la cartelera ya no puede llegar a cero a media noche**. El cero deja de ser un accidente del veto y pasa a ser un estado del catálogo — vieron todo lo que tenían. Eso es lo que hace que baste con un solo cartel.

### La cuenta vive en el filtro

El selector *peli / serie / lo que sea* trae su número: **«peli 35 · serie 3 · lo que sea 38»**. Ves lo flaca que está la cartelera antes de elegirla, y nada se bloquea nunca por estar en cero.

**La cuenta baja en vivo al vetar.** No es una licencia: es lo que ya decía el glosario — la cartelera es el catálogo *menos lo vetado hoy*, pasado por el filtro. Un número que no refleja los vetos miente justo en la noche en que estás contando. Se descartó anotar el porqué (*«serie 2 · 1 vetada»*): son tres datos en un control que se toca con el pulgar, y acabas de vetar tú hace diez segundos.

### Los ceros son dos, y sólo uno tiene cartel

- **Filtro agotado** — vieron las 3 series pero hay 35 películas. No merece pantalla: el selector ya dice *«serie · 0»*. Si aun así jalas la palanca, **la vuelta en vacío termina señalando el filtro** — *«ya vieron las 3 series — hay 35 películas»*, con el selector resaltado. La sala no está agotada: está mal apuntada, y la salida es un toque. Se descartó apagar el filtro en cero, porque saber cuántas series te quedan importa precisamente cuando la respuesta es ninguna.
- **Catálogo agotado** — no hay nada en ningún filtro. Éste sí tiene cartel propio, con la marquesina apagada, y **un solo botón: agregar títulos**, que sube el cajón del alta de [El alta de títulos](008-el-alta-de-titulos.md). No lleva *«vuelvan a ver algo»*: devolver una vista a la cartelera ya se hace con un toque desde el catálogo, y una segunda puerta a la misma pieza es una pieza más que mantener.

**La sala recién nacida usa ese mismo cartel con otra línea** — *«agreguen su primera película»*. Ve la sala completa desde el primer segundo, marquesina y cortinas y ruleta, sólo que dormida: entiendes qué es este lugar antes de que te pida trabajo. Se descartó abrir el alta de golpe, que te salta justo la escena que hace que valga la pena molestarse.

**La única excepción a «la palanca siempre gira».** En la sala agotada la palanca gira en vacío y explica; en la sala nueva está dormida. No es incoherencia: la sala agotada *tuvo* ritual y se lo merece de vuelta, la nueva todavía no lo ha estrenado — y estrenarlo con una ruleta que no puede darte nada es una mala primera función.

### El nombre, para que no choque

Este cartel es **la marquesina apagada**. [La sala instalada](010-la-sala-instalada.md) reserva *«la sala a oscuras»* para otra cosa —abrir la app sin red— y son estados opuestos: uno es una sala que funciona y no tiene qué dar, el otro una sala que no puede ni encender. Comparten dibujo y no deben compartir nombre.

### Lo que destapó

Nada nuevo en la niebla. Sí una nota para [La sala instalada](010-la-sala-instalada.md): su pantalla de sin-red y la marquesina apagada se parecen lo bastante como para que valga la pena diseñarlas juntas y que se distingan de un vistazo.
