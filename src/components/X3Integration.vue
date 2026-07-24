<script setup lang="ts">
import { ref, computed } from 'vue';
import { Boxes, Save, RefreshCw, Layers, Database, ArrowRight, ShieldCheck, CheckCircle2, ChevronRight } from 'lucide-vue-next';
import { FicheNonConformite, ERPRole, FicheStatus, ROLE_LABELS, DestinationType } from '../types';

interface X3IntegrationProps {
  fiche: FicheNonConformite;
  activeRole: ERPRole;
}

const props = defineProps<X3IntegrationProps>();
const emit = defineEmits<{
  (e: 'validateMove', id: string, nouvelEmplacement: string, magasinierNom: string, dateOp: string): void;
  (e: 'back'): void;
}>();

const STOCK_LOCATIONS = [
  "MAG-C2-A01 (Stock Principal)",
  "MAG-C2-A04 (Rack Étagère A4)",
  "MAG-C2-B08 (Palettier B8)",
  "STOCK-LIVR-02 (Zone Expédition)",
  "STOCK-USI-01 (Retour Atelier)",
  "ZONE-REBUT-01 (Destruction)",
  "C2PRO (Zone d'attente Retouche)"
];

const magasinierNom = ref('');
const dateOperation = ref(new Date().toISOString().split('T')[0]);
const isSubmitting = ref(false);
const showJsonPayload = ref(true);

const hasPermission = computed(() => {
  return props.activeRole === ERPRole.MAGASINIER || props.activeRole === ERPRole.ADMINISTRATEUR;
});

const currentAncienEmplacement = computed(() => {
  if (props.fiche.statut === FicheStatus.NOUVEAU) {
    return props.fiche.atelierSource || "Atelier Source Inconnu";
  }
  return props.fiche.ancienEmplacement || "ATEL-RET-01 (Atelier Retouche)";
});

// Setup dynamic locations for each sub-lot
const getLots = () => {
  const lots = [];
  
  if (props.fiche.statut === FicheStatus.NOUVEAU) {
    lots.push({ code: 'NC', label: 'Pièces Retournées', quantite: props.fiche.quantite });
    return lots;
  }

  if (props.fiche.destination === DestinationType.ERREUR_CODE && props.fiche.erreurCodeCorrigee) {
    lots.push({ code: 'OK', label: 'Correction Code', quantite: props.fiche.quantite });
    return lots;
  }

  const rep = props.fiche.repartitionFin;
  if (!rep) {
    lots.push({ code: 'RE', label: 'Réparé', quantite: props.fiche.quantite });
    return lots;
  }
  if (rep.ad > 0) lots.push({ code: 'AD', label: 'Accepté par Dérogation', quantite: rep.ad });
  if (rep.rb > 0) lots.push({ code: 'RB', label: 'Rebut', quantite: rep.rb });
  if (rep.re > 0) lots.push({ code: 'RE', label: 'Réparé', quantite: rep.re });
  if (rep.rp > 0) lots.push({ code: 'RP', label: 'Reprise / retouche partielle', quantite: rep.rp });
  return lots;
};

const activeLots = computed(getLots);

// Store locations per code
const lotLocations = ref<Record<string, { mode: string, custom: string }>>({});

activeLots.value.forEach(lot => {
  lotLocations.value[lot.code] = {
    mode: '',
    custom: ''
  };
});

const simulatedPayload = computed(() => {
  const transactions = activeLots.value.map(lot => {
    const locConfig = lotLocations.value[lot.code];
    const finalLoc = locConfig.mode === 'custom' ? locConfig.custom : locConfig.mode;
    return {
      "transactionType": "CHANGEMENT_EMPLACEMENT",
      "ficheReference": props.fiche.id,
      "productCode": props.fiche.referencePiece,
      "quantity": lot.quantite,
      "subLotCode": lot.code,
      "sourceLocation": currentAncienEmplacement.value.split(' ')[0],
      "destinationLocation": finalLoc.split(' ')[0],
      "operator": magasinierNom.value,
      "dateProcessed": dateOperation.value
    };
  });

  return {
    method: "POST",
    url: "/api/sage-x3/v1/stock/change-location",
    headers: {
      "Authorization": "Bearer X3_API_JWT_TOKEN_7d14b1e2",
      "Content-Type": "application/json",
      "X-Sage-Site": "SITE-C2"
    },
    body: {
      transactions
    }
  };
});

function handleValidateX3() {
  isSubmitting.value = true;
  
  // Simulate web service write delay
  setTimeout(() => {
    // For simplicity of UI, pass the first location as representative, or join them
    const representativeLoc = simulatedPayload.value.body.transactions.map(t => `${t.subLotCode}:${t.destinationLocation}`).join(' | ');
    emit('validateMove', props.fiche.id, representativeLoc, magasinierNom.value, dateOperation.value);
    isSubmitting.value = false;
  }, 1200);
}
</script>

<template>
  <div id="x3-integration-terminal" class="bg-white text-slate-800 rounded-2xl border border-slate-200 shadow-sm overflow-hidden font-sans flex flex-col h-full">
    <!-- Sage X3 Top Branded Ribbon -->
    <div class="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="bg-blue-100 p-1.5 rounded-lg border border-blue-200">
          <Database class="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h2 class="text-base font-bold tracking-tight text-slate-800">Sage X3 ERP — Gestion des Stocks</h2>
          <p class="text-[11px] text-slate-500 font-medium">Module : Changement Emplacement | Site : C2-ASSEMBLAGE</p>
        </div>
      </div>
      <div class="flex items-center gap-4">
        <span class="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full uppercase tracking-wider animate-pulse">
          Terminal Connecté
        </span>
        <button 
          type="button"
          @click="emit('back')"
          class="text-sm font-medium text-slate-600 hover:text-blue-600 hover:underline transition-colors cursor-pointer"
        >
          Retour Intranet
        </button>
      </div>
    </div>

    <div class="p-6 overflow-y-auto flex-1 bg-white flex justify-center">
      <!-- Left Side: Transfer Form -->
      <div class="w-full max-w-4xl space-y-5">
        <div class="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
          <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5 pb-2 border-b border-slate-100">
            <Boxes class="w-4 h-4 text-blue-600" />
            Saisie des mouvements de stock physiques
          </h3>

          <form @submit.prevent="handleValidateX3" class="space-y-5">
            <!-- Iterate over active lots -->
            <div v-for="lot in activeLots" :key="lot.code" class="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
              <div class="flex items-center justify-between border-b border-slate-200 pb-3">
                <span class="font-bold text-slate-800 uppercase flex items-center gap-2 text-sm">
                  <span class="w-2.5 h-2.5 rounded-full" :class="lot.code === 'RB' ? 'bg-red-500' : (lot.code === 'AD' ? 'bg-blue-500' : (lot.code === 'NC' ? 'bg-amber-500' : 'bg-emerald-500'))" />
                  Sous-lot : {{ lot.label }} ({{ lot.code }})
                </span>
                <span class="bg-white text-slate-700 font-mono font-bold border border-slate-200 px-2.5 py-1 rounded text-xs shadow-sm">Qté : {{ lot.quantite }}</span>
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div class="space-y-1.5">
                  <label class="block text-[10px] text-slate-500 uppercase font-bold tracking-wider">Ancien Emplacement</label>
                  <div class="w-full bg-slate-100 border border-slate-200 rounded-lg p-2.5 font-mono text-slate-600 text-[11px] shadow-inner">
                    {{ currentAncienEmplacement }}
                  </div>
                </div>

                <div class="space-y-1.5">
                  <label class="block text-[10px] text-slate-500 uppercase font-bold tracking-wider">Nouvel Emplacement *</label>
                  <select
                    required
                    :disabled="!hasPermission"
                    v-model="lotLocations[lot.code].mode"
                    class="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs shadow-sm font-medium"
                  >
                    <option value="" disabled>Sélectionnez un emplacement</option>
                    <option v-for="loc in STOCK_LOCATIONS" :key="loc" :value="loc">{{ loc }}</option>
                    <option value="custom">Autre emplacement...</option>
                  </select>
                </div>
              </div>
              
              <div v-if="lotLocations[lot.code].mode === 'custom'" class="animate-fadeIn pt-2">
                <label class="block text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1.5">Code emplacement manuel X3</label>
                <input 
                  type="text"
                  required
                  placeholder="Ex: MAG-C2-B12"
                  v-model="lotLocations[lot.code].custom"
                  @input="lotLocations[lot.code].custom = lotLocations[lot.code].custom.toUpperCase()"
                  class="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 font-mono uppercase shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
              <!-- Operator validation info -->
              <div class="space-y-1.5">
                <label class="block text-[10px] text-slate-500 uppercase font-bold tracking-wider">Magasinier (Opérateur)</label>
                <input 
                  type="text"
                  required
                  :disabled="!hasPermission"
                  v-model="magasinierNom"
                  placeholder="Nom du magasinier..."
                  class="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                />
              </div>
              <!-- Date of Operation -->
              <div class="space-y-1.5">
                <label class="block text-[10px] text-slate-500 uppercase font-bold tracking-wider">Date de l'opération</label>
                <input 
                  type="date"
                  required
                  :disabled="!hasPermission"
                  v-model="dateOperation"
                  class="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>

            <!-- Validate buttons -->
            <div class="pt-5 flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 gap-4 mt-4">
              <span class="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
                <div class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                Connexion X3 API Active
              </span>
              <button
                type="submit"
                :disabled="!hasPermission || isSubmitting"
                class="w-full sm:w-auto px-6 py-2.5 rounded-lg font-bold uppercase tracking-wider text-[11px] flex items-center justify-center gap-2 transition-all shadow-sm"
                :class="hasPermission && !isSubmitting
                  ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'"
              >
                <template v-if="isSubmitting">
                  <RefreshCw class="w-4 h-4 animate-spin" /> Écriture en cours...
                </template>
                <template v-else>
                  <Save class="w-4 h-4" /> Enregistrer les transactions X3
                </template>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
