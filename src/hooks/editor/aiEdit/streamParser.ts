type ParsedEdits = {
  edits?: unknown[];
  message?: string;
  options?: unknown[];
} | null;

function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

function tryParseCompleteJSON(text: string): ParsedEdits {
  try {
    const parsed = JSON.parse(text) as unknown;
    if (typeof parsed === "object" && parsed !== null && "edits" in parsed) {
      const { edits: editsValue, message, options } = parsed as {
        edits: unknown;
        message?: unknown;
        options?: unknown;
      };
      if (isArray(editsValue)) {
        const textMessage =
          typeof message === "string" ? message : undefined;
        const optionItems = isArray(options) ? options : undefined;
        return { edits: editsValue, message: textMessage, options: optionItems };
      }
    }
  } catch {
    // Fall back to partial extraction.
  }

  return null;
}

function extractStringField(text: string, key: string): string | null {
  const match = text.match(new RegExp(`"${key}"\\s*:\\s*"([^"]*)"`, "s"));
  return match ? match[1] : null;
}

function extractPartialStringField(text: string, key: string): string | null {
  const completeMatch = extractStringField(text, key);
  if (completeMatch !== null) return completeMatch;

  const match = text.match(new RegExp(`"${key}"\\s*:\\s*"([^"]*)`, "s"));
  return match ? match[1] : null;
}

function extractNumberOrNullField(
  text: string,
  key: string
): number | null | undefined {
  const match = text.match(new RegExp(`"${key}"\\s*:\\s*(null|\\d+)`));
  if (!match) return undefined;
  if (match[1] === "null") return null;
  const value = Number(match[1]);
  return Number.isNaN(value) ? undefined : value;
}

function extractStringArrayField(text: string, key: string): string[] | null {
  const keyIndex = text.search(new RegExp(`"${key}"\\s*:\\s*\\[`));
  if (keyIndex < 0) return null;
  const start = text.indexOf("[", keyIndex);
  if (start < 0) return null;

  const items: string[] = [];
  let current = "";
  let inString = false;
  let escaped = false;

  for (let i = start + 1; i < text.length; i += 1) {
    const ch = text[i];
    if (inString) {
      if (escaped) {
        current += ch;
        escaped = false;
        continue;
      }
      if (ch === "\\") {
        escaped = true;
        continue;
      }
      if (ch === "\"") {
        items.push(current);
        current = "";
        inString = false;
        continue;
      }
      current += ch;
      continue;
    }

    if (ch === "\"") {
      inString = true;
      continue;
    }
    if (ch === "]") {
      break;
    }
  }

  if (inString) {
    items.push(current);
  }

  return items;
}

function getScopedEditText(text: string, editStartPos: number) {
  const afterTarget = text.substring(editStartPos);
  const nextTargetOffset = afterTarget.slice(1).search(/\{"target"\s*:/);
  if (nextTargetOffset >= 0) {
    return afterTarget.slice(0, nextTargetOffset + 1);
  }
  return afterTarget;
}

export function parsePartialEdits(text: string): ParsedEdits {
  const complete = tryParseCompleteJSON(text);
  if (complete) return complete;

  const edits: unknown[] = [];
  const message = extractPartialStringField(text, "message");
  const editMatches = text.matchAll(/\{"target"\s*:\s*\{([^}]+)\}/g);

  for (const editMatch of editMatches) {
    try {
      const targetJson = `{${editMatch[1]}}`;
      const editStartPos = editMatch.index ?? 0;
      const scopedText = getScopedEditText(text, editStartPos);
      const target = JSON.parse(targetJson) as unknown;

      const replacement = extractPartialStringField(scopedText, "replacement");
      const items = extractStringArrayField(scopedText, "items");
      const position = extractStringField(scopedText, "position");
      const blockType = extractStringField(scopedText, "blockType");
      const headingLevel = extractNumberOrNullField(scopedText, "headingLevel");

      let type = extractStringField(scopedText, "type");
      if (!type) {
        if (replacement !== null) {
          type = "replace";
        } else if (items && position) {
          type = blockType ? "insert-block" : "insert-item";
        }
      }

      if (!type) continue;

      const operation: Record<string, unknown> = { type };

      if (type === "replace") {
        if (replacement !== null) {
          operation.replacement = replacement;
        }
      } else {
        if (items) {
          operation.items = items;
        }

        if (position) {
          operation.position = position;
        }

        if (blockType) {
          operation.blockType = blockType;
        }

        if (headingLevel !== undefined) {
          operation.headingLevel = headingLevel;
        }
      }

      edits.push({ target, operation });
    } catch {
      // Skip invalid matches.
    }
  }

  if (edits.length > 0 || message !== null) {
    return {
      edits: edits.length > 0 ? edits : undefined,
      message: message ?? undefined,
    };
  }

  return null;
}
