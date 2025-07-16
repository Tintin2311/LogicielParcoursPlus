import React, { useState, useEffect } from 'react';
import { Users, GraduationCap, MapPin, BookOpen, Target, Award, Eye, EyeOff, ArrowLeft, ArrowRight, Compass } from 'lucide-react';
import { supabase } from "./supabaseClient";

<div style={{ textAlign: "center", marginTop: "80px" }}>
          <button
            onClick={() => {
              setParcoursActif(null);
              setPage("ecrireResultat");
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

          {parcoursActif ? (
            <>
              <h2>✏️ Saisie des résultats</h2>

              {parcoursTerminesEleves.some(
                (p) =>
                  p.eleveCode === eleveConnecte.code &&
                  p.parcoursId === parcoursActif.id
              ) ? (
                <>
                  <p
                    style={{
                      marginTop: "20px",
                      fontSize: "1.1em",
                      fontWeight: "bold",
                    }}
                  >
                    ✅ Parcours "{parcoursActif.nom}" terminé à 100% en{" "}
                    {
                      parcoursTerminesEleves.find(
                        (p) =>
                          p.eleveCode === eleveConnecte.code &&
                          p.parcoursId === parcoursActif.id
                      )?.essais
                    }{" "}
                    {(parcoursTerminesEleves.find(
                      (p) =>
                        p.eleveCode === eleveConnecte.code &&
                        p.parcoursId === parcoursActif.id
                    )?.essais || 1) > 1
                      ? "essais"
                      : "essai"}
                    .
                  </p>
                  <button
                    onClick={() => {
                      setParcoursActif(null);
                      setPage("ecrireResultat");
                    }}
                    style={{
                      fontSize: "1em",
                      padding: "10px 20px",
                      backgroundColor: "#2196F3",
                      color: "white",
                      border: "none",
                      borderRadius: "5px",
                      cursor: "pointer",
                      marginTop: "20px",
                    }}
                  >
                    ↩️ Retourner aux parcours
                  </button>
                </>
              ) : (
                <>
                  <p>
                    Parcours : <strong>{parcoursActif.nom}</strong> (
                    {parcoursActif.balises.length} balises)
                  </p>
                  <p
                    style={{
                      textAlign: "center",
                      fontSize: "1em",
                      marginBottom: "10px",
                    }}
                  >
                    🧪 Tentatives :{" "}
                    {resultatsEleves.find(
                      (r) =>
                        r.eleveCode === eleveConnecte.code &&
                        r.parcoursId === parcoursActif.id
                    )?.essais || 0}{" "}
                    essai
                    {(resultatsEleves.find(
                      (r) =>
                        r.eleveCode === eleveConnecte.code &&
                        r.parcoursId === parcoursActif.id
                    )?.essais || 0) > 1 && "s"}
                  </p>

                  <div
                    style={{
                      maxWidth: "400px",
                      margin: "30px auto",
                      textAlign: "left",
                    }}
                  >
                    {parcoursActif.balises.map((balise, idx) => (
                      <div
                        key={idx}
                        style={{
                          marginBottom: "10px",
                          padding: "10px",
                          border: "1px solid #ddd",
                          borderRadius: "6px",
                          backgroundColor: affichageResultat
                            ? balise.saisi?.toUpperCase().trim() ===
                              balise.code?.toUpperCase().trim()
                              ? "#d4edda" // vert
                              : "#f8d7da" // rouge
                            : "#f9f9f9",
                        }}
                      >
                        <label>Balise {idx + 1}</label>
                        <input
                          type="text"
                          placeholder="Entrer le code trouvé"
                          value={balise.saisi || ""}
                          onChange={(e) => {
                            if (affichageResultat) return;
                            const newBalises = [...parcoursActif.balises];
                            newBalises[idx] = {
                              ...newBalises[idx],
                              saisi: e.target.value.toUpperCase().trim(),
                            };
                            setParcoursActif({
                              ...parcoursActif,
                              balises: newBalises,
                            });
                          }}
                          disabled={affichageResultat}
                          style={{
                            width: "100%",
                            padding: "8px",
                            fontSize: "1em",
                            marginTop: "5px",
                            textTransform: "uppercase",
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  {!affichageResultat ? (
                    <button
                      onClick={() => {
                        const correct = parcoursActif.balises.every(
                          (balise) =>
                            balise.saisi?.toUpperCase().trim() ===
                            balise.code?.toUpperCase().trim()
                        );

                        // Calcul du nombre d'essais à incrémenter AVANT
                        let nouveauNombreEssais = 1;
                        const existing = resultatsEleves.find(
                          (r) =>
                            r.eleveCode === eleveConnecte.code &&
                            r.parcoursId === parcoursActif.id
                        );
                        if (existing) {
                          nouveauNombreEssais = existing.essais + 1;
                        }

                        // Mémorisation des tentatives
                        setResultatsEleves((prev) => {
                          if (existing) {
                            return prev.map((r) =>
                              r.eleveCode === eleveConnecte.code &&
                              r.parcoursId === parcoursActif.id
                                ? { ...r, essais: nouveauNombreEssais }
                                : r
                            );
                          } else {
                            return [
                              ...prev,
                              {
                                eleveCode: eleveConnecte.code,
                                parcoursId: parcoursActif.id,
                                essais: nouveauNombreEssais,
                              },
                            ];
                          }
                        });

                        // Ajouter le parcours comme terminé si correct
                        if (correct) {
                          setParcoursTerminesEleves((prev) => {
                            const dejaTermine = prev.find(
                              (p) =>
                                p.eleveCode === eleveConnecte.code &&
                                p.parcoursId === parcoursActif.id
                            );
                            if (dejaTermine) return prev;

                            return [
                              ...prev,
                              {
                                eleveCode: eleveConnecte.code,
                                parcoursId: parcoursActif.id,
                                essais: nouveauNombreEssais,
                              },
                            ];
                          });
                        }

                        setAffichageResultat(true);
                      }}
                      style={{
                        fontSize: "1.1em",
                        padding: "12px 25px",
                        backgroundColor: "#4CAF50",
                        color: "white",
                        border: "none",
                        borderRadius: "5px",
                        cursor: "pointer",
                        marginTop: "20px",
                      }}
                    >
                      ✅ Valider mon résultat
                    </button>
                  ) : (
                    <>
                      {parcoursActif.balises.every(
                        (balise) =>
                          balise.saisi?.toUpperCase().trim() ===
                          balise.code?.toUpperCase().trim()
                      ) ? (
                        <>
                          <p
                            style={{
                              color: "green",
                              fontWeight: "bold",
                              marginTop: "20px",
                            }}
                          >
                            🎉 Félicitations, tu as trouvé toutes les balises !
                          </p>
                          <button
                            onClick={() => {
                              setParcoursActif(null);
                              setAffichageResultat(false);
                              setPage("ecrireResultat");
                            }}
                            style={{
                              fontSize: "1em",
                              padding: "10px 20px",
                              backgroundColor: "#2196F3",
                              color: "white",
                              border: "none",
                              borderRadius: "5px",
                              cursor: "pointer",
                              marginTop: "15px",
                            }}
                          >
                            ↩️ Retourner aux parcours
                          </button>
                        </>
                      ) : (
                        <>
                          <p
                            style={{
                              color: "red",
                              fontWeight: "bold",
                              marginTop: "20px",
                            }}
                          >
                            Certaines balises sont incorrectes. Réessaie après
                            avoir vérifié.
                          </p>
                          <button
                            onClick={() => {
                              setAffichageResultat(false);
                            }}
                            style={{
                              fontSize: "1em",
                              padding: "10px 20px",
                              backgroundColor: "#2196F3",
                              color: "white",
                              border: "none",
                              borderRadius: "5px",
                              cursor: "pointer",
                              marginTop: "15px",
                            }}
                          >
                            ✏️ Retenter
                          </button>
                        </>
                      )}
                    </>
                  )}
                </>
              )}
            </>
          ) : (
            <p style={{ marginTop: "100px" }}>Aucun parcours sélectionné.</p>
          )}
        </div>

export default saisieResultat;