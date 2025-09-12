import React from "react";
import { motion } from "framer-motion";
import { Bot } from "lucide-react";

export const TypingIndicator: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.3 }}
      className="flex items-start space-x-3"
    >
      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-chat-bot flex items-center justify-center">
        <Bot className="h-4 w-4 text-chat-bot-foreground" />
      </div>
      
      <div className="bg-chat-bot text-chat-bot-foreground px-4 py-3 rounded-2xl rounded-bl-md">
        <div className="flex items-center space-x-1">
          <span className="text-sm text-muted-foreground">Bot is typing</span>
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 bg-muted-foreground rounded-full"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{
                  duration: 1.4,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};