# dsh-composing-room installer
#
# Installs the plugin into a DSH profile and seeds the payload + state so the
# composer toggle is usable on the first click after a restart.
#
#   powershell -NoProfile -ExecutionPolicy Bypass -File install.ps1
#   powershell -NoProfile -ExecutionPolicy Bypass -File install.ps1 -Profile desktop -Mode copy
#
# ASCII only on purpose: PowerShell 5.1 reads BOM-less files as GBK and would
# choke on anything else.

param(
  [string]$Profile = 'desktop',
  [ValidateSet('link', 'copy')]
  [string]$Mode = 'link',
  [switch]$SkipPatch
)

$ErrorActionPreference = 'Stop'

$src = $PSScriptRoot
$pkgName = 'dsh-composing-room'
$profileDir = Join-Path $env:USERPROFILE (".dsh\profiles\$Profile")
$patchFile = Join-Path $profileDir 'cordis.patch.yml'
$targetDir = Join-Path $profileDir "node_modules\$pkgName"
$stateDir = Join-Path $env:USERPROFILE '.dsh\composing-room'

function Say($msg) { Write-Host $msg }

if (-not (Test-Path $profileDir)) {
  throw "profile not found: $profileDir"
}

# 1. payload into node_modules (junction by default so edits stay live)
if (Test-Path $targetDir) {
  Say "already installed: $targetDir"
} else {
  $parent = Split-Path -Parent $targetDir
  if (-not (Test-Path $parent)) { New-Item -ItemType Directory -Force -Path $parent | Out-Null }
  if ($Mode -eq 'link') {
    cmd /c mklink /J "$targetDir" "$src" | Out-Null
    if (Test-Path (Join-Path $targetDir 'package.json')) {
      Say "linked: $targetDir -> $src"
    } else {
      Say "junction failed, falling back to copy"
      $Mode = 'copy'
    }
  }
  if ($Mode -eq 'copy') {
    New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
    Copy-Item -Path (Join-Path $src 'lib') -Destination $targetDir -Recurse -Force
    Copy-Item -Path (Join-Path $src 'assets') -Destination $targetDir -Recurse -Force
    Copy-Item -Path (Join-Path $src 'package.json') -Destination $targetDir -Force
    Say "copied: $targetDir"
  }
}

# 2. loader entry in cordis.patch.yml
if ($SkipPatch) {
  Say "patch skipped (add the insert block by hand)"
} else {
  $existing = if (Test-Path $patchFile) { Get-Content $patchFile -Raw } else { '' }
  if ($existing -match "(?m)^\s*-\s*id:\s*composing-room\s*$") {
    Say "patch already declares composing-room"
  } else {
    if ($null -eq $existing) { $existing = '' }
    $block = @"
# --- composing room (local plugin: manual system-section injection) ---
# Disarmed by default. /room on | /room off | /room reload  (state lives in
# %USERPROFILE%\.dsh\composing-room\state.json, text in prompt.txt beside it).
- insert:
    - id: composing-room
      name: '$pkgName'
"@
    $sep = if ($existing.Length -gt 0 -and -not $existing.EndsWith("`n")) { "`n" } else { '' }
    Add-Content -Path $patchFile -Value ($sep + $block) -Encoding UTF8
    Say "patched: $patchFile"
  }
}

# 3. payload + state (the plugin also seeds these at load; doing it here keeps
#    room.ps1 and the desktop toggle usable before DSH ever starts)
if (-not (Test-Path $stateDir)) { New-Item -ItemType Directory -Force -Path $stateDir | Out-Null }
$prompt = Join-Path $stateDir 'prompt.txt'
if (-not (Test-Path $prompt)) {
  Copy-Item -Path (Join-Path $src 'assets\prompt.default.txt') -Destination $prompt -Force
  Say "seeded payload: $prompt"
}
$state = Join-Path $stateDir 'state.json'
if (-not (Test-Path $state)) {
  $json = "{`n  `"armed`": false,`n  `"order`": 12000,`n  `"textPath`": `"$($prompt -replace '\\','\\')`"`n}`n"
  Set-Content -Path $state -Value $json -Encoding UTF8
  Say "seeded state: $state"
}

Say ''
Say 'done. restart DeepSeek Harness once, then look right of the composer:'
Say '  a pill labelled "PAIBAN off" -- click it, it turns green, the section is live.'
Say '  /room on | /room off | /room reload also work in chat.'
