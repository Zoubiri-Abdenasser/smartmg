# إدارة المخزون الذكي – V1.2

تطبيق ويب عربي RTL + **PostgreSQL** على **Render**.

## البنية

```
Frontend (React/Vite)  →  API (Express)  →  PostgreSQL
```

- الواجهة: React + Zustand + TanStack Router
- الخادم: Express في مجلد `server/`
- القاعدة: PostgreSQL (Render أو محلي)

## التشغيل المحلي

### 1) قاعدة PostgreSQL

أنشئ قاعدة ثم:

```bash
cd server
cp .env.example .env
# عدّل DATABASE_URL
npm install
npm run db:init
npm run dev
```

### 2) الواجهة

```bash
# من جذر المشروع
npm install
npm run dev
```

افتح http://localhost:3000 — الطلبات تُوجَّه عبر proxy إلى API على المنفذ 3001.

## النشر على Render

### الطريقة أ: Blueprint (موصى بها)

1. ارفع المشروع إلى GitHub
2. في [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint**
3. اختر المستودع `smartmg`
4. Render يقرأ `render.yaml` وينشئ:
   - Web Service
   - PostgreSQL
5. انتظر انتهاء البناء

### الطريقة ب: يدويًا

1. **New → PostgreSQL** (Free) — انسخ Internal Database URL
2. **New → Web Service**
   - Runtime: Node
   - Build: `npm install && npm run build && cd server && npm install`
   - Start: `cd server && npm start`
   - Environment:
     - `DATABASE_URL` = رابط PostgreSQL
     - `NODE_ENV` = `production`

الجداول تُنشأ تلقائيًا عند أول تشغيل.

## المتغيرات

| المتغير | الوصف |
|---------|--------|
| `DATABASE_URL` | رابط PostgreSQL (مطلوب للخادم) |
| `PORT` | منفذ الخادم (Render يضبطه تلقائيًا) |
| `VITE_API_URL` | اختياري — للواجهة إذا فُصلت عن API |

## العملة

دينار جزائري (د.ج / DZD)
