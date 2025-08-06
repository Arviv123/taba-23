@echo off
echo 🚀 העלאה למאגר חדש - סקריפט אוטומטי
echo.
echo שלבים:
echo 1. יצור repository חדש ב-GitHub: https://github.com/new
echo 2. שם: israeli-planning-repository  
echo 3. תיאור: מאגר מקיף של תוכניות בנייה ישראליות
echo 4. אל תסמן שום תיבה (README, gitignore וכו')
echo.

set /p username="הזן את שם המשתמש שלך ב-GitHub: "

echo.
echo מוסיף remote חדש...
git remote add origin https://github.com/%username%/israeli-planning-repository.git

echo.
echo בודק remote:
git remote -v

echo.
echo דוחף לגיטהאב החדש...
git push -u origin master

echo.
echo ✅ הושלם בהצלחה!
echo.
echo הקישור לפרויקט החדש שלך:
echo https://github.com/%username%/israeli-planning-repository
echo.
echo העתק את הקישור הזה ושלח לי!
echo.
pause