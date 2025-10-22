// src/AccueilEleve.tsx
import React from "react";
import {
  PenTool,
  ShoppingBasket,
  Telescope,
  Settings,
  School,
  LogOut,
} from "lucide-react";

const BG =
  "https://aswhubzprehjnunbpkwc.supabase.co/storage/v1/object/public/background/carte%20village%20bois.png";

type AccueilEleveProps = {
  setPage: (p: string) => void;
  eleveConnecte: { display_name?: string | null; name?: string; nom?: string } | null;
  handleDeconnexion: () => void;
};

/* --- Carte cliquable --- */
function HotspotCard({
  title,
  subtitle,
  icon: Icon,
  left,
  top,
  onClick,
}: {
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  left: string;
  top: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 
                 rounded-xl bg-stone-900/80 border-2 border-yellow-600/80 
                 px-3 py-2 shadow-xl hover:scale-[1.03] hover:border-yellow-400 
                 transition w-[240px] text-left backdrop-blur-[1px]"
      style={{ left, top }}
      title={subtitle}
    >
      <div className="flex items-center gap-3">
        <div className="grid place-items-center w-10 h-10 rounded-full bg-stone-700/70 border border-yellow-500">
          <Icon className="w-5 h-5 text-yellow-200" />
        </div>
        <div>
          <div className="text-yellow-300 font-extrabold leading-tight">{title}</div>
          <div className="text-yellow-100/85 text-xs">{subtitle}</div>
        </div>
      </div>
    </button>
  );
}

/* --- Bouton déconnexion --- */
function LogoutButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="relative inline-flex items-center gap-2 px-4 py-2 rounded-full 
                 bg-gradient-to-b from-red-800/80 to-red-900/90 
                 text-red-100 border-2 border-red-500/70 shadow-[0_6px_18px_rgba(0,0,0,.6)]
                 hover:from-red-700/90 hover:to-red-900 transition
                 active:translate-y-[1px] hover:shadow-[0_0_18px_rgba(220,38,38,.45)]
                 before:absolute before:inset-0 before:rounded-full
                 before:border before:border-red-300/30 before:pointer-events-none
                 after:absolute after:inset-[-2px] after:rounded-full after:blur-[6px]
                 after:bg-red-500/20 after:pointer-events-none"
      title="Se déconnecter"
    >
      <span className="grid place-items-center w-6 h-6 rounded-full bg-red-700/70 border border-red-400">
        <LogOut className="w-3.5 h-3.5" />
      </span>
      <span className="font-semibold tracking-wide">Déconnexion</span>
    </button>
  );
}

const AccueilEleve: React.FC<AccueilEleveProps> = ({
  setPage,
  eleveConnecte,
  handleDeconnexion,
}) => {
  const nom =
    eleveConnecte?.display_name ??
    eleveConnecte?.name ??
    eleveConnecte?.nom ??
    "Aventurier";

  return (
    <div className="relative w-full h-screen overflow-hidden text-white font-serif">
      {/* Image plein écran */}
      <img
        src={BG}
        alt="Carte du village"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Superposition du texte et boutons */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-8 py-6 z-20">
        <div className="text-2xl font-extrabold text-yellow-300 drop-shadow-[0_2px_3px_rgba(0,0,0,0.8)]">
          Bienvenue, {nom} !
        </div>
        <LogoutButton onClick={handleDeconnexion} />
      </div>

      {/* Conteneur des hotspots */}
      <div className="relative w-full h-full pointer-events-none z-10">
        {/* 🧪 Centre de recherche */}
        <HotspotCard
          title="Centre de recherche"
          subtitle="Saisir un résultat"
          icon={PenTool}
          left="51%"
          top="50%"
          onClick={() => setPage("EcrireResultat")}
        />

        {/* 🏰 Château */}
        <HotspotCard
          title="Château"
          subtitle="Suis tes exploits"
          icon={Settings}
          left="77%"
          top="63%"
          onClick={() => setPage("StatistiquesEleve")}
        />

        {/* 🏫 École */}
        <HotspotCard
          title="École"
          subtitle="Contenu pour progresser"
          icon={School}
          left="77%"
          top="35%"
          onClick={() => alert("École : bientôt disponible")}
        />

        {/* 🔭 Tour d’observation */}
        <HotspotCard
          title="Tour d’observation"
          subtitle="Découvre de nouvelles missions"
          icon={Telescope}
          left="25%"
          top="37%"
          onClick={() => alert("Missions : bientôt disponible")}
        />

        {/* 🏪 Marché */}
        <HotspotCard
          title="Marché"
          subtitle="Acheter des accessoires"
          icon={ShoppingBasket}
          left="25%"
          top="63%"
          onClick={() => alert("Marché : bientôt disponible")}
        />
      </div>

      {/* Version mobile */}
      <div className="md:hidden absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm p-4 space-y-3 z-30">
        {[
          { t: "Centre de recherche", s: "Saisir un résultat", i: PenTool, on: () => setPage("EcrireResultat") },
          { t: "Château", s: "Suis tes exploits", i: Settings, on: () => setPage("StatistiquesEleve") },
          { t: "École", s: "Contenu pour progresser", i: School, on: () => alert("École : bientôt disponible") },
          { t: "Tour d’observation", s: "Découvre de nouvelles missions", i: Telescope, on: () => alert("Missions : bientôt disponible") },
          { t: "Marché", s: "Acheter des accessoires", i: ShoppingBasket, on: () => alert("Marché : bientôt disponible") },
        ].map(({ t, s, i: I, on }) => (
          <button
            key={t}
            onClick={on}
            className="w-full text-left rounded-xl bg-stone-900/75 border-2 border-yellow-700 px-4 py-3 shadow-lg flex items-center gap-3"
          >
            <span className="grid place-items-center w-10 h-10 rounded-full bg-stone-700/70 border border-yellow-500">
              <I className="w-5 h-5 text-yellow-200" />
            </span>
            <span>
              <div className="text-yellow-300 font-extrabold">{t}</div>
              <div className="text-yellow-100/85 text-xs">{s}</div>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AccueilEleve;
