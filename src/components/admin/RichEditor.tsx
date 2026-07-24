"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { useEffect, useRef } from "react";

interface RichEditorProps {
  value: string;
  onChange: (html: string) => void;
}

// 读取文件为 dataURL（正文内图片先内联，发布时统一转存到仓库）
function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function Btn({
  active,
  onClick,
  children,
  title,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`px-2.5 py-1 text-sm border transition-colors ${
        active ? "bg-black text-white border-black" : "border-black/20 hover:border-black"
      }`}
    >
      {children}
    </button>
  );
}

export function RichEditor({ value, onChange }: RichEditorProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] } }),
      Image.configure({ inline: false }),
      Link.configure({ openOnClick: false }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: "archive-html-content max-w-none",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    immediatelyRender: false,
  });

  // 外部 value 变化（如从服务器载入）时同步
  useEffect(() => {
    if (editor && value && editor.getHTML() !== value) {
      editor.commands.setContent(value, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, value]);

  if (!editor) return <div className="opacity-40 text-sm p-4">编辑器加载中…</div>;

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    for (const f of files) {
      const dataUrl = await readAsDataUrl(f);
      editor!.chain().focus().setImage({ src: dataUrl, alt: f.name }).run();
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  function addLink() {
    const url = window.prompt("链接地址（http://…）");
    if (url) editor!.chain().focus().setLink({ href: url }).run();
  }

  return (
    <div className="border border-black/20 bg-white">
      <div className="flex flex-wrap gap-1.5 p-2 border-b border-black/10 bg-neutral-50 sticky top-0 z-10">
        <Btn title="小标题" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          H2
        </Btn>
        <Btn title="子标题" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          H3
        </Btn>
        <Btn title="正文" active={editor.isActive("paragraph")} onClick={() => editor.chain().focus().setParagraph().run()}>
          正文
        </Btn>
        <Btn title="加粗" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          <b>B</b>
        </Btn>
        <Btn title="斜体" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <i>I</i>
        </Btn>
        <Btn title="引文" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          &ldquo; &rdquo;
        </Btn>
        <Btn title="无序列表" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          • 列表
        </Btn>
        <Btn title="有序列表" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          1. 列表
        </Btn>
        <Btn title="链接" active={editor.isActive("link")} onClick={addLink}>
          链接
        </Btn>
        <Btn title="插入图片" onClick={() => fileRef.current?.click()}>
          图片
        </Btn>
        <div className="flex-1" />
        <Btn title="撤销" onClick={() => editor.chain().focus().undo().run()}>
          ↶
        </Btn>
        <Btn title="重做" onClick={() => editor.chain().focus().redo().run()}>
          ↷
        </Btn>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={onPickImage}
        />
      </div>
      <div className="p-6">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
