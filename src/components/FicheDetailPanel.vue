<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { ArrowLeft, CheckCircle2, AlertCircle, Wrench, Boxes, Calendar, FileText, Printer, ShieldAlert, Save, Clock, ChevronRight, User } from 'lucide-vue-next';
import { FicheNonConformite, FicheStatus, ERPRole, DestinationType } from '../types';

interface FicheDetailPanelProps {
  fiche: FicheNonConformite;
  activeRole: ERPRole;
}

const props = defineProps<FicheDetailPanelProps>();
const emit = defineEmits<{
  (e: 'back'): void;
  (e: 'treatRetouche', fiche: FicheNonConformite): void;
  (e: 'moveStockX3', fiche: FicheNonConformite): void;
  (e: 'saveProcessDecision', payload: { id: string; decision: string; date: string }): void;
  (e: 'saveRetoucheDetails', payload: { 
    id: string; 
    realized: 'Oui' | 'Non'; 
    date: string; 
    repartition: { ad: number; rb: number; re: number; rp: number }; 
    comment: string;
  }): void;
}>();

// Local state for Process Decision input
const procDecision = ref('Retouche Acceptée (Atelier de Retouche)');
const procDate = ref(new Date().toISOString().split('T')[0]);

// Local state for Retouche realization input
const isRetRealized = ref<'Oui' | 'Non'>('Oui');
const retDate = ref(new Date().toISOString().split('T')[0]);
const comment = ref('La retouche a été réalisée conformément aux tolérances de la gamme SOPAL. Portée de joint rectifiée.');

// Quantities partitioning (sum should equal props.fiche.quantite)
const qtyAD = ref(0);
const qtyRB = ref(0);
const qtyRE = ref(props.fiche.quantite);
const qtyRP = ref(0);
const qtyError = ref('');

// Sync state if quantity changes
watch(() => [props.fiche.quantite, props.fiche.id], () => {
  qtyAD.value = 0;
  qtyRB.value = 0;
  qtyRE.value = props.fiche.quantite;
  qtyRP.value = 0;
  qtyError.value = '';
}, { immediate: true });

function getStatusBannerColor(status: FicheStatus) {
  switch (status) {
    case FicheStatus.NOUVEAU:
      return 'bg-blue-600 text-white';
    case FicheStatus.EN_COURS:
      return 'bg-amber-500 text-white';
    case FicheStatus.RETOUCHE:
      return 'bg-purple-600 text-white';
    case FicheStatus.CLOTURE:
      return 'bg-emerald-600 text-white';
    default:
      return 'bg-slate-600 text-white';
  }
}

const isNouveauOrEnCours = computed(() => {
  return props.fiche.statut === FicheStatus.NOUVEAU || props.fiche.statut === FicheStatus.EN_COURS;
});

const isNouveau = computed(() => {
  return props.fiche.statut === FicheStatus.NOUVEAU;
});

const isRetoucheFinished = computed(() => {
  return props.fiche.statut === FicheStatus.RETOUCHE;
});

function handlePrint() {
  window.print();
}

function submitProcessDecision() {
  emit('saveProcessDecision', {
    id: props.fiche.id,
    decision: procDecision.value,
    date: procDate.value,
  });
}

function submitRetoucheDetails() {
  const sum = qtyAD.value + qtyRB.value + qtyRE.value + qtyRP.value;
  if (sum !== props.fiche.quantite) {
    qtyError.value = `Le total des pièces réparties (${sum}) doit être exactement égal à la quantité totale du lot (${props.fiche.quantite} pièces).`;
    return;
  }
  qtyError.value = '';
  emit('saveRetoucheDetails', {
    id: props.fiche.id,
    realized: isRetRealized.value,
    date: retDate.value,
    repartition: {
      ad: qtyAD.value,
      rb: qtyRB.value,
      re: qtyRE.value,
      rp: qtyRP.value,
    },
    comment: comment.value,
  });
}

const isAllowedProcess = computed(() => {
  return props.activeRole === ERPRole.RESP_PROCESS || props.activeRole === ERPRole.ADMINISTRATEUR;
});

const isAllowedRetouche = computed(() => {
  return props.activeRole === ERPRole.RESP_RETOUCHE || props.activeRole === ERPRole.ADMINISTRATEUR;
});

const timelineMovements = computed(() => {
  const timeline = [
    {
      id: 'mov-1',
      date: props.fiche.dateCreation,
      etape: "Enregistrement du bon de retour & Transfert Initial",
      acteur: "Opérateur Assemblage (Atelier C2)",
      desc: `Anomalie détectée sur l'OF ${props.fiche.of || 'N/A'} (Symptôme: ${props.fiche.symptomeDetecte || "Défaut qualité"}). Les ${props.fiche.quantite} pièces sont bloquées physiquement et déplacées de la ligne d'assemblage vers l'emplacement temporaire ATEL-RET-01.`
    }
  ];

  if (props.fiche.decisionProcess) {
    timeline.push({
      id: 'mov-2',
      date: props.fiche.dateDecisionProcess || props.fiche.dateCreation,
      etape: "Validation de la décision de Process Assemblage",
      acteur: "Responsable Process Assemblage",
      desc: `Décision technique prise : "${props.fiche.decisionProcess}". La fiche de non-conformité passe au statut "En cours".`
    });
  }

  if (props.fiche.retoucheRealisee) {
    timeline.push({
      id: 'mov-3',
      date: props.fiche.dateRealisationRetouche || props.fiche.dateFinRetouche || props.fiche.dateCreation,
      etape: "Clôture d'intervention de retouche physique",
      acteur: "Responsable de l'Atelier de Retouche",
      desc: `Réparation physique réalisée: ${props.fiche.retoucheRealisee}. Répartition finale : AD:${props.fiche.repartitionFin?.ad ?? 0}, RB:${props.fiche.repartitionFin?.rb ?? 0}, RE:${props.fiche.repartitionFin?.re ?? props.fiche.quantite}, RP:${props.fiche.repartitionFin?.rp ?? 0}. Email automatique SMTP envoyé à tous les intervenants.`
    });
  }

  if (props.fiche.nouvelEmplacement) {
    if (props.fiche.statut === FicheStatus.NOUVEAU || props.fiche.statut === FicheStatus.EN_COURS || props.fiche.statut === FicheStatus.RETOUCHE) {
      timeline.push({
        id: 'mov-4',
        date: props.fiche.dateChangementEmplacement || props.fiche.dateCreation,
        etape: "Mise à l'isolement (Sage X3)",
        acteur: "Magasinier C2 / ERP Link",
        desc: `Déplacement initial enregistré dans Sage X3 vers l'emplacement ${props.fiche.nouvelEmplacement}. Le lot est isolé en attente de traitement.`
      });
    } else {
      timeline.push({
        id: 'mov-4',
        date: props.fiche.dateChangementEmplacement || props.fiche.dateCreation,
        etape: "Saisie de transaction logistique (Sage X3) & Clôture",
        acteur: "Magasinier C2 / ERP Link",
        desc: `Déplacement final enregistré dans Sage X3 vers l'emplacement ${props.fiche.nouvelEmplacement}. Le lot est physiquement réintégré au stock d'assemblage pour utilisation. Dossier archivé.`
      });
    }
  }

  return timeline;
});
</script>

<template>
  <div id="fiche-detail-view" class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
    <!-- Top action bar -->
    <div class="px-6 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
      <button
        @click="emit('back')"
        class="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
      >
        <ArrowLeft class="w-4 h-4" /> Retour à la liste
      </button>

      <div class="flex gap-2">
        <button
          v-if="(isRetoucheFinished || isNouveau) && (props.activeRole === ERPRole.MAGASINIER || props.activeRole === ERPRole.ADMINISTRATEUR)"
          @click="emit('moveStockX3', props.fiche)"
          class="px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 rounded-lg flex items-center gap-1 shadow-sm cursor-pointer animate-pulse"
        >
          <Boxes class="w-3.5 h-3.5" /> Saisir dans Sage X3
        </button>

        <button
          type="button"
          @click="handlePrint"
          class="px-3 py-1.5 text-xs font-semibold border border-slate-200 hover:bg-slate-100 rounded-lg flex items-center gap-1 text-slate-600 cursor-pointer"
        >
          <Printer class="w-3.5 h-3.5" /> Imprimer
        </button>
      </div>
    </div>

    <!-- Barcode and status ribbon -->
    <div class="px-6 py-3 flex items-center justify-between font-mono font-bold tracking-wider text-sm" :class="getStatusBannerColor(props.fiche.statut)">
      <div class="flex items-center gap-2">
        <FileText class="w-5 h-5" />
        <span>{{ props.fiche.id }} — DOCUMENT OFFICIEL ERP</span>
      </div>
      <div class="text-xs uppercase">
        Statut Document : {{ props.fiche.statut }}
      </div>
    </div>

    <!-- Industrial Sheet Layout -->
    <div class="p-6 space-y-6 md:p-8">
      <!-- Header Block of ERP sheet -->
      <div class="border-2 border-slate-300 p-4 rounded-xl grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50/50">
        <div class="flex flex-col justify-center border-b md:border-b-0 md:border-r border-slate-200 pb-3 md:pb-0 md:pr-4">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Entreprise</span>
          <div class="flex items-center gap-1.5 mt-1">
            <svg class="w-5 h-5 text-[#003764]" viewBox="0 0 100 100" fill="currentColor">
              <circle cx="50" cy="50" r="46" />
            </svg>
            <span class="font-black text-[#003764] text-sm tracking-tight">SOPAL</span>
          </div>
        </div>
        
        <div class="flex flex-col justify-center border-b md:border-b-0 md:border-r border-slate-200 pb-3 md:pb-0 md:pr-4 md:pl-2">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Opérateur</span>
          <span class="font-semibold text-slate-800 flex items-center gap-1 text-sm mt-0.5 truncate">
            <User class="w-3.5 h-3.5 text-slate-400" />
            {{ props.fiche.operateur || 'Non renseigné' }}
          </span>
        </div>
        
        <div class="flex flex-col justify-center border-b md:border-b-0 md:border-r border-slate-200 pb-3 md:pb-0 md:pr-4 md:pl-2">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Date d'Émission</span>
          <span class="font-semibold text-slate-800 flex items-center gap-1 text-sm mt-0.5">
            <Calendar class="w-3.5 h-3.5 text-slate-400" />
            {{ props.fiche.dateCreation }}
          </span>
          <span class="text-[9px] text-slate-400">Enregistré à 08:32:15 CET</span>
        </div>

        <!-- Barcode Simulator -->
        <div class="flex flex-col items-center justify-center pt-1 md:pt-0">
          <div class="bg-white px-2 py-1 border border-slate-300 rounded flex flex-col items-center">
            <div class="flex gap-0.5 h-8 w-32 items-stretch">
              <div class="w-1 bg-black" />
              <div class="w-0.5 bg-black" />
              <div class="w-1 bg-white" />
              <div class="w-0.5 bg-black" />
              <div class="w-1.5 bg-black" />
              <div class="w-1 bg-white" />
              <div class="w-0.5 bg-black" />
              <div class="w-2 bg-black" />
              <div class="w-1 bg-white" />
              <div class="w-0.5 bg-black" />
              <div class="w-1.5 bg-black" />
              <div class="w-0.5 bg-white" />
              <div class="w-1 bg-black" />
            </div>
            <span class="text-[8px] font-mono tracking-widest text-slate-800 font-bold mt-1">*{{ props.fiche.id }}*</span>
          </div>
        </div>
      </div>

      <!-- Double-Column Content -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Section 1: Bon de Retour (Return Slip data) -->
        <div class="border border-slate-200 rounded-xl p-5 space-y-4 bg-white shadow-sm">
          <h3 class="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5 uppercase tracking-wide">
            <span class="w-2.5 h-2.5 rounded bg-[#004F9F]" />
            1. Bon de Retour Atelier
          </h3>

          <div class="grid grid-cols-2 gap-x-4 gap-y-3.5 text-xs">
            <div>
              <span class="text-slate-400 font-mono block">Code Pièce :</span>
              <span class="font-bold text-slate-800 font-mono text-sm uppercase">{{ props.fiche.referencePiece }}</span>
            </div>
            <div>
              <span class="text-slate-400 font-mono block">Ordre de Fabrication (OF) :</span>
              <span class="font-bold text-blue-900 font-mono text-sm uppercase bg-blue-50 px-1.5 py-0.5 rounded inline-block">{{ props.fiche.of || "OF-NON-RENSEIGNÉ" }}</span>
            </div>
            <div>
              <span class="text-slate-400 font-mono block">Atelier Émetteur :</span>
              <span class="font-semibold text-slate-800">Assemblage 2 (C2)</span>
            </div>
            <div>
              <span class="text-slate-400 font-mono block">Quantité :</span>
              <span class="font-bold text-slate-800 text-sm">{{ props.fiche.quantite }} pièces</span>
            </div>
            <div>
              <span class="text-slate-400 font-mono block">Destination d'Écart :</span>
              <span class="font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded inline-block">
                {{ props.fiche.destination }}
              </span>
            </div>
            <div class="col-span-2">
              <span class="text-slate-400 font-mono block">Emplacement Physique Actuel :</span>
              <span class="font-semibold text-slate-800 font-mono flex items-center gap-1 mt-1 bg-slate-100/50 p-2 border border-slate-200 rounded-lg">
                <Wrench class="w-4 h-4 text-slate-400" />
                {{ props.fiche.statut === FicheStatus.CLOTURE 
                  ? 'C2PRO' 
                  : 'RET( ATELIER DE RETOUCHE )' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Section 2: Non-Conformity & Diagnostics -->
        <div class="border border-slate-200 rounded-xl p-5 space-y-4 bg-white shadow-sm">
          <h3 class="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5 uppercase tracking-wide">
            <span class="w-2.5 h-2.5 rounded bg-amber-500" />
            2. Fiche de Non-Conformité
          </h3>

          <div class="space-y-3.5 text-xs">
            <div>
              <span class="text-slate-400 font-mono block">Symptôme Détecté :</span>
              <p class="font-medium text-slate-800 italic bg-amber-50/40 border border-amber-100/50 p-2.5 rounded-lg leading-relaxed mt-0.5">
                "{{ props.fiche.symptomeDetecte || "Aucun symptôme physique détaillé saisi par l'opérateur." }}"
              </p>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div>
                <span class="text-slate-400 font-mono block">Zone du défaut sur la pièce :</span>
                <span class="inline-block mt-1 font-mono font-bold bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-md">
                  📍 {{ props.fiche.emplacementDefaut }}
                </span>
              </div>
              <div>
                <span class="text-slate-400 font-mono block">Date d'Enregistrement :</span>
                <span class="inline-block mt-1 font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                  📅 {{ props.fiche.dateCreation }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Gamme Technique display on the sheet -->
      <div class="border border-blue-150 bg-blue-50/30 rounded-xl p-4 space-y-1.5">
        <span class="text-[10px] font-bold text-blue-800 uppercase tracking-wider block font-mono">⚙️ Gamme de fabrication automatique de l'article</span>
        <span class="text-xs text-slate-700 font-bold font-mono block leading-relaxed bg-white border border-blue-100 p-2.5 rounded-lg">
          {{ props.fiche.gammeArticle || "Gamme SOPAL Forge & Usinage : Forgeage de précision ➔ Ébavurage manuel ➔ Usinage CNC multi-axes ➔ Finition & Lavage ➔ Contrôle final" }}
        </span>
      </div>

      <!-- Section 3: Décision du Process Assemblage -->
      <div v-if="props.fiche.decisionProcess" class="border border-blue-200 bg-blue-50/10 rounded-xl p-5 space-y-3.5 shadow-sm">
        <h3 class="text-sm font-bold text-blue-900 uppercase tracking-wide border-b border-blue-200 pb-2 flex items-center gap-1.5">
          <ShieldAlert class="w-4 h-4 text-blue-700" />
          3. Décision du Service Process Assemblage
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div class="bg-white border border-blue-100 p-3 rounded-lg shadow-inner">
            <span class="text-slate-400 font-mono block">Décision Process Validée :</span>
            <span class="font-extrabold text-blue-800 text-sm block mt-1 uppercase">
              ⚡ {{ props.fiche.decisionProcess }}
            </span>
          </div>
          <div class="bg-white border border-blue-100 p-3 rounded-lg shadow-inner">
            <span class="text-slate-400 font-mono block">Date de prise de décision :</span>
            <span class="font-semibold text-slate-800 flex items-center gap-1 text-sm mt-1">
              <Calendar class="w-4 h-4 text-slate-400" />
              {{ props.fiche.dateDecisionProcess }}
            </span>
          </div>
        </div>
      </div>

      <!-- Correction Erreur Code -->
      <div v-if="props.fiche.erreurCodeCorrigee" class="border border-emerald-200 bg-emerald-50/10 rounded-xl p-5 space-y-3.5 shadow-sm">
        <h3 class="text-sm font-bold text-emerald-900 uppercase tracking-wide border-b border-emerald-200 pb-2 flex items-center gap-1.5">
          <CheckCircle2 class="w-4 h-4 text-emerald-700" />
          Correction Erreur Code (Service Logistique)
        </h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div class="bg-white border border-emerald-100 p-3 rounded-lg shadow-inner">
            <span class="text-slate-400 font-mono block">Statut X3 :</span>
            <span class="font-extrabold text-emerald-800 text-sm block mt-1 uppercase">
              ✨ Erreur de code corrigée
            </span>
          </div>
          <div class="bg-white border border-emerald-100 p-3 rounded-lg shadow-inner">
            <span class="text-slate-400 font-mono block">Date de correction :</span>
            <span class="font-semibold text-slate-800 flex items-center gap-1 text-sm mt-1">
              <Calendar class="w-4 h-4 text-slate-400" />
              {{ props.fiche.dateCorrectionErreurCode }}
            </span>
          </div>
        </div>
      </div>

      <!-- Section 4: Zone de Réalisation de Retouche -->
      <div v-if="props.fiche.retoucheRealisee && props.fiche.destination !== DestinationType.ERREUR_CODE" class="border border-amber-200 bg-amber-50/5 rounded-xl p-5 space-y-3.5 shadow-sm">
        <h3 class="text-sm font-bold text-amber-900 uppercase tracking-wide border-b border-amber-200 pb-2 flex items-center gap-1.5">
          <Wrench class="w-4 h-4 text-amber-700" />
          4. Rapport de l'Atelier de Retouche & Répartition Finale
        </h3>

        <div class="space-y-4 text-xs">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-white border border-amber-100 p-3 rounded-lg shadow-inner">
              <span class="text-slate-400 font-mono block">Retouche Réalisée ?</span>
              <span class="font-extrabold text-sm block mt-1" :class="props.fiche.retoucheRealisee === 'Oui' ? 'text-emerald-700' : 'text-red-700'">
                ✨ {{ props.fiche.retoucheRealisee }}
              </span>
            </div>
            <div class="bg-white border border-amber-100 p-3 rounded-lg shadow-inner">
              <span class="text-slate-400 font-mono block">Date de réalisation :</span>
              <span class="font-semibold text-slate-800 flex items-center gap-1 text-sm mt-1">
                <Calendar class="w-4 h-4 text-slate-400" />
                {{ props.fiche.dateRealisationRetouche || props.fiche.dateFinRetouche }}
              </span>
            </div>
            <div class="bg-white border border-amber-100 p-3 rounded-lg shadow-inner">
              <span class="text-slate-400 font-mono block">Signataire :</span>
              <span class="font-semibold text-slate-800 block text-sm mt-1">
                👤 {{ props.fiche.responsableRetouche || "Michel (Atelier Retouche)" }}
              </span>
            </div>
          </div>

          <!-- Box Distribution -->
          <div class="bg-white border border-slate-200 p-4 rounded-xl space-y-2.5">
            <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-mono">Répartition finale par décision de pièces</span>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
              <div class="bg-blue-50 border border-blue-100 p-2.5 rounded-lg">
                <span class="text-[10px] font-bold text-blue-800 uppercase block font-mono">AD (Dérogation)</span>
                <span class="text-base font-black text-blue-700 block mt-1">{{ props.fiche.repartitionFin?.ad ?? 0 }} pcs</span>
              </div>
              <div class="bg-red-50 border border-red-100 p-2.5 rounded-lg">
                <span class="text-[10px] font-bold text-red-800 uppercase block font-mono">RB (Rebut)</span>
                <span class="text-base font-black text-red-700 block mt-1">{{ props.fiche.repartitionFin?.rb ?? 0 }} pcs</span>
              </div>
              <div class="bg-emerald-50 border border-emerald-100 p-2.5 rounded-lg">
                <span class="text-[10px] font-bold text-emerald-800 uppercase block font-mono">RE (Réparé)</span>
                <span class="text-base font-black text-emerald-700 block mt-1">{{ props.fiche.repartitionFin?.re ?? props.fiche.quantite }} pcs</span>
              </div>
              <div class="bg-slate-100 border border-slate-200 p-2.5 rounded-lg">
                <span class="text-[10px] font-bold text-slate-700 uppercase block font-mono">RP (Reprise partielle)</span>
                <span class="text-base font-black text-slate-600 block mt-1">{{ props.fiche.repartitionFin?.rp ?? 0 }} pcs</span>
              </div>
            </div>
          </div>
          <div class="bg-white p-3 border border-slate-150 rounded-lg">
            <span class="text-slate-400 font-mono block">Commentaire final d'intervention :</span>
            <p class="mt-1 font-medium text-slate-800 italic leading-relaxed">
              "{{ props.fiche.commentaireRetouche || "Aucun commentaire supplémentaire enregistré." }}"
            </p>
          </div>
        </div>
      </div>

      <!-- Section 5: Sage X3 Warehouse Re-integration status -->
      <div v-if="props.fiche.nouvelEmplacement" class="border border-emerald-200 bg-emerald-50/20 rounded-xl p-5 space-y-3.5 animate-fadeIn shadow-sm">
        <h3 class="text-xs font-bold text-emerald-800 uppercase tracking-wider border-b border-emerald-200 pb-2 flex items-center gap-1.5">
          <Boxes class="w-4 h-4 text-emerald-600" />
          5. Réintégration de Stock ERP (Sage X3)
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <span class="text-slate-400 font-mono block">Nouvel Emplacement Magasin :</span>
            <span class="inline-block mt-1 font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded">
              Emplacement : 📥 {{ props.fiche.nouvelEmplacement }}
            </span>
          </div>
          <div>
            <span class="text-slate-400 font-mono block">Magasinier Signataire :</span>
            <span class="font-semibold text-slate-800 mt-1 block">
              👤 {{ props.fiche.magasinierNom || "Jean-Pierre (Magasin C2)" }}
            </span>
          </div>
          <div>
            <span class="text-slate-400 font-mono block">Date de Réintégration X3 :</span>
            <span class="font-semibold text-slate-800 mt-1 block font-mono">
              📅 {{ props.fiche.dateChangementEmplacement || props.fiche.dateFinRetouche }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Document Footer -->
    <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 text-center uppercase tracking-wider font-mono">
      Rupture Processus Prévenue | Certifié ISO 9001 - Gestion Qualité Ateliers
    </div>
  </div>
</template>
