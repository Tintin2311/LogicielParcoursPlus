 import React, { useState, useEffect } from 'react';
import { Users, GraduationCap, MapPin, BookOpen, Target, Award, Eye, EyeOff, ArrowLeft, ArrowRight, Compass } from 'lucide-react';
import { supabase } from "./supabaseClient";

 
 
 
 <div style={{ textAlign: "center", marginTop: "80px" }}>
          <button
            onClick={() => {
              setPage("gestionGroupes");
              setNomGroupe("");
              setGroupeActif(null);
              setNomEleve("");
              setGroupeTemporaire(null);
            }}
            style={{
              position: "absolute",
              top: 10,
              left: "50%",
              transform: "translateX(-50%)",
            }}
          >
            ⬅️ Retour
          </button>

          <h2>
            {groupeActif
              ? `Modification du groupe "${
                  groupes.find((g) => g.id === groupeActif)?.nom
                }"`
              : "➕ Créer un groupe"}
          </h2>

          {/* Étape 1 : Nom du groupe */}
          <>
            <h3>📝 Étape 1 : Nom du groupe</h3>
            <input
              placeholder="Entrez le nom du groupe"
              value={nomGroupe}
              onChange={(e) => {
                setNomGroupe(e.target.value);
                if (groupeTemporaire) {
                  setGroupeTemporaire({
                    ...groupeTemporaire,
                    nom: e.target.value,
                  });
                }
              }}
              style={{
                padding: "10px",
                fontSize: "1em",
                width: "300px",
                marginBottom: "20px",
              }}
            />
            {!groupeTemporaire && (
              <>
                <br />
                <button
                  onClick={() => {
                    if (!nomGroupe.trim()) {
                      alert("❌ Le nom du groupe ne peut pas être vide.");
                      return;
                    }
                    // Créer un groupe temporaire avec le nom
                    const nouveau = {
                      id: Date.now(),
                      nom: nomGroupe.trim(),
                      eleves: [],
                    };
                    setGroupeTemporaire(nouveau);
                  }}
                  style={{
                    fontSize: "1.1em",
                    padding: "10px 20px",
                    backgroundColor: "#4CAF50",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                  }}
                >
                  ➡️ Étape suivante : Ajouter des élèves
                </button>
              </>
            )}
          </>

          {/* Étape 2 : Ajout des élèves */}
          {groupeTemporaire && (
            <>
              <h3>👥 Étape 2 : Ajouter des élèves</h3>

              {groupeTemporaire.eleves.length === 0 ? (
                <p>Aucun élève pour le moment.</p>
              ) : (
                <>
                  <p>
                    {groupeTemporaire.eleves.length} Élèves dans ce groupe :
                  </p>
                  <ul
                    style={{
                      listStyle: "none",
                      padding: 0,
                      maxWidth: "400px",
                      margin: "0 auto",
                    }}
                  >
                    {groupeTemporaire.eleves.map((eleve, idx) => (
                      <li
                        key={idx}
                        style={{
                          margin: "5px 0",
                          padding: "8px",
                          backgroundColor: "#f0f0f0",
                          borderRadius: "5px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span>
                          {eleve.nom} - Code : {eleve.code}
                        </span>
                        <div>
                          {/* Bouton Renommer */}
                          <button
                            onClick={() => {
                              const nouveauNom = prompt(
                                "Nouveau nom de l'élève :",
                                eleve.nom
                              );
                              if (nouveauNom && nouveauNom.trim() !== "") {
                                const nouveauxEleves = [
                                  ...groupeTemporaire.eleves,
                                ];
                                nouveauxEleves[idx] = {
                                  ...eleve,
                                  nom: nouveauNom.trim(),
                                };
                                setGroupeTemporaire({
                                  ...groupeTemporaire,
                                  eleves: nouveauxEleves,
                                });
                              }
                            }}
                            style={{
                              marginRight: "10px",
                              backgroundColor: "transparent",
                              border: "none",
                              cursor: "pointer",
                            }}
                            title="Renommer l'élève"
                          >
                            ✏️
                          </button>

                          {/* Bouton Supprimer */}
                          <button
                            onClick={() => {
                              if (
                                confirm(
                                  `❌ Supprimer ${eleve.nom} de ce groupe ?`
                                )
                              ) {
                                setGroupeTemporaire({
                                  ...groupeTemporaire,
                                  eleves: groupeTemporaire.eleves.filter(
                                    (_, i) => i !== idx
                                  ),
                                });
                              }
                            }}
                            style={{
                              color: "red",
                              backgroundColor: "transparent",
                              border: "none",
                              cursor: "pointer",
                            }}
                            title="Supprimer l'élève"
                          >
                            ❌
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              <div
                style={{
                  marginTop: "20px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "10px",
                  flexWrap: "wrap",
                }}
              >
                <input
                  placeholder="Nom de l'élève"
                  value={nomEleve}
                  onChange={(e) => setNomEleve(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      if (!nomEleve.trim()) {
                        alert("❌ Le nom de l'élève ne peut pas être vide.");
                        return;
                      }
                      if (
                        groupeTemporaire.eleves.some(
                          (e) => e.nom === nomEleve.trim()
                        )
                      ) {
                        alert("❌ Cet élève est déjà dans le groupe.");
                        return;
                      }
                      const nouvelEleve = {
                        nom: nomEleve.trim(),
                        code: genererCodeEleveUnique(groupes),
                      };
                      setGroupeTemporaire({
                        ...groupeTemporaire,
                        eleves: [...groupeTemporaire.eleves, nouvelEleve],
                      });
                      setNomEleve("");
                    }
                  }}
                  style={{
                    padding: "10px",
                    fontSize: "1em",
                    width: "250px",
                    marginBottom: "10px",
                  }}
                />

                <button
                  onClick={() => {
                    if (!nomEleve.trim()) {
                      alert("❌ Le nom de l'élève ne peut pas être vide.");
                      return;
                    }
                    if (
                      groupeTemporaire.eleves.some(
                        (e) => e.nom === nomEleve.trim()
                      )
                    ) {
                      alert("❌ Cet élève est déjà dans le groupe.");
                      return;
                    }
                    const nouvelEleve = {
                      nom: nomEleve.trim(),
                      code: genererCodeEleveUnique(groupes),
                    };
                    setGroupeTemporaire({
                      ...groupeTemporaire,
                      eleves: [...groupeTemporaire.eleves, nouvelEleve],
                    });
                    setNomEleve("");
                  }}
                  style={{
                    fontSize: "1em",
                    padding: "10px 15px",
                    backgroundColor: "#2196F3",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                  }}
                >
                  👤 Ajouter élève
                </button>
              </div>

              <div style={{ marginTop: "30px" }}>
                <button
                  onClick={() => {
                    if (groupeTemporaire.eleves.length === 0) {
                      if (
                        !confirm(
                          "⚠️ Voulez-vous vraiment créer un groupe sans élèves ?"
                        )
                      ) {
                        return;
                      }
                    }
                    // Sauvegarder le groupe temporaire définitivement
                    if (groupeActif) {
                      // Mode modification
                      setGroupes(
                        groupes.map((g) =>
                          g.id === groupeActif ? groupeTemporaire : g
                        )
                      );
                      alert("✅ Groupe modifié avec succès !");
                    } else {
                      // Mode création
                      setGroupes([...groupes, groupeTemporaire]);
                      alert("✅ Groupe créé avec succès !");
                    }
                    setGroupeTemporaire(null);
                    setNomGroupe("");
                    setNomEleve("");
                    setGroupeActif(null);
                    setPage("gestionGroupes");
                  }}
                  style={{
                    fontSize: "1.1em",
                    padding: "12px 25px",
                    backgroundColor: "#4CAF50",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                    marginRight: "10px",
                  }}
                >
                  ✅{" "}
                  {groupeActif
                    ? "Sauvegarder modifications"
                    : "Finaliser la création"}
                </button>

                <button
                  onClick={() => {
                    if (confirm("❌ Annuler la création de ce groupe ?")) {
                      setGroupeTemporaire(null);
                      setNomGroupe("");
                      setNomEleve("");
                    }
                  }}
                  style={{
                    fontSize: "1em",
                    padding: "12px 25px",
                    backgroundColor: "#f44336",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                  }}
                >
                  ❌ Annuler
                </button>
              </div>

              {groupeActif && (
                <button
                  onClick={() => {
                    if (confirm("🗑️ Supprimer définitivement ce groupe ?")) {
                      setGroupes(groupes.filter((g) => g.id !== groupeActif));
                      setGroupeActif(null);
                      setNomGroupe("");
                      setNomEleve("");
                      setGroupeTemporaire(null);
                      alert("✅ Groupe supprimé.");
                      setPage("gestionGroupes");
                    }
                  }}
                  style={{
                    marginTop: "20px",
                    padding: "10px 20px",
                    backgroundColor: "#ff6b6b",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                  }}
                >
                  🗑️ Supprimer le groupe
                </button>
              )}
            </>
          )}
        </div>
        export default CreerUnGroupe;