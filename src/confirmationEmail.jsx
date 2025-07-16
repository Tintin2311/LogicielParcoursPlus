import React, { useState, useEffect } from 'react';
import { Users, GraduationCap, MapPin, BookOpen, Target, Award, Eye, EyeOff, ArrowLeft, ArrowRight, Compass } from 'lucide-react';
import { supabase } from "./supabaseClient";

 
 <div style={{ textAlign: "center", marginTop: 100 }}>
          <h2>📧 Confirmation du compte</h2>
          <p>
            Un code vous a été envoyé par email. Veuillez le saisir ci-dessous :
          </p>
          <input
            placeholder="Code de confirmation"
            value={codeEntreParLeProf}
            onChange={(e) => setCodeEntreParLeProf(e.target.value)}
          />
          <br />
          <button
            onClick={() => {
              if (codeEntreParLeProf !== codeValidationEnvoye) {
                alert("❌ Code incorrect.");
                return;
              }

             const nouveauProf = {
  nom: newProfName + " " + newProfPrenom,
  email: newProfEmail,
  code: genererCodeUnique(professeurs),
  password: newProfPassword,
  refuserPartage: false,
  user_id: genererCodeUnique(professeurs),
  partagesRecus: []
};

              setProfesseurs([...professeurs, nouveauProf]);
              setProfesseur(nouveauProf);
              setModeConnexion("prof"); // ✅ Connecte en mode professeur directement
              setPage("accueil"); // ✅ Dirige vers la page d'accueil ou "gestionParcours" si souhaité
              setCodeEntreParLeProf("");
            }}
          >
            ✅ Valider le code
          </button>
        </div>
        export default confirmationEmail;