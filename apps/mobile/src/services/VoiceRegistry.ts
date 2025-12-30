import { VoiceMemory } from './VoiceMemory';

const ARCHETYPE_VOICE_MAP: Record<string, string> = {
    'legendary_deep': 'ODq5zmih8GrVes37Dizd', // Patrick
    'narrator_cinematic': 'TxGEqnHWrfWFTfGW9XjX', // Josh
    'heroic_youth': 'XrExE9yKIg1WjnnlVkGX', // Matilda
    'villain_authoritative': 'MF3mGyEYCl7XYWbV9V6O', // Elli
    'comic_high_pitch': 'AZnzlk1XvdvUeBnXmlld', // Domi
    'wise_elder': 't0jbNlBVZ17f02VwhZ8G', // Fin
    'mob_generic': 'ErXwobaYiN019PkySvjV' // Antoni
};

const DEFAULT_VOICE_MAP: Record<string, string> = {
    'Hero': 'XrExE9yKIg1WjnnlVkGX', // Matilda (energetic youth)
    'Rival': 'ODq5zmih8GrVes37Dizd', // Patrick (deep/serious)
    'Heroine': 'EXAVITQu4vr4xnSDxMaL', // Sarah (female lead)
    'Mentor': 't0jbNlBVZ17f02VwhZ8G', // Fin (wise elder)
    'ComicRelief': 'AZnzlk1XvdvUeBnXmlld', // Domi (high pitch)
    'Narrator': 'TxGEqnHWrfWFTfGW9XjX', // Josh (perfect narrator)
    'Villain': 'MF3mGyEYCl7XYWbV9V6O', // Elli (authoritative)
    'Mob': 'ErXwobaYiN019PkySvjV' // Antoni (generic crowd)
};

const FALLBACK_VOICE = 'TxGEqnHWrfWFTfGW9XjX'; // Josh (Narrator)

class VoiceRegistryService {
    private sessionLocks: Map<string, string> = new Map();

    getVoice(characterIdentifier: string, fallbackType?: string, archetype?: string): string {
        // Normalize key (case-insensitive)
        const key = characterIdentifier.toLowerCase().trim();

        // 1. Session Lock (highest priority)
        if (this.sessionLocks.has(key)) {
            console.log(`[VoiceRegistry] Session hit for "${characterIdentifier}"`);
            return this.sessionLocks.get(key)!;
        }

        // 2. Persistent Memory
        const savedVoice = VoiceMemory.suggestVoice(key);
        if (savedVoice) {
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
