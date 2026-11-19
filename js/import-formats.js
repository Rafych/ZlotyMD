// Złoty MD — открытие DOCX и PDF: преобразование в Markdown.
//  • DOCX — mammoth (структура документа → HTML) и собственный перевод HTML → Markdown.
//    До mammoth документ дорабатывается (fflate): формулы Word (OMML) переводятся в LaTeX,
//    разрывы страниц — в \newpage. Стили, которые пишет экспорт Złoty MD (блок кода, цитата,
//    «Page Break»), и исходники диаграмм Mermaid в замещающем тексте картинок возвращаются как были.
//  • PDF — pdf.js: текст с координатами и шрифтами; по ним восстанавливаются заголовки (размер
//    шрифта), абзацы (межстрочный интервал), списки, блоки кода (моноширинный шрифт), выделение
//    и ссылки. Номера страниц отбрасываются.
// Библиотеки загружаются с jsDelivr только при открытии такого файла.
(function () {
  'use strict';

  const CDN = 'https://cdn.jsdelivr.net/npm/';
  const MAMMOTH = CDN + 'mammoth@1.13.0/mammoth.browser.min.js';
  const FFLATE = CDN + 'fflate@0.8.2/umd/index.js';
  const PDFJS_BASE = CDN + 'pdfjs-dist@4.10.38/';
  const PDFJS = PDFJS_BASE + 'build/pdf.min.mjs';
  const PDFJS_WORKER = PDFJS_BASE + 'build/pdf.worker.min.mjs';

  const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const M_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/math';

  const DOCX_RE = /\.docx$/i;
  const PDF_RE = /\.pdf$/i;
  const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  function kind(file) {
    const name = (file && file.name) || '';
    if (DOCX_RE.test(name) || file.type === DOCX_MIME) return 'docx';
    if (PDF_RE.test(name) || file.type === 'application/pdf') return 'pdf';
    return null;
  }

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

  // =====================================================================
  // Markdown: экранирование и общие части
  // =====================================================================

  // Символы, которые в тексте документа означали бы разметку
  function escapeMd(s) {
    return s
      .replace(/\\/g, '\\\\')
      .replace(/([`*[\]$])/g, '\\$1')
      .replace(/(^|[^\p{L}\p{N}])_|_(?=[^\p{L}\p{N}]|$)/gu, m => m.replace('_', '\\_'))
      .replace(/~~/g, '\\~\\~');
  }
  // Начало строки, которое Markdown принял бы за заголовок, цитату или пункт списка
  function escapeLineStarts(s) {
    return s
      .split('\n')
      .map(l => l.replace(/^(\s*)(#{1,6}|>|[-+]|\d{1,9}[.)])(?=\s|$)/, (m, sp, mark) => sp + mark.replace(/^([#>+-]|\d+)/, '\\$1')))
      .join('\n');
  }
  // Ограничители `…` для кода: длиннее любой серии обратных кавычек внутри
  function inlineCode(text) {
    const runs = text.match(/`+/g) || [];
    const fence = '`'.repeat(Math.max(0, ...runs.map(r => r.length)) + 1);
    const pad = /^`|`$/.test(text) ? ' ' : '';
    return fence + pad + text + pad + fence;
  }
  function codeFence(text, lang) {
    const runs = text.match(/^`{3,}/gm) || [];
    const fence = '`'.repeat(Math.max(3, ...runs.map(r => r.length + 1)));
    return fence + (lang || '') + '\n' + text.replace(/\n+$/, '') + '\n' + fence;
  }
  // Пробелы по краям выделения выносятся наружу: **слово** , а не ** слово **
  function wrap(inner, mark) {
    const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(inner);
    return m[2] ? m[1] + mark + m[2] + mark + m[3] : inner;
  }
  function tidy(md) {
    return md.replace(/[ \t]+$/gm, '').replace(/\n{3,}/g, '\n\n').trim() + '\n';
  }

  // =====================================================================
  // OMML (формулы Word) → LaTeX
  // =====================================================================

  const SYM = {
    'α': '\\alpha', 'β': '\\beta', 'γ': '\\gamma', 'δ': '\\delta', 'ε': '\\varepsilon', 'ϵ': '\\epsilon', 'ζ': '\\zeta',
    'η': '\\eta', 'θ': '\\theta', 'ϑ': '\\vartheta', 'ι': '\\iota', 'κ': '\\kappa', 'λ': '\\lambda', 'μ': '\\mu', 'ν': '\\nu',
    'ξ': '\\xi', 'π': '\\pi', 'ϖ': '\\varpi', 'ρ': '\\rho', 'ϱ': '\\varrho', 'σ': '\\sigma', 'ς': '\\varsigma', 'τ': '\\tau',
    'υ': '\\upsilon', 'ϕ': '\\phi', 'φ': '\\varphi', 'χ': '\\chi', 'ψ': '\\psi', 'ω': '\\omega',
    'Γ': '\\Gamma', 'Δ': '\\Delta', 'Θ': '\\Theta', 'Λ': '\\Lambda', 'Ξ': '\\Xi', 'Π': '\\Pi', 'Σ': '\\Sigma', 'Υ': '\\Upsilon',
    'Φ': '\\Phi', 'Ψ': '\\Psi', 'Ω': '\\Omega',
    '∞': '\\infty', '∂': '\\partial', '∇': '\\nabla', '±': '\\pm', '∓': '\\mp', '×': '\\times', '÷': '\\div', '·': '\\cdot',
    '⋅': '\\cdot', '∘': '\\circ', '≈': '\\approx', '≠': '\\neq', '≤': '\\leq', '≥': '\\geq', '≡': '\\equiv', '∼': '\\sim',
    '≃': '\\simeq', '≅': '\\cong', '∝': '\\propto', '≪': '\\ll', '≫': '\\gg', '→': '\\to', '←': '\\leftarrow',
    '↔': '\\leftrightarrow', '⇒': '\\Rightarrow', '⇐': '\\Leftarrow', '⇔': '\\Leftrightarrow', '↦': '\\mapsto',
    '∈': '\\in', '∉': '\\notin', '∋': '\\ni', '⊂': '\\subset', '⊃': '\\supset', '⊆': '\\subseteq', '⊇': '\\supseteq',
    '∪': '\\cup', '∩': '\\cap', '∅': '\\emptyset', '∀': '\\forall', '∃': '\\exists', '¬': '\\neg', '∧': '\\land', '∨': '\\lor',
    '…': '\\ldots', '⋯': '\\cdots', '⋮': '\\vdots', '⋱': '\\ddots', '′': "'", '″': "''", '°': '^\\circ', 'ℏ': '\\hbar',
    'ℓ': '\\ell', 'ℝ': '\\mathbb{R}', 'ℕ': '\\mathbb{N}', 'ℤ': '\\mathbb{Z}', 'ℚ': '\\mathbb{Q}', 'ℂ': '\\mathbb{C}',
    '⟨': '\\langle', '⟩': '\\rangle', '∗': '\\ast', '⊕': '\\oplus', '⊗': '\\otimes', '√': '\\surd', '−': '-'
  };
  const NARY = { '∑': '\\sum', '∏': '\\prod', '∐': '\\coprod', '∫': '\\int', '∬': '\\iint', '∭': '\\iiint', '∮': '\\oint', '⋃': '\\bigcup', '⋂': '\\bigcap', '⋁': '\\bigvee', '⋀': '\\bigwedge', '⨁': '\\bigoplus', '⨂': '\\bigotimes' };
  const ACC = { '̂': '\\hat', '̃': '\\tilde', '̄': '\\bar', '̅': '\\bar', '̇': '\\dot', '̈': '\\ddot', '⃗': '\\vec', '̆': '\\breve', '̌': '\\check', '́': '\\acute', '̀': '\\grave', '^': '\\hat', '~': '\\tilde', '¯': '\\bar' };
  const FUNCS = new Set(['sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'arcsin', 'arccos', 'arctan', 'sinh', 'cosh', 'tanh', 'coth', 'log', 'ln', 'lg', 'exp', 'lim', 'liminf', 'limsup', 'max', 'min', 'sup', 'inf', 'det', 'dim', 'ker', 'deg', 'gcd', 'arg', 'Pr', 'hom']);
  const DELIM = { '(': '(', ')': ')', '[': '[', ']': ']', '{': '\\{', '}': '\\}', '|': '|', '‖': '\\|', '⟨': '\\langle', '⟩': '\\rangle', '⌊': '\\lfloor', '⌋': '\\rfloor', '⌈': '\\lceil', '⌉': '\\rceil', '': '.' };

  const mChild = (el, name) => Array.from(el.children).find(c => c.localName === name);
  function mProp(el, prName, name) {
    const pr = mChild(el, prName);
    const c = pr && mChild(pr, name);
    if (!c) return null;
    return c.getAttributeNS(M_NS, 'val') ?? c.getAttribute('m:val') ?? '';
  }
  const on = v => v !== null && v !== '0' && v !== 'off' && v !== 'false';
  const grp = s => (s.length === 1 ? s : '{' + s + '}');

  function texText(str) {
    let out = '';
    for (const ch of str) {
      if (SYM[ch]) out += SYM[ch] + (/^\\[a-zA-Z]+$/.test(SYM[ch]) ? ' ' : '');
      else if ('{}%#&_^'.includes(ch)) out += '\\' + ch;
      else if (ch === '\\') out += '\\backslash ';
      else out += ch;
    }
    return out;
  }
  function seq(el) {
    let s = '';
    for (const c of Array.from(el.children)) {
      if (/Pr$/.test(c.localName)) continue;
      s += conv(c);
    }
    return s;
  }
  function part(el, name) {
    const c = mChild(el, name);
    return c ? seq(c).trim() : '';
  }
  function conv(el) {
    if (el.namespaceURI !== M_NS) {
      // Внутри формулы могут быть и обычные прогоны Word (w:r) — их текст
      return el.localName === 't' ? texText(el.textContent) : seq(el);
    }
    switch (el.localName) {
      case 'r': {
        const t = Array.from(el.children).filter(c => c.localName === 't').map(c => c.textContent).join('');
        const nor = mChild(el, 'rPr') && mChild(mChild(el, 'rPr'), 'nor');
        if (nor && /\S/.test(t)) return '\\text{' + t.replace(/[{}\\]/g, m => '\\' + m) + '}';
        if (FUNCS.has(t.trim())) return '\\' + t.trim() + ' ';
        return texText(t);
      }
      case 'f': {
        const type = mProp(el, 'fPr', 'type');
        const n = part(el, 'num');
        const d = part(el, 'den');
        if (type === 'lin' || type === 'skw') return grp(n) + '/' + grp(d);
        if (type === 'noBar') return '{' + n + ' \\atop ' + d + '}';
        return '\\frac{' + n + '}{' + d + '}';
      }
      case 'sSup':
        return grp(part(el, 'e')) + '^{' + part(el, 'sup') + '}';
      case 'sSub':
        return grp(part(el, 'e')) + '_{' + part(el, 'sub') + '}';
      case 'sSubSup':
        return grp(part(el, 'e')) + '_{' + part(el, 'sub') + '}^{' + part(el, 'sup') + '}';
      case 'sPre':
        return '{}_{' + part(el, 'sub') + '}^{' + part(el, 'sup') + '}' + grp(part(el, 'e'));
      case 'rad': {
        const deg = part(el, 'deg');
        return on(mProp(el, 'radPr', 'degHide')) || !deg ? '\\sqrt{' + part(el, 'e') + '}' : '\\sqrt[' + deg + ']{' + part(el, 'e') + '}';
      }
      case 'nary': {
        const chr = mProp(el, 'naryPr', 'chr') || '∫';
        let s = NARY[chr] || texText(chr);
        const sub = part(el, 'sub');
        const sup = part(el, 'sup');
        if (sub && !on(mProp(el, 'naryPr', 'subHide'))) s += '_{' + sub + '}';
        if (sup && !on(mProp(el, 'naryPr', 'supHide'))) s += '^{' + sup + '}';
        return s + ' ' + part(el, 'e');
      }
      case 'd': {
        const beg = mProp(el, 'dPr', 'begChr');
        const end = mProp(el, 'dPr', 'endChr');
        const sep = mProp(el, 'dPr', 'sepChr') ?? '|';
        const b = beg === null ? '(' : beg;
        const e = end === null ? ')' : end;
        const inner = Array.from(el.children)
          .filter(c => c.localName === 'e')
          .map(c => seq(c).trim())
          .join(' ' + (DELIM[sep] || sep) + ' ');
        return '\\left' + (DELIM[b] ?? b) + ' ' + inner + ' \\right' + (DELIM[e] ?? e);
      }
      case 'acc': {
        const chr = mProp(el, 'accPr', 'chr') || '̂';
        return (ACC[chr] || '\\hat') + '{' + part(el, 'e') + '}';
      }
      case 'bar':
        return (mProp(el, 'barPr', 'pos') === 'top' ? '\\overline{' : '\\underline{') + part(el, 'e') + '}';
      case 'groupChr': {
        const chr = mProp(el, 'groupChrPr', 'chr') || '⏟';
        const top = mProp(el, 'groupChrPr', 'pos') === 'top' || chr === '⏞';
        return (top ? '\\overbrace{' : '\\underbrace{') + part(el, 'e') + '}';
      }
      case 'func': {
        const name = part(el, 'fName').replace(/\\([a-zA-Z]+)\s*$/, '$1').trim();
        const head = FUNCS.has(name) ? '\\' + name : /^\\/.test(name) ? name : '\\operatorname{' + name + '}';
        return head + ' ' + grp(part(el, 'e'));
      }
      case 'limLow': {
        const base = part(el, 'e');
        const lim = part(el, 'lim');
        return /^\\?lim\s*$/.test(base) ? '\\lim_{' + lim + '}' : '\\underset{' + lim + '}{' + base + '}';
      }
      case 'limUpp':
        return '\\overset{' + part(el, 'lim') + '}{' + part(el, 'e') + '}';
      case 'eqArr':
        return '\\begin{aligned}' + Array.from(el.children).filter(c => c.localName === 'e').map(c => seq(c).trim()).join(' \\\\ ') + '\\end{aligned}';
      case 'm':
        return (
          '\\begin{matrix}' +
          Array.from(el.children)
            .filter(c => c.localName === 'mr')
            .map(r => Array.from(r.children).filter(c => c.localName === 'e').map(c => seq(c).trim()).join(' & '))
            .join(' \\\\ ') +
          '\\end{matrix}'
        );
      case 't':
        return texText(el.textContent);
      default:
        return seq(el);
    }
  }
  function ommlToLatex(oMath) {
    return seq(oMath).replace(/\s+/g, ' ').replace(/\s+([}^_])/g, '$1').trim();
  }

  // =====================================================================
  // DOCX
  // =====================================================================

  // Отпечаток текста документа Word (только текст, без разметки и пробелов): Word при пересохранении
  // меняет XML, но не текст — по отпечатку видно, правили ли файл после экспорта из Złoty MD
  function docxTextHash(xml) {
    let text = '';
    String(xml).replace(/<(?:w|m):t(?:\s[^>]*)?>([^<]*)<\/(?:w|m):t>/g, (m, t) => {
      text += t;
      return m;
    });
    text = text
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
      .replace(/&#x([0-9a-f]+);/gi, (m, h) => String.fromCodePoint(parseInt(h, 16)))
      .replace(/&#(\d+);/g, (m, d) => String.fromCodePoint(+d))
      .replace(/&amp;/g, '&')
      .replace(/[\s\u200b\u00a0]+/g, '');
    let h = 0x811c9dc5;
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return text.length.toString(36) + '.' + (h >>> 0).toString(36);
  }

  // Документ Złoty MD, встроенный при экспорте: { zmd, edited } или null
  async function docxEmbeddedSource(files, strFromU8) {
    const name = Object.keys(files).find(n => /^customXml\/item\d+\.xml$/.test(n) && strFromU8(files[n]).includes(ZMD_SOURCE_NS));
    if (!name || typeof decodeZmdSource !== 'function') return null;
    const xml = new DOMParser().parseFromString(strFromU8(files[name]), 'application/xml');
    const src = xml.getElementsByTagNameNS(ZMD_SOURCE_NS, 'source')[0];
    const hash = xml.getElementsByTagNameNS(ZMD_SOURCE_NS, 'textHash')[0];
    const zmd = src ? await decodeZmdSource(src.textContent) : null;
    if (!zmd) return null;
    const current = files['word/document.xml'] ? docxTextHash(strFromU8(files['word/document.xml'])) : '';
    return { zmd, edited: !!hash && hash.textContent.trim() !== current };
  }

  const TOKEN_RE = /ZMDMATH([IB])(\d+)Z|ZMDPAGEBREAKZ/g;
  const ALIGN_TOKEN_RE = /ZMDALIGN([CR])Z/g;
  const OLSTART_RE = /^ZMDOLSTART(\d+)Z\s*/;

  // Начальные номера нумерованных списков: numId → { уровень: начало } (numbering.xml)
  function listStarts(numberingXml) {
    const out = {};
    if (!numberingXml) return out;
    const doc = new DOMParser().parseFromString(numberingXml, 'application/xml');
    const W = n => doc.getElementsByTagNameNS(W_NS, n);
    const attr = (el, n) => el && (el.getAttributeNS(W_NS, n) || el.getAttribute('w:' + n));
    const abstract = {};
    Array.from(W('abstractNum')).forEach(a => {
      const lv = {};
      Array.from(a.getElementsByTagNameNS(W_NS, 'lvl')).forEach(l => {
        const fmt = attr(l.getElementsByTagNameNS(W_NS, 'numFmt')[0], 'val');
        const st = attr(l.getElementsByTagNameNS(W_NS, 'start')[0], 'val');
        if (fmt === 'decimal') lv[attr(l, 'ilvl')] = parseInt(st || '1', 10);
      });
      abstract[attr(a, 'abstractNumId')] = lv;
    });
    Array.from(W('num')).forEach(n => {
      const lv = Object.assign({}, abstract[attr(n.getElementsByTagNameNS(W_NS, 'abstractNumId')[0], 'val')] || {});
      Array.from(n.getElementsByTagNameNS(W_NS, 'lvlOverride')).forEach(o => {
        const so = o.getElementsByTagNameNS(W_NS, 'startOverride')[0];
        if (so && lv[attr(o, 'ilvl')] !== undefined) lv[attr(o, 'ilvl')] = parseInt(attr(so, 'val'), 10);
      });
      out[attr(n, 'numId')] = lv;
    });
    return out;
  }

  // Формулы и разрывы страниц → метки в тексте (mammoth их не понимает)
  function prepareDocxXml(xml, store, starts, alts) {
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    if (doc.getElementsByTagName('parsererror').length) return xml;
    // Замещающий текст с исходником Mermaid: mammoth заменил бы переводы строк пробелами — оставляем метку
    Array.from(doc.getElementsByTagName('*')).forEach(el => {
      if (el.localName !== 'docPr' && el.localName !== 'cNvPr') return;
      const d = el.getAttribute('descr') || '';
      if (!/^Mermaid:[\u2028\n]/.test(d)) return;
      alts.push(d);
      el.setAttribute('descr', 'ZMDALT' + (alts.length - 1) + 'Z');
    });
    const makeRun = text => {
      const r = doc.createElementNS(W_NS, 'w:r');
      const t = doc.createElementNS(W_NS, 'w:t');
      t.setAttributeNS('http://www.w3.org/XML/1998/namespace', 'xml:space', 'preserve');
      t.textContent = text;
      r.appendChild(t);
      return r;
    };
    const paraText = p =>
      Array.from(p.getElementsByTagNameNS(W_NS, 't'))
        .filter(t => !t.closest || !Array.from(p.getElementsByTagNameNS(M_NS, 'oMath')).some(m => m.contains(t)))
        .map(t => t.textContent)
        .join('');
    const push = (latex, block) => {
      store.push(latex);
      return 'ZMDMATH' + (block ? 'B' : 'I') + (store.length - 1) + 'Z';
    };
    Array.from(doc.getElementsByTagNameNS(M_NS, 'oMathPara')).forEach(para => {
      const latex = Array.from(para.getElementsByTagNameNS(M_NS, 'oMath'))
        .map(ommlToLatex)
        .join(' \\\\ ');
      para.replaceWith(makeRun(push(latex, true)));
    });
    Array.from(doc.getElementsByTagNameNS(M_NS, 'oMath')).forEach(m => {
      if (!m.isConnected || (m.parentNode && m.parentNode.namespaceURI === M_NS)) return;
      const p = m.parentNode && m.parentNode.localName === 'p' ? m.parentNode : m.closest && m.closest('p');
      const alone = p && p.getElementsByTagNameNS(M_NS, 'oMath').length === 1 && !paraText(p).trim();
      m.replaceWith(makeRun(push(ommlToLatex(m), alone)));
    });
    const wAttr = (el, n) => el && (el.getAttributeNS(W_NS, n) || el.getAttribute('w:' + n));
    const firstChild = (el, n) => Array.from(el.children).find(c => c.localName === n);
    const prependRun = (p, text) => {
      const pPr = firstChild(p, 'pPr');
      p.insertBefore(makeRun(text), pPr ? pPr.nextSibling : p.firstChild);
    };
    // Блок кода с языком (стиль ZmdCode_<язык в hex>, экспорт Złoty MD) → метка языка в начале
    Array.from(doc.getElementsByTagNameNS(W_NS, 'p')).forEach(p => {
      const pPr = firstChild(p, 'pPr');
      const st = wAttr(pPr && firstChild(pPr, 'pStyle'), 'val') || '';
      const m = /^ZmdCode_([0-9a-f]+)$/.exec(st);
      if (m) prependRun(p, 'ZMDLANG' + m[1] + 'Z');
    });
    // Горизонтальная линия: пустой абзац с границей → ---
    Array.from(doc.getElementsByTagNameNS(W_NS, 'p')).forEach(p => {
      const pPr = firstChild(p, 'pPr');
      const bdr = pPr && firstChild(pPr, 'pBdr');
      if (bdr && (firstChild(bdr, 'bottom') || firstChild(bdr, 'top')) && !paraText(p).replace(/\u200b/g, '').trim() && !p.getElementsByTagNameNS(W_NS, 'drawing').length) {
        prependRun(p, 'ZMDHRZ');
      }
    });
    // Выравнивание столбцов таблицы: метка в начале ячейки
    Array.from(doc.getElementsByTagNameNS(W_NS, 'tc')).forEach(tc => {
      const p = firstChild(tc, 'p');
      const pPr = p && firstChild(p, 'pPr');
      const jc = wAttr(pPr && firstChild(pPr, 'jc'), 'val');
      if (jc === 'center') prependRun(p, 'ZMDALIGNCZ');
      else if (jc === 'right' || jc === 'end') prependRun(p, 'ZMDALIGNRZ');
    });
    // Нумерованный список не с 1: метка начального номера в первом пункте
    const seenLists = new Set();
    Array.from(doc.getElementsByTagNameNS(W_NS, 'numPr')).forEach(np => {
      const p = np.parentNode && np.parentNode.parentNode;
      const numId = wAttr(firstChild(np, 'numId'), 'val');
      const ilvl = wAttr(firstChild(np, 'ilvl'), 'val') || '0';
      const key = numId + ':' + ilvl;
      if (!p || seenLists.has(key)) return;
      seenLists.add(key);
      const st = starts[numId] && starts[numId][ilvl];
      if (st && st !== 1) prependRun(p, 'ZMDOLSTART' + st + 'Z');
    });
    // Разрыв страницы (Ctrl+Enter в Word) → \newpage; «С новой страницы» в свойствах абзаца — оформление, не разрыв
    Array.from(doc.getElementsByTagNameNS(W_NS, 'br')).forEach(br => {
      const type = br.getAttributeNS(W_NS, 'type') || br.getAttribute('w:type');
      if (type !== 'page') return;
      const t = doc.createElementNS(W_NS, 'w:t');
      t.textContent = 'ZMDPAGEBREAKZ';
      br.replaceWith(t);
    });
    return new XMLSerializer().serializeToString(doc);
  }

  const MONO_FONT_RE = /consolas|courier|mono|menlo|monaco|source code|fira code|lucida console|inconsolata|ＭＳ ゴシック/i;

  async function docxToHtml(files) {
    await loadScript(MAMMOTH);
    const { zipSync, strFromU8, strToU8 } = window.fflate;
    const math = [];
    const alts = [];
    const starts = listStarts(files['word/numbering.xml'] ? strFromU8(files['word/numbering.xml']) : '');
    ['word/document.xml', 'word/footnotes.xml', 'word/endnotes.xml'].forEach(name => {
      if (files[name]) files[name] = strToU8(prepareDocxXml(strFromU8(files[name]), math, starts, alts));
    });
    const data = zipSync(files);
    const result = await window.mammoth.convertToHtml(
      { arrayBuffer: data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) },
      {
        styleMap: [
          "p[style-name^='Code Block ('] => pre:fresh",
          "p[style-name='Code Block'] => pre:separator('\\n')",
          "p[style-name='Source Code'] => pre:separator('\\n')",
          "p[style-name='HTML Preformatted'] => pre:separator('\\n')",
          "p[style-name='Page Break'] => p.zmd-newpage:fresh",
          "p[style-name='Quote'] => blockquote > p:fresh",
          "p[style-name='Intense Quote'] => blockquote > p:fresh",
          "p[style-name='Block Text'] => blockquote > p:fresh",
          "p[style-name='Title'] => h1:fresh",
          "p[style-name='Subtitle'] => h2:fresh",
          "r[style-name='ZmdInlineCode'] => code",
          "r[style-name='Verbatim Char'] => code",
          "r[style-name='HTML Code'] => code",
          'u => u'
        ],
        // Моноширинный шрифт у фрагмента текста → `код`
        transformDocument: window.mammoth.transforms.run(run =>
          run.font && MONO_FONT_RE.test(run.font) && !run.styleName ? Object.assign({}, run, { styleName: 'ZmdInlineCode' }) : run
        )
      }
    );
    return { html: result.value, math, alts };
  }

  // ---------- HTML (mammoth) → Markdown ----------
  function htmlToMarkdown(html, math, alts) {
    const doc = new DOMParser().parseFromString('<body>' + html + '</body>', 'text/html');
    const body = doc.body;
    // Сноски: ссылки [1] и список в конце → [^1] и [^1]: …
    const notes = [];
    const noteNum = new Map();
    body.querySelectorAll('li[id^="footnote-"], li[id^="endnote-"]').forEach(li => {
      const n = notes.length + 1;
      noteNum.set(li.id, n);
      li.querySelectorAll('a[href^="#footnote-ref-"], a[href^="#endnote-ref-"]').forEach(a => a.remove());
      notes.push({ n, li });
    });
    notes.forEach(({ li }) => {
      const list = li.parentElement;
      li.remove();
      if (list && !list.children.length) list.remove();
    });
    const ctx = { noteNum, alts: alts || [] };
    let md = blocksToMd(body, ctx).join('\n\n');
    if (notes.length) {
      md +=
        '\n\n' +
        notes
          .map(({ n, li }) => {
            const text = blocksToMd(li, ctx).join('\n\n').replace(/\n/g, '\n    ');
            return `[^${n}]: ${text}`;
          })
          .join('\n');
    }
    return restoreTokens(md, math);
  }

  function restoreTokens(md, math) {
    // Блочная формула и разрыв страницы, стоящие отдельным абзацем, — отдельными блоками
    md = md.replace(/^ZMDMATHB(\d+)Z$/gm, (_, i) => '$$\n' + math[+i] + '\n$$');
    md = md.replace(/^ZMDPAGEBREAKZ$/gm, '\\newpage');
    md = md.replace(/^ZMDHRZ$/gm, '---').replace(/ZMDHRZ/g, '');
    md = md.replace(ALIGN_TOKEN_RE, '').replace(/ZMDOLSTART\d+Z\s*/g, '');
    md = md.replace(/ZMDPAGEBREAKZ/g, '\n\n\\newpage\n\n');
    return md.replace(TOKEN_RE, (m, type, i) => (type === 'B' ? '$$' + math[+i] + '$$' : type === 'I' ? '$' + math[+i] + '$' : m));
  }

  function blocksToMd(parent, ctx) {
    const out = [];
    let inline = '';
    const flush = () => {
      const t = escapeLineStarts(inline.trim());
      if (t) out.push(t);
      inline = '';
    };
    parent.childNodes.forEach(n => {
      if (n.nodeType === 3) {
        inline += escapeMd(n.data.replace(/\s+/g, ' '));
        return;
      }
      if (n.nodeType !== 1) return;
      const tag = n.tagName;
      if (/^H[1-6]$/.test(tag)) {
        flush();
        const t = inlineToMd(n, ctx).replace(/\n+/g, ' ').trim();
        if (t) out.push('#'.repeat(+tag[1]) + ' ' + t);
      } else if (tag === 'P' || tag === 'DIV') {
        flush();
        out.push(...paragraphToMd(n, ctx));
      } else if (tag === 'PRE') {
        flush();
        let text = preText(n);
        let lang = '';
        const lm = /^ZMDLANG([0-9a-f]+)Z/.exec(text);
        if (lm) {
          lang = new TextDecoder().decode(new Uint8Array(lm[1].match(/../g).map(h => parseInt(h, 16))));
          text = text.slice(lm[0].length);
        }
        out.push(codeFence(text, lang));
      } else if (tag === 'UL' || tag === 'OL') {
        flush();
        out.push(listToMd(n, ctx));
      } else if (tag === 'BLOCKQUOTE') {
        flush();
        // Блоки-предупреждения (экспорт Złoty MD): абзац-заголовок Note/Tip/… → [!NOTE] …
        // Word объединяет соседние цитаты — каждый заголовок начинает новый блок
        const groups = [[]];
        blocksToMd(n, ctx).forEach(part => {
          const alert = /^\*\*(Note|Tip|Important|Warning|Caution)\*\*$/i.exec(part.trim());
          if (alert) {
            if (groups[groups.length - 1].length) groups.push([]);
            groups[groups.length - 1].alert = alert[1].toUpperCase();
          } else groups[groups.length - 1].push(part);
        });
        groups.forEach(g => {
          if (!g.length && !g.alert) return;
          const inner = (g.alert ? '[!' + g.alert + ']\n' : '') + g.join('\n\n');
          out.push(inner.split('\n').map(l => (l ? '> ' + l : '>')).join('\n'));
        });
      } else if (tag === 'TABLE') {
        flush();
        out.push(tableToMd(n, ctx));
      } else if (tag === 'HR') {
        flush();
        out.push('---');
      } else inline += inlineToMd(n, ctx);
    });
    flush();
    return out;
  }

  function preText(pre) {
    const c = pre.cloneNode(true);
    c.querySelectorAll('br').forEach(br => br.replaceWith('\n'));
    return c.textContent.replace(/ /g, ' ');
  }

  function paragraphToMd(p, ctx) {
    if (p.classList.contains('zmd-newpage')) return ['\\newpage'];
    // Картинка с исходником Mermaid в замещающем тексте (экспорт Złoty MD) → снова диаграмма
    const imgs = p.querySelectorAll('img');
    if (imgs.length === 1 && !p.textContent.trim()) {
      let alt = imgs[0].getAttribute('alt') || '';
      const tok = /^ZMDALT(\d+)Z$/.exec(alt);
      if (tok) alt = ctx.alts[+tok[1]] || '';
      const m = /^Mermaid:[\u2028\n]([\s\S]+)$/.exec(alt);
      if (m) return [codeFence(m[1].replace(/\u2028/g, '\n').trim(), 'mermaid')];
    }
    const text = escapeLineStarts(inlineToMd(p, ctx).replace(/[ \t]+\n/g, '\n').trim());
    return text ? [text] : [];
  }

  function inlineToMd(el, ctx) {
    let s = '';
    el.childNodes.forEach(n => {
      if (n.nodeType === 3) {
        s += escapeMd(n.data.replace(/[ \t\r\n]+/g, ' '));
        return;
      }
      if (n.nodeType !== 1) return;
      const inner = () => inlineToMd(n, ctx);
      switch (n.tagName) {
        case 'STRONG':
        case 'B':
          s += wrap(inner(), '**');
          break;
        case 'EM':
        case 'I':
          s += wrap(inner(), '*');
          break;
        case 'S':
        case 'DEL':
        case 'STRIKE':
          s += wrap(inner(), '~~');
          break;
        case 'CODE': {
          const t = n.textContent;
          s += t.trim() ? inlineCode(t) : t;
          break;
        }
        case 'BR':
          s += '\n';
          break;
        case 'IMG': {
          let rawAlt = n.getAttribute('alt') || '';
          const tok = /^ZMDALT(\d+)Z$/.exec(rawAlt);
          if (tok) rawAlt = (ctx.alts[+tok[1]] || '').split(/[\u2028\n]/)[0];
          const alt = rawAlt.replace(/\s+/g, ' ').replace(/[[\]\\]/g, '\\$&');
          const src = n.getAttribute('src') || '';
          if (src) s += `![${alt}](${src.replace(/[ )]/g, c => encodeURIComponent(c))})`;
          break;
        }
        case 'A': {
          const href = n.getAttribute('href') || '';
          const text = inner();
          if (!text.trim()) break; // закладки Word (<a id>)
          if (/^#(footnote|endnote)-\d/.test(href)) {
            const num = ctx.noteNum.get(href.slice(1));
            s += num ? `[^${num}]` : text;
          } else if (href.startsWith('#')) {
            // Ссылка на закладку заголовка (экспорт Złoty MD: zmd_…) → на заголовок
            s += /^#zmd_/.test(href) ? `[${text}](#${href.slice(5)})` : text;
          } else if (href) s += `[${text}](${href.replace(/[ )]/g, c => encodeURIComponent(c))})`;
          else s += text;
          break;
        }
        case 'SUP': {
          const a = n.querySelector('a[href^="#footnote-"], a[href^="#endnote-"]');
          if (a && n.textContent.trim() === a.textContent.trim()) {
            const num = ctx.noteNum.get(a.getAttribute('href').slice(1));
            s += num ? `[^${num}]` : inner();
          } else s += inner();
          break;
        }
        case 'INPUT':
          if (n.type === 'checkbox') s += n.checked || n.hasAttribute('checked') ? '[x] ' : '[ ] ';
          break;
        default:
          s += inner();
      }
    });
    return s;
  }

  function listToMd(list, ctx) {
    const ordered = list.tagName === 'OL';
    let n = parseInt(list.getAttribute('start') || '1', 10) || 1;
    const lines = [];
    Array.from(list.children).forEach((li, idx) => {
      if (li.tagName !== 'LI') return;
      // Начальный номер (метка из numbering.xml)
      const tw = li.ownerDocument.createTreeWalker(li, NodeFilter.SHOW_TEXT);
      for (let t = tw.nextNode(); t; t = tw.nextNode()) {
        const m = OLSTART_RE.exec(t.data);
        if (m) {
          if (ordered && idx === 0) n = parseInt(m[1], 10);
          t.data = t.data.replace(OLSTART_RE, '');
          break;
        }
        if (t.data.trim()) break;
      }
      let marker = ordered ? `${n++}. ` : '- ';
      const first = li.firstElementChild && li.firstElementChild.tagName === 'P' ? li.firstElementChild : li;
      const cb = first.querySelector(':scope > input[type=checkbox]');
      if (cb && !ordered) {
        marker = '- ' + (cb.checked || cb.hasAttribute('checked') ? '[x] ' : '[ ] ');
        cb.remove();
      }
      const parts = blocksToMd(li, ctx);
      const indent = ' '.repeat(ordered ? marker.length : 2);
      const body = parts
        .map((p, i) => p.split('\n').map((l, j) => (i === 0 && j === 0 ? l.replace(/^\s+/, '') : l ? indent + l : l)).join('\n'))
        .join('\n');
      // Вложенный список — без пустой строки перед ним
      lines.push((marker + body.replace(/^\s+/, '')).replace(/\n\n(?=\s+(?:[-*+]|\d+\.) )/g, '\n'));
    });
    return lines.join('\n');
  }

  function tableToMd(table, ctx) {
    const rows = Array.from(table.querySelectorAll('tr')).map(tr =>
      Array.from(tr.children)
        .filter(c => c.tagName === 'TD' || c.tagName === 'TH')
        .map(c =>
          blocksToMd(c, ctx)
            .join(' ')
            .replace(/\n+/g, ' ')
            .replace(/\|/g, '\\|')
            .trim()
        )
    );
    if (!rows.length) return '';
    const cols = Math.max(...rows.map(r => r.length));
    // Выравнивание столбца — по меткам в ячейках
    // (по строкам данных: ячейки заголовка в браузере по умолчанию по центру)
    const align = Array.from({ length: cols }, (_, i) => {
      for (const r of rows.length > 1 ? rows.slice(1) : rows) {
        const m = /ZMDALIGN([CR])Z/.exec(r[i] || '');
        if (m) return m[1];
      }
      return '';
    });
    rows.forEach(r => r.forEach((c, i) => (r[i] = c.replace(ALIGN_TOKEN_RE, '').trim())));
    // Заголовок таблицы в Word обычно жирный — в Markdown он и так выделен
    rows[0] = rows[0].map(c => {
      const m = /^\*\*([^*]+)\*\*$/.exec(c);
      return m ? m[1] : c;
    });
    const line = r => '| ' + Array.from({ length: cols }, (_, i) => r[i] || '').join(' | ') + ' |';
    const sep = '|' + align.map(a => (a === 'C' ? ' :---: |' : a === 'R' ? ' ---: |' : ' --- |')).join('');
    // Первая строка — заголовок (в GFM он обязателен)
    return [line(rows[0]), sep, ...rows.slice(1).map(line)].join('\n');
  }

  async function docxToMarkdown(files) {
    const { html, math, alts } = await docxToHtml(files);
    return tidy(htmlToMarkdown(html, math, alts));
  }

  // Открытие DOCX: встроенный исходник Złoty MD (если файл не правили или пользователь выбрал его)
  // или преобразование содержимого
  async function openDocx(file, ask) {
    await loadScript(FFLATE);
    const { unzipSync, strFromU8 } = window.fflate;
    const files = unzipSync(new Uint8Array(await file.arrayBuffer()));
    let embedded = null;
    try {
      embedded = await docxEmbeddedSource(files, strFromU8);
    } catch (e) {
      embedded = null;
    }
    if (embedded) {
      // ask: true — исходный документ, false — преобразовать, null — открытие отменено
      const restore = embedded.edited ? await ask('docx') : true;
      if (restore === null) return null;
      if (restore) return { text: embedded.zmd, restored: true };
    }
    return { text: await docxToMarkdown(files), restored: false };
  }

  // =====================================================================
  // PDF
  // =====================================================================

  let pdfjsPromise = null;
  function loadPdfjs() {
    if (!pdfjsPromise) {
      pdfjsPromise = import(PDFJS).then(mod => {
        const lib = mod.GlobalWorkerOptions ? mod : window.pdfjsLib;
        lib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
        return lib;
      });
      pdfjsPromise.catch(() => (pdfjsPromise = null));
    }
    return pdfjsPromise;
  }

  const CJK_RE = /[⺀-鿿豈-﫿＀-￯　-〿가-힯]/;
  const BULLET_RE = /^([•◦▪▫‣●○■□➢►–·∙*-])\s+/;
  const NUMBER_RE = /^(\d{1,3}|[a-zA-Z])[.)]\s+/;
  const BOLD_RE = /bold|black|heavy|semibold|demibold|extrabold|[-,]bd\b|w[6-9]00/i;
  const ITALIC_RE = /italic|oblique/i;
  const MONO_RE = /mono|courier|consol|code|menlo|monaco|inconsolata|typewriter/i;
  const PAGE_NUM_RE = /^\s*(\d{1,4}|\d+\s*\/\s*\d+|[-–—]\s*\d+\s*[-–—]|(page|p\.)\s*\d+(\s*(of|\/)\s*\d+)?|\d+\s*ページ|第?\s*\d+\s*頁)\s*$/i;

  function joinText(a, b) {
    if (!a) return b;
    if (!b) return a;
    const last = a[a.length - 1];
    const first = b[0];
    if (/\s/.test(last) || /\s/.test(first)) return a + b;
    if (CJK_RE.test(last) || CJK_RE.test(first)) return a + b;
    // Перенос слова по слогам в конце строки
    if (/[a-z]-$/.test(a) && /^[a-z]/.test(b)) return a.slice(0, -1) + b;
    return a + ' ' + b;
  }

  // Строки страницы из фрагментов текста pdf.js
  async function pageLines(page) {
    const vp = page.getViewport({ scale: 1 });
    const tc = await page.getTextContent();
    // Настоящие имена шрифтов (жирный, курсив, моноширинный) — после разбора операторов страницы
    let fontNames = {};
    try {
      await page.getOperatorList();
      Object.keys(tc.styles || {}).forEach(id => {
        try {
          const f = page.commonObjs.get(id);
          fontNames[id] = (f && (f.name || f.loadedName)) || '';
        } catch (e) {
          fontNames[id] = '';
        }
      });
    } catch (e) {
      fontNames = {};
    }
    let links = [];
    try {
      links = (await page.getAnnotations())
        .filter(a => a.subtype === 'Link' && a.url)
        .map(a => ({ url: a.url, r: a.rect }));
    } catch (e) {}
    const items = [];
    tc.items.forEach(it => {
      if (typeof it.str !== 'string' || !it.str) return;
      const [a, b, c, d, x, y] = it.transform;
      const size = Math.hypot(c, d) || Math.hypot(a, b) || it.height || 10;
      const style = (tc.styles && tc.styles[it.fontName]) || {};
      const name = fontNames[it.fontName] || '';
      const cx = x + (it.width || 0) / 2;
      const cy = y + size / 3;
      const link = links.find(l => cx >= l.r[0] && cx <= l.r[2] && cy >= l.r[1] && cy <= l.r[3]);
      items.push({
        str: it.str,
        x,
        y,
        w: it.width || 0,
        size,
        bold: BOLD_RE.test(name),
        italic: ITALIC_RE.test(name),
        // Моноширинный — только по имени шрифта (у шрифтов Type 3 pdf.js сообщает «monospace» для любых)
        mono: MONO_RE.test(name) || (!name && style.fontFamily === 'monospace'),
        url: link ? link.url : null
      });
    });
    // Группировка по базовой линии
    items.sort((p, q) => q.y - p.y || p.x - q.x);
    const lines = [];
    items.forEach(it => {
      const line = lines.find(l => Math.abs(l.y - it.y) < Math.min(l.size, it.size) * 0.45);
      if (line) {
        line.items.push(it);
        line.size = Math.max(line.size, it.size);
      } else lines.push({ y: it.y, size: it.size, items: [it] });
    });
    lines.forEach(l => {
      l.items.sort((p, q) => p.x - q.x);
      l.x0 = l.items[0].x;
      const last = l.items[l.items.length - 1];
      l.x1 = last.x + last.w;
      l.plain = l.items.map(i => i.str).join('').trim();
      const textItems = l.items.filter(i => i.str.trim());
      l.bold = textItems.length > 0 && textItems.every(i => i.bold);
      // Моноширинная строка (код): все фрагменты с латиницей, цифрами и знаками — моноширинные;
      // фрагменты только из иероглифов и каны (комментарии в коде) на это не влияют
      const decisive = textItems.filter(i => /[^\s\u2E80-\u9FFF\uF900-\uFAFF\uFF00-\uFFEF\u3000-\u303F\uAC00-\uD7AF]/.test(i.str));
      l.mono = decisive.length > 0 && decisive.every(i => i.mono);
      // Ячейки: фрагменты, разделённые большим промежутком (для распознавания таблиц)
      // (пробельные фрагменты не учитываем: Chrome растягивает пробел на весь промежуток между ячейками)
      l.cells = [];
      let lastEnd = null;
      l.items.forEach(it => {
        if (!it.str.trim()) { if (l.cells.length) l.cells[l.cells.length - 1].items.push(it); return; }
        if (lastEnd === null || it.x - lastEnd > it.size * 1.6) l.cells.push({ x: it.x, items: [it] });
        else l.cells[l.cells.length - 1].items.push(it);
        lastEnd = it.x + it.w;
      });
      l.cells = l.cells.filter(c => c.items.some(i => i.str.trim()));
      l.pageH = vp.height;
    });
    lines.sort((p, q) => q.y - p.y);
    // Номера страниц у верхнего и нижнего края
    return lines.filter(l => !(PAGE_NUM_RE.test(l.plain) && (l.y < vp.height * 0.08 || l.y > vp.height * 0.92)));
  }

  // Текст строки с выделением (жирный, курсив, код, ссылки) — по фрагментам
  function lineMarkdown(line, opts) {
    let out = '';
    let prevEnd = null;
    const runs = [];
    // Маркер пункта списка («1.», «•») отбрасывается по символам, в каких бы фрагментах он ни был
    let skip = opts.skip || 0;
    line.items.forEach(it => {
      let str = it.str;
      if (skip > 0) {
        const lead = str.length - str.replace(/^\s+/, '').length;
        const take = Math.min(str.length, skip + lead);
        skip -= Math.max(0, take - lead);
        str = str.slice(take).replace(/^\s+/, '');
        if (!str) return;
      }
      if (prevEnd !== null) {
        const gap = it.x - prevEnd;
        const last = runs.length ? runs[runs.length - 1].text.slice(-1) : '';
        if (gap > it.size * 0.18 && !/\s/.test(last) && !/^\s/.test(str) && !(CJK_RE.test(last) && CJK_RE.test(str[0]))) str = ' ' + str;
      }
      prevEnd = it.x + it.w;
      const key = [opts.noBold ? 0 : +it.bold, +it.italic, opts.noCode ? 0 : +it.mono, it.url || ''].join('|');
      const r = runs[runs.length - 1];
      if (r && r.key === key) r.text += str;
      else runs.push({ key, text: str, bold: !opts.noBold && it.bold, italic: it.italic, mono: !opts.noCode && it.mono, url: it.url });
    });
    runs.forEach(r => {
      let t = r.mono ? (r.text.trim() ? r.text.replace(/^(\s*)(.*?)(\s*)$/, (m, a, b, c) => a + inlineCode(b) + c) : r.text) : escapeMd(r.text);
      if (r.bold) t = wrap(t, '**');
      if (r.italic) t = wrap(t, '*');
      if (r.url) t = t.replace(/^(\s*)(.*?)(\s*)$/, (m, a, b, c) => (b ? `${a}[${b}](${r.url.replace(/[ )]/g, ch => encodeURIComponent(ch))})${c}` : m));
      out += t;
    });
    return out.replace(/\s+/g, ' ').trim();
  }

  async function pdfToMarkdown(file) {
    const pdfjs = await loadPdfjs();
    const pdf = await pdfjs.getDocument({
      data: new Uint8Array(await file.arrayBuffer()),
      cMapUrl: PDFJS_BASE + 'cmaps/',
      cMapPacked: true,
      standardFontDataUrl: PDFJS_BASE + 'standard_fonts/',
      isEvalSupported: false
    }).promise;
    // PDF, экспортированный из Złoty MD: исходный документ — в метаданных XMP
    try {
      const meta = await pdf.getMetadata();
      const raw = meta && meta.metadata && typeof meta.metadata.getRaw === 'function' ? meta.metadata.getRaw() : '';
      const m = (raw || '').includes(ZMD_SOURCE_NS) && /(zmd-(?:gz|b64):[A-Za-z0-9+/=\s]+)/.exec(raw);
      const zmd = m && typeof decodeZmdSource === 'function' ? await decodeZmdSource(m[1]) : null;
      if (zmd) {
        await pdf.destroy();
        return { text: zmd, restored: true };
      }
    } catch (e) {
      /* без исходника — преобразуем текст */
    }
    const all = [];
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const lines = await pageLines(page);
      lines.forEach(l => (l.page = p));
      all.push(...lines);
      page.cleanup();
    }
    await pdf.destroy();
    if (!all.some(l => l.plain)) {
      const err = new Error('PDF has no text layer');
      err.code = 'pdf-no-text';
      throw err;
    }
    return { text: tidy(linesToMarkdown(all)), restored: false };
  }

  function linesToMarkdown(lines) {
    // Основной размер текста — самый частый (по количеству символов)
    const bySize = new Map();
    lines.forEach(l => {
      const k = Math.round(l.size * 2) / 2;
      bySize.set(k, (bySize.get(k) || 0) + l.plain.length);
    });
    const body = [...bySize.entries()].sort((a, b) => b[1] - a[1])[0][0];
    // Уровни заголовков — по размерам крупнее основного
    const headSizes = [...bySize.keys()].filter(s => s >= body * 1.15).sort((a, b) => b - a);
    const level = size => {
      const i = headSizes.findIndex(s => Math.abs(s - Math.round(size * 2) / 2) < 0.3);
      return i < 0 ? 0 : Math.min(i + 1, 4);
    };
    // Обычный шаг строк основного текста
    const gaps = [];
    for (let i = 1; i < lines.length; i++) {
      const a = lines[i - 1];
      const b = lines[i];
      if (a.page === b.page && Math.abs(a.size - body) < 0.6 && Math.abs(b.size - body) < 0.6) {
        const g = a.y - b.y;
        if (g > 0 && g < body * 4) gaps.push(Math.round(g * 2) / 2);
      }
    }
    const step = gaps.length ? mode(gaps) : body * 1.4;
    const left = Math.min(...lines.filter(l => !l.mono).map(l => l.x0).filter(Number.isFinite));
    const maxRight = Math.max(...lines.map(l => l.x1));

    const blocks = [];
    let cur = null;
    const close = () => {
      if (cur) blocks.push(cur);
      cur = null;
    };
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      const prev = lines[i - 1];
      const gap = prev && prev.page === l.page ? prev.y - l.y : null;
      const newPage = prev && prev.page !== l.page;
      const lv = level(l.size);
      if (lv) {
        // Заголовок; соседние строки того же размера — продолжение
        if (cur && cur.type === 'h' && cur.level === lv && gap !== null && gap < l.size * 1.8) cur.text = joinText(cur.text, lineMarkdown(l, { noBold: true }));
        else {
          close();
          cur = { type: 'h', level: lv, text: lineMarkdown(l, { noBold: true }) };
        }
        continue;
      }
      // Таблица: подряд строки из нескольких ячеек с совпадающими левыми краями столбцов
      if (l.cells.length >= 2) {
        // Столбцы: то же число ячеек и тот же левый край первого (ячейки могут быть выровнены по-разному)
        // (шапка обычно по центру, тело — по левому/правому краю, поэтому сравниваем только число ячеек и общий диапазон)
        const sameCols = (a, b) => a.cells.length === b.cells.length && Math.abs(a.x0 - b.x0) < body * 4;
        if (cur && cur.type === 'table' && sameCols(cur.last, l) && gap !== null && gap < step * 2.6) {
          cur.rows.push(l);
          cur.last = l;
          continue;
        }
        const nx = lines[i + 1];
        if (nx && nx.page === l.page && nx.cells.length >= 2 && sameCols(l, nx)) {
          close();
          cur = { type: 'table', rows: [l], last: l };
          continue;
        }
      }
      if (l.mono) {
        // Подпись языка над блоком кода (шапка блока в PDF Złoty MD) → язык ограничителя
        const langId = typeof LANG_NAMES === 'object' ? Object.keys(LANG_NAMES).find(k => LANG_NAMES[k] === l.plain) : null;
        const nxl = lines[i + 1];
        if (langId && nxl && nxl.mono && nxl.page === l.page && !(cur && cur.type === 'code' && gap !== null && gap < step * 1.6)) {
          close();
          cur = { type: 'code', x0: nxl.x0, lines: [], lang: langId };
          continue;
        }
        const indent = Math.max(0, Math.round((l.x0 - (cur && cur.type === 'code' ? cur.x0 : l.x0)) / (l.size * 0.6)));
        if (cur && cur.type === 'code' && (newPage || (gap !== null && gap < step * 2.6))) {
          if (gap !== null && gap > step * 1.6 && cur.lines.length) cur.lines.push('');
          cur.lines.push(' '.repeat(indent) + l.plain);
        } else {
          close();
          cur = { type: 'code', x0: l.x0, lines: [l.plain] };
        }
        continue;
      }
      const bullet = BULLET_RE.exec(l.plain);
      const number = !bullet && NUMBER_RE.exec(l.plain);
      const markerChars = bullet || number ? (bullet || number)[0].replace(/\s+$/, '').length : 0;
      const text = lineMarkdown(l, { noCode: false, skip: markerChars });
      // Маркеры, нарисованные графикой (их нет в тексте): короткие строки с отступом подряд — пункты списка
      const prevShort = prev && prev.page === l.page && prev.x1 < maxRight * 0.8;
      // Строка по центру (формула, подпись) — не пункт списка
      const centered = Math.abs(l.x0 - left - (maxRight - l.x1)) < body * 2 && l.x0 - left > body * 4;
      const indented = !centered && l.x0 >= left + body * 1.2 && l.x0 < left + body * 8 && l.x1 < maxRight * 0.8;
      const next = lines[i + 1];
      const nextIndented = next && next.page === l.page && next.x0 >= left + body * 1.2 && next.x0 < left + body * 8 && next.x1 < maxRight * 0.8 && l.y - next.y <= step * 1.3;
      const graphicBullet =
        !bullet && !number && indented && gap !== null && gap <= step * 1.3 &&
        ((cur && cur.type === 'li') || (prevShort && nextIndented));
      if (bullet || number || graphicBullet) {
        close();
        const markerLen = markerChars + 1;
        const rest = text;
        cur = {
          implicit: !!graphicBullet,
          type: 'li',
          ordered: !!number,
          num: number ? number[1] : null,
          // у графического маркера текст начинается после маркера — на один шаг правее
          level: Math.max(0, Math.round((l.x0 - left - (graphicBullet ? body * 1.6 : 0)) / (body * 1.6))),
          textX: l.x0 + markerLen * body * 0.5,
          text: rest
        };
        continue;
      }
      const sameSize = cur && Math.abs((cur.size || body) - l.size) < 0.6;
      const continues =
        cur &&
        (cur.type === 'p' || cur.type === 'li') &&
        sameSize !== false &&
        ((gap !== null && gap > 0 && gap <= step * 1.3) || (newPage && cur.lastX1 > maxRight * 0.85));
      if (continues && (cur.type === 'p' || l.x0 > left + body * 0.5)) {
        cur.text = joinText(cur.text, text);
        cur.lastX1 = l.x1;
        continue;
      }
      close();
      cur = { type: 'p', size: l.size, text, lastX1: l.x1 };
    }
    close();
    // Markdown
    const out = [];
    let listBuf = [];
    // Уровни вложенности — от самого левого пункта этого списка
    const flushList = () => {
      if (listBuf.length) {
        const base = Math.min(...listBuf.map(x => x.level));
        out.push(listBuf.map(x => '  '.repeat(Math.min(x.level - base, 4)) + x.text).join('\n'));
      }
      listBuf = [];
    };
    blocks.forEach(b => {
      if (b.type !== 'li') flushList();
      if (b.type === 'h') out.push('#'.repeat(b.level) + ' ' + b.text.trim());
      else if (b.type === 'code') out.push(codeFence(b.lines.join('\n'), b.lang));
      else if (b.type === 'table') {
        const rows = b.rows.map(r => r.cells.map(c => lineMarkdown({ items: c.items }, {}).replace(/\|/g, '\\|')));
        const cols = Math.max(...rows.map(r => r.length));
        const line = r => '| ' + Array.from({ length: cols }, (_, k) => r[k] || '').join(' | ') + ' |';
        out.push([line(rows[0]), '|' + ' --- |'.repeat(cols), ...rows.slice(1).map(line)].join('\n'));
      }
      else if (b.type === 'li') {
        const marker = b.ordered ? (/^\d+$/.test(b.num) ? b.num + '. ' : '1. ') : '- ';
        listBuf.push({ level: b.level, text: marker + b.text.trim() });
      } else out.push(escapeLineStarts(b.text.trim()));
    });
    flushList();
    return out.filter(Boolean).join('\n\n');
  }

  function mode(arr) {
    const m = new Map();
    arr.forEach(v => m.set(v, (m.get(v) || 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0][0];
  }

  // =====================================================================

  // Открытие файла DOCX/PDF: { text, restored } — text в формате .zmd или Markdown.
  // ask(kind) — вопрос пользователю (только когда исходник есть, но файл после экспорта правили):
  // true — открыть исходный документ, false — преобразовать текущее содержимое, null — отмена (результат null)
  async function open(file, ask) {
    const k = kind(file);
    if (k === 'docx') return openDocx(file, ask || (async () => true));
    if (k === 'pdf') return pdfToMarkdown(file);
    return null;
  }

  window.ZmdImport = { kind, open, docxTextHash };
})();
