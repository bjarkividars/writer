import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { AiHighlight } from "./extensions/AiHighlight";

export const editorExtensions = [
  StarterKit.configure({
    heading: {
      levels: [1, 2, 3],
    },
  }),
  Underline,
  AiHighlight,
];
