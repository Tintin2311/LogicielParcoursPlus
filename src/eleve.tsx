// src/eleve.tsx
import React from "react";

/* ---------- Types ---------- */
type ModeConnexion = "prof" | "eleve" | "accueil";

type EleveConnecte = {
  id?: string;
  nom: string;
  code?: string | null;
  group_id?: string | null;
};

type EleveProps = {
  setPage: (page: string) => void;
  setModeConnexion: (mode: ModeConnexion) => void;
  setProfesseur: (prof: any | null) => void; // si tu as un type Professeur, remplace `any`
  setModifierCode: (v: boolean) => void;
  setMessageErreurCode: (msg: string) => void;
  eleveConnecte: EleveConnecte;
};

const Eleve: React.FC<EleveProps> = ({
  setPage,
  setModeConnexion,
  setProfesseur,
  setModifierCode,
  setMessageErreurCode,
  eleveConnecte,
}) => {
  return (
    <div style={{ textAlign: "center", marginTop: "80px", padding: "20px" }}>
      {/* Bouton de déconnexion en haut à gauche */}
      <button
        onClick={() => {
          setProfesseur(null);
          setPage("accueil");
          setModeConnexion("accueil");
          setModifierCode(false);
          setMessageErreurCode("");
        }}
        style={{ position: "absolute", top: 10, left: 10 }}
      >
        🚪 Déconnexion
      </button>

      <h2>👋 Bonjour {eleveConnecte?.nom ?? "élève"} !</h2>

      <p style={{ fontSize: "1em", color: "#555", marginBottom: "30px" }}>
        Que souhaites-tu faire aujourd&apos;hui ?
      </p>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          maxWidth: "300px",
          margin: "0 auto",
        }}
      >
        <button
          onClick={() => setPage("ecrireResultat")}
          style={{
            fontSize: "1.1em",
            padding: "12px 20px",
            backgroundColor: "#2196F3",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          ✏️ Saisir un résultat
        </button>

        <button
          onClick={() => setPage("statistiquesEleve")}
          style={{
            fontSize: "1.1em",
            padding: "12px 20px",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          📊 Voir mes statistiques
        </button>
      </div>
    </div>
  );
};

export default Eleve;
