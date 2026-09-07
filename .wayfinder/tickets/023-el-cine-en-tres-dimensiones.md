# El cine en tres dimensiones

- **Tipo**: `wayfinder:task` (AFK, con aceptación HITL en el iPhone)
- **Estado**: cerrado
- **Asignado**: sesión de Claude (orquestación) · `gpt-6-astra`·`medium` (dos encargos de implementación, tres de corrección y la review adversarial; `low` para el reencuadre del ganador) · `claude-opus-5` (pase de release)
- **Bloqueado por**: [La firma de la casa](022-la-firma-de-la-casa.md)
- **Mapa**: [La sala de cine](../map.md)
- **Prototipo**: [`prototypes/el-cine-3d.html`](../../prototypes/el-cine-3d.html) (enlace jugable en los *Assets* del mapa)

## Question

El dueño quiso saber en qué partes de la sala un poco de three.js subiría la
sensación de calidad sin volverla otra app. El grilling de dieciséis
decisiones lo acotó a **una sola pieza: el escenario**. El resto —taquilla,
muro, cajones, cabina— sigue siendo DOM y CSS, porque ahí lo que importa es
leer y tocar, no mirar.

**El escenario entero, en tres dimensiones.** El telón deja de ser dos
rectángulos con degradado: es terciopelo con pliegues por shader, que abre
con la misma curva de 1.15 s y se queda **recogido a los lados con alzapaños
de cuerda dorada** y borla —la imagen de referencia del dueño mandó ahí—, con
la cenefa fruncida delante. Los tres carretes son **tambores** con ocho
pósters alrededor, la luz del proyector salta entre ellos en el segundo acto
y el póster ganador **vuela del tambor a un marco de latón** con barniz. La
marquesina conserva sus focos DOM pero los halos se pintan en el mismo lienzo.
Todo procedural: ni un modelo, ni una textura descargada; los pósters son las
fotos de TMDB que ya usa la sala, con el dibujo crudo debajo mientras llegan.

**Sólo la tarjeta se mueve.** La cámara está clavada en el eje: ni el
giroscopio ni el ratón mueven la escena. Lo que se ladea es el cartel del
ganador —giroscopio con permiso pedido al jalar la palanca, hover sólo donde
hay ratón, y el arrastre con el dedo, que manda sobre los otros dos—. Fue una
corrección del dueño sobre la tercera revisión: la escena entera moviéndose
se sentía mareada.

**El CSS de hoy no se toca y sigue siendo la sala.** three.js llega tarde y
a propósito, por importación dinámica cuando el escenario CSS ya está
pintado; si no hay WebGL, si el aparato pide movimiento reducido, si el
módulo no carga o si el contexto se pierde a media función, la sala CSS
sigue sola y nadie se entera. Un solo contexto WebGL por página, píxeles a
razón ≤ 2, y un reloj de **20 cuadros en reposo, 60 mientras algo se mueve y
0 con la pestaña escondida**.

### Lo que ya está decidido al construir

**La máquina de fases sigue en React.** `ejecutarGiro` no cambia sus tiempos
ni sus esperas; la sala 3D es un obediente más al que se le pide lo mismo que
al CSS, por efectos sobre `fase`, `finalistas`, `elegido`, `ganador` y el
sello, y por tres llamadas imperativas: arrancar los tambores, pedir el
giroscopio y el paso de los focos.

**Nada de esto toca Convex.** Ni una función, ni un campo.

**Vanilla three.js, no react-three-fiber.** El prototipo aprobado son tres
mil líneas de módulos verificados en cuatro revisiones; reescribirlos en
componentes declarativos habría sido una implementación nueva sin
referencia. Los módulos conservan la frontera que tendrían en R3F —un
`Group` de entrada, `update` y setters de salida— por si algún día se
porta.

**Fuera**: modelos 3D descargados, postproceso o bloom, three.js en
cualquier otra pantalla, y mover la cámara.

### Lo que dejó la review adversarial

**El navegador destapó antes que la review.** Las fotos de TMDB llegaban al
CSS pero no al lienzo: el CDN manda `access-control-allow-origin` sólo cuando
la petición lleva `Origin` y no declara `Vary: Origin`, así que la caché HTTP
servía a la carga con `crossOrigin` la respuesta sin cabecera que los `<img>`
ya habían pedido. Trece errores por giro y tambores con el dibujo crudo. La
sala 3D pide ahora **sus propias URLs**, con `?cors=1`, para tener entrada
propia en la caché.

**La pose del ganador se mide, no se supone.** En el prototipo la ficha era
una sola línea; en la app el título, la saga y los chips de proveedores llegan
tarde y crecen. El marco de latón conserva su borde superior aprobado
(`TECHO_GANADOR`) y **sólo se encoge cuando la ficha lo pide**, proyectando
la altura medida de `.capa-3d .ficha` al plano del cartel; un primer intento
con techo de cenefa encogía el marco del iPhone de 239 a 147 px y se vetó en
el navegador.

**La review adversarial (astra, por lectura) dio NO APTO con seis hallazgos
importantes y dos menores**, todos corregidos: el cambio de meta a mitad del
vuelo saltaba cerca del aterrizaje (ahora la meta se suaviza también en
vuelo); la capa que React crea después del arranque no se medía; el cartel
ponía `touch-action: none` **en toda la sala** —el prototipo hacía lo mismo,
pero no tenía página que desplazar— y ahora es `pan-y` sólo en la banda del
escenario, así el dedo vertical desplaza y el horizontal ladea; el sello 3D
sobrevivía 600 ms al veto porque sólo se sincronizaba el flanco de entrada;
un fallo a mitad de `arrancar()` dejaba el contexto WebGL sin liberar; los
botones del ganador no garantizaban 44 px; las fichas retiradas seguían
observadas; y la caché de imágenes no tenía límite.

**El pase de release (`claude-opus-5`, por lectura, con los gates corridos por
él mismo) dio APTO CON CORRECCIONES y ninguna bloqueante.** Se aplicaron las
tres que valían el cambio: con el 3D encendido cada póster se bajaba dos veces
—los `<img>` de los carretes CSS se descargan aunque la pantalla esté en
`display: none`, y el 3D pide otra URL (`?cors=1`)— y el precalentado del
ticket 015 no alcanzaba a la ruta 3D, así que volvía el giro sobre huecos en red
lenta; ahora en 3D el carrete no monta la foto (la caja de la celda sigue para
medir) y se precalienta con `calentarPosters3D`. `medir()` reconstruía las dos
cuerdas de los alzapaños (`TubeGeometry`, ~650 vértices cada una) en cada
llamada, y en el iPhone la barra de direcciones dispara ráfagas de `resize`;
ahora sólo se rehacen si cambian los radios. Y los 44 px de los botones del
ganador llegaban sólo a la ruta 3D: la regla vale para las dos salas. Quedaron
sin cambiar, a propósito: vaciar la caché de imágenes al destruir la sala (con
una sola sala es correcto y el tope de 96 acota la memoria), el reloj que se
despierta a la frecuencia del panel aunque pinte a 20 (unas comparaciones por
cuadro, no vale el riesgo de tocar el bucle antes de estrenar), y el orden de
declaración de `observarFicha`/`despertar`, que sólo importa para el puerto a
r3f. Con Fast Refresh el 3D cae a CSS hasta recargar, porque `destruir()` pierde
el contexto del canvas que React reutiliza: está documentado en el efecto y no
ocurre en producción.

**El sello «VETADA» se estampa en mezcla normal** (corrección posterior al
cierre, pedida por el dueño): en el prototipo y en el primer despliegue se
mezclaba en aditivo, y sobre pósters claros (Forrest Gump, Amélie) el texto se
lavaba y sólo se leía el marco. Ahora la textura lleva una placa oscura
translúcida dentro del marco y una sombra corta bajo la tinta rosa, con
opacidad final 0.94, y se lee igual sobre cualquier póster; verificado en
navegador vetando Amélie. La entrada (0.42 s, escala 2.4→1) no cambió.

Al cerrar: desplegada, y **vista desde el iPhone**: el telón de terciopelo
abriendo y recogiéndose con sus cuerdas, los tambores girando a ritmo
dramático, el póster volando al marco y ladeándose con el aparato, y la
sala CSS de siempre cuando el 3D no puede.
