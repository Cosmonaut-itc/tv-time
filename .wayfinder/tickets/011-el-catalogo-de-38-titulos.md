# El catálogo de 38 títulos

- **Tipo**: `wayfinder:prototype` (HITL)
- **Estado**: cerrado
- **Asignado**: sesión de Claude (catálogo)
- **Bloqueado por**: —
- **Mapa**: [La sala de cine](../map.md)

## Question

La cartelera ya sabe leerse: [Cuando la cartelera se queda corta](009-cuando-la-cartelera-se-queda-corta.md) le puso cuenta a cada filtro y decidió qué se ve cuando queda en cero. **El catálogo no.** Es la otra lista de la sala —todo lo que existe, visto o no— y nadie ha decidido su forma.

Y ya no es hipotética: son **38 títulos** desde [La lista de series](005-la-lista-de-series.md), y [El alta de títulos](008-el-alta-de-titulos.md) decidió que **las vistas se quedan dentro, apagadas**. O sea que la lista tiene una parte muerta que sólo crece.

- **El orden.** El prototipo del alta agrupó por saga porque tenía que elegir algo. ¿Es lo correcto, o se ordena por lo último agregado, por estreno, alfabético? Las sagas ya vienen con orden propio adentro — ¿ese orden manda sobre el de la lista?
- **Las vistas.** ¿Se hunden al fondo, se quedan en su lugar apagadas, o se pliegan bajo una línea que se abre? Una saga a medias sólo se entiende viéndola completa, que es lo que decidió el alta — pero eso vale dentro de la saga, no necesariamente en toda la lista.
- **Qué se filtra aquí.** La cartelera filtra *peli / serie / lo que sea* porque va a girar. El catálogo puede querer otra cosa: buscar por nombre entre 38, ver sólo lo no visto, ver sólo una saga. ¿Comparte el selector con la cartelera o tiene el suyo?
- **Cuánto se ve de cada ficha.** El alta las dibujó con póster, insignia y línea de autoría. A 38 títulos eso es mucho scroll. ¿Rejilla de pósters, lista compacta, o lo que ya hay?
- **Dónde vive.** ¿Es una pantalla propia, el fondo que ya se ve tras el cajón del alta, o un cajón más? La sala tiene un solo centro —la ruleta— y el catálogo no debería robárselo.

Entregar como Artifact, con la estética de [El ritual del giro](001-el-ritual-del-giro.md) y las piezas ya construidas en [El alta de títulos](008-el-alta-de-titulos.md) — incluida su regla: **ninguna interacción repinta una lista entera**.

## Resolución

El catálogo es **un muro de pósters**, no una lista. La decisión se tomó sobre
tres formas jugables construidas encima de los 38 títulos reales, con el
candado de saga funcionando —
[el prototipo](https://claude.ai/code/artifact/d26464fd-d94f-4751-b784-19a84bb24d02),
fuente en [`prototypes/catalogo.html`](../../prototypes/catalogo.html). El
prototipo trae un **foso** que no es parte del producto: marca 0, 13 o 24
títulos como vistos para poder juzgar la parte muerta de la lista años antes
de que exista.

### La forma: un muro, y cada saga es una pila

Tres columnas de puro póster. **Una saga ocupa una sola celda** —se ve la que
sigue, con las demás asomando detrás y el marcador `3/12` en la banda—, así
que los 38 títulos son **16 celdas** y el catálogo cabe casi de un vistazo.
Tocar la pila la abre **en su sitio**, en una tira horizontal con las doce
películas en orden de estreno y el candado a la vista; la pila abierta se
queda sola en su renglón, con el marco encendido, para que el hueco a su
derecha se lea como «esta saga está abierta».

Se descartó **una lista** de renglones con saga plegable: aguanta mejor los
títulos largos —es la única donde *El Señor de los Anillos: Las Dos Torres* se
lee completo— pero la sala se decide mirando pósters, no leyendo un índice.
Se descartaron los **estantes** (*esta noche pueden ver · esperando su turno ·
ya las vieron*), aunque eran los más claros de leer, por dos cosas que el
prototipo hizo visibles: a dos años vistas el estante de las apagadas es el
más grande de la pantalla —24 contra 6—, y es la **única variante que no puede
honrar la regla del alta**, porque marcar una vista la cambia de estante y no
hay forma de moverla sin rehacer los carriles.

### El orden

Primero las **sagas**, por antigüedad de alta; después lo **suelto**, por lo
último agregado. Dentro de la pila manda el orden de estreno, que es el mismo
que ya fijó [La lista de series](005-la-lista-de-series.md) y del que cuelga el
candado. O sea: **el orden de la saga no compite con el de la lista**, porque
la saga es un solo lugar en la lista.

### Las vistas se quedan en su celda, apagadas

Sin gaveta, sin fondo, sin estante propio: exactamente lo que decidió
[El alta de títulos](008-el-alta-de-titulos.md), **sin excepción**. La celda se
atenúa y estrena una banda `✓ vista` **arriba** —abajo chocaba con el rótulo
que el póster ya trae. Una saga entera vista se apaga completa y conserva su
`2/2`. Se descartó plegarlas bajo una línea al fondo: el catálogo es donde se
devuelve algo a la cartelera con un toque, y esconder la mitad de la que se
tira de ese toque es esconder la mitad útil.

### El filtro es suyo, no el de la cartelera

**Todo · Sin ver · Vistas**, con su cuenta en vivo, más un buscador contra los
38. La cartelera pregunta *qué va a girar* (*peli / serie / lo que sea*, con la
cuenta que le puso [Cuando la cartelera se queda corta](009-cuando-la-cartelera-se-queda-corta.md));
el catálogo pregunta **qué falta por ver**. Son dos preguntas distintas y cada
pantalla se queda con la suya — compartir el control habría ahorrado un
aprendizaje a costa de que el catálogo no pueda contestar lo único que se le
pregunta ahí.

### Cuánto se ve de cada ficha, y dónde vive

En el muro, una celda es **póster, marco y banda** — nada más. El detalle
—año, tipo, insignia de servicio, quién lo agregó, *ya la vimos* y *quitar*—
vive en una **hoja que sube desde abajo** al tocar la celda, con el velo
oscureciendo el muro. Es la misma pieza de dos actos del alta, al revés: el
alta baja un cajón para meter títulos, el catálogo sube una hoja para tocar
uno.

Y por eso el catálogo **es ese cajón sobre la sala**, no una pantalla propia:
la sala tiene un solo centro —la ruleta— y el catálogo se abre encima y se
vuelve a cerrar. La marquesina y la cuenta de arriba (`38 títulos · 16 en
cartelera · 13 vistas`) siguen siendo las de la sala.

### La regla del alta, verificada

Marcar una vista repinta **esa celda, sus hermanas de saga y la cabeza de su
pila** — nada más; los nodos ajenos son literalmente los mismos objetos del
DOM antes y después, comprobado en navegador. Las cuentas de los chips y de la
marquesina se actualizan en su lugar, sin volver a dibujar el muro.

### Lo que destapó

Nada nuevo en la niebla. Sí dos notas para la construcción de la v1:

- **La hoja inferior es una pieza compartida** con el alta y con el resultado
  del giro. Vale construirla una vez.
- **Los pósters van dibujados en el prototipo** porque el CSP del Artifact no
  deja traer `image.tmdb.org`. En la app real son los de TMDB, con la
  atribución que fijó [Pósters y streaming en México](002-posters-y-streaming-en-mexico.md).
