# Scroll upload orchestrator — see scripts/scroll_upload.py
$env:PYTHONIOENCODING = "utf-8"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Split-Path -Parent $scriptDir
Set-Location $repoRoot
py -3.14 scripts/scroll_upload.py @args
exit $LASTEXITCODE
