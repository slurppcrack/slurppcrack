/**
 * Single source of truth for the downloadable build.
 *
 * Two ways this file is used:
 *  1. Served by the site (dev server or a static host) — the binaries are same-origin
 *     files in public/download/, so "download" can never 404 or be blocked.
 *  2. Opened as a local file (file://SLURP.html) — a relative path cannot work there,
 *     and GitHub's raw host is blocked by some ISPs, so we point people at the ZIP
 *     from codeload, which contains the very same .exe.
 *
 * SHA-256s are deliberately NOT here: a file cannot contain its own hash.
 * They live next to the binaries in public/download/SHA256.txt.
 */
const REPO = 'https://github.com/slurppcrack/slurppcrack'
const BRANCH = 'arena/630fbf79-slurppcrack'
const ZIP = `https://codeload.github.com/slurppcrack/slurppcrack/zip/refs/heads/${BRANCH}`

/** true when the app itself is running as a local .html file */
export const IS_LOCAL_FILE = typeof location !== 'undefined' && location.protocol === 'file:'

export const APP = {
  version: '0.9.4',
  exeFile: 'SLURP.exe',
  exeSize: '915 KB',
  htmlFile: 'SLURP.html',
  htmlSize: '841 KB',

  /** Windows app */
  get exe() {
    return 'download/SLURP.exe'
  },
  /** the same app as one HTML file, for any OS */
  get html() {
    return 'download/SLURP.html'
  },
  get sums() {
    return IS_LOCAL_FILE ? `${REPO}/blob/${BRANCH}/public/download/SHA256.txt` : 'download/SHA256.txt'
  },

  /** what the big button should actually do, depending on how we are running */
  get primary(): { href: string; label: string; note: string; external: boolean } {
    if (!IS_LOCAL_FILE) {
      return {
        href: 'download/SLURP.exe',
        label: `Скачать ${this.exeFile}`,
        note: `${this.exeSize} · Windows 10/11 · без установки`,
        external: false,
      }
    }
    return {
      href: ZIP,
      label: 'Скачать ZIP с SLURP.exe',
      note: 'сайт открыт как локальный файл — внутри архива лежит тот же SLURP.exe',
      external: true,
    }
  },

  zip: ZIP,
  repo: REPO,
}
