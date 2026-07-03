// Llena las grillas y el hero desde /juegos.json (lo mantiene el flujo n8n)
(async function () {
  let juegos = [];
  try { const r = await fetch('/juegos.json', { cache: 'no-store' }); juegos = await r.json(); } catch (e) { juegos = []; }
  if (!Array.isArray(juegos)) juegos = [];
  const disc = (j) => { const r = parseFloat(j.ref), p = parseFloat(j.precio); return (r && p && r > p) ? (1 - p / r) : 0; };
  const esc = (s) => String(s || '').replace(/[<>"]/g, '');
  const card = (j) => {
    const img = j.img ? `<div class="cover"><img src="${esc(j.img)}" alt="${esc(j.titulo)}" loading="lazy"></div>` : `<div class="cover">[ Portada ]</div>`;
    const ref = j.ref ? `<span class="ref">US$${esc(j.ref)}</span>` : '';
    return `<a href="/ps4-${esc(j.slug)}.html" class="card">${img}<div class="body"><span class="platform-tag">${esc(j.plataforma || 'PS4')} · DIGITAL</span><h3>${esc(j.titulo)}</h3><div class="row">${ref}<span class="price">US$${esc(j.precio)}</span></div><span class="stock">● En stock</span></div></a>`;
  };
  document.querySelectorAll('[data-grid]').forEach((el) => {
    let list = juegos.slice();
    const plat = el.getAttribute('data-plataforma');
    if (plat) list = list.filter((j) => String(j.plataforma || 'PS4').toUpperCase() === plat.toUpperCase());
    if (el.getAttribute('data-orden') === 'descuento') list.sort((a, b) => disc(b) - disc(a));
    else list.reverse();
    const lim = parseInt(el.getAttribute('data-limit') || '0', 10);
    if (lim > 0) list = list.slice(0, lim);
    el.innerHTML = list.length ? list.map(card).join('') : '<p class="empty-state">Todavía no hay juegos publicados en esta sección. Volvé pronto.</p>';
  });
  // hero
  const hc = document.getElementById('heroCard');
  if (hc && juegos.length) {
    const j = juegos[juegos.length - 1];
    const cov = document.getElementById('pcCover'); if (cov) cov.innerHTML = j.img ? `<img src="${esc(j.img)}" alt="${esc(j.titulo)}">` : '[ Portada del juego ]';
    const t = document.getElementById('pcTitle'); if (t) t.textContent = j.titulo;
    const pr = document.getElementById('pcPriceRow'); if (pr) pr.style.display = '';
    const rf = document.getElementById('pcRef'); if (rf && j.ref) rf.textContent = 'US$' + j.ref;
    const pc = document.getElementById('pcPrice'); if (pc) pc.textContent = 'US$' + j.precio;
    const sv = document.getElementById('pcSave'); if (sv) { const d = Math.round(disc(j) * 100); sv.textContent = d ? ('−' + d + '%') : ''; }
    hc.style.cursor = 'pointer';
    hc.onclick = () => { window.location.href = '/ps4-' + j.slug + '.html'; };
  }
})();
