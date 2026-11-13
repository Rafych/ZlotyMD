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
| [Leaflet](https://github.com/Leaflet/Leaflet) | 1.9.4 | BSD-2-Clause | jsDelivr, only when a document contains geojson / topojson |
| [highlight.js](https://github.com/highlightjs/highlight.js) | 11.11.1 | BSD-3-Clause | cdnjs (extra languages are loaded only when a code block uses them) |
| [TikZJax](https://github.com/drgrice1/tikzjax) (`@drgrice1/tikzjax`) | 1.0.0-beta24 | GPL-3.0-or-later | jsDelivr, only when a document contains TikZ |
| [topojson-client](https://github.com/topojson/topojson-client) | 3.1.0 | ISC | jsDelivr, only when a document contains topojson |
| [harfbuzzjs](https://github.com/harfbuzz/harfbuzzjs) ([HarfBuzz](https://github.com/harfbuzz/harfbuzz)) | 0.4.12 | MIT (HarfBuzz: Old MIT; parts Apache-2.0) | jsDelivr, only when exporting to PDF (text shaping) |
| [html2canvas](https://github.com/niklasvh/html2canvas) | 1.4.1 | MIT | cdnjs, only when exporting to PDF (used by jsPDF `html()`) |
| [jsPDF](https://github.com/parallax/jsPDF) | 4.2.1 | MIT | cdnjs, only when exporting to PDF |
| [KaTeX](https://github.com/KaTeX/KaTeX) | 0.16.9 | MIT | cdnjs |
| [marked](https://github.com/markedjs/marked) | 9.1.6 | MIT | cdnjs |
| [Mermaid](https://github.com/mermaid-js/mermaid) | 10.6.1 | MIT | cdnjs |
| [svg2pdf.js](https://github.com/yWorks/svg2pdf.js) | 2.9.0 | MIT | jsDelivr, only when exporting to PDF (SVG as vectors) |
| [three.js](https://github.com/mrdoob/three.js) | r128 | MIT | jsDelivr, only when a document contains stl |
| [OpenStreetMap](https://www.openstreetmap.org/copyright) map data and tiles | — | ODbL-1.0 | OpenStreetMap tile servers, only when a document contains geojson / topojson |
| [Google Sans](https://fonts.google.com/) | — | SIL OFL 1.1 | Google Fonts |
| [JetBrains Mono](https://github.com/JetBrains/JetBrainsMono) | 2020 | SIL OFL 1.1 | Google Fonts |
| KaTeX fonts | 0.16.9 | SIL OFL 1.1 | jsDelivr / cdnjs |
| [Noto fonts](https://github.com/notofonts) (Noto Sans, Noto Sans JP, KR, SC, TC, Arabic, Hebrew, Math, Symbols 2) | — | SIL OFL 1.1 | jsDelivr, embedded into a PDF only for characters the document fonts do not cover |

TikZJax runs TeX in the browser (WebAssembly) and bundles TeX packages such as PGF/TikZ and pgfplots under their own licenses; see its repository for details. None of its files are copied into this repository.
