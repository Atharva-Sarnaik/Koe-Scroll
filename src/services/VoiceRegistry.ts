import { VoiceMemory } from './VoiceMemory';

const ARCHETYPE_VOICE_MAP: Record<string, string> = {
    'legendary_deep': 'ODq5zmih8GrVes37Dizd', // Patrick (Deep/Authoritative)
    'narrator_cinematic': 'TxGEqnHWrfWFTfGW9XjX', // Josh (Perfect Narrator)
    'heroic_youth': 'XrExE9yKIg1WjnnlVkGX', // Matilda (Young/Energetic)
    'villain_authoritative': 'MF3mGyEYCl7XYWbV9V6O', // Elli (Sharp/Villainous)
    'comic_high_pitch': 'AZnzlk1XvdvUeBnXmlld', // Domi
    'wise_elder': 't0jbNlBVZ17f02VwhZ8G', // Fin
    'mob_generic': 'ErXwobaYiN019PkySvjV' // Antoni
};

// Predefined Voice Pools (One per type for now, can be expanded to arrays later for rotation)
const DEFAULT_VOICE_MAP: Record<string, string> = {
    'Hero': '4noOStF17rJOfZaXTMeE', // Matilda
    'Rival': '5WwYKz4tfp9v1ovObRmt', // Patrick
    'Heroine': '3oH4FXOgidpRwF00JmQa', // Rachel
    'Mentor': 'MUM7OlJWbYBSwfFAZgmI', // Fin
    'ComicRelief': 'DuvggvInAszcYTL1tIJz', // Domi
    'Narrator': 'TxGEqnHWrfWFTfGW9XjX', // Josh
    'Villain': 'MF3mGyEYCl7XYWbV9V6O', // Elli
    'Mob': 'ErXwobaYiN019PkySvjV' // Antoni
};

const FALLBACK_VOICE = 'TxGEqnHWrfWFTfGW9XjX'; // Josh (Narrator)

class VoiceRegistryService {
    // Runtime lock for the current session
    // Key: character identifier (e.g. "Hero", "Villain", or specific name "Luffy" if available)
    // Value: voiceId
    private sessionLocks: Map<string, string> = new Map();

    /**
     * Retrieves the definitive voice ID for a character.
     * Guaranteed to return the same voice ID for the same character within a session.
     * 
     * @param characterIdentifier The name or type inferred by AI (e.g. "Hero", "Luffy")
     * @param fallbackType Optional type to use for default pool lookup
     * @param archetype Optional visual archetype inferred by AI (e.g. "legendary_deep")
     */
    getVoice(characterIdentifier: string, fallbackType?: string, archetype?: string): string {
        const key = characterIdentifier; // Case-sensitive or normalization handled by caller/VoiceMemory

        // 1. Check Session Lock (Fastest, Highest Priority due to "Never reassign" rule)
        if (this.sessionLocks.has(key)) {
            return this.sessionLocks.get(key)!;
        }

        // 2. Check Persistent Memory (Did user manually assign a voice to "Hero" or "Luffy"?)
        const savedVoice = VoiceMemory.suggestVoice(key);
        if (savedVoice) {
            this.lockVoice(key, savedVoice);
            return savedVoice;
        }

        // 3. Assign Voice based on Priority: Archetype > Type > Default
        let assignedVoice = FALLBACK_VOICE;

        // A. Archetype Match (Visual Context from AI)
        if (archetype && ARCHETYPE_VOICE_MAP[archetype]) {
            assignedVoice = ARCHETYPE_VOICE_MAP[archetype];
        }
        // B. Fallback Type Match (e.g. "Hero")
        else if (fallbackType && DEFAULT_VOICE_MAP[fallbackType]) {
            assignedVoice = DEFAULT_VOICE_MAP[fallbackType];
        }
        // C. Identifier Match (e.g. key="Hero")
        else if (DEFAULT_VOICE_MAP[key]) {
            assignedVoice = DEFAULT_VOICE_MAP[key];
        }

        // 4. Lock this assignment for the session and Persist it
        this.lockVoice(key, assignedVoice);

        // Save to VoiceMemory with archetype info for future reference
        VoiceMemory.saveVoice(key, assignedVoice, 'other', `Auto: ${archetype || fallbackType}`);

        return assignedVoice;
    }

    /**
     * Explicitly locks a voice for a character.
     * Useful when user manually overrides via UI.
     */
    lockVoice(characterIdentifier: string, voiceId: string) {
        this.sessionLocks.set(characterIdentifier, voiceId);
    }
}

export const VoiceRegistry = new VoiceRegistryService();
