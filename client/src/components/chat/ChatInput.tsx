import React, { useState } from "react";
import { motion } from "framer-motion";
import { Send } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage }) => {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="border-t bg-chat-input-background p-4">
      <form onSubmit={handleSubmit} className="flex items-end space-x-3">
        <div className="flex-1">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="w-full resize-none rounded-xl border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-chat-primary focus:border-transparent max-h-32 min-h-[2.75rem]"
            rows={1}
          />
        </div>
        <motion.button
          type="submit"
          disabled={!message.trim()}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="h-11 w-11 rounded-xl bg-chat-primary text-chat-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors hover:bg-chat-primary/90 focus:outline-none focus:ring-2 focus:ring-chat-primary focus:ring-offset-2"
        >
          <Send className="h-4 w-4" />
        </motion.button>
      </form>
    </div>
  );
};