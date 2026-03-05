
import OpenAI from "openai";

const openai = new OpenAI();

async function testDalle() {
    try {
        console.log("Testing DALL-E 3 generation...");
        const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: "A simple red apple",
            n: 1,
            size: "1024x1024",
        });
        console.log("Success! Image URL:", response.data[0].url);
    } catch (err: any) {
        if (err.response) {
            console.log("API Error Status:", err.response.status);
            console.log("API Error Data:", err.response.data);
        } else {
            console.error("Error:", err.message);
        }
    }
}

testDalle();
