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

function _rdRestore(html) {
  return html
    .replace(/(?:<p>)?\x02FMT\x03(?:<\/p>)?/g, () => _rdFrontMatterHtml())
    .replace(/\x02FNR(\d+)_(\d+)\x03/g, (_, n, k) => _rdFootnoteRefHtml(n, k));
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
    // Метка убирается правкой узлов, а не через innerHTML: повторный разбор уже очищенной
    // разметки строкой — лазейка для внедрения кода
    const first = p.firstChild;
    if (!first || first.nodeType !== 3) return;
    const m = /^\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\][ \t]*/i.exec(first.data);
    if (!m) return;
    const type = m[1].toLowerCase();
    const [label, icon] = RD_ALERTS[type];
    first.data = first.data.slice(m[0].length);
    if (!first.data.trim()) {
      let next = first.nextSibling;
      first.remove();
      if (next && next.nodeName === 'BR') {
        const br = next;
        next = next.nextSibling;
        br.remove();
      }
      if (next && next.nodeType === 3) next.data = next.data.replace(/^\s+/, '');
    } else {
      first.data = first.data.replace(/^\s+/, '');
    }
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
  if (!a) return;
  e.preventDefault();
  _rdScrollTo(a.getAttribute('href'));
  });
}

function _rdPrepareExport(clone) {
  clone.querySelectorAll('input[type=checkbox]').forEach(cb => cb.setAttribute('disabled', ''));
  const ids = new Set(Array.from(clone.querySelectorAll('[id]')).map(n => n.id));
  clone.querySelectorAll('a[href^="#"]').forEach(a => {
    const h = a.getAttribute('href').slice(1);
    if (ids.has(h)) return;
    const slug = 'zmd-' + _rdSlug(decodeURIComponent(h));
    if (ids.has(slug)) a.setAttribute('href', '#' + slug);
  });
}

const RD_CSS = `
    .md .rd-anchor{position:absolute;left:-21px;top:50%;transform:translateY(-50%);width:21px;height:21px;display:flex;align-items:center;justify-content:center;color:var(--mut);border:0!important;opacity:0;text-decoration:none}
    .md h1,.md h2,.md h3,.md h4,.md h5,.md h6{position:relative}
    .md h1:hover>.rd-anchor,.md h2:hover>.rd-anchor,.md h3:hover>.rd-anchor,.md h4:hover>.rd-anchor,.md h5:hover>.rd-anchor,.md h6:hover>.rd-anchor,.md .rd-anchor:focus{opacity:1}
    @media print{.md .rd-anchor{display:none}}
    .md .sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap}
    .md .markdown-alert{margin:0 0 var(--s21);padding:var(--s5) var(--s21);border-left:5px solid var(--ga,#0969da);border-radius:var(--r5);background:transparent}
    .md .markdown-alert>:last-child{margin-bottom:var(--s8)}
    .md .markdown-alert-title{display:flex;align-items:center;gap:var(--s8);font-weight:700;color:var(--ga,#0969da);margin:var(--s8) 0 var(--s5)!important;font-size:var(--fz-body,13px)}
    .md .markdown-alert-note{--ga:#0969da}
    .md .markdown-alert-tip{--ga:#1a7f37}
    .md .markdown-alert-important{--ga:#8250df}
    .md .markdown-alert-warning{--ga:#9a6700}
    .md .markdown-alert-caution{--ga:#cf222e}
    .md .footnotes{margin-top:var(--s34);padding-top:var(--s13);border-top:1px solid var(--bord);font-size:.9em;color:var(--mut)}
    .md .footnotes ol{padding-left:var(--s21)}
    .md .rd-fnref a,.md .rd-fnback{border:0!important}
    .md .rd-fnback{margin-left:var(--s5)}
    .md .rd-color-chip{display:inline-block;width:.9em;height:.9em;border-radius:50%;margin-right:.4em;vertical-align:-.1em;border:1px solid rgba(0,0,0,.25)}
    .md .rd-frontmatter{margin-bottom:var(--s21)}
    .md details{margin-bottom:var(--s13)}
    .md details>summary{cursor:pointer;font-weight:600}
    .md kbd{font-family:var(--mono);font-size:.85em;padding:2px 5px;border:1px solid var(--bord);border-bottom-width:2px;border-radius:var(--r5);background:var(--surf)}
    .md sup,.md sub{font-size:.75em;line-height:0}
    .md mark{background:var(--gyt)}
`;

(function () {
  const st = document.createElement('style');
  st.id = 'rd-css';
  st.textContent = RD_CSS;
  document.head.appendChild(st);
})();

// ───────── Защита от внедрения кода ─────────
// Всё, что попадает в превью, сначала разбирается в документе без окна (в нём не выполняются
// скрипты, не срабатывают обработчики и не загружаются ресурсы) и очищается: активное содержимое
// вынимается и запоминается в _sbStash. В основной документ приложения попадает только очищенное
// дерево — без повторного разбора строки. Запомненное возвращается на место лишь в документе для
// изолированного iframe (см. _sbRestore), где коду пользователя разрешено всё.
const SB_DROP = new Set([
  'script', 'style', 'link', 'meta', 'base', 'iframe', 'frame', 'frameset', 'object', 'embed', 'applet',
  'noscript', 'noembed', 'noframes', 'xmp', 'plaintext', 'title', 'portal', 'fencedframe'
]);
const SB_URL_ATTRS = new Set([
  'href', 'src', 'xlink:href', 'action', 'formaction', 'data', 'poster', 'background', 'ping', 'srcset',
  'lowsrc', 'dynsrc', 'manifest', 'codebase', 'cite', 'longdesc', 'classid', 'icon'
]);
let _sbStash = [];
let _sbDocCache = null;
function _sbInertDoc() {
  return _sbDocCache || (_sbDocCache = document.implementation.createHTMLDocument(''));
}
function _sbBadUrl(v) {
  return /^(?:javascript|vbscript|livescript):/i.test(String(v).replace(/[\u0000-\u0020\u007f-\u009f\u00ad\u200b-\u200f\u2028\u2029\ufeff]/g, ''));
}
// Атрибуты, которые нельзя оставлять в документе приложения: обработчики событий, адреса со
// скриптами, имена и id (подмена элементов интерфейса), служебные атрибуты самого приложения
function _sbBadAttr(name, value) {
  const n = name.toLowerCase();
  if (n.startsWith('on') || n.startsWith('data-i18n') || n.startsWith('data-zmd-')) return true;
  if (n === 'srcdoc' || n === 'name' || n === 'autofocus' || n === 'is' || n === 'inert') return true;
  if (n === 'action' || n === 'formaction' || n === 'ping') return true;
  if (n === 'id') return !/^(?:zmd-fn|mmd-)/.test(value);
  return SB_URL_ATTRS.has(n) && _sbBadUrl(value);
}
function _sbClean(root) {
  const doc = root.ownerDocument;
  Array.from(root.querySelectorAll('*')).forEach(el => {
    if (!root.contains(el)) return;
    const tag = el.localName.toLowerCase();
    // SVG-анимация, подменяющая адрес ссылки
    const anim = /^(?:set|animate|animatetransform|animatemotion)$/.test(tag) && /href/i.test(el.getAttribute('attributeName') || '');
    if (SB_DROP.has(tag) || anim) {
      const ph = doc.createElement('template');
      ph.setAttribute('data-zmd-sb', String(_sbStash.push({ node: el }) - 1));
      el.replaceWith(ph);
      return;
    }
    let removed = null;
    Array.from(el.attributes).forEach(a => {
      if (!_sbBadAttr(a.name, a.value)) return;
      (removed || (removed = [])).push([a.name, a.value]);
      el.removeAttributeNode(a);
    });
    if (removed) el.setAttribute('data-zmd-sa', String(_sbStash.push({ attrs: removed }) - 1));
  });
  return root;
}
// Разбирает HTML вне документа приложения и возвращает очищенные узлы
function _sbParse(html) {
  const box = _sbInertDoc().createElement('div');
  box.innerHTML = html;
  return Array.from(_sbClean(box).childNodes);
}
// Возвращает вынутое содержимое в копию превью. Копия должна принадлежать документу без окна
// (_sbInertDoc): в документе приложения восстановленные обработчики могли бы сработать.
//   'full' — всё, как написал пользователь: только для изолированного iframe и сохраняемого HTML-файла;
//   'safe' — только стили: для PDF и печати (их iframe того же происхождения, что и приложение);
//            текст стилей не вставляется обратно в разметку, а возвращается списком —
//            он попадает в <head> (см. _sbStyleTag);
//   иначе  — ничего (метки просто убираются).
function _sbRestore(clone, level) {
  const doc = clone.ownerDocument;
  const css = [];
  // Номера флажков задач ставятся до возврата содержимого пользователя: в превью приложения
  // те же флажки в том же порядке. После возврата номера назначаются заново, чтобы атрибут,
  // написанный пользователем, не мог подменить номер
  const tasks = Array.from(clone.querySelectorAll('input[type=checkbox]'));
  clone.querySelectorAll('template[data-zmd-sb]').forEach(ph => {
    const item = _sbStash[+ph.getAttribute('data-zmd-sb')];
    const node = item && item.node;
    if (node && level === 'full') {
      ph.replaceWith(doc.importNode(node, true));
    } else {
      if (node && level === 'safe' && node.localName === 'style' && node.namespaceURI === 'http://www.w3.org/1999/xhtml') {
        const media = (node.getAttribute('media') || '').replace(/[{}<>]/g, '');
        css.push(media ? `@media ${media}{${node.textContent}}` : node.textContent);
      }
      ph.remove();
    }
  });
  clone.querySelectorAll('[data-zmd-sa]').forEach(el => {
    const item = _sbStash[+el.getAttribute('data-zmd-sa')];
    el.removeAttribute('data-zmd-sa');
    if (level !== 'full' || !item || !item.attrs) return;
    item.attrs.forEach(([n, v]) => {
      try {
        el.setAttribute(n, v);
      } catch (e) {
        /* имя атрибута, допустимое только для парсера */
      }
    });
  });
  clone.querySelectorAll('[data-zmd-task]').forEach(el => el.removeAttribute('data-zmd-task'));
  tasks.forEach((cb, i) => cb.setAttribute('data-zmd-task', String(i)));
  return css;
}
// Стили пользователя для документа PDF/печати: «</» экранируется, чтобы текст не мог закрыть тег
function _sbStyleTag(css) {
  return css.length ? `<style>${css.join('\n').replace(/<\//g, '<\\/').replace(/<!--/g, '<\\!--')}</style>\n` : '';
}
// Очищенная разметка должна оставаться чистой и после того, как её запишут строкой и разберут
// заново (документ PDF, сохранённый файл): из-за особенностей разбора HTML (вложенные svg/math
// и т. п.) при повторном разборе текст может превратиться в теги и атрибуты. Поэтому копия
// записывается, разбирается и очищается, пока очередной проход ничего не находит
function _sbStabilize(clone) {
  for (let pass = 0; pass < 6; pass++) {
    const box = _sbInertDoc().createElement('div');
    box.innerHTML = clone.innerHTML;
    const before = _sbStash.length;
    _sbClean(box);
    const dirty = _sbStash.length !== before;
    _sbStash.length = before;
    box.querySelectorAll('template[data-zmd-sb]').forEach(n => n.remove());
    box.querySelectorAll('[data-zmd-sa]').forEach(n => n.removeAttribute('data-zmd-sa'));
    clone.replaceChildren(...Array.from(box.childNodes));
    if (!dirty) return;
  }
  // Разметка так и не стала устойчивой — оставляем только текст
  clone.textContent = clone.textContent;
}
// Одноразовая метка для собственных скриптов документа (см. CSP в buildPreviewHTML)
function _sbNonce() {
  const a = new Uint8Array(16);
  crypto.getRandomValues(a);
  return Array.from(a, b => b.toString(16).padStart(2, '0')).join('');
}

// ───────── Превью в изолированном iframe (режим «HTML-рендеринг») ─────────
// sandbox без allow-same-origin: у документа внутри собственное «пустое» происхождение — ему недоступны
// DOM приложения, localStorage (ключи API), cookie и service worker, и он не может перейти на другую
// страницу в окне приложения. Внутри при этом работает любой код: скрипты, таймеры, обработчики, формы
const SB_SANDBOX = 'allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms allow-modals allow-downloads allow-pointer-lock';
let _sbFrame = null;
let _sbNext = null;
let _sbTimer = 0;
let _sbLastHtml = null;
let _sbEcho = null;
let _mmdBusy = 0;
function _sbActive() {
  return !!appSettings.htmlRendering && !!ed.value.trim();
}
function _sbSchedule(delay) {
  clearTimeout(_sbTimer);
  _sbTimer = setTimeout(_sbRefresh, delay == null ? 200 : delay);
}
function _sbTeardown() {
  if (_sbFrame) _sbFrame.remove();
  if (_sbNext) _sbNext.remove();
  _sbFrame = _sbNext = _sbLastHtml = null;
  pv.parentElement.classList.remove('sb-on');
  pv.removeAttribute('inert');
}
function _sbPushScroll() {
  if (!_sbFrame || !_sbFrame.contentWindow) return;
  const max = pv.scrollHeight - pv.clientHeight;
  _sbFrame.contentWindow.postMessage({ zmd: 'scroll', f: max > 0 ? pv.scrollTop / max : 0 }, '*');
}
function _sbRefresh() {
  clearTimeout(_sbTimer);
  if (!_sbActive()) {
    _sbTeardown();
    return;
  }
  // Диаграммы ещё рисуются — дождёмся, чтобы не перезапускать документ дважды
  if (_mmdBusy > 0) {
    _sbSchedule(150);
    return;
  }
  const pp = pv.parentElement;
  // Обычное превью остаётся «мастерской» рендера (и источником для синхронной прокрутки),
  // но скрыто под iframe и недоступно для щелчков и фокуса
  pp.classList.add('sb-on');
  pv.setAttribute('inert', '');
  const html = buildPreviewHTML(getDocTitle(), { level: 'full', embed: true });
  // Ничего не изменилось — не перезапускаем скрипты пользователя
  if (html === _sbLastHtml && (_sbFrame || _sbNext)) return;
  _sbLastHtml = html;
  const f = document.createElement('iframe');
  f.className = 'pv-frame';
  f.setAttribute('sandbox', SB_SANDBOX);
  f.setAttribute('referrerpolicy', 'no-referrer');
  f.title = 'Preview';
  // Новый документ показывается после загрузки, старый до этого остаётся на экране (без мигания)
  f.style.visibility = 'hidden';
  const show = () => {
    if (_sbNext !== f) return;
    _sbNext = null;
    if (_sbFrame) _sbFrame.remove();
    _sbFrame = f;
    f.style.visibility = '';
    _sbPushScroll();
  };
  f.addEventListener('load', show, { once: true });
  setTimeout(show, 1500);
  if (_sbNext) _sbNext.remove();
  _sbNext = f;
  f.srcdoc = html;
  pp.appendChild(f);
}
function _sbInit() {
  // Любое изменение превью (рендер, готовая диаграмма или рисунок TikZ) обновляет iframe
  new MutationObserver(() => {
    if (_sbActive() || _sbFrame || _sbNext) _sbSchedule();
  }).observe(mo, { childList: true, subtree: true, characterData: true, attributes: true });
  // Прокрутка: скрытое превью остаётся «истинным» положением, iframe повторяет его долю
  pv.addEventListener('scroll', () => {
    if (!_sbFrame) return;
    if (_sbEcho !== null && Math.abs(pv.scrollTop - _sbEcho) < 2) {
      _sbEcho = null;
      return;
    }
    _sbEcho = null;
    _sbPushScroll();
  });
  // Из iframe принимается только одно сообщение — доля прокрутки (число от 0 до 1)
  window.addEventListener('message', e => {
    if (!_sbFrame || e.source !== _sbFrame.contentWindow) return;
    const d = e.data;
    if (d && d.zmd === 'task') {
      _sbTask(d);
      return;
    }
    if (!d || d.zmd !== 'pv-scroll' || typeof d.f !== 'number' || !isFinite(d.f)) return;
    const max = Math.max(0, pv.scrollHeight - pv.clientHeight);
    const v = Math.max(0, Math.min(1, d.f)) * max;
    if (Math.abs(pv.scrollTop - v) < 1) return;
    _sbEcho = v;
    pv.scrollTop = v;
  });
}
// Флажок задачи, отмеченный в iframe. Код документа может отправить такое сообщение и сам,
// поэтому оно может только поставить или снять одну отметку [ ]/[x] — ровно то, что делает
// щелчок в обычном превью, — и только если:
//  - фокус находится в iframe (пользователь щёлкнул по нему; сам документ забрать фокус не может);
//  - флажок с таким номером есть в текущем превью, а его состояние отличается от запрошенного;
//  - этот iframe ещё не менял документ: одна отметка на один экземпляр iframe.
// После правки документ перерисовывается в новом iframe без фокуса, так что следующая
// отметка снова требует щелчка пользователя. В худшем случае код документа может
// переключить одну отметку задачи этого же документа на один щелчок пользователя
let _sbTaskFrame = null;
function _sbTask(d) {
  if (!Number.isInteger(d.i) || d.i < 0 || typeof d.v !== 'boolean') return;
  if (document.activeElement !== _sbFrame || !document.hasFocus()) return;
  if (_sbTaskFrame === _sbFrame) return;
  const cb = mo.querySelectorAll('input[type=checkbox]')[d.i];
  if (!cb || cb.checked === d.v) return;
  _sbTaskFrame = _sbFrame;
  if (_roGuard()) return;
  _rdToggleTask(d.i);
}
// Скрипт внутри изолированного документа: прокрутка по команде редактора и обратно,
// внешние ссылки — в новой вкладке (иначе страница открылась бы внутри превью)
const SB_FRAME_JS = `<script>
(function(){
  var expect=null;
  function se(){return document.scrollingElement||document.documentElement;}
  window.addEventListener('message',function(e){
    if(e.source!==window.parent)return;
    var d=e.data;
    if(!d)return;
    if(d.zmd==='print'){window.print();return;}
    if(d.zmd!=='scroll'||typeof d.f!=='number')return;
    var s=se(),y=d.f*Math.max(0,s.scrollHeight-s.clientHeight);
    expect=y;s.scrollTop=y;
  });
  window.addEventListener('scroll',function(){
    var s=se();
    if(expect!==null&&Math.abs(s.scrollTop-expect)<2){expect=null;return;}
    expect=null;
    var m=s.scrollHeight-s.clientHeight;
    window.parent.postMessage({zmd:'pv-scroll',f:m>0?s.scrollTop/m:0},'*');
  },{passive:true});
  document.addEventListener('click',function(e){
    var a=e.target&&e.target.closest&&e.target.closest('a[href]');
    if(!a)return;
    var h=a.getAttribute('href')||'';
    if(h.charAt(0)==='#'||a.target||/^\\s*javascript:/i.test(h))return;
    a.target='_blank';a.rel='noopener noreferrer';
  },true);
  document.addEventListener('keydown',function(e){
    if((e.ctrlKey||e.metaKey)&&!e.altKey&&String(e.key).toLowerCase()==='p'){e.preventDefault();window.print();}
  });
  document.addEventListener('click',function(e){
    var cb=e.isTrusted&&e.target&&e.target.closest&&e.target.closest('input[type=checkbox][data-zmd-task]');
    if(!cb||cb.disabled)return;
    window.parent.postMessage({zmd:'task',i:+cb.getAttribute('data-zmd-task'),v:cb.checked},'*');
  },true);
})();
<\/script>
`;
const SB_FRAME_CSS = `
    body{max-width:none}
    html::-webkit-scrollbar{width:5px;height:5px}
    html::-webkit-scrollbar-thumb{background:var(--bord);border-radius:99px}
    @supports not selector(::-webkit-scrollbar){html{scrollbar-width:thin;scrollbar-color:var(--bord) transparent}}
`;
// Страница-оболочка для окна предпросмотра: сам документ — в изолированном iframe, поэтому его
// скрипты не получают доступа к приложению (обычная страница blob: имела бы то же происхождение)
function _sbShellHTML(title, inner) {
  const attr = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${_rdEsc(title)}</title>
<style>html,body{margin:0;height:100%;background:#fff}iframe{display:block;border:0;width:100%;height:100%}</style>
</head>
<body>
<iframe sandbox="${SB_SANDBOX}" referrerpolicy="no-referrer" title="Preview" srcdoc="${attr(inner)}"></iframe>
<script>
document.addEventListener('keydown',function(e){
  if((e.ctrlKey||e.metaKey)&&!e.altKey&&String(e.key).toLowerCase()==='p'){
    e.preventDefault();
    document.querySelector('iframe').contentWindow.postMessage({zmd:'print'},'*');
  }
});
<\/script>
</body>
</html>`;
}
