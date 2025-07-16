import React, { useState, useEffect } from 'react';
import { Users, GraduationCap, MapPin, BookOpen, Target, Award, Eye, EyeOff, ArrowLeft, ArrowRight, Compass } from 'lucide-react';
import { supabase } from "./supabaseClient";
  
  <div style={{ textAlign: "center", marginTop: "80px" }}>
          <button
            onClick={() => setPage("mesGroupes")}
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

          <h2>👥 Groupe : {groupeActif.nom}</h2>
          <p style={{ fontSize: "1em", color: "#555" }}>
            {groupeActif.eleves.length}{" "}
            {groupeActif.eleves.length === 1 ? "élève" : "élèves"} dans ce
            groupe
          </p>

          {groupeActif.eleves.length === 0 ? (
            <p style={{ marginTop: "30px", color: "#888" }}>
              Aucun élève dans ce groupe pour le moment.
            </p>
          ) : (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: "10px",
                marginTop: "30px",
                maxWidth: "600px",
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              {groupeActif.eleves.map((eleve, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setEleveActif(eleve);
                    setPage("infosEleve");
                  }}
                  style={{
                    flex: "1 1 40%",
                    padding: "15px",
                    fontSize: "1em",
                    border: "1px solid #ccc",
                    borderRadius: "8px",
                    backgroundColor: "#f0f0f0",
                    cursor: "pointer",
                    transition: "background 0.2s, transform 0.1s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#e0f7fa";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#f0f0f0";
                  }}
                >
                  👤 {eleve.nom}
                  <br />
                  <small style={{ color: "#777" }}>Code : {eleve.code}</small>
                </button>
              ))}
            </div>
          )}
        </div>
        export default infosGroupe;