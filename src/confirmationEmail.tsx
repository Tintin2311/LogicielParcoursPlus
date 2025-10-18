// src/confirmationEmail.tsx
import React, { useState } from "react";

type Professeur = {
  nom: string;
  email: string;
  code: string;          // code prof (interne)
  password: string;
  refuserPartage: boolean;
  user_id: string;       // id interne
  partagesRecus: string[];
};

type ConfirmationEmailProps = {
  /** Code envoyé par email et attendu pour valider */
  expectedCode: string;

  /** Données saisies sur l’écran précédent pour créer le compte prof */
  newProfName: string;       // nom (ex: Dupont)
  newProfPrenom: string;     // prénom (ex: Marie)
  newProfEmail: string;
  newProfPassword: string;

  /** Générateur d'identifiants/codes uniques (fourni par l’app) */
  generateUniqueId: () => string;

  /** Callbacks de navigation / état global */
  setPage: (page: string) => void;
  setModeConnexion: (mode: "prof" | "eleve") => void;
  setProfesseur: (prof: Professeur) => void;
};

const ConfirmationEmail: React.FC<ConfirmationEmailProps> = ({
  expectedCode,
  newProfName,
  newProfPrenom,
  newProfEmail,
  newProfPassword,
  generateUniqueId,
  setPage,
  setModeConnexion,
  setProfesseur,
}) => {
  const [codeEntreParLeProf, setCodeEntreParLeProf] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleValidate = async () => {
    if (!codeEntreParLeProf.trim()) {
      alert("⚠️ Merci de saisir le code reçu par email.");
      return;
    }

    if (codeEntreParLeProf.trim() !== expectedCode) {
      alert("❌ Code incorrect.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Création de l'objet professeur local (à persister plus tard si besoin)
      const nouveauProf: Professeur = {
        nom: `${newProfName} ${newProfPrenom}`.trim(),
        email: newProfEmail,
        code: generateUniqueId(),     // code prof
        password: newProfPassword,
        refuserPartage: false,
        user_id: generateUniqueId(),  // id interne
        partagesRecus: [],
      };

      // Mise à jour de l'état global de l’app
      setProfesseur(nouveauProf);
      setModeConnexion("prof");
      setPage("accueil"); // ou "gestionParcours" selon ton flux

      // Reset du champ (optionnel)
      setCodeEntreParLeProf("");
    } catch (e) {
      console.error(e);
      alert("Une erreur est survenue lors de la confirmation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: 100 }}>
      <h2>📧 Confirmation du compte</h2>
      <p>Un code vous a été envoyé par email. Veuillez le saisir ci-dessous :</p>

      <input
        placeholder="Code de confirmation"
        value={codeEntreParLeProf}
        onChange={(e) => setCodeEntreParLeProf(e.target.value)}
        style={{ padding: 8, borderRadius: 8, border: "1px solid #ccc" }}
      />
      <br />
      <button
        onClick={handleValidate}
        disabled={isSubmitting}
        style={{
          marginTop: 12,
          padding: "8px 16px",
          borderRadius: 8,
          border: "none",
          background: "#22c55e",
          color: "white",
          cursor: "pointer",
          opacity: isSubmitting ? 0.7 : 1,
        }}
      >
        {isSubmitting ? "Validation..." : "✅ Valider le code"}
      </button>
    </div>
  );
};

export default ConfirmationEmail;
