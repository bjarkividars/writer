import type { Node as ProseMirrorNode } from "@tiptap/pm/model";

/**
 * Simple hash function for strings
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Generate a version string for a ProseMirror document
 *
 * This creates a hash based on the document content. If the content changes,
 * the version will change, allowing us to detect stale edits.
 */
export function generateDocVersion(doc: ProseMirrorNode): string {
  // Serialize the document to JSON and hash it
  const serialized = JSON.stringify(doc.toJSON());
  const hash = simpleHash(serialized);
  const timestamp = Date.now().toString(36);

  return `${timestamp}-${hash}`;
}

/**
 * Extract the content hash from a version string (ignoring timestamp)
 */
function extractHash(version: string): string | null {
  const parts = version.split("-");
  return parts.length === 2 ? parts[1] : null;
}

/**
 * Validate that a document version matches the expected version
 *
 * We compare only the content hash part (not timestamp) to allow for
 * some time drift while still detecting actual content changes.
 *
 * Returns true if the content hasn't changed, false otherwise.
 */
export function validateDocVersion(
  expected: string,
  current: string
): boolean {
  // Fast path: exact match
  if (expected === current) return true;
  
  // Compare content hashes only (ignore timestamp)
  const expectedHash = extractHash(expected);
  const currentHash = extractHash(current);
  
  if (!expectedHash || !currentHash) {
    console.warn("[docVersion] Invalid version format", { expected, current });
    return false;
  }
  
  const isValid = expectedHash === currentHash;
  
  if (!isValid) {
    console.warn("[docVersion] Document changed", {
      expected,
      current,
      expectedHash,
      currentHash,
    });
  }
  
  return isValid;
}

/**
 * Extract timestamp from a document version
 *
 * Useful for debugging or logging when an edit was created.
 */
export function getVersionTimestamp(version: string): number | null {
  const parts = version.split("-");
  if (parts.length !== 2) return null;

  try {
    return parseInt(parts[0], 36);
  } catch {
    return null;
  }
}

