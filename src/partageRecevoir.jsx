 import React, { useState, useEffect } from 'react';
import { Users, GraduationCap, MapPin, BookOpen, Target, Award, Eye, EyeOff, ArrowLeft, ArrowRight, Compass } from 'lucide-react';
import { supabase } from "./supabaseClient";
 
 
 <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
          <button
            onClick={() => {
              setPage("partageParcours");
              setOngletPartage(null); // remise à zéro au retour
            }}
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

          <h2 style={{ textAlign: "center", marginTop: "60px" }}>
            📥 Partages reçus
          </h2>

          {professeur?.partagesRecus && professeur.partagesRecus.length > 0 ? (
            <div>
              <h2 style={{ textAlign: "center", marginTop: "60px" }}>
                📥 Partages reçus
              </h2>

              {Object.entries(
                professeur.partagesRecus.reduce(
                  (acc: Record<string, Partage[]>, partage: Partage) => {
                    const expediteur =
                      partage.expediteur || "Expéditeur inconnu";
                    if (!acc[expediteur]) {
                      acc[expediteur] = [];
                    }
                    acc[expediteur].push(partage);
                    return acc;
                  },
                  {}
                )
              ).map(
                ([expediteur, partages]: [string, Partage[]], idx: number) => (
                  <div
                    key={idx}
                    style={{
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      padding: "10px",
                      margin: "10px auto",
                      maxWidth: "500px",
                      backgroundColor: "#f9f9f9",
                    }}
                  >
                    <p style={{ fontWeight: "bold", marginBottom: "5px" }}>
                      📩 Souhaitez-vous consulter les partages de : {expediteur}
                    </p>
                    <p style={{ fontSize: "0.9em", color: "#555" }}>
                      Date d'envoi du dernier élément :{" "}
                      {new Date(
                        partages.length > 0
                          ? Math.max(
                              ...partages.map(
                                (p: Partage) => p.date || Date.now()
                              )
                            )
                          : Date.now()
                      ).toLocaleString()}
                    </p>

                    <div style={{ marginTop: "15px" }}>
                      <button
                        onClick={() => {
                          setOngletPartage(
                            ongletPartage === `voir-${idx}`
                              ? null
                              : `voir-${idx}`
                          );
                        }}
                        style={{
                          marginRight: "10px",
                          padding: "6px 12px",
                          backgroundColor: "#2196F3",
                          color: "white",
                          border: "none",
                          borderRadius: "5px",
                          cursor: "pointer",
                        }}
                      >
                        📂{" "}
                        {ongletPartage === `voir-${idx}`
                          ? "Masquer"
                          : "Visionner"}{" "}
                        les partages
                      </button>

                      <button
                        onClick={() => {
                          if (
                            confirm(
                              `❌ Supprimer définitivement tous les partages de ${expediteur} ?`
                            )
                          ) {
                            const updatedProf: Professeur = {
                              ...professeur,
                              partagesRecus: professeur.partagesRecus.filter(
                                (p: Partage) =>
                                  (p.expediteur || "Expéditeur inconnu") !==
                                  expediteur
                              ),
                            };
                            setProfesseur(updatedProf);
                            setProfesseurs((prev: Professeur[]) =>
                              prev.map((p: Professeur) =>
                                p.code === updatedProf.code ? updatedProf : p
                              )
                            );
                            alert(
                              `✅ Tous les partages de ${expediteur} ont été supprimés.`
                            );
                          }
                        }}
                        style={{
                          padding: "6px 12px",
                          backgroundColor: "#f44336",
                          color: "white",
                          border: "none",
                          borderRadius: "5px",
                          cursor: "pointer",
                        }}
                      >
                        🗑️ Refuser
                      </button>
                    </div>

                    {ongletPartage === `voir-${idx}` && (
                      <div style={{ marginTop: "15px" }}>
                        {partages.map((partage: Partage, index: number) => (
                          <div
                            key={index}
                            style={{
                              borderTop: "1px solid #ccc",
                              paddingTop: "10px",
                              marginTop: "10px",
                            }}
                          >
                            <p>
                              <strong>
                                {partage.type === "dossier"
                                  ? "📁 Dossier"
                                  : "📋 Parcours"}{" "}
                                :
                              </strong>{" "}
                              {partage.nom}
                            </p>

                            <button
                              onClick={() => {
                                let nomFinal = partage.nom.trim();
                                let doublon = true;

                                while (doublon) {
                                  const nouveauNom = prompt(
                                    "Renommer l'élément avant importation :",
                                    nomFinal
                                  );

                                  if (!nouveauNom || nouveauNom.trim() === "") {
                                    alert(
                                      "❌ Vous devez saisir un nom pour importer cet élément."
                                    );
                                    return;
                                  }

                                  nomFinal = nouveauNom.trim();

                                  doublon =
                                    partage.type === "parcours"
                                      ? parcoursGlobaux.some(
                                          (p) =>
                                            p.nom.trim().toLowerCase() ===
                                            nomFinal.toLowerCase()
                                        )
                                      : dossiersParcours.some(
                                          (d) =>
                                            d.nom.trim().toLowerCase() ===
                                            nomFinal.toLowerCase()
                                        );

                                  if (doublon) {
                                    alert(
                                      `❌ Un ${
                                        partage.type === "parcours"
                                          ? "parcours"
                                          : "dossier"
                                      } avec ce nom existe déjà. Veuillez choisir un autre nom.`
                                    );
                                  }
                                }

                                if (partage.type === "dossier") {
                                  setDossiersParcours([
                                    ...dossiersParcours,
                                    { ...partage, nom: nomFinal },
                                  ]);
                                } else if (partage.type === "parcours") {
                                  setParcoursGlobaux([
                                    ...parcoursGlobaux,
                                    { ...partage, nom: nomFinal },
                                  ]);
                                }

                                const updatedProf: Professeur = {
                                  ...professeur,
                                  partagesRecus:
                                    professeur.partagesRecus.filter(
                                      (_, i: number) =>
                                        !(
                                          i ===
                                          professeur.partagesRecus.findIndex(
                                            (p: Partage) => p.id === partage.id
                                          )
                                        )
                                    ),
                                };
                                setProfesseur(updatedProf);
                                setProfesseurs((prev: Professeur[]) =>
                                  prev.map((p: Professeur) =>
                                    p.code === updatedProf.code
                                      ? updatedProf
                                      : p
                                  )
                                );

                                alert(`✅ "${nomFinal}" importé avec succès !`);
                              }}
                              style={{
                                marginRight: "10px",
                                padding: "6px 12px",
                                backgroundColor: "#4CAF50",
                                color: "white",
                                border: "none",
                                borderRadius: "5px",
                                cursor: "pointer",
                              }}
                            >
                              ✅ Importer
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          ) : (
            <div>
              <h2 style={{ textAlign: "center", marginTop: "60px" }}>
                📥 Partages reçus
              </h2>
              <p style={{ textAlign: "center" }}>Aucun partage reçu</p>
            </div>
          )}
        </div>
      ) : (
        <></>
      )}
    </div>
  );
}
export default partageRecevoir