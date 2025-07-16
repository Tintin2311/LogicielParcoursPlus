import React, { useState, useEffect } from 'react';
import { Users, GraduationCap, MapPin, BookOpen, Target, Award, Eye, EyeOff, ArrowLeft, ArrowRight, Compass } from 'lucide-react';
import { supabase } from "./supabaseClient";
 
 
 <div
          style={{ textAlign: "center", marginTop: "80px", padding: "20px" }}
        >
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

          <h2>👋 Bonjour {eleveConnecte.nom} !</h2>

          <p style={{ fontSize: "1em", color: "#555", marginBottom: "30px" }}>
            Que souhaites-tu faire aujourd'hui ?
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

export default eleve;