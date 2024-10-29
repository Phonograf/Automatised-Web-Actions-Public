@echo off
color 0a
$myshell = New-Object -ComObject WScript.Shell 
$myshell.SendKeys("{Enter}")
for %%a in (*.ovpn) do (
echo "%%a"
start %%a
)
pause