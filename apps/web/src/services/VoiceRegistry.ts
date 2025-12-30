import { VoiceMemory } from './VoiceMemory';

const ARCHETYPE_VOICE_MAP: Record<string, string> = {
    'legendary_deep': 'OnwK43BLwk03beckhF0D', // "Andrew" (Deep/Standard)
    'narrator_cinematic': 'TxGEqnHWrfWFTfGW9XjX', // "Josh" (Standard Narrator)
    'heroic_youth': 'AZnzlk1XvdvUeBnXmlld', // "Domi" (Young/Energetic)
    'villain_authoritative': 'MF3mGyEYCl7XYWbV9V6O', // "Elli" (Authoritative)
    'comic_high_pitch': 'MF3mGyEYCl7XYWbV9V6O', // (Placeholder - reusing Elli for now or need generic) -> Switching to "Nicole" or similar if available, else sticking to safe defaults
    'wise_elder': 'TxGEqnHWrfWFTfGW9XjX', // Reusing Josh for wise elder for now
    'mob_generic': 'ErXwobaYiN019PkySvjV' // "Antoni"
};

const DEFAULT_VOICE_MAP: Record<string, string> = {
    'Hero': 'AZnzlk1XvdvUeBnXmlld', // Domi
    'Rival': 'OnwK43BLwk03beckhF0D', // Andrew
    'Heroine': '21m00Tcm4TlvDq8ikWAM', // Rachel
    'Mentor': 'TxGEqnHWrfWFTfGW9XjX', // Josh
    'ComicRelief': 'AZnzlk1XvdvUeBnXmlld', // Domi
    'Narrator': 'TxGEqnHWrfWFTfGW9XjX', // Josh
    'Villain': 'MF3mGyEYCl7XYWbV9V6O', // Elli
    'Mob': 'ErXwobaYiN019PkySvjV' // Antoni
};

const FALLBACK_VOICE = 'TxGEqnHWrfWFTfGW9XjX'; // Josh (Narrator)

class VoiceRegistryService {
    private sessionLocks: Map<string, string> = new Map();

    getVoice(characterIdentifier: string, fallbackType?: string, archetype?: string): string {
        if (!characterIdentifier) {
            console.warn('[VoiceRegistry] No character identifier provided, using fallback.');
            return FALLBACK_VOICE;
        }

        // Normalize key (case-insensitive)
        const key = characterIdentifier.toLowerCase().trim();

        // 1. Session Lock (highest priority)
        if (this.sessionLocks.has(key)) {
            console.log(`[VoiceRegistry] Session hit for "${characterIdentifier}"`);
            return this.sessionLocks.get(key)!;
        }

        // 2. Persistent Memory
        const savedVoice = VoiceMemory.suggestVoice(key);
        if (savedVoice && savedVoice !== 'MUM7OlJWbYBSwfFAZgmI') {
            console.log(`[VoiceRegistry] Memory hit for "${characterIdentifier}"`);
            this.lockVoice(key, savedVoice);
            return savedVoice;
        }

        // 3. Assign Voice: Archetype > Type > Fallback
        let assignedVoice = FALLBACK_VOICE;

        if (archetype && ARCHETYPE_VOICE_MAP[archetype]) {
            assignedVoice = ARCHETYPE_VOICE_MAP[archetype];
            console.log(`[VoiceRegistry] Assigned via archetype "${archetype}" for "${characterIdentifier}"`);
        }
        else if (fallbackType && DEFAULT_VOICE_MAP[fallbackType]) {
            assignedVoice = DEFAULT_VOICE_MAP[fallbackType];
            console.log(`[VoiceRegistry] Assigned via type "${fallbackType}" for "${characterIdentifier}"`);
        }
        else if (DEFAULT_VOICE_MAP[key]) {
            assignedVoice = DEFAULT_VOICE_MAP[key];
            console.log(`[VoiceRegistry] Assigned via identifier "${key}"`);
        }
        else {
            console.warn(`[VoiceRegistry] Using fallback voice for "${characterIdentifier}"`);
        }

        // 4. Lock and persist
        this.lockVoice(key, assignedVoice);
        VoiceMemory.saveVoice(key, assignedVoice, 'other', `Auto: ${archetype || fallbackType || 'fallback'}`);

        return assignedVoice;
    }

    lockVoice(characterIdentifier: string, voiceId: string) {
        const key = characterIdentifier.toLowerCase().trim();
        this.sessionLocks.set(key, voiceId);
        console.log(`[VoiceRegistry] Locked "${characterIdentifier}" → ${voiceId}`);
    }

    /**
     * Clear session locks (useful for testing or switching manga)
     */
    clearSession() {
        this.sessionLocks.clear();
        console.log('[VoiceRegistry] Session cleared');
    }
}

export const VoiceRegistry = new VoiceRegistryService();
