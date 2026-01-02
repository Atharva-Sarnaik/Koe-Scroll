# Koe Scroll 📜🎙️

> **Manga that speaks back.**
> *A cross-platform AI Manga Dubbing ecosystem built for the Dreamflow Buildathon.*

![Koe Scroll Logo](./uploaded_image_1767344569006.png)

## 📖 Overview

**Koe Scroll** bridges the gap between visual storytelling and audio drama. It uses multimodal AI to analyze static manga pages (PDFs or Images), extract the script with emotional context, and perform it in real-time using distinct character voices.

Available on:
*   **Web:** For discovery, library management, and desktop reading.
*   **Mobile (Android):** For checking offline PDFs and seamless listening on the go.

## ✨ Key Features

*   **🎙️ Real-time AI Dubbing:** Converts text bubbles into audio with distinct "Hero", "Villain", and "Narrator" voices.
*   **🧠 Intelligent Scripting:** Uses **Gemini 2.5 Flash** to analyze layout + a custom **Geometric Sorting Algorithm** (`ScriptPostProcessor`) to correctly order chaotic manga panels.
*   **🎛️ Voice Lab:** Customize your experience. Adjust voice speed, stability, and add custom pronunciations (e.g., "Nakama" → "Na-ka-ma") via a dictionary.
*   **🔄 Cross-Platform Sync:** Start reading on Web, pause, and **"Pick up where you left off"** instantly on Mobile.
*   **📂 Local Import (Mobile):** Open any manga PDF directly from your device storage.

## 🛠️ Tech Stack

### Mobile App (`apps/mobile`)
*   **Framework:** React Native (Expo SDK 52)
*   **PDF Core:** `react-native-pdf`, `react-native-blob-util`
*   **Audio:** `expo-av`, `expo-file-system`
*   **Build:** EAS (Expo Application Services)

### Web Platform (`apps/web`)
*   **Framework:** React.js + Vite
*   **Styling:** TailwindCSS / CSS Modules
*   **State:** Zustand (Persistent Store)

### Backend & AI
*   **Auth & DB:** Supabase (PostgreSQL)
*   **Compute:** Supabase Edge Functions
*   **Vision AI:** Google Gemini 2.5 Flash
*   **Voice AI:** ElevenLabs API

## 🚀 Getting Started

### Prerequisites
*   Node.js & npm/yarn
*   Expo CLI (`npm install -g eas-cli`)
*   Supabase Project
*   API Keys (Gemini, ElevenLabs)

### Installation

1.  **Clone the repo:**
    ```bash
    git clone https://github.com/yourusername/koe-scroll.git
    cd koe-scroll
    ```

2.  **Install dependencies (Root/Monorepo):**
    ```bash
    npm install
    ```

3.  **Environment Setup:**
    Create `.env` files in both `apps/web` and `apps/mobile` based on the provided examples. You will need:
    *   `EXPO_PUBLIC_SUPABASE_URL`
    *   `EXPO_PUBLIC_SUPABASE_ANON_KEY`
    *   `EXPO_PUBLIC_GEMINI_API_KEY`
    *   `EXPO_PUBLIC_ELEVENLABS_API_KEY`

4.  **Run Development Servers:**

    *   **Web:**
        ```bash
        cd apps/web
        npm run dev
        ```

    *   **Mobile:**
        ```bash
        cd apps/mobile
        npx expo start
        ```

## 🧠 The Architecture

1.  **Ingestion:** User uploads a page/PDF.
2.  **Vision Analysis:** Gemini 2.5 Flash scans the image, identifying bounding boxes for text and "Character Types" (Narrator vs. Dialogue).
3.  **Post-Processing:** Our custom `ScriptPostProcessor` clusters these boxes geometrically to strictly enforce Japanese manga reading order (Right-to-Left, Top-to-Bottom).
4.  **Audio Generation:** The structured script is piped to ElevenLabs, generating efficient small audio chunks.
5.  **Playback:** The client buffers/streams these chunks while highlighting the currently spoken text.
