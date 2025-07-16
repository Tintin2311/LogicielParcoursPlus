
import React from "react";

const GestionPoints = () => {
  return (


<div
          style={{ textAlign: "center", marginTop: "80px", padding: "20px" }}
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

          <h2>🏆 Choisissez le mode d'attribution des points :</h2>

          <div
            style={{
              marginTop: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              alignItems: "center",
            }}
          >
            <button
              onClick={() => setModePoints("cumul")}
              style={{
                padding: "10px 20px",
                backgroundColor: modePoints === "cumul" ? "#4CAF50" : "#f0f0f0",
                color: modePoints === "cumul" ? "white" : "black",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                width: "300px",
              }}
            >
              ➕ Cumul : points par parcours + points selon tentatives
            </button>

            <button
              onClick={() => setModePoints("parParcours")}
              style={{
                padding: "10px 20px",
                backgroundColor:
                  modePoints === "parParcours" ? "#4CAF50" : "#f0f0f0",
                color: modePoints === "parParcours" ? "white" : "black",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                width: "300px",
              }}
            >
              📋 Points uniquement par parcours
            </button>

            <button
              onClick={() => setModePoints("parTentatives")}
              style={{
                padding: "10px 20px",
                backgroundColor:
                  modePoints === "parTentatives" ? "#4CAF50" : "#f0f0f0",
                color: modePoints === "parTentatives" ? "white" : "black",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                width: "300px",
              }}
            >
              🎯 Points uniquement selon tentatives
            </button>

            <button
              onClick={() => setModePoints("personnalise")}
              style={{
                padding: "10px 20px",
                backgroundColor:
                  modePoints === "personnalise" ? "#4CAF50" : "#f0f0f0",
                color: modePoints === "personnalise" ? "white" : "black",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                width: "300px",
              }}
            >
              🎨 Personnaliser par parcours
            </button>
            {modePoints === "personnalise" && (
              <div style={{ marginTop: "10px" }}>
                <button
                  onClick={() => setPage("personnaliserParParcours")}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#2196F3",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                  }}
                >
                  ➡️ Accéder à la personnalisation des parcours
                </button>
              </div>
            )}
          </div>

          {/* Points par parcours */}
          {(modePoints === "cumul" || modePoints === "parParcours") && (
            <div
              style={{
                marginTop: "30px",
                maxWidth: "400px",
                marginInline: "auto",
                textAlign: "left",
              }}
            >
              <h3>📋 Points par parcours validé</h3>
              <label>
                Points par parcours :
                <input
                  type="number"
                  min="0"
                  value={baremePointsGlobal.pointsParParcours}
                  onChange={(e) =>
                    setBaremePointsGlobal({
                      ...baremePointsGlobal,
                      pointsParParcours: parseInt(e.target.value),
                    })
                  }
                  style={{ marginLeft: "10px", width: "80px" }}
                />
              </label>
            </div>
          )}
        </div>
       );
}
export default GestionPoints;