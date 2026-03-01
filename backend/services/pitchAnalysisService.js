import admin from 'firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Mock credit functions as requested
const mockCreditSystem = {
    hasSufficientCredits: async (userId, amount) => {
        // In a real implementation this would check the database
        return true;
    },
    deductCredits: async (userId, amount, context) => {
        // Deduct
        return true;
    },
    addCredits: async (userId, amount, context) => {
        // Refund
        return true;
    }
};

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key');

/**
 * Analyzes a pitch using Gemini and saves the results to Firestore.
 * 
 * @param {string} userId - The ID of the user
 * @param {string} targetId - The target or project ID
 * @param {string} pitchContent - The raw text of the pitch
 */
async function analyzePitch(userId, targetId, pitchContent, hackathonIdea = null) {
    const creditCost = 1;

    try {
        // 1. Check if user has enough credits
        const hasEnough = await mockCreditSystem.hasSufficientCredits(userId, creditCost);
        if (!hasEnough) {
            throw new Error("INSUFFICIENT_ANALYZE_CREDITS");
        }

        // 2. Deduct credits optimistically
        await mockCreditSystem.deductCredits(userId, creditCost, "Pitch Analysis");

    } catch (error) {
        if (error.message === "INSUFFICIENT_ANALYZE_CREDITS") {
            throw error;
        }
        throw new Error(`Failed to process credits: ${error.message}`);
    }

    // Define db inside the function so it works if admin is initialized later
    const db = admin.firestore();

    try {
        // 3. Call Gemini
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
        const ideaContext = hackathonIdea
            ? `\nProject / Hackathon Idea Context (the pitch should align with this idea):\n"${hackathonIdea}"\n`
            : '';

        const prompt = `
You are an expert pitch coach and startup mentor. Analyze the following elevator pitch and provide a detailed review.
${ideaContext}
Evaluate how well the pitch communicates the idea, its value proposition, clarity, confidence, and structure. If a project idea is provided, also assess how well the pitch aligns with that idea.
You MUST return the ONLY output as a valid JSON object. Do not include any conversational text, no markdown wrappers, no backticks. Only the raw JSON object.

The requirements for the JSON schema are:
{
  "score": <number between 0 and 100 representing overall quality>,
  "clarityScore": <number between 0 and 100>,
  "confidenceScore": <number between 0 and 100>,
  "structureScore": <number between 0 and 100>,
  "best_part": "<string describing the most impressive or impactful part of the pitch>",
  "strengths": ["<string>", "<string>"],
  "improvements": ["<string>", "<string>"],
  "feedback": "<string general constructive feedback>",
  "worse_part": "<string describing the weakest part>"
}

Here is the pitch text to analyze:
"${pitchContent}"
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const textResult = response.text();

        // 4. Clean up response (RegEx for stripping markdown like ```json...```)
        const cleanedText = textResult.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();

        // 5. Parse JSON
        let analysisData;
        try {
            analysisData = JSON.parse(cleanedText);
        } catch (parseError) {
            throw new Error("Failed to parse Gemini response as JSON. Raw output: " + cleanedText);
        }

        // 6. Clamp scores using Math.min and Math.max to ensure they are 0-100
        const clamp = (val) => Math.max(0, Math.min(100, Number(val) || 0));

        const finalData = {
            overallScore: clamp(analysisData.score),
            clarityScore: clamp(analysisData.clarityScore),
            confidenceScore: clamp(analysisData.confidenceScore),
            structureScore: clamp(analysisData.structureScore),
            best_part: analysisData.best_part || "",
            worse_part: analysisData.worse_part || "",
            feedback: analysisData.feedback || "",
            strengths: Array.isArray(analysisData.strengths) ? analysisData.strengths : [],
            improvements: Array.isArray(analysisData.improvements) ? analysisData.improvements : [],
        };

        // 7. Save to Firestore
        const docId = `${userId}_${targetId}`;
        const pitchRef = db.collection('user_pitches').doc(docId);

        const firestoreData = {
            userId,
            targetId,
            pitchContent,
            ...finalData,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            hasStarted: true
        };

        await pitchRef.set(firestoreData, { merge: true });

        // 8. Return data to frontend
        return firestoreData;

    } catch (error) {
        // 9. Error handling: refund credits on failure
        try {
            await mockCreditSystem.addCredits(userId, creditCost, "Pitch Analysis Refund Due to Error");
        } catch (refundError) {
            console.error("Failed to refund credits after analysis error!", refundError);
        }

        throw error;
    }
}

export {
    analyzePitch
};

