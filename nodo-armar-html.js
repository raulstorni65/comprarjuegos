// "Armar HTML" · Code · runOnceForAllItems
// CAMBIOS: template leído del REPO (no del sitio vivo), párrafos de la descripción
// arreglados, FORMATO real del sheet, límites de meta title/description, y
// sanity check estructural que manda a "revisar" si el HTML sale roto.
const http = this.helpers.httpRequest.bind(this);
const SITE = 'https://www.comprarjuegos.com';
const RAW_REPO = 'https://raw.githubusercontent.com/raulstorni65/comprarjuegos/main';

const inline = (s) => String(s ?? '').replace(/"/g, "'").replace(/[<>]/g, '').replace(/\s+/g, ' ').trim();
const slugify = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const clamp = (s, n) => { s = inline(s); return s.length <= n ? s : s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…'; };
function parseJSON(t){t=String(t||'').replace(/```json/gi,'').replace(/```/g,'').trim();const a=t.indexOf('{'),b=t.lastIndexOf('}');if(a>=0&&b>a)t=t.slice(a,b+1);try{return JSON.parse(t)}catch(e){return null}}

const dl = $('Descargar imágenes').first().json;
const ficha = parseJSON($('Agente Ficha').first().json.output) || {};
const desc = parseJSON($('Agente Descripción').first().json.output) || {};
const faqA = parseJSON($('Agente FAQ').first().json.output) || { preguntas: [] };
const seo = parseJSON($('Agente SEO').first().json.output) || {};
const qa = parseJSON($('Agente QA').first().json.output) || { ok: false, motivos: 'QA sin JSON' };
const rawg = dl.rawg || {};

const titulo = dl.titulo, slug = dl.slug;
const genero = rawg.genero || ficha.genero || 'Videojuego';
const desarrollador = rawg.desarrollador || ficha.desarrollador || ficha.editor || 'No especificado';
const editor = rawg.editor || ficha.editor || ficha.desarrollador || 'ComprarJuegos';
const anio = rawg.anio || ficha.anio || new Date().getFullYear();
const puntaje = rawg.puntaje_critica || ficha.puntaje_critica || null;
const jugadores = ficha.jugadores || '1 jugador';
const onlinePsPlus = ficha.online_psplus || 'Según el modo';
const saga = ficha.saga || genero;

const psStore = dl.psStore, precioVenta = dl.precioVenta;
const ahorro = (psStore && precioVenta && psStore > precioVenta) ? Math.round((1 - precioVenta / psStore) * 100) : 0;
const validoHasta = new Date(Date.now() + 365 * 864e5).toISOString().slice(0, 10);
const compatTexto = 'Sí, es retrocompatible: podés jugarlo en PS5.';
const trailer = dl.trailer || '';
const linkCompra = `checkout.html?slug=${encodeURIComponent(slug)}&titulo=${encodeURIComponent(titulo)}&precio=${precioVenta || ''}&img=${encodeURIComponent(dl.coverRef)}`;

// FORMATO real (antes estaba hardcodeado "Cuenta digital" y contradecía al FAQ)
const esCuenta = /cuenta/i.test(dl.formato || '');
const esCodigo = /c[oó]digo/i.test(dl.formato || '');
const formatoTexto = dl.esDigital ? (esCuenta ? 'Cuenta digital' : esCodigo ? 'Código digital' : 'Digital') : 'Físico';
const formatoBadge = dl.esDigital ? (esCuenta ? 'DIGITAL · CUENTA' : esCodigo ? 'DIGITAL · CÓDIGO' : 'DIGITAL') : 'FÍSICO';

const camposOk = desc.resumen && desc.descripcion && genero;
let qaOk = Boolean(qa.ok) && camposOk && ficha.confianza !== 'baja' && Boolean(precioVenta);
const motivosArr = [qa.ok ? '' : ('QA: ' + (qa.motivos || 'rechazado')), camposOk ? '' : 'faltan campos', ficha.confianza === 'baja' ? 'confianza baja' : '', precioVenta ? '' : 'sin precio'].filter(Boolean);

const faqBase = [
  { q: `¿${titulo} viene en español?`, a: `Este título viene en ${dl.idioma}, región ${dl.region}.` },
  { q: `¿${titulo} funciona en PS5?`, a: compatTexto },
  { q: `¿En qué moneda pago ${titulo}?`, a: 'Los precios están en dólares (USD). Tu banco o PayPal hace la conversión a tu moneda local al pagar.' },
];
const faqAll = [...faqBase, ...(faqA.preguntas || []).slice(0, 4).map((f) => ({ q: inline(f.pregunta), a: inline(f.respuesta) }))].filter((f) => f.q && f.a);
const faqItemsHtml = faqAll.map((f) => `<div class="faq-item"><button class="faq-q">${f.q}</button><div class="faq-a"><p>${f.a}</p></div></div>`).join('\n          ');
const faqSchema = `<script type="application/ld+json">\n${JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqAll.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) }, null, 2)}\n</script>`;

// Template desde el REPO (misma fuente que la publicación; el sitio vivo puede
// estar deployando una versión vieja). El ?t= evita el cache de la CDN de raw.
let html = String(await http({ method: 'GET', url: `${RAW_REPO}/producto-ps4-template.html?t=${Date.now()}`, json: false }));
if (!html.trimStart().startsWith('<!DOCTYPE')) throw new Error('El template bajado del repo no parece HTML válido; aborto.');

const drop = (n) => { html = html.replace(new RegExp('<!--\\s*BEGIN:' + n + '[\\s\\S]*?END:' + n + '[\\s\\S]*?-->', 'g'), ''); };
const keep = (n) => { html = html.replace(new RegExp('<!--\\s*BEGIN:' + n + '[\\s\\S]*?-->', 'g'), '').replace(new RegExp('<!--\\s*END:' + n + '[\\s\\S]*?-->', 'g'), ''); };
if (trailer) { keep('SCHEMA_VIDEO'); keep('TRAILER'); } else { drop('SCHEMA_VIDEO'); drop('TRAILER'); }
if (dl.esDigital) keep('INSTALACION'); else drop('INSTALACION');
drop('RESEÑAS'); keep('SIN_RESEÑAS');
html = html.replace('<!--FAQ_ITEMS-->', faqItemsHtml).replace('<!--FAQ_SCHEMA-->', faqSchema);
html = html.replace('<div class="spec-row"><span>Peso</span><b>{{PESO_GB}} GB</b></div>', '<div class="spec-row"><span>Peso</span><b>No especificado</b></div>');

const ogImage = String(dl.coverRef).startsWith('http') ? dl.coverRef : SITE + dl.coverRef;
// FIX: dividir en párrafos ANTES de inline() (inline colapsa los \n y antes quedaba todo en 1 párrafo)
const descHtml = String(desc.descripcion || '').split(/\n{2,}/).map(inline).filter(Boolean).join('</p><p>') || inline(desc.resumen);
const map = {
  META_TITLE: clamp(seo.meta_title || `${titulo} PS4 | ComprarJuegos`, 60), META_DESCRIPTION: clamp(seo.meta_description || desc.resumen || `Comprá ${titulo} para PS4.`, 155),
  SLUG: slug, TITULO: inline(titulo), IMG_PRINCIPAL: dl.coverRef, IMG_2: dl.coverRef, IMG_3: dl.coverRef, OG_IMAGE: ogImage,
  RESUMEN: inline(desc.resumen), DESCRIPCION: descHtml, FEATURE_1: inline(desc.feature_1), FEATURE_2: inline(desc.feature_2), FEATURE_3: inline(desc.feature_3),
  GENERO: inline(genero), GENERO_SLUG: slugify((String(genero).split(',')[0] || genero)), DESARROLLADOR: inline(desarrollador), DEV_SLUG: slugify(desarrollador), EDITOR: inline(editor),
  ANIO: String(anio), JUGADORES: inline(jugadores), ONLINE_PSPLUS: inline(onlinePsPlus), PESO_GB: 'No especificado',
  PUNTAJE_CRITICA: puntaje ? String(puntaje) : 'N/D', PUNTAJE_PROMEDIO: '5', SAGA: inline(saga),
  COMPAT_PS5: 'Sí', COMPAT_PS5_TEXTO: compatTexto, SKU: ('CJ-' + slug).slice(0, 40).toUpperCase(),
  PRECIO_USD: precioVenta ? precioVenta.toFixed(2) : '', PRECIO_PS_STORE_USD: psStore ? psStore.toFixed(2) : '', AHORRO_PCT: String(ahorro), PRECIO_VALIDO_HASTA: validoHasta,
  STOCK_SCHEMA: 'InStock', STOCK_CLASS: 'in', STOCK_TEXTO: 'En stock', CONDICION_SCHEMA: 'NewCondition', CONDICION: 'Nuevo',
  FORMATO: formatoTexto, FORMATO_BADGE: formatoBadge, IDIOMA: inline(dl.idioma), REGION: inline(dl.region), ENTREGA: inline(dl.entrega),
  TRAILER_ID: trailer, LINK_COMPRA: linkCompra, PLACEHOLDER: 'campos', 'BLOQUE_AGGREGATERATING_SI_HAY_RESEÑAS_REALES': '',
};
for (const [k, v] of Object.entries(map)) html = html.replace(new RegExp('\\{\\{' + k + '\\}\\}', 'g'), v);

// SANITY CHECK estructural: si el HTML sale roto, NO se publica (va a "revisar").
// Esto habría frenado las fichas rotas de MK11, Xenoverse 2 y RE4.
const problemas = [];
if (!html.trimStart().startsWith('<!DOCTYPE')) problemas.push('no arranca con <!DOCTYPE');
if (!html.includes('</html>')) problemas.push('falta </html>');
if (!html.includes('rel="canonical"')) problemas.push('falta canonical');
const sobras = html.match(/\{\{[A-ZÑÁÉÍÓÚ_0-9]+\}\}/g);
if (sobras) problemas.push('placeholders sin reemplazar: ' + [...new Set(sobras)].join(', '));
if (/<!--\s*(BEGIN|END):/.test(html)) problemas.push('quedaron marcadores BEGIN/END');
if (problemas.length) { qaOk = false; motivosArr.push('HTML roto: ' + problemas.join(' | ')); }

return [{ json: { qa_ok: qaOk, qa_motivos: motivosArr.join(' | '), slug, filename: `ps4-${slug}.html`, html, images: dl.images,
  titulo, url_del_juego: dl.row_url, url_publicada: `${SITE}/ps4-${slug}.html`, fecha: new Date().toISOString().slice(0, 10),
  indice: { titulo, slug, plataforma: 'PS4', precio: precioVenta ? precioVenta.toFixed(2) : '', ref: psStore ? psStore.toFixed(2) : '', img: dl.coverRef, genero, fecha: new Date().toISOString().slice(0,10) },
  media: dl.media_debug, datos: { genero, desarrollador, editor, anio, puntaje, fuente_score: ficha.fuente_score, voz: desc.voz }, confianza: ficha.confianza } }];
