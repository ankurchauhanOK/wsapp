import { getWelcomeMessage, getHelpMessage, getOrderStatusPlaceholder } from "./messages";

export interface BotResponse {
  text: string;
  type: "text";
}

export interface IncomingMessage {
  from: string;
  text: string;
  timestamp?: number;
}

const TRIGGER_WORDS = ["hi", "hello", "hey", "start", "shop", "groceries", "help", "order"];

const STATUS_WORDS = ["status", "track", "where is my order"];

function normalize(input: string): string {
  return input.toLowerCase().trim().replace(/\s+/g, " ");
}

function matchesAny(input: string, triggers: string[]): boolean {
  const normalized = normalize(input);
  if (triggers.includes(normalized)) return true;
  for (const word of triggers) {
    if (normalized.startsWith(word)) return true;
    if (normalized.includes(word)) return true;
  }
  return false;
}

export function handleIncomingMessage(message: IncomingMessage): BotResponse | null {
  const { text } = message;
  const normalized = normalize(text);

  if (!normalized) return null;

  if (matchesAny(normalized, STATUS_WORDS)) {
    return {
      text: getOrderStatusPlaceholder(),
      type: "text",
    };
  }

  if (matchesAny(normalized, TRIGGER_WORDS)) {
    return {
      text: getWelcomeMessage(),
      type: "text",
    };
  }

  return {
    text: getHelpMessage(),
    type: "text",
  };
}
