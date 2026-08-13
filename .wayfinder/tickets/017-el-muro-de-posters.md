# El muro de pósters

- **Tipo**: `wayfinder:task` (AFK, con aceptación HITL en el iPhone)
- **Estado**: abierto
- **Asignado**: —
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
