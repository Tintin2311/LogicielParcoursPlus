  import React, { useState, useEffect } from 'react';
import { Users, GraduationCap, MapPin, BookOpen, Target, Award, Eye, EyeOff, ArrowLeft, ArrowRight, Compass } from 'lucide-react';
import { supabase } from "./supabaseClient";
 
 
 <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
          <button
            onClick={() => setPage("partageParcours")}
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
              zIndex: 1000,
            }}
          >
            ⬅️ Retour
          </button>

          <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
            📤 Partager des parcours
          </h2>

          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <input
              placeholder="Code unique du professeur destinataire"
              value={codeProfesseurDestinataire}
              onChange={(e) =>
                setCodeProfesseurDestinataire(e.target.value.toUpperCase())
              }
              style={{
                padding: "10px",
                fontSize: "1em",
                width: "80%",
                maxWidth: "300px",
                marginBottom: "10px",
              }}
            />
          </div>

          <h3>Dossiers à partager</h3>
          {dossiersParcours.length === 0 ? (
            <p style={{ fontSize: "0.9em", color: "#666" }}>
              Aucun dossier disponible.
            </p>
          ) : (
            dossiersParcours.map((dossier) => (
              <div key={dossier.id} style={{ marginBottom: "5px" }}>
                <label>
                  <input
                    type="checkbox"
                    checked={elementsAEnvoyer.some(
                      (item) =>
                        item.type === "dossier" && item.id === dossier.id
                    )}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setElementsAEnvoyer([
                          ...elementsAEnvoyer,
                          { type: "dossier", id: dossier.id },
                        ]);
                      } else {
                        setElementsAEnvoyer(
                          elementsAEnvoyer.filter(
                            (item) =>
                              !(
                                item.type === "dossier" &&
                                item.id === dossier.id
                              )
                          )
                        );
                      }
                    }}
                  />
                  📁 {dossier.nom}
                </label>
              </div>
            ))
          )}

          <h3>Parcours non classés à partager</h3>
          {parcoursGlobaux.filter(
            (p) => !dossiersParcours.some((d) => d.parcours.includes(p.id))
          ).length === 0 ? (
            <p style={{ fontSize: "0.9em", color: "#666" }}>
              Aucun parcours non classé disponible.
            </p>
          ) : (
            parcoursGlobaux
              .filter(
                (p) => !dossiersParcours.some((d) => d.parcours.includes(p.id))
              )
              .map((parcours) => (
                <div key={parcours.id} style={{ marginBottom: "5px" }}>
                  <label>
                    <input
                      type="checkbox"
                      checked={elementsAEnvoyer.some(
                        (item) =>
                          item.type === "parcours" && item.id === parcours.id
                      )}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setElementsAEnvoyer([
                            ...elementsAEnvoyer,
                            { type: "parcours", id: parcours.id },
                          ]);
                        } else {
                          setElementsAEnvoyer(
                            elementsAEnvoyer.filter(
                              (item) =>
                                !(
                                  item.type === "parcours" &&
                                  item.id === parcours.id
                                )
                            )
                          );
                        }
                      }}
                    />
                    📋 {parcours.nom}
                  </label>
                </div>
              ))
          )}

          <div style={{ textAlign: "center", marginTop: "20px" }}>
            <button
              onClick={() => {
                // Demander le nom d'expéditeur avant d'envoyer
                const nom = prompt(
                  "Sous quel nom souhaitez-vous envoyer ces documents ?"
                );
                if (!nom || nom.trim() === "") {
                  alert(
                    "❌ Vous devez saisir un nom pour envoyer ces documents."
                  );
                  return;
                }
                setNomExpediteurPartage(nom.trim());

                // Ensuite poursuivre l'envoi normalement
                const profDestinataire = professeurs.find(
                  (p) => p.code === codeProfesseurDestinataire.trim()
                );
                if (!profDestinataire) {
                  alert("❌ Aucun professeur trouvé avec ce code.");
                  return;
                }
                if (
                  profDestinataire &&
                  profDestinataire.refuserPartage === true
                ) {
                  alert(
                    `❌ ${profDestinataire.nom} a activé "Refuser les partages". Il ne peut pas recevoir de partages actuellement.`
                  );
                  return;
                }

                if (elementsAEnvoyer.length === 0) {
                  alert("❌ Vous n'avez sélectionné aucun élément à partager.");
                  return;
                }

                const elementsPartages: Partage[] = elementsAEnvoyer.map((item) => {
  if (item.type === "dossier") {
    const dossier = dossiersParcours.find((d) => d.id === item.id);
    return {
      expediteur: nom.trim(),
      type: "dossier" as const, // ← Ajout de "as const"
      id: dossier.id,
      nom: dossier.nom,
      parcours: dossier.parcours,
    };
  } else if (item.type === "parcours") {
    const parcours = parcoursGlobaux.find((p) => p.id === item.id);
    return {
      expediteur: nom.trim(),
      type: "parcours" as const, // ← Ajout de "as const"
      id: parcours.id,
      nom: parcours.nom,
      balises: parcours.balises,
      groupesAssocies: parcours.groupesAssocies || [],
    };
  }
}).filter(Boolean) as Partage[]; // ← Ajout du filter et du cast final

                const updatedProfesseurs = professeurs.map((p) => {
                  if (p.code === profDestinataire.code) {
                    const partagesRecus = p.partagesRecus || [];
                    return {
                      ...p,
                      partagesRecus: [...partagesRecus, ...elementsPartages],
                    };
                  }
                  return p;
                });
                setProfesseurs(updatedProfesseurs);

                // Synchroniser le professeur connecté si c'est le destinataire
                if (professeur.code === profDestinataire.code) {
                  const profMaj = updatedProfesseurs.find(
                    (p) => p.code === profDestinataire.code
                  );
                  setProfesseur(profMaj);
                }

                setElementsAEnvoyer([]);
                setCodeProfesseurDestinataire("");
                alert("✅ Partage envoyé avec succès !");
              }}
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
              📤 Envoyer la sélection
            </button>
          </div>
        </div>
        export default partageEnvoyer