"use client";

import { useState } from "react";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import {
  Bold,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  Link2Off,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Underline,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import type { BucketName } from "@/lib/storage-config";
import { cn } from "@/lib/utils";
import { MediaPickerDialog } from "./media/media-picker";

type Props = {
  id?: string;
  /** Accessible name for the editing area (a <label for> cannot name a contenteditable). */
  label?: string;
  value: unknown;
  onChange: (doc: unknown) => void;
  bucket?: BucketName;
  placeholder?: string;
  "aria-invalid"?: boolean;
};

function ToolbarButton({
  icon: Icon,
  label,
  active,
  disabled,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn(
        "grid size-8 place-items-center rounded text-zinc-700 hover:bg-zinc-100 disabled:opacity-40",
        active && "bg-zinc-900 text-white hover:bg-zinc-800",
      )}
    >
      <Icon aria-hidden className="size-4" />
    </button>
  );
}

function Toolbar({ editor, onInsertImage }: { editor: Editor; onInsertImage: () => void }) {
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      strike: e.isActive("strike"),
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      quote: e.isActive("blockquote"),
      link: e.isActive("link"),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });

  const setLink = () => {
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link address (a page like /admissions, or a full https:// link)", previous ?? "");
    if (url === null) return;
    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    const href = url.trim();
    if (!/^(\/(?!\/)|#|https?:\/\/|mailto:|tel:)/i.test(href)) {
      window.alert("Please use a page path starting with / or a full link starting with https://");
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
  };

  const chain = () => editor.chain().focus();

  return (
    <div role="toolbar" aria-label="Formatting" className="flex flex-wrap items-center gap-0.5 border-b border-zinc-200 bg-zinc-50 p-1">
      <ToolbarButton icon={Heading2} label="Heading" active={state.h2} onClick={() => chain().toggleHeading({ level: 2 }).run()} />
      <ToolbarButton icon={Heading3} label="Subheading" active={state.h3} onClick={() => chain().toggleHeading({ level: 3 }).run()} />
      <span aria-hidden className="mx-1 h-5 w-px bg-zinc-300" />
      <ToolbarButton icon={Bold} label="Bold" active={state.bold} onClick={() => chain().toggleBold().run()} />
      <ToolbarButton icon={Italic} label="Italic" active={state.italic} onClick={() => chain().toggleItalic().run()} />
      <ToolbarButton icon={Underline} label="Underline" active={state.underline} onClick={() => chain().toggleUnderline().run()} />
      <ToolbarButton icon={Strikethrough} label="Strikethrough" active={state.strike} onClick={() => chain().toggleStrike().run()} />
      <span aria-hidden className="mx-1 h-5 w-px bg-zinc-300" />
      <ToolbarButton icon={List} label="Bulleted list" active={state.bullet} onClick={() => chain().toggleBulletList().run()} />
      <ToolbarButton icon={ListOrdered} label="Numbered list" active={state.ordered} onClick={() => chain().toggleOrderedList().run()} />
      <ToolbarButton icon={Quote} label="Quote" active={state.quote} onClick={() => chain().toggleBlockquote().run()} />
      <ToolbarButton icon={Minus} label="Divider" onClick={() => chain().setHorizontalRule().run()} />
      <span aria-hidden className="mx-1 h-5 w-px bg-zinc-300" />
      <ToolbarButton icon={Link2} label="Add link" active={state.link} onClick={setLink} />
      <ToolbarButton icon={Link2Off} label="Remove link" disabled={!state.link} onClick={() => chain().unsetLink().run()} />
      <ToolbarButton icon={ImagePlus} label="Insert image" onClick={onInsertImage} />
      <span aria-hidden className="mx-1 h-5 w-px bg-zinc-300" />
      <ToolbarButton icon={Undo2} label="Undo" disabled={!state.canUndo} onClick={() => chain().undo().run()} />
      <ToolbarButton icon={Redo2} label="Redo" disabled={!state.canRedo} onClick={() => chain().redo().run()} />
    </div>
  );
}

export function RichTextEditor({ id, label = "Content", value, onChange, bucket = "articles", placeholder, ...rest }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        codeBlock: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
      }),
      Image.configure({ inline: false }),
    ],
    content: (value as object | null) ?? "",
    editorProps: {
      attributes: {
        ...(id ? { id } : {}),
        class: "prose-mpa min-h-60 max-w-none px-4 py-3 focus:outline-none",
        "aria-multiline": "true",
        role: "textbox",
        "aria-label": label,
        ...(placeholder ? { "aria-placeholder": placeholder } : {}),
      },
    },
    onUpdate: ({ editor: e }) => onChange(e.isEmpty ? null : e.getJSON()),
  });

  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border bg-white focus-within:border-zinc-500 focus-within:ring-2 focus-within:ring-zinc-200",
        rest["aria-invalid"] ? "border-red-400" : "border-zinc-300",
      )}
    >
      {editor ? (
        <>
          <Toolbar editor={editor} onInsertImage={() => setPickerOpen(true)} />
          <EditorContent editor={editor} />
          <MediaPickerDialog
            open={pickerOpen}
            onClose={() => setPickerOpen(false)}
            bucket={bucket}
            title="Insert an image"
            onSelect={(m) =>
              editor
                .chain()
                .focus()
                .setImage({ src: m.url, alt: m.alt, title: m.caption ?? undefined, width: m.width ?? undefined, height: m.height ?? undefined })
                .run()
            }
          />
        </>
      ) : (
        <div className="min-h-72 animate-pulse bg-zinc-50" aria-busy="true" aria-label="Loading editor" />
      )}
    </div>
  );
}
