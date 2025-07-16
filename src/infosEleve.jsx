  import React, { useState, useEffect } from 'react';
import { Users, GraduationCap, MapPin, BookOpen, Target, Award, Eye, EyeOff, ArrowLeft, ArrowRight, Compass } from 'lucide-react';
import { supabase } from "./supabaseClient";
  
  <div
          style={{ textAlign: "center", marginTop: "80px", padding: "20px" }}
        >
          <button
            onClick={() => setPage("infosGroupe")}
            style={{
              position: "absolute",
              top: 10,
              left: "50%",
              transform: "translateX(-50%)",
            }}
          >
            ⬅️ Retour
          </button>

          <h2>👤 Statistiques de {eleveActif.nom}</h2>
          <p>Code : {eleveActif.code}</p>

          <h3 style={{ marginTop: "30px" }}>📊 Parcours terminés</h3>

          {parcoursTerminesEleves.filter((p) => p.eleveCode === eleveActif.code)
            .length === 0 ? (
            <p style={{ color: "#555" }}>
              Aucun parcours terminé par cet élève.
            </p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {parcoursTerminesEleves
                .filter((p) => p.eleveCode === eleveActif.code)
                .map((p, idx) => {
                  const parcours = parcoursGlobaux.find(
                    (pg) => pg.id === p.parcoursId
                  );
                  return (
                    <li
                      key={idx}
                      style={{
                        background: "#f9f9f9",
                        padding: "10px",
                        margin: "5px auto",
                        borderRadius: "6px",
                        maxWidth: "400px",
                        border: "1px solid #ddd",
                        textAlign: "left",
                      }}
                    >
                      <strong>
                        📋 {parcours ? parcours.nom : "Parcours supprimé"}
                      </strong>
                      <br />
                      Nombre d'essais : {p.essais}
                    </li>
                  );
                })}
            </ul>
          )}
        </div>

  export default infosEleve;