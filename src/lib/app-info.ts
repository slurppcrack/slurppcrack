/**
 * Single source of truth for the downloadable build.
 * The SHA-256 is NOT embedded here on purpose: a file cannot contain its own hash.
 * It lives in release/SHA256.txt, written by scripts/build-single.mjs next to the file.
 */
export const APP = {
  version: '0.9.4',
  file: 'SLURP.html',
  size: '868 KB',
  // codeload is the most reliable route from RU networks (raw.githubusercontent is often blocked)
  zipDirect: 'https://codeload.github.com/slurppcrack/slurppcrack/zip/refs/heads/arena/630fbf79-slurppcrack',
  blob: 'https://github.com/slurppcrack/slurppcrack/blob/arena/630fbf79-slurppcrack/release/SLURP.html',
  sums: 'https://github.com/slurppcrack/slurppcrack/blob/arena/630fbf79-slurppcrack/release/SHA256.txt',
  zip: 'https://github.com/slurppcrack/slurppcrack/archive/refs/heads/arena/630fbf79-slurppcrack.zip',
  repo: 'https://github.com/slurppcrack/slurppcrack',
}
