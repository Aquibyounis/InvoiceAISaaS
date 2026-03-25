# AI Invoice Recovery System

A full-stack B2B SaaS application that automatically sends AI-generated escalating payment reminders for overdue invoices.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local: `mongod` or Docker)

### 1. Start MongoDB
```bash
mongod
```

### 2. Server Setup
```bash
cd Server
npm install
cp .env.example .env   # Fill in your values
npm run dev            # Starts on http://localhost:5000
```

### 3. UI Setup
```bash
cd UI
npm install
npm run dev            # Starts on http://localhost:5173
```

---

## 📁 Project Structure

```
AI_Invoice_SAAS/
├── Server/                 → Node.js + Express + MongoDB
│   ├── src/
│   │   ├── config/        → DB connection
│   │   ├── models/        → User, Invoice, ReminderLog
│   │   ├── routes/        → auth, invoices, reminders, payments, dashboard
│   │   ├── controllers/   → Business logic
│   │   ├── middleware/     → JWT auth, error handler
│   │   └── services/      → AI email, cron, nodemailer, Razorpay
│   └── server.js
│
└── UI/                    → React + Vite + Tailwind CSS
    └── src/
        ├── api/           → Axios instance + endpoint fns
        ├── context/       → AuthContext (JWT state)
        ├── components/    → Sidebar, Modal, StatCard
        ├── pages/         → Landing, Login, Register, Dashboard, Invoices, Reminders, Pricing
        └── utils/         → Formatters, date helpers
```

---

## 🤖 AI Email Escalation Tones

| Days Overdue | Tone       | Style                          |
|-------------|------------|-------------------------------|
| 1–7 days    | **Polite** | Friendly reminder              |
| 8–14 days   | **Reminder** | Professional follow-up       |
| 15–21 days  | **Firm**   | Urgent, consequences mentioned |
| 22+ days    | **Final**  | Legal warning, 48h ultimatum   |

> Set `OPENAI_API_KEY` in `.env` to use real GPT-4 generation. Falls back to premium templates if not set.

---

## 💳 Razorpay Plans
- **Lifetime** — ₹4,999 one-time → `POST /api/payments/create-order`
- **Monthly** — ₹999/mo → `POST /api/payments/create-subscription`
- **Webhook** — `POST /api/payments/webhook` (for subscription lifecycle events)

---

## 🔧 Environment Variables (Server/.env)

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for signing JWT tokens |
| `SMTP_*` | Email SMTP credentials (leave blank for Ethereal) |
| `OPENAI_API_KEY` | Optional — enables real AI email generation |
| `RAZORPAY_KEY_ID` | Razorpay API key |
| `RAZORPAY_KEY_SECRET` | Razorpay secret |
| `RAZORPAY_PLAN_ID` | Monthly subscription plan ID |

---

## 🧪 Dev Utilities

### Manually trigger reminders
```bash
curl -X POST http://localhost:5000/api/reminders/trigger \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```
> Only works in `NODE_ENV=development`

### Health check
```bash
curl http://localhost:5000/api/health
```
