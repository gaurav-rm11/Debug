require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Google Gemini Client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "placeholder-key");

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Debug AI Engine is online and triaging." });
});

/**
 * AI ANALYZE REPORT
 * Endpoint for deep technical analysis of a structured report.
 */
app.post("/api/ai/analyze-report", async (req, res) => {
  try {
    const { title, description, steps, poc, impact } = req.body;
    
    if (!title || !description) {
        return res.status(400).json({ error: "Insufficient report documentation for AI analysis." });
    }

    // Using gemini-1.5-flash for high-speed triage/analysis
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `
      You are an elite Lead Security Engineer at a top-tier Bug Bounty platform.
      Analyze the following structured vulnerability report and provide a strategic triage assessment.
      
      REPORT DATA:
      Title: ${title}
      Description: ${description}
      Steps: ${steps}
      PoC: ${poc}
      Impact: ${impact}

      Your task is to provide an advisory technical review for the organization.
      Format your response STRICTLY as a JSON object with these fields:
      - summary: (string) A 2-sentence executive summary of the risk.
      - vulnerability_type: (string) Specific classification (e.g. Stored XSS, Logic Flaw).
      - severity: (string) Low/Medium/High/Critical.
      - confidence: (number) 1-100 score of how likely this bug is valid and reproducible.
      - exploitability: (string) Easy/Moderate/Difficult.
      - missing_info: (string) Any technical details the researcher missed or should provide.
      - recommendation: (string) Specific remediation advice for developers to fix this bug.
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    let jsonResult;
    try {
        // Extract JSON block if LLM adds markdown wrappers
        const jsonMatch = responseText.match(/\{[\s\S]*?\}/);
        jsonResult = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);
    } catch (err) {
        console.error("AI Parsing Error. Raw output:", responseText);
        jsonResult = { 
            error: "Internal Triage Parsing Error", 
            raw: responseText.slice(0, 500),
            isValid: true,
            evaluatedSeverity: "Review Required",
            confidenceScore: 50,
            feedback: "Automated analysis couldn't confidently parse out the required metrics. Manual review triggered."
        };
    }

    res.json(jsonResult);
  } catch (error) {
    console.error("AI Analysis Error:", error);
    res.status(500).json({ error: "AI Engine is currently unresponsive. Please try manual triage." });
  }
});

/**
 * AI CHECK DUPLICATE
 * Compares incoming report against existing descriptions/titles to flag redundant submissions.
 */
app.post("/api/ai/check-duplicate", async (req, res) => {
  try {
    const { currentReport, existingReports } = req.body;
    
    if (!currentReport || !existingReports || existingReports.length === 0) {
        return res.json({ isDuplicate: false, similarityScore: 0 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `
      Compare the NEW REPORT against the LIST OF EXISTING REPORTS.
      Determine if the new report is a duplicate of any existing submission (same root cause or same endpoint/vuln type).
      
      NEW REPORT:
      Title: ${currentReport.title}
      Description: ${currentReport.description}

      EXISTING REPORTS (Context):
      ${JSON.stringify(existingReports.map(r => ({ id: r.id, title: r.title, description: r.description })))}

      Format your response STRICTLY as a JSON object:
      - isDuplicate: (boolean)
      - matchedReportId: (string or null)
      - similarityScore: (number 1-100)
      - reasoning: (string) 1-sentence reasoning for the match.
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    let jsonResult;
    try {
        const jsonMatch = responseText.match(/\{[\s\S]*?\}/);
        jsonResult = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);
    } catch (err) {
        jsonResult = { isDuplicate: false, similarityScore: 0, error: "Similarity check failed." };
    }

    res.json(jsonResult);
  } catch (error) {
    console.error("AI Duplicate Check Error:", error);
    res.status(500).json({ error: "Failed to process similarity check." });
  }
});

app.listen(PORT, () => {
  console.log(`Debug AI Engine server is running on port ${PORT}...`);
});
