@echo off
echo 🚀 GitLab Push Script
echo.
echo הוראות:
echo 1. יצור פרויקט ב-GitLab: https://gitlab.com/projects/new
echo 2. העתק את ה-URL של הפרויקט החדש
echo 3. החלף YOUR_USERNAME בשורה הבאה בשם המשתמש האמיתי שלך
echo.

set /p username="הזן את שם המשתמש שלך ב-GitLab: "

echo.
echo מעדכן remote...
git remote set-url origin https://gitlab.com/%username%/israeli-planning-repository.git

echo.
echo מציג remote להזכרה:
git remote -v

echo.
echo דוחף לגיטלאב...
git push -u origin master

echo.
echo ✅ הושלם! אם נדרש authentication:
echo - Username: שם המשתמש שלך
echo - Password: Personal Access Token (לא סיסמה רגילה)
echo.
echo ליצירת Token: GitLab → Settings → Access Tokens
echo.
pause