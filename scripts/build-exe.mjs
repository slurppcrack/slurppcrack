// Wraps the single-file HTML app into SLURP.exe (Windows x64).
//
//   npm run build:exe
//
// The launcher stub (native/launcher.c) is compiled with zig cc:
//   zig cc -target x86_64-windows-gnu -O2 -s -Wl,--subsystem,windows \
//          -o native/SLURP-stub.exe launcher.c -lshell32 -luser32
//
// The built .exe = stub + HTML payload + 24-byte footer ("SLURPEXE", payload size).
// On launch it extracts the HTML to %TEMP% and opens it in the default browser.
import fs from 'node:fs/promises'
import path from 'node:path'
import { createHash } from 'node:crypto'

const STUB = 'native/SLURP-stub.exe'
const HTML = 'public/download/SLURP.html'
const OUT = 'public/download/SLURP.exe'
const MAGIC = Buffer.from('SLURPEXE', 'ascii')

const footer = (payloadSize) => {
  const buf = Buffer.alloc(24)
  MAGIC.copy(buf, 0)
  buf.writeBigUInt64LE(BigInt(payloadSize), 8)
  return buf // last 8 bytes are reserved/padding
}

const [stub, html] = await Promise.all([fs.readFile(STUB), fs.readFile(HTML)])
if (stub.subarray(0, 2).toString() !== 'MZ') throw new Error(`${STUB} is not a PE executable`)

const exe = Buffer.concat([stub, html, footer(html.length)])
await fs.writeFile(OUT, exe)

// --- verify exactly the way the C launcher reads it ---
const built = await fs.readFile(OUT)
const magic = built.subarray(built.length - 24, built.length - 16).toString('ascii')
const payloadSize = Number(built.readBigUInt64LE(built.length - 16))
const payload = built.subarray(built.length - 24 - payloadSize, built.length - 24)
const ok = magic === 'SLURPEXE' && payloadSize === html.length && payload.equals(html)

const sha = createHash('sha256').update(built).digest('hex')
const kb = Math.round(built.length / 1024)
await fs.writeFile(
  path.join('public/download', 'SHA256.txt'),
  [
    `${sha}  SLURP.exe`,
    `${createHash('sha256').update(html).digest('hex')}  SLURP.html`,
    `# SLURP ${kb} KB exe · built ${new Date().toISOString().slice(0, 10)}`,
    `# verify:  certutil -hashfile SLURP.exe SHA256    (Windows)`,
    `#          shasum -a 256 SLURP.exe               (macOS / Linux)`,
    '',
  ].join('\n'),
  'utf8',
)

// keep the size shown on the site in sync
const infoPath = 'src/lib/app-info.ts'
const info = await fs.readFile(infoPath, 'utf8')
const next = info.replace(/exeSize: '[^']*'/, `exeSize: '${Math.round(built.length / 1024)} KB'`).replace(/htmlSize: '[^']*'/, `htmlSize: '${Math.round(html.length / 1024)} KB'`)
if (next !== info) await fs.writeFile(infoPath, next, 'utf8')

console.log(`✓ ${OUT} — ${kb} KB (stub ${Math.round(stub.length / 1024)} KB + app ${Math.round(html.length / 1024)} KB)`)
console.log(`  payload round-trip: ${ok ? 'OK' : 'FAILED'}`)
console.log(`  sha256 ${sha}`)
if (!ok) process.exit(1)
