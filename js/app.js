const ed = document.getElementById('ed'),
  mo = document.getElementById('mo'),
  emp = document.getElementById('emp'),
  pv = document.getElementById('pv');
const cc = document.getElementById('cc'),
  wc = document.getElementById('wc'),
  lc = document.getElementById('lc');

const SETTINGS_DEFAULTS = {
  htmlRendering: false
};
let appSettings = {
  ...SETTINGS_DEFAULTS
};

const FONT_DEFAULTS = {
  h1: 34,
  h2: 21,
  h3: 16,
  body: 13,
  latex: 13,
  mmd: 13,
  code: 12
};
let fontSizes = {
  ...FONT_DEFAULTS
};

let currentLang = 'en';
let previousLang = 'en';

marked.setOptions({
  gfm: true,
  breaks: true
});

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

// Собирает автономный HTML-файл (со встроенными стилями и содержимым) для экспорта/печати
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
    .md h1{font-size:var(--fz-h1,var(--f34));font-weight:800;margin-top:var(--s34);margin-bottom:var(--s13);position:relative;padding-bottom:${Math.round(fontSizes.h1*0.24)}px}
    .md h1::after{content:'';position:absolute;bottom:0;left:0;width:${Math.round(fontSizes.h1*1.6)}px;height:${Math.max(2,Math.round(fontSizes.h1*0.09))}px;background:linear-gradient(90deg,var(--gb),var(--gg));border-radius:99px}
    .md h2{font-size:var(--fz-h2,var(--f21));font-weight:700;margin-top:var(--s34);margin-bottom:var(--s8);display:flex;align-items:center;gap:var(--s8)}
    .md h2::before{content:'';display:block;width:${Math.max(3,Math.round(fontSizes.h2*0.22))}px;height:${Math.round(fontSizes.h2*0.9)}px;background:var(--gr);border-radius:99px;flex-shrink:0}
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
  Złoty MD — Copyright (c) Cybersecurity Department(Отдел кибербезопасности). MIT License.

  Third-party libraries used in this file:

  marked v9.1.6
    Copyright (c) 2011-2018, Christopher Jeffrey (https://github.com/markedjs/marked)
    MIT License — https://github.com/markedjs/marked/blob/master/LICENSE

  KaTeX v0.16.9
    Copyright (c) 2013-2020 Khan Academy and other contributors
    MIT License — https://github.com/KaTeX/KaTeX/blob/main/LICENSE

  Mermaid v10.6.1
    Copyright (c) 2014-2023 Knut Sveidqvist and contributors
    MIT License — https://github.com/mermaid-js/mermaid/blob/develop/LICENSE

  Google Sans
    Copyright (c) Google Inc.
    SIL Open Font License 1.1 — https://openfontlicense.org/open-font-license-official-text/

  JetBrains Mono v2020
    Copyright (c) 2020 JetBrains s.r.o.
    SIL Open Font License 1.1 — https://github.com/JetBrains/JetBrainsMono/blob/master/OFL.txt
-->
<html lang="${currentLang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Google+Sans:ital,opsz,wght@0,17..18,400..700;1,17..18,400..700&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css">
<style>${PREVIEW_CSS}</style>
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

function openPreviewWindow() {
  if (!ed.value.trim()) return;
  const html = buildPreviewHTML();
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.open();
  win.document.write(html);
  win.document.close();
}

let dlSelected = new Set();
const DL_OPT_IDS = {
  html: 'dlOptHtml',
  pdf: 'dlOptPdf',
  zmd: 'dlOptZmd',
  md: 'dlOptMd'
};

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

function buildZmdMeta() {
  return {
    zmdVersion: 1,
    name: getDocTitle(),
    isDefaultName: currentDocMeta ? !!currentDocMeta.isDefaultName : true,
    lang: currentLang,
    fontSizes: {
      ...fontSizes
    },
    createdAt: (currentDocMeta && currentDocMeta.createdAt) || Date.now(),
    updatedAt: Date.now()
  };
}

function downloadZMD() {
  if (!ed.value.trim()) return;
  const title = getDocTitle();
  const meta = buildZmdMeta();
  const zmd = `${ZMD_FM_OPEN}\n${JSON.stringify(meta, null, 2)}\n${ZMD_FM_CLOSE}\n\n${ed.value}`;
  const blob = new Blob([zmd], {
    type: 'text/markdown;charset=utf-8'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = title.replace(/[\\/:*?"<>|]/g, '_') + '.zmd';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

function downloadMD() {
  if (!ed.value.trim()) return;
  const title = getDocTitle();
  const standard = toStandardMarkdown(ed.value);
  const blob = new Blob([standard], {
    type: 'text/markdown;charset=utf-8'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = title.replace(/[\\/:*?"<>|]/g, '_') + '.md';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

function _mdConvertImageAttrs(v) {
  return v.replace(/!\[([^\]]*)\]\(([^)]+)\)\{([^}]+)\}/g, (_, alt, src) => `![${alt}](${src})`);
}

function _mdConvertCustomTables(v) {
  return v.replace(/:::table([^\n]*)\n([\s\S]*?):::/g, (_, opts, body) => {
    const lines = body.trim().split('\n').filter(l => l.trim().startsWith('|'));
    if (!lines.length) return '';
    const stripCell = (cell) => cell.replace(/\{[^}]*\}/g, '').trim();
    const toRow = (line) => {
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

// Преобразует собственный синтаксис Złoty MD в стандартный Markdown/GFM для экспорта в .md
function toStandardMarkdown(v) {
  let out = v;
  out = _mdConvertCustomTables(out);
  out = _mdConvertImageAttrs(out);
  return out;
}

// Извлекает метаданные (front matter) из .zmd-файла; без них документ считается обычным Markdown
function parseZmdText(text) {
  if (text.startsWith(ZMD_FM_OPEN)) {
    const closeIdx = text.indexOf(ZMD_FM_CLOSE);
    if (closeIdx !== -1) {
      const jsonStr = text.slice(ZMD_FM_OPEN.length, closeIdx).trim();
      const rest = text.slice(closeIdx + ZMD_FM_CLOSE.length).replace(/^\n+/, '');
      try {
        const meta = JSON.parse(jsonStr);
        return {
          meta,
          content: rest
        };
      } catch (e) {
        return {
          meta: null,
          content: text
        };
      }
    }
  }
  return {
    meta: null,
    content: text
  };
}

function onOpenFileClick() {
  const input = document.getElementById('fileOpenInput');
  input.value = '';
  input.click();
}

async function handleFileOpenInput(evt) {
  const file = evt.target.files && evt.target.files[0];
  if (!file) return;
  const text = await file.text();
  const {
    meta,
    content
  } = parseZmdText(text);
  const baseName = file.name.replace(/\.(zmd|md|markdown|txt)$/i, '');

  await flushCurrentDocSave();
  const now = Date.now();
  const id = genDocId();
  const data = {
    name: (meta && meta.name) || baseName || untitledDocName(),
    isDefaultName: meta ? !!meta.isDefaultName : false,
    content: content,
    lang: (meta && meta.lang) || currentLang,
    fontSizes: Object.assign({
      ...FONT_DEFAULTS
    }, (meta && meta.fontSizes) || {}),
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

function getDocTitle() {
  const name = ((currentDocMeta && currentDocMeta.name) || '').trim();
  const isDefaultName = !name || (currentDocMeta && currentDocMeta.isDefaultName);
  if (!isDefaultName) return name;
  return (ed.value.match(/^#\s+(.+)/m) || [])[1]?.trim() || name || 'document';
}

function downloadHTML() {
  if (!ed.value.trim()) return;
  const title = getDocTitle();
  const html = buildPreviewHTML(title);
  const blob = new Blob([html], {
    type: 'text/html;charset=utf-8'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = title.replace(/[\\/:*?"<>|]/g, '_') + '.html';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

// Открывает диалог печати браузера как способ экспорта документа в PDF
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
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:none;visibility:hidden';
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
  dockerfile: 'Dockerfile',
};

function _esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function applyDiff(pre, code) {
  const raw = (code.textContent || '').replace(/\n$/, '');
  const lines = raw.split('\n');
  const inner = lines.map(line => {
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
  }).join('');
  code.innerHTML = `<span class="diff-wrap">${inner}</span>`;
}

function addCopyBtns() {
  mo.querySelectorAll('pre').forEach(pre => {
    if (pre.querySelector('.pre-header')) return;
    const code = pre.querySelector('code');

    const cls = code ? (code.className.match(/language-(\S+)/) || [])[1] : '';

    const diffLangMatch = cls && cls.match(/^diff_(.+)$/i);
    const isDiff = cls === 'diff' || cls === 'patch' || !!diffLangMatch;

    const badgeCls = diffLangMatch ? diffLangMatch[1].toLowerCase() : (cls || '').toLowerCase();
    const badgeLabel = diffLangMatch ?
      (LANG_NAMES[badgeCls] || diffLangMatch[1]) :
      (cls ? (LANG_NAMES[badgeCls] || cls) : '');

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

function _protectEscapes(v) {
  _escStore = [];

  const OPAQUE_RE = /(\x02[^\x03]*\x03)/g;
  const parts = v.split(OPAQUE_RE);

  return parts.map((part, idx) => {
    if (idx % 2 === 1) return part;

    const CODE_RE = /(`+)([\s\S]*?)\1/g;
    const codeSlots = [];
    const CS = '\x04C';
    const CE = '\x05';
    let p = part.replace(CODE_RE, (full) => {
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
  }).join('');
}

function _restoreEscapes(html) {
  return html.replace(
    new RegExp('\\x02ESC(\\d+)\\x03', 'g'),
    (_, i) => {
      const ch = _escStore[parseInt(i)];
      return ch.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
  );
}

const LATEX_TOKEN = '\x02LTX';
const LATEX_END = '\x03';
let _latexStore = [];

const DISPLAY_ENVS = [
  'equation', 'equation\\*', 'align', 'align\\*', 'gather', 'gather\\*',
  'multline', 'multline\\*', 'eqnarray', 'eqnarray\\*', 'flalign', 'flalign\\*',
  'alignat', 'alignat\\*', 'split'
].join('|');
const DISPLAY_ENV_RE = new RegExp(
  `\\\\begin\\{(${DISPLAY_ENVS})\\}([\\s\\S]+?)\\\\end\\{\\1\\}`, 'g'
);

function _katexRender(math, displayMode) {
  if (typeof katex === 'undefined') return displayMode ? `<div>$$${math}$$</div>` : `<span>$${math}$</span>`;
  const el = document.createElement(displayMode ? 'div' : 'span');
  katex.render(math, el, {
    displayMode,
    throwOnError: false,
    output: 'html'
  });
  return el.outerHTML;
}

function _protectLatex(v) {
  _latexStore = [];
  const push = (type, math) => {
    _latexStore.push({
      type,
      math
    });
    return LATEX_TOKEN + (_latexStore.length - 1) + LATEX_END;
  };
  v = v.replace(DISPLAY_ENV_RE, (full, env, math) => push('block', full));
  v = v.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => push('block', math));
  v = v.replace(/\\\[([\s\S]+?)\\\]/g, (_, math) => push('block', math));
  v = v.replace(/\\\((.+?)\\\)/g, (_, math) => push('inline', math));
  v = v.replace(/\$([^\$\n]+?)\$/g, (_, math) => push('inline', math));
  return v;
}

function _restoreLatex(html) {
  return html.replace(
    new RegExp(`\\x02LTX(\\d+)\\x03`, 'g'),
    (_, i) => {
      const {
        type,
        math
      } = _latexStore[parseInt(i)];
      const isEnv = type === 'block' && math.startsWith('\\begin');
      if (isEnv) {
        if (typeof katex === 'undefined') return `<div><code>${math}</code></div>`;
        const el = document.createElement('div');
        katex.render(math, el, {
          displayMode: true,
          throwOnError: false,
          output: 'html'
        });
        return el.outerHTML;
      }
      return _katexRender(math, type === 'block');
    }
  );
}

// Определяет, является ли документ LaTeX-документом (а не Markdown), по его содержимому
function _isLatexDoc(v) {
  return /\\documentclass\s*[\[{]/.test(v) || /\\begin\s*\{document\}/.test(v);
}

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
  body = body.replace(/\\author\{([\s\S]+?)\}/g, (_, a) => `\n__AUTHOR__${a.replace(/\\\\|\\and/g,', ')}__ENDAUTHOR__\n`);
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

  body = body.replace(/\\begin\{itemize\}([\s\S]+?)\\end\{itemize\}/g, (_, content) =>
    content.replace(/\\item\s*/g, '- ').trim() + '\n'
  );
  body = body.replace(/\\begin\{enumerate\}([\s\S]+?)\\end\{enumerate\}/g, (_, content) => {
    let i = 0;
    return content.replace(/\\item\s*/g, () => `${++i}. `).trim() + '\n';
  });
  body = body.replace(/\\begin\{description\}([\s\S]+?)\\end\{description\}/g, (_, content) =>
    content.replace(/\\item\[([^\]]*)\]/g, (_, lbl) => `- **${lbl}**: `).trim() + '\n'
  );

  body = body.replace(/\\begin\{verbatim\}([\s\S]+?)\\end\{verbatim\}/g,
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

  return {
    body,
    pkgs
  };
}

// Рендерит LaTeX-документ целиком (отдельный путь от обычного рендеринга Markdown)
function _renderLatexDoc(v) {
  const {
    body,
    pkgs
  } = _parseLatexDoc(v);

  let processed = _protectLatex(body);

  processed = processed.replace(/__TITLE__(.+?)__ENDTITLE__/g, (_, t) => `# ${t}`);
  processed = processed.replace(/__AUTHOR__(.+?)__ENDAUTHOR__/g, (_, a) => `*${a}*`);

  processed = _processImageAttrs(processed);
  let html = marked.parse(processed);

  html = _restoreLatex(html);

  const pkgBanner = pkgs.length ?
    `<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;
         padding:8px 13px;margin-bottom:21px;border-radius:8px;
         background:var(--grt);border:1px solid var(--gr);font-size:11px;color:var(--gr)">
         <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="8" cy="8" r="6.5"/><line x1="8" y1="7" x2="8" y2="11.5"/><circle cx="8" cy="4.5" r=".8" fill="currentColor" stroke="none"/></svg>
         <strong style="font-weight:700">Packages:</strong>
         ${pkgs.map(p=>`<code style="background:rgba(234,67,53,.12);color:var(--gr);padding:1px 5px;border-radius:4px;font-size:11px">${p}</code>`).join('')}
       </div>` :
    '';

  return pkgBanner + html;
}

function _mmdEsc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function _decodeHtmlEntities(s) {
  return s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
}

// Преобразует блоки кода ```mermaid в разметку, пригодную для рендеринга библиотекой Mermaid
function _convertMermaidFences(html) {
  let idx = 0;
  return html.replace(/<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g, (_, code) => {
    const decoded = _decodeHtmlEntities(code).trim();
    const uid = 'mmd-' + Date.now() + '-' + (++idx) + '-' + Math.random().toString(36).slice(2, 7);
    const escaped = _mmdEsc(decoded);
    return '<div class="mermaid-wrap"><div class="mermaid" id="' + uid + '" data-src="' + escaped + '">' + escaped + '</div></div>';
  });
}

const _edBadge = document.getElementById('edBadge');

function _setEditorMode(isLatex) {
  if (isLatex) {
    _edBadge.className = 'badge tx';
    _edBadge.textContent = 'LaTeX';
  } else {
    _edBadge.className = 'badge bl';
    _edBadge.textContent = 'Markdown';
  }
}

function _processImageAttrs(v) {
  return v.replace(/!\[([^\]]*)\]\(([^)]+)\)\{([^}]+)\}/g, (_, alt, src, attrs) => {
    const styleProps = [];
    let hasWidth = false;
    attrs.split(/[,;\s]+/).filter(Boolean).forEach(a => {
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
    return `<img src="${src}" alt="${safeAlt}"${styleAttr}>`;
  });
}

// Центральная функция рендеринга: превращает содержимое редактора в HTML предпросмотра
function render(v) {
  if (!appSettings.htmlRendering) {
    v = escapeHtmlInMarkdown(v);
  }
  if (!v.trim()) {
    emp.style.display = 'flex';
    mo.style.display = 'none';
    _setEditorMode(false);
  } else {
    emp.style.display = 'none';
    mo.style.display = 'block';
    const isLatex = _isLatexDoc(v);
    _setEditorMode(isLatex);
    if (isLatex) {
      mo.innerHTML = _renderLatexDoc(v);
    } else {
      const hasMmd = /```\s*mermaid\b/.test(v);
      const vv = _processCustomTables(_processImageAttrs(v));
      let _html = marked.parse(_protectEscapes(_protectLatex(vv)));
      _html = _convertMermaidFences(_html);
      mo.innerHTML = _restoreEscapes(_restoreLatex(_html));
      if (hasMmd && typeof mermaid !== 'undefined') {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const nodes = Array.from(mo.querySelectorAll('.mermaid'));
            (async () => {
              for (let idx = 0; idx < nodes.length; idx++) {
                const node = nodes[idx];
                node.id = 'mmd-' + Date.now() + '-' + idx + '-' + Math.random().toString(36).slice(2, 7);
                if (!node.dataset.src) node.dataset.src = node.textContent;
                try {
                  await mermaid.run({
                    nodes: [node],
                    suppressErrors: true
                  });
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
                    errDiv.textContent = LANGS[currentLang]?.mermaidSyntaxError || LANGS['en'].mermaidSyntaxError;
                    wrap.appendChild(errDiv);
                  }
                }
              }
            })();
          });
        });
      }
    }
    addCopyBtns();
  }
  cc.textContent = v.length.toLocaleString();
  wc.textContent = (v.trim() ? v.trim().split(/\s+/).length : 0).toLocaleString();
  lc.textContent = v.split('\n').length.toLocaleString();
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

function wr(b, a) {
  const dt = LANGS[currentLang]?.defaultText || 'text';
  const {
    s,
    e,
    t
  } = gs(), r = b + (t || dt) + a;
  ed.value = ed.value.slice(0, s) + r + ed.value.slice(e);
  ed.selectionStart = s + b.length;
  ed.selectionEnd = s + b.length + (t || dt).length;
  ed.focus();
  render(ed.value)
}

function ins(p, sf) {
  const {
    s,
    e,
    t
  } = gs(), r = p + (t || '') + sf;
  ed.value = ed.value.slice(0, s) + r + ed.value.slice(e);
  ed.selectionStart = ed.selectionEnd = s + p.length + (t ? t.length : 0) + sf.length;
  ed.focus();
  render(ed.value)
}

function iLink() {
  const dl = LANGS[currentLang]?.defaultLink || 'link';
  const {
    s,
    e,
    t
  } = gs(), l = t || dl, u = 'https://example.com', r = `[${l}](${u})`;
  ed.value = ed.value.slice(0, s) + r + ed.value.slice(e);
  ed.selectionStart = s + l.length + 3;
  ed.selectionEnd = s + l.length + 3 + u.length;
  ed.focus();
  render(ed.value)
}

function iImg() {
  const da = LANGS[currentLang]?.defaultImgAlt || 'alt';
  const {
    s,
    e,
    t
  } = gs();
  const snip = `![${t||da}](https://example.com/img.png){width=300px}`;
  ed.value = ed.value.slice(0, s) + snip + ed.value.slice(e);
  ed.selectionStart = ed.selectionEnd = s + snip.length;
  ed.focus();
  render(ed.value)
}

function iLatexInline() {
  const {
    s,
    e,
    t
  } = gs(), m = t || 'x^2';
  const r = `$${m}$`;
  ed.value = ed.value.slice(0, s) + r + ed.value.slice(e);
  ed.selectionStart = s + 1;
  ed.selectionEnd = s + 1 + m.length;
  ed.focus();
  render(ed.value)
}

function iLatexBlock() {
  const {
    s,
    e,
    t
  } = gs(), m = t || '\\int_0^\\infty f(x)\\,dx';
  const r = `$$\n${m}\n$$`;
  ed.value = ed.value.slice(0, s) + r + ed.value.slice(e);
  ed.selectionStart = s + 3;
  ed.selectionEnd = s + 3 + m.length;
  ed.focus();
  render(ed.value)
}

function iDiff() {
  const t0 = LANGS[currentLang] || LANGS['en'];
  const lang = prompt(t0.diffPrompt || 'Enter language name (leave blank for plain diff):', '');
  const fence = lang && lang.trim() ? `diff_${lang.trim()}` : 'diff';
  const {
    s,
    e,
    t
  } = gs();
  const body = t || (t0.diffDefault || '- removed line\n+ added line');
  const r = `\`\`\`${fence}\n${body}\n\`\`\``;
  ed.value = ed.value.slice(0, s) + r + ed.value.slice(e);
  ed.selectionStart = s + fence.length + 4;
  ed.selectionEnd = s + fence.length + 4 + body.length;
  ed.focus();
  render(ed.value);
}

function iMermaid() {
  const {
    s,
    e,
    t
  } = gs();
  const body = t || 'flowchart LR\n  A[Start] --> B[End]';
  const r = '```mermaid\n' + body + '\n```';
  ed.value = ed.value.slice(0, s) + r + ed.value.slice(e);
  ed.selectionStart = s + 10;
  ed.selectionEnd = s + 10 + body.length;
  ed.focus();
  render(ed.value);
}

function mTab(tab, btn) {
  document.querySelectorAll('.tab').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  document.getElementById('eP').classList.toggle('v', tab === 'e');
  document.getElementById('pP').classList.toggle('v', tab === 'p')
}

const rz = document.getElementById('rz'),
  eP = document.getElementById('eP');
let drag = false,
  sx, sw;
rz.addEventListener('mousedown', e => {
  drag = true;
  sx = e.clientX;
  sw = eP.getBoundingClientRect().width;
  rz.classList.add('on');
  document.body.style.cursor = 'col-resize';
  e.preventDefault()
});
document.addEventListener('mousemove', e => {
  if (!drag) return;
  const tot = document.getElementById('panes').getBoundingClientRect().width - 5;
  const w = Math.max(200, Math.min(tot - 200, sw + (e.clientX - sx)));
  eP.style.flex = `0 0 ${(w/tot*100).toFixed(3)}%`
});
document.addEventListener('mouseup', () => {
  if (!drag) return;
  drag = false;
  rz.classList.remove('on');
  document.body.style.cursor = ''
});

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
    aiWelcome: '👋 Hi! I\'m the AI Assistant (Claude) for this Markdown editor.<br><br>Enter your Anthropic API key and press "Save", then select text and click a preset, or ask anything freely.',
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
    aiInputPlaceholder: 'Ask a question or give an instruction…',
    aiInsertBtn: '⬇ Insert into editor',
    aiKeyWarning: '⚠ Please enter your {backend} API key and press "Save".',
    aiThinking: '● Thinking…',
    aiErrorPrefix: '⚠ Error: ',
    aiSelectedSuffix: ' (selected text: {n} chars)',
    aiEmptyResponse: '(empty response)',
    aiResetBtnTitle: 'Reset conversation',
    aiResetConfirm: 'Clear the conversation history? This cannot be undone.',
    aiSystemPrompt: 'You are an AI assistant that helps write and edit Markdown documents. Use Markdown syntax appropriately and give helpful answers. Keep responses concise and practical.',
    aboutAuthor: 'Author',
    aboutCopyright: 'Copyright',
    aboutVersion: 'Version',
    aboutLicense: 'License',
    aboutDesc: 'A Markdown editor with golden-ratio proportions and a Google-inspired color palette.',
    aboutLibraries: 'Libraries',
    aboutLibKatexCopy: '© 2013–2020 Khan Academy and contributors',
    aboutLibMermaidCopy: '© 2014–2023 Knut Sveidqvist and contributors',
    aboutLibGoogleFontsBadge: 'SIL OFL 1.1',
    aboutLibGoogleSansCopy: '© Google Inc. — SIL Open Font License 1.1',
    aboutLibMarkedCopy: '© 2011–2018 Christopher Jeffrey',
    aboutLibJetbrainsBadge: 'SIL OFL 1.1',
    aboutLibJetbrainsCopy: '© 2020 JetBrains s.r.o.',
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
    settingsDocNameDesc: 'Used as the title for HTML and PDF downloads. Leave blank to use the first heading.',
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
    settingsHtmlDesc: 'Render all raw HTML tags in Markdown (e.g. <div>, <span>, <table>, <iframe>…). When off, all tags are escaped and shown as plain text.',
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
  },
  ru: {
    chars: 'симв.',
    words: 'слов',
    lines: 'строк',
    editorLabel: 'Редактор',
    previewLabel: 'Просмотр',
    tabEdit: 'Редактировать',
    tabPreview: 'Просмотр',
    codeCopy: 'Копировать',
    codeCopied: 'Скопировано',
    emptyTitle: 'Область просмотра',
    emptyDesc: 'Введите Markdown в редактор для просмотра в реальном времени',
    aboutBtnTitle: 'Авторство и права',
    aiBtnTitle: 'ИИ-помощник',
    aiWelcome: '👋 Привет! Я ИИ-ассистент (Claude) для этого Markdown-редактора.<br><br>Введите ключ API Anthropic и нажмите «Сохранить», затем выделите текст и нажмите шаблон или просто задайте вопрос.',
    aiKeyPlaceholder: 'Введите ключ API Anthropic…',
    aiSaveBtn: 'Сохранить',
    aiSavedBtn: 'Сохранено ✓',
    aiPresetContinue: 'Продолжить',
    aiPresetSummarize: 'Резюме',
    aiPresetTranslateJa: 'На японский',
    aiPresetTranslateEn: 'На английский',
    aiPresetProofread: 'Правка',
    aiPresetBullet: 'В список',
    aiPresetContinuePrompt: 'Продолжи текст',
    aiPresetSummarizePrompt: 'Сделай резюме',
    aiPresetTranslateJaPrompt: 'Переведи на японский',
    aiPresetTranslateEnPrompt: 'Переведи на английский',
    aiPresetProofreadPrompt: 'Проверь и исправь текст',
    aiPresetBulletPrompt: 'Преобразуй в маркированный список',
    aiPresetTranslateNative: 'На русский',
    aiPresetTranslateNativePrompt: 'Переведи на русский',
    aiInputPlaceholder: 'Введите вопрос или инструкцию…',
    aiInsertBtn: '⬇ Вставить в редактор',
    aiKeyWarning: '⚠ Введите ключ API {backend} и нажмите «Сохранить».',
    aiThinking: '● Думаю…',
    aiErrorPrefix: '⚠ Ошибка: ',
    aiSelectedSuffix: ' (выделено символов: {n})',
    aiEmptyResponse: '(пустой ответ)',
    aiResetBtnTitle: 'Сбросить диалог',
    aiResetConfirm: 'Очистить историю диалога? Это действие необратимо.',
    aiSystemPrompt: 'Вы — ИИ-ассистент, помогающий писать и редактировать документы в формате Markdown. Используйте синтаксис Markdown уместно и давайте полезные ответы. Отвечайте кратко и по делу.',
    aboutAuthor: 'Автор',
    aboutCopyright: 'Авторское право',
    aboutVersion: 'Версия',
    aboutLicense: 'Лицензия',
    aboutDesc: 'Редактор Markdown с пропорциями золотого сечения и цветовой палитрой в стиле Google.',
    aboutLibraries: 'Библиотеки',
    aboutLibKatexCopy: '© 2013–2020 Khan Academy и соавторы',
    aboutLibMermaidCopy: '© 2014–2023 Knut Sveidqvist и соавторы',
    aboutLibGoogleFontsBadge: 'SIL OFL 1.1',
    aboutLibGoogleSansCopy: '© Google Inc. — SIL Open Font License 1.1',
    aboutLibMarkedCopy: '© 2011–2018 Christopher Jeffrey',
    aboutLibJetbrainsBadge: 'SIL OFL 1.1',
    aboutLibJetbrainsCopy: '© 2020 JetBrains s.r.o.',
    langBtnTitle: 'Язык',
    tblDialogTitle: 'Вставить пользовательскую таблицу',
    tblColsLabel: 'Столбцы',
    tblRowsLabel: 'Строки (без учёта заголовка)',
    tblStripeLabel: 'Полосатая',
    tblBorderLabel: 'С рамкой',
    tblCancelBtn: 'Отмена',
    tblInsertBtn: 'Вставить',
    placeholder: 'Введите Markdown здесь…\n\n# Заголовок\n**жирный** *курсив* `код`',
    defaultText: 'текст',
    defaultLink: 'ссылка',
    defaultImgAlt: 'описание',
    tblHeaderDefault: 'Заголовок',
    tblCellDefault: 'Ячейка',
    mermaidSyntaxError: '⚠ Mermaid: ошибка синтаксиса (diagram syntax error)',
    savedLabel: 'Сохранено',
    unsavedLabel: 'Не сохранено',
    restoredMsg: 'Содержимое восстановлено из сохранённой сессии',
    tooLargeMsg: 'Содержимое слишком большое для cookie',
    downloadBtnTitle: 'Скачать',
    dlTitle: 'Скачать как…',
    dlHtmlDesc: 'Автономный HTML-файл',
    dlPdfDesc: 'Сохранить через диалог печати',
    dlZmdDesc: 'Markdown + метаданные редактора',
    dlMdDesc: 'Стандартный файл Markdown',
    dlHint: 'Выберите один или несколько форматов',
    dlDownloadBtn: 'Скачать',
    settingsDocTitle: 'Документ',
    settingsDocNameLabel: 'Название документа',
    settingsDocNameDesc: 'Используется как заголовок при скачивании HTML и PDF. Оставьте пустым, чтобы использовать первый заголовок.',
    openWindow: 'Открыть',
    diffPrompt: 'Введите название языка (оставьте пустым для обычного diff):',
    diffDefault: '- удалённая строка\n+ добавленная строка',
    ttBold: 'Жирный',
    ttItalic: 'Курсив',
    ttStrike: 'Зачёркнутый',
    ttCode: 'Встроенный код',
    ttLink: 'Ссылка',
    ttImage: 'Изображение',
    ttQuote: 'Цитата',
    ttHr: 'Горизонтальная линия',
    ttBullet: 'Маркированный список',
    ttOrdered: 'Нумерованный список',
    ttTask: 'Список задач',
    ttCodeBlock: 'Блок кода',
    ttMathInline: 'Встроенная формула ($...$)',
    ttMathBlock: 'Блочная формула ($$...$$)',
    ttDiff: 'Блок diff (diff / diff_язык)',
    ttMermaid: 'Диаграмма Mermaid (```mermaid...```)',
    ttTable: 'Вставить пользовательскую таблицу',
    fontSizeBtnTitle: 'Настройки размера шрифта',
    fontPanelTitle: 'Размеры шрифтов',
    fontH1: 'H1',
    fontH2: 'H2',
    fontH3: 'H3',
    fontBody: 'Текст',
    fontLatex: 'LaTeX',
    fontMermaid: 'Mermaid',
    fontCode: 'Код',
    fontReset: 'Сбросить до умолчаний',
    settingsBtnTitle: 'Настройки',
    settingsTitle: 'Настройки',
    settingsRenderTitle: 'Рендеринг HTML',
    settingsHtmlLabel: 'Встроенный HTML',
    settingsHtmlDesc: 'Рендерить все HTML-теги прямо в Markdown (например <div>, <span>, <table>, <iframe>…). При отключении все теги отображаются как обычный текст.',
    settingsPreviewLabel: 'Предпросмотр',
    init: `# Добро пожаловать в Złoty MD 🎨

**Пропорции золотого сечения** и **цветовая палитра в стиле Google** — Markdown-редактор с чувством стиля.

## ✦ Математика с LaTeX

Золотое сечение $\\phi = \\dfrac{1+\\sqrt{5}}{2} \\approx 1{,}618$ удовлетворяет уравнению $\\phi^2 = \\phi + 1$.

Тождество Эйлера — одна из красивейших формул в математике:

$$e^{i\\pi} + 1 = 0$$

Золотое сечение в виде непрерывной дроби:

$$\\phi = 1 + \\cfrac{1}{1 + \\cfrac{1}{1 + \\cfrac{1}{1 + \\cdots}}}$$

Интеграл Гаусса и формула Фибоначчи:

$$\\int_{-\\infty}^{\\infty} e^{-x^2}\\,dx = \\sqrt{\\pi} \\qquad F_n = \\frac{\\phi^n - \\psi^n}{\\sqrt{5}}$$

## Система золотого сечения

| Элемент | Значение |
|---------|----------|
| Соотношение макета | **61,8 %** / **38,2 %** |
| Отступы | 3, 5, 8, 13, 21, 34, 55, 89 px |
| Высота шапки | **55 px** (число Фибоначчи) |
| Размеры шрифта | 13, 21, 34 px |

## Пример кода

\`\`\`javascript
// Золотое сечение
const φ = (1 + Math.sqrt(5)) / 2; // 1,6180339887…
const fib = n => n <= 1 ? n : fib(n-1) + fib(n-2);
console.log([...Array(8)].map((_,i) => fib(i))); // [0,1,1,2,3,5,8,13]
\`\`\`

## Пример diff

\`\`\`diff
--- a/ratio.js
+++ b/ratio.js
@@ -1,6 +1,8 @@
 const φ = (1 + Math.sqrt(5)) / 2;
-const ratio = 0.5;
+const ratio = 1 / φ;           // золотое дополнение 0,618…
+const inverse = φ - 1;         // то же значение, другая форма
 
 function layout(total) {
-  return { main: total * 0.5, side: total * 0.5 };
+  return { main: total * ratio, side: total * (1 - ratio) };
 }
\`\`\`

## Контрольный список

- [x] Макет по золотому сечению (61,8 / 38,2)
- [x] Палитра Google из 4 цветов
- [x] Просмотр в реальном времени · Изменяемый разделитель
- [x] Языковой бейдж на блоках кода (30+ языков)
- [x] Подсветка diff через \`\`\`diff\`\`\`
- [x] Диаграммы Mermaid через \`\`\`mermaid...\`\`\`

## Диаграмма Mermaid

\`\`\`mermaid
flowchart LR
  A([Начало]) --> B{Решение}
  B -- Да   --> C[Процесс A]
  B -- Нет  --> D[Процесс B]
  C --> E([Конец])
  D --> E
\`\`\`

## Диаграмма последовательности

\`\`\`mermaid
sequenceDiagram
  participant U as Пользователь
  participant E as Редактор
  participant P as Просмотр
  U->>E: Ввод Markdown
  E->>P: Рендеринг HTML
  P-->>U: Предпросмотр
\`\`\`

---

*Начните писать свой документ!*
`
  },
  ja: {
    chars: '文字',
    words: '単語',
    lines: '行',
    editorLabel: 'エディター',
    previewLabel: 'プレビュー',
    tabEdit: '編集',
    tabPreview: 'プレビュー',
    codeCopy: 'コピー',
    codeCopied: 'コピー済',
    emptyTitle: 'プレビューエリア',
    emptyDesc: '左のエディターにMarkdownを入力するとリアルタイムで表示されます',
    aboutBtnTitle: 'クレジット・著作権情報',
    aiBtnTitle: 'AIアシスタント',
    aiWelcome: '👋 こんにちは！MarkdownエディタのAIアシスタントです（Claude）。<br><br>Anthropic のAPIキーを入力して「保存」してから、テキストを選択してプリセットを押すか、自由に質問してください。',
    aiKeyPlaceholder: 'Anthropic APIキーを入力…',
    aiSaveBtn: '保存',
    aiSavedBtn: '保存済 ✓',
    aiPresetContinue: '続きを書く',
    aiPresetSummarize: '要約',
    aiPresetTranslateJa: '和訳',
    aiPresetTranslateEn: '英訳',
    aiPresetProofread: '校正',
    aiPresetBullet: '箇条書き',
    aiPresetContinuePrompt: '続きを書いて',
    aiPresetSummarizePrompt: '要約して',
    aiPresetTranslateJaPrompt: '日本語に翻訳して',
    aiPresetTranslateEnPrompt: '英語に翻訳して',
    aiPresetProofreadPrompt: '校正・修正して',
    aiPresetBulletPrompt: '箇条書きに変換して',
    aiPresetTranslateNative: '和訳',
    aiPresetTranslateNativePrompt: '日本語に翻訳して',
    aiInputPlaceholder: '質問や指示を入力…',
    aiInsertBtn: '⬇ エディタに挿入',
    aiKeyWarning: '⚠ {backend} のAPIキーを入力して「保存」してください。',
    aiThinking: '● 考え中…',
    aiErrorPrefix: '⚠ エラー: ',
    aiSelectedSuffix: ' (選択テキスト: {n}文字)',
    aiEmptyResponse: '(空の返答)',
    aiResetBtnTitle: '会話をリセット',
    aiResetConfirm: '会話履歴を削除しますか？この操作は元に戻せません。',
    aiSystemPrompt: 'あなたはMarkdownドキュメントの執筆・編集を支援するAIアシスタントです。Markdown記法を適切に使用して、役立つ回答を提供してください。返答は簡潔かつ実用的にしてください。',
    aboutAuthor: '作者',
    aboutCopyright: '著作権',
    aboutVersion: 'バージョン',
    aboutLicense: 'ライセンス',
    aboutDesc: '黄金比のプロポーションと Google インスパイアドなカラーパレットを持つ Markdown エディター。',
    aboutLibraries: '使用ライブラリ',
    aboutLibKatexCopy: '© 2013–2020 Khan Academy 他',
    aboutLibMermaidCopy: '© 2014–2023 Knut Sveidqvist 他',
    aboutLibGoogleFontsBadge: 'SIL OFL 1.1',
    aboutLibGoogleSansCopy: '© Google Inc. — SIL Open Font License 1.1',
    aboutLibMarkedCopy: '© 2011–2018 Christopher Jeffrey',
    aboutLibJetbrainsBadge: 'SIL OFL 1.1',
    aboutLibJetbrainsCopy: '© 2020 JetBrains s.r.o.',
    langBtnTitle: '言語',
    tblDialogTitle: 'カスタムテーブルを挿入',
    tblColsLabel: '列数',
    tblRowsLabel: '行数（ヘッダー除く）',
    tblStripeLabel: 'ストライプ',
    tblBorderLabel: '枠線',
    tblCancelBtn: 'キャンセル',
    tblInsertBtn: '挿入',
    placeholder: 'ここにMarkdownを入力…\n\n# 見出し\n**太字** *斜体* `コード`',
    defaultText: 'テキスト',
    defaultLink: 'リンク',
    defaultImgAlt: '説明',
    tblHeaderDefault: '見出し',
    tblCellDefault: 'セル',
    mermaidSyntaxError: '⚠ Mermaid: 構文エラー（diagram syntax error）',
    savedLabel: '保存済み',
    unsavedLabel: '未保存',
    restoredMsg: '保存した内容を復元しました',
    tooLargeMsg: 'コンテンツが大きすぎてCookieに保存できません',
    downloadBtnTitle: 'ダウンロード',
    dlTitle: '形式を選択…',
    dlHtmlDesc: 'スタンドアロン HTML ファイル',
    dlPdfDesc: '印刷ダイアログ経由で保存',
    dlZmdDesc: 'Markdown + エディタメタデータ',
    dlMdDesc: '標準 Markdown ファイル',
    dlHint: '形式を1つ以上選択してください',
    dlDownloadBtn: 'ダウンロード',
    settingsDocTitle: 'ドキュメント',
    settingsDocNameLabel: 'ドキュメント名',
    settingsDocNameDesc: 'HTML・PDF ダウンロード時のタイトルに使われます。空欄の場合は最初の見出しを使用します。',
    docsBtnTitle: 'ドキュメント管理',
    docsPanelTitle: 'ドキュメント',
    docsNewBtn: '新規ドキュメント',
    docsOpenBtn: 'ファイルを開く',
    docsEmpty: 'ドキュメントがまだありません',
    docsDelete: '削除',
    docsConfirmDelete: 'このドキュメントを削除しますか？元に戻せません。',
    docsCantDeleteLast: 'ドキュメントは最低1つ必要です。',
    untitledDoc: '無題のドキュメント',
    docsOpenedMsg: '「{name}」を開きました',
    openWindow: '開く',
    diffPrompt: '言語名を入力（空欄なら diff のみ）:',
    diffDefault: '- 削除された行\n+ 追加された行',
    ttBold: '太字',
    ttItalic: '斜体',
    ttStrike: '打消し線',
    ttCode: 'インラインコード',
    ttLink: 'リンク',
    ttImage: '画像',
    ttQuote: '引用',
    ttHr: '区切り線',
    ttBullet: '箇条書き',
    ttOrdered: '番号リスト',
    ttTask: 'チェックリスト',
    ttCodeBlock: 'コードブロック',
    ttMathInline: 'インライン数式 ($...$)',
    ttMathBlock: 'ブロック数式 ($$...$$)',
    ttDiff: 'diff ブロック (diff / diff_言語名)',
    ttMermaid: 'Mermaid ダイアグラム (```mermaid...```)',
    ttTable: 'カスタムテーブルを挿入',
    fontSizeBtnTitle: '文字サイズ設定',
    fontPanelTitle: '文字サイズ',
    fontH1: 'H1',
    fontH2: 'H2',
    fontH3: 'H3',
    fontBody: '本文',
    fontLatex: 'LaTeX',
    fontMermaid: 'Mermaid',
    fontCode: 'コード',
    fontReset: 'デフォルトに戻す',
    settingsBtnTitle: '設定',
    settingsTitle: '設定',
    settingsRenderTitle: 'HTMLレンダリング',
    settingsHtmlLabel: 'インラインHTML',
    settingsHtmlDesc: 'MarkdownにすべてのHTMLタグを直接書いた場合（例：<div>、<span>、<table>、<iframe>など）に実際にレンダリングするかどうか。OFFにするとすべてのタグは文字としてそのまま表示されます。',
    settingsPreviewLabel: 'プレビュー',
    init: `# Złoty MD へようこそ 🎨

**黄金比のプロポーション**と **Google インスパイアドなカラーパレット** — デザイン感覚あふれる Markdown エディター。

## ✦ LaTeX 数式

黄金比 $\\phi = \\dfrac{1+\\sqrt{5}}{2} \\approx 1.618$ は $\\phi^2 = \\phi + 1$ を満たします。

数学史上もっとも美しい等式と称されるオイラーの等式：

$$e^{i\\pi} + 1 = 0$$

連分数による黄金比の表現：

$$\\phi = 1 + \\cfrac{1}{1 + \\cfrac{1}{1 + \\cfrac{1}{1 + \\cdots}}}$$

ガウス積分とフィボナッチ一般項：

$$\\int_{-\\infty}^{\\infty} e^{-x^2}\\,dx = \\sqrt{\\pi} \\qquad F_n = \\frac{\\phi^n - \\psi^n}{\\sqrt{5}}$$

## 黄金比システム

<table class="ztbl border">
<thead><tr><th>要素</th><th>値</th></tr></thead>
<tbody>
<tr><td class="fw bg-b">レイアウト比</td><td><strong>61.8 %</strong> / <strong>38.2 %</strong></td></tr>
<tr><td class="fw bg-r">スペーシング</td><td>3, 5, 8, 13, 21, 34, 55, 89 px</td></tr>
<tr><td class="fw bg-y">ヘッダー高さ</td><td><strong>55 px</strong>（フィボナッチ数）</td></tr>
<tr><td class="fw bg-g">フォントサイズ</td><td>13, 21, 34 px</td></tr>
</tbody>
</table>

## コードの例

\`\`\`javascript
// 黄金比を計算
const φ = (1 + Math.sqrt(5)) / 2; // 1.6180339887…
const fib = n => n <= 1 ? n : fib(n-1) + fib(n-2);
console.log([...Array(8)].map((_,i) => fib(i))); // [0,1,1,2,3,5,8,13]
\`\`\`

## diff の例

\`\`\`diff
--- a/ratio.js
+++ b/ratio.js
@@ -1,6 +1,8 @@
 const φ = (1 + Math.sqrt(5)) / 2;
-const ratio = 0.5;
+const ratio = 1 / φ;           // 黄金比の補数 0.618…
+const inverse = φ - 1;         // 同じ値・別表現
 
 function layout(total) {
-  return { main: total * 0.5, side: total * 0.5 };
+  return { main: total * ratio, side: total * (1 - ratio) };
 }
\`\`\`

## チェックリスト

- [x] 黄金比レイアウト（61.8 / 38.2）
- [x] Google 4色パレット
- [x] リアルタイムプレビュー・ドラッグリサイザー
- [x] コードブロックへの言語バッジ表示（30言語以上）
- [x] \`\`\`diff\`\`\` によるdiffハイライト
- [x] \`\`\`mermaid...\`\`\` で Mermaid ダイアグラム

## Mermaid ダイアグラム

\`\`\`mermaid
flowchart LR
  A([開始]) --> B{判断}
  B -- はい --> C[処理A]
  B -- いいえ --> D[処理B]
  C --> E([終了])
  D --> E
\`\`\`

## シーケンス図

\`\`\`mermaid
sequenceDiagram
  participant U as ユーザー
  participant E as エディター
  participant P as プレビュー
  U->>E: Markdownを入力
  E->>P: HTMLをレンダリング
  P-->>U: ライブプレビュー表示
\`\`\`

---

*さあ、あなたのドキュメントを書き始めましょう！*
`
  },
  de: {
    chars: 'Zeichen',
    words: 'Wörter',
    lines: 'Zeilen',
    editorLabel: 'Editor',
    previewLabel: 'Vorschau',
    tabEdit: 'Bearbeiten',
    tabPreview: 'Vorschau',
    codeCopy: 'Kopieren',
    codeCopied: 'Kopiert',
    emptyTitle: 'Vorschaubereich',
    emptyDesc: 'Gib Markdown im Editor ein, um eine Live-Vorschau zu sehen',
    aboutBtnTitle: 'Credits & Copyright',
    aiBtnTitle: 'KI-Assistent',
    aiWelcome: '👋 Hallo! Ich bin der KI-Assistent (Claude) für diesen Markdown-Editor.<br><br>Gib deinen Anthropic API-Schlüssel ein und klicke auf „Speichern“, wähle dann Text aus und klicke auf eine Vorlage oder stelle einfach eine Frage.',
    aiKeyPlaceholder: 'Anthropic API-Schlüssel eingeben…',
    aiSaveBtn: 'Speichern',
    aiSavedBtn: 'Gespeichert ✓',
    aiPresetContinue: 'Weiterschreiben',
    aiPresetSummarize: 'Zusammenfassen',
    aiPresetTranslateJa: 'Ins Japanische',
    aiPresetTranslateEn: 'Ins Englische',
    aiPresetProofread: 'Korrigieren',
    aiPresetBullet: 'Aufzählung',
    aiPresetContinuePrompt: 'Schreibe weiter',
    aiPresetSummarizePrompt: 'Fasse dies zusammen',
    aiPresetTranslateJaPrompt: 'Übersetze ins Japanische',
    aiPresetTranslateEnPrompt: 'Übersetze ins Englische',
    aiPresetProofreadPrompt: 'Korrigiere und verbessere dies',
    aiPresetBulletPrompt: 'Wandle dies in eine Aufzählung um',
    aiPresetTranslateNative: 'Ins Deutsche',
    aiPresetTranslateNativePrompt: 'Übersetze ins Deutsche',
    aiInputPlaceholder: 'Frage oder Anweisung eingeben…',
    aiInsertBtn: '⬇ In Editor einfügen',
    aiKeyWarning: '⚠ Bitte gib deinen {backend} API-Schlüssel ein und klicke auf „Speichern“.',
    aiThinking: '● Denke nach…',
    aiErrorPrefix: '⚠ Fehler: ',
    aiSelectedSuffix: ' (ausgewählter Text: {n} Zeichen)',
    aiEmptyResponse: '(leere Antwort)',
    aiResetBtnTitle: 'Unterhaltung zurücksetzen',
    aiResetConfirm: 'Gesprächsverlauf löschen? Dies kann nicht rückgängig gemacht werden.',
    aiSystemPrompt: 'Du bist ein KI-Assistent, der beim Schreiben und Bearbeiten von Markdown-Dokumenten hilft. Verwende die Markdown-Syntax angemessen und gib hilfreiche Antworten. Halte die Antworten prägnant und praktisch.',
    aboutAuthor: 'Autor',
    aboutCopyright: 'Urheberrecht',
    aboutVersion: 'Version',
    aboutLicense: 'Lizenz',
    aboutDesc: 'Ein Markdown-Editor mit Proportionen des Goldenen Schnitts und einer von Google inspirierten Farbpalette.',
    aboutLibraries: 'Bibliotheken',
    aboutLibKatexCopy: '© 2013–2020 Khan Academy und Mitwirkende',
    aboutLibMermaidCopy: '© 2014–2023 Knut Sveidqvist und Mitwirkende',
    aboutLibGoogleFontsBadge: 'SIL OFL 1.1',
    aboutLibGoogleSansCopy: '© Google Inc. — SIL Open Font License 1.1',
    aboutLibMarkedCopy: '© 2011–2018 Christopher Jeffrey',
    aboutLibJetbrainsBadge: 'SIL OFL 1.1',
    aboutLibJetbrainsCopy: '© 2020 JetBrains s.r.o.',
    langBtnTitle: 'Sprache',
    tblDialogTitle: 'Benutzerdefinierte Tabelle einfügen',
    tblColsLabel: 'Spalten',
    tblRowsLabel: 'Zeilen (ohne Kopfzeile)',
    tblStripeLabel: 'Gestreift',
    tblBorderLabel: 'Umrandet',
    tblCancelBtn: 'Abbrechen',
    tblInsertBtn: 'Einfügen',
    placeholder: 'Markdown hier eingeben…\n\n# Überschrift\n**fett** *kursiv* `Code`',
    defaultText: 'Text',
    defaultLink: 'Link',
    defaultImgAlt: 'Bildbeschreibung',
    tblHeaderDefault: 'Überschrift',
    tblCellDefault: 'Zelle',
    mermaidSyntaxError: '⚠ Mermaid: Syntaxfehler (diagram syntax error)',
    savedLabel: 'Gespeichert',
    unsavedLabel: 'Ungespeichert',
    restoredMsg: 'Inhalt aus gespeicherter Sitzung wiederhergestellt',
    tooLargeMsg: 'Inhalt zu groß für Cookie',
    downloadBtnTitle: 'Herunterladen',
    dlTitle: 'Herunterladen als…',
    dlHtmlDesc: 'Eigenständige HTML-Datei',
    dlPdfDesc: 'Über Druckdialog speichern',
    dlZmdDesc: 'Markdown + Editor-Metadaten',
    dlMdDesc: 'Standard-Markdown-Datei',
    dlHint: 'Wählen Sie ein oder mehrere Formate',
    dlDownloadBtn: 'Herunterladen',
    settingsDocTitle: 'Dokument',
    settingsDocNameLabel: 'Dokumentname',
    settingsDocNameDesc: 'Wird als Titel für HTML- und PDF-Downloads verwendet. Leer lassen, um die erste Überschrift zu verwenden.',
    openWindow: 'Öffnen',
    diffPrompt: 'Sprachname eingeben (leer lassen für einfaches diff):',
    diffDefault: '- entfernte Zeile\n+ hinzugefügte Zeile',
    ttBold: 'Fett',
    ttItalic: 'Kursiv',
    ttStrike: 'Durchgestrichen',
    ttCode: 'Inline-Code',
    ttLink: 'Link',
    ttImage: 'Bild',
    ttQuote: 'Zitat',
    ttHr: 'Trennlinie',
    ttBullet: 'Aufzählungsliste',
    ttOrdered: 'Nummerierte Liste',
    ttTask: 'Aufgabenliste',
    ttCodeBlock: 'Codeblock',
    ttMathInline: 'Inline-Formel ($...$)',
    ttMathBlock: 'Blockformel ($$...$$)',
    ttDiff: 'Diff-Block (diff / diff_Sprache)',
    ttMermaid: 'Mermaid-Diagramm (```mermaid...```)',
    ttTable: 'Benutzerdefinierte Tabelle einfügen',
    fontSizeBtnTitle: 'Schriftgrößen-Einstellungen',
    fontPanelTitle: 'Schriftgrößen',
    fontH1: 'H1',
    fontH2: 'H2',
    fontH3: 'H3',
    fontBody: 'Text',
    fontLatex: 'LaTeX',
    fontMermaid: 'Mermaid',
    fontCode: 'Code',
    fontReset: 'Auf Standard zurücksetzen',
    settingsBtnTitle: 'Einstellungen',
    settingsTitle: 'Einstellungen',
    settingsRenderTitle: 'HTML-Rendering',
    settingsHtmlLabel: 'Inline-HTML',
    settingsHtmlDesc: 'Alle HTML-Tags direkt im Markdown rendern (z. B. <div>, <span>, <table>, <iframe>…). Wenn deaktiviert, werden alle Tags als Text angezeigt.',
    settingsPreviewLabel: 'Vorschau',
    init: `# Willkommen bei Złoty MD 🎨

**Proportionen des Goldenen Schnitts** und eine **von Google inspirierte Farbpalette** — Markdown mit Designgefühl.

## ✦ Mathematik mit LaTeX

Der Goldene Schnitt $\\phi = \\dfrac{1+\\sqrt{5}}{2} \\approx 1{,}618$ erfüllt $\\phi^2 = \\phi + 1$.

Eulers Identität — oft als schönste Formel der Mathematik bezeichnet:

$$e^{i\\pi} + 1 = 0$$

Der Goldene Schnitt als Kettenbruch:

$$\\phi = 1 + \\cfrac{1}{1 + \\cfrac{1}{1 + \\cfrac{1}{1 + \\cdots}}}$$

Gaußsches Integral und Fibonacci-Formel:

$$\\int_{-\\infty}^{\\infty} e^{-x^2}\\,dx = \\sqrt{\\pi} \\qquad F_n = \\frac{\\phi^n - \\psi^n}{\\sqrt{5}}$$

## Goldener-Schnitt-System

| Element | Wert |
|---------|------|
| Layoutverhältnis | **61,8 %** / **38,2 %** |
| Abstände | 3, 5, 8, 13, 21, 34, 55, 89 px |
| Kopfzeile | **55 px** (Fibonacci) |
| Schriftgrößen | 13, 21, 34 px |

## Codebeispiel

\`\`\`javascript
// Goldener Schnitt
const φ = (1 + Math.sqrt(5)) / 2; // 1,6180339887…
const fib = n => n <= 1 ? n : fib(n-1) + fib(n-2);
console.log([...Array(8)].map((_,i) => fib(i))); // [0,1,1,2,3,5,8,13]
\`\`\`

## Diff-Beispiel

\`\`\`diff
--- a/ratio.js
+++ b/ratio.js
@@ -1,6 +1,8 @@
 const φ = (1 + Math.sqrt(5)) / 2;
-const ratio = 0.5;
+const ratio = 1 / φ;           // goldenes Komplement 0,618…
+const inverse = φ - 1;         // gleicher Wert, andere Form
 
 function layout(total) {
-  return { main: total * 0.5, side: total * 0.5 };
+  return { main: total * ratio, side: total * (1 - ratio) };
 }
\`\`\`

## Checkliste

- [x] Goldener-Schnitt-Layout (61,8 / 38,2)
- [x] Google 4-Farben-Palette
- [x] Echtzeit-Vorschau · Verschiebbarer Trenner
- [x] Sprach-Badge auf Codeblöcken (30+ Sprachen)
- [x] Diff-Hervorhebung mit \`\`\`diff\`\`\`
- [x] Mermaid-Diagramme mit \`\`\`mermaid...\`\`\`

## Mermaid-Diagramm

\`\`\`mermaid
flowchart LR
  A([Start]) --> B{Entscheidung}
  B -- Ja  --> C[Prozess A]
  B -- Nein --> D[Prozess B]
  C --> E([Ende])
  D --> E
\`\`\`

## Sequenzdiagramm

\`\`\`mermaid
sequenceDiagram
  participant U as Benutzer
  participant E as Editor
  participant P as Vorschau
  U->>E: Markdown eingeben
  E->>P: HTML rendern
  P-->>U: Live-Vorschau
\`\`\`

---

*Beginne jetzt mit deinem Dokument!*
`
  },
  pl: {
    chars: 'znaki',
    words: 'słowa',
    lines: 'linie',
    editorLabel: 'Edytor',
    previewLabel: 'Podgląd',
    tabEdit: 'Edycja',
    tabPreview: 'Podgląd',
    codeCopy: 'Kopiuj',
    codeCopied: 'Skopiowano',
    emptyTitle: 'Obszar podglądu',
    emptyDesc: 'Wpisz Markdown w edytorze, aby zobaczyć podgląd na żywo',
    aboutBtnTitle: 'Autorzy i prawa autorskie',
    aiBtnTitle: 'Asystent AI',
    aiWelcome: '👋 Cześć! Jestem asystentem AI (Claude) dla tego edytora Markdown.<br><br>Wpisz klucz API Anthropic i kliknij „Zapisz”, następnie zaznacz tekst i wybierz szablon lub po prostu zadaj pytanie.',
    aiKeyPlaceholder: 'Wpisz klucz API Anthropic…',
    aiSaveBtn: 'Zapisz',
    aiSavedBtn: 'Zapisano ✓',
    aiPresetContinue: 'Kontynuuj',
    aiPresetSummarize: 'Streść',
    aiPresetTranslateJa: 'Na japoński',
    aiPresetTranslateEn: 'Na angielski',
    aiPresetProofread: 'Korekta',
    aiPresetBullet: 'Lista',
    aiPresetContinuePrompt: 'Kontynuuj pisanie',
    aiPresetSummarizePrompt: 'Streść ten tekst',
    aiPresetTranslateJaPrompt: 'Przetłumacz na japoński',
    aiPresetTranslateEnPrompt: 'Przetłumacz na angielski',
    aiPresetProofreadPrompt: 'Popraw i skoryguj ten tekst',
    aiPresetBulletPrompt: 'Zamień na listę punktowaną',
    aiPresetTranslateNative: 'Na polski',
    aiPresetTranslateNativePrompt: 'Przetłumacz na polski',
    aiInputPlaceholder: 'Wpisz pytanie lub polecenie…',
    aiInsertBtn: '⬇ Wstaw do edytora',
    aiKeyWarning: '⚠ Wprowadź klucz API {backend} i kliknij „Zapisz”.',
    aiThinking: '● Myślę…',
    aiErrorPrefix: '⚠ Błąd: ',
    aiSelectedSuffix: ' (zaznaczony tekst: {n} znaków)',
    aiEmptyResponse: '(pusta odpowiedź)',
    aiResetBtnTitle: 'Zresetuj rozmowę',
    aiResetConfirm: 'Wyczyścić historię rozmowy? Tej operacji nie można cofnąć.',
    aiSystemPrompt: 'Jesteś asystentem AI pomagającym pisać i edytować dokumenty Markdown. Używaj odpowiednio składni Markdown i udzielaj pomocnych odpowiedzi. Odpowiadaj zwięźle i praktycznie.',
    aboutAuthor: 'Autor',
    aboutCopyright: 'Prawa autorskie',
    aboutVersion: 'Wersja',
    aboutLicense: 'Licencja',
    aboutDesc: 'Edytor Markdown z proporcjami złotego podziału i paletą barw inspirowaną Google.',
    aboutLibraries: 'Biblioteki',
    aboutLibKatexCopy: '© 2013–2020 Khan Academy i współtwórcy',
    aboutLibMermaidCopy: '© 2014–2023 Knut Sveidqvist i współtwórcy',
    aboutLibGoogleFontsBadge: 'SIL OFL 1.1',
    aboutLibGoogleSansCopy: '© Google Inc. — SIL Open Font License 1.1',
    aboutLibMarkedCopy: '© 2011–2018 Christopher Jeffrey',
    aboutLibJetbrainsBadge: 'SIL OFL 1.1',
    aboutLibJetbrainsCopy: '© 2020 JetBrains s.r.o.',
    langBtnTitle: 'Język',
    tblDialogTitle: 'Wstaw niestandardową tabelę',
    tblColsLabel: 'Kolumny',
    tblRowsLabel: 'Wiersze (bez nagłówka)',
    tblStripeLabel: 'Naprzemienne wiersze',
    tblBorderLabel: 'Obramowanie',
    tblCancelBtn: 'Anuluj',
    tblInsertBtn: 'Wstaw',
    placeholder: 'Wpisz Markdown tutaj…\n\n# Nagłówek\n**pogrubiony** *kursywa* `kod`',
    defaultText: 'tekst',
    defaultLink: 'odnośnik',
    defaultImgAlt: 'tekst alternatywny',
    tblHeaderDefault: 'Nagłówek',
    tblCellDefault: 'Komórka',
    mermaidSyntaxError: '⚠ Mermaid: błąd składni (diagram syntax error)',
    savedLabel: 'Zapisano',
    unsavedLabel: 'Niezapisane',
    restoredMsg: 'Treść przywrócona z poprzedniej sesji',
    tooLargeMsg: 'Treść zbyt duża, aby zapisać w cookie',
    downloadBtnTitle: 'Pobierz',
    dlTitle: 'Pobierz jako…',
    dlHtmlDesc: 'Samodzielny plik HTML',
    dlPdfDesc: 'Zapisz przez okno drukowania',
    dlZmdDesc: 'Markdown + metadane edytora',
    dlMdDesc: 'Standardowy plik Markdown',
    dlHint: 'Wybierz jeden lub więcej formatów',
    dlDownloadBtn: 'Pobierz',
    settingsDocTitle: 'Dokument',
    settingsDocNameLabel: 'Nazwa dokumentu',
    settingsDocNameDesc: 'Używana jako tytuł podczas pobierania HTML i PDF. Pozostaw puste, aby użyć pierwszego nagłówka.',
    openWindow: 'Otwórz',
    diffPrompt: 'Podaj nazwę języka (pozostaw puste dla zwykłego diff):',
    diffDefault: '- usunięta linia\n+ dodana linia',
    ttBold: 'Pogrubienie',
    ttItalic: 'Kursywa',
    ttStrike: 'Przekreślenie',
    ttCode: 'Kod inline',
    ttLink: 'Odnośnik',
    ttImage: 'Obraz',
    ttQuote: 'Cytat',
    ttHr: 'Linia pozioma',
    ttBullet: 'Lista punktowana',
    ttOrdered: 'Lista numerowana',
    ttTask: 'Lista zadań',
    ttCodeBlock: 'Blok kodu',
    ttMathInline: 'Matematyka inline ($...$)',
    ttMathBlock: 'Blok matematyczny ($$...$$)',
    ttDiff: 'Blok diff (diff / diff_język)',
    ttMermaid: 'Diagram Mermaid (```mermaid...```)',
    ttTable: 'Wstaw niestandardową tabelę',
    fontSizeBtnTitle: 'Ustawienia rozmiaru czcionki',
    fontPanelTitle: 'Rozmiary czcionek',
    fontH1: 'H1',
    fontH2: 'H2',
    fontH3: 'H3',
    fontBody: 'Tekst',
    fontLatex: 'LaTeX',
    fontMermaid: 'Mermaid',
    fontCode: 'Kod',
    fontReset: 'Przywróć domyślne',
    settingsBtnTitle: 'Ustawienia',
    settingsTitle: 'Ustawienia',
    settingsRenderTitle: 'Renderowanie HTML',
    settingsHtmlLabel: 'Inline HTML',
    settingsHtmlDesc: 'Renderuj wszystkie tagi HTML bezpośrednio w Markdown (np. <div>, <span>, <table>, <iframe>…). Po wyłączeniu wszystkie tagi są wyświetlane jako zwykły tekst.',
    settingsPreviewLabel: 'Podgląd',
    init: `# Witaj w Złoty MD 🎨

**Proporcje złotego podziału** i **paleta barw inspirowana Google** — edycja Markdown z wyczuciem designu.

## ✦ Matematyka z LaTeX

Złoty podział $\\phi = \\dfrac{1+\\sqrt{5}}{2} \\approx 1{,}618$ spełnia równanie $\\phi^2 = \\phi + 1$.

Tożsamość Eulera — często nazywana najpiękniejszym równaniem w matematyce:

$$e^{i\\pi} + 1 = 0$$

Złoty podział jako ułamek łańcuchowy:

$$\\phi = 1 + \\cfrac{1}{1 + \\cfrac{1}{1 + \\cfrac{1}{1 + \\cdots}}}$$

Całka Gaussa i wzór zamknięty Fibonacciego:

$$\\int_{-\\infty}^{\\infty} e^{-x^2}\\,dx = \\sqrt{\\pi} \\qquad F_n = \\frac{\\phi^n - \\psi^n}{\\sqrt{5}}$$

## System złotego podziału

| Element | Wartość |
|---------|---------|
| Proporcje układu | **61,8 %** / **38,2 %** |
| Skala odstępów | 3, 5, 8, 13, 21, 34, 55, 89 px |
| Wysokość nagłówka | **55 px** (liczba Fibonacciego) |
| Rozmiary czcionek | 13, 21, 34 px |

## Przykład kodu

\`\`\`javascript
// Złoty podział
const φ = (1 + Math.sqrt(5)) / 2; // 1,6180339887…
const fib = n => n <= 1 ? n : fib(n-1) + fib(n-2);
console.log([...Array(8)].map((_,i) => fib(i))); // [0,1,1,2,3,5,8,13]
\`\`\`

## Przykład diff

\`\`\`diff
--- a/ratio.js
+++ b/ratio.js
@@ -1,6 +1,8 @@
 const φ = (1 + Math.sqrt(5)) / 2;
-const ratio = 0.5;
+const ratio = 1 / φ;           // złote dopełnienie 0,618…
+const inverse = φ - 1;         // ta sama wartość, inna forma
 
 function layout(total) {
-  return { main: total * 0.5, side: total * 0.5 };
+  return { main: total * ratio, side: total * (1 - ratio) };
 }
\`\`\`

## Lista zadań

- [x] Układ złotego podziału (61,8 / 38,2)
- [x] Paleta Google 4 kolorów
- [x] Podgląd na żywo · Przeciągany separator
- [x] Odznaka języka na blokach kodu (30+ języków)
- [x] Podświetlanie diff przez \`\`\`diff\`\`\`
- [x] Diagramy Mermaid przez \`\`\`mermaid...\`\`\`

## Diagram Mermaid

\`\`\`mermaid
flowchart LR
  A([Start]) --> B{Decyzja}
  B -- Tak  --> C[Proces A]
  B -- Nie  --> D[Proces B]
  C --> E([Koniec])
  D --> E
\`\`\`

## Diagram sekwencji

\`\`\`mermaid
sequenceDiagram
  participant U as Użytkownik
  participant E as Edytor
  participant P as Podgląd
  U->>E: Wpisz Markdown
  E->>P: Renderuj HTML
  P-->>U: Podgląd na żywo
\`\`\`

---

*Zacznij pisać swój dokument!*
`
  },
  el: {
    chars: 'χαρακτήρες',
    words: 'λέξεις',
    lines: 'γραμμές',
    editorLabel: 'Επεξεργαστής',
    previewLabel: 'Προεπισκόπηση',
    tabEdit: 'Επεξεργασία',
    tabPreview: 'Προεπισκόπηση',
    codeCopy: 'Αντιγραφή',
    codeCopied: 'Αντιγράφηκε',
    emptyTitle: 'Περιοχή Προεπισκόπησης',
    emptyDesc: 'Πληκτρολογήστε Markdown στον επεξεργαστή για να δείτε ζωντανή προεπισκόπηση',
    aboutBtnTitle: 'Συντελεστές & Πνευματικά Δικαιώματα',
    aiBtnTitle: 'Βοηθός AI',
    aiWelcome: '👋 Γεια σου! Είμαι ο βοηθός AI (Claude) για αυτόν τον επεξεργαστή Markdown.<br><br>Εισάγετε το κλειδί API της Anthropic και πατήστε «Αποθήκευση», έπειτα επιλέξτε κείμενο και πατήστε ένα πρότυπο ή απλώς κάντε μια ερώτηση.',
    aiKeyPlaceholder: 'Εισαγάγετε το κλειδί API της Anthropic…',
    aiSaveBtn: 'Αποθήκευση',
    aiSavedBtn: 'Αποθηκεύτηκε ✓',
    aiPresetContinue: 'Συνέχεια',
    aiPresetSummarize: 'Περίληψη',
    aiPresetTranslateJa: 'Στα Ιαπωνικά',
    aiPresetTranslateEn: 'Στα Αγγλικά',
    aiPresetProofread: 'Διόρθωση',
    aiPresetBullet: 'Λίστα',
    aiPresetContinuePrompt: 'Συνέχισε το κείμενο',
    aiPresetSummarizePrompt: 'Κάνε περίληψη αυτού',
    aiPresetTranslateJaPrompt: 'Μετάφρασε στα Ιαπωνικά',
    aiPresetTranslateEnPrompt: 'Μετάφρασε στα Αγγλικά',
    aiPresetProofreadPrompt: 'Διόρθωσε και βελτίωσε αυτό το κείμενο',
    aiPresetBulletPrompt: 'Μετέτρεψέ το σε λίστα με κουκκίδες',
    aiPresetTranslateNative: 'Στα Ελληνικά',
    aiPresetTranslateNativePrompt: 'Μετάφρασε στα Ελληνικά',
    aiInputPlaceholder: 'Πληκτρολογήστε ερώτηση ή εντολή…',
    aiInsertBtn: '⬇ Εισαγωγή στον επεξεργαστή',
    aiKeyWarning: '⚠ Εισαγάγετε το κλειδί API {backend} και πατήστε «Αποθήκευση».',
    aiThinking: '● Σκέφτομαι…',
    aiErrorPrefix: '⚠ Σφάλμα: ',
    aiSelectedSuffix: ' (επιλεγμένο κείμενο: {n} χαρακτήρες)',
    aiEmptyResponse: '(κενή απάντηση)',
    aiResetBtnTitle: 'Επαναφορά συνομιλίας',
    aiResetConfirm: 'Διαγραφή ιστορικού συνομιλίας; Δεν μπορεί να αναιρεθεί.',
    aiSystemPrompt: 'Είσαι ένας βοηθός AI που βοηθά στη συγγραφή και επεξεργασία εγγράφων Markdown. Χρησιμοποίησε κατάλληλα τη σύνταξη Markdown και δώσε χρήσιμες απαντήσεις. Κράτησε τις απαντήσεις σύντομες και πρακτικές.',
    aboutAuthor: 'Συγγραφέας',
    aboutCopyright: 'Πνευματικά Δικαιώματα',
    aboutVersion: 'Έκδοση',
    aboutLicense: 'Άδεια',
    aboutDesc: 'Ένας επεξεργαστής Markdown με αναλογίες χρυσής τομής και παλέτα χρωμάτων εμπνευσμένη από τη Google.',
    aboutLibraries: 'Βιβλιοθήκες',
    aboutLibKatexCopy: '© 2013–2020 Khan Academy και συνεργάτες',
    aboutLibMermaidCopy: '© 2014–2023 Knut Sveidqvist και συνεργάτες',
    aboutLibGoogleFontsBadge: 'SIL OFL 1.1',
    aboutLibGoogleSansCopy: '© Google Inc. — SIL Open Font License 1.1',
    aboutLibMarkedCopy: '© 2011–2018 Christopher Jeffrey',
    aboutLibJetbrainsBadge: 'SIL OFL 1.1',
    aboutLibJetbrainsCopy: '© 2020 JetBrains s.r.o.',
    langBtnTitle: 'Γλώσσα',
    tblDialogTitle: 'Εισαγωγή προσαρμοσμένου πίνακα',
    tblColsLabel: 'Στήλες',
    tblRowsLabel: 'Γραμμές (χωρίς επικεφαλίδα)',
    tblStripeLabel: 'Ριγέ',
    tblBorderLabel: 'Με περίγραμμα',
    tblCancelBtn: 'Άκυρο',
    tblInsertBtn: 'Εισαγωγή',
    placeholder: 'Πληκτρολογήστε Markdown εδώ…\n\n# Επικεφαλίδα\n**έντονα** *πλάγια* `κώδικας`',
    defaultText: 'κείμενο',
    defaultLink: 'σύνδεσμος',
    defaultImgAlt: 'εναλλακτικό κείμενο',
    tblHeaderDefault: 'Επικεφαλίδα',
    tblCellDefault: 'Κελί',
    mermaidSyntaxError: '⚠ Mermaid: σφάλμα σύνταξης (diagram syntax error)',
    savedLabel: 'Αποθηκευμένο',
    unsavedLabel: 'Μη αποθηκευμένο',
    restoredMsg: 'Το περιεχόμενο επαναφέρθηκε από την αποθηκευμένη συνεδρία',
    tooLargeMsg: 'Το περιεχόμενο είναι πολύ μεγάλο για αποθήκευση σε cookie',
    downloadBtnTitle: 'Λήψη',
    dlTitle: 'Λήψη ως…',
    dlHtmlDesc: 'Αυτόνομο αρχείο HTML',
    dlPdfDesc: 'Αποθήκευση μέσω εκτύπωσης',
    dlZmdDesc: 'Markdown + μεταδεδομένα επεξεργαστή',
    dlMdDesc: 'Τυπικό αρχείο Markdown',
    dlHint: 'Επιλέξτε μία ή περισσότερες μορφές',
    dlDownloadBtn: 'Λήψη',
    settingsDocTitle: 'Έγγραφο',
    settingsDocNameLabel: 'Όνομα εγγράφου',
    settingsDocNameDesc: 'Χρησιμοποιείται ως τίτλος κατά τη λήψη HTML και PDF. Αφήστε κενό για χρήση της πρώτης επικεφαλίδας.',
    openWindow: 'Άνοιγμα',
    diffPrompt: 'Εισαγάγετε όνομα γλώσσας (αφήστε κενό για απλό diff):',
    diffDefault: '- γραμμή που αφαιρέθηκε\n+ γραμμή που προστέθηκε',
    ttBold: 'Έντονα',
    ttItalic: 'Πλάγια',
    ttStrike: 'Διαγραφή',
    ttCode: 'Ενσωματωμένος κώδικας',
    ttLink: 'Σύνδεσμος',
    ttImage: 'Εικόνα',
    ttQuote: 'Παράθεση',
    ttHr: 'Οριζόντια γραμμή',
    ttBullet: 'Λίστα κουκκίδων',
    ttOrdered: 'Αριθμημένη λίστα',
    ttTask: 'Λίστα εργασιών',
    ttCodeBlock: 'Μπλοκ κώδικα',
    ttMathInline: 'Ενσωματωμένα μαθηματικά ($...$)',
    ttMathBlock: 'Μπλοκ μαθηματικών ($$...$$)',
    ttDiff: 'Μπλοκ diff (diff / diff_lang)',
    ttMermaid: 'Διάγραμμα Mermaid (```mermaid...```)',
    ttTable: 'Εισαγωγή προσαρμοσμένου πίνακα',
    fontSizeBtnTitle: 'Ρυθμίσεις μεγέθους γραμματοσειράς',
    fontPanelTitle: 'Μεγέθη γραμματοσειράς',
    fontH1: 'H1',
    fontH2: 'H2',
    fontH3: 'H3',
    fontBody: 'Κείμενο',
    fontLatex: 'LaTeX',
    fontMermaid: 'Mermaid',
    fontCode: 'Κώδικας',
    fontReset: 'Επαναφορά στα προεπιλεγμένα',
    settingsBtnTitle: 'Ρυθμίσεις',
    settingsTitle: 'Ρυθμίσεις',
    settingsRenderTitle: 'Απόδοση HTML',
    settingsHtmlLabel: 'Ενσωματωμένο HTML',
    settingsHtmlDesc: 'Απόδοση όλων των ετικετών HTML απευθείας στο Markdown (π.χ. <div>, <span>, <table>, <iframe>…). Όταν είναι απενεργοποιημένο, όλες οι ετικέτες εμφανίζονται ως απλό κείμενο.',
    settingsPreviewLabel: 'Προεπισκόπηση',
    init: `# Καλώς ήρθατε στο Złoty MD 🎨

**Αναλογίες χρυσής τομής** και **παλέτα χρωμάτων εμπνευσμένη από τη Google** — επεξεργασία Markdown με αίσθηση σχεδιασμού.

## ✦ Μαθηματικά με LaTeX

Η χρυσή τομή $\\phi = \\dfrac{1+\\sqrt{5}}{2} \\approx 1.618$ ικανοποιεί τη σχέση $\\phi^2 = \\phi + 1$.

Η ταυτότητα του Euler — συχνά αποκαλείται η πιο όμορφη εξίσωση στα μαθηματικά:

$$e^{i\\pi} + 1 = 0$$

Η χρυσή τομή ως συνεχές κλάσμα:

$$\\phi = 1 + \\cfrac{1}{1 + \\cfrac{1}{1 + \\cfrac{1}{1 + \\cdots}}}$$

Το ολοκλήρωμα του Gauss και ο κλειστός τύπος του Fibonacci:

$$\\int_{-\\infty}^{\\infty} e^{-x^2}\\,dx = \\sqrt{\\pi} \\qquad F_n = \\frac{\\phi^n - \\psi^n}{\\sqrt{5}}$$

## Σύστημα Χρυσής Τομής

| Στοιχείο | Τιμή |
|---------|-------|
| Αναλογία διάταξης | **61.8 %** / **38.2 %** |
| Κλίμακα αποστάσεων | 3, 5, 8, 13, 21, 34, 55, 89 px |
| Ύψος κεφαλίδας | **55 px** (Fibonacci) |
| Μεγέθη γραμματοσειράς | 13, 21, 34 px |

## Παράδειγμα Κώδικα

\`\`\`javascript
// Χρυσή τομή
const φ = (1 + Math.sqrt(5)) / 2; // 1.6180339887…
const fib = n => n <= 1 ? n : fib(n-1) + fib(n-2);
console.log([...Array(8)].map((_,i) => fib(i))); // [0,1,1,2,3,5,8,13]
\`\`\`

## Παράδειγμα Diff

\`\`\`diff
--- a/ratio.js
+++ b/ratio.js
@@ -1,6 +1,8 @@
 const φ = (1 + Math.sqrt(5)) / 2;
-const ratio = 0.5;
+const ratio = 1 / φ;           // συμπλήρωμα της χρυσής τομής 0.618…
+const inverse = φ - 1;         // ίδια τιμή, διαφορετική μορφή
 
 function layout(total) {
-  return { main: total * 0.5, side: total * 0.5 };
+  return { main: total * ratio, side: total * (1 - ratio) };
 }
\`\`\`

## Λίστα Ελέγχου

- [x] Διάταξη χρυσής τομής (61.8 / 38.2)
- [x] Παλέτα Google με 4 χρώματα
- [x] Ζωντανή προεπισκόπηση · Ρυθμιζόμενο διαχωριστικό
- [x] Ένδειξη γλώσσας σε μπλοκ κώδικα (30+ γλώσσες)
- [x] Επισήμανση διαφορών με \`\`\`diff\`\`\`
- [x] Διαγράμματα Mermaid με \`\`\`mermaid...\`\`\`

## Διάγραμμα Mermaid

\`\`\`mermaid
flowchart LR
  A([Έναρξη]) --> B{Απόφαση}
  B -- Ναι --> C[Διαδικασία A]
  B -- Όχι --> D[Διαδικασία B]
  C --> E([Τέλος])
  D --> E
\`\`\`

## Διάγραμμα Ακολουθίας

\`\`\`mermaid
sequenceDiagram
  participant U as Χρήστης
  participant E as Επεξεργαστής
  participant P as Προεπισκόπηση
  U->>E: Πληκτρολόγηση Markdown
  E->>P: Απόδοση HTML
  P-->>U: Ζωντανή προεπισκόπηση
\`\`\`

---

*Ξεκινήστε να γράφετε το έγγραφό σας!*
`
  }
};

// Применяет выбранный язык интерфейса ко всем элементам с атрибутами data-i18n*
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
  }
}

const IDB_LANG_KEY = 'zmd_lang';
async function saveLangSetting() {
  try {
    await idbSet(IDB_LANG_KEY, currentLang);
  } catch (e) {}
}
async function loadLangSetting() {
  try {
    const raw = await idbGet(IDB_LANG_KEY);
    if (raw && LANGS[raw]) applyLang(raw);
  } catch (e) {}
}

function setLang(code) {
  applyLang(code);
  closeLang();
  saveLangSetting();
  if (typeof saveContent === 'function') saveContent();
}

function toggleLang() {
  const drop = document.getElementById('langDrop');
  const btn = document.getElementById('langBtn');
  const isOpen = drop.classList.contains('open');
  if (isOpen) {
    closeLang();
    return;
  }
  const r = btn.getBoundingClientRect();
  drop.style.top = (r.bottom + 6) + 'px';
  drop.style.right = (window.innerWidth - r.right) + 'px';
  drop.classList.add('open');
}

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
      attributeBackgroundColorOdd: '#ffffff',
    },
    flowchart: {
      htmlLabels: true,
      curve: 'basis'
    },
    sequence: {
      useMaxWidth: true,
      actorMargin: 50
    },
    gantt: {
      useMaxWidth: true
    },
    pie: {
      useMaxWidth: true
    },
  });
}

const INIT = LANGS['en'].init;
ed.value = INIT;
render(INIT);
if (window.innerWidth > 768) ed.focus();
applyLang('en');

document.getElementById('aboutYear').textContent = new Date().getFullYear();

// Общий обработчик открытия/закрытия модальных панелей (about, font, settings, docs)
function _toggleModal(overlayId, modalId, btnId, onOpen) {
  const overlay = document.getElementById(overlayId);
  const modal = document.getElementById(modalId);
  if (modal.classList.contains('open')) {
    _closeModal(overlayId, modalId, btnId);
  } else {
    overlay.classList.add('open');
    modal.classList.add('open');
    document.getElementById(btnId).style.color = 'var(--gb)';
    if (onOpen) onOpen();
  }
}

function _closeModal(overlayId, modalId, btnId) {
  document.getElementById(overlayId).classList.remove('open');
  document.getElementById(modalId).classList.remove('open');
  document.getElementById(btnId).style.color = '';
}

function toggleAbout() {
  _toggleModal('aboutOverlay', 'aboutModal', 'aboutBtn');
}

function closeAbout() {
  _closeModal('aboutOverlay', 'aboutModal', 'aboutBtn');
}

const IDB_NAME = 'ZlotyMD';
const IDB_VERSION = 1;
const IDB_STORE = 'saves';
const IDB_KEY = 'zmd_save';

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

// Общая обёртка для транзакций IndexedDB, используемая в idbSet/idbGet/idbDelete
async function _idbRequest(mode, runRequest) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const store = db.transaction(IDB_STORE, mode).objectStore(IDB_STORE);
    const req = runRequest(store);
    req.onsuccess = () => resolve(req.result);
    req.onerror = e => reject(e.target.error);
  });
}

async function idbSet(key, value) {
  await _idbRequest('readwrite', store => store.put(value, key));
}

async function idbGet(key) {
  const result = await _idbRequest('readonly', store => store.get(key));
  return result ?? null;
}

async function idbDelete(key) {
  await _idbRequest('readwrite', store => store.delete(key));
}

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

// Применяет текущие размеры шрифтов через CSS-переменные и обновляет панель настроек
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
    .md h1{font-size:var(--fz-h1)!important;padding-bottom:${Math.round(fontSizes.h1*0.24)}px!important}
    .md h1::after{width:${Math.round(fontSizes.h1*1.6)}px!important;height:${Math.max(2,Math.round(fontSizes.h1*0.09))}px!important}
    .md h2{font-size:var(--fz-h2)!important}
    .md h2::before{height:${Math.round(fontSizes.h2*0.9)}px!important;width:${Math.max(3,Math.round(fontSizes.h2*0.22))}px!important}
    .md h3{font-size:var(--fz-h3)!important}
    .md p,.md li,.md td,.md th,.md blockquote{font-size:var(--fz-body)!important}
    .md .katex{font-size:var(--fz-latex)!important}
    .md .katex-display>.katex{font-size:var(--fz-latex)!important}
    .md .mermaid svg text,.md .mermaid svg .label{font-size:var(--fz-mmd)!important}
    .md pre code,.md code{font-size:var(--fz-code)!important}
  `;

  syncFontPanelUI();
}

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

function onFontSlider(key, val) {
  fontSizes[key] = parseInt(val);
  applyFontSizesToDOM();
  saveFontSizes();
}

function onFontNum(key, val) {
  const parsed = parseFloat(val);
  fontSizes[key] = (!isFinite(parsed) || parsed <= 0) ? 1 : parsed;
  applyFontSizesToDOM();
  saveFontSizes();
}

function resetFontSizes() {
  fontSizes = {
    ...FONT_DEFAULTS
  };
  applyFontSizesToDOM();
  saveFontSizes();
}

function toggleFontPanel() {
  _toggleModal('fontOverlay', 'fontModal', 'fontSizeBtn', syncFontPanelUI);
}

function closeFontPanel() {
  _closeModal('fontOverlay', 'fontModal', 'fontSizeBtn');
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
async function loadLegacyFontSizes() {
  try {
    const raw = await idbGet(IDB_FONT_KEY);
    if (raw) legacyFontSizes = JSON.parse(raw);
  } catch (e) {}
}

function defaultFontSizesForNewDoc() {
  return {
    ...FONT_DEFAULTS
  };
}
async function saveFontSizes() {
  if (!currentDocId) return;
  try {
    const data = await loadDocRecord(currentDocId);
    if (!data) return;
    data.fontSizes = {
      ...fontSizes
    };
    await persistDocRecord(currentDocId, data);
  } catch (e) {}
}

const IDB_SETTINGS_KEY = 'zmd_settings';

function applySettings() {
  marked.setOptions({
    gfm: true,
    breaks: true
  });
  const tog = document.getElementById('htmlToggle');
  if (tog) tog.setAttribute('aria-checked', appSettings.htmlRendering ? 'true' : 'false');
  updateSettingsPreview();
  if (ed.value)(typeof _render === 'function' ? _render : render)(ed.value);
}

function updateSettingsPreview() {
  const out = document.getElementById('settingsPreviewOutput');
  if (!out) return;
  const sample = '<span style="color:#EA4335;font-weight:700">colored</span>, <u>underline</u>, <mark>highlight</mark>, <sup>sup</sup>, <kbd>Ctrl+S</kbd>';
  if (appSettings.htmlRendering) {
    out.innerHTML = marked.parseInline(sample);
  } else {
    out.textContent = sample;
  }
}

function toggleHtmlRendering() {
  appSettings.htmlRendering = !appSettings.htmlRendering;
  applySettings();
  saveSettings();
}

async function saveSettings() {
  try {
    await idbSet(IDB_SETTINGS_KEY, JSON.stringify(appSettings));
  } catch (e) {}
}

async function loadSettings() {
  try {
    const raw = await idbGet(IDB_SETTINGS_KEY);
    if (raw) appSettings = Object.assign({
      ...SETTINGS_DEFAULTS
    }, JSON.parse(raw));
  } catch (e) {}
  applySettings();
}

function toggleSettings() {
  _toggleModal('settingsOverlay', 'settingsModal', 'settingsBtn', () => {
    updateSettingsPreview();
    const t = LANGS[currentLang] || LANGS['en'];
    ['settingsHtmlDesc'].forEach(key => {
      const el = document.querySelector(`#settingsModal [data-i18n="${key}"]`);
      if (el && t[key]) el.textContent = t[key];
    });
  });
}

function closeSettings() {
  _closeModal('settingsOverlay', 'settingsModal', 'settingsBtn');
}

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
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function loadDocIndex() {
  try {
    const raw = await idbGet(IDB_INDEX_KEY);
    docIndex = raw ? JSON.parse(raw) : [];
  } catch (e) {
    docIndex = [];
  }
  return docIndex;
}
async function persistDocIndex() {
  try {
    await idbSet(IDB_INDEX_KEY, JSON.stringify(docIndex));
  } catch (e) {}
}
async function loadDocRecord(id) {
  try {
    const raw = await idbGet(IDB_DOC_PREFIX + id);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}
async function persistDocRecord(id, data) {
  await idbSet(IDB_DOC_PREFIX + id, JSON.stringify(data));
}
async function removeDocRecord(id) {
  try {
    await idbDelete(IDB_DOC_PREFIX + id);
  } catch (e) {}
}
async function setCurrentDocId(id) {
  currentDocId = id;
  try {
    await idbSet(IDB_CURRENT_KEY, id);
  } catch (e) {}
}
async function getStoredCurrentDocId() {
  try {
    return await idbGet(IDB_CURRENT_KEY);
  } catch (e) {
    return null;
  }
}

function untitledDocName() {
  const t = LANGS[currentLang] || LANGS['en'];
  return t.untitledDoc || 'Untitled Document';
}

async function createNewDoc(name) {
  const t = LANGS[currentLang] || LANGS['en'];
  const now = Date.now();
  const id = genDocId();
  const data = {
    name: name || untitledDocName(),
    isDefaultName: !name,
    content: t.init,
    lang: currentLang,
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

async function flushCurrentDocSave() {
  clearTimeout(saveTimer);
  clearTimeout(scrollSaveTimer);
  if (!currentDocId) return;
  await saveContent();
}

// Сохраняет содержимое, язык, размеры шрифтов и позиции прокрутки текущего документа
async function saveContent() {
  if (!currentDocId || switchingDoc) return;
  try {
    const now = Date.now();
    const data = {
      name: (currentDocMeta && currentDocMeta.name) || untitledDocName(),
      isDefaultName: currentDocMeta ? !!currentDocMeta.isDefaultName : true,
      content: ed.value,
      lang: currentLang,
      fontSizes: {
        ...fontSizes
      },
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

// Откладывает автосохранение (debounce), чтобы не сохранять при каждом нажатии клавиши
function scheduleAutosave() {
  if (switchingDoc) return;
  setSaveStatus('unsaved');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveContent, 1500);
}

let scrollSaveTimer = null;

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

// Синхронизирует прокрутку редактора и предпросмотра по относительной позиции
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
render = function(v) {
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

// Переключает редактор на другой сохранённый документ и восстанавливает его состояние
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
  fontSizes = Object.assign({
    ...FONT_DEFAULTS
  }, legacyFontSizes || {}, data.fontSizes || {});
  applyFontSizesToDOM();
  _render(data.content);
  setSaveStatus('saved');
  requestAnimationFrame(() => {
    ed.scrollTop = data.scrollEd || 0;
    pv.scrollTop = data.scrollPv || 0;
    switchingDoc = false;
  });
  renderDocList();
  return true;
}

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

function renderDocList() {
  const listEl = document.getElementById('docList');
  if (!listEl) return;
  const t = LANGS[currentLang] || LANGS['en'];
  if (!docIndex.length) {
    listEl.innerHTML = `<div class="doc-item-empty">${t.docsEmpty || 'No documents yet'}</div>`;
    return;
  }
  const sorted = [...docIndex].sort((a, b) => b.updatedAt - a.updatedAt);
  listEl.innerHTML = sorted.map(d => {
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
  }).join('');
}

async function onDocItemClick(event, id) {
  if (id === currentDocId) {
    closeDocsPanel();
    return;
  }
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
  await removeDocRecord(id);
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
  await flushCurrentDocSave();
  const id = await createNewDoc();
  await switchToDoc(id);
}

function toggleDocsPanel() {
  _toggleModal('docsOverlay', 'docsModal', 'docsBtn', renderDocList);
}

function closeDocsPanel() {
  _closeModal('docsOverlay', 'docsModal', 'docsBtn');
}

// Загрузка при старте: индекс документов, перенос старого сохранения, открытие последнего документа
async function initDocuments() {
  await loadDocIndex();

  if (!docIndex.length) {
    try {
      const raw = await idbGet(IDB_KEY);
      if (raw) {
        const old = JSON.parse(raw);
        const oldLangTpl = LANGS[old.lang]?.init;
        if (old && old.content && old.content !== oldLangTpl) {
          const now = Date.now();
          const id = genDocId();
          const data = {
            name: untitledDocName(),
            content: old.content,
            lang: old.lang || currentLang,
            fontSizes: defaultFontSizesForNewDoc(),
            scrollEd: 0,
            scrollPv: 0,
            createdAt: now,
            updatedAt: now
          };
          await persistDocRecord(id, data);
          docIndex.push({
            id,
            name: data.name,
            createdAt: now,
            updatedAt: now
          });
          await persistDocIndex();
          await setCurrentDocId(id);
        }
      }
    } catch (e) {}
  }

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

(async function initSave() {
  await loadLangSetting();
  await loadLegacyFontSizes();
  await loadSettings();
  await initDocuments();
})();

function _processCustomTables(v) {
  return v.replace(/:::table([^\n]*)\n([\s\S]*?):::/g, (_, opts, body) => {
    const stripe = /stripe/.test(opts) ? ' stripe' : '';
    const border = /border/.test(opts) ? ' border' : '';
    const lines = body.trim().split('\n').filter(l => l.trim().startsWith('|'));
    if (!lines.length) return _;
    const parseRow = (line, tag) => {
      const cells = line.split('|').slice(1, -1);
      return cells.map(cell => {
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
      }).join('');
    };
    const [header, ...rows] = lines;
    const thead = `<thead><tr>${parseRow(header, 'th')}</tr></thead>`;
    const tbody = `<tbody>${rows.map(r => `<tr>${parseRow(r, 'td')}</tr>`).join('')}</tbody>`;
    return `<table class="ztbl${stripe}${border}">${thead}${tbody}</table>`;
  });
}

// функции диалога вставки таблицы
function openTblDialog() {
  document.getElementById('tblOverlay').classList.add('open');
  document.getElementById('tblCols').focus();
}

function closeTblDialog() {
  document.getElementById('tblOverlay').classList.remove('open');
}

function insertCustomTable() {
  const cols = Math.max(1, Math.min(10, parseInt(document.getElementById('tblCols').value) || 3));
  const rows = Math.max(1, Math.min(20, parseInt(document.getElementById('tblRows').value) || 3));
  const stripe = document.getElementById('tblStripe').checked ? ' stripe' : '';
  const border = document.getElementById('tblBorder').checked ? ' border' : '';
  const th = LANGS[currentLang]?.tblHeaderDefault || 'Header';
  const tc = LANGS[currentLang]?.tblCellDefault || 'Cell';
  const hdr = '| ' + Array.from({
    length: cols
  }, (_, i) => `${th}${i + 1}`).join(' | ') + ' |';
  const dataRows = Array.from({
      length: rows
    }, (_, r) =>
    '| ' + Array.from({
      length: cols
    }, (_, c) => `${tc}${r + 1}-${c + 1}`).join(' | ') + ' |'
  );
  const snippet = `:::table${stripe}${border}\n${hdr}\n${dataRows.join('\n')}\n:::\n`;
  const {
    s,
    e
  } = {
    s: ed.selectionStart,
    e: ed.selectionEnd
  };
  ed.value = ed.value.slice(0, s) + snippet + ed.value.slice(e);
  ed.selectionStart = ed.selectionEnd = s + snippet.length;
  ed.focus();
  render(ed.value);
  closeTblDialog();
}
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeTblDialog();
});

const AI_BACKEND = 'anthropic'; // допустимые значения: 'gemini' | 'anthropic'
const GEMINI_MODEL = 'gemini-2.0-flash';
// функции AI-ассистента.
// чтобы перейти на боевой режим, смените AI_BACKEND на 'anthropic'
// и просто впишите API-ключ Anthropic — этого достаточно
const ANTHROPIC_MODEL = 'claude-sonnet-5';

function _aiSystem() {
  return (LANGS[currentLang] || LANGS['en']).aiSystemPrompt;
}

let _aiKey = '';
let _aiLastResponse = '';
let _aiConvHistory = []; // { role: 'user'|'model', text }

function _loadAiHistory() {
  try {
    const raw = localStorage.getItem('zmd_ai_history');
    if (raw) _aiConvHistory = JSON.parse(raw) || [];
  } catch (_) {
    _aiConvHistory = [];
  }
}

function _saveAiHistory() {
  try {
    localStorage.setItem('zmd_ai_history', JSON.stringify(_aiConvHistory));
  } catch (_) {}
}
_loadAiHistory();

function _renderAiHistory() {
  if (!_aiConvHistory.length) return;
  const msgs = document.getElementById('aiMsgs');
  const welcome = document.getElementById('aiWelcomeMsg');
  if (welcome) welcome.remove();
  _aiConvHistory.forEach(m => {
    const d = document.createElement('div');
    d.className = 'ai-bubble ' + (m.role === 'user' ? 'u' : 'a');
    d.textContent = m.text;
    msgs.appendChild(d);
  });
  const last = _aiConvHistory[_aiConvHistory.length - 1];
  if (last && last.role === 'model') {
    _aiLastResponse = last.text;
    document.getElementById('aiInsertBtn').style.display = 'block';
  }
  msgs.scrollTop = msgs.scrollHeight;
}
document.addEventListener('DOMContentLoaded', _renderAiHistory);
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(_renderAiHistory, 0);
}

function resetAiConversation() {
  const t = LANGS[currentLang] || LANGS['en'];
  if (_aiConvHistory.length && !confirm(t.aiResetConfirm)) return;
  _aiConvHistory = [];
  _aiLastResponse = '';
  try {
    localStorage.removeItem('zmd_ai_history');
  } catch (_) {}
  const msgs = document.getElementById('aiMsgs');
  msgs.innerHTML = '';
  const welcome = document.createElement('div');
  welcome.className = 'ai-bubble a';
  welcome.id = 'aiWelcomeMsg';
  welcome.setAttribute('data-i18n-html', 'aiWelcome');
  welcome.innerHTML = t.aiWelcome;
  msgs.appendChild(welcome);
  document.getElementById('aiInsertBtn').style.display = 'none';
}

(function loadAiKey() {
  try {
    const k = localStorage.getItem('zmd_ai_key_' + AI_BACKEND);
    if (k) {
      _aiKey = k;
      document.getElementById('aiKey').value = k;
    }
  } catch (_) {}
})();

function saveApiKey() {
  const k = document.getElementById('aiKey').value.trim();
  if (!k) return;
  _aiKey = k;
  try {
    localStorage.setItem('zmd_ai_key_' + AI_BACKEND, k);
  } catch (_) {}
  const btn = document.querySelector('.ai-ksave');
  const t = LANGS[currentLang] || LANGS['en'];
  btn.textContent = t.aiSavedBtn;
  setTimeout(() => {
    btn.textContent = t.aiSaveBtn;
  }, 1500);
}

function toggleAiPanel() {
  const p = document.getElementById('aiPanel');
  const b = document.getElementById('aiToggleBtn');
  const open = p.classList.toggle('open');
  b.classList.toggle('on', open);
  if (open) document.getElementById('aiInput').focus();
}

function _aiAddMsg(text, role) {
  const msgs = document.getElementById('aiMsgs');
  const d = document.createElement('div');
  d.className = 'ai-bubble ' + role;
  d.textContent = text;
  msgs.appendChild(d);
  msgs.scrollTop = msgs.scrollHeight;
  return d;
}

function aiPreset(prompt) {
  document.getElementById('aiInput').value = prompt;
  sendAi();
}

async function _callGemini(fullPrompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${_aiKey}`;
  const contents = _aiConvHistory.map(m => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{
      text: m.text
    }]
  }));
  contents.push({
    role: 'user',
    parts: [{
      text: fullPrompt
    }]
  });
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      system_instruction: {
        parts: [{
          text: _aiSystem()
        }]
      },
      contents,
      generationConfig: {
        maxOutputTokens: 1024
      }
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `HTTP ${res.status}`);
  }
  const data = await res.json();
  const t = LANGS[currentLang] || LANGS['en'];
  return data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || t.aiEmptyResponse;
}

// Отправляет запрос к Anthropic API (Claude) с историей диалога и API-ключом пользователя
async function _callAnthropic(fullPrompt) {
  const messages = _aiConvHistory.map(m => ({
    role: m.role === 'user' ? 'user' : 'assistant',
    content: m.text
  }));
  messages.push({
    role: 'user',
    content: fullPrompt
  });
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': _aiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 1024,
      system: _aiSystem(),
      messages
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `HTTP ${res.status}`);
  }
  const data = await res.json();
  const t = LANGS[currentLang] || LANGS['en'];
  return data.content?.map(c => c.text || '').join('') || t.aiEmptyResponse;
}

// Обрабатывает отправку сообщения ИИ-ассистенту, включая выделенный в редакторе текст как контекст
async function sendAi() {
  const input = document.getElementById('aiInput');
  const prompt = input.value.trim();
  if (!prompt) return;

  const t = LANGS[currentLang] || LANGS['en'];

  if (!_aiKey) {
    const backendName = AI_BACKEND === 'gemini' ? 'Google AI Studio' : 'Anthropic';
    _aiAddMsg(t.aiKeyWarning.replace('{backend}', backendName), 'thinking');
    return;
  }

  const selected = ed.value.substring(ed.selectionStart, ed.selectionEnd);
  const contextNote = selected ? `\n\n"""\n${selected}\n"""` : '';
  const fullPrompt = prompt + contextNote;

  input.value = '';
  input.style.height = '34px';
  _aiAddMsg(prompt + (selected ? t.aiSelectedSuffix.replace('{n}', selected.length) : ''), 'u');

  const btn = document.getElementById('aiSendBtn');
  btn.disabled = true;
  const thinking = _aiAddMsg(t.aiThinking, 'thinking');

  try {
    const text = AI_BACKEND === 'gemini' ?
      await _callGemini(fullPrompt) :
      await _callAnthropic(fullPrompt);
    thinking.remove();
    _aiLastResponse = text;
    _aiAddMsg(text, 'a');
    _aiConvHistory.push({
      role: 'user',
      text: fullPrompt
    });
    _aiConvHistory.push({
      role: 'model',
      text
    });
    _saveAiHistory();
    document.getElementById('aiInsertBtn').style.display = 'block';
  } catch (err) {
    thinking.remove();
    _aiAddMsg(t.aiErrorPrefix + err.message, 'thinking');
  } finally {
    btn.disabled = false;
    document.getElementById('aiInput').focus();
  }
}

function insertAiResult() {
  if (!_aiLastResponse) return;
  const {
    s,
    e
  } = {
    s: ed.selectionStart,
    e: ed.selectionEnd
  };
  const insert = '\n\n' + _aiLastResponse + '\n';
  ed.value = ed.value.slice(0, s) + insert + ed.value.slice(e);
  ed.selectionStart = ed.selectionEnd = s + insert.length;
  ed.focus();
  render(ed.value);
  document.getElementById('aiInsertBtn').style.display = 'none';
}
