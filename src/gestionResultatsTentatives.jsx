import React, { useState } from 'react';

const gestionResultatsTentatives = () => {
  const [prendEnCompteTentatives, setPrendEnCompteTentatives] = useState(true);
  const [baremeEvaluation, setBaremeEvaluation] = useState([
    { type: "=", tentatives: 1, couleur: "#00FF00", points: 1 },
    { type: "=", tentatives: 2, couleur: "#FFFF00", points: 0.5 },
    { type: "=", tentatives: 3, couleur: "#FFA500", points: 0 },
    { type: "≥", tentatives: 4, couleur: "#FF0000", points: -1 },
  ]);

  return (
    <div
      style={{
        textAlign: "center",
        marginTop: "80px",
        padding: "20px",
        maxWidth: "600px",
        marginInline: "auto",
      }}
    >
      <button
        onClick={() => setPage("gestionResultats")}
        style={{
          position: "absolute",
          top: 10,
          left: "50%",
          transform: "translateX(-50%)",
        }}
      >
        ⬅️ Retour
      </button>

      <h2>📊 Gestion des résultats - Barème selon tentatives</h2>
      <p>
        Modifiez le barème d'attribution des couleurs et des points selon le
        nombre de tentatives :
      </p>

      <div style={{ textAlign: "left", marginTop: "20px" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
          <input
            type="checkbox"
            checked={!prendEnCompteTentatives}
            onChange={(e) => setPrendEnCompteTentatives(!e.target.checked)}
          />
          Ne pas prendre en compte le nombre de tentatives
        </label>

        {prendEnCompteTentatives &&
          baremeEvaluation.map((bareme, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "10px",
                gap: "10px",
                flexWrap: "wrap",
                padding: "10px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                background: "#f9f9f9",
              }}
            >
              <label>Condition :</label>
              <select
                value={bareme.type}
                onChange={(e) => {
                  const value = e.target.value;
                  const newBareme = [...baremeEvaluation];
                  newBareme[index].type = value;
                  if (e.target.value === "entre") {
                    newBareme[index].minTentatives = 1;
                    newBareme[index].maxTentatives = 2;
                    delete newBareme[index].tentatives;
                  } else {
                    newBareme[index].tentatives = 1;
                    delete newBareme[index].minTentatives;
                    delete newBareme[index].maxTentatives;
                  }
                  setBaremeEvaluation(newBareme);
                }}
              >
                <option value="=">=</option>
                <option value="≥">Minimum</option>
                <option value="≤">Maximum</option>
                <option value="entre">Entre</option>
              </select>

              {bareme.type === "entre" ? (
                <>
                  <label>De :</label>
                  <input
                    type="number"
                    min="1"
                    value={bareme.minTentatives ?? ""}
                    onChange={(e) => {
                      const newBareme = [...baremeEvaluation];
                      newBareme[index].minTentatives = parseInt(e.target.value);
                      setBaremeEvaluation(newBareme);
                    }}
                    style={{ width: "70px" }}
                  />
                  <label>à :</label>
                  <input
                    type="number"
                    min="1"
                    value={bareme.maxTentatives ?? ""}
                    onChange={(e) => {
                      const newBareme = [...baremeEvaluation];
                      newBareme[index].maxTentatives = parseInt(e.target.value);
                      setBaremeEvaluation(newBareme);
                    }}
                    style={{ width: "70px" }}
                  />
                </>
              ) : (
                <>
                  <label>Tentatives :</label>
                  <input
                    type="number"
                    min="1"
                    value={bareme.tentatives ?? ""}
                    onChange={(e) => {
                      const newBareme = [...baremeEvaluation];
                      newBareme[index].tentatives = parseInt(e.target.value);
                      setBaremeEvaluation(newBareme);
                    }}
                    style={{ width: "80px" }}
                  />
                </>
              )}

              <label>Couleur :</label>
              <input
                type="color"
                value={bareme.couleur}
                onChange={(e) => {
                  const newBareme = [...baremeEvaluation];
                  newBareme[index].couleur = e.target.value;
                  setBaremeEvaluation(newBareme);
                }}
              />

              <label>Points :</label>
              <input
                type="text"
                value={
                  bareme.points !== undefined
                    ? bareme.points.toString()
                    : ""
                }
                onChange={(e) => {
                  const cleanedValue = e.target.value
                    .replace(",", ".")
                    .replace(/[^0-9.\-]/g, "");

                  const newBareme = [...baremeEvaluation];

                  if (
                    cleanedValue === "" ||
                    cleanedValue === "-" ||
                    cleanedValue === "." ||
                    cleanedValue === "-." ||
                    cleanedValue.endsWith(".")
                  ) {
                    newBareme[index].points = cleanedValue.replace(".", ",");
                  } else {
                    const parsed = parseFloat(cleanedValue);
                    if (isNaN(parsed)) {
                      newBareme[index].points = "";
                    } else {
                      newBareme[index].points = parsed
                        .toString()
                        .replace(".", ",");
                    }
                  }

                  setBaremeEvaluation(newBareme);
                }}
                placeholder="Points"
                style={{ width: "80px" }}
              />

              <button
                onClick={() => {
                  if (confirm("❌ Supprimer ce barème ?")) {
                    const newBareme = baremeEvaluation.filter(
                      (_, i) => i !== index
                    );
                    setBaremeEvaluation(newBareme);
                  }
                }}
                style={{
                  backgroundColor: "red",
                  color: "white",
                  border: "none",
                  padding: "5px 8px",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                🗑️
              </button>
            </div>
          ))}

        {prendEnCompteTentatives && (
          <div style={{ textAlign: "center", marginTop: "15px" }}>
            <button
              onClick={() =>
                setBaremeEvaluation([
                  ...baremeEvaluation,
                  {
                    type: "=",
                    tentatives: 1,
                    couleur: "#000000",
                    points: 0,
                  },
                ])
              }
              style={{
                padding: "10px 20px",
                backgroundColor: "#4CAF50",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              ➕ Ajouter une condition
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default gestionResultatsTentatives;
