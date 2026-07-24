<script setup lang="ts">
import { ref, computed } from 'vue';
import { Send, FileText, BarChart, Calendar, RefreshCcw, Layers } from 'lucide-vue-next';
import { AtelierSource, DestinationType, FicheNonConformite, ERPRole, ROLE_LABELS } from '../types';

interface FicheFormProps {
  onSubmit: (fiche: Partial<FicheNonConformite>) => void;
  onCancel?: () => void;
  activeRole: ERPRole;
}

const props = defineProps<FicheFormProps>();

const ARTICLE_TEMPLATES = [
  { ref: "0702204-1", label: "0702204-1" },
  { ref: "0712204-5", label: "0712204-5" },
  { ref: "0522204-5", label: "0522204-5" },
  { ref: "0529204-1", label: "0529204-1" },
  { ref: "0746204-1", label: "0746204-1" },
  { ref: "08GX204-1", label: "08GX204-1" },
  { ref: "1058204-2", label: "1058204-2" },
  { ref: "07BB204-4", label: "07BB204-4" },
  { ref: "0514204-1", label: "0514204-1" },
  { ref: "07BL204-2", label: "07BL204-2" },
  { ref: "TB30204-1", label: "TB30204-1" },
];

const OF_TEMPLATES = [
  "26060960", "15121132", "26061083", "25072373", "26061410", 
  "26051708", "26030394", "25112386", "26012282", "25120370", "26030481"
];

const DEFECT_TEMPLATES = [
  "Fuite d'Étanchéité sous pression (Essai hydraulique ➔ Pression d'épreuve : 6 bars)",
  "Défaut d'Aspect de Surface (Rugosité hors tolérance ISO 4287 ou micro-rayure sur portée de joint)",
  "Erreur de Filetage / Taraudage (Calibre filetage d'accouplement non-conforme, non-pénétrant)",
  "Fissure de Forgeage (Crique thermique sur le corps de robinetterie laiton)",
  "Autre défaut spécifique...",
];

function getGammeArticle(ref: string) {
  if (ref) {
    return "Fonderie ➔ Usinage 2 ➔ Plissage 2 ➔ CTS ➔ Assemblage 2";
  }
  return "Gamme Technique (En attente d'article...)";
}

// Form reactive fields
const referencePiece = ref('');
const customReference = ref('');
const of = ref('');
const quantite = ref<number | ''>('');
const atelierSource = ref<AtelierSource | ''>('');
const destination = ref<DestinationType | ''>('');
const dateCreation = ref(new Date().toISOString().split('T')[0]);
const symptomeDetecte = ref('');
const defectSelect = ref('');
const customDefect = ref('');
const emplacementDefaut = ref('');
const operateur = ref('');

const isAllowedToCreate = computed(() => {
  return props.activeRole === ERPRole.OPERATEUR || props.activeRole === ERPRole.ADMINISTRATEUR;
});

const finalReferencePiece = computed(() => {
  return referencePiece.value === "custom" ? customReference.value : referencePiece.value;
});

const finalDefectDescription = computed(() => {
  return defectSelect.value === "Autre défaut spécifique..." ? customDefect.value : defectSelect.value;
});

function handleSubmitForm() {
    let ofTrimmed = of.value.trim().toUpperCase();
    if (ofTrimmed && !ofTrimmed.startsWith("OF")) {
      ofTrimmed = "OF" + ofTrimmed;
    }
    const ofRegex = /^OF\d{8}$/;
    if (!ofRegex.test(ofTrimmed)) {
      alert("L'Ordre de Fabrication (OF) doit contenir 'OF' suivi de 8 chiffres.");
      return;
    }

    if (!finalReferencePiece.value || !ofTrimmed || !symptomeDetecte.value.trim() || !finalDefectDescription.value || !quantite.value || !atelierSource.value || !dateCreation.value || !operateur.value.trim()) {
      alert("Tous les champs sont obligatoires.");
      return;
    }

    if (destination.value !== DestinationType.ERREUR_CODE && !emplacementDefaut.value.trim()) {
      alert("La Zone / Emplacement de défaut est obligatoire, sauf si la destination est 'Erreur Code'.");
      return;
    }

  const payload: Partial<FicheNonConformite> = {
    referencePiece: finalReferencePiece.value || "REF-INCONNUE",
    of: ofTrimmed || undefined,
    quantite: quantite.value || 1,
    atelierSource: atelierSource.value,
    destination: destination.value,
    dateCreation: dateCreation.value,
    symptomeDetecte: symptomeDetecte.value.trim(),
    descriptionDefaut: finalDefectDescription.value || "Défaut non spécifié",
    emplacementDefaut: emplacementDefaut.value.trim(),
    gammeArticle: getGammeArticle(finalReferencePiece.value),
    operateur: operateur.value.trim(),
  };
  props.onSubmit(payload);
}
</script>

<template>
  <div id="fiche-creation-container" class="bg-white rounded-2xl border border-slate-200 shadow-md p-6 md:p-8">
    <div class="border-b border-slate-100 pb-4 mb-6">
      <h2 class="text-base font-extrabold text-blue-900 tracking-wide uppercase flex items-center gap-2 font-mono">
        <FileText class="w-5 h-5 text-blue-600" />
        Déclarer une Non-Conformité & Créer un Bon de Retour
      </h2>
    </div>

    <!-- Permission constraint warning overlay -->
    <div v-if="!isAllowedToCreate" class="bg-red-50 border border-red-200 p-4 rounded-xl text-xs text-red-800 mb-6 space-y-1 animate-fadeIn">
      <span class="font-bold flex items-center gap-1 uppercase tracking-wider text-[11px] text-red-900">
        ⚠️ Accès Restreint : Rôle Actuel Non Autorisé
      </span>
      <p class="leading-relaxed">
        Vous simulez actuellement le profil : <strong class="text-red-950 font-black">{{ ROLE_LABELS[props.activeRole]?.title || props.activeRole }}</strong>. Seul l'<strong>Opérateur Assemblage</strong> ou l'<strong>Administrateur</strong> est autorisé à créer un dossier ou un bon de retour.
      </p>
      <p class="text-[10.5px] text-slate-500">
        Astuce : Changez votre profil actif en haut en "Opérateur" ou connectez-vous avec <code class="bg-slate-100 text-slate-700 px-1 font-bold">op.sopal</code> pour débloquer l'enregistrement.
      </p>
    </div>

    <form @submit.prevent="handleSubmitForm" class="space-y-6">
      <div class="space-y-4">
        <!-- Input fields panel -->
        <div class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Piece Reference Selector -->
            <div class="flex flex-col gap-1">
              <label class="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Référence Pièce / Article Sopal
              </label>
              <select
                :disabled="!isAllowedToCreate"
                v-model="referencePiece"
                required
                class="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
              >
                <option value="" disabled>Sélectionnez un article</option>
                <option v-for="tpl in ARTICLE_TEMPLATES" :key="tpl.ref" :value="tpl.ref">{{ tpl.label }}</option>
                <option value="custom">Autre référence spécifique...</option>
              </select>
            </div>

            <!-- Ordre de Fabrication (OF) -->
            <div class="flex flex-col gap-1">
              <label class="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Ordre de Fabrication (OF) *
              </label>
              <input
                type="text"
                :disabled="!isAllowedToCreate"
                v-model="of"
                @input="() => {
                  let val = of.toUpperCase().replace(/[^A-Z0-9]/g, '');
                  if (!val.startsWith('OF')) val = 'OF' + val.replace(/[^0-9]/g, '');
                  else val = 'OF' + val.substring(2).replace(/[^0-9]/g, '');
                  if (val.length > 10) val = val.substring(0, 10);
                  of = val;
                }"
                list="of-list"
                required
                maxlength="10"
                placeholder="Ex: OF26060960"
                class="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono uppercase bg-slate-50/50"
              />
              <datalist id="of-list">
                <option v-for="ofItem in OF_TEMPLATES" :key="ofItem" :value="ofItem" />
              </datalist>
            </div>
          </div>

          <div v-if="referencePiece === 'custom'" class="flex flex-col gap-1 animate-fadeIn">
            <label class="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Saisir référence pièce SOPAL
            </label>
            <input 
              type="text"
              required
              :disabled="!isAllowedToCreate"
              placeholder="Ex: SOP-VALV-C2-99"
              v-model="customReference"
              @input="customReference = customReference.toUpperCase()"
              class="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono uppercase"
            />
          </div>

          <!-- Dynamic Routing (Gamme) display block -->
          <div class="bg-blue-50/60 border border-blue-200/80 rounded-xl p-3 flex items-start gap-2.5 animate-fadeIn">
            <span class="text-base text-blue-600 mt-0.5">⚙️</span>
            <div class="space-y-0.5">
              <span class="text-[10px] font-bold text-blue-700 tracking-wider uppercase block">Gamme Technique SOPAL (Affichée Automatiquement)</span>
              <span class="text-[11.5px] text-slate-700 font-semibold leading-relaxed block">
                {{ getGammeArticle(finalReferencePiece) }}
              </span>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Atelier Émetteur -->
            <div class="flex flex-col gap-1">
              <label class="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                Atelier Émetteur
              </label>
              <select
                required
                :disabled="!isAllowedToCreate"
                v-model="atelierSource"
                class="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white font-medium"
              >
                <option value="" disabled>Sélectionnez l'atelier</option>
                <option v-for="val in Object.values(AtelierSource)" :key="val" :value="val">{{ val }}</option>
              </select>
            </div>

            <!-- Quantité -->
            <div class="flex flex-col gap-1">
              <label class="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                Quantité de pièces
              </label>
              <input
                type="number"
                min="1"
                required
                :disabled="!isAllowedToCreate"
                v-model="quantite"
                class="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-semibold text-slate-800"
              />
            </div>
            <!-- Destination -->
            <div class="flex flex-col gap-1">
              <label class="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <RefreshCcw class="w-3.5 h-3.5 text-slate-500" /> Destination Flux
              </label>
              <select
                required
                :disabled="!isAllowedToCreate"
                v-model="destination"
                class="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white font-medium"
              >
                <option v-for="val in Object.values(DestinationType)" :key="val" :value="val">{{ val }}</option>
              </select>
            </div>
            
            <!-- Date Création -->
            <div class="flex flex-col gap-1">
              <label class="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <Calendar class="w-3.5 h-3.5 text-slate-500" /> Date de création
              </label>
              <input
                type="date"
                required
                :disabled="!isAllowedToCreate"
                v-model="dateCreation"
                class="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono text-slate-800"
              />
            </div>
            
            <!-- Opérateur -->
            <div class="flex flex-col gap-1">
              <label class="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                Opérateur
              </label>
              <input
                type="text"
                required
                :disabled="!isAllowedToCreate"
                v-model="operateur"
                placeholder="Nom de l'opérateur"
                class="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
              />
            </div>
          </div>

          <!-- Défaut -->
          <div class="flex flex-col gap-1">
            <label class="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
              Défaut / Motif du retour
            </label>
            <select
              required
              :disabled="!isAllowedToCreate"
              v-model="defectSelect"
              class="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
            >
              <option value="" disabled>Sélectionnez un défaut</option>
              <option value="Erreur Code">Erreur Code</option>
              <option v-for="tpl in DEFECT_TEMPLATES" :key="tpl" :value="tpl">{{ tpl }}</option>
            </select>
            <input
              v-if="defectSelect === 'Autre défaut spécifique...'"
              type="text"
              required
              :disabled="!isAllowedToCreate"
              v-model="customDefect"
              placeholder="Saisissez le défaut exact..."
              class="w-full mt-2 px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white animate-fadeIn"
            />
          </div>

          <!-- Symptome Détecté / Code correcte -->
          <div class="flex flex-col gap-1">
            <label class="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
              {{ defectSelect === 'Erreur Code' ? 'Code correcte' : "Symptôme Détecté (Description de l'anomalie)" }}
            </label>
            <textarea
              rows="2"
              required
              :disabled="!isAllowedToCreate"
              v-model="symptomeDetecte"
              :placeholder="defectSelect === 'Erreur Code' ? 'Ex: 08GX304-1' : 'Ex: Écoulement constant ou suintement au niveau de la bague d\'étanchéité...'"
              class="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-slate-50/30"
            />
          </div>

          <!-- Zone / Emplacement -->
          <div v-if="destination !== DestinationType.ERREUR_CODE" class="flex flex-col gap-1">
            <label class="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
              Zone / Emplacement
            </label>
            <input
              type="text"
              :required="destination !== DestinationType.ERREUR_CODE"
              :disabled="!isAllowedToCreate"
              v-model="emplacementDefaut"
              placeholder="Ex: Face Avant"
              class="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-slate-50/30"
            />
          </div>

        </div>
      </div>

      <!-- Buttons -->
      <div class="flex items-center justify-between border-t border-slate-100 pt-5 mt-6">
        <div class="text-[11px] text-slate-400">
          * Déclenche un envoi d'email automatique ERP à 4 services.
        </div>
        <div class="flex gap-3">
          <button
            v-if="props.onCancel"
            type="button"
            @click="props.onCancel"
            class="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Annuler
          </button>
          <button
            type="submit"
            :disabled="!isAllowedToCreate"
            class="px-5 py-2 text-sm font-semibold text-white rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
            :class="isAllowedToCreate
              ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 cursor-pointer'
              : 'bg-slate-300 text-slate-400 cursor-not-allowed'"
          >
            <Send class="w-4 h-4" /> Enregistrer & Notifier l'Intranet
          </button>
        </div>
      </div>
    </form>
  </div>
</template>
