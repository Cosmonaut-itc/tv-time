# `apple-touch-startup-image` en iOS 26: evidencia y experimentos

Fecha de consulta: 2026-08-12. Alcance: fuentes primarias públicas (Apple, WebKit y W3C) y los hechos empíricos del handoff. Este documento no afirma haber probado el flujo en un dispositivo.

## Veredicto operativo

No hay evidencia primaria pública de que iOS 26 haya eliminado `apple-touch-startup-image`. Al contrario, [WebKit dice que iOS 26 no retira soporte existente de web apps](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/) y Apple todavía conserva la [documentación del link de arranque](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html#//apple_ref/doc/uid/TP40002051-CH3-SW6). Sin embargo, esa documentación es archivada (actualizada en 2016), sólo muestra PNG y no define formatos, dimensiones modernas, orden ni algoritmo de selección.

La limitación decisiva es arquitectónica: un ingeniero de WebKit señaló que `apple-touch-startup-image` es una función de Safari, y otro cerró el bug de orientación porque la causa estaba **fuera de WebKit** ([WebKit bug 241799, comentarios 1 y 3](https://bugs.webkit.org/show_bug.cgi?id=241799#c1)). El árbol abierto actual de WebKit no expone una clase de startup image: su parser de relaciones reconoce iconos touch y manifest, pero no startup image ([`LinkRelAttribute.cpp`, revisión consultada](https://github.com/WebKit/WebKit/blob/4cb75e05600d142f19d71730baafbe0b7455d8f3/Source/WebCore/html/LinkRelAttribute.cpp#L52-L69)); además, el enum público de iconos sólo contiene `Favicon`, `TouchIcon` y `TouchPrecomposedIcon` ([`LinkIconType.h`](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/html/LinkIconType.h#L30-L36)). Esto indica que la adquisición pertenece a Safari/iOS no abierto; su ausencia en WebCore **no demuestra eliminación**. Por ello no se puede demostrar desde código abierto qué link gana o qué decodificador usa iOS 26.

La siguiente vuelta con mayor poder de discriminación es: **HTTPS, un único link estático, PNG opaco de 1320×2868, sin `media`, instalado de nuevo con “Open as Web App” activo**. Cambia varias variables, por lo que sirve como prueba de existencia rápida, no como aislamiento causal. Si funciona, aislar en vueltas posteriores HTTPS/HTTP y PNG/JPEG. Si falla, todavía no prueba eliminación global: debe compararse con un fixture mínimo independiente y, de ser posible, otra versión/dispositivo real.

## Respuestas a las siete preguntas

### 1. HTTPS o contexto seguro

- **Evidencia:** iOS/iPadOS permite A2HS desde un documento con URL **HTTP o HTTPS**; WebKit lo enumera explícitamente para navegadores de terceros ([Web Push for Web Apps, requisito 3](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/#third-party-browser-support-for-add-to-home-screen)) y la documentación actual de `WKWebView` repite HTTP o HTTPS ([Apple](https://developer.apple.com/documentation/webkit/wkwebview)). iOS 26 además anuncia “zero requirements for installability” ([WebKit](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/#every-site-can-be-a-web-app-on-ios-and-ipados)).
- **Límite:** ninguna fuente localizada dice que la **descarga/caché del startup image** funcione igual sobre HTTP, ni que exija un contexto seguro. A2HS sobre HTTP no prueba startup image sobre HTTP.
- **Conclusión:** HTTPS es una hipótesis válida y barata, pero **no un requisito documentado** de `apple-touch-startup-image`.

### 2. Formatos: PNG frente a JPEG

- **Evidencia fuerte:** la única receta de Apple usa `/launch.png` ([Safari Web Content Guide](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html#//apple_ref/doc/uid/TP40002051-CH3-SW6)). Apple no dice ahí “sólo PNG”.
- **Evidencia débil pero relevante:** un bug oficial aún abierto informa que, desde iOS 17.6.1 y también iOS 18, fallan `data:`/`blob:` y que archivos PNG separados sí funcionan ([WebKit bug 280262](https://bugs.webkit.org/show_bug.cgi?id=280262)). Es un reporte reproducible de tercero aceptado en Bugzilla y vinculado a Radar, no una confirmación de ingeniería ni evidencia sobre JPEG.
- **Conclusión:** PNG es el formato con respaldo primario positivo; JPEG queda **sin contrato público**, no probado como incompatible.

### 3. Selección: orden, `media`, dimensiones y orientación

- Apple sólo documenta un link sin `media`; no publica orden, first/last match, tamaño exacto ni fallback ([Apple](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html#//apple_ref/doc/uid/TP40002051-CH3-SW6)). No debe extrapolarse el algoritmo documentado para `apple-touch-icon` a startup images.
- El [bug 259328](https://bugs.webkit.org/show_bug.cgi?id=259328) aporta evidencia de que iOS elige y conserva al instalar la variante de `prefers-color-scheme`; no la reevalúa al lanzar tras cambiar el modo. El [bug 241799](https://bugs.webkit.org/show_bug.cgi?id=241799) demuestra que existe selección por `media`, pero que en iPad la orientación podía ignorarse y la imagen estirarse; Apple confirmó que la causa estaba fuera de WebKit.
- **Inferencia:** la instalación parece materializar/cachear una elección realizada con el entorno de instalación. Esto concuerda con el handoff, pero no revela si gana el primer o último match ni qué viewport usa iOS 26.

### 4. Manifest `display` frente a `apple-mobile-web-app-capable`

- Hasta iOS 25, WebKit describe dos rutas equivalentes para abrir como web app: meta tag o manifest con `display`; desde iOS 26 cualquier sitio puede abrir como web app si el usuario deja activo “Open as Web App” ([Safari 26](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/#every-site-can-be-a-web-app-on-ios-and-ipados)). En iOS 16.4, un manifest con `display: standalone` o `fullscreen` abría como web app, y sin manifest ni meta era bookmark ([WebKit](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)).
- El estándar de Web App Manifest define [`display`](https://www.w3.org/TR/appmanifest/#display-member) y [`background_color`](https://www.w3.org/TR/appmanifest/#background_color-member), pero no `apple-touch-startup-image`; tampoco especifica que el manifest desactive extensiones propietarias del HTML.
- **No hay evidencia primaria** de que usar manifest suprima `apple-touch-startup-image`, ni de precedencia entre manifest/meta para el telón. La documentación antigua presenta startup image y meta capaz como ajustes del mismo modo standalone, no como alternativas excluyentes ([Apple](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)).
- En iOS 26, quitar ambos ya no garantiza un bookmark: el toggle del usuario decide. Todo experimento debe registrar ese toggle.

### 5. ¿Eliminada, deprecada o rota en WebKit/iOS 26?

- No se encontró anuncio de deprecación/eliminación en las [notas de Safari 26](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/) ni en las [notas de iOS/iPadOS 26](https://developer.apple.com/documentation/ios-ipados-release-notes/ios-ipados-26-release-notes). Safari 26 declara expresamente que el nuevo modelo no elimina soporte existente de web apps.
- Eso **no prueba** que startup images sigan funcionando: la función reside fuera del WebKit abierto y la documentación vigente es archivada. Los bugs abiertos 259328 y 280262 prueban degradaciones históricas parciales, no eliminación total en iOS 26.
- Estado correcto: **no establecida la eliminación; compatibilidad actual no documentada suficientemente y requiere dispositivo real**.

### 6. Fidelidad de iOS Simulator

- Apple recomienda Simulator para prototipar y probar web apps, pero advierte que no debe ser el único medio: rendimiento, red, hardware y algunas APIs difieren ([Testing and Debugging in Simulator](https://developer.apple.com/library/archive/documentation/IDEs/Conceptual/iOS_Simulator_Guide/TestingontheiOSSimulator/TestingontheiOSSimulator.html)). Apple también ofrece runtimes/dispositivos Simulator específicamente para desarrollo web ([Installing Xcode and Simulators](https://developer.apple.com/documentation/safari-developer-tools/installing-xcode-and-simulators)).
- No se encontró una garantía primaria de paridad para A2HS ni para su startup-image cache. Por tanto, Simulator sirve para iterar HTML, A2HS y observación comparativa, **no para cerrar aceptación ni declarar compatibilidad de iOS 26**. El cierre debe permanecer en iPhone real, como exige el ticket.

### 7. Hipótesis nuevas comprobables

Además de HTTPS, PNG, media/order y manifest/meta: (a) el recurso puede ser descartado por respuesta HTTP incorrecta o no cacheable; (b) el estado “Open as Web App” puede no coincidir entre instalaciones; (c) el startup image puede elegirse una sola vez con preferencias de instalación; (d) el fixture Next puede introducir una variable frente a HTML mínimo; (e) el negro puede ser la instantánea/fallback por fallo de adquisición, no una selección de imagen negra.

## Matriz de hipótesis y refutación mínima

| Hipótesis | A favor | En contra / límite | Experimento mínimo capaz de refutarla |
|---|---|---|---|
| H1. HTTP impide cachear el telón | Todas las vueltas fueron HTTP; no existe prueba HTTPS | A2HS acepta HTTP oficialmente; no hay requisito seguro documentado | Mismo único PNG y HTML, dos orígenes idénticos HTTP/HTTPS, borrar e instalar cada uno. Si ambos muestran telón, H1 cae |
| H2. JPEG no es admitido | Apple sólo ejemplifica PNG; bug 280262 informa PNG externo funcional | Apple no declara “PNG only”; JPEG no está formalmente rechazado | En mismo origen/HTML, alternar únicamente bytes+MIME PNG/JPEG de idénticas dimensiones. JPEG visible derriba incompatibilidad total |
| H3. Las múltiples `media` u orden dejan cero/otro candidato | Algoritmo no documentado; bugs confirman selección/caché por media imperfecta | El comodín actual debió ofrecer candidato, salvo semántica desconocida | Un único link sin `media`. Si sigue negro, múltiples links/orden no son causa suficiente |
| H4. Dimensiones del recurso deben coincidir exactamente con el panel real | Apple remite a tamaños de launch screen; handoff ve dos geometrías | No hay regla moderna publicada ni código abierto | Un único PNG 1320×2868 sin media. Si aparece, refuta que deba usar 1242×2688 por el viewport de Safari |
| H5. Manifest y meta interfieren | iOS ha cambiado quién decide modo web app | Apple/WebKit presentan ambas rutas; no documentan exclusión del startup image | Fixture 2×2: manifest sí/no × meta sí/no, siempre registrar “Open as Web App”. Un caso funcional identifica interacción; igualdad refuta que sea suficiente |
| H6. iOS 26 eliminó totalmente la función | Tres fallos reales; docs antiguas; implementación cerrada | Sin anuncio; Safari 26 niega retirar soporte existente en general | Fixture HTML mínimo público, HTTPS, un PNG opaco y correcto, reinstalado en dos dispositivos/versiones. Una sola aparición en iOS 26 refuta eliminación total |
| H7. Respuesta del recurso es inválida para el instalador | Aún no se registró la petición/respuesta de adquisición | El recurso carga dentro de la página, pero ese camino no prueba el instalador | Servir PNG con `200`, `Content-Type: image/png`, `Content-Length`, sin auth/redirección y URL única; registrar acceso del servidor al instalar. Aparición con esos headers refuta que WebKit necesite algo adicional básico |
| H8. La selección se congela al instalar | Bug 259328 reproduce persistencia de variante clara/oscura | Es reporte, no algoritmo publicado; no prueba dimensiones | Dos PNG de colores sólidos por `prefers-color-scheme`; instalar en claro, cambiar a oscuro y lanzar. Si cambia sin reinstalar, H8 cae |
| H9. Next/metadata es la variable | HTML generado tiene links, pero el consumidor cerrado puede tener requisitos de timing/forma | Los links constan estáticos según handoff | Publicar HTML estático mínimo equivalente en otra ruta/origen. Si también falla, Next no es causa suficiente |
| H10. Simulator reproduce fielmente A2HS startup images | Apple lo recomienda para web apps y acelera rondas | Apple niega paridad general y no garantiza este flujo | Ejecutar el mismo fixture/reinstalación en Simulator 26.5 y iPhone 26.6. Cualquier divergencia refuta fidelidad para este caso |

## Orden de ejecución sugerido

1. Fixture mínimo HTTPS con un PNG 1320×2868 opaco, un link sin `media`, `200 image/png`, URL cache-busteada, y toggle “Open as Web App” registrado.
2. Si funciona: cambiar sólo HTTPS→HTTP; luego sólo PNG→JPEG; luego introducir una `media`; finalmente la matriz completa.
3. Si no funciona: ejecutar el mismo fixture en Simulator 26.5 y en otra versión/dispositivo real, pero no usar Simulator para el veredicto.
4. Grabar cada primer arranque después de borrar/reinstalar y conservar logs de petición. No declarar victoria por DOM, `matchMedia` ni porque el recurso abra en Safari.

## Consultas reproducibles y límites

Consultas realizadas:

```sh
curl -L 'https://api.github.com/repos/WebKit/WebKit/git/trees/main?recursive=1'
xcodebuild -version
xcrun simctl list runtimes
xcrun simctl list devices available
```

También se buscaron en Apple Developer, WebKit Blog, WebKit Bugzilla y el repositorio oficial de WebKit: `apple-touch-startup-image`, `startup image`, `Add to Home Screen`, `manifest display`, `Simulator` y `orientation`. Entorno local observado: Xcode 26.6; runtimes iOS 18.5, 26.2 y 26.5; Simulator iPhone 17 Pro Max 26.5 disponible.

Límites: no se inspeccionó código propietario de Safari/SpringBoard; no hubo captura de tráfico de instalación; no se instaló el fixture en este pase; los bugs 259328 y 280262 son reportes públicos aún abiertos, no resoluciones de ingeniería; la documentación Apple de startup image es archivada. Por eso el informe orienta experimentos y **no certifica** soporte o eliminación en iOS 26.6.
