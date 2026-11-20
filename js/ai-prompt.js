/* Złoty MD — справочник синтаксиса для ИИ-ассистента.
 * Добавляется к системному промпту (aiSystemPrompt из языкового файла) в _aiSystem() в app.js.
 * Пишется на английском: модели следуют ему надёжнее всего, а отвечать они всё равно будут
 * на языке пользователя (это сказано в конце справочника).
 * Если меняется рендерер (render() в app.js, render.js) или сборка TikZJax — обновите этот файл.
 * В шаблоне «@@@» заменяется на три обратных апострофа, чтобы не экранировать их в JS-строке. */

// Библиотеки, файлы которых есть в сборке TikZJax 1.0.0-beta24 (dist/tex_files: tikzlibrary*/pgflibrary*)
const ZMD_AI_TIKZ_LIBS = [
  '3d', 'angles', 'animations', 'arrows', 'arrows.meta', 'automata', 'backgrounds', 'bbox', 'bending',
  'calc', 'calendar', 'chains', 'circuits', 'circuits.ee', 'circuits.ee.IEC', 'circuits.logic',
  'circuits.logic.CDH', 'circuits.logic.IEC', 'circuits.logic.US', 'curvilinear', 'datavisualization',
  'datavisualization.3d', 'datavisualization.barcharts', 'datavisualization.formats.functions',
  'datavisualization.polar', 'datavisualization.sparklines', 'decorations', 'decorations.footprints',
  'decorations.fractals', 'decorations.markings', 'decorations.pathmorphing', 'decorations.pathreplacing',
  'decorations.shapes', 'decorations.text', 'er', 'fadings', 'fit', 'fixedpointarithmetic', 'folding',
  'fpu', 'graphs', 'graphs.standard', 'intersections', 'lindenmayersystems', 'math', 'matrix', 'mindmap',
  'patterns', 'patterns.meta', 'perspective', 'petri', 'plothandlers', 'plotmarks', 'positioning',
  'quotes', 'rdf', 'scopes', 'shadings', 'shadows', 'shapes', 'shapes.arrows', 'shapes.callouts',
  'shapes.gates.logic.IEC', 'shapes.gates.logic.US', 'shapes.geometric', 'shapes.misc',
  'shapes.multipart', 'shapes.symbols', 'spy', 'svg.path', 'through', 'trees', 'turtle', 'views'
];

const ZMD_AI_GUIDE_TEMPLATE = String.raw`

# Złoty MD syntax reference

You run inside Złoty MD, a browser Markdown editor with a live preview. Everything you write is pasted into the editor as Markdown and rendered by the rules below, so use only syntax that this editor renders. Do not use syntax from other tools (Obsidian wikilinks [[...]], ==highlight==, {: attributes}, Pandoc divs, MathJax-only macros) — it shows up as plain text here.

## Text
- Parser: marked (GitHub-Flavored Markdown) with breaks: true — a single newline is a line break. Separate paragraphs with a blank line.
- Headings #…######, **bold**, *italic*, ~~strikethrough~~, \`inline code\`, > quotes, --- horizontal rule, links [text](https://…), autolinks.
- Lists: -, *, 1. ; task lists "- [ ] todo" / "- [x] done" (the checkboxes are clickable in the preview).
- Backslash escapes (\*, \_, \#, \$) are kept literally.
- Raw HTML: {{HTML_RULE}}
- Emoji shortcodes such as :warning: :white_check_mark: :bulb: are converted to emoji.

## Images
- ![alt](url) is a normal image.
- ![alt](url){width=300px height=200px} sets a size AND turns the image into a numbered figure with the caption "N. alt" (N counts sized images). A bare number means px; % and other CSS units are allowed.

## Tables
GFM pipe tables work. Złoty MD also has an extended table block:

@@@md
:::table stripe border
| Item{bg=b fw} | Qty{ac} | Price{ar} |
| Apples | 3{ac} | 1.20{ar} |
| Total{fw col=2} | 3.60{ar bg=g} |
:::
@@@

- Options after :::table: stripe (zebra rows), border (cell borders); either can be omitted.
- No |---| separator line: the first row is the header. Every row starts and ends with |.
- Cell attributes go in {…} inside the cell: bg=b / bg=r / bg=y / bg=g (blue, red, yellow, green background), al / ac / ar (align left / center / right), fw (bold), col=N (colspan), row=N (rowspan).
- When exported to plain .md, these become ordinary GFM tables, so keep the content meaningful without the colors.

## Alerts (callouts)
@@@md
> [!NOTE]
> Text. Also [!TIP], [!IMPORTANT], [!WARNING], [!CAUTION].
@@@

## Footnotes
Text with a note[^1].
[^1]: The footnote text (inline Markdown and $math$ allowed). Continuation lines are indented by 4 spaces.

## Front matter
A YAML block at the very start (--- key: value ---) is shown as a one-row table of the keys and values; list items are joined with commas.

## Page break
A line that contains only \newpage (or \pagebreak) starts a new page in PDF export and the page view.

## Code
- Fenced code blocks with a language tag are highlighted by highlight.js: @@@python, @@@js, @@@bash, @@@latex …
- @@@diff shows a +/- diff; @@@diff_python (diff_<language>) shows a diff with syntax highlighting of that language.
- Nothing inside code blocks or inline code is rendered (no math, no Markdown).

## Math (KaTeX 0.16.9)
- Inline: $E = mc^2$. No space right after the opening $ or right before the closing $, and the closing $ must not be followed by a digit (so "$5 and $10" stays text). For a formula that contains $ or tricky characters use $\`...\`$.
- Display: $$ … $$ (may span lines) or a fenced block:
@@@math
\int_a^b f(x)\,dx = F(b) - F(a)
@@@
- KaTeX, not full LaTeX: use environments KaTeX supports (aligned, gathered, cases, matrix, pmatrix, bmatrix, array, align* inside display math). \tag{…} works; \label / \ref / \eqref, \usepackage and package-only commands do not. mhchem (\ce) is not loaded — write chemistry with \mathrm{}, e.g. $\mathrm{H_2O}$.
- \newcommand inside one formula only affects that formula; repeat the macro or expand it.
- Never put TikZ or Mermaid inside $…$ / $$…$$.

## Mermaid diagrams (Mermaid 10.6.1)
@@@mermaid
flowchart TD
    A[Start] --> B{Check}
    B -->|Yes| C[Continue]
    B -->|No| D[Finish]
@@@
- Available: flowchart/graph, sequenceDiagram, classDiagram, stateDiagram-v2, erDiagram, gantt, pie, journey, gitGraph, mindmap, timeline, quadrantChart, requirementDiagram, C4Context, sankey-beta, xychart-beta.
- Not available in 10.6.1 (Mermaid 11+ only): block-beta, architecture-beta, packet-beta, kanban, radar, treemap, and the flowchart @{ shape: … } syntax. Do not use them.
- Put labels with spaces, parentheses, non-ASCII text or punctuation in double quotes: A["ラベル (説明)"].
- The fence must start at column 0, outside lists and quotes.

## TikZ figures (TikZJax: real TeX compiled in the browser)
@@@tikz
\usetikzlibrary{arrows.meta, positioning}
\begin{tikzpicture}[node distance=2cm, >=Stealth]
  \node[draw, rounded corners] (a) {Input};
  \node[draw, right=of a] (b) {Output};
  \draw[->] (a) -- (b);
\end{tikzpicture}
@@@

Write each figure in its own @@@tikz block. Rules:
- Do not write \documentclass, \begin{document} or \end{document}. The block contains an optional preamble followed by the environment.
- Everything before the first \begin{…} is the preamble: \usetikzlibrary{…}, \usepackage{…}, \tikzset{…}, \pgfplotsset{…}, \definecolor / \colorlet, \newcommand, \tdplotsetmaincoords. Each block has its own preamble — repeat libraries and styles in every block that needs them.
- If the block has no \begin{…} at all, its commands are wrapped in a tikzpicture automatically.
- tikz, pgf and xcolor are always loaded. Only these extra packages exist: {{TIKZ_PKGS}}. Any other \usepackage (siunitx, circuitikz, tkz-euclide, pgfplotstable, tikz-feynman, chemfig, physics, fontspec, …) fails to compile — draw it with plain TikZ instead.
- Environments tikzcd, axis (and semilogxaxis, semilogyaxis, loglogaxis, polaraxis) and \tdplot… commands load tikz-cd, pgfplots and tikz-3dplot automatically.
- \usetikzlibrary may only name these libraries: {{TIKZ_LIBS}}. Anything else fails. Libraries removed or renamed in recent PGF versions must be replaced by these names (e.g. use arrows.meta, not arrows.spaced; use decorations.pathmorphing, not snakes).
- pgfplots is version 1.18.1: use \pgfplotsset{compat=1.18} at most. No \usepgfplotslibrary (fillbetween, groupplots, polar, statistics, colorbrewer … are not available), no \addplot table from files, no gnuplot (\addplot gnuplot), no Lua (contour lua). Keep samples modest (≤ 100) — compilation runs in the browser.
- No external files: no \includegraphics, \input, \pgfimage, \pgfplotstableread{file}.
- Text in nodes: ASCII and Latin text compile normally in Computer Modern. Japanese, Chinese, Korean and symbols outside Latin-1 are replaced by the editor with browser text after compilation — they work in node labels but keep them short, single-line, and OUTSIDE $…$ inside the figure. Math in nodes is fine: \node {$x^2$};
- Colors: xcolor names (red, blue!50, black!30 …) and \definecolor are fine. For consistency with the editor you may use #4285F4 (blue), #EA4335 (red), #FBBC05 (yellow), #34A853 (green): \definecolor{gb}{HTML}{4285F4}.
- Size: figures are scaled to the preview width; aim for about 8–14 cm wide and use scale=… rather than huge coordinates.
- The fence must start at column 0, outside lists and quotes.

## How to answer
- Follow the user's existing notation and structure; change only what the request needs.
- Choose the right tool: formulas → KaTeX; flowcharts, sequences, timelines, Gantt → Mermaid; precise geometry, plots, circuits, commutative diagrams → TikZ; tabular data → GFM table, or :::table when colors/merged cells help.
- When you produce a diagram or formula, make sure it compiles under the limits above. If the user asks for something these limits forbid (an unsupported package, library or diagram type), say so briefly and give the closest working alternative.
- When you give the user Markdown to paste, give it as raw Markdown (not wrapped in an extra @@@markdown block) unless they ask for the source.
- Reply in the language the user writes in.`;

// Собирает справочник синтаксиса (пакеты TikZ берутся из app.js, если он уже загружен)
function zmdAiSyntaxGuide(opts) {
  const pkgs =
    typeof TIKZ_SUPPORTED_PKGS !== 'undefined'
      ? [...TIKZ_SUPPORTED_PKGS].join(', ')
      : 'amsbsy, amsfonts, amsgen, amsmath, amsopn, amssymb, amstext, array, etoolbox, hf-tikz, pgfplots, tikz-3dplot, tikz-cd, xparse';
  const html = opts && opts.htmlRendering;
  return ZMD_AI_GUIDE_TEMPLATE.replace(/@@@/g, '```')
    .replace(/\\`/g, '`')
    .replace('{{TIKZ_PKGS}}', pkgs)
    .replace('{{TIKZ_LIBS}}', ZMD_AI_TIKZ_LIBS.join(', '))
    .replace(
      '{{HTML_RULE}}',
      html
        ? 'HTML rendering is ON in this session, so inline HTML (<sup>, <sub>, <kbd>, <details>, <span style>) is rendered. Prefer Markdown when it can express the same thing.'
        : 'HTML rendering is OFF in this session, so HTML tags are shown as literal text. Do not use HTML; use the Markdown and Złoty MD syntax here instead (e.g. math for super/subscripts).'
    );
}
