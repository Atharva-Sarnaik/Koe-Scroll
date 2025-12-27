import * as dotenv from 'dotenv';
dotenv.config();

async function listModels() {
    const key = process.env.VITE_GEMINI_API_KEY;
    console.log("Using Key:", key?.substring(0, 10) + "...");

    // Use the list endpoint
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log("Response Status:", response.status);
        if (data.models) {
            console.log("Available Models:");
            data.models.forEach((m: any) => console.log(`- ${m.name} (${m.supportedGenerationMethods})`));
        } else {
            console.log("Full Response:", JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error("Fetch failed:", e);
    }
}

listModels();
