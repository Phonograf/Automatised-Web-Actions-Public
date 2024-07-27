:: We assume that you have CURL.
color 0a
:: installs fnm (Fast Node Manager)
winget install Schniz.fnm
:: download and install Node.js
fnm use --install-if-missing 21
:: verifies the right Node.js version is in the environment
node -v 
::  should print `v21.7.3`
:: verifies the right npm version is in the environment
npm -v 
::  should print `10.5.0`