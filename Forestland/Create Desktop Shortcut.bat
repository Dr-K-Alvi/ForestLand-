@echo off
cd /d "%~dp0"
for /f "delims=" %%i in ('where pythonw') do set PYW=%%i
powershell -NoProfile -Command "$s=(New-Object -ComObject WScript.Shell).CreateShortcut([Environment]::GetFolderPath('Desktop')+'\Forestland.lnk');$s.TargetPath='%PYW%';$s.Arguments='\"%~dp0forestland.py\"';$s.WorkingDirectory='%~dp0';$s.IconLocation='%~dp0Forestland.ico';$s.Save()"
echo Shortcut created on your Desktop.
pause
