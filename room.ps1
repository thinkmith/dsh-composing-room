param(
  [ValidateSet('on','off','toggle','status','path','text')]
  [string]$action = 'status',
  [string]$file
)
$ErrorActionPreference = 'Stop'
$home_ = Join-Path $env:USERPROFILE '.dsh\composing-room'
$state = Join-Path $home_ 'state.json'
$text  = Join-Path $home_ 'prompt.txt'
if (-not (Test-Path $home_)) { New-Item -ItemType Directory -Force -Path $home_ | Out-Null }

$cur = @{ armed = $false; textPath = $text; order = 12000 }
if (Test-Path $state) {
  try { $cur = Get-Content $state -Raw -Encoding utf8 | ConvertFrom-Json } catch { }
}
if (-not $cur.PSObject.Properties['textPath'] -or -not $cur.textPath) { $cur | Add-Member -Force -NotePropertyName textPath -NotePropertyValue $text }
if (-not $cur.PSObject.Properties['armed']) { $cur | Add-Member -Force -NotePropertyName armed -NotePropertyValue $false }
if (-not $cur.PSObject.Properties['order'] -or -not $cur.order) { $cur | Add-Member -Force -NotePropertyName order -NotePropertyValue 12000 }

switch ($action) {
  'on'   { $cur.armed = $true }
  'off'  { $cur.armed = $false }
  'toggle' { $cur.armed = -not ($cur.armed -eq $true) }
  'path' {
    if (-not $file) { Write-Output "usage: room.ps1 path <file>"; exit 1 }
    $full = (Resolve-Path $file).Path
    $cur | Add-Member -Force -NotePropertyName textPath -NotePropertyValue $full
  }
  'text' {
    if (-not $file) { Write-Output "usage: room.ps1 text <file>   (copy file over prompt.txt)"; exit 1 }
    Copy-Item $file $text -Force
  }
}

$json = $cur | ConvertTo-Json -Depth 4
[System.IO.File]::WriteAllText($state, $json, (New-Object System.Text.UTF8Encoding($false)))

$len = 0
if (Test-Path $cur.textPath) { $len = (Get-Content $cur.textPath -Raw -Encoding utf8).Length }
Write-Output ("armed={0}  order={1}  chars={2}" -f $cur.armed, $cur.order, $len)
Write-Output ("state: {0}" -f $state)
Write-Output ("text : {0}" -f $cur.textPath)
Write-Output "note: a running DSH picks this up within ~1s; no restart needed for on/off."
