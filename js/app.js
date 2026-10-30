const ed = document.getElementById('ed'),
  mo = document.getElementById('mo'),
  emp = document.getElementById('emp'),
  pv = document.getElementById('pv');
const cc = document.getElementById('cc'),
  wc = document.getElementById('wc'),
  lc = document.getElementById('lc');

// aiDot — показывать фиолетовую точку («шишку») на значке ИИ (по умолчанию скрыта)
const SETTINGS_DEFAULTS = { htmlRendering: false, aiDot: false };
let appSettings = { ...SETTINGS_DEFAULTS };

const FONT_DEFAULTS = {
  h1: 34,
  h2: 21,
  h3: 16,
  body: 13,
  latex: 13,
  mmd: 13,
  code: 12
};
let fontSizes = { ...FONT_DEFAULTS };

let currentLang = 'en';
let previousLang = 'en';

marked.setOptions({ gfm: true, breaks: true });
// Экранирование HTML-тегов внутри Markdown, чтобы пользовательский ввод не исполнялся как разметка
function escapeHtmlInMarkdown(text) {
  const parts = [];
  const codePattern = /(```[\s\S]*?```|`[^`]+`)/g;

  let last = 0;
  let match;

  while ((match = codePattern.exec(text)) !== null) {
    parts.push(escapeHtmlTags(text.slice(last, match.index)));
    parts.push(match[0]);
    last = match.index + match[0].length;
  }

  parts.push(escapeHtmlTags(text.slice(last)));

  return parts.join('');
}

function escapeHtmlTags(str) {
  return str.replace(/<(\/?[a-zA-Z][^>]*)>/g, '&lt;$1&gt;');
}
// Favicon (assets/favicon.svg) для автономных HTML: встроен как data URI
const FAVICON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="1" y="1" width="62" height="62" rx="14" fill="#FFFFFF" stroke="#E3E6EA" stroke-width="2"/><g transform="translate(12 12) scale(1.905)"><circle cx="4.5" cy="4.5" r="4.5" fill="#4285F4"/><circle cx="16.5" cy="4.5" r="4.5" fill="#EA4335"/><circle cx="4.5" cy="16.5" r="4.5" fill="#FBBC04"/><circle cx="16.5" cy="16.5" r="4.5" fill="#34A853"/></g></svg>';
const FAVICON_HREF = 'data:image/svg+xml,' + encodeURIComponent(FAVICON_SVG);

// Сборка полного HTML-документа для экспорта/печати: включает лицензии, шрифты и стили превью
function buildPreviewHTML(title) {
  title = title || 'Złoty MD Preview';
  const PREVIEW_CSS = `
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;webkit-print-color-adjust:exact;print-color-adjust:exact;}
    :root{
      --gb:#4285F4;--gr:#EA4335;--gy:#FBBC04;--gg:#34A853;
      --gbt:#E8F0FE;--grt:#FCE8E6;--gyt:#FEF7E0;--ggt:#E6F4EA;
      --bg:#fff;--surf:#F8F9FA;--bord:#DADCE0;
      --txt:#202124;--mut:#5F6368;--sub:#9AA0A6;
      --s3:3px;--s5:5px;--s8:8px;--s13:13px;--s21:21px;--s34:34px;--s55:55px;
      --r5:5px;--r8:8px;--r13:13px;--r21:21px;--r34:34px;
      --f13:13px;--f21:21px;--f34:34px;
      --font:'Google Sans',sans-serif;
      --mono:'JetBrains Mono',monospace;
      --fz-h1:${fontSizes.h1}px;
      --fz-h2:${fontSizes.h2}px;
      --fz-h3:${fontSizes.h3}px;
      --fz-body:${fontSizes.body}px;
      --fz-latex:${fontSizes.latex}px;
      --fz-mmd:${fontSizes.mmd}px;
      --fz-code:${fontSizes.code}px;
    }
    body{font-family:var(--font);background:var(--bg);color:var(--txt);padding:34px;max-width:860px;margin:0 auto;line-height:1.85}
    .md h1{font-size:var(--fz-h1,var(--f34));font-weight:800;margin-top:var(--s34);margin-bottom:var(--s13);position:relative;padding-bottom:${Math.round(fontSizes.h1 * 0.24)}px}
    .md h1::after{content:'';position:absolute;bottom:0;left:0;width:${Math.round(fontSizes.h1 * 1.6)}px;height:${Math.max(2, Math.round(fontSizes.h1 * 0.09))}px;background:linear-gradient(90deg,var(--gb),var(--gg));border-radius:99px}
    .md h2{font-size:var(--fz-h2,var(--f21));font-weight:700;margin-top:var(--s34);margin-bottom:var(--s8);display:flex;align-items:center;gap:var(--s8)}
    .md h2::before{content:'';display:block;width:${Math.max(3, Math.round(fontSizes.h2 * 0.22))}px;height:${Math.round(fontSizes.h2 * 0.9)}px;background:var(--gr);border-radius:99px;flex-shrink:0}
    .md h3{font-size:var(--fz-h3,16px);font-weight:700;margin-top:var(--s21);margin-bottom:var(--s5)}
    .md p{font-size:var(--fz-body,var(--f13));line-height:1.85;margin-bottom:var(--s13)}
    .md .katex{font-size:var(--fz-latex,1.08em)!important}
    .md .mermaid svg text,.md .mermaid svg .label{font-size:var(--fz-mmd,inherit)!important}
    .md code{font-family:var(--mono);font-size:var(--fz-code,12px);background:var(--gbt);color:var(--gb);border-radius:var(--r5);padding:2px var(--s5)}
    .md pre code{font-size:var(--fz-code,12.5px)!important}
    .md a {color: var(--gb);text-decoration: none;border-bottom: 1.5px solid var(--gbt);}
    .md a:visited{color:var(--gb)}
    .md a:hover{border-bottom-color:var(--gb)}
    .md ul,.md ol{padding-left:var(--s21);margin-bottom:var(--s13)}
    .md li{font-size:var(--f13);line-height:1.85;margin-bottom:var(--s5)}
    .md ul li::marker{color:var(--gb);font-weight:700}
    .md ol li::marker{color:var(--gr);font-weight:700}
    .md code{font-family:var(--mono);font-size:12px;background:var(--gbt);color:var(--gb);border-radius:var(--r5);padding:2px var(--s5)}
    .md pre{background:#202124;color:#E8EAED;border-radius:var(--r13);margin-bottom:var(--s21);border-top:3px solid var(--gb);overflow:hidden;position:relative;padding:0}
    .pre-header{display:flex;align-items:center;gap:8px;padding:5px 8px;background:#2a2d31;border-bottom:1px solid rgba(255,255,255,.07);position:relative;flex-shrink:0;min-height:34px}
    .pre-header::after{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,var(--gr) 0 33.3%,var(--gy) 33.3% 66.6%,var(--gg) 66.6%);opacity:.7}
    .pre-body{overflow-x:auto;padding:var(--s21)}
    .pre-body--diff{padding:var(--s13) 0}
    .pre-body::-webkit-scrollbar{height:5px}
    .pre-body::-webkit-scrollbar-thumb{background:rgba(255,255,255,.15);border-radius:99px}
    .pre-body::-webkit-scrollbar-track{background:transparent}
    .lang-badge{padding:2px 8px;border-radius:5px;font-family:var(--mono);font-size:10px;font-weight:600;letter-spacing:.06em;background:rgba(255,255,255,.1);color:#9AA0A6;line-height:1.6;pointer-events:none;user-select:none;flex-shrink:0}
    .md pre code{background:transparent;color:inherit;padding:0;font-size:12.5px;white-space:pre}
    .diff-wrap{display:block;min-width:max-content}
    .diff-add,.diff-del,.diff-meta,.diff-ctx{display:block;padding:0 var(--s21) 0 calc(var(--s8)*4 + 13px);position:relative;line-height:1.6;white-space:pre;min-width:100%;box-sizing:border-box}
    .diff-add::before,.diff-del::before,.diff-meta::before,.diff-ctx::before{content:attr(data-mark);position:absolute;left:8px;width:13px;text-align:center;font-weight:700;font-size:11px;line-height:1.6;user-select:none;pointer-events:none;opacity:.9}
    .diff-add{background:rgba(52,168,83,.13);color:#B4EFCA;border-left:3px solid #34A853}
    .diff-add::before{color:#34A853}
    .diff-del{background:rgba(234,67,53,.13);color:#FFADA6;border-left:3px solid #EA4335}
    .diff-del::before{color:#EA4335}
    .diff-meta{background:rgba(66,133,244,.1);color:#8AB4F8;border-left:3px solid #4285F4;font-style:italic;opacity:.85}
    .diff-meta::before{color:#4285F4}
    .diff-ctx{color:#9AA0A6;border-left:3px solid transparent}
    .diff-ctx::before{color:#5F6368;opacity:.6}
    .md .mermaid-wrap{background:var(--bg);border:1.5px solid var(--gb);border-top:3px solid var(--gb);border-radius:var(--r13);padding:var(--s34) var(--s21) var(--s21);margin-bottom:var(--s21);overflow-x:auto;overflow-y:hidden;text-align:center;position:relative;box-shadow:0 2px 12px rgba(66,133,244,.08)}
    .md .mermaid{display:block;min-width:80px;max-width:100%}
    .md .mermaid svg{display:block;max-width:100%;height:auto;overflow:hidden;margin:0 auto;font-family:var(--font) !important}
    .md .mermaid svg text,.md .mermaid svg .label{font-family:var(--font) !important}
    .md .mermaid svg .edgePath .path{stroke-width:1.5px}
    .md .tikz-wrap{text-align:center;margin-bottom:var(--s21);overflow-x:auto}
    .md .tikz-wrap svg{display:inline-block;max-width:100%;height:auto}
    .md .mermaid-error{background:var(--grt);border:1px solid var(--gr);border-radius:var(--r8);padding:var(--s13) var(--s21);color:var(--gr);font-size:12px;font-family:var(--mono);text-align:left}
    .md blockquote{border-left:3px solid var(--gy);background:var(--gyt);padding:var(--s13) var(--s21);border-radius:0 var(--r8) var(--r8) 0;margin-bottom:var(--s13);color:var(--mut);font-style:italic}
    .md table{width:100%;border-collapse:collapse;margin-bottom:var(--s21);font-size:var(--f13);background:#fff}
    .md th{background:var(--gbt);color:var(--gb);padding:var(--s8) var(--s13);font-weight:700;text-align:left}
    .md th:first-child{border-radius:var(--r8) 0 0 0}
    .md th:last-child{border-radius:0 var(--r8) 0 0}
    .md td{padding:var(--s8) var(--s13);border-bottom:1px solid var(--bord);background:#fff}
    .md tr:last-child td{border-bottom:none}
    .md tr:hover td{background:var(--surf)}
    .ztbl{width:100%;border-collapse:separate;border-spacing:0;margin-bottom:var(--s21);font-size:var(--f13);overflow:hidden;border-radius:var(--r8)}
    .ztbl thead tr th{background:var(--gbt);color:var(--gb);padding:var(--s8) var(--s13);font-weight:700;text-align:left;border-bottom:2px solid var(--gb)}
    .ztbl tbody tr td{padding:var(--s8) var(--s13);border-bottom:1px solid var(--bord)}
    .ztbl tbody tr:last-child td{border-bottom:none}
    .ztbl.stripe tbody tr:nth-child(even) td{background:var(--surf)}
    .ztbl.border td,.ztbl.border th{border:1px solid var(--bord)}
    .ztbl tbody tr:hover td{background:rgba(66,133,244,.05)}
    .ztbl td.bg-b,.ztbl th.bg-b{background:var(--gbt)!important;color:var(--gb)!important}
    .ztbl td.bg-r,.ztbl th.bg-r{background:var(--grt)!important;color:var(--gr)!important}
    .ztbl td.bg-y,.ztbl th.bg-y{background:var(--gyt)!important;color:#7A4F00!important}
    .ztbl td.bg-g,.ztbl th.bg-g{background:var(--ggt)!important;color:var(--gg)!important}
    .ztbl td.al,.ztbl th.al{text-align:left}
    .ztbl td.ac,.ztbl th.ac{text-align:center}
    .ztbl td.ar,.ztbl th.ar{text-align:right}
    .ztbl td.fw,.ztbl th.fw{font-weight:700}
    .md hr{border:none;height:1.5px;background:var(--bord);margin:var(--s34) 0}
    .md strong{font-weight:700}
    .md img{max-width:100%;border-radius:var(--r13)}
    .md input[type=checkbox]{accent-color:var(--gg)}
    .md .katex-display{overflow-x:auto;overflow-y:hidden;padding:var(--s13) 0;margin:var(--s13) 0}
    .md .katex{font-size:1.08em}
    .md .katex-display>.katex{
      background:linear-gradient(135deg,var(--gbt) 0%,#f0f4ff 100%);
      border:1.5px solid var(--gb);border-left:4px solid var(--gb);
      border-radius:var(--r8);padding:var(--s21) var(--s34);display:block;overflow-x:auto;
      box-shadow:0 2px 8px rgba(66,133,244,.08)
    }
    .md .katex:not(.katex-display .katex){padding:1px 4px}
  `;

  const clone = mo.cloneNode(true);
  clone.querySelectorAll('.cpbtn').forEach(b => b.remove());
  // TikZ уже нарисован в SVG; незаконченные компиляции в экспорт не попадают
  clone.querySelectorAll('script[type="text/tikz"]').forEach(n => n.remove());
  const tikzFonts = clone.querySelector('.tikz-wrap')
    ? `<link rel="stylesheet" href="${TIKZJAX_BASE}/fonts.css">\n`
    : '';
  clone.querySelectorAll('.mermaid').forEach(node => {
    const src = node.getAttribute('data-src') || node.dataset.src;
    if (src) {
      node.innerHTML = src;
      node.removeAttribute('data-processed');
    }
  });
  const bodyInner = clone.outerHTML;
  return `<!DOCTYPE html>
<!--
  Złoty MD — © 2026 Rafych (https://github.com/Rafych) and Hiromichi (https://github.com/hiromichipixel)
  MIT License — https://github.com/Rafych/ZlotyMD/blob/main/LICENSE

  Third-party components used (loaded at runtime from a CDN; none of their files are copied into this file):

  marked v9.1.6
    Copyright (c) 2011-2018, Christopher Jeffrey (https://github.com/markedjs/marked)
    MIT License — https://github.com/markedjs/marked/blob/master/LICENSE

  KaTeX v0.16.9
    Copyright (c) 2013-2020 Khan Academy and other contributors
    MIT License — https://github.com/KaTeX/KaTeX/blob/main/LICENSE
    KaTeX fonts: SIL Open Font License 1.1 (fonts derived from AMS Fonts / Computer Modern) — https://github.com/KaTeX/KaTeX/blob/main/LICENSE

  Mermaid v10.6.1
    Copyright (c) 2014-2023 Knut Sveidqvist and contributors
    MIT License — https://github.com/mermaid-js/mermaid/blob/develop/LICENSE
    The distributed bundle includes dependencies (e.g. d3, dagre-d3-es, DOMPurify, dayjs, khroma)
    under their own permissive licenses (MIT / ISC / BSD-3-Clause / Apache-2.0 / MPL-2.0).

  Google Sans
    Copyright (c) Google Inc.
    SIL Open Font License 1.1 — https://openfontlicense.org/open-font-license-official-text/

  JetBrains Mono v2020
    Copyright (c) 2020 JetBrains s.r.o.
    SIL Open Font License 1.1 — https://github.com/JetBrains/JetBrainsMono/blob/master/OFL.txt

  TikZJax (@drgrice1/tikzjax v1.0.0-beta24) — loaded only when a document contains TikZ
    Copyright (c) Jim Fowler, Glenn Rice and contributors
    GPL-3.0-or-later — https://github.com/drgrice1/tikzjax
    It bundles TeX and TeX packages (e.g. PGF/TikZ, pgfplots) under their own licenses.

  Content delivery / font services (no code included): cdnjs (Cloudflare), jsDelivr, Google Fonts.

  Optional AI features call external APIs with the user's own key (no code included; each
  provider's terms of service apply): Anthropic API, Google Gemini API.
-->
<html lang="${currentLang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<link rel="icon" type="image/svg+xml" href="${FAVICON_HREF}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Google+Sans:ital,opsz,wght@0,17..18,400..700;1,17..18,400..700&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css">
${tikzFonts}<style>${PREVIEW_CSS}</style>
</head>
<body>
${bodyInner}
<script src="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.js"><\/script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/mermaid/10.6.1/mermaid.min.js"><\/script>
<script>
if(typeof mermaid!=='undefined'){
  mermaid.initialize({startOnLoad:false,securityLevel:'loose',theme:'base',
    themeVariables:{primaryColor:'#E8F0FE',primaryTextColor:'#1a1a2e',primaryBorderColor:'#4285F4',
    secondaryColor:'#E6F4EA',tertiaryColor:'#FEF7E0',background:'#ffffff',
    mainBkg:'#E8F0FE',nodeBorder:'#4285F4',lineColor:'#5F6368',
    edgeLabelBackground:'#ffffff',
    noteBkgColor:'#FEF7E0',noteBorderColor:'#FBBC04'},
    flowchart:{htmlLabels:true,curve:'basis'},
    pie:{useMaxWidth:true}});
  (async function(){
    var nodes=Array.from(document.querySelectorAll('.mermaid'));
    for(var idx=0;idx<nodes.length;idx++){
      var node=nodes[idx];
      node.id='mmd-'+Date.now()+'-'+idx+'-'+Math.random().toString(36).slice(2,7);
      try{
        await mermaid.run({nodes:[node],suppressErrors:true});
        node.querySelectorAll('svg').forEach(function(svg){
          var vb=svg.getAttribute('viewBox');
          if(!vb)return;
          var parts=vb.trim().split(/\s+/);
          var vw=parseFloat(parts[2]),vh=parseFloat(parts[3]);
          if(vw>0&&vh>0&&!parseFloat(svg.getAttribute('height')||'0')){
            svg.setAttribute('height',vh);
            if(!parseFloat(svg.getAttribute('width')||'0'))svg.setAttribute('width',vw);
          }
        });
      }catch(e){}
    }
  })();
}
<\/script>
</body>
</html>`;
}

// Открывает предпросмотр в новом окне браузера (для печати/просмотра)
function openPreviewWindow() {
  if (!ed.value.trim()) return;
  const html = buildPreviewHTML();
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
  const win = window.open(url, '_blank');
  if (!win) { URL.revokeObjectURL(url); return; }
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

let dlSelected = new Set();
const DL_OPT_IDS = { html: 'dlOptHtml', pdf: 'dlOptPdf', zmd: 'dlOptZmd', md: 'dlOptMd' };

// Открывает модальное окно выбора форматов для скачивания (HTML/PDF/ZMD/MD)
function openDownloadMenu() {
  if (!ed.value.trim()) return;
  const overlay = document.getElementById('dlOverlay');
  const modal = document.getElementById('dlModal');
  dlSelected.clear();
  document.querySelectorAll('#dlModal .dl-opt').forEach(el => el.classList.remove('selected'));
  _updateDlConfirmState();
  overlay.classList.add('open');
  modal.classList.add('open');
  _syncDownloadMenuI18n();
}
function closeDownloadMenu() {
  document.getElementById('dlOverlay').classList.remove('open');
  document.getElementById('dlModal').classList.remove('open');
}
function _syncDownloadMenuI18n() {
  const t = LANGS[currentLang] || LANGS['en'];
  const els = document.querySelectorAll('#dlModal [data-i18n]');
  els.forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key]) el.textContent = t[key];
  });
}
function toggleDlOpt(key) {
  const btn = document.getElementById(DL_OPT_IDS[key]);
  if (!btn) return;
  if (dlSelected.has(key)) {
    dlSelected.delete(key);
    btn.classList.remove('selected');
  } else {
    dlSelected.add(key);
    btn.classList.add('selected');
  }
  _updateDlConfirmState();
}
function _updateDlConfirmState() {
  const btn = document.getElementById('dlConfirmBtn');
  if (btn) btn.disabled = dlSelected.size === 0;
}
// Выполняет скачивание нескольких выбранных форматов с небольшой задержкой между ними
function executeDlDownload() {
  if (dlSelected.size === 0) return;
  const queue = ['html', 'md', 'zmd', 'pdf'].filter(k => dlSelected.has(k));
  closeDownloadMenu();
  queue.forEach((key, i) => {
    setTimeout(() => {
      if (key === 'html') downloadHTML();
      else if (key === 'md') downloadMD();
      else if (key === 'zmd') downloadZMD();
      else if (key === 'pdf') executePdfDownload();
    }, i * 400);
  });
}

const ZMD_FM_OPEN = '<!--zmd:meta';
const ZMD_FM_CLOSE = 'zmd:meta-->';

// Формирует служебные метаданные документа (имя, язык, размеры шрифта) в виде HTML-комментария
function buildZmdMeta() {
  return {
    zmdVersion: 1,
    name: getDocTitle(),
    isDefaultName: currentDocMeta ? !!currentDocMeta.isDefaultName : true,
    fontSizes: { ...fontSizes },
    createdAt: (currentDocMeta && currentDocMeta.createdAt) || Date.now(),
    updatedAt: Date.now()
  };
}

// Сохраняет документ в формате .zmd (собственный формат с метаданными)
function downloadZMD() {
  if (!ed.value.trim()) return;
  const title = getDocTitle();
  const meta = buildZmdMeta();
  const zmd = `${ZMD_FM_OPEN}\n${JSON.stringify(meta, null, 2)}\n${ZMD_FM_CLOSE}\n\n${ed.value}`;
  const blob = new Blob([zmd], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = title.replace(/[\\/:*?"<>|]/g, '_') + '.zmd';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

// Сохраняет документ в стандартном формате .md (без спецразметки Złoty MD)
function downloadMD() {
  if (!ed.value.trim()) return;
  const title = getDocTitle();
  const standard = toStandardMarkdown(ed.value);
  const blob = new Blob([standard], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = title.replace(/[\\/:*?"<>|]/g, '_') + '.md';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

// Убирает нестандартные атрибуты размера у изображений при экспорте в обычный Markdown
function _mdConvertImageAttrs(v) {
  return v.replace(/!\[([^\]]*)\]\(([^)]+)\)\{([^}]+)\}/g, (_, alt, src) => `![${alt}](${src})`);
}

// Преобразует расширенные таблицы Złoty MD в обычные GFM-таблицы
function _mdConvertCustomTables(v) {
  return v.replace(/:::table([^\n]*)\n([\s\S]*?):::/g, (_, opts, body) => {
    const lines = body
      .trim()
      .split('\n')
      .filter(l => l.trim().startsWith('|'));
    if (!lines.length) return '';
    const stripCell = cell => cell.replace(/\{[^}]*\}/g, '').trim();
    const toRow = line => {
      const cells = line.split('|').slice(1, -1).map(stripCell);
      return '| ' + cells.join(' | ') + ' |';
    };
    const colCount = lines[0].split('|').slice(1, -1).length;
    const header = toRow(lines[0]);
    const sep = '| ' + Array(colCount).fill('---').join(' | ') + ' |';
    const bodyRows = lines.slice(1).map(toRow);
    return [header, sep, ...bodyRows].join('\n');
  });
}

// Точка входа конвертации в стандартный Markdown перед сохранением .md
function toStandardMarkdown(v) {
  let out = v;
  out = _mdConvertCustomTables(out);
  out = _mdConvertImageAttrs(out);
  return out;
}

// Разбирает текст .zmd-файла: отделяет метаданные от содержимого документа
function parseZmdText(text) {
  if (text.startsWith(ZMD_FM_OPEN)) {
    const closeIdx = text.indexOf(ZMD_FM_CLOSE);
    if (closeIdx !== -1) {
      const jsonStr = text.slice(ZMD_FM_OPEN.length, closeIdx).trim();
      const rest = text.slice(closeIdx + ZMD_FM_CLOSE.length).replace(/^\n+/, '');
      try {
        const meta = JSON.parse(jsonStr);
        return { meta, content: rest };
      } catch (e) {
        return { meta: null, content: text };
      }
    }
  }
  return { meta: null, content: text };
}

// Обработчик клика по кнопке «Открыть файл»
function onOpenFileClick() {
  const input = document.getElementById('fileOpenInput');
  input.value = '';
  input.click();
}

// Читает выбранный пользователем файл (.md/.zmd/.txt и др.) и загружает его в редактор
async function handleFileOpenInput(evt) {
  const file = evt.target.files && evt.target.files[0];
  if (!file) return;
  if (!(await confirmAiNav())) return;
  const stopBusy = startBusy('loadingFile'); // индикатор на время чтения и открытия файла
  try {
    await openFileObject(file);
  } finally {
    stopBusy();
  }
}

// Расширения, с которыми приложение регистрируется в ОС (должны совпадать с file_handlers в manifest.webmanifest)
const ZMD_FILE_EXT_RE = /\.(zmd|md|markdown|text|txt)$/i;

// Открывает объект File как новый документ: общий код для диалога «Открыть файл» и запуска из ОС (PWA file handler)
async function openFileObject(file) {
  let text;
  try {
    text = await file.text();
  } catch (e) {
    console.warn('Failed to read file:', e);
    await showErrorModal(tr('fileOpenFailed').replace('{name}', file.name || ''));
    return;
  }
  const { meta, content } = parseZmdText(text);
  const baseName = file.name.replace(ZMD_FILE_EXT_RE, '');

  await flushCurrentDocSave();
  const now = Date.now();
  const id = genDocId();
  const data = {
    name: (meta && meta.name) || baseName || untitledDocName(),
    isDefaultName: meta ? !!meta.isDefaultName : false,
    content: content,
    fontSizes: Object.assign({ ...FONT_DEFAULTS }, (meta && meta.fontSizes) || {}),
    scrollEd: 0,
    scrollPv: 0,
    createdAt: (meta && meta.createdAt) || now,
    updatedAt: now
  };
  await persistDocRecord(id, data);
  docIndex.unshift({
    id,
    name: data.name,
    isDefaultName: data.isDefaultName,
    createdAt: data.createdAt,
    updatedAt: now
  });
  await persistDocIndex();
  await switchToDoc(id);
  closeDocsPanel();
}

// PWA: обработка файлов, которые ОС передаёт приложению («Открыть с помощью» / двойной клик по файлу)
let _launchFilesChain = Promise.resolve(); // очередь, чтобы несколько файлов открывались строго по одному
function initLaunchQueue() {
  if (!('launchQueue' in window) || !window.launchQueue || typeof window.launchQueue.setConsumer !== 'function') return;
  window.launchQueue.setConsumer(launchParams => {
    if (!launchParams || !launchParams.files || !launchParams.files.length) return;
    const handles = Array.from(launchParams.files);
    // Индикатор включаем сразу при получении файлов: приложение может ещё инициализироваться
    _launchFilesChain = _launchFilesChain.then(async () => {
      let stopBusy = startBusy('loadingFile');
      try {
        await appReady; // ждём, пока загрузятся язык, настройки и список документов
        for (const handle of handles) {
          let file = null;
          try {
            file = await handle.getFile();
          } catch (e) {
            console.warn('Failed to get launched file:', e);
            stopBusy(); // не держим индикатор под модальным окном ошибки
            await showErrorModal(tr('fileOpenFailed').replace('{name}', handle.name || ''));
            stopBusy = startBusy('loadingFile');
            continue;
          }
          stopBusy(); // и под диалогом подтверждения
          const proceed = await confirmAiNav();
          stopBusy = startBusy('loadingFile');
          if (!proceed) break;
          await openFileObject(file);
        }
      } finally {
        stopBusy();
      }
    }).catch(err => console.warn('Launch queue error:', err));
  });
}
// Определяет заголовок документа: явное имя или первый заголовок H1
function getDocTitle() {
  const name = ((currentDocMeta && currentDocMeta.name) || '').trim();
  const isDefaultName = !name || (currentDocMeta && currentDocMeta.isDefaultName);
  if (!isDefaultName) return name;
  return (ed.value.match(/^#\s+(.+)/m) || [])[1]?.trim() || name || 'document';
}
// Скачивает документ как автономный HTML-файл
function downloadHTML() {
  if (!ed.value.trim()) return;
  const title = getDocTitle();
  const html = buildPreviewHTML(title);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = title.replace(/[\\/:*?"<>|]/g, '_') + '.html';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}
// Готовит и запускает диалог печати/экспорта в PDF
function executePdfDownload() {
  const title = getDocTitle();

  const pdfCSS = `
    @page{margin:20mm}
    body{font-family:'Google Sans',sans-serif;background:#fff;color:#202124;padding:0;max-width:none;margin:0;line-height:1.85}
    @media print{body{padding:0}}
  `;

  const baseHTML = buildPreviewHTML(title);
  const pdfHTML = baseHTML.replace('</style>', pdfCSS + '</style>');

  let iframe = document.getElementById('_pdfIframe');
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = '_pdfIframe';
    iframe.style.cssText =
      'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:none;visibility:hidden';
    document.body.appendChild(iframe);
  }

  iframe.onload = () => {
    setTimeout(() => {
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      const s = doc.createElement('script');
      s.textContent = `window.print();`;
      doc.body.appendChild(s);
    }, 800);
  };

  iframe.srcdoc = pdfHTML;
}

const COPY_SVG = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="4" width="9" height="11" rx="1.5"/><path d="M3 12H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v1"/></svg>`;
const CHECK_SVG = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="2 9 6 13 14 4"/></svg>`;

const LANG_NAMES = {
  javascript: 'JavaScript',
  js: 'JavaScript',
  typescript: 'TypeScript',
  ts: 'TypeScript',
  python: 'Python',
  py: 'Python',
  ruby: 'Ruby',
  rb: 'Ruby',
  java: 'Java',
  go: 'Go',
  rust: 'Rust',
  rs: 'Rust',
  cpp: 'C++',
  c: 'C',
  csharp: 'C#',
  cs: 'C#',
  php: 'PHP',
  swift: 'Swift',
  kotlin: 'Kotlin',
  kt: 'Kotlin',
  html: 'HTML',
  css: 'CSS',
  scss: 'SCSS',
  sass: 'SCSS',
  json: 'JSON',
  yaml: 'YAML',
  yml: 'YAML',
  toml: 'TOML',
  xml: 'XML',
  sql: 'SQL',
  graphql: 'GraphQL',
  sh: 'Shell',
  bash: 'Bash',
  zsh: 'Zsh',
  fish: 'Fish',
  powershell: 'PowerShell',
  diff: 'diff',
  patch: 'diff',
  tex: 'LaTeX',
  latex: 'LaTeX',
  markdown: 'Markdown',
  md: 'Markdown',
  r: 'R',
  julia: 'Julia',
  scala: 'Scala',
  haskell: 'Haskell',
  elixir: 'Elixir',
  erlang: 'Erlang',
  dart: 'Dart',
  lua: 'Lua',
  vim: 'Vim',
  dockerfile: 'Dockerfile'
};

// Экранирование спецсимволов HTML для безопасного вывода
function _esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Применяет diff-разметку (добавлено/удалено) к блоку кода
function applyDiff(pre, code) {
  const raw = (code.textContent || '').replace(/\n$/, '');
  const lines = raw.split('\n');
  const inner = lines
    .map(line => {
      if (/^\+\+\+|^---/.test(line)) {
        return `<span class="diff-meta" data-mark="~">${_esc(line)}</span>`;
      } else if (line.startsWith('+')) {
        return `<span class="diff-add" data-mark="+">${_esc(line.slice(1))}</span>`;
      } else if (line.startsWith('-')) {
        return `<span class="diff-del" data-mark="−">${_esc(line.slice(1))}</span>`;
      } else if (line.startsWith('@@')) {
        return `<span class="diff-meta" data-mark="@">${_esc(line)}</span>`;
      } else {
        return `<span class="diff-ctx" data-mark=" ">${_esc(line)}</span>`;
      }
    })
    .join('');
  code.innerHTML = `<span class="diff-wrap">${inner}</span>`;
}

// Добавляет кнопки копирования к каждому блоку кода в превью
function addCopyBtns() {
  mo.querySelectorAll('pre').forEach(pre => {
    if (pre.querySelector('.pre-header')) return;
    const code = pre.querySelector('code');

    const cls = code ? (code.className.match(/language-(\S+)/) || [])[1] : '';

    const diffLangMatch = cls && cls.match(/^diff_(.+)$/i);
    const isDiff = cls === 'diff' || cls === 'patch' || !!diffLangMatch;

    const badgeCls = diffLangMatch ? diffLangMatch[1].toLowerCase() : (cls || '').toLowerCase();
    const badgeLabel = diffLangMatch
      ? LANG_NAMES[badgeCls] || diffLangMatch[1]
      : cls
        ? LANG_NAMES[badgeCls] || cls
        : '';

    const header = document.createElement('div');
    header.className = 'pre-header';

    if (badgeLabel) {
      const badge = document.createElement('span');
      badge.className = 'lang-badge';
      badge.textContent = badgeLabel;
      header.appendChild(badge);
    }

    const btn = document.createElement('button');
    btn.className = 'cpbtn';
    btn.innerHTML = COPY_SVG + (LANGS[currentLang]?.codeCopy || 'Copy');
    btn.addEventListener('click', () => {
      const text = code ? code.innerText : pre.innerText;
      navigator.clipboard.writeText(text).then(() => {
        btn.innerHTML = CHECK_SVG + (LANGS[currentLang]?.codeCopied || 'Copied');
        btn.classList.add('ok');
        setTimeout(() => {
          btn.innerHTML = COPY_SVG + (LANGS[currentLang]?.codeCopy || 'Copy');
          btn.classList.remove('ok');
        }, 2000);
      });
    });
    header.appendChild(btn);

    const body = document.createElement('div');
    body.className = isDiff ? 'pre-body pre-body--diff' : 'pre-body';
    while (pre.firstChild) body.appendChild(pre.firstChild);

    pre.appendChild(header);
    pre.appendChild(body);

    if (isDiff && code) applyDiff(pre, code);
  });
}

const ESC_TOKEN = '\x02ESC';
const ESC_END = '\x03';
let _escStore = [];

const MD_SPECIAL = /\\(\\|[!\"#$%&'()*+,\-./:;<=>?@[\\\\]^_`{|}~])/g;

// Защищает экранированные Markdown-символы от обработки парсером (временная замена на токены)
function _protectEscapes(v) {
  _escStore = [];

  const OPAQUE_RE = /(\x02[^\x03]*\x03)/g;
  const parts = v.split(OPAQUE_RE);

  return parts
    .map((part, idx) => {
      if (idx % 2 === 1) return part;

      const CODE_RE = /(`+)([\s\S]*?)\1/g;
      const codeSlots = [];
      const CS = '\x04C';
      const CE = '\x05';
      let p = part.replace(CODE_RE, full => {
        codeSlots.push(full);
        return CS + (codeSlots.length - 1) + CE;
      });

      p = p.replace(MD_SPECIAL, (_, ch) => {
        const literal = ch === '\\' ? '\\' : ch;
        _escStore.push(literal);
        return ESC_TOKEN + (_escStore.length - 1) + ESC_END;
      });

      p = p.replace(new RegExp('\\x04C(\\d+)\\x05', 'g'), (_, i) => codeSlots[parseInt(i)]);
      return p;
    })
    .join('');
}

// Восстанавливает ранее защищённые экранированные символы после рендеринга
function _restoreEscapes(html) {
  return html.replace(new RegExp('\\x02ESC(\\d+)\\x03', 'g'), (_, i) => {
    const ch = _escStore[parseInt(i)];
    return ch.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  });
}

const LATEX_TOKEN = '\x02LTX';
const LATEX_END = '\x03';
let _latexStore = [];

const DISPLAY_ENVS = [
  'equation',
  'equation\\*',
  'align',
  'align\\*',
  'gather',
  'gather\\*',
  'multline',
  'multline\\*',
  'eqnarray',
  'eqnarray\\*',
  'flalign',
  'flalign\\*',
  'alignat',
  'alignat\\*',
  'split'
].join('|');
const DISPLAY_ENV_RE = new RegExp(
  `\\\\begin\\{(${DISPLAY_ENVS})\\}([\\s\\S]+?)\\\\end\\{\\1\\}`,
  'g'
);

// Рендерит формулу через KaTeX (инлайн или блочный режим)
function _katexRender(math, displayMode) {
  if (typeof katex === 'undefined')
    return displayMode ? `<div>$$${math}$$</div>` : `<span>$${math}$</span>`;
  const el = document.createElement(displayMode ? 'div' : 'span');
  katex.render(math, el, { displayMode, throwOnError: false, output: 'html' });
  return el.outerHTML;
}

// Временно заменяет LaTeX-формулы на токены, чтобы Markdown-парсер их не трогал
function _protectLatex(v) {
  _latexStore = [];
  const push = (type, math) => {
    _latexStore.push({ type, math });
    return LATEX_TOKEN + (_latexStore.length - 1) + LATEX_END;
  };
  v = v.replace(DISPLAY_ENV_RE, (full, env, math) => push('block', full));
  v = v.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => push('block', math));
  v = v.replace(/\\\[([\s\S]+?)\\\]/g, (_, math) => push('block', math));
  v = v.replace(/\\\((.+?)\\\)/g, (_, math) => push('inline', math));
  v = v.replace(/\$([^\$\n]+?)\$/g, (_, math) => push('inline', math));
  return v;
}

// Восстанавливает LaTeX-формулы и рендерит их через KaTeX после обработки Markdown
function _restoreLatex(html) {
  return html.replace(new RegExp(`\\x02LTX(\\d+)\\x03`, 'g'), (_, i) => {
    const { type, math } = _latexStore[parseInt(i)];
    const isEnv = type === 'block' && math.startsWith('\\begin');
    if (isEnv) {
      if (typeof katex === 'undefined') return `<div><code>${math}</code></div>`;
      const el = document.createElement('div');
      katex.render(math, el, { displayMode: true, throwOnError: false, output: 'html' });
      return el.outerHTML;
    }
    return _katexRender(math, type === 'block');
  });
}

// Разбирает LaTeX-документ на структурные блоки (секции, окружения и т.д.)
function _parseLatexDoc(v) {
  v = v.replace(/(?<!\\)%[^\n]*/g, '');

  const pkgs = [];
  (v.match(/\\usepackage(?:\[.*?\])?\{(.+?)\}/g) || []).forEach(m => {
    const n = m.match(/\{(.+?)\}/);
    if (n) n[1].split(',').forEach(p => pkgs.push(p.trim()));
  });

  const bodyMatch = v.match(/\\begin\s*\{document\}([\s\S]*?)\\end\s*\{document\}/);
  let body = bodyMatch ? bodyMatch[1] : v;

  body = body.replace(/\\maketitle/g, '');
  body = body.replace(/\\title\{([\s\S]+?)\}/g, (_, t) => `\n__TITLE__${t.trim()}__ENDTITLE__\n`);
  body = body.replace(
    /\\author\{([\s\S]+?)\}/g,
    (_, a) => `\n__AUTHOR__${a.replace(/\\\\|\\and/g, ', ')}__ENDAUTHOR__\n`
  );
  body = body.replace(/\\date\{([\s\S]*?)\}/g, '');
  body = body.replace(/\\section\*?\{([\s\S]+?)\}/g, (_, t) => `\n\n## ${t}\n`);
  body = body.replace(/\\subsection\*?\{([\s\S]+?)\}/g, (_, t) => `\n\n### ${t}\n`);
  body = body.replace(/\\subsubsection\*?\{([\s\S]+?)\}/g, (_, t) => `\n\n#### ${t}\n`);
  body = body.replace(/\\paragraph\*?\{([\s\S]+?)\}/g, (_, t) => `\n\n**${t}**\n`);
  body = body.replace(/\\label\{[^}]*\}/g, '');
  body = body.replace(/\\ref\{([^}]*)\}/g, (_, r) => `(${r})`);
  body = body.replace(/\\footnote\{([\s\S]+?)\}/g, (_, f) => `^[${f}]`);

  body = body.replace(/\\textbf\{([\s\S]+?)\}/g, (_, t) => `**${t}**`);
  body = body.replace(/\\textit\{([\s\S]+?)\}/g, (_, t) => `*${t}*`);
  body = body.replace(/\\emph\{([\s\S]+?)\}/g, (_, t) => `*${t}*`);
  body = body.replace(/\\underline\{([\s\S]+?)\}/g, (_, t) => `<u>${t}</u>`);
  body = body.replace(/\\texttt\{([\s\S]+?)\}/g, (_, t) => `\`${t}\``);
  body = body.replace(/\\text\{([^}]+)\}/g, (_, t) => `\\text{${t}}`);

  body = body.replace(
    /\\begin\{itemize\}([\s\S]+?)\\end\{itemize\}/g,
    (_, content) => content.replace(/\\item\s*/g, '- ').trim() + '\n'
  );
  body = body.replace(/\\begin\{enumerate\}([\s\S]+?)\\end\{enumerate\}/g, (_, content) => {
    let i = 0;
    return content.replace(/\\item\s*/g, () => `${++i}. `).trim() + '\n';
  });
  body = body.replace(
    /\\begin\{description\}([\s\S]+?)\\end\{description\}/g,
    (_, content) =>
      content.replace(/\\item\[([^\]]*)\]/g, (_, lbl) => `- **${lbl}**: `).trim() + '\n'
  );

  body = body.replace(
    /\\begin\{verbatim\}([\s\S]+?)\\end\{verbatim\}/g,
    (_, code) => `\n\`\`\`\n${code.trim()}\n\`\`\`\n`
  );

  body = body.replace(/\\(?:vspace|hspace|vskip|hskip)\*?\{[^}]*\}/g, '\n');
  body = body.replace(/\\(?:noindent|smallskip|medskip|bigskip|newpage|clearpage)\b/g, '');
  body = body.replace(/\\\\(\[[\d.]+[a-z]*\])?/g, '  \n');
  body = body.replace(/\\par\b/g, '\n\n');
  body = body.replace(/~~/g, ' ');
  body = body.replace(/~/g, '\u00A0');
  body = body.replace(/---/g, '—');
  body = body.replace(/--/g, '–');
  body = body.replace(/``/g, '\u201C').replace(/''/g, '\u201D');
  body = body.replace(/`/g, '\u2018').replace(/'/g, '\u2019');

  for (let pass = 0; pass < 3; pass++) {
    body = body.replace(/\\(?!begin|end|[([])(?:[a-zA-Z]+)\{([\s\S]+?)\}/g, (_, t) => t);
  }
  body = body.replace(/\\[a-zA-Z]+\b\*?/g, '');
  body = body.replace(/\{|\}/g, '');

  return { body, pkgs };
}

// Рендерит распознанный LaTeX-документ в HTML-разметку
function _renderLatexDoc(v) {
  const { body } = _parseLatexDoc(v);

  let processed = _protectLatex(body);

  processed = processed.replace(/__TITLE__(.+?)__ENDTITLE__/g, (_, t) => `# ${t}`);
  processed = processed.replace(/__AUTHOR__(.+?)__ENDAUTHOR__/g, (_, a) => `*${a}*`);

  processed = _processImageAttrs(processed);
  let html = marked.parse(processed);

  html = _restoreLatex(html);
  return `<div class="latex-doc">${html}</div>`;
}

// Экранирование спецсимволов для встраивания кода Mermaid-диаграммы
function _mmdEsc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Декодирует HTML-сущности обратно в исходные символы
function _decodeHtmlEntities(s) {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}
// Преобразует блоки ```mermaid, сгенерированные marked.js, в разметку для рендеринга диаграмм
function _convertMermaidFences(html) {
  let idx = 0;
  return html.replace(
    /<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g,
    (_, code) => {
      const decoded = _decodeHtmlEntities(code).trim();
      const uid = 'mmd-' + Date.now() + '-' + ++idx + '-' + Math.random().toString(36).slice(2, 7);
      const escaped = _mmdEsc(decoded);
      return (
        '<div class="mermaid-wrap"><div class="mermaid" id="' +
        uid +
        '" data-src="' +
        escaped +
        '">' +
        escaped +
        '</div></div>'
      );
    }
  );
}
// ── TikZ (TikZJax: TeX, скомпилированный в WebAssembly, рисует TikZ в SVG прямо в браузере) ──
const TIKZJAX_BASE = 'https://cdn.jsdelivr.net/npm/@drgrice1/tikzjax@1.0.0-beta24/dist';
// Пакеты, файлы которых есть в сборке TikZJax (tikz и xcolor уже загружены в ядро)
const TIKZ_SUPPORTED_PKGS = new Set([
  'amsbsy', 'amsfonts', 'amsgen', 'amsmath', 'amsopn', 'amssymb', 'amstext', 'array',
  'etoolbox', 'hf-tikz', 'pgfplots', 'tikz-3dplot', 'tikz-cd', 'xparse'
]);
const TIKZ_PRELOADED_PKGS = new Set(['tikz', 'pgf', 'xcolor']);
const TIKZ_ENVS = 'tikzpicture|tikzcd';
const TIKZ_TOKEN = '\x02TKZ';
const TIKZ_END = '\x03';
const TIKZ_DEBOUNCE = 600;
const TIKZ_CACHE_MAX = 200;
let _tikzStore = [];
// ключ → готовый SVG (или { error }) — чтобы не компилировать заново при каждом нажатии клавиши
const _tikzSvgCache = new Map();
// ключ → узел с идущей компиляцией: переносится в новый предпросмотр, а не запускается заново
const _tikzLiveNodes = new Map();
let _tikzTimer = null;
let _tikzJaxPromise = null;

// Разбирает строки преамбулы (\usepackage, \usetikzlibrary и т.п.) в общий объект параметров
function _tikzParsePreamble(text, opts) {
  text.replace(/\\usetikzlibrary\s*\{([^}]*)\}/g, (_, list) => {
    list.split(',').map(s => s.trim()).filter(Boolean).forEach(l => opts.libs.add(l));
    return '';
  });
  text.replace(/\\usepackage\s*(?:\[([^\]]*)\])?\s*\{([^}]*)\}/g, (_, o, list) => {
    list.split(',').map(s => s.trim()).filter(Boolean).forEach(p => {
      if (TIKZ_PRELOADED_PKGS.has(p)) return;
      if (TIKZ_SUPPORTED_PKGS.has(p)) opts.pkgs[p] = o || '';
      else opts.unsupported.add(p);
    });
    return '';
  });
  // Прочие команды преамбулы, которые влияют на рисунки
  (text.match(/^[ \t]*\\(?:pgfplotsset|tikzset|definecolor|colorlet|usepgfplotslibrary|tdplotsetmaincoords|newcommand|renewcommand)\b.*$/gm) || [])
    .forEach(line => opts.pre.push(line.trim()));
  return opts;
}

// TeX в TikZJax не умеет японский/китайский и символы вроде ℃ (нет шрифтов и inputenc).
// Такие куски заменяем прямоугольником той же ширины с «меткой» в цвете, а после
// компиляции ставим на его место SVG-текст. Перед меткой — крошечный прямоугольник
// в текущем цвете, чтобы узнать цвет текста.
const TIKZ_TEXT_MACRO =
  '\\newcommand{\\zmdtext}[3]{\\rule{0.01pt}{0.01pt}\\textcolor[RGB]{3,#1,#2}{\\rule[-0.12em]{#3em}{1em}}}';
const TIKZ_NON_TEX_RE = /[^\u0000-ÿ]+/g;
const TIKZ_WIDE_RE =
  /[ᄀ-ᅟ℀-⅏⺀-꓏가-힣豈-﫿︰-﹏＀-｠￠-￦]/;
const TIKZ_TEXT_FONT =
  "'Noto Serif JP','Hiragino Mincho ProN','Yu Mincho','Noto Serif CJK JP',serif";

// Заменяет недоступные для TeX символы на метки; строки сохраняет в texts
function _tikzMaskText(str, texts) {
  return str.replace(TIKZ_NON_TEX_RE, run => {
    const i = texts.length;
    texts.push(run);
    let w = 0;
    for (const ch of run) w += TIKZ_WIDE_RE.test(ch) ? 1 : 0.6;
    return `\\zmdtext{${200 + (i >> 8)}}{${i & 255}}{${w.toFixed(2)}}`;
  });
}

function _tikzRgb(fill) {
  if (!fill) return null;
  let m = fill.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (m) return m.slice(1).map(h => parseInt(h, 16));
  m = fill.match(/^rgb\(\s*([\d.]+)(%?)\s*,\s*([\d.]+)%?\s*,\s*([\d.]+)%?\s*\)$/i);
  if (!m) return null;
  const k = m[2] ? 2.55 : 1;
  return [m[1], m[3], m[4]].map(v => Math.round(parseFloat(v) * k));
}

// Ставит на место меток настоящий текст (тот же размер, позиция и цвет)
function _tikzApplyText(svg, texts) {
  if (!texts || !texts.length) return;
  const rects = Array.from(svg.querySelectorAll('rect'));
  rects.forEach((r, k) => {
    const c = _tikzRgb(r.getAttribute('fill'));
    if (!c || c[0] !== 3 || c[1] < 200) return;
    const str = texts[(c[1] - 200) * 256 + c[2]];
    if (str == null) return;
    let color = '#000';
    const probe = rects[k - 1];
    if (probe && parseFloat(probe.getAttribute('width')) < 0.1 && parseFloat(probe.getAttribute('height')) < 0.1) {
      color = probe.getAttribute('fill') || color;
      probe.remove();
    }
    const x = parseFloat(r.getAttribute('x'));
    const y = parseFloat(r.getAttribute('y'));
    const w = parseFloat(r.getAttribute('width'));
    const h = parseFloat(r.getAttribute('height'));
    const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    t.setAttribute('x', x);
    t.setAttribute('y', y + h * 0.88);
    t.setAttribute('font-size', h);
    t.setAttribute('textLength', w);
    t.setAttribute('lengthAdjust', 'spacingAndGlyphs');
    t.setAttribute('fill', color);
    t.setAttribute('font-family', TIKZ_TEXT_FONT);
    if (r.getAttribute('transform')) t.setAttribute('transform', r.getAttribute('transform'));
    t.textContent = str;
    r.replaceWith(t);
  });
}

function _tikzEmptyOpts() {
  return { libs: new Set(), pkgs: {}, pre: [], unsupported: new Set() };
}

// Регистрирует один рисунок и возвращает токен-заглушку для Markdown
function _tikzPush(code, docOpts) {
  const opts = _tikzEmptyOpts();
  docOpts.libs.forEach(l => opts.libs.add(l));
  Object.assign(opts.pkgs, docOpts.pkgs);
  opts.pre.push(...docOpts.pre);
  docOpts.unsupported.forEach(p => opts.unsupported.add(p));

  let body = code.trim();
  // Всё, что стоит до первого \begin{...}, — это преамбула самого блока
  const firstEnv = body.search(/\\begin\s*\{/);
  if (firstEnv > 0) {
    const head = body.slice(0, firstEnv);
    _tikzParsePreamble(head, opts);
    const rest = head
      .replace(/\\usetikzlibrary\s*\{[^}]*\}/g, '')
      .replace(/\\usepackage\s*(?:\[[^\]]*\])?\s*\{[^}]*\}/g, '');
    const pre = rest.split('\n').map(l => l.trim()).filter(l => l && !opts.pre.includes(l));
    opts.pre.push(...pre);
    body = body.slice(firstEnv);
  }
  // Голые команды без окружения оборачиваем в tikzpicture
  if (!/\\begin\s*\{/.test(body)) body = `\\begin{tikzpicture}\n${body}\n\\end{tikzpicture}`;
  // Пакеты, без которых окружение не скомпилируется
  if (/\\begin\s*\{tikzcd\}/.test(body)) opts.pkgs['tikz-cd'] ??= '';
  if (/\\begin\s*\{(?:axis|semilogxaxis|semilogyaxis|loglogaxis|polaraxis)\}|\\addplot/.test(body))
    opts.pkgs.pgfplots ??= '';
  if (/\\tdplot/.test(body)) opts.pkgs['tikz-3dplot'] ??= '';

  const texts = [];
  body = _tikzMaskText(body, texts);
  let pre = opts.pre.map(l => _tikzMaskText(l, texts));
  if (texts.length) pre = [TIKZ_TEXT_MACRO, ...pre];

  _tikzStore.push({
    src: body,
    libs: [...opts.libs].sort().join(','),
    pkgs: opts.pkgs,
    pre: pre.join('\n'),
    texts,
    unsupported: [...opts.unsupported]
  });
  return `\n\n${TIKZ_TOKEN}${_tikzStore.length - 1}${TIKZ_END}\n\n`;
}

// Применяет fn только к частям текста вне блоков кода
function _tikzOutsideCode(text, fn) {
  return text
    .split(/(```[\s\S]*?```|`[^`\n]+`)/g)
    .map((part, i) => (i % 2 ? part : fn(part)))
    .join('');
}

// Markdown: ```tikz-блоки и «голые» \begin{tikzpicture}/\begin{tikzcd} заменяет токенами
function _protectTikz(v) {
  const hasFence = /^```tikz[ \t]*$/m.test(v);
  const envRe = new RegExp(`\\\\begin\\s*\\{(${TIKZ_ENVS})\\}[\\s\\S]*?\\\\end\\s*\\{\\1\\}`, 'g');
  if (!hasFence && !envRe.test(v)) return v;
  envRe.lastIndex = 0;

  // \usetikzlibrary / \usepackage вне кода действуют на все рисунки документа
  const docOpts = _tikzEmptyOpts();
  v = _tikzOutsideCode(v, part =>
    part.replace(/^[ \t]*\\(?:usetikzlibrary|usepackage)\b[^\n]*$/gm, line => {
      _tikzParsePreamble(line, docOpts);
      return '';
    })
  );
  v = v.replace(/^```tikz[ \t]*\n([\s\S]*?)^```[ \t]*$/gm, (_, code) => _tikzPush(code, docOpts));
  v = _tikzOutsideCode(v, part => part.replace(envRe, full => _tikzPush(full, docOpts)));
  return v;
}

// LaTeX-документ: окружения tikzpicture/tikzcd с учётом преамбулы документа
function _protectTikzLatexDoc(v) {
  const envRe = new RegExp(`\\\\begin\\s*\\{(${TIKZ_ENVS})\\}[\\s\\S]*?\\\\end\\s*\\{\\1\\}`, 'g');
  if (!envRe.test(v)) return v;
  envRe.lastIndex = 0;
  const docStart = v.search(/\\begin\s*\{document\}/);
  const preamble = (docStart >= 0 ? v.slice(0, docStart) : '').replace(/(?<!\\)%[^\n]*/g, '');
  const docOpts = _tikzParsePreamble(preamble, _tikzEmptyOpts());
  const head = docStart >= 0 ? v.slice(0, docStart) : '';
  const body = docStart >= 0 ? v.slice(docStart) : v;
  return head + body.replace(envRe, full => _tikzPush(full, docOpts));
}

// LaTeX-документ (\documentclass … \end{document}), вставленный в Markdown, рисуем на его месте,
// а не переключаем весь редактор в отдельный режим
const LATEX_DOC_RE =
  /\\documentclass\s*(?:\[[^\]]*\])?\s*\{[^}]*\}[\s\S]*?\\end\s*\{document\}|\\begin\s*\{document\}[\s\S]*?\\end\s*\{document\}/g;
const LDOC_TOKEN = '\x02LDOC';
let _latexDocStore = [];

function _protectLatexDocs(v) {
  _latexDocStore = [];
  if (!/\\(?:documentclass|begin\s*\{document\})/.test(v)) return v;
  return _tikzOutsideCode(v, part =>
    part.replace(LATEX_DOC_RE, doc => {
      let d = _protectTikzLatexDoc(doc);
      if (!appSettings.htmlRendering) d = escapeHtmlInMarkdown(d);
      _latexDocStore.push(_renderLatexDoc(d));
      return `\n\n${LDOC_TOKEN}${_latexDocStore.length - 1}${TIKZ_END}\n\n`;
    })
  );
}

function _restoreLatexDocs(html) {
  return html.replace(/(?:<p>)?\x02LDOC(\d+)\x03(?:<\/p>)?/g, (_, i) => _latexDocStore[parseInt(i)] || '');
}

// Заменяет токены на контейнеры рисунков (сам SVG вставляет _mountTikz)
function _restoreTikz(html) {
  const re = new RegExp(`(?:<p>)?\\x02TKZ(\\d+)\\x03(?:</p>)?`, 'g');
  return html.replace(re, (_, i) => {
    const item = _tikzStore[parseInt(i)];
    if (!item) return '';
    const key = JSON.stringify([item.src, item.libs, item.pkgs, item.pre, item.texts]);
    return `<div class="tikz-wrap" data-tikz-idx="${i}" data-tikz-key="${_mmdEsc(key).replace(/"/g, '&quot;')}"></div>`;
  });
}

function _tikzCachePut(key, value) {
  _tikzSvgCache.delete(key);
  _tikzSvgCache.set(key, value);
  if (_tikzSvgCache.size > TIKZ_CACHE_MAX) _tikzSvgCache.delete(_tikzSvgCache.keys().next().value);
}

function _tikzShowError(wrap, item, kind) {
  const t = LANGS[currentLang] || LANGS['en'];
  const div = document.createElement('div');
  div.className = 'mermaid-error tikz-error';
  let msg = kind === 'load' ? t.tikzLoadError : t.tikzCompileError;
  if (kind !== 'load' && item && item.unsupported.length) {
    msg += '\n' + t.tikzUnsupportedPkgs.replace('{pkgs}', item.unsupported.join(', '));
  }
  div.textContent = msg;
  wrap.replaceChildren(div);
}

// Загружает TikZJax (≈6 МБ при первом использовании, дальше — из кэша браузера/Service Worker)
function _ensureTikzJax() {
  if (_tikzJaxPromise) return _tikzJaxPromise;
  _tikzJaxPromise = new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = TIKZJAX_BASE + '/fonts.css';
    document.head.appendChild(link);
    const s = document.createElement('script');
    s.src = TIKZJAX_BASE + '/tikzjax.js';
    s.onload = () => resolve();
    s.onerror = () => {
      _tikzJaxPromise = null; // при следующей отрисовке попробуем снова
      s.remove();
      reject(new Error('TikZJax load failed'));
    };
    document.head.appendChild(s);
  });
  return _tikzJaxPromise;
}

// Вставляет готовые SVG из кэша сразу, а новые рисунки отправляет в TikZJax с задержкой
function _mountTikz() {
  const wraps = Array.from(mo.querySelectorAll('.tikz-wrap'));
  const present = new Set();
  let needCompile = false;
  wraps.forEach(wrap => {
    const key = wrap.dataset.tikzKey;
    present.add(key);
    const cached = _tikzSvgCache.get(key);
    if (cached) {
      if (cached.error) _tikzShowError(wrap, _tikzStore[wrap.dataset.tikzIdx], cached.error);
      else wrap.innerHTML = cached.svg;
      return;
    }
    const live = _tikzLiveNodes.get(key);
    if (live) wrap.appendChild(live);
    else needCompile = true;
  });
  // Компиляции рисунков, которых больше нет в тексте, не переносим
  for (const key of _tikzLiveNodes.keys()) if (!present.has(key)) _tikzLiveNodes.delete(key);
  if (wraps.length) _ensureTikzJax().catch(() => {});
  clearTimeout(_tikzTimer);
  if (needCompile) _tikzTimer = setTimeout(_compileTikz, TIKZ_DEBOUNCE);
}

async function _compileTikz() {
  const wraps = Array.from(mo.querySelectorAll('.tikz-wrap')).filter(
    w => !w.firstChild && !_tikzSvgCache.has(w.dataset.tikzKey)
  );
  if (!wraps.length) return;
  try {
    await _ensureTikzJax();
  } catch (_) {
    wraps.forEach(w => w.isConnected && _tikzShowError(w, null, 'load'));
    return;
  }
  wraps.forEach(wrap => {
    if (!wrap.isConnected || wrap.firstChild) return;
    const key = wrap.dataset.tikzKey;
    if (_tikzLiveNodes.has(key)) {
      wrap.appendChild(_tikzLiveNodes.get(key));
      return;
    }
    const item = _tikzStore[wrap.dataset.tikzIdx];
    const inner = document.createElement('div');
    inner.className = 'tikz-inner';
    const s = document.createElement('script');
    s.type = 'text/tikz';
    if (item.libs) s.dataset.tikzLibraries = item.libs;
    if (Object.keys(item.pkgs).length) s.dataset.texPackages = JSON.stringify(item.pkgs);
    if (item.pre) s.dataset.addToPreamble = item.pre;
    s.textContent = item.src;
    inner.appendChild(s);
    _tikzLiveNodes.set(key, inner);
    wrap.appendChild(inner);
  });
}

// TikZJax сообщает о готовом SVG событием; при ошибке он вставляет <img> на invalid.site
document.addEventListener('tikzjax-load-finished', e => {
  const svg = e.target;
  const wrap = svg.closest && svg.closest('.tikz-wrap');
  if (!wrap) return;
  const key = wrap.dataset.tikzKey;
  _tikzApplyText(svg, JSON.parse(key)[4]);
  _tikzCachePut(key, { svg: svg.outerHTML });
  _tikzLiveNodes.delete(key);
});
new MutationObserver(records => {
  for (const r of records) {
    for (const n of r.addedNodes) {
      if (n.nodeName !== 'IMG' || !/invalid\.site/.test(n.getAttribute('src') || '')) continue;
      const wrap = n.closest('.tikz-wrap');
      if (!wrap) continue;
      const key = wrap.dataset.tikzKey;
      _tikzCachePut(key, { error: 'compile' });
      _tikzLiveNodes.delete(key);
      _tikzShowError(wrap, _tikzStore[wrap.dataset.tikzIdx], 'compile');
    }
  }
}).observe(mo, { childList: true, subtree: true });

// Обрабатывает пользовательские атрибуты изображений {width=...height=...}
function _figureLabel(n, alt) {
  return alt ? `${n}. ${alt}` : `${n}.`;
}

function _processImageAttrs(v) {
  let figN = 0;
  return v.replace(/!\[([^\]]*)\]\(([^)]+)\)\{([^}]+)\}/g, (_, alt, src, attrs) => {
    const styleProps = [];
    let hasWidth = false;
    attrs
      .split(/[,;\s]+/)
      .filter(Boolean)
      .forEach(a => {
        const m = a.trim().match(/^(width|height)\s*=\s*"?([^"]+?)"?$/i);
        if (!m) return;
        let val = m[2].trim();
        if (/^\d+(\.\d+)?$/.test(val)) val += 'px';
        styleProps.push(`${m[1].toLowerCase()}:${val}`);
        if (m[1].toLowerCase() === 'width') hasWidth = true;
      });
    if (hasWidth) styleProps.push('max-width:none');
    const styleAttr = styleProps.length ? ` style="${styleProps.join(';')}"` : '';
    const safeAlt = alt.replace(/"/g, '&quot;');
    figN++;
    const caption = _figureLabel(figN, alt).replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<figure class="md-figure"><img src="${src}" alt="${safeAlt}"${styleAttr}><figcaption>${caption}</figcaption></figure>`;
  });
}

// Главная функция рендеринга: Markdown -> HTML предпросмотр (ядро приложения)
function render(v) {
  const raw = v;
  _tikzStore = [];
  // LaTeX-документы и TikZ вынимаем до экранирования HTML: в коде рисунков бывают «<» и «>»
  v = _protectLatexDocs(v);
  v = _protectTikz(v);
  if (!appSettings.htmlRendering) {
    v = escapeHtmlInMarkdown(v);
  }
  if (!v.trim()) {
    emp.style.display = 'flex';
    mo.style.display = 'none';
  } else {
    emp.style.display = 'none';
    mo.style.display = 'block';
    const hasMmd = /```\s*mermaid\b/.test(v);
    const vv = _processCustomTables(_processImageAttrs(v));
    let _html = marked.parse(_protectEscapes(_protectLatex(vv)));
    _html = _convertMermaidFences(_html);
    mo.innerHTML = _restoreTikz(_restoreLatexDocs(_restoreEscapes(_restoreLatex(_html))));
    if (hasMmd && typeof mermaid !== 'undefined') {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const nodes = Array.from(mo.querySelectorAll('.mermaid'));
          (async () => {
            for (let idx = 0; idx < nodes.length; idx++) {
              const node = nodes[idx];
              node.id =
                'mmd-' + Date.now() + '-' + idx + '-' + Math.random().toString(36).slice(2, 7);
              if (!node.dataset.src) node.dataset.src = node.textContent;
              try {
                await mermaid.run({ nodes: [node], suppressErrors: true });
                node.querySelectorAll('svg').forEach(svg => {
                  const vb = svg.getAttribute('viewBox');
                  if (!vb) return;
                  const parts = vb.trim().split(/\s+/);
                  const vw = parseFloat(parts[2]);
                  const vh = parseFloat(parts[3]);
                  if (!(vw > 0 && vh > 0)) return;
                  const curH = parseFloat(svg.getAttribute('height') || '0');
                  if (!curH) {
                    svg.setAttribute('height', vh);
                    if (!parseFloat(svg.getAttribute('width') || '0')) {
                      svg.setAttribute('width', vw);
                    }
                  }
                });
              } catch (_) {
                const wrap = node.closest('.mermaid-wrap');
                if (wrap && !wrap.querySelector('svg') && !wrap.querySelector('.mermaid-error')) {
                  const errDiv = document.createElement('div');
                  errDiv.className = 'mermaid-error';
                  errDiv.textContent =
                    LANGS[currentLang]?.mermaidSyntaxError || LANGS['en'].mermaidSyntaxError;
                  wrap.appendChild(errDiv);
                }
              }
            }
          })();
        });
      });
    }
    _mountTikz();
    addCopyBtns();
  }
  // Статистика — по исходному тексту (а не по тексту с токенами и экранированием)
  cc.textContent = raw.length.toLocaleString();
  wc.textContent = (raw.trim() ? raw.trim().split(/\s+/).length : 0).toLocaleString();
  lc.textContent = raw.split('\n').length.toLocaleString();
}

ed.addEventListener('input', () => render(ed.value));
ed.addEventListener('keydown', e => {
  if (e.key === 'Tab') {
    e.preventDefault();
    const s = ed.selectionStart,
      en = ed.selectionEnd;
    ed.value = ed.value.slice(0, s) + '  ' + ed.value.slice(en);
    ed.selectionStart = ed.selectionEnd = s + 2;
    render(ed.value);
  }
});
const gs = () => ({
  s: ed.selectionStart,
  e: ed.selectionEnd,
  t: ed.value.slice(ed.selectionStart, ed.selectionEnd)
});
// Оборачивает выделенный текст в редакторе указанными до/после подстроками
function wr(b, a) {
  const dt = LANGS[currentLang]?.defaultText || 'text';
  const { s, e, t } = gs(),
    r = b + (t || dt) + a;
  ed.value = ed.value.slice(0, s) + r + ed.value.slice(e);
  ed.selectionStart = s + b.length;
  ed.selectionEnd = s + b.length + (t || dt).length;
  ed.focus();
  render(ed.value);
}
// Вставляет фрагмент текста в текущую позицию курсора
function ins(p, sf) {
  const { s, e, t } = gs(),
    r = p + (t || '') + sf;
  ed.value = ed.value.slice(0, s) + r + ed.value.slice(e);
  ed.selectionStart = ed.selectionEnd = s + p.length + (t ? t.length : 0) + sf.length;
  ed.focus();
  render(ed.value);
}
// Вставляет шаблон ссылки [текст](url)
function iLink() {
  const dl = LANGS[currentLang]?.defaultLink || 'link';
  const { s, e, t } = gs(),
    l = t || dl,
    u = 'https://example.com',
    r = `[${l}](${u})`;
  ed.value = ed.value.slice(0, s) + r + ed.value.slice(e);
  ed.selectionStart = s + l.length + 3;
  ed.selectionEnd = s + l.length + 3 + u.length;
  ed.focus();
  render(ed.value);
}
// Вставляет шаблон изображения с атрибутом размера
function iImg() {
  const da = LANGS[currentLang]?.defaultImgAlt || 'alt';
  const { s, e, t } = gs();
  const snip = `![${t || da}](https://example.com/img.png){width=300px}`;
  ed.value = ed.value.slice(0, s) + snip + ed.value.slice(e);
  ed.selectionStart = ed.selectionEnd = s + snip.length;
  ed.focus();
  render(ed.value);
}
// Вставляет инлайн-формулу LaTeX
function iLatexInline() {
  const { s, e, t } = gs(),
    m = t || 'x^2';
  const r = `$${m}$`;
  ed.value = ed.value.slice(0, s) + r + ed.value.slice(e);
  ed.selectionStart = s + 1;
  ed.selectionEnd = s + 1 + m.length;
  ed.focus();
  render(ed.value);
}
// Вставляет блочную формулу LaTeX
function iLatexBlock() {
  const { s, e, t } = gs(),
    m = t || '\\int_0^\\infty f(x)\\,dx';
  const r = `$$\n${m}\n$$`;
  ed.value = ed.value.slice(0, s) + r + ed.value.slice(e);
  ed.selectionStart = s + 3;
  ed.selectionEnd = s + 3 + m.length;
  ed.focus();
  render(ed.value);
}
// Вставляет шаблон diff-блока
function iDiff() {
  const t0 = LANGS[currentLang] || LANGS['en'];
  const lang = prompt(t0.diffPrompt || 'Enter language name (leave blank for plain diff):', '');
  const fence = lang && lang.trim() ? `diff_${lang.trim()}` : 'diff';
  const { s, e, t } = gs();
  const body = t || t0.diffDefault || '- removed line\n+ added line';
  const r = `\`\`\`${fence}\n${body}\n\`\`\``;
  ed.value = ed.value.slice(0, s) + r + ed.value.slice(e);
  ed.selectionStart = s + fence.length + 4;
  ed.selectionEnd = s + fence.length + 4 + body.length;
  ed.focus();
  render(ed.value);
}
// Вставляет шаблон Mermaid-диаграммы
function iMermaid() {
  const { s, e, t } = gs();
  const body = t || 'flowchart LR\n  A[Start] --> B[End]';
  const r = '```mermaid\n' + body + '\n```';
  ed.value = ed.value.slice(0, s) + r + ed.value.slice(e);
  ed.selectionStart = s + 10;
  ed.selectionEnd = s + 10 + body.length;
  ed.focus();
  render(ed.value);
}
// Шаблон рисунка TikZ по умолчанию: единичная окружность с углом θ, cos θ и sin θ.
// Только ASCII и математические символы: TeX компилирует их без подмены текста
const TIKZ_DEFAULT = [
  '\\begin{tikzpicture}[scale=2, >=stealth, line cap=round, line join=round]',
  '  \\draw[gray!15, very thin, step=0.25] (-1.25,-1.25) grid (1.25,1.25);',
  '  \\draw[->, gray!60!black] (-1.4,0) -- (1.5,0) node[right] {$x$};',
  '  \\draw[->, gray!60!black] (0,-1.4) -- (0,1.5) node[above] {$y$};',
  '  \\fill[orange!15] (0,0) -- (0.35,0) arc[start angle=0, end angle=40, radius=0.35] -- cycle;',
  '  \\draw[orange!80!black] (0.35,0) arc[start angle=0, end angle=40, radius=0.35];',
  '  \\node[orange!80!black] at (20:0.5) {$\\theta$};',
  '  \\draw[very thick, blue!70!black] (0,0) circle (1);',
  '  \\draw[gray!60!black] (40:1 |- 0,0) ++(-0.08,0) |- ++(0.08,0.08);',
  '  \\draw[very thick, teal!70!black] (0,0) -- (40:1 |- 0,0) node[midway, below] {$\\cos\\theta$};',
  '  \\draw[very thick, red!70!black] (40:1 |- 0,0) -- (40:1) node[midway, right, fill=white, inner sep=2pt] {$\\sin\\theta$};',
  '  \\draw[thick] (0,0) -- (40:1) node[midway, above left] {$1$};',
  '  \\fill (40:1) circle (0.035) node[above right] {$P$};',
  '  \\node[below left, gray!60!black] at (0,0) {$O$};',
  '\\end{tikzpicture}'
].join('\n');
// Вставляет шаблон рисунка TikZ
function iTikz() {
  const { s, e, t } = gs();
  const body = t || TIKZ_DEFAULT;
  const r = '```tikz\n' + body + '\n```';
  ed.value = ed.value.slice(0, s) + r + ed.value.slice(e);
  ed.selectionStart = s + 8;
  ed.selectionEnd = s + 8 + body.length;
  ed.focus();
  render(ed.value);
}
// Переключает вкладки редактор/превью на мобильных экранах
function mTab(tab, btn) {
  document.querySelectorAll('.tab').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  document.getElementById('eP').classList.toggle('v', tab === 'e');
  document.getElementById('pP').classList.toggle('v', tab === 'p');
}

const rz = document.getElementById('rz'),
  eP = document.getElementById('eP');
let drag = false,
  sx,
  sw;
function _aiPanelReservedWidth() {
  const ai = document.getElementById('aiPanel');
  return ai && ai.classList.contains('open') ? ai.getBoundingClientRect().width : 0;
}
function clampEpFlex() {
  const full = document.getElementById('panes').getBoundingClientRect().width;
  const reserved = 5 + _aiPanelReservedWidth();
  const available = full - reserved;
  if (available <= 0 || full <= 0) return;
  const cur = eP.getBoundingClientRect().width;
  const w = Math.max(200, Math.min(available - 200, cur));
  eP.style.flex = `0 0 ${((w / full) * 100).toFixed(3)}%`;
}
rz.addEventListener('mousedown', e => {
  drag = true;
  sx = e.clientX;
  sw = eP.getBoundingClientRect().width;
  rz.classList.add('on');
  document.body.style.cursor = 'col-resize';
  e.preventDefault();
});
document.addEventListener('mousemove', e => {
  if (!drag) return;
  const full = document.getElementById('panes').getBoundingClientRect().width;
  const tot = full - 5 - _aiPanelReservedWidth();
  const w = Math.max(200, Math.min(tot - 200, sw + (e.clientX - sx)));
  eP.style.flex = `0 0 ${((w / full) * 100).toFixed(3)}%`;
});
window.addEventListener('resize', clampEpFlex);
document.addEventListener('mouseup', () => {
  if (!drag) return;
  drag = false;
  rz.classList.remove('on');
  document.body.style.cursor = '';
});

// Словарь локализации интерфейса и шаблонов документа по умолчанию для каждого языка
// Английский встроен в код (запасной язык); остальные языки загружаются по требованию
// из lang/<код>.json и добавляются в LANGS (см. loadLangFile)
const LANGS = {
  en: {
    chars: 'chars',
    words: 'words',
    lines: 'lines',
    editorLabel: 'Editor',
    previewLabel: 'Preview',
    tabEdit: 'Edit',
    tabPreview: 'Preview',
    codeCopy: 'Copy',
    codeCopied: 'Copied',
    emptyTitle: 'Preview Area',
    emptyDesc: 'Type Markdown in the editor to see a live preview',
    aboutBtnTitle: 'Credits & Copyright',
    aiBtnTitle: 'AI Assistant',
    aiWelcome:
      '👋 Hi! I\'m the AI Assistant (Claude) for this Markdown editor.<br><br>Enter your Anthropic API key and press "Save", then select text and click a preset, or ask anything freely.',
    aiKeyPlaceholder: 'Enter Anthropic API key…',
    aiSaveBtn: 'Save',
    aiSavedBtn: 'Saved ✓',
    aiPresetContinue: 'Continue',
    aiPresetSummarize: 'Summarize',
    aiPresetTranslateJa: 'To Japanese',
    aiPresetTranslateEn: 'To English',
    aiPresetProofread: 'Proofread',
    aiPresetBullet: 'Bulletize',
    aiPresetContinuePrompt: 'Continue writing',
    aiPresetSummarizePrompt: 'Summarize this',
    aiPresetTranslateJaPrompt: 'Translate to Japanese',
    aiPresetTranslateEnPrompt: 'Translate to English',
    aiPresetProofreadPrompt: 'Proofread and correct this',
    aiPresetBulletPrompt: 'Convert to a bullet list',
    aiPresetTranslateNative: 'To Russian',
    aiPresetTranslateNativePrompt: 'Translate to Russian',
    aiPresetFactcheck: 'Fact-check',
    aiPresetFactcheckPrompt:
      'Fact-check this text and correct any claims that are inaccurate, outdated, or unverifiable. Return the corrected text directly, with no annotations or notes about what changed. If everything checks out, return the text unchanged.',
    aiInputPlaceholder: 'Ask a question or give an instruction…',
    aiInsertBtn: '⬇ Insert into editor',
    aiAcceptBtn: '✓ Accept',
    aiRejectBtn: '✕ Reject',
    aiEditApplied: '✓ Applied to editor',
    aiEditDiscarded: '✕ Discarded',
    aiEditStale: '⚠ Editor changed — could not apply',
    aiKeyWarning: '⚠ Please enter your {backend} API key and press "Save".',
    aiThinking: '● Thinking…',
    pvPopBtnTitle: 'Open in new window',
    ttTikz: 'TikZ figure (```tikz...```)',
    tikzLoadError: '⚠ TikZ: could not load the TeX engine (an internet connection is needed the first time).',
    tikzCompileError: '⚠ TikZ: compilation failed. Check the code for errors.',
    tikzUnsupportedPkgs: 'Packages not available in the browser TeX: {pkgs}',
    aiModelsRefreshTitle: 'Reload the model list from the API',
    aiModelsFetchError: '⚠ Could not load the model list: ',
    aiModelNotFound: 'This model is not available. Press ↻ to reload the model list and pick another one.',
    aiRefusal: '⚠ The model declined to answer this request.',
    aiErrorPrefix: '⚠ Error: ',
    aiSelectedSuffix: ' (selected text: {n} chars)',
    aiEmptyResponse: '(empty response)',
    aiNavWarning: 'The AI is still responding. If you leave now, the response will be lost. Continue?',
    aiNavYes: 'Yes',
    aiNavNo: 'No',
    loadingFile: 'Loading file…',
    loadingLang: 'Loading language…',
    errModalTitle: 'Error',
    errOk: 'OK',
    errLangInvalid: 'Invalid language code: “{lang}”.',
    errLangNotFound: 'The language file “{file}” was not found.',
    errLangHttp: 'Failed to load the language file “{file}” (HTTP {status}).',
    errLangNetwork:
      'Could not load the language file “{file}”. Check your internet connection. The file may not be cached for offline use yet.',
    errLangFile:
      'The language file “{file}” cannot be loaded when the page is opened directly from disk (file://). Please open it through a web server (http/https).',
    errLangFormat: 'The language file “{file}” is corrupted or has an invalid format.',
    aiTruncatedError:
      'Response was cut off (max output length reached) before producing any text. Try a shorter selection, or switch model.',
    aiDiffModalTitle: 'Review edit',
    aiReviewEditMsg: '✎ Edit proposed',
    aiOpenReviewBtn: 'Review',
    aiResetBtnTitle: 'Reset conversation',
    aiOfflineTitle: 'AI features are unavailable offline',
    aiResetConfirm: 'Clear the conversation history? This cannot be undone.',
    aiSystemPrompt:
      'You are an AI assistant that helps write and edit Markdown documents. Use Markdown syntax appropriately and give helpful answers. Keep responses concise and practical. The user has a deliberate personal notation style, so avoid rewriting it more than necessary — instead improve readability with targeted techniques, such as consolidating math expressions into LaTeX.',
    aiAttachBtnTitle: 'Attach file',
    aiRemoveFileTitle: 'Remove file',
    aiFileTooLarge: '⚠ File "{name}" is too large (max {max}).',
    aiFileReadError: '⚠ Could not read file "{name}".',
    aiUnsupportedFile: '⚠ Unsupported file type: "{name}".',
    aiTooManyFiles: '⚠ Max {max} files per message.',
    aboutAuthor: 'Author',
    aboutCopyright: 'Copyright',
    aboutVersion: 'Version',
    aboutLicense: 'License',
    aboutDesc:
      'A Markdown editor with golden-ratio proportions and a Google-inspired color palette.',
    aboutLibraries: 'Libraries',
    aboutLibKatexCopy: '© 2013–2020 Khan Academy and contributors',
    aboutLibMermaidCopy: '© 2014–2023 Knut Sveidqvist and contributors',
    aboutLibGoogleFontsBadge: 'SIL OFL 1.1',
    aboutLibGoogleSansCopy: '© Google Inc. — SIL Open Font License 1.1',
    aboutLibMarkedCopy: '© 2011–2018 Christopher Jeffrey',
    aboutLibJetbrainsBadge: 'SIL OFL 1.1',
    aboutLibJetbrainsCopy: '© 2020 JetBrains s.r.o.',
    aboutLibTikzjaxBadge: 'GPL-3.0-or-later',
    aboutLibTikzjaxCopy: '© Jim Fowler, Glenn Rice and contributors',
    langBtnTitle: 'Language',
    tblDialogTitle: 'Insert custom table',
    tblColsLabel: 'Columns',
    tblRowsLabel: 'Rows (excluding header)',
    tblStripeLabel: 'Striped',
    tblBorderLabel: 'Bordered',
    tblCancelBtn: 'Cancel',
    tblInsertBtn: 'Insert',
    placeholder: 'Type Markdown here…\n\n# Heading\n**bold** *italic* `code`',
    defaultText: 'text',
    defaultLink: 'link',
    defaultImgAlt: 'alt text',
    tblHeaderDefault: 'Header',
    tblCellDefault: 'Cell',
    mermaidSyntaxError: '⚠ Mermaid: syntax error (diagram syntax error)',
    savedLabel: 'Saved',
    unsavedLabel: 'Unsaved',
    restoredMsg: 'Content restored from saved session',
    tooLargeMsg: 'Content too large to save in cookie',
    downloadBtnTitle: 'Download',
    dlTitle: 'Download as…',
    dlHtmlDesc: 'Standalone HTML file',
    dlPdfDesc: 'Save via print dialog',
    dlZmdDesc: 'Markdown + editor metadata',
    dlMdDesc: 'Standard Markdown file',
    dlHint: 'Select one or more formats',
    dlDownloadBtn: 'Download',
    settingsDocTitle: 'Document',
    settingsDocNameLabel: 'Document Name',
    settingsDocNameDesc:
      'Used as the title for HTML and PDF downloads. Leave blank to use the first heading.',
    docsBtnTitle: 'Documents',
    docsPanelTitle: 'Documents',
    docsNewBtn: 'New Document',
    docsOpenBtn: 'Open File',
    docsEmpty: 'No documents yet',
    docsDelete: 'Delete',
    docsConfirmDelete: 'Delete this document? This cannot be undone.',
    docsCantDeleteLast: 'You must have at least one document.',
    untitledDoc: 'Untitled Document',
    docsOpenedMsg: 'Opened "{name}"',
    fileOpenFailed: 'Could not open the file “{name}”.',
    openWindow: 'Open',
    diffPrompt: 'Enter language name (leave blank for plain diff):',
    diffDefault: '- removed line\n+ added line',
    ttBold: 'Bold',
    ttItalic: 'Italic',
    ttStrike: 'Strikethrough',
    ttCode: 'Inline code',
    ttLink: 'Link',
    ttImage: 'Image',
    ttQuote: 'Blockquote',
    ttHr: 'Horizontal rule',
    ttBullet: 'Bullet list',
    ttOrdered: 'Numbered list',
    ttTask: 'Task list',
    ttCodeBlock: 'Code block',
    ttMathInline: 'Inline math ($...$)',
    ttMathBlock: 'Block math ($$...$$)',
    ttDiff: 'Diff block (diff / diff_lang)',
    ttMermaid: 'Mermaid diagram (```mermaid...```)',
    ttTable: 'Insert custom table',
    fontSizeBtnTitle: 'Font size settings',
    fontPanelTitle: 'Font Sizes',
    fontH1: 'H1',
    fontH2: 'H2',
    fontH3: 'H3',
    fontBody: 'Body',
    fontLatex: 'LaTeX',
    fontMermaid: 'Mermaid',
    fontCode: 'Code',
    fontReset: 'Reset to Defaults',
    settingsBtnTitle: 'Settings',
    settingsTitle: 'Settings',
    settingsRenderTitle: 'HTML Rendering',
    settingsHtmlLabel: 'Inline HTML',
    settingsHtmlDesc:
      'Render all raw HTML tags in Markdown (e.g. <div>, <span>, <table>, <iframe>…). When off, all tags are escaped and shown as plain text.',
    settingsAiDotLabel: 'Show the bump',
    settingsAiDotDesc: 'Show a small purple dot above the head of the AI Assistant icon.',
    settingsPreviewLabel: 'Preview',
    init: `# Welcome to Złoty MD 🎨

**Golden-ratio proportions** and a **Google-inspired color palette** — Markdown editing with a sense of design.

## ✦ Math with LaTeX

The golden ratio $\\phi = \\dfrac{1+\\sqrt{5}}{2} \\approx 1.618$ satisfies $\\phi^2 = \\phi + 1$.

Euler's identity — often called the most beautiful equation in mathematics:

$$e^{i\\pi} + 1 = 0$$

The golden ratio as a continued fraction:

$$\\phi = 1 + \\cfrac{1}{1 + \\cfrac{1}{1 + \\cfrac{1}{1 + \\cdots}}}$$

Gauss integral and Fibonacci closed form:

$$\\int_{-\\infty}^{\\infty} e^{-x^2}\\,dx = \\sqrt{\\pi} \\qquad F_n = \\frac{\\phi^n - \\psi^n}{\\sqrt{5}}$$

## Golden Ratio System

| Element | Value |
|---------|-------|
| Layout ratio | **61.8 %** / **38.2 %** |
| Spacing scale | 3, 5, 8, 13, 21, 34, 55, 89 px |
| Header height | **55 px** (Fibonacci) |
| Font sizes | 13, 21, 34 px |

## Code Example

\`\`\`javascript
// Golden ratio
const φ = (1 + Math.sqrt(5)) / 2; // 1.6180339887…
const fib = n => n <= 1 ? n : fib(n-1) + fib(n-2);
console.log([...Array(8)].map((_,i) => fib(i))); // [0,1,1,2,3,5,8,13]
\`\`\`

## Diff Example

\`\`\`diff
--- a/ratio.js
+++ b/ratio.js
@@ -1,6 +1,8 @@
 const φ = (1 + Math.sqrt(5)) / 2;
-const ratio = 0.5;
+const ratio = 1 / φ;           // golden complement 0.618…
+const inverse = φ - 1;         // same value, different form
 
 function layout(total) {
-  return { main: total * 0.5, side: total * 0.5 };
+  return { main: total * ratio, side: total * (1 - ratio) };
 }
\`\`\`

## Checklist

- [x] Golden ratio layout (61.8 / 38.2)
- [x] Google 4-color palette
- [x] Real-time preview · Draggable resizer
- [x] Language badge on code blocks (30+ languages)
- [x] Diff highlighting with \`\`\`diff\`\`\`
- [x] Mermaid diagrams with \`\`\`mermaid...\`\`\`

## Mermaid Diagram

\`\`\`mermaid
flowchart LR
  A([Start]) --> B{Decision}
  B -- Yes --> C[Process A]
  B -- No  --> D[Process B]
  C --> E([End])
  D --> E
\`\`\`

## Sequence Diagram

\`\`\`mermaid
sequenceDiagram
  participant U as User
  participant E as Editor
  participant P as Preview
  U->>E: Type Markdown
  E->>P: Render HTML
  P-->>U: Live preview
\`\`\`

---

*Start writing your document!*
`
  }
};

// Встроенный список моделей — используется, пока список не получен из API (нет ключа, нет сети)
const AI_FALLBACK_MODELS = {
  anthropic: [
    { id: 'claude-opus-5-5', label: 'Claude Opus 5.5', attach: true },
    { id: 'claude-sonnet-5-5', label: 'Claude Sonnet 5.5', attach: true },
    { id: 'claude-haiku-5-5', label: 'Claude Haiku 5.5', attach: true }
  ],
  gemini: [
    { id: 'gemini-3.6-flash', label: 'Gemini 3.6 Flash', attach: true },
    { id: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro Preview', attach: true },
    { id: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Flash-Lite', attach: true }
  ]
};
// Модель по умолчанию, если пользователь ещё ничего не выбирал
const AI_DEFAULT_MODEL = { anthropic: 'claude-opus-5-5', gemini: 'gemini-3.6-flash' };
const AI_BACKEND_LABEL = { anthropic: 'Claude', gemini: 'Gemini' };
// Список моделей из API кэшируется в localStorage и обновляется раз в сутки
const AI_MODELS_CACHE_PREFIX = 'zmd_ai_models_';
const AI_MODELS_TTL = 24 * 60 * 60 * 1000;

// Текущие списки моделей по бэкендам: из кэша API, иначе встроенные
const AI_MODELS = {};
Object.keys(AI_FALLBACK_MODELS).forEach(b => {
  AI_MODELS[b] = _readAiModelsCache(b)?.models || AI_FALLBACK_MODELS[b];
});

let AI_BACKEND = 'anthropic';
let AI_MODEL = AI_DEFAULT_MODEL.anthropic;
let _aiKey = '';

function _readAiModelsCache(backend) {
  try {
    const c = JSON.parse(localStorage.getItem(AI_MODELS_CACHE_PREFIX + backend) || 'null');
    return c && Array.isArray(c.models) && c.models.length ? c : null;
  } catch (_) {
    return null;
  }
}

// Модель, которую пользователь выбрал сам (сохраняется только при ручном выборе)
function _savedAiModel(backend) {
  try {
    return localStorage.getItem('zmd_ai_model_' + backend);
  } catch (_) {
    return null;
  }
}

// Выбирает модель из текущего списка: сохранённая → по умолчанию → первая в списке
function _pickAiModel() {
  const list = AI_MODELS[AI_BACKEND];
  const saved = _savedAiModel(AI_BACKEND);
  if (saved && list.some(x => x.id === saved)) return saved;
  const def = AI_DEFAULT_MODEL[AI_BACKEND];
  if (list.some(x => x.id === def)) return def;
  return list[0].id;
}

(function _loadAiBackendModel() {
  try {
    const b = localStorage.getItem('zmd_ai_backend');
    if (b && AI_MODELS[b]) AI_BACKEND = b;
  } catch (_) {}
  AI_MODEL = _pickAiModel();
})();

// Запрашивает у Anthropic список доступных этому ключу моделей (GET /v1/models)
async function _fetchAnthropicModels() {
  const models = [];
  let after = '';
  for (let page = 0; page < 10; page++) {
    const res = await fetch(
      'https://api.anthropic.com/v1/models?limit=1000' + (after ? '&after_id=' + after : ''),
      {
        headers: {
          'x-api-key': _aiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        }
      }
    );
    if (!res.ok) throw new Error(await _aiErrorText(res));
    const data = await res.json();
    (data.data || []).forEach(m =>
      models.push({
        id: m.id,
        label: m.display_name || m.id,
        attach: m.capabilities?.image_input?.supported !== false
      })
    );
    if (!data.has_more || !data.last_id) break;
    after = encodeURIComponent(data.last_id);
  }
  return models;
}

// Модели Gemini, которые не подходят для текстового чата
const GEMINI_EXCLUDE_RE =
  /(tts|live|image|embedding|transcribe|robotics|native-audio|computer-use|nano-banana|omni|translate|aqa|gemma|learnlm)/i;

// Запрашивает у Google список моделей с поддержкой generateContent (GET /v1beta/models)
async function _fetchGeminiModels() {
  const models = [];
  let token = '';
  for (let page = 0; page < 10; page++) {
    const res = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000' +
        (token ? '&pageToken=' + encodeURIComponent(token) : ''),
      { headers: { 'x-goog-api-key': _aiKey } }
    );
    if (!res.ok) throw new Error(await _aiErrorText(res));
    const data = await res.json();
    (data.models || []).forEach(m => {
      const id = (m.name || '').replace(/^models\//, '');
      if (!/^gemini-/.test(id) || GEMINI_EXCLUDE_RE.test(id)) return;
      if (!(m.supportedGenerationMethods || []).includes('generateContent')) return;
      models.push({ id, label: m.displayName || id, attach: true });
    });
    token = data.nextPageToken;
    if (!token) break;
  }
  // Новые версии выше: сортируем по номеру версии в ID по убыванию
  const ver = id => parseFloat((id.match(/^gemini-(\d+(?:\.\d+)?)/) || [])[1] || '0');
  return models.sort((a, b) => ver(b.id) - ver(a.id) || a.id.localeCompare(b.id));
}

let _aiModelsLoading = false;

// Обновляет список моделей из API. force — без учёта срока кэша (кнопка ↻, сохранение ключа)
async function refreshAiModels(force) {
  if (_aiModelsLoading || _isOffline()) return;
  const t = LANGS[currentLang] || LANGS['en'];
  if (!_aiKey) {
    if (force) {
      const backendName = AI_BACKEND === 'gemini' ? 'Google AI Studio' : 'Anthropic';
      _aiAddMsg(t.aiKeyWarning.replace('{backend}', backendName), 'thinking');
    }
    return;
  }
  const backend = AI_BACKEND;
  const cache = _readAiModelsCache(backend);
  if (!force && cache && Date.now() - cache.fetchedAt < AI_MODELS_TTL) return;
  const btn = document.getElementById('aiModelsRefreshBtn');
  _aiModelsLoading = true;
  if (btn) btn.classList.add('spin');
  try {
    const models =
      backend === 'gemini' ? await _fetchGeminiModels() : await _fetchAnthropicModels();
    if (!models.length) return;
    AI_MODELS[backend] = models;
    try {
      localStorage.setItem(
        AI_MODELS_CACHE_PREFIX + backend,
        JSON.stringify({ fetchedAt: Date.now(), models })
      );
    } catch (_) {}
    if (backend === AI_BACKEND) {
      AI_MODEL = _pickAiModel();
      _populateAiSelects();
    }
  } catch (err) {
    if (force) _aiAddMsg(t.aiModelsFetchError + err.message, 'thinking');
  } finally {
    _aiModelsLoading = false;
    if (btn) btn.classList.remove('spin');
  }
}

// Заполняет выпадающие списки бэкенда и модели ИИ на основе AI_MODELS
function _populateAiSelects() {
  const bSel = document.getElementById('aiBackendSelect');
  const mSel = document.getElementById('aiModelSelect');
  if (!bSel || !mSel) return;
  bSel.innerHTML = Object.keys(AI_MODELS)
    .map(
      b =>
        `<option value="${b}"${b === AI_BACKEND ? ' selected' : ''}>${AI_BACKEND_LABEL[b]}</option>`
    )
    .join('');
  // Названия моделей приходят из API — экранируем
  const esc = v => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  mSel.innerHTML = AI_MODELS[AI_BACKEND].map(
    m =>
      `<option value="${esc(m.id)}"${m.id === AI_MODEL ? ' selected' : ''}>${esc(m.label)}</option>`
  ).join('');
  _updateAiAttachAvailability();
}

// Обновляет приветственный текст ИИ-панели с учётом выбранной модели
function _updateAiWelcomeText() {
  const el = document.getElementById('aiWelcomeMsg');
  if (el) {
    const label = AI_BACKEND_LABEL[AI_BACKEND];
    el.innerHTML = el.innerHTML.replace(/Claude|Gemini/g, label);
  }
  const keyInput = document.getElementById('aiKey');
  if (keyInput) {
    const providerName = AI_BACKEND === 'gemini' ? 'Google AI Studio' : 'Anthropic';
    keyInput.placeholder = keyInput.placeholder.replace(
      /Anthropic|Google AI Studio/g,
      providerName
    );
  }
}

function _currentAiModelSupportsAttach() {
  const list = AI_MODELS[AI_BACKEND] || [];
  const found = list.find(x => x.id === AI_MODEL);
  return found ? found.attach !== false : true;
}

function _updateAiAttachAvailability() {
  const btn = document.getElementById('aiAttachBtn');
  const input = document.getElementById('aiFileInput');
  const supported = _currentAiModelSupportsAttach() && !_isOffline();
  if (btn) {
    btn.disabled = !supported;
    btn.classList.toggle('ai-attach-disabled', !supported);
  }
  if (input) input.disabled = !supported;
}

// Обработчик смены бэкенда ИИ (Anthropic/Gemini) в настройках
function onAiBackendChange() {
  const bSel = document.getElementById('aiBackendSelect');
  AI_BACKEND = bSel.value;
  try {
    localStorage.setItem('zmd_ai_backend', AI_BACKEND);
  } catch (_) {}
  AI_MODEL = _pickAiModel();
  _populateAiSelects();
  _loadAiKeyForBackend().then(() => refreshAiModels(false));
  _updateAiWelcomeText();
  _updateAiAttachAvailability();
}

// Обработчик смены конкретной модели ИИ
function onAiModelChange() {
  const mSel = document.getElementById('aiModelSelect');
  AI_MODEL = mSel.value;
  try {
    localStorage.setItem('zmd_ai_model_' + AI_BACKEND, AI_MODEL);
  } catch (_) {}
  _updateAiAttachAvailability();
}

// Загружает сохранённый API-ключ для текущего выбранного бэкенда (отдельно для Claude и Gemini, хранится в IndexedDB)
async function _loadAiKeyForBackend() {
  try {
    const k = await idbGet('zmd_ai_key_' + AI_BACKEND);
    _aiKey = k || '';
    const inp = document.getElementById('aiKey');
    if (inp) inp.value = _aiKey;
  } catch (_) {}
}

// Применяет выбранный язык интерфейса: обновляет тексты, шаблон документа и направление письма
function applyLang(code) {
  const t = LANGS[code];
  if (!t) return;
  currentLang = code;
  document.documentElement.lang = code;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key] !== undefined) el.textContent = t[key];
  });

  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    if (t[key] !== undefined) el.title = t[key];
  });

  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.getAttribute('data-i18n-html');
    if (t[key] !== undefined) el.innerHTML = t[key];
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (t[key] !== undefined) el.placeholder = t[key];
  });
  if (typeof _updateAiWelcomeText === 'function') _updateAiWelcomeText();
  // applyLang вызывается до объявления части ИИ-переменных, поэтому защищаемся try/catch
  try {
    if (typeof updateAiOnlineState === 'function') updateAiOnlineState();
  } catch (_) {}

  document.querySelectorAll('[data-i18n-prompt]').forEach(el => {
    const key = el.getAttribute('data-i18n-prompt');
    if (t[key] !== undefined) el.dataset.prompt = t[key];
  });

  ed.placeholder = t.placeholder;

  document.getElementById('langCurrent').textContent = code.toUpperCase();
  document.querySelectorAll('.lang-opt').forEach(b => {
    b.classList.toggle('active', b.dataset.lang === code);
  });

  if (ed.value === LANGS[previousLang]?.init || ed.value === '') {
    ed.value = t.init;
    (typeof _render === 'function' ? _render : render)(ed.value);
  }

  previousLang = code;

  const chip = document.getElementById('saveChip');
  if (chip) {
    const state = chip.className.replace('save-chip', '').trim();
    if (state) setSaveStatus(state);
  }

  if (document.getElementById('settingsModal')?.classList.contains('open')) {
    const descEl = document.querySelector('#settingsModal [data-i18n="settingsHtmlDesc"]');
    if (descEl && t.settingsHtmlDesc) descEl.textContent = t.settingsHtmlDesc;
    const dotDescEl = document.querySelector('#settingsModal [data-i18n="settingsAiDotDesc"]');
    if (dotDescEl && t.settingsAiDotDesc) dotDescEl.textContent = t.settingsAiDotDesc;
  }
}

// Допустимый формат кода языка (защита от подстановки произвольного пути в fetch)
const LANG_CODE_RE = /^[a-z]{2,3}(-[A-Za-z0-9]+)?$/;
// Промисы текущих загрузок: повторный запрос того же языка не дублирует fetch
const _langLoading = {};
// Создаёт ошибку загрузки языка с типом (kind), по которому выбирается текст сообщения
function makeLangError(kind, code, status) {
  const err = new Error('Language load error: ' + kind + ' (' + code + ')');
  err.kind = kind;
  err.langCode = code;
  err.status = status;
  return err;
}

// Загружает lang/<код>.js через <script> (способ для file://, где fetch недоступен).
// Файл кладёт словарь в window.ZMD_LANGS[код]; возвращает этот объект.
function loadLangScript(code) {
  return new Promise((resolve, reject) => {
    const sc = document.createElement('script');
    sc.src = 'lang/' + code + '.js';
    sc.onload = () => {
      sc.remove();
      const data = window.ZMD_LANGS && window.ZMD_LANGS[code];
      if (data) resolve(data);
      else reject(makeLangError('format', code));
    };
    sc.onerror = () => {
      sc.remove();
      reject(makeLangError('notfound', code));
    };
    document.head.appendChild(sc);
  });
}

// Загружает lang/<код>.json в LANGS (английский встроен, остальные — по требованию).
// Бросает ошибку с полем kind: invalid | file | network | notfound | http | format
async function loadLangFile(code) {
  if (LANGS[code]) return true;
  if (!LANG_CODE_RE.test(code)) throw makeLangError('invalid', code);
  if (!_langLoading[code]) {
    const stopBusy = startBusy('loadingLang'); // индикатор на время загрузки файла языка
    _langLoading[code] = (async () => {
      let data;
      if (location.protocol === 'file:') {
        // При открытии с диска fetch блокируется CORS, поэтому подключаем lang/<код>.js через <script>
        data = await loadLangScript(code);
      } else {
        let res;
        try {
          res = await fetch('lang/' + code + '.json');
        } catch (e) {
          throw makeLangError('network', code);
        }
        if (!res.ok) throw makeLangError(res.status === 404 ? 'notfound' : 'http', code, res.status);
        try {
          data = await res.json();
        } catch (e) {
          throw makeLangError('format', code);
        }
      }
      if (!data || typeof data !== 'object' || Array.isArray(data) || typeof data.init !== 'string') {
        throw makeLangError('format', code);
      }
      // Недостающие ключи подставляются из английского (фолбэк по каждому ключу)
      LANGS[code] = withEnglishFallback(code, data);
      return true;
    })().finally(() => {
      delete _langLoading[code];
      stopBusy();
    });
  }
  return _langLoading[code];
}

// Индикатор загрузки: счётчик активных операций. Показывается с небольшой задержкой,
// чтобы быстрые операции (файл из кэша, мгновенное чтение) не заставляли его мигать.
const BUSY_SHOW_DELAY_MS = 150;
const _busyStack = []; // активные операции (ключи строк интерфейса); показывается последняя
let _busyTimer = null;

// Обновляет видимость и текст индикатора по текущему состоянию стека
function _renderBusy() {
  const box = document.getElementById('busyIndicator');
  const txt = document.getElementById('busyText');
  if (!box || !txt) return;
  if (!_busyStack.length) {
    clearTimeout(_busyTimer);
    _busyTimer = null;
    box.classList.remove('show');
    box.setAttribute('aria-hidden', 'true');
    document.documentElement.removeAttribute('aria-busy');
    return;
  }
  // Текст берём на момент показа: к этому времени язык мог уже смениться
  txt.textContent = tr(_busyStack[_busyStack.length - 1].key);
  if (box.classList.contains('show') || _busyTimer) return;
  _busyTimer = setTimeout(() => {
    _busyTimer = null;
    if (!_busyStack.length) return;
    txt.textContent = tr(_busyStack[_busyStack.length - 1].key);
    box.classList.add('show');
    box.setAttribute('aria-hidden', 'false');
    document.documentElement.setAttribute('aria-busy', 'true');
  }, BUSY_SHOW_DELAY_MS);
}

// Начинает операцию с индикатором. Возвращает функцию остановки (повторный вызов безопасен)
function startBusy(key) {
  const entry = { key };
  _busyStack.push(entry);
  _renderBusy();
  return function stopBusy() {
    const i = _busyStack.indexOf(entry);
    if (i === -1) return;
    _busyStack.splice(i, 1);
    _renderBusy();
  };
}

// Дополняет загруженный словарь английскими строками: ключи, которых нет в файле языка
// (или их значение null/undefined), берутся из встроенного английского, а не остаются от прошлого языка
function withEnglishFallback(code, data) {
  const merged = Object.assign({}, LANGS.en);
  const missing = [];
  Object.keys(LANGS.en).forEach(k => {
    if (data[k] === undefined || data[k] === null) missing.push(k);
  });
  Object.keys(data).forEach(k => {
    if (data[k] !== undefined && data[k] !== null) merged[k] = data[k];
  });
  if (missing.length) {
    // Список недостающих ключей — подсказка переводчикам; на работу интерфейса не влияет
    console.warn('[i18n] "' + code + '": ' + missing.length + ' key(s) missing, using English fallback:', missing);
  }
  return merged;
}

// Текст интерфейса на текущем языке; если ключа нет (или язык не загружен) — английский
function tr(key) {
  return (LANGS[currentLang] && LANGS[currentLang][key]) || LANGS.en[key] || '';
}

// Показывает модальное окно ошибки по центру экрана (разметка и стили — как у aiNavModal).
// Возвращает Promise, который выполняется после закрытия окна.
function showErrorModal(message, title) {
  return new Promise(resolve => {
    const overlay = document.getElementById('errOverlay');
    const modal = document.getElementById('errModal');
    const titleEl = document.getElementById('errTitle');
    const msgEl = document.getElementById('errMsg');
    const okBtn = document.getElementById('errOkBtn');
    if (!overlay || !modal) {
      alert(message); // запасной вариант, если разметки нет
      resolve();
      return;
    }
    titleEl.textContent = title || tr('errModalTitle');
    msgEl.textContent = message;
    okBtn.textContent = tr('errOk');
    overlay.classList.add('open');
    modal.classList.add('open');
    okBtn.focus();
    const cleanup = () => {
      overlay.classList.remove('open');
      modal.classList.remove('open');
      okBtn.removeEventListener('click', cleanup);
      overlay.removeEventListener('click', cleanup);
      document.removeEventListener('keydown', onKey, true);
      resolve();
    };
    const onKey = e => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        cleanup();
      }
    };
    okBtn.addEventListener('click', cleanup);
    overlay.addEventListener('click', cleanup);
    document.addEventListener('keydown', onKey, true);
  });
}

// Преобразует ошибку загрузки языка в локализованное сообщение и показывает модальное окно
function showLangError(err) {
  console.warn('Language file load failed:', err);
  const keyByKind = {
    invalid: 'errLangInvalid',
    file: 'errLangFile',
    network: 'errLangNetwork',
    notfound: 'errLangNotFound',
    http: 'errLangHttp',
    format: 'errLangFormat'
  };
  const code = err && err.langCode ? err.langCode : '?';
  const msg = tr(keyByKind[err && err.kind] || 'errLangNetwork')
    .replace(/\{lang\}/g, code)
    .replace(/\{file\}/g, 'lang/' + code + '.json')
    .replace(/\{status\}/g, err && err.status ? err.status : '');
  return showErrorModal(msg);
}

const IDB_LANG_KEY = 'zmd_lang';
// Сохраняет выбранный язык интерфейса в IndexedDB (глобальная настройка приложения)
async function saveLangSetting() {
  try {
    await idbSet(IDB_LANG_KEY, currentLang);
  } catch (e) {}
}
// Загружает ранее сохранённый язык интерфейса
async function loadLangSetting() {
  try {
    const raw = await idbGet(IDB_LANG_KEY);
    if (raw) {
      try {
        await loadLangFile(raw);
        applyLang(raw);
      } catch (err) {
        // Сохранённый язык недоступен — остаёмся на текущем (английском) и сообщаем об ошибке
        showLangError(err);
      }
    }
  } catch (e) {}
}

// Устанавливает язык интерфейса и применяет его
let _langSwitchToken = 0;
async function setLang(code) {
  closeLang();
  // При быстрых кликах применяется только последний выбранный язык
  const token = ++_langSwitchToken;
  try {
    await loadLangFile(code);
  } catch (err) {
    // Файл недоступен (нет файла, офлайн без кэша, битый JSON) — язык не меняем, показываем ошибку
    if (token === _langSwitchToken) showLangError(err);
    return;
  }
  if (token !== _langSwitchToken) return;
  applyLang(code);
  saveLangSetting();
  if (typeof saveContent === 'function') saveContent();
}
// Открывает панель выбора языка
function toggleLang() {
  const drop = document.getElementById('langDrop');
  const btn = document.getElementById('langBtn');
  const isOpen = drop.classList.contains('open');
  if (isOpen) {
    closeLang();
    return;
  }
  const r = btn.getBoundingClientRect();
  drop.style.top = r.bottom + 6 + 'px';
  drop.style.right = window.innerWidth - r.right + 'px';
  drop.classList.add('open');
}
// Закрывает панель выбора языка
function closeLang() {
  document.getElementById('langDrop').classList.remove('open');
}
document.addEventListener('click', e => {
  if (!document.getElementById('langWrap').contains(e.target)) closeLang();
});

if (typeof mermaid !== 'undefined') {
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'loose',
    theme: 'base',
    themeVariables: {
      primaryColor: '#E8F0FE',
      primaryTextColor: '#1a1a2e',
      primaryBorderColor: '#4285F4',
      secondaryColor: '#E6F4EA',
      secondaryTextColor: '#1a2e1a',
      secondaryBorderColor: '#34A853',
      tertiaryColor: '#FEF7E0',
      tertiaryTextColor: '#2e200a',
      tertiaryBorderColor: '#FBBC04',
      background: '#ffffff',
      mainBkg: '#E8F0FE',
      nodeBorder: '#4285F4',
      clusterBkg: '#F8F9FA',
      clusterBorder: '#DADCE0',
      titleColor: '#202124',
      edgeLabelBackground: '#ffffff',
      lineColor: '#5F6368',
      actorBkg: '#E8F0FE',
      actorBorder: '#4285F4',
      actorTextColor: '#202124',
      actorLineColor: '#DADCE0',
      signalColor: '#202124',
      signalTextColor: '#202124',
      activationBkgColor: '#FCE8E6',
      activationBorderColor: '#EA4335',
      labelBoxBkgColor: '#E6F4EA',
      labelBoxBorderColor: '#34A853',
      labelTextColor: '#202124',
      loopTextColor: '#202124',
      noteBkgColor: '#FEF7E0',
      noteBorderColor: '#FBBC04',
      noteTextColor: '#202124',
      git0: '#4285F4',
      git1: '#EA4335',
      git2: '#34A853',
      git3: '#FBBC04',
      git4: '#9C27B0',
      git5: '#00ACC1',
      git6: '#FF7043',
      git7: '#78909C',
      gitBranchLabel0: '#fff',
      gitBranchLabel1: '#fff',
      gitBranchLabel2: '#fff',
      gitBranchLabel3: '#202124',
      gitBranchLabel4: '#fff',
      gitBranchLabel5: '#fff',
      gitBranchLabel6: '#fff',
      gitBranchLabel7: '#fff',
      pie1: '#4285F4',
      pie2: '#EA4335',
      pie3: '#34A853',
      pie4: '#FBBC04',
      pie5: '#9C27B0',
      pie6: '#00ACC1',
      pie7: '#FF7043',
      pie8: '#78909C',
      taskBkgColor: '#E8F0FE',
      taskBorderColor: '#4285F4',
      taskTextColor: '#202124',
      taskTextOutsideColor: '#202124',
      taskTextClickableColor: '#4285F4',
      activeTaskBkgColor: '#FCE8E6',
      activeTaskBorderColor: '#EA4335',
      doneTaskBkgColor: '#E6F4EA',
      doneTaskBorderColor: '#34A853',
      critBkgColor: '#FCE8E6',
      critBorderColor: '#EA4335',
      todayLineColor: '#EA4335',
      gridColor: '#DADCE0',
      classText: '#202124',
      fillType0: '#E8F0FE',
      fillType1: '#E6F4EA',
      fillType2: '#FEF7E0',
      fillType3: '#FCE8E6',
      fillType4: '#EDE7F6',
      fillType5: '#E0F7FA',
      fillType6: '#FBE9E7',
      fillType7: '#ECEFF1',
      stateBkg: '#E8F0FE',
      stateBorder: '#4285F4',
      transitionColor: '#5F6368',
      transitionLabelColor: '#202124',
      specialStateColor: '#EA4335',
      errorBkgColor: '#FCE8E6',
      errorTextColor: '#EA4335',
      fillType0: '#E8F0FE',
      labelColor: '#202124',
      altSectionBkgColor: '#F8F9FA',
      attributeBackgroundColorEven: '#F8F9FA',
      attributeBackgroundColorOdd: '#ffffff'
    },
    flowchart: { htmlLabels: true, curve: 'basis' },
    sequence: { useMaxWidth: true, actorMargin: 50 },
    gantt: { useMaxWidth: true },
    pie: { useMaxWidth: true }
  });
}

const INIT = LANGS['en'].init;
ed.value = INIT;
render(INIT);
if (window.innerWidth > 768) ed.focus();
applyLang('en');

// Открывает диалоговое окно «О программе»
function toggleAbout() {
  const overlay = document.getElementById('aboutOverlay');
  const modal = document.getElementById('aboutModal');
  const isOpen = modal.classList.contains('open');
  if (isOpen) {
    closeAbout();
  } else {
    overlay.classList.add('open');
    modal.classList.add('open');
    document.getElementById('aboutBtn').style.color = 'var(--gb)';
  }
}
// Закрывает диалоговое окно «О программе»
function closeAbout() {
  document.getElementById('aboutOverlay').classList.remove('open');
  document.getElementById('aboutModal').classList.remove('open');
  document.getElementById('aboutBtn').style.color = '';
}

const IDB_NAME = 'ZlotyMD';
const IDB_VERSION = 1;
const IDB_STORE = 'saves';

// Открывает (или создаёт) базу данных IndexedDB приложения
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded = e => {
      e.target.result.createObjectStore(IDB_STORE);
    };
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = e => reject(e.target.error);
  });
}

// Универсальная запись значения в IndexedDB
async function idbSet(key, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const req = tx.objectStore(IDB_STORE).put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = e => reject(e.target.error);
  });
}

// Универсальное чтение значения из IndexedDB
async function idbGet(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readonly');
    const req = tx.objectStore(IDB_STORE).get(key);
    req.onsuccess = e => resolve(e.target.result ?? null);
    req.onerror = e => reject(e.target.error);
  });
}

// Универсальное удаление значения из IndexedDB
async function idbDelete(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const req = tx.objectStore(IDB_STORE).delete(key);
    req.onsuccess = () => resolve();
    req.onerror = e => reject(e.target.error);
  });
}

// Обновляет индикатор статуса сохранения (сохранено/не сохранено/ошибка)
function setSaveStatus(state) {
  const chip = document.getElementById('saveChip');
  const label = document.getElementById('saveLabel');
  const t = LANGS[currentLang] || LANGS['en'];
  chip.className = 'save-chip ' + state;
  if (state === 'saved') label.textContent = t.savedLabel || 'Saved';
  if (state === 'unsaved') label.textContent = t.unsavedLabel || 'Unsaved';
  if (state === 'error') label.textContent = t.tooLargeMsg || 'Too large';
}

const FONT_CSS_MAP = {
  h1: el => {
    el.style.setProperty('--fz-h1', fontSizes.h1 + 'px');
  },
  h2: el => {
    el.style.setProperty('--fz-h2', fontSizes.h2 + 'px');
  },
  h3: el => {
    el.style.setProperty('--fz-h3', fontSizes.h3 + 'px');
  },
  body: el => {
    el.style.setProperty('--fz-body', fontSizes.body + 'px');
  },
  latex: el => {
    el.style.setProperty('--fz-latex', fontSizes.latex + 'px');
  },
  mmd: el => {
    el.style.setProperty('--fz-mmd', fontSizes.mmd + 'px');
  },
  code: el => {
    el.style.setProperty('--fz-code', fontSizes.code + 'px');
  }
};

// Применяет текущие размеры шрифтов к CSS-переменным документа
function applyFontSizesToDOM() {
  const root = document.documentElement;
  root.style.setProperty('--fz-h1', fontSizes.h1 + 'px');
  root.style.setProperty('--fz-h2', fontSizes.h2 + 'px');
  root.style.setProperty('--fz-h3', fontSizes.h3 + 'px');
  root.style.setProperty('--fz-body', fontSizes.body + 'px');
  root.style.setProperty('--fz-latex', fontSizes.latex + 'px');
  root.style.setProperty('--fz-mmd', fontSizes.mmd + 'px');
  root.style.setProperty('--fz-code', fontSizes.code + 'px');

  let styleTag = document.getElementById('zmd-font-style');
  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = 'zmd-font-style';
    document.head.appendChild(styleTag);
  }
  styleTag.textContent = `
    .md h1{font-size:var(--fz-h1)!important;padding-bottom:${Math.round(fontSizes.h1 * 0.24)}px!important}
    .md h1::after{width:${Math.round(fontSizes.h1 * 1.6)}px!important;height:${Math.max(2, Math.round(fontSizes.h1 * 0.09))}px!important}
    .md h2{font-size:var(--fz-h2)!important}
    .md h2::before{height:${Math.round(fontSizes.h2 * 0.9)}px!important;width:${Math.max(3, Math.round(fontSizes.h2 * 0.22))}px!important}
    .md h3{font-size:var(--fz-h3)!important}
    .md p,.md li,.md td,.md th,.md blockquote{font-size:var(--fz-body)!important}
    .md .katex{font-size:var(--fz-latex)!important}
    .md .katex-display>.katex{font-size:var(--fz-latex)!important}
    .md .mermaid svg text,.md .mermaid svg .label{font-size:var(--fz-mmd)!important}
    .md pre code,.md code{font-size:var(--fz-code)!important}
  `;

  syncFontPanelUI();
}

// Синхронизирует значения слайдеров/полей панели шрифтов с текущими размерами
function syncFontPanelUI() {
  Object.keys(fontSizes).forEach(key => {
    const s = document.getElementById('fs-' + key);
    const n = document.getElementById('fn-' + key);
    const p = document.getElementById('fp-' + key);
    if (s) s.value = Math.min(fontSizes[key], 70);
    if (n) n.value = fontSizes[key];
    if (p) p.style.fontSize = Math.min(fontSizes[key], 18) + 'px';
  });
}

// Обработчик изменения размера шрифта через слайдер
function onFontSlider(key, val) {
  fontSizes[key] = parseInt(val);
  const n = document.getElementById('fn-' + key);
  if (n) n.value = val;
  const p = document.getElementById('fp-' + key);
  if (p) p.style.fontSize = Math.min(parseInt(val), 18) + 'px';
  applyFontSizesToDOM();
  saveFontSizes();
}

// Обработчик изменения размера шрифта через числовое поле
function onFontNum(key, val) {
  const parsed = parseFloat(val);
  const v = !isFinite(parsed) || parsed <= 0 ? 1 : parsed;
  const n = document.getElementById('fn-' + key);
  if (n) n.value = v;
  fontSizes[key] = v;
  const s = document.getElementById('fs-' + key);
  if (s) s.value = Math.min(v, 70);
  const p = document.getElementById('fp-' + key);
  if (p) p.style.fontSize = Math.min(v, 18) + 'px';
  applyFontSizesToDOM();
  saveFontSizes();
}

// Сбрасывает размеры шрифтов к значениям по умолчанию
function resetFontSizes() {
  fontSizes = { ...FONT_DEFAULTS };
  applyFontSizesToDOM();
  saveFontSizes();
}

// Открывает/закрывает панель настроек шрифта
function toggleFontPanel() {
  const overlay = document.getElementById('fontOverlay');
  const modal = document.getElementById('fontModal');
  const isOpen = modal.classList.contains('open');
  if (isOpen) {
    closeFontPanel();
  } else {
    overlay.classList.add('open');
    modal.classList.add('open');
    document.getElementById('fontSizeBtn').style.color = 'var(--gb)';
    syncFontPanelUI();
  }
}
// Закрывает панель настроек шрифта
function closeFontPanel() {
  document.getElementById('fontOverlay').classList.remove('open');
  document.getElementById('fontModal').classList.remove('open');
  document.getElementById('fontSizeBtn').style.color = '';
}
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeFontPanel();
    closeAbout();
    closeSettings();
    closeDownloadMenu();
    closeDocsPanel();
  }
});

const IDB_FONT_KEY = 'zmd_fontsizes';
let legacyFontSizes = null;
// Загружает старые (legacy) размеры шрифтов, сохранённые до перехода на мультидокументность
async function loadLegacyFontSizes() {
  try {
    const raw = await idbGet(IDB_FONT_KEY);
    if (raw) legacyFontSizes = JSON.parse(raw);
  } catch (e) {}
}
// Возвращает размеры шрифтов по умолчанию для нового документа
function defaultFontSizesForNewDoc() {
  return { ...FONT_DEFAULTS };
}
// Сохраняет текущие размеры шрифтов в запись текущего документа
async function saveFontSizes() {
  if (!currentDocId) return;
  try {
    const data = await loadDocRecord(currentDocId);
    if (!data) return;
    data.fontSizes = { ...fontSizes };
    await persistDocRecord(currentDocId, data);
  } catch (e) {}
}

const IDB_SETTINGS_KEY = 'zmd_settings';

// Применяет сохранённые настройки приложения (например, режим рендеринга HTML)
function applySettings() {
  marked.setOptions({ gfm: true, breaks: true });
  const tog = document.getElementById('htmlToggle');
  if (tog) tog.setAttribute('aria-checked', appSettings.htmlRendering ? 'true' : 'false');
  // Фиолетовая точка на значке ИИ
  document.body.classList.toggle('ai-dot-on', !!appSettings.aiDot);
  const dotTog = document.getElementById('aiDotToggle');
  if (dotTog) dotTog.setAttribute('aria-checked', appSettings.aiDot ? 'true' : 'false');
  updateSettingsPreview();
  if (ed.value) (typeof _render === 'function' ? _render : render)(ed.value);
}

// Обновляет предпросмотр в соответствии с текущими настройками
function updateSettingsPreview() {
  const out = document.getElementById('settingsPreviewOutput');
  if (!out) return;
  const sample =
    '<span style="color:#EA4335;font-weight:700">colored</span>, <u>underline</u>, <mark>highlight</mark>, <sup>sup</sup>, <kbd>Ctrl+S</kbd>';
  if (appSettings.htmlRendering) {
    out.innerHTML = marked.parseInline(sample);
  } else {
    out.textContent = sample;
  }
}

// Переключает разрешение/запрет рендеринга сырого HTML внутри Markdown
function toggleHtmlRendering() {
  appSettings.htmlRendering = !appSettings.htmlRendering;
  applySettings();
  saveSettings();
}

// Переключает показ фиолетовой точки на значке ИИ
function toggleAiDot() {
  appSettings.aiDot = !appSettings.aiDot;
  applySettings();
  saveSettings();
}

// Сохраняет настройки приложения в IndexedDB
async function saveSettings() {
  try {
    await idbSet(IDB_SETTINGS_KEY, JSON.stringify(appSettings));
  } catch (e) {}
}

// Загружает настройки приложения из IndexedDB
async function loadSettings() {
  try {
    const raw = await idbGet(IDB_SETTINGS_KEY);
    if (raw) appSettings = Object.assign({ ...SETTINGS_DEFAULTS }, JSON.parse(raw));
  } catch (e) {}
  applySettings();
}

// Открывает панель настроек
function toggleSettings() {
  const overlay = document.getElementById('settingsOverlay');
  const modal = document.getElementById('settingsModal');
  const isOpen = modal.classList.contains('open');
  if (isOpen) {
    closeSettings();
  } else {
    overlay.classList.add('open');
    modal.classList.add('open');
    document.getElementById('settingsBtn').style.color = 'var(--gb)';
    updateSettingsPreview();
    const t = LANGS[currentLang] || LANGS['en'];
    ['settingsHtmlDesc', 'settingsAiDotDesc'].forEach(key => {
      const el = document.querySelector(`#settingsModal [data-i18n="${key}"]`);
      if (el && t[key]) el.textContent = t[key];
    });
  }
}
// Закрывает панель настроек
function closeSettings() {
  document.getElementById('settingsOverlay').classList.remove('open');
  document.getElementById('settingsModal').classList.remove('open');
  document.getElementById('settingsBtn').style.color = '';
}

// Показывает всплывающее уведомление (тост) о восстановлении/действии
function showRestoreToast(msg) {
  const toast = document.getElementById('restoreToast');
  document.getElementById('toastMsg').textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 4000);
}

const IDB_DOC_PREFIX = 'zmd_doc_';
const IDB_INDEX_KEY = 'zmd_doc_index';
const IDB_CURRENT_KEY = 'zmd_current_doc';

let docIndex = [];
let currentDocId = null;
let currentDocMeta = null;
let switchingDoc = false;

function genDocId() {
  return 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function escapeAttr(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Загружает индекс всех сохранённых документов
async function loadDocIndex() {
  try {
    const raw = await idbGet(IDB_INDEX_KEY);
    docIndex = raw ? JSON.parse(raw) : [];
  } catch (e) {
    docIndex = [];
  }
  return docIndex;
}
// Сохраняет индекс документов в IndexedDB
async function persistDocIndex() {
  try {
    await idbSet(IDB_INDEX_KEY, JSON.stringify(docIndex));
  } catch (e) {}
}
// Загружает полную запись документа по его идентификатору
async function loadDocRecord(id) {
  try {
    const raw = await idbGet(IDB_DOC_PREFIX + id);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}
// Сохраняет запись документа в IndexedDB
async function persistDocRecord(id, data) {
  await idbSet(IDB_DOC_PREFIX + id, JSON.stringify(data));
}
// Удаляет запись документа из IndexedDB
async function removeDocRecord(id) {
  try {
    await idbDelete(IDB_DOC_PREFIX + id);
  } catch (e) {}
}
// Запоминает, какой документ был открыт последним
async function setCurrentDocId(id) {
  currentDocId = id;
  try {
    await idbSet(IDB_CURRENT_KEY, id);
  } catch (e) {}
}
// Получает идентификатор последнего открытого документа
async function getStoredCurrentDocId() {
  try {
    return await idbGet(IDB_CURRENT_KEY);
  } catch (e) {
    return null;
  }
}

// Генерирует имя документа по умолчанию («Без названия»)
function untitledDocName() {
  const t = LANGS[currentLang] || LANGS['en'];
  return t.untitledDoc || 'Untitled Document';
}

// Создаёт новый документ и делает его текущим
async function createNewDoc(name) {
  const t = LANGS[currentLang] || LANGS['en'];
  const now = Date.now();
  const id = genDocId();
  const data = {
    name: name || untitledDocName(),
    isDefaultName: !name,
    content: t.init,
    fontSizes: defaultFontSizesForNewDoc(),
    scrollEd: 0,
    scrollPv: 0,
    createdAt: now,
    updatedAt: now
  };
  await persistDocRecord(id, data);
  docIndex.unshift({
    id,
    name: data.name,
    isDefaultName: data.isDefaultName,
    createdAt: now,
    updatedAt: now
  });
  await persistDocIndex();
  return id;
}

// Немедленно сохраняет текущий документ, сбрасывая отложенные таймеры
async function flushCurrentDocSave() {
  clearTimeout(saveTimer);
  clearTimeout(scrollSaveTimer);
  if (!currentDocId) return;
  await saveContent();
}

// Сохраняет содержимое, положение прокрутки и метаданные текущего документа
async function saveContent() {
  if (!currentDocId || switchingDoc) return;
  try {
    const now = Date.now();
    const data = {
      name: (currentDocMeta && currentDocMeta.name) || untitledDocName(),
      isDefaultName: currentDocMeta ? !!currentDocMeta.isDefaultName : true,
      content: ed.value,
      fontSizes: { ...fontSizes },
      scrollEd: ed.scrollTop,
      scrollPv: pv.scrollTop,
      createdAt: (currentDocMeta && currentDocMeta.createdAt) || now,
      updatedAt: now
    };
    await persistDocRecord(currentDocId, data);
    const idxItem = docIndex.find(d => d.id === currentDocId);
    if (idxItem) {
      idxItem.updatedAt = now;
    }
    await persistDocIndex();
    setSaveStatus('saved');
  } catch (e) {
    setSaveStatus('error');
  }
}

let saveTimer = null;
// Планирует автосохранение содержимого с задержкой (debounce)
function scheduleAutosave() {
  if (switchingDoc) return;
  setSaveStatus('unsaved');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveContent, 1500);
}

let scrollSaveTimer = null;
// Планирует сохранение позиции прокрутки отдельным лёгким debounce
function scheduleScrollSave() {
  if (switchingDoc || !currentDocId) return;
  clearTimeout(scrollSaveTimer);
  scrollSaveTimer = setTimeout(async () => {
    const data = await loadDocRecord(currentDocId);
    if (!data) return;
    data.scrollEd = ed.scrollTop;
    data.scrollPv = pv.scrollTop;
    await persistDocRecord(currentDocId, data);
  }, 400);
}
ed.addEventListener('scroll', scheduleScrollSave);
pv.addEventListener('scroll', scheduleScrollSave);

let syncingScroll = false;
// Синхронизирует прокрутку редактора и превью между собой
function syncScroll(source, target) {
  if (switchingDoc || syncingScroll) return;
  syncingScroll = true;
  const sMax = Math.max(1, source.scrollHeight - source.clientHeight);
  const ratio = source.scrollTop / sMax;
  const tMax = Math.max(0, target.scrollHeight - target.clientHeight);
  target.scrollTop = ratio * tMax;
  requestAnimationFrame(() => {
    syncingScroll = false;
  });
}
ed.addEventListener('scroll', () => syncScroll(ed, pv));
pv.addEventListener('scroll', () => syncScroll(pv, ed));

var _render = render;
render = function (v) {
  _render(v);
  scheduleAutosave();
};

document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    clearTimeout(saveTimer);
    saveContent();
  }
});

// Переключает приложение на другой сохранённый документ
async function switchToDoc(id) {
  const data = await loadDocRecord(id);
  if (!data) return false;
  switchingDoc = true;
  await setCurrentDocId(id);
  currentDocMeta = {
    name: data.name,
    isDefaultName: !!data.isDefaultName,
    createdAt: data.createdAt
  };
  ed.value = data.content;
  fontSizes = Object.assign({ ...FONT_DEFAULTS }, legacyFontSizes || {}, data.fontSizes || {});
  applyFontSizesToDOM();
  _render(data.content);
  setSaveStatus('saved');
  _aiPendingEdits = {};
  await _loadAiHistory();
  _refreshAiChatPanel();
  requestAnimationFrame(() => {
    ed.scrollTop = data.scrollEd || 0;
    pv.scrollTop = data.scrollPv || 0;
    switchingDoc = false;
  });
  renderDocList();
  return true;
}

// Переименовывает документ
async function renameDoc(id, newName) {
  const name = newName.trim();
  if (!name) return;
  const data = await loadDocRecord(id);
  if (!data) return;
  data.name = name;
  data.isDefaultName = false;
  data.updatedAt = Date.now();
  await persistDocRecord(id, data);
  const idxItem = docIndex.find(d => d.id === id);
  if (idxItem) {
    idxItem.name = name;
    idxItem.isDefaultName = false;
  }
  await persistDocIndex();
  if (id === currentDocId && currentDocMeta) {
    currentDocMeta.name = name;
    currentDocMeta.isDefaultName = false;
  }
  renderDocList();
}

// Отрисовывает список документов в панели управления документами
function renderDocList() {
  const listEl = document.getElementById('docList');
  if (!listEl) return;
  const t = LANGS[currentLang] || LANGS['en'];
  if (!docIndex.length) {
    listEl.innerHTML = `<div class="doc-item-empty">${t.docsEmpty || 'No documents yet'}</div>`;
    return;
  }
  const sorted = [...docIndex].sort((a, b) => b.updatedAt - a.updatedAt);
  listEl.innerHTML = sorted
    .map(d => {
      const active = d.id === currentDocId ? ' active' : '';
      const dateStr = new Date(d.updatedAt).toLocaleString();
      return `
      <div class="doc-item${active}" data-id="${d.id}" onclick="onDocItemClick(event,'${d.id}')">
        <div class="doc-item-main">
          <input class="doc-item-name" value="${escapeAttr(d.name)}"
            onclick="event.stopPropagation()"
            onkeydown="onDocNameKeydown(event,'${d.id}')"
            onblur="onDocNameBlur(event,'${d.id}')">
          <div class="doc-item-meta">${dateStr}</div>
        </div>
        <div class="doc-item-actions">
          <button class="doc-item-btn del" title="${escapeAttr(t.docsDelete || 'Delete')}" onclick="onDocDeleteClick(event,'${d.id}')">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h10M6.5 4V2.5h3V4M4.5 4l.5 9.5a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1L11.5 4"/></svg>
          </button>
        </div>
      </div>`;
    })
    .join('');
}

async function onDocItemClick(event, id) {
  if (id === currentDocId) {
    closeDocsPanel();
    return;
  }
  if (!(await confirmAiNav())) return;
  await flushCurrentDocSave();
  await switchToDoc(id);
  closeDocsPanel();
}

function onDocNameKeydown(event, id) {
  if (event.key === 'Enter') {
    event.preventDefault();
    event.target.blur();
  }
  if (event.key === 'Escape') {
    const item = docIndex.find(d => d.id === id);
    event.target.value = item ? item.name : '';
    event.target.blur();
  }
}
function onDocNameBlur(event, id) {
  const item = docIndex.find(d => d.id === id);
  const val = event.target.value.trim();
  if (!val) {
    event.target.value = item ? item.name : '';
    return;
  }
  if (item && val === item.name) return;
  renameDoc(id, val);
}

async function onDocDeleteClick(event, id) {
  event.stopPropagation();
  const t = LANGS[currentLang] || LANGS['en'];
  if (docIndex.length <= 1) {
    alert(t.docsCantDeleteLast || 'You must have at least one document.');
    return;
  }
  if (!confirm(t.docsConfirmDelete || 'Delete this document? This cannot be undone.')) return;
  if (!(await confirmAiNav())) return;
  await removeDocRecord(id);
  await _deleteAiHistory(id);
  docIndex = docIndex.filter(d => d.id !== id);
  await persistDocIndex();
  if (id === currentDocId) {
    const next = [...docIndex].sort((a, b) => b.updatedAt - a.updatedAt)[0];
    if (next) await switchToDoc(next.id);
  } else {
    renderDocList();
  }
}

async function onNewDocClick() {
  if (!(await confirmAiNav())) return;
  await flushCurrentDocSave();
  const id = await createNewDoc();
  await switchToDoc(id);
}

function toggleDocsPanel() {
  const overlay = document.getElementById('docsOverlay');
  const modal = document.getElementById('docsModal');
  const isOpen = modal.classList.contains('open');
  if (isOpen) {
    closeDocsPanel();
  } else {
    renderDocList();
    overlay.classList.add('open');
    modal.classList.add('open');
    document.getElementById('docsBtn').style.color = 'var(--gb)';
  }
}
function closeDocsPanel() {
  document.getElementById('docsOverlay').classList.remove('open');
  document.getElementById('docsModal').classList.remove('open');
  document.getElementById('docsBtn').style.color = '';
}

// Инициализация при запуске: загружает документы, открывает последний документ
async function initDocuments() {
  await loadDocIndex();

  if (!docIndex.length) {
    const id = await createNewDoc();
    await setCurrentDocId(id);
  }

  let curId = await getStoredCurrentDocId();
  if (!curId || !docIndex.some(d => d.id === curId)) {
    curId = [...docIndex].sort((a, b) => b.updatedAt - a.updatedAt)[0]?.id;
  }
  await switchToDoc(curId);
}

// Promise завершения инициализации: нужен, чтобы файлы из ОС открывались только после загрузки документов
const appReady = (async function initSave() {
  await loadLangSetting();
  await loadLegacyFontSizes();
  await loadSettings();
  await initDocuments();
})();
// Потребитель очереди запуска регистрируем сразу, чтобы не пропустить файлы, переданные при старте
initLaunchQueue();

// Обрабатывает пользовательские расширенные таблицы (:::table) при рендеринге
function _processCustomTables(v) {
  return v.replace(/:::table([^\n]*)\n([\s\S]*?):::/g, (_, opts, body) => {
    const stripe = /stripe/.test(opts) ? ' stripe' : '';
    const border = /border/.test(opts) ? ' border' : '';
    const lines = body
      .trim()
      .split('\n')
      .filter(l => l.trim().startsWith('|'));
    if (!lines.length) return _;
    const parseRow = (line, tag) => {
      const cells = line.split('|').slice(1, -1);
      return cells
        .map(cell => {
          const m = cell.match(/^([\s\S]*?)\{([^}]*)\}(.*)$/);
          let content = cell.trim();
          let classes = '';
          let extra = '';
          if (m) {
            content = (m[1] + m[3]).trim();
            const attrs = m[2].trim();
            if (/bg=b/.test(attrs)) classes += ' bg-b';
            if (/bg=r/.test(attrs)) classes += ' bg-r';
            if (/bg=y/.test(attrs)) classes += ' bg-y';
            if (/bg=g/.test(attrs)) classes += ' bg-g';
            if (/ac/.test(attrs)) classes += ' ac';
            if (/ar/.test(attrs)) classes += ' ar';
            if (/al/.test(attrs)) classes += ' al';
            if (/fw/.test(attrs)) classes += ' fw';
            const cs = attrs.match(/col=(\d+)/);
            const rs = attrs.match(/row=(\d+)/);
            if (cs) extra += ` colspan="${cs[1]}"`;
            if (rs) extra += ` rowspan="${rs[1]}"`;
          }
          const cls = classes.trim() ? ` class="${classes.trim()}"` : '';
          return `<${tag}${cls}${extra}>${content}</${tag}>`;
        })
        .join('');
    };
    const [header, ...rows] = lines;
    const thead = `<thead><tr>${parseRow(header, 'th')}</tr></thead>`;
    const tbody = `<tbody>${rows.map(r => `<tr>${parseRow(r, 'td')}</tr>`).join('')}</tbody>`;
    return `<table class="ztbl${stripe}${border}">${thead}${tbody}</table>`;
  });
}

// Открывает диалог вставки пользовательской таблицы
function openTblDialog() {
  document.getElementById('tblOverlay').classList.add('open');
  document.getElementById('tblCols').focus();
}
function closeTblDialog() {
  document.getElementById('tblOverlay').classList.remove('open');
}
// Вставляет сформированную таблицу в редактор
function insertCustomTable() {
  const cols = Math.max(1, Math.min(10, parseInt(document.getElementById('tblCols').value) || 3));
  const rows = Math.max(1, Math.min(20, parseInt(document.getElementById('tblRows').value) || 3));
  const stripe = document.getElementById('tblStripe').checked ? ' stripe' : '';
  const border = document.getElementById('tblBorder').checked ? ' border' : '';
  const th = LANGS[currentLang]?.tblHeaderDefault || 'Header';
  const tc = LANGS[currentLang]?.tblCellDefault || 'Cell';
  const hdr = '| ' + Array.from({ length: cols }, (_, i) => `${th}${i + 1}`).join(' | ') + ' |';
  const dataRows = Array.from(
    { length: rows },
    (_, r) =>
      '| ' + Array.from({ length: cols }, (_, c) => `${tc}${r + 1}-${c + 1}`).join(' | ') + ' |'
  );
  const snippet = `:::table${stripe}${border}\n${hdr}\n${dataRows.join('\n')}\n:::\n`;
  const { s, e } = { s: ed.selectionStart, e: ed.selectionEnd };
  ed.value = ed.value.slice(0, s) + snippet + ed.value.slice(e);
  ed.selectionStart = ed.selectionEnd = s + snippet.length;
  ed.focus();
  render(ed.value);
  closeTblDialog();
}
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeTblDialog();
    closeDiffModal();
  }
});

// Формирует дополнительную инструкцию для ИИ в режиме редактирования выделенного текста
function _aiEditDirective() {
  return '\n\nIMPORTANT: You are editing a specific piece of text, not chatting. Output ONLY the rewritten replacement text — no preamble, no explanation, no surrounding quotes or code fences, no meta-commentary before or after. Preserve the original language, tone, and Markdown formatting unless the instruction explicitly asks to change them.';
}
// Формирует системный промпт для ИИ-ассистента
function _aiSystem(isEdit) {
  const base = (LANGS[currentLang] || LANGS['en']).aiSystemPrompt;
  return isEdit ? base + _aiEditDirective() : base;
}

let _aiConvHistory = [];


let _aiPendingAttachments = [];

const AI_MAX_ATTACHMENTS = 6;

let _aiResponding = false;
let _aiAbortController = null;

function confirmAiNav() {
  if (!_aiResponding) return Promise.resolve(true);
  return new Promise(resolve => {
    const overlay = document.getElementById('aiNavOverlay');
    const modal = document.getElementById('aiNavModal');
    const msgEl = document.getElementById('aiNavMsg');
    const yesBtn = document.getElementById('aiNavYesBtn');
    const noBtn = document.getElementById('aiNavNoBtn');
    const t = LANGS[currentLang] || LANGS['en'];
    msgEl.textContent = t.aiNavWarning;
    yesBtn.textContent = t.aiNavYes;
    noBtn.textContent = t.aiNavNo;
    overlay.classList.add('open');
    modal.classList.add('open');
    const cleanup = result => {
      overlay.classList.remove('open');
      modal.classList.remove('open');
      yesBtn.removeEventListener('click', onYes);
      noBtn.removeEventListener('click', onNo);
      overlay.removeEventListener('click', onNo);
      resolve(result);
    };
    const onYes = () => cleanup(true);
    const onNo = () => cleanup(false);
    yesBtn.addEventListener('click', onYes);
    noBtn.addEventListener('click', onNo);
    overlay.addEventListener('click', onNo);
  });
}

function setAiResponding(state) {
  _aiResponding = state;
  const btn = document.getElementById('aiSendBtn');
  if (!btn) return;
  if (state) {
    btn.classList.add('ai-send-stop');
    btn.innerHTML =
      '<svg viewBox="0 0 16 16"><rect x="3" y="3" width="10" height="10" rx="1.5"/></svg>';
  } else {
    btn.classList.remove('ai-send-stop');
    btn.innerHTML =
      '<svg viewBox="0 0 16 16"><line x1="14" y1="2" x2="2" y2="8"/><line x1="14" y1="2" x2="6" y2="14"/><line x1="2" y1="8" x2="6" y2="14"/></svg>';
  }
}

function onAiSendBtnClick() {
  if (_aiResponding) {
    if (_aiAbortController) _aiAbortController.abort();
    return;
  }
  sendAi();
}

window.addEventListener('beforeunload', e => {
  if (!_aiResponding) return;
  e.preventDefault();
  e.returnValue = '';
});
const AI_MAX_BINARY_SIZE = 10 * 1024 * 1024; // изображения/PDF — до 10 МБ
const AI_MAX_TEXT_SIZE = 2 * 1024 * 1024; // текстовые файлы — до 2 МБ

const AI_TEXT_EXTENSIONS = new Set([
  'txt', 'md', 'markdown', 'mdx', 'csv', 'tsv', 'json', 'js', 'ts', 'jsx', 'tsx',
  'py', 'html', 'htm', 'css', 'scss', 'xml', 'yaml', 'yml', 'log', 'ini', 'conf',
  'sh', 'c', 'cpp', 'h', 'java', 'go', 'rs', 'rb', 'php', 'sql', 'tex', 'bib'
]);

function _aiFileKind(file) {
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (file.type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) {
    return 'image';
  }
  if (file.type === 'application/pdf' || ext === 'pdf') return 'pdf';
  if (
    file.type.startsWith('text/') ||
    file.type === 'application/json' ||
    AI_TEXT_EXTENSIONS.has(ext)
  ) {
    return 'text';
  }
  return null;
}

function _aiFormatSize(bytes) {
  if (bytes >= 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  if (bytes >= 1024) return Math.round(bytes / 1024) + ' KB';
  return bytes + ' B';
}

function _readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

function _readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsText(file);
  });
}

async function _addAiAttachment(file) {
  const t = LANGS[currentLang] || LANGS['en'];
  if (!_currentAiModelSupportsAttach()) return;
  if (_aiPendingAttachments.length >= AI_MAX_ATTACHMENTS) {
    _aiAddMsg(t.aiTooManyFiles.replace('{max}', AI_MAX_ATTACHMENTS), 'thinking');
    return;
  }
  const kind = _aiFileKind(file);
  if (!kind) {
    _aiAddMsg(t.aiUnsupportedFile.replace('{name}', file.name), 'thinking');
    return;
  }
  const maxSize = kind === 'text' ? AI_MAX_TEXT_SIZE : AI_MAX_BINARY_SIZE;
  if (file.size > maxSize) {
    _aiAddMsg(
      t.aiFileTooLarge.replace('{name}', file.name).replace('{max}', _aiFormatSize(maxSize)),
      'thinking'
    );
    return;
  }
  try {
    let data, mediaType;
    if (kind === 'text') {
      data = await _readFileAsText(file);
      mediaType = 'text/plain';
    } else {
      const dataUrl = await _readFileAsDataURL(file);
      const m = /^data:([^;]+);base64,([\s\S]*)$/.exec(dataUrl || '');
      mediaType = (m && m[1]) || file.type || (kind === 'pdf' ? 'application/pdf' : 'image/png');
      data = m ? m[2] : '';
    }
    _aiPendingAttachments.push({
      id: 'f' + Date.now() + Math.random().toString(36).slice(2),
      name: file.name,
      size: file.size,
      kind,
      mediaType,
      data
    });
    _renderAiPendingAttachments();
  } catch (_) {
    _aiAddMsg(t.aiFileReadError.replace('{name}', file.name), 'thinking');
  }
}

async function handleAiFileSelect(event) {
  const files = Array.from(event.target.files || []);
  event.target.value = '';
  for (const file of files) {
    await _addAiAttachment(file);
  }
}

async function handleAiInputPaste(event) {
  const items = Array.from(event.clipboardData?.items || []);
  const files = items
    .filter(it => it.kind === 'file')
    .map(it => it.getAsFile())
    .filter(Boolean);
  if (!files.length) return;
  event.preventDefault();
  for (const file of files) {
    await _addAiAttachment(file);
  }
}

function handleAiDragOver(event) {
  event.preventDefault();
  if (!_currentAiModelSupportsAttach()) return;
  document.getElementById('aiPanel')?.classList.add('ai-dragover');
}
function handleAiDragLeave(event) {
  if (event.target.id === 'aiPanel') {
    document.getElementById('aiPanel')?.classList.remove('ai-dragover');
  }
}
async function handleAiDrop(event) {
  event.preventDefault();
  document.getElementById('aiPanel')?.classList.remove('ai-dragover');
  const files = Array.from(event.dataTransfer?.files || []);
  for (const file of files) {
    await _addAiAttachment(file);
  }
}

function removeAiAttachment(id) {
  _aiPendingAttachments = _aiPendingAttachments.filter(a => a.id !== id);
  _renderAiPendingAttachments();
}

function _clearAiAttachments() {
  _aiPendingAttachments = [];
  _renderAiPendingAttachments();
}

function _buildAiAttachmentChip(a, removable) {
  const t = LANGS[currentLang] || LANGS['en'];
  const chip = document.createElement('div');
  chip.className = 'ai-chip';
  if (a.kind === 'image') {
    const img = document.createElement('img');
    img.className = 'ai-chip-thumb';
    img.src = `data:${a.mediaType};base64,${a.data}`;
    img.alt = a.name;
    chip.appendChild(img);
  } else {
    const icon = document.createElement('span');
    icon.className = 'ai-chip-icon';
    icon.textContent = a.kind === 'pdf' ? '📄' : '📝';
    chip.appendChild(icon);
  }
  const nameSpan = document.createElement('span');
  nameSpan.className = 'ai-chip-name';
  nameSpan.textContent = a.name;
  nameSpan.title = `${a.name} (${_aiFormatSize(a.size || 0)})`;
  chip.appendChild(nameSpan);
  if (removable) {
    const rm = document.createElement('button');
    rm.type = 'button';
    rm.className = 'ai-chip-rm';
    rm.title = t.aiRemoveFileTitle;
    rm.textContent = '×';
    rm.onclick = () => removeAiAttachment(a.id);
    chip.appendChild(rm);
  }
  return chip;
}

function _renderAiPendingAttachments() {
  const wrap = document.getElementById('aiAttachments');
  if (!wrap) return;
  wrap.innerHTML = '';
  if (!_aiPendingAttachments.length) {
    wrap.style.display = 'none';
    return;
  }
  wrap.style.display = 'flex';
  _aiPendingAttachments.forEach(a => wrap.appendChild(_buildAiAttachmentChip(a, true)));
}

function _aiBuildAnthropicContent(text, attachments) {
  if (!attachments || !attachments.length) return text;
  const blocks = attachments.map(a => {
    if (a.kind === 'image') {
      return { type: 'image', source: { type: 'base64', media_type: a.mediaType, data: a.data } };
    }
    if (a.kind === 'pdf') {
      return {
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: a.data },
        title: a.name
      };
    }
    return {
      type: 'document',
      source: { type: 'text', media_type: 'text/plain', data: a.data },
      title: a.name
    };
  });
  if (text) blocks.push({ type: 'text', text });
  return blocks;
}

function _aiBuildGeminiParts(text, attachments) {
  const parts = [];
  (attachments || []).forEach(a => {
    if (a.kind === 'image' || a.kind === 'pdf') {
      parts.push({ inlineData: { mimeType: a.mediaType, data: a.data } });
    } else {
      parts.push({ text: `[Attached file: ${a.name}]\n\`\`\`\n${a.data}\n\`\`\`` });
    }
  });
  if (text) parts.push({ text });
  return parts;
}

// Префикс ключа истории переписки с ИИ — своя история для каждого документа
const AI_HISTORY_PREFIX = 'zmd_ai_history_';

// Загружает историю переписки с ИИ-ассистентом для текущего документа
async function _loadAiHistory() {
  _aiConvHistory = [];
  if (!currentDocId) return;
  try {
    const raw = await idbGet(AI_HISTORY_PREFIX + currentDocId);
    if (raw) _aiConvHistory = JSON.parse(raw) || [];
  } catch (_) {
    _aiConvHistory = [];
  }
}
// Сохраняет историю переписки с ИИ-ассистентом для текущего документа
async function _saveAiHistory() {
  if (!currentDocId) return;
  try {
    await idbSet(AI_HISTORY_PREFIX + currentDocId, JSON.stringify(_aiConvHistory));
  } catch (_) {}
}
// Удаляет сохранённую историю переписки с ИИ для указанного документа
async function _deleteAiHistory(docId) {
  try {
    await idbDelete(AI_HISTORY_PREFIX + docId);
  } catch (_) {}
}

// Перерисовывает панель чата ИИ: историю текущего документа или приветствие, если её нет
function _refreshAiChatPanel() {
  const msgs = document.getElementById('aiMsgs');
  if (!msgs) return;
  const t = LANGS[currentLang] || LANGS['en'];
  msgs.innerHTML = '';
  if (_aiConvHistory.length) {
    _aiConvHistory.forEach(m => {
      const d = document.createElement('div');
      d.className = 'ai-bubble ' + (m.role === 'user' ? 'u' : 'a');
      if (m.attachments && m.attachments.length) {
        const row = document.createElement('div');
        row.className = 'ai-attachments';
        m.attachments.forEach(a => row.appendChild(_buildAiAttachmentChip(a, false)));
        d.appendChild(row);
      }
      if (m.text) {
        const textNode = document.createElement('div');
        textNode.style.whiteSpace = 'pre-wrap';
        textNode.textContent = m.text;
        d.appendChild(textNode);
      }
      msgs.appendChild(d);
    });
    msgs.scrollTop = msgs.scrollHeight;
  } else {
    const welcome = document.createElement('div');
    welcome.className = 'ai-bubble a';
    welcome.id = 'aiWelcomeMsg';
    welcome.setAttribute('data-i18n-html', 'aiWelcome');
    welcome.innerHTML = t.aiWelcome;
    msgs.appendChild(welcome);
    _updateAiWelcomeText();
  }
}

// Сбрасывает текущий диалог с ИИ-ассистентом (только для текущего документа)
async function resetAiConversation() {
  const t = LANGS[currentLang] || LANGS['en'];
  if (_aiConvHistory.length && !confirm(t.aiResetConfirm)) return;
  _aiConvHistory = [];
  _aiPendingEdits = {};
  if (currentDocId) await _deleteAiHistory(currentDocId);
  _refreshAiChatPanel();
}

let _aiPendingEdits = {};
let _aiEditCounter = 0;

function _escDiffHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Вычисляет постронный (word-level) diff между старым и новым текстом (алгоритм LCS)
function _diffTokens(oldStr, newStr) {
  const tokenizeWords = s => s.match(/\s+|[^\s]+/g) || [];
  const tokenizeLines = s => s.match(/[^\n]*\n|[^\n]+$/g) || (s ? [s] : []);
  let a = tokenizeWords(oldStr),
    b = tokenizeWords(newStr);
  if (a.length * b.length > 250000) {
    a = tokenizeLines(oldStr);
    b = tokenizeLines(newStr);
  }
  if (a.length * b.length > 4000000) {
    const ops = [];
    if (oldStr) ops.push({ t: 'del', v: oldStr });
    if (newStr) ops.push({ t: 'add', v: newStr });
    return ops;
  }
  const n = a.length,
    m = b.length;
  const dp = new Array(n + 1);
  for (let i = 0; i <= n; i++) dp[i] = new Uint32Array(m + 1);
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const ops = [];
  let i = 0,
    j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      ops.push({ t: 'eq', v: a[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      ops.push({ t: 'del', v: a[i] });
      i++;
    } else {
      ops.push({ t: 'add', v: b[j] });
      j++;
    }
  }
  while (i < n) {
    ops.push({ t: 'del', v: a[i] });
    i++;
  }
  while (j < m) {
    ops.push({ t: 'add', v: b[j] });
    j++;
  }
  const merged = [];
  for (const op of ops) {
    const last = merged[merged.length - 1];
    if (last && last.t === op.t) last.v += op.v;
    else merged.push({ t: op.t, v: op.v });
  }
  return merged;
}

// Преобразует операции diff в HTML-разметку с выделением вставок/удалений
function _renderDiffHtml(ops) {
  return ops
    .map(op => {
      const esc = _escDiffHtml(op.v);
      if (op.t === 'del') return `<del>${esc}</del>`;
      if (op.t === 'add') return `<ins>${esc}</ins>`;
      return esc;
    })
    .join('');
}

let _aiActiveModalEditId = null;

// Формирует карточку с предложением правки от ИИ (для последующего Accept/Reject)
function _aiOfferEdit(selS, selE, oldText, newText) {
  const t = LANGS[currentLang] || LANGS['en'];
  const id = 'e' + ++_aiEditCounter;
  _aiPendingEdits[id] = { s: selS, e: selE, oldText, newText };

  const msgs = document.getElementById('aiMsgs');
  const card = document.createElement('div');
  card.className = 'ai-bubble a';
  card.id = 'diffCard_' + id;
  card.innerHTML = `${_escDiffHtml(t.aiReviewEditMsg)} <button class="diff-open-btn" onclick="openDiffModal('${id}')">${_escDiffHtml(t.aiOpenReviewBtn)}</button>`;
  msgs.appendChild(card);
  msgs.scrollTop = msgs.scrollHeight;

  openDiffModal(id);
}

// Открывает модальное окно просмотра diff-предложения ИИ
function openDiffModal(id) {
  const edit = _aiPendingEdits[id];
  if (!edit) return;
  const t = LANGS[currentLang] || LANGS['en'];
  _aiActiveModalEditId = id;
  const ops = _diffTokens(edit.oldText, edit.newText);
  document.getElementById('diffmBody').innerHTML = _renderDiffHtml(ops);
  document.getElementById('diffmAcceptBtn').onclick = () => acceptAiEdit(id);
  document.getElementById('diffmRejectBtn').onclick = () => rejectAiEdit(id);
  document.getElementById('diffmOverlay').classList.add('open');
}

// Закрывает модальное окно просмотра diff
function closeDiffModal() {
  document.getElementById('diffmOverlay').classList.remove('open');
  _aiActiveModalEditId = null;
}

function _resolveDiffCard(id, message) {
  const card = document.getElementById('diffCard_' + id);
  if (card) card.innerHTML = _escDiffHtml(message);
  delete _aiPendingEdits[id];
  if (_aiActiveModalEditId === id) closeDiffModal();
}

// Принимает предложенную ИИ правку и применяет её к тексту редактора
function acceptAiEdit(id) {
  const t = LANGS[currentLang] || LANGS['en'];
  const edit = _aiPendingEdits[id];
  if (!edit) return;
  let { s, e, oldText, newText } = edit;
  if (ed.value.slice(s, e) !== oldText) {
    const found = oldText ? ed.value.indexOf(oldText) : -1;
    if (found === -1) {
      _resolveDiffCard(id, t.aiEditStale);
      return;
    }
    s = found;
    e = found + oldText.length;
  }
  ed.value = ed.value.slice(0, s) + newText + ed.value.slice(e);
  ed.selectionStart = ed.selectionEnd = s + newText.length;
  ed.focus();
  render(ed.value);
  _resolveDiffCard(id, t.aiEditApplied);
}

// Отклоняет предложенную ИИ правку
function rejectAiEdit(id) {
  const t = LANGS[currentLang] || LANGS['en'];
  _resolveDiffCard(id, t.aiEditDiscarded);
}

(async function loadAiKey() {
  _populateAiSelects();
  await _loadAiKeyForBackend();
  _updateAiWelcomeText();
  refreshAiModels(false);
})();

// Сохраняет введённый пользователем API-ключ отдельно для текущего бэкенда (Claude/Gemini) в IndexedDB
async function saveApiKey() {
  const k = document.getElementById('aiKey').value.trim();
  if (!k) return;
  _aiKey = k;
  try {
    await idbSet('zmd_ai_key_' + AI_BACKEND, k);
  } catch (_) {}
  // Новый ключ может давать доступ к другим моделям — обновляем список сразу
  refreshAiModels(true);
  const btn = document.querySelector('.ai-ksave');
  const t = LANGS[currentLang] || LANGS['en'];
  btn.textContent = t.aiSavedBtn;
  setTimeout(() => {
    btn.textContent = t.aiSaveBtn;
  }, 1500);
}

// Открывает/закрывает боковую панель ИИ-ассистента
function toggleAiPanel() {
  const p = document.getElementById('aiPanel');
  const b = document.getElementById('aiToggleBtn');
  // Без сети панель нельзя открыть (закрыть можно всегда)
  if (_isOffline() && !p.classList.contains('open')) return;
  const open = p.classList.toggle('open');
  b.classList.toggle('on', open);
  if (open) document.getElementById('aiInput').focus();
  setTimeout(clampEpFlex, 260);
}

// Проверяет, находится ли браузер в автономном режиме (без сети)
function _isOffline() {
  return typeof navigator !== 'undefined' && (navigator.onLine === false || _netReachable === false);
}

var _netReachable = true;
var _netProbing = false;
var _netProbeTimer = null;

function _setNetReachable(v) {
  if (v === _netReachable) return;
  _netReachable = v;
  updateAiOnlineState();
  _scheduleNetProbe();
}

async function _probeNetwork() {
  if (_netProbing) return;
  if (navigator.onLine === false) {
    _setNetReachable(false);
    return;
  }
  _netProbing = true;
  const host =
    AI_BACKEND === 'gemini'
      ? 'https://generativelanguage.googleapis.com/'
      : 'https://api.anthropic.com/';
  let ok = false;
  for (let i = 0; i < 2 && !ok; i++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    try {
      await fetch(host + '?_=' + Date.now(), {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-store',
        signal: ctrl.signal
      });
      ok = true;
    } catch (_) {
      if (navigator.onLine === false) break;
    }
    clearTimeout(timer);
  }
  _netProbing = false;
  _setNetReachable(ok);
}

function _scheduleNetProbe() {
  clearTimeout(_netProbeTimer);
  _netProbeTimer = setTimeout(
    async () => {
      if (!document.hidden) await _probeNetwork();
      _scheduleNetProbe();
    },
    _netReachable ? 15000 : 4000
  );
}

// Включает или отключает функции ИИ в зависимости от состояния сети (вызывается при online/offline)
function updateAiOnlineState() {
  const offline = _isOffline();
  const t = LANGS[currentLang] || LANGS['en'];
  document.body.classList.toggle('is-offline', offline);

  // Кнопка открытия панели: aria-disabled вместо disabled, чтобы подсказка (title) оставалась видимой
  const btn = document.getElementById('aiToggleBtn');
  if (btn) {
    btn.classList.toggle('ai-offline', offline);
    btn.setAttribute('aria-disabled', offline ? 'true' : 'false');
    btn.title = offline ? t.aiOfflineTitle : t.aiBtnTitle;
  }

  if (offline) {
    // Прерываем текущий запрос и закрываем панель
    if (_aiAbortController) _aiAbortController.abort();
    const p = document.getElementById('aiPanel');
    if (p && p.classList.contains('open')) toggleAiPanel();
  }

  // Элементы панели, которым нужна сеть
  const netSelectors = [
    '#aiInput',
    '#aiSendBtn',
    '#aiKey',
    '#aiKsaveBtn',
    '#aiBackendSelect',
    '#aiModelSelect',
    '#aiModelsRefreshBtn',
    '.ai-preset'
  ];
  document.querySelectorAll(netSelectors.join(',')).forEach(el => {
    el.disabled = offline;
  });
  _updateAiAttachAvailability();
}

window.addEventListener('online', () => {
  updateAiOnlineState();
  _probeNetwork();
});
window.addEventListener('offline', () => {
  updateAiOnlineState();
  _setNetReachable(false);
});
window.addEventListener('focus', _probeNetwork);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) _probeNetwork();
});
if (navigator.connection && navigator.connection.addEventListener) {
  navigator.connection.addEventListener('change', _probeNetwork);
}
updateAiOnlineState();
_probeNetwork();
_scheduleNetProbe();

function _aiAddMsg(text, role, attachments) {
  const msgs = document.getElementById('aiMsgs');
  const d = document.createElement('div');
  d.className = 'ai-bubble ' + role;
  if (attachments && attachments.length) {
    const row = document.createElement('div');
    row.className = 'ai-attachments';
    attachments.forEach(a => row.appendChild(_buildAiAttachmentChip(a, false)));
    d.appendChild(row);
  }
  if (text) {
    const textNode = document.createElement('div');
    textNode.style.whiteSpace = 'pre-wrap';
    textNode.textContent = text;
    d.appendChild(textNode);
  }
  msgs.appendChild(d);
  msgs.scrollTop = msgs.scrollHeight;
  return d;
}

function _aiAddInsertableMsg(text, pos) {
  const t = LANGS[currentLang] || LANGS['en'];
  const msgs = document.getElementById('aiMsgs');
  const wrap = document.createElement('div');
  wrap.className = 'ai-bubble a';
  const textDiv = document.createElement('div');
  textDiv.style.whiteSpace = 'pre-wrap';
  textDiv.textContent = text;
  const btn = document.createElement('button');
  btn.className = 'ai-insert vis';
  btn.style.marginTop = 'var(--s8)';
  btn.textContent = t.aiInsertBtn;
  btn.onclick = () => {
    ed.value = ed.value.slice(0, pos) + text + ed.value.slice(pos);
    ed.selectionStart = ed.selectionEnd = pos + text.length;
    ed.focus();
    render(ed.value);
    btn.disabled = true;
    btn.style.opacity = '.5';
    btn.style.cursor = 'default';
    btn.textContent = t.aiEditApplied;
  };
  wrap.appendChild(textDiv);
  wrap.appendChild(btn);
  msgs.appendChild(wrap);
  msgs.scrollTop = msgs.scrollHeight;
  return wrap;
}

function aiPreset(prompt, isEditPreset) {
  if (_aiResponding || _isOffline()) return;
  document.getElementById('aiInput').value = prompt;
  if (isEditPreset && ed.selectionStart === ed.selectionEnd && ed.value) {
    ed.selectionStart = 0;
    ed.selectionEnd = ed.value.length;
  }
  sendAi();
}



// Максимальная длина ответа (в токенах). С запасом: у новых моделей часть уходит на рассуждения
const AI_MAX_OUTPUT_TOKENS = 16000;

// Модели Anthropic, для которых работает серверный fallback при отказе (stop_reason: refusal)
const ANTHROPIC_FALLBACK_MODELS = new Set([
  'claude-fable-5-1',
  'claude-opus-5-5',
  'claude-opus-5',
  'claude-sonnet-5-5'
]);

// Формирует текст ошибки из HTTP-ответа API; при 404 подсказывает обновить список моделей
async function _aiErrorText(res) {
  const err = await res.json().catch(() => ({}));
  const msg = err?.error?.message || `HTTP ${res.status}`;
  if (res.status === 404) {
    const t = LANGS[currentLang] || LANGS['en'];
    return `${msg}
${t.aiModelNotFound}`;
  }
  return msg;
}

// Отправляет запрос к Gemini API и возвращает текст ответа
async function _callGemini(fullPrompt, isEdit, attachments) {
  // Ключ передаётся в заголовке, а не в URL, чтобы не попадать в логи и историю
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(AI_MODEL)}:generateContent`;
  const contents = _aiConvHistory.map(m => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: _aiBuildGeminiParts(m.text, m.attachments)
  }));
  contents.push({ role: 'user', parts: _aiBuildGeminiParts(fullPrompt, attachments) });
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': _aiKey },
    signal: _aiAbortController ? _aiAbortController.signal : undefined,
    body: JSON.stringify({
      system_instruction: { parts: [{ text: _aiSystem(isEdit) }] },
      contents,
      generationConfig: { maxOutputTokens: AI_MAX_OUTPUT_TOKENS }
    })
  });
  if (!res.ok) throw new Error(await _aiErrorText(res));
  const data = await res.json();
  const t = LANGS[currentLang] || LANGS['en'];
  const cand = data.candidates?.[0];
  // Части с thought: true — это рассуждения модели, в ответ их не включаем
  const text = cand?.content?.parts?.filter(p => !p.thought).map(p => p.text || '').join('') || '';
  if (!text && cand?.finishReason === 'MAX_TOKENS') throw new Error(t.aiTruncatedError);
  if (!text && (data.promptFeedback?.blockReason || cand?.finishReason === 'SAFETY')) {
    throw new Error(t.aiRefusal);
  }
  return text || t.aiEmptyResponse;
}

// Отправляет запрос к Anthropic API и возвращает текст ответа
async function _callAnthropic(fullPrompt, isEdit, attachments) {
  const messages = _aiConvHistory.map(m => ({
    role: m.role === 'user' ? 'user' : 'assistant',
    content: _aiBuildAnthropicContent(m.text, m.attachments)
  }));
  messages.push({ role: 'user', content: _aiBuildAnthropicContent(fullPrompt, attachments) });
  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': _aiKey,
    'anthropic-version': '2023-06-01',
    'anthropic-dangerous-direct-browser-access': 'true'
  };
  const body = {
    model: AI_MODEL,
    max_tokens: AI_MAX_OUTPUT_TOKENS,
    system: _aiSystem(isEdit),
    messages
  };
  // При отказе модели сервер сам повторяет запрос на рекомендованной модели
  if (ANTHROPIC_FALLBACK_MODELS.has(AI_MODEL)) {
    headers['anthropic-beta'] = 'server-side-fallback-2026-07-01';
    body.fallbacks = 'default';
  }
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers,
    signal: _aiAbortController ? _aiAbortController.signal : undefined,
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(await _aiErrorText(res));
  const data = await res.json();
  const t = LANGS[currentLang] || LANGS['en'];
  if (data.stop_reason === 'refusal') throw new Error(t.aiRefusal);
  // Берём только текстовые блоки (блоки thinking пропускаем)
  const text = (data.content || [])
    .filter(c => c.type === 'text')
    .map(c => c.text)
    .join('');
  if (!text && data.stop_reason === 'max_tokens') throw new Error(t.aiTruncatedError);
  return text || t.aiEmptyResponse;
}

// Основной обработчик отправки сообщения ИИ-ассистенту (чат или правка)
async function sendAi() {
  if (_aiResponding || _isOffline()) return;
  const input = document.getElementById('aiInput');
  const prompt = input.value.trim();
  const attachments = _aiPendingAttachments.slice();
  if (!prompt && !attachments.length) return;

  const t = LANGS[currentLang] || LANGS['en'];

  if (!_aiKey) {
    const backendName = AI_BACKEND === 'gemini' ? 'Google AI Studio' : 'Anthropic';
    _aiAddMsg(t.aiKeyWarning.replace('{backend}', backendName), 'thinking');
    return;
  }

  const selS = ed.selectionStart,
    selE = ed.selectionEnd;
  const selected = ed.value.substring(selS, selE);
  const isEdit = !!selected;
  const fullPrompt = isEdit
    ? `${prompt}\n\nRewrite the following text according to the instruction above. Return only the rewritten text, ready to directly replace the original — no preamble, no explanation, no quotes around it:\n"""\n${selected}\n"""`
    : prompt;

  input.value = '';
  input.style.height = '34px';
  _clearAiAttachments();
  _aiAddMsg(
    prompt + (selected ? t.aiSelectedSuffix.replace('{n}', selected.length) : ''),
    'u',
    attachments
  );

  setAiResponding(true);
  _aiAbortController = new AbortController();
  const thinking = _aiAddMsg(t.aiThinking, 'thinking');

  try {
    const text =
      AI_BACKEND === 'gemini'
        ? await _callGemini(fullPrompt, isEdit, attachments)
        : await _callAnthropic(fullPrompt, isEdit, attachments);
    thinking.remove();
    if (isEdit) {
      _aiOfferEdit(selS, selE, selected, text);
    } else {
      _aiAddInsertableMsg(text, selS);
    }
    _aiConvHistory.push({
      role: 'user',
      text: fullPrompt,
      attachments: attachments.length ? attachments : undefined
    });
    _aiConvHistory.push({ role: 'model', text });
    _saveAiHistory();
  } catch (err) {
    thinking.remove();
    if (err.name !== 'AbortError') {
      _aiAddMsg(t.aiErrorPrefix + err.message, 'thinking');
      if (err instanceof TypeError) _probeNetwork();
    }
  } finally {
    _aiAbortController = null;
    setAiResponding(false);
    document.getElementById('aiInput').focus();
  }
}

// Горизонтальная прокрутка панели инструментов колесом мыши
(function () {
  const tb = document.querySelector('.tb');
  if (!tb) return;

  tb.addEventListener(
    'wheel',
    function (e) {
      // Если панель целиком помещается — ничего не делаем
      if (tb.scrollWidth <= tb.clientWidth) return;

      // Горизонтальный жест тачпада браузер обработает сам
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;

      // Нормализация единиц: строки -> пиксели
      const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;

      e.preventDefault();
      tb.scrollLeft += delta;
    },
    { passive: false } // passive:false нужен для preventDefault
  );
})();
