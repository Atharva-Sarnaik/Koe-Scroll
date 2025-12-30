import { GoogleGenerativeAI } from "@google/generative-ai";
import { ScriptPostProcessor } from './ScriptPostProcessor';
import type { ScriptLine } from "../types/script";

import { SECRETS } from '../constants/Secrets';

// Initialize Gemini Client
// We will initialize instance per call or use a getter to support hot-reloading secrets
const getApiKey = () => process.env.EXPO_PUBLIC_GEMINI_API_KEY || SECRETS.GEMINI_API_KEY || '';

export class GeminiService {
    private model: any;

    constructor() {
        // We delay model init or verify key later
    }

    private getModel() {
        console.log('[Gemini] Checking Keys - Secrets:', JSON.stringify(SECRETS));
        const key = getApiKey();
        if (!key) {
            console.warn('[Gemini] Missing API Key (Env or Secrets)');
            return null;
        }
        return new GoogleGenerativeAI(key).getGenerativeModel({
            model: "gemini-2.5-flash",
        });
    }

    async analyzePage(imageBase64: string): Promise<ScriptLine[]> {
        const model = this.getModel();
        if (!model) {
            console.error("[Gemini] Aborting: No API Key");
            return [];
        }

        try {
            const cleanBase64 = imageBase64.replace(
                /^data:image\/(png|jpeg|webp);base64,/,
                ""
            );

            const prompt = `
You are a MANGA SCRIPTING ENGINE (Mobile Optimized).
Extract dialogue and narration from this manga page.

RULES:
1. ACCURATE COORDINATES [ymin, xmin, ymax, xmax] (0-1000 scale).
2. CLASSIFY: "Dialogue" (reading_group: 2) vs "Narration" (reading_group: 1).
3. CHARACTER TYPES: Hero, Rival, Heroine, Mentor, Narrator, Villain, Mob, ComicRelief.
4. EMOTIONS: excited, angry, calm, sad, fearful, neutral.
5. NO DUPLICATES.

OUTPUT JSON ARRAY:
[
  {
    "reading_group": 2,
    "box_2d": [50, 700, 150, 950],
    "character_type": "Hero",
    "voice_archetype": "heroic_youth",
    "emotion": "excited",
    "text": "I'M NOT JOKING!!"
  }
]
`;

            const result = await model.generateContent([
                { text: prompt },
                {
                    inlineData: {
                        mimeType: "image/png",
                        data: cleanBase64,
                    },
                },
            ]);

            const responseText = result.response.text();
            console.log("[Gemini] Raw Response:", responseText);

            if (!responseText) {
                console.warn("[Gemini] Empty response received");
                return [];
            }

            const cleaned = responseText
                .replace(/```json/g, "")
                .replace(/```/g, "")
                .trim();

            try {
                const parsed = JSON.parse(cleaned) as ScriptLine[];
                console.log(`[Gemini] Parsed ${parsed.length} lines`);
                // Deduplicate
                const uniqueLines = this.deduplicateLines(parsed);
                // Post-process
                return ScriptPostProcessor.process(uniqueLines);
            } catch (parseError) {
                console.error("[Gemini] JSON Parse Error:", parseError, "Cleaned text:", cleaned);
                return [];
            }

        } catch (error) {
            console.error("[Gemini] Analysis Failed:", error);
            return [];
        }
    }

    private deduplicateLines(lines: ScriptLine[]): ScriptLine[] {
        const seen = new Set<string>();
        const unique: ScriptLine[] = [];

        for (const line of lines) {
            const normalizedText = line.text.trim().toLowerCase().replace(/\s+/g, '');

            if (!seen.has(normalizedText)) {
                seen.add(normalizedText);
                unique.push(line);
            }
        }
        return unique;
    }
}

export const geminiService = new GeminiService();
