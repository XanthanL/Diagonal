"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Color from "@tiptap/extension-color";
import TextStyle from "@tiptap/extension-text-style";
import Superscript from "@tiptap/extension-superscript";
import Subscript from "@tiptap/extension-subscript";
import { useEffect, useRef, useState } from "react";

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
  className: extra,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`px-2.5 py-1 text-sm border transition-colors ${
        active ? "bg-black text-white border-black" : "border-black/20 hover:border-black"
      } ${extra || ""}`}
    >
      {children}
    </button>
  );
}

// 工具栏分隔线
function Sep() {
  return <span className="w-px h-6 bg-black/10 mx-1 self-center" />;
}

const COLORS = [
  { label: "默认", value: "" },
  { label: "红", value: "#c0392b" },
  { label: "蓝", value: "#2980b9" },
  { label: "绿", value: "#27ae60" },
  { label: "橙", value: "#d35400" },
  { label: "紫", value: "#8e44ad" },
  { label: "灰", value: "#7f8c8d" },
];

export function RichEditor({ value, onChange }: RichEditorProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [showColor, setShowColor] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] } }),
      Image.configure({ inline: false }),
      Link.configure({ openOnClick: false }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight.configure({ multicolor: true }),
      TextStyle,
      Color,
      Superscript,
      Subscript,
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

  function setColor(color: string) {
    if (color) {
      editor!.chain().focus().setColor(color).run();
    } else {
      editor!.chain().focus().unsetColor().run();
    }
    setShowColor(false);
  }

  return (
    <div className="border border-black/20 bg-white">
      {/* 工具栏 */}
      <div className="flex flex-wrap gap-1.5 p-2 border-b border-black/10 bg-neutral-50 sticky top-0 z-10">
        {/* 段落格式 */}
        <Btn title="小标题 H2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          H2
        </Btn>
        <Btn title="子标题 H3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          H3
        </Btn>
        <Btn title="小节标题 H4" active={editor.isActive("heading", { level: 4 })} onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}>
          H4
        </Btn>
        <Btn title="正文" active={editor.isActive("paragraph")} onClick={() => editor.chain().focus().setParagraph().run()}>
          正文
        </Btn>

        <Sep />

        {/* 行内样式——加粗和下划线分离 */}
        <Btn title="加粗" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          <b>B</b>
        </Btn>
        <Btn title="斜体" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <i>I</i>
        </Btn>
        <Btn title="下划线" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <span className="underline">U</span>
        </Btn>
        <Btn title="删除线" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <span className="line-through">S</span>
        </Btn>
        <Btn title="高亮标记" active={editor.isActive("highlight")} onClick={() => editor.chain().focus().toggleHighlight({ color: "#fef08a" }).run()}>
          <span className="bg-yellow-200 px-0.5">H</span>
        </Btn>
        <Btn title="上标" active={editor.isActive("superscript")} onClick={() => editor.chain().focus().toggleSuperscript().run()}>
          X<sup className="text-[9px]">²</sup>
        </Btn>
        <Btn title="下标" active={editor.isActive("subscript")} onClick={() => editor.chain().focus().toggleSubscript().run()}>
          X<sub className="text-[9px]">₂</sub>
        </Btn>

        <Sep />

        {/* 文字颜色 */}
        <div className="relative">
          <Btn title="文字颜色" onClick={() => setShowColor(!showColor)}>
            <span className="border-b-2" style={{ borderColor: editor.getAttributes("textStyle").color || "#000" }}>A</span>
          </Btn>
          {showColor && (
            <div className="absolute top-full left-0 mt-1 p-2 bg-white border border-black/20 shadow-lg flex gap-1 z-20">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  title={c.label}
                  onClick={() => setColor(c.value)}
                  className="w-6 h-6 rounded border border-black/20 hover:scale-110 transition-transform"
                  style={{ background: c.value || "#fff" }}
                />
              ))}
            </div>
          )}
        </div>

        <Sep />

        {/* 对齐方式 */}
        <Btn title="左对齐" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}>
          ≡←
        </Btn>
        <Btn title="居中" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}>
          ≡
        </Btn>
        <Btn title="右对齐" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}>
          →≡
        </Btn>

        <Sep />

        {/* 块级元素 */}
        <Btn title="引文" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          &ldquo; &rdquo;
        </Btn>
        <Btn title="无序列表" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          • 列表
        </Btn>
        <Btn title="有序列表" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          1. 列表
        </Btn>
        <Btn title="代码块" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
          &lt;/&gt;
        </Btn>
        <Btn title="分割线" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          ——
        </Btn>

        <Sep />

        {/* 插入 */}
        <Btn title="链接" active={editor.isActive("link")} onClick={addLink}>
          链接
        </Btn>
        <Btn title="插入图片" onClick={() => fileRef.current?.click()}>
          图片
        </Btn>

        <div className="flex-1" />

        {/* 撤销/重做 */}
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
