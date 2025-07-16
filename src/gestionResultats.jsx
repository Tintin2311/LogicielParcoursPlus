import React, { useState, useEffect } from 'react';
import { ArrowLeft, Eye, EyeOff, UserPlus, Mail, Lock, User, CheckCircle, GraduationCap, Shield } from 'lucide-react';
import { supabase } from "./supabaseClient";

function GestionResultats({ setPage }) {
  return (
    <div
      style={{
        textAlign: "center",
        marginTop: "80px",
        padding: "20px",
        maxWidth: "600px",
        margin: "80px auto",
      }}
    >
      <button
        onClick={() => setPage("accueil")}
        style={{
          position: "absolute",
          top: 10,
          left: "50%",
          transform: "translateX(-50%)",
        }}
      >
        ⬅️ Retour
      </button>

      <h2>📊 Gestion des barèmes</h2>
      <p>Sélectionnez le type de barème à gérer :</p>

      <div
        style={{
          marginTop: "30px",
          display: "flex",
          justifyContent: "center",
          gap: "20px",
        }}
      >
        <button
          onClick={() => setPage("gestionResultatsTentatives")}
          style={{
            padding: "12px 20px",
            fontSize: "1.1em",
            backgroundColor: "#2196F3",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          📈 Barème tentatives
        </button>

        <button
          onClick={() => setPage("gestionPoints")}
          style={{
            padding: "10px 20px",
            backgroundColor: "#f0f0f0",
            color: "black",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          🏆 Mode d'attribution des points
        </button>

        <button
          onClick={() => setPage("gestionResultatsProgressivite")}
          style={{
            padding: "12px 20px",
            fontSize: "1.1em",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          🔄 Progressivité
        </button>
      </div>
    </div>
  );
}

export default GestionResultats;
