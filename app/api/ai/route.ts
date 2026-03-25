import { streamText } from "ai";
import { type CoreMessage } from "ai";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "./rate-limit";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export const runtime = "edge";

// OpenClaw configuration (bypasses OpenRouter)
const OPENCLAW_URL = process.env.OPENCLAW_URL || "http://192.168.2.2:42617";
const OPENCLAW_TOKEN = process.env.OPENCLAW_TOKEN || "456591315a5f2aa2a104b1ff1dc24210680fd855a11caf4e";

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

    if (allowedOrigins.length > 0) {
      const originLower = origin.toLowerCase();
      const isAllowed = allowedOrigins.some(o => 
        originLower.includes(o.toLowerCase().replace("http://", "").replace("https://", ""))
      );
      if (!isAllowed && allowedOrigins.length > 0) {
        console.warn(`Origin ${origin} not in allowed list: ${allowedOrigins.join(", ")}`);
      }
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

    // Call OpenClaw API (bypasses OpenRouter rate limits)
    const response = await fetch(`${OPENCLAW_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENCLAW_TOKEN}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: messagesWithSystem,
        max_tokens: 1000,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenClaw API error:", error);
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
