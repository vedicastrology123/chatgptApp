import type { APIRoute } from 'astro';
import { GoogleGenerativeAI } from "@google/generative-ai";

export const POST: APIRoute = async ({ request }) => {
  try {
    const { prompt } = await request.json();
    const API_KEY = import.meta.env.GEMINI_API_KEY;

    if (!API_KEY) {
      return new Response(JSON.stringify({ error: "API Key missing" }), { status: 500 });
    }

    // STABLE V1 URL - Avoids the 1.5-flash 404 ghost
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return new Response(JSON.stringify({ error: data.error?.message || "Gemini Error" }), { status: response.status });
    }

    const aiText = data.candidates[0].content.parts[0].text;
    return new Response(JSON.stringify({ text: aiText }), { status: 200 });

  } catch (error) {
    return new Response(JSON.stringify({ error: "Server Error" }), { status: 500 });
  }
};