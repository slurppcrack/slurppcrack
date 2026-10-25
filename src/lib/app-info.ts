/**
 * Single source of truth for the downloadable build.
 *
 * The binaries live in public/download/, so the site serves them itself:
 * same-origin, no GitHub, no redirects, guaranteed download.
 * When the app runs as a single local .html file (file://), a relative URL cannot
 * work, so we fall back to the copy in the repository.
 *
 * SHA-256s are deliberately NOT here: a file cannot contain its own hash.
 * They live next to the binaries in public/download/SHA256.txt.
 */
const REPO = 'https://github.com/slurppcrack/slurppcrack'
const BRANCH = 'arena/630fbf79-slurppcrack'
const RAW = `${REPO}/raw/${BRANCH}/public/download`

const isFile = () => typeof location !== 'undefined' && location.protocol === 'file:'

export const APP = {
  version: '0.9.4',
  exeFile: 'SLURP.exe',
  exeSize: '914 KB',
  htmlFile: 'SLURP.html',
  htmlSize: '841 KB',
  /** Windows app — served by this site, or from the repo when running as a local file */
  get exe() {
    return isFile() ? `${RAW}/SLURP.exe` : 'download/SLURP.exe'
  },
  /** the same app as one HTML file, for any OS */
  get html() {
    return isFile() ? `${RAW}/SLURP.html` : 'download/SLURP.html'
  },
  /** checksums */
  get sums() {
    return isFile() ? `${REPO}/blob/${BRANCH}/public/download/SHA256.txt` : 'download/SHA256.txt'
  },
  /** whole repository, if you want the sources */
  zip: `https://codeload.github.com/slurppcrack/slurppcrack/zip/refs/heads/${BRANCH}`,
  repo: REPO,
}
