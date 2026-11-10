/* 简白图库 —— 纯前端，无依赖。
   数据来源：photos/manifest.json（由 scripts/build-manifest.mjs 生成） */

(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);

  const el = {
    filters: $('filters'),
    gallery: $('gallery'),
    empty: $('empty'),
    emptyReason: $('empty-reason'),
    total: $('total'),
    builtAt: $('built-at'),
    lightbox: $('lightbox'),
    lbImg: $('lb-img'),
    lbTitle: $('lb-title'),
    lbCount: $('lb-count'),
    lbPrev: $('lb-prev'),
    lbNext: $('lb-next'),
    lbClose: $('lb-close')
  };

  const state = {
    photos: [],
    view: [],
    filter: 'all',
    cursor: 0,
    labels: {},
    lastFocus: null
  };

  const esc = (str) =>
    String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  init();

  async function init() {
    let manifest;
    try {
      const res = await fetch(`./photos/manifest.json?t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      manifest = await res.json();
    } catch (err) {
      showEmpty(`读取图库索引失败：${err.message}。通常是还没执行 npm run build，或者直接双击打开了 index.html（需要通过 http:// 访问）。`);
      return;
    }

    const categories = Array.isArray(manifest.categories) ? manifest.categories : [];
    categories.forEach((cat) => {
      state.labels[cat.id] = cat.label || cat.id;
      (cat.photos || []).forEach((p) => {
        state.photos.push({ ...p, category: cat.id, categoryLabel: cat.label || cat.id });
      });
    });

    if (!state.photos.length) {
      showEmpty('索引里一张图都没有。把图片放进 photos/bags、photos/scarves、photos/watches，再执行 npm run build。');
      return;
    }

    el.total.textContent = String(state.photos.length);
    el.builtAt.textContent = manifest.generatedAt
      ? new Date(manifest.generatedAt).toLocaleString('zh-CN', { hour12: false })
      : '—';

    renderFilters(categories);
    applyFilter('all');
  }

  function showEmpty(reason) {
    el.gallery.hidden = true;
    el.gallery.innerHTML = '';
    el.filters.hidden = true;
    el.empty.hidden = false;
    el.emptyReason.textContent = reason;
    el.total.textContent = '0';
  }

  function renderFilters(categories) {
    const all = state.photos.length;
    const items = [{ id: 'all', label: '全部', count: all }].concat(
      categories.map((c) => ({ id: c.id, label: c.label || c.id, count: (c.photos || []).length }))
    );

    el.filters.innerHTML = items
      .map(
        (item) =>
          `<button class="chip" type="button" data-cat="${esc(item.id)}" aria-pressed="${item.id === 'all'}">` +
          `${esc(item.label)}<span class="num">${item.count}</span></button>`
      )
      .join('');

    el.filters.addEventListener('click', (e) => {
      const btn = e.target.closest('.chip');
      if (!btn) return;
      applyFilter(btn.dataset.cat);
    });
  }

  function applyFilter(catId) {
    state.filter = catId;
    state.view = catId === 'all' ? state.photos.slice() : state.photos.filter((p) => p.category === catId);

    el.filters.querySelectorAll('.chip').forEach((btn) => {
      btn.setAttribute('aria-pressed', String(btn.dataset.cat === catId));
    });

    el.gallery.innerHTML = state.view
      .map(
        (p, i) =>
          `<button class="card" type="button" data-index="${i}" aria-label="放大查看：${esc(p.title)}">` +
          `<img src="${esc(p.src)}" alt="${esc(p.title)}" loading="lazy" decoding="async">` +
          `<span class="card-meta"><span class="card-title">${esc(p.title)}</span>` +
          `<span class="card-cat">${esc(p.categoryLabel)}</span></span></button>`
      )
      .join('');

    el.gallery.querySelectorAll('img').forEach((img) => {
      img.addEventListener('error', () => img.closest('.card')?.classList.add('is-broken'), { once: true });
    });

    el.gallery.hidden = false;
    el.empty.hidden = true;
  }

  /* ---------- 灯箱 ---------- */
  el.gallery.addEventListener('click', (e) => {
    const card = e.target.closest('.card');
    if (!card) return;
    openLightbox(Number(card.dataset.index), card);
  });

  function openLightbox(index, trigger) {
    if (!state.view.length) return;
    state.cursor = (index + state.view.length) % state.view.length;
    state.lastFocus = trigger || null;
    paint();
    el.lightbox.hidden = false;
    document.body.classList.add('lb-open');
    el.lbClose.focus();
  }

  function closeLightbox() {
    el.lightbox.hidden = true;
    document.body.classList.remove('lb-open');
    el.lbImg.removeAttribute('src');
    if (state.lastFocus) state.lastFocus.focus();
  }

  function step(delta) {
    if (el.lightbox.hidden) return;
    state.cursor = (state.cursor + delta + state.view.length) % state.view.length;
    paint();
  }

  function paint() {
    const photo = state.view[state.cursor];
    if (!photo) return;
    el.lbImg.src = photo.src;
    el.lbImg.alt = photo.title;
    el.lbTitle.textContent = photo.title;
    el.lbCount.textContent = `${state.cursor + 1} / ${state.view.length}`;
  }

  el.lbClose.addEventListener('click', closeLightbox);
  el.lbPrev.addEventListener('click', () => step(-1));
  el.lbNext.addEventListener('click', () => step(1));
  el.lightbox.addEventListener('click', (e) => {
    if (e.target === el.lightbox) closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (el.lightbox.hidden) return;
    if (e.key === 'Escape') closeLightbox();
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'ArrowRight') step(1);
  });
})();
