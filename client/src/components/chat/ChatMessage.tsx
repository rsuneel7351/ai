import React from "react";
import { motion } from "framer-motion";
import { Bot, User } from "lucide-react";

interface Message {
  role: "user" | "bot";
  content: string;
  id: string;
}

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isBot = message.role === "bot";

  // Minimal Markdown to HTML converter for bold/italic/code/links/lists
  const convertMarkdownToHtml = (markdown: string): string => {
    const escapeHtml = (unsafe: string) =>
      unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#039;");

    // Preserve code blocks first
    const codeBlockPlaceholderMap: Record<string, string> = {};
    let codeBlockIndex = 0;
    let text = markdown.replace(/```([\s\S]*?)```/g, (_m, p1) => {
      const escaped = escapeHtml(p1.trim());
      const html = `<pre class="whitespace-pre-wrap overflow-x-auto"><code>${escaped}</code></pre>`;
      const key = `__CODE_BLOCK_${codeBlockIndex++}__`;
      codeBlockPlaceholderMap[key] = html;
      return key;
    });

    // Escape remaining HTML
    text = escapeHtml(text);

    // Headings (#, ##, ###)
    text = text.replace(/^###\s+(.*)$/gm, '<h3 class="font-semibold text-base">$1</h3>');
    text = text.replace(/^##\s+(.*)$/gm, '<h2 class="font-semibold text-lg">$1</h2>');
    text = text.replace(/^#\s+(.*)$/gm, '<h1 class="font-semibold text-xl">$1</h1>');

    // Bold and italic
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');

    // Inline code
    text = text.replace(/`([^`]+)`/g, '<code class="bg-black/10 px-1 py-0.5 rounded">$1</code>');

    // Links [text](url)
    text = text.replace(/\[([^\]]+)\]\((https?:[^\)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="underline">$1</a>');

    // Unordered lists
    text = text.replace(/(?:^|\n)(?:[-*])\s+(.+)(?:\n(?:[-*])\s+.+)*/g, (block) => {
      const items = block
        .trim()
        .split(/\n/)
        .map((line) => line.replace(/^[-*]\s+/, '').trim())
        .map((item) => `<li>${item}</li>`) 
        .join('');
      return `<ul class="list-disc pl-5 my-2">${items}</ul>`;
    });

    // Line breaks
    text = text.replace(/\n/g, '<br />');

    // Restore code blocks
    Object.entries(codeBlockPlaceholderMap).forEach(([key, html]) => {
      text = text.replace(key, html);
    });

    return text;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex items-start space-x-3 ${isBot ? "justify-start" : "justify-end"
        }`}
    >
      {isBot && (
        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-chat-bot flex items-center justify-center">
          <Bot className="h-4 w-4 text-chat-bot-foreground" />
        </div>
      )}

      <div
        className={`max-w-[85%] sm:max-w-[75%] md:max-w-[65%] px-4 py-2 rounded-2xl break-words ${isBot
            ? "bg-chat-bot text-chat-bot-foreground rounded-bl-md"
            : "bg-chat-primary text-chat-primary-foreground rounded-br-md"
          }`}
      >
        {/* Render HTML content safely */}
        <div
          className="text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(message.content) }}
        />
      </div>

      {!isBot && (
        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-chat-primary flex items-center justify-center">
          <User className="h-4 w-4 text-chat-primary-foreground" />
        </div>
      )}
    </motion.div>
  );
};
