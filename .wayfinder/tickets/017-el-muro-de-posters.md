# El muro de pósters

- **Tipo**: `wayfinder:task` (AFK, con aceptación HITL en el iPhone)
- **Estado**: cerrado
- **Asignado**: sesión de Claude (orquestación) · `gpt-5.6-sol` (implementación y review)
- **Bloqueado por**: [El ganador y la función](016-el-ganador-y-la-funcion.md)
- **Mapa**: [La sala de cine](../map.md)

## Question

El catálogo: la otra lista de la sala, todo lo que existe esté visto o no. Se
traduce de [El catálogo de 38 títulos](011-el-catalogo-de-38-titulos.md) y de
[`prototypes/catalogo.html`](../../prototypes/catalogo.html), donde la forma ya
se eligió contra otras dos.

**Un muro, no una lista.** Tres columnas de puro póster. **Una saga ocupa una
sola celda** —se ve la que sigue, con las demás asomando detrás y el marcador
`3/12` en la banda—, así que los 38 títulos son **16 celdas** y el catálogo cabe
casi de un vistazo. Tocar la pila la abre **en su sitio**, en una tira
horizontal con las películas en orden de estreno y el candado a la vista; la
pila abierta se queda sola en su renglón, con el marco encendido, para que el
hueco a su derecha se lea como «esta saga está abierta».

**El orden.** Primero las **sagas** por antigüedad de alta, después lo **suelto**
por lo último agregado. Dentro de la pila manda el orden de estreno, del que
cuelga el candado. El orden de la saga no compite con el de la lista porque la
saga es un solo lugar en la lista.

**Las vistas se quedan en su celda, apagadas.** Sin gaveta, sin fondo, sin
estante propio, **sin excepción**. La celda se atenúa y estrena una banda
`✓ vista` **arriba** — abajo choca con el rótulo que el póster ya trae. Una saga
entera vista se apaga completa y conserva su `2/2`. El catálogo es donde se
devuelve algo a la cartelera con un toque, y esconder la mitad de la que se tira
de ese toque sería esconder la mitad útil.

**Su filtro es suyo**, no el de la cartelera: **Todo · Sin ver · Vistas**, con
cuenta en vivo, más un buscador contra los 38. La cartelera pregunta *qué va a
girar*; el catálogo pregunta **qué falta por ver**. Son dos preguntas distintas
y cada pantalla se queda con la suya.

**El detalle vive en la hoja inferior** ya construida en
[El ganador y la función](016-el-ganador-y-la-funcion.md) — año, tipo, insignia
de servicio, quién lo agregó, *ya la vimos* y *quitar*. La autoría es una línea
gris pequeña, **nunca una insignia**. Quitar borra de verdad, con la
confirmación de dos toques que exige [La taquilla](007-la-taquilla.md); el
segundo toque se pone en vino y dice *«¿Seguro? Quitar»*. Marcar visto no
confirma nada, porque no destruye nada.

**El catálogo es un cajón sobre la sala**, no una pantalla propia: se abre
encima y se vuelve a cerrar. La sala tiene un solo centro —la ruleta— y el
catálogo no se lo roba. La marquesina y la cuenta de arriba
(`38 títulos · 16 en cartelera · 13 vistas`) siguen siendo las de la sala.

**Aquí nace la marquesina apagada**, la segunda pieza compartida: la sala
funcionando y sin nada que dar, dibujada **entera con las luces apagadas** y un
solo botón que sube el cajón del alta. La misma pieza sirve a la sala recién
nacida con otra línea. No se parece a la *sala a oscuras* de
[La sala a oscuras](020-la-sala-a-oscuras.md) y no debe: comparten dibujo y no
nombre.

**La regla, otra vez**: ninguna interacción repinta una lista entera. Marcar una
vista toca **esa celda, sus hermanas de saga y la cabeza de su pila**, y nada
más. En el prototipo se logró con DOM a mano; en React se logra con keys
estables y memo. Es otra técnica para el mismo fin, y hay que comprobarla en
navegador igual que se comprobó allá.

Al cerrar: desplegada, y el muro recorrido en el iPhone con los 38 reales.

## Resolución

**El muro existe y el dueño lo recorrió en su teléfono** — de hecho fue ahí donde
encontró el único defecto grave que sobrevivió al despliegue. Implementó
`gpt-5.6-sol`·`high`, review adversarial del mismo modelo, veto y aceptación en
pantalla del orquestador.

### Lo que quedó construido

Tres columnas de puro póster, **16 celdas para los 38 títulos**, porque una saga
ocupa una sola celda con su marcador. Tocar la pila la abre en su sitio, en una
tira horizontal con el candado a la vista y el renglón para ella sola. Las
vistas se quedan en su celda, atenuadas, con la banda `✓ vista` arriba. Filtro
propio —Todo · Sin ver · Vistas— con cuenta en vivo y buscador que ignora
acentos. La ficha vive en la hoja inferior de
[El ganador y la función](016-el-ganador-y-la-funcion.md), con *quitar* en dos
toques y el segundo en vino. Y aquí nació **la marquesina apagada**.

### Lo que la review encontró

- **El CSS del muro pisaba el carrete del giro.** Copiado con selectores
  globales, `.tira` le metía un `gap` de 8 px al carrete de la 015 y
  `.tira .celda` le cambiaba el ancho; como el giro desplaza `alto × 14`, la
  finalista se paraba 112 px por encima de su sitio. Todo el muro quedó bajo
  `.catalogo`. Medido en pleno giro: el carrete vuelve a `gap: normal` y su paso
  coincide con la altura de la celda.
- **Marcar una vista repintaba las 38 celdas.** La estabilidad estaba apostada a
  la identidad de objeto, y una consulta de Convex reserializa la instantánea
  completa en cada actualización. Ahora se compara campo a campo. Medido en el
  DOM: al marcar una, las otras 15 conservan su nodo. **Es la regla del ticket,
  comprobada como se pidió y no supuesta.**
- **Los pósters de las pilas desbordaban.** El selector dependía de ser hijo
  directo de `.muro`, y `display: contents` cambia el layout pero no el árbol del
  DOM: las tres columnas se resolvían a 185 px cada una, 555 px de rejilla en un
  teléfono de 390. Ahora miden 116.7 px.
- **El candado de saga divergía del de la cartelera**: se le había caído la
  condición `anterior.tipo === "pelicula"`. Queda una sola regla, exportada desde
  `convex/cartelera.ts`.
- Faltaba la cuenta de la sala en la marquesina, y el vacío decía `Nada con «»`
  cuando lo vaciaba el filtro y no la búsqueda.

### Dos cosas que no se hicieron, a propósito

- La review pedía migrar `tests/superficie-convex.test.ts` a AST. Esa prueba
  viene de [Entrar a la sala](013-entrar-a-la-sala.md) y la regla del repo
  prohíbe regexes que fijen el **formato** del fuente, no inventariar la
  superficie leyéndolo. Migrarla toca cuatro rebanadas. **Queda como deuda.**
- También pedía usar la marquesina apagada cuando los 38 estén vistos. La 015 ya
  construyó la «vuelta vacía» para ese caso y además explica el motivo. Son dos
  piezas compitiendo por el mismo estado: **es decisión de producto y sigue
  abierta.**

### El defecto que encontró el iPhone

Desplegado y recorrido en el teléfono real, **el muro salía en tarjetas doradas
en vez de pósters**. La causa: el marco del ganador de la 016 se llamaba `.marco`
y el muro lo reusaba por nombre, heredando `width: 172px`, `padding: 7px`, el
degradado de latón y el `clip-path` — el marco se pintaba encima de la imagen y
la celda se resolvía a un ancho ajeno a la rejilla.

Se partió en dos piezas con dueño único: **`.marco-laton`**, que conserva íntegra
la geometría del marco del ganador y de la ficha sin póster, y **`.filete-muro`**,
que es sólo un filete de 1 px posicionado sobre la celda, sin fondo y sin
recorte, con sus estados de vista, bloqueada y pila abierta.

Comprobado en producción a 390×844: **16 celdas, 15 pósters, 0 rotos**, y
`.filete-muro` computando `116.664px` de ancho, fondo transparente y recorte
`none` — la inversión exacta del defecto. El dueño lo confirmó en su iPhone.

### Verificado

70/70 pruebas, lint, `tsc` de app y de convex, `pnpm build` con 7 rutas.
Superficie pública: exactamente ocho funciones. Aceptado en navegador a 390×844
antes del merge, y en el iPhone real después del arreglo.
