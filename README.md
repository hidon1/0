# פורום הצליאק החרדי

אתר פורום לקהילת הצליאק החרדית.

## אינטגרציה עם Google Apps Script

האתר משתמש ב-Google Apps Script כשרת Backend לטיפול בהודעות ופרסומים. להלן הוראות להגדרת ה-Backend:

### שלב 1: יצירת פרויקט Apps Script

1. פתח [Google Apps Script](https://script.google.com/) והתחבר עם חשבון Gmail שלך
2. לחץ על "פרויקט חדש" (New project)
3. העתק את תוכן הקובץ `apps-script/Code.gs` לתוך עורך הקוד
4. עדכן את המשתנים הבאים בראש הקובץ:
   - `SPREADSHEET_ID`: מזהה גיליון Google Sheets שלך (מה-URL)
   - `SEND_FROM_EMAIL`: כתובת האימייל ממנה יישלחו הודעות (חייבת להיות אליאס תקין)
   - `CONTACT_RECIPIENT`: כתובת האימייל אליה יישלחו הודעות יצירת קשר

### שלב 2: הגדרת OAuth Scopes

1. בעורך Apps Script, לחץ על סמל הגלגל (Project Settings)
2. בקטע "Manifest file", סמן את "Show 'appsscript.json' manifest file in editor"
3. חזור לעורך והמתן שיופיע קובץ `appsscript.json` בצד שמאל
4. העתק את תוכן הקובץ `apps-script/appsscript.json` מהריפו לתוך הקובץ שב-Apps Script
5. שמור את השינויים

### שלב 3: אישור הרשאות Gmail

1. בעורך Apps Script, בחר את הפונקציה `checkAliases` מהתפריט הנפתח
2. לחץ על "Run" (הפעל)
3. יופיע בקשה לאישור הרשאות - אשר את כל ההרשאות הנדרשות
4. בדוק את ה-Log כדי לראות את רשימת האליאסים הזמינים בחשבון שלך

### שלב 4: הגדרת אליאס Gmail

כדי ששליחת האימייל תעבוד, עליך להגדיר את `SEND_FROM_EMAIL` כאליאס ב-Gmail:

1. כנס להגדרות Gmail (Settings → See all settings)
2. לחץ על הטאב "Accounts and Import"
3. בקטע "Send mail as", לחץ על "Add another email address"
4. הוסף את כתובת האימייל `zm0548407450@gmail.com` (או כל כתובת אחרת שתרצה)
5. אשר את הכתובת לפי ההוראות שתקבל
6. לאחר מכן, הכתובת תופיע ברשימת האליאסים שמוחזרת מ-`checkAliases()`

### שלב 5: פריסת Web App

1. בעורך Apps Script, לחץ על "Deploy" → "New deployment"
2. בחר סוג: "Web app"
3. הגדר:
   - **Description**: תיאור לפריסה (למשל "Production v1")
   - **Execute as**: **Me** (חשוב מאוד! זה מאפשר ל-Script לשלוח אימייל מטעמך)
   - **Who has access**: **Anyone** או **Anyone with the link** (כדי לאפשר לאתר לגשת)
4. לחץ על "Deploy"
5. העתק את ה-**Web App URL** שמסתיים ב-`/exec`

### שלב 6: עדכון קוד האתר

1. פתח את הקובץ `public/js/contact-jsonp.js`
2. מצא את השורה:
   ```javascript
   const GS_EXEC_URL = 'https://script.google.com/macros/s/REPLACE_WITH_YOUR_DEPLOYMENT_ID/exec';
   ```
3. החלף את `REPLACE_WITH_YOUR_DEPLOYMENT_ID` ב-URL המלא שהעתקת בשלב הקודם
4. שמור את הקובץ

### שלב 7: בדיקה

1. פרוס את האתר עם השינויים החדשים
2. נסה לשלוח הודעת יצירת קשר דרך האתר
3. וודא שההודעה התקבלה ב-Gmail וגם נשמרה ב-Google Sheets
4. בדוק ב-Logs של Apps Script (View → Logs) שאין שגיאות

### פתרון בעיות

#### שגיאת CORS
- אם עדיין יש שגיאת CORS, וודא שהאתר משתמש ב-JSONP (קובץ `contact-jsonp.js`) ולא ב-`fetch()` רגיל
- JSONP מתקשר עם Apps Script דרך GET ולא POST, מה שעוקף את מגבלות CORS

#### שגיאת הרשאות Gmail
- וודא שהפעלת את `checkAliases()` ואישרת את ההרשאות
- וודא ש-Web App פרוס כ-"Execute as: Me"
- וודא שהכתובת ב-`SEND_FROM_EMAIL` היא אליאס תקין בחשבון Gmail שלך

#### הודעה לא נשלחת
- בדוק את ה-Logs ב-Apps Script (View → Logs או View → Executions)
- וודא שהגיליון (Spreadsheet) קיים והמזהה שלו נכון
- וודא שיש הרשאות כתיבה לגיליון

## מבנה הקבצים

```
/
├── index.html              # דף הבית הראשי של האתר
├── apps-script/            # קבצי הפניה ל-Google Apps Script
│   ├── Code.gs            # הלוגיקה של ה-Backend
│   └── appsscript.json    # הגדרות OAuth Scopes
├── public/
│   └── js/
│       └── contact-jsonp.js  # ספריית JSONP לקריאה ל-Apps Script
└── README.md              # המסמך הזה
```

## טכנולוגיות

- HTML5, CSS3, JavaScript
- Google Apps Script (Backend)
- Google Sheets (Database)
- Gmail API (שליחת מיילים)
- JSONP (תקשורת ללא CORS)

## רישיון

כל הזכויות שמורות © 2024
