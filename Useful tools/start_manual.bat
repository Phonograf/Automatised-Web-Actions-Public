@echo off
color 0a
echo Manual calling
set /p "id=Enter ID: "
echo Launching with %id%
start node self.js manual %id%