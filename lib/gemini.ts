import { GoogleGenerativeAI } from "@google/generative-ai";
import { ContentDraft } from "@/types";
import { ExternalAPIError } from "@/lib/errors";

export class GeminiService {
    private genAI: GoogleGenerativeAI;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private model: any;

    constructor(apiKey: string) {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    }

    async generateContent(diff: string, context: string): Promise<ContentDraft[]> {
        const prompt = `
      You are an expert developer advocate. Transform the following code diff into engaging content.
      
      CONTEXT:
      ${context}

      CODE DIFF:
      ${diff}

      OUTPUT INSTRUCTIONS:
      Generate 3 distinct pieces of content in JSON format:
      1. Twitter Thread (casual, hook-driven)
      2. LinkedIn Post (professional, achievement-oriented)
      3. Blog Outline (educational, deep dive)

      Return strictly a JSON array of objects with keys: id, type, content, tone.
      Do not include markdown formatting like \`\`\`json.
    `;

        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text().replace(/```json/g, "").replace(/```/g, "").trim();
            return JSON.parse(text);
        } catch (error) {
            throw new ExternalAPIError("Failed to generate content with Gemini", {
                api: "Gemini",
                endpoint: "generateContent",
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }
}
