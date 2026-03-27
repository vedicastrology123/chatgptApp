export const prerender = false;

import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { prompt } = await request.json();

    // --- MOCK MODE: Toggle this to 'true' for testing ---
    const MOCK_MODE = true; 

    if (MOCK_MODE) {
      // Simulate a 1-second "Thinking..." delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      return new Response(JSON.stringify({ 
        text: `[MOCK] I received your prompt: "${prompt}". This is a fake response to save API credits!` 
      }), { status: 200 });
    }

    // ... your real Gemini API logic starts below here ...
  } catch (error) {
    return new Response(JSON.stringify({ error: "Server Error" }), { status: 500 });
  }
};

// export const POST: APIRoute = async ({ request }) => {
//   try {
//     const { prompt } = await request.json();
//     const API_KEY = import.meta.env.GEMINI_API_KEY;

//     if (!API_KEY) {
//       return new Response(JSON.stringify({ error: "API Key missing" }), { status: 500 });
//     }

//     // Gemini API call
//     const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;
//     const response = await fetch(url, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         contents: [{ parts: [{ text: prompt }] }]
//       }),
//     });

//     const data = await response.json();

//     if (!response.ok) {
//       return new Response(JSON.stringify({ error: data.error?.message || "Gemini Error" }), { status: response.status });
//     }

//     const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
//     return new Response(JSON.stringify({ text: aiText }), { status: 200 });

//   } catch (error) {
//     return new Response(JSON.stringify({ error: "Server Error" }), { status: 500 });
//   }
// };