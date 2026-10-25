/**
 * Single source of truth for what the site's download button points at.
 *
 * SLURP is a native C#/.NET 8/WPF desktop app (see desktop/Slurp.Desktop).
 * A .exe cannot be produced on the machine that builds this site (no Windows,
 * no .NET SDK), so the site ships the Windows source bundle together with
 * BUILD-WINDOWS.bat: one double click compiles SLURP.exe locally and launches it.
 * Once somebody runs `npm run build:win` on a Windows box the result lands in
 * public/download/SLURP.exe and `APP.exeReady` can be flipped to true — the
 * button then serves the compiled binary instead of the bundle.
 *
 * Two ways this file is used:
 *  1. Served by the site (dev server or static host) — same-origin files in
 *     public/download/, so a link can never 404 or be blocked.
 *  2. Opened as a local file (file://) — relative paths do not work there, so we
 *     fall back to the codeload ZIP of the branch.
 */
const REPO = 'https://github.com/slurppcrack/slurppcrack'
const BRANCH = 'arena/630fbf79-slurppcrack'
const ZIP = `https://codeload.github.com/slurppcrack/slurppcrack/zip/refs/heads/${BRANCH}`

/** set to true after `npm run build:win` has put SLURP.exe into public/download/ */
const EXE_READY = false

/** true when the site is opened as a local .html file */
export const IS_LOCAL_FILE = typeof location !== 'undefined' && location.protocol === 'file:'

export const APP = {
  version: '0.9.4',
  stack: 'C# · .NET 8 · WPF',
  exeFile: 'SLURP.exe',
  bundle: 'SLURP-Windows-r2.zip',
  bundleSize: '39 КБ',
  /** shown in eyebrows instead of a byte size we cannot promise */
  exeSize: 'исходники + сборка в один клик',

  get exe() {
    return 'download/SLURP.exe'
  },
  get bundleUrl() {
    return 'download/SLURP-Windows-r2.zip'
  },
  /** what the big button actually does, depending on how we are running */
  get primary(): { href: string; label: string; note: string; external: boolean } {
    if (EXE_READY && !IS_LOCAL_FILE) {
      return {
        href: 'download/SLURP.exe',
        label: `Скачать ${this.exeFile}`,
        note: 'Windows 10/11 · x64 · self-contained, ставить нечего',
        external: false,
      }
    }
    if (!IS_LOCAL_FILE) {
      return {
        href: this.bundleUrl,
        label: 'Скачать SLURP для Windows',
        note: `ZIP ${this.bundleSize} · исходники C# и BUILD-WINDOWS.bat`,
        external: false,
      }
    }
    return {
      href: ZIP,
      label: 'Скачать ZIP с исходниками',
      note: 'сайт открыт локально — внутри архива та же папка desktop/Slurp.Desktop',
      external: true,
    }
  },

  exeReady: EXE_READY,
  zip: ZIP,
  repo: REPO,
}
