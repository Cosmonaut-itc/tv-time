# La firma de la casa

- **Tipo**: `wayfinder:task` (AFK, con aceptación HITL en el iPhone)
- **Estado**: abierto
- **Asignado**: sesión de Claude (orquestación) · `gpt-5.6-luna`·`low` (implementación) · `gpt-5.6-sol`·`high` (review)
- **Bloqueado por**: [Otra sala](021-otra-sala.md)
- **Mapa**: [La sala de cine](../map.md)
- **Prototipo**: [`prototypes/firma-de-la-casa.html`](../../prototypes/firma-de-la-casa.html) (enlace jugable en los *Assets* del mapa)

## Question

*«Hecho con amor por Félix y Claude»* con el cangrejito al lado entró como pie de
la sala cuando el dueño mandó quitar de ahí la atribución de TMDB. Funcionó, y
al usarla desde el iPhone destapó tres cosas que no se habían pensado.

**La firma es de una sala, no del producto.** [Otra sala](021-otra-sala.md) hizo
que haya salas que no son de esta casa, y la frase las firma a todas: una sala de
Ana y Bruno dice que la hicieron Félix y Claude, que no es verdad de esa sala —es
verdad del software—. **La firma se queda sólo en la sala de Félix y Sofía**; en
las demás el pie va vacío. Vacío de verdad: caer al pie de TMDB desharía en
silencio la decisión anterior del dueño, *TMDB sólo en la taquilla*.

**Y la sala se reconoce por sus butacas**, como ya decidió el dueño para el
llavero. No por `salaId`, que es distinto entre dev y producción y volvería la
firma una constante de despliegue.

**Hay que bajar mucho la pantalla para leerla.** La firma vive al final del
`<main>`, debajo del escenario —que es casi una pantalla completa de alto— y de
la bitácora. Ya se le subió la tinta una vez y siguió perdiéndose, así que esta
vez el problema no es el color: **es dónde está**. Dónde queda es decisión del
dueño sobre el prototipo.

**El cangrejito debería moverse.** Un easter egg: *«cada cierto tiempo que haga
una animación, que salude o que salte»*. Cada cierto tiempo, no siempre: una
mascota que se mueve sin parar deja de ser un hallazgo y se vuelve ruido al lado
de una frase que se lee una vez. Qué hace —saludar, saltar u otra— es la segunda
decisión del dueño sobre el prototipo.

### Las dos decisiones del dueño sobre el prototipo

**La firma se borda en el telón.** Sobre el terciopelo del escenario en reposo,
con la tipografía de la marquesina y en grande. Gana a las otras dos por lo mismo
que las descarta: al pie sigue pidiendo bajar hasta el final —el problema que
abrió este ticket—, y de subtítulo de la marquesina se lee, pero vuelve a ser una
línea chica más entre el conteo y los focos. En el telón la frase es lo único que
hay que ver mientras la sala está quieta, **y se va sola cuando el telón abre**:
la firma no compite nunca con la función, que es la regla que hace que quepa
tan grande sin estorbar.

**El cangrejito saluda, cada minuto.** Levanta una patita y la ondea dos veces.
Es el gesto que se lee a tamaño de texto y el que se siente dirigido a quien lo
alcanzó a ver. Y cada minuto, no cada diez segundos: quien lo ve es porque se
quedó mirando, que es exactamente lo que hace que sea un hallazgo y no decorado.

### Lo que ya está decidido al construir

**Nada de esto toca Convex.** Ni una función nueva, ni un campo, ni superficie
pública: las butacas de la sala ya viajan al cliente desde
[Entrar a la sala](013-entrar-a-la-sala.md).

**El movimiento se apaga cuando el aparato lo pide.** `prefers-reduced-motion`
manda, como en el resto de la sala.

**Fuera**: firmar la taquilla, un campo de «autor» en el esquema, y cualquier
idea de personalizar la frase por sala. La firma no es un ajuste: es de la casa.

### Lo que dejó la review adversarial

**Se corrigió**: la firma se quedaba *encima* del conteo. El velo de la cuenta
atrás cubre el escenario por debajo del telón, así que una firma en `z-index: 7`
apagándose en 320 ms se leía sobre el primer número —y con movimiento reducido,
sobre los tres, porque el apagado dura más que el conteo entero—. Ahora pierde la
capa además de la opacidad: baja a `z-index: 1` en el mismo cuadro en que el
telón se mueve, y el apagado suave se guarda para las noches sin conteo.

**No se corrigió, y por qué.** Otra sala podría apropiarse de la firma si alguien
bautiza sus butacas *Félix* y *Sofía*: es el precio de reconocer la casa por sus
butacas y no por `salaId`, que es la decisión de arriba y no se revierte por un
caso que sólo se alcanza a propósito. El pie de TMDB en `cargando` y en «elige tu
butaca» no lo trajo este ticket y esas dos pantallas son la taquilla. Y la sala
de la casa vacía no lleva firma porque la marquesina apagada ya ocupa ese centro
con su invitación: dos textos en el mismo sitio es peor que ninguno.

Al cerrar: desplegada, y **vista desde el iPhone sin tener que buscarla** — la
frase legible en la sala de Félix y Sofía, ausente en una sala nueva, y el
cangrejito sorprendiendo al menos una vez sin que nadie lo estuviera esperando.
