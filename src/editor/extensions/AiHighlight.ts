import { Mark } from "@tiptap/core";

/**
 * A temporary highlight mark used to show the selected text
 * when the AI input is focused (and the editor loses focus).
 */
export const AiHighlight = Mark.create({
  name: "aiHighlight",

  addAttributes() {
    return {};
  },

  parseHTML() {
    return [
      {
        tag: "span[data-ai-highlight]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      {
        ...HTMLAttributes,
        "data-ai-highlight": "",
        style: "background-color: color-mix(in srgb, var(--color-accent) 25%, transparent); border-radius: 2px; padding: 0.1em 0; margin: -0.3em 0; box-decoration-break: clone; -webkit-box-decoration-break: clone;",
      },
      0,
    ];
  },
});

