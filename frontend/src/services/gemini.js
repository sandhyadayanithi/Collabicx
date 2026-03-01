import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

let genAI = null;
if (apiKey) {
    genAI = new GoogleGenerativeAI(apiKey);
} else {
    console.warn("VITE_GEMINI_API_KEY is missing. Gemini AI features will be disabled.");
}

export const generateTasksFromIdea = async (idea) => {
    if (!genAI) {
        throw new Error("Gemini API key is not configured.");
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
You are a hackathon project manager. Your job is to break down a hackathon project idea into a set of highly actionable sprint tasks.

Project Idea: "${idea}"

Generate a JSON array of tasks. Each task should have a "title" (short, actionable string) and a "category" (can be: "Frontend", "Backend", "Design", "General", "Research").
Provide at least 5-8 essential tasks to get started.

Format the output as a valid JSON array ONLY, with no markdown code blocks or extra text.
Example format:
[
  { "title": "Setup project repository and initialize Vite", "category": "General" },
  { "title": "Design user authentication flow", "category": "Design" },
  { "title": "Implement login screen UI", "category": "Frontend" }
]
`;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        // Try to parse the output. It might be wrapped in markdown code blocks occasionally despite instructions, so strip them if present.
        let jsonStr = text;
        if (jsonStr.startsWith('\`\`\`json')) {
            jsonStr = jsonStr.replace(/^\`\`\`json/, '').replace(/\`\`\`$/, '').trim();
        } else if (jsonStr.startsWith('\`\`\`')) {
            jsonStr = jsonStr.replace(/^\`\`\`/, '').replace(/\`\`\`$/, '').trim();
        }

        const tasks = JSON.parse(jsonStr);
        if (!Array.isArray(tasks)) {
            throw new Error("Generated tasks response is not an array.");
        }
        return tasks;
    } catch (error) {
        console.error("Error generating tasks from Gemini:", error);
        throw error;
    }
};
