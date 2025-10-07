@echo off
echo Pushing Department Calendar to GitHub...

REM Initialize git repository
git init

REM Add all files except README.md and DEPLOYMENT.md
git add index.html
git add admin.html
git add style.css
git add script.js
git add admin.js
git add events.json

REM Commit the files
git commit -m "Initial commit: Department Calendar"

REM Add remote repository
git remote add origin https://github.com/aimaiml/calendar.git

REM Set main branch
git branch -M main

REM Push to GitHub
git push -u origin main

echo.
echo Calendar pushed to GitHub successfully!
echo Public URL: https://aimaiml.github.io/calendar/
echo Admin URL: https://aimaiml.github.io/calendar/admin.html
echo.
echo Remember to enable GitHub Pages in repository settings!
pause