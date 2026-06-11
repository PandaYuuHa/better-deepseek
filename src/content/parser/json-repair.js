import { unwrapMarkdownCodeFence } from "./tag-parser.js";

function stripTrailingCommas(text) {
  return String(text || "").replace(/,\s*([}\]])/g, "$1");
}

function nextNonWhitespace(text, startIndex) {
  for (let i = startIndex; i < text.length; i++) {
    const char = text[i];
    if (!/\s/.test(char)) return char;
  }
  return "";
}

function escapeInvalidStringQuotes(text) {
  let output = "";
  let inString = false;
  let escaped = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (escaped) {
      output += char;
      escaped = false;
      continue;
    }

    if (inString && char === "\\") {
      output += char;
      escaped = true;
      continue;
    }

    if (char === '"') {
      if (!inString) {
        inString = true;
        output += char;
        continue;
      }

      const next = nextNonWhitespace(text, i + 1);
      if (!next || next === ":" || next === "," || next === "}" || next === "]") {
        inString = false;
        output += char;
      } else {
        output += '\\"';
      }
      continue;
    }

    output += char;
  }

  return output;
}

function normalizeJsonLikeText(content) {
  return unwrapMarkdownCodeFence(String(content || ""))
    .replace(/^\uFEFF/, "")
    .trim();
}

function buildCandidates(content) {
  const normalized = normalizeJsonLikeText(content);
  const withoutTrailingCommas = stripTrailingCommas(normalized);
  const withEscapedQuotes = escapeInvalidStringQuotes(withoutTrailingCommas);

  return Array.from(new Set([
    normalized,
    withoutTrailingCommas,
    withEscapedQuotes,
    stripTrailingCommas(withEscapedQuotes),
  ]));
}

export function parseLooseJson(content) {
  let lastError = null;

  for (const candidate of buildCandidates(content)) {
    try {
      return {
        value: JSON.parse(candidate),
        error: "",
        text: candidate,
      };
    } catch (error) {
      lastError = error;
    }
  }

  return {
    value: null,
    error: lastError?.message || "Invalid JSON",
    text: normalizeJsonLikeText(content),
  };
}
