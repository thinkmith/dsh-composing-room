@echo off
rem Double-click installer for dsh-composing-room.
rem ASCII only, CRLF line endings: cmd.exe and PS 5.1 both read this file.
setlocal
cd /d "%~dp0"
echo.
echo   dsh-composing-room installer
echo   -----------------------------
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1" %*
set RC=%ERRORLEVEL%
echo.
if "%RC%"=="0" (
  echo   Finished. Restart DeepSeek Harness once, then click the pill
  echo   next to the composer to arm the section.
) else (
  echo   Installer exited with code %RC%. Scroll up for the reason.
)
echo.
pause
endlocal
