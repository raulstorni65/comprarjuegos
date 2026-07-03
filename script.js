// ComprarJuegos — interacciones mínimas

// Menú móvil
const burger = document.getElementById('burger');
const navLinks = document.getElementById('navLinks');
if (burger && navLinks) {
  burger.addEventListener('click', () => navLinks.classList.toggle('open'));
}

// Acordeón FAQ (funciona en la home y en preguntas-frecuentes.html)
document.querySelectorAll('.faq-q').forEach((q) => {
  q.addEventListener('click', () => {
    const item = q.closest('.faq-item');
    item.classList.toggle('open');
  });
});

// Buscador: Enter en cualquier input de búsqueda -> /buscar?q=
document.querySelectorAll('input[type="search"]').forEach((inp) => {
  inp.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && inp.value.trim()) {
      window.location.href = '/buscar?q=' + encodeURIComponent(inp.value.trim());
    }
  });
});
// Botón "Buscar" del hero
const heroBtn = document.querySelector('.hero-search .btn');
if (heroBtn) heroBtn.addEventListener('click', () => {
  const inp = document.querySelector('.hero-search input[type="search"]');
  if (inp && inp.value.trim()) window.location.href = '/buscar?q=' + encodeURIComponent(inp.value.trim());
});
