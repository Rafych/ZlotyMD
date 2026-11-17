// Złoty MD — страницы в редакторе и превью.
// Места разрывов берутся из той же раскладки, что и при экспорте в PDF (js/pdf-export.js →
// ZmdPdf.layoutPages): в превью и в редакторе отмечается, где начинается каждая страница,
// а в заголовках панелей показывается текущая страница. Только для интерфейса редактора:
// в скачиваемый HTML и в превью в новом окне ничего из этого не попадает (разметка рисуется
// поверх #mo, а не внутри него).
(function () {
  'use strict';

  // Служебные узлы, которых нет в HTML для PDF (или которые там служебные) — как в pdf-export.js
  const SKIP_SEL = '[data-zpdf-thead-repeat],[data-zpdf-spacer],.cpbtn,script,style';

  let layoutData = { count: 0, breaks: [] }; // последняя раскладка страниц
  let stale = false; // текст изменился, новая раскладка ещё считается
  let layoutText = null; // текст, для которого посчитана раскладка
  let marks = []; // [{ page, manual, pvY, edOff, edY }]
  let edLayer = null;
  let edInner = null;
  let pvLayer = null;
  let edInd = null;
  let pvInd = null;
  let raf = 0;

  const enabled = () => !(typeof appSettings === 'object' && appSettings && appSettings.pageView === false);
  const skip = n => n.nodeType === 1 && n.matches(SKIP_SEL);
  const kept = el => Array.from(el.children).filter(k => !skip(k));

  function el(tag, cls) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    n.setAttribute('aria-hidden', 'true');
    return n;
  }

  function label(key, n) {
    return String(tr(key) || '').replace('{n}', Number(n).toLocaleString());
  }

  // ---------- Место разрыва в превью ----------
  function resolve(d) {
    let node = mo;
    for (const i of d.path) {
      const k = kept(node)[i];
      if (!k) return null;
      node = k;
    }
    let top = node;
    while (top.parentElement && top.parentElement !== mo) top = top.parentElement;
    if (top.parentElement !== mo) return null;
    const res = { el: node, top, text: null };
    if (d.text >= 0) {
      const tw = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, {
        acceptNode: t => {
          for (let a = t.parentElement; a && a !== node; a = a.parentElement) if (skip(a)) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      });
      let acc = 0;
      let last = null;
      for (let t = tw.nextNode(); t; t = tw.nextNode()) {
        last = t;
        if (acc + t.data.length > d.text) {
          res.text = { node: t, off: d.text - acc };
          break;
        }
        acc += t.data.length;
      }
      if (!res.text && last) res.text = { node: last, off: last.data.length };
    }
    return res;
  }

  // Предыдущий видимый «сосед» места разрыва (поднимаясь по предкам до #mo)
  function prevNeighbour(node) {
    for (let a = node; a && a !== mo; a = a.parentElement) {
      for (let p = a.previousElementSibling; p; p = p.previousElementSibling) {
        if (skip(p)) continue;
        if (p.getClientRects().length) return p;
      }
    }
    return null;
  }

  function lineHeightOf(elm, fallback) {
    const lh = parseFloat(getComputedStyle(elm).lineHeight);
    return lh > 0 ? lh : fallback * 1.2;
  }

  // Высота линии разрыва в координатах прокрутки превью (или null, если превью скрыто)
  function previewY(r, manualEl) {
    if (!pv.clientHeight) return null;
    const base = pv.getBoundingClientRect().top - pv.scrollTop;
    if (manualEl) {
      const b = manualEl.getBoundingClientRect();
      return (b.top + b.bottom) / 2 - base;
    }
    if (r.text) {
      const { node, off } = r.text;
      const rg = document.createRange();
      const a = Math.min(off, Math.max(0, node.data.length - 1));
      rg.setStart(node, a);
      rg.setEnd(node, Math.min(node.data.length, a + 1));
      const rect = rg.getClientRects()[0];
      if (rect) {
        const lh = lineHeightOf(node.parentElement, rect.height);
        return rect.top - Math.max(0, (lh - rect.height) / 2) - base;
      }
    }
    const rects = r.el.getClientRects();
    if (!rects.length) return null;
    const top = rects[0].top;
    const prev = prevNeighbour(r.el);
    if (prev) {
      const pr = prev.getClientRects();
      const bottom = pr[pr.length - 1].bottom;
      if (bottom <= top) return (bottom + top) / 2 - base;
    }
    return top - 4 - base;
  }

  // ---------- Место разрыва в исходном тексте ----------
  function escRe(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Текст превью от места разрыва (для поиска того же места в исходнике)
  function snippetAfter(r) {
    if (!r.text) return '';
    const rg = document.createRange();
    rg.setStart(r.text.node, r.text.off);
    rg.setEnd(r.top, r.top.childNodes.length);
    return rg.toString().replace(/\s+/g, ' ').trim().slice(0, 40);
  }

  // Доля текста блока до места разрыва
  function textFraction(r) {
    const total = r.top.textContent.length;
    if (!total) return 0;
    const rg = document.createRange();
    rg.setStart(r.top, 0);
    if (r.text) rg.setEnd(r.text.node, r.text.off);
    else rg.setEndBefore(r.el);
    return Math.min(1, rg.toString().length / total);
  }

  function sourceOffset(r, pair, nextLine, lines, starts) {
    let L = pair.line;
    let endLine = nextLine;
    while (endLine - 1 > L && !lines[endLine - 1].trim()) endLine--;
    const at = ln => (ln < starts.length ? starts[ln] : ed.value.length);
    if (r.el === r.top && !r.text) return at(L);
    // Блок кода: строка разрыва — по числу переводов строки до места разрыва
    const code = r.top.tagName === 'PRE' ? r.top.querySelector('code') : null;
    if (code && !code.querySelector('.diff-wrap') && code.contains(r.text ? r.text.node : r.el)) {
      const rg = document.createRange();
      rg.setStart(code, 0);
      if (r.text) rg.setEnd(r.text.node, r.text.off);
      else rg.setEndBefore(r.el);
      const n = (rg.toString().match(/\n/g) || []).length;
      return at(Math.min(endLine - 1, L + 1 + n));
    }
    const anchor = r.text ? r.text.node : r.el;
    const anchorEl = anchor.nodeType === 1 ? anchor : anchor.parentElement;
    // Таблица Markdown: строка таблицы — по номеру строки (заголовок и разделитель — две первые строки)
    if (r.top.tagName === 'TABLE' && !/^\s*:::table/.test(lines[L])) {
      const tr = anchorEl.closest('tr');
      const rows = Array.from(r.top.tBodies).flatMap(tb => Array.from(tb.rows));
      const idx = tr ? rows.indexOf(tr) : -1;
      if (idx >= 0 && L + 2 + idx < endLine && lines[L + 2 + idx].includes('|')) return at(L + 2 + idx);
    }
    let a = at(L);
    let b = endLine < starts.length ? starts[endLine] - 1 : ed.value.length;
    let frac = textFraction(r);
    // Список: пункт — по номеру среди строк с маркерами пунктов (если их столько же, сколько пунктов)
    const li = anchorEl.closest('li');
    if (li && r.top.contains(li)) {
      const lis = Array.from(r.top.querySelectorAll('li'));
      const marks = [];
      for (let ln = L; ln < endLine; ln++) if (/^\s*(?:>\s*)*(?:[-*+]|\d{1,9}[.)])(?:\s|$)/.test(lines[ln])) marks.push(ln);
      const k = lis.indexOf(li);
      if (k >= 0 && marks.length === lis.length) {
        if (r.el === li && !r.text) return at(marks[k]);
        // Разрыв внутри пункта: ищем дальше только в его строках
        const liEnd = k + 1 < marks.length ? marks[k + 1] : endLine;
        a = at(marks[k]);
        b = liEnd < starts.length ? starts[liEnd] - 1 : ed.value.length;
        const rg = document.createRange();
        rg.setStart(li, 0);
        if (r.text) rg.setEnd(r.text.node, r.text.off);
        else rg.setEndBefore(r.el);
        frac = li.textContent.length ? Math.min(1, rg.toString().length / li.textContent.length) : 0;
        L = marks[k];
        endLine = liEnd;
      }
    }
    const est = a + Math.round(frac * (b - a));
    // Текст абзаца: ищем в исходнике слова, с которых начинается страница
    const snip = snippetAfter(r);
    if (snip) {
      const src = ed.value.slice(a, b);
      const words = snip.split(' ');
      for (let k = Math.min(words.length, 6); k >= 1; k--) {
        const probe = words.slice(0, k).join(' ');
        if (probe.length < 4 && k > 1) continue;
        const re = new RegExp(words.slice(0, k).map(escRe).join('[\\s\\S]{0,12}?'), 'g');
        let best = -1;
        let m;
        while ((m = re.exec(src))) {
          const off = a + m.index;
          if (best < 0 || Math.abs(off - est) < Math.abs(best - est)) best = off;
          if (re.lastIndex === m.index) re.lastIndex++;
        }
        if (best > a) return best;
      }
    }
    // Иначе — ближайшее начало строки внутри блока (строки таблиц и пунктов списка)
    let bestLine = Math.min(endLine - 1, L + 1);
    for (let ln = L + 1; ln < endLine; ln++) {
      if (Math.abs(at(ln) - est) < Math.abs(at(bestLine) - est)) bestLine = ln;
    }
    return at(bestLine);
  }

  // Верх строки (с учётом переноса длинных строк) для смещений в тексте редактора — через скрытую копию
  let mirror = null;
  function editorTops(offsets) {
    const out = new Map();
    if (!ed.clientWidth || !offsets.length) return out;
    if (!mirror) {
      mirror = document.createElement('div');
      mirror.setAttribute('aria-hidden', 'true');
      document.body.appendChild(mirror);
    }
    const cs = getComputedStyle(ed);
    [
      'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'fontVariantLigatures', 'fontFeatureSettings',
      'lineHeight', 'letterSpacing', 'wordSpacing', 'tabSize', 'textIndent', 'textTransform',
      'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'wordBreak', 'overflowWrap'
    ].forEach(p => (mirror.style[p] = cs[p]));
    Object.assign(mirror.style, {
      position: 'absolute', visibility: 'hidden', left: '-99999px', top: '0',
      whiteSpace: 'pre-wrap', boxSizing: 'content-box', border: '0',
      width: Math.max(0, ed.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)) + 'px'
    });
    const text = ed.value;
    const sorted = Array.from(new Set(offsets)).sort((x, y) => x - y);
    const frag = document.createDocumentFragment();
    // Пробный символ в начале: расстояние от верха строки до верха текста (половина интерлиньяжа)
    const probe = document.createElement('span');
    probe.textContent = 'X';
    frag.appendChild(probe);
    frag.appendChild(document.createTextNode('\n'));
    // Пустой маркер в начале следующей строки: высота пробной строки
    const probe2 = document.createElement('span');
    frag.appendChild(probe2);
    const spans = new Map();
    let last = 0;
    for (const o of sorted) {
      if (o > last) frag.appendChild(document.createTextNode(text.slice(last, o)));
      const s = document.createElement('span');
      spans.set(o, s);
      frag.appendChild(s);
      last = Math.max(last, o);
    }
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    mirror.replaceChildren(frag);
    const half = probe.offsetTop - (parseFloat(cs.paddingTop) || 0);
    const lh = probe2.offsetTop - probe.offsetTop;
    spans.forEach((s, o) => out.set(o, s.offsetTop - lh - half));
    mirror.replaceChildren();
    return out;
  }

  // ---------- Раскладка разметки ----------
  // Во время набора разметка пересчитывается после короткой паузы, а не на каждое нажатие
  let soonTimer = 0;
  function schedule() {
    if (stale) {
      clearTimeout(soonTimer);
      soonTimer = setTimeout(() => {
        if (!raf) raf = requestAnimationFrame(layout);
      }, 150);
      return;
    }
    if (!raf) raf = requestAnimationFrame(layout);
  }

  function clearMarks() {
    marks = [];
    if (edInner) edInner.replaceChildren();
    if (pvLayer) pvLayer.replaceChildren();
  }

  function layout() {
    raf = 0;
    if (!edLayer) return;
    mo.querySelectorAll('.zmd-pagebreak').forEach(n => (n.dataset.label = tr('pageBreak')));
    const on = enabled() && ed.value.trim() && mo.style.display !== 'none' && layoutData.count > 0;
    document.body.classList.toggle('pg-on', !!on);
    document.body.classList.toggle('pg-stale', !!on && stale);
    if (!on) {
      clearMarks();
      updateIndicators();
      return;
    }
    // Ручные разрывы (\newpage) — в превью у них своя полоса; номер страницы ставим на неё
    const manualEls = new Set(mo.querySelectorAll(':scope > .zmd-pagebreak'));
    const pairs = _matchBlocks(_scanSourceBlocks(ed.value), Array.from(mo.children));
    const pairOf = new Map(pairs.map((p, i) => [p.el, i]));
    const lines = ed.value.split('\n');
    const starts = [];
    let acc = 0;
    for (const l of lines) {
      starts.push(acc);
      acc += l.length + 1;
    }
    const children = Array.from(mo.children);
    marks = [];
    for (const d of layoutData.breaks) {
      const r = resolve(d);
      if (!r) continue;
      let manual = null;
      if (r.el === r.top && !r.text) {
        const prev = prevNeighbour(r.top);
        if (prev && manualEls.has(prev)) manual = prev;
      }
      const m = { page: d.page, manual: !!manual, pvY: previewY(r, manual), edOff: null, edY: null };
      // Строка в редакторе
      if (manual && pairOf.has(manual)) {
        const ln = pairs[pairOf.get(manual)].line + 1;
        m.edOff = ln < starts.length ? starts[ln] : ed.value.length;
      } else if (pairOf.has(r.top)) {
        const k = pairOf.get(r.top);
        const next = k + 1 < pairs.length ? pairs[k + 1].line : lines.length;
        m.edOff = sourceOffset(r, pairs[k], next, lines, starts);
      } else {
        // Блок без пары в исходнике: разрыв — перед следующим сопоставленным блоком
        const idx = children.indexOf(r.top);
        const nx = pairs.find(p => children.indexOf(p.el) > idx);
        if (nx) m.edOff = starts[nx.line];
      }
      marks.push(m);
    }
    const tops = editorTops(marks.filter(m => m.edOff !== null).map(m => m.edOff));
    marks.forEach(m => {
      if (m.edOff !== null && tops.has(m.edOff)) m.edY = tops.get(m.edOff);
    });
    draw();
    updateIndicators();
  }

  function draw() {
    // Редактор: слой поверх textarea (по размеру его видимой области, без полосы прокрутки)
    edLayer.style.top = ed.offsetTop + 'px';
    edLayer.style.left = ed.offsetLeft + 'px';
    edLayer.style.width = ed.clientWidth + 'px';
    edLayer.style.height = ed.clientHeight + 'px';
    const ef = document.createDocumentFragment();
    const pf = document.createDocumentFragment();
    let lastEdY = -Infinity;
    marks.forEach(m => {
      if (m.edY !== null && m.edY > lastEdY + 1) {
        lastEdY = m.edY;
        const e = el('div', 'pg-mark');
        e.style.top = m.edY + 'px';
        const pill = el('span', 'pg-pill');
        pill.textContent = Number(m.page).toLocaleString();
        e.appendChild(pill);
        ef.appendChild(e);
      }
      if (m.pvY !== null) {
        const p = el('div', 'pg-mark' + (m.manual ? ' manual' : ''));
        p.style.top = m.pvY + 'px';
        const pill = el('span', 'pg-pill');
        pill.textContent = label('pageN', m.page);
        p.appendChild(pill);
        pf.appendChild(p);
      }
    });
    edInner.replaceChildren(ef);
    pvLayer.replaceChildren(pf);
    syncEdScroll();
  }

  function syncEdScroll() {
    if (edInner) edInner.style.transform = `translateY(${-ed.scrollTop}px)`;
  }

  // ---------- Текущая страница ----------
  function pageAtCaret() {
    const pos = ed.selectionStart;
    let p = 1;
    for (const m of marks) if (m.edOff !== null && m.edOff <= pos) p = Math.max(p, m.page);
    return p;
  }

  function pageAtPreview() {
    if (pv.scrollTop + pv.clientHeight >= pv.scrollHeight - 2 && pv.scrollTop > 0) return layoutData.count;
    const ref = pv.scrollTop + (parseFloat(getComputedStyle(pv).paddingTop) || 0) + 8;
    let p = 1;
    for (const m of marks) if (m.pvY !== null && m.pvY <= ref) p = Math.max(p, m.page);
    return p;
  }

  function setInd(node, page) {
    if (!node) return;
    const on = document.body.classList.contains('pg-on');
    node.hidden = !on;
    if (!on) return;
    const total = Math.max(layoutData.count, page);
    const txt = `${Number(page).toLocaleString()} / ${Number(total).toLocaleString()}`;
    const t = node.querySelector('.pg-ind-num');
    if (t.textContent !== txt) t.textContent = txt;
  }

  function updateIndicators() {
    setInd(edInd, pageAtCaret());
    setInd(pvInd, pageAtPreview());
  }

  let indRaf = 0;
  function scheduleIndicators() {
    if (!indRaf) indRaf = requestAnimationFrame(() => {
      indRaf = 0;
      updateIndicators();
    });
  }

  // ---------- Связь с приложением ----------
  function init() {
    edLayer = el('div', 'pg-layer pg-ed');
    edInner = el('div', 'pg-layer-in');
    edLayer.appendChild(edInner);
    ed.insertAdjacentElement('afterend', edLayer);
    pvLayer = el('div', 'pg-layer pg-pv');
    pv.appendChild(pvLayer);
    edInd = document.getElementById('edPageInd');
    pvInd = document.getElementById('pvPageInd');
    ed.addEventListener('scroll', syncEdScroll, { passive: true });
    pv.addEventListener('scroll', scheduleIndicators, { passive: true });
    ['keyup', 'mouseup', 'input', 'focus'].forEach(ev => ed.addEventListener(ev, scheduleIndicators));
    document.addEventListener('selectionchange', () => {
      if (document.activeElement === ed) scheduleIndicators();
    });
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(schedule);
      ro.observe(ed);
      ro.observe(mo);
      ro.observe(pv);
    } else {
      window.addEventListener('resize', schedule);
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);
    schedule();
  }

  window.ZmdPages = {
    // Новая раскладка страниц из pdf-export.js
    setLayout(res) {
      layoutData = res && typeof res === 'object' ? { count: res.count || 0, breaks: Array.from(res.breaks || []) } : { count: +res || 0, breaks: [] };
      stale = false;
      layoutText = ed.value;
      clearTimeout(soonTimer);
      schedule();
    },
    // Текст изменился: прежние разрывы показываются приглушёнными до нового подсчёта
    invalidate() {
      if (!ed.value.trim()) layoutData = { count: 0, breaks: [] };
      // Повторный рендер того же текста (смена настроек, языка) — разметка не устаревает
      stale = ed.value !== layoutText;
      schedule();
    },
    refresh: schedule,
    wanted: enabled,
    // Текущая разметка (только чтение): [{ page, manual, pvY, edOff, edY }]
    get marks() {
      return marks.map(m => Object.assign({}, m));
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
