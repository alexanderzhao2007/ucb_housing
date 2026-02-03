# Next.js + Supabase + ShadCN Template

A beginner-friendly template for building full-stack applications with authentication and database storage.

## What's Included

- **Next.js 15** with App Router and TypeScript
- **Supabase** for authentication and database
- **ShadCN UI** for beautiful, accessible components
- **Notes App** example demonstrating:
  - User signup and login
  - Protected routes
  - Create, read, update, delete (CRUD) operations

## Quick Start

### 0. Install pnpm (if you don't have it yet)

This project expects pnpm. The simplest way is to use Corepack (ships with Node.js):

```bash
corepack enable
corepack prepare pnpm@10.13.1 --activate
```

Verify:

```bash
pnpm --version
```

### 1. Copy This Template

```bash
cp -r templates/notes-app my-project
cd my-project
```

### 2. Set Up Git (required for Husky hooks)

Husky installs Git hooks during `pnpm install`, but it only works if a `.git` folder exists.

If you already have a GitHub account:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
```

Create an empty repository on GitHub, then connect and push:

```bash
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

If you don't have a GitHub account yet (local Git only):

```bash
git init
git add .
git commit -m "Initial commit"
```

Then install dependencies:

```bash
pnpm install
```

### 3. Set Up Supabase

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to **Settings > API**
4. Copy the **Project URL** (used as `NEXT_PUBLIC_SUPABASE_URL`)
5. Copy the **anon public** API key (used as `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

The Project URL tells the app which Supabase instance to talk to. The anon public key is safe to use in the browser and lets your app make requests that are allowed by Row Level Security policies.

### 4. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://gjkzzuqjiekpkebybmpw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_isLrYzMnISWRMZdguWwpIQ_ia1vXZFO
```

### 5. Set Up the Database

Install the Supabase CLI if you haven't already:

```bash
pnpm add -g supabase
```

Log in to your Supabase account:

```bash
supabase login
```

Link your project (you'll need your project ID from the Supabase dashboard URL):

```bash
supabase link
```

Push the migrations to your database:

```bash
supabase db push
```

### 6. Run the Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
app/
├── page.tsx                    # Landing page
├── (auth)/
│   ├── login/page.tsx         # Login page
│   └── signup/page.tsx        # Signup page
├── (protected)/
│   ├── dashboard/page.tsx     # Dashboard (requires login)
│   └── notes/                 # Notes pages (requires login)
└── api/
    ├── auth/                  # Authentication endpoints
    └── notes/                 # Notes CRUD endpoints

components/
├── ui/                        # ShadCN UI components
├── auth/                      # Login/signup forms
├── notes/                     # Note-related components
└── layout/                    # Header, footer

lib/
└── supabase/
    ├── client.ts              # For client components
    ├── server.ts              # For server components & API routes
    └── middleware.ts          # For auth middleware
```

## Key Concepts

### Authentication Flow

1. User signs up with email/password
2. Supabase sends a confirmation email
3. User clicks the link to confirm
4. User can now log in
5. Middleware protects routes that require authentication

### Supabase Clients

There are two ways to connect to Supabase:

- **Browser Client** (`lib/supabase/client.ts`): Use in components with `"use client"`
- **Server Client** (`lib/supabase/server.ts`): Use in Server Components and API routes

### Row Level Security (RLS)

The database has security policies that ensure:
- Users can only see their own notes
- Users can only edit/delete their own notes
- This is enforced at the database level, not just in code

## Adding New Features

### Creating a New Page

1. Add a file in `app/(protected)/your-page/page.tsx`
2. It will automatically require authentication

### Creating a New API Route

1. Add a file in `app/api/your-route/route.ts`
2. Use `createClient()` from `lib/supabase/server`
3. Always check authentication with `supabase.auth.getUser()`

### Adding ShadCN Components

```bash
pnpm dlx shadcn@latest add [component-name]
```

See available components at [ui.shadcn.com](https://ui.shadcn.com)

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Add your environment variables in Vercel's settings
4. Deploy!

### Update Supabase Settings

After deploying, update your Supabase project:

1. Go to **Authentication > URL Configuration**
2. Add your production URL to "Site URL"
3. Add your production URL to "Redirect URLs"

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [ShadCN UI](https://ui.shadcn.com)

## Common Issues

### "Invalid login credentials"

- Make sure you've confirmed your email
- Check that your password is correct

### "Note not found"

- The note may have been deleted
- You may not have permission (not your note)

### Changes not showing

- Try refreshing the page
- Check the browser console for errors
