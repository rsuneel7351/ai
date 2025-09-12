import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Expand, Minimize2 } from "lucide-react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { TypingIndicator } from "./TypingIndicator";

interface Message {
  role: "user" | "bot";
  content: string;
  id: string;
}

export const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullPage, setIsFullPage] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "bot",
      content: "Hello! How can I help you today?",
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (animated) => {
    messagesEndRef.current?.scrollIntoView({ behavior: animated ? "smooth" : "instant" });
  };

  useEffect(() => {
    scrollToBottom(false);
  }, [messages, isTyping]);

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const response = await fetch("http://localhost:3001/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: 101, // dummy user
          message: content,
        }),
      });

      const data = await response.json();

      // Bot response
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "bot",
        content: data.reply || "Sorry, I couldn't fetch a response.",
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error(err);
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: "bot",
        content: "Oops! Something went wrong. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };


  const toggleChat = () => {
    setIsOpen((prev) => !prev);
    if (!isOpen) setIsFullPage(false);
  };

  const toggleFullPage = () => setIsFullPage((prev) => !prev);

  // Floating chat button
  const ChatButton = () => (
    <motion.button
      onClick={toggleChat}
      className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-chat-primary text-chat-primary-foreground shadow-chat-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-chat-primary focus:ring-offset-2"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <MessageCircle className="h-6 w-6 mx-auto" />
    </motion.button>
  );

  // Chat header
  const ChatHeader = () => (
    <div className="flex items-center justify-between p-4 border-b bg-chat-background">
      <div className="flex items-center space-x-3">
        <div className="h-8 w-8 rounded-full bg-chat-primary flex items-center justify-center">
          <MessageCircle className="h-4 w-4 text-chat-primary-foreground" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">Chat Support</h3>
          <p className="text-xs text-muted-foreground">We're here to help</p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={toggleFullPage}
          className="h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
        >
          {isFullPage ? <Minimize2 className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
        </button>
        <button
          onClick={toggleChat}
          className="h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  // Chat messages container
  const ChatMessages = () => (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-chat-background">
      {messages.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}
      {isTyping && <TypingIndicator />}
      <div ref={messagesEndRef} />
    </div>
  );

  const WidgetMode = () => (
    <motion.div
      initial={{ scale: 0, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0, opacity: 0, y: 20 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="fixed bottom-24 right-6 z-40 w-80 h-[500px] bg-card rounded-2xl shadow-chat-lg border overflow-hidden flex flex-col"
    >
      <ChatHeader />
      <ChatMessages />
      <ChatInput onSendMessage={handleSendMessage} />
    </motion.div>
  );

  const FullPageMode = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 bg-chat-background flex flex-col"
    >
      <ChatHeader />
      <ChatMessages />
      <ChatInput onSendMessage={handleSendMessage} />
    </motion.div>
  );

  return (
    <>
      <AnimatePresence>
        {!isOpen && <ChatButton key="chat-button" />}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && !isFullPage && <WidgetMode key="widget-mode" />}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && isFullPage && <FullPageMode key="fullpage-mode" />}
      </AnimatePresence>
    </>
  );
};
