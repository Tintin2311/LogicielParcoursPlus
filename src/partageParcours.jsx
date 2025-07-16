import React, { useState, useEffect } from 'react';
import { Users, GraduationCap, MapPin, BookOpen, Target, Award, Eye, EyeOff, ArrowLeft, ArrowRight, Compass } from 'lucide-react';
import { supabase } from "./supabaseClient";
  
  
  <div
          style={{
            padding: "20px",
            maxWidth: "600px",
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          <button
            onClick={() => setPage("gestionParcours")}
            style={{
              position: "absolute",
              top: 10,
              left: "50%",
              transform: "translateX(-50%)",
              backgroundColor: "#f0f0f0",
              border: "1px solid #ccc",
              borderRadius: "5px",
              padding: "6px 12px",
              cursor: "pointer",
            }}
          >
            ⬅️ Retour
          </button>

          <h2 style={{ marginBottom: "20px" }}>📦 Partage de parcours</h2>

          <button
            onClick={() => setPage("partageEnvoyer")}
            style={{
              padding: "12px 20px",
              backgroundColor: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontSize: "1.1em",
              marginBottom: "15px",
            }}
          >
            📤 Envoyer des parcours
          </button>
          <br />
          <button
            onClick={() => setPage("partageRecevoir")}
            style={{
              padding: "12px 20px",
              backgroundColor: "#2196F3",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontSize: "1.1em",
            }}
          >
            📥 Recevoir des parcours
          </button>
        </div>


export default partageParcours;