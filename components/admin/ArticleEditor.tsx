"use client";

import { useState } from "react";
import Image from "next/image";
import ImageExt from "@tiptap/extension-image";
import LinkExt from "@tiptap/extension-link";
import { EditorContent, type JSONContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Heading2, Heading3, Image as ImageIcon, Italic, Link2, List, ListOrdered, Minus, Quote } from "lucide-react";
import type { MediaItem } from "@/components/admin/MediaPicker";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

function ToolbarButton({ active, disabled, onClick, title, children }: { active?: boolean; disabled?: boolean; onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40",
        active && "bg-muted text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function ArticleEditor({ content, onChange, media }: { content: unknown; onChange: (doc: JSONContent) => void; media: MediaItem[] }) {
  const [imgOpen, setImgOpen] = useState(false);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      // Disable marks the public renderer (ArticleBody) doesn't handle (strike/underline) so authors
      // can't apply formatting that silently vanishes; disable StarterKit's built-in Link to avoid a
      // duplicate registration with the configured LinkExt below (08 §3.5 editor spec).
      StarterKit.configure({ heading: { levels: [2, 3] }, codeBlock: false, strike: false, underline: false, link: false }),
      LinkExt.configure({ openOnClick: false, autolink: false, HTMLAttributes: { rel: "noopener nofollow", target: "_blank" } }),
      ImageExt.configure({ inline: false }),
    ],
    content: content && typeof content === "object" ? (content as JSONContent) : { type: "doc", content: [] },
    onUpdate: ({ editor }) => onChange(editor.getJSON()),
  });

  if (!editor) return <div className="min-h-[320px] rounded-md border border-border bg-background" />;

  function setLink() {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL tautan (kosongkan untuk hapus):", prev ?? "");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  return (
    <div className="rounded-md border border-border">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/40 px-2 py-1.5">
        <ToolbarButton title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="h-4 w-4" /></ToolbarButton>
        <span className="mx-1 h-5 w-px bg-border" />
        <ToolbarButton title="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton title="Heading 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="h-4 w-4" /></ToolbarButton>
        <span className="mx-1 h-5 w-px bg-border" />
        <ToolbarButton title="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton title="Ordered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton title="Quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton title="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus className="h-4 w-4" /></ToolbarButton>
        <span className="mx-1 h-5 w-px bg-border" />
        <ToolbarButton title="Tautan" active={editor.isActive("link")} onClick={setLink}><Link2 className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton title="Gambar dari Media" onClick={() => setImgOpen(true)}><ImageIcon className="h-4 w-4" /></ToolbarButton>
      </div>

      <div className="max-h-[60vh] overflow-y-auto px-4 py-3 text-sm [&_a]:text-accent-text [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-primary [&_blockquote]:pl-3 [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:mt-3 [&_h3]:font-medium [&_hr]:my-4 [&_hr]:border-border [&_img]:my-2 [&_img]:max-h-64 [&_img]:rounded [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_.ProseMirror]:min-h-[280px] [&_.ProseMirror]:outline-none">
        <EditorContent editor={editor} />
      </div>

      <Dialog open={imgOpen} onOpenChange={setImgOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Sisipkan gambar</DialogTitle></DialogHeader>
          <div className="grid max-h-[60vh] grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3 md:grid-cols-4">
            {media.map((m) => {
              const url = mediaUrl(m);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    if (url) editor.chain().focus().setImage({ src: url, alt: m.alt ?? "" }).run();
                    setImgOpen(false);
                  }}
                  className="group relative aspect-[4/3] overflow-hidden rounded-md border border-border bg-muted text-left hover:border-foreground/40"
                >
                  {url ? <Image src={url} alt={m.alt ?? ""} fill sizes="200px" className="object-cover" /> : null}
                  {!m.alt ? <span className="absolute bottom-1 left-1 rounded bg-destructive/90 px-1 text-[9px] text-white">no alt</span> : null}
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
