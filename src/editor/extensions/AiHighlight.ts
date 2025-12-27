import { Mark } from "@tiptap/core";

/**
 * A temporary highlight mark used to show the selected text
 * when the AI input is focused (and the editor loses focus).
 */
export const AiHighlight = Mark.create({
  name: "aiHighlight",

  addAttributes() {
    return {
      loading: {
        default: false,
        parseHTML: (element) => element.hasAttribute("data-ai-loading"),
        renderHTML: (attributes) => {
          if (!attributes.loading) {
            return {};
          }
          return {
            "data-ai-loading": "",
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span[data-ai-highlight]",
      },
      {
        tag: "span[data-ai-loading]",
      },
    ];
  },

  renderHTML({ HTMLAttributes, mark }) {
    const loading = mark.attrs.loading;

    if (loading) {
      return [
        "span",
        {
          ...HTMLAttributes,
          "data-ai-loading": "",
          style: "background: linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--color-accent) 12%, transparent) 50%, transparent 100%), color-mix(in srgb, var(--color-accent) 20%, transparent); background-size: 200% 100%, 100% 100%; background-position: -100% 0, 0 0; animation: shimmer 2.5s ease-in-out 0.3s infinite; padding: 0.28em 0; margin: -0.28em 0; box-decoration-break: clone; -webkit-box-decoration-break: clone;",
        },
        0,
      ];
    }

    return [
      "span",
      {
        ...HTMLAttributes,
        "data-ai-highlight": "",
        style: "background-color: color-mix(in srgb, var(--color-accent) 25%, transparent); padding: 0.28em 0; margin: -0.28em 0; box-decoration-break: clone; -webkit-box-decoration-break: clone;",
      },
      0,
    ];
  },
});

