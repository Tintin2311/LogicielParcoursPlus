// src/StatistiquesEleve.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Trophy,
  Target,
  MapPin,
  Award,
  Star,
  TrendingUp,
  Compass,
  Medal,
  Zap,
} from "lucide-react";

const VIDEO_URL =
  "https://aswhubzprehjnunbpkwc.supabase.co/storage/v1/object/public/background/tableau%20des%20resultats.mp4";

type Eleve = {
  display_name?: string | null;
  name?: string | null;
  nom?: string | null;
  code?: string | null;
};

type Props = {
  setPage: (p: string) => void;
  eleveConnecte?: Eleve | null;
};

const StatistiquesEleve: React.FC<Props> = ({ setPage, eleveConnecte }) => {
  // ----- ÉTATS LIES À LA VIDÉO -----
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [videoStarted, setVideoStarted] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const [showContent, setShowContent] = useState(false); // Devient true quand la vidéo est gelée
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const durationRef = useRef<number>(0);

  // ----- ÉLÈVE -----
  const eleveNom =
    eleveConnecte?.display_name ||
    eleveConnecte?.name ||
    eleveConnecte?.nom ||
    "Élève";

  // ----- MOCK DATA -----
  const parcoursFiltres = [
    { id: 1, nom: "Parcours Forêt des Chênes" },
    { id: 2, nom: "Circuit du Lac Bleu" },
    { id: 3, nom: "Randonnée des Crêtes" },
    { id: 4, nom: "Parcours Urbain Centre-Ville" },
    { id: 5, nom: "Trail des Vignobles" },
  ];

  const resultatsParParcours = [
    { parcoursId: 1, points: 15, pointsPossibles: 20, essais: 2, termine: true },
    { parcoursId: 2, points: 18, pointsPossibles: 20, essais: 1, termine: true },
    { parcoursId: 3, points: 12, pointsPossibles: 20, essais: 3, termine: true },
    { parcoursId: 4, points: 20, pointsPossibles: 20, essais: 1, termine: true },
    { parcoursId: 5, points: 0, pointsPossibles: 20, essais: 0, termine: false },
  ];

  const totalPoints = useMemo(
    () => resultatsParParcours.reduce((s, r) => s + r.points, 0),
    []
  );
  const totalPointsPossibles = useMemo(
    () => resultatsParParcours.reduce((s, r) => s + r.pointsPossibles, 0),
    []
  );
  const pourcentageReussite = useMemo(
    () => Math.round((totalPoints / Math.max(1, totalPointsPossibles)) * 100),
    [totalPoints, totalPointsPossibles]
  );
  const parcoursTermines = useMemo(
    () => resultatsParParcours.filter((r) => r.termine).length,
    []
  );
  const moyenneEssais = useMemo(() => {
    const termines = resultatsParParcours.filter((r) => r.termine);
    return Math.round(
      termines.reduce((s, r) => s + r.essais, 0) / Math.max(1, termines.length)
    );
  }, []);

  // ----- HELPERS UI -----
  const getPerformanceColor = (points: number, pointsPossibles: number) => {
    const percentage = (points / Math.max(1, pointsPossibles)) * 100;
    if (percentage >= 90) return "from-green-500 to-emerald-600";
    if (percentage >= 75) return "from-blue-500 to-cyan-600";
    if (percentage >= 60) return "from-yellow-500 to-orange-500";
    return "from-red-500 to-pink-600";
  };

  const getPerformanceBadge = (points: number, pointsPossibles: number) => {
    const percentage = (points / Math.max(1, pointsPossibles)) * 100;
    if (percentage >= 90) return { text: "Excellent", icon: Trophy, color: "text-green-300" };
    if (percentage >= 75) return { text: "Très Bien", icon: Medal, color: "text-blue-300" };
    if (percentage >= 60) return { text: "Bien", icon: Star, color: "text-yellow-300" };
    return { text: "À améliorer", icon: Target, color: "text-red-300" };
  };

  const badge = getPerformanceBadge(totalPoints, totalPointsPossibles);
  const BadgeIcon = badge.icon;

  // ----- LOGIQUE VIDÉO -----
  // Lancement auto (autoplay). Si bloqué (Safari/iOS/desktop policy), on affiche un bouton "Lancer".
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onLoadedMetadata = () => {
      setVideoReady(true);
      durationRef.current = v.duration || 0;
      // tentative de lecture auto
      v.play()
        .then(() => {
          setVideoStarted(true);
        })
        .catch(() => {
          setAutoplayBlocked(true);
        });
    };

    const onEnded = () => {
      // Geler sur la dernière image :
      freezeOnLastFrame();
      // Révéler le contenu :
      setVideoEnded(true);
      setShowContent(true);
    };

    v.addEventListener("loadedmetadata", onLoadedMetadata);
    v.addEventListener("ended", onEnded);

    return () => {
      v.removeEventListener("loadedmetadata", onLoadedMetadata);
      v.removeEventListener("ended", onEnded);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleManualStart = async () => {
    const v = videoRef.current;
    if (!v) return;
    try {
      await v.play();
      setAutoplayBlocked(false);
      setVideoStarted(true);
    } catch {
      // si l’utilisateur doit re-cliquer, on ne fait rien de plus
    }
  };

  const freezeOnLastFrame = () => {
    const v = videoRef.current;
    if (!v) return;
    // Pause et positionnement sur (durée - epsilon) pour éviter l'écran noir
    const d = durationRef.current || v.duration;
    try {
      v.pause();
      // petit epsilon pour être sûr que le frame s'affiche partout (Chrome/Safari)
      const epsilon = 0.04;
      if (Number.isFinite(d) && d > 0) {
        v.currentTime = Math.max(0, d - epsilon);
      }
    } catch {
      // silencieux
    }
  };

  // Facultatif : si l’onglet devient invisible et revient juste à la fin, on s’assure que l’image reste gelée
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible" && videoEnded) {
        freezeOnLastFrame();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [videoEnded]);

  // ----- NAVIGATION -----
  const handleBack = () => setPage("AccueilEleve");

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      {/* ======= VIDÉO DE FOND ======= */}
      <video
        ref={videoRef}
        className="fixed inset-0 w-full h-full object-cover"
        src={VIDEO_URL}
        autoPlay
        muted
        // NE PAS boucler : on veut "ended"
        loop={false}
        playsInline
        preload="auto"
        aria-hidden="true"
      />

      {/* Pendant la lecture: pas de contenu, mais on peut garder un léger voile pour le contraste */}
      {!showContent && (
        <>
          <div className="pointer-events-none fixed inset-0 bg-black/20" />
          {/* Bouton fallback si autoplay bloqué */}
          {autoplayBlocked && (
            <div className="fixed inset-0 z-10 flex items-center justify-center">
              <button
                onClick={handleManualStart}
                className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/30 transition shadow-lg"
              >
                Lancer la vidéo
              </button>
            </div>
          )}
        </>
      )}

      {/* Après la fin (image gelée), on révèle le contenu */}
      <div
        className={`fixed inset-0 z-10 transition-opacity duration-600 ${
          showContent ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Voile discret pour lisibilité une fois le contenu affiché */}
        <div className="absolute inset-0 bg-black/35" />

        {/* ====== CONTENU CONTRAINT AU CADRE ====== */}
        <div className="relative h-full w-full">
          <div
            className="mx-auto w-full max-w-[1100px] px-6 sm:px-8"
            style={{
              paddingTop: "clamp(16px, 3vh, 32px)",
              paddingBottom: "clamp(16px, 3vh, 32px)",
              height: "100%",
            }}
          >
            <div
              className="rounded-2xl"
              style={{
                maxHeight: "84vh", // Ajuste si besoin pour coller à ton cadre doré
                overflow: "hidden",
              }}
            >
              {/* Header */}
              <div className="sticky top-0 z-10 px-0 pb-4 bg-transparent">
                <div className="flex items-center justify-between">
                  <button
                    onClick={handleBack}
                    className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-black/35 hover:bg-black/45 text-white border border-white/20 transition"
                  >
                    <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                    <span className="hidden sm:inline">Retour</span>
                  </button>

                  <div className="text-center">
                    <div className="mx-auto mb-2 flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600 shadow-xl">
                      <Compass className="w-7 h-7 text-white" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-300 to-red-300 drop-shadow">
                      Mes Performances
                    </h1>
                    <p className="text-sm sm:text-base text-white/85">
                      Course d&apos;orientation — {eleveNom}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 rounded-xl px-3 py-2 bg-black/35 border border-white/20">
                    <BadgeIcon className={`w-6 h-6 ${badge.color}`} />
                    <div className="text-right">
                      <div className={`text-sm font-semibold ${badge.color}`}>{badge.text}</div>
                      <div className="text-xs text-white/80">{pourcentageReussite}% de réussite</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Zone scrollable interne */}
              <div className="overflow-y-auto pr-1" style={{ maxHeight: "calc(84vh - 84px)" }}>
                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                  <div className="rounded-2xl p-5 bg-black/35 border border-white/15">
                    <div className="flex items-center justify-center mb-2">
                      <MapPin className="w-5 h-5 text-blue-300 mr-2" />
                      <span className="text-blue-200 font-medium">Parcours</span>
                    </div>
                    <div className="text-2xl font-bold text-white text-center">
                      {parcoursTermines}/{parcoursFiltres.length}
                    </div>
                    <div className="text-blue-200/75 text-xs text-center">terminés</div>
                  </div>

                  <div className="rounded-2xl p-5 bg-black/35 border border-white/15">
                    <div className="flex items-center justify-center mb-2">
                      <TrendingUp className="w-5 h-5 text-green-300 mr-2" />
                      <span className="text-green-200 font-medium">Réussite</span>
                    </div>
                    <div className="text-2xl font-bold text-white text-center">
                      {pourcentageReussite}%
                    </div>
                    <div className="text-green-200/75 text-xs text-center">de réussite</div>
                  </div>

                  <div className="rounded-2xl p-5 bg-black/35 border border-white/15">
                    <div className="flex items-center justify-center mb-2">
                      <Zap className="w-5 h-5 text-purple-300 mr-2" />
                      <span className="text-purple-200 font-medium">Efficacité</span>
                    </div>
                    <div className="text-2xl font-bold text-white text-center">{moyenneEssais}</div>
                    <div className="text-purple-200/75 text-xs text-center">essais moy.</div>
                  </div>
                </div>

                {/* Score principal */}
                <div className="rounded-2xl p-6 bg-black/40 border border-white/15 mb-6 relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="flex items-center justify-center mb-5">
                      <Trophy className="w-10 h-10 text-yellow-300 mr-3" />
                      <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-300 to-red-300">
                        {totalPoints}
                      </div>
                      <div className="ml-3 text-left">
                        <div className="text-white/80 text-xs">points sur</div>
                        <div className="text-white text-xl font-bold">{totalPointsPossibles}</div>
                      </div>
                    </div>

                    <div className="w-full bg-white/15 rounded-full h-3 mb-2 overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${getPerformanceColor(
                          totalPoints,
                          totalPointsPossibles
                        )} rounded-full transition-all duration-1000 ease-out relative`}
                        style={{ width: `${pourcentageReussite}%` }}
                      />
                    </div>
                    <div className="text-right text-xs text-white/80">{pourcentageReussite}%</div>
                  </div>
                </div>

                {/* Détail par Parcours */}
                <div className="rounded-2xl border border-white/15 bg-black/35">
                  <div className="px-5 sm:px-6 py-4 border-b border-white/15">
                    <h2 className="text-xl font-semibold text-white text-center">📋 Détail par Parcours</h2>
                  </div>

                  <div className="px-5 sm:px-6 py-5">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      {parcoursFiltres.map((parcours, index) => {
                        const resultat = resultatsParParcours.find(
                          (r) => r.parcoursId === parcours.id
                        );
                        const percentage = resultat
                          ? (resultat.points / Math.max(1, resultat.pointsPossibles)) * 100
                          : 0;
                        const gradientColor = getPerformanceColor(
                          resultat?.points || 0,
                          resultat?.pointsPossibles || 20
                        );
                        const ParcoursBadge = resultat?.termine ? Award : Target;

                        const perfBadge = getPerformanceBadge(
                          resultat?.points ?? 0,
                          resultat?.pointsPossibles ?? 20
                        );
                        const PerfIcon = perfBadge.icon;

                        return (
                          <div
                            key={parcours.id}
                            className={`group bg-black/35 rounded-xl p-5 border border-white/12 hover:border-white/20 transition-all duration-400 ${
                              showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                            }`}
                            style={{ animationDelay: `${index * 0.05}s` }}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1 pr-3">
                                <h3 className="text-base font-bold text-white mb-1">
                                  {parcours.nom}
                                </h3>
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`flex items-center px-2.5 py-1 rounded-full text-xs border ${
                                      resultat?.termine
                                        ? "bg-green-500/15 border-green-400/30 text-green-200"
                                        : "bg-gray-500/15 border-gray-400/30 text-gray-300"
                                    }`}
                                  >
                                    <ParcoursBadge className="w-4 h-4 mr-1" />
                                    {resultat?.termine ? "Terminé" : "À faire"}
                                  </div>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <div className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300">
                                  {resultat?.points ?? 0}
                                </div>
                                <div className="text-white/80 text-xs">
                                  sur {resultat?.pointsPossibles ?? 20}
                                </div>
                              </div>
                            </div>

                            <div className="w-full bg-white/15 rounded-full h-2.5 mb-3 overflow-hidden">
                              <div
                                className={`h-full bg-gradient-to-r ${gradientColor} rounded-full transition-all duration-1000`}
                                style={{ width: `${Math.round(percentage)}%` }}
                              />
                            </div>

                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center text-white/85">
                                <Zap className="w-4 h-4 mr-1 text-purple-300" />
                                {resultat?.essais ?? 0} essai
                                {(resultat?.essais ?? 0) !== 1 ? "s" : ""}
                              </div>
                              <div
                                className={`font-bold ${
                                  percentage >= 90
                                    ? "text-green-300"
                                    : percentage >= 75
                                    ? "text-blue-300"
                                    : percentage >= 60
                                    ? "text-yellow-300"
                                    : "text-red-300"
                                }`}
                              >
                                {Math.round(percentage)}%
                              </div>
                            </div>

                            {resultat?.termine && (
                              <div className="mt-3 flex justify-center">
                                <div
                                  className={`flex items-center px-3 py-1 rounded-full border text-xs ${
                                    percentage >= 90
                                      ? "bg-green-500/15 border-green-400/30 text-green-200"
                                      : percentage >= 75
                                      ? "bg-blue-500/15 border-blue-400/30 text-blue-200"
                                      : percentage >= 60
                                      ? "bg-yellow-500/15 border-yellow-400/30 text-yellow-200"
                                      : "bg-red-500/15 border-red-400/30 text-red-200"
                                  }`}
                                >
                                  <PerfIcon className="w-4 h-4 mr-1" />
                                  {perfBadge.text}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Encouragement */}
                <div className="mt-6 rounded-2xl p-5 border border-purple-300/25 bg-black/35 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Star className="w-6 h-6 text-yellow-300 mr-2" />
                    <h3 className="text-xl font-bold text-white">Continue comme ça !</h3>
                    <Star className="w-6 h-6 text-yellow-300 ml-2" />
                  </div>
                  <p className="text-white/85">
                    {pourcentageReussite >= 90
                      ? "Excellent travail ! Tu maîtrises parfaitement la course d'orientation !"
                      : pourcentageReussite >= 75
                      ? "Très bonne performance ! Tu es sur la bonne voie !"
                      : pourcentageReussite >= 60
                      ? "Bon travail ! Continue à t'entraîner pour progresser !"
                      : "N'abandonne pas ! Chaque parcours est une opportunité d'apprendre et de progresser !"}
                  </p>
                </div>

                <div className="h-4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatistiquesEleve;
