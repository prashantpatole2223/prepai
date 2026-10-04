# PrepAI: AI-Powered Technical Interview Practice Platform

PrepAI is a full-stack interview practice platform built with **Next.js 14 (App Router)**, **TypeScript**, **PostgreSQL (Prisma)**, **Auth.js** and the **Google Gemini API**. Users save their skills, take a mock interview with AI-generated questions, get every answer scored with detailed feedback, and receive a final report with a study plan.

**Live Demo:** [prepai-coral-theta.vercel.app](https://prepai-coral-theta.vercel.app)
**Demo login:** `demo@prepai.dev` / `Demo@12345`

![Dashboard](./screenshots/dashboard.png)
![Live interview](./screenshots/interview.png)
![Report](./screenshots/report.png)

---

## Features

### Profile and skills
- Save name, target role and experience level (`FRESHER`, `JUNIOR`, `MID`, `SENIOR`).
- Tag-style skill input (Enter or comma to add, duplicate prevention, quick-add suggestions). Saved skills prefill new interviews.

### Interview generation
- Choose role, 1 to 8 skills, difficulty (`EASY`, `MEDIUM`, `HARD`) and question count (3, 5 or 8).
- Gemini generates questions spread across the selected skills, mixing conceptual, scenario and practical questions. Output is validated with Zod and retried if invalid.

### Live interview
- One question at a time with a progress bar and a character counter (up to 4000 characters).
- Each answer is scored from 0 to 10 using a rubric: correctness (50%), depth (30%), clarity (20%).
- Feedback panel with strengths, weaknesses, a model answer and tips.
- Refreshing or reopening an in-progress interview resumes at the first unanswered question.

### Final report
- Overall score (average of answer scores, computed on the server) and a readiness level: `NOT_READY`, `NEEDS_PRACTICE`, `ALMOST_READY` or `INTERVIEW_READY`.
- AI summary, top strengths and areas to improve.
- Per-topic score bars computed from the saved answers.
- Prioritized study plan, plus an expandable review of every question and answer.

### Dashboard and history
- Stats: interviews taken, average score, best score and completion rate.
- Score trend line chart (Recharts) and a full interview history page.

### Security and reliability
- Auth.js credentials login with bcrypt-hashed passwords and JWT sessions.
- Middleware protects `/dashboard`, `/interview/*`, `/history` and `/profile`.
- Every interview query is scoped to the logged-in user.
- Zod validation on all API inputs and all AI outputs.
- Retries with exponential backoff and a fallback model when the AI API is overloaded.
- In-memory rate limiting on AI endpoints (10 requests per minute per user).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router), TypeScript (strict mode) |
| Styling | Tailwind CSS, lucide-react |
| Database | PostgreSQL (Neon) |
| ORM | Prisma |
| Auth | Auth.js (NextAuth v5) with Credentials provider, bcryptjs |
| AI | Google Gemini via `@google/genai` |
| Validation | Zod |
| Charts | Recharts |
| Deployment | Vercel + Neon |

---

## Environment Variables

Create a `.env` file in the project root (see `.env.example`):

```env
# PostgreSQL connection string (Neon or local)
DATABASE_URL="postgresql://user:password@host:5432/prepai?sslmode=require"

# Secret for Auth.js sessions (generate with: openssl rand -base64 32)
AUTH_SECRET="your-generated-secret"

# Required when deploying (e.g. Vercel)
AUTH_TRUST_HOST=true

# Google Gemini API key (from Google AI Studio)
GEMINI_API_KEY="your-gemini-api-key"

# Gemini model names. Check Google AI Studio for currently available models.
GEMINI_MODEL="your-primary-model"
GEMINI_FALLBACK_MODEL="your-fallback-model"
```

---

## Getting Started

### 1. Clone and install
```bash
git clone https://github.com/prashantpatole2223/prepai.git
cd prepai
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
```
Fill in your database URL, auth secret and Gemini API key.

### 3. Create the database tables
```bash
npx prisma db push
```

### 4. (Optional) Seed demo data
```bash
npx prisma db seed
```
Creates a demo user (`demo@prepai.dev` / `Demo@12345`) with two completed sample interviews.

### 5. Run the app
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

### 6. Production build
```bash
npm run build
npm start
```

---

## Project Structure

```
prisma/
  schema.prisma                  # User, Interview, Question, Answer models
  seed.ts                        # Demo user and sample interviews
src/
  auth.ts, auth.config.ts        # Auth.js configuration
  middleware.ts                  # Route protection
  lib/
    prisma.ts                    # Prisma client singleton
    gemini.ts                    # Gemini client: JSON parsing, retries, fallback, typed errors
    prompts.ts                   # Prompts for questions, evaluation and report
    validators.ts                # Zod schemas for API bodies and AI responses
    ratelimit.ts                 # In-memory rate limiter
  components/                    # Navbar, SkillInput, QuestionCard, ScoreBadge,
                                 # FeedbackPanel, ProgressChart, LoadingState
  app/
    page.tsx                     # Landing page
    (auth)/login, signup         # Auth pages
    (app)/dashboard              # Stats, chart, recent interviews
    (app)/profile                # Profile and skills
    (app)/history                # Past interviews
    (app)/interview/new          # Interview setup
    (app)/interview/[id]         # Live interview
    (app)/interview/[id]/report  # Final report
    api/                         # auth, profile, interviews (create, answer, complete)
```

---

## Database Schema

- **User** has many **Interviews**.
- **Interview** has many **Questions** (cascade delete).
- **Question** has at most one **Answer** (score 0 to 10, feedback stored as JSON).

---

## Possible Improvements

- Redis-based rate limiting (the in-memory limiter resets on serverless platforms).
- Resume upload with embeddings and pgvector, so questions come from the candidate's real experience.
- Streaming AI responses.