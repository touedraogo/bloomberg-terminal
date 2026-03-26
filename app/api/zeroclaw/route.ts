import { type NextRequest, NextResponse } from "next/server";
import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

const ZEROCLAW_PATH = "/home/ubuntu/zeroclaw/target/release/zeroclaw";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const maxLength = 5000;
    const truncatedPrompt = prompt.slice(0, maxLength);

    const sanitizedPrompt = truncatedPrompt
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
      .replace(/\t/g, "\\t");

    const command = `${ZEROCLAW_PATH} agent -m "${sanitizedPrompt}"`;

    const { stdout, stderr } = await execAsync(command, {
      timeout: 120000,
      maxBuffer: 1024 * 1024,
    });

    const response = stdout.trim() || stderr.trim();

    return NextResponse.json({
      success: true,
      response: response,
    });
  } catch (error) {
    console.error("ZeroClaw error:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json({
      success: false,
      error: errorMessage,
    });
  }
}
