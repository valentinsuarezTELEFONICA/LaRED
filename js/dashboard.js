/* Motor del dashboard (sin dependencias, funciona abriendo el HTML en local).
   Lee window.DASHBOARD_DATA (data/datos.js) y window.FLAGS_LIST (data/flags.js)
   y pinta cada caja en su posición. Lo usan index.html (reproductor) y editor.html (vista previa).

   Lienzo: el diseño se define siempre en 1920x1080 ("unidades de diseño"). La pantalla
   real es 4K (3840x2160 por defecto, en data.meta.canvas), justo el doble, así que en
   index.html todo el lienzo se escala x2 y se ancla en la esquina superior izquierda
   (0,0) de la señal 4K — tal como llega la pantalla real. */
(function () {
  'use strict';
  try {

  let lang = 'es', data = null, _u = 0, timers = [];
  const imageOverrides = {};   // ruta -> URL temporal (el editor previsualiza imágenes aún sin copiar)

  /* ---------- catálogo de banderas (data/flags.js) ---------- */
  const FLAG_MAP = {};   // ISO -> ruta de imagen
  const FLAG_INFO = {};  // ISO -> {PAIS, ISO, IMAGEN}
  (window.FLAGS_LIST || []).forEach(f => { FLAG_MAP[f.ISO] = 'img/flags/' + f.IMAGEN; FLAG_INFO[f.ISO] = f; });

  /* ---------- utilidades ---------- */
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const t = v => (v && typeof v === 'object' && !Array.isArray(v)) ? (v[lang] ?? v.es ?? '') : (v ?? '');
  const num = v => { v = +v; return isFinite(v) ? v : 0; };
  const fmt = (n, d = 0) => n.toLocaleString(lang === 'es' ? 'es-ES' : 'en-GB', { minimumFractionDigits: d, maximumFractionDigits: d });
  const uid = () => 'u' + (++_u);
  const pct = (v, m) => Math.max(0, Math.min(100, num(v) / (num(m) || 1) * 100));

  /* ---------- utilidades de gráficos ---------- */
  const pts = (vals, L, R, T, B, min, max) =>
    vals.map((v, i) => [L + (R - L) * i / Math.max(1, vals.length - 1), B - (v - min) / ((max - min) || 1) * (B - T)]);
  function sp(p, mv = true) {          // curva suavizada (Catmull-Rom -> Bézier)
    const f = n => n.toFixed(1);
    let d = (mv ? 'M' : 'L') + f(p[0][0]) + ' ' + f(p[0][1]);
    for (let i = 0; i < p.length - 1; i++) {
      const p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2;
      d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)},${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)},${f(p2[0])} ${f(p2[1])}`;
    }
    return d;
  }
  const clipDef = (id, W, H) => `<clipPath id="${id}"><rect class="rv" x="-2" y="-4" height="${H + 8}" style="--w:${W + 4}px"/></clipPath>`;

  /* línea/área con animación de trazo (tendencia de la col. de red y gráfico de área) */
  function lineArea(o) {
    const k = o.k || 1;                          // factor de escala para huecos pequeños (1 = tamaño normal)
    const W = o.W, H = o.H, L = 10 * k, R = W - 10 * k, T = (o.top != null ? o.top : 20 * k), B = H - (o.pad != null ? o.pad : (o.xl ? 22 * k : 8 * k));
    const v = (o.values || []).map(num);
    if (v.length < 2 || B - T < 10 || R - L < 20) return '';
    const max = Math.max(...v, 1) * 1.08, id = uid(), c = o.color || '#5bc5f2', so = o.solid ? [.95, .8] : [.6, .05];
    const p = pts(v, L, R, T, B, 0, max);
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img"><defs>
      <linearGradient id="g${id}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${c}" stop-opacity="${so[0]}"/><stop offset="1" stop-color="${c}" stop-opacity="${so[1]}"/></linearGradient>
      ${clipDef('c' + id, W, H)}</defs>`;
    if (o.grid) for (let g = 0; g <= 4; g++) { const y = T + (B - T) * g / 4; s += `<line x1="${L}" x2="${R}" y1="${y}" y2="${y}" stroke="rgba(255,255,255,.13)"/>`; }
    s += `<g clip-path="url(#c${id})"><path d="${sp(p)} L${R} ${B} L${L} ${B}Z" fill="url(#g${id})"/></g>`;
    s += `<path class="draw" pathLength="1" d="${sp(p)}" fill="none" stroke="${c}" stroke-width="${(2.2 * k).toFixed(2)}"/>`;
    if (o.dots) s += p.map(q => `<circle class="fadein" cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" r="${(3 * k).toFixed(2)}" fill="#fff"/>`).join('');
    if (o.arrow) {
      const y0 = p[0][1] - 14 * k, y1 = p[p.length - 1][1] - 14 * k, ang = Math.atan2(y1 - y0, R - L) * 180 / Math.PI;
      s += `<path class="draw" pathLength="1" d="M${L} ${y0.toFixed(1)} L${R} ${y1.toFixed(1)}" stroke="#fff" stroke-width="${(2 * k).toFixed(2)}" fill="none" style="--d:.5s"/>
            <g class="fadein" transform="translate(${R} ${y1.toFixed(1)}) rotate(${ang.toFixed(1)})"><path d="M${2 * k} 0 L${-10 * k} ${-6 * k} L${-10 * k} ${6 * k}Z" fill="#fff"/></g>`;
    }
    if (o.badge) {
      const q = o.arrow ? [(L + R) / 2, (p[0][1] + p[p.length - 1][1]) / 2 - 14 * k] : p[Math.round((p.length - 1) * .55)];
      const by = o.arrow ? q[1] : q[1] - 20 * k;
      s += `<g class="fadein"><rect x="${(q[0] - 28 * k).toFixed(1)}" y="${(by - 12 * k).toFixed(1)}" width="${56 * k}" height="${24 * k}" rx="${12 * k}" fill="#fff"/><text x="${q[0].toFixed(1)}" y="${(by + 4 * k).toFixed(1)}" text-anchor="middle" style="fill:#1f2a44;font-size:${12 * k}px;font-weight:700">${esc(o.badge)}</text></g>`;
    }
    if (o.mo) p.forEach((q, i) => { s += `<text x="${q[0].toFixed(1)}" y="${H - o.moY}" text-anchor="middle" style="font-size:${o.fs}px">${esc(o.mo[i % o.mo.length])}</text>`; });
    (o.xl || []).forEach(l => { s += `<text x="${(L + (R - L) * l.f).toFixed(1)}" y="${H - (o.xlY != null ? o.xlY : 6 * k)}" text-anchor="middle"${(o.fs2 || k !== 1) ? ` style="font-size:${o.fs2 || 10 * k}px"` : ''}>${esc(l.text)}</text>`; });
    return s + '</svg>';
  }

  function stackedChart(b, Wd, H) {
    const S = b.series || [], L = 30, R = Wd - 8, T = 8, B = H - 22, id = uid();
    const n = Math.min(...S.map(s => (s.values || []).length));
    if (!S.length || !isFinite(n) || n < 2 || B - T < 10) return '';
    const val = (s, i) => Math.max(0, num(s.values[i]));
    const tot = Array.from({ length: n }, (_, i) => S.reduce((a, s) => a + val(s, i), 0) || 1);
    const cum = [Array(n).fill(0)];
    S.forEach((s, k) => cum.push(cum[k].map((v, i) => v + val(s, i) / tot[i] * 100)));
    let s = `<svg viewBox="0 0 ${Wd} ${H}" role="img"><defs>${clipDef('c' + id, Wd, H)}</defs>`;
    for (let k = 0; k <= 4; k++) { const y = B - (B - T) * k / 4; s += `<line x1="${L}" x2="${R}" y1="${y}" y2="${y}" stroke="rgba(255,255,255,.12)"/><text x="${L - 5}" y="${y + 3}" text-anchor="end" style="font-size:9px">${k * 25}%</text>`; }
    s += `<g clip-path="url(#c${id})">`;
    S.forEach((sr, k) => {
      const top = pts(cum[k + 1], L, R, T, B, 0, 100), bot = pts(cum[k], L, R, T, B, 0, 100).reverse();
      s += `<path d="${sp(top)} ${sp(bot, false)}Z" fill="${esc(sr.color)}"/>`;
    });
    s += '</g>';
    const xl = b.xLabels || [];
    xl.forEach((x, i) => { s += `<text x="${(L + (R - L) * (i + .5) / xl.length).toFixed(1)}" y="${H - 6}" text-anchor="middle">${esc(x)}</text>`; });
    return s + '</svg>';
  }

  function multiChart(b, Wd, H) {
    const S = b.series || [], L = 3, R = Wd - 3, T = 5, B = H - 9;
    const n = Math.min(...S.map(s => (s.values || []).length));
    if (!S.length || !isFinite(n) || n < 7 || B - T < 10) return '';
    const pd = n / 7, max = Math.max(...S.flatMap(s => s.values.slice(0, n).map(num)), 1) * 1.04;
    const xi = i => L + (R - L) * i / (n - 1);
    let s = `<svg viewBox="0 0 ${Wd} ${H}" role="img">`;
    for (let g = 0; g <= 4; g++) { const y = B - (B - T) * g / 4; s += `<line x1="${L}" x2="${R}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}" stroke="rgba(255,255,255,${g ? .5 : .75})" stroke-width=".45"/>`; }
    for (let d = 1; d < 7; d++) s += `<line x1="${xi(d * pd - .5).toFixed(1)}" x2="${xi(d * pd - .5).toFixed(1)}" y1="${T}" y2="${B + 2}" stroke="rgba(255,255,255,.14)" stroke-width=".4"/>`;
    S.forEach((sr, k) => { s += `<path class="draw" pathLength="1" style="--d:${(.3 + k * .25).toFixed(2)}s" d="${sp(pts(sr.values.slice(0, n).map(num), L, R, T, B, 0, max))}" fill="none" stroke="${esc(sr.color)}" stroke-width="${k ? 1 : 1.35}" stroke-linejoin="round" stroke-linecap="round"/>`; });
    const days = t(b.days); const dn = Array.isArray(days) ? days : [];
    dn.slice(0, 7).forEach((name, d) => { s += `<text x="${xi(d * pd + (pd - 1) / 2).toFixed(1)}" y="${H - 1.6}" text-anchor="middle" style="font-size:4.4px">${esc(name)}</text>`; });
    return s + '</svg>';
  }

  /* ---------- componentes HTML ---------- */
  const countSpan = (to, dec, pre) => `<span class="count" data-to="${num(to)}" data-dec="${dec || 0}" data-pre="${esc(pre || '')}">${esc(pre || '')}0</span>`;

  /* Bandera de un código ISO (según data/flags.js). Si el código no tiene bandera
     conocida (o la imagen no existe), se muestra el propio código como texto. */
  function flagChip(iso) {
    const src = FLAG_MAP[iso], info = FLAG_INFO[iso], title = esc(info ? info.PAIS : (iso || ''));
    if (!src) return `<span class="code" title="${title}">${esc(iso || '?')}</span>`;
    return `<span class="flag" title="${title}"><img src="${esc(src)}" alt="${title}" onerror="this.parentNode.classList.add('noimg')">
      <b>${esc(iso || '')}</b></span>`;
  }
  function gauge(it) {
    const p = pct(it.value, it.max), d = 'M10 52 A40 40 0 0 1 90 52';
    return `<div class="g"><svg viewBox="0 0 100 58"><path d="${d}" fill="none" stroke="rgba(255,255,255,.2)" stroke-width="9" pathLength="100"/>
      <path class="arc" d="${d}" fill="none" stroke="rgba(255,255,255,.5)" stroke-width="9" pathLength="100" style="--a:${p};--b:200"/>
      <g class="needle" style="--r:${(p * 1.8).toFixed(1)}deg"><path d="M7.5 52 L50 48.6 A3.4 3.4 0 0 1 50 55.4 Z" fill="#fff" stroke="#fff" stroke-width="2.4" stroke-linejoin="round"/><circle cx="50" cy="52" r="4.6" fill="#fff"/></g></svg>
      <p>${esc(t(it.label))}</p><div class="gv">${countSpan(it.value, it.dec, t(it.prefix))}<small>${esc(t(it.unit))}</small></div></div>`;
  }
  /* chip compacto: bandera arriba, valor debajo (sin repetir la etiqueta en cada fila) */
  function chip(it) {
    return `<div class="chip">${flagChip(it.code)}<b>${countSpan(it.value, it.dec, t(it.prefix))}${esc(t(it.unit))}</b></div>`;
  }
  function chipsRow(items) { return `<div class="chips">${(items || []).map(chip).join('')}</div>`; }
  /* Icono de una fila/dato: si hay una imagen propia subida (it.image), se usa esa, redonda;
     si no, cae en el icono dibujado por código (it.icon). Así nunca se rompe aunque falte el archivo. */
  function iconOrImage(it) {
    const raw = t(it.image);
    if (raw) {
      const src = imageOverrides[raw] || raw;
      return `<span class="ic-img"><img src="${esc(src)}" alt="" onerror="this.parentNode.classList.add('noimg')"></span>`;
    }
    return ICONS[it.icon] || '';
  }
  function iconStat(it) {
    return `<div class="ic1">${iconOrImage(it)}<span>${esc(t(it.label))}</span><b>${countSpan(it.value, it.dec, t(it.prefix))}${esc(t(it.unit))}</b></div>`;
  }
  const ICONS = {
    fixed: '<svg viewBox="0 0 48 48"><rect x="5" y="29" width="38" height="11" rx="3"/><path d="M13 34.5h.01M19 34.5h.01M24 29V17M16 21a11 11 0 0 1 16 0M11 15.5a18 18 0 0 1 26 0"/></svg>',
    mobile: '<svg viewBox="0 0 48 48"><rect x="14" y="4" width="20" height="40" rx="4"/><path d="M21 38h6M20 9h8"/></svg>',
    coverage: '<svg viewBox="0 0 48 48"><path d="M8 40h4v-8H8v8ZM16 40h4V22h-4v18ZM24 40h4V14h-4v26ZM32 40h4V6h-4v34Z"/></svg>',
    sites: '<svg viewBox="0 0 48 48"><path d="M24 4v10M14 14l4 4M34 14l-4 4M24 18l-10 22h20L24 18Z" fill="none" stroke-linejoin="round"/></svg>'
  };
  const card = (b, body, cls, cardCls) => `<section class="card ${cardCls || ''}"><h3>${esc(t(b.title))}</h3><div class="body ${cls || ''}">${body}</div></section>`;
  const host = (b, kind, extra) => `<div class="host" data-kind="${kind}" data-box="${esc(b.id)}" ${extra || ''}></div>`;

  /* Alto relativo de cada bloque dentro de su columna (proporciones de la maqueta 1000×568).
     Se puede forzar con k.weight en los datos. */
  const BLOCK_W = { gauges: 73, icons: 58, note: 36, trend: 80 };
  function blockHTML(b, k, bi) {
    const w = num(k.weight) || (k.type === 'chips' ? (k.groups ? 49 : (k.lines ? 64 : 46)) : BLOCK_W[k.type]) || 50, st = `style="flex:${w} 1 0"`;
    if (k.type === 'trend') return `<div class="blk trendb" ${st}><h4>${esc(t(k.title))}</h4>${host(b, 'trend', `data-bi="${bi}"`)}</div>`;
    let h = `<fieldset class="blk" ${st}><legend>${esc(t(k.title))}</legend><div class="bin">`;
    if (k.type === 'gauges') h += `<div class="gauges">${(k.items || []).map(gauge).join('')}</div>`;
    else if (k.type === 'icons') h += `<div class="icons">${(k.items || []).map(iconStat).join('')}</div>`;
    else if (k.type === 'chips') {
      if (k.groups && k.groups.length) h += `<div class="grps">${k.groups.map(g => `<div class="grp"><p class="lb">${esc(t(g.label))}</p>${chipsRow(g.items)}</div>`).join('')}</div>`;
      else h += (k.lines || []).map(l => `<p class="fl">${esc(t(l.label))}: <b>${countSpan(l.value, l.dec, t(l.prefix))}${esc(t(l.unit))}</b></p>`).join('') + chipsRow(k.items);
    }
    else if (k.type === 'note') h += `<div class="note">${iconOrImage({ image: k.image, icon: k.icon })}<span class="nt">${esc(t(k.text))}</span><span class="codes">${(k.codes || []).map(flagChip).join('')}</span></div>`;
    return h + '</div></fieldset>';
  }
  const RENDER = {
    image(b) {
      const raw = t(b.image) || '', src = imageOverrides[raw] || raw;
      return `<div class="tp"><div class="tt">${esc(t(b.title))}</div>
        <div class="frame"><img src="${esc(src)}" alt="" onerror="this.parentNode.classList.add('missing')">
        <div class="ph"><span>${esc(t(data.ui.missing))}<br><b>${esc(raw)}</b></span></div></div></div>`;
    },
    /* "Red en cifras": 2 columnas; cada bloque de datos lleva k.col (1 o 2) para decidir en cuál va */
    network(b) {
      const blocks = b.blocks || [];
      const col = n => blocks.map((k, bi) => (num(k.col) || 1) === n ? blockHTML(b, k, bi) : '').join('');
      return card(b, `<div class="blocks2"><div class="bcol">${col(1)}</div><div class="bcol">${col(2)}</div></div>`, '', 'net');
    },
    area(b) { return card(b, host(b, 'area'), '', 'tot'); },
    stat(b) {
      return card(b, (b.items || []).map(it => `<div class="srow"><div class="ic">${iconOrImage(it)}</div><div class="stx">
        <h5>${esc(t(it.label))}:</h5><p>${esc(t(it.text))}</p></div>
        <div class="sv"><div class="svn"><b>${countSpan(it.value, 0, '')}</b><small>${esc(t(it.unit))}</small></div>
        <div class="bar"><i style="--w:${pct(it.value, it.max)}%"></i></div></div></div>`).join(''), 'center', 'cons');
    },
    stacked(b) {
      const S = b.series || [], n = Math.min(...S.map(s => (s.values || []).length));
      let donut = '';
      if (S.length && isFinite(n) && n >= 1) {
        const val = s => Math.max(0, num(s.values[n - 1])), tot = S.reduce((a, s) => a + val(s), 0) || 1;
        let acc = 0, ds = '<svg viewBox="0 0 150 150" role="img"><g transform="rotate(-90 75 75)">';
        S.forEach(sr => {
          const share = val(sr) / tot * 100, a = Math.max(0, share - .5);
          ds += `<circle class="arc" cx="75" cy="75" r="56" fill="none" stroke="${esc(sr.color)}" stroke-width="24" pathLength="100" stroke-dashoffset="${-acc}" style="--a:${a.toFixed(2)};--b:${(100 - a).toFixed(2)}"/>`;
          acc += share;
        });
        ds += '</g></svg>';
        const lg = S.map(sr => `<div><i style="background:${esc(sr.color)}"></i><span>${esc(t(sr.name))}</span><em>${Math.round(val(sr) / tot * 100)}%</em></div>`).join('');
        donut = `<div class="catr"><div class="legend">${lg}</div><div class="dn">${ds}</div></div>`;
      }
      return card(b, host(b, 'stacked') + donut, 'cat');
    },
    multi(b) {
      const lg = (b.series || []).map(sr => `<div><i style="background:${esc(sr.color)}"></i><span>${esc(t(sr.name))}</span></div>`).join('');
      return card(b, host(b, 'multi') + `<div class="wk-lg">${lg}</div>`, 'wkb', 'wk');
    }
  };

  const MONTHS = { es: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'], en: ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'] };
  const DRAW = {
    trend: (b, W, H, blk) => lineArea({ W, H, k: .68, values: blk.values, dots: true, arrow: true, solid: true, badge: blk.badge, color: '#f4f6fb',
      xl: (blk.labels || []).map((x, i, a) => ({ f: i / Math.max(1, a.length - 1), text: x })) }),
    area: (b, W, H) => lineArea({ W, H, k: .6, top: 7, pad: 12.5, moY: 7.2, xlY: 1.6, fs: 3.6, fs2: 4.2, values: b.values, grid: true, arrow: true, solid: true, badge: b.badge, color: '#aab4d6',
      mo: t(MONTHS), xl: (b.xLabels || []).map((x, i, a) => ({ f: (i + .5) / a.length, text: x })) }),
    stacked: (b, W, H) => stackedChart(b, W, H),
    multi: (b, W, H) => multiChart(b, W, H)
  };

  /* Los gráficos se dibujan después de insertar la caja, midiendo el hueco real que les queda */
  function layoutHosts(root) {
    root.querySelectorAll('.host').forEach(h => {
      const b = data.boxes.find(x => x.id === h.dataset.box);
      if (!b || !DRAW[h.dataset.kind]) return;
      const blk = h.dataset.bi !== undefined ? (b.blocks || [])[+h.dataset.bi] : null;
      h.innerHTML = DRAW[h.dataset.kind](b, Math.max(60, h.clientWidth), Math.max(40, h.clientHeight), blk);
    });
  }

  function boxHTML(b) {
    const inner = RENDER[b.type] ? RENDER[b.type](b) : `<div class="card"><h3>${esc(b.type)}?</h3></div>`;
    return `<div class="box seq" data-id="${esc(b.id)}" data-step="${num(b.step)}" style="${boxStyle(b)}">${inner}</div>`;
  }
  const boxStyle = b => `left:${num(b.x)}px;top:${num(b.y)}px;width:${num(b.w)}px;height:${num(b.h)}px`;

  function setCounts(root) {
    root.querySelectorAll('.count').forEach(el => {
      el._tok = 0;
      el.textContent = (el.dataset.pre || '') + fmt(+el.dataset.to, +el.dataset.dec || 0);
    });
  }

  /* ---------- API ---------- */
  function build(stage, d, l, opts) {
    data = d; lang = l || 'es'; opts = opts || {};
    stage.classList.toggle('static', !!opts.instant);
    const ti = d.ui.title_pos || {}, tx = num(ti.x) || 48, ty = num(ti.y) || 36, ts = num(ti.size) || 34;
    /* Logo (data.ui.logo = {enabled, src, height}) a la izquierda del selector de idioma.
       En el editor (opts.editor) se pinta además un selector de muestra para ver su sitio real. */
    const lg = d.ui.logo || {}, lh = num(lg.height) || 40;
    const logoHTML = () => lg.enabled && lg.src ? `<img class="hdr-logo" src="${esc(imageOverrides[lg.src] || lg.src)}" alt="Telefónica" style="height:${lh}px" onerror="this.classList.add('missing')">`
      : (lg.enabled && opts.editor ? `<span class="hdr-logo ph" style="height:${lh}px;min-width:${lh}px">T</span>` : '');
    const ICO = { rp: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20.5 3.5v5h-5"/></svg>', fs: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V5h4M20 9V5h-4M4 15v4h4M20 15v4h-4"/></svg>' };
    window.__hdrCtl = (l2, rp, fs) => `<div class="ctl">${logoHTML()}
          <button data-lang="es" class="lang ${l2 === 'es' ? 'on' : ''}" title="Español" aria-label="Español" aria-pressed="${l2 === 'es'}"><img src="img/flags/es.png" alt="ES"></button>
          <button data-lang="en" class="lang ${l2 === 'en' ? 'on' : ''}" title="English" aria-label="English" aria-pressed="${l2 === 'en'}"><img src="img/flags/gb.png" alt="EN"></button>
          <button data-act="rp" class="ic" title="${esc(rp)}" aria-label="${esc(rp)}">${ICO.rp}</button>
          <button data-act="fs" class="ic" title="${esc(fs)}" aria-label="${esc(fs)}">${ICO.fs}</button></div>`;
    let hdr = '';
    if (opts.editor) hdr = window.__hdrCtl(lang, '', '').replace('class="ctl"', 'class="ctl ghost"');
    stage.innerHTML = `<header>${hdr}</header><h1 class="dash-title" style="left:${tx}px;top:${ty}px;font-size:${ts}px">${esc(t(d.ui.title))}</h1>` + d.boxes.map(boxHTML).join('');
    const bg = (d.meta.bg && d.meta.bg.length >= 2) ? d.meta.bg : ['#67769b', '#7b88a8', '#56648b', '#2c3653', '#232c46'];
    const n = bg.length - 1;
    stage.style.background = 'linear-gradient(180deg,' + bg.map((c, i) => `${c} ${Math.round(i / n * 100)}%`).join(',') + ')';
    stage.style.setProperty('--tt-size', (num(d.meta.topTitleSize) || 13.5) + 'px');
    stage.style.setProperty('--card-title-size', (num(d.meta.cardTitleSize) || 13) + 'px');
    layoutHosts(stage);
    if (opts.instant) { stage.querySelectorAll('.seq').forEach(e => e.classList.add('on')); setCounts(stage); }
  }
  function fillBox(stage, b) {                  // repinta una sola caja (editor)
    const el = [...stage.querySelectorAll('.box')].find(e => e.dataset.id === b.id);
    if (!el) return;
    el.dataset.step = num(b.step);
    el.setAttribute('style', boxStyle(b));
    el.innerHTML = RENDER[b.type] ? RENDER[b.type](b) : '';
    layoutHosts(el); el.classList.add('on'); setCounts(el);
  }
  function runCounts(root) {
    root.querySelectorAll('.count').forEach(el => {
      const to = +el.dataset.to, dec = +el.dataset.dec || 0, pre = el.dataset.pre || '', t0 = performance.now(), tok = el._tok = Math.random();
      (function step(now) {
        if (el._tok !== tok) return;
        const k = Math.min(1, (now - t0) / 1600), e = 1 - Math.pow(1 - k, 3);
        el.textContent = pre + fmt(to * e, dec);
        if (k < 1) requestAnimationFrame(step);
      })(t0);
    });
  }
  /* Aparición secuencial: las cajas con el mismo "orden" entran a la vez */
  function play(stage, d, onLoop) {
    timers.forEach(clearTimeout); timers = [];
    const steps = [...new Set(d.boxes.map(b => num(b.step)))].sort((a, b) => a - b);
    const gap = num(d.meta.stepSeconds) * 1000;
    steps.forEach((s, r) => {
      const delay = r === 0 ? 150 : 900 + (r - 1) * gap;
      timers.push(setTimeout(() => stage.querySelectorAll('.box').forEach(el => {
        if (num(el.dataset.step) === s) { el.classList.add('on'); runCounts(el); }
      }), delay));
    });
    const loop = num(d.meta.loopSeconds);
    if (loop > 0 && onLoop) timers.push(setTimeout(onLoop, 900 + steps.length * gap + 2500 + loop * 1000));
  }

  /* ---------- reproductor (index.html) ---------- */
  /* El lienzo de diseño es fijo, 1920x1080; la pantalla real (data.meta.canvas, por
     defecto 3840x2160) es el doble, así que se ancla en (0,0) y se escala x (canvas.w/1920). */
  function start(stage) {
    const d = window.DASHBOARD_DATA;
    if (!d) { stage.innerHTML = '<div class="fatal">No se encuentra el archivo <b>data/datos.js</b>.<br>Comprueba que la carpeta está completa.</div>'; return; }
    let l = (new URLSearchParams(location.search).get('lang') || d.meta.defaultLang || 'es').toLowerCase();
    if (!['es', 'en'].includes(l)) l = 'es';

    const restart = () => {
      try {
        document.documentElement.lang = l;
        build(stage, d, l);
        const hdr = stage.querySelector('header');
        hdr.insertAdjacentHTML('beforeend', window.__hdrCtl(l, t(d.ui.replay), t(d.ui.full)));
        hdr.querySelectorAll('[data-lang]').forEach(b => b.onclick = () => { if (b.dataset.lang !== l) { l = b.dataset.lang; restart(); } });
        hdr.querySelector('[data-act=rp]').onclick = restart;
        hdr.querySelector('[data-act=fs]').onclick = toggleFull;
        void stage.offsetWidth;
        play(stage, d, restart);
      } catch (err) {
        console.error(err);
        document.body.insertAdjacentHTML('beforeend',
          '<div style="position:fixed;inset:0;background:#1b1b1b;color:#ff8a80;font:13px/1.5 monospace;' +
          'padding:24px;overflow:auto;z-index:999999;white-space:pre-wrap">ERROR AL PINTAR EL DASHBOARD (js/dashboard.js):\n\n' +
          String((err && err.stack) || err).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])) + '</div>');
      }
    };
    const toggleFull = () => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen().catch(() => {});
    addEventListener('resize', () => fit(stage, d));
    addEventListener('keydown', e => {
      const k = e.key.toLowerCase();
      if (k === 'l') { l = l === 'es' ? 'en' : 'es'; restart(); }
      else if (k === 'r') restart();
      else if (k === 'f') toggleFull();
    });
    let idleT; const wake = () => { document.body.classList.remove('idle'); clearTimeout(idleT); idleT = setTimeout(() => document.body.classList.add('idle'), 3000); };
    addEventListener('mousemove', wake); wake();
    fit(stage, d); restart();
    setTimeout(() => {
      const box = stage.getBoundingClientRect();
      if (box.width < 5 || box.height < 5) {
        document.body.insertAdjacentHTML('beforeend',
          '<div style="position:fixed;inset:0;background:#1b1b1b;color:#ff8a80;font:13px/1.5 monospace;' +
          'padding:24px;overflow:auto;z-index:999999;white-space:pre-wrap">EL LIENZO SE HA QUEDADO SIN TAMAÑO (0 px).\n\n' +
          'Esto suele pasar si css/dashboard.css no ha llegado a cargarse. Comprueba que, junto a este index.html,\n' +
          'sigue estando la carpeta css con el archivo dashboard.css dentro (no lo muevas ni lo renombres).\n\n' +
          'Tamaño detectado del lienzo: ' + Math.round(box.width) + ' × ' + Math.round(box.height) + ' px.</div>');
      }
    }, 300);
  }
  function fit(stage, d) {
    const cw = num((d.meta.canvas || {}).w) || 3840, ch = num((d.meta.canvas || {}).h) || 2160;
    const k = Math.min(innerWidth / cw, innerHeight / ch) * (cw / 1920);
    stage.style.transform = `scale(${k})`;
  }

  window.Dashboard = { build, fillBox, play, start, imageOverrides, esc, num };
  } catch (err) {
    console.error(err);
    document.body.insertAdjacentHTML('beforeend',
      '<div style="position:fixed;inset:0;background:#1b1b1b;color:#ff8a80;font:13px/1.5 monospace;' +
      'padding:24px;overflow:auto;z-index:999999;white-space:pre-wrap">ERROR AL CARGAR EL DASHBOARD (js/dashboard.js):\n\n' +
      String((err && err.stack) || err).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])) + '</div>');
  }
})();
