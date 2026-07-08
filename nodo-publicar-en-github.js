// "Publicar en GitHub" · Code · runOnceForAllItems · HTML + imágenes + juegos.json (1 commit)
// CAMBIOS:
//  - juegos.json se lee del MISMO commit base vía la API autenticada (antes se leía de
//    raw.githubusercontent, que cachea hasta 5 min → índices viejos que "hacían desaparecer" juegos).
//  - Si la lectura del índice falla por algo que NO sea un 404 (primera vez), el nodo ABORTA
//    en vez de seguir con un índice vacío (antes el catch silencioso pisaba todo el catálogo).
//  - El token sale de una variable de entorno, no del código. En tu docker de n8n agregá:
//    -e GITHUB_TOKEN=github_pat_XXXX   (y rotá el token viejo, quedó expuesto)
const GITHUB_TOKEN = $env.GITHUB_TOKEN;
if (!GITHUB_TOKEN) throw new Error('Falta la variable de entorno GITHUB_TOKEN en n8n.');
const GITHUB_OWNER = 'raulstorni65';
const GITHUB_REPO = 'comprarjuegos';
const GITHUB_BRANCH = 'main';
const http = this.helpers.httpRequest.bind(this);
const item = $input.first().json;
const api = (method, path, body) => http({ method, url: `https://api.github.com${path}`, body, json: true, headers: { Authorization: `token ${GITHUB_TOKEN}`, 'User-Agent': 'comprarjuegos-n8n', Accept: 'application/vnd.github+json' } });

// 1) Ref y commit base PRIMERO: todo lo demás se lee y se construye sobre este commit.
const ref = await api('GET', `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/ref/heads/${GITHUB_BRANCH}`);
const baseSha = ref.object.sha;
const baseCommit = await api('GET', `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/commits/${baseSha}`);

// 2) Archivos: HTML + imágenes descargadas
const files = [{ path: item.filename, content: item.html, encoding: 'utf-8' }];
for (const im of (item.images || [])) files.push({ path: im.path, content: im.base64, encoding: 'base64' });

// 3) juegos.json leído del commit base (fresco y consistente; sin CDN de por medio)
let indice = [];
try {
  const cur = await api('GET', `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/juegos.json?ref=${baseSha}`);
  const parsed = JSON.parse(Buffer.from(cur.content, 'base64').toString('utf-8'));
  if (!Array.isArray(parsed)) throw new Error('juegos.json existe pero no es un array');
  indice = parsed;
} catch (e) {
  const msg = String(e?.message || e);
  const es404 = /404|Not Found/i.test(msg);
  if (!es404) throw new Error('No pude leer juegos.json del repo; ABORTO para no pisar el índice. Detalle: ' + msg);
  // 404 legítimo = primera publicación: el índice arranca vacío.
}

if (item.indice && item.indice.slug) {
  indice = indice.filter((g) => g.slug !== item.indice.slug); // evita duplicados al republicar
  indice.push(item.indice);
  files.push({ path: 'juegos.json', content: JSON.stringify(indice, null, 2), encoding: 'utf-8' });
}

// 4) sitemap.xml regenerado desde el índice (páginas fijas + todas las fichas)
const SITE = 'https://www.comprarjuegos.com';
const estaticas = ['', 'ps4.html', 'ps5.html', 'ofertas.html', 'preguntas-frecuentes.html', 'medios-de-pago.html', 'garantia.html', 'devoluciones.html', 'terminos-y-condiciones.html'];
const hoy = new Date().toISOString().slice(0, 10);
const urls = estaticas.map((x) => `${SITE}/${x}`).concat(indice.map((g) => `${SITE}/ps4-${g.slug}.html`));
const sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls.map((u) => `  <url><loc>${u}</loc><lastmod>${hoy}</lastmod></url>`).join('\n') + '\n</urlset>\n';
files.push({ path: 'sitemap.xml', content: sitemap, encoding: 'utf-8' });

// 5) Commit único con la Git Data API (un solo deploy en Vercel).
//    Si otra ejecución commiteó en el medio, el PATCH falla con "not a fast forward"
//    y la ejecución da error SIN romper nada: se reintenta y listo. No corras dos a la vez.
const tree = [];
for (const f of files) {
  const blob = await api('POST', `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/blobs`, { content: f.content, encoding: f.encoding });
  tree.push({ path: f.path, mode: '100644', type: 'blob', sha: blob.sha });
}
const newTree = await api('POST', `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/trees`, { base_tree: baseCommit.tree.sha, tree });
const commit = await api('POST', `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/commits`, { message: `Ficha: ${item.titulo}`, tree: newTree.sha, parents: [baseSha] });
await api('PATCH', `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/refs/heads/${GITHUB_BRANCH}`, { sha: commit.sha });

return [{ json: { ...item, commit: commit.sha, archivos: files.map((f) => f.path), juegos_en_indice: indice.length } }];
