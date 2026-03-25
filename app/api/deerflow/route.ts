import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const DEERFLOW_URL = process.env.DEERFLOW_URL || "http://192.168.2.2:2026";

const requestSchema = z.object({
  prompt: z.string().max(5000),
  context: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validationResult = requestSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ error: "Invalid request format" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { prompt, context } = validationResult.data;

    // Build the full prompt with context
    let fullPrompt = prompt;
    if (context) {
      fullPrompt = `${context}\n\nUser question: ${prompt}`;
    }

    // Create a thread on DeerFlow
    const threadResponse = await fetch(`${DEERFLOW_URL}/api/langgraph/threads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    if (!threadResponse.ok) {
      const errorText = await threadResponse.text();
      console.error("DeerFlow thread creation error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to create DeerFlow thread" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const thread = await threadResponse.json();
    const threadId = thread.thread_id;

    // Send message to the thread
    const streamResponse = await fetch(
      `${DEERFLOW_URL}/api/langgraph/threads/${threadId}/runs/stream`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assistant_id: "lead_agent",
          input: {
            messages: [{ type: "human", content: fullPrompt }],
          },
        }),
      }
    );

    if (!streamResponse.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to send message to DeerFlow" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Collect the streaming response
    const reader = streamResponse.body?.getReader();
    if (!reader) {
      return new Response(
        JSON.stringify({ error: "No response body" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    let fullResponse = "";
    let lastAssistantMessage = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = new TextDecoder().decode(value);
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            
            // Extract assistant messages from values
            if (parsed.values?.messages) {
              const messages = parsed.values.messages;
              for (const msg of messages) {
                if (msg.type === "ai" && msg.content) {
                  lastAssistantMessage = msg.content;
                }
              }
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }

    // If we have a complete response from the thread, get it
    if (lastAssistantMessage) {
      fullResponse = lastAssistantMessage;
    } else {
      // Try to get the final state
      const stateResponse = await fetch(
        `${DEERFLOW_URL}/api/langgraph/threads/${threadId}`,
        { method: "GET" }
      );
      
      if (stateResponse.ok) {
        const state = await stateResponse.json();
        if (state.values?.messages) {
          const messages = state.values.messages;
          for (const msg of messages) {
            if (msg.type === "ai" && msg.content) {
              fullResponse = msg.content;
            }
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ response: fullResponse || "No response from agent" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("DeerFlow API error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to connect to DeerFlow" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
