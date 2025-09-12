import axios from 'axios';
import dotenv from 'dotenv';
import { ChromaClient } from "chromadb";
import OpenAI from "openai";
import pool from './database';
import { buildToolContext, TOOLS } from './tools';
dotenv.config();
interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: { role: string; content: string };
    finish_reason: string;
  }[];
}
interface OpenRouterMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}


export class OpenRouterService {
  private apiKey: string;
  private siteUrl: string;
  private siteName: string;
  private chroma: ChromaClient;
  private openai: OpenAI;
  private openAiKey: string
  // ✅ in-memory history store (you can replace with DB like Redis/Mongo later)
  private userHistories: Map<number, OpenRouterMessage[]> = new Map();

  constructor() {
    this.openAiKey = process.env.OPENAI_API_KEY || ""
    this.openai = new OpenAI({
      apiKey: this.openAiKey, // set in .env
    })
    this.apiKey = process.env.OPENROUTER_API_KEY || "";
    this.siteUrl = process.env.SITE_URL || "http://localhost:3000";
    this.siteName = process.env.SITE_NAME || "Agent App";
    this.chroma = new ChromaClient({
      host: "localhost",
      port: 8000,
      ssl: false,
    });

    if (!this.apiKey) {
      throw new Error("OPENROUTER_API_KEY is required");
    }
  }
  async embedText(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: "text-embedding-3-small", // or "text-embedding-3-large"
      input: text,
    });

    console.log("✅ Embedding response:", response);
    return response.data[0].embedding;
  }


  private async chatCompletion(
    messages: OpenRouterMessage[],
    model: string = "gpt-4.1"
    // model: string = "nvidia/nemotron-nano-9b-v2:free"
  ): Promise<string> {
    try {
      // const response = await axios.post<OpenRouterResponse>(
      //   "https://openrouter.ai/api/v1/chat/completions",
      //   { model, messages },
      //   {
      //     headers: {
      //       Authorization: `Bearer ${this.apiKey}`,
      //       "HTTP-Referer": this.siteUrl,
      //       "X-Title": this.siteName,
      //       "Content-Type": "application/json",
      //     },
      //   }
      // );
      const response = await axios.post<OpenAIResponse>(
        "https://api.openai.com/v1/chat/completions",
        {
          model,
          messages,
        },
        {
          headers: {
            Authorization: `Bearer ${this.openAiKey}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (response.data.choices && response.data.choices.length > 0) {
        return response.data.choices[0].message.content;
      }

      throw new Error("No response from OpenRouter API");
    } catch (error) {
      console.error("❌ OpenRouter API error:", error);
      if (axios.isAxiosError(error)) {
        throw new Error(
          `OpenRouter API error: ${error.response?.status
          } - ${error.response?.data?.error?.message || error.message}`
        );
      }
      throw new Error("Failed to get response from OpenRouter API");
    }
  }

  private async fetchBlogAnswer(query: string): Promise<string | null> {
    try {
      const collection = await this.chroma.getOrCreateCollection({
        name: "kcglobed_blogs",
        embeddingFunction: {
          generate: async (texts: string[]) => {
            console.log("Embedding with OpenRouter (query):", texts);
            return Promise.all(texts.map((t) => this.embedText(t)));
          },
        },
      });

      const results = await collection.query({
        queryTexts: [query],
        nResults: 3,
      });

      if (results.documents && results.documents[0].length > 0) {
        return results.documents[0]
          .map((doc: any, i: number) => {
            const meta = results.metadatas?.[0]?.[i];
            return `📌 **${meta?.title}**\n🔗 ${meta?.url}\n${doc}`;
          })
          .join("\n\n");
      }

      return null;
    } catch (err) {
      console.error("❌ Blog fetch error:", err);
      return null;
    }
  }


  // async generateReply(userMessage: string, userId: number): Promise<string> {
  //   const blogContext = await this.fetchBlogAnswer(userMessage);
  //   const history: OpenRouterMessage[] = this.userHistories.get(userId) ?? [];

  //   // ✅ SYSTEM MESSAGE ME TOOL CALLING KA RULE
  //   const systemMessage: OpenRouterMessage = {
  //     role: "system",
  //     content: `
  //       You are KC GlobedBot, a finance LMS agent.

  //       If the user asks about courses (name, description, price, duration, rating, etc),
  //       you MUST respond with a JSON tool call in this format:
  //       {
  //         "tool": "query_courses",
  //         "sql": "SELECT ..."
  //       }

  //       Rules for tool:
  //       - Only SELECT queries
  //       - Only on "courses_course" table
  //       - Allowed columns:
  //         id, name, short_description, description, requirements,
  //         duration, price, discount, total_reviews, total_video_duration,
  //         total_questions, avg_rating, objectives_summary, features,
  //         status, image, banner_image, created_at, updated_at,
  //         assessment_test_testlet, assessment_test_each, mock_test_pattern

  //       If the query is not about courses, just answer normally.
  //       ${blogContext ? `\n\n📚 Blog context:\n${blogContext}` : ""}
  //     `,
  //   };

  //   const newUserMessage: OpenRouterMessage = { role: "user", content: userMessage };
  //   const messages: OpenRouterMessage[] = [systemMessage, ...history, newUserMessage];

  //   const reply = await this.chatCompletion(messages);

  //   // ✅ TOOL CALL DETECT KARO
  //   if (reply.startsWith("{") && reply.includes('"tool": "query_courses"')) {
  //     try {
  //       const toolCall = JSON.parse(reply);
  //       const sql = toolCall.sql;

  //       // ✅ Basic checks
  //       if (!sql || typeof sql !== "string") {
  //         throw new Error("Missing or invalid SQL.");
  //       }
  //       if (!sql.toLowerCase().startsWith("select")) {
  //         throw new Error("Only SELECT queries are allowed.");
  //       }
  //       if (!sql.toLowerCase().includes("courses_course")) {
  //         throw new Error("Query must target the 'courses_course' table.");
  //       }

  //       // ✅ Run DB query
  //       const result = await pool.query(sql);

  //       // ✅ Convert DB result → natural reply
  //       return await this.chatCompletion([
  //         {
  //           role: "system",
  //           content: "Convert SQL query results into a clear natural language answer for the user.",
  //         },
  //         {
  //           role: "user",
  //           content: `User asked: "${userMessage}". SQL result: ${JSON.stringify(result.rows)}`,
  //         },
  //       ]);

  //     } catch (err: any) {
  //       console.error("⚠️ SQL execution failed, falling back:", err.message || err);

  //       // ✅ Fallback → still return a useful answer
  //       return await this.chatCompletion([
  //         {
  //           role: "system",
  //           content: `
  //             You are a helpful finance LMS assistant. 
  //             The database query tool failed, but you should still answer the user naturally.
  //             Use your general knowledge and context to provide a useful response.
  //             Do NOT mention tool failure to the user.
  //           `,
  //         },
  //         {
  //           role: "user",
  //           content: `Original question: "${userMessage}"`,
  //         },
  //       ]);
  //     }
  //   }



  //   // ✅ Normal reply if no tool call
  //   return reply;
  // }


  async generateReply(userMessage: string, userId: number): Promise<string> {
    const blogContext = await this.fetchBlogAnswer(userMessage);
    const history: OpenRouterMessage[] = this.userHistories.get(userId) ?? [];

    const systemMessage: OpenRouterMessage = {
      role: "system",
      content: `
        If the user asks about **courses, subjects, course-subject mappings, chapters, or subject-chapter mappings**,  
      you MUST respond with a JSON tool call in this format:
      { "tool": "<tool_name>", "sql": "SELECT ..." }
  
        Available tools:
        ${buildToolContext()}
        {
        "tables": {
          "courses_course": ["id", "name"],
          "courses_subjects": ["id", "name", "course_id"],
          "courses_subjectchapters": ["id", "subject_id", "chapter_id"],
          "courses_chapters": ["id", "name"]
        },
        "relations": [
          "courses_course.id = courses_subjects.course_id",
          "courses_subjects.id = courses_subjectchapters.subject_id",
          "courses_chapters.id = courses_subjectchapters.chapter_id"
        ]
      }

        Rules for tools:
        - Only SELECT queries
        - Only the specified table per tool
        - Only allowed columns
        - For course-subject queries, always return subject names instead of IDs
  
        If the query is not about these tables, just answer normally.
        ${blogContext ? `\n\n📚 Blog context:\n${blogContext}` : ""}
      `,
    };

    const newUserMessage: OpenRouterMessage = { role: "user", content: userMessage };
    const messages: OpenRouterMessage[] = [systemMessage, ...history, newUserMessage];

    const reply = await this.chatCompletion(messages);

    // ✅ Detect tool call
    if (reply.startsWith("{") && reply.includes('"tool":')) {
      try {
        const toolCall = JSON.parse(reply);
        const toolName = toolCall.tool;
        const sql = toolCall.sql;

        const tool = TOOLS[toolName];
        if (!tool) {
          throw new Error(`Unknown tool: ${toolName}`);
        }

        const result = await tool.execute({ sql });

        if (result.error) throw new Error(result.error);

        // ✅ Natural reply from DB result
        return await this.chatCompletion([
          { role: "system", content: "Convert SQL query results into a clear natural language answer for the user. Always show subject names if available." },
          { role: "user", content: `User asked: "${userMessage}". SQL result: ${JSON.stringify(result.rows)}` },
        ]);

      } catch (err: any) {
        console.error("⚠️ Tool execution failed, fallback:", err.message || err);

        return await this.chatCompletion([
          { role: "system", content: "You are a helpful finance LMS assistant. Database tool failed, but still answer naturally without mentioning failure." },
          { role: "user", content: `Original question: "${userMessage}"` },
        ]);
      }
    }

    // ✅ Normal reply if no tool
    return reply;
  }

}
export default OpenRouterService;
