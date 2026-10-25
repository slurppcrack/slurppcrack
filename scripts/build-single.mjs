// Builds ONE self-contained HTML file: no server, no node_modules, no fonts from the network.
// Double-click it and the whole product runs — landing, harness, settings, wizard.
//
//   npm run build:app   ->  dist-single/SLURP.html
//
import { build } from 'vite'
import fs from 'node:fs/promises'
import path from 'node:path'
import { createHash } from 'node:crypto'

const TMP = 'dist-single/_tmp'
const OUT = 'dist-single'
const NAME = 'SLURP.html'

const mime = {
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
}

async function toDataUri(file) {
  const buf = await fs.readFile(path.join(TMP, file))
  const ext = path.extname(file).toLowerCase()
  return `data:${mime[ext] ?? 'application/octet-stream'};base64,${buf.toString('base64')}`
}

async function inlineCssUrls(css) {
  const matches = [...css.matchAll(/url\((['"]?)(\.?\/?assets\/[^)'"]+)\1\)/g)]
  let out = css
  for (const m of matches) {
    const rel = m[2].replace(/^\.?\//, '')
    try {
      const uri = await toDataUri(rel)
      out = out.split(m[0]).join(`url("${uri}")`)
    } catch {
      /* skip missing asset */
    }
  }
  return out
}


console.log('· vite build (single-file mode)…')
process.env.VITE_SINGLE = '1'
await build({ mode: 'production', logLevel: 'warn', build: { outDir: TMP, emptyOutDir: true } })

let html = await fs.readFile(path.join(TMP, 'index.html'), 'utf8')

// 1. inline stylesheets
const cssLinks = [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g)]
for (const m of cssLinks) {
  const rel = m[1].replace(/^\.?\//, '')
  const css = await inlineCssUrls(await fs.readFile(path.join(TMP, rel), 'utf8'))
  // replacer FUNCTION: a string replacement would interpret $&, $', $1 … found in the CSS/JS
  html = html.replace(m[0], () => `<style>\n${css}\n</style>`)
}

// 2. inline the module bundle
const scripts = [...html.matchAll(/<script[^>]+src="([^"]+)"[^>]*><\/script>/g)]
for (const m of scripts) {
  const rel = m[1].replace(/^\.?\//, '')
  const code = (await fs.readFile(path.join(TMP, rel), 'utf8'))
    .replace(/<\/script/gi, '<\\/script')
    .replace(/<!--/g, '<\\!--')
  html = html.replace(m[0], () => `<script type="module">\n${code}\n</script>`)
}

// 3. inline the favicon
const icon = html.match(/<link[^>]+rel="icon"[^>]*href="([^"]+)"[^>]*>/)
if (icon) {
  const uri = await toDataUri(icon[1].replace(/^\.?\//, '').replace(/^public\//, ''))
  html = html.replace(icon[0], () => `<link rel="icon" type="image/svg+xml" href="${uri}">`)
}

// 4. drop module preload hints that point at files we just inlined
html = html.replace(/<link[^>]+rel="modulepreload"[^>]*>\s*/g, '')

// 5. offline marker in the title
html = html.replace(
  '<title>',
  '<meta name="slurp-build" content="single-file">\n    <title>',
)

await fs.mkdir(OUT, { recursive: true })
const target = path.join(OUT, NAME)
await fs.writeFile(target, html, 'utf8')
await fs.rm(TMP, { recursive: true, force: true })

const { size } = await fs.stat(target)
const kb = Math.round(size / 1024)

// copy into the release folder that ships with the repo + publish the checksum separately
await fs.mkdir('release', { recursive: true })
await fs.copyFile(target, path.join('release', 'SLURP.html'))
const sha = createHash('sha256').update(await fs.readFile(target)).digest('hex')
await fs.writeFile(
  path.join('release', 'SHA256.txt'),
  `${sha}  SLURP.html\n# SLURP ${kb} KB · built ${new Date().toISOString().slice(0, 10)}\n# verify:  certutil -hashfile SLURP.html SHA256   (Windows)\n#          shasum -a 256 SLURP.html              (macOS / Linux)\n`,
  'utf8',
)
console.log(`✓ ${target} — ${kb} KB, self-contained`)
console.log(`  sha256 ${sha}`)
// keep the size shown on the site in sync (the hash cannot live inside the file, only here)
const infoPath = 'src/lib/app-info.ts'
const info = await fs.readFile(infoPath, 'utf8')
const nextInfo = info.replace(/size: '[^']*'/, `size: '${kb} KB'`)
if (nextInfo !== info) await fs.writeFile(infoPath, nextInfo, 'utf8')
console.log('✓ release/SLURP.html + release/SHA256.txt updated')
