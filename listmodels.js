require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function getModels() {
    try {
        const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models?key=" + process.env.GEMINI_API_KEY);
        const data = await response.json();
        console.log("Available Models:", data);
    } catch (error) {
        console.error("Error fetching models:", error);
    }
}

getModels();
