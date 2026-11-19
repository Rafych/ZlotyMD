// Złoty MD — экспорт в DOCX и TXT.
// Оба формата строятся из отрисованного превью (#mo), то есть из того же результата, что видит
// пользователь: обработанный Markdown, формулы, диаграммы, таблицы и сноски.
//  • DOCX — библиотека docx (загружается при первом экспорте): HTML превью приводится к виду,
//    который понимает её модуль docx/html (htmlToContent). Формулы — собственные уравнения Word
//    (из MathML, который строит KaTeX по исходнику формулы), диаграммы — изображения PNG,
//    сноски — сноски Word, задачи — флажки Word, \newpage — разрыв страницы.
//  • TXT — обычный текст: заголовки подчёркнуты, списки с маркерами, таблицы выровнены
//    по столбцам, код и формулы (в виде исходника LaTeX) сохраняются как есть.
(function () {
  'use strict';

  const DOCX_VERSION = '9.15.4';
  // Порядок важен: math и html используют глобальные docx / docxMath
  const DOCX_SCRIPTS = ['index', 'math', 'html'].map(
    n => `https://cdn.jsdelivr.net/npm/docx@${DOCX_VERSION}/dist/${n}.iife.min.js`
  );
  // Размер страницы и поля — как у PDF (A4, 20 мм); ширина текста 170 мм ≈ 643 px
  const PAGE = { width: 11906, height: 16838, margin: 1134 }; // в twip (1/1440 дюйма)
  const TEXT_WIDTH_PX = 643;

  // ---------- Общее ----------
  function fileBase(title) {
    return String(title || 'document').replace(/[\\/:*?"<>|]/g, '_');
  }
  function downloadBlob(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  }
  // Копия превью без элементов интерфейса. before(clone) — до удаления (структура как в превью)
  function cloneContent(before) {
    const clone = mo.cloneNode(true);
    if (before) before(clone);
    // Ссылки на заголовки (#Заголовок → #zmd-заголовок) — как при экспорте в HTML
    if (typeof _rdPrepareExport === 'function') _rdPrepareExport(clone);
    clone
      .querySelectorAll('.cpbtn, .rd-anchor, .rd-fnback, .footnotes > .sr-only, .busy-indicator, .markdown-alert-title > svg')
      .forEach(n => n.remove());
    return clone;
  }

  // Строки блока diff: в превью каждая строка — отдельный элемент без символа перевода строки
  const DIFF_KIND = { 'diff-add': 'add', 'diff-del': 'del', 'diff-meta': 'meta', 'diff-ctx': 'ctx' };
  function diffLines(code) {
    const wrap = code.querySelector('.diff-wrap');
    if (!wrap) return null;
    return Array.from(wrap.children).map(el => {
      const kind = DIFF_KIND[Array.from(el.classList).find(c => DIFF_KIND[c])] || 'ctx';
      // Как в формате diff: «+», «-», пробел; служебные строки (---, +++, @@) — как есть
      const mark = kind === 'add' ? '+' : kind === 'del' ? '-' : kind === 'ctx' ? ' ' : '';
      return { kind, mark, el };
    });
  }

  // =====================================================================
  // TXT
  // =====================================================================

  // Ширина строки в моноширинном шрифте: иероглифы, кана, хангыль, полноширинные знаки и эмодзи — 2
  const WIDE_RE =
    /[ᄀ-ᅟ⺀-〾ぁ-㏿㐀-䶿一-鿿ꀀ-꓏가-힣豈-﫿︰-﹏＀-｠￠-￦]|[\u{1F300}-\u{1F64F}\u{1F900}-\u{1F9FF}\u{20000}-\u{3FFFD}]/u;
  function strWidth(s) {
    let w = 0;
    for (const ch of s) w += WIDE_RE.test(ch) ? 2 : 1;
    return w;
  }
  function pad(s, w, align) {
    const gap = Math.max(0, w - strWidth(s));
    if (align === 'right') return ' '.repeat(gap) + s;
    if (align === 'center') return ' '.repeat(Math.floor(gap / 2)) + s + ' '.repeat(Math.ceil(gap / 2));
    return s + ' '.repeat(gap);
  }

  const SKIP_TXT = new Set(['SCRIPT', 'STYLE', 'TEMPLATE', 'BUTTON']);

  // Строчное содержимое элемента одной строкой (переводы строк — только от <br>)
  function inlineText(node) {
    if (node.nodeType === 3) return node.data.replace(/[ \t\r\n]+/g, ' ');
    if (node.nodeType !== 1) return '';
    const el = node;
    if (SKIP_TXT.has(el.tagName) || el.classList.contains('sr-only')) return '';
    if (el.hasAttribute('data-tex')) return '$' + el.getAttribute('data-tex') + '$';
    switch (el.tagName) {
      case 'BR':
        return '\n';
      case 'IMG':
        return el.classList.contains('emoji') ? el.getAttribute('alt') || '' : `[${el.getAttribute('alt') || 'image'}]`;
      case 'svg':
      case 'SVG':
        return '';
      case 'INPUT':
        return el.type === 'checkbox' ? (el.checked || el.hasAttribute('checked') ? '[x] ' : '[ ] ') : '';
      case 'CODE':
        return el.textContent;
      case 'SUP':
        if (el.classList.contains('rd-fnref')) return '[' + el.textContent.trim() + ']';
        break;
      case 'A': {
        const text = childrenInline(el);
        const href = el.getAttribute('href') || '';
        if (!href || href.startsWith('#') || href === text.trim() || href === 'mailto:' + text.trim()) return text;
        return `${text} (${href})`;
      }
    }
    return childrenInline(el);
  }
  function childrenInline(el) {
    let s = '';
    el.childNodes.forEach(n => (s += inlineText(n)));
    return s;
  }
  function cleanInline(s) {
    return s
      .split('\n')
      .map(l => l.replace(/ {2,}/g, ' ').trim())
      .join('\n')
      .trim();
  }

  const BLOCK_TAGS = new Set([
    'P', 'DIV', 'SECTION', 'ARTICLE', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'UL', 'OL', 'LI', 'PRE',
    'BLOCKQUOTE', 'TABLE', 'HR', 'DETAILS', 'SUMMARY', 'DL', 'DT', 'DD', 'FIGURE', 'FIGCAPTION'
  ]);
  const isBlock = n =>
    n.nodeType === 1 &&
    (BLOCK_TAGS.has(n.tagName) || n.hasAttribute('data-tex') && n.tagName === 'DIV' || n.classList.contains('katex-display'));

  // Блоки → массив абзацев (каждый — массив строк)
  function blocksOf(el) {
    const out = [];
    let run = [];
    const flush = () => {
      const t = cleanInline(run.map(inlineText).join(''));
      if (t) out.push(t.split('\n'));
      run = [];
    };
    el.childNodes.forEach(n => {
      if (isBlock(n)) {
        flush();
        out.push(...blockText(n));
      } else run.push(n);
    });
    flush();
    return out;
  }

  function blockText(el) {
    const tag = el.tagName;
    if (SKIP_TXT.has(tag) || el.classList.contains('sr-only') || el.classList.contains('zmd-pagebreak')) return [];
    // Формула в отдельной строке — исходник LaTeX
    const tex = el.hasAttribute('data-tex') ? el : el.querySelector(':scope > [data-tex]');
    if (tex && (tag === 'DIV' || el.classList.contains('katex-display')) && el.textContent.trim() === tex.textContent.trim()) {
      return [['$$', ...tex.getAttribute('data-tex').trim().split('\n'), '$$']];
    }
    if (el.classList.contains('mermaid-wrap')) {
      const m = el.querySelector('[data-src]');
      const src = m ? m.getAttribute('data-src') : '';
      return [['[Mermaid]', ...src.split('\n').map(l => '    ' + l)]];
    }
    if (el.classList.contains('tikz-wrap')) return [['[TikZ]']];
    switch (tag) {
      case 'H1':
      case 'H2': {
        const t = cleanInline(childrenInline(el));
        return t ? [[t, (tag === 'H1' ? '=' : '-').repeat(Math.max(3, strWidth(t)))]] : [];
      }
      case 'H3':
      case 'H4':
      case 'H5':
      case 'H6': {
        const t = cleanInline(childrenInline(el));
        return t ? [[t]] : [];
      }
      case 'HR':
        return [['-'.repeat(40)]];
      case 'PRE': {
        const code = el.querySelector('code') || el;
        const lang = el.querySelector('.lang-badge');
        const dl = diffLines(code);
        const lines = dl ? dl.map(l => l.mark + l.el.textContent) : code.textContent.replace(/\n$/, '').split('\n');
        return [[...(lang ? [`[${lang.textContent.trim()}]`] : []), ...lines.map(l => '    ' + l)]];
      }
      case 'UL':
      case 'OL':
        return [listLines(el)];
      case 'BLOCKQUOTE':
        return [prefixLines(blocksOf(el), '> ')];
      case 'TABLE':
        return [tableLines(el)];
      case 'DETAILS': {
        const sum = el.querySelector(':scope > summary');
        const rest = blocksOf(el).filter((_, i) => !(sum && i === 0));
        return [[...(sum ? ['▸ ' + cleanInline(childrenInline(sum))] : []), ...prefixLines(rest, '  ')]];
      }
      case 'SECTION':
        if (el.classList.contains('footnotes')) {
          const items = Array.from(el.querySelectorAll('li')).map((li, i) => {
            const t = cleanInline(childrenInline(li));
            return `[${i + 1}] ${t}`;
          });
          return [['-'.repeat(20)], items];
        }
        break;
    }
    if (el.classList.contains('markdown-alert')) {
      const title = el.querySelector('.markdown-alert-title');
      const body = blocksOf(el).filter((_, i) => !(title && i === 0));
      return [prefixLines([...(title ? [[cleanInline(title.textContent)]] : []), ...body], '| ')];
    }
    return blocksOf(el);
  }

  // Абзацы → строки с префиксом (пустая строка между абзацами)
  function prefixLines(paras, prefix) {
    const out = [];
    paras.forEach((p, i) => {
      if (i) out.push(prefix.trimEnd());
      p.forEach(l => out.push(prefix + l));
    });
    return out;
  }

  function listLines(list) {
    const ordered = list.tagName === 'OL';
    let n = parseInt(list.getAttribute('start') || '1', 10) || 1;
    const out = [];
    Array.from(list.children).forEach(li => {
      if (li.tagName !== 'LI') return;
      const cb = li.querySelector(':scope > input[type=checkbox], :scope > p > input[type=checkbox]');
      let marker = ordered ? `${n++}. ` : '• ';
      if (cb) marker = cb.checked || cb.hasAttribute('checked') ? '[x] ' : '[ ] ';
      if (cb) cb.remove();
      const paras = blocksOf(li);
      const indent = ' '.repeat(strWidth(marker));
      let first = true;
      paras.forEach(p => {
        p.forEach(line => {
          out.push((first ? marker : indent) + line);
          first = false;
        });
      });
      if (first) out.push(marker.trimEnd());
    });
    return out;
  }

  function tableLines(table) {
    const rows = Array.from(table.rows).map(r =>
      Array.from(r.cells).map(c => ({
        text: cleanInline(childrenInline(c)).replace(/\n/g, ' '),
        align: (c.getAttribute('align') || c.style.textAlign || '').toLowerCase(),
        head: c.tagName === 'TH'
      }))
    );
    if (!rows.length) return [];
    const cols = Math.max(...rows.map(r => r.length));
    const widths = Array.from({ length: cols }, (_, i) => Math.max(3, ...rows.map(r => (r[i] ? strWidth(r[i].text) : 0))));
    const line = r => '| ' + widths.map((w, i) => pad(r[i] ? r[i].text : '', w, r[i] && r[i].align)).join(' | ') + ' |';
    const out = [];
    const headCount = table.tHead ? table.tHead.rows.length : rows[0].every(c => c.head) ? 1 : 0;
    rows.forEach((r, i) => {
      out.push(line(r));
      if (i === headCount - 1) {
        out.push(
          '|' +
            widths
              .map((w, j) => {
                const a = rows[0][j] && rows[0][j].align;
                const dash = '-'.repeat(w);
                return a === 'center' ? ':' + dash + ':' : a === 'right' ? '-' + dash + ':' : a === 'left' ? ':' + dash + '-' : '-' + dash + '-';
              })
              .join('|') +
            '|'
        );
      }
    });
    return out;
  }

  function buildTxt() {
    const paras = blocksOf(cloneContent());
    const text = paras
      .map(p => p.map(l => l.replace(/\s+$/, '')).join('\n'))
      .join('\n\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    return text + '\n';
  }

  function downloadTXT() {
    if (!ed.value.trim()) return;
    const title = getDocTitle();
    downloadBlob(new Blob([buildTxt()], { type: 'text/plain;charset=utf-8' }), fileBase(title) + '.txt');
  }

  // =====================================================================
  // DOCX
  // =====================================================================

  const loaded = new Map();
  function loadScript(src) {
    if (!loaded.has(src)) {
      loaded.set(
        src,
        new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = src;
          s.onload = resolve;
          s.onerror = () => {
            loaded.delete(src);
            reject(new Error('Script load failed: ' + src));
          };
          document.head.appendChild(s);
        })
      );
    }
    return loaded.get(src);
  }
  async function loadDocx() {
    // .min.js jsDelivr собирает сам; если не получилось — исходный файл того же пакета
    for (const src of DOCX_SCRIPTS) await loadScript(src).catch(() => loadScript(src.replace(/\.min\.js$/, '.js')));
    if (!window.docx || !window.docxHtml) throw new Error('docx library is not available');
  }

  const px2pt = px => Math.round(px * 0.75 * 2) / 2;
  const halfPt = px => Math.round(px * 0.75 * 2); // размер шрифта в docx — в половинах пункта

  // ---------- Диаграммы как изображения ----------
  // SVG, нарисованный как изображение, изолирован от страницы: ему недоступны ни стили страницы
  // (например, шрифт и размер подписей Mermaid задаются стилями превью), ни её веб-шрифты.
  // Поэтому копия получает вычисленные стили текста, а используемые веб-шрифты встраиваются
  // в неё (только нужные начертания и поднаборы символов) — подписи выглядят как в превью

  const TEXT_PROPS = [
    'font-family', 'font-size', 'font-weight', 'font-style', 'font-variant', 'font-stretch', 'line-height',
    'letter-spacing', 'word-spacing', 'text-transform', 'text-anchor', 'dominant-baseline', 'fill', 'color'
  ];
  const SVG_NS = 'http://www.w3.org/2000/svg';

  // Элементы с текстом: их вычисленные стили переносятся в копию (структура копии совпадает)
  function inlineTextStyles(live, copy) {
    const L = [live, ...live.querySelectorAll('*')];
    const C = [copy, ...copy.querySelectorAll('*')];
    const used = []; // { family, weight, style, text }
    for (let i = 0; i < L.length && i < C.length; i++) {
      const el = L[i];
      const own = Array.from(el.childNodes).some(n => n.nodeType === 3 && n.data.trim());
      const isText = /^(text|tspan|textPath)$/i.test(el.tagName) || (el.closest && el.closest('foreignObject') && el.tagName !== 'foreignObject');
      if (!own && !isText) continue;
      const cs = getComputedStyle(el);
      TEXT_PROPS.forEach(p => {
        const v = cs.getPropertyValue(p);
        if (v) C[i].style.setProperty(p, v, 'important');
      });
      if (own) {
        used.push({
          families: cs.fontFamily.split(',').map(f => f.trim().replace(/^["']|["']$/g, '').toLowerCase()),
          weight: parseInt(cs.fontWeight, 10) || 400,
          italic: /italic|oblique/.test(cs.fontStyle),
          text: Array.from(el.childNodes).filter(n => n.nodeType === 3).map(n => n.data).join('')
        });
      }
    }
    return used;
  }

  // @font-face страницы (в том числе из стилей с других сайтов, например Google Fonts)
  let fontFacesPromise = null;
  function parseRange(s) {
    if (!s) return null;
    return s.split(',').map(part => {
      const m = /U\+([0-9A-F?]+)(?:-([0-9A-F]+))?/i.exec(part.trim());
      if (!m) return [0, 0x10ffff];
      if (m[1].includes('?')) return [parseInt(m[1].replace(/\?/g, '0'), 16), parseInt(m[1].replace(/\?/g, 'F'), 16)];
      const lo = parseInt(m[1], 16);
      return [lo, m[2] ? parseInt(m[2], 16) : lo];
    });
  }
  function parseFace(rule, base) {
    const st = rule.style;
    const family = st.getPropertyValue('font-family').trim().replace(/^["']|["']$/g, '').toLowerCase();
    const src = st.getPropertyValue('src');
    const urls = [];
    src.replace(/url\(\s*["']?([^"')]+)["']?\s*\)\s*(?:format\(\s*["']?([\w-]+)["']?\s*\))?/g, (_, u, f) => urls.push({ u, f: f || '' }));
    const pick = urls.find(x => /woff2/.test(x.f) || /\.woff2(\?|#|$)/.test(x.u)) || urls[0];
    if (!family || !pick) return null;
    let url;
    try {
      url = new URL(pick.u, base).href;
    } catch (e) {
      return null;
    }
    const w = (st.getPropertyValue('font-weight') || '400').trim().split(/\s+/).map(v => (v === 'bold' ? 700 : v === 'normal' ? 400 : parseInt(v, 10) || 400));
    return {
      family,
      url,
      weight: [w[0], w[1] || w[0]],
      italic: /italic|oblique/.test(st.getPropertyValue('font-style')),
      range: parseRange(st.getPropertyValue('unicode-range')),
      css: { weight: st.getPropertyValue('font-weight') || '400', style: st.getPropertyValue('font-style') || 'normal', range: st.getPropertyValue('unicode-range') }
    };
  }
  function documentFontFaces() {
    if (fontFacesPromise) return fontFacesPromise;
    fontFacesPromise = (async () => {
      const faces = [];
      const visit = (rules, base) => {
        for (const r of Array.from(rules || [])) {
          if (r.type === CSSRule.FONT_FACE_RULE) {
            const f = parseFace(r, base);
            if (f) faces.push(f);
          } else if (r.type === CSSRule.IMPORT_RULE) {
            try {
              visit(r.styleSheet.cssRules, r.styleSheet.href || base);
            } catch (e) {}
          } else if (r.cssRules) visit(r.cssRules, base);
        }
      };
      for (const sheet of Array.from(document.styleSheets)) {
        let rules = null;
        try {
          rules = sheet.cssRules;
        } catch (e) {
          rules = null;
        }
        if (rules) visit(rules, sheet.href || location.href);
        else if (sheet.href) {
          // Стили с другого сайта недоступны из скрипта — читаем их заново (Google Fonts разрешает)
          try {
            const text = await (await fetch(sheet.href)).text();
            const cs = new CSSStyleSheet();
            cs.replaceSync(text.replace(/@import[^;]+;/g, ''));
            visit(cs.cssRules, sheet.href);
          } catch (e) {}
        }
      }
      return faces;
    })();
    return fontFacesPromise;
  }
  const fontData = new Map();
  function fetchFontData(url) {
    if (!fontData.has(url)) {
      fontData.set(
        url,
        fetch(url)
          .then(r => (r.ok ? r.blob() : null))
          .then(
            b =>
              b &&
              new Promise(res => {
                const fr = new FileReader();
                fr.onload = () => res(fr.result);
                fr.onerror = () => res(null);
                fr.readAsDataURL(b);
              })
          )
          .catch(() => null)
      );
    }
    return fontData.get(url);
  }
  const inRange = (cp, range) => !range || range.some(([lo, hi]) => cp >= lo && cp <= hi);
  // @font-face для копии SVG: начертания, которые нужны её тексту
  async function embeddedFontCss(used) {
    if (!used.length) return '';
    const faces = await documentFontFaces();
    const pickSet = new Set();
    used.forEach(u => {
      const cps = Array.from(new Set(Array.from(u.text))).map(ch => ch.codePointAt(0)).filter(cp => cp > 32);
      u.families.forEach(fam => {
        let cand = faces.filter(f => f.family === fam);
        if (!cand.length) return;
        const sameStyle = cand.filter(f => f.italic === u.italic);
        if (sameStyle.length) cand = sameStyle;
        // Насыщенность: начертание, покрывающее нужную, иначе ближайшее
        const dist = f => (u.weight >= f.weight[0] && u.weight <= f.weight[1] ? 0 : Math.min(Math.abs(u.weight - f.weight[0]), Math.abs(u.weight - f.weight[1])));
        const best = Math.min(...cand.map(dist));
        cand.filter(f => dist(f) === best && cps.some(cp => inRange(cp, f.range))).forEach(f => pickSet.add(f));
      });
    });
    const rules = await Promise.all(
      Array.from(pickSet).map(async f => {
        const data = await fetchFontData(f.url);
        if (!data) return '';
        return `@font-face{font-family:"${f.family}";src:url(${data});font-weight:${f.css.weight};font-style:${f.css.style};${f.css.range ? 'unicode-range:' + f.css.range + ';' : ''}}`;
      })
    );
    return rules.join('');
  }

  // Растровая копия SVG (диаграммы Mermaid и TikZ) в PNG с прозрачным фоном
  async function svgToPng(svg) {
    const r = svg.getBoundingClientRect();
    let w = r.width;
    let h = r.height;
    const vb = svg.viewBox && svg.viewBox.baseVal;
    if ((!w || !h) && vb && vb.width) {
      w = vb.width;
      h = vb.height;
    }
    if (!w || !h) return null;
    const copy = svg.cloneNode(true);
    const used = inlineTextStyles(svg, copy);
    copy.setAttribute('xmlns', SVG_NS);
    copy.setAttribute('width', w);
    copy.setAttribute('height', h);
    copy.style.maxWidth = 'none';
    copy.style.overflow = 'visible';
    const style = document.createElementNS(SVG_NS, 'style');
    style.textContent = (await embeddedFontCss(used)) + 'foreignObject{overflow:visible}';
    copy.insertBefore(style, copy.firstChild);
    const src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(copy));
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error('SVG image failed'));
      img.src = src;
    });
    try {
      await img.decode();
    } catch (e) {}
    const scale = 2;
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(w * scale);
    canvas.height = Math.ceil(h * scale);
    // Фон не заливается: PNG с прозрачным фоном (диаграмма ложится на фон страницы Word)
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    return { data: canvas.toDataURL('image/png'), width: Math.round(w), height: Math.round(h) };
  }

  // Байты изображения <img> для Word (PNG через canvas; если canvas недоступен — исходный файл)
  async function imageData(img) {
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    if (w && h) {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0);
        return { data: canvas.toDataURL('image/png'), width: w, height: h };
      } catch (e) {
        // Изображение с другого сайта без CORS: canvas «загрязнён» — пробуем скачать сам файл
      }
    }
    try {
      const res = await fetch(img.currentSrc || img.src);
      if (!res.ok) return null;
      const buf = await res.arrayBuffer();
      return { data: new Uint8Array(buf), width: w || 300, height: h || 200 };
    } catch (e) {
      return null;
    }
  }

  // ---------- Страницы — как в PDF и в редакторе ----------
  // Места разрывов берутся из раскладки PDF (та же, что у числа страниц и разметки страниц);
  // в DOCX они становятся явными разрывами страниц
  async function pdfBreaks(title) {
    try {
      const html = buildPdfHTML(title);
      if (typeof _pdfPagesLastHtml !== 'undefined' && html === _pdfPagesLastHtml && _pdfPagesLastLayout) {
        return Array.from(_pdfPagesLastLayout.breaks || []);
      }
      if (!window.ZmdPdf || !window.ZmdPdf.layoutPages) return [];
      const lay = await window.ZmdPdf.layoutPages(html);
      return Array.from((lay && lay.breaks) || []);
    } catch (e) {
      console.warn('DOCX: page layout is unavailable, Word will paginate itself:', e);
      return [];
    }
  }

  // Описание разрыва ({ path, text }) → место в копии превью (как в js/pages.js)
  const PB_SKIP_SEL = '[data-zpdf-thead-repeat],[data-zpdf-spacer],.cpbtn,script,style';
  const pbSkip = n => n.nodeType === 1 && n.matches(PB_SKIP_SEL);
  function resolveBreak(root, d) {
    let node = root;
    for (const i of d.path) {
      const k = Array.from(node.children).filter(c => !pbSkip(c))[i];
      if (!k) return null;
      node = k;
    }
    if (d.text < 0) return { el: node };
    const tw = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, {
      acceptNode: t => {
        for (let a = t.parentElement; a && a !== node; a = a.parentElement) if (pbSkip(a)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    let acc = 0;
    for (let t = tw.nextNode(); t; t = tw.nextNode()) {
      if (acc + t.data.length > d.text) return { el: node, node: t, off: d.text - acc };
      acc += t.data.length;
    }
    return { el: node };
  }
  // Метки разрывов: элемент — атрибутом, место в тексте — пустым <span data-zmd-pb>
  function markBreaks(root, breaks) {
    const spots = breaks.map(d => resolveBreak(root, d)).filter(Boolean);
    // С конца: деление текстового узла не сдвигает места, которые идут раньше в том же узле
    spots.reverse().forEach(r => {
      if (r.node) {
        const at = r.off > 0 ? r.node.splitText(r.off) : r.node;
        const m = document.createElement('span');
        m.setAttribute('data-zmd-pb', '');
        at.parentNode.insertBefore(m, at);
      } else r.el.setAttribute('data-zmd-pb', '');
    });
  }
  // Перенос метки на элемент-замену (диаграмма → картинка, формула → MathML и т.п.)
  function carryMark(from, to) {
    if (from.hasAttribute && from.hasAttribute('data-zmd-pb')) to.setAttribute('data-zmd-pb', '');
  }

  const PB_STYLE = 'page-break-before:always;margin-top:0';
  // Пустой абзац-разрыв перед таблицей (в ячейках Word разрывы страниц не учитывает)
  function breakPara() {
    const p = document.createElement('p');
    p.setAttribute('style', 'page-break-before:always;margin:0;font-size:1px;line-height:1px');
    p.textContent = '\u200b';
    return p;
  }
  // Есть ли текст в блоке до этого места
  function textBefore(block, node) {
    const r = document.createRange();
    r.setStart(block, 0);
    r.setEndBefore(node);
    return r.toString().replace(/\u200b/g, '').trim() !== '';
  }
  // Разрыв перед строкой таблицы: таблица делится на две, у второй — та же шапка (как в PDF)
  function breakBeforeRow(tr) {
    const table = tr.closest('table');
    const section = tr.parentNode;
    const rows = Array.from(table.querySelectorAll(':scope > tbody > tr, :scope > tr'));
    if (!table || rows[0] === tr || section.tagName === 'THEAD') {
      table.parentNode.insertBefore(breakPara(), table);
      return;
    }
    const nt = table.cloneNode(false);
    if (table.tHead) nt.appendChild(table.tHead.cloneNode(true));
    const nb = section.cloneNode(false);
    for (let r = tr; r; ) {
      const next = r.nextSibling;
      nb.appendChild(r);
      r = next;
    }
    nt.appendChild(nb);
    for (let sib = section.nextSibling; sib; ) {
      const next = sib.nextSibling;
      nt.appendChild(sib);
      sib = next;
    }
    table.after(breakPara(), nt);
  }
  const PB_BLOCKS = new Set(['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'PRE', 'BLOCKQUOTE', 'HR', 'DIV', 'SECTION', 'DL', 'DT', 'DD', 'DETAILS']);
  function applyBreaks(root) {
    // Метки-элементы: строки таблиц, пункты списков, блоки; прочее — меткой в тексте перед элементом
    root.querySelectorAll('[data-zmd-pb]:not(span:empty)').forEach(el => {
      el.removeAttribute('data-zmd-pb');
      const tr = el.tagName === 'TR' ? el : el.closest('td, th') ? el.closest('tr') : null;
      if (tr) return breakBeforeRow(tr);
      if (el.tagName === 'TABLE') return el.parentNode.insertBefore(breakPara(), el);
      if (el.tagName === 'UL' || el.tagName === 'OL') {
        const li = el.querySelector('li');
        if (li) li.setAttribute('style', (li.getAttribute('style') || '') + ';' + PB_STYLE);
        return;
      }
      if (PB_BLOCKS.has(el.tagName) && el.closest('pre') === null) {
        el.setAttribute('style', (el.getAttribute('style') || '') + ';' + PB_STYLE);
        return;
      }
      const m = document.createElement('span');
      m.setAttribute('data-zmd-pb', '');
      el.parentNode.insertBefore(m, el);
    });
    // Метки в тексте
    root.querySelectorAll('span[data-zmd-pb]:empty').forEach(m => {
      const cell = m.closest('td, th');
      if (cell) {
        m.remove();
        return breakBeforeRow(cell.closest('tr'));
      }
      const block = m.parentElement.closest('pre, li, p, h1, h2, h3, h4, h5, h6, blockquote, dd, dt') || m.parentElement;
      if (block.tagName !== 'PRE' && !textBefore(block, m)) {
        block.setAttribute('style', (block.getAttribute('style') || '') + ';' + PB_STYLE);
        m.remove();
        return;
      }
      // Посреди абзаца или блока кода: <br> с разрывом делит абзац, вторая часть — с новой страницы
      const br = document.createElement('br');
      br.setAttribute('style', 'page-break-before:always');
      m.replaceWith(br);
    });
  }

  // Идентификатор стиля абзаца для языка блока кода (только латиница и цифры)
  function langStyleId(lang) {
    return Array.from(new TextEncoder().encode(lang))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // HTML превью → HTML для docx/html
  async function prepareDocxHtml(title) {
    const breaks = await pdfBreaks(title);
    const clone = cloneContent(c => markBreaks(c, breaks));
    // Исходные элементы превью (для размеров изображений и растеризации диаграмм)
    const liveImgs = Array.from(mo.querySelectorAll('img'));
    const cloneImgs = Array.from(clone.querySelectorAll('img'));
    const liveDiagrams = Array.from(mo.querySelectorAll('.mermaid-wrap, .tikz-wrap'));
    const cloneDiagrams = Array.from(clone.querySelectorAll('.mermaid-wrap, .tikz-wrap'));
    const images = {};
    const codeLangs = new Set();
    let seq = 0;
    const imgTag = (info, alt) => {
      const key = 'zmd-docx-img-' + seq++;
      images[key] = info.data;
      const scale = Math.min(1, TEXT_WIDTH_PX / info.width);
      const w = Math.round(info.width * scale);
      const h = Math.round(info.height * scale);
      return `<img src="${key}" width="${w}" height="${h}" alt="${escapeHtml(alt || '')}">`;
    };

    // Диаграммы → PNG по центру
    for (let i = 0; i < cloneDiagrams.length; i++) {
      const live = liveDiagrams[i];
      const svg = live && live.querySelector('svg');
      let info = null;
      if (svg) {
        try {
          info = await svgToPng(svg);
        } catch (e) {
          info = null;
        }
      }
      const p = document.createElement('p');
      p.setAttribute('style', 'text-align:center');
      carryMark(cloneDiagrams[i], p);
      // Замещающий текст — исходник диаграммы: при открытии DOCX в Złoty MD она снова становится блоком ```mermaid
      const srcEl = cloneDiagrams[i].querySelector('[data-src]');
      // Переводы строк — символом U+2028: в атрибутах XML обычный перевод строки превращается в пробел
      const alt = live.classList.contains('mermaid-wrap') ? 'Mermaid:\u2028' + (srcEl ? srcEl.getAttribute('data-src') : '').replace(/\r?\n/g, '\u2028') : 'TikZ';
      if (info) p.innerHTML = imgTag(info, alt);
      else {
        const m = cloneDiagrams[i].querySelector('[data-src]');
        p.textContent = m ? m.getAttribute('data-src') : '';
      }
      cloneDiagrams[i].replaceWith(p);
    }

    // Изображения: эмодзи — символом, остальные — данными
    for (let i = 0; i < cloneImgs.length; i++) {
      const c = cloneImgs[i];
      if (!c.parentNode) continue; // внутри уже заменённой диаграммы
      if (c.classList.contains('emoji')) {
        c.replaceWith(document.createTextNode(c.getAttribute('alt') || ''));
        continue;
      }
      const live = liveImgs[i];
      const info = live ? await imageData(live) : null;
      if (!info) {
        c.replaceWith(document.createTextNode(c.getAttribute('alt') ? `[${c.getAttribute('alt')}]` : ''));
        continue;
      }
      // Размер — как в превью (атрибуты {width=…} учитываются), но не шире текста
      const shown = live.getBoundingClientRect();
      const width = shown.width || info.width;
      const height = shown.height || info.height;
      const tmp = document.createElement('span');
      tmp.innerHTML = imgTag({ data: info.data, width, height }, c.getAttribute('alt'));
      c.replaceWith(tmp.firstChild);
    }

    // Формулы → MathML (из него docx/html делает уравнения Word)
    clone.querySelectorAll('[data-tex]').forEach(el => {
      const tex = el.getAttribute('data-tex');
      const display = el.tagName === 'DIV' || !!el.querySelector('.katex-display');
      let mathml = '';
      try {
        mathml = katex.renderToString(tex, { displayMode: display, throwOnError: true, output: 'mathml' });
      } catch (e) {
        mathml = '';
      }
      const holder = document.createElement(display ? 'p' : 'span');
      if (display) holder.setAttribute('style', 'text-align:center');
      carryMark(el, holder);
      // Разрыв перед обёрткой блочной формулы (<div> вокруг .katex-display) — тоже на неё
      if (display && el.parentElement && el.parentElement !== clone && el.parentElement.hasAttribute('data-zmd-pb') && !textBefore(el.parentElement, el)) {
        el.parentElement.removeAttribute('data-zmd-pb');
        holder.setAttribute('data-zmd-pb', '');
      }
      if (mathml) holder.innerHTML = mathml;
      else holder.textContent = display ? tex : '$' + tex + '$';
      el.replaceWith(holder);
    });
    // Блочная формула внутри пустого абзаца-обёртки: <p></p><div>…</div> — лишние пустые абзацы убираем
    clone.querySelectorAll('p').forEach(p => {
      if (!p.textContent.trim() && !p.querySelector('img, math, input, br, [data-zmd-pb]')) {
        // Метка разрыва с пустого абзаца переходит на следующий блок
        if (p.hasAttribute('data-zmd-pb') && p.nextElementSibling) p.nextElementSibling.setAttribute('data-zmd-pb', '');
        p.remove();
      }
    });

    // Блоки кода: без шапки, только код с подсветкой
    clone.querySelectorAll('pre').forEach(pre => {
      // Метка на элементе внутри блока кода (не строке diff) — меткой в тексте перед ним
      pre.querySelectorAll('[data-zmd-pb]:not(span:empty)').forEach(el => {
        if (el.closest('.diff-wrap') && el.parentElement.classList.contains('diff-wrap')) return;
        el.removeAttribute('data-zmd-pb');
        const m = document.createElement('span');
        m.setAttribute('data-zmd-pb', '');
        if (el.tagName === 'CODE' || el.classList.contains('pre-body')) el.insertBefore(m, el.firstChild);
        else el.parentNode.insertBefore(m, el);
      });
      const code = pre.querySelector('code');
      const out = document.createElement('pre');
      out.className = 'zmd-code';
      // Язык блока — в имени стиля абзаца («Code Block (javascript)»): при открытии DOCX в Złoty MD
      // он возвращается в ограничитель ```язык
      const lang = code && ((/(?:^|\s)language-(\S+)/.exec(code.className) || [])[1] || '');
      if (lang && /^[\w+#.-]{1,40}$/.test(lang)) {
        out.classList.add('zmd-code-lang');
        out.setAttribute('data-lang', lang);
        codeLangs.add(lang);
      }
      carryMark(pre, out);
      const dl = code && diffLines(code);
      if (dl) {
        // diff: строка за строкой, с маркером и цветом добавления/удаления
        out.innerHTML = dl
          .map(
            l =>
              (l.el.hasAttribute('data-zmd-pb') ? '<span data-zmd-pb></span>' : '') +
              `<span class="zmd-diff-${l.kind}">${escapeHtml(l.mark)}${l.el.innerHTML}</span>`
          )
          .join('\n');
      } else out.innerHTML = code ? code.innerHTML.replace(/\n$/, '') : escapeHtml(pre.textContent);
      pre.replaceWith(out);
    });

    // Пункты-задачи: флажок вместо маркера списка
    clone.querySelectorAll('li').forEach(li => {
      if (li.querySelector(':scope > input[type=checkbox], :scope > p:first-child > input[type=checkbox]')) li.style.listStyleType = 'none';
    });

    // Ручной разрыв страницы: следующий блок начинается с новой страницы
    // Ручной разрыв (\newpage) — отдельный пустой абзац стиля «Page Break»: так он отличим от
    // разрывов раскладки и при открытии DOCX в Złoty MD снова становится \newpage
    clone.querySelectorAll('.zmd-pagebreak').forEach(pb => {
      const p = document.createElement('p');
      p.className = 'zmd-newpage';
      p.textContent = '\u200b';
      let next = pb.nextElementSibling;
      // Разрыв раскладки PDF в том же месте уже не нужен
      if (next) {
        next.removeAttribute('data-zmd-pb');
        const first = next.querySelector('span[data-zmd-pb]:empty');
        if (first && !textBefore(next, first)) first.remove();
      }
      pb.replaceWith(p);
    });

    applyBreaks(clone);
    // Класс для сопоставления со стилем абзаца своего языка
    clone.querySelectorAll('pre.zmd-code-lang').forEach(pre => pre.classList.add('zmd-code-' + langStyleId(pre.getAttribute('data-lang'))));
    // Якорные ссылки на заголовки: id нужны docx/html для внутренних ссылок — оставляем
    return { html: clone.innerHTML, images, pages: breaks.length + 1, codeLangs: Array.from(codeLangs) };
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Стили содержимого — светлая тема, как в PDF. Код — Consolas: моноширинный шрифт, который есть
  // везде, где установлен Microsoft Office (JetBrains Mono у получателя может не быть, и Word
  // подставил бы пропорциональный шрифт)
  function docxStylesheet() {
    const code = px2pt(fontSizes.code || 12);
    const pxPt = px => Math.floor(px * 0.75 * FIT * 10) / 10;
    return `
      p { margin: 0 0 ${pxPt(13)}pt; }
      li { margin: 0 0 ${pxPt(5)}pt; }
      li p, td p, th p { margin: 0; }
      ul, ol { margin: 0 0 ${pxPt(13)}pt; }
      li ul, li ol { margin: 0; }
      blockquote p { margin: 0 0 ${pxPt(13)}pt; }
      a { color: #1a73e8; }
      code { font-family: Consolas; font-size: ${code}pt; background: #f1f3f4; }
      pre.zmd-code { background: #f6f8fa; border: 1px solid #dadce0; padding: 8px 12px; }
      pre.zmd-code code, pre.zmd-code span { background: transparent; }
      blockquote { color: #5f6368; border-left: 3px solid #dadce0; padding-left: 12px; margin-left: 0; }
      table { border-collapse: collapse; }
      th, td { border: 1px solid #dadce0; padding: 4px 8px; }
      th { background: #f1f3f4; font-weight: bold; }
      hr { border: 0; border-top: 1px solid #dadce0; }
      del, s { text-decoration: line-through; }
      .markdown-alert { border-left: 4px solid #0969da; padding-left: 12px; }
      .markdown-alert-title { font-weight: bold; color: #0969da; }
      .markdown-alert-tip { border-left-color: #1a7f37; } .markdown-alert-tip .markdown-alert-title { color: #1a7f37; }
      .markdown-alert-important { border-left-color: #8250df; } .markdown-alert-important .markdown-alert-title { color: #8250df; }
      .markdown-alert-warning { border-left-color: #9a6700; } .markdown-alert-warning .markdown-alert-title { color: #9a6700; }
      .markdown-alert-caution { border-left-color: #cf222e; } .markdown-alert-caution .markdown-alert-title { color: #cf222e; }
      .hljs-keyword, .hljs-selector-tag, .hljs-doctag, .hljs-template-tag { color: #1a73e8; }
      .hljs-built_in, .hljs-type, .hljs-title.class_, .hljs-variable.language_ { color: #007b83; }
      .hljs-string, .hljs-char.escape_, .hljs-addition { color: #188038; }
      .hljs-number, .hljs-literal, .hljs-symbol, .hljs-bullet, .hljs-variable.constant_ { color: #b06000; }
      .hljs-title, .hljs-title.function_, .hljs-section { color: #9334e6; }
      .hljs-attr, .hljs-attribute, .hljs-property, .hljs-selector-attr, .hljs-selector-class, .hljs-selector-id { color: #c26401; }
      .hljs-tag, .hljs-name, .hljs-meta, .hljs-regexp, .hljs-deletion, .hljs-link { color: #d93025; }
      .hljs-comment, .hljs-quote { color: #5f6368; font-style: italic; }
      .hljs-emphasis { font-style: italic; } .hljs-strong { font-weight: bold; }
      .zmd-diff-add { background: #e6f4ea; color: #137333; }
      .zmd-diff-del { background: #fce8e6; color: #c5221f; }
      .zmd-diff-meta { color: #5f6368; font-weight: bold; }
    `;
  }

  // Стили документа Word: шрифты (Google Sans → Noto Sans JP), размеры — как в редакторе.
  // Интервалы — как в PDF (строка 1,85 размера шрифта, отступы заголовков), но на 5 % меньше и
  // с минимальной высотой строки («не менее»): страница Word никогда не оказывается полнее
  // страницы PDF, поэтому Word не добавляет своих разрывов и страницы совпадают с PDF
  const FIT = 0.95;
  const tw = px => Math.floor(px * 15 * FIT); // px → twip (1 px = 0,75 pt = 15 twip), с запасом
  const lineAtLeast = px => ({ line: tw(px * 1.85), lineRule: 'atLeast' });
  function docxStyles(codeLangs) {
    const font = { ascii: 'Google Sans', hAnsi: 'Google Sans', cs: 'Google Sans', eastAsia: 'Noto Sans JP' };
    const body = fontSizes.body || 13;
    const heading = (id, name, px, before, after) => ({
      id,
      name,
      basedOn: 'Normal',
      next: 'Normal',
      quickFormat: true,
      run: { font, size: halfPt(px), bold: true, color: '202124' },
      // Без «не отрывать от следующего»: в PDF заголовок может оказаться внизу страницы
      paragraph: { spacing: { before: tw(before), after: tw(after), ...lineAtLeast(px) }, keepNext: false, keepLines: false }
    });
    const h1 = fontSizes.h1 || 34;
    return {
      default: {
        document: {
          run: { font, size: halfPt(body), color: '202124' },
          paragraph: { spacing: { after: 0, ...lineAtLeast(body) } }
        }
      },
      paragraphStyles: [
        heading('Heading1', 'Heading 1', h1, 34, 13 + Math.round(h1 * 0.24)),
        heading('Heading2', 'Heading 2', fontSizes.h2 || 21, 34, 8),
        heading('Heading3', 'Heading 3', fontSizes.h3 || 16, 21, 5),
        heading('Heading4', 'Heading 4', 16, 0, 0),
        heading('Heading5', 'Heading 5', 13.28, 0, 0),
        heading('Heading6', 'Heading 6', 10.72, 0, 0),
        {
          // Ручной разрыв страницы: пустой абзац нулевой высоты
          id: 'ZmdPageBreak',
          name: 'Page Break',
          basedOn: 'Normal',
          run: { size: 2 },
          paragraph: { pageBreakBefore: true, spacing: { before: 0, after: 0, line: 20, lineRule: 'exact' } }
        },
        {
          // Цитата: стандартный стиль Word (цвет и отступ — как в превью)
          id: 'Quote',
          name: 'Quote',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { color: '5F6368' },
          paragraph: { indent: { left: 240 }, spacing: { after: tw(13) } }
        },
        {
          // Блок кода: строки — как в PDF (размер кода × 1,85)
          id: 'ZmdCode',
          name: 'Code Block',
          basedOn: 'Normal',
          run: { font: { ascii: 'Consolas', hAnsi: 'Consolas', cs: 'Consolas', eastAsia: 'Noto Sans JP' }, size: halfPt(fontSizes.code || 12) },
          paragraph: { spacing: { before: 0, after: tw(21), ...lineAtLeast(fontSizes.code || 12) } }
        },
        // Блоки кода на конкретном языке: тот же стиль, язык — в названии
        ...(codeLangs || []).map(l => ({ id: 'ZmdCode_' + langStyleId(l), name: 'Code Block (' + l + ')', basedOn: 'ZmdCode' }))
      ]
    };
  }

  // ---------- Исходник документа внутри DOCX ----------
  // Стандартная часть «custom XML» пакета Office: Word хранит её, но не показывает. В ней — документ
  // .zmd (сжатый, base64) и отпечаток текста документа: если после экспорта файл правили в Word,
  // при открытии в Złoty MD это видно, и пользователь выбирает, что открыть
  const FFLATE = 'https://cdn.jsdelivr.net/npm/fflate@0.8.2/umd/index.js';
  async function embedSource(blob) {
    if (typeof encodeZmdSource !== 'function' || !window.ZmdImport) return blob;
    await loadScript(FFLATE);
    const { unzipSync, zipSync, strFromU8, strToU8 } = window.fflate;
    const files = unzipSync(new Uint8Array(await blob.arrayBuffer()));
    const docXml = files['word/document.xml'] ? strFromU8(files['word/document.xml']) : '';
    const payload = await encodeZmdSource(buildZmdText());
    const hash = window.ZmdImport.docxTextHash(docXml);
    let n = 1;
    while (files['customXml/item' + n + '.xml']) n++;
    const item = 'customXml/item' + n + '.xml';
    const props = 'customXml/itemProps' + n + '.xml';
    const guid = '{' + ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c => (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)).toUpperCase() + '}';
    files[item] = strToU8(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<zmd xmlns="' + ZMD_SOURCE_NS + '" version="1"><textHash>' + hash + '</textHash><source>' + payload + '</source></zmd>'
    );
    files[props] = strToU8(
      '<?xml version="1.0" encoding="UTF-8" standalone="no"?>' +
        '<ds:datastoreItem ds:itemID="' + guid + '" xmlns:ds="http://schemas.openxmlformats.org/officeDocument/2006/customXml">' +
        '<ds:schemaRefs><ds:schemaRef ds:uri="' + ZMD_SOURCE_NS + '"/></ds:schemaRefs></ds:datastoreItem>'
    );
    files['customXml/_rels/item' + n + '.xml.rels'] = strToU8(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/customXmlProps" Target="itemProps' + n + '.xml"/></Relationships>'
    );
    const relsName = 'word/_rels/document.xml.rels';
    files[relsName] = strToU8(
      strFromU8(files[relsName]).replace(
        '</Relationships>',
        '<Relationship Id="rIdZmdSource" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/customXml" Target="../' + item + '"/></Relationships>'
      )
    );
    files['[Content_Types].xml'] = strToU8(
      strFromU8(files['[Content_Types].xml']).replace(
        '</Types>',
        '<Override ContentType="application/vnd.openxmlformats-officedocument.customXmlProperties+xml" PartName="/' + props + '"/></Types>'
      )
    );
    return new Blob([zipSync(files)], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  }

  async function buildDocxBlob(title) {
    fontFacesPromise = null; // стили страницы могли измениться (язык, шрифты)
    await loadDocx();
    const { html, images, codeLangs } = await prepareDocxHtml(title);
    const styleMap = { 'pre.zmd-code': 'ZmdCode', 'p.zmd-newpage': 'ZmdPageBreak', 'blockquote p': 'Quote' };
    codeLangs.forEach(l => (styleMap['pre.zmd-code-' + langStyleId(l)] = 'ZmdCode_' + langStyleId(l)));
    const warnings = [];
    const children = window.docxHtml.htmlToContent(html, {
      stylesheet: docxStylesheet(),
      styleMap,
      images,
      maxImageWidth: TEXT_WIDTH_PX,
      baseUrl: location.href,
      // Сноски — в конце документа, как в PDF и превью (внизу страницы они заняли бы её место)
      notes: 'endnotes',
      onWarning: w => warnings.push(w)
    });
    if (warnings.length) console.info('DOCX export notes:', warnings);
    const D = window.docx;
    const doc = new D.Document({
      title,
      creator: 'Złoty MD',
      styles: docxStyles(codeLangs),
      sections: [
        {
          properties: {
            page: {
              size: { width: PAGE.width, height: PAGE.height },
              margin: { top: PAGE.margin, right: PAGE.margin, bottom: PAGE.margin, left: PAGE.margin }
            }
          },
          children: children.length ? children : [new D.Paragraph('')]
        }
      ]
    });
    const blob = await D.Packer.toBlob(doc);
    try {
      return await embedSource(blob);
    } catch (e) {
      console.warn('DOCX: the document source was not embedded:', e);
      return blob;
    }
  }

  let docxBusy = false;
  async function downloadDOCX() {
    if (!ed.value.trim() || docxBusy) return;
    docxBusy = true;
    const stopBusy = typeof startBusy === 'function' ? startBusy('docxGenerating') : () => {};
    try {
      const title = getDocTitle();
      const blob = await buildDocxBlob(title);
      downloadBlob(blob, fileBase(title) + '.docx');
    } catch (e) {
      console.warn('DOCX export failed:', e);
      showErrorModal(tr('docxError'));
    } finally {
      docxBusy = false;
      stopBusy();
    }
  }

  window.ZmdExport = { downloadDOCX, downloadTXT };
})();
