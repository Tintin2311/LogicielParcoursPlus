  import React, { useState, useEffect } from 'react';
import { Users, GraduationCap, MapPin, BookOpen, Target, Award, Eye, EyeOff, ArrowLeft, ArrowRight, Compass } from 'lucide-react';
import { supabase } from "./supabaseClient";
  
  
  <div style={{ textAlign: "center", marginTop: "100px" }}>
          <button
            onClick={() => setPage("gestionGroupes")}
            style={{
              position: "absolute",
              top: 10,
              left: "50%",
              transform: "translateX(-50%)",
            }}
          >
            ⬅️ Retour
          </button>
          <h2>📁 Mes Groupes</h2>

          <button
            onClick={() => {
              const nom = prompt("Nom du dossier :");
              if (!nom) return;
              const nouveauDossier = {
                id: Date.now(),
                nom,
                dossiers: [],
                groupes: [],
              };
              setDossiersGroupes([...dossiersGroupes, nouveauDossier]);
            }}
            style={{ marginTop: "20px", fontSize: "1.1em" }}
          >
            ➕ Créer un dossier
          </button>

          <div style={{ marginTop: "20px" }}>
            {dossiersGroupes.length === 0 ? (
              <p style={{ fontSize: "0.9em", color: "#666" }}>
                Aucun dossier créé pour le moment.
              </p>
            ) : (
              dossiersGroupes.map((dossier) => (
                <div
                  key={dossier.id}
                  style={{
                    border: "1px solid #ccc",
                    borderRadius: "8px",
                    margin: "10px",
                    padding: "10px",
                    background: "#f9f9f9",
                  }}
                >
                  <strong>{dossier.nom}</strong>
                  <button
                    onClick={() => {
                      const nouveauNom = prompt(
                        "Nouveau nom du dossier :",
                        dossier.nom
                      );
                      if (!nouveauNom) return;
                      setDossiersGroupes(
                        dossiersGroupes.map((d) =>
                          d.id === dossier.id ? { ...d, nom: nouveauNom } : d
                        )
                      );
                    }}
                    style={{ marginLeft: "10px", fontSize: "0.8em" }}
                  >
                    ✏️ Renommer
                  </button>
                  <button
                    onClick={() => {
                      if (!confirm("Supprimer ce dossier ?")) return;
                      setDossiersGroupes(
                        dossiersGroupes.filter((d) => d.id !== dossier.id)
                      );
                    }}
                    style={{
                      marginLeft: "5px",
                      fontSize: "0.8em",
                      color: "red",
                    }}
                  >
                    🗑️ Supprimer
                  </button>

                  {dossier.groupes.length === 0 ? (
                    <p style={{ fontSize: "0.9em", color: "#666" }}>
                      Aucun groupe dans ce dossier.
                    </p>
                  ) : (
                    dossier.groupes.map((idGroupe) => {
                      const groupe = groupes.find((g) => g.id === idGroupe);
                      if (!groupe) return null;
                      return (
                        <div key={groupe.id} style={{ marginTop: "5px" }}>
                          {groupe.nom} ({groupe.eleves.length} élèves)
                          <button
                            onClick={() => {
                              setDossiersGroupes(
                                dossiersGroupes.map((d) =>
                                  d.id === dossier.id
                                    ? {
                                        ...d,
                                        groupes: d.groupes.filter(
                                          (gid) => gid !== groupe.id
                                        ),
                                      }
                                    : d
                                )
                              );
                            }}
                            style={{
                              marginLeft: "10px",
                              fontSize: "0.8em",
                              color: "red",
                            }}
                          >
                            ❌ Retirer
                          </button>
                        </div>
                      );
                    })
                  )}

                  {dossierSelectionPourAjout === dossier.id && (
                    <div style={{ marginTop: "10px" }}>
                      <p style={{ fontSize: "0.9em", color: "#333" }}></p>
                      {groupes
                        .filter(
                          (g) =>
                            !dossier.groupes.includes(g.id) &&
                            !groupeEstDansUnAutreDossier(g.id)
                        )

                        .map((groupe) => (
                          <button
                            key={groupe.id}
                            onClick={() => {
                              // Retirer le groupe de tous les dossiers
                              const dossiersMisAJour = dossiersGroupes.map(
                                (d) => ({
                                  ...d,
                                  groupes: d.groupes.filter(
                                    (id) => id !== groupe.id
                                  ),
                                })
                              );

                              // Ajouter le groupe uniquement dans le dossier sélectionné
                              const dossiersFinal = dossiersMisAJour.map((d) =>
                                d.id === dossier.id
                                  ? { ...d, groupes: [...d.groupes, groupe.id] }
                                  : d
                              );

                              setDossiersGroupes(dossiersFinal);
                              setDossierSelectionPourAjout(null);
                            }}
                            style={{
                              display: "block",
                              margin: "5px auto",
                              padding: "8px",
                              fontSize: "0.9em",
                              width: "90%",
                            }}
                          >
                            ✅ {groupe.nom} ({groupe.eleves.length} élèves)
                          </button>
                        ))}
                      {groupes.filter(
                        (g) =>
                          !dossier.groupes.includes(g.id) &&
                          !groupeEstDansUnAutreDossier(g.id)
                      ).length === 0 && (
                        <p style={{ fontSize: "0.8em", color: "#888" }}>
                          Tous les groupes sont déjà dans des dossiers.
                        </p>
                      )}
                    </div>
                  )}
                  <button
                    onClick={() => setDossierSelectionPourAjout(dossier.id)}
                    style={{ marginTop: "10px", fontSize: "0.9em" }}
                  >
                    ➕ Ajouter un groupe
                  </button>
                </div>
              ))
            )}
          </div>
          <div
            style={{
              marginTop: "30px",
              borderTop: "2px solid #ddd",
              paddingTop: "20px",
            }}
          >
            <h3>📋 Groupes non classés</h3>
            {groupes
              .filter((g) => !groupeEstDansUnAutreDossier(g.id))
              .map((groupe) => (
                <div
                  key={groupe.id}
                  onClick={() => {
                    setGroupeActif(groupe);
                    setPage("infosGroupe");
                  }}
                  style={{
                    margin: "10px auto",
                    padding: "10px",
                    width: "300px",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    background: "#f9f9f9",
                    cursor: "pointer", // ✅ indique au survol que c'est cliquable
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#e0f7fa";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#f9f9f9";
                  }}
                >
                  <strong>{groupe.nom}</strong>
                  <br />
                  <small>{groupe.eleves.length} élèves</small>
                  <br />
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // ✅ empêche le clic d'ouvrir la page info
                      setGroupeActif(groupe.id);
                      setNomGroupe(groupe.nom);
                      setGroupeTemporaire(groupe);
                      setPage("CreerUnGroupe");
                    }}
                    style={{
                      marginTop: "5px",
                      fontSize: "0.9em",
                    }}
                  >
                    ✏️ Modifier
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // ✅ empêche le clic d'ouvrir la page info
                      if (confirm("Supprimer ce groupe ?")) {
                        setGroupes(groupes.filter((gr) => gr.id !== groupe.id));
                        setDossiersGroupes(
                          dossiersGroupes.map((d) => ({
                            ...d,
                            groupes: d.groupes.filter(
                              (gid) => gid !== groupe.id
                            ),
                          }))
                        );
                      }
                    }}
                    style={{
                      marginLeft: "5px",
                      fontSize: "0.9em",
                      color: "red",
                    }}
                  >
                    🗑️ Supprimer
                  </button>
                </div>
              ))}
            {groupes.filter((g) => !groupeEstDansUnAutreDossier(g.id))
              .length === 0 && (
              <p style={{ fontSize: "0.9em", color: "#666" }}>
                Tous les groupes sont dans des dossiers.
              </p>
            )}
          </div>
        </div>

        export default mesGroupes;