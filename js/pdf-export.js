/* Złoty MD — экспорт в PDF через jsPDF + html() (html2canvas), только в браузере.
 *
 * Как это устроено:
 *  1. Документ (тот же HTML, что и для печати) рендерится в скрытом iframe шириной области
 *     печати A4 с полями 20 мм — это та же раскладка, что и при window.print().
 *  2. Разрывы страниц берутся у самого браузера: копия документа раскладывается в многоколоночный
 *     контейнер высотой в страницу (тот же механизм фрагментации, что и при печати), после чего в
 *     обычный поток вставляются распорки, чтобы каждая строка оказалась на той же странице и на той
 *     же высоте, что и при печати.
 *  3. jsPDF.html() (html2canvas + context2d) рисует фон, рамки, таблицы, изображения и фигуры SVG.
 *  4. Весь текст выводится отдельным слоем настоящим текстом PDF (Identity-H, встроенные TTF-шрифты
 *     с подмножеством глифов) в точных координатах из раскладки браузера: текст можно выделять,
 *     копировать и искать, а кириллица, японский и прочие письменности не превращаются в «кракозябры».
 */
(function (global) {
  'use strict';

  const LIBS = {
    jspdf: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/4.2.1/jspdf.umd.min.js',
    html2canvas: 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
  };
  const EXPO = 'https://cdn.jsdelivr.net/npm/@expo-google-fonts/';
  const KATEX_FONTS = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/fonts/';

  // Геометрия страницы — в точности как у печати Chromium (A4, @page{margin:20mm}), измерено по его PDF:
  //  - размер листа округляется до точек 300 dpi: 2479 × 3508 → 594.96 × 841.92 pt;
  //  - раскладка идёт в целых CSS px: ширина 643, высота страницы (шаг и высота фрагмента) 972;
  //  - начало области содержимого — 76 px (57 pt) от края, видимая область обрезается до 642.55 × 971.36 px;
  //  - 1 CSS px = 0.75 pt.
  const PAGE = {
    wPt: 594.95996,
    hPt: 841.91998,
    marginPt: 57,
    contentW: 643,
    contentH: 972,
    clipW: 642.547,
    clipH: 971.359,
    k: 0.75
  };

  // ---------- Шрифты ----------
  const W_NAMES = { 100: 'Thin', 200: 'ExtraLight', 300: 'Light', 400: 'Regular', 500: 'Medium', 600: 'SemiBold', 700: 'Bold', 800: 'ExtraBold', 900: 'Black' };
  function expo(pkg, prefix) {
    return (w, italic) => {
      const dir = w + W_NAMES[w] + (italic ? '_Italic' : '');
      return [EXPO + pkg + '/' + dir + '/' + prefix + '_' + dir + '.ttf'];
    };
  }
  function faces(list) {
    return list.map(s => ({ w: parseInt(s, 10), italic: /i$/.test(s) }));
  }
  const ALL_W = [100, 200, 300, 400, 500, 600, 700, 800, 900];
  // Те же файлы, что Google Fonts отдаёт странице (TrueType-вариант для клиентов без WOFF2).
  // Google Sans — отдельные экземпляры для оптического размера 17 и 18 (как выбирает браузер)
  const GS = 'https://fonts.gstatic.com/s/googlesans/v76/';
  const GS_PREFIX = {
    n17: '4Ua_rENHsxJlGDuGo1OIlJfC6l_24rlCK1Yo_Iqcsih3SAyH6cAwhWdRFD48TE63OOYKtr',
    n18: '4Ua_rENHsxJlGDuGo1OIlJfC6l_24rlCK1Yo_Iqcsih3SAyH6cAwhX9RFD48TE63OOYKtr',
    i17: '4Ua9rENHsxJlGDuGo1OIlL3L2JB874GPhFI9_IqmuRqGpjeaLi42kO8QpnQOs5beU3yksanMY',
    i18: '4Ua9rENHsxJlGDuGo1OIlL3L2JB874GPhFI9_IqmuRqGpjeaLi42kO8QvnQOs5beU3yksanMY'
  };
  const GS_SUFFIX = {
    n: { 400: 'wEIKli', 500: 'w2IKli', 600: 'zaJ6li', 700: 'zjJ6li' },
    i: { 400: '0Ehpyw', 500: '3Mhpyw', 600: '58mpyw', 700: '6Ympyw' }
  };
  const JBM = { 400: 'https://fonts.gstatic.com/s/jetbrainsmono/v24/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKxjPQ.ttf', 500: 'https://fonts.gstatic.com/s/jetbrainsmono/v24/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8-qxjPQ.ttf' };
  // Начертания, которые реально доступны браузеру (как объявлено в CSS страницы), и TTF для PDF
  // (первый адрес — основной, остальные — запасные)
  const FAMILIES = {
    'google sans': {
      faces: faces(['400', '500', '600', '700', '400i', '500i', '600i', '700i']), range: [400, 700], opsz: [17, 18],
      src: (w, italic, opsz) => {
        const s = italic ? 'i' : 'n';
        return [GS + GS_PREFIX[s + (opsz || 18)] + GS_SUFFIX[s][w] + '.ttf'].concat(expo('google-sans@0.4.4', 'GoogleSans')(w, italic));
      }
    },
    'jetbrains mono': { faces: faces(['400', '500']), src: w => [JBM[w]].concat(expo('jetbrains-mono@0.4.1', 'JetBrainsMono')(w, false)) },
    'noto sans': { faces: faces(['400', '700', '400i', '700i']), src: expo('noto-sans@0.4.2', 'NotoSans') },
    'noto serif': { faces: faces(['400', '700', '400i', '700i']), src: expo('noto-serif@0.4.2', 'NotoSerif') },
    'noto sans math': { faces: faces(['400']), src: expo('noto-sans-math@0.4.2', 'NotoSansMath') },
    'noto sans symbols 2': { faces: faces(['400']), src: expo('noto-sans-symbols-2@0.4.1', 'NotoSansSymbols2') },
    'noto sans arabic': { faces: faces(['400']), src: expo('noto-sans-arabic@0.4.3', 'NotoSansArabic') },
    'noto sans hebrew': { faces: faces(['400']), src: expo('noto-sans-hebrew@0.4.1', 'NotoSansHebrew') },
    'noto sans jp': { faces: faces(ALL_W.map(String)), src: expo('noto-sans-jp@0.4.4', 'NotoSansJP') },
    'noto sans kr': { faces: faces(ALL_W.map(String)), src: expo('noto-sans-kr@0.4.4', 'NotoSansKR') },
    'noto sans sc': { faces: faces(ALL_W.map(String)), src: expo('noto-sans-sc@0.4.4', 'NotoSansSC') },
    'noto sans tc': { faces: faces(ALL_W.map(String)), src: expo('noto-sans-tc@0.4.4', 'NotoSansTC') }
  };
  // Шрифты KaTeX (те же начертания, что объявлены в katex.min.css)
  const KATEX = {
    KaTeX_AMS: ['400'], KaTeX_Caligraphic: ['400', '700'], KaTeX_Fraktur: ['400', '700'],
    KaTeX_Main: ['400', '700', '400i', '700i'], KaTeX_Math: ['400i', '700i'],
    KaTeX_SansSerif: ['400', '700', '400i'], KaTeX_Script: ['400'], KaTeX_Size1: ['400'],
    KaTeX_Size2: ['400'], KaTeX_Size3: ['400'], KaTeX_Size4: ['400'], KaTeX_Typewriter: ['400']
  };
  Object.keys(KATEX).forEach(name => {
    FAMILIES[name.toLowerCase()] = {
      faces: faces(KATEX[name]),
      src: (w, italic) => [KATEX_FONTS + name + '-' + (w >= 600 ? (italic ? 'BoldItalic' : 'Bold') : (italic ? 'Italic' : 'Regular')) + '.ttf']
    };
  });
  // Системные шрифты браузера подменяются ближайшими встраиваемыми
  const GENERIC = { 'sans-serif': 'noto sans', 'system-ui': 'noto sans', arial: 'noto sans', serif: 'noto serif', 'times new roman': 'noto serif', times: 'noto serif', monospace: 'jetbrains mono', cursive: 'noto sans', fantasy: 'noto sans' };

  // Подбор начертания по правилам CSS Fonts (стиль, затем насыщенность) + синтетические жирный/курсив
  function matchFace(fam, weight, italic, sizePx) {
    const def = FAMILIES[fam];
    if (!def) return null;
    let pool = def.faces.filter(f => f.italic === italic);
    let synthItalic = false;
    if (!pool.length) {
      pool = def.faces.filter(f => f.italic !== italic);
      synthItalic = italic;
    }
    let desired = weight;
    if (def.range) desired = Math.min(def.range[1], Math.max(def.range[0], weight));
    const ws = pool.map(f => f.w).sort((a, b) => a - b);
    let pick;
    if (ws.includes(desired)) pick = desired;
    else if (def.range) pick = ws.reduce((a, b) => (Math.abs(b - desired) < Math.abs(a - desired) ? b : a));
    else if (desired >= 400 && desired <= 500) {
      pick = ws.find(w => w >= desired && w <= 500) || [...ws].reverse().find(w => w < desired) || ws.find(w => w > 500);
    } else if (desired < 400) {
      pick = [...ws].reverse().find(w => w <= desired) || ws.find(w => w > desired);
    } else {
      pick = ws.find(w => w >= desired) || [...ws].reverse().find(w => w < desired);
    }
    const maxW = def.range ? def.range[1] : pick;
    // Оптический размер (font-optical-sizing: auto) = размер шрифта в px в пределах оси
    let opsz;
    if (def.opsz) opsz = (sizePx || 16) < (def.opsz[0] + def.opsz[1]) / 2 ? def.opsz[0] : def.opsz[1];
    return {
      fam, w: pick, italic: pool[0].italic, opsz,
      synthBold: weight >= 600 && maxW < 600,
      synthItalic
    };
  }

  function faceKey(f) {
    return f.fam + '|' + f.w + '|' + (f.italic ? 'i' : 'n') + (f.opsz ? '|' + f.opsz : '');
  }

  function parseFamilies(css) {
    const out = [];
    css.split(',').forEach(part => {
      const s = part.trim().replace(/^["']|["']$/g, '').trim().toLowerCase();
      if (s) out.push(s);
    });
    return out;
  }

  // ---------- Письменности ----------
  function isCJK(cp) {
    return (cp >= 0x2E80 && cp <= 0x9FFF) || (cp >= 0xA960 && cp <= 0xA97F) || (cp >= 0xAC00 && cp <= 0xD7FF) ||
      (cp >= 0xF900 && cp <= 0xFAFF) || (cp >= 0xFE30 && cp <= 0xFE4F) || (cp >= 0xFF00 && cp <= 0xFFEF) ||
      (cp >= 0x1100 && cp <= 0x11FF) || (cp >= 0x3130 && cp <= 0x318F) || cp >= 0x20000;
  }
  function isHangul(cp) {
    return (cp >= 0x1100 && cp <= 0x11FF) || (cp >= 0x3130 && cp <= 0x318F) || (cp >= 0xA960 && cp <= 0xA97F) || (cp >= 0xAC00 && cp <= 0xD7FF);
  }
  function isKana(cp) {
    return (cp >= 0x3040 && cp <= 0x30FF) || (cp >= 0x31F0 && cp <= 0x31FF) || (cp >= 0xFF65 && cp <= 0xFF9F);
  }
  // Письменности, которым нужно контекстное формирование глифов или двунаправленный текст:
  // jsPDF этого не умеет, поэтому такие фрагменты выводятся изображением + невидимым текстом
  function needsShaping(cp) {
    return (cp >= 0x0300 && cp <= 0x036F) || (cp >= 0x0590 && cp <= 0x08FF) || (cp >= 0x0900 && cp <= 0x0DFF) ||
      (cp >= 0x0E00 && cp <= 0x0FFF) || (cp >= 0x1000 && cp <= 0x109F) || (cp >= 0x1780 && cp <= 0x18AF) ||
      (cp >= 0x1A00 && cp <= 0x1CFF) || (cp >= 0x1DC0 && cp <= 0x1DFF) || (cp >= 0x200C && cp <= 0x200F) ||
      (cp >= 0x202A && cp <= 0x202E) || (cp >= 0x20D0 && cp <= 0x20FF) || (cp >= 0xA800 && cp <= 0xABFF && !(cp >= 0xA960 && cp <= 0xA97F)) ||
      (cp >= 0xFB1D && cp <= 0xFDFF) || (cp >= 0xFE00 && cp <= 0xFE0F) || (cp >= 0xFE20 && cp <= 0xFE2F) ||
      (cp >= 0xFE70 && cp <= 0xFEFF);
  }
  const CJK_OPEN = /^[「『（〔［｛〈《【〘〖〝]$/;
  const CJK_CLOSE = /^[」』）〕］｝〉》】〙〗〟、。，．：；！？・]$/;
  function isInvisibleCp(cp) {
    return cp === 0xAD || cp === 0x200B || cp === 0x2060 || cp === 0xFEFF || (cp < 0x20 && cp !== 0x09);
  }
  function isSpace(s) {
    return /^[\s 　]+$/.test(s);
  }

  // ---------- Вспомогательное ----------
  function loadScript(doc, src) {
    return new Promise((resolve, reject) => {
      const s = doc.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = () => reject(new Error('Script load failed: ' + src));
      doc.head.appendChild(s);
    });
  }
  // Два кадра отрисовки; во вкладке в фоне кадры не идут — тогда хватает таймера
  function nextFrame(win) {
    return new Promise(r => {
      const t = setTimeout(r, 60);
      win.requestAnimationFrame(() => win.requestAnimationFrame(() => { clearTimeout(t); r(); }));
    });
  }
  function delay(ms) {
    return new Promise(r => setTimeout(r, ms));
  }
  function parseColor(str) {
    const m = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)/.exec(str || '');
    if (!m) return { r: 0, g: 0, b: 0, a: str === 'transparent' ? 0 : 1 };
    let a = m[4] === undefined ? 1 : parseFloat(m[4]);
    if (m[4] && m[4].endsWith('%')) a /= 100;
    return { r: +m[1], g: +m[2], b: +m[3], a };
  }
  function bytesToBinary(bytes) {
    let out = '';
    const CH = 0x8000;
    for (let i = 0; i < bytes.length; i += CH) out += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
    return out;
  }
  async function fetchBytes(url) {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + url);
    return new Uint8Array(await res.arrayBuffer());
  }

  // ---------- Скрытый iframe с документом ----------
  const FRAME_CSS = `
    html,body{margin:0!important;padding:0!important}
    body{width:${PAGE.contentW}px!important;max-width:none!important}
    ::-webkit-scrollbar{width:15px;height:15px}
    [data-zpdf-pseudo-before]::before,[data-zpdf-pseudo-after]::after{content:none!important}
  `;

  async function createFrame(html) {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.tabIndex = -1;
    iframe.style.cssText = 'position:fixed;left:-20000px;top:0;width:1200px;height:900px;border:0;visibility:hidden;pointer-events:none';
    // Печать идёт с плотностью пикселей 1: толщины рамок округляются до целых пикселей устройства.
    // На экранах с масштабом 125–200 % масштабируем iframe так, чтобы внутри devicePixelRatio = 1
    iframe.style.zoom = String(1 / (window.devicePixelRatio || 1));
    const withCss = html.replace('</head>', '<style id="zpdf-frame-css">' + FRAME_CSS + '</style></head>');
    const loaded = new Promise(r => { iframe.onload = r; });
    iframe.srcdoc = withCss;
    document.body.appendChild(iframe);
    await loaded;
    return iframe;
  }

  // Ждём шрифты, изображения и диаграммы Mermaid (они рисуются скриптом документа после загрузки)
  async function waitReady(win, doc) {
    const t0 = Date.now();
    const LIMIT = 15000;
    while (Date.now() - t0 < LIMIT) {
      const pending = Array.from(doc.querySelectorAll('.mermaid')).filter(n => !n.querySelector('svg') && !n.closest('.mermaid-wrap')?.querySelector('.mermaid-error') && n.textContent.trim());
      if (!pending.length) break;
      await delay(100);
    }
    await Promise.all(Array.from(doc.images).map(img => (img.complete ? null : new Promise(r => {
      img.addEventListener('load', r, { once: true });
      img.addEventListener('error', r, { once: true });
      setTimeout(r, 10000);
    }))));
    try { await doc.fonts.ready; } catch (e) { /* шрифты необязательны */ }
    await nextFrame(win);
    // fonts.ready может завершиться до того, как раскладка запросила шрифт, поэтому явно
    // загружаем все сочетания шрифтов документа вместе с нужными им символами
    const want = new Map();
    const tw = doc.createTreeWalker(doc.body, 4);
    for (let n = tw.nextNode(); n; n = tw.nextNode()) {
      const el = n.parentElement;
      if (!el || !n.data.trim()) continue;
      const cs = win.getComputedStyle(el);
      const key = cs.fontStyle + ' ' + cs.fontWeight + ' 16px ' + cs.fontFamily;
      const set = want.get(key) || new Set();
      for (const ch of n.data) if (set.size < 3000) set.add(ch);
      want.set(key, set);
    }
    await Promise.race([
      Promise.all(Array.from(want, ([font, chars]) => doc.fonts.load(font, Array.from(chars).join('')).catch(() => null))),
      delay(10000)
    ]);
    try { await doc.fonts.ready; } catch (e) { /* шрифты необязательны */ }
    await nextFrame(win);
  }

  // ---------- Псевдоэлементы с текстом становятся настоящими узлами ----------
  // (html2canvas не рисует текст в этом режиме, а слою текста нужны координаты Range)
  function resolveContent(content, el) {
    if (!content || content === 'none' || content === 'normal') return null;
    let out = '';
    const re = /"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'|attr\(\s*([\w-]+)\s*\)/g;
    let m, any = false;
    while ((m = re.exec(content))) {
      any = true;
      if (m[3]) out += el.getAttribute(m[3]) || '';
      else out += (m[1] !== undefined ? m[1] : m[2]).replace(/\\([0-9a-fA-F]{1,6})\s?/g, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/\\(.)/g, '$1');
    }
    return any ? out : null;
  }
  function materializePseudo(win, root) {
    const els = root.querySelectorAll('*');
    for (const el of els) {
      ['before', 'after'].forEach(which => {
        const cs = win.getComputedStyle(el, '::' + which);
        const text = resolveContent(cs.content, el);
        if (!text || !text.trim()) return;
        const span = el.ownerDocument.createElement('span');
        span.setAttribute('data-zpdf-pseudo', which);
        let css = '';
        for (let i = 0; i < cs.length; i++) {
          const p = cs[i];
          if (p === 'content') continue;
          css += p + ':' + cs.getPropertyValue(p) + ';';
        }
        span.style.cssText = css;
        span.textContent = text;
        el.setAttribute('data-zpdf-pseudo-' + which, '');
        if (which === 'before') el.insertBefore(span, el.firstChild);
        else el.appendChild(span);
      });
    }
  }

  // ---------- Полосы прокрутки ----------
  // При печати Chromium размечает и рисует полосы прокрутки у блоков с переполнением
  // (например, длинные строки кода): толщина 15 px или заданная через ::-webkit-scrollbar
  function scrollbarSizes(win, el) {
    if (!el || !el.getBoundingClientRect) return { h: 0, w: 0 };
    const cs = win.getComputedStyle(el);
    const bt = parseFloat(cs.borderTopWidth) || 0, bb = parseFloat(cs.borderBottomWidth) || 0;
    const bl = parseFloat(cs.borderLeftWidth) || 0, br = parseFloat(cs.borderRightWidth) || 0;
    const r = el.getBoundingClientRect();
    // clientWidth/clientHeight округлены до целых: долю пикселя полосой не считаем,
    // полоса есть только при реальном переполнении (или overflow: scroll)
    let h = Math.max(0, Math.round((r.height - bt - bb - el.clientHeight) * 64) / 64);
    let w = Math.max(0, Math.round((r.width - bl - br - el.clientWidth) * 64) / 64);
    if (h < 1 || !(el.scrollWidth > el.clientWidth || cs.overflowX === 'scroll')) h = 0;
    if (w < 1 || !(el.scrollHeight > el.clientHeight || cs.overflowY === 'scroll')) w = 0;
    return { h, w };
  }

  // Правила ::-webkit-scrollbar* из стилей документа, подходящие к элементу
  function customScrollbarStyle(doc, el) {
    const out = {};
    let found = false;
    for (const sheet of Array.from(doc.styleSheets)) {
      if (sheet.ownerNode && sheet.ownerNode.id === 'zpdf-frame-css') continue;
      let rules;
      try { rules = sheet.cssRules; } catch (e) { continue; }
      for (const rule of Array.from(rules || [])) {
        if (!rule.selectorText || rule.selectorText.indexOf('::-webkit-scrollbar') < 0) continue;
        rule.selectorText.split(',').forEach(sel => {
          const m = /^(.*?)::-webkit-scrollbar(-[a-z-]+)?\s*$/.exec(sel.trim());
          if (!m) return;
          const base = m[1].trim() || '*';
          let ok = false;
          try { ok = el.matches(base); } catch (e) { ok = false; }
          if (!ok) return;
          if (!(rule.style.width || rule.style.height || m[2])) return;
          found = true;
          const part = m[2] || '';
          out[part] = out[part] || {};
          for (let i = 0; i < rule.style.length; i++) out[part][rule.style[i]] = rule.style.getPropertyValue(rule.style[i]);
        });
      }
    }
    return found ? out : null;
  }

  function collectScrollbars(win, doc, root) {
    const out = [];
    const clipCache = new Map();
    root.querySelectorAll('*').forEach(el => {
      const cs = win.getComputedStyle(el);
      if (!/(auto|scroll)/.test(cs.overflowX + cs.overflowY) || cs.visibility !== 'visible') return;
      const bars = scrollbarSizes(win, el);
      if (!bars.h && !bars.w) return;
      const r = el.getBoundingClientRect();
      const left = r.left + win.scrollX + el.clientLeft, top = r.top + win.scrollY + el.clientTop;
      const custom = customScrollbarStyle(doc, el);
      out.push({
        x: left, y: top, cw: el.clientWidth, ch: el.clientHeight, sw: el.scrollWidth, sh: el.scrollHeight,
        h: bars.h, w: bars.w, custom,
        clip: clipRectFor(win, el.parentElement || el, root, clipCache)
      });
    });
    return out;
  }

  function drawScrollbars(pdf, bars) {
    const k = PAGE.k;
    const fill = (color, x, y, w, h, r, page, clip) => {
      const c = parseColor(color);
      if (c.a <= 0 || w <= 0 || h <= 0) return;
      withClip(pdf, clip, page, () => {
        setOpacity(pdf, c.a);
        pdf.setFillColor(c.r, c.g, c.b);
        const pt = toPt(x, y, page);
        const rr = Math.min(r || 0, w / 2, h / 2) * k;
        pdf.internal.write(roundedPath(pdf, pt.x, pt.y, w * k, h * k, [rr, rr, rr, rr]) + 'f');
      });
    };
    const tri = (cx, cy, dir, page, clip) => {
      // Стрелка кнопки (как в теме Fluent): треугольник 7 × 4 px
      const pts = { left: [[2, -3.5], [-2, 0], [2, 3.5]], right: [[-2, -3.5], [2, 0], [-2, 3.5]], up: [[-3.5, 2], [0, -2], [3.5, 2]], down: [[-3.5, -2], [0, 2], [3.5, -2]] }[dir];
      withClip(pdf, clip, page, () => {
        pdf.setFillColor(139, 139, 139);
        const p0 = toPt(cx + pts[0][0], cy + pts[0][1], page);
        const P = PAGE.hPt;
        let s = p0.x.toFixed(3) + ' ' + (P - p0.y).toFixed(3) + ' m\n';
        for (let i = 1; i < 3; i++) { const p = toPt(cx + pts[i][0], cy + pts[i][1], page); s += p.x.toFixed(3) + ' ' + (P - p.y).toFixed(3) + ' l\n'; }
        pdf.internal.write(s + 'h f');
      });
    };
    bars.forEach(b => {
      const page = pageOf(b.y + (b.ch + b.h) / 2);
      ensurePages(pdf, page + 1);
      pdf.setPage(page + 1);
      const parts = [];
      if (b.h) parts.push({ horiz: true, x: b.x, y: b.y + b.ch, len: b.cw, th: b.h, ratio: b.cw / Math.max(1, b.sw) });
      if (b.w) parts.push({ horiz: false, x: b.x + b.cw, y: b.y, len: b.ch, th: b.w, ratio: b.ch / Math.max(1, b.sh) });
      parts.forEach(s => {
        const rect = (along, len, inset, thick) => (s.horiz ? [s.x + along, s.y + inset, len, thick] : [s.x + inset, s.y + along, thick, len]);
        if (b.custom) {
          const sb = b.custom[''] || {}, track = b.custom['-track'] || {}, thumb = b.custom['-thumb'] || {};
          const bg = c => c && (c['background-color'] || c.background);
          if (bg(sb)) fill(bg(sb), ...rect(0, s.len, 0, s.th), 0, page, b.clip);
          if (bg(track)) fill(bg(track), ...rect(0, s.len, 0, s.th), parseFloat(track['border-radius']) || 0, page, b.clip);
          if (bg(thumb)) {
            const tl = Math.max(s.th, Math.round(s.len * s.ratio));
            fill(bg(thumb), ...rect(0, tl, 0, s.th), parseFloat(thumb['border-radius']) || 0, page, b.clip);
          }
        } else {
          // Тема Fluent (Windows 11): фон #FCFCFC, кнопки 18 px, бегунок 9 px со скруглением
          const BTN = 18;
          fill('rgb(252,252,252)', ...rect(0, s.len, 0, s.th), 0, page, b.clip);
          const trackLen = Math.max(0, s.len - BTN * 2);
          const tl = Math.max(17, Math.round(trackLen * s.ratio));
          fill('rgb(139,139,139)', ...rect(BTN, Math.min(tl, trackLen), (s.th - 9) / 2, 9), 4.5, page, b.clip);
          if (s.horiz) {
            tri(s.x + BTN / 2, s.y + s.th / 2, 'left', page, b.clip);
            tri(s.x + s.len - BTN / 2, s.y + s.th / 2, 'right', page, b.clip);
          } else {
            tri(s.x + s.th / 2, s.y + BTN / 2, 'up', page, b.clip);
            tri(s.x + s.th / 2, s.y + s.len - BTN / 2, 'down', page, b.clip);
          }
        }
      });
      if (b.h && b.w && !b.custom) fill('rgb(252,252,252)', b.x + b.cw, b.y + b.ch, b.w, b.h, 0, page, b.clip);
    });
  }

  // ---------- Разрывы страниц как при печати ----------
  const ATOMIC_TAGS = new Set(['IMG', 'SVG', 'CANVAS', 'VIDEO', 'IFRAME', 'INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'OBJECT', 'EMBED', 'HR']);
  function isAtomic(el, cs) {
    if (ATOMIC_TAGS.has(el.tagName.toUpperCase())) return true;
    return /^inline-(block|flex|grid|table)$/.test(cs.display);
  }
  function skipSubtree(cs) {
    return cs.display === 'none' || cs.position === 'absolute' || cs.position === 'fixed';
  }

  // Видимые «листья» раскладки в порядке документа: текстовые узлы и атомарные элементы
  function collectLeaves(win, root) {
    const out = [];
    (function walk(node) {
      for (let c = node.firstChild; c; c = c.nextSibling) {
        if (c.nodeType === 3) {
          if (c.data.trim()) out.push(c);
        } else if (c.nodeType === 1) {
          const cs = win.getComputedStyle(c);
          if (skipSubtree(cs)) continue;
          if (isAtomic(c, cs)) { out.push(c); continue; }
          const before = out.length;
          walk(c);
          if (out.length === before && /^(block|list-item|flow-root|table|flex|grid)$/.test(cs.display)) {
            const r = c.getBoundingClientRect();
            if (r.height > 0 && (cs.borderTopStyle !== 'none' || cs.backgroundColor !== 'rgba(0, 0, 0, 0)' || cs.backgroundImage !== 'none')) out.push(c);
          }
        }
      }
    })(root);
    return out;
  }

  function charRect(doc, node, i) {
    const r = doc.createRange();
    r.setStart(node, i);
    r.setEnd(node, i + 1);
    const list = r.getClientRects();
    return list.length ? list[0] : null;
  }

  // Копия документа в многоколоночном контейнере высотой в страницу: те же разрывы, что и при печати
  async function buildMulticol(win, doc, root) {
    // Большой промежуток между колонками: строки кода, выходящие за ширину блока, не должны
    // попадать в область соседней колонки
    const W = PAGE.contentW, H = PAGE.contentH, G = 20000;
    const M = doc.createElement('div');
    M.style.cssText = `position:absolute;left:0;top:0;width:${W}px;height:${H}px;column-width:${W}px;column-gap:${G}px;column-fill:auto;margin:0;padding:0;border:0;visibility:hidden`;
    const R2 = root.cloneNode(true);
    M.appendChild(R2);
    doc.body.appendChild(M);
    // При печати прокручиваемые блоки фрагментируются, а в колонках — нет: выравниваем поведение.
    // Место под полосы прокрутки (при печати они есть) сохраняем внутренними отступами
    const origEls = root.querySelectorAll('*');
    R2.querySelectorAll('*').forEach((el, i) => {
      const cs = win.getComputedStyle(el);
      if (/(auto|scroll|hidden)/.test(cs.overflowX + cs.overflowY)) {
        const bars = scrollbarSizes(win, origEls[i]);
        el.style.setProperty('overflow', 'clip', 'important');
        if (cs.display === 'block') el.style.setProperty('display', 'flow-root', 'important');
        if (bars.h) el.style.setProperty('padding-bottom', (parseFloat(cs.paddingBottom) + bars.h) + 'px', 'important');
        if (bars.w) el.style.setProperty('padding-right', (parseFloat(cs.paddingRight) + bars.w) + 'px', 'important');
      }
    });
    // Копии изображений загружаются заново (даже из кэша — асинхронно): ждём их размеров
    await Promise.all(Array.from(R2.querySelectorAll('img')).map(img => Promise.race([
      img.decode().catch(() => null), delay(5000)
    ])));
    await nextFrame(win);
    const mRect = M.getBoundingClientRect();
    return {
      M, R2, W, H, G,
      colOf: r => Math.max(0, Math.floor((r.left - mRect.left + 0.5) / (W + G))),
      yOf: r => r.top - mRect.top
    };
  }

  // Копия строк заголовка таблицы со стилями оригинала (стили перенесены в атрибут style)
  function cloneHeaderRows(win, doc, thead) {
    const frag = doc.createDocumentFragment();
    const rows = Array.from(thead.rows);
    rows.forEach(tr => {
      const c = tr.cloneNode(true);
      c.setAttribute('data-zpdf-thead-repeat', '');
      const src = [tr, ...tr.querySelectorAll('*')], dst = [c, ...c.querySelectorAll('*')];
      src.forEach((s, i) => {
        const cs = win.getComputedStyle(s);
        let css = '';
        // Размеры не переносим: вычисленная высота при box-sizing:border-box сместила бы содержимое
        for (let k = 0; k < cs.length; k++) {
          if (/^(width|height|min-width|min-height|max-width|max-height|inline-size|block-size|min-inline-size|min-block-size|max-inline-size|max-block-size)$/.test(cs[k])) continue;
          css += cs[k] + ':' + cs.getPropertyValue(cs[k]) + ';';
        }
        dst[i].style.cssText = css;
      });
      // Повтор заголовка всегда открывает новую страницу (в колонках — принудительный разрыв)
      if (!frag.firstChild) c.style.setProperty('break-before', 'column');
      frag.appendChild(c);
    });
    // Вместе с распоркой число вставленных строк должно быть чётным, иначе «зебра»
    // (:nth-child(even)) у следующих строк сменит цвет
    if (rows.length % 2 === 0) {
      const f = doc.createElement('tr');
      f.setAttribute('data-zpdf-thead-repeat', '');
      f.style.cssText = 'height:0;border:0;padding:0';
      frag.appendChild(f);
    }
    return frag;
  }

  // При печати Chromium повторяет заголовок таблицы (thead) на каждой следующей странице.
  // В многоколоночной раскладке этого нет, поэтому вставляем копии заголовка сами — по одной,
  // каждый раз заново измеряя раскладку
  async function repeatTableHeaders(win, doc, root) {
    if (!root.querySelector('table > thead')) return;
    for (let iter = 0; iter < 300; iter++) {
      const mc = await buildMulticol(win, doc, root);
      const tablesA = root.querySelectorAll('table'), tablesB = mc.R2.querySelectorAll('table');
      let inserted = false;
      for (let t = 0; t < tablesB.length && !inserted; t++) {
        const tb = tablesB[t];
        if (!tb.tHead || !tb.tHead.rows.length) continue;
        const headRects = tb.tHead.getClientRects();
        if (!headRects.length) continue;
        let prevCol = mc.colOf(headRects[headRects.length - 1]);
        const rowsB = [];
        Array.from(tb.tBodies).forEach(b => Array.from(b.rows).forEach(r => rowsB.push(r)));
        const rowsA = [];
        Array.from(tablesA[t].tBodies).forEach(b => Array.from(b.rows).forEach(r => rowsA.push(r)));
        for (let i = 0; i < rowsB.length; i++) {
          const rr = rowsB[i].getClientRects();
          if (!rr.length) continue;
          const c0 = mc.colOf(rr[0]);
          const prev = rowsB[i].previousElementSibling;
          if (c0 > prevCol && !rowsB[i].hasAttribute('data-zpdf-thead-repeat') && !(prev && prev.hasAttribute('data-zpdf-thead-repeat'))) {
            rowsA[i].parentNode.insertBefore(cloneHeaderRows(win, doc, tablesA[t].tHead), rowsA[i]);
            inserted = true;
            break;
          }
          prevCol = mc.colOf(rr[rr.length - 1]);
        }
      }
      mc.M.remove();
      if (!inserted) break;
      await nextFrame(win);
    }
  }

  // «Листья» копии в колонках: позиции начала каждой колонки и число страниц
  function measureItems(win, doc, mc) {
    const { R2, colOf, yOf } = mc;
    const leaves = collectLeaves(win, R2);
    const items = []; // {node(B), offset, col, y}
    for (const n of leaves) {
      if (n.nodeType === 3) {
        const data = n.data;
        let first = -1, last = -1;
        for (let i = 0; i < data.length; i++) if (/\S/.test(data[i])) { if (first < 0) first = i; last = i; }
        if (first < 0) continue;
        const r1 = charRect(doc, n, first), r2 = charRect(doc, n, last);
        if (!r1 || !r2) continue;
        const c1 = colOf(r1), c2 = colOf(r2);
        items.push({ node: n, offset: first, col: c1, y: yOf(r1) });
        // Узел пересекает границы колонок: ищем начало каждой следующей колонки двоичным поиском
        // (только по непробельным символам — у пробелов в конце строки прямоугольника может не быть)
        if (c2 > c1) {
          const idx = [];
          for (let i = first; i <= last; i++) if (/\S/.test(data[i])) idx.push(i);
          const colAt = k => { const rr = charRect(doc, n, idx[k]); return rr ? colOf(rr) : -1; };
          for (let c = c1 + 1; c <= c2; c++) {
            let lo = 0, hi = idx.length - 1;
            while (lo < hi) {
              const mid = (lo + hi) >> 1;
              if (colAt(mid) >= c) hi = mid; else lo = mid + 1;
            }
            const rr = charRect(doc, n, idx[lo]);
            if (rr && colOf(rr) >= c) items.push({ node: n, offset: idx[lo], col: colOf(rr), y: yOf(rr) });
          }
        }
      } else {
        const rects = n.getClientRects();
        if (!rects.length) continue;
        items.push({ node: n, offset: -1, col: colOf(rects[0]), y: yOf(rects[0]) });
      }
    }
    let maxCol = 0;
    for (const it of items) maxCol = Math.max(maxCol, it.col);
    // Число страниц — по последнему фрагменту корня (поля и рамки после последней строки тоже считаются)
    let pageCount = maxCol + 1;
    for (const r of R2.getClientRects()) if (r.height > 0.5) pageCount = Math.max(pageCount, colOf(r) + 1);
    return { items, maxCol, pageCount };
  }

  async function paginate(win, doc, root) {
    await repeatTableHeaders(win, doc, root);
    const mc = await buildMulticol(win, doc, root);
    const { M, R2, H, colOf, yOf } = mc;


    // Параллельные списки узлов оригинала и копии
    const listA = [], listB = [];
    const twA = doc.createTreeWalker(root, 0xFFFFFFFF), twB = doc.createTreeWalker(R2, 0xFFFFFFFF);
    for (let a = twA.currentNode, b = twB.currentNode; a && b; a = twA.nextNode(), b = twB.nextNode()) {
      listA.push(a); listB.push(b);
    }
    const toA = new Map(listB.map((b, i) => [b, listA[i]]));

    const { items, maxCol, pageCount } = measureItems(win, doc, mc);
    // Колонка, в которой начинается рамка элемента (для решения, куда ставить распорку)
    const boxCol = el => {
      const rs = el.getClientRects();
      return rs.length ? colOf(rs[0]) : 0;
    };
    const plan = [];
    for (let c = 1; c <= maxCol; c++) {
      const it = items.find(x => x.col >= c);
      if (!it || it.col !== c) continue;
      if (plan.length && plan[plan.length - 1].item === it) continue;
      // Поднимаемся к самому внешнему предку, который целиком начинается в этой колонке
      let anchorB = it.node, offset = it.offset;
      if (it.node.nodeType === 3 && it.offset > 0) {
        const before = it.node.data.slice(0, it.offset);
        if (/\S/.test(before)) {
          plan.push({ col: c, item: it, anchorB: it.node, offset: it.offset, y: it.y });
          continue;
        }
        offset = -1;
      }
      for (;;) {
        const parent = anchorB.parentNode;
        if (!parent || parent === R2) break;
        let prev = anchorB.previousSibling, hasPrev = false;
        while (prev) {
          if (prev.nodeType === 1 || (prev.nodeType === 3 && prev.data.trim())) {
            if (prev.nodeType === 1) {
              const pcs = win.getComputedStyle(prev);
              if (!(pcs.display === 'none' || pcs.position === 'absolute' || pcs.position === 'fixed')) { hasPrev = true; break; }
            } else { hasPrev = true; break; }
          }
          prev = prev.previousSibling;
        }
        if (hasPrev) break;
        const pcs = win.getComputedStyle(parent);
        const inline = pcs.display === 'inline';
        if (!inline && boxCol(parent) < c) break;
        anchorB = parent;
      }
      plan.push({ col: c, item: it, anchorB, offset, y: it.y });
    }
    M.remove();

    // Вставляем распорки в оригинал
    const measureA = (node, offset) => {
      if (node.nodeType === 3) {
        const d = node.data;
        let i = Math.max(0, offset);
        while (i < d.length && !/\S/.test(d[i])) i++;
        const r = charRect(doc, node, Math.min(i, d.length - 1));
        return r ? r.top + win.scrollY : null;
      }
      const rs = node.getClientRects();
      return rs.length ? rs[0].top + win.scrollY : null;
    };
    const splitMap = new Map(); // исходный текстовый узел → [{start, node}]
    const resolveText = (orig, offset) => {
      const segs = splitMap.get(orig) || [{ start: 0, node: orig }];
      let seg = segs[0];
      for (const s of segs) if (s.start <= offset) seg = s;
      return { segs, seg, local: offset - seg.start };
    };
    for (const p of plan) {
      const target = p.col * H + p.y;
      const leafA = toA.get(p.item.node);
      let measureNode, measureOff;
      const spacer = doc.createElement('div');
      spacer.setAttribute('data-zpdf-spacer', '');
      spacer.style.cssText = 'display:block;height:1px;margin:0;padding:0;border:0;background:none;width:auto';
      if (p.offset > 0 && p.anchorB.nodeType === 3) {
        const { segs, seg, local } = resolveText(leafA, p.offset);
        const second = seg.node.splitText(local);
        segs.push({ start: p.offset, node: second });
        segs.sort((a, b) => a.start - b.start);
        splitMap.set(leafA, segs);
        second.parentNode.insertBefore(spacer, second);
        measureNode = second; measureOff = 0;
      } else {
        let anchorA = toA.get(p.anchorB);
        if (anchorA === leafA && leafA.nodeType === 3 && splitMap.has(leafA)) anchorA = splitMap.get(leafA)[0].node;
        const tag = anchorA.nodeType === 1 ? anchorA.tagName : '';
        if (/^(TR)$/.test(tag)) {
          const tr = doc.createElement('tr');
          tr.setAttribute('data-zpdf-spacer', '');
          const td = doc.createElement('td');
          td.colSpan = 999;
          td.style.cssText = 'padding:0!important;border:0!important;background:transparent!important;height:1px';
          tr.appendChild(td);
          anchorA.parentNode.insertBefore(tr, anchorA);
          spacer._cell = td;
        } else if (/^(TD|TH|TBODY|THEAD|TFOOT)$/.test(tag)) {
          continue;
        } else {
          anchorA.parentNode.insertBefore(spacer, anchorA);
        }
        if (leafA.nodeType === 3) {
          const { seg, local } = resolveText(leafA, Math.max(0, p.item.offset));
          measureNode = seg.node; measureOff = local;
        } else { measureNode = leafA; measureOff = -1; }
      }
      const box = spacer._cell || spacer;
      let h = 1;
      // Распорка может быть и «отрицательной»: при печати поле перед элементом в начале страницы
      // отбрасывается, а в обычном потоке оно сдвигает элемент ниже начала страницы
      const canShrink = !spacer._cell;
      for (let k = 0; k < 6; k++) {
        const y = measureA(measureNode, measureOff);
        if (y === null) break;
        const d = target - y;
        if (Math.abs(d) < 0.01) break;
        h = canShrink ? h + d : Math.max(0, h + d);
        if (h >= 0) { box.style.height = h + 'px'; box.style.marginTop = '0px'; }
        else { box.style.height = '0px'; box.style.marginTop = h + 'px'; }
      }
    }
    return pageCount;
  }

  // ---------- Метрики шрифта ----------
  function makeMetrics(win, doc) {
    const cache = new Map();
    const host = doc.createElement('div');
    host.style.cssText = 'position:absolute;left:-10000px;top:0;visibility:hidden;white-space:nowrap;line-height:normal';
    doc.body.appendChild(host);
    const IMG = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    return {
      // Расстояние от верха прямоугольника текста (Range) до базовой линии
      ascent(family, sizePx, weight, style) {
        const key = family + '|' + sizePx + '|' + weight + '|' + style;
        if (cache.has(key)) return cache.get(key);
        const span = doc.createElement('span');
        span.style.cssText = `font-family:${family};font-size:${sizePx}px;font-weight:${weight};font-style:${style}`;
        const t = doc.createTextNode('Hxg');
        span.appendChild(t);
        const img = doc.createElement('img');
        img.src = IMG;
        img.style.cssText = 'width:1px;height:0;vertical-align:baseline;margin:0;padding:0;border:0';
        span.appendChild(img);
        host.appendChild(span);
        const rr = doc.createRange();
        rr.selectNodeContents(t);
        const tr = rr.getBoundingClientRect();
        const ir = img.getBoundingClientRect();
        const v = { ascent: ir.bottom - tr.top, height: tr.height };
        host.removeChild(span);
        cache.set(key, v);
        return v;
      },
      textWidth(cssFont, text, extraCss) {
        const span = doc.createElement('span');
        span.style.cssText = 'font:' + cssFont + ';white-space:pre;' + (extraCss || '');
        span.textContent = text;
        host.appendChild(span);
        const w = span.getBoundingClientRect().width;
        host.removeChild(span);
        return w;
      },
      dispose() { host.remove(); }
    };
  }

  // ---------- Сбор текста из раскладки ----------
  const segmenter = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null;
  function graphemes(str) {
    if (segmenter) return Array.from(segmenter.segment(str), s => ({ s: s.segment, i: s.index }));
    const out = [];
    let i = 0;
    for (const ch of str) { out.push({ s: ch, i }); i += ch.length; }
    return out;
  }

  function effectiveOpacity(win, el, stop) {
    let a = 1;
    for (let e = el; e && e !== stop; e = e.parentElement) {
      const o = parseFloat(win.getComputedStyle(e).opacity);
      if (!isNaN(o)) a *= o;
    }
    return a;
  }

  // Прямоугольник обрезки (overflow, область SVG) в координатах документа
  function clipRectFor(win, el, root, cache) {
    if (cache.has(el)) return cache.get(el);
    let rect = null;
    const parent = el.parentElement;
    if (parent && el !== root) rect = clipRectFor(win, parent, root, cache);
    const cs = win.getComputedStyle(el);
    let own = null;
    const isSvgRoot = el.namespaceURI === 'http://www.w3.org/2000/svg' && el.tagName.toLowerCase() === 'svg';
    if (isSvgRoot || /(auto|scroll|hidden|clip)/.test(cs.overflowX + cs.overflowY)) {
      const r = el.getBoundingClientRect();
      const bl = parseFloat(cs.borderLeftWidth) || 0, bt = parseFloat(cs.borderTopWidth) || 0;
      const br = parseFloat(cs.borderRightWidth) || 0, bb = parseFloat(cs.borderBottomWidth) || 0;
      const clipX = isSvgRoot || cs.overflowX !== 'visible', clipY = isSvgRoot || cs.overflowY !== 'visible';
      own = {
        l: clipX ? r.left + bl + win.scrollX : -1e9, t: clipY ? r.top + bt + win.scrollY : -1e9,
        r: clipX ? r.right - br + win.scrollX : 1e9, b: clipY ? r.bottom - bb + win.scrollY : 1e9
      };
    }
    if (own) rect = rect ? { l: Math.max(rect.l, own.l), t: Math.max(rect.t, own.t), r: Math.min(rect.r, own.r), b: Math.min(rect.b, own.b) } : own;
    cache.set(el, rect);
    return rect;
  }

  function cssScale(el) {
    // Масштаб текста внутри SVG (viewBox) — по матрице ближайшего элемента SVG
    let e = el;
    while (e && !(e instanceof e.ownerDocument.defaultView.SVGGraphicsElement)) e = e.parentElement;
    if (!e || !e.getScreenCTM) return { s: 1, angle: 0 };
    const m = e.getScreenCTM();
    if (!m) return { s: 1, angle: 0 };
    return { s: Math.hypot(m.a, m.b), angle: Math.atan2(m.b, m.a) };
  }

  function decorationsFor(win, el, root) {
    const out = [];
    for (let e = el; e && e !== root.parentElement; e = e.parentElement) {
      const cs = win.getComputedStyle(e);
      const line = cs.textDecorationLine;
      if (line && line !== 'none') {
        line.split(/\s+/).forEach(l => out.push({ line: l, color: cs.textDecorationColor || cs.color, style: cs.textDecorationStyle, thickness: cs.textDecorationThickness, el: e }));
      }
      if (/^inline-(block|flex|grid|table)$/.test(cs.display) || cs.position === 'absolute' || cs.float !== 'none') break;
    }
    return out;
  }

  // Все видимые текстовые узлы → «прогоны» с одинаковым шрифтом на одной строке
  function collectText(win, doc, root, metrics) {
    const runs = [];
    const decos = [];
    const clipCache = new Map();
    const walker = doc.createTreeWalker(root, 4);
    const range = doc.createRange();
    const visCache = new Map();
    const visible = el => {
      if (visCache.has(el)) return visCache.get(el);
      let v = true;
      for (let e = el; e && e !== root.parentElement; e = e.parentElement) {
        const cs = win.getComputedStyle(e);
        if (cs.display === 'none' || (cs.clip && cs.clip !== 'auto') || cs.clipPath === 'inset(50%)') { v = false; break; }
        if (e.namespaceURI === 'http://www.w3.org/2000/svg' && /^(defs|clipPath|mask|marker|pattern|symbol|style|script|title|desc|metadata)$/i.test(e.tagName)) { v = false; break; }
        if (/^(SCRIPT|STYLE|TEMPLATE|NOSCRIPT|TITLE|TEXTAREA)$/.test(e.tagName)) { v = false; break; }
      }
      visCache.set(el, v);
      return v;
    };
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const el = node.parentElement;
      if (!el || !node.data || !visible(el)) continue;
      const cs = win.getComputedStyle(el);
      if (cs.visibility !== 'visible') continue;
      const color = parseColor(cs.webkitTextFillColor && cs.webkitTextFillColor !== cs.color ? cs.webkitTextFillColor : cs.color);
      const opacity = color.a * effectiveOpacity(win, el, root.parentElement);
      if (opacity <= 0.001) continue;
      const sc = cssScale(el);
      const sizePx = parseFloat(cs.fontSize);
      const weight = parseInt(cs.fontWeight, 10) || 400;
      const italic = cs.fontStyle !== 'normal';
      const style = {
        families: parseFamilies(cs.fontFamily), familyCss: cs.fontFamily, sizePx, weight, italic,
        fontStyle: cs.fontStyle, color, opacity, scale: sc.s, angle: sc.angle,
        cssFont: `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`
      };
      const m = metrics.ascent(cs.fontFamily, sizePx, cs.fontWeight, cs.fontStyle);
      const clip = clipRectFor(win, el, root, clipCache);
      const isSvgText = el.namespaceURI === 'http://www.w3.org/2000/svg';
      const gs = graphemes(node.data);
      let cur = null;
      const flush = () => { if (cur && cur.text.trim()) runs.push(cur); cur = null; };
      for (const g of gs) {
        range.setStart(node, g.i);
        range.setEnd(node, g.i + g.s.length);
        const rs = range.getClientRects();
        if (!rs.length) { if (cur && isSpace(g.s)) { cur.text += ' '; flush(); } continue; }
        const r = rs[rs.length - 1];
        if (r.width === 0 && isSpace(g.s)) { if (cur) { cur.text += ' '; flush(); } continue; }
        const cp = g.s.codePointAt(0);
        if (isInvisibleCp(cp) && g.s.length === 1) continue;
        if (isSpace(g.s)) {
          if (cur) { cur.text += g.s.replace(/[ 　\t]/g, m0 => (m0 === '\t' ? ' ' : m0)); flush(); }
          continue;
        }
        const top = r.top + win.scrollY, left = r.left + win.scrollX;
        const cjk = isCJK(cp);
        // Соседство по горизонтали в обе стороны: у текста справа налево (иврит, арабский) графемы идут к левому краю
        const rx = r.right + win.scrollX;
        const sameLine = cur && Math.abs(cur.top - top) < 0.6 && !cur.cjk && !cjk &&
          (Math.abs(cur.right - left) < 1.2 || Math.abs(cur.left - rx) < 1.2);
        if (!sameLine) {
          flush();
          cur = {
            text: '', left, top, right: left, height: r.height, cjk, node, nodeStart: g.i, style, ascent: m.ascent * sc.s, clip,
            svgText: isSvgText, el
          };
        }
        cur.text += g.s;
        cur.left = Math.min(cur.left, left);
        cur.right = Math.max(cur.right, rx);
        if (cjk) flush();
      }
      flush();
      // Оформление текста (зачёркивание, подчёркивание) — по фрагментам строк
      const dl = decorationsFor(win, el, root);
      if (dl.length && node.data.trim()) {
        range.selectNodeContents(node);
        for (const r of range.getClientRects()) {
          if (r.width <= 0) continue;
          dl.forEach(d => decos.push({ d, left: r.left + win.scrollX, top: r.top + win.scrollY, width: r.width, height: r.height, style, ascent: m.ascent, clip }));
        }
      }
    }
    return { runs, decos };
  }

  // ---------- Маркеры списков (рисуются как в Chromium) ----------
  function toRoman(n, upper) {
    if (n <= 0 || n >= 4000) return String(n);
    const map = [[1000, 'm'], [900, 'cm'], [500, 'd'], [400, 'cd'], [100, 'c'], [90, 'xc'], [50, 'l'], [40, 'xl'], [10, 'x'], [9, 'ix'], [5, 'v'], [4, 'iv'], [1, 'i']];
    let s = '';
    for (const [v, r] of map) while (n >= v) { s += r; n -= v; }
    return upper ? s.toUpperCase() : s;
  }
  function toAlpha(n, upper, alphabet) {
    if (n <= 0) return String(n);
    let s = '';
    while (n > 0) { n--; s = alphabet[n % alphabet.length] + s; n = Math.floor(n / alphabet.length); }
    return upper ? s.toUpperCase() : s;
  }
  function counterText(type, n) {
    switch (type) {
      case 'lower-alpha': case 'lower-latin': return toAlpha(n, false, 'abcdefghijklmnopqrstuvwxyz');
      case 'upper-alpha': case 'upper-latin': return toAlpha(n, true, 'abcdefghijklmnopqrstuvwxyz');
      case 'lower-roman': return toRoman(n, false);
      case 'upper-roman': return toRoman(n, true);
      case 'lower-greek': return toAlpha(n, false, 'αβγδεζηθικλμνξοπρστυφχψω');
      case 'decimal-leading-zero': return (n < 10 && n >= 0 ? '0' : '') + n;
      default: return String(n);
    }
  }
  function collectMarkers(win, doc, root, metrics) {
    const out = [];
    const range = doc.createRange();
    root.querySelectorAll('li').forEach(li => {
      const cs = win.getComputedStyle(li);
      if (cs.display !== 'list-item' || cs.listStyleType === 'none' || cs.listStylePosition !== 'outside' || cs.visibility !== 'visible') return;
      const ms = win.getComputedStyle(li, '::marker');
      // Базовая линия первой строки пункта
      let baseline = null;
      const tw = doc.createTreeWalker(li, 5);
      for (let n = tw.nextNode(); n; n = tw.nextNode()) {
        if (n.nodeType === 1) {
          const ncs = win.getComputedStyle(n);
          if (ncs.display === 'none') { continue; }
          if (n.tagName === 'INPUT' || n.tagName === 'IMG') {
            const r = n.getBoundingClientRect();
            const mb = parseFloat(ncs.marginBottom) || 0;
            if (r.height) { baseline = r.bottom + mb + win.scrollY; break; }
          }
          continue;
        }
        if (!n.data.trim()) continue;
        const i = n.data.search(/\S/);
        range.setStart(n, i); range.setEnd(n, i + 1);
        const r = range.getClientRects()[0];
        if (!r) continue;
        const pcs = win.getComputedStyle(n.parentElement);
        baseline = r.top + win.scrollY + metrics.ascent(pcs.fontFamily, parseFloat(pcs.fontSize), pcs.fontWeight, pcs.fontStyle).ascent;
        break;
      }
      if (baseline === null) return;
      baseline = Math.round(baseline);
      const lr = li.getBoundingClientRect();
      const contentLeft = lr.left + win.scrollX + (parseFloat(cs.borderLeftWidth) || 0) + (parseFloat(cs.paddingLeft) || 0);
      const fam = ms.fontFamily || cs.fontFamily;
      const size = parseFloat(ms.fontSize || cs.fontSize);
      const mm = metrics.ascent(fam, size, ms.fontWeight, ms.fontStyle);
      const ascent = Math.round(mm.ascent);
      const color = parseColor(ms.color || cs.color);
      const type = cs.listStyleType;
      const style = {
        families: parseFamilies(fam), familyCss: fam, sizePx: size, weight: parseInt(ms.fontWeight, 10) || 400,
        italic: ms.fontStyle !== 'normal', fontStyle: ms.fontStyle, color, opacity: color.a, scale: 1, angle: 0,
        cssFont: `${ms.fontStyle} ${ms.fontWeight} ${ms.fontSize} ${fam}`
      };
      if (type === 'disc' || type === 'circle' || type === 'square') {
        const offset = Math.floor(ascent * 2 / 3);
        const bw = Math.floor((offset + 1) / 2);
        const markerX = contentLeft - (offset + 7 + 1);
        const top = baseline - mm.ascent;
        // Прямоугольник маркера привязывается к целым пикселям (как PixelSnappedIntRect)
        out.push({ kind: type, x: Math.round(markerX + 1), y: Math.round(top + Math.floor(3 * (ascent - offset) / 2)), size: bw, color, clip: null });
      } else {
        // Номер пункта по правилам счётчика list-item
        const list = li.parentElement;
        let n;
        const items = Array.from(list ? list.children : []).filter(c => c.tagName === 'LI');
        const reversed = list && list.hasAttribute && list.hasAttribute('reversed');
        let start = list && list.tagName === 'OL' ? (list.hasAttribute('start') ? parseInt(list.getAttribute('start'), 10) : (reversed ? items.length : 1)) : 1;
        let v = start;
        for (const c of items) {
          if (c.hasAttribute('value')) v = parseInt(c.getAttribute('value'), 10);
          if (c === li) { n = v; break; }
          v += reversed ? -1 : 1;
        }
        const text = counterText(type, n) + '.';
        const width = metrics.textWidth(style.cssFont, text + ' ', 'font-variant-numeric:tabular-nums');
        out.push({ kind: 'text', text, x: contentLeft - width, baseline, style, clip: null });
      }
    });
    return out;
  }

  // ---------- Флажки задач (как их рисует Chromium) ----------
  function collectCheckboxes(win, root) {
    const out = [];
    root.querySelectorAll('input[type="checkbox"]').forEach(inp => {
      const cs = win.getComputedStyle(inp);
      if (cs.display === 'none' || cs.visibility !== 'visible' || cs.appearance === 'none') return;
      const r = inp.getBoundingClientRect();
      if (!r.width) return;
      out.push({ x: r.left + win.scrollX, y: r.top + win.scrollY, w: r.width, h: r.height, checked: inp.checked, disabled: inp.disabled, accent: parseColor(cs.accentColor === 'auto' ? 'rgb(0, 117, 255)' : cs.accentColor) });
    });
    return out;
  }

  // ---------- Ссылки ----------
  function collectLinks(win, root) {
    const out = [];
    root.querySelectorAll('a[href]').forEach(a => {
      const href = a.getAttribute('href') || '';
      let url = null, dest = null;
      if (href.startsWith('#')) {
        const id = decodeURIComponent(href.slice(1));
        const t = id && a.ownerDocument.getElementById(id);
        if (t) dest = t.getBoundingClientRect().top + win.scrollY;
      } else if (/^(https?:|mailto:|tel:|ftp:)/i.test(href)) url = a.href;
      if (url === null && dest === null) return;
      for (const r of a.getClientRects()) {
        if (r.width > 0 && r.height > 0) out.push({ x: r.left + win.scrollX, y: r.top + win.scrollY, w: r.width, h: r.height, url, dest });
      }
    });
    return out;
  }

  // ---------- Загрузка и регистрация шрифтов в jsPDF ----------
  function makeFontRegistry(pdf) {
    const loaded = new Map(); // faceKey → {name, cmap}
    const failed = new Set();
    let seq = 0;
    return {
      has(f) { return loaded.has(faceKey(f)); },
      get(f) { return loaded.get(faceKey(f)); },
      isFailed(f) { return failed.has(faceKey(f)); },
      async load(list) {
        const todo = [];
        const seen = new Set();
        list.forEach(f => {
          const k = faceKey(f);
          if (loaded.has(k) || failed.has(k) || seen.has(k)) return;
          seen.add(k);
          todo.push(f);
        });
        await Promise.all(todo.map(async f => {
          const k = faceKey(f);
          try {
            let bytes = null, lastErr = null;
            for (const url of FAMILIES[f.fam].src(f.w, f.italic, f.opsz)) {
              try { bytes = await fetchBytes(url); break; } catch (e) { lastErr = e; }
            }
            if (!bytes) throw lastErr || new Error('font');
            const name = 'zf' + (++seq);
            const file = name + '.ttf';
            pdf.addFileToVFS(file, bytesToBinary(bytes));
            pdf.addFont(file, name, 'normal', 'normal', 'Identity-H');
            const font = pdf.internal.getFont(name, 'normal');
            const cmap = font && font.metadata && font.metadata.cmap && font.metadata.cmap.unicode && font.metadata.cmap.unicode.codeMap;
            if (!cmap) throw new Error('No cmap');
            const md = font.metadata;
            const upm = (md.head && md.head.unitsPerEm) || 1000;
            const metrics = {
              strikePos: md.os2 && md.os2.yStrikeoutPosition ? md.os2.yStrikeoutPosition / upm : null,
              strikeSize: md.os2 && md.os2.yStrikeoutSize ? md.os2.yStrikeoutSize / upm : null,
              ulPos: md.post && md.post.underlinePosition ? md.post.underlinePosition / upm : null,
              ulSize: md.post && md.post.underlineThickness ? md.post.underlineThickness / upm : null
            };
            loaded.set(k, { name, cmap, face: f, metrics });
          } catch (e) {
            console.warn('[pdf] font load failed', f, e);
            failed.add(k);
          }
        }));
      }
    };
  }

  // Язык для иероглифов — как LayoutLocale::LocaleForHan в Chromium: язык документа,
  // затем языки браузера; если ни один не китайский/японский/корейский — упрощённый китайский
  function hanLocale(lang) {
    const list = [lang].concat(Array.from(navigator.languages || [navigator.language || '']));
    for (const l of list) {
      if (/^ja/i.test(l)) return 'ja';
      if (/^ko/i.test(l)) return 'ko';
      if (/^zh-(tw|hk|mo)|^zh-hant/i.test(l)) return 'tc';
      if (/^zh/i.test(l)) return 'sc';
    }
    return 'sc';
  }

  // Порядок резервных шрифтов для символа (как системный подбор браузера)
  function fallbackChain(cp, lang) {
    if (isHangul(cp)) return ['noto sans kr', 'noto sans jp', 'noto sans sc'];
    if (isCJK(cp)) {
      if (isKana(cp)) return ['noto sans jp', 'noto sans sc', 'noto sans tc', 'noto sans kr'];
      const h = hanLocale(lang);
      if (h === 'tc') return ['noto sans tc', 'noto sans sc', 'noto sans jp', 'noto sans kr'];
      if (h === 'sc') return ['noto sans sc', 'noto sans tc', 'noto sans jp', 'noto sans kr'];
      if (h === 'ko') return ['noto sans kr', 'noto sans jp', 'noto sans sc', 'noto sans tc'];
      return ['noto sans jp', 'noto sans sc', 'noto sans tc', 'noto sans kr'];
    }
    return ['google sans', 'noto sans', 'noto sans math', 'noto sans symbols 2', 'noto sans jp'];
  }

  function familyCandidates(style) {
    const out = [];
    style.families.forEach(f => {
      if (FAMILIES[f]) out.push(f);
      else if (GENERIC[f]) out.push(GENERIC[f]);
    });
    return out;
  }

  async function assignFonts(registry, runs, extraItems, lang) {
    // Этап 1: основные шрифты из font-family
    const want = [];
    const all = runs.concat(extraItems);
    all.forEach(run => {
      const fams = familyCandidates(run.style);
      run._cands = fams.map(f => matchFace(f, run.style.weight, run.style.italic, run.style.sizePx)).filter(Boolean);
      run._cands.forEach(f => want.push(f));
    });
    await registry.load(want);
    // Этап 2: символы, которых нет в основных шрифтах → резервная цепочка.
    // Шрифты цепочки подгружаются по одному звену: следующий — только для ещё не покрытых символов
    const cover = (f, cp) => {
      const e = registry.get(f);
      return !!(e && e.cmap[cp]);
    };
    for (let depth = 0; depth < 6; depth++) {
      const want2 = new Map();
      all.forEach(run => {
        for (const ch of run.text) {
          const cp = ch.codePointAt(0);
          if (cp > 0xFFFF || isSpace(ch) || needsShaping(cp)) continue;
          if (run._cands.some(f => cover(f, cp))) continue;
          const chain = fallbackChain(cp, lang).map(fam => matchFace(fam, run.style.weight, run.style.italic, run.style.sizePx)).filter(Boolean);
          if (chain.some(f => cover(f, cp))) continue;
          const next = chain.find(f => !registry.has(f) && !registry.isFailed(f));
          if (next) want2.set(faceKey(next), next);
        }
      });
      if (!want2.size) break;
      await registry.load(Array.from(want2.values()));
    }
    // Этап 3: разбиение прогонов по шрифтам
    const pieces = [];
    all.forEach(run => {
      const chars = Array.from(run.text);
      let cur = null;
      let offset = 0;
      const push = () => { if (cur) pieces.push(cur); cur = null; };
      for (const ch of chars) {
        const cp = ch.codePointAt(0);
        let face = null, raster = false;
        const f0 = run.style.families[0];
        if (isSpace(ch)) {
          face = cur ? cur.face : null;
          raster = !!(cur && cur.raster);
          if (!face && !raster) { offset += ch.length; continue; }
        } else if (cp > 0xFFFF || needsShaping(cp) || (f0 && !FAMILIES[f0] && !GENERIC[f0])) {
          // Веб-шрифт, которого нет среди встраиваемых (например, шрифты TikZ), — рисуем как в браузере
          raster = true;
        } else {
          face = run._cands.find(f => cover(f, cp)) || null;
          if (!face) {
            for (const fam of fallbackChain(cp, lang)) {
              const f = matchFace(fam, run.style.weight, run.style.italic, run.style.sizePx);
              if (f && cover(f, cp)) { face = f; break; }
            }
          }
          if (!face) raster = true;
        }
        const key = raster ? 'raster' : faceKey(face);
        if (!cur || cur.key !== key) {
          push();
          cur = { key, run, face, raster, text: '', start: offset };
        }
        cur.text += ch;
        offset += ch.length;
      }
      push();
    });
    // Для растровых кусков — невидимый текст поверх (поиск и копирование), если есть шрифт с этими символами
    const invisPool = ['google sans', 'noto sans', 'noto sans arabic', 'noto sans hebrew', 'noto sans jp', 'noto sans sc', 'noto sans kr', 'noto sans math', 'noto sans symbols 2'];
    // Для арабского письма и иврита подгружаем шрифт Noto только ради невидимого слоя
    const extra = new Map();
    pieces.forEach(p => {
      if (!p.raster) return;
      for (const ch of p.text) {
        const cp = ch.codePointAt(0);
        const fam = (cp >= 0x0600 && cp <= 0x08FF) || (cp >= 0xFB50 && cp <= 0xFDFF) || (cp >= 0xFE70 && cp <= 0xFEFF) ? 'noto sans arabic'
          : (cp >= 0x0590 && cp <= 0x05FF) || (cp >= 0xFB1D && cp <= 0xFB4F) ? 'noto sans hebrew' : null;
        if (fam) { const f = matchFace(fam, 400, false, 16); extra.set(faceKey(f), f); }
      }
    });
    if (extra.size) await registry.load(Array.from(extra.values()));
    pieces.forEach(p => {
      if (!p.raster) return;
      const cps = Array.from(p.text).filter(ch => !isSpace(ch)).map(ch => ch.codePointAt(0));
      if (cps.some(cp => cp > 0xFFFF)) return;
      const cands = p.run._cands.concat(invisPool.map(f => matchFace(f, 400, false, p.run.style.sizePx)));
      p.invisFace = cands.find(f => f && cps.every(cp => cover(f, cp))) || null;
    });
    return pieces;
  }

  // ---------- Вывод текста в PDF ----------
  function pageOf(y) {
    return Math.max(0, Math.floor(y / PAGE.contentH + 1e-6));
  }
  function toPt(x, y, page) {
    return { x: PAGE.marginPt + x * PAGE.k, y: PAGE.marginPt + (y - page * PAGE.contentH) * PAGE.k };
  }
  function ensurePages(pdf, n) {
    while (pdf.internal.getNumberOfPages() < n) pdf.addPage();
  }
  function withClip(pdf, clip, page, fn) {
    pdf.saveGraphicsState();
    const pt = toPt(0, 0, page);
    const top = page * PAGE.contentH, bottom = top + PAGE.clipH;
    let l = 0, t = top, r = PAGE.clipW, b = bottom;
    if (clip) { l = Math.max(l, clip.l); t = Math.max(t, clip.t); r = Math.min(r, clip.r); b = Math.min(b, clip.b); }
    if (r > l && b > t) {
      pdf.rect(pt.x + l * PAGE.k, PAGE.marginPt + (t - top) * PAGE.k, (r - l) * PAGE.k, (b - t) * PAGE.k, null);
      pdf.clip();
      pdf.discardPath();
      fn();
    }
    pdf.restoreGraphicsState();
  }
  // Прозрачность: GState регистрируется один раз, а оператор gs пишется напрямую.
  // (setGState в jsPDF пропускает оператор, если считает это состояние уже активным,
  // хотя после Q или на другой странице оно уже сброшено)
  function gsWrite(pdf, fa, sa) {
    if (!pdf.__zgs) pdf.__zgs = new Map();
    const key = fa.toFixed(3) + '/' + sa.toFixed(3);
    let id = pdf.__zgs.get(key);
    if (!id) {
      const gs = new pdf.GState({ opacity: +fa.toFixed(3), 'stroke-opacity': +sa.toFixed(3) });
      pdf.addGState('zgs' + key, gs);
      id = gs.id;
      pdf.__zgs.set(key, id);
    }
    if (id) pdf.internal.write('/' + id + ' gs');
  }
  function setOpacity(pdf, a) {
    if (a < 0.999) gsWrite(pdf, a, a);
  }

  // Синтетический полужирный — как в Skia: обводка толщиной size × (1/24 … 1/32)
  function fakeBoldWidth(size) {
    const t = Math.min(1, Math.max(0, (size - 9) / (36 - 9)));
    return size * (1 / 24 + (1 / 32 - 1 / 24) * t);
  }

  function drawPieces(pdf, win, doc, pieces, registry) {
    const range = doc.createRange();
    const rasterCanvas = doc.createElement('canvas');
    pieces.forEach(p => {
      const run = p.run;
      const st = run.style;
      const visText = p.text.replace(/[\s 　]+$/, '');
      if (!visText) return;
      // Точная позиция и ширина куска — из раскладки браузера (Range)
      let left = run.left, width = run.right - run.left;
      if (run.node && !run.isMarker && (p.start > 0 || visText.length < run.text.replace(/[\s 　]+$/, '').length)) {
        const base = run.nodeStart || 0;
        try {
          range.setStart(run.node, base + p.start);
          range.setEnd(run.node, base + p.start + visText.length);
          const rs = Array.from(range.getClientRects()).filter(r => r.width > 0);
          if (rs.length) {
            left = Math.min(...rs.map(r => r.left)) + win.scrollX;
            width = Math.max(...rs.map(r => r.right)) + win.scrollX - left;
          }
        } catch (e) { /* остаётся оценка по прогону */ }
      }
      // При печати Chromium ставит базовую линию обычного (не масштабированного) текста на целый пиксель
      let baseline = run.baselineY !== undefined ? run.baselineY : run.top + run.ascent;
      if (!run.svgText && (st.scale || 1) === 1 && !st.angle) baseline = Math.round(baseline);
      const page = pageOf(run.top + run.height / 2);
      ensurePages(pdf, page + 1);
      pdf.setPage(page + 1);
      const sizePx = st.sizePx * (st.scale || 1);
      const pt = toPt(left, baseline, page);
      const c = st.color;
      let invisible = false;
      if (p.raster) {
        if (!p.invisFace) {
          // Символов нет ни в одном шрифте (эмодзи и т. п.): изображение помещается в помеченный
          // фрагмент /ActualText с исходным текстом — его используют копирование и поиск
          let hex = 'FEFF';
          for (let i = 0; i < visText.length; i++) hex += visText.charCodeAt(i).toString(16).toUpperCase().padStart(4, '0');
          pdf.internal.write('/Span <</ActualText <' + hex + '>>> BDC');
          drawRasterText(pdf, doc, rasterCanvas, visText, st, left, baseline, width, page, run.clip);
          const sp = (p.run._cands || []).map(f => registry.get(f)).find(e => e && e.cmap[32]);
          if (sp) {
            // q/Q: масштаб (Tz) и режим вывода входят в графическое состояние и не должны «утечь»
            pdf.saveGraphicsState();
            pdf.setFont(sp.name, 'normal');
            pdf.setFontSize(sizePx * PAGE.k);
            const sw = pdf.getStringUnitWidth(' ') * sizePx;
            const o = { baseline: 'alphabetic', renderingMode: 'invisible' };
            if (sw > 0 && width > 0) o.horizontalScale = width / sw;
            pdf.text(' ', pt.x, pt.y, o);
            pdf.restoreGraphicsState();
          }
          pdf.internal.write('EMC');
          return;
        }
        drawRasterText(pdf, doc, rasterCanvas, visText, st, left, baseline, width, page, run.clip);
        invisible = true;
      }
      const face = invisible ? p.invisFace : p.face;
      const entry = face && registry.get(face);
      if (!entry) return;
      withClip(pdf, run.clip, page, () => {
        setOpacity(pdf, st.opacity);
        pdf.setFont(entry.name, 'normal');
        pdf.setFontSize(sizePx * PAGE.k);
        pdf.setTextColor(c.r, c.g, c.b);
        const natural = pdf.getStringUnitWidth(visText) * sizePx;
        // Режим вывода задаётся всегда: он входит в графическое состояние и иначе
        // «перетекал» бы от синтетического полужирного к следующему тексту
        const opts = { baseline: 'alphabetic', renderingMode: 'fill' };
        if (CJK_OPEN.test(visText) || CJK_CLOSE.test(visText)) {
          // Скобки и знаки препинания CJK, сжатые браузером (text-spacing-trim): глиф не сужаем,
          // убирается только пустая половина — у открывающих слева, у закрывающих справа
          if (CJK_OPEN.test(visText) && natural > width + 0.5) pt.x -= (natural - width) * PAGE.k;
        } else if (natural > 0 && width > 0) {
          const hs = width / natural;
          if (Math.abs(hs - 1) > 0.002 && hs > 0.3 && hs < 3) opts.horizontalScale = hs;
        }
        if (invisible) {
          opts.renderingMode = 'invisible';
        } else if (face.synthBold) {
          opts.renderingMode = 'fillThenStroke';
          pdf.setDrawColor(c.r, c.g, c.b);
          pdf.setLineWidth(fakeBoldWidth(sizePx) * PAGE.k);
          pdf.setLineJoin('miter');
        }
        let angle = st.angle ? -st.angle * 180 / Math.PI : 0;
        if ((face.synthItalic && !invisible) || angle) {
          const a = angle * Math.PI / 180;
          const ca = Math.cos(a), sa = Math.sin(a);
          const sk = face.synthItalic && !invisible ? 0.25 : 0;
          // Поворот × наклон (наклон как у синтетического курсива Skia)
          const M = [ca, sa, -sa + ca * sk, ca + sa * sk];
          opts.angle = new pdf.Matrix(M[0], M[1], M[2], M[3], 0, 0);
          // jsPDF применяет матрицу и к точке привязки — подставляем прообраз нужной точки
          const X = pt.x, Y = PAGE.hPt - pt.y;
          const det = M[0] * M[3] - M[2] * M[1];
          const px = (M[3] * X - M[2] * Y) / det, py = (-M[1] * X + M[0] * Y) / det;
          pt.x = px;
          pt.y = PAGE.hPt - py;
        }
        if (invisible && RTL_RE.test(p.text)) {
          // Невидимый слой для письма справа налево: символы в зрительном порядке (как у Chromium),
          // программы просмотра сами восстанавливают логический. Пишем сами — jsPDF заменил бы
          // арабские буквы контекстными формами
          const vis = Array.from(p.text.replace(/\s+$/, '')).reverse().join('');
          writeRawText(pdf, entry, vis, pt.x, pt.y, sizePx * PAGE.k, opts.horizontalScale);
        } else pdf.text(p.text, pt.x, pt.y, opts);
      });
    });
  }

  const RTL_RE = /[֐-ࣿיִ-﷿ﹰ-﻿]/;
  // Невидимый текст (режим 3 Tr) напрямую в поток страницы; кодирование глифов и ToUnicode — средствами jsPDF
  function writeRawText(pdf, entry, text, x, y, sizePt, hs) {
    const font = pdf.internal.getFont(entry.name, 'normal');
    const hex = pdf.pdfEscape16(text, font);
    let s = 'BT\n/' + font.id + ' ' + sizePt.toFixed(3) + ' Tf\n3 Tr\n';
    if (hs) s += (hs * 100).toFixed(3) + ' Tz\n';
    s += x.toFixed(3) + ' ' + (PAGE.hPt - y).toFixed(3) + ' Td\n<' + hex + '> Tj\nET';
    pdf.internal.write(s);
  }

  // Фрагменты без подходящего встраиваемого шрифта (эмодзи, сложные письменности) — растр как в браузере
  function drawRasterText(pdf, doc, canvas, text, st, left, baseline, width, page, clip) {
    const SCALE = 4;
    const ctx = canvas.getContext('2d');
    const size = st.sizePx * (st.scale || 1);
    const font = `${st.fontStyle} ${st.weight} ${size}px ${st.familyCss}`;
    ctx.font = font;
    const m = ctx.measureText(text);
    const asc = Math.ceil(Math.max(m.actualBoundingBoxAscent || size, m.fontBoundingBoxAscent || 0)) + 2;
    const desc = Math.ceil(Math.max(m.actualBoundingBoxDescent || 0, m.fontBoundingBoxDescent || 0)) + 2;
    const padL = Math.ceil(Math.max(0, m.actualBoundingBoxLeft || 0)) + 2;
    const w = Math.ceil(Math.max(m.width, (m.actualBoundingBoxRight || 0)) ) + padL + 2;
    if (w <= 0) return;
    canvas.width = w * SCALE;
    canvas.height = (asc + desc) * SCALE;
    ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    ctx.clearRect(0, 0, w, asc + desc);
    ctx.font = font;
    ctx.textBaseline = 'alphabetic';
    const c = st.color;
    ctx.fillStyle = `rgb(${c.r},${c.g},${c.b})`;
    ctx.fillText(text, padL, asc);
    const data = canvas.toDataURL('image/png');
    const pt = toPt(left - padL, baseline - asc, page);
    withClip(pdf, clip, page, () => {
      setOpacity(pdf, st.opacity);
      pdf.addImage(data, 'PNG', pt.x, pt.y, w * PAGE.k, (asc + desc) * PAGE.k, undefined, 'FAST');
    });
  }

  // Линии оформления — по метрикам шрифта (OS/2 и post), с округлением до пикселей, как в Blink
  function drawDecorations(pdf, decos, registry) {
    decos.forEach(o => {
      const d = o.d;
      const st = o.style;
      const size = st.sizePx * (st.scale || 1);
      const scaled = (st.scale || 1) !== 1;
      let baseline = o.top + o.ascent;
      if (!scaled) baseline = Math.round(baseline);
      const fam = familyCandidates(st)[0];
      const face = fam && matchFace(fam, st.weight, st.italic, st.sizePx);
      const entry = face && registry.get(face);
      const m = (entry && entry.metrics) || {};
      const snap = v => (scaled ? v : Math.round(v));
      let th, y;
      if (d.line === 'line-through') {
        th = /px$/.test(d.thickness) ? parseFloat(d.thickness) : Math.max(1, snap((m.strikeSize || 0.05) * size));
        y = baseline - snap((m.strikePos || 0.3) * size) - th;
      } else if (d.line === 'underline') {
        th = /px$/.test(d.thickness) ? parseFloat(d.thickness) : Math.max(1, snap((m.ulSize || 0.05) * size));
        y = baseline + Math.max(1, snap(-(m.ulPos || -0.1) * size));
      } else if (d.line === 'overline') {
        th = /px$/.test(d.thickness) ? parseFloat(d.thickness) : Math.max(1, snap((m.ulSize || 0.05) * size));
        y = o.top;
      } else return;
      const page = pageOf(o.top + o.height / 2);
      ensurePages(pdf, page + 1);
      pdf.setPage(page + 1);
      const c = parseColor(d.color);
      const pt = toPt(o.left, y, page);
      withClip(pdf, o.clip, page, () => {
        setOpacity(pdf, c.a * st.opacity / Math.max(0.001, st.color.a));
        pdf.setFillColor(c.r, c.g, c.b);
        pdf.rect(pt.x, pt.y, o.width * PAGE.k, th * PAGE.k, 'F');
      });
    });
  }

  function drawMarkers(pdf, markers) {
    markers.forEach(m => {
      if (m.kind === 'text') return;
      const page = pageOf(m.y + m.size / 2);
      ensurePages(pdf, page + 1);
      pdf.setPage(page + 1);
      const pt = toPt(m.x, m.y, page);
      const s = m.size * PAGE.k;
      pdf.saveGraphicsState();
      setOpacity(pdf, m.color.a);
      pdf.setFillColor(m.color.r, m.color.g, m.color.b);
      pdf.setDrawColor(m.color.r, m.color.g, m.color.b);
      if (m.kind === 'disc') pdf.ellipse(pt.x + s / 2, pt.y + s / 2, s / 2, s / 2, 'F');
      else if (m.kind === 'circle') {
        pdf.setLineWidth(PAGE.k);
        // Как в Chromium: обводка 1 px по самому прямоугольнику маркера (без отступа на половину линии)
        pdf.ellipse(pt.x + s / 2, pt.y + s / 2, s / 2, s / 2, 'S');
      } else pdf.rect(pt.x, pt.y, s, s, 'F');
      pdf.restoreGraphicsState();
    });
  }

  // Флажок — как его рисует Chromium при печати (тема Fluent), измерено по его PDF.
  // Координаты внутри поля флажка в px, рамка поля привязана к целым пикселям
  function drawCheckboxes(pdf, boxes) {
    const k = PAGE.k;
    boxes.forEach(b => {
      const x0 = Math.round(b.x), y0 = Math.round(b.y);
      const w = Math.round(b.x + b.w) - x0, h = Math.round(b.y + b.h) - y0;
      const page = pageOf(y0 + h / 2);
      ensurePages(pdf, page + 1);
      pdf.setPage(page + 1);
      const P = (x, y) => toPt(x0 + x, y0 + y, page);
      const rrect = (inset, color, alpha, mode, lw) => {
        const p = P(inset, inset);
        pdf.saveGraphicsState();
        if (alpha < 0.999) gsWrite(pdf, alpha, alpha);
        if (mode === 'S') {
          pdf.setDrawColor(color[0], color[1], color[2]);
          pdf.setLineWidth(lw * k);
        } else pdf.setFillColor(color[0], color[1], color[2]);
        const r = 2 * k;
        pdf.internal.write(roundedPath(pdf, p.x, p.y, (w - inset * 2) * k, (h - inset * 2) * k, [r, r, r, r]) + (mode === 'S' ? 'S' : 'f'));
        pdf.restoreGraphicsState();
      };
      const check = (color, alpha) => {
        const a = P(w * 0.2, h * 0.5), m = P(w * 0.4, h * 0.7), e = P(w * 0.8, h * 0.2);
        const Hp = PAGE.hPt;
        pdf.saveGraphicsState();
        if (alpha < 0.999) gsWrite(pdf, alpha, alpha);
        pdf.setDrawColor(color[0], color[1], color[2]);
        pdf.setLineWidth(w * 0.16 * k);
        pdf.internal.write('0 J 0 j ' + a.x.toFixed(3) + ' ' + (Hp - a.y).toFixed(3) + ' m ' + m.x.toFixed(3) + ' ' + (Hp - m.y).toFixed(3) + ' l ' +
          e.x.toFixed(3) + ' ' + (Hp - e.y).toFixed(3) + ' l S');
        pdf.restoreGraphicsState();
      };
      const acc = [b.accent.r, b.accent.g, b.accent.b];
      if (b.disabled) {
        rrect(0.2, [169, 169, 169], 0.2, 'F');
        rrect(0.2, [255, 255, 255], 0.6, 'F');
        if (b.checked) {
          rrect(0, [118, 118, 118], 0.302, 'F');
          check([255, 255, 255], 0.6);
        } else rrect(0.5, [118, 118, 118], 0.302, 'S', 1);
      } else if (b.checked) {
        rrect(0, acc, 1, 'F');
        check([255, 255, 255], 1);
      } else {
        rrect(0.2, [255, 255, 255], 1, 'F');
        rrect(0.5, [118, 118, 118], 1, 'S', 1);
      }
    });
  }

  function drawLinks(pdf, links) {
    links.forEach(l => {
      const page = pageOf(l.y + l.h / 2);
      if (page + 1 > pdf.internal.getNumberOfPages()) return;
      pdf.setPage(page + 1);
      const pt = toPt(l.x, l.y, page);
      if (l.url) pdf.link(pt.x, pt.y, l.w * PAGE.k, l.h * PAGE.k, { url: l.url });
      else {
        const dp = pageOf(l.dest);
        const top = PAGE.hPt - (PAGE.marginPt + (l.dest - dp * PAGE.contentH) * PAGE.k);
        pdf.link(pt.x, pt.y, l.w * PAGE.k, l.h * PAGE.k, { pageNumber: dp + 1, top });
      }
    });
  }

  // ---------- Доработки context2d jsPDF для html2canvas ----------
  // Холст-обёртка для html2canvas. Его размеры html2canvas использует для маски тени
  // (прямоугольник «весь холст» минус рамка элемента). У холста jsPDF размер 150×300, и маска
  // получалась неверной (тень заливала сам блок). Здесь размеры — метки, которые при построении
  // пути заменяются на границы содержимого документа
  const SENTINEL = 987654;
  function makeH2cCanvas(pdf, doc, docHeight, cloneInfo) {
    const ctx = pdf.context2d;
    const origMoveTo = ctx.moveTo, origLineTo = ctx.lineTo;
    // Маска: moveTo(0,0) → lineTo(S,0) → lineTo(S,S) → lineTo(0,S) → lineTo(0,0), затем контур рамки.
    // Углы переносим на прямоугольник контейнера (в координатах копии документа), порядок обхода сохраняется
    let maskLeft = 0;
    let lastMoveZero = false;
    const L = () => cloneInfo.left || 0, T = () => cloneInfo.top || 0;
    ctx.moveTo = function (x, y) {
      lastMoveZero = x === 0 && y === 0;
      maskLeft = 0;
      return origMoveTo.call(this, x, y);
    };
    ctx.lineTo = function (x, y) {
      if (lastMoveZero && x === SENTINEL && y === 0) {
        // Первая точка маски уже добавлена как (0,0): заменяем её на левый верхний угол
        this.path.pop();
        origMoveTo.call(this, L(), T());
        maskLeft = 4;
        lastMoveZero = false;
      }
      if (maskLeft > 0) {
        maskLeft--;
        const mx = x === SENTINEL ? L() + PAGE.contentW + 2000 : L() - 2000;
        const my = y === SENTINEL ? T() + docHeight : T();
        return origLineTo.call(this, mx, my);
      }
      lastMoveZero = false;
      return origLineTo.call(this, x, y);
    };
    return { width: SENTINEL, height: SENTINEL, style: {}, ownerDocument: doc, getContext: () => ctx };
  }

  function patchContext(pdf, win, images) {
    const ctx = pdf.context2d;
    // Изображения всегда сжимаем; одинаковые данные встраиваются один раз
    const origAddImage = pdf.addImage;
    const aliases = new Map();
    let aliasSeq = 0;
    pdf.addImage = function (data, format, x, y, w, h, alias, compression, rotation) {
      if (!alias && (typeof data === 'string' || data instanceof win.Uint8Array)) {
        alias = aliases.get(data);
        if (!alias) { alias = 'zimg' + (++aliasSeq); aliases.set(data, alias); }
      }
      return origAddImage.call(this, data, format, x, y, w, h, alias, compression && compression !== 'NONE' ? compression : 'FAST', rotation);
    };
    const origDrawImage = ctx.drawImage;
    const origFill = ctx.fill;
    const origFillRect = ctx.fillRect;
    const origSave = ctx.save, origRestore = ctx.restore;
    // Параметры тени не входят в состояние context2d jsPDF: сохраняем их сами,
    // иначе после первой box-shadow все последующие заливки рисовались бы как тень
    const shadowStack = [];
    const SHADOW = ['shadowColor', 'shadowBlur', 'shadowOffsetX', 'shadowOffsetY'];
    ctx.save = function () {
      shadowStack.push(SHADOW.map(k => this[k]));
      return origSave.apply(this, arguments);
    };
    ctx.restore = function () {
      const s = shadowStack.pop();
      if (s) SHADOW.forEach((k, i) => { this[k] = s[i]; });
      return origRestore.apply(this, arguments);
    };
    let lastWasText = false;
    const patterns = new Map();
    let patSeq = 0;
    const canvas = win.document.createElement('canvas');

    // Текст рисует отдельный слой, поэтому здесь его пропускаем (вместе с линиями оформления)
    ctx.fillText = function () { lastWasText = true; };
    ctx.strokeText = function () { lastWasText = true; };
    ctx.fillRect = function (x, y, w, h) {
      if (lastWasText && h === 1) return;
      lastWasText = false;
      return origFillRect.apply(this, arguments);
    };

    // Узоры: градиенты фона и фоновые изображения
    ctx.createPattern = function (source) {
      const id = ++patSeq;
      const sentinel = `rgba(${id & 255},${(id >> 8) & 255},${(id >> 16) & 255},0)`;
      patterns.set(sentinel, source);
      return { isCanvasGradient: true, getColor: () => sentinel, addColorStop() {} };
    };

    const toPng = source => {
      // Градиент перерисовывается заново: вдоль оси — с запасом разрешения (резкие границы цветов),
      // поперёк горизонтального/вертикального градиента достаточно одного пикселя
      const g = source.__zgrad;
      const c = win.document.createElement('canvas');
      const w = source.width, h = source.height;
      if (g) {
        const horiz = Math.abs(g.y1 - g.y0) < 1e-6, vert = Math.abs(g.x1 - g.x0) < 1e-6;
        const sx = vert ? 1 / Math.max(1, w) : (horiz ? 4 : 1.5);
        const sy = horiz ? 1 / Math.max(1, h) : (vert ? 4 : 1.5);
        c.width = Math.max(1, Math.round(w * sx));
        c.height = Math.max(1, Math.round(h * sy));
        const cx = c.getContext('2d');
        cx.setTransform(c.width / w, 0, 0, c.height / h, 0, 0);
        const grad = cx.createLinearGradient(g.x0, g.y0, g.x1, g.y1);
        g.stops.forEach(s => grad.addColorStop(s[0], s[1]));
        cx.fillStyle = grad;
        cx.fillRect(0, 0, w, h);
      } else {
        c.width = Math.max(1, w);
        c.height = Math.max(1, h);
        c.getContext('2d').drawImage(source, 0, 0);
      }
      return { data: c.toDataURL('image/png'), pw: c.width, ph: c.height, w, h };
    };

    // Прозрачность (rgba и globalAlpha) context2d jsPDF не поддерживает: задаём GState
    // на всех страницах внутри пары q/Q — так же, как сам context2d выводит save/restore
    function withAlpha(fillA, strokeA, fn) {
      const fa = Math.max(0, Math.min(1, fillA)), sa = Math.max(0, Math.min(1, strokeA));
      if (fa >= 0.999 && sa >= 0.999) return fn();
      origSave.call(this, false);
      const cur = pdf.internal.getCurrentPageInfo().pageNumber;
      for (let i = 1; i <= pdf.internal.getNumberOfPages(); i++) { pdf.setPage(i); gsWrite(pdf, fa, sa); }
      pdf.setPage(cur);
      try { return fn(); } finally { origRestore.call(this, false); }
    }

    ctx.fill = function () {
      lastWasText = false;
      const ga = this.ctx.globalAlpha === undefined ? 1 : this.ctx.globalAlpha;
      const style = this.ctx.fillStyle;
      if (typeof style === 'string' && patterns.has(style)) {
        const src = patterns.get(style);
        const img = toPng(src);
        this.save();
        this.clip();
        withAlpha.call(this, ga, ga, () => origDrawImage.call(this, img.data, 0, 0, img.pw, img.ph, 0, 0, img.w, img.h));
        this.restore();
        return;
      }
      const sc = this.shadowColor;
      if (sc && parseColor(sc).a > 0 && (this.shadowBlur > 0 || this.shadowOffsetX || this.shadowOffsetY)) {
        withAlpha.call(this, ga, ga, () => drawShadow.call(this));
        return;
      }
      const fa = (this.ctx.fillOpacity === undefined ? 1 : this.ctx.fillOpacity) * ga;
      return withAlpha.call(this, fa, fa, () => origFill.apply(this, arguments));
    };
    const origStroke = ctx.stroke;
    ctx.stroke = function () {
      lastWasText = false;
      const ga = this.ctx.globalAlpha === undefined ? 1 : this.ctx.globalAlpha;
      const sa = (this.ctx.strokeOpacity === undefined ? 1 : this.ctx.strokeOpacity) * ga;
      return withAlpha.call(this, sa, sa, () => origStroke.apply(this, arguments));
    };

    // Тень box-shadow: html2canvas сдвигает фигуру за пределы холста и рисует только тень
    function drawShadow() {
      const path = this.path.filter(p => p.x !== undefined);
      if (!path.length) return;
      const k = this.ctx.transform.scaleX || 1;
      let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
      path.forEach(p => {
        [[p.x, p.y], [p.x1, p.y1], [p.x2, p.y2]].forEach(([x, y]) => {
          if (x === undefined) return;
          minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        });
      });
      const dx = (this.shadowOffsetX || 0) * k, dy = (this.shadowOffsetY || 0) * k;
      const blur = (this.shadowBlur || 0) * k;
      const pad = blur * 1.5 + 2;
      // Размытая тень плавная — высокое разрешение ей не нужно
      const S = 1.5;
      const wPt = maxX - minX + pad * 2, hPt = maxY - minY + pad * 2;
      if (wPt <= 0 || hPt <= 0 || wPt * hPt * S * S > 4e7) return;
      canvas.width = Math.ceil(wPt * S);
      canvas.height = Math.ceil(hPt * S);
      const cx = canvas.getContext('2d');
      cx.setTransform(1, 0, 0, 1, 0, 0);
      cx.clearRect(0, 0, canvas.width, canvas.height);
      const FAR = canvas.width + 1000;
      cx.shadowColor = this.shadowColor;
      cx.shadowBlur = blur * S;
      cx.shadowOffsetX = FAR;
      cx.shadowOffsetY = 0;
      cx.setTransform(S, 0, 0, S, (-minX + pad) * S - FAR, (-minY + pad) * S);
      const buildPath = () => {
        cx.beginPath();
        path.forEach(p => {
          if (p.type === 'mt') cx.moveTo(p.x, p.y);
          else if (p.type === 'lt') cx.lineTo(p.x, p.y);
          else if (p.type === 'bct') cx.bezierCurveTo(p.x1, p.y1, p.x2, p.y2, p.x, p.y);
          else if (p.type === 'qct') cx.quadraticCurveTo(p.x1, p.y1, p.x, p.y);
          else if (p.type === 'close') cx.closePath();
        });
        cx.closePath();
      };
      buildPath();
      cx.fillStyle = '#000';
      cx.fill();
      // Внешняя тень не видна под самим элементом: вырезаем его рамку прямо из растра
      // (html2canvas сдвигает фигуру на MASK_OFFSET = 10000 px, а смещение тени включает этот сдвиг)
      const MASK = 10000 * k;
      if (dx > MASK / 2) {
        cx.shadowColor = 'rgba(0,0,0,0)';
        cx.shadowBlur = 0;
        cx.shadowOffsetX = 0;
        cx.globalCompositeOperation = 'destination-out';
        cx.setTransform(S, 0, 0, S, (-minX + pad + MASK - dx) * S, (-minY + pad - dy) * S);
        buildPath();
        cx.fill();
        cx.globalCompositeOperation = 'source-over';
      }
      const data = canvas.toDataURL('image/png');
      this.save();
      this.setTransform(1, 0, 0, 1, 0, 0);
      origDrawImage.call(this, data, 0, 0, canvas.width, canvas.height, minX - pad + dx, minY - pad + dy, wPt, hPt);
      this.restore();
    }

    // Изображения: исходные байты (без перекодирования в JPEG), SVG — растр высокого разрешения
    ctx.drawImage = function () {
      lastWasText = false;
      const ga = this.ctx.globalAlpha === undefined ? 1 : this.ctx.globalAlpha;
      const args = arguments;
      return withAlpha.call(this, ga, ga, () => drawImageInner.apply(this, args));
    };
    function drawImageInner(img, sx, sy, sw, sh, dx, dy, dw, dh) {
      if (dx === undefined) {
        if (sw === undefined) { dx = sx; dy = sy; dw = img.width; dh = img.height; }
        else { dx = sx; dy = sy; dw = sw; dh = sh; }
        sx = 0; sy = 0; sw = img.naturalWidth || img.width; sh = img.naturalHeight || img.height;
      }
      if (typeof img === 'string') return origDrawImage.call(this, img, sx, sy, sw, sh, dx, dy, dw, dh);
      const src = img && img.src;
      try {
        if (src && /^data:image\/svg\+xml/.test(src)) {
          const S = 3;
          const maxPx = 6000;
          let cw = Math.max(1, Math.round(dw * S)), ch = Math.max(1, Math.round(dh * S));
          const f = Math.min(1, maxPx / Math.max(cw, ch));
          cw = Math.max(1, Math.round(cw * f)); ch = Math.max(1, Math.round(ch * f));
          canvas.width = cw; canvas.height = ch;
          const cx = canvas.getContext('2d');
          cx.setTransform(1, 0, 0, 1, 0, 0);
          cx.clearRect(0, 0, cw, ch);
          cx.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);
          return origDrawImage.call(this, canvas.toDataURL('image/png'), 0, 0, cw, ch, dx, dy, dw, dh);
        }
        const known = src && images.get(src);
        if (known) {
          const fx = known.w / (img.naturalWidth || img.width || known.w);
          const fy = known.h / (img.naturalHeight || img.height || known.h);
          return origDrawImage.call(this, known.data, sx * fx, sy * fy, sw * fx, sh * fy, dx, dy, dw, dh);
        }
        const w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
        if (!w || !h) return;
        canvas.width = w; canvas.height = h;
        const cx = canvas.getContext('2d');
        cx.setTransform(1, 0, 0, 1, 0, 0);
        cx.clearRect(0, 0, w, h);
        cx.drawImage(img, 0, 0);
        return origDrawImage.call(this, canvas.toDataURL('image/png'), sx, sy, sw, sh, dx, dy, dw, dh);
      } catch (e) {
        console.warn('[pdf] image skipped', src, e);
      }
    }
  }

  // Запоминаем параметры градиентов, которые html2canvas рисует на временном холсте
  function hookGradients(win) {
    const proto = win.CanvasRenderingContext2D.prototype;
    const orig = proto.createLinearGradient;
    proto.createLinearGradient = function (x0, y0, x1, y1) {
      const g = orig.call(this, x0, y0, x1, y1);
      const rec = { x0, y0, x1, y1, stops: [] };
      const add = g.addColorStop.bind(g);
      g.addColorStop = (o, c) => { rec.stops.push([o, c]); add(o, c); };
      if (this.canvas) this.canvas.__zgrad = rec;
      return g;
    };
  }

  // Исходные байты изображений (JPEG/PNG встраиваются как есть)
  async function prefetchImages(doc) {
    const map = new Map();
    await Promise.all(Array.from(doc.images).map(async img => {
      const src = img.currentSrc || img.src;
      if (!src || map.has(src) || /^data:image\/svg/.test(src) || /\.svg(\?|#|$)/i.test(src)) return;
      try {
        const bytes = await fetchBytes(src);
        const isPng = bytes[0] === 0x89 && bytes[1] === 0x50;
        const isJpg = bytes[0] === 0xFF && bytes[1] === 0xD8;
        if (!isPng && !isJpg) return;
        map.set(src, { data: bytes, w: img.naturalWidth, h: img.naturalHeight });
        if (img.src !== src) map.set(img.src, map.get(src));
      } catch (e) { /* будет нарисовано через canvas */ }
    }));
    return map;
  }

  // Подготовка копии для html2canvas: скрываем всё, что рисует слой текста, и привязываем
  // прямоугольники элементов к целым пикселям — так Blink рисует фон и рамки при печати
  function makeOnClone(cloneInfo) {
    return function onClone(cloneDoc) {
      const st = cloneDoc.createElement('style');
      st.textContent = 'svg text,svg foreignObject{visibility:hidden!important}' +
        'input[type=checkbox]{visibility:hidden!important}' +
        '[data-zpdf-inline]{background:none!important;border-color:transparent!important;box-shadow:none!important}';
      cloneDoc.head.appendChild(st);
      // foreignObject делает холст «загрязнённым» при растеризации SVG (toDataURL запрещён),
      // а его содержимое и так рисует слой текста
      cloneDoc.querySelectorAll('svg foreignObject').forEach(n => n.remove());
      // SVG заменяется изображением из заранее подготовленной «чистой» копии: html2canvas переносит
      // в копию документа все вычисленные стили, и у элементов SVG свойства геометрии из CSS
      // (x, y, width, transform…) перекрывали бы атрибуты — фигуры исчезали бы
      cloneDoc.querySelectorAll('svg[data-zpdf-svg]').forEach(svg => {
        const url = cloneInfo.svgs && cloneInfo.svgs[svg.getAttribute('data-zpdf-svg')];
        if (!url) return;
        const img = cloneDoc.createElement('img');
        img.style.cssText = svg.style.cssText;
        img.src = url;
        svg.replaceWith(img);
      });
      const w = cloneDoc.defaultView;
      const container = cloneDoc.querySelector('.html2pdf__container');
      const orig = w.Element.prototype.getBoundingClientRect;
      const base = container ? orig.call(container) : { left: 0, top: 0 };
      cloneInfo.left = base.left;
      cloneInfo.top = base.top;
      w.Element.prototype.getBoundingClientRect = function () {
        const r = orig.call(this);
        const l = Math.round(r.left - base.left) + base.left, t = Math.round(r.top - base.top) + base.top;
        const R = Math.round(r.right - base.left) + base.left, B = Math.round(r.bottom - base.top) + base.top;
        return new w.DOMRect(l, t, R - l, B - t);
      };
    };
  }

  // Строчные элементы с фоном или рамкой (код в тексте, ссылки с подчёркиванием-рамкой):
  // рисуем по фрагментам строк, как Blink (скругление — только у первого и последнего фрагмента)
  function collectInlineBoxes(win, root) {
    const out = [];
    const clipCache = new Map();
    root.querySelectorAll('*').forEach(el => {
      if (el.namespaceURI !== 'http://www.w3.org/1999/xhtml') return;
      const cs = win.getComputedStyle(el);
      if (cs.display !== 'inline' || cs.visibility !== 'visible') return;
      const bg = parseColor(cs.backgroundColor);
      const sides = ['Top', 'Right', 'Bottom', 'Left'].map(s => ({
        w: cs['border' + s + 'Style'] === 'none' || cs['border' + s + 'Style'] === 'hidden' ? 0 : parseFloat(cs['border' + s + 'Width']) || 0,
        c: parseColor(cs['border' + s + 'Color'])
      }));
      const hasBorder = sides.some(s => s.w > 0 && s.c.a > 0);
      if (bg.a <= 0 && !hasBorder) return;
      if (el.closest('svg')) return;
      el.setAttribute('data-zpdf-inline', '');
      const rects = Array.from(el.getClientRects()).filter(r => r.width > 0 || r.height > 0);
      const rad = p => parseFloat(cs[p]) || 0;
      const opacity = effectiveOpacity(win, el, root.parentElement);
      rects.forEach((r, i) => {
        const l = Math.round(r.left + win.scrollX), t = Math.round(r.top + win.scrollY);
        out.push({
          x: l, y: t, w: Math.round(r.right + win.scrollX) - l, h: Math.round(r.bottom + win.scrollY) - t,
          first: i === 0, last: i === rects.length - 1, bg, sides, opacity,
          radius: [rad('borderTopLeftRadius'), rad('borderTopRightRadius'), rad('borderBottomRightRadius'), rad('borderBottomLeftRadius')],
          clip: clipRectFor(win, el.parentElement || el, root, clipCache)
        });
      });
    });
    return out;
  }

  function roundedPath(pdf, x, y, w, h, r) {
    // r: [tl, tr, br, bl] в pt; кривые Безье для четверти окружности
    const K = 0.5522847498;
    const [tl, tr, br, bl] = r.map(v => Math.max(0, Math.min(v, w / 2, h / 2)));
    const P = pdf.internal.pageSize.getHeight();
    const f = v => v.toFixed(3);
    const Y = v => f(P - v);
    let s = f(x + tl) + ' ' + Y(y) + ' m\n';
    s += f(x + w - tr) + ' ' + Y(y) + ' l\n';
    if (tr) s += f(x + w - tr + tr * K) + ' ' + Y(y) + ' ' + f(x + w) + ' ' + Y(y + tr - tr * K) + ' ' + f(x + w) + ' ' + Y(y + tr) + ' c\n';
    s += f(x + w) + ' ' + Y(y + h - br) + ' l\n';
    if (br) s += f(x + w) + ' ' + Y(y + h - br + br * K) + ' ' + f(x + w - br + br * K) + ' ' + Y(y + h) + ' ' + f(x + w - br) + ' ' + Y(y + h) + ' c\n';
    s += f(x + bl) + ' ' + Y(y + h) + ' l\n';
    if (bl) s += f(x + bl - bl * K) + ' ' + Y(y + h) + ' ' + f(x) + ' ' + Y(y + h - bl + bl * K) + ' ' + f(x) + ' ' + Y(y + h - bl) + ' c\n';
    s += f(x) + ' ' + Y(y + tl) + ' l\n';
    if (tl) s += f(x) + ' ' + Y(y + tl - tl * K) + ' ' + f(x + tl - tl * K) + ' ' + Y(y) + ' ' + f(x + tl) + ' ' + Y(y) + ' c\n';
    s += 'h\n';
    return s;
  }

  function drawInlineBoxes(pdf, boxes) {
    const k = PAGE.k;
    boxes.forEach(b => {
      const page = pageOf(b.y + b.h / 2);
      ensurePages(pdf, page + 1);
      pdf.setPage(page + 1);
      const pt = toPt(b.x, b.y, page);
      const r = [b.first ? b.radius[0] : 0, b.last ? b.radius[1] : 0, b.last ? b.radius[2] : 0, b.first ? b.radius[3] : 0].map(v => v * k);
      withClip(pdf, b.clip, page, () => {
        setOpacity(pdf, b.opacity);
        if (b.bg.a > 0) {
          if (b.bg.a < 0.999) gsWrite(pdf, b.bg.a * b.opacity, b.bg.a * b.opacity);
          pdf.setFillColor(b.bg.r, b.bg.g, b.bg.b);
          pdf.internal.write(roundedPath(pdf, pt.x, pt.y, b.w * k, b.h * k, r) + 'f');
        }
        // Рамки: верх/низ — у каждого фрагмента, лево — у первого, право — у последнего
        const [top, right, bottom, left] = b.sides;
        const edge = (s, x, y, w, h) => {
          if (!(s.w > 0 && s.c.a > 0)) return;
          pdf.setFillColor(s.c.r, s.c.g, s.c.b);
          if (s.c.a < 0.999) gsWrite(pdf, s.c.a * b.opacity, s.c.a * b.opacity);
          pdf.rect(x, y, w, h, 'F');
        };
        edge(top, pt.x, pt.y, b.w * k, top.w * k);
        edge(bottom, pt.x, pt.y + (b.h - bottom.w) * k, b.w * k, bottom.w * k);
        if (b.first) edge(left, pt.x, pt.y, left.w * k, b.h * k);
        if (b.last) edge(right, pt.x + (b.w - right.w) * k, pt.y, right.w * k, b.h * k);
      });
    });
  }

  // Стили SVG переносим в атрибут style: при растеризации SVG стили страницы недоступны
  const SVG_PROPS = ['fill', 'fill-opacity', 'fill-rule', 'stroke', 'stroke-width', 'stroke-opacity', 'stroke-dasharray', 'stroke-dashoffset', 'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit', 'opacity', 'color', 'display', 'visibility', 'marker-start', 'marker-mid', 'marker-end', 'stop-color', 'stop-opacity', 'paint-order', 'vector-effect'];
  function inlineSvgStyles(win, root) {
    root.querySelectorAll('svg').forEach(svg => {
      if (svg.parentElement && svg.parentElement.closest('svg')) return;
      const els = [svg, ...svg.querySelectorAll('*')];
      els.forEach(el => {
        if (el.closest('foreignObject')) return;
        const cs = win.getComputedStyle(el);
        let css = '';
        SVG_PROPS.forEach(p => { css += p + ':' + cs.getPropertyValue(p) + ';'; });
        el.setAttribute('style', (el.getAttribute('style') || '') + ';' + css);
      });
    });
  }

  // «Чистые» копии SVG для растра (без текста и foreignObject — их рисует слой текста),
  // с явным размером в пикселях. Ключ — атрибут data-zpdf-svg у исходного элемента
  function prepareSvgImages(win, root) {
    const out = {};
    let seq = 0;
    root.querySelectorAll('svg').forEach(svg => {
      if (svg.parentElement && svg.parentElement.closest('svg')) return;
      const r = svg.getBoundingClientRect();
      if (!(r.width > 0 && r.height > 0)) return;
      const c = svg.cloneNode(true);
      c.querySelectorAll('foreignObject, text').forEach(n => n.remove());
      c.removeAttribute('data-zpdf-svg');
      c.setAttribute('width', r.width);
      c.setAttribute('height', r.height);
      if (!c.getAttribute('xmlns')) c.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      const id = String(++seq);
      svg.setAttribute('data-zpdf-svg', id);
      out[id] = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new win.XMLSerializer().serializeToString(c));
    });
    return out;
  }

  // Фон подписей внутри foreignObject (html2canvas рисует SVG одним растром без него)
  function collectForeignBackgrounds(win, root) {
    const out = [];
    root.querySelectorAll('foreignObject *').forEach(el => {
      const cs = win.getComputedStyle(el);
      if (cs.visibility !== 'visible' || cs.display === 'none') return;
      const c = parseColor(cs.backgroundColor);
      if (c.a <= 0) return;
      for (const r of el.getClientRects()) {
        if (r.width > 0 && r.height > 0) out.push({ x: r.left + win.scrollX, y: r.top + win.scrollY, w: r.width, h: r.height, color: c, opacity: c.a * effectiveOpacity(win, el, root.parentElement) });
      }
    });
    return out;
  }
  function drawRects(pdf, rects) {
    rects.forEach(r => {
      const page = pageOf(r.y + r.h / 2);
      ensurePages(pdf, page + 1);
      pdf.setPage(page + 1);
      const pt = toPt(r.x, r.y, page);
      pdf.saveGraphicsState();
      setOpacity(pdf, r.opacity);
      pdf.setFillColor(r.color.r, r.color.g, r.color.b);
      pdf.rect(pt.x, pt.y, r.w * PAGE.k, r.h * PAGE.k, 'F');
      pdf.restoreGraphicsState();
    });
  }

  // ---------- Главная функция ----------
  // Выполняется внутри iframe: jsPDF, html2canvas и этот модуль работают в одном окне
  // (проверки jsPDF вида instanceof Array / Uint8Array не проходят между разными окнами)
  async function renderHere(opts) {
    const win = window, doc = document;
    await waitReady(win, doc);
    const root = doc.getElementById('mo') || doc.body.firstElementChild;
    materializePseudo(win, root);
    await nextFrame(win);
    const pages = await paginate(win, doc, root);
    await nextFrame(win);

    const metrics = makeMetrics(win, doc);
    const lang = opts.lang || doc.documentElement.lang || 'en';
    const { runs, decos } = collectText(win, doc, root, metrics);
    const markers = collectMarkers(win, doc, root, metrics);
    const markerRuns = markers.filter(m => m.kind === 'text').map(m => {
      const am = metrics.ascent(m.style.familyCss, m.style.sizePx, m.style.weight, m.style.fontStyle);
      return {
        text: m.text, left: m.x, right: m.x + metrics.textWidth(m.style.cssFont, m.text, 'font-variant-numeric:tabular-nums'),
        top: m.baseline - am.ascent, height: am.height, baselineY: m.baseline, style: m.style, clip: null, isMarker: true
      };
    });
    const checkboxes = collectCheckboxes(win, root);
    const links = collectLinks(win, root);
    const fgRects = collectForeignBackgrounds(win, root);
    const inlineBoxes = collectInlineBoxes(win, root);
    const scrollbars = collectScrollbars(win, doc, root);
    inlineSvgStyles(win, root);
    const cloneInfo = { svgs: prepareSvgImages(win, root) };
    const images = await prefetchImages(doc);

    const pdf = new win.jspdf.jsPDF({ unit: 'pt', format: [PAGE.wPt, PAGE.hPt], orientation: 'portrait', compress: true });
    const registry = makeFontRegistry(pdf);
    const pieces = await assignFonts(registry, runs, markerRuns, lang);

    hookGradients(win);
    patchContext(pdf, win, images);
    // Все страницы создаются заранее: context2d выводит q/Q (save/restore) на каждую существующую
    // страницу, и страница, добавленная посреди отрисовки, получила бы непарные Q и «утёкшую» обрезку
    ensurePages(pdf, pages);
    // Видимая область страницы — как при печати (всё, что за её пределами, обрезается)
    const pageClip = 'q\n' +(PAGE.marginPt).toFixed(3) + ' ' + (PAGE.hPt - PAGE.marginPt - PAGE.clipH * PAGE.k).toFixed(3) + ' ' +
      (PAGE.clipW * PAGE.k).toFixed(3) + ' ' + (PAGE.clipH * PAGE.k).toFixed(3) + ' re W n';
    for (let i = 1; i <= pages; i++) { pdf.setPage(i); pdf.internal.write(pageClip); }
    pdf.setPage(1);
    await pdf.html(root, {
      x: 0,
      y: 0,
      margin: [PAGE.marginPt, PAGE.wPt - PAGE.marginPt - PAGE.clipW * PAGE.k, PAGE.hPt - PAGE.marginPt - PAGE.contentH * PAGE.k, PAGE.marginPt],
      width: PAGE.contentW * PAGE.k,
      windowWidth: PAGE.contentW,
      autoPaging: 'slice',
      html2canvas: {
        backgroundColor: null, logging: false, useCORS: true, allowTaint: false, onclone: makeOnClone(cloneInfo),
        canvas: makeH2cCanvas(pdf, doc, pages * PAGE.contentH - 0.01, cloneInfo)
      },
      callback: () => {}
    });
    // Лишние пустые страницы в конце (если jsPDF создал их из-за нулевых по высоте фигур)
    while (pdf.internal.getNumberOfPages() > pages) pdf.deletePage(pdf.internal.getNumberOfPages());
    for (let i = 1; i <= pages; i++) { pdf.setPage(i); pdf.internal.write('Q'); }

    drawRects(pdf, fgRects);
    drawInlineBoxes(pdf, inlineBoxes);
    drawMarkers(pdf, markers);
    drawCheckboxes(pdf, checkboxes);
    drawPieces(pdf, win, doc, pieces, registry);
    drawDecorations(pdf, decos, registry);
    drawScrollbars(pdf, scrollbars);
    drawLinks(pdf, links);
    metrics.dispose();

    const title = opts.title || 'document';
    pdf.setProperties({ title, creator: 'Złoty MD', producer: 'Złoty MD (jsPDF)' });
    try { pdf.setLanguage(lang); } catch (e) { /* код языка не из списка jsPDF */ }
    pdf.viewerPreferences({ DisplayDocTitle: true });
    return { buffer: pdf.output('arraybuffer'), pages: pdf.internal.getNumberOfPages() };
  }

  // Адрес этого файла: тот же модуль загружается внутрь iframe
  const SELF_SRC = document.currentScript && document.currentScript.src;

  // Вызывается из основного окна: возвращает Blob с готовым PDF
  async function generate(html, opts) {
    opts = opts || {};
    if (!SELF_SRC) throw new Error('pdf-export.js: script URL is unknown');
    const iframe = await createFrame(html);
    try {
      const doc = iframe.contentDocument;
      await loadScript(doc, LIBS.jspdf);
      await loadScript(doc, LIBS.html2canvas);
      await loadScript(doc, SELF_SRC);
      const res = await iframe.contentWindow.ZmdPdf.renderHere({ title: opts.title, lang: opts.lang });
      const blob = new Blob([new Uint8Array(res.buffer)], { type: 'application/pdf' });
      blob.pages = res.pages;
      return blob;
    } finally {
      if (!opts.keepFrame) iframe.remove();
    }
  }

  // Число страниц PDF без создания самого PDF: та же раскладка и те же разрывы, что и при экспорте.
  // Выполняется внутри iframe (jsPDF и html2canvas для этого не нужны)
  async function countHere() {
    const win = window, doc = document;
    await waitReady(win, doc);
    const root = doc.getElementById('mo') || doc.body.firstElementChild;
    if (!root || root.getBoundingClientRect().height <= 0) return 0;
    await repeatTableHeaders(win, doc, root);
    const mc = await buildMulticol(win, doc, root);
    try {
      return measureItems(win, doc, mc).pageCount;
    } finally {
      mc.M.remove();
    }
  }

  // Вызывается из основного окна: число страниц PDF для HTML документа
  async function countPages(html) {
    if (!SELF_SRC) throw new Error('pdf-export.js: script URL is unknown');
    const iframe = await createFrame(html);
    try {
      await loadScript(iframe.contentDocument, SELF_SRC);
      return await iframe.contentWindow.ZmdPdf.countHere();
    } finally {
      iframe.remove();
    }
  }

  // Скачивание файла: имя = заголовок документа
  async function save(html, opts) {
    opts = opts || {};
    const blob = await generate(html, opts);
    const name = (opts.fileName || ((opts.title || 'document').replace(/[\/:*?"<>|]/g, '_') + '.pdf'));
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    return blob;
  }

  global.ZmdPdf = { generate, save, renderHere, countPages, countHere, PAGE };
})(window);
