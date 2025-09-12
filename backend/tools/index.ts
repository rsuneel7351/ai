import { Tool } from "../utils";
import pool from "../database";

export const TOOLS: Record<
    string,
    { execute: (params: { sql: string }) => Promise<{ rows: any[]; error?: string }> }
> = {
    query_courses: {
        execute: async ({ sql }) => {
            if (!sql.toLowerCase().includes("courses_course")) {
                return { rows: [], error: "Query must target courses_course." };
            }
            const result = await pool.query(sql);
            return { rows: result.rows };
        },
    },
    query_subjects: {
        execute: async ({ sql }) => {
            if (!sql.toLowerCase().includes("courses_subjects")) {
                return { rows: [], error: "Query must target courses_subjects." };
            }
            const result = await pool.query(sql);
            return { rows: result.rows };
        },
    },
    query_course_subjects: {
        execute: async ({ sql }) => {
            // Ensure subject names are included
            let finalSql = sql;
            if (!sql.toLowerCase().includes("join")) {
                // Inject JOIN if missing
                finalSql = `
          SELECT cs.id, cs.name, cs.description
          FROM courses_coursesubjects ccs
          JOIN courses_subjects cs ON cs.id = ccs.subject_id
          WHERE ccs.course_id IN (
            SELECT id FROM courses_course WHERE ${sql.split("WHERE")[1] || "1=1"}
          )
        `;
            }
            const result = await pool.query(finalSql);
            return { rows: result.rows };
        },
    },
    query_chapters: {
        execute: async ({ sql }) => {
            if (!sql.toLowerCase().includes("courses_chapters")) {
                return { rows: [], error: "Query must target courses_chapters." };
            }
            const result = await pool.query(sql);
            return { rows: result.rows };
        },
    },
    query_subject_chapters: {
        execute: async ({ sql }) => {
            let finalSql = sql;
            if (!sql.toLowerCase().includes("join")) {
                // Auto-join so we always get chapter names
                finalSql = `
              SELECT ch.id, ch.name, ch.description, ch.no_of_videos, ch.no_of_mcqs, ch.no_of_simulations
              FROM courses_subjectchapters csc
              JOIN courses_chapters ch ON ch.id = csc.chapter_id
              WHERE csc.subject_id IN (
                SELECT id FROM courses_subjects WHERE ${sql.split("WHERE")[1] || "1=1"}
              )
            `;
            }
            const result = await pool.query(finalSql);
            return { rows: result.rows };
        },
    },
    query_questions: {
        execute: async ({ sql }) => {
            if (
                !sql.toLowerCase().includes("questions_testquestions") ||
                !sql.toLowerCase().includes("questions_questioncontents")
            ) {
                return { rows: [], error: "Query must target questions_testquestions or questions_questioncontents." };
            }
            const result = await pool.query(sql);
            return { rows: result.rows };
        },
    },
};

export function buildToolContext() {
    return `
    - query_courses → SELECT from "courses_course"
      Allowed columns:
        id, name, short_description, description, requirements,
        duration, price, discount, total_reviews, total_video_duration,
        total_questions, avg_rating, objectives_summary, features,
        status, image, banner_image, created_at, updated_at,
        assessment_test_testlet, assessment_test_each, mock_test_pattern
  
    - query_subjects → SELECT from "courses_subjects"
      Allowed columns:
        id, name, description, status, created_at, updated_at,
        no_of_mcqs, no_of_simulations, no_of_videos, no_of_videos_duration, total_questions
  
    - query_course_subjects → SELECT course-subject mappings
      Must JOIN "courses_coursesubjects" with "courses_subjects"
      Always return subject names, not just IDs
      Allowed columns: course_id, subject_id, order, plus subject.name/description
  
    - query_chapters → SELECT from "courses_chapters"
      Allowed columns:
        id, name, description, no_of_videos, no_of_videos_dur,
        no_of_mcqs, no_of_simulations, total_questions, status, created_at, updated_at
  
    - query_subject_chapters → SELECT subject-chapter mappings
      Must JOIN "courses_subjectchapters" with "courses_chapters"
      Always return chapter names, not just IDs
      Allowed columns: subject_id, chapter_id, order, plus chapter.name/description
       - query_questions → SELECT from "questions_testquestions" + "questions_questioncontents"
      Must JOIN "questions_questioncontents" ON questions_testquestions.id = questions_testquestions.test_question_id
      Allowed columns:
        questions_testquestions.id_number, questions_testquestions.question_type, questions_testquestions.level, 
        questions_questioncontents.question, questions_questioncontents.solution_description, questions_questioncontents.sub_questions

    🔹 If user input contains an id_number (like KCGFARFSRPM0002), 
    always fetch the question + solution_description 
    by joining questions_testquestions with questions_questioncontents.

    🔹 If user asks "solution", "answer", "explain", return solution_description.  

    🔹 If user asks "give me the question", return the question field.  

    🔹 If both are asked, return both question and solution.  

    Examples:
    - "Give me question KCGFARFSRPM0002" → return question
    - "KCGFARFSRPM0002 ka solution" → return solution_description
    - "Explain KCGFARFSRPM0002" → return question + solution_description

    `;
}