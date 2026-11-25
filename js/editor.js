/* Editor (CMS) del dashboard. Funciona abriendo editor.html en local, sin servidor.
   Edita data/datos.js (que contiene el JSON) y lo guarda en la propia carpeta. */
(function () {
  'use strict';
  try {
  const D = window.Dashboard;
  const $ = s => document.querySelector(s);
  const clone = o => JSON.parse(JSON.stringify(o));
  const es = v => (v && typeof v === 'object') ? (v.es || '') : (v || '');
  const DRAFT_KEY = 'dashboard-editor-borrador-v1';
  const CANVAS = { w: 3840, h: 2160 };   // pantalla real (4K); el diseño se edita siempre en 1920×1080 (la mitad exacta)
  const DESIGN_SCALE = 1920 / CANVAS.w;  // = 0.5
  const PX = CANVAS.w / 1920;            // = 2 → píxeles reales por unidad de diseño. Los campos X/Y/Ancho/Alto se escriben en píxeles REALES (4K) y se guardan en unidades de diseño.

  if (!window.DASHBOARD_DATA) {
    document.body.innerHTML = '<p style="padding:40px;font:16px sans-serif">No se encuentra <b>data/datos.js</b>. Comprueba que has descomprimido toda la carpeta del ZIP y que abres <b>editor.html</b> desde dentro de ella.</p>';
    return;
  }

  /* ---------- estado ---------- */
  let data = clone(window.DASHBOARD_DATA);
  let lang = 'es', selId = null, dirty = false, locked = false, playing = false, scale = 1, dirHandle = null;
  const pending = {};              // ruta -> File (imágenes elegidas que aún no están en /img)
  const posInputs = {};            // id -> {x,y,w,h,step}
  const stage = $('#stage');
  const TYPE_NAMES = { image: 'Imagen fija', network: 'Red en cifras', area: 'Gráfico de área', stat: 'Consumo medio',
                       stacked: 'Categorías (apilado)', multi: 'Curvas semanales' };
  /* Disposición por defecto, ya ajustada para caber en la zona visible estándar (1892×645 en
     unidades de diseño = 3784×1290 px reales, zona visible por defecto). Si cambias la zona
     visible, puede que esta disposición ya no encaje del todo: ajústala a mano o pulsa este botón
     de nuevo tras corregir la zona visible. */
  const DEFAULT_LAYOUT = {
    'img-trafico-movil': [50, 86, 419, 252, 0], 'img-telxius': [508, 86, 419, 252, 0],
    'img-red-internacional': [966, 86, 419, 252, 0], 'img-red-ip': [1417, 86, 419, 252, 0],
    'red-en-cifras': [50, 379, 419, 236, 1], 'trafico-total': [508, 379, 419, 110, 2],
    'consumo-medio': [508, 507, 419, 108, 2], 'trafico-categorias': [966, 379, 419, 236, 3],
    'semanal-fibra': [1417, 379, 419, 110, 4], 'semanal-cobre': [1417, 507, 419, 108, 4]
  };

  /* ---------- esquema de formularios (qué se puede editar en cada tipo de caja) ---------- */
  const T = (k, label, o) => Object.assign({ k, label, kind: 'text' }, o);
  const N = (k, label, o) => Object.assign({ k, label, kind: 'num' }, o);
  const S = (k, label, o) => Object.assign({ k, label, kind: 'str' }, o);
  const NUMS = 'Separa los valores con espacios, saltos de línea o punto y coma. Puedes pegar una columna de Excel. Decimales con coma o punto.';

  const GAUGE = [T('label', 'Texto bajo el medidor'), N('value', 'Valor'),
    N('max', 'Valor máximo', { hint: 'El medidor se llena al 100% con este valor.' }),
    S('prefix', 'Prefijo (ej. +)'), S('unit', 'Unidad (ej. M)')];
  const CHIP = [{ k: 'code', label: 'País', kind: 'country' }, N('value', 'Valor'),
    N('max', 'Valor máximo', { hint: 'Para porcentajes, pon 100.' }), S('prefix', 'Prefijo (ej. +)'), S('unit', 'Unidad (ej. % o M)')];
  const LINE = [T('label', 'Texto de la línea'), N('value', 'Valor'), S('prefix', 'Prefijo (ej. +)'), S('unit', 'Unidad (ej. M)')];
  const GROUP = [T('label', 'Etiqueta del grupo (ej. "Cobertura 5G")'),
    { k: 'items', label: 'Banderas', kind: 'list', fields: CHIP, summary: i => i.code || '' }];
  const ICON_HINT = 'Si subes tu propia imagen, se usa redonda en vez del icono. Tamaño recomendado: cuadrada, al menos 80 × 80 px.';
  const ICONITEM = [{ k: 'icon', label: 'Icono por defecto', kind: 'sel', options: [['coverage', 'Cobertura (barras)'], ['sites', 'Antena / sitios'], ['mobile', 'Móvil'], ['fixed', 'Red fija']] },
    { k: 'image', label: 'Imagen propia (opcional)', kind: 'image', hint: ICON_HINT },
    T('label', 'Etiqueta'), N('value', 'Valor'), N('max', 'Valor máximo (100%)'), S('prefix', 'Prefijo (ej. +)'), S('unit', 'Unidad (ej. % o K)')];
  const COL_FIELD = { k: 'col', label: 'Columna', kind: 'sel', options: [[1, 'Columna 1 (izquierda)'], [2, 'Columna 2 (derecha)']] };
  const BLOCK = {
    gauges: () => [COL_FIELD, T('title', 'Título del bloque'), { k: 'items', label: 'Medidores', kind: 'list', fields: GAUGE, summary: i => es(i.label) }],
    icons: () => [COL_FIELD, T('title', 'Título del bloque'), { k: 'items', label: 'Datos (con icono)', kind: 'list', fields: ICONITEM, summary: i => es(i.label) }],
    chips: blk => [COL_FIELD, T('title', 'Título del bloque')].concat(
      blk.groups
        ? [{ k: 'groups', label: 'Grupos de banderas', kind: 'list', fields: GROUP, summary: g => es(g.label) }]
        : [{ k: 'lines', label: 'Líneas de texto con cifra (opcional)', kind: 'list', fields: LINE, summary: l => es(l.label) },
           { k: 'items', label: 'Banderas', kind: 'list', fields: CHIP, summary: i => i.code || '' }]),
    note: () => [COL_FIELD, T('title', 'Título del bloque'), { k: 'image', label: 'Icono (imagen, opcional)', kind: 'image', hint: ICON_HINT }, T('text', 'Texto', { long: true }), { k: 'codes', label: 'Países', kind: 'countries' }],
    trend: () => [COL_FIELD, T('title', 'Título del bloque'), { k: 'labels', label: 'Etiquetas del eje (años)', kind: 'strs' },
            { k: 'values', label: 'Valores', kind: 'nums', hint: NUMS + ' Debe haber tantos valores como etiquetas.' }, S('badge', 'Etiqueta destacada (ej. -49%)')]
  };
  const BLOCK_NAMES = { gauges: 'Medidores', icons: 'Iconos', chips: 'Banderas', note: 'Nota', trend: 'Gráfico' };
  const SERIES = [T('name', 'Nombre'), { k: 'color', label: 'Color', kind: 'color' }, { k: 'values', label: 'Valores', kind: 'nums', hint: NUMS }];
  const SCHEMA = {
    image: [T('title', 'Título'), { k: 'image', label: 'Imagen fija', kind: 'image' }],
    network: [T('title', 'Título'), { k: 'blocks', label: 'Bloques (2 columnas)', kind: 'list', fixed: true,
      summary: b => `col.${+b.col || 1} · ${BLOCK_NAMES[b.type] || b.type} · ${es(b.title)}`,
      fields: b => (BLOCK[b.type] ? BLOCK[b.type](b) : [COL_FIELD]) }],
    area: [T('title', 'Título'), { k: 'xLabels', label: 'Etiquetas del eje (ej. 2023, 2024, 2025)', kind: 'strs' },
           { k: 'values', label: 'Valores', kind: 'nums', hint: NUMS }, S('badge', 'Etiqueta destacada (ej. +160%)')],
    stat: [T('title', 'Título'), { k: 'items', label: 'Datos', kind: 'list', summary: i => es(i.label),
           fields: [{ k: 'icon', label: 'Icono por defecto', kind: 'sel', options: [['fixed', 'Red fija'], ['mobile', 'Móvil']] },
                    { k: 'image', label: 'Imagen propia (opcional)', kind: 'image', hint: ICON_HINT },
                    T('label', 'Etiqueta'), T('text', 'Texto explicativo', { long: true }),
                    N('value', 'Valor'), N('max', 'Valor máximo (100% de la barra)'), T('unit', 'Unidad')] }],
    stacked: [T('title', 'Título'), { k: 'xLabels', label: 'Etiquetas del eje (ej. 2023, 2024, 2025)', kind: 'strs' },
              { k: 'series', label: 'Categorías (de abajo hacia arriba)', kind: 'list', summary: s => es(s.name), fields: SERIES,
                hint: 'Todas deben tener el mismo número de valores. Se convierten solas en porcentajes.' }],
    multi: [T('title', 'Título'), { k: 'days', label: 'Nombres de los días (separados por comas)', kind: 'texts' },
            { k: 'series', label: 'Curvas', kind: 'list', summary: s => es(s.name), fields: SERIES,
              hint: 'Todas deben tener el mismo número de valores, múltiplo de 7 (por ejemplo 28 = 4 por día).' }]
  };

  /* ---------- helpers de DOM ---------- */
  function el(tag, props, ...kids) {
    const e = document.createElement(tag);
    if (props) for (const [k, v] of Object.entries(props)) {
      if (k === 'class') e.className = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else if (v !== false && v != null) e.setAttribute(k, v === true ? '' : v);
    }
    kids.flat().forEach(c => { if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(c)); });
    return e;
  }
  const wrap = (label, hint, ...ctrl) => el('div', { class: 'e-field' }, label ? el('label', null, label) : null, ...ctrl, hint ? el('small', null, hint) : null);

  /* ---------- campos ---------- */
  function fText(obj, f, ctx) {
    let v = obj[f.k];
    if (typeof v !== 'object' || v === null || Array.isArray(v)) { v = { es: String(v ?? ''), en: String(v ?? '') }; obj[f.k] = v; }
    const mk = l => {
      const i = f.long ? el('textarea', { rows: 3 }) : el('input', { type: 'text' });
      i.value = v[l] || '';
      i.addEventListener('input', () => { v[l] = i.value; ctx.changed(); });
      return el('div', { class: 'e-lang' }, i, el('span', { class: 'e-tag' }, l.toUpperCase()));
    };
    return wrap(f.label, f.hint, el('div', { class: 'e-pair' }, mk('es'), mk('en')));
  }
  function fNum(obj, f, ctx) {
    const i = el('input', { type: 'number', step: 'any' });
    i.value = obj[f.k] ?? '';
    i.addEventListener('input', () => { const n = parseFloat(i.value); if (isFinite(n)) { obj[f.k] = n; ctx.changed(); } });
    return wrap(f.label, f.hint, i);
  }
  function fStr(obj, f, ctx) {
    const raw = obj[f.k];
    const i = el('input', { type: 'text' });
    i.value = (raw && typeof raw === 'object') ? es(raw) : (raw ?? '');
    i.addEventListener('input', () => { obj[f.k] = i.value; ctx.changed(); });
    return wrap(f.label, f.hint, i);
  }
  function fSel(obj, f, ctx) {
    const s = el('select', null, f.options.map(([v, l]) => el('option', { value: v }, l)));
    s.value = obj[f.k] ?? f.options[0][0];
    s.addEventListener('change', () => { obj[f.k] = s.value; ctx.changed(); });
    return wrap(f.label, f.hint, s);
  }
  function fColor(obj, f, ctx) {
    const i = el('input', { type: 'color' });
    i.value = /^#[0-9a-f]{6}$/i.test(obj[f.k]) ? obj[f.k] : '#ffffff';
    i.addEventListener('input', () => { obj[f.k] = i.value; ctx.changed(); });
    return wrap(f.label, f.hint, i);
  }
  function parseNums(text) {
    const toks = text.split(/[\n\r\t; ]+/).filter(Boolean)
      .flatMap(k => ((k.match(/,/g) || []).length > 1) ? k.split(',') : [k.replace(',', '.')]).filter(Boolean);
    const nums = toks.map(Number);
    return { nums: nums.filter(isFinite), bad: nums.filter(n => !isFinite(n)).length };
  }
  function fNums(obj, f, ctx) {
    const ta = el('textarea', { rows: 3 });
    ta.value = (obj[f.k] || []).join(' ');
    const info = el('small', { class: 'e-count' });
    const upd = () => { const r = parseNums(ta.value); info.textContent = r.nums.length + ' valores' + (r.bad ? ' · ' + r.bad + ' no son números y se ignoran' : ''); info.classList.toggle('e-bad', !!r.bad); return r; };
    ta.addEventListener('input', () => { const r = upd(); obj[f.k] = r.nums; ctx.changed(); });
    upd();
    return wrap(f.label, f.hint, ta, info);
  }
  function fStrs(obj, f, ctx) {
    const i = el('input', { type: 'text' });
    i.value = (obj[f.k] || []).join(', ');
    i.addEventListener('input', () => { obj[f.k] = i.value.split(',').map(x => x.trim()).filter(Boolean); ctx.changed(); });
    return wrap(f.label, f.hint, i);
  }
  const FLAGS_SORTED = [...(window.FLAGS_LIST || [])].sort((a, b) => a.PAIS.localeCompare(b.PAIS, 'es'));
  const flagSrc = iso => { const f = (window.FLAGS_LIST || []).find(x => x.ISO === iso); return f ? 'img/flags/' + f.IMAGEN : ''; };
  const flagChipEl = iso => {
    const src = flagSrc(iso);
    const img = el('span', { class: 'e-flagchip' + (src ? '' : ' e-flagchip-empty') });
    if (src) img.append(el('img', { src, alt: iso }));
    else img.textContent = iso || '?';
    return img;
  };
  function fCountry(obj, f, ctx) {
    const row = el('div', { class: 'e-country' });
    const sel = el('select', null, FLAGS_SORTED.map(c => el('option', { value: c.ISO }, c.PAIS + ' (' + c.ISO + ')')));
    sel.value = obj[f.k] || (FLAGS_SORTED[0] && FLAGS_SORTED[0].ISO) || '';
    let chip = flagChipEl(sel.value);
    row.append(chip, sel);
    sel.addEventListener('change', () => { obj[f.k] = sel.value; const n = flagChipEl(sel.value); row.replaceChild(n, chip); chip = n; ctx.changed(); });
    return wrap(f.label, f.hint, row);
  }
  function fCountries(obj, f, ctx) {
    const arr = obj[f.k] = obj[f.k] || [];
    const box = el('div', { class: 'e-countries' });
    const chips = el('div', { class: 'e-countrychips' });
    const addRow = el('div', { class: 'e-country' });
    const redraw = () => {
      chips.innerHTML = '';
      arr.forEach((iso, i) => {
        const rm = el('button', { class: 'e-mini danger', type: 'button', title: 'Quitar' }, '✕');
        rm.addEventListener('click', () => { arr.splice(i, 1); redraw(); ctx.changed(); });
        const c = flagChipEl(iso);
        chips.append(el('span', { class: 'e-countrychip' }, c, rm));
      });
      sel.innerHTML = '';
      FLAGS_SORTED.filter(c => !arr.includes(c.ISO)).forEach(c => sel.append(el('option', { value: c.ISO }, c.PAIS + ' (' + c.ISO + ')')));
    };
    const sel = el('select');
    const add = el('button', { class: 'e-mini', type: 'button' }, '+ Añadir');
    add.addEventListener('click', () => { if (sel.value) { arr.push(sel.value); redraw(); ctx.changed(); } });
    addRow.append(sel, add);
    redraw();
    box.append(chips, addRow);
    return wrap(f.label, f.hint, box);
  }
  function fTexts(obj, f, ctx) {     // {es:[..], en:[..]}
    let v = obj[f.k]; if (!v || Array.isArray(v)) { v = { es: [], en: [] }; obj[f.k] = v; }
    const mk = l => {
      const i = el('input', { type: 'text' }); i.value = (v[l] || []).join(', ');
      i.addEventListener('input', () => { v[l] = i.value.split(',').map(x => x.trim()).filter(Boolean); ctx.changed(); });
      return el('div', { class: 'e-lang' }, i, el('span', { class: 'e-tag' }, l.toUpperCase()));
    };
    return wrap(f.label, f.hint, el('div', { class: 'e-pair' }, mk('es'), mk('en')));
  }
  let imgCb = null;
  function pickImage(cb) { imgCb = cb; $('#e-file-img').click(); }
  $('#e-file-img').addEventListener('change', e => {
    const file = e.target.files[0]; e.target.value = '';
    if (!file || !imgCb) return;
    const path = 'img/' + file.name.replace(/[^\w.\-]+/g, '_');
    pending[path] = file; D.imageOverrides[path] = URL.createObjectURL(file);
    imgCb(path);
    say('Imagen elegida: ' + path + '. Al guardar se copiará a la carpeta img.', 'ok');
  });
  function fImage(obj, f, ctx) {
    const box = el('div', { class: 'e-field' }, el('label', null, f.label));
    const draw = () => {
      [...box.querySelectorAll(':scope>*:not(label:first-child)')].forEach(n => n.remove());
      const per = typeof obj[f.k] === 'object' && obj[f.k] !== null;
      const chk = el('input', { type: 'checkbox' }); chk.checked = per;
      chk.addEventListener('change', () => {
        const cur = per ? (obj[f.k].es || '') : (obj[f.k] || '');
        obj[f.k] = chk.checked ? { es: cur, en: cur } : cur;
        draw(); ctx.changed();
      });
      box.append(el('label', { class: 'e-chk' }, chk, 'Usar una imagen distinta en cada idioma'));
      const row = (get, set, tag) => {
        const inp = el('input', { type: 'text' }); inp.value = get();
        inp.addEventListener('input', () => { set(inp.value); ctx.changed(); });
        const btn = el('button', { class: 'e-mini', type: 'button', onclick: () => pickImage(p => { set(p); inp.value = p; ctx.changed(); }) }, 'Elegir imagen…');
        return el('div', { class: 'e-imgrow' }, tag ? el('span', { class: 'e-tag' }, tag) : null, inp, btn);
      };
      if (per) ['es', 'en'].forEach(l => box.append(row(() => obj[f.k][l] || '', v => { obj[f.k][l] = v; }, l.toUpperCase())));
      else box.append(row(() => obj[f.k] || '', v => { obj[f.k] = v; }));
      box.append(el('small', null, f.hint || 'Las imágenes viven en la carpeta img. Tamaño recomendado: el de la caja (por defecto 429 × 250 px; mejor el doble, 858 × 500).'));
    };
    draw();
    return box;
  }
  function fList(obj, f, ctx) {
    const arr = obj[f.k] = obj[f.k] || [];
    const listEl = el('div', { class: 'e-list' });
    const redraw = openIdx => {
      listEl.innerHTML = '';
      arr.forEach((it, i) => {
        const fields = typeof f.fields === 'function' ? f.fields(it) : f.fields;
        const det = el('details', { class: 'e-item' });
        const op = (label, title, fn, dis, cls) => el('button', { class: 'e-mini ' + (cls || ''), type: 'button', title, disabled: dis || null,
          onclick: ev => { ev.preventDefault(); ev.stopPropagation(); fn(); } }, label);
        const ops = f.fixed ? null : el('span', { class: 'e-ops' },
          op('↑', 'Subir', () => { [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; redraw(i - 1); ctx.changed(); }, i === 0),
          op('↓', 'Bajar', () => { [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]]; redraw(i + 1); ctx.changed(); }, i === arr.length - 1),
          op('✕', 'Quitar', () => { if (confirm('¿Quitar este elemento?')) { arr.splice(i, 1); redraw(); ctx.changed(); } }, arr.length <= 1, 'danger'));
        det.append(el('summary', null, el('span', { class: 'e-sn' }, (f.summary ? f.summary(it, i) : '') || ('Elemento ' + (i + 1))), ops),
          el('div', { class: 'e-inner' }, fields.map(ff => buildField(it, ff, ctx))));
        if (i === openIdx) det.open = true;
        listEl.append(det);
      });
      if (!f.fixed) listEl.append(el('button', { class: 'e-mini e-add', type: 'button',
        onclick: () => { arr.push(clone(arr[arr.length - 1] || {})); redraw(arr.length - 1); ctx.changed(); } }, '+ Añadir otro (copia el último)'));
    };
    redraw();
    return wrap(f.label, f.hint, listEl);
  }
  const KINDS = { text: fText, num: fNum, str: fStr, sel: fSel, color: fColor, nums: fNums, strs: fStrs, texts: fTexts, image: fImage, list: fList, country: fCountry, countries: fCountries };
  const buildField = (obj, f, ctx) => KINDS[f.kind](obj, f, ctx);

  /* ---------- formulario lateral ---------- */
  function ensureMeta(d) {
    d.meta = d.meta || {};
    d.meta.safe = d.meta.safe || { w: CANVAS.w, h: CANVAS.h };
    if (d.meta.safe.w == null) d.meta.safe.w = CANVAS.w;
    if (d.meta.safe.h == null) d.meta.safe.h = CANVAS.h;
    d.meta.canvas = d.meta.canvas || { w: CANVAS.w, h: CANVAS.h };
    if (!d.meta.bg || d.meta.bg.length < 2) d.meta.bg = ['#67769b', '#7b88a8', '#56648b', '#2c3653', '#232c46'];
    if (d.meta.topTitleSize == null) d.meta.topTitleSize = 13.5;
    if (d.meta.cardTitleSize == null) d.meta.cardTitleSize = 13;
    d.ui = d.ui || {};
    d.ui.title_pos = d.ui.title_pos || { x: 48, y: 36, size: 34 };
    return d;
  }
  ensureMeta(data);
  function safeInput(key) {
    const i = el('input', { type: 'number', step: '1', min: '0', max: String(CANVAS[key]) });
    i.value = (data.meta.safe && data.meta.safe[key]) ?? CANVAS[key];
    i.addEventListener('input', () => { const n = parseFloat(i.value); if (isFinite(n)) { data.meta.safe[key] = n; changed('all'); drawSafe(); } });
    return i;
  }
  function titlePosInput(key) {
    const real = key === 'x' || key === 'y';   // X e Y en píxeles reales 4K; el tamaño de letra no cambia
    const i = el('input', { type: 'number', step: '1' });
    i.value = real ? Math.round(data.ui.title_pos[key] * PX) : data.ui.title_pos[key];
    i.addEventListener('input', () => { const n = parseFloat(i.value); if (isFinite(n)) { data.ui.title_pos[key] = real ? n / PX : n; changed('all'); } });
    return i;
  }
  function bgColorInput(i) {
    const inp = el('input', { type: 'color' });
    inp.value = /^#[0-9a-f]{6}$/i.test(data.meta.bg[i]) ? data.meta.bg[i] : '#67769b';
    inp.addEventListener('input', () => { data.meta.bg[i] = inp.value; changed('all'); });
    return inp;
  }
  function sizeInput(obj, key, def) {
    const i = el('input', { type: 'number', step: '0.5', min: '6' });
    i.value = obj[key] ?? def;
    i.addEventListener('input', () => { const n = parseFloat(i.value); if (isFinite(n)) { obj[key] = n; changed('all'); } });
    return i;
  }
  function posSection(b) {
    const grid = el('div', { class: 'e-posgrid' });
    posInputs[b.id] = {};
    [['x', 'X (px)'], ['y', 'Y (px)'], ['w', 'Ancho (px)'], ['h', 'Alto (px)'], ['step', 'Orden']].forEach(([k, lab]) => {
      const real = k !== 'step';   // X/Y/Ancho/Alto en píxeles reales 4K; "Orden" es un número de secuencia
      const i = el('input', { type: 'number', step: '1' }); i.value = real ? Math.round((b[k] ?? 0) * PX) : (b[k] ?? 0);
      i.addEventListener('input', () => { const n = parseFloat(i.value); if (isFinite(n)) { b[k] = real ? n / PX : n; changed(b); } });
      posInputs[b.id][k] = i; grid.append(el('label', null, lab, i));
    });
    const sf = data.meta.safe || CANVAS;
    return el('div', { class: 'e-pos' }, el('h5', null, 'Posición y tamaño'), grid,
      el('small', null, `Coordenadas en píxeles de la pantalla real (${CANVAS.w} × ${CANVAS.h} px), contados desde la esquina superior izquierda (0, 0). Zona visible: ${sf.w} × ${sf.h} px.`),
      el('small', null, 'También puedes arrastrar la caja en la vista previa y cambiar su tamaño con los cuadraditos (con Alt se mueve sin cuadrícula; con las flechas del teclado, de 2 en 2 px, o de 20 en 20 con Mayús). Las cajas con el mismo "Orden" aparecen a la vez.'));
  }
  function boxForm(b) {
    const ctx = { changed: () => changed(b) };
    const acc = el('details', { class: 'e-acc e-box', 'data-id': b.id },
      el('summary', null, el('span', { class: 'e-ttl' }, es(b.title) || b.id), el('span', { class: 'e-kind' }, TYPE_NAMES[b.type] || b.type)));
    const inner = el('div', { class: 'e-inner' });
    (SCHEMA[b.type] || []).forEach(f => inner.append(buildField(b, f, ctx)));
    inner.append(posSection(b), el('div', { class: 'e-rowbtns' },
      el('button', { class: 'e-mini', type: 'button', onclick: () => dupBox(b) }, 'Duplicar caja'),
      el('button', { class: 'e-mini danger', type: 'button', onclick: () => delBox(b) }, 'Eliminar caja')));
    acc.append(inner);
    return acc;
  }
  function logoSection() {            // logo de Telefónica, a la izquierda del selector de idioma
    const lg = data.ui.logo = data.ui.logo || { enabled: false, src: '', height: 40 };
    const chk = el('input', { type: 'checkbox' }); chk.checked = !!lg.enabled;
    chk.addEventListener('change', () => { lg.enabled = chk.checked; changed('all'); });
    const inp = el('input', { type: 'text', placeholder: 'img/logo-telefonica.png' }); inp.value = lg.src || '';
    inp.addEventListener('input', () => { lg.src = inp.value.trim(); changed('all'); });
    const btn = el('button', { class: 'e-mini', type: 'button', onclick: () => pickImage(p => { lg.src = p; inp.value = p; lg.enabled = true; chk.checked = true; changed('all'); }) }, 'Elegir imagen…');
    return el('div', { class: 'e-pos' }, el('h5', null, 'Logo de Telefónica (a la izquierda del selector de idioma)'),
      el('label', { class: 'e-chk' }, chk, 'Mostrar el logo en la cabecera'),
      el('div', { class: 'e-imgrow' }, inp, btn),
      el('label', null, 'Alto del logo (unidades de diseño; en la pantalla 4K ocupa el doble)', sizeInput(lg, 'height', 40)),
      el('small', null, 'Mejor un PNG con fondo transparente (o SVG). Se copia a la carpeta img al guardar. El alto por defecto, 40, son 80 px en la pantalla 4K, parecido al del selector de idioma.'));
  }
  function buildForm() {
    const root = $('#e-form'); root.innerHTML = '';
    Object.keys(posInputs).forEach(k => delete posInputs[k]);
    const gctx = { changed: () => changed('all') };
    const g = el('details', { class: 'e-acc' }, el('summary', null, el('span', { class: 'e-ttl' }, '⚙ General'), el('span', { class: 'e-kind' }, 'Título y tiempos')));
    data.ui.title_pos = data.ui.title_pos || { x: 48, y: 36, size: 34 };
    data.meta.bg = (data.meta.bg && data.meta.bg.length >= 2) ? data.meta.bg : ['#67769b', '#7b88a8', '#56648b', '#2c3653', '#232c46'];
    g.append(el('div', { class: 'e-inner' },
      buildField(data.ui, T('title', 'Título del dashboard'), gctx),
      el('div', { class: 'e-pos' }, el('h5', null, 'Posición y tamaño del título'),
        el('div', { class: 'e-posgrid', style: 'grid-template-columns:1fr 1fr 1fr' },
          el('label', null, 'X', titlePosInput('x')),
          el('label', null, 'Y', titlePosInput('y')),
          el('label', null, 'Tamaño de letra', titlePosInput('size')))),
      logoSection(),
      el('div', { class: 'e-pos' }, el('h5', null, 'Color de fondo de la pantalla (degradado de arriba a abajo)'),
        el('div', { class: 'e-bgrow' }, data.meta.bg.map((_, i) => bgColorInput(i)))),
      el('div', { class: 'e-posgrid', style: 'grid-template-columns:1fr 1fr;margin-top:10px' },
        el('label', null, 'Tamaño de letra — títulos de las 4 cajas superiores', sizeInput(data.meta, 'topTitleSize', 13.5)),
        el('label', null, 'Tamaño de letra — títulos de las tarjetas de datos', sizeInput(data.meta, 'cardTitleSize', 13))),
      buildField(data.meta, { k: 'defaultLang', label: 'Idioma con el que arranca', kind: 'sel', options: [['es', 'Español'], ['en', 'English']] }, gctx),
      buildField(data.meta, N('stepSeconds', 'Segundos entre la aparición de una caja y la siguiente'), gctx),
      buildField(data.meta, N('loopSeconds', 'Repetir la animación cada … segundos', { hint: '0 = no se repite.' }), gctx),
      el('div', { class: 'e-pos' }, el('h5', null, 'Zona visible en la pantalla real'),
        el('div', { class: 'e-posgrid', style: 'grid-template-columns:1fr 1fr' },
          el('label', null, 'Ancho visible (px, de ' + CANVAS.w + ')', safeInput('w')),
          el('label', null, 'Alto visible (px, de ' + CANVAS.h + ')', safeInput('h'))),
        el('small', null, `La pantalla real es de ${CANVAS.w} × ${CANVAS.h} px, anclada en la esquina superior izquierda (0,0). Todo lo que quede fuera del rectángulo rayado en rojo de la vista previa no se verá. Ajusta estos dos números si cambia la zona visible; no afecta al dashboard, solo es una guía.`)),
      el('button', { class: 'e-mini', type: 'button', onclick: restoreLayout }, 'Restaurar la colocación original de las cajas')));
    root.append(g);
    data.boxes.forEach(b => root.append(boxForm(b)));
    if (selId) openAcc(selId, true);
  }
  function openAcc(id, noScroll) {
    document.querySelectorAll('.e-box').forEach(d => {
      const open = d.dataset.id === id; if (d.open !== open) d.open = open;
      if (open && !noScroll) d.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  }
  $('#e-form').addEventListener('toggle', e => {
    const d = e.target;
    if (!d.classList || !d.classList.contains('e-box') || !d.open) return;
    document.querySelectorAll('.e-box').forEach(o => { if (o !== d && o.open) o.open = false; });
    if (selId !== d.dataset.id) { selId = d.dataset.id; drawSel(); }
  }, true);

  function dupBox(b) {
    const n = clone(b); n.id = b.type + '-' + Date.now().toString(36); n.x = Math.min(1920 - n.w, n.x + 30); n.y = Math.min(1080 - n.h, n.y + 30);
    data.boxes.splice(data.boxes.indexOf(b) + 1, 0, n); selId = n.id; buildForm(); rebuild(); setDirty();
  }
  function delBox(b) {
    if (!confirm('¿Eliminar la caja "' + (es(b.title) || b.id) + '"? Se puede recuperar importando un JSON anterior.')) return;
    data.boxes.splice(data.boxes.indexOf(b), 1); if (selId === b.id) selId = null; buildForm(); rebuild(); setDirty();
  }
  function restoreLayout() {
    if (!confirm('¿Restaurar la posición, el tamaño y el orden originales de las cajas?')) return;
    data.boxes.forEach(b => { const d = DEFAULT_LAYOUT[b.id]; if (d) { b.x = d[0]; b.y = d[1]; b.w = d[2]; b.h = d[3]; b.step = d[4]; } });
    buildForm(); rebuild(); setDirty();
  }

  /* ---------- vista previa ---------- */
  const queue = new Set(); let qt = 0;
  function changed(scope) {
    setDirty(); queue.add(scope); clearTimeout(qt);
    qt = setTimeout(() => {
      const all = queue.has('all') || playing, boxes = [...queue].filter(x => x !== 'all'); queue.clear();
      if (all) rebuild(); else { boxes.forEach(b => D.fillBox(stage, b)); drawSel(); markOverflow(); }
    }, 90);
  }
  function rebuild() { playing = false; D.build(stage, data, lang, { instant: true, editor: true }); drawSel(); drawSafe(); markOverflow(); }
  function drawSafe() {
    const old = stage.querySelector('#e-safe'); if (old) old.remove();
    const safe = data.meta.safe || {};
    const sw = Math.max(0, Math.min(CANVAS.w, +safe.w || CANVAS.w)) * DESIGN_SCALE;   // a unidades de diseño (1920×1080)
    const sh = Math.max(0, Math.min(CANVAS.h, +safe.h || CANVAS.h)) * DESIGN_SCALE;
    if (playing || (sw >= 1920 && sh >= 1080)) return;
    const frag = el('div', { id: 'e-safe' });
    if (sw < 1920) frag.append(el('div', { class: 'zone v', style: `left:${sw}px;top:0;width:${1920 - sw}px;height:1080px` }));
    if (sh < 1080) frag.append(el('div', { class: 'zone h', style: `left:0;top:${sh}px;width:${Math.min(sw, 1920)}px;height:${1080 - sh}px` }));
    frag.append(el('div', { class: 'line v', style: `left:${sw}px;top:0;height:${Math.min(sh, 1080)}px` }),
      el('div', { class: 'line h', style: `left:0;top:${sh}px;width:${Math.min(sw, 1920)}px` }),
      el('div', { class: 'tag', style: `left:${Math.max(4, Math.min(sw, 1920) - 210)}px;top:${Math.max(4, sh - 30)}px` }, 'No visible en la pantalla real'));
    stage.append(frag);
  }
  function markOverflow() {
    const safe2 = data.meta.safe || {};
    const sw = (+safe2.w || CANVAS.w) * DESIGN_SCALE, sh = (+safe2.h || CANVAS.h) * DESIGN_SCALE;
    document.querySelectorAll('.e-box').forEach(d => {
      const b = data.boxes.find(x => x.id === d.dataset.id);
      d.querySelector('summary').classList.toggle('e-warn', !!(b && (sw < 1920 || sh < 1080) && (b.x + b.w > sw || b.y + b.h > sh)));
    });
  }
  const selBox = () => data.boxes.find(b => b.id === selId);
  function drawSel() {
    const old = stage.querySelector('#e-sel'); if (old) old.remove();
    const b = selBox(); if (!b || playing) return;
    const s = el('div', { id: 'e-sel', style: `left:${b.x}px;top:${b.y}px;width:${b.w}px;height:${b.h}px` });
    ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].forEach(h => s.append(el('i', { class: 'hd ' + h, 'data-h': h })));
    stage.append(s);
  }
  function select(id) { selId = id; drawSel(); openAcc(id); }
  function syncPos(b) { const p = posInputs[b.id]; if (p) ['x', 'y', 'w', 'h'].forEach(k => { p[k].value = Math.round(b[k] * PX); }); }
  function fit() {
    const pv = $('#e-pv'), w = pv.clientWidth - 24, h = pv.clientHeight - 24;
    scale = Math.max(.1, Math.min(w / 1920, h / 1080));
    const wr = $('#e-pvwrap'); wr.style.width = 1920 * scale + 'px'; wr.style.height = 1080 * scale + 'px';
    stage.style.transform = `scale(${scale})`;
    lastDiag = `vista previa: contenedor ${Math.round(pv.clientWidth)}×${Math.round(pv.clientHeight)}px, ` +
      `caja ${Math.round(1920 * scale)}×${Math.round(1080 * scale)}px, escala ${scale.toFixed(2)}, ` +
      `dashboard.css ${(getComputedStyle(stage).backgroundImage || '').includes('gradient') ? 'cargado' : 'NO cargado'}`;
  }
  let lastDiag = '';
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(fit).observe($('#e-pv')); else addEventListener('resize', fit);

  /* arrastrar y redimensionar */
  stage.addEventListener('pointerdown', e => {
    if (playing) return;
    const hd = e.target.closest && e.target.closest('.hd'), bx = e.target.closest && e.target.closest('.box');
    if (hd) return startDrag('resize', hd.dataset.h, e);
    if (bx) { if (bx.dataset.id !== selId) select(bx.dataset.id); if (!locked) startDrag('move', null, e); }
  });
  function startDrag(mode, hn, e) {
    const b = selBox(); if (!b) return; e.preventDefault();
    const sx = e.clientX, sy = e.clientY, o = { x: b.x, y: b.y, w: b.w, h: b.h };
    const boxEl = [...stage.querySelectorAll('.box')].find(x => x.dataset.id === b.id);
    let raf = 0, moved = false;
    const MIN_W = 140, MIN_H = 90;
    const mv = ev => {
      const g = ev.altKey ? 1 : 10, dx = (ev.clientX - sx) / scale, dy = (ev.clientY - sy) / scale, sn = v => Math.round(v / g) * g;
      let x = o.x, y = o.y, w = o.w, h = o.h;
      if (mode === 'move') {
        x = Math.max(0, Math.min(1920 - w, sn(o.x + dx))); y = Math.max(0, Math.min(1080 - h, sn(o.y + dy)));
      } else {
        if (hn.includes('e')) w = o.w + dx; if (hn.includes('w')) w = o.w - dx;
        if (hn.includes('s')) h = o.h + dy; if (hn.includes('n')) h = o.h - dy;
        w = Math.max(MIN_W, sn(w)); h = Math.max(MIN_H, sn(h));
        if (hn.includes('w')) x = o.x + o.w - w; if (hn.includes('n')) y = o.y + o.h - h;
        x = Math.max(0, x); y = Math.max(0, y); w = Math.min(w, 1920 - x); h = Math.min(h, 1080 - y);
      }
      Object.assign(b, { x, y, w, h }); moved = true; setDirty();
      if (mode === 'move') { boxEl.style.left = x + 'px'; boxEl.style.top = y + 'px'; drawSel(); syncPos(b); markOverflow(); }
      else if (!raf) raf = requestAnimationFrame(() => { raf = 0; D.fillBox(stage, b); drawSel(); syncPos(b); markOverflow(); });
    };
    const up = () => {
      stage.removeEventListener('pointermove', mv); stage.removeEventListener('pointerup', up); stage.removeEventListener('pointercancel', up);
      try { stage.releasePointerCapture(e.pointerId); } catch (_) { /* nada */ }
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      if (moved) { D.fillBox(stage, b); drawSel(); syncPos(b); markOverflow(); }
    };
    try { stage.setPointerCapture(e.pointerId); } catch (_) { /* nada */ }
    stage.addEventListener('pointermove', mv); stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);
  }
  document.addEventListener('keydown', e => {
    const b = selBox();
    if (!b || locked || playing || /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(document.activeElement.tagName)) return;
    const st = e.shiftKey ? 10 : 1, d = { ArrowLeft: [-st, 0], ArrowRight: [st, 0], ArrowUp: [0, -st], ArrowDown: [0, st] }[e.key];
    if (!d) return; e.preventDefault();
    b.x = Math.max(0, Math.min(1920 - b.w, b.x + d[0])); b.y = Math.max(0, Math.min(1080 - b.h, b.y + d[1]));
    changed(b); syncPos(b);
  });

  /* ---------- barra de herramientas ---------- */
  document.querySelectorAll('.e-seg button').forEach(bt => bt.addEventListener('click', () => {
    lang = bt.dataset.l; document.querySelectorAll('.e-seg button').forEach(x => x.classList.toggle('on', x === bt)); rebuild();
  }));
  $('#e-play').addEventListener('click', () => {
    const s = stage.querySelector('#e-sel'); if (s) s.remove();
    playing = true; D.build(stage, data, lang, { instant: false, editor: true }); void stage.offsetWidth; D.play(stage, data);
    say('Reproduciendo la animación. En cuanto edites algo, vuelves a la vista de edición.');
  });
  $('#e-lock').addEventListener('change', e => { locked = e.target.checked; $('#e-pvwrap').classList.toggle('locked', locked); });

  /* ---------- estado, borrador y avisos ---------- */
  function say(msg, kind) { const s = $('#e-status'); s.textContent = msg; s.className = kind || ''; }
  let draftT = 0;
  function setDirty() {
    dirty = true; $('#e-save').classList.add('dirty'); $('#e-save').textContent = 'Guardar cambios ●';
    clearTimeout(draftT); draftT = setTimeout(() => { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(data)); } catch (_) { /* nada */ } }, 600);
  }
  function clearDirty() {
    dirty = false; $('#e-save').classList.remove('dirty'); $('#e-save').textContent = 'Guardar cambios';
    try { localStorage.removeItem(DRAFT_KEY); } catch (_) { /* nada */ }
  }
  addEventListener('beforeunload', e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

  /* ---------- guardar / exportar / importar ---------- */
  function compactJSON(d) {         // números en una línea para que el archivo sea legible
    return JSON.stringify(d, null, 2).replace(/\[\s*((?:-?[\d.]+,?\s*)+)\]/g, (m, g) => '[' + g.replace(/\s+/g, ' ').trim() + ']');
  }
  const jsonText = () => compactJSON(data) + '\n';
  const fileText = () => 'window.DASHBOARD_DATA = ' + compactJSON(data) + ';\n';
  function download(name, text, type) {
    const a = el('a', { href: URL.createObjectURL(new Blob([text], { type: type || 'text/plain' })), download: name });
    document.body.append(a); a.click(); a.remove();
  }
  /* OJO: la carpeta elegida se recuerda solo mientras esta pestaña sigue abierta (variable dirHandle,
     más abajo), nunca entre sesiones. Si se guardara en el navegador de una sesión a otra, un ZIP
     nuevo descomprimido en una carpeta distinta podría escribir por error en la carpeta antigua sin
     avisar — eso es justo lo que causaba que "Guardar cambios" pareciera no hacer nada. */
  async function writeFile(dir, name, content) { const fh = await dir.getFileHandle(name, { create: true }); const w = await fh.createWritable(); await w.write(content); await w.close(); }
  const isRoot = async h => { try { await h.getFileHandle('editor.html'); return true; } catch (_) { return false; } };
  const explain = () => new Promise(res => {
    const dlg = $('#e-dlg');
    $('#e-dlg-ok').onclick = () => { dlg.close(); res(true); }; $('#e-dlg-cancel').onclick = () => { dlg.close(); res(false); };
    dlg.showModal();
  });
  /* todas las imágenes que usa el dashboard: cajas, iconos de datos, bloques, grupos de banderas y logo */
  const usedImages = () => {
    const one = v => (v && typeof v === 'object') ? [v.es, v.en] : [v], out = [];
    const items = a => (a || []).forEach(i => out.push(...one(i.image)));
    data.boxes.forEach(b => { out.push(...one(b.image)); items(b.items); (b.blocks || []).forEach(k => { out.push(...one(k.image)); items(k.items); (k.groups || []).forEach(g => items(g.items)); }); });
    if (data.ui.logo && data.ui.logo.enabled) out.push(data.ui.logo.src);
    return new Set(out.filter(Boolean));
  };

  async function save() {
    if (window.showDirectoryPicker) {
      try {
        let h = dirHandle;
        if (h) {
          let p = await h.queryPermission({ mode: 'readwrite' });
          if (p !== 'granted') p = await h.requestPermission({ mode: 'readwrite' });
          if (p !== 'granted' || !(await isRoot(h))) h = null;
        }
        if (!h) {
          if (!(await explain())) return say('Guardado cancelado.');
          h = await window.showDirectoryPicker({ mode: 'readwrite' });
          if (!(await isRoot(h))) return say('Esa no es la carpeta del dashboard: debe contener editor.html. Pulsa Guardar y elige la carpeta correcta.', 'err');
        }
        dirHandle = h;
        const dd = await h.getDirectoryHandle('data', { create: true });
        await writeFile(dd, 'datos.js', fileText()); await writeFile(dd, 'dashboard.json', jsonText());
        const used = usedImages(); let n = 0;
        for (const [path, file] of Object.entries(pending)) {
          if (!used.has(path)) continue;
          const parts = path.split('/'); let d = h;
          for (const p of parts.slice(0, -1)) d = await d.getDirectoryHandle(p, { create: true });
          await writeFile(d, parts[parts.length - 1], file); delete pending[path]; n++;
        }
        clearDirty();
        return say('Guardado en la carpeta "' + h.name + '"' + (n ? ' (y ' + n + ' imagen/es copiadas a la carpeta img)' : '') + '. Abre index.html para ver el resultado.', 'ok');
      } catch (err) {
        if (err && err.name === 'AbortError') return say('Guardado cancelado.');
        console.error(err); say('No se ha podido escribir en la carpeta; se descarga el archivo en su lugar.', 'err');
      }
    }
    // Alternativa (Firefox, Safari…): descarga de datos.js
    download('datos.js', fileText(), 'text/javascript');
    const imgs = Object.keys(pending).filter(p => usedImages().has(p));
    clearDirty();
    say('Se ha descargado datos.js: cópialo en la carpeta "data" reemplazando el existente.' + (imgs.length ? ' Copia también a la carpeta "img" estas imágenes: ' + imgs.map(p => p.replace('img/', '')).join(', ') + '.' : ''), 'ok');
  }
  $('#e-save').addEventListener('click', save);
  /* El título del diálogo ("Abrir", "Guardar como") lo pone el sistema y una web no puede cambiarlo.
     Lo que sí se puede: avisar en la barra de estado, rellenar "Nombre" al exportar y escribir el
     archivo a buscar en el desplegable de tipo de archivo (abajo a la derecha) al importar. */
  const JSON_NAME = 'dashboard.json', JSON_HINT = 'Selecciona el archivo data/dashboard.json';
  const askJSON = (title, ok) => new Promise(res => {          // aviso previo: el título del diálogo del sistema no se puede cambiar
    const dlg = $('#e-dlg-json');
    $('#e-dj-t').textContent = title; $('#e-dj-p').innerHTML = '<b>' + JSON_HINT + '</b>'; $('#e-dj-ok').textContent = ok;
    $('#e-dj-ok').onclick = () => { dlg.close(); res(true); }; $('#e-dj-cancel').onclick = () => { dlg.close(); res(false); };
    dlg.addEventListener('cancel', () => res(false), { once: true });
    dlg.showModal();
  });
  function loadImported(text) {
    try {
      const d = JSON.parse(String(text).replace(/^\s*window\.DASHBOARD_DATA\s*=\s*/, '').replace(/;\s*$/, ''));
      if (!d || !Array.isArray(d.boxes) || !d.meta || !d.ui) throw new Error('formato');
      data = d; ensureMeta(data); selId = null; buildForm(); rebuild(); setDirty(); say('Datos importados. Revisa y pulsa Guardar cambios.', 'ok');
    } catch (_) { say('Ese archivo no tiene el formato esperado (JSON del dashboard).', 'err'); }
  }
  $('#e-export').addEventListener('click', async () => {
    if (!(await askJSON('Exportar JSON', 'Elegir dónde guardar'))) return say('Exportación cancelada.');
    if (window.showSaveFilePicker) {
      try {
        const fh = await window.showSaveFilePicker({ suggestedName: JSON_NAME, id: 'lared-json', types: [{ description: JSON_HINT, accept: { 'application/json': ['.json'] } }] });
        const w = await fh.createWritable(); await w.write(jsonText()); await w.close();
        return say('JSON exportado como "' + fh.name + '".', 'ok');
      } catch (err) { if (err && err.name === 'AbortError') return say('Exportación cancelada.'); console.error(err); }
    }
    download(JSON_NAME, jsonText(), 'application/json'); say('JSON exportado (' + JSON_NAME + ').', 'ok');
  });
  $('#e-import').addEventListener('click', async () => {
    if (!(await askJSON('Importar JSON', 'Elegir archivo'))) return say('Importación cancelada.');
    if (window.showOpenFilePicker) {
      try {
        const opts = { id: 'lared-json', excludeAcceptAllOption: true, types: [{ description: JSON_HINT, accept: { 'application/json': ['.json'] } }] };
        if (dirHandle) opts.startIn = dirHandle;
        const [fh] = await window.showOpenFilePicker(opts);
        return loadImported(await (await fh.getFile()).text());
      } catch (err) { if (err && err.name === 'AbortError') return say('Importación cancelada.'); console.error(err); }
    }
    $('#e-file-json').click();
  });
  $('#e-file-json').addEventListener('change', e => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    const r = new FileReader(); r.onload = () => loadImported(r.result); r.readAsText(f);
  });

  /* ---------- arranque ---------- */
  try {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft && draft !== JSON.stringify(window.DASHBOARD_DATA) && confirm('Hay cambios de la última vez que no llegaron a guardarse.\n\n¿Quieres recuperarlos?')) { data = JSON.parse(draft); ensureMeta(data); dirty = true; }
    else if (draft) localStorage.removeItem(DRAFT_KEY);
  } catch (_) { /* nada */ }
  buildForm(); fit(); rebuild();
  if (dirty) setDirty();
  say('Listo. Haz clic en una caja para editarla o arrástrala para moverla.  [' + lastDiag + ']');
  } catch (err) {
    console.error(err);
    document.body.insertAdjacentHTML('beforeend',
      '<div style="position:fixed;inset:0;background:#1b1b1b;color:#ff8a80;font:13px/1.5 monospace;' +
      'padding:24px;overflow:auto;z-index:999999;white-space:pre-wrap">ERROR AL CARGAR EL EDITOR (js/editor.js):\n\n' +
      String((err && err.stack) || err).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])) + '</div>');
  }
})();
