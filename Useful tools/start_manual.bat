@echo off
color 0a
echo Manual calling
cd ../Browser
set /p "id=Enter ID: "
echo Launching with %id%
start node self.js manual %id%