// src/NouveauMotDePasse.tsx
import React, { useMemo, useState } from "react";
import { Lock, ArrowLeft, Check, Eye, EyeOff, Info, AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "./supabaseClient";

type Props = {
  setPage: (p: string) => void;
  /** Si présent, on est dans le flux "Paramètres" (prof connecté) et on exigera le MDP actuel. */
  professeur?: { email?: string | null } | null;
};

/* ---------- Helpers validation ---------- */
const passwordRules = {
  minLen: 6, // tu peux passer à 8 si tu le souhaites
  upper: /[A-Z]/,
  digit: /\d/,
  special: /[\W_]/,
};

function getPasswordIssues(pwd: string) {
  const issues: string[] = [];
  if (pwd.length < passwordRules.minLen) issues.push(`Au moins ${passwordRules.minLen} caractères`);
  if (!passwordRules.upper.test(pwd)) issues.push("Au moins 1 majuscule");
  if (!passwordRules.digit.test(pwd)) issues.push("Au moins 1 chiffre");
  if (!passwordRules.special.test(pwd)) issues.push("Au moins 1 symbole");
  return issues;
}

function strengthScore(pwd: string) {
  // mini “score” local (0–4) : longueur + variété des classes
  let score = 0;
  if (pwd.length >= passwordRules.minLen) score++;
  if (/[a-z]/.test(pwd) && passwordRules.upper.test(pwd)) score++;
  if (passwordRules.digit.test(pwd)) score++;
  if (passwordRules.special.test(pwd)) score++;
  if (pwd.length >= 12) score++; // bonus longueur
  return Math.min(score, 4);
}

function formatSupabaseError(message: string) {
  const m = message.toLowerCase();

  if (m.includes("rate")) return "Trop de tentatives. Réessayez dans quelques instants.";
  if (m.includes("same as the old")) return "Le nouveau mot de passe doit être différent de l’actuel.";
  if (m.includes("should be at least")) return "Le mot de passe est trop court.";
  if (m.includes("invalid password") || m.includes("password is incorrect")) return "Mot de passe actuel incorrect.";
  if (m.includes("session") && m.includes("expired"))
    return "Votre session a expiré. Reconnectez-vous puis réessayez.";
  // fallback
  return "Une erreur est survenue. " + message;
}

/* ---------- Composant ---------- */
const NouveauMotDePasse: React.FC<Props> = ({ setPage, professeur }) => {
  const [motDePasseActuel, setMotDePasseActuel] = useState("");
  const [newProfPassword, setNewProfPassword] = useState("");
  const [newProfPasswordConfirm, setNewProfPasswordConfirm] = useState("");

  const [showActuel, setShowActuel] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [capsActuel, setCapsActuel] = useState(false);
  const [capsNew, setCapsNew] = useState(false);
  const [capsConfirm, setCapsConfirm] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isProfFlow = !!professeur?.email;

  const issues = useMemo(() => getPasswordIssues(newProfPassword), [newProfPassword]);
  const score = useMemo(() => strengthScore(newProfPassword), [newProfPassword]);

  const canSubmit =
    !submitting &&
    newProfPassword.length > 0 &&
    newProfPassword === newProfPasswordConfirm &&
    issues.length === 0 &&
    (!isProfFlow || motDePasseActuel.length > 0);

  const handleChangePassword = async () => {
    setGlobalError(null);
    setSuccessMsg(null);
    setSubmitting(true);

    try {
      // 1) Si prof connecté, re-vérifier l'ancien MDP (reauth)
      if (isProfFlow) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: professeur!.email!,
          password: motDePasseActuel,
        });
        if (error || !data.session) {
          setGlobalError("Mot de passe actuel incorrect.");
          setSubmitting(false);
          return;
        }
      }

      // 2) Validation locale (sécurité UX)
      if (newProfPassword !== newProfPasswordConfirm) {
        setGlobalError("Les mots de passe ne correspondent pas.");
        setSubmitting(false);
        return;
      }
      if (issues.length > 0) {
        setGlobalError("Le mot de passe ne respecte pas les critères.");
        setSubmitting(false);
        return;
      }

      // 3) Update Supabase
      const { error: updateError } = await supabase.auth.updateUser({
        password: newProfPassword.trim(),
      });

      if (updateError) {
        setGlobalError(formatSupabaseError(updateError.message));
        setSubmitting(false);
        return;
      }

      setSuccessMsg("Mot de passe mis à jour avec succès ✅");
      // petit délai pour laisser lire, puis redirection
      const target = isProfFlow ? "Parametres" : "accueil";
      setTimeout(() => setPage(target), 1400);
    } catch (e: any) {
      setGlobalError("Une erreur inattendue est survenue. " + (e?.message ?? ""));
    } finally {
      setSubmitting(false);
    }
  };

  const StrengthBar = () => {
    const labels = ["Très faible", "Faible", "Correct", "Bon", "Fort"];
    return (
      <div className="mt-2 text-left">
        <div className="h-2 w-full bg-white/15 rounded-full overflow-hidden">
          <div
            className={`h-2 transition-all`}
            style={{
              width: `${(score / 4) * 100}%`,
              background:
                score <= 1 ? "#ef4444" : score === 2 ? "#f59e0b" : score === 3 ? "#10b981" : "#22c55e",
            }}
          />
        </div>
        <div className="mt-1 text-xs text-white/80">{labels[score]}</div>
      </div>
    );
  };

  const RuleItem = ({ ok, text }: { ok: boolean; text: string }) => (
    <li className="flex items-center gap-2 text-sm">
      <span
        className={`inline-flex h-4 w-4 items-center justify-center rounded-full border ${
          ok ? "bg-emerald-500/80 border-emerald-400" : "bg-white/10 border-white/30"
        }`}
      >
        {ok ? <Check className="h-3 w-3" /> : <Info className="h-3 w-3 opacity-80" />}
      </span>
      <span className={ok ? "text-white/90" : "text-white/70"}>{text}</span>
    </li>
  );

  const renderInput = (
    label: string,
    value: string,
    setValue: (v: string) => void,
    show: boolean,
    setShow: (b: boolean) => void,
    placeholder: string,
    onCaps?: (v: boolean) => void
  ) => (
    <div className="mb-4 text-left">
      <label className="block mb-1 text-sm text-white/80">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyUp={(e) => onCaps?.(e.getModifierState && e.getModifierState("CapsLock"))}
          className="w-full px-4 py-2 pr-12 rounded-xl bg-white/15 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          autoComplete="new-password"
        />
        <button
          type="button"
          className="absolute right-3 top-2.5 text-white/70 hover:text-white"
          onClick={() => setShow(!show)}
          aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        >
          {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>
      {onCaps && (
        <div className="h-5 mt-1">
          {((label.includes("actuel") && capsActuel) ||
            (label.includes("Nouveau") && capsNew) ||
            (label.includes("Confirmation") && capsConfirm)) && (
            <div className="text-xs text-amber-300 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Verr. Maj activée
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-800 to-indigo-900 flex items-center justify-center">
      <div className="bg-white/10 backdrop-blur-md p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-xl text-white border border-white/20">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => (isProfFlow ? setPage("Parametres") : setPage("accueil"))}
            className="flex items-center text-sm text-white/80 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </button>
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Nouveau mot de passe
          </h2>
        </div>

        {/* Alerts */}
        <div aria-live="polite">
          {successMsg && (
            <div className="mb-4 rounded-xl border border-emerald-400/60 bg-emerald-500/15 p-3 text-emerald-200">
              {successMsg}{" "}
              <button
                className="underline decoration-emerald-300 hover:text-emerald-100 ml-1"
                onClick={() => (isProfFlow ? setPage("Parametres") : setPage("accueil"))}
              >
                Revenir maintenant
              </button>
            </div>
          )}
          {globalError && (
            <div className="mb-4 rounded-xl border border-rose-400/60 bg-rose-500/15 p-3 text-rose-200">
              {globalError}
            </div>
          )}
        </div>

        {/* Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (canSubmit) void handleChangePassword();
          }}
        >
          {/* Ancien MDP si prof connecté */}
          {isProfFlow &&
            renderInput(
              "Mot de passe actuel",
              motDePasseActuel,
              setMotDePasseActuel,
              showActuel,
              setShowActuel,
              "Votre mot de passe actuel",
              (v) => setCapsActuel(!!v)
            )}

          {/* Nouveau */}
          {renderInput(
            "Nouveau mot de passe",
            newProfPassword,
            setNewProfPassword,
            showNew,
            setShowNew,
            "Ex. H@lO2025!",
            (v) => setCapsNew(!!v)
          )}

          {/* Checklist règles + force */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm mb-2 text-white/80">Critères requis :</p>
              <ul className="space-y-1.5">
                <RuleItem ok={newProfPassword.length >= passwordRules.minLen} text={`Au moins ${passwordRules.minLen} caractères`} />
                <RuleItem ok={passwordRules.upper.test(newProfPassword)} text="Au moins 1 majuscule" />
                <RuleItem ok={passwordRules.digit.test(newProfPassword)} text="Au moins 1 chiffre" />
                <RuleItem ok={passwordRules.special.test(newProfPassword)} text="Au moins 1 symbole" />
              </ul>
            </div>
            <div>
              <p className="text-sm mb-2 text-white/80">Force du mot de passe :</p>
              <StrengthBar />
            </div>
          </div>

          {/* Confirmation */}
          {renderInput(
            "Confirmation",
            newProfPasswordConfirm,
            setNewProfPasswordConfirm,
            showConfirm,
            setShowConfirm,
            "Confirmez le mot de passe",
            (v) => setCapsConfirm(!!v)
          )}

          {/* Mismatch hint */}
          {newProfPasswordConfirm.length > 0 && newProfPassword !== newProfPasswordConfirm && (
            <p className="text-xs text-amber-200 -mt-2 mb-2">La confirmation ne correspond pas.</p>
          )}

          {/* CTA */}
          <button
            type="submit"
            disabled={!canSubmit}
            className={`mt-2 w-full py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2
              ${
                canSubmit
                  ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 hover:scale-[1.01] shadow-lg"
                  : "bg-white/15 text-white/60 cursor-not-allowed"
              }`}
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Mise à jour…
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Valider le mot de passe
              </>
            )}
          </button>

          {/* Aide / notes */}
          <div className="mt-4 text-xs text-white/70 space-y-1">
            <p>
              Astuce : évitez de réutiliser un ancien mot de passe. Une phrase de passe longue avec chiffres et symboles
              est souvent plus sûre.
            </p>
            {!isProfFlow && (
              <p>
                Vous êtes ici via un lien de récupération ? Assurez-vous d’utiliser le navigateur où vous avez ouvert le
                lien, afin que la session de récupération soit bien active.
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default NouveauMotDePasse;
