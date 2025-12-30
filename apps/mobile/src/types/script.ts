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
