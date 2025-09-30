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
          dangerouslySetInnerHTML={{ __html: message.content }}
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
