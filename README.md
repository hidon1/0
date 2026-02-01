# פורום הצליאק החרדי - Forum

## אינטגרציה עם Google Apps Script

פרויקט זה משתמש ב-Google Apps Script לניהול פניות יצירת קשר ופוסטים בפורום. כדי להימנע מבעיות CORS, השימוש הוא ב-JSONP במקום fetch רגיל.

### שלב 1: יצירת פרויקט Google Apps Script

1. פתח [Google Apps Script](https://script.google.com/) והתחבר עם חשבון Google שלך.
2. צור פרויקט חדש (New Project).
3. העתק את התוכן של הקובץ `apps-script/Code.gs` מהמאגר הזה והדבק אותו בעורך Apps Script.
4. שמור את הפרויקט (File → Save או Ctrl+S).

### שלב 2: הגדרת קונפיגורציה

עדכן את המשתנים הבאים בתחילת הקובץ `Code.gs`:

```javascript
const SPREADSHEET_ID = "YOUR_SPREADSHEET_ID";  // מזהה הגיליון האלקטרוני שלך
const SEND_FROM_EMAIL = "your-email@gmail.com";  // כתובת האימייל ממנה נשלחים המיילים
const CONTACT_RECIPIENT = "your-email@gmail.com";  // כתובת האימייל שמקבלת את פניות יצירת הקשר
```

### שלב 3: הגדרת OAuth Scopes

1. פתח את הגדרות הפרויקט (Project Settings) באמצעות האייקון של גלגל השיניים.
2. תחת "appsscript.json", סמן את "Show appsscript.json manifest file in editor".
3. חזור לעורך וערוך את `appsscript.json`.
4. העתק את התוכן מהקובץ `apps-script/appsscript.json` מהמאגר או ודא שה-`oauthScopes` כוללים:
   - `https://www.googleapis.com/auth/spreadsheets`
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/gmail.compose`
   - `https://www.googleapis.com/auth/gmail.modify`
   - `https://www.googleapis.com/auth/userinfo.email`

### שלב 4: אישור הרשאות Gmail

1. בעורך Apps Script, הפעל את הפונקציה `checkAliases` (בחר אותה מהתפריט הנפתח ליד כפתור ה-Run).
2. לחץ על Run - תופיע בקשה לאישור הרשאות.
3. אשר את כל ההרשאות הנדרשות (לחץ על "Advanced" → "Go to [project name] (unsafe)" אם מופיעה אזהרה).
4. בדוק את הלוגים (View → Logs) כדי לראות את רשימת כתובות האימייל הזמינות.

### שלב 5: הגדרת Gmail Alias

אם אתה רוצה לשלוח מיילים מכתובת ספציפית (SEND_FROM_EMAIL):

1. פתח את [Gmail Settings](https://mail.google.com/mail/u/0/#settings/accounts).
2. גלול ל-"Send mail as".
3. לחץ על "Add another email address" והוסף את הכתובת שברצונך להשתמש בה.
4. אמת את הכתובת על ידי מעקב אחר ההוראות שנשלחו אליך במייל.
5. ודא ש-`SEND_FROM_EMAIL` ב-Code.gs תואם לכתובת שהוספת.

**הערה:** אם הכתובת אינה מוגדרת כ-alias, המערכת תשלח מיילים מכתובת ברירת המחדל של החשבון.

### שלב 6: פריסת Web App

1. בעורך Apps Script, לחץ על Deploy → New deployment.
2. לחץ על "Select type" ובחר "Web app".
3. מלא את הפרטים:
   - **Description:** תיאור (לדוגמה: "Forum Backend v1")
   - **Execute as:** בחר **Me** (חשוב מאוד!)
   - **Who has access:** בחר **Anyone** או **Anyone with the link**
4. לחץ Deploy.
5. העתק את כתובת ה-**Web app URL** (מסתיימת ב-`/exec`).

### שלב 7: עדכון קוד הלקוח

1. פתח את הקובץ `public/js/contact-jsonp.js` במאגר הקוד שלך.
2. עדכן את המשתנה `GS_EXEC_URL` עם כתובת ה-Web App שהעתקת:

```javascript
const GS_EXEC_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';
```

### שלב 8: שימוש ב-JSONP במקום Fetch

הקובץ `index.html` שודרג לשימוש ב-JSONP במקום fetch רגיל. זה נעשה על ידי:

1. הוספת import של `public/js/contact-jsonp.js`.
2. שימוש בפונקציה `sendContact()` במקום `fetch()` בטופס יצירת הקשר.

**יתרונות JSONP:**
- אין בעיות CORS כי זה לא XMLHttpRequest או fetch.
- תואם לכל הדפדפנים.

**מגבלות JSONP:**
- משתמש ב-GET בלבד, לכן גודל הנתונים מוגבל (~2KB).
- לא מתאים להעלאת קבצים או נתונים גדולים.

### בדיקה

1. פתח את האתר שלך בדפדפן.
2. מלא את טופס יצירת הקשר ושלח.
3. בדוק שהמייל הגיע ל-`CONTACT_RECIPIENT`.
4. בדוק שהנתונים נוספו לגיליון האלקטרוני (ייווצר sheet בשם "Contact" אם לא קיים).
5. בדוק את ה-DevTools Console - לא אמורות להיות שגיאות CORS.

### פתרון בעיות נפוצות

**שגיאת הרשאות Gmail:**
- ודא שהפעלת את הפונקציה `checkAliases` ואישרת את כל ההרשאות.
- ודא שה-Web App deployed עם "Execute as: Me".
- בדוק שה-`oauthScopes` כוללים את כל ההרשאות הנדרשות ב-`appsscript.json`.

**שגיאת CORS:**
- ודא שהקובץ `public/js/contact-jsonp.js` משמש בפועל.
- בדוק שה-`GS_EXEC_URL` נכון ומעודכן.
- ודא שהטופס קורא ל-`sendContact()` ולא ל-`fetch()`.

**מיילים לא נשלחים:**
- בדוק שה-`SEND_FROM_EMAIL` הוא alias תקין ב-Gmail Settings.
- בדוק את הלוגים ב-Apps Script (View → Executions) לשגיאות.

**גוף הודעה ריק:**
- המערכת דורשת שהגוף הטקסטואלי של המייל לא יהיה ריק.
- ודא שהטופס שולח את שדה ה-`message`.

## מבנה הפרויקט

```
forum/
├── apps-script/
│   ├── Code.gs              # Google Apps Script backend logic
│   └── appsscript.json      # OAuth scopes configuration
├── public/
│   └── js/
│       └── contact-jsonp.js # JSONP helper library
├── index.html               # Main HTML file (updated for JSONP)
└── README.md               # This file
```

## תרומה

תרומות מתקבלות בברכה! אנא פתח issue או pull request.

## רישיון

פרויקט זה הוא קוד פתוח ונמצא תחת רישיון MIT (או כל רישיון אחר שתבחר).
