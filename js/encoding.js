// Złoty MD — определение и преобразование кодировок текстовых файлов (window.ZmdEncoding).
//
// Определение идёт от самого надёжного признака к наименее надёжному:
//   1. BOM (UTF-8, UTF-16LE/BE) — явное указание создателя файла; принимается, только если декодируется без ошибок.
//   2. Признаки, которые однозначно опознаются по байтам: escape-последовательности ISO-2022-JP и
//      UTF-16 без BOM (нулевые байты через один). Проверяются до UTF-8, потому что такие байты
//      формально тоже являются корректным UTF-8.
//   3. Строгая проверка UTF-8 — не угадывание, а точная проверка правил UTF-8.
//   4. Статистическая оценка остальных кандидатов (как chardetng в Firefox): каждый кандидат
//      декодируется строго (ошибка — кандидат отпадает), затем текст оценивается по набору признаков:
//        • японский / корейский: доля каны, иероглифы 1-го уровня JIS, частые слоги хангыля из KS X 1001,
//          полуширинная кана и редкие расширения считаются подозрительными;
//        • алфавитные письменности: буквы с диакритикой должны принадлежать алфавиту одного языка
//          (например, «ì è ø ù» вместе — не французский и не датский, а чешский в чужой кодировке),
//          не должно быть управляющих символов C1, знаков внутри слов, букв другой письменности
//          внутри латинских слов, ЗаГлАвНыХ букв посреди слова;
//        • для кириллицы, греческого, иврита и арабского — сходство частот букв с реальным языком
//          (так различаются, например, Windows-1251 и KOI8-R, где одни и те же байты — разные буквы).
//      Для близких результатов учитывается распространённость кодировки.
//   5. Если ни один кандидат не декодируется, оценка слишком низкая или два кандидата дают разный
//      текст с почти одинаковой оценкой — решение остаётся за пользователем (status: 'choice').
(function () {
  'use strict';

  // Все кодировки, которые умеет TextDecoder (WHATWG Encoding), кроме китайских (GBK, GB18030, Big5).
  // group — письменность (для группировки в списке), langs — языки (подписи в списке и оценка текста)
  const W = ['en', 'fr', 'de', 'es', 'pt', 'it', 'nl', 'da', 'no', 'sv', 'fi', 'is', 'ca', 'ga', 'gl', 'sq'];
  const CE = ['pl', 'cs', 'sk', 'hu', 'sl', 'hr', 'ro', 'sq', 'de'];
  const ENCODINGS = [
    { id: 'utf-8', name: 'UTF-8', group: 'Unicode', prior: 0.1 },
    { id: 'utf-8-bom', name: 'UTF-8 (BOM)', group: 'Unicode', decoder: 'utf-8', prior: 0 },
    { id: 'utf-16le', name: 'UTF-16LE', group: 'Unicode', prior: 0 },
    { id: 'utf-16be', name: 'UTF-16BE', group: 'Unicode', prior: 0 },
    { id: 'shift_jis', name: 'Shift_JIS', group: 'Jpan', langs: ['ja'], cjk: 'ja', prior: 0.06 },
    { id: 'euc-jp', name: 'EUC-JP', group: 'Jpan', langs: ['ja'], cjk: 'ja', prior: 0.04 },
    { id: 'iso-2022-jp', name: 'ISO-2022-JP', group: 'Jpan', langs: ['ja'], prior: 0 },
    { id: 'euc-kr', name: 'EUC-KR (CP949)', group: 'Kore', langs: ['ko'], cjk: 'ko', prior: 0.05 },
    { id: 'windows-1252', name: 'Windows-1252', group: 'Latn', langs: W, prior: 0.08 },
    { id: 'iso-8859-15', name: 'ISO-8859-15', group: 'Latn', langs: W.concat(['et']), prior: 0.01 },
    { id: 'macintosh', name: 'Mac OS Roman', group: 'Latn', langs: W, prior: -0.01 },
    { id: 'windows-1250', name: 'Windows-1250', group: 'Latn', langs: CE, prior: 0.05 },
    { id: 'iso-8859-2', name: 'ISO-8859-2', group: 'Latn', langs: CE, prior: 0.02 },
    { id: 'iso-8859-16', name: 'ISO-8859-16', group: 'Latn', langs: ['ro', 'pl', 'hu', 'hr', 'sl', 'fr', 'de', 'it'], prior: 0 },
    { id: 'windows-1254', name: 'Windows-1254', group: 'Latn', langs: ['tr', 'az'], prior: 0.04 },
    { id: 'iso-8859-9', name: 'ISO-8859-9', group: 'Latn', langs: ['tr'], prior: 0.01 },
    { id: 'windows-1257', name: 'Windows-1257', group: 'Latn', langs: ['et', 'lv', 'lt'], prior: 0.04 },
    { id: 'iso-8859-13', name: 'ISO-8859-13', group: 'Latn', langs: ['et', 'lv', 'lt'], prior: 0.01 },
    { id: 'iso-8859-4', name: 'ISO-8859-4', group: 'Latn', langs: ['et', 'lv', 'lt'], prior: 0 },
    { id: 'iso-8859-10', name: 'ISO-8859-10', group: 'Latn', langs: ['is', 'da', 'no', 'sv', 'fi', 'se'], prior: 0 },
    { id: 'iso-8859-14', name: 'ISO-8859-14', group: 'Latn', langs: ['cy', 'ga', 'gd'], prior: 0 },
    { id: 'iso-8859-3', name: 'ISO-8859-3', group: 'Latn', langs: ['mt', 'eo'], prior: 0 },
    { id: 'windows-1258', name: 'Windows-1258', group: 'Latn', langs: ['vi'], prior: 0.03 },
    { id: 'windows-1251', name: 'Windows-1251', group: 'Cyrl', langs: ['ru', 'uk', 'be', 'bg', 'sr', 'mk'], prior: 0.07 },
    { id: 'koi8-r', name: 'KOI8-R', group: 'Cyrl', langs: ['ru', 'bg'], prior: 0.03 },
    { id: 'koi8-u', name: 'KOI8-U', group: 'Cyrl', langs: ['uk', 'ru', 'be'], prior: 0.02 },
    { id: 'ibm866', name: 'IBM866 (CP866)', group: 'Cyrl', langs: ['ru', 'be'], prior: 0.01 },
    { id: 'iso-8859-5', name: 'ISO-8859-5', group: 'Cyrl', langs: ['ru', 'bg', 'sr', 'mk'], prior: 0 },
    { id: 'x-mac-cyrillic', name: 'Mac Cyrillic', group: 'Cyrl', langs: ['ru', 'uk', 'bg'], prior: -0.01 },
    { id: 'windows-1253', name: 'Windows-1253', group: 'Grek', langs: ['el'], prior: 0.04 },
    { id: 'iso-8859-7', name: 'ISO-8859-7', group: 'Grek', langs: ['el'], prior: 0.02 },
    { id: 'windows-1255', name: 'Windows-1255', group: 'Hebr', langs: ['he', 'yi'], prior: 0.04 },
    { id: 'iso-8859-8', name: 'ISO-8859-8', group: 'Hebr', langs: ['he'], prior: 0.01 },
    { id: 'iso-8859-8-i', name: 'ISO-8859-8-I', group: 'Hebr', langs: ['he'], prior: 0, noDetect: true },
    { id: 'windows-1256', name: 'Windows-1256', group: 'Arab', langs: ['ar', 'fa', 'ur'], prior: 0.04 },
    { id: 'iso-8859-6', name: 'ISO-8859-6', group: 'Arab', langs: ['ar'], prior: 0.01 },
    { id: 'windows-874', name: 'Windows-874 (TIS-620)', group: 'Thai', langs: ['th'], prior: 0.04 }
  ];
  const BY_ID = Object.fromEntries(ENCODINGS.map(e => [e.id, e]));
  const decoderLabel = id => (BY_ID[id] && BY_ID[id].decoder) || id;
  const isSupported = id => {
    try {
      new TextDecoder(decoderLabel(id));
      return true;
    } catch (e) {
      return false;
    }
  };

  // ---------------------------------------------------------------------
  // Алфавиты (строчные буквы вне ASCII) и частоты букв
  // ---------------------------------------------------------------------
  const VI = 'àáâãèéêìíòóôõùúýăđĩũơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ\u0300\u0301\u0303\u0309\u0323';
  const ALPHA = {
    en: '',
    fr: 'àâæçéèêëîïôœùûüÿ',
    de: 'äöüß',
    es: 'áéíñóúü',
    pt: 'áâãàçéêíóôõú',
    it: 'àèéìíîòóùú',
    nl: 'éëïóöüè',
    da: 'æøåé',
    no: 'æøåéèóô',
    sv: 'åäöé',
    fi: 'äöåšž',
    is: 'áðéíóúýþæö',
    ca: 'àçèéíïòóúü·',
    ga: 'áéíóú',
    gl: 'áéíñóúü',
    gd: 'àèìòù',
    sq: 'çë',
    et: 'äöõüšž',
    lv: 'āčēģīķļņšūž',
    lt: 'ąčęėįšųūž',
    pl: 'ąćęłńóśźż',
    cs: 'áčďéěíňóřšťúůýž',
    sk: 'áäčďéíĺľňóôŕšťúýž',
    hu: 'áéíóöőúüű',
    ro: 'ăâîșşțţ',
    hr: 'čćđšž',
    sl: 'čšž',
    tr: 'çğıöşüâîû',
    az: 'çğıöşü',
    mt: 'ċġħżàèìòù',
    eo: 'ĉĝĥĵŝŭ',
    cy: 'âêîôûŵŷäëïöüẅÿáéíóúàèìòùẁẃỳý',
    se: 'áčđŋšŧž',
    vi: VI
  };
  const ALPHA_SET = Object.fromEntries(Object.entries(ALPHA).map(([k, v]) => [k, new Set(v)]));
  // Языки с собственной письменностью: диапазон символов и буквы в порядке убывания частоты
  const SCRIPT_LANG = {
    ru: { re: /[\u0400-\u04FF]/, freq: 'оеаинтсрвлкмдпуяыьгзбчйхжшюцщэфъё' },
    uk: { re: /[\u0400-\u04FF]/, freq: 'оанівритеслкудмпязьбгчхжйшюцєщїфґ' },
    be: { re: /[\u0400-\u04FF]/, freq: 'аоыенірсквтлдмзпуяйбчьгхжшцюэёфў' },
    bg: { re: /[\u0400-\u04FF]/, freq: 'аоеинтрсвлкдпмзяъбугчжйхшщцфью' },
    sr: { re: /[\u0400-\u04FF]/, freq: 'аиоенсртјвдлкупмзгбчшцњхћжљђфџ' },
    mk: { re: /[\u0400-\u04FF]/, freq: 'аиоентрсвдклпмзуѕјбгчшцњжхќљфѓџ' },
    el: { re: /[\u0370-\u03FF\u1F00-\u1FFF]/, freq: 'αοειτνσρηπκυμλωδγχθφβξζψάέίόύήώςϊΐϋΰ' },
    he: { re: /[\u0590-\u05FF\uFB1D-\uFB4F]/, freq: 'יוהלארבתמנשעדקכחפסגצזטםןךףץ' },
    yi: { re: /[\u0590-\u05FF\uFB1D-\uFB4F]/, freq: 'ןעראיוטדלנמשגזבהכצפקסחת' },
    ar: { re: /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/, freq: 'السلميونهربتعدفكقحجةشطصذخثزضظغءئأإآى' },
    fa: { re: /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/, freq: 'ایدنرهموتبسلکشزفگعخقجآپحچصطضظغذثژ' },
    ur: { re: /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/, freq: 'ایکےہنرمتوسلدبپگجعشحفقٹزچخصغڈ' },
    th: { re: /[\u0E00-\u0E7F]/, freq: 'านรอกเมงยลวดทสตะคปบขจหไพแชั่้ีิืุู็์ใถโซศผญฟธษณฝภฉฮฐำฎฑฒฏฬฆฤฦฅฃ' }
  };
  // Модель частот: вероятность буквы убывает экспоненциально с рангом (у русского «о» ≈ 11 %, «ъ» ≈ 0.04 %).
  // Храним log(p · K), где K — размер алфавита: у равномерного (случайного) текста среднее ≈ 0 и ниже
  const FREQ_LOG = {};
  const fv0 = lang => (SCRIPT_LANG[lang] && SCRIPT_LANG[lang].freq) || '';
  Object.entries(SCRIPT_LANG).forEach(([k, v]) => {
    if (!v.freq) return;
    const letters = Array.from(new Set(v.freq));
    const w = letters.map((c, i) => Math.exp(-i / 10));
    const sum = w.reduce((a, b) => a + b, 0);
    const m = new Map();
    letters.forEach((c, i) => m.set(c, Math.log((w[i] / sum) * letters.length)));
    m.floor = Math.log((0.3 / sum) * Math.exp(-letters.length / 10) * letters.length); // буква вне списка
    FREQ_LOG[k] = m;
  });

  // Знаки, обычные в тексте рядом с буквами (кавычки, тире, многоточие, валюта…)
  const NEUTRAL = new Set('“”‘’„‚–—…€£¥«»°·•′″‹›§©®™±×÷¶¡¿\u00A0\u00AD');
  const CURRENCY = new Set('€£¥');
  const JOINERS = new Set('’·\u00AD'); // допустимы и между буквами (don’t, l·l, мягкий перенос)
  const isAsciiLetter = c => !!c && /[A-Za-z]/.test(c);
  const LETTER_RE = /[\p{L}\p{M}]/u;
  const isLetter = c => !!c && LETTER_RE.test(c);
  const isLowerLetter = c => !!c && isLetter(c) && c !== c.toUpperCase() && c === c.toLowerCase();
  const GREEK_TONOS = /[\u0386\u0388-\u038A\u038C\u038E-\u0390\u03AC-\u03AF\u03B0\u03CC-\u03CE]/;
  const SCRIPTS = [
    ['Latn', /[\u00C0-\u024F\u1E00-\u1EFF]/],
    ['Grek', /[\u0370-\u03FF\u1F00-\u1FFF]/],
    ['Cyrl', /[\u0400-\u04FF]/],
    ['Hebr', /[\u0590-\u05FF]/],
    ['Arab', /[\u0600-\u06FF\u0750-\u077F]/],
    ['Thai', /[\u0E00-\u0E7F]/]
  ];
  const scriptOf = c => {
    for (const [k, re] of SCRIPTS) if (re.test(c)) return k;
    return null;
  };
  const THAI_MARK = /[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/;
  const THAI_BASE = /[\u0E01-\u0E2F\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/;

  // ---------------------------------------------------------------------
  // Японский и корейский
  // ---------------------------------------------------------------------
  let _jisLevel1 = null; // иероглифы 1-го уровня JIS X 0208 (частые)
  let _ksSyllables = null; // слоги хангыля из KS X 1001 (2350 употребительных)
  function jisLevel1() {
    if (_jisLevel1) return _jisLevel1;
    const d = new TextDecoder('euc-jp');
    const s = new Set();
    for (let a = 0xb0; a <= 0xcf; a++) for (let b = 0xa1; b <= 0xfe; b++) s.add(d.decode(new Uint8Array([a, b])));
    return (_jisLevel1 = s);
  }
  function ksSyllables() {
    if (_ksSyllables) return _ksSyllables;
    const d = new TextDecoder('euc-kr');
    const s = new Set();
    for (let a = 0xb0; a <= 0xc8; a++) for (let b = 0xa1; b <= 0xfe; b++) s.add(d.decode(new Uint8Array([a, b])));
    return (_ksSyllables = s);
  }
  const KO_COMMON = new Set(
    '이다는의에가을하고지서기사한로리도니자대를일으수그정아시어인있나해것전국부주상여들생성제장보위소우라원경거면화내등만게문같동적업연공비구마분신오회세실중무금명계관물개후진미히요습까았었했된될되말와과때년월날저곳점번또더안않잘못좀많런떤모든각늘학교람간처음함께통따요며서죠네군요던려겠할합니다입니까십시오'
  );

  function scoreCjk(str, kind, nonAsciiBytes) {
    let s = 0;
    let kana = 0;
    let kanji = 0;
    let kanjiScore = 0;
    let hw = 0; // полуширинная кана
    let hwMarks = 0; // знаки озвончения, долгота и пунктуация полуширинной каны
    let rare = 0; // иероглифы не 1-го уровня
    const l1 = kind === 'ja' ? jisLevel1() : null;
    const ks = kind === 'ko' ? ksSyllables() : null;
    for (const c of str) {
      const u = c.codePointAt(0);
      if (u < 0x80) continue;
      if ((u >= 0x3040 && u <= 0x309f) || (u >= 0x30a0 && u <= 0x30ff)) {
        // Кана: основа японского текста; в корейском встречается редко
        if (kind === 'ja') {
          s += 2;
          kana++;
        } else s += 0.5;
      } else if ((u >= 0x4e00 && u <= 0x9fff) || (u >= 0x3400 && u <= 0x4dbf) || (u >= 0xf900 && u <= 0xfaff)) {
        kanji++;
        const w = kind === 'ja' ? (l1.has(c) ? 1.7 : 0.7) : 0.8;
        if (kind === 'ja' && !l1.has(c)) rare++;
        s += w;
        kanjiScore += w;
      } else if (u >= 0xac00 && u <= 0xd7a3) {
        // Слоги хангыля: частые и из KS X 1001 — хорошо, расширение CP949 — подозрительно
        if (kind === 'ko') s += KO_COMMON.has(c) ? 2.4 : ks.has(c) ? 1.3 : 0.35;
        else s += 0.3;
      } else if (u >= 0x3130 && u <= 0x318f) s += 0.6; // отдельные чамо
      else if ((u >= 0x3000 && u <= 0x303f) || (u >= 0xff01 && u <= 0xff5e) || u === 0x30fc) s += 1.7;
      else if (u >= 0xff61 && u <= 0xff9f) {
        s += 0.25; // полуширинная кана: сама по себе бывает, но часто это EUC-JP, прочитанный как Shift_JIS
        hw++;
        if (u === 0xff9e || u === 0xff9f || u === 0xff70 || u <= 0xff65) hwMarks++; // ﾞ ﾟ ｰ ｡ ｢ ｣ ､ ･
      }
      else if (u >= 0x2500 && u <= 0x257f) s += 0.8;
      else if (u >= 0x2000 && u <= 0x2bff) s += 0.9;
      else if ((u >= 0x0370 && u <= 0x03ff) || (u >= 0x0400 && u <= 0x04ff)) s += 0.5;
      else if (u >= 0xe000 && u <= 0xf8ff) s -= 2; // область для личного использования
      else s += 0.3;
    }
    // Полуширинная кана со знаками озвончения и без редких иероглифов вокруг — настоящий старый текст,
    // а не мусор (заглавная кириллица Windows-1251 в Shift_JIS тоже выглядит как полуширинная кана)
    if (kind === 'ja' && hw >= 3 && rare <= hw * 0.05 && (hwMarks >= hw * 0.08 || kana > 0)) s += hw * 0.65;
    // Японский текст без каны (сплошные иероглифы) — скорее корейский или мусор в чужой кодировке
    if (kind === 'ja' && kana + kanji >= 16 && kana < 0.06 * (kana + kanji)) s -= kanjiScore * 0.65;
    return s / Math.max(1, nonAsciiBytes);
  }

  // ---------------------------------------------------------------------
  // Однобайтовые кодировки
  // ---------------------------------------------------------------------
  function scoreSingle(str, langs) {
    let n = 0;
    let bad = 0;
    let caseBad = 0;
    let upper = 0;
    let lower = 0;
    let mixed = 0;
    const counts = new Map();
    let accents = 0; // ударения в текущем греческом слове
    let wordScript = null; // письменность букв текущего слова
    const isolated = []; // одиночные буквы не латиницы («слово» из одной буквы)
    for (let i = 0; i < str.length; i++) {
      const c = str[i];
      const u = c.charCodeAt(0);
      if (u < 0x80) {
        accents = 0;
        if (isAsciiLetter(c)) {
          if (wordScript && wordScript !== 'Latn') mixed++; // латиница сразу после буквы другой письменности
          wordScript = 'Latn';
        } else wordScript = null;
        continue;
      }
      n++;
      if (u <= 0x9f || u === 0xfffd) {
        bad += 10; // управляющие символы C1 в тексте не встречаются
        continue;
      }
      const prev = str[i - 1];
      const next = str[i + 1];
      if (!isLetter(c)) {
        accents = 0;
        wordScript = null;
        const pl = isLetter(prev);
        const nl = isLetter(next);
        if (NEUTRAL.has(c)) {
          if (pl && nl && !JOINERS.has(c)) bad += 2;
          else if (CURRENCY.has(c) && /\d/.test((str[i - 2] || '') + (prev || '') + (next || '') + (str[i + 2] || ''))) bad -= 1.3; // «100 €»
          else bad -= 0.8; // обычная типографика: кавычки, тире, многоточие
        } else if (c === '¤') bad += 1;
        else if (pl && nl) bad += 3;
        else if (pl || nl) bad += 1.5;
        else bad += 0.3;
        continue;
      }
      const lo = c.toLowerCase();
      counts.set(lo, (counts.get(lo) || 0) + 1);
      // Начало предложения со строчной буквы — признак чужой кодировки (заглавные и строчные перепутаны)
      if (c === lo && c !== c.toUpperCase() && i >= 2 && /[.!?]/.test(str[i - 2]) && prev === ' ') bad += 1;
      if (c !== lo) {
        upper++;
        if (isLowerLetter(prev)) caseBad++; // ЗаГлАвНаЯ посреди слова
      } else if (c !== c.toUpperCase()) lower++;
      // Буквы разных письменностей в одном слове (кроме диакритических знаков)
      const sc0 = scriptOf(c);
      if (sc0) {
        if (wordScript && wordScript !== sc0) mixed++;
        wordScript = sc0;
        if (sc0 !== 'Latn' && !isLetter(prev) && !isLetter(next)) isolated.push(c.toLowerCase());
      }
      // Греческий: ς — только в конце слова, ударение — не больше одного на слово
      if (c === '\u03C2' && isLetter(next)) bad += 3;
      if (GREEK_TONOS.test(c) && ++accents > 1) bad += 2;
      // Тайские надстрочные гласные и тоны стоят только после согласной (или другого знака)
      if (THAI_MARK.test(c) && !THAI_BASE.test(prev || '')) bad += 3;
    }
    if (!n) return { score: 0, lang: null };
    // Заглавных больше, чем строчных — признак перепутанной кодировки (KOI8 ↔ Windows-1251)
    const caseDom = upper + lower >= 10 ? Math.max(0, upper - lower) * 0.15 : 0;
    const common = bad + caseBad * 1.5 + mixed * 3 + caseDom;
    let best = { score: -Infinity, lang: null };
    for (const lang of langs) {
      let good = 0;
      let other = 0;
      let sim = 0;
      const sc = SCRIPT_LANG[lang];
      if (sc) {
        let ll = 0;
        const fl = FREQ_LOG[lang];
        counts.forEach((k, ch) => {
          if (sc.re.test(ch)) {
            good += k;
            if (fl) ll += k * (fl.has(ch) ? fl.get(ch) : fl.floor);
          } else if (ALPHA_SET.fr.has(ch) && lang === 'ar') good += k * 0.5; // в Windows-1256 есть французские буквы
          else other += k;
        });
        if (fl && good) sim = ll / good; // средний логарифм правдоподобия на букву
        // Однобуквенное «слово» из редкой буквы (например, «Ђ» вместо «€») — подозрительно
        if (fv0(lang)) isolated.forEach(ch => {
          const rank = fv0(lang).indexOf(ch);
          if (rank < 0 || rank > 14) other += 0.75;
        });
      } else {
        const set = ALPHA_SET[lang] || new Set();
        counts.forEach((k, ch) => {
          if (set.has(ch)) good += k;
          else other += k;
        });
      }
      let score = (good - other * 2 - common) / n;
      // Частоты букв не похожи на язык — скорее всего, это чужая кодировка
      // (у реального текста среднее ≈ 0.25–0.5, у перепутанного — около нуля и ниже)
      if (sc && sc.freq && good >= 4 && score > 0) score *= Math.max(0.2, Math.min(1, 0.7 + sim * 0.9));
      if (score > best.score) best = { score, lang };
    }
    return best;
  }

  // ---------------------------------------------------------------------
  // Определение
  // ---------------------------------------------------------------------
  const SAMPLE = 64 * 1024; // для оценки хватает начала файла; весь файл затем проверяется строгим декодированием
  const ACCEPT = 0.45; // ниже — просим выбрать вручную
  const AMBIGUOUS = 0.04; // разница оценок, при которой два разных результата считаются неразличимыми

  function strictDecode(bytes, id) {
    try {
      return new TextDecoder(decoderLabel(id), { fatal: true }).decode(bytes);
    } catch (e) {
      return null;
    }
  }
  // Выборка для оценки: начинается с первого байта вне ASCII (после ASCII-байта — всегда граница
  // символа), чтобы длинное английское начало файла не вытеснило из выборки сам текст
  const _samples = new WeakMap();
  function sampleOf(bytes) {
    let s = _samples.get(bytes);
    if (s) return s;
    let start = 0;
    while (start < bytes.length && bytes[start] < 0x80) start++;
    start = Math.max(0, start - 64);
    while (start > 0 && bytes[start - 1] >= 0x80) start--;
    s = { bytes: bytes.subarray(start, start + SAMPLE), cut: start + SAMPLE < bytes.length };
    _samples.set(bytes, s);
    return s;
  }
  function sampleDecode(bytes, id) {
    // stream:true не считает ошибкой символ, обрезанный на конце выборки
    const s = sampleOf(bytes);
    try {
      return new TextDecoder(decoderLabel(id), { fatal: true }).decode(s.bytes, { stream: s.cut });
    } catch (e) {
      return null;
    }
  }

  function bomOf(bytes) {
    if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) return 'utf-8-bom';
    if (bytes[0] === 0xff && bytes[1] === 0xfe) return 'utf-16le';
    if (bytes[0] === 0xfe && bytes[1] === 0xff) return 'utf-16be';
    return null;
  }

  // UTF-16 без BOM: в тексте с латиницей каждый второй байт — ноль
  function utf16ByNulls(bytes) {
    const len = Math.min(bytes.length, SAMPLE) & ~1;
    if (len < 4) return null;
    let even = 0;
    let odd = 0;
    for (let i = 0; i < len; i += 2) {
      if (bytes[i] === 0) even++;
      if (bytes[i + 1] === 0) odd++;
    }
    const half = len / 2;
    if (odd / half > 0.3 && even / half < 0.05) return 'utf-16le';
    if (even / half > 0.3 && odd / half < 0.05) return 'utf-16be';
    return null;
  }

  // ISO-2022-JP: только 7-битные байты и escape-последовательности переключения на JIS
  function looksIso2022jp(bytes) {
    const len = Math.min(bytes.length, SAMPLE);
    let esc = false;
    for (let i = 0; i < len; i++) {
      const b = bytes[i];
      if (b >= 0x80) return false;
      if (b === 0x1b && bytes[i + 1] === 0x24 && (bytes[i + 2] === 0x42 || bytes[i + 2] === 0x40)) esc = true;
    }
    return esc;
  }

  function nonAsciiCount(bytes) {
    const b = sampleOf(bytes).bytes;
    let n = 0;
    for (let i = 0; i < b.length; i++) if (b[i] >= 0x80) n++;
    return n;
  }

  // Оценивает всех кандидатов; возвращает массив, отсортированный по убыванию итоговой оценки
  function rank(bytes) {
    const nab = nonAsciiCount(bytes);
    const out = [];
    for (const enc of ENCODINGS) {
      if (enc.group === 'Unicode' || enc.noDetect || enc.id === 'iso-2022-jp' || !isSupported(enc.id)) continue;
      const sample = sampleDecode(bytes, enc.id);
      if (sample === null) continue;
      let r;
      if (enc.cjk) r = { score: scoreCjk(sample, enc.cjk, nab), lang: enc.cjk };
      else r = scoreSingle(sample, enc.langs);
      out.push({ id: enc.id, score: r.score, lang: r.lang, final: r.score + enc.prior, sample });
    }
    out.sort((a, b) => b.final - a.final);
    return out;
  }

  // Почти корректный UTF-8 (несколько повреждённых байтов) — предлагаем UTF-8 в списке выбора
  function nearlyUtf8(bytes) {
    const s = new TextDecoder('utf-8').decode(sampleOf(bytes).bytes);
    let bad = 0;
    let multi = 0;
    for (const c of s) {
      if (c === '�') bad++;
      else if (c.codePointAt(0) >= 0x80) multi++;
    }
    return bad > 0 && multi >= bad * 3;
  }

  function result(id, text, method) {
    return { status: 'detected', encoding: id, text: text, method: method, bom: id === 'utf-8-bom' || /^utf-16/.test(id) };
  }

  function detect(input) {
    const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
    if (!bytes.length) return result('utf-8', '', 'auto');
    // 1. BOM
    const bom = bomOf(bytes);
    if (bom) {
      const t = strictDecode(bytes, bom);
      if (t !== null) return result(bom, t, 'bom');
    }
    // 2. Однозначные признаки по байтам
    if (looksIso2022jp(bytes)) {
      const t = strictDecode(bytes, 'iso-2022-jp');
      if (t !== null) return result('iso-2022-jp', t, 'auto');
    }
    const u16 = utf16ByNulls(bytes);
    if (u16) {
      const t = strictDecode(bytes, u16);
      if (t !== null && !/[\uD800-\uDFFF]/.test(t.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, ''))) return result(u16, t, 'auto');
    }
    // 3. Строгий UTF-8
    const u8 = strictDecode(bytes, 'utf-8');
    if (u8 !== null) return result('utf-8', u8, 'auto');
    // 4. Статистическая оценка
    const ranked = rank(bytes);
    const guessUtf8 = nearlyUtf8(bytes);
    const best = ranked[0];
    if (best && !guessUtf8 && best.score >= ACCEPT) {
      // Близкий соперник с другим текстом. Если он той же письменности, а букв вне ASCII мало,
      // данных для выбора всё равно нет — решает распространённость кодировки
      const rival = ranked.find(r => r.sample !== best.sample);
      const sameScript = rival && BY_ID[rival.id].group === BY_ID[best.id].group;
      const ambiguous = rival && best.final - rival.final < AMBIGUOUS && !(sameScript && nonAsciiCount(bytes) < 8);
      if (!ambiguous) {
        // Выборка декодировалась — проверяем весь файл
        for (const cand of ranked) {
          if (cand.final < best.final - AMBIGUOUS) break;
          const t = sampleOf(bytes).bytes.length === bytes.length ? cand.sample : strictDecode(bytes, cand.id);
          if (t !== null) return result(cand.id, t, 'auto');
        }
      }
    }
    // 5. Решает пользователь
    return {
      status: 'choice',
      guess: guessUtf8 ? 'utf-8' : best ? best.id : 'utf-8',
      candidates: ranked.slice(0, 5).map(r => ({ id: r.id, score: Math.round(r.final * 1000) / 1000 }))
    };
  }

  // Принудительное декодирование выбранной вручную кодировкой: ошибочные байты → U+FFFD
  function decode(input, id) {
    const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
    let text = new TextDecoder(decoderLabel(id)).decode(bytes);
    if (id === 'utf-8' && text.charCodeAt(0) === 0xfeff) text = text.slice(1);
    return text;
  }

  // ---------------------------------------------------------------------
  // Кодирование (TextEncoder умеет только UTF-8, поэтому таблицы строятся из TextDecoder)
  // ---------------------------------------------------------------------
  const _encMaps = {};
  function encMap(id) {
    if (_encMaps[id]) return _encMaps[id];
    const d = new TextDecoder(decoderLabel(id));
    const m = new Map();
    const put = (ch, seq) => {
      if (ch && ch !== '�' && !m.has(ch)) m.set(ch, seq);
    };
    const one = a => d.decode(new Uint8Array(a));
    if (id === 'shift_jis') {
      for (let b = 0xa1; b <= 0xdf; b++) put(one([b]), [b]);
      for (let a = 0x81; a <= 0xfc; a++) {
        if (a > 0x9f && a < 0xe0) continue;
        for (let b = 0x40; b <= 0xfc; b++) if (b !== 0x7f) put(one([a, b]), [a, b]);
      }
    } else if (id === 'euc-jp' || id === 'iso-2022-jp') {
      const de = new TextDecoder('euc-jp');
      for (let a = 0xa1; a <= 0xfe; a++)
        for (let b = 0xa1; b <= 0xfe; b++) {
          const ch = de.decode(new Uint8Array([a, b]));
          put(ch, id === 'euc-jp' ? [a, b] : [a - 0x80, b - 0x80]);
        }
      if (id === 'euc-jp') for (let b = 0xa1; b <= 0xdf; b++) put(de.decode(new Uint8Array([0x8e, b])), [0x8e, b]);
    } else if (id === 'euc-kr') {
      for (let a = 0x81; a <= 0xfe; a++)
        for (let b = 0x41; b <= 0xfe; b++) {
          if ((b > 0x5a && b < 0x61) || (b > 0x7a && b < 0x81)) continue;
          put(one([a, b]), [a, b]);
        }
    } else {
      for (let b = 0x80; b <= 0xff; b++) put(one([b]), [b]);
    }
    return (_encMaps[id] = m);
  }

  // Возвращает { bytes: Uint8Array, unmappable: число символов, заменённых на «?» }
  function encode(text, id) {
    const eid = BY_ID[id] && isSupported(id) ? id : 'utf-8';
    if (eid === 'utf-8' || eid === 'utf-8-bom') {
      const body = new TextEncoder().encode(text);
      if (eid === 'utf-8') return { bytes: body, unmappable: 0 };
      const out = new Uint8Array(body.length + 3);
      out.set([0xef, 0xbb, 0xbf]);
      out.set(body, 3);
      return { bytes: out, unmappable: 0 };
    }
    if (eid === 'utf-16le' || eid === 'utf-16be') {
      const out = new Uint8Array(2 + text.length * 2);
      const le = eid === 'utf-16le';
      out[0] = le ? 0xff : 0xfe;
      out[1] = le ? 0xfe : 0xff;
      for (let i = 0; i < text.length; i++) {
        const c = text.charCodeAt(i);
        out[2 + i * 2 + (le ? 0 : 1)] = c & 0xff;
        out[2 + i * 2 + (le ? 1 : 0)] = c >> 8;
      }
      return { bytes: out, unmappable: 0 };
    }
    const map = encMap(eid);
    const out = [];
    let unmappable = 0;
    let jisMode = false; // ISO-2022-JP: сейчас включён набор JIS X 0208
    for (let ch of text) {
      const u = ch.codePointAt(0);
      if (u < 0x80) {
        if (jisMode) {
          out.push(0x1b, 0x28, 0x42);
          jisMode = false;
        }
        out.push(u);
        continue;
      }
      // В ISO-2022-JP нет полуширинной каны — как и браузеры, пишем полноширинную
      if (eid === 'iso-2022-jp' && u >= 0xff61 && u <= 0xff9f) ch = ch.normalize('NFKC');
      let seq = map.get(ch);
      if (!seq && ch.length > 1 && eid === 'iso-2022-jp') seq = map.get(ch[0]);
      if (!seq) {
        unmappable++;
        if (jisMode) {
          out.push(0x1b, 0x28, 0x42);
          jisMode = false;
        }
        out.push(0x3f);
        continue;
      }
      if (eid === 'iso-2022-jp' && !jisMode) {
        out.push(0x1b, 0x24, 0x42);
        jisMode = true;
      }
      for (const b of seq) out.push(b);
    }
    if (jisMode) out.push(0x1b, 0x28, 0x42);
    return { bytes: new Uint8Array(out), unmappable };
  }

  // Подпись для списка: «Windows-1250 — polski, čeština, …» (названия языков на языке интерфейса)
  function label(id, uiLang) {
    const enc = BY_ID[id];
    if (!enc) return id;
    if (!enc.langs) return enc.name;
    let names = enc.langs.slice(0, 4);
    try {
      const dn = new Intl.DisplayNames([uiLang || 'en'], { type: 'language' });
      names = names.map(l => dn.of(l));
    } catch (e) {}
    return enc.name + ' — ' + names.join(', ') + (enc.langs.length > 4 ? ', …' : '');
  }
  function groupLabel(group, uiLang) {
    if (group === 'Unicode') return 'Unicode';
    try {
      return new Intl.DisplayNames([uiLang || 'en'], { type: 'script' }).of(group);
    } catch (e) {
      return group;
    }
  }
  // Список для <select>: [{ group, label, items: [{ id, label }] }]
  function options(uiLang) {
    const groups = [];
    for (const enc of ENCODINGS) {
      if (!isSupported(enc.id)) continue;
      let g = groups.find(x => x.group === enc.group);
      if (!g) groups.push((g = { group: enc.group, label: groupLabel(enc.group, uiLang), items: [] }));
      g.items.push({ id: enc.id, label: label(enc.id, uiLang) });
    }
    return groups;
  }

  window.ZmdEncoding = {
    ENCODINGS,
    detect,
    decode,
    encode,
    options,
    label,
    name: id => (BY_ID[id] ? BY_ID[id].name : id),
    isKnown: id => !!BY_ID[id]
  };
})();
