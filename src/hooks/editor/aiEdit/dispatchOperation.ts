import type { OperationDispatchArgs } from "./types";
import { isOperationObject } from "./utils";
import { handleReplaceOperation } from "./handlers/replace";
import { handleInsertItemOperation } from "./handlers/insertItem";
import { handleInsertBlockOperation } from "./handlers/insertBlock";
import { handleDeleteItemOperation } from "./handlers/deleteItem";
import { handleDeleteBlockOperation } from "./handlers/deleteBlock";

export function dispatchOperation(args: OperationDispatchArgs): boolean {
  const { state, operation } = args;

  if (!isOperationObject(operation)) return false;

  const operationType = operation.type;
  if (typeof operationType !== "string") return false;

  if (operationType !== "replace" && state.operationApplied) {
    return false;
  }

  switch (operationType) {
    case "replace":
      return handleReplaceOperation({
        ...args,
        operation,
      });
    case "insert-item":
      return handleInsertItemOperation({
        ...args,
        operation,
      });
    case "insert-block":
      return handleInsertBlockOperation({
        ...args,
        operation,
      });
    case "delete-item":
      return handleDeleteItemOperation({
        ...args,
        operation,
      });
    case "delete-block":
      return handleDeleteBlockOperation({
        ...args,
        operation,
      });
    default:
      return false;
  }
}
