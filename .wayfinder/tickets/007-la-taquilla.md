# La taquilla

- **Tipo**: `wayfinder:grilling` (HITL)
- **Estado**: cerrado
- **Asignado**: sesión de Claude (taquilla)
- **Bloqueado por**: — (~~El idioma de la sala~~, cerrado)
- **Mapa**: [La sala de cine](../map.md)

## Question

El código de 6 caracteres identifica la sala y es lo único que la protege. ¿Qué tan fuerte tiene que ser y cómo se comporta?

- **Alfabeto y formato**: ¿mayúsculas y números? ¿se excluyen los caracteres que se confunden (O/0, I/1)? ¿se acepta escrito en minúsculas?
- **Fuerza bruta**: cuántos intentos se permiten y desde dónde se cuentan. Con un solo código válido en el universo, un bot que pruebe 30 millones de combinaciones entra.
- **Cómo lo recuerda el navegador**: cookie, `localStorage`, o el código en la URL después de entrar. Qué pasa cuando ella abre el link en un cel nuevo.
- **Rotación**: cómo se cambia el código si se filtra, y qué pasa con el dispositivo que ya estaba dentro.
- **Qué protege exactamente**: ¿sólo entrar, o también escribir? ¿Un tercero con el código puede borrar el catálogo?
- **Butacas**: la butaca es la persona y el aparato sólo recuerda la última usada (ya en `CONTEXT.md`). Falta cómo se ve eso: si se elige al entrar cada vez, si se cambia con un toque desde dentro, y qué pasa la primera vez que la sala no sabe quién eres.

## Resolución

### El código

**Seis caracteres de un alfabeto de 32**: los dígitos y las mayúsculas quitando `I`, `L`, `O` y `U`. Las tres primeras porque se confunden al dictarlas; la `U` porque sin ella ningún código sale siendo una grosería por accidente. Son **1,073,741,824 combinaciones** — más que las 2,176 millones de las 36 con ambigüedades adentro, pero se dictan sin errores, que es lo que importa cuando el código viaja por WhatsApp o de viva voz.

Se escribe sin distinguir mayúsculas y la taquilla corrige lo obvio antes de buscar: `I` y `L` se leen como `1`, `O` como `0`. Nadie debería quedarse fuera por transcribir mal lo que le dictaron.

Con código equivocado, la taquilla lo dice claro — «no hay ninguna sala con ese código». Fingir ambigüedad no protege nada cuando el espacio es de mil millones; lo que protege es el freno.

### La entrada

**Un link que se limpia solo.** `cine.felixddhs.dev/T4K9RM` se manda por WhatsApp; al abrirlo la sala guarda el código y reemplaza la dirección por la raíz. El código no queda en la barra, ni en el historial, ni en una captura de pantalla. La taquilla también acepta escribirlo a mano.

**Se recuerda para siempre**, con un botón discreto de salir. Ver más abajo lo que iOS opina de «para siempre».

**El código se muestra dentro de la sala**, en el cajón de ajustes. No estaba en la pregunta: lo obliga la combinación de las otras respuestas — si el link se limpia y el navegador puede olvidar, la única copia del código quedaría en un WhatsApp viejo. Adentro siempre se puede volver a leer y volver a mandar.

### Las defensas — las tres

- **Freno a los intentos.** Tras varios códigos fallidos seguidos, la taquilla se traba unos minutos. Contado en el servidor, no en el navegador. Con mil millones de combinaciones un bot sin freno tardaría años; con freno, siglos.
- **Confirmación en lo que borra.** Quitar un título del catálogo o vaciar el historial pide confirmar. Protege sobre todo contra un dedo torpe, que es el riesgo real cuando comparten un celular.
- **El código se puede cambiar** desde dentro. El aparato que lo cambia se queda dentro; el otro vuelve a entrar con el nuevo.

**Más allá del código no hay niveles.** Quien tiene el código es de la casa: agrega, marca visto, veta y borra. No hay lectura sin escritura ni butaca con más permisos que la otra — la butaca es autoría, nunca permiso.

### La butaca

Se pregunta **una vez por noche**, con el mismo corte de las 5 a.m. que reparte los vetos — una sola idea de tiempo en toda la sala. Recargar no vuelve a preguntar; una noche nueva sí.

Es una **puerta de un toque**: dos butacas grandes con los nombres, y la línea que abre la noche. Obligatoria, porque la autoría es el único dato para el que la butaca existe y un título sin autor la vuelve decorativa. Desde dentro se cambia con un toque, para las noches en que agrega Sofía desde el celular de Félix.

Se eligió contra «una vez y ya» porque comparten un celular: el aparato no puede saber quién llegó primero, y preguntarlo cada noche es más honesto que suponerlo.

**No toca el esquema.** La butaca de la noche vive en el navegador junto al código — `{ butaca, noche }` — porque es un dato del aparato, no de la sala. [La forma de los datos](006-la-forma-de-los-datos.md) se queda como está.

### Lo que iOS le hace a «para siempre»

Dos hechos verificados que cambian el alcance de la respuesta:

1. **Safari borra el almacenamiento del sitio tras 7 días sin visita.** Es la política de ITP. Una pareja que se salta dos semanas vuelve y encuentra la taquilla.
2. **Una app instalada en la pantalla de inicio queda exenta de ese contador**, porque no cuenta como uso de Safari y tiene su propio almacenamiento, separado.

O sea que en iPhone **el «para siempre» sólo es verdad si la sala está instalada**. Eso mueve la PWA de adorno a requisito, y trae su propio precio: el almacenamiento de la app instalada no hereda el de Safari, así que instalarla obliga a escribir el código una vez más adentro. Salió como [La sala instalada](010-la-sala-instalada.md).

Fuentes: [PWA iOS limitations](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide) · [estado compartido entre PWA y Safari en iOS](https://www.netguru.com/blog/how-to-share-session-cookie-or-state-between-pwa-in-standalone-mode-and-safari-on-ios)
