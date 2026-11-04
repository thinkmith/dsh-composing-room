# Publishes this repository to GitHub (no gh CLI required).
#
#   powershell -NoProfile -ExecutionPolicy Bypass -File push.ps1 -Token ghp_xxx
#   powershell -NoProfile -ExecutionPolicy Bypass -File push.ps1 -Token ghp_xxx -Public
#
# What it does:
#   1. reads the account behind the token (GET /user)
#   2. creates <user>/<Repo> (private unless -Public) if it does not exist
#   3. pushes main and the v<version> tag with the token used inline for this one
#      command only, then rewrites origin back to a token-free URL
#   4. prints the repo, compare, and release-upload URLs
#
# ASCII only: PowerShell 5.1 reads BOM-less files as GBK.
param(
  [Parameter(Mandatory = $true)][string]$Token,
  [string]$Repo = 'dsh-composing-room',
  [switch]$Public,
  [string]$Proxy = 'http://127.0.0.1:7890'
)

$ErrorActionPreference = 'Stop'
$pkg = Get-Content (Join-Path $PSScriptRoot 'package.json') -Raw | ConvertFrom-Json
$tag = 'v' + $pkg.version

function Invoke-GitHub([string]$Method, [string]$Path, [string]$Body) {
  $args = @('-sS', '-X', $Method, '-H', "Authorization: Bearer $Token",
    '-H', 'Accept: application/vnd.github+json', '-H', 'X-GitHub-Api-Version: 2022-11-28',
    '--max-time', '60')
  if ($Proxy) { $args += @('-x', $Proxy) }
  if ($Body) { $args += @('-d', $Body) }
  $args += ('https://api.github.com' + $Path)
  $raw = & curl.exe @args
  if (-not $raw) { throw "empty reply from $Path" }
  return ($raw | ConvertFrom-Json)
}

Write-Host 'whoami...'
$me = Invoke-GitHub 'GET' '/user'
if (-not $me.login) { throw 'token rejected: ' + ($me.message) }
$owner = $me.login
Write-Host ("  account: " + $owner)

$full = "$owner/$Repo"
$visibility = if ($Public) { 'public' } else { 'private' }
Write-Host ("repo: $full ($visibility)")

$existing = & curl.exe -sS -o NUL -w '%{http_code}' --max-time 30 $(if ($Proxy) { @('-x', $Proxy) }) `
  -H "Authorization: Bearer $Token" "https://api.github.com/repos/$full"
if ($existing -eq '404') {
  $payload = @{ name = $Repo; private = [bool](-not $Public); description = $pkg.description;
    has_issues = $true; has_wiki = $false; auto_init = $false } | ConvertTo-Json -Compress
  $created = Invoke-GitHub 'POST' '/user/repos' $payload
  if (-not $created.clone_url) { throw 'create failed: ' + $created.message }
  Write-Host '  created'
} else {
  Write-Host '  already exists, reusing'
}

if (-not (Test-Path (Join-Path $PSScriptRoot '.git'))) {
  & git init -b main | Out-Null
}
& git add -A
$staged = & git diff --cached --name-only
if ($staged) {
  & git commit -m ("v" + $pkg.version) | Out-Null
  Write-Host '  committed'
}
if (-not (& git tag -l $tag)) { & git tag $tag }

& git remote get-url origin 2>$null | Out-Null
if ($LASTEXITCODE -eq 0) { & git remote remove origin 2>$null | Out-Null }
$authUrl = "https://$Token@github.com/$full.git"
& git remote add origin $authUrl
Write-Host 'pushing...'
& git push -u origin main --tags
$pushCode = $LASTEXITCODE
& git remote set-url origin "https://github.com/$full.git"
if ($pushCode -ne 0) { throw "git push failed with exit code $pushCode" }

Write-Host ''
Write-Host 'done.'
Write-Host ("  repo    https://github.com/" + $full)
Write-Host ("  tag     https://github.com/" + $full + "/releases/tag/" + $tag)
Write-Host ("  new rel https://github.com/" + $full + "/releases/new?tag=" + $tag)
Write-Host ''
Write-Host 'Attach both files to the release by hand (drag & drop):'
Get-ChildItem (Join-Path $PSScriptRoot 'dist') -File -ErrorAction SilentlyContinue |
  Where-Object { $_.Extension -in '.exe', '.tgz' } |
  ForEach-Object { Write-Host ('  ' + $_.FullName) }
