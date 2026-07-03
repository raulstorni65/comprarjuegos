# ComprarJuegos — sitio listo (estado SEO)

## Estructura completa (páginas fijas, todas creadas y enlazadas)
- `index.html` — home
- `ps4.html`, `ps5.html`, `ofertas.html` — catálogos (con filtros, grid, paginación y copy SEO)
- `buscar.html` — buscador del lado del cliente (lee `juegos.json`)
- `preguntas-frecuentes.html`, `medios-de-pago.html`, `garantia.html`, `devoluciones.html`, `terminos-y-condiciones.html`

## Templates para n8n (generan una página por ítem)
- `producto-ps4-template.html` — ficha de juego (mapa de agentes y placeholders en el `<head>`)
- `ps4-genero-template.html` — listado por género → `ps4-genero-{slug}.html`
- `ps4-desarrollador-template.html` — listado por desarrollador → `ps4-desarrollador-{slug}.html`
- `comprar-template.html` — checkout por juego (noindex)

## SEO implementado
- Convención de URLs unificada (plano `.html`), canonicals coherentes en todo el sitio.
- Structured data validado: Organization + WebSite (con buscador) + OnlineStore + FAQPage (home);
  Product/Offer + Breadcrumb + Video + FAQPage (ficha); CollectionPage + Breadcrumb (catálogos y templates);
  FAQPage con 8 preguntas (página de ayuda).
- Open Graph + Twitter Card completos en todas las páginas.
- `og-cover.png` (1200×630) para previews sociales.
- `favicon.svg` con la marca "C".
- Buscador cableado (Enter/botón → `/buscar?q=`).
- Copy unificado ("para todo el mundo hispanohablante" en todo el sitio).

## Archivos que mantiene tu flujo n8n
- `juegos.json` — índice para el buscador. Incluí un demo con 8 títulos; tu flujo lo sobrescribe
  con el catálogo real. Formato: `[{ "titulo","slug","plataforma","ref","precio" }]`.
- `sitemap.xml` — para 8.000+ fichas usá **sitemap index** (está explicado en el propio archivo).

## Lo único que TE queda por definir (datos, no código)
1. Email real (hoy `hola@comprarjuegos.com`) en footer y checkout.
2. Handle de X real (en el schema Organization de la home, hoy `x.com/comprarjuegos`).
3. Footer: "Razón social y datos fiscales a completar".
4. Requisitos legales de e-commerce por país (Argentina: botón de arrepentimiento, Data Fiscal
   AFIP, Defensa del Consumidor). Hay una nota en el footer de cada página.

## Hosting (importante)
Servir desde la raíz del dominio. El buscador usa `/juegos.json` y `/buscar?q=`, así que tienen
que resolver desde `https://www.comprarjuegos.com/`. Cualquier host estático sirve (Netlify,
Cloudflare Pages, nginx). URLs sin `.html` es opcional: en nginx `try_files $uri $uri.html $uri/ =404;`.
