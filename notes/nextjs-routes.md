# Next.js Route Handlers - Complete Guide

## 📋 Table of Contents
- [What is `route.ts`?](#what-is-routets)
- [File-Based Routing](#file-based-routing)
- [Express vs Next.js](#express-vs-nextjs)
- [Why Backend is Required for AI](#why-backend-is-required-for-ai)
- [HTTP Methods](#http-methods)
- [Database Integration](#database-integration)
- [Request & Response](#request--response)

---

## What is `route.ts`?

`route.ts` is a **special Next.js App Router convention** for creating API endpoints (Route Handlers). The filename itself is what makes it magical.

### Special Filenames in Next.js

| Filename | Purpose | Creates |
|----------|---------|---------|
| `page.tsx` | UI Page | Viewable page in browser |
| `route.ts` | API Endpoint | Backend API handler |
| `layout.tsx` | Layout wrapper | Wraps child pages |
| `loading.tsx` | Loading UI | Loading state |
| `error.tsx` | Error UI | Error boundary |

---

## File-Based Routing

The folder structure determines the URL path:

```
app/
  ├── page.tsx                    → http://localhost:3000/
  ├── about/
  │   └── page.tsx                → http://localhost:3000/about
  ├── generating-text/
  │   └── page.tsx                → http://localhost:3000/generating-text
  │
  └── api/
      ├── chat/
      │   └── route.ts            → http://localhost:3000/api/chat
      └── generating-text/
          └── route.ts            → http://localhost:3000/api/generating-text
```

### Key Rules

- ✅ `page.tsx` = "This folder is a **frontend page**"
- ✅ `route.ts` = "This folder is an **API endpoint**"
- ❌ You **cannot** have both `page.tsx` and `route.ts` in the same folder
- ✅ Folder structure = URL structure

---

## Express vs Next.js

### Traditional Node.js/Express

```javascript
// server.js
const express = require('express');
const app = express();

// Manual route definition
app.post('/api/chat', (req, res) => {
  const { message } = req.body;
  res.json({ reply: 'Hello!' });
});

app.post('/api/generating-text', (req, res) => {
  const { prompt } = req.body;
  res.json({ text: 'Generated text' });
});

app.get('/api/users', (req, res) => {
  res.json([{ id: 1, name: 'John' }]);
});

app.listen(3000);
```

**Characteristics:**
- ❌ Routes defined **in code** (manually)
- ❌ All in one file (or requires importing)
- ❌ Separate frontend and backend projects
- ❌ Need to handle CORS for frontend communication

### Next.js API Routes

```typescript
// app/api/chat/route.ts
export async function POST(req: Request) {
  const { message } = await req.json();
  return Response.json({ reply: 'Hello!' });
}
```

```typescript
// app/api/generating-text/route.ts
export async function POST(req: Request) {
  const { prompt } = await req.json();
  return Response.json({ text: 'Generated text' });
}
```

```typescript
// app/api/users/route.ts
export async function GET(req: Request) {
  return Response.json([{ id: 1, name: 'John' }]);
}
```

**Characteristics:**
- ✅ Routes defined by **file location** (convention)
- ✅ Each endpoint in its own file
- ✅ Frontend and backend in **one project**
- ✅ No CORS issues (same origin)

---

## Why Backend is Required for AI

You might wonder: "Why not just import the AI SDK in my React component?" Here's why:

### ❌ This Will NOT Work

```typescript
// page.tsx (Frontend - runs in browser)
'use client';

import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

export default function Page() {
  const handleClick = async () => {
    // ❌ NEVER do this!
    const result = await generateText({
      model: google('gemini-2.5-flash'), // Exposes API key to browser!
    });
  };
  
  return <button onClick={handleClick}>Generate</button>;
}
```

**Problems:**
1. 🔒 **Security** - API keys exposed in browser DevTools
2. ⚠️ **Won't Run** - AI SDK uses Node.js APIs, not browser-compatible
3. 💸 **Cost Control** - Anyone can spam your API key
4. 🚫 **No Server Logic** - Can't access databases or server-side resources

### ✅ This is the Correct Pattern

```typescript
// app/api/generate/route.ts (Backend - runs on server)
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

export async function POST(req: Request) {
  const { prompt } = await req.json();
  
  // ✅ API key is safe on the server
  // ✅ Can access database
  // ✅ Can add authentication
  // ✅ Can log and monitor usage
  
  const result = await generateText({
    model: google('gemini-2.5-flash'),
    prompt,
  });
  
  return Response.json({ text: result.text });
}
```

```typescript
// app/page.tsx (Frontend)
'use client';

export default function Page() {
  const handleClick = async () => {
    // ✅ Call your secure backend API
    const response = await fetch('/api/generate', {
      method: 'POST',
      body: JSON.stringify({ prompt: 'Hello' }),
    });
    const data = await response.json();
  };
  
  return <button onClick={handleClick}>Generate</button>;
}
```

### The Flow

```
Frontend (Browser)          Backend (Next.js Server)         AI Provider
    |                              |                              |
    |-- POST /api/generate ------->|                              |
    |   (user prompt)              |                              |
    |                              |-- API call (with key) ------>|
    |                              |                              |
    |                              |<-- AI response --------------|
    |<-- JSON response ------------|                              |
```

---

## HTTP Methods

Each HTTP method is an exported async function:

```typescript
// app/api/users/route.ts

// GET - Read data
export async function GET(req: Request) {
  const users = await db.user.findMany();
  return Response.json(users);
}

// POST - Create data
export async function POST(req: Request) {
  const { name, email } = await req.json();
  const user = await db.user.create({ data: { name, email } });
  return Response.json(user);
}

// PUT - Update data (full replacement)
export async function PUT(req: Request) {
  const { id, name, email } = await req.json();
  const user = await db.user.update({
    where: { id },
    data: { name, email },
  });
  return Response.json(user);
}

// PATCH - Update data (partial)
export async function PATCH(req: Request) {
  const { id, name } = await req.json();
  const user = await db.user.update({
    where: { id },
    data: { name }, // Only update name
  });
  return Response.json(user);
}

// DELETE - Delete data
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  await db.user.delete({ where: { id } });
  return Response.json({ success: true });
}
```

---

## Database Integration

Next.js routes can access databases just like Express:

### With Prisma (Most Popular)

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

```typescript
// app/api/users/route.ts
import { prisma } from '@/lib/prisma';

export async function GET() {
  const users = await prisma.user.findMany({
    include: { posts: true },
  });
  return Response.json(users);
}

export async function POST(req: Request) {
  const { name, email } = await req.json();
  const user = await prisma.user.create({
    data: { name, email },
  });
  return Response.json(user);
}
```

### With MongoDB + Mongoose

```typescript
// lib/mongodb.ts
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) return cached.conn;
  
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI);
  }
  
  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;
```

```typescript
// app/api/users/route.ts
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function GET() {
  await dbConnect();
  const users = await User.find({});
  return Response.json(users);
}
```

---

## Request & Response

### Reading Request Data

```typescript
export async function POST(req: Request) {
  // 1. Get JSON body
  const body = await req.json();
  
  // 2. Get URL parameters
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  
  // 3. Get headers
  const auth = req.headers.get('Authorization');
  
  // 4. Get cookies
  const { cookies } = await import('next/headers');
  const token = cookies().get('token');
  
  return Response.json({ body, id, auth, token });
}
```

### Dynamic Route Parameters

```typescript
// app/api/users/[id]/route.ts
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const userId = params.id; // From URL path
  const user = await db.user.findUnique({ where: { id: userId } });
  return Response.json(user);
}
```

### Sending Responses

```typescript
export async function GET() {
  // JSON response
  return Response.json({ message: 'Hello' });
  
  // With status code
  return Response.json({ error: 'Not found' }, { status: 404 });
  
  // With headers
  return Response.json({ data: 'value' }, {
    headers: {
      'Cache-Control': 'no-cache',
      'X-Custom-Header': 'value',
    },
  });
  
  // Text response
  return new Response('Plain text', {
    headers: { 'Content-Type': 'text/plain' },
  });
  
  // Redirect
  return Response.redirect('https://example.com');
}
```

---

## Summary

| Feature | Express | Next.js |
|---------|---------|---------|
| **Routing** | Code-based (`app.get()`) | File-based (`route.ts`) |
| **HTTP Methods** | `app.get()`, `app.post()` | `export async function GET()` |
| **Structure** | All routes in one file | Each route in separate file |
| **Frontend** | Separate project | Same project |
| **Database** | ✅ Full access | ✅ Full access |
| **Deployment** | Separate (Heroku, etc.) | Unified (Vercel) |

**Key Insight:** Next.js can do everything Express can - it's just organized differently using file-based conventions! The folder structure becomes your router.

---

## Example: Full CRUD API

```
app/api/posts/
├── route.ts              → GET /api/posts, POST /api/posts
└── [id]/
    ├── route.ts          → GET /api/posts/:id, PUT /api/posts/:id, DELETE /api/posts/:id
    └── comments/
        └── route.ts      → GET /api/posts/:id/comments
```

This creates a clean, organized API structure where every endpoint is self-contained! 🎉

