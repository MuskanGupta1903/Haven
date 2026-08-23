# CrisisKit Lite - Setup Guide

## Quick Start (No Setup Required)

CrisisKit works **out of the box** with zero configuration:

```bash
npm install
npm run dev
```

Data is stored in your browser's localStorage. Perfect for:
- Testing and demos
- Single-device use
- Privacy-focused scenarios

**Backup your data**: Use the "Export Backup" button to save your data as JSON.

---

## Optional: Cloud Storage Backend

Want multi-device sync, team collaboration, or persistent cloud storage? Choose one:

### Option A: Supabase (Recommended) ⭐

**Why Supabase?**
- ✅ Free tier (500MB, 50K monthly active users)
- ✅ Real-time updates (see changes instantly)
- ✅ Built-in authentication
- ✅ Easy SQL queries
- ✅ Works in browser (no server needed)

**Setup (5 minutes)**:

1. Create a free account at [supabase.com](https://supabase.com)

2. Create a new project

3. Run the SQL schema:
   - Go to SQL Editor in your Supabase dashboard
   - Copy and paste `/database/supabase-schema.sql`
   - Click "Run"

4. Get your credentials:
   - Go to Project Settings → API
   - Copy "Project URL" and "anon public" key

5. Create `.env.local`:
   ```bash
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

6. Install dependency:
   ```bash
   npm install @supabase/supabase-js
   ```

7. Restart dev server:
   ```bash
   npm run dev
   ```

Done! Your app now uses Supabase. Check console for "✅ Using Supabase backend".

---

### Option B: Google Sheets (Advanced)

**Why Google Sheets?**
- ✅ Volunteers are familiar with Sheets interface
- ✅ Easy data export
- ✅ Can edit directly in Sheets

**Limitations**:
- ❌ Requires Cloudflare Workers or similar backend
- ❌ More complex setup
- ❌ Rate limits (100 requests/100 seconds)

**Setup**:

This requires a backend API (like Cloudflare Workers) because browsers can't directly access Google Sheets API with service accounts.

See `/docs/CLOUDFLARE_WORKERS_SETUP.md` for detailed instructions.

---

## Optional: AI Classification

Enable Gemini AI for smart urgency classification:

1. Get free API key: [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

2. Add to `.env.local`:
   ```bash
   VITE_GEMINI_API_KEY=your-key-here
   ```

3. Click "Run AI Triage" button in dashboard

**Fallback**: Without API key, CrisisKit uses keyword-based heuristic classification.

---

## Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub

2. Go to [vercel.com/new](https://vercel.com/new)

3. Import your repository

4. Add environment variables (if using Supabase/Gemini):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_GEMINI_API_KEY`

5. Deploy!

Vercel auto-detects Vite and configures everything.

### Deploy to Cloudflare Pages

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy `dist` folder to Cloudflare Pages

3. Set build command: `npm run build`

4. Set output directory: `dist`

---

## Architecture

```
┌─────────────────────────────────────┐
│   CrisisKit Frontend (React + Vite) │
└─────────────────┬───────────────────┘
                  │
         ┌────────┴────────┐
         │ repoFactory.ts  │ (Auto-selects backend)
         └────────┬────────┘
                  │
      ┌───────────┼───────────┐
      │           │           │
      ▼           ▼           ▼
┌──────────┐ ┌──────────┐ ┌─────────────┐
│InMemory  │ │Supabase  │ │GoogleSheets │
│(localStorage)│(Direct)│ │(via Workers)│
└──────────┘ └──────────┘ └─────────────┘
```

**Priority Order**:
1. Supabase (if `VITE_SUPABASE_URL` is set)
2. Google Sheets (if `GOOGLE_SHEETS_*` env vars are set)
3. localStorage (default fallback)

---

## Security Notes

### For Public Demos
- ✅ Use Supabase with Row Level Security (RLS)
- ✅ Enable public read, authenticated write
- ⚠️ Default schema allows anyone to write (for demo)
- 🔒 Modify RLS policies for production

### For Production
- Use authentication (Supabase Auth)
- Restrict write access to authenticated users
- Add rate limiting
- See commented policies in `supabase-schema.sql`

---

## Need Help?

- 📖 Read the main [README.md](./README.md)
- 💬 Open an issue on GitHub
- 🐦 Tweet at the maintainers

---

**Remember**: CrisisKit works perfectly fine with **zero setup**. Cloud storage is **optional** for specific use cases.
