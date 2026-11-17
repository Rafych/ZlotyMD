const RD_EMOJI_SRC =
  'smile=😄 smiley=😃 grinning=😀 grin=😁 laughing=😆 satisfied=😆 joy=😂 rofl=🤣 smiley_cat=😺 wink=😉 blush=😊 innocent=😇 heart_eyes=😍 kissing_heart=😘 kissing=😗 yum=😋 stuck_out_tongue=😛 stuck_out_tongue_winking_eye=😜 sunglasses=😎 smirk=😏 neutral_face=😐 expressionless=😑 unamused=😒 sweat_smile=😅 sweat=😓 disappointed=😞 worried=😟 angry=😠 rage=😡 cry=😢 sob=😭 fearful=😨 scream=😱 confounded=😖 persevere=😣 tired_face=😫 weary=😩 triumph=😤 sleepy=😪 sleeping=😴 mask=😷 thinking=🤔 hugs=🤗 zipper_mouth_face=🤐 relaxed=☺️ slightly_smiling_face=🙂 upside_down_face=🙃 roll_eyes=🙄 flushed=😳 dizzy_face=😵 open_mouth=😮 hushed=😯 astonished=😲 cold_sweat=😰 grimacing=😬 pensive=😔 confused=😕 slightly_frowning_face=🙁 frowning=😦 anguished=😧 skull=💀 ghost=👻 alien=👽 robot=🤖 poop=💩 hankey=💩 shit=💩 clown_face=🤡 imp=👿 smiling_imp=😈 ' +
  '+1=👍 thumbsup=👍 -1=👎 thumbsdown=👎 ok_hand=👌 punch=👊 fist=✊ v=✌️ wave=👋 hand=✋ raised_hand=✋ open_hands=👐 point_up=☝️ point_down=👇 point_left=👈 point_right=👉 raised_hands=🙌 pray=🙏 clap=👏 muscle=💪 metal=🤘 fu=🖕 writing_hand=✍️ nail_care=💅 eyes=👀 eye=👁️ ear=👂 nose=👃 tongue=👅 lips=👄 brain=🧠 bone=🦴 tooth=🦷 ' +
  'bust_in_silhouette=👤 busts_in_silhouette=👥 baby=👶 boy=👦 girl=👧 man=👨 woman=👩 older_man=👴 older_woman=👵 cop=👮 detective=🕵️ guardsman=💂 construction_worker=👷 princess=👸 santa=🎅 angel=👼 ninja=🥷 superhero=🦸 mage=🧙 fairy=🧚 vampire=🧛 zombie=🧟 ' +
  'heart=❤️ orange_heart=🧡 yellow_heart=💛 green_heart=💚 blue_heart=💙 purple_heart=💜 black_heart=🖤 white_heart=🤍 brown_heart=🤎 broken_heart=💔 heartpulse=💗 heartbeat=💓 two_hearts=💕 sparkling_heart=💖 revolving_hearts=💞 cupid=💘 gift_heart=💝 heavy_heart_exclamation=❣️ love_letter=💌 kiss=💋 ring=💍 gem=💎 100=💯 boom=💥 collision=💥 anger=💢 zzz=💤 dash=💨 sweat_drops=💦 dizzy=💫 speech_balloon=💬 thought_balloon=💭 ' +
  'sparkles=✨ star=⭐ star2=🌟 stars=🌠 fire=🔥 zap=⚡ sunny=☀️ cloud=☁️ umbrella=☔ snowflake=❄️ snowman=⛄ rainbow=🌈 ocean=🌊 droplet=💧 earth_americas=🌎 earth_africa=🌍 earth_asia=🌏 globe_with_meridians=🌐 moon=🌙 full_moon=🌕 new_moon=🌑 crescent_moon=🌙 comet=☄️ milky_way=🌌 ' +
  'dog=🐶 cat=🐱 mouse=🐭 hamster=🐹 rabbit=🐰 fox_face=🦊 bear=🐻 panda_face=🐼 koala=🐨 tiger=🐯 lion=🦁 cow=🐮 pig=🐷 frog=🐸 monkey_face=🐵 see_no_evil=🙈 hear_no_evil=🙉 speak_no_evil=🙊 monkey=🐒 chicken=🐔 penguin=🐧 bird=🐦 baby_chick=🐤 eagle=🦅 owl=🦉 bat=🦇 wolf=🐺 horse=🐴 unicorn=🦄 bee=🐝 honeybee=🐝 bug=🐛 butterfly=🦋 snail=🐌 beetle=🐞 ant=🐜 spider=🕷️ scorpion=🦂 turtle=🐢 snake=🐍 lizard=🦎 octopus=🐙 crab=🦀 shrimp=🦐 tropical_fish=🐠 fish=🐟 dolphin=🐬 whale=🐳 whale2=🐋 shark=🦈 crocodile=🐊 elephant=🐘 camel=🐫 giraffe=🦒 kangaroo=🦘 dragon=🐉 dragon_face=🐲 t-rex=🦖 sauropod=🦕 octocat=🐙 ' +
  'seedling=🌱 evergreen_tree=🌲 deciduous_tree=🌳 palm_tree=🌴 cactus=🌵 tulip=🌷 cherry_blossom=🌸 rose=🌹 hibiscus=🌺 sunflower=🌻 blossom=🌼 bouquet=💐 mushroom=🍄 four_leaf_clover=🍀 maple_leaf=🍁 fallen_leaf=🍂 leaves=🍃 herb=🌿 ' +
  'apple=🍎 green_apple=🍏 pear=🍐 tangerine=🍊 orange=🍊 lemon=🍋 banana=🍌 watermelon=🍉 grapes=🍇 strawberry=🍓 melon=🍈 cherries=🍒 peach=🍑 pineapple=🍍 kiwi_fruit=🥝 avocado=🥑 tomato=🍅 eggplant=🍆 carrot=🥕 corn=🌽 hot_pepper=🌶️ potato=🥔 bread=🍞 croissant=🥐 cheese=🧀 egg=🥚 bacon=🥓 hamburger=🍔 fries=🍟 pizza=🍕 hotdog=🌭 taco=🌮 burrito=🌯 spaghetti=🍝 ramen=🍜 sushi=🍣 rice=🍚 curry=🍛 bento=🍱 dumpling=🥟 fried_shrimp=🍤 ice_cream=🍨 icecream=🍦 doughnut=🍩 cookie=🍪 birthday=🎂 cake=🍰 chocolate_bar=🍫 candy=🍬 lollipop=🍭 popcorn=🍿 coffee=☕ tea=🍵 beer=🍺 beers=🍻 wine_glass=🍷 cocktail=🍸 tropical_drink=🍹 champagne=🍾 milk_glass=🥛 sake=🍶 ' +
  'soccer=⚽ basketball=🏀 football=🏈 baseball=⚾ tennis=🎾 volleyball=🏐 rugby_football=🏉 8ball=🎱 golf=⛳ trophy=🏆 medal_sports=🏅 dart=🎯 video_game=🎮 joystick=🕹️ game_die=🎲 slot_machine=🎰 bowling=🎳 art=🎨 clapper=🎬 microphone=🎤 headphones=🎧 musical_note=🎵 notes=🎶 guitar=🎸 violin=🎻 trumpet=🎺 drum=🥁 tada=🎉 confetti_ball=🎊 balloon=🎈 gift=🎁 ribbon=🎀 christmas_tree=🎄 ' +
  'car=🚗 red_car=🚗 taxi=🚕 bus=🚌 truck=🚚 ambulance=🚑 fire_engine=🚒 police_car=🚓 bike=🚲 motorcycle=🏍️ train=🚋 bullettrain_front=🚅 airplane=✈️ rocket=🚀 helicopter=🚁 boat=⛵ ship=🚢 anchor=⚓ construction=🚧 rotating_light=🚨 traffic_light=🚥 fuelpump=⛽ ' +
  'house=🏠 office=🏢 hospital=🏥 bank=🏦 school=🏫 factory=🏭 church=⛪ tent=⛺ statue_of_liberty=🗽 tokyo_tower=🗼 european_castle=🏰 japan=🗾 mount_fuji=🗻 volcano=🌋 ' +
  'watch=⌚ iphone=📱 phone=☎️ telephone=☎️ computer=💻 desktop_computer=🖥️ keyboard=⌨️ printer=🖨️ cd=💿 floppy_disk=💾 camera=📷 video_camera=📹 tv=📺 radio=📻 battery=🔋 electric_plug=🔌 bulb=💡 flashlight=🔦 candle=🕯️ money_with_wings=💸 dollar=💵 moneybag=💰 credit_card=💳 chart=💹 chart_with_upwards_trend=📈 chart_with_downwards_trend=📉 bar_chart=📊 email=📧 envelope=✉️ mailbox=📫 package=📦 inbox_tray=📥 outbox_tray=📤 memo=📝 pencil=📝 pencil2=✏️ pen=🖊️ paperclip=📎 paperclips=🖇️ scissors=✂️ lock=🔒 unlock=🔓 key=🔑 old_key=🗝️ hammer=🔨 wrench=🔧 nut_and_bolt=🔩 gear=⚙️ hammer_and_wrench=🛠️ tools=🛠️ shield=🛡️ bomb=💣 gun=🔫 microscope=🔬 telescope=🔭 satellite=📡 pill=💊 syringe=💉 dna=🧬 test_tube=🧪 magnet=🧲 ' +
  'book=📖 books=📚 notebook=📓 ledger=📒 page_facing_up=📄 page_with_curl=📃 bookmark=🔖 label=🏷️ newspaper=📰 clipboard=📋 calendar=📆 date=📅 file_folder=📁 open_file_folder=📂 card_index=📇 pushpin=📌 round_pushpin=📍 triangular_ruler=📐 straight_ruler=📏 link=🔗 mag=🔍 mag_right=🔎 bell=🔔 no_bell=🔕 loudspeaker=📢 mega=📣 hourglass=⌛ hourglass_flowing_sand=⏳ alarm_clock=⏰ stopwatch=⏱️ timer_clock=⏲️ clock=🕐 ' +
  'white_check_mark=✅ heavy_check_mark=✔️ ballot_box_with_check=☑️ x=❌ negative_squared_cross_mark=❎ heavy_multiplication_x=✖️ heavy_plus_sign=➕ heavy_minus_sign=➖ heavy_division_sign=➗ question=❓ grey_question=❔ exclamation=❗ heavy_exclamation_mark=❗ grey_exclamation=❕ bangbang=‼️ interrobang=⁉️ warning=⚠️ no_entry=⛔ no_entry_sign=🚫 stop_sign=🛑 radioactive=☢️ biohazard=☣️ recycle=♻️ infinity=♾️ copyright=©️ registered=®️ tm=™️ information_source=ℹ️ arrow_up=⬆️ arrow_down=⬇️ arrow_left=⬅️ arrow_right=➡️ arrow_upper_right=↗️ arrow_lower_right=↘️ arrow_forward=▶️ arrow_backward=◀️ arrows_counterclockwise=🔄 arrows_clockwise=🔃 repeat=🔁 fast_forward=⏩ rewind=⏪ back=🔙 end=🔚 on=🔛 soon=🔜 top=🔝 new=🆕 free=🆓 cool=🆒 ok=🆗 up=🆙 sos=🆘 vs=🆚 abc=🔤 hash=#️⃣ ' +
  'red_circle=🔴 orange_circle=🟠 yellow_circle=🟡 green_circle=🟢 large_blue_circle=🔵 purple_circle=🟣 black_circle=⚫ white_circle=⚪ red_square=🟥 orange_square=🟧 yellow_square=🟨 green_square=🟩 blue_square=🟦 purple_square=🟪 black_large_square=⬛ white_large_square=⬜ large_orange_diamond=🔶 large_blue_diamond=🔷 small_red_triangle=🔺 small_red_triangle_down=🔻 diamond_shape_with_a_dot_inside=💠 ' +
  'checkered_flag=🏁 triangular_flag_on_post=🚩 crossed_flags=🎌 black_flag=🏴 white_flag=🏳️ rainbow_flag=🏳️‍🌈 pirate_flag=🏴‍☠️ ' +
  'one=1️⃣ two=2️⃣ three=3️⃣ four=4️⃣ five=5️⃣ six=6️⃣ seven=7️⃣ eight=8️⃣ nine=9️⃣ zero=0️⃣ keycap_ten=🔟 ' +
  'crown=👑 tophat=🎩 mortar_board=🎓 eyeglasses=👓 dark_sunglasses=🕶️ shirt=👕 jeans=👖 dress=👗 shoe=👞 high_heel=👠 handbag=👜 briefcase=💼 school_satchel=🎒 lipstick=💄 umbrella_with_rain_drops=☔ ' +
  'jp=🇯🇵 us=🇺🇸 gb=🇬🇧 uk=🇬🇧 fr=🇫🇷 de=🇩🇪 it=🇮🇹 es=🇪🇸 ru=🇷🇺 cn=🇨🇳 kr=🇰🇷 pl=🇵🇱 gr=🇬🇷 ca=🇨🇦 au=🇦🇺 br=🇧🇷 in=🇮🇳 ' +
  'shipit=🐿️ bowtie=🤵 neckbeard=🧔 trollface=😈 feelsgood=🙂 finnadie=😵 goberserk=😡 godmode=😎 hurtrealbad=😖 rage1=😡 rage2=😡 rage3=😡 rage4=😡 suspect=😶 octocat_=🐙';

let RD_EMOJI = null;

function _rdEmojiMap() {
  if (RD_EMOJI) return RD_EMOJI;
  RD_EMOJI = Object.create(null);
  RD_EMOJI_SRC.split(' ').forEach(pair => {
    const i = pair.indexOf('=');
    if (i > 0) RD_EMOJI[pair.slice(0, i)] = pair.slice(i + 1);
  });
  return RD_EMOJI;
}

function _rdEmoji(v) {
  if (v.indexOf(':') < 0) return v;
  const map = _rdEmojiMap();
  return v.replace(/(^|[^\w:]):([\w+-]+):(?![\w])/g, (m, pre, name) => (map[name] ? pre + map[name] : m));
}

function _rdEsc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

let _rdFm = null;
let _rdFn = null;
let _rdEmbedStore = [];
const _rdEmbedLive = new Map();
let _rdEmbedTimer = null;
const RD_EMBED_RE_SRC = 'geojson|topojson|stl';

function _rdFrontMatter(v) {
  _rdFm = null;
  const m = /^---[ \t]*\n([\s\S]*?)\n---[ \t]*(?:\n|$)/.exec(v);
  if (!m) return v;
  const rows = [];
  m[1].split('\n').forEach(line => {
    const kv = /^([A-Za-z0-9_][\w .-]*):[ \t]*(.*)$/.exec(line);
    if (kv) {
      rows.push([kv[1].trim(), kv[2].trim()]);
    } else if (rows.length && line.trim()) {
      const item = line.trim().replace(/^-[ \t]*/, '');
      const last = rows[rows.length - 1];
      last[1] = last[1] ? last[1] + ', ' + item : item;
    }
  });
  if (!rows.length) return v;
  _rdFm = rows;
  return '\x02FMT\x03\n\n' + v.slice(m[0].length);
}

function _rdFrontMatterHtml() {
  if (!_rdFm) return '';
  const clean = s => s.replace(/^(["'])([\s\S]*)\1$/, '$2').replace(/^\[([\s\S]*)\]$/, '$1');
  const head = _rdFm.map(r => `<th>${_rdEsc(r[0])}</th>`).join('');
  const body = _rdFm.map(r => `<td>${_rdEsc(clean(r[1]))}</td>`).join('');
  return `<table class="rd-frontmatter"><thead><tr>${head}</tr></thead><tbody><tr>${body}</tr></tbody></table>`;
}

function _rdFootnotes(v) {
  _rdFn = null;
  const defs = new Map();
  v = v.replace(/^ {0,3}\[\^([^\]\s]+)\]:[ \t]*(.*(?:\n(?: {4}|\t).*)*)/gm, (_, id, body) => {
    defs.set(id, body.replace(/\n(?: {4}|\t)/g, '\n').trim());
    return '';
  });
  if (!defs.size) return v;
  const order = [];
  const counts = Object.create(null);
  v = v.replace(/\[\^([^\]\s]+)\]/g, (m, id) => {
    if (!defs.has(id)) return m;
    let n = order.indexOf(id);
    if (n < 0) {
      order.push(id);
      n = order.length - 1;
    }
    counts[id] = (counts[id] || 0) + 1;
    return `\x02FNR${n}_${counts[id]}\x03`;
  });
  if (!order.length) return v;
  _rdFn = { order, defs, counts };
  return v;
}

function _rdFootnoteRefHtml(n, k) {
  if (!_rdFn) return '';
  const id = _rdFn.order[+n];
  const sfx = +k > 1 ? '-' + k : '';
  return `<sup class="rd-fnref"><a id="zmd-fnref-${_rdEsc(id)}${sfx}" href="#zmd-fn-${_rdEsc(id)}">${+n + 1}</a></sup>`;
}

function _rdFootnoteSection() {
  if (!_rdFn) return '';
  const items = _rdFn.order
    .map(id => {
      let body = _restoreCode(_rdFn.defs.get(id));
      if (!appSettings.htmlRendering) body = escapeHtmlTags(body);
      const html = _restoreLatex(marked.parseInline(_protectLatex(body)));
      const total = _rdFn.counts[id] || 1;
      let backs = '';
      for (let k = 1; k <= total; k++) {
        backs += ` <a class="rd-fnback" href="#zmd-fnref-${_rdEsc(id)}${k > 1 ? '-' + k : ''}">↩${k > 1 ? '<sup>' + k + '</sup>' : ''}</a>`;
      }
      return `<li id="zmd-fn-${_rdEsc(id)}">${html}${backs}</li>`;
    })
    .join('');
  return `<section class="footnotes"><h2 class="sr-only">Footnotes</h2><ol>${items}</ol></section>`;
}

function _rdEmbeds(v) {
  _rdEmbedStore = [];
  return v.replace(_diagramBlockRe(RD_EMBED_RE_SRC), (_, fence, lang, body) => {
    _rdEmbedStore.push({ kind: lang, src: _restoreCode(body).trim() });
    return `\n\n\x02EMB${_rdEmbedStore.length - 1}\x03\n\n`;
  });
}

function _rdRestore(html) {
  return html
    .replace(/(?:<p>)?\x02FMT\x03(?:<\/p>)?/g, () => _rdFrontMatterHtml())
    .replace(/\x02FNR(\d+)_(\d+)\x03/g, (_, n, k) => _rdFootnoteRefHtml(n, k))
    .replace(/(?:<p>)?\x02EMB(\d+)\x03(?:<\/p>)?/g, (_, i) => {
      const item = _rdEmbedStore[+i];
      if (!item) return '';
      return `<div class="rd-embed rd-embed-${item.kind}" data-kind="${item.kind}" data-idx="${i}"></div>`;
    });
}

const RD_ALERTS = {
  note: ['Note', '<circle cx="8" cy="8" r="6.5"/><path d="M8 7.2v4M8 4.8v.2"/>'],
  tip: ['Tip', '<path d="M6 13h4M6.5 11h3M8 2a4 4 0 0 0-2 7.5V11h4V9.5A4 4 0 0 0 8 2z"/>'],
  important: ['Important', '<path d="M2 2h12v9H9l-3 3v-3H2z"/><path d="M8 5v3M8 9.2v.1"/>'],
  warning: ['Warning', '<path d="M8 2L1.5 13.5h13z"/><path d="M8 6.5v3.2M8 11.4v.1"/>'],
  caution: ['Caution', '<path d="M5 1.5h6L14.5 5v6L11 14.5H5L1.5 11V5z"/><path d="M8 5v4M8 10.8v.1"/>']
};

function _rdAlerts(root) {
  root.querySelectorAll('blockquote').forEach(bq => {
    const p = bq.firstElementChild;
    if (!p || p.tagName !== 'P') return;
    const m = /^\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\][ \t]*(?:<br\s*\/?>|\n)?\s*/i.exec(p.innerHTML);
    if (!m) return;
    const type = m[1].toLowerCase();
    const [label, icon] = RD_ALERTS[type];
    p.innerHTML = p.innerHTML.slice(m[0].length);
    if (!p.innerHTML.trim()) p.remove();
    const title = document.createElement('p');
    title.className = 'markdown-alert-title';
    title.innerHTML = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">${icon}</svg>${label}`;
    bq.insertBefore(title, bq.firstChild);
    bq.classList.add('markdown-alert', 'markdown-alert-' + type);
  });
}

function _rdSlug(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{M}\p{N}\p{Pc} -]/gu, '')
    .replace(/ /g, '-');
}

function _rdAnchors(root) {
  const seen = Object.create(null);
  root.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach(h => {
    if (h.classList.contains('sr-only')) return;
    const base = _rdSlug(h.textContent);
    const n = seen[base] || 0;
    seen[base] = n + 1;
    const slug = n ? base + '-' + n : base;
    h.id = 'zmd-' + slug;
    const a = document.createElement('a');
    a.className = 'rd-anchor';
    a.setAttribute('href', '#zmd-' + slug);
    a.setAttribute('aria-label', 'Permalink');
    a.innerHTML =
      '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 9.5a3 3 0 0 0 4.2 0l2.3-2.3a3 3 0 0 0-4.2-4.2l-.7.7"/><path d="M9.5 6.5a3 3 0 0 0-4.2 0L3 8.8A3 3 0 0 0 7.2 13l.7-.7"/></svg>';
    h.insertBefore(a, h.firstChild);
  });
}

function _rdColorChips(root) {
  root.querySelectorAll('code').forEach(c => {
    if (c.closest('pre')) return;
    const t = c.textContent.trim();
    if (!/^(?:#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})|rgba?\([^)]*\)|hsla?\([^)]*\))$/i.test(t)) return;
    if (!CSS.supports('color', t)) return;
    const chip = document.createElement('span');
    chip.className = 'rd-color-chip';
    chip.style.background = t;
    c.insertBefore(chip, c.firstChild);
  });
}

function _rdTaskBoxes(root) {
  root.querySelectorAll('input[type=checkbox]').forEach(cb => cb.removeAttribute('disabled'));
}

function _rdPost(root) {
  _rdAlerts(root);
  _rdAnchors(root);
  _rdColorChips(root);
  _rdTaskBoxes(root);
}

function _rdToggleTask(index) {
  const text = ed.value;
  const code = _findCodeRanges(text);
  const re = /^([ \t]*(?:>[ \t]*)*(?:[-*+]|\d{1,9}[.)])[ \t]+\[)([ xX])(\](?:[ \t]|$))/gm;
  let m;
  let n = -1;
  while ((m = re.exec(text))) {
    if (code.some(([a, b]) => m.index >= a && m.index < b)) continue;
    n++;
    if (n === index) {
      const pos = m.index + m[1].length;
      const mark = m[2] === ' ' ? 'x' : ' ';
      ed.value = text.slice(0, pos) + mark + text.slice(pos + 1);
      ed.dispatchEvent(new Event('input', { bubbles: true }));
      return;
    }
  }
}

function _rdScrollTo(hash) {
  let id;
  try {
    id = decodeURIComponent(hash.replace(/^#/, ''));
  } catch (e) {
    id = hash.replace(/^#/, '');
  }
  if (!id) return false;
  const find = key => Array.from(mo.querySelectorAll('[id]')).find(el => el.id === key);
  const target = find(id) || find('zmd-' + id) || find('zmd-' + _rdSlug(id));
  if (!target) return false;
  const top = target.getBoundingClientRect().top - pv.getBoundingClientRect().top + pv.scrollTop - 16;
  pv.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  return true;
}

function _rdBindPreview() {
  mo.addEventListener('click', e => {
  const cb = e.target.closest && e.target.closest('input[type=checkbox]');
  if (cb) {
    if (_roGuard()) {
      e.preventDefault();
      return;
    }
    const idx = Array.from(mo.querySelectorAll('input[type=checkbox]')).indexOf(cb);
    if (idx >= 0) _rdToggleTask(idx);
    return;
  }
  const a = e.target.closest && e.target.closest('a[href^="#"]');
  if (!a || a.closest('.rd-embed')) return;
  e.preventDefault();
  _rdScrollTo(a.getAttribute('href'));
  });
}

const _rdScripts = new Map();

function _rdLoadScript(url) {
  if (!_rdScripts.has(url)) {
    _rdScripts.set(
      url,
      new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = url;
        s.onload = resolve;
        s.onerror = () => {
          _rdScripts.delete(url);
          reject(new Error('Failed to load ' + url));
        };
        document.head.appendChild(s);
      })
    );
  }
  return _rdScripts.get(url);
}

const RD_LEAFLET_BASE = 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist';

function _rdLeaflet() {
  if (!document.getElementById('rd-leaflet-css')) {
    const l = document.createElement('link');
    l.id = 'rd-leaflet-css';
    l.rel = 'stylesheet';
    l.href = RD_LEAFLET_BASE + '/leaflet.css';
    document.head.appendChild(l);
  }
  return _rdLoadScript(RD_LEAFLET_BASE + '/leaflet.js').then(() => window.L);
}

function _rdSimpleStyle(feature) {
  const p = (feature && feature.properties) || {};
  const style = {};
  if (p.stroke) style.color = p.stroke;
  if (p['stroke-width'] != null) style.weight = +p['stroke-width'];
  if (p['stroke-opacity'] != null) style.opacity = +p['stroke-opacity'];
  if (p.fill) style.fillColor = p.fill;
  if (p['fill-opacity'] != null) style.fillOpacity = +p['fill-opacity'];
  return style;
}

async function _rdBuildMap(el, kind, src) {
  const L = await _rdLeaflet();
  let data = JSON.parse(src);
  if (kind === 'topojson') {
    await _rdLoadScript('https://cdn.jsdelivr.net/npm/topojson-client@3.1.0/dist/topojson-client.min.js');
    const feats = [];
    Object.keys(data.objects || {}).forEach(name => {
      const f = window.topojson.feature(data, data.objects[name]);
      if (f.features) feats.push(...f.features);
      else feats.push(f);
    });
    data = { type: 'FeatureCollection', features: feats };
  }
  const map = L.map(el, { scrollWheelZoom: false });
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);
  const layer = L.geoJSON(data, {
    style: _rdSimpleStyle,
    pointToLayer: (f, latlng) => {
      const color = f.properties && f.properties['marker-color'];
      return color
        ? L.circleMarker(latlng, { radius: 8, color, fillColor: color, fillOpacity: 0.8 })
        : L.marker(latlng);
    },
    onEachFeature: (f, lyr) => {
      const p = f.properties || {};
      if (p.title || p.description) {
        lyr.bindPopup(
          (p.title ? `<strong>${_rdEsc(p.title)}</strong>` : '') + (p.description ? `<div>${_rdEsc(p.description)}</div>` : '')
        );
      }
    }
  }).addTo(map);
  const bounds = layer.getBounds();
  if (bounds.isValid()) map.fitBounds(bounds, { maxZoom: 16, padding: [16, 16] });
  else map.setView([0, 0], 2);
  el._rdMap = map;
}

function _rdParseStl(text) {
  const out = [];
  const re = /vertex\s+([-+\d.eE]+)\s+([-+\d.eE]+)\s+([-+\d.eE]+)/g;
  let m;
  while ((m = re.exec(text))) out.push(+m[1], +m[2], +m[3]);
  if (out.length < 9 || out.length % 9) throw new Error('Invalid ASCII STL');
  return new Float32Array(out);
}

async function _rdBuildStl(el, src) {
  await _rdLoadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js');
  const THREE = window.THREE;
  const positions = _rdParseStl(src);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.computeVertexNormals();
  geo.center();
  geo.computeBoundingSphere();
  const r = geo.boundingSphere.radius || 1;
  const w = el.clientWidth || 600;
  const h = 400;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(window.devicePixelRatio || 1);
  renderer.setSize(w, h);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, w / h, r / 100, r * 100);
  camera.position.set(0, 0, r * 3);
  const mesh = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({ color: 0x4285f4, metalness: 0.1, roughness: 0.55, side: THREE.DoubleSide })
  );
  mesh.rotation.x = -Math.PI / 2;
  scene.add(mesh);
  scene.add(new THREE.AmbientLight(0xffffff, 0.65));
  const k1 = new THREE.DirectionalLight(0xffffff, 0.8);
  k1.position.set(1, 1, 1);
  scene.add(k1);
  const k2 = new THREE.DirectionalLight(0xffffff, 0.35);
  k2.position.set(-1, -1, -1);
  scene.add(k2);
  const draw = () => renderer.render(scene, camera);
  let drag = null;
  const cv = renderer.domElement;
  cv.style.touchAction = 'none';
  cv.addEventListener('pointerdown', e => {
    drag = { x: e.clientX, y: e.clientY };
    cv.setPointerCapture(e.pointerId);
  });
  cv.addEventListener('pointermove', e => {
    if (!drag) return;
    mesh.rotation.z += (e.clientX - drag.x) * 0.01;
    mesh.rotation.x += (e.clientY - drag.y) * 0.01;
    drag = { x: e.clientX, y: e.clientY };
    draw();
  });
  cv.addEventListener('pointerup', () => {
    drag = null;
  });
  cv.addEventListener(
    'wheel',
    e => {
      e.preventDefault();
      camera.position.z = Math.min(r * 20, Math.max(r * 1.2, camera.position.z * (e.deltaY > 0 ? 1.1 : 0.9)));
      draw();
    },
    { passive: false }
  );
  el.appendChild(cv);
  draw();
}

function _rdEmbedError(el, kind, err) {
  el.innerHTML = '';
  const d = document.createElement('div');
  d.className = 'mermaid-error';
  d.textContent = `⚠ ${kind}: ${err && err.message ? err.message : err}`;
  el.appendChild(d);
}

function _rdMountEmbeds() {
  const nodes = Array.from(mo.querySelectorAll('.rd-embed'));
  const present = new Set();
  let pending = false;
  nodes.forEach(node => {
    const item = _rdEmbedStore[+node.dataset.idx];
    if (!item) return;
    const key = item.kind + '\u0000' + item.src;
    node.dataset.rdKey = key;
    present.add(key);
    const live = _rdEmbedLive.get(key);
    if (live && !live.contains(node)) {
      node.appendChild(live);
      if (live._rdMap) live._rdMap.invalidateSize();
    } else if (!live) {
      pending = true;
    }
  });
  for (const key of Array.from(_rdEmbedLive.keys())) if (!present.has(key)) _rdEmbedLive.delete(key);
  clearTimeout(_rdEmbedTimer);
  if (pending) _rdEmbedTimer = setTimeout(_rdBuildPending, 500);
}

function _rdBuildPending() {
  mo.querySelectorAll('.rd-embed').forEach(node => {
    const key = node.dataset.rdKey;
    const item = _rdEmbedStore[+node.dataset.idx];
    if (!key || !item || _rdEmbedLive.has(key) || node.firstChild) return;
    const box = document.createElement('div');
    box.className = 'rd-embed-box rd-embed-box-' + item.kind;
    node.appendChild(box);
    _rdEmbedLive.set(key, box);
    const job = item.kind === 'stl' ? _rdBuildStl(box, item.src) : _rdBuildMap(box, item.kind, item.src);
    job.catch(err => _rdEmbedError(box, item.kind.toUpperCase(), err));
  });
}

function _rdPrepareExport(clone) {
  clone.querySelectorAll('.rd-embed').forEach(node => {
    const live = _rdEmbedLive.get(node.dataset.rdKey);
    const cv = live && live.querySelector('canvas');
    if (cv) {
      const img = document.createElement('img');
      img.src = cv.toDataURL('image/png');
      img.style.cssText = 'max-width:100%;height:auto;display:block;margin:0 auto';
      node.innerHTML = '';
      node.appendChild(img);
    }
    node.querySelectorAll('.leaflet-control-container').forEach(n => n.remove());
  });
  clone.querySelectorAll('input[type=checkbox]').forEach(cb => cb.setAttribute('disabled', ''));
  const ids = new Set(Array.from(clone.querySelectorAll('[id]')).map(n => n.id));
  clone.querySelectorAll('a[href^="#"]').forEach(a => {
    const h = a.getAttribute('href').slice(1);
    if (ids.has(h)) return;
    const slug = 'zmd-' + _rdSlug(decodeURIComponent(h));
    if (ids.has(slug)) a.setAttribute('href', '#' + slug);
  });
  return clone.querySelector('.leaflet-container')
    ? `<link rel="stylesheet" href="${RD_LEAFLET_BASE}/leaflet.css">\n`
    : '';
}

const RD_CSS = `
    .md .rd-anchor{position:absolute;left:-24px;top:50%;transform:translateY(-50%);width:20px;height:20px;display:flex;align-items:center;justify-content:center;color:var(--mut);border:0!important;opacity:0;text-decoration:none}
    .md h1,.md h2,.md h3,.md h4,.md h5,.md h6{position:relative}
    .md h1:hover>.rd-anchor,.md h2:hover>.rd-anchor,.md h3:hover>.rd-anchor,.md h4:hover>.rd-anchor,.md h5:hover>.rd-anchor,.md h6:hover>.rd-anchor,.md .rd-anchor:focus{opacity:1}
    @media print{.md .rd-anchor{display:none}}
    .md .sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap}
    .md .markdown-alert{margin:0 0 var(--s21);padding:var(--s5) var(--s21);border-left:4px solid var(--ga,#0969da);border-radius:var(--r5);background:transparent}
    .md .markdown-alert>:last-child{margin-bottom:var(--s8)}
    .md .markdown-alert-title{display:flex;align-items:center;gap:var(--s8);font-weight:700;color:var(--ga,#0969da);margin:var(--s8) 0 var(--s5)!important;font-size:var(--fz-body,13px)}
    .md .markdown-alert-note{--ga:#0969da}
    .md .markdown-alert-tip{--ga:#1a7f37}
    .md .markdown-alert-important{--ga:#8250df}
    .md .markdown-alert-warning{--ga:#9a6700}
    .md .markdown-alert-caution{--ga:#cf222e}
    .md .footnotes{margin-top:var(--s34);padding-top:var(--s13);border-top:1.5px solid var(--bord);font-size:.9em;color:var(--mut)}
    .md .footnotes ol{padding-left:var(--s21)}
    .md .rd-fnref a,.md .rd-fnback{border:0!important}
    .md .rd-fnback{margin-left:var(--s5)}
    .md .rd-color-chip{display:inline-block;width:.9em;height:.9em;border-radius:50%;margin-right:.4em;vertical-align:-.1em;border:1px solid rgba(0,0,0,.25)}
    .md .rd-frontmatter{margin-bottom:var(--s21)}
    .md .rd-embed{margin-bottom:var(--s21)}
    .md .rd-embed-box-geojson,.md .rd-embed-box-topojson{height:400px;border-radius:var(--r8);overflow:hidden;border:1.5px solid var(--bord);position:relative;z-index:0}
    .md .rd-embed-box-stl{border-radius:var(--r8);overflow:hidden;border:1.5px solid var(--bord);background:var(--surf);line-height:0}
    .md .rd-embed-box-stl canvas{max-width:100%;display:block;cursor:grab}
    .md details{margin-bottom:var(--s13)}
    .md details>summary{cursor:pointer;font-weight:600}
    .md kbd{font-family:var(--mono);font-size:.85em;padding:2px 6px;border:1px solid var(--bord);border-bottom-width:2px;border-radius:var(--r5);background:var(--surf)}
    .md sup,.md sub{font-size:.75em;line-height:0}
    .md mark{background:var(--gyt)}
`;

(function () {
  const st = document.createElement('style');
  st.id = 'rd-css';
  st.textContent = RD_CSS;
  document.head.appendChild(st);
})();
