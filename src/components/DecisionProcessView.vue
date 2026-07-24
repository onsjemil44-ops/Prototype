<script setup lang="ts">
import { ref, computed } from 'vue';
import { FicheNonConformite, FicheStatus, ERPRole, AtelierSource } from '../types';

const props = defineProps<{
  fiches: FicheNonConformite[];
  activeRole: ERPRole;
}>();

const emit = defineEmits<{
  (e: 'saveProcessDecision', payload: { 
    id: string; 
    decision: string; 
    date: string;
    atelierSource?: string;
    descriptionDefaut?: string;
    emplacementDefaut?: string;
  }): void;
  (e: 'viewDetail', fiche: FicheNonConformite): void;
}>();

// Filter fiches needing decision (NOUVEAU)
const fichesNouveau = computed(() => {
  return props.fiches.filter(f => f.statut === FicheStatus.NOUVEAU);
});

const formState = ref<Record<string, {
  decision: string;
  decisionAutre: string;
  atelierSource: string;
  descriptionDefaut: string;
  dateDecision: string;
}>>({});

import { onMounted, watch } from 'vue';

function initFormState() {
  fichesNouveau.value.forEach(fiche => {
    if (!formState.value[fiche.id]) {
      formState.value[fiche.id] = {
        decision: '',
        decisionAutre: '',
        atelierSource: '',
        descriptionDefaut: '',
        dateDecision: new Date().toISOString().split('T')[0]
      };
    }
  });
}

onMounted(() => {
  initFormState();
});

watch(fichesNouveau, () => {
  initFormState();
});

function handleDecisionChange(id: string) {
  const data = formState.value[id];
  if (data.decision === 'Déchromage') {
    data.atelierSource = AtelierSource.DECC2;
  } else if (data.decision === 'Rebut') {
    data.atelierSource = AtelierSource.PNCC2;
  }
}

function handleValidate(fiche: FicheNonConformite) {
  const data = formState.value[fiche.id];
  if (!data || !data.decision) return;
  
  const finalDecision = data.decision === 'Autre' && data.decisionAutre?.trim() ? data.decisionAutre.trim() : data.decision;
  
  emit('saveProcessDecision', {
    id: fiche.id,
    decision: finalDecision,
    date: data.dateDecision || new Date().toISOString().split('T')[0],
    atelierSource: data.atelierSource,
    descriptionDefaut: data.descriptionDefaut
  });
}

const isAllowed = computed(() => {
  return props.activeRole === ERPRole.RESP_PROCESS || props.activeRole === ERPRole.ADMINISTRATEUR;
});
</script>

<template>
  <div class="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
    <div class="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
      <div>
        <h2 class="text-lg font-black text-slate-800 tracking-tight">Décisions Techniques — Service Process</h2>
      </div>
      <div v-if="!isAllowed" class="bg-red-50 text-red-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-red-200">
        Accès en lecture seule
      </div>
    </div>

    <div class="p-6 overflow-y-auto flex-1 bg-slate-50/50">
      <div v-if="fichesNouveau.length === 0" class="text-center py-12 text-slate-500">
        Aucune fiche en attente de décision technique.
      </div>

      <div class="space-y-6">
        <div v-for="fiche in fichesNouveau" :key="fiche.id" class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <!-- Header -->
          <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div class="flex items-center gap-3">
              <span class="font-black text-slate-800">{{ fiche.id }}</span>
              <span class="text-slate-500 text-sm">{{ fiche.referencePiece }} — {{ fiche.quantite }} pcs</span>
            </div>
            <div class="flex items-center gap-4">
              <span class="text-blue-600 font-semibold text-xs border border-blue-200 bg-blue-50 px-2 py-1 rounded">Nouveau</span>
              <button @click="emit('viewDetail', fiche)" class="text-sm font-medium text-slate-600 hover:text-blue-600 hover:underline">
                Voir la fiche
              </button>
            </div>
          </div>

          <!-- Body -->
          <div class="p-5 grid grid-cols-1 lg:grid-cols-2 gap-8" v-if="formState[fiche.id]">
            <!-- Left: Defect details -->
            <div class="flex flex-col gap-4">
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Défaut Déclaré</label>
                <textarea
                  rows="2"
                  :disabled="!isAllowed"
                  v-model="formState[fiche.id].descriptionDefaut"
                  placeholder="Décrire le défaut..."
                  class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                />
              </div>
              
              <div class="grid grid-cols-2 gap-4 items-end">
                <div class="flex flex-col gap-1">
                  <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate" title="Date de prise de décision">Date de prise de décision</label>
                  <input
                    type="date"
                    :disabled="!isAllowed"
                    v-model="formState[fiche.id].dateDecision"
                    class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  />
                </div>
                
                <div class="flex flex-col gap-1">
                  <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">Atelier de retouche</label>
                  <select
                    required
                    :disabled="!isAllowed"
                    v-model="formState[fiche.id].atelierSource"
                    class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="" disabled>Sélectionnez un atelier</option>
                    <option v-for="val in Object.values(AtelierSource)" :key="val" :value="val">{{ val }}</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Right: Decision -->
            <div class="flex flex-col">
              <h4 class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Décision Technique</h4>
              <div class="flex-1 flex flex-col gap-3">
                <select
                  :disabled="!isAllowed"
                  v-model="formState[fiche.id].decision"
                  @change="handleDecisionChange(fiche.id)"
                  class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                >
                  <option value="" disabled>-- Choisir une décision --</option>
                  <option value="Accepté par dérogation">Accepté par dérogation</option>
                  <option value="Rebut">Rebut</option>
                  <option value="Retouche">Retouche</option>
                  <option value="Déchromage">Déchromage</option>
                  <option value="Autre">Autre</option>
                </select>
                
                <input
                  v-if="formState[fiche.id].decision === 'Autre'"
                  type="text"
                  :disabled="!isAllowed"
                  v-model="formState[fiche.id].decisionAutre"
                  placeholder="Préciser la décision..."
                  class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white animate-fadeIn"
                />
                
                <button
                  :disabled="!isAllowed || !formState[fiche.id]?.decision"
                  @click="handleValidate(fiche)"
                  class="w-full mt-auto py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                  :class="(isAllowed && formState[fiche.id]?.decision) ? 'bg-slate-500 text-white hover:bg-slate-600' : 'bg-slate-200 text-slate-400 cursor-not-allowed'"
                >
                  <span>→ Valider la décision</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
