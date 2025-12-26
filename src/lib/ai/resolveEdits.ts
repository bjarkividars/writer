import type { EditTarget, Region, EditOp } from "./schemas";

/**
 * Resolved position range
 */
export type ResolvedRange = {
  from: number;
  to: number;
};

/**
 * Result of resolving an edit target
 */
export type ResolveResult =
  | { success: true; range: ResolvedRange }
  | { success: false; error: string };

/**
 * Resolve an edit target into absolute positions
 *
 * This handles both direct range targets and region-offset targets,
 * validating that the resolved positions are within the allowed range.
 */
export function resolveEditTarget(
  target: EditTarget,
  regions: Region[],
  allowedRange: { from: number; to: number }
): ResolveResult {
  let resolvedFrom: number;
  let resolvedTo: number;

  if (target.kind === "range") {
    // Direct range target - validate required fields are not null
    if (target.from === null || target.to === null) {
      return {
        success: false,
        error: "Range target missing from/to fields (must not be null)",
      };
    }
    resolvedFrom = target.from;
    resolvedTo = target.to;
  } else if (target.kind === "region-offset") {
    // Region-offset target - validate required fields are not null
    if (
      target.regionId === null ||
      target.startOffset === null ||
      target.endOffset === null
    ) {
      return {
        success: false,
        error: "Region-offset target missing required fields (must not be null)",
      };
    }

    const region = regions.find((r) => r.id === target.regionId);
    if (!region) {
      return {
        success: false,
        error: `Region not found: ${target.regionId}`,
      };
    }

    // Calculate absolute positions from region + offsets
    resolvedFrom = region.from + target.startOffset;
    resolvedTo = region.from + target.endOffset;

    // Validate offsets are within region bounds
    if (resolvedTo > region.to) {
      return {
        success: false,
        error: `End offset ${target.endOffset} exceeds region length (${region.to - region.from})`,
      };
    }
  } else {
    return {
      success: false,
      error: `Unknown target kind: ${target.kind}`,
    };
  }

  // Validate resolved range is within allowed range
  if (resolvedFrom < allowedRange.from || resolvedTo > allowedRange.to) {
    return {
      success: false,
      error: `Resolved range [${resolvedFrom}, ${resolvedTo}] is outside allowed range [${allowedRange.from}, ${allowedRange.to}]`,
    };
  }

  // Validate from <= to
  if (resolvedFrom > resolvedTo) {
    return {
      success: false,
      error: `Invalid range: from (${resolvedFrom}) > to (${resolvedTo})`,
    };
  }

  return {
    success: true,
    range: { from: resolvedFrom, to: resolvedTo },
  };
}

/**
 * Resolve all edits in an edit operation array
 *
 * Returns an array of resolved edits, filtering out any that fail to resolve.
 * Failed edits are logged to the console.
 */
export function resolveAllEdits(
  edits: EditOp[],
  regions: Region[],
  allowedRange: { from: number; to: number }
): Array<EditOp & { resolvedRange: ResolvedRange }> {
  const resolved: Array<EditOp & { resolvedRange: ResolvedRange }> = [];

  for (const edit of edits) {
    const result = resolveEditTarget(edit.target, regions, allowedRange);

    if (result.success) {
      resolved.push({
        ...edit,
        resolvedRange: result.range,
      });
    } else {
      console.warn(`Failed to resolve edit:`, edit, result.error);
    }
  }

  return resolved;
}

/**
 * Sort edits in descending order by start position
 *
 * This is important when applying edits to a document, as we need to
 * apply edits from the end to the beginning to avoid position drift.
 */
export function sortEditsDescending(
  edits: Array<EditOp & { resolvedRange: ResolvedRange }>
): Array<EditOp & { resolvedRange: ResolvedRange }> {
  return [...edits].sort(
    (a, b) => b.resolvedRange.from - a.resolvedRange.from
  );
}

