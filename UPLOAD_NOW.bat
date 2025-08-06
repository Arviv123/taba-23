@echo off
echo 🚀 העלאה מיידית לגיטהאב
echo.
echo ======================================
echo    מאגר תוכניות הבנייה הישראלי
echo    Israeli Planning Repository
echo ======================================
echo.
echo השלבים:
echo 1. לך ל-GitHub ויצור repository חדש
echo 2. שם: israeli-planning-repository
echo 3. אל תסמן שום דבר נוסף
echo 4. חזור כאן והרץ את הסקריפט
echo.

echo פתיחת GitHub ליצירת repository...
start https://github.com/new

echo.
echo חכה עד שיצרת את הrepository ולחץ Enter
pause

echo.
set /p username="הזן את שם המשתמש שלך בGitHub: "

echo.
echo מוחק remote ישן...
git remote remove origin 2>nul

echo מוסיף remote חדש...
git remote add origin https://github.com/%username%/israeli-planning-repository.git

echo.
echo בודק remote:
git remote -v

echo.
echo דוחף את כל הפרויקט...
git push -u origin master

if %errorlevel% equ 0 (
    echo.
    echo ✅ הצלחה! הפרויקט הועלה בהצלחה
    echo.
    echo 🌐 הקישור לפרויקט שלך:
    echo https://github.com/%username%/israeli-planning-repository
    echo.
    echo העתק את הקישור הזה!
    echo.
    
    echo פתיחת הפרויקט בדפדפן...
    start https://github.com/%username%/israeli-planning-repository
) else (
    echo.
    echo ❌ שגיאה בהעלאה
    echo בדוק שיצרת את הrepository נכון
    echo ושהשם israeli-planning-repository מדויק
)

echo.
pause