// Llena grillas, filtros y paginación desde /juegos.json (lo mantiene el flujo n8n)
(async function () {
  let juegos = [];
  try { const r = await fetch('/juegos.json', { cache: 'no-store' }); juegos = await r.json(); } catch (e) { juegos = []; }
  if (!Array.isArray(juegos)) juegos = [];
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const PER_PAGE = 24;
  const TR = { action: 'Acción', adventure: 'Aventura', sports: 'Deportes', shooter: 'Shooter', rpg: 'RPG', racing: 'Carreras', fighting: 'Lucha', puzzle: 'Puzzle', strategy: 'Estrategia', indie: 'Indie', arcade: 'Arcade', simulation: 'Simulación', platformer: 'Plataformas', family: 'Familiar', casual: 'Casual', 'massively multiplayer': 'Multijugador' };
  const disc = (j) => { const r = parseFloat(j.ref), p = parseFloat(j.precio); return (r && p && r > p) ? (1 - p / r) : 0; };
  const esc = (s) => String(s || '').replace(/[<>"]/g, '');
  const card = (j) => {
    const img = j.img ? `<div class="cover"><img src="${esc(j.img)}" alt="${esc(j.titulo)}" loading="lazy"></div>` : `<div class="cover">[ Portada ]</div>`;
    const ref = j.ref ? `<span class="ref">US$${esc(j.ref)}</span>` : '';
    return `<a href="/ps4-${esc(j.slug)}.html" class="card">${img}<div class="body"><span class="platform-tag">${esc(j.plataforma || 'PS4')} · DIGITAL</span><h3>${esc(j.titulo)}</h3><div class="row">${ref}<span class="price">US$${esc(j.precio)}</span></div><span class="stock">● En stock</span></div></a>`;
  };

  document.querySelectorAll('[data-grid]').forEach((el) => {
    let base = juegos.slice();
    const plat = el.getAttribute('data-plataforma');
    if (plat) base = base.filter((j) => String(j.plataforma || 'PS4').toUpperCase() === plat.toUpperCase());
    if (el.getAttribute('data-orden') === 'descuento') base.sort((a, b) => disc(b) - disc(a));
    else if (el.hasAttribute('data-catalog')) base.reverse();
    else base = shuffle(base);

    // grilla simple (home): sin filtros ni paginación
    if (!el.hasAttribute('data-catalog')) {
      const lim = parseInt(el.getAttribute('data-limit') || '0', 10);
      const list = lim > 0 ? base.slice(0, lim) : base;
      el.innerHTML = list.length ? list.map(card).join('') : '<p class="empty-state">Todavía no hay juegos publicados. Volvé pronto.</p>';
      return;
    }

    // catálogo: chips dinámicos + paginación
    let genero = 'todos', page = 1;
    const filtersEl = document.querySelector('.filters');
    const pagEl = document.querySelector('.pagination');
    const countEl = document.getElementById('resultCount');
    if (filtersEl) {
      const gs = [...new Set(base.flatMap((j) => String(j.genero || '').split(',').map((s) => s.trim()).filter(Boolean)))].sort();
      filtersEl.innerHTML = '<button class="filter-chip active" data-g="todos">Todos</button>' +
        gs.map((g) => `<button class="filter-chip" data-g="${esc(g.toLowerCase())}">${esc(TR[g.toLowerCase()] || g)}</button>`).join('');
      filtersEl.querySelectorAll('.filter-chip').forEach((ch) => ch.addEventListener('click', () => {
        filtersEl.querySelectorAll('.filter-chip').forEach((c) => c.classList.remove('active'));
        ch.classList.add('active'); genero = ch.getAttribute('data-g'); page = 1; render();
      }));
    }
    function render() {
      let list = genero === 'todos' ? base : base.filter((j) => String(j.genero || '').toLowerCase().includes(genero));
      const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
      if (page > pages) page = pages;
      const slice = list.slice((page - 1) * PER_PAGE, page * PER_PAGE);
      el.innerHTML = slice.length ? slice.map(card).join('') : '<p class="empty-state">No hay juegos en esta categoría todavía.</p>';
      if (countEl) countEl.textContent = list.length + ' juego' + (list.length !== 1 ? 's' : '');
      if (pagEl) {
        if (pages <= 1) { pagEl.innerHTML = ''; }
        else {
          let h = `<a class="page-btn ${page === 1 ? 'disabled' : ''}" data-p="${page - 1}">←</a>`;
          for (let i = 1; i <= pages; i++) h += `<a class="page-btn ${i === page ? 'active' : ''}" data-p="${i}">${i}</a>`;
          h += `<a class="page-btn ${page === pages ? 'disabled' : ''}" data-p="${page + 1}">→</a>`;
          pagEl.innerHTML = h;
          pagEl.querySelectorAll('.page-btn').forEach((b) => b.addEventListener('click', () => {
            const pp = parseInt(b.getAttribute('data-p'), 10);
            if (pp >= 1 && pp <= pages && pp !== page) { page = pp; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
          }));
        }
      }
    }
    render();
  });

  // hero (home)
  const hc = document.getElementById('heroCard');
  if (hc && juegos.length) {
    const j = juegos[Math.floor(Math.random() * juegos.length)];
    const cov = document.getElementById('pcCover'); if (cov) cov.innerHTML = j.img ? `<img src="${esc(j.img)}" alt="${esc(j.titulo)}">` : '[ Portada del juego ]';
    const t = document.getElementById('pcTitle'); if (t) t.textContent = j.titulo;
    const pr = document.getElementById('pcPriceRow'); if (pr) pr.style.display = '';
    const rf = document.getElementById('pcRef'); if (rf && j.ref) rf.textContent = 'US$' + j.ref;
    const pc = document.getElementById('pcPrice'); if (pc) pc.textContent = 'US$' + j.precio;
    const sv = document.getElementById('pcSave'); if (sv) { const d = Math.round(disc(j) * 100); sv.textContent = d ? ('−' + d + '%') : ''; }
    hc.style.cursor = 'pointer'; hc.onclick = () => { window.location.href = '/ps4-' + j.slug + '.html'; };
  }
})();
