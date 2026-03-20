require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Google Gemini Client (requires GEMINI_API_KEY in .env)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "placeholder-key-for-now");

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Debug Backend API is running." });
});

// AI Triage Route
app.post("/api/triage", async (req, res) => {
  try {
    const { reportDescription, severity } = req.body;
    
    if (!reportDescription) {
        return res.status(400).json({ error: "Missing report description" });
    }

    // Using flash model for fast triage operations
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `
      You are an expert security researcher and Web3 Bug Bounty technical evaluator.
      Please triage the following vulnerability report to determine its validity, risk severity, and outline reproduction steps.
      Please format your response strictly as a JSON object with properties:
      - isValid (boolean)
      - evaluatedSeverity (string: Low/Medium/High/Critical)
      - confidenceScore (number 1-100)
      - feedback (string: Short critical feedback to the researcher)
      
      Researcher Report:
      ${reportDescription}
      
      Claimed Severity: ${severity || 'None provided'}
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Best-effort JSON extraction strategy from LLM output
    let jsonResult;
    try {
        const jsonMatch = responseText.match(/\{[\s\S]*?\}/);
        jsonResult = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);
    } catch (err) {
        // Fallback if parsing fails
        jsonResult = { 
            isValid: true, 
            evaluatedSeverity: "Review Required", 
            confidenceScore: 50, 
            feedback: "Automated analysis couldn't confidently parse out the required metrics. Manual review triggered." 
        };
    }

    res.json(jsonResult);
  } catch (error) {
    console.error("AI Triage Error:", error);
    res.status(500).json({ error: "Failed to process AI triage" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}...`);
});
