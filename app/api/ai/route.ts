import { streamText } from "ai";
import { type CoreMessage } from "ai";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "./rate-limit";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export const runtime = "edge";

// OpenRouter configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL_NAME = "arcee-ai/trinity-large-preview:free";

// Define validation schema for request body
const requestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string().max(4000),
      })
    )
    .max(20),
  marketData: z.record(z.any()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Check rate limits first
    const rateLimitResult = await rateLimit(req, {
      maxRequests: 20,
      windowInSeconds: 60,
    });

    if (!rateLimitResult.success) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded. Please try again later.",
          reset: rateLimitResult.reset,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Limit": rateLimitResult.limit.toString(),
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": rateLimitResult.reset.toString(),
          },
        }
      );
    }

    // Get request origin
    const origin = req.headers.get("origin") || "";

    // Get allowed origins from environment variable
    const allowedOriginsEnv = process.env.ALLOWED_ORIGINS || "";
    const allowedOrigins = allowedOriginsEnv
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean);

    if (process.env.VERCEL_URL) {
      const vercelUrl = `https://${process.env.VERCEL_URL}`;
      if (!allowedOrigins.includes(vercelUrl)) {
        allowedOrigins.push(vercelUrl);
      }
    }

    if (process.env.NODE_ENV === "development" && allowedOrigins.length === 0) {
      allowedOrigins.push("http://localhost:3000");
    }

    if (allowedOrigins.length > 0 && !allowedOrigins.includes(origin)) {
      return new Response(JSON.stringify({ error: "Unauthorized origin" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = requestSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid request format",
          details: validationResult.error.errors,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { messages, marketData } = validationResult.data;

    // Sanitize market data
    const sanitizedMarketData = marketData
      ? JSON.stringify(marketData).slice(0, 5000)
      : "{}";

    const systemPrompt = `You are an AI financial analyst for a Bloomberg Terminal clone.
You provide concise, insightful commentary and answer questions about market data.
Current market data context: ${sanitizedMarketData}
Keep responses brief, professional, and focused on financial insights.
Never provide investment advice or make specific trading recommendations.`;

    const messagesWithSystem = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    // Check API key
    if (!OPENROUTER_API_KEY) {
      return new Response(
        JSON.stringify({ error: "OpenRouter API key not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Call OpenRouter API directly
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": process.env.ALLOWED_ORIGINS?.split(",")[0] || "http://localhost:3000",
        "X-Title": "Bloomberg Terminal",
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: messagesWithSystem,
        max_tokens: 500,
        temperature: 0.7,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenRouter API error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to generate AI response" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Return streaming response
    return new Response(response.body, {
      headers: {
        "Content-Type": "text/plain",
        "X-RateLimit-Limit": rateLimitResult.limit.toString(),
        "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
        "X-RateLimit-Reset": rateLimitResult.reset.toString(),
      },
    });
  } catch (error) {
    console.error("AI API error:", error);
    return new Response(JSON.stringify({ error: "Failed to generate AI response" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
