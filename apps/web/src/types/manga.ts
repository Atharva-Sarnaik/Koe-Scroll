export interface Manga {
  id: string;
  title: string;
  coverImage: string;
  author?: string;
  description?: string;
  chapters: Chapter[]; // List of Chapter objects
  addedDate: number;
  titleSource?: 'cover' | 'filename' | 'user';
  titleConfidence?: number;
  totalPageCount?: number;
  lastRead?: number;
  isDemo?: boolean;
  cover?: string; // Legacy/Alias for coverImage
}

export interface Chapter {
  id: string;
  mangaId: string;
  title: string;
  number: number;
  pages: Page[];
  sourceType?: 'image' | 'pdf';
  contentUrl?: string;
  progress: number; // 0-100 percentage
}

export interface Page {
  id: string;
  chapterId: string;
  imageUrl: string;
  pageNumber: number;
  textBubbles: TextBubble[];
  width?: number;
  height?: number;
  // Metadata for automated processing
  isCover?: boolean;
  excludeFromScript?: boolean;
}

export type BubbleEmotion = 'action' | 'emotional' | 'whisper' | 'normal';

export interface TextBubble {
  id: string;
  text: string;
  characterName: string; // or characterId if linked
  voiceId?: string; // override specific voice
  // Position as percentage of image dimensions for responsiveness
  x: number;
  y: number;
  width: number;
  height: number;
  order: number; // Sequence order on page
  emotion?: BubbleEmotion; // Detected emotion
}
