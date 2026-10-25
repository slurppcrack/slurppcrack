#!/usr/bin/env node
/**
 * Publishes the WPF desktop app as one self-contained SLURP.exe.
 *
 *   node scripts/build-wpf.mjs            -> public/download/SLURP.exe (+ SHA256.txt)
 *   node scripts/build-wpf.mjs --keep     -> keep the intermediate publish folder
 *
 * Needs a .NET 8 SDK (`dotnet` on PATH). WPF is a Windows desktop stack, so the
 * publish target is win-x64. Building it from Linux/macOS works with the
 * EnableWindowsTargeting flag that the .csproj already sets — running it does not.
 */
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const project = join(root, 'desktop', 'Slurp.Desktop', 'Slurp.Desktop.csproj')
const outDir = join(root, 'public', 'download')
const workDir = join(root, 'build', 'wpf')

function say(msg) {
  console.log(msg)
}

function hasDotnet() {
  const probe = spawnSync('dotnet', ['--version'], { encoding: 'utf8' })
  return probe.status === 0
}

if (!hasDotnet()) {
  console.error('')
  console.error('  .NET SDK 8 не найден — собрать SLURP.exe здесь нельзя.')
  console.error('')
  console.error('  На Windows: двойной клик по BUILD-WINDOWS.bat в корне репозитория.')
  console.error('  Или поставь SDK 8: https://dotnet.microsoft.com/download/dotnet/8.0')
  console.error('')
  process.exit(1)
}

mkdirSync(outDir, { recursive: true })

say('  dotnet publish → win-x64, self-contained, single file')
const publish = spawnSync(
  'dotnet',
  [
    'publish',
    project,
    '-c', 'Release',
    '-r', 'win-x64',
    '--self-contained', 'true',
    '-p:PublishSingleFile=true',
    '-p:IncludeNativeLibrariesForSelfExtract=true',
    '-p:EnableCompressionInSingleFile=true',
    '-o', workDir,
  ],
  { stdio: 'inherit', cwd: root },
)

if (publish.status !== 0) {
  console.error('  publish упал — см. вывод выше')
  process.exit(publish.status ?? 1)
}

const built = join(workDir, 'SLURP.exe')
if (!existsSync(built)) {
  console.error(`  ожидался ${built}, но его нет`)
  process.exit(1)
}

const target = join(outDir, 'SLURP.exe')
copyFileSync(built, target)

const bytes = readFileSync(target)
const sha = createHash('sha256').update(bytes).digest('hex')
const human = (statSync(target).size / 1024 / 1024).toFixed(1) + ' MB'

writeFileSync(
  join(outDir, 'SHA256.txt'),
  [
    'SLURP 0.9.4 — Windows x64, self-contained WPF build',
    '',
    `${sha}  SLURP.exe  (${human})`,
    '',
    'Проверка: certutil -hashfile SLURP.exe SHA256',
    '',
  ].join('\n'),
  'utf8',
)

say('')
say(`  готово: public/download/SLURP.exe  (${human})`)
say(`  sha256: ${sha}`)
say('')
