/* Portafolio estático; sin bibliotecas, cookies, analítica ni envío de datos. */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const normalize = (text) => String(text ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim();
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  const safeDocument = (path) => {
    if (typeof path !== 'string' || !/^assets\/documents\/[a-z0-9][a-z0-9_.-]*\.(pdf|png|jpe?g)$/i.test(path)) return '';
    if (path.includes('..')) return '';
    return path;
  };
  const safeSocial = (value, network) => {
    try {
      const url = new URL(value);
      const hosts = network === 'linkedin' ? ['linkedin.com', 'www.linkedin.com'] : ['github.com', 'www.github.com'];
      return url.protocol === 'https:' && hosts.includes(url.hostname) && !url.username && !url.password ? url.href : '';
    } catch { return ''; }
  };
  const isApproved = (record) => record?.approved === true && record?.verified !== false && !!safeDocument(record.file);
  const isVisible = (record) => record?.verified === true;
  const dateLabel = (record) => {
    const formatter = new Intl.DateTimeFormat('es-DO', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
    const parse = (value) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
      const date = new Date(value + 'T00:00:00Z');
      return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
    };
    const start = parse(record.date);
    if (!start) return record.year ? String(record.year) : 'Fecha no confirmada';
    const end = parse(record.dateEnd);
    return end ? formatter.format(start) + ' – ' + formatter.format(end) : formatter.format(start);
  };
  function matches(record, filters) {
    const haystack = normalize([record.title, record.institution, record.category, record.description].join(' '));
    return (!filters.query || haystack.includes(normalize(filters.query))) && (!filters.institution || record.institution === filters.institution) && (!filters.category || record.category === filters.category) && (!filters.year || String(record.year ?? 'pendiente') === filters.year);
  }
  let data = window.PORTFOLIO_DATA;
  const localDocuments = new Map();
  const localDocument = (record) => localDocuments.get(record.id);
  const available = (record) => isApproved(record) || !!localDocument(record);
  async function loadLocalDocuments() {
    if (location.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(location.hostname)) return;
    try {
      const response = await fetch('/__certificados-local/catalogo.json', { cache: 'no-store', credentials: 'same-origin' });
      if (!response.ok) return;
      const catalog = await response.json();
      if (catalog.scope !== 'local-review-only' || !Array.isArray(catalog.certificates)) return;
      const additional = catalog.additionalCertificates || [];
      if (!Array.isArray(additional)) return;
      const existingIds = new Set(data.certificates.map((item) => item.id));
      for (const record of additional) {
        if (!record.localOnly || !record.identityVerified || !record.verified || record.approved || record.file || existingIds.has(record.id) || !/^[a-z0-9-]+$/.test(record.id) || typeof record.title !== 'string' || typeof record.institution !== 'string' || !record.title || !record.institution || !record.trainingType || !record.category) throw new Error('Ficha local inválida');
        existingIds.add(record.id);
      }
      const candidates = data.certificates.concat(additional);
      const ids = new Set();
      const approved = [];
      for (const item of catalog.certificates) {
        const record = candidates.find((entry) => entry.id === item.id && isVisible(entry));
        if (!record || ids.has(item.id) || item.title !== record.title || item.institution !== record.institution || item.date !== record.date || (item.dateEnd || '') !== (record.dateEnd || '') || !['pdf', 'png', 'jpg', 'jpeg'].includes(item.format) || !/^[a-z0-9-]+$/.test(item.id) || item.file !== '/__certificados-local/' + item.id + '.' + item.format) throw new Error('Correspondencia local inválida');
        ids.add(item.id); approved.push(item);
      }
      data = { ...data, certificates: candidates };
      for (const item of approved) localDocuments.set(item.id, item);
      renderContent();
      document.documentElement.dataset.localDocuments = String(localDocuments.size);
    } catch { /* Fail closed: no local document is enabled on a catalog mismatch. */ }
  }
  let activeTrigger = null;
  let toastTimer;
  function toast(message) {
    $('toast').textContent = message;
    $('toast').hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { $('toast').hidden = true; }, 4500);
  }
  function finishDialog() {
    $('document-viewer').replaceChildren();
    document.body.classList.remove('dialog-open');
    if (activeTrigger?.isConnected) activeTrigger.focus({ preventScroll: true });
  }
  function closeDialog() { $('document-dialog').close(); finishDialog(); }
  function openDocument(record, trigger) {
    activeTrigger = trigger;
    $('dialog-title').textContent = record.title;
    $('dialog-meta').textContent = `${record.institution} · ${dateLabel(record)} · ${record.category}`;
    const viewer = $('document-viewer');
    const actions = $('dialog-actions');
    viewer.replaceChildren(); actions.replaceChildren();
    if (available(record)) {
      const local = isApproved(record) ? null : localDocument(record);
      const path = local ? local.file : safeDocument(record.file);
      if (local) actions.append(el('p', 'small-note', 'Copia para revisión local. Publicación no autorizada. ' + local.reviewNote));
      if ((local ? local.format : record.format) === 'pdf') {
        const frame = el('iframe');
        frame.title = `Documento PDF: ${record.title}`;
        frame.src = path;
        viewer.append(frame);
      } else {
        const image = el('img');
        image.alt = `${record.title} — ${record.institution}`;
        image.src = path;
        viewer.append(image);
      }
      const link = el('a', 'button secondary', 'Abrir documento en otra pestaña ↗');
      link.href = path; link.target = '_blank'; link.rel = 'noopener noreferrer';
      actions.append(link);
      const badge = (data.badges || []).find((item) => item.certificateId === record.id && isApproved(item));
      if (badge) {
        const badgeLink = el('a', 'button secondary', 'Ver insignia profesional ↗');
        badgeLink.href = safeDocument(badge.file);
        badgeLink.target = '_blank'; badgeLink.rel = 'noopener noreferrer';
        actions.append(badgeLink);
      }

    } else {
      const message = record.verified === false ? 'Este registro no acredita una certificación obtenida. La evidencia requiere validación documental y no está disponible para publicación.' : 'La evidencia está identificada y se conserva en el archivo privado. Su publicación requiere revisar los datos personales y contar con autorización expresa.';
      viewer.append(el('p', '', message));
    }
    const details = el('p', 'small-note', record.description);
    actions.append(details);
    $('document-dialog').showModal();
    document.body.classList.add('dialog-open');
    $('close-dialog').focus();
  }
  function populateFilter(id, values, first) {
    const select = $(id);
    select.replaceChildren(new Option(first, ''));
    values.forEach((item) => select.add(new Option(item === 'pendiente' ? 'Año por confirmar' : item, item)));
  }
  function renderCertificates() {
    const filters = { query: $('search').value, institution: $('institution').value, category: $('category').value, year: $('year').value };
    const results = data.certificates.filter((record) => isVisible(record) && matches(record, filters));
    $('results-count').textContent = `${results.length} ${results.length === 1 ? 'referencia' : 'referencias'} de formación`;
    $('empty-state').hidden = results.length > 0;
    $('certificate-grid').replaceChildren();
    results.forEach((record, i) => {
      const card = el('article', 'certificate-card');
      const cover = el('div', `certificate-cover color-${i % 4}`);
      cover.setAttribute('aria-hidden', 'true');
      const badge = (data.badges || []).find((item) => item.certificateId === record.id && isApproved(item));
      if (badge) {
        const badgeImage = el('img', 'credential-insignia');
        badgeImage.src = safeDocument(badge.file); badgeImage.alt = badge.title;
        badgeImage.loading = 'lazy'; cover.append(badgeImage);
      } else {
      cover.append(el('span', 'certificate-symbol', '✧'), el('span', 'certificate-cover-caption', 'FORMACIÓN PROFESIONAL'));
      }
      const body = el('div', 'certificate-body');
      const details = el('dl', 'certificate-details');
      for (const [label, value, fieldName] of [
        ['Institución emisora', record.institution, 'institution'],
        ['Fecha', dateLabel(record), 'date'],
        ['Tipo de documento', record.trainingType, 'type']
      ]) {
        const field = el('div', 'certificate-field');
        const term = el('dt', '', label);
        const definition = el('dd', '', value);
        definition.dataset.field = fieldName;
        field.append(term, definition);
        details.append(field);
      }
      body.append(el('p', 'certificate-meta', record.category), el('h3', '', record.title), details);
      const footer = el('div', 'certificate-footer');
      const label = isApproved(record) ? 'Documento disponible' : localDocument(record) ? 'Revisión local' : 'Documento privado';
      footer.append(el('span', `badge${record.verified === false ? ' pending' : ''}`, label));
      const button = el('button', 'detail-button', available(record) ? 'Ver certificado ↗' : 'Ver detalle ↗');
      button.type = 'button'; button.dataset.certificateId = record.id;
      button.setAttribute('aria-label', `${available(record) ? 'Ver certificado' : 'Ver detalle'}: ${record.title}`);
      button.addEventListener('click', () => openDocument(record, button));
      footer.append(button); body.append(footer); card.append(cover, body); $('certificate-grid').append(card);
    });
  }
  function renderContent() {
    $('profile-description').textContent = data.profile.description;
    const biographyAction = $('biography-action');
    if (biographyAction && isApproved(data.biography)) {
      const link = el('a', 'button secondary', 'Leer mi semblanza completa ↗');
      link.href = safeDocument(data.biography.file);
      link.target = '_blank'; link.rel = 'noopener';
      biographyAction.replaceChildren(link);
    }

    $('experience-list').replaceChildren();
    data.experience.forEach((record) => {
      const row = el('article', 'timeline-row');
      const content = el('div', 'timeline-content');
      content.append(el('h3', '', record.title), el('p', '', record.organization));
      row.append(el('span', 'timeline-date', record.period), content, el('p', 'timeline-detail', record.detail));
      $('experience-list').append(row);
    });
    $('practice-list').replaceChildren();
    data.practices.forEach((record, i) => {
      const node = el('article', 'practice');
      node.append(el('span', 'practice-number', String(i + 1).padStart(2, '0')), el('h3', '', record.title), el('p', '', record.description));
      $('practice-list').append(node);
    });
    $('education-list').replaceChildren();
    data.education.forEach((record) => {
      const card = el('article', 'education-card');
      const mark = el('span', 'degree-mark', 'UCNE'); mark.setAttribute('aria-hidden', 'true');
      card.append(mark, el('div', 'degree-year', record.year), el('h3', '', record.degree), el('p', '', record.institution), el('p', 'small-note', record.date));
      $('education-list').append(card);
    });
    $('skills-list').replaceChildren();
    data.skills.forEach((record) => {
      const group = el('div', 'skill-group'); const tags = el('div', 'skill-tags');
      record.items.forEach((item) => tags.append(el('span', '', item)));
      group.append(el('h3', '', record.title), tags); $('skills-list').append(group);
    });
    const unique = (key) => [...new Set(data.certificates.filter(isVisible).map((record) => String(record[key] ?? 'pendiente')))];
    populateFilter('institution', unique('institution').sort((a, b) => a.localeCompare(b, 'es')), 'Todas las instituciones');
    populateFilter('category', unique('category').sort((a, b) => a.localeCompare(b, 'es')), 'Todas las categorías');
    populateFilter('year', unique('year').sort((a, b) => a === 'pendiente' ? 1 : b === 'pendiente' ? -1 : Number(b) - Number(a)), 'Todos los años');
    $('cv-action').replaceChildren();
    if (isApproved(data.cv)) {
      const link = el('a', 'button primary', 'Descargar currículum ↓');
      link.href = safeDocument(data.cv.file); link.download = 'Curriculum-German-Parra.pdf';
      $('cv-action').append(link);
      $('cv-description').textContent = 'Versión profesional revisada y autorizada para descarga.';
    } else { $('cv-action').append(el('span', 'disabled-action', 'Descarga pendiente de revisión')); }
    $('contact-links').replaceChildren();
    for (const [network, label] of [['linkedin', 'LinkedIn'], ['github', 'GitHub']]) {
      const url = safeSocial(data.links[network], network);
      if (url) {
        const link = el('a', network === 'linkedin' ? 'button primary' : 'button secondary', `${label} ↗`);
        link.href = url; link.target = '_blank'; link.rel = 'noopener noreferrer'; $('contact-links').append(link);
      }
    }
    const email = String(data.links.email ?? '');
    if (/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(email)) {
      const link = el('a', 'button secondary', 'Escribir por correo ↗'); link.href = `mailto:${email}`; $('contact-links').append(link);
    }
    $('contact-note').textContent = $('contact-links').childElementCount ? 'Solo se muestran canales profesionales autorizados.' : 'Los enlaces profesionales estarán disponibles cuando se confirmen los perfiles de LinkedIn y GitHub y el correo de contacto.';
    $('current-year').textContent = String(new Date().getFullYear());
    renderCertificates();
    document.documentElement.dataset.ready = 'true';
  }
  $('filters').addEventListener('submit', (event) => event.preventDefault());
  $('search').addEventListener('input', renderCertificates);
  ['institution', 'category', 'year'].forEach((id) => $(id).addEventListener('change', renderCertificates));
  $('filters').addEventListener('reset', () => { setTimeout(renderCertificates, 0); });
  $('clear-empty').addEventListener('click', () => { $('filters').reset(); $('search').focus(); });
  $('menu-toggle').addEventListener('click', () => {
    const open = $('menu-toggle').getAttribute('aria-expanded') !== 'true';
    $('menu-toggle').setAttribute('aria-expanded', String(open)); $('navegacion').classList.toggle('open', open);
  });
  $('navegacion').addEventListener('click', (event) => {
    if (event.target.closest('a')) { $('navegacion').classList.remove('open'); $('menu-toggle').setAttribute('aria-expanded', 'false'); }
  });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') { $('navegacion').classList.remove('open'); $('menu-toggle').setAttribute('aria-expanded', 'false'); } });
  $('close-dialog').addEventListener('click', closeDialog);
  $('document-dialog').addEventListener('click', (event) => { if (event.target === $('document-dialog')) { const r = event.target.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) closeDialog(); } });
  $('document-dialog').addEventListener('close', finishDialog);
  // Helpers exposed only for automated browser checks; no document approval from the browser.
  window.Portfolio = Object.freeze({ normalize, matches, safeDocument, safeSocial, isApproved, isVisible, dateLabel });
  if (!data || !Array.isArray(data.certificates)) { toast('No se pudo cargar el catálogo. Revisa los archivos del proyecto.'); return; }
  renderContent();
  // On HTTP hosting the JSON is authoritative: new records need no change to HTML or JS.
  if (location.protocol === 'http:' || location.protocol === 'https:') {
    fetch('data/portfolio.json', { cache: 'no-cache', credentials: 'same-origin' }).then((response) => {
      if (!response.ok) throw new Error('Catálogo no disponible');
      return response.json();
    }).then((fresh) => {
      if (fresh.version === 1 && Array.isArray(fresh.certificates)) { data = fresh; renderContent(); }
    }).catch(() => { /* The bundled local catalog remains available. */ }).finally(loadLocalDocuments);
  }
})();
