import { streamText } from "ai";
import { type CoreMessage } from "ai";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "./rate-limit";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export const runtime = "edge";

// ClawRouter configuration (smart LLM router with direct API keys)
const CLAWROUTER_URL = process.env.CLAWROUTER_URL || "http://192.168.2.2:8402";
const MODEL_NAME = "auto";

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

    // Build context from market data - include in user message
    let contextInfo = "";
    if (marketData && typeof marketData === "object") {
      const data = marketData as { context?: string; currentView?: string };
      if (data.context) {
        contextInfo = `\n\nMarket Data Context:\n${data.context}`;
      }
    }

    // Add context to the last user message or create a new one
    const userMessage = messages.length > 0 ? messages[messages.length - 1] : null;
    const enhancedMessage = userMessage
      ? { role: userMessage.role, content: userMessage.content + contextInfo }
      : { role: "user" as const, content: contextInfo || "Hello" };

    // Filter out the last message if it was modified, then add enhanced version
    const messagesWithoutLast = messages.slice(0, -1);
    const allMessages = [...messagesWithoutLast, enhancedMessage];

    // Call ClawRouter API
    console.log("=== CLAWROUTER REQUEST ===");
    console.log("URL:", CLAWROUTER_URL);
    console.log("Model:", MODEL_NAME);
    console.log("Messages count:", allMessages.length);
    
    const response = await fetch(`${CLAWROUTER_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: allMessages,
        max_tokens: 2000,
        temperature: 0.7,
        stream: false,
      }),
    });

    console.log("Response status:", response.status);

    if (!response.ok) {
      const error = await response.text();
      console.error("ClawRouter API error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to generate AI response" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Return complete response as JSON
    const responseData = await response.json();
    return new Response(JSON.stringify(responseData), {
      headers: {
        "Content-Type": "application/json",
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
