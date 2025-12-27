import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini Client
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export interface ScriptLine {
    panel_number: number;
    reading_group: 1 | 2; // 1 = Narration, 2 = Dialogue
    reading_order: number; // Placeholder, will be overwritten by engine
    box_2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] (0-1000)
    character_type:
    | "Hero"
    | "Rival"
    | "Heroine"
    | "Mentor"
    | "ComicRelief"
    | "Narrator"
    | "Villain"
    | "Mob";
    voice_archetype?:
    | "legendary_deep"
    | "heroic_youth"
    | "narrator_cinematic"
    | "villain_authoritative"
    | "comic_high_pitch"
    | "mob_generic"
    | "wise_elder";
    emotion:
    | "excited"
    | "angry"
    | "calm"
    | "sad"
    | "confident"
    | "surprised"
    | "fearful"
    | "neutral";
    text: string;
}

export interface CoverAnalysisResult {
    isCover: boolean;
    title?: string;
    confidence: number;
}

export class GeminiService {
    private model;

    constructor() {
        // ✅ Correct model name for SDK
        this.model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
        });
    }



    async analyzePage(imageBase64: string): Promise<ScriptLine[]> {
        try {
            const cleanBase64 = imageBase64.replace(
                /^data:image\/(png|jpeg|webp);base64,/,
                ""
            );

            const prompt = `
You are a MANGA SCRIPTING ENGINE for extracting dialogue and narration from manga panels.

========================
CRITICAL RULES
========================

1. ONLY extract text from STORY PANELS (ignore covers, titles, credits)
2. EACH TEXT BLOCK should be extracted EXACTLY ONCE (no duplicates)
3. Focus on ACCURATE COORDINATES - let the client handle reading order

========================
TEXT CLASSIFICATION
========================

**NARRATION (reading_group: 1)**
- Rectangular caption boxes (usually at top/bottom of panel)
- Third-person storytelling
- Often has dark/solid background
- Example: "A CHILD FROM THE VILLAGE MONKEY D. LUFFY"

**DIALOGUE (reading_group: 2)**
- Speech bubbles with tails pointing to characters
- Character speech
- Examples: "I'M NOT JOKING THIS TIME!!", "HA HA HA!"

========================
CHARACTER TYPE RULES
========================

**Narrator** - ONLY for rectangular caption boxes with third-person narration
**Hero** - Main character (usually center of action, larger presence)
**Mob** - Background characters, crowd reactions, generic voices
**Mentor** - Older/wiser characters
**Villain** - Antagonists
**Rival** - Secondary important character opposing hero
**Heroine** - Female lead
**ComicRelief** - Funny/silly characters

⚠️ IMPORTANT: If speech bubble is from a generic crowd member → use "Mob"
⚠️ IMPORTANT: Only use "Narrator" for caption boxes, NOT for speech bubbles

========================
EMOTION DETECTION
========================

- "!!" or "!!!" → excited or angry
- "..." → calm, sad, or thoughtful
- "!?" → surprised
- CAPS with "!!" → angry or excited
- Question marks → surprised or curious
- Crying/sobbing art → sad
- Default → neutral

========================
GEOMETRY INSTRUCTIONS
========================

For EACH text block, provide accurate bounding box coordinates:
- Format: [ymin, xmin, ymax, xmax]
- Scale: 0-1000 (normalize based on image dimensions)
- ymin = top edge, ymax = bottom edge
- xmin = left edge, xmax = right edge

Example for text in top-right corner:
- ymin: 50 (near top)
- xmin: 700 (right side)
- ymax: 150 (bottom of text)
- xmax: 950 (far right)

========================
DUPLICATE PREVENTION
========================

⚠️ CRITICAL: Each unique text string should appear EXACTLY ONCE in your output.
- If you see "OOUCH!!" in multiple places, extract it ONCE with the most prominent position
- Do NOT extract the same text multiple times even if it appears in multiple speech bubbles
- Sound effects that appear multiple times (like action lines) should be extracted once

========================
OUTPUT FORMAT (STRICT JSON)
========================

Return a SINGLE FLAT JSON ARRAY with this exact structure:

[
  {
    "panel_number": 1,
    "reading_group": 2,
    "reading_order": 0,
    "box_2d": [50, 700, 150, 950],
    "character_type": "Hero",
    "voice_archetype": "heroic_youth",
    "emotion": "excited",
    "text": "I'M NOT JOKING THIS TIME!!"
  }
]

Return ONLY valid JSON. No explanations, no markdown.
`;

            const result = await this.model.generateContent([
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

            const cleaned = responseText
                .replace(/```json/g, "")
                .replace(/```/g, "")
                .trim();

            const parsed = JSON.parse(cleaned) as ScriptLine[];

            // Deduplicate by text content before post-processing
            const uniqueLines = this.deduplicateLines(parsed);

            // Apply post-processing
            const { ScriptPostProcessor } = await import('./ScriptPostProcessor');
            return ScriptPostProcessor.process(uniqueLines);

        } catch (error) {
            console.error("[Gemini] Analysis Failed:", error);
            return [];
        }
    }

    /**
     * Remove duplicate text entries (keeps first occurrence)
     */
    private deduplicateLines(lines: ScriptLine[]): ScriptLine[] {
        const seen = new Set<string>();
        const unique: ScriptLine[] = [];

        for (const line of lines) {
            const normalizedText = line.text.trim().toLowerCase().replace(/\s+/g, '');

            if (!seen.has(normalizedText)) {
                seen.add(normalizedText);
                unique.push(line);
            } else {
                console.log(`[Gemini] Removed duplicate: "${line.text}"`);
            }
        }

        return unique;
    }

    async analyzeCover(imageBase64: string): Promise<CoverAnalysisResult> {
        try {
            const cleanBase64 = imageBase64.replace(
                /^data:image\/(png|jpeg|webp);base64,/,
                ""
            );

            const prompt = `
You are analyzing a manga page to determining if it is a COVER PAGE.

TASK:
1. Determine if this is a cover/title page.
   - Look for large stylized text (title).
   - Check if there are NO distinct story panels (full page art).
   - Check for absence of speech bubbles.
2. If it is a cover, EXTRACT the main title.
   - IGNORE volume numbers (e.g., "Vol 1", "1").
   - IGNORE author names.
   - IGNORE publisher logos.
   - IGNORE subtitles if they are much smaller than the main text.

OUTPUT FORMAT (JSON ONLY):
{
  "isCover": true/false,
  "title": "Extracted Title string (or null if not found)",
  "confidence": 0.0 to 1.0 (float)
}
`;

            const result = await this.model.generateContent([
                { text: prompt },
                {
                    inlineData: {
                        mimeType: "image/png",
                        data: cleanBase64,
                    },
                },
            ]);

            const responseText = result.response.text();
            console.log("[Gemini] Cover Analysis:", responseText);

            const cleaned = responseText
                .replace(/```json/g, "")
                .replace(/```/g, "")
                .trim();

            return JSON.parse(cleaned);

        } catch (error) {
            console.error("[Gemini] Cover Analysis Failed:", error);
            // Default fallback
            return { isCover: false, confidence: 0 };
        }
    }

    async detectChapters(pages: { pageIndex: number; base64: string }[], totalPagesInDoc: number): Promise<{
        volume: { title: string; total_pages: number; total_chapters: number };
        chapters: { chapter_number: number; start_page: number; end_page: number }[];
    }> {
        try {
            // STRICT PROMPT LOGIC
            const prompt = `
You are an AI Manga Librarian.
Your task is to analyze these page images and identifying the STRUCTURE of the manga volume.
The document has a total of ${totalPagesInDoc} pages.

---
### 📘 Volume Detection Rules
1. Treat these images as belonging to exactly one volume.
2. Detect 'volume_title' using:
   - First non-blank title page.
   - Large stylized OCR text (e.g., “ONE PIECE”, “Volume 1”).
3. Identify and mark non-content pages (Cover, Title Splash, Copyright) - DO NOT include these in chapters.

---
### 📑 Chapter Detection Rules
Analyze the provided pages. A page is a **Chapter Start Page** if **any** of the following is true:
- OCR text contains: "CHAPTER", "第X話", "Episode", or Large numeric heading.
- OR page contains: Full-panel narration, No dialogue bubbles, Large centered narration text.
- AND the page is **not** a volume title page.

---
### 🔢 Chapter Structuring Logic
1. When a chapter start is detected:
   - Increment 'chapter_number'.
   - Store 'start_page' (use the provided "Page Index").
2. The chapter 'end_page' is (next_chapter.start_page - 1).
3. The final chapter ends at ${totalPagesInDoc} (or the last page provided if end of batch).

---
### 📤 Output Format (Strict JSON ONLY)
{
  "volume": {
    "title": "Detected Title",
    "total_pages": ${totalPagesInDoc},
    "total_chapters": 0
  },
  "chapters": [
    {
      "chapter_number": 1,
      "start_page": 5,
      "end_page": 27
    }
  ]
}

NOTES:
- If NO clear chapter markers are found, return "chapters": [] and I will use a fallback.
- Do NOT hallucinate headers.
`;

            // Construct parts
            const parts: any[] = [{ text: prompt }];

            pages.forEach(p => {
                parts.push({ text: `Page Index: ${p.pageIndex}` });
                parts.push({
                    inlineData: {
                        mimeType: "image/png",
                        data: p.base64.replace(/^data:image\/(png|jpeg|webp);base64,/, "")
                    }
                });
            });

            const result = await this.model.generateContent(parts);
            const responseText = result.response.text();
            console.log("[Gemini] Structure Analysis:", responseText);

            const cleaned = responseText
                .replace(/```json/g, "")
                .replace(/```/g, "")
                .trim();

            return JSON.parse(cleaned);

        } catch (error) {
            console.error("[Gemini] Chapter Detection Failed:", error);
            // Default: return empty so fallback triggers
            return {
                volume: { title: "Unknown", total_pages: totalPagesInDoc, total_chapters: 0 },
                chapters: []
            };
        }
    }

}

export const geminiService = new GeminiService();
