import React, { useState, useEffect } from 'react';
import { Users, GraduationCap, MapPin, BookOpen, Target, Award, Eye, EyeOff, ArrowLeft, ArrowRight, Compass } from 'lucide-react';
import { supabase } from "./supabaseClient";
 
 
 <div style={{ marginTop: "80px", textAlign: "center" }}>
          <button
            onClick={() => setPage("eleve")}
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

          <h2>✏️ Écrire un résultat</h2>
          <p style={{ color: "#555", fontSize: "0.95em" }}>
            Sélectionne le parcours sur lequel tu souhaites entrer ton résultat.
          </p>

          {/* 📁 Dossiers de parcours accessibles */}
          <div
            style={{
              maxWidth: "600px",
              margin: "30px auto",
              textAlign: "left",
            }}
          >
            {dossiersParcours
              .filter((dossier) =>
                dossier.parcours.some((idParcours) =>
                  parcoursGlobaux.find((p) =>
                    p.groupesAssocies?.some((gid) =>
                      groupes.find(
                        (g) =>
                          g.id === gid &&
                          g.eleves.some((e) => e.code === eleveConnecte.code)
                      )
                    )
                  )
                )
              )
              .map((dossier) => (
                <div
                  key={dossier.id}
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    margin: "10px 0",
                    padding: "10px",
                    background: "#f9f9f9",
                  }}
                >
                  <strong>📁 {dossier.nom}</strong>
                  <div style={{ marginTop: "10px", paddingLeft: "10px" }}>
                    {dossier.parcours
                      .map((idParcours) =>
                        parcoursGlobaux.find((p) => p.id === idParcours)
                      )
                      .filter(
                        (parcours) =>
                          parcours &&
                          parcours.groupesAssocies?.some((gid) =>
                            groupes.find(
                              (g) =>
                                g.id === gid &&
                                g.eleves.some(
                                  (e) => e.code === eleveConnecte.code
                                )
                            )
                          )
                      )
                      .map((parcours) => (
                        <button
                          key={parcours.id}
                          onClick={() => {
                            // ✅ Correction : réinitialiser les saisies avant ouverture
                            const parcoursAvecBalisesVides = {
                              ...parcours,
                              balises: parcours.balises.map((b) => ({
                                ...b,
                                saisi: "",
                              })),
                            };
                            setParcoursActif(parcoursAvecBalisesVides);
                            setAffichageResultat(false);
                            setPage("saisieResultat");
                          }}
                          style={{
                            display: "block",
                            width: "100%",
                            textAlign: "left",
                            padding: "10px",
                            margin: "5px 0",
                            border: "1px solid #ccc",
                            borderRadius: "6px",
                            backgroundColor: termine ? "#d4edda" : "#fff",
                            cursor: "pointer",
                            transition: "background 0.2s",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = "#e0f7fa")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "#fff")
                          }
                        >
                          📋 {parcours.nom} ({parcours.balises.length} balises)
                        </button>
                      ))}
                  </div>
                </div>
              ))}
          </div>

          {/* 📋 Parcours non classés accessibles */}
          <h3 style={{ marginTop: "40px" }}>📋 Parcours disponibles</h3>
          <div
            style={{
              maxWidth: "400px",
              margin: "20px auto",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            {parcoursGlobaux
              .filter(
                (parcours) =>
                  !dossiersParcours.some((d) =>
                    d.parcours.includes(parcours.id)
                  ) &&
                  parcours.groupesAssocies?.some((gid) =>
                    groupes.find(
                      (g) =>
                        g.id === gid &&
                        g.eleves.some((e) => e.code === eleveConnecte.code)
                    )
                  )
              )
              .map((parcours) => {
                const termine = parcoursTerminesEleves.some(
                  (p) =>
                    p.eleveCode === eleveConnecte.code &&
                    p.parcoursId === parcours.id
                );

                return (
                  <button
                    key={parcours.id}
                    onClick={() => {
                      if (termine) return; // 🚫 Blocage si déjà terminé
                      // ✅ Correction : réinitialiser les saisies avant ouverture
                      const parcoursAvecBalisesVides = {
                        ...parcours,
                        balises: parcours.balises.map((b) => ({
                          ...b,
                          saisi: "",
                        })),
                      };
                      setParcoursActif(parcoursAvecBalisesVides);
                      setAffichageResultat(false);
                      setPage("saisieResultat");
                    }}
                    style={{
                      padding: "12px",
                      border: "1px solid #ccc",
                      borderRadius: "6px",
                      backgroundColor: termine ? "#d4edda" : "#fff", // vert clair si terminé
                      cursor: termine ? "not-allowed" : "pointer", // curseur interdit si terminé
                      opacity: termine ? 0.6 : 1, // grisé si terminé
                      transition: "background 0.2s",
                      textAlign: "left",
                    }}
                    onMouseEnter={(e) => {
                      if (!termine) {
                        e.currentTarget.style.background = "#e0f7fa";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = termine
                        ? "#d4edda"
                        : "#fff";
                    }}
                  >
                    📋 {parcours.nom} ({parcours.balises.length} balises)
                  </button>
                );
              })}
          </div>
        </div>

export default ecrireResultat;