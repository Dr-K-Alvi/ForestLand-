@echo off
cd /d "%~dp0"
python -m pip install --quiet --disable-pip-version-check --no-warn-script-location pywebview psutil >nul 2>&1
where pythonw >nul 2>&1 && (start "" pythonw "%~dp0forestland.py") || (start "" python "%~dp0forestland.py")
exit
