# Bee backend setup — your ~15-minute checklist

This is the only part I can't do for you (it needs your own accounts). Do these once and give me **two values**; I'll write all the code (login, sync, and the Sunday email).

**Stack:** Supabase (Frankfurt, EU) for login + data + the weekly job · Resend for sending email.
**Cost:** ~€0/month + one **domain ~€10/year** (needed so emails don't get marked spam).

---

## Step 1 — A domain (~€10/yr, one-time)
Register any domain (e.g. `bee-planner.eu`) at any registrar (Namecheap, Cloudflare, etc.).
Only needed for trustworthy email. *(If you want to skip this for now, we can test with Resend's shared domain — emails may look less polished.)*

## Step 2 — Resend (email sender)
1. Sign up at **resend.com**.
2. Add your domain → choose the **EU (Ireland)** sending region.
3. Add the DNS records it shows (SPF TXT, DKIM CNAME, DMARC TXT) at your registrar. Wait for **Verified**.
4. Create an **API key**. Keep it secret — it goes into Supabase, never into the app.

## Step 3 — Supabase (login + data + weekly job)
1. Sign up at **supabase.com** → **New project** → **Region: Central EU (Frankfurt)**. Save the DB password.
2. Project Settings → API → copy **Project URL** and **anon public key**. ⬅️ *These two are what you send me — they're safe to put in the app.*
3. Authentication → SMTP → enable **custom SMTP**, paste Resend's SMTP details, sender `no-reply@your-domain`.
4. Authentication → URL Configuration → set Site URL + redirect allow-list to **https://zafforatrader-ops.github.io/bee-planner/**
5. (I'll give you 3 SQL snippets + the Edge Function code to paste — the table, the security rules, and the Sunday cron.)

---

## What you send me
Just these two (safe to share — they're public by design):
- **Supabase Project URL:** `https://xxxx.supabase.co`
- **Supabase anon key:** `eyJ...`

The **Resend API key and DB password never leave Supabase** — you paste those into Supabase yourself.

---

## Things to know (I'll build these in)
- **GDPR:** consent checkbox at login, one-click **unsubscribe** in every email, **delete-my-data** button, EU (Frankfurt) hosting. Minimal data: just your email + the plan blob.
- **Deliverability:** the SPF/DKIM/DMARC records in Step 2 are what keep emails out of spam.
- **Free-project pause:** Supabase free projects sleep after 7 days idle; I'll add a tiny daily keep-alive so login never breaks.
- **Sunday timing:** the job runs in UTC; I'll set it to hit ~08:00 Munich time (and note it shifts 1h with daylight saving).
- **Passwordless = anyone with your inbox can log in.** Fine for meal data; just know it's inbox-based, not password-based.
