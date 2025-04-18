import React, { useEffect, useState } from "react";
import "./App.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function App() {
  const [round, setRound] = useState("");
  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [category, setCategory] = useState("");
  const [gender, setGender] = useState("");
  const [homeState, setHomeState] = useState("");
  const [rank, setRank] = useState("");
  const [username, setUsername] = useState("");
  const [categories, setCategories] = useState([]);
  const [genders, setGenders] = useState([]);
  const [states, setStates] = useState([]);
  const [sortDirection, setSortDirection] = useState("asc");
  const [resultProgramFilter, setResultProgramFilter] = useState("");

  useEffect(() => {
    if (round) {
      fetch(`/JoSAA_Round${round}_Data.json`)
        .then((res) => {
          if (!res.ok) throw new Error("File not found");
          return res.json();
        })
        .then((json) => {
          setData(json);
          setCategories([...new Set(json.map((d) => d["Seat Type"]))]);
          setGenders([...new Set(json.map((d) => d["Gender"]))]);
          setStates([...new Set(json.map((d) => d["Institute State"]))].sort());
        })
        .catch((err) => {
          console.error("Error loading JSON file:", err);
          alert("Error loading data for selected round. ");
        });
    } else {
      setData([]);
      setCategories([]);
      setGenders([]);
      setStates([]);
    }
  }, [round]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const lowerHome = homeState.toLowerCase();

    const results = data.filter((row) => {
      const closingRank = parseInt(row["Closing Rank"]);
      const seat = row["Seat Type"];
      const genderRow = row["Gender"];
      const instState = row["Institute State"]?.toLowerCase();
      const quota = row["Quota"];

      const validRank = !isNaN(closingRank) && parseInt(rank) <= closingRank;
      const validCategory = seat === category;
      const validGender = genderRow === gender;
      const isHomeState = quota === "HS" && instState === lowerHome;
      const isOtherState = quota === "OS" && instState !== lowerHome;
      const isAllIndia = quota === "AI";

      return validRank && validCategory && validGender && (isHomeState || isOtherState || isAllIndia);
    });

    setFiltered(results);
    setSortDirection("asc");
    setResultProgramFilter("");
  };

  const handleReset = () => {
    setRound("");
    setCategory("");
    setGender("");
    setHomeState("");
    setRank("");
    setUsername("");
    setFiltered([]);
    setResultProgramFilter("");
  };

  const sortClosingRank = () => {
    const newDir = sortDirection === "asc" ? "desc" : "asc";
    const sorted = [...filtered].sort((a, b) => {
      const x = parseInt(a["Closing Rank"]);
      const y = parseInt(b["Closing Rank"]);
      return newDir === "asc" ? x - y : y - x;
    });
    setFiltered(sorted);
    setSortDirection(newDir);
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text(`JoSAA Predicted Colleges for ${username}`, 10, 10);
    doc.text(
      `Rank: ${rank} | Category: ${category} | State: ${homeState} | Round: ${round}`,
      10,
      18
    );

    const tableBody = displayedResults.map((row) => [
      row["Institute Name"],
      row["Academic Program Name"],
      (row["Total B.Tech Fees (4 Years)"] || "-").replace(/₹/g, "Rs."),
      (row["Avg. Yearly Fees"] || "-").replace(/₹/g, "Rs."),
      (row["Average Package"] || "-").replace(/₹/g, "Rs."),
      (row["Highest Package"] || "-").replace(/₹/g, "Rs."),
      row["Institute State"] || "-",
      row["Quota"] || "-",
      row["Seat Type"] || "-",
      row["Gender"] || "-",
      row["Closing Rank"] || "-",
    ]);

    autoTable(doc, {
      head: [[
        "Institute Name", "Program", "Total Fees", "Yearly Fees",
        "Avg Package", "Highest Package", "State", "Quota",
        "Seat Type", "Gender", "Closing Rank"
      ]],
      body: tableBody,
      startY: 25,
      styles: { fontSize: 7 },
      tableWidth: "auto",
    });

    doc.save(`JoSAA_${username.replace(/\s+/g, "_")}_Predictions.pdf`);
  };

  const displayedResults = resultProgramFilter
    ? filtered.filter(row => row["Academic Program Name"] === resultProgramFilter)
    : filtered;

  return (
    <div className="container">
      <h1>JoSAA College Predictor 2025</h1>
      <form onSubmit={handleSubmit} className="form">
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Your Name"
          required
        />
        <input
          type="number"
          value={rank}
          onChange={(e) => setRank(e.target.value)}
          placeholder="Your JEE Rank"
          required
        />
        <select value={round} onChange={(e) => setRound(e.target.value)} required>
          <option value="">Select Round</option>
          {[1, 2, 3, 4, 5].map((r) => (
            <option key={r} value={r}>Round {r}</option>
          ))}
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)} required>
          <option value="">Select Category</option>
          {categories.map((cat, i) => (
            <option key={i} value={cat}>{cat}</option>
          ))}
        </select>
        <select value={gender} onChange={(e) => setGender(e.target.value)} required>
          <option value="">Select Gender</option>
          {genders.map((g, i) => (
            <option key={i} value={g}>{g}</option>
          ))}
        </select>
        <select value={homeState} onChange={(e) => setHomeState(e.target.value)} required>
          <option value="">Select Home State</option>
          {states.map((s, i) => (
            <option key={i} value={s}>{s}</option>
          ))}
        </select>
        <div className="form-buttons">
          <button type="submit">Predict Colleges</button>
          <button type="button" onClick={handleReset} className="reset-btn">Reset</button>
        </div>
      </form>

      {filtered.length > 0 && (
        <>
          <h2>Predicted Colleges for {username}</h2>

          <div className="table-controls">
            <div className="button-row">
              <button onClick={downloadPDF}>Download PDF</button>
              <button onClick={sortClosingRank}>
                Sort by Closing Rank {sortDirection === "asc" ? "↑" : "↓"}
              </button>
            </div>

            <div className="program-filter">
              <label style={{ marginRight: "10px" }}>Filter by Program:</label>
              <select
                value={resultProgramFilter}
                onChange={(e) => setResultProgramFilter(e.target.value)}
              >
                <option value="">All Programs</option>
                {[...new Set(filtered.map(row => row["Academic Program Name"]))].sort().map((p, i) => (
                  <option key={i} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Institute</th>
                <th>Program</th>
                <th>Total Fees</th>
                <th>Yearly Fees</th>
                <th>Avg Package</th>
                <th>Highest Package</th>
                <th>State</th>
                <th>Quota</th>
                <th>Seat Type</th>
                <th>Gender</th>
                <th>Closing Rank</th>
              </tr>
            </thead>
            <tbody>
              {displayedResults.map((row, i) => (
                <tr key={i}>
                  <td>{row["Institute Name"]}</td>
                  <td>{row["Academic Program Name"]}</td>
                  <td>{row["Total B.Tech Fees (4 Years)"] || "-"}</td>
                  <td>{row["Avg. Yearly Fees"] || "-"}</td>
                  <td>{row["Average Package"] || "-"}</td>
                  <td>{row["Highest Package"] || "-"}</td>
                  <td>{row["Institute State"] || "-"}</td>
                  <td>{row["Quota"] || "-"}</td>
                  <td>{row["Seat Type"] || "-"}</td>
                  <td>{row["Gender"] || "-"}</td>
                  <td>{row["Closing Rank"] || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

export default App;
