# Złoty MD
## English
A Markdown editor with golden-ratio proportions and a Google-inspired color palette.

## Русский
Редактор Markdown с пропорциями золотого сечения и цветовой палитрой в стиле Google.

## 日本語
黄金比のプロポーションと Google インスパイアドなカラーパレットを持つ Markdown エディター。

# Screenshot

![Screenshot](./Снимок%20экрана%202026-11-19%20134943.png)

# License

© 2026 [Rafych](https://github.com/Rafych) and [Hiromichi](https://github.com/hiromichipixel)

Złoty MD is released under the [MIT License](./LICENSE).

# Third-party libraries

The components below are not part of this repository. The browser loads them from a CDN at runtime. They are sorted by license, then by name.

| Component | Version | License | Loaded from |
|---|---|---|---|
| emmalloc (Emscripten) and Zephyr libc string functions | — | Apache-2.0 | bundled in the harfbuzzjs WebAssembly build |
| [PDF.js](https://github.com/mozilla/pdf.js) (`pdfjs-dist`) | 4.10.38 | Apache-2.0 | jsDelivr, only when opening a PDF file |
| [mammoth](https://github.com/mwilliamson/mammoth.js) | 1.13.0 | BSD-2-Clause | jsDelivr, only when opening a DOCX file |
| [Adobe CMaps](https://github.com/adobe-type-tools/cmap-resources) (bundled with PDF.js) | — | BSD-3-Clause | jsDelivr (with PDF.js), only when opening a PDF file |
| [Foxit fonts](https://pdfium.googlesource.com/pdfium/) (PDF.js standard fonts) | — | BSD-3-Clause | jsDelivr (with PDF.js), only when opening a PDF file |
| [highlight.js](https://github.com/highlightjs/highlight.js) | 11.11.1 | BSD-3-Clause | cdnjs (extra languages are loaded only when a code block uses them) |
| [Twemoji graphics](https://github.com/jdecked/twemoji) | 17.0.3 | CC-BY-4.0 | jsDelivr |
| [TikZJax](https://github.com/drgrice1/tikzjax) (`@drgrice1/tikzjax`) | 1.0.0-beta24 | GPL-3.0-or-later | jsDelivr, only when a document contains TikZ |
| [docx](https://github.com/dolanmiu/docx) (with `docx/math` and `docx/html`) | 9.15.4 | MIT | jsDelivr, only when exporting to DOCX |
| [Expo Google Fonts](https://github.com/expo/google-fonts) (`@expo-google-fonts`) | — | MIT | jsDelivr, only when exporting to PDF |
| [fflate](https://github.com/101arrowz/fflate) | 0.8.2 | MIT | jsDelivr, only when opening a DOCX file |
| [harfbuzzjs](https://github.com/harfbuzz/harfbuzzjs) (HarfBuzz) | 0.4.12 | MIT (HarfBuzz: Old MIT) | jsDelivr, only when exporting to PDF (text shaping) |
| [html2canvas](https://github.com/niklasvh/html2canvas) | 1.4.1 | MIT | cdnjs, only when exporting to PDF (used by jsPDF `html()`) |
| [jsPDF](https://github.com/parallax/jsPDF) | 4.2.1 | MIT | cdnjs, only when exporting to PDF |
| [KaTeX](https://github.com/KaTeX/KaTeX) | 0.16.9 | MIT | cdnjs |
| [marked](https://github.com/markedjs/marked) | 9.1.6 | MIT (its license file also contains the BSD-style Markdown license, © 2004 John Gruber) | cdnjs |
| [Mermaid](https://github.com/mermaid-js/mermaid) | 10.6.1 | MIT | cdnjs |
| [svg2pdf.js](https://github.com/yWorks/svg2pdf.js) | 2.9.0 | MIT | jsDelivr, only when exporting to PDF (SVG as vectors) |
| [Twemoji](https://github.com/jdecked/twemoji) (`@twemoji/api`) | 17.0.3 | MIT | jsDelivr |
| [Google Sans](https://github.com/googlefonts/googlesans) | — | SIL OFL 1.1 | Google Fonts; embedded as a subset into exported PDFs |
| [JetBrains Mono](https://github.com/JetBrains/JetBrainsMono) | — | SIL OFL 1.1 | Google Fonts; embedded as a subset into exported PDFs |
| [KaTeX fonts](https://github.com/KaTeX/KaTeX/tree/main/fonts) (based on the MathJax TeX fonts) | 0.16.9 | SIL OFL 1.1 | cdnjs / jsDelivr; embedded as a subset into exported PDFs |
| [Liberation Sans](https://github.com/liberationfonts/liberation-fonts) (PDF.js standard fonts) | — | SIL OFL 1.1 | jsDelivr (with PDF.js), only when opening a PDF file |
| [Noto Sans, Noto Sans Arabic, Noto Sans Hebrew, Noto Sans Math, Noto Sans Symbols 2](https://github.com/notofonts) | — | SIL OFL 1.1 | jsDelivr; embedded as a subset into exported PDFs |
| [Noto Sans JP / KR / SC / TC](https://github.com/notofonts/noto-cjk) | — | SIL OFL 1.1 | Google Fonts (JP, KR); jsDelivr; embedded as a subset into exported PDFs |

TikZJax runs TeX in the browser (WebAssembly) and bundles TeX packages such as PGF/TikZ and pgfplots, and TeX fonts (Computer Modern, BaKoMa), under their own licenses; see its repository for details. None of its files are copied into this repository.

The distributed bundles of some libraries include third-party code under their own permissive licenses: docx (fflate, nanoid, parse5, htmlparser2 — MIT; css-select, domhandler, entities — BSD-2-Clause), html2canvas (tslib — 0BSD), jsPDF (e.g. pako, a JPEG encoder, a Unicode bidi engine — MIT / Zlib / BSD), mammoth (JSZip, Bluebird, underscore, xmldom and others — MIT / BSD-style) and Mermaid (e.g. d3, dagre-d3-es, DOMPurify, dayjs, khroma — MIT / ISC / BSD-3-Clause / Apache-2.0 / MPL-2.0). Their notices are kept in the bundles.

The fonts under the SIL Open Font License are embedded, as subsets, into exported PDF files, which the license permits. The "Złoty MD" wordmark logo is made from Google Sans outlines (no font data is included).
