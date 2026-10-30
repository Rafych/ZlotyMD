/* Złoty MD — Service Worker (offline support)
 * Локальные файлы и CDN-ресурсы (marked, KaTeX, Mermaid, шрифты) кэшируются
 * при установке и при использовании, поэтому редактор работает без сети.
 * При изменении файлов приложения увеличьте CACHE_VERSION. */
const CACHE_VERSION = 'zmd-v14';
const CACHE = CACHE_VERSION;

const LOCAL_ASSETS = [
  './',
  'ZlotyMD.html',
  'index.html',
  'css/styles.css',
  'js/app.js',
  'js/pwa.js',
  // Языковые файлы (английский встроен в app.js). Новый язык: добавьте сюда lang/<код>.json и lang/<код>.js
  'lang/ru.json',
  'lang/ru.js',
  'lang/ja.json',
  'lang/ja.js',
  'lang/de.json',
  'lang/de.js',
  'lang/pl.json',
  'lang/pl.js',
  'lang/el.json',
  'lang/el.js',
  'manifest.webmanifest',
  'assets/favicon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png'
];

const CDN_SCRIPTS = [
  'https://cdnjs.cloudflare.com/ajax/libs/marked/9.1.6/marked.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/mermaid/10.6.1/mermaid.min.js'
];

// CSS, из которого дополнительно кэшируются файлы шрифтов (url(...))
const CDN_STYLES = [
  'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css',
  'https://fonts.googleapis.com/css2?family=Google+Sans:ital,opsz,wght@0,17..18,400..700;1,17..18,400..700&display=swap',
  'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap'
];

const CACHEABLE_HOSTS = [
  'cdnjs.cloudflare.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'cdn.jsdelivr.net' // TikZJax (~6 МБ) — кэшируется при первом использовании, не при установке
];

async function putSafe(cache, url, response) {
  if (response && (response.ok || response.type === 'opaque')) {
    await cache.put(url, response);
  }
}

async function precacheStyle(cache, cssUrl) {
  const res = await fetch(cssUrl);
  if (!res.ok) return;
  const text = await res.clone().text();
  await cache.put(cssUrl, res);
  // Файлы шрифтов: берём только woff2 (его выбирают все современные браузеры)
  const urls = new Set();
  const re = /url\(\s*['"]?([^'")]+)['"]?\s*\)/g;
  let m;
  while ((m = re.exec(text))) {
    const abs = new URL(m[1], cssUrl).href;
    if (/\.woff2(\?|#|$)/.test(abs) || abs.startsWith('https://fonts.gstatic.com/')) urls.add(abs);
  }
  await Promise.allSettled([...urls].map(async u => {
    const r = await fetch(u);
    await putSafe(cache, u, r);
  }));
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // Локальные файлы обязательны
    await cache.addAll(LOCAL_ASSETS.map(u => new Request(u, { cache: 'reload' })));
    // Внешние ресурсы — по возможности (ошибка не отменяет установку)
    await Promise.allSettled([
      ...CDN_SCRIPTS.map(async u => putSafe(cache, u, await fetch(u))),
      ...CDN_STYLES.map(u => precacheStyle(cache, u))
    ]);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('zmd-') && k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

async function staleWhileRevalidate(request, cache, matchOpts) {
  const cached = await cache.match(request, matchOpts);
  const network = fetch(request).then(async res => {
    await putSafe(cache, request, res.clone());
    return res;
  }).catch(() => null);
  return cached || (await network) || Response.error();
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  if (!sameOrigin && !CACHEABLE_HOSTS.includes(url.hostname)) return; // API ИИ и пр. — напрямую в сеть

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);

    // Навигация: stale-while-revalidate, при отсутствии в кэше — редактор
    if (req.mode === 'navigate') {
      const hit = await cache.match(req, { ignoreSearch: true });
      const network = fetch(req).then(async res => {
        await putSafe(cache, req, res.clone());
        return res;
      }).catch(() => null);
      return hit || (await network) || (await cache.match('ZlotyMD.html')) || Response.error();
    }

    // Версионированные CDN-ресурсы и шрифты: cache-first
    if (!sameOrigin) {
      const hit = await cache.match(req, { ignoreVary: true });
      if (hit) return hit;
      try {
        const res = await fetch(req);
        await putSafe(cache, req, res.clone());
        return res;
      } catch (e) {
        return Response.error();
      }
    }

    // Языковые файлы: сначала сеть (чтобы новые ключи перевода не отставали от кэша), при офлайне — кэш
    if (url.pathname.includes('/lang/')) {
      try {
        const res = await fetch(req, { cache: 'no-cache' });
        await putSafe(cache, req, res.clone());
        return res;
      } catch (e) {
        return (await cache.match(req, { ignoreSearch: true })) || Response.error();
      }
    }

    // Локальные файлы: stale-while-revalidate
    return staleWhileRevalidate(req, cache, { ignoreSearch: true });
  })());
});
