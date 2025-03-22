import { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [jobDescription, setJobDescription] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedSection, setExpandedSection] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    document.body.style.transition = "background-color 0.5s ease";
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults(null);
    setExpandedSection(null);

    try {
      console.log("🟢 Request payload:", { jobDescription });
      console.log("🟢 Sending fetch request to http://127.0.0.1:5000/analyze");
      const response = await fetch("http://127.0.0.1:5000/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to analyze job description: ${errorData.error || response.statusText}`);
      }
      const data = await response.json();
      console.log("🟢 Fetch response:", data);
      setResults(data);
    } catch (err) {
      console.error("🔴 Fetch Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const renderSections = () => {
    if (!results) return null;

    console.log("🟢 Frontend results:", results);

    const sections = [
      {
        title: "Job Overview & Ratings",
        content: (
          <>
            <p><strong>Title:</strong> {results.job_title || "N/A"}</p>
            <p><strong>Company:</strong> {results.company || "N/A"}</p>
            <p><strong>Salary:</strong> {results.salary || "Not mentioned"}</p>
            {results.insights?.length > 0 && (
              <p><strong>Insights:</strong> {results.insights.join(", ")}</p>
            )}
            <hr />
            {results.ratings && (
              <>
                <p><strong>Salary Transparency:</strong> {results.ratings.salary_transparency}/10</p>
                <p><strong>Work-Life Balance:</strong> {results.ratings.work_life_balance}/10</p>
                <p><strong>Career Growth:</strong> {results.ratings.career_growth}/10</p>
                <p><strong>Toxic Culture Risk:</strong> {results.ratings.toxic_culture_risk}/10</p>
              </>
            )}
            {results.job_score && (
              <>
                <hr />
                <p><strong>Job Worth Score:</strong> {results.job_score}/100</p>
                <p><strong>AI Verdict:</strong> {results.verdict}</p>
              </>
            )}
          </>
        ),
      },
      {
        title: "Red Flags & Risk Score",
        content: (
          <>
            <p>{results.red_flags?.length ? results.red_flags.join(", ") : "None detected"}</p>
            <p><strong>Red Flag Score:</strong> {results.red_flag_score || 0}/10</p>
            <progress value={results.red_flag_score || 0} max="10"></progress>
          </>
        ),
      },
      {
        title: "Questions You Should Ask",
        content: results.interview_questions?.candidate_should_ask?.length ? (
          <ul>
            {results.interview_questions.candidate_should_ask.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        ) : (
          <p>No suggestions provided</p>
        ),
      },
    ];

    return sections.map((section, index) => (
      <div key={index} className={`section ${expandedSection === index ? "expanded" : ""}`}>
        <button onClick={() => toggleSection(index)} className="section-header">
          <span>{section.title}</span>
          <span className="section-icon">{expandedSection === index ? "▲" : "▼"}</span>
        </button>
        <div className="section-content">{section.content}</div>
      </div>
    ));
  };

  return (
    <div className={`app ${darkMode ? "dark" : ""}`}>
      <nav className="navbar">
        <div className="logo">JobAnalyzer</div>
        <label className="theme-switch">
          <input type="checkbox" checked={darkMode} onChange={() => setDarkMode(!darkMode)} />
          <span className="slider"></span>
        </label>
      </nav>
      <div className="container">
        <h1>Job Description Analyzer</h1>
        <p>Paste a job description and get instant insights!</p>
        <form onSubmit={handleSubmit} className="form">
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the job description here..."
            rows="6"
            required
          />
          <button type="submit" disabled={loading} className="analyze-btn">
            {loading ? <span className="spinner"></span> : "Analyze"}
          </button>
        </form>
        {error && <div className="error-alert">{error}</div>}
        <div className="results">{renderSections()}</div>
      </div>
    </div>
  );
}

export default App;