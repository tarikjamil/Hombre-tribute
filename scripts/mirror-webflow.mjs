#!/usr/bin/env node
/**
 * Downloads the published Webflow Home page + assets and writes localized
 * HTML fragments for the Astro mirror.
 */
import { createWriteStream } from 'node:fs';
import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { dirname, extname, join, basename } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const TMP = join(ROOT, '.tmp');
const PUBLIC = join(ROOT, 'public');
const SITE_ID = '63af52b71504f950bae436f8';

const CDN_HOSTS = [
  'assets.website-files.com',
  'uploads-ssl.webflow.com',
  'd3e54v103j8qbb.cloudfront.net',
];

async function ensureDir(path) {
  await mkdir(path, { recursive: true });
}

async function download(url, dest) {
  await ensureDir(dirname(dest));
  const res = await fetch(url, {
    headers: { 'User-Agent': 'hombre-tribute-mirror/1.0' },
    redirect: 'follow',
  });
  if (!res.ok) {
    throw new Error(`Failed ${res.status} for ${url}`);
  }
  await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
  return dest;
}

function localAssetPathFromUrl(url) {
  const u = new URL(url);
  // Keep path after site id when present: /SITE_ID/filename
  const parts = u.pathname.split('/').filter(Boolean);
  let name = decodeURIComponent(parts[parts.length - 1] || 'file');
  // jquery query string
  if (u.searchParams.has('site')) {
    name = name.replace(/\?.*/, '') || 'jquery.min.js';
  }
  // sanitize
  name = name.replace(/[^\w.\-()%+\u0080-\uFFFF]/g, '_');
  if (u.hostname.includes('cloudfront') && name.includes('jquery')) {
    return { publicPath: `/js/${name}`, diskPath: join(PUBLIC, 'js', name) };
  }
  if (u.pathname.includes('/css/')) {
    return { publicPath: `/css/${name}`, diskPath: join(PUBLIC, 'css', name) };
  }
  if (u.pathname.includes('/js/')) {
    return { publicPath: `/js/${name}`, diskPath: join(PUBLIC, 'js', name) };
  }
  return { publicPath: `/assets/${name}`, diskPath: join(PUBLIC, 'assets', name) };
}

function collectUrls(text) {
  const urls = new Set();
  const re =
    /https?:\/\/(?:assets\.website-files\.com|uploads-ssl\.webflow\.com|d3e54v103j8qbb\.cloudfront\.net)[^"'\\\s<>]*/g;
  let m;
  while ((m = re.exec(text))) {
    let url = m[0];
    // strip trailing sentence punctuation, but keep ) that is part of filenames
    url = url.replace(/[.;]+$/, '');
    urls.add(url);
  }
  return urls;
}

async function main() {
  await ensureDir(TMP);
  await ensureDir(join(PUBLIC, 'css'));
  await ensureDir(join(PUBLIC, 'js'));
  await ensureDir(join(PUBLIC, 'assets'));
  await ensureDir(join(PUBLIC, 'audio'));
  await ensureDir(join(ROOT, 'src', 'layouts'));
  await ensureDir(join(ROOT, 'src', 'pages'));

  const homePath = join(TMP, 'home.html');
  console.log('Fetching Home HTML...');
  await download('https://www.hombre-tribute.com/', homePath);
  let html = await readFile(homePath, 'utf8');

  // Collect URLs from HTML first
  const urlMap = new Map(); // remote -> publicPath
  const toDownload = [];

  function enqueue(url) {
    if (urlMap.has(url)) return;
    // skip typekit / cdnjs / jsdelivr for now — handled separately
    try {
      const host = new URL(url).hostname;
      if (!CDN_HOSTS.some((h) => host.includes(h))) return;
    } catch {
      return;
    }
    const local = localAssetPathFromUrl(url);
    urlMap.set(url, local.publicPath);
    toDownload.push({ url, diskPath: local.diskPath, publicPath: local.publicPath });
  }

  for (const url of collectUrls(html)) enqueue(url);

  // Known Webflow css/js from HTML (ensure)
  const cssMatch = html.match(
    /https:\/\/assets\.website-files\.com\/[^"']+\.css[^"']*/
  );
  const jsMatch = html.match(
    /https:\/\/assets\.website-files\.com\/[^"']+\/js\/[^"']+\.js[^"']*/
  );
  if (cssMatch) enqueue(cssMatch[0]);
  if (jsMatch) enqueue(jsMatch[0]);

  // Download custom overlay from GitHub raw
  const custom = [
    {
      url: 'https://raw.githubusercontent.com/tarikjamil/Hombre-tribute/gh-pages/style.css',
      diskPath: join(PUBLIC, 'css', 'custom-style.css'),
      publicPath: '/css/custom-style.css',
    },
    {
      url: 'https://raw.githubusercontent.com/tarikjamil/Hombre-tribute/gh-pages/script.js',
      diskPath: join(PUBLIC, 'js', 'custom-script.js'),
      publicPath: '/js/custom-script.js',
    },
    {
      url: 'https://raw.githubusercontent.com/tarikjamil/Hombre-tribute/gh-pages/hombre.mp3',
      diskPath: join(PUBLIC, 'audio', 'hombre.mp3'),
      publicPath: '/audio/hombre.mp3',
    },
  ];

  // Vendor CDN libs locally
  const vendors = [
    {
      url: 'https://cdn.jsdelivr.net/gh/studio-freight/lenis@1.0.0/bundled/lenis.js',
      diskPath: join(PUBLIC, 'js', 'lenis.js'),
      publicPath: '/js/lenis.js',
    },
    {
      url: 'https://cdnjs.cloudflare.com/ajax/libs/howler/2.2.3/howler.min.js',
      diskPath: join(PUBLIC, 'js', 'howler.min.js'),
      publicPath: '/js/howler.min.js',
    },
    {
      url: 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.11.3/gsap.min.js',
      diskPath: join(PUBLIC, 'js', 'gsap.min.js'),
      publicPath: '/js/gsap.min.js',
    },
    {
      url: 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.11.1/Flip.min.js',
      diskPath: join(PUBLIC, 'js', 'Flip.min.js'),
      publicPath: '/js/Flip.min.js',
    },
    {
      url: 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.11.3/ScrollTrigger.min.js',
      diskPath: join(PUBLIC, 'js', 'ScrollTrigger.min.js'),
      publicPath: '/js/ScrollTrigger.min.js',
    },
  ];

  console.log(`Downloading ${toDownload.length} Webflow CDN assets...`);
  let i = 0;
  for (const item of toDownload) {
    i++;
    process.stdout.write(`\r  [${i}/${toDownload.length}] ${basename(item.diskPath).slice(0, 60).padEnd(60)}`);
    try {
      await download(item.url, item.diskPath);
    } catch (err) {
      console.warn(`\n  warn: ${err.message}`);
    }
  }
  console.log('\nDownloading vendors + custom files...');
  for (const item of [...vendors, ...custom]) {
    process.stdout.write(`  ${basename(item.diskPath)}...\n`);
    try {
      await download(item.url, item.diskPath);
      // map jsdelivr custom urls used in HTML
      if (item.url.includes('tarikjamil/Hombre-tribute/style.css')) {
        urlMap.set(
          'https://cdn.jsdelivr.net/gh/tarikjamil/Hombre-tribute/style.css',
          item.publicPath
        );
      }
      if (item.url.includes('tarikjamil/Hombre-tribute/script.js')) {
        urlMap.set(
          'https://cdn.jsdelivr.net/gh/tarikjamil/Hombre-tribute/script.js',
          item.publicPath
        );
      }
      if (item.url.includes('lenis')) {
        urlMap.set(
          'https://cdn.jsdelivr.net/gh/studio-freight/lenis@1.0.0/bundled/lenis.js',
          item.publicPath
        );
      }
      if (item.url.includes('howler')) {
        urlMap.set(
          'https://cdnjs.cloudflare.com/ajax/libs/howler/2.2.3/howler.min.js',
          item.publicPath
        );
      }
      if (item.url.includes('gsap.min.js')) {
        urlMap.set(
          'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.11.3/gsap.min.js',
          item.publicPath
        );
      }
      if (item.url.includes('Flip.min.js')) {
        urlMap.set(
          'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.11.1/Flip.min.js',
          item.publicPath
        );
      }
      if (item.url.includes('ScrollTrigger')) {
        urlMap.set(
          'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.11.3/ScrollTrigger.min.js',
          item.publicPath
        );
      }
    } catch (err) {
      console.warn(`  warn: ${err.message}`);
    }
  }

  // Rewrite CSS file contents for embedded CDN urls
  const cssFiles = toDownload.filter((d) => d.diskPath.endsWith('.css'));
  for (const css of cssFiles) {
    let cssText = await readFile(css.diskPath, 'utf8');
    const nested = collectUrls(cssText);
    for (const url of nested) {
      if (!urlMap.has(url)) {
        const local = localAssetPathFromUrl(url);
        urlMap.set(url, local.publicPath);
        try {
          await download(url, local.diskPath);
        } catch (err) {
          console.warn(`  css asset warn: ${err.message}`);
        }
      }
    }
    // also catch url(...) without full protocol relative? usually absolute in webflow
    for (const [remote, local] of urlMap) {
      cssText = cssText.split(remote).join(local);
    }
    await writeFile(css.diskPath, cssText);
  }

  // Rewrite custom script if it references github/cdn audio or remote urls
  try {
    let script = await readFile(join(PUBLIC, 'js', 'custom-script.js'), 'utf8');
    script = script
      .replaceAll(
        'https://cdn.jsdelivr.net/gh/tarikjamil/Hombre-tribute/hombre.mp3',
        '/audio/hombre.mp3'
      )
      .replaceAll(
        'https://raw.githubusercontent.com/tarikjamil/Hombre-tribute/main/hombre.mp3',
        '/audio/hombre.mp3'
      )
      .replaceAll('hombre.mp3', '/audio/hombre.mp3');
    // avoid double-prefix if already /audio/
    script = script.replaceAll('/audio//audio/hombre.mp3', '/audio/hombre.mp3');
    // if relative path was just /audio/hombre.mp3 already fine; if we broke something like "foo/hombre.mp3" fix common patterns
    // Re-read original intent: only replace bare filename in src strings
    await writeFile(join(PUBLIC, 'js', 'custom-script.js'), script);
  } catch {
    /* optional */
  }

  // Better audio path rewrite: re-download original script and do careful replace
  try {
    let script = await readFile(join(PUBLIC, 'js', 'custom-script.js'), 'utf8');
    script = script.replace(/['"][^'"]*hombre\.mp3['"]/g, "'/audio/hombre.mp3'");
    await writeFile(join(PUBLIC, 'js', 'custom-script.js'), script);
  } catch (err) {
    console.warn('script rewrite warn:', err.message);
  }

  // Apply URL map to HTML (longest first to avoid partial overlaps)
  const remotes = [...urlMap.keys()].sort((a, b) => b.length - a.length);
  for (const remote of remotes) {
    html = html.split(remote).join(urlMap.get(remote));
  }
  // Also replace jsdelivr custom style/script if still present
  html = html
    .replaceAll(
      'https://cdn.jsdelivr.net/gh/tarikjamil/Hombre-tribute/style.css',
      '/css/custom-style.css'
    )
    .replaceAll(
      'https://cdn.jsdelivr.net/gh/tarikjamil/Hombre-tribute/script.js',
      '/js/custom-script.js'
    );

  await writeFile(join(TMP, 'home.localized.html'), html);

  // Extract body inner HTML and body attrs
  const bodyMatch = html.match(/<body([^>]*)>([\s\S]*)<\/body>/i);
  if (!bodyMatch) throw new Error('No <body> found');
  const bodyAttrs = bodyMatch[1] || '';
  let bodyInner = bodyMatch[2];
  // Remove trailing script tags from body — they'll go in layout for control
  // Keep structure: Webflow often puts scripts at end of body. We'll move known ones to layout.
  // For mirror fidelity, keep inline scripts in body; replace external script srcs already localized.

  await writeFile(join(TMP, 'body.html'), bodyInner);
  await writeFile(join(TMP, 'body-attrs.txt'), bodyAttrs.trim());

  // Extract useful head bits
  const headMatch = html.match(/<head[^>]*>([\s\S]*)<\/head>/i);
  const head = headMatch ? headMatch[1] : '';
  await writeFile(join(TMP, 'head.html'), head);

  // Write rewrite map for debugging
  await writeFile(
    join(TMP, 'url-map.json'),
    JSON.stringify(Object.fromEntries(urlMap), null, 2)
  );

  console.log(`Done. Mapped ${urlMap.size} URLs.`);
  console.log(`Body written to .tmp/body.html (${bodyInner.length} chars)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
