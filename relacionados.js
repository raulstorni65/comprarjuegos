// Juegos relacionados en la ficha (lee /juegos.json). Prioriza mismo género.
(async function () {
  const host = document.getElementById('relacionados');
  if (!host) return;
  const slug = document.body.dataset.slug || '';
  const genero = (document.body.dataset.genero || '').toLowerCase();
  let juegos = [];
  try { const r = await fetch('/juegos.json', { cache: 'no-store' }); juegos = await r.json(); } catch (e) {}
  if (!Array.isArray(juegos)) juegos = [];
  const esc = (s) => String(s || '').replace(/[<>"]/g, '');
  const pool = juegos.filter((j) => j.slug !== slug);
  const firstGenre = genero.split(',')[0].trim();
  const same = firstGenre ? pool.filter((j) => String(j.genero || '').toLowerCase().includes(firstGenre)) : [];
  let list = (same.length >= 4 ? same : pool);
  for (let i = list.length - 1; i > 0; i--) { const k = Math.floor(Math.random() * (i + 1)); [list[i], list[k]] = [list[k], list[i]]; }
  list = list.slice(0, 4);
  const sec = document.getElementById('relacionados-sec');
  if (!list.length) { if (sec) sec.style.display = 'none'; return; }
  host.innerHTML = list.map((j) => {
    const img = j.img ? `<div class="cover"><img src="${esc(j.img)}" alt="${esc(j.titulo)}" loading="lazy"></div>` : `<div class="cover">[ Portada ]</div>`;
    const ref = j.ref ? `<span class="ref">US$${esc(j.ref)}</span>` : '';
    return `<a href="/ps4-${esc(j.slug)}.html" class="card">${img}<div class="body"><span class="platform-tag">${esc(j.plataforma || 'PS4')} · DIGITAL</span><h3>${esc(j.titulo)}</h3><div class="row">${ref}<span class="price">US$${esc(j.precio)}</span></div><span class="stock">● En stock</span></div></a>`;
  }).join('');
})();
