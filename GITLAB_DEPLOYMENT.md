# 🚀 העלאה לגיטלאב - הוראות שלב אחר שלב

## 📋 דרישות מוקדמות
- חשבון GitLab (חינמי או בתשלום)
- Git מותקן על המחשב
- גישה לאינטרנט יציבה

## 🏗️ שלב 1: יצירת פרויקט חדש ב-GitLab

### אופציה A: דרך ממשק הווב
1. **התחבר ל-GitLab:** https://gitlab.com
2. **לחץ על "New Project"**
3. **בחר "Create blank project"**
4. **מלא פרטים:**
   - **Project name:** `israeli-planning-repository`
   - **Project slug:** `israeli-planning-repository`
   - **Description:** `Comprehensive database of Israeli urban planning documents with AI-optimized structure`
   - **Visibility:** Public/Internal/Private (לבחירתך)
   - **Initialize repository:** לא לסמן (יש לנו כבר repository)

### אופציה B: דרך GitLab CLI (אם מותקן)
```bash
# הורד ותתקן GitLab CLI
# Windows: chocolatey install gitlab-cli
# או הורד מ: https://gitlab.com/gitlab-org/cli

glab project create israeli-planning-repository --description "Comprehensive database of Israeli urban planning documents with AI-optimized structure"
```

## 🔗 שלב 2: חיבור ה-Repository המקומי ל-GitLab

```bash
# נווט לתיקיית הפרויקט
cd israeli-planning-repository

# הוסף remote לגיטלאב (החלף USERNAME בשם המשתמש שלך)
git remote add origin https://gitlab.com/USERNAME/israeli-planning-repository.git

# וודא שה-remote נוסף בהצלחה
git remote -v
```

## ⬆️ שלב 3: העלאת הקוד לגיטלאב

```bash
# דחף את הענף הראשי לגיטלאב
git push -u origin master

# אם יש בעיות עם authentication, השתמש ב-Personal Access Token
# עבור לגיטלאב → Settings → Access Tokens → Create token
```

### אם נדרש authentication:
```bash
# הגדר את הפרטים שלך (חד פעמי)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# או השתמש ב-Personal Access Token
git push https://oauth2:YOUR_TOKEN@gitlab.com/USERNAME/israeli-planning-repository.git master
```

## 📝 שלב 4: הגדרת הפרויקט ב-GitLab

### עריכת תיאור הפרויקט
1. עבור לפרויקט ב-GitLab
2. לחץ על Settings → General
3. הוסף תגיות (tags):
   - `urban-planning`
   - `israel`
   - `building-plans`
   - `gitMCP`
   - `AI-optimized`
   - `hebrew`
   - `english`

### הגדרת README כברירת מחדל
GitLab יזהה אוטומטית את הקובץ README.md ויציג אותו.

## 🎯 שלב 5: אופטימיזציות לגיטלאב

### הפעלת GitLab Pages (אופציונלי)
אם אתה רוצה אתר אינטרנט לפרויקט:

1. צור קובץ `.gitlab-ci.yml`:
```yaml
pages:
  stage: deploy
  script:
    - mkdir public
    - cp README.md public/index.md
    - echo "GitLab Pages deployed"
  artifacts:
    paths:
      - public
  only:
    - master
```

2. דחף את השינוי:
```bash
git add .gitlab-ci.yml
git commit -m "Add GitLab Pages configuration"
git push origin master
```

### הגדרת Issues Templates
צור קובץ `.gitlab/issue_templates/bug.md`:
```markdown
## 🐛 תיאור הבעיה

## 🔄 שלבים לשחזור
1. 
2. 
3. 

## 🎯 התנהגות צפויה

## 📱 סביבה
- OS: 
- Browser: 
- Version: 
```

### הגדרת Merge Request Templates
צור קובץ `.gitlab/merge_request_templates/feature.md`:
```markdown
## 🆕 תכונה חדשה

## 📋 שינויים
- [ ] 
- [ ] 
- [ ] 

## 🧪 בדיקות
- [ ] נבדק במערכת מקומית
- [ ] נבדקו כל הלינקים
- [ ] עבר בדיקת GitMCP

## 📸 צילומי מסך (אם רלוונטי)
```

## 🔄 שלב 6: עדכונים עתידיים

### הוספת תכנים חדשים
```bash
# לאחר הוספת קבצים או שינויים
git add .
git commit -m "הוסף [תיאור השינוי]

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

git push origin master
```

### יצירת branches לפיתוח
```bash
# צור branch חדש לתכונה
git checkout -b feature/add-tel-aviv-plans

# עבוד על השינויים...
git add .
git commit -m "Add Tel Aviv planning data"

# דחף ל-GitLab
git push origin feature/add-tel-aviv-plans

# צור Merge Request דרך ממשק GitLab
```

## 🎉 שלב 7: פרסום ושיתוף

### הגדרת קישורים
עדכן את הקישורים בקבצים הבאים:
- `package.json` → "repository.url"
- `README.md` → קישורים רלוונטיים
- תחליף `USERNAME` בשם המשתמש האמיתי

### שיתוף הפרויקט
- הוסף את הקישור לגיטלאב בפרופיל שלך
- שתף ברשתות חברתיות מקצועיות
- הוסף לקהילות תכנון עירוני ישראליות

## 📊 ניטור ותחזוקה

### בדיקות שוטפות
```bash
# בדוק שהכל עובד
git status
git log --oneline -5
```

### גיבוי מקומי
```bash
# צור גיבוי של הpository המקומי
git clone https://gitlab.com/USERNAME/israeli-planning-repository.git backup-repo
```

## 🆘 פתרון בעיות נפוצות

### שגיאת Authentication
```bash
# אם יש בעיה עם הרשאות
git config --global credential.helper store
git push origin master
# הזן username ו-personal access token
```

### קבצים גדולים מדי
אם יש קבצי PDF גדולים:
```bash
# התקן Git LFS
git lfs install
git lfs track "*.pdf"
git add .gitattributes
git commit -m "Add Git LFS for PDF files"
```

### שגיאות push
```bash
# אם יש קונפליקטים
git pull origin master
# פתור קונפליקטים ו-commit
git push origin master
```

## ✅ רשימת בדיקה סופית

- [ ] הפרויקט נוצר בהצלחה ב-GitLab
- [ ] הקוד הועלה במלואו
- [ ] README מוצג בצורה תקינה
- [ ] קישורים פועלים
- [ ] תגיות נוספו לפרויקט
- [ ] הרשאות מוגדרות נכון (Public/Private)
- [ ] השם והתיאור נכונים
- [ ] כל הקבצים הועלו (בדוק ב-GitLab)

## 🔗 קישורים שימושיים

- **GitLab Docs:** https://docs.gitlab.com/
- **Git Cheat Sheet:** https://training.github.com/downloads/github-git-cheat-sheet.pdf
- **GitLab CLI:** https://gitlab.com/gitlab-org/cli

---

**🎯 אחרי השלמת הצעדים האלה יהיה לך מאגר מקצועי ונגיש ב-GitLab מוכן לשימוש!**