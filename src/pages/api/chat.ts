import type { APIRoute } from "astro";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PrismaClient } from "../../generated/prisma/client";
import { PrismaPostgresAdapter } from "@prisma/adapter-ppg";
import dotenv from 'dotenv';
dotenv.config();

// 1. Singleton pattern for Prisma Postgres (2026 Driver)
let prisma: PrismaClient;

function getPrisma() {
  if (!prisma) {
    const adapter = new PrismaPostgresAdapter({ 
      connectionString: process.env.DATABASE_URL || "" 
    });
    prisma = new PrismaClient({ adapter });
  }
  return prisma;
}

const apiKey = process.env.GEMINI_API_KEY;

// 2. Add a Hard Guard: If the key is missing, crash with a helpful 500
if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not defined in environment variables.");
}

const genAI = new GoogleGenerativeAI(apiKey);
// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const POST: APIRoute = async ({ request }) => {
  try {
    // --- 2. Safe Body Parsing ---
    const body = await request.json().catch(() => ({})); 
    const prompt = body?.prompt;
    const rawUserId = body?.userId;

// 1. Check if we are in Mock Mode
  if (import.meta.env.PUBLIC_MOCK_MODE === 'true') {
    // Artificial delay to simulate "thinking"
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return new Response(JSON.stringify({
      text: `[MOCK MODE] I received your message: "${body}". The Gemini API is currently resting until 12:30 PM IST.`
    }), { status: 200 });
  }

    if (!prompt) {
      return new Response(JSON.stringify({ error: "No prompt provided" }), { status: 400 });
    }

    // --- 3. The "toString" Crash Fix ---
    // Instead of String(userId), we use a safe fallback
    const userId = rawUserId ? String(rawUserId) : "guest-session";

    const db = getPrisma();

    // --- 4. Database Logic ---
    let queryCount = 0;
    
    // Only query DB if it's not the generic guest session
    if (userId !== "guest-session" && userId !== "current-session-id") {
      const user = await db.user.upsert({
        where: { id: userId },
        update: {},
        create: { id: userId, queryCount: 0 },
        select: { queryCount: true }
      });
      queryCount = user.queryCount;
    }

    if (queryCount >= 3) {
      return new Response(JSON.stringify({ error: "Free limit reached" }), { status: 403 });
    }

    // --- 5. Gemini Integration ---
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContentStream(prompt);

    // Increment count if user is logged in
    if (userId !== "guest-session" && userId !== "current-session-id") {
      await db.user.update({
        where: { id: userId },
        data: { queryCount: { increment: 1 } }
      });
    }

// --- 6. Streaming Output ---   
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of result.stream) {
            controller.enqueue(encoder.encode(chunk.text()));
          }
        } catch (e) {
          console.error("Stream Error:", e);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
       headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
    

    // FOR TESTING THE AMBER BOX: 
        // Return a plain 429 status with no body. 
        // This triggers the 'if (response.status === 429)' block in ChatInterface.astro.
        //return new Response(null, { status: 429 });

} catch (error: any) {
  // Check if the error from Google is a Quota/Rate Limit error
  if (error.message?.includes("429") || error.status === 429) {
    console.warn("Gemini Quota Hit: Returning 429 to frontend.");
    return new Response(null, { status: 429 }); // This triggers the Amber Box!
  }

  console.error("CRITICAL ERROR:", error.message);
  return new Response(JSON.stringify({ error: error.message }), { status: 500 });
}
};