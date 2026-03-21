/**
 * Server-only Anthropic client singleton.
 * Never import from client components.
 */
import Anthropic from "@anthropic-ai/sdk";

let _client: Anthropic | null = null;

export function getAiClient(): Anthropic {
  if (!_client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("[chat-ai] ANTHROPIC_API_KEY is not set. AI responses will fail. Add it to .env.local and Vercel Environment Variables.");
    }
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _client;
}
