#!/usr/bin/env node
/**
 * Packs the Windows source bundle that the website serves:
 *   public/download/SLURP-Windows.zip
 *
 * Contents (what a person needs to get a real SLURP.exe):
 *   SLURP-0.9.4/START-HERE.txt
 *   SLURP-0.9.4/BUILD-WINDOWS.bat
 *   SLURP-0.9.4/desktop/Slurp.Desktop/**            (C# / WPF source)
 *   SLURP-0.9.4/desktop/Slurp.Desktop/*.csproj
 *
 * Usage: node scripts/pack-windows.mjs
 */
import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const version = '0.9.4'
const bundleName = `SLURP-${version}`
const stageRoot = join(root, 'build', 'zip')
const stage = join(stageRoot, bundleName)
const outDir = join(root, 'public', 'download')
const zipPath = join(outDir, 'SLURP-Windows.zip')

const SKIP = new Set(['bin', 'obj', '.vs'])

rmSync(stageRoot, { recursive: true, force: true })
mkdirSync(join(stage, 'desktop'), { recursive: true })
mkdirSync(outDir, { recursive: true })

cpSync(join(root, 'desktop', 'Slurp.Desktop'), join(stage, 'desktop', 'Slurp.Desktop'), {
  recursive: true,
  filter: (src) => !SKIP.has(src.split(/[\\/]/).pop()),
})

for (const file of ['BUILD-WINDOWS.bat', 'START-HERE.txt', 'RUN.md']) {
  if (!existsSync(join(root, file))) {
    console.error(`  нет файла ${file}`)
    process.exit(1)
  }
  cpSync(join(root, file), join(stage, file))
}

writeFileSync(
  join(stage, 'ВЕРСИЯ.txt'),
  `SLURP ${version}\nсобрано из ветки ${process.env.GITHUB_REF_NAME ?? 'arena/630fbf79-slurppcrack'}\n`,
  'utf8',
)

rmSync(zipPath, { force: true })
const zip = spawnSync('zip', ['-r', '-q', '-9', zipPath, bundleName], { cwd: stageRoot, stdio: 'inherit' })

if (zip.error || zip.status !== 0) {
  console.error('  не удалось создать zip (нужен пакет zip в системе)')
  process.exit(1)
}

rmSync(stageRoot, { recursive: true, force: true })
console.log(`  public/download/SLURP-Windows.zip  ←  desktop/Slurp.Desktop + BUILD-WINDOWS.bat + START-HERE.txt`)
