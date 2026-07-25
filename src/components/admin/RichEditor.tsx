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
import { useCallback, useEffect, useRef, useState } from "react";

interface RichEditorProps {
  value: string;
  onChange: (html: string) => void;
}

// —— 工具函数 ——

const MAX_IMAGE_WIDTH = 1600;
const IMAGE_QUALITY = 0.82;

/** 压缩图片：缩放到最大宽度并降低质量 */
async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img");
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > MAX_IMAGE_WIDTH) {
        height = Math.round(height * (MAX_IMAGE_WIDTH / width));
        width = MAX_IMAGE_WIDTH;
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", IMAGE_QUALITY));
    };
    img.onerror = reject;
    img.src = url;
  });
}

/** 粘贴 HTML 时清理微信/Word等带入的脏样式 */
function cleanPastedHtml(html: string): string {
  return html
    // 移除 style 属性（保留基本语义标签）
    .replace(/\s*style="[^"]*"/gi, "")
    // 移除 class 属性
    .replace(/\s*class="[^"]*"/gi, "")
    // 移除空 span
    .replace(/<span>(.*?)<\/span>/gi, "$1")
    // 移除 Word/WPS 特有标签
    .replace(/<\/?o:[^>]*>/gi, "")
    .replace(/<\/?v:[^>]*>/gi, "")
    .replace(/<\/?w:[^>]*>/gi, "")
    // 移除注释
    .replace(/<!--[\s\S]*?-->/g, "")
    // 移除空段落
    .replace(/<p>\s*<\/p>/gi, "")
    // 移除 font 标签
    .replace(/<\/?font[^>]*>/gi, "");
}

// —— UI 组件 ——

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

// —— 主组件 ——

export function RichEditor({ value, onChange }: RichEditorProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [showColor, setShowColor] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] } }),
      Image.configure({ inline: false, allowBase64: true }),
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
      // 粘贴时自动清理脏样式
      transformPastedHTML(html) {
        return cleanPastedHtml(html);
      },
      // 粘贴图片处理
      handlePaste(view, event) {
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.startsWith("image/")) {
            event.preventDefault();
            const file = items[i].getAsFile();
            if (file) {
              compressImage(file).then((dataUrl) => {
                const caption = "";
                view.dispatch(
                  view.state.tr.replaceSelectionWith(
                    view.state.schema.nodes.image.create({ src: dataUrl, alt: caption })
                  )
                );
              });
            }
            return true;
          }
        }
        return false;
      },
      // 拖拽图片处理
      handleDrop(view, event) {
        const files = event.dataTransfer?.files;
        if (!files || files.length === 0) return false;
        const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
        if (imageFiles.length === 0) return false;
        event.preventDefault();
        const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos;
        imageFiles.forEach((file) => {
          compressImage(file).then((dataUrl) => {
            const node = view.state.schema.nodes.image.create({ src: dataUrl, alt: file.name });
            if (pos !== undefined) {
              view.dispatch(view.state.tr.insert(pos, node));
            } else {
              view.dispatch(view.state.tr.replaceSelectionWith(node));
            }
          });
        });
        return true;
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
      setCharCount(editor.getText().length);
    },
    immediatelyRender: false,
  });

  // 外部 value 变化时同步
  useEffect(() => {
    if (editor && value && editor.getHTML() !== value) {
      editor.commands.setContent(value, false);
      setCharCount(editor.getText().length);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, value]);

  // 初始化字数
  useEffect(() => {
    if (editor) setCharCount(editor.getText().length);
  }, [editor]);

  // 拖拽状态
  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);
  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);
  const onDrop = useCallback(() => setIsDragOver(false), []);

  if (!editor) return <div className="opacity-40 text-sm p-4">编辑器加载中…</div>;

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    for (const f of files) {
      const dataUrl = await compressImage(f);
      const caption = window.prompt("图片说明（可留空，作为 figcaption）", f.name) || f.name;
      editor!.chain().focus().setImage({ src: dataUrl, alt: caption }).run();
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  function addLink() {
    const url = window.prompt("链接地址（http://…）");
    if (url) editor!.chain().focus().setLink({ href: url }).run();
  }

  function removeLink() {
    editor!.chain().focus().unsetLink().run();
  }

  function clearFormat() {
    editor!.chain().focus().clearNodes().unsetAllMarks().run();
  }

  function editImageCaption() {
    // 获取当前选中的 image 节点
    const { state } = editor!;
    const { from } = state.selection;
    const node = state.doc.nodeAt(from);
    if (node?.type.name === "image") {
      const current = node.attrs.alt || "";
      const caption = window.prompt("图片说明 (figcaption)", current);
      if (caption !== null) {
        editor!.chain().focus().updateAttributes("image", { alt: caption }).run();
      }
    } else {
      window.alert("请先点击选中一张图片");
    }
  }

  function insertVideo() {
    const url = window.prompt("视频链接（支持 YouTube / Bilibili / 直接 mp4 链接）");
    if (!url) return;
    // 判断是否为直接视频文件
    if (/\.(mp4|webm|ogg)$/i.test(url)) {
      editor!.commands.insertContent(
        `<div class="video-embed"><video controls src="${url}" style="width:100%;max-width:100%"></video></div>`
      );
    } else {
      // iframe 嵌入（YouTube/Bilibili/通用）
      let embedUrl = url;
      // YouTube
      const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
      if (ytMatch) embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`;
      // Bilibili
      const biliMatch = url.match(/bilibili\.com\/video\/(BV[\w]+)/);
      if (biliMatch) embedUrl = `https://player.bilibili.com/player.html?bvid=${biliMatch[1]}&autoplay=0`;

      editor!.commands.insertContent(
        `<div class="video-embed" style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden"><iframe src="${embedUrl}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0" allowfullscreen></iframe></div>`
      );
    }
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
    <div
      className={`border bg-white transition-colors ${
        isDragOver ? "border-blue-400 bg-blue-50/30" : "border-black/20"
      }`}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {/* 工具栏 */}
      <div className="flex flex-wrap gap-1.5 p-2 border-b border-black/10 bg-neutral-50 sticky top-0 z-10">
        {/* 段落格式 */}
        <Btn title="小标题 H2 (Ctrl+Alt+2)" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          H2
        </Btn>
        <Btn title="子标题 H3 (Ctrl+Alt+3)" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          H3
        </Btn>
        <Btn title="小节标题 H4 (Ctrl+Alt+4)" active={editor.isActive("heading", { level: 4 })} onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}>
          H4
        </Btn>
        <Btn title="正文 (Ctrl+Alt+0)" active={editor.isActive("paragraph")} onClick={() => editor.chain().focus().setParagraph().run()}>
          正文
        </Btn>

        <Sep />

        {/* 行内样式 */}
        <Btn title="加粗 (Ctrl+B)" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          <b>B</b>
        </Btn>
        <Btn title="斜体 (Ctrl+I)" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <i>I</i>
        </Btn>
        <Btn title="下划线 (Ctrl+U)" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <span className="underline">U</span>
        </Btn>
        <Btn title="删除线 (Ctrl+Shift+S)" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <span className="line-through">S</span>
        </Btn>
        <Btn title="高亮标记 (Ctrl+Shift+H)" active={editor.isActive("highlight")} onClick={() => editor.chain().focus().toggleHighlight({ color: "#fef08a" }).run()}>
          <span className="bg-yellow-200 px-0.5">H</span>
        </Btn>
        <Btn title="上标" active={editor.isActive("superscript")} onClick={() => editor.chain().focus().toggleSuperscript().run()}>
          X<sup className="text-[9px]">²</sup>
        </Btn>
        <Btn title="下标" active={editor.isActive("subscript")} onClick={() => editor.chain().focus().toggleSubscript().run()}>
          X<sub className="text-[9px]">₂</sub>
        </Btn>
        <Btn title="清除格式" onClick={clearFormat}>
          ✕格式
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

        {/* 对齐 */}
        <Btn title="左对齐 (Ctrl+Shift+L)" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}>
          ≡←
        </Btn>
        <Btn title="居中 (Ctrl+Shift+E)" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}>
          ≡
        </Btn>
        <Btn title="右对齐 (Ctrl+Shift+R)" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}>
          →≡
        </Btn>

        <Sep />

        {/* 块级 */}
        <Btn title="引文 (Ctrl+Shift+B)" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          &ldquo; &rdquo;
        </Btn>
        <Btn title="无序列表 (Ctrl+Shift+8)" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          • 列表
        </Btn>
        <Btn title="有序列表 (Ctrl+Shift+7)" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
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
        <Btn title="链接 (Ctrl+K)" active={editor.isActive("link")} onClick={addLink}>
          链接
        </Btn>
        {editor.isActive("link") && (
          <Btn title="取消链接" onClick={removeLink}>
            ✕链接
          </Btn>
        )}
        <Btn title="插入图片（支持拖拽/粘贴）" onClick={() => fileRef.current?.click()}>
          图片
        </Btn>
        <Btn title="编辑图片说明 (figcaption)" onClick={editImageCaption}>
          图注
        </Btn>
        <Btn title="嵌入视频（YouTube/Bilibili/mp4）" onClick={insertVideo}>
          视频
        </Btn>

        <div className="flex-1" />

        {/* 撤销/重做 */}
        <Btn title="撤销 (Ctrl+Z)" onClick={() => editor.chain().focus().undo().run()}>
          ↶
        </Btn>
        <Btn title="重做 (Ctrl+Shift+Z)" onClick={() => editor.chain().focus().redo().run()}>
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

      {/* 编辑区 */}
      <div className="p-6 min-h-[200px]">
        {isDragOver && (
          <div className="text-center text-blue-500 text-sm py-2 mb-2 border border-dashed border-blue-300 rounded bg-blue-50/50">
            松开鼠标插入图片
          </div>
        )}
        <EditorContent editor={editor} />
      </div>

      {/* 底部状态栏：字数统计 */}
      <div className="flex items-center justify-between px-4 py-1.5 border-t border-black/5 bg-neutral-50 text-[11px] text-black/40">
        <span>{charCount} 字</span>
        <span className="opacity-60">支持拖拽/粘贴图片 · Ctrl+K 链接 · Ctrl+B 加粗 · Ctrl+U 下划线</span>
      </div>
    </div>
  );
}
