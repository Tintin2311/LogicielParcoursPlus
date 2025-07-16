import React, { useState, useEffect } from 'react';
import { Users, GraduationCap, MapPin, BookOpen, Target, Award, Eye, EyeOff, ArrowLeft, ArrowRight, Compass } from 'lucide-react';
import { supabase } from "./supabaseClient";
 
 
 <div
          style={{
            marginTop: "60px",
            textAlign: "center",
            fontFamily: "Segoe UI, sans-serif",
            color: "#222",
            padding: "0 10px",
          }}
        >
          <button
            onClick={() => setPage("eleve")}
            style={{
              position: "absolute",
              top: 10,
              left: 10,
              background: "#f0f0f0",
              border: "1px solid #ccc",
              padding: "8px 12px",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            ⬅️ Retour
          </button>

          <h2 style={{ fontSize: "1.4em", marginBottom: "10px" }}>
            📊 Statistiques de {eleveConnecte.nom}
          </h2>

          {(() => {
            let totalPoints = 0;
            let totalPointsPossibles = 0;

            const parcoursFiltres = parcoursGlobaux.filter((parcours) =>
              parcours.groupesAssocies?.some((gid) =>
                groupes.find(
                  (g) =>
                    g.id === gid &&
                    g.eleves.some((e) => e.code === eleveConnecte.code)
                )
              )
            );

            parcoursFiltres.forEach((parcours) => {
              const parcoursTermine = parcoursTerminesEleves.find(
                (p) =>
                  p.eleveCode === eleveConnecte.code &&
                  p.parcoursId === parcours.id
              );
              const resultats = resultatsEleves.find(
                (r) =>
                  r.eleveCode === eleveConnecte.code &&
                  r.parcoursId === parcours.id
              );
              const essais = resultats?.essais || 0;
              let points = 0;
              let pointsPossibles = 0;

              if (modePoints === "cumul") {
                const ptsParcours = parseFloat(
                  String(baremePointsGlobal.pointsParParcours || 0).replace(
                    ",",
                    "."
                  )
                );
                if (parcoursTermine) points += ptsParcours;
                pointsPossibles += ptsParcours;

                const maxBar = Math.max(
                  ...baremeEvaluation.map(
                    (b) => parseFloat(String(b.points).replace(",", ".")) || 0
                  )
                );
                const bar = baremeEvaluation.find((b) => {
                  if (b.type === "=") return essais === b.tentatives;
                  if (b.type === "≥") return essais >= b.tentatives;
                  if (b.type === "≤") return essais <= b.tentatives;
                  if (b.type === "entre")
                    return (
                      essais >= b.minTentatives && essais <= b.maxTentatives
                    );
                  return false;
                });
                if (bar && essais > 0) {
                  const pts = parseFloat(String(bar.points).replace(",", "."));
                  points += pts;
                }
                pointsPossibles += maxBar;
              } else if (modePoints === "parParcours") {
                const pts = parseFloat(
                  String(baremePointsGlobal.pointsParParcours || 0).replace(
                    ",",
                    "."
                  )
                );
                if (parcoursTermine) points += pts;
                pointsPossibles += pts;
              } else if (modePoints === "parTentatives") {
                const maxBar = Math.max(
                  ...baremeEvaluation.map(
                    (b) => parseFloat(String(b.points).replace(",", ".")) || 0
                  )
                );
                const bar = baremeEvaluation.find((b) => {
                  if (b.type === "=") return essais === b.tentatives;
                  if (b.type === "≥") return essais >= b.tentatives;
                  if (b.type === "≤") return essais <= b.tentatives;
                  if (b.type === "entre")
                    return (
                      essais >= b.minTentatives && essais <= b.maxTentatives
                    );
                  return false;
                });
                if (bar && essais > 0) {
                  const pts = parseFloat(String(bar.points).replace(",", "."));
                  points += pts;
                }
                pointsPossibles += maxBar;
              } else if (modePoints === "personnalise") {
                const pts = parseFloat(
                  String(
                    baremePointsParcours[parcours.id]?.points || 0
                  ).replace(",", ".")
                );
                if (parcoursTermine) points += pts;
                pointsPossibles += pts;
              }

              totalPoints += points;
              totalPointsPossibles += pointsPossibles;
            });

            return (
              <>
                {/* SCORE TOTAL */}
                <div
                  style={{
                    fontSize: "4em",
                    fontWeight: "800",
                    color: "#4CAF50",
                    margin: "20px 0 30px",
                    textShadow: "2px 2px 0 #00000020",
                  }}
                >
                  🏆{" "}
                  {totalPoints.toLocaleString("fr-FR", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}
                </div>

                {/* TABLEAU DÉTAILLÉ */}
                <p
                  style={{
                    fontSize: "1em",
                    color: "#555",
                    marginBottom: "10px",
                  }}
                >
                  Points marqués :{" "}
                  {totalPoints.toLocaleString("fr-FR", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}{" "}
                  /{" "}
                  {totalPointsPossibles.toLocaleString("fr-FR", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}
                </p>

                <table
                  style={{
                    margin: "0 auto",
                    borderCollapse: "collapse",
                    width: "100%",
                    maxWidth: "600px",
                    background: "#fff",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    overflow: "hidden",
                    fontSize: "0.95em",
                  }}
                >
                  <thead>
                    <tr style={{ background: "#f5f5f5" }}>
                      <th
                        style={{
                          padding: "10px",
                          borderBottom: "1px solid #ddd",
                        }}
                      >
                        📋 Parcours
                      </th>
                      <th
                        style={{
                          padding: "10px",
                          borderBottom: "1px solid #ddd",
                        }}
                      >
                        🏅 Points
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {parcoursFiltres.map((parcours) => {
                      const parcoursTermine = parcoursTerminesEleves.find(
                        (p) =>
                          p.eleveCode === eleveConnecte.code &&
                          p.parcoursId === parcours.id
                      );
                      const resultats = resultatsEleves.find(
                        (r) =>
                          r.eleveCode === eleveConnecte.code &&
                          r.parcoursId === parcours.id
                      );
                      const essais = resultats?.essais || 0;
                      let points = 0;
                      let pointsPossibles = 0;

                      if (modePoints === "cumul") {
                        const ptsParcours = parseFloat(
                          String(
                            baremePointsGlobal.pointsParParcours || 0
                          ).replace(",", ".")
                        );
                        if (parcoursTermine) points += ptsParcours;
                        pointsPossibles += ptsParcours;

                        const maxBar = Math.max(
                          ...baremeEvaluation.map(
                            (b) =>
                              parseFloat(String(b.points).replace(",", ".")) ||
                              0
                          )
                        );
                        const bar = baremeEvaluation.find((b) => {
                          if (b.type === "=") return essais === b.tentatives;
                          if (b.type === "≥") return essais >= b.tentatives;
                          if (b.type === "≤") return essais <= b.tentatives;
                          if (b.type === "entre")
                            return (
                              essais >= b.minTentatives &&
                              essais <= b.maxTentatives
                            );
                          return false;
                        });
                        if (bar && essais > 0) {
                          const pts = parseFloat(
                            String(bar.points).replace(",", ".")
                          );
                          points += pts;
                        }
                        pointsPossibles += maxBar;
                      } else if (modePoints === "parParcours") {
                        const pts = parseFloat(
                          String(
                            baremePointsGlobal.pointsParParcours || 0
                          ).replace(",", ".")
                        );
                        if (parcoursTermine) points += pts;
                        pointsPossibles += pts;
                      } else if (modePoints === "parTentatives") {
                        const maxBar = Math.max(
                          ...baremeEvaluation.map(
                            (b) =>
                              parseFloat(String(b.points).replace(",", ".")) ||
                              0
                          )
                        );
                        
                        const bar = baremeEvaluation.find((b) => {
                          if (b.type === "=") return essais === b.tentatives;
                          if (b.type === "≥") return essais >= b.tentatives;
                          if (b.type === "≤") return essais <= b.tentatives;
                          if (b.type === "entre")
                            return (
                              essais >= b.minTentatives &&
                              essais <= b.maxTentatives
                            );
                          return false;
                        });
                        if (bar && essais > 0) {
                          const pts = parseFloat(
                            String(bar.points).replace(",", ".")
                          );
                          points += pts;
                        }
                        pointsPossibles += maxBar;
                      } else if (modePoints === "personnalise") {
                        const pts = parseFloat(
                          String(
                            baremePointsParcours[parcours.id]?.points || 0
                          ).replace(",", ".")
                        );
                        if (parcoursTermine) points += pts;
                        pointsPossibles += pts;
                      }

                      return (
                        <tr key={parcours.id}>
                          <td
                            style={{
                              padding: "8px",
                              borderBottom: "1px solid #eee",
                              textAlign: "left",
                            }}
                          >
                            {parcours.nom}
                          </td>
                          <td
                            style={{
                              padding: "8px",
                              borderBottom: "1px solid #eee",
                              textAlign: "center",
                            }}
                          >
                            {points.toLocaleString("fr-FR", {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 2,
                            })}{" "}
                            /{" "}
                            {pointsPossibles.toLocaleString("fr-FR", {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </>
            );
          })()}
        </div>

export default statistiquesEleve;