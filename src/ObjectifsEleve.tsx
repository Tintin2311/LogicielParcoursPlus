// src/ObjectifsEleve.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Target,
  Award,
  Compass,
  Trophy,
  Star,
  Gem,
  Crown,
  Map as MapIcon, // ⚠️ alias pour éviter le conflit avec le global Map
  Flame,
  Sparkles,
  Medal,
  Zap,
  CheckCircle2,
  Coins,
  Timer,
} from "lucide-react";

/* =========================
   Types & helpers
   ========================= */

type PageSetter = (page: string) => void;
type IconType = React.ComponentType<{ className?: string } & React.SVGProps<SVGSVGElement>>;

const categories = ["Quotidien", "Hebdomadaire", "Saison", "Progression"] as const;
type Category = (typeof categories)[number];

type Reward = {
  id: string;
  name: string;
  icon: IconType;
  rarity: "commun" | "rare" | "épique" | "légendaire";
  color: string;
  description: string;
};

type ObjectiveProgress = {
  points: number;
  parcoursFinis: number;
  balisesValidees: number;
  perfectParcours: number;
  joursConsecutifs: number;
  dossiersExplores: number;
  recordsBattus: number;
  relaisParticipations: number;
  partages: number;
};

type Objective = {
  id: string;
  title: string;
  description: string;
  category: Category;
  icon: IconType;
  target: number;
  progressKey: keyof ObjectiveProgress;
  rewardId: string;
  points?: number;
  requires?: string[];
};

type OwnedReward = {
  rewardId: string;
  obtainedAt: string;
};

type Props = {
  setPage: PageSetter;
  eleveNom?: string | null;
};

/* =========================
   Icônes SVG custom
   ========================= */

function GlovesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M7 2h2v8a1 1 0 0 1-2 0V2Zm4 0h2v9a1 1 0 0 1-2 0V2Zm4 0h2v10a1 1 0 0 1-2 0V2ZM5 13h14v6a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-6Z" />
    </svg>
  );
}
function HammerIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M2 21l7-7 2 2-7 7H2v-2ZM14 3l5 5-4 4-5-5 4-4Z" />
    </svg>
  );
}
function ArrowUpIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props} fill="currentColor">
      <path d="M12 2l6 6h-4v12h-4V8H6l6-6z" />
    </svg>
  );
}

/* =========================
   Données (mock)
   ========================= */

const REWARDS: Reward[] = [
  { id: "carte-couleur", name: "Carte Couleur", icon: Gem as IconType, rarity: "commun", color: "from-sky-400 to-cyan-500", description: "Une carte colorée pour célébrer tes premiers 100 points." },
  { id: "boussole-or", name: "Boussole d’Or", icon: Compass as IconType, rarity: "rare", color: "from-amber-400 to-yellow-500", description: "Indique toujours la prochaine quête à accomplir." },
  { id: "gants-precision", name: "Gants de Précision", icon: GlovesIcon as IconType, rarity: "rare", color: "from-emerald-400 to-green-500", description: "Pour valider les balises sans trembler." },
  { id: "etoile-scintillante", name: "Étoile Scintillante", icon: Star as IconType, rarity: "épique", color: "from-fuchsia-400 to-purple-500", description: "Brille après un parcours en perfect." },
  { id: "couronne-legende", name: "Couronne de Légende", icon: Crown as IconType, rarity: "légendaire", color: "from-orange-500 to-rose-500", description: "Symbole ultime pour 1000 points cumulés." },
  { id: "badge-esprit-equipe", name: "Badge Esprit d’Équipe", icon: Medal as IconType, rarity: "commun", color: "from-blue-400 to-indigo-500", description: "Pour ta participation à un relais." },
  { id: "carte-explorateur", name: "Carte d’Explorateur", icon: MapIcon as IconType, rarity: "rare", color: "from-teal-400 to-emerald-500", description: "Décernée après avoir exploré 5 dossiers différents." },
  { id: "marteau-de-forge", name: "Marteau de Forge", icon: HammerIcon as IconType, rarity: "épique", color: "from-slate-400 to-zinc-600", description: "Chaque record battu t’affûte davantage." },
  { id: "horloge-antique", name: "Horloge Antique", icon: Timer as IconType, rarity: "rare", color: "from-yellow-300 to-amber-500", description: "Récompense une semaine de régularité." },
  { id: "timbre-voyageur", name: "Timbre Voyageur", icon: Coins as IconType, rarity: "commun", color: "from-rose-400 to-red-500", description: "Pour ton premier partage d’un parcours." },
];

const OBJECTIVES: Objective[] = [
  // Progression
  { id: "pts-100",  title: "Atteindre 100 points",  description: "Accumule 100 points pour débloquer la Carte Couleur.", category: "Progression", icon: Zap as IconType, target: 100,  progressKey: "points", rewardId: "carte-couleur", points: 20 },
  { id: "pts-500",  title: "Atteindre 500 points",  description: "Un cap majeur pour les vrais motivés !",              category: "Progression", icon: Flame as IconType, target: 500,  progressKey: "points", rewardId: "etoile-scintillante", requires: ["pts-100"], points: 50 },
  { id: "pts-1000", title: "Atteindre 1000 points", description: "La légende se dessine…",                              category: "Progression", icon: Trophy as IconType, target: 1000, progressKey: "points", rewardId: "couronne-legende",    requires: ["pts-500"], points: 100 },

  // Parcours & balises
  { id: "parcours-3",  title: "Terminer 3 parcours",            description: "Finis n’importe quels 3 parcours.", category: "Hebdomadaire", icon: Compass as IconType, target: 3,  progressKey: "parcoursFinis",   rewardId: "boussole-or",       points: 25 },
  { id: "balises-10",  title: "Valider 10 balises sans erreur", description: "La précision avant tout.",            category: "Quotidien",    icon: Target as IconType,  target: 10, progressKey: "balisesValidees", rewardId: "gants-precision", points: 15 },
  { id: "perfect-1",   title: "Réaliser 1 parcours en Perfect", description: "Zéro erreur, 100% focus.",            category: "Saison",       icon: Star as IconType,    target: 1,  progressKey: "perfectParcours", rewardId: "etoile-scintillante", points: 40 },

  // Régularité & comportements
  { id: "streak-7",    title: "7 jours consécutifs",            description: "Connecte-toi et enregistre au moins 1 action par jour.", category: "Hebdomadaire", icon: Timer as IconType, target: 7, progressKey: "joursConsecutifs",    rewardId: "horloge-antique", points: 20 },
  { id: "relais-1",    title: "Participer à un relais",         description: "L’esprit d’équipe d’abord.",                     category: "Saison",       icon: Medal as IconType,  target: 1, progressKey: "relaisParticipations", rewardId: "badge-esprit-equipe", points: 15 },
  { id: "explore-5",   title: "Explorer 5 dossiers différents", description: "Pars à la découverte de nouveaux parcours.",     category: "Saison",       icon: MapIcon as IconType,    target: 5, progressKey: "dossiersExplores",     rewardId: "carte-explorateur", points: 25 },
  { id: "records-5",   title: "Battre 5 records personnels",    description: "Repousse tes limites.",                           category: "Saison",       icon: Sparkles as IconType, target: 5, progressKey: "recordsBattus",       rewardId: "marteau-de-forge", points: 35 },

  // Social
  { id: "share-1",     title: "Partager un parcours",           description: "Diffuse une aventure pour inspirer les autres.", category: "Quotidien",    icon: Award as IconType,  target: 1, progressKey: "partages",            rewardId: "timbre-voyageur", points: 10 },
];

/* =========================
   Styles utilitaires
   ========================= */

const rarityStyle: Record<Reward["rarity"], string> = {
  commun: "bg-white/10 text-white border-white/20",
  rare: "bg-emerald-500/15 text-emerald-200 border-emerald-400/30",
  épique: "bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-400/30",
  légendaire: "bg-amber-500/15 text-amber-200 border-amber-400/30",
};

function chip(text: string, tone: "ok" | "warn" | "lock" | "done") {
  const styles: Record<typeof tone, string> = {
    ok: "bg-blue-500/15 text-blue-200 border-blue-400/30",
    warn: "bg-orange-500/15 text-orange-200 border-orange-400/30",
    lock: "bg-slate-500/15 text-slate-200 border-slate-400/30",
    done: "bg-emerald-500/15 text-emerald-200 border-emerald-400/30",
  };
  return <span className={`px-2 py-1 rounded-lg text-xs border ${styles[tone]}`}>{text}</span>;
}

/* =========================
   Composant principal
   ========================= */

export default function ObjectifsEleve({ setPage, eleveNom }: Props) {
  const [progress, setProgress] = useState<ObjectiveProgress>({
    points: 320,
    parcoursFinis: 2,
    balisesValidees: 7,
    perfectParcours: 0,
    joursConsecutifs: 3,
    dossiersExplores: 4,
    recordsBattus: 2,
    relaisParticipations: 0,
    partages: 0,
  });
  const [owned, setOwned] = useState<OwnedReward[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => setIsLoaded(true), []);

  const grouped = useMemo(
    () => categories.map((cat) => ({ cat, items: OBJECTIVES.filter((o) => o.category === cat) })),
    []
  );

  const hasReward = (rewardId: string) => owned.some((r) => r.rewardId === rewardId);
  const rewardById = (id: string): Reward | undefined => REWARDS.find((r) => r.id === id);

  function objectiveState(o: Objective) {
    const current = progress[o.progressKey];
    const percent = Math.min(100, Math.floor((current / o.target) * 100));
    const blocked =
      o.requires?.some((reqId) => {
        const req = OBJECTIVES.find((x) => x.id === reqId);
        if (!req) return true;
        return progress[req.progressKey] < req.target;
      }) ?? false;

    const completed = current >= o.target;
    const claimed = hasReward(o.rewardId);
    return { current, percent, blocked, completed, claimed };
  }

  function claimReward(o: Objective) {
    const { completed, claimed } = objectiveState(o);
    if (!completed || claimed) return;

    setOwned((prev) => [...prev, { rewardId: o.rewardId, obtainedAt: new Date().toISOString() }]);
    if (typeof o.points === "number") {
      setProgress((p) => ({ ...p, points: p.points + o.points }));
    }
  }

  function addMockProgress(key: keyof ObjectiveProgress, delta = 1) {
    setProgress((p) => ({ ...p, [key]: Math.max(0, (p[key] as number) + delta) }));
  }

  const inventory: Reward[] = useMemo(() => {
    const map = new Map<string, Reward>(); // ✅ ici c’est le vrai constructeur Map
    owned.forEach(({ rewardId }) => {
      const r = rewardById(rewardId);
      if (r) map.set(rewardId, r);
    });
    return Array.from(map.values());
  }, [owned]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-400 rounded-full mix-blend-multiply blur-xl opacity-20 animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply blur-xl opacity-20 animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      <div className={`relative z-10 container mx-auto px-4 py-8 transition-all duration-700 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setPage("AccueilEleve")} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-white hover:bg-white/15 transition">
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
          <div className="text-right">
            <div className="text-sm text-white/60">Bienvenue</div>
            <div className="text-xl font-bold text-white">{eleveNom ?? "Élève"}</div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatCard title="Points cumulés" value={progress.points} icon={Coins as IconType} gradient="from-yellow-400 to-amber-500" />
          <StatCard title="Parcours finis" value={progress.parcoursFinis} icon={Compass as IconType} gradient="from-sky-400 to-cyan-500" />
          <StatCard title="Balises validées" value={progress.balisesValidees} icon={Target as IconType} gradient="from-emerald-400 to-green-500" />
        </div>

        {/* Objectifs */}
        {grouped.map(({ cat, items }) => (
          <section key={cat} className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <SectionIcon category={cat} />
              <h2 className="text-2xl font-bold text-white">{cat}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {items.map((o) => {
                const { percent, blocked, completed, claimed, current } = objectiveState(o);
                const reward = rewardById(o.rewardId);

                return (
                  <div key={o.id} className={`relative p-5 rounded-2xl border ${completed ? "border-emerald-400/30" : "border-white/15"} bg-white/5 backdrop-blur hover:bg-white/7 transition`}>
                    {/* État */}
                    <div className="absolute top-3 right-3 flex gap-2">
                      {blocked && chip("Verrouillé", "lock")}
                      {!blocked && !completed && chip("En cours", "warn")}
                      {completed && !claimed && chip("Terminé", "ok")}
                      {completed && claimed && chip("Réclamé", "done")}
                    </div>

                    {/* Titre */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br from-white/15 to-white/5 border border-white/15">
                        <o.icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">{o.title}</h3>
                        <p className="text-sm text-white/70">{o.description}</p>
                      </div>
                    </div>

                    {/* Barre de progression */}
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-white/70 mb-1">
                        <span>Progression</span>
                        <span>{Math.min(current, o.target)} / {o.target}</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                        <div className={`h-2 bg-gradient-to-r ${completed ? "from-emerald-400 to-green-500" : "from-fuchsia-400 to-purple-500"} transition-all`} style={{ width: `${percent}%` }} />
                      </div>
                    </div>

                    {/* Récompense */}
                    <div className="mt-4 flex items-center gap-3">
                      {reward ? (
                        <div className={`px-3 py-2 rounded-xl border ${rarityStyle[reward.rarity]} flex items-center gap-2`}>
                          <reward.icon className="w-5 h-5" />
                          <div className="text-sm">
                            <div className="font-semibold">{reward.name}</div>
                            <div className="text-white/70 text-xs capitalize">{reward.rarity}</div>
                          </div>
                        </div>
                      ) : (
                        <div className="px-3 py-2 rounded-xl border border-white/15 text-white/70 text-sm">Récompense inconnue</div>
                      )}

                      {typeof o.points === "number" && <span className="text-xs text-amber-200/90">+{o.points} pts</span>}
                    </div>

                    {/* Actions */}
                    <div className="mt-5 flex items-center gap-3">
                      <button
                        onClick={() => claimReward(o)}
                        disabled={blocked || !completed || claimed}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition border ${
                          blocked || !completed || claimed
                            ? "bg-white/10 border-white/15 text-white/50 cursor-not-allowed"
                            : "bg-gradient-to-br from-emerald-400 to-green-500 text-white border-emerald-400/40 hover:scale-[1.02]"
                        }`}
                      >
                        {claimed ? "Déjà réclamé" : completed ? "Réclamer" : "Progression"}
                      </button>

                      {/* Debug local */}
                      <button onClick={() => addMockProgress(o.progressKey, 1)} className="px-3 py-2 rounded-xl text-xs text-white/70 border border-white/15 hover:bg-white/10" title="(Debug) +1 progression">
                        +1
                      </button>
                    </div>

                    {/* Dépendances */}
                    {blocked && o.requires?.length ? (
                      <p className="mt-3 text-xs text-white/60">
                        Débloque d’abord :{" "}
                        <span className="text-white/80">
                          {o.requires
                            .map((id) => OBJECTIVES.find((x) => x.id === id)?.title)
                            .filter((t): t is string => Boolean(t))
                            .join(", ")}
                        </span>
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        {/* Inventaire */}
        <section className="mt-12">
          <div className="flex items-center gap-3 mb-4">
            <Award className="w-6 h-6 text-amber-300" />
            <h2 className="text-2xl font-bold text-white">Inventaire</h2>
            <span className="text-white/60 text-sm">
              {inventory.length} objet{inventory.length > 1 ? "s" : ""} collecté{inventory.length > 1 ? "s" : ""}
            </span>
          </div>

          {inventory.length === 0 ? (
            <div className="p-6 rounded-2xl border border-white/15 bg-white/5 text-white/70">
              Aucune récompense pour l’instant. Accomplis des objectifs pour remplir ta collection !
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
              {inventory.map((r) => (
                <div key={r.id} className="p-4 rounded-2xl border border-white/15 bg-white/5 hover:bg-white/7 transition">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 bg-gradient-to-br ${r.color}`}>
                    <r.icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-semibold">{r.name}</div>
                      <div className="text-xs text-white/60 capitalize">{r.rarity}</div>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                  </div>
                  <p className="text-xs text-white/70 mt-2">{r.description}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Debug (à retirer) */}
        <section className="mt-10">
          <h3 className="text-white/80 text-sm mb-2">Debug rapide progression</h3>
          <div className="flex flex-wrap gap-2">
            <DebugButton label="+10 points" onClick={() => addMockProgress("points", 10)} />
            <DebugButton label="+1 parcours fini" onClick={() => addMockProgress("parcoursFinis", 1)} />
            <DebugButton label="+1 balise" onClick={() => addMockProgress("balisesValidees", 1)} />
            <DebugButton label="+1 perfect" onClick={() => addMockProgress("perfectParcours", 1)} />
            <DebugButton label="+1 jour (streak)" onClick={() => addMockProgress("joursConsecutifs", 1)} />
            <DebugButton label="+1 dossier exploré" onClick={() => addMockProgress("dossiersExplores", 1)} />
            <DebugButton label="+1 record battu" onClick={() => addMockProgress("recordsBattus", 1)} />
            <DebugButton label="+1 relais" onClick={() => addMockProgress("relaisParticipations", 1)} />
            <DebugButton label="+1 partage" onClick={() => addMockProgress("partages", 1)} />
          </div>
        </section>
      </div>
    </div>
  );
}

/* =========================
   Sous-composants
   ========================= */

function StatCard({
  title,
  value,
  icon: Icon,
  gradient,
}: {
  title: string;
  value: number | string;
  icon: IconType;
  gradient: string;
}) {
  return (
    <div className="p-5 rounded-2xl border border-white/15 bg-white/5 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br ${gradient}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="text-sm text-white/70">{title}</div>
          <div className="text-xl font-bold text-white">{value}</div>
        </div>
      </div>
    </div>
  );
}

function SectionIcon({ category }: { category: Category }) {
  const map: Record<Category, IconType> = {
    Quotidien: Sparkles as IconType,
    Hebdomadaire: Timer as IconType,
    Saison: Trophy as IconType,
    Progression: ArrowUpIcon as IconType,
  };
  const Icon = map[category];
  return <Icon className="w-6 h-6 text-white/80" />;
}

function DebugButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="px-3 py-2 text-xs rounded-xl border border-white/15 text-white/70 hover:bg-white/10">
      {label}
    </button>
  );
}
