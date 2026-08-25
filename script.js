(() => {
  const state = { sources: null, facilities: null };
  const esc = (value) => String(value).replace(/[&<>'"]/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
  const loadJson = async (file) => {
    const response = await fetch(`./data/${file}.json`);
    if (!response.ok) throw new Error(`${file}.json: ${response.status}`);
    return response.json();
  };
  const menuButton = document.querySelector('.menu-button');
  const nav = document.getElementById('site-nav');
  menuButton?.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!open));
    nav.classList.toggle('open', !open);
  });
  nav?.addEventListener('click', (event) => {
    if (event.target.matches('a')) { nav.classList.remove('open'); menuButton?.setAttribute('aria-expanded', 'false'); }
  });
  const renderAreas = (data) => {
    document.getElementById('area-comparison').innerHTML = data.areas.map((item) => `<article class="area-card"><strong class="sqm">${esc(item.sqm)}<small>㎡</small></strong><small>${esc(item.label)}</small><div class="room-plan">${item.rooms.map((room) => `<i>${esc(room)}</i>`).join('')}</div></article>`).join('');
  };
  const renderRoutes = (data) => {
    document.getElementById('access-routes').innerHTML = data.routes.map((route) => `<article class="route-card"><span>${esc(route.mode)}</span><h3>${esc(route.station)}駅</h3><strong>${esc(route.time)}</strong><span class="route-use">${esc(route.use)}</span><p>${esc(route.lines)}</p><small>${esc(route.note)}</small><button class="source-trigger" data-url="${esc(route.sourceUrl)}" data-title="${esc(route.source)}" data-level="${route.confidence === 'primary' ? 'A' : 'B'}">出典を見る</button></article>`).join('');
  };
  const renderFacilities = (filter = 'all') => {
    const list = state.facilities.facilities.filter((item) => filter === 'all' || item.category === filter);
    document.getElementById('facility-grid').innerHTML = list.map((item) => `<article class="facility-card"><span>${esc(item.category)}</span><h3>${esc(item.name)}</h3><div class="fact-pills">${item.facts.map((fact) => `<i>${esc(fact)}</i>`).join('')}</div><p>${esc(item.scene)}</p><button class="source-trigger" data-url="${esc(item.sourceUrl)}" data-title="${esc(item.source)}" data-level="${item.confidence === 'primary' ? 'A' : 'B'}">出典を見る</button></article>`).join('');
  };
  const renderSources = (data) => {
    document.getElementById('source-list').innerHTML = data.items.map((item) => `<a href="${esc(item.url)}" target="_blank" rel="noopener noreferrer"><b>LEVEL ${esc(item.level)}</b><span>${esc(item.title)}</span><span>情報源へ ↗</span></a>`).join('');
  };
  const dialog = document.getElementById('source-dialog');
  const dialogContent = document.getElementById('dialog-content');
  const openSource = (trigger) => {
    const item = trigger.dataset.source ? state.sources?.items.find((source) => source.id === trigger.dataset.source) : null;
    const title = item?.title || trigger.dataset.title;
    const url = item?.url || trigger.dataset.url;
    const level = item?.level || trigger.dataset.level || 'B';
    const levelInfo = state.sources?.levels[level];
    dialogContent.innerHTML = `<span class="level">LEVEL ${esc(level)}</span><h2>${esc(title)}</h2><p>${esc(levelInfo?.label || '')}</p>${item?.note ? `<p>${esc(item.note)}</p>` : ''}<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">情報源を開く ↗</a>`;
    dialog.showModal();
  };
  document.addEventListener('click', (event) => { const trigger = event.target.closest('.source-trigger'); if (trigger) openSource(trigger); });
  document.querySelector('.dialog-close')?.addEventListener('click', () => dialog.close());
  dialog?.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
  document.querySelector('.scene-tabs')?.addEventListener('click', (event) => {
    const tab = event.target.closest('[role="tab"]');
    if (!tab) return;
    document.querySelectorAll('[role="tab"]').forEach((button) => button.setAttribute('aria-selected', String(button === tab)));
    renderFacilities(tab.dataset.scene);
  });
  const hero = document.querySelector('.hero');
  const heroVideo = document.querySelector('.hero-film');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (heroVideo) {
    heroVideo.addEventListener('error', () => { heroVideo.hidden = true; hero.classList.add('video-fallback'); });
    if (reducedMotion) { heroVideo.pause(); heroVideo.hidden = true; }
    else if (matchMedia('(max-width: 700px), (pointer: coarse)').matches) {
      heroVideo.loop = true; heroVideo.muted = true;
      const observer = new IntersectionObserver(([entry]) => entry.isIntersecting ? heroVideo.play().catch(() => {}) : heroVideo.pause(), { threshold: .05 });
      observer.observe(hero);
    } else {
      heroVideo.pause();
      let frame = 0;
      const syncVideo = () => {
        frame = 0;
        if (!Number.isFinite(heroVideo.duration) || heroVideo.duration <= 0) return;
        const progress = Math.min(1, Math.max(0, scrollY / Math.max(1, hero.offsetHeight)));
        heroVideo.currentTime = progress * Math.max(0, heroVideo.duration - .08);
      };
      const requestSync = () => { if (!frame) frame = requestAnimationFrame(syncVideo); };
      heroVideo.addEventListener('loadedmetadata', syncVideo);
      addEventListener('scroll', requestSync, { passive: true });
      addEventListener('resize', requestSync);
    }
  }
  Promise.all([loadJson('comparisons'), loadJson('access'), loadJson('facilities'), loadJson('sources')])
    .then(([comparisons, access, facilities, sources]) => { state.facilities = facilities; state.sources = sources; renderAreas(comparisons); renderRoutes(access); renderFacilities(); renderSources(sources); })
    .catch((error) => { console.error('Site data could not be loaded.', error); document.querySelectorAll('#area-comparison,#access-routes,#facility-grid,#source-list').forEach((root) => { root.innerHTML = '<p>データを読み込めませんでした。ページを再読み込みしてください。</p>'; }); });
})();
