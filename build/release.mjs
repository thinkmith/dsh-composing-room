/**
 * Publishes the v<version> GitHub release and attaches the built installers.
 *
 *   $env:GITHUB_TOKEN = 'ghp_...'; node build/release.mjs
 *
 * Reads dist/*.exe and dist/*.tgz, creates the release for the tag matching
 * package.json (creating the tag is push.ps1's job), then uploads each file.
 * Talks to the API through the local proxy when GITHUB_PROXY is set.
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
const token = process.env.GITHUB_TOKEN
if (!token) throw new Error('GITHUB_TOKEN is not set')
const proxy = process.env.GITHUB_PROXY ?? 'http://127.0.0.1:7890'
const repo = (() => {
  const m = /github\.com[/:]([^/]+\/[^/.]+)/.exec(pkg.repository?.url ?? '')
  if (!m) throw new Error('package.json has no usable repository.url')
  return m[1]
})()
const tag = `v${pkg.version}`

const curl = (args) => {
  const base = ['-sS', '--max-time', '180', '-x', proxy,
    '-H', `Authorization: Bearer ${token}`,
    '-H', 'Accept: application/vnd.github+json',
    '-H', 'X-GitHub-Api-Version: 2022-11-28']
  return execFileSync('curl.exe', [...base, ...args], { encoding: 'utf8' })
}

const notes = `## composing-room ${pkg.version}

DeepSeek Harness plugin: a pill right of the composer that arms a system-prompt
section on demand. Off by default; nothing is mounted until you click it.

### Install

- \`dsh-composing-room-${pkg.version}-setup.exe\` — double-click (Windows, no Node needed)
- \`dsh-composing-room-${pkg.version}.tgz\` — \`pnpm add\` into \`%USERPROFILE%\\.dsh\\profiles\\desktop\`
- or clone and run \`install.ps1\`

Restart DeepSeek Harness once after installing.

### Payload

\`assets/prompt.default.txt\` is the bundled writing spec (7407 characters). A fresh
install copies it to \`%USERPROFILE%\\.dsh\\composing-room\\prompt.txt\`; edit that file
to change what the section says, then \`/room reload\`.

### Reminder

Use it on your own machine, account, and sessions. See [DISCLAIMER.md](DISCLAIMER.md);
MIT, provided as is.
`

const existing = (() => {
  try {
    return JSON.parse(curl([`https://api.github.com/repos/${repo}/releases/tags/${tag}`]))
  } catch {
    return null
  }
})()

let release = existing && existing.id ? existing : null
if (!release) {
  const bodyPath = path.join(root, 'dist', 'release-body.json')
  fs.writeFileSync(bodyPath, JSON.stringify({
    tag_name: tag,
    name: `composing-room ${pkg.version}`,
    body: notes,
    draft: false,
    prerelease: false,
  }))
  release = JSON.parse(curl(['-X', 'POST', '-H', 'Content-Type: application/json',
    '--data-binary', '@' + bodyPath, `https://api.github.com/repos/${repo}/releases`]))
  if (!release.id) throw new Error('release create failed: ' + JSON.stringify(release).slice(0, 300))
  console.log(`release created: ${release.html_url}`)
} else {
  console.log(`release exists: ${release.html_url}`)
}

const assets = fs.readdirSync(path.join(root, 'dist'))
  .filter((f) => f.endsWith('.exe') || f.endsWith('.tgz'))
  .map((f) => path.join(root, 'dist', f))

for (const file of assets) {
  const name = path.basename(file)
  const uploadUrl = String(release.upload_url).replace('{?name,label}', '') + '?name=' + encodeURIComponent(name)
  const out = curl(['-X', 'POST', '-H', 'Content-Type: application/octet-stream',
    '--data-binary', '@' + file, uploadUrl])
  let parsed
  try { parsed = JSON.parse(out) } catch { parsed = { message: out.slice(0, 200) } }
  if (parsed.browser_download_url) console.log(`  attached ${name}  ${parsed.size} bytes`)
  else console.log(`  FAILED ${name}: ${JSON.stringify(parsed).slice(0, 200)}`)
}

console.log(`\nhttps://github.com/${repo}/releases/tag/${tag}`)
