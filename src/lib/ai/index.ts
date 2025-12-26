/**
 * AI Edit System
 *
 * This module provides utilities for building structured edit requests
 * for AI-powered document editing with TipTap/ProseMirror.
 */

// Schemas
export {
  RegionKind,
  Region,
  EditRequest,
  EditTarget,
  EditOp,
  AiEditOutput,
} from "./schemas";

export type {
  RegionKind as RegionKindType,
  Region as RegionType,
  EditRequest as EditRequestType,
  EditTarget as EditTargetType,
  EditOp as EditOpType,
  AiEditOutput as AiEditOutputType,
} from "./schemas";

// Region map builder
export { buildRegionMap } from "./regionMap";
export type { RegionMapResult } from "./regionMap";

// Document version tracking
export {
  generateDocVersion,
  validateDocVersion,
  getVersionTimestamp,
} from "./docVersion";

// Edit resolver
export {
  resolveEditTarget,
  resolveAllEdits,
  sortEditsDescending,
} from "./resolveEdits";

export type { ResolvedRange, ResolveResult } from "./resolveEdits";

