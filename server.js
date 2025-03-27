require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { GoogleGenerativeAI } = require("@google/generative-ai");


const app = express();
app.use(cors({ origin: "https://basic-mvp-ritesh5604s-projects.vercel.app/" })); 
app.use(bodyParser.json());

const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
if (!process.env.GEMINI_API_KEY) {
  console.error("🔴 ERROR: GEMINI_API_KEY is not set in .env file.");
  process.exit(1);
}

app.post("/analyze", async (req, res) => {
  const { jobDescription } = req.body;
  if (!jobDescription) {
    return res.status(400).json({ error: "Job description is required." });
  }

  try {
    const model = gemini.getGenerativeModel({ model: "gemini-1.5-pro" });

    const prompt = `Analyze the following job description and extract structured insights in JSON format. Focus on key details like job title, company, salary transparency, and potential red flags related to work-life balance, unrealistic expectations, or toxic culture.  

    Specifically, watch for phrases that suggest:  
    - **Poor work-life balance** (e.g., "24/7 availability," "late nights," "high-pressure environment").  
    - **Unpaid or exploitative work** (e.g., "unpaid internship," "work for exposure").  
    - **Unrealistic expectations** (e.g., "wear multiple hats," "must thrive under extreme pressure").  
    - **Toxic culture risks** (e.g., "fast-paced environment" with no mention of support, "like a family" in a way that suggests blurred boundaries).  
    
    Job Description: ${jobDescription}  
    
    Return ONLY JSON output. Do not add extra text. Follow this format strictly:  
    
    {
      "job_title": "Extracted Job Title",
      "company": "Company Name",
      "salary": "Extracted salary if mentioned (e.g., 'Competitive' or 'Not mentioned' if absent)",
      "red_flags": ["Identified issues such as work-life balance concerns, unpaid expectations, or toxic language"],
      "red_flag_score": "Rate from 1-10 based on severity (1 = ideal, 10 = major concerns)",
      "ratings": {
        "salary_transparency": "Rate 1-10 (lower if vague or absent)",
        "work_life_balance": "Rate 1-10 (lower if long hours or pressure mentioned)",
        "career_growth": "Rate 1-10 (lower if no learning opportunities exist)",
        "toxic_culture_risk": "Rate 1-10 (higher if multiple red flags are present)"
      },
      "insights": ["Any additional comments on the job, such as vague language or hidden expectations"],
      "interview_questions": {
        "candidate_should_ask": [
          "Tailor at least 3-5 smart questions based on the job details.",
          "If salary is missing, suggest asking about compensation range.",
          "If remote work is mentioned, include a question about work culture and team interaction.",
          "If career growth is unclear, suggest asking about promotions or learning opportunities."
        ]
      }
    }`;  

    const response = await model.generateContent({
      contents: [{ parts: [{ text: prompt }] }],
    });

    const rawText = response.response?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!rawText) return res.status(500).json({ error: "No valid response from Gemini API." });

    const cleanedJson = rawText.replace(/```json|```/g, "").trim();
    console.log("🟢 Raw JSON response:", cleanedJson);

    let results;
    try {
      results = JSON.parse(cleanedJson);
    } catch (parseError) {
      console.error("🔴 JSON Parsing Error:", parseError, "Raw Response:", cleanedJson);
      return res.status(500).json({ error: "Failed to parse API response.", raw: cleanedJson });
    }

    // Log the parsed results to debug
    console.log("🟢 Parsed results:", results);

    // Ensure red_flags is an array
    if (!Array.isArray(results.red_flags)) {
      console.log("🔴 red_flags is not an array:", results.red_flags);
      results.red_flags = [];
    }

    // Always calculate red_flag_score based on red_flags.length, ignoring the model's value
    const redFlagScore = results.red_flags.length > 0
      ? Math.min(10, results.red_flags.length * 1) // 3 points per red flag, max 10
      : 0;
    results.red_flag_score = redFlagScore;
    console.log("🟢 Calculated red_flag_score:", results.red_flag_score);

    // Calculate Job Worth Score (0-100)
    let jobScore = 50; // Base score
    if (results.ratings) {
      jobScore += results.ratings.salary_transparency * 2; // 0-20 points
      jobScore += results.ratings.work_life_balance * 2; // 0-20 points
      jobScore += results.ratings.career_growth * 2; // 0-20 points
      jobScore -= results.ratings.toxic_culture_risk * 2; // -20 points if high
    }

    // Ensure Job Score Stays in Range 0-100
    jobScore = Math.min(100, Math.max(0, jobScore));
    results.job_score = jobScore;

    // Generate AI Verdict Based on Score
    if (jobScore >= 80) {
      results.verdict = "🏆 Strong Offer – High Pay & Low Risk!";
    } else if (jobScore >= 60) {
      results.verdict = "⚠️ Decent Offer – But You Can Negotiate.";
    } else {
      results.verdict = "❌ Risky Job – Many Red Flags Detected!";
    }

    console.log("🟢 Final response:", results);
    res.json(results);
  } catch (error) {
    console.error("🔴 Gemini API Error:", error);
    res.status(500).json({ error: "Failed to analyze job description.", details: error.message });
  }
});

const PORT = process.env.PORT || 5000; // Use Render's provided port

app.get("/", (req, res) => {
  res.send("Server is running!");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});