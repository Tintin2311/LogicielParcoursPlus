import React, { useState, useEffect } from 'react';
import { Users, GraduationCap, MapPin, BookOpen, Target, Award, Eye, EyeOff, ArrowLeft, ArrowRight, Compass } from 'lucide-react';
import { supabase } from "./supabaseClient";
 
 <div style={{ padding: "20px", maxWidth: "900px", margin: "0 auto" }}>
          {professeur && page === "associationParcoursGroupe" && (
            <button
              onClick={() => setPage("gestionParcours")}
              style={{
                position: "absolute",
                top: 10,
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 1000, // pour s’assurer qu’il passe au-dessus
              }}
            >
              ⬅️ Retour
            </button>
          )}

          <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
            🔗 Associer dossiers et parcours aux groupes
          </h2>

          {parcoursGlobaux.length === 0 || groupes.length === 0 ? (
            <p style={{ textAlign: "center", color: "#555" }}>
              Veuillez créer au moins un parcours et un groupe pour commencer
              les associations.
            </p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th
                    style={{
                      border: "1px solid #ddd",
                      padding: "8px",
                      background: "#f2f2f2",
                    }}
                  ></th>
                  {groupes.map((groupe) => (
                    <th
                      key={groupe.id}
                      style={{
                        border: "1px solid #ddd",
                        padding: "8px",
                        background: "#f2f2f2",
                      }}
                    >
                      {groupe.nom}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Lignes pour les dossiers */}
                {dossiersParcours.map((dossier) => (
                  <tr key={dossier.id}>
                    <td
                      style={{
                        border: "1px solid #ddd",
                        padding: "8px",
                        fontWeight: "bold",
                      }}
                    >
                      📁 {dossier.nom}
                    </td>
                    {groupes.map((groupe) => (
                      <td
                        key={groupe.id}
                        style={{
                          border: "1px solid #ddd",
                          padding: "8px",
                          textAlign: "center",
                        }}
                      >
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            const parcoursDuDossier = parcoursGlobaux.filter(
                              (p) => dossier.parcours.includes(p.id)
                            );
                            const parcoursMisAJour = parcoursGlobaux.map(
                              (p) => {
                                if (parcoursDuDossier.includes(p)) {
                                  let nouvellesAssociations =
                                    p.groupesAssocies || [];
                                  if (e.target.checked) {
                                    if (
                                      !nouvellesAssociations.includes(groupe.id)
                                    ) {
                                      nouvellesAssociations = [
                                        ...nouvellesAssociations,
                                        groupe.id,
                                      ];
                                    }
                                  } else {
                                    nouvellesAssociations =
                                      nouvellesAssociations.filter(
                                        (id) => id !== groupe.id
                                      );
                                  }
                                  return {
                                    ...p,
                                    groupesAssocies: nouvellesAssociations,
                                  };
                                }
                                return p;
                              }
                            );
                            setParcoursGlobaux(parcoursMisAJour);
                          }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}

                {/* Lignes pour les parcours non classés */}
                {parcoursGlobaux
                  .filter(
                    (p) =>
                      !dossiersParcours.some((d) => d.parcours.includes(p.id))
                  )
                  .map((parcours) => (
                    <tr key={parcours.id}>
                      <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                        📋 {parcours.nom}
                      </td>
                      {groupes.map((groupe) => (
                        <td
                          key={groupe.id}
                          style={{
                            border: "1px solid #ddd",
                            padding: "8px",
                            textAlign: "center",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={parcours.groupesAssocies?.includes(
                              groupe.id
                            )}
                            onChange={() => {
                              const parcoursMisAJour = parcoursGlobaux.map(
                                (p) => {
                                  if (p.id === parcours.id) {
                                    let nouvellesAssociations =
                                      p.groupesAssocies || [];
                                    if (
                                      nouvellesAssociations.includes(groupe.id)
                                    ) {
                                      nouvellesAssociations =
                                        nouvellesAssociations.filter(
                                          (id) => id !== groupe.id
                                        );
                                    } else {
                                      nouvellesAssociations = [
                                        ...nouvellesAssociations,
                                        groupe.id,
                                      ];
                                    }
                                    return {
                                      ...p,
                                      groupesAssocies: nouvellesAssociations,
                                    };
                                  }
                                  return p;
                                }
                              );
                              setParcoursGlobaux(parcoursMisAJour);
                            }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
              </tbody>
            </table>
          )}

          <div style={{ textAlign: "center", marginTop: "30px" }}>
            <button
              onClick={() => setPage("gestionParcours")}
              style={{
                fontSize: "1em",
                padding: "10px 20px",
                backgroundColor: "#4CAF50",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              ✅ Sauvegarder et revenir
            </button>
          </div>
        </div>


export default associationParcoursGroupe;