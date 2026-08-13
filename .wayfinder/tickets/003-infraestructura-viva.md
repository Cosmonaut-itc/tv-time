# Infraestructura viva

- **Tipo**: `wayfinder:task` (HITL donde haga falta autenticarse, AFK en lo demás)
- **Estado**: cerrado
- **Asignado**: sesión de Claude (infraestructura)
- **Bloqueado por**: —
- **Mapa**: [La sala de cine](../map.md)

## Question

No hay nada que decidir: hay que dejar el terreno listo para que cualquier ticket posterior pueda desplegar sin fricción.

- Repositorio inicializado con git en `/Users/felixddhs/VSCODE/REPOS/tv-time`.
- Proyecto Next.js (App Router) enlazado a un proyecto de Vercel.
- Proyecto Convex creado y conectado, con sus variables en Vercel.
- `cine.felixddhs.dev` apuntando al proyecto, con certificado emitido y respondiendo.
- API key de TMDB obtenida y guardada donde corresponde (nunca en el repo).
- `noindex` en producción — esta sala no se indexa.

Al cerrar, el ticket registra: URLs reales, dónde quedó cada credencial, y qué comandos levantan el proyecto en local.

## Resolución

Terreno puesto, desplegado y verificado en vivo. Ningún ticket posterior tiene que pelearse con infraestructura.

### URLs reales

| Qué | Dónde |
| --- | --- |
| La sala | https://cine.felixddhs.dev — HTTPS con certificado válido, respondiendo 200 |
| Proyecto en Vercel | `felix-de-haros-projects/cine` · https://vercel.com/felix-de-haros-projects/cine |
| Deployment de producción | https://cine-mbbhxlc4c-felix-de-haros-projects.vercel.app |
| Convex — producción | https://focused-llama-513.convex.cloud |
| Convex — desarrollo | https://zany-dodo-524.convex.cloud |
| Dashboard de Convex | https://dashboard.convex.dev/t/felix-de-haro/cine |

### Dónde quedó cada credencial

Ninguna vive en el repo: `.gitignore` ya excluye `.env*` y `.vercel`.

- **`CONVEX_DEPLOY_KEY`** — sólo en Vercel, entorno *Production*, marcado como sensible. Se creó con `npx convex deployment token create vercel-prod --prod` y se canalizó directo a `vercel env add` sin tocar el disco. Es lo que permite que el build de producción publique las funciones de Convex.
- **`NEXT_PUBLIC_CONVEX_URL`** — en producción **no** se configura a mano: `npx convex deploy --cmd` la inyecta durante el build apuntando al deployment correcto. En *Preview* está fijada al deployment de desarrollo, para que las previews no escriban en el backend real.
- **`CONVEX_DEPLOYMENT`, `NEXT_PUBLIC_CONVEX_URL`, `NEXT_PUBLIC_CONVEX_SITE_URL`, `VERCEL_OIDC_TOKEN`** — en `.env.local`, generados por las CLIs, fuera de git.
- **Sesión de Convex** — `~/.convex/config.json`, ya autenticada en esta máquina.

### El `noindex`

Doble candado, y sin condicionar a producción: esta sala no se indexa nunca, ni en preview.

- `app/layout.tsx` → `robots: { index: false, follow: false, nocache: true }`, verificado en vivo como `<meta name="robots" content="noindex, nofollow, nocache">`.
- `app/robots.ts` → `Disallow: /`, verificado en https://cine.felixddhs.dev/robots.txt.

### Cómo se levanta en local

```sh
pnpm install
npx convex dev     # una terminal: backend + codegen en caliente
pnpm dev           # otra terminal: http://localhost:3000
```

Para desplegar a mano: `vercel deploy --prod --yes`.

### Decisiones de implementación tomadas aquí

- **Sin Tailwind.** El art déco del prototipo es CSS escrito a mano; CSS plano y CSS Modules es lo que ya existe. Reversible.
- **`vercel.json` en vez de `vercel.ts`**, para no sumar la dependencia `@vercel/config` por una sola línea. El `buildCommand` es condicional: si hay `CONVEX_DEPLOY_KEY` corre `npx convex deploy --cmd 'pnpm build'`, si no, sólo `pnpm build` — así las previews compilan sin llave de despliegue.
- **CLI de Vercel desactualizada** (54.18.0 → 58.9.5). No bloquea nada; conviene `pnpm add -g vercel@latest` cuando haya rato.

### La credencial de TMDB

Es el **API Read Access Token** (el JWT largo de https://www.themoviedb.org/settings/api), no la API Key. Ambos sirven contra los mismos endpoints v3, pero el token viaja en `Authorization: Bearer` en vez de pegado a la URL como `?api_key=`, y una credencial en la query string se cuela en logs, trazas de error y proxies. De ahí el nombre de la variable: `TMDB_API_KEY` invitaría a mandarla como query param.

Vive **sólo en Convex**, en los dos deployments, puesta por Félix:

```sh
npx convex env set TMDB_READ_TOKEN '<el token>'
npx convex env set --prod TMDB_READ_TOKEN '<el token>'
```

Ahí porque la credencial no puede terminar en el navegador y una action es el lugar natural para la llamada. Presencia confirmada en ambos deployments; su *validez* la probará la primera llamada real — si TMDB devuelve 401, se regenera y se vuelve a poner con los mismos dos comandos. Si [La forma de los datos](006-la-forma-de-los-datos.md) acabara moviendo las llamadas a un route handler de Next, se duplica con `vercel env add TMDB_READ_TOKEN production`.
