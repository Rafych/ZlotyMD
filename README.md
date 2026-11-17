# Złoty MD
## English
A Markdown editor with golden-ratio proportions and a Google-inspired color palette.

## Русский
Редактор Markdown с пропорциями золотого сечения и цветовой палитрой в стиле Google.

## 日本語
黄金比のプロポーションと Google インスパイアドなカラーパレットを持つ Markdown エディター。

## Deutsch
Ein Markdown-Editor mit Proportionen des Goldenen Schnitts und einer von Google inspirierten Farbpalette.

## Polski
Edytor Markdown z proporcjami złotego podziału i paletą kolorów w stylu Google.

## ελληνικά
Ένας επεξεργαστής Markdown με αναλογίες χρυσής τομής και παλέτα χρωμάτων εμπνευσμένη από τη Google.

## Français
Un éditeur Markdown aux proportions du nombre d’or et à la palette de couleurs inspirée de Google.

## Italiano
Un editor Markdown con le proporzioni della sezione aurea e una tavolozza di colori ispirata a Google.

## Português (Brasil)
Um editor de Markdown com as proporções da razão áurea e uma paleta de cores inspirada no Google.

## Español
Un editor de Markdown con proporciones de la razón áurea y una paleta de colores inspirada en Google.

## Română
Un editor Markdown cu proporțiile secțiunii de aur și o paletă de culori inspirată de Google.

# Screenshot

![Снимок экрана](./Снимок%20экрана%202026-11-09%20133131.png)

# License

© 2026 [Rafych](https://github.com/Rafych) and [Hiromichi](https://github.com/hiromichipixel)

Złoty MD is released under the [MIT License](./LICENSE).

# Third-party libraries

The libraries below are not part of this repository. The browser loads them from a CDN at runtime. They are sorted by license.

| Library | Version | License | Loaded from |
|---|---|---|---|
| emmalloc (Emscripten) / Zephyr libc string functions | — | Apache-2.0 | bundled in the harfbuzzjs WebAssembly build |
| [highlight.js](https://github.com/highlightjs/highlight.js) | 11.11.1 | BSD-3-Clause | cdnjs (extra languages are loaded only when a code block uses them) |
| [Twemoji](https://github.com/jdecked/twemoji) graphics | 17.0.3 | CC-BY-4.0 | jsDelivr (emoji images in the editor interface, the preview and exported documents) |
| [TikZJax](https://github.com/drgrice1/tikzjax) (`@drgrice1/tikzjax`) | 1.0.0-beta24 | GPL-3.0-or-later | jsDelivr, only when a document contains TikZ |
| [harfbuzzjs](https://github.com/harfbuzz/harfbuzzjs) ([HarfBuzz](https://github.com/harfbuzz/harfbuzz)) | 0.4.12 | MIT (HarfBuzz: Old MIT; parts Apache-2.0) | jsDelivr, only when exporting to PDF (text shaping) |
| [html2canvas](https://github.com/niklasvh/html2canvas) | 1.4.1 | MIT | cdnjs, only when exporting to PDF (used by jsPDF `html()`) |
| [jsPDF](https://github.com/parallax/jsPDF) | 4.2.1 | MIT | cdnjs, only when exporting to PDF |
| [KaTeX](https://github.com/KaTeX/KaTeX) | 0.16.9 | MIT | cdnjs |
| [marked](https://github.com/markedjs/marked) | 9.1.6 | MIT (its license file also contains the BSD-style Markdown license, © 2004 John Gruber) | cdnjs |
| [Mermaid](https://github.com/mermaid-js/mermaid) | 10.6.1 | MIT | cdnjs |
| [svg2pdf.js](https://github.com/yWorks/svg2pdf.js) | 2.9.0 | MIT | jsDelivr, only when exporting to PDF (SVG as vectors) |
| [Twemoji](https://github.com/jdecked/twemoji) (`@twemoji/api`) | 17.0.3 | MIT | jsDelivr |
| [Google Sans](https://github.com/googlefonts/googlesans) | — | SIL OFL 1.1 | Google Fonts; embedded as a subset into exported PDFs |
| [JetBrains Mono](https://github.com/JetBrains/JetBrainsMono) | — | SIL OFL 1.1 | Google Fonts; embedded as a subset into exported PDFs |
| KaTeX fonts | 0.16.9 | SIL OFL 1.1 | jsDelivr / cdnjs; embedded as a subset into exported PDFs |
| [Noto fonts](https://github.com/notofonts) (Noto Sans, Noto Sans JP, KR, SC, TC, Arabic, Hebrew, Math, Symbols 2) | — | SIL OFL 1.1 | jsDelivr; embedded as a subset into exported PDFs in place of system fonts and for characters the document fonts do not cover |

TikZJax runs TeX in the browser (WebAssembly) and bundles TeX packages such as PGF/TikZ and pgfplots, and TeX fonts (Computer Modern, BaKoMa), under their own licenses; see its repository for details. None of its files are copied into this repository.

The distributed bundles of some libraries include third-party code under their own permissive licenses: Mermaid (e.g. d3, dagre-d3-es, DOMPurify, dayjs, khroma — MIT / ISC / BSD-3-Clause / Apache-2.0 / MPL-2.0), jsPDF (e.g. pako, a JPEG encoder, a Unicode bidi engine — MIT / Zlib / BSD) and html2canvas (tslib — 0BSD). Their notices are kept in the bundles.
