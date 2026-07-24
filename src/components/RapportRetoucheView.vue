<script setup lang="ts">
import { ref, computed } from 'vue';
import { FicheNonConformite, FicheStatus, ERPRole } from '../types';

const props = defineProps<{
  fiches: FicheNonConformite[];
  activeRole: ERPRole;
}>();

const emit = defineEmits<{
  (e: 'saveRetoucheDetails', payload: { 
    id: string; 
    realized: 'Oui' | 'Non'; 
    date: string; 
    repartition: { ad: number; rb: number; re: number; rp: number }; 
    comment: string;
  }): void;
}>();

// Filter fiches needing retouche report (EN_COURS)
const fichesEnCours = computed(() => {
  return props.fiches.filter(f => f.statut === FicheStatus.EN_COURS);
});

const isAllowed = computed(() => {
  return props.activeRole === ERPRole.RESP_RETOUCHE || props.activeRole === ERPRole.ADMINISTRATEUR;
});

// State for each fiche
const formData = ref<Record<string, {
  comment: string;
  qtyAD: number;
  qtyRB: number;
  qtyRE: number;
  qtyRP: number;
}>>({});

import { onMounted, watch } from 'vue';

function initFormState() {
  fichesEnCours.value.forEach(fiche => {
    if (!formData.value[fiche.id]) {
      formData.value[fiche.id] = {
        comment: '',
        qtyAD: 0,
        qtyRB: 0,
        qtyRE: fiche.quantite,
        qtyRP: 0
      };
    }
  });
}

onMounted(() => {
  initFormState();
});

watch(fichesEnCours, () => {
  initFormState();
});

function handleValidate(fiche: FicheNonConformite) {
  const data = formData.value[fiche.id];
  if (!data) return;
  
  const sum = data.qtyAD + data.qtyRB + data.qtyRE + data.qtyRP;
  if (sum !== fiche.quantite) {
    alert(`Le total saisi (${sum}) ne correspond pas à la quantité totale (${fiche.quantite}).`);
    return;
  }
  
  emit('saveRetoucheDetails', {
    id: fiche.id,
    realized: 'Oui',
    date: new Date().toISOString().split('T')[0],
    repartition: {
      ad: data.qtyAD,
      rb: data.qtyRB,
      re: data.qtyRE,
      rp: data.qtyRP
    },
    comment: data.comment
  });
}

function getTotalSaisi(id: string) {
  const d = formData.value[id];
  return d ? (d.qtyAD + d.qtyRB + d.qtyRE + d.qtyRP) : 0;
}
</script>

<template>
  <div class="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
    <div class="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
      <div>
        <h2 class="text-lg font-black text-slate-800 tracking-tight">Rapports de Retouche — Atelier</h2>
      </div>
      <div v-if="!isAllowed" class="bg-red-50 text-red-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-red-200">
        Accès en lecture seule
      </div>
    </div>

    <div class="p-6 overflow-y-auto flex-1 bg-slate-50/50">
      <div v-if="fichesEnCours.length === 0" class="text-center py-12 text-slate-500">
        Aucune fiche en attente de retouche.
      </div>

      <div class="space-y-6">
        <div v-for="fiche in fichesEnCours" :key="fiche.id" class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          
          <!-- Header -->
          <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="font-black text-slate-800">{{ fiche.id }}</span>
              <span class="text-slate-500 text-sm">{{ fiche.referencePiece }} — {{ fiche.quantite }} pièces</span>
            </div>
            <div>
              <span class="text-amber-700 font-semibold text-xs border border-amber-200 bg-amber-50 px-3 py-1.5 rounded-lg">Retouche acceptée</span>
            </div>
          </div>

          <!-- Body -->
          <div class="p-5 space-y-6" v-if="formData[fiche.id]">
            <!-- Defect description -->
            <div class="bg-slate-50 border border-slate-100 p-4 rounded-lg text-sm text-slate-600">
              {{ fiche.descriptionDefaut }}
            </div>

            <!-- Rapport d'intervention -->
            <div>
              <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Rapport d'intervention</label>
              <textarea
                :disabled="!isAllowed"
                v-model="formData[fiche.id].comment"
                placeholder="Décrire les opérations réalisées, difficultés rencontrées, résultats obtenus..."
                class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-none bg-white min-h-[80px]"
              ></textarea>
            </div>

            <!-- Répartition du lot -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Répartition du lot — {{ fiche.quantite }} pièces</label>
                <button type="button" class="text-[10px] font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1">
                  + Sous-lot
                </button>
              </div>

              <div class="space-y-3">
                <!-- AD -->
                <div class="flex items-center gap-3">
                  <div class="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 flex justify-between items-center">
                    <span>AD — Accepté par Dérogation</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    :disabled="!isAllowed"
                    v-model.number="formData[fiche.id].qtyAD"
                    class="w-20 px-3 py-2 border border-slate-300 rounded-lg text-center text-sm font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                  <span class="text-sm text-slate-400 w-16">pièce(s)</span>
                  <button type="button" class="text-slate-300 hover:text-slate-500">×</button>
                </div>
                
                <!-- RE -->
                <div class="flex items-center gap-3">
                  <div class="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 flex justify-between items-center">
                    <span>RE — Retournée au fournisseur</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    :disabled="!isAllowed"
                    v-model.number="formData[fiche.id].qtyRE"
                    class="w-20 px-3 py-2 border border-slate-300 rounded-lg text-center text-sm font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                  <span class="text-sm text-slate-400 w-16">pièce(s)</span>
                  <button type="button" class="text-slate-300 hover:text-slate-500">×</button>
                </div>
                
                <!-- RB -->
                <div class="flex items-center gap-3">
                  <div class="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 flex justify-between items-center">
                    <span>RB — Rebut</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    :disabled="!isAllowed"
                    v-model.number="formData[fiche.id].qtyRB"
                    class="w-20 px-3 py-2 border border-slate-300 rounded-lg text-center text-sm font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                  <span class="text-sm text-slate-400 w-16">pièce(s)</span>
                  <button type="button" class="text-slate-300 hover:text-slate-500">×</button>
                </div>

                <!-- RP -->
                <div class="flex items-center gap-3">
                  <div class="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 flex justify-between items-center">
                    <span>RP — Reprise / Retouche partielle</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    :disabled="!isAllowed"
                    v-model.number="formData[fiche.id].qtyRP"
                    class="w-20 px-3 py-2 border border-slate-300 rounded-lg text-center text-sm font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                  <span class="text-sm text-slate-400 w-16">pièce(s)</span>
                  <button type="button" class="text-slate-300 hover:text-slate-500">×</button>
                </div>
              </div>

              <!-- Footer with total and submit -->
              <div class="mt-6 flex items-center justify-between">
                <div class="text-sm">
                  Total saisi : 
                  <span class="font-bold" :class="getTotalSaisi(fiche.id) === fiche.quantite ? 'text-emerald-600' : 'text-red-500'">
                    {{ getTotalSaisi(fiche.id) }} / {{ fiche.quantite }}
                  </span>
                </div>
                
                <button
                  :disabled="!isAllowed || getTotalSaisi(fiche.id) !== fiche.quantite"
                  @click="handleValidate(fiche)"
                  class="px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
                  :class="(isAllowed && getTotalSaisi(fiche.id) === fiche.quantite) ? 'bg-amber-300 text-amber-900 hover:bg-amber-400' : 'bg-slate-200 text-slate-400 cursor-not-allowed'"
                >
                  <span v-if="isAllowed && getTotalSaisi(fiche.id) === fiche.quantite">✓ Clôturer l'intervention</span>
                  <span v-else>Clôturer l'intervention</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
