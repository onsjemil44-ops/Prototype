<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { FicheNonConformite, ERPRole, DestinationType, SimulatedEmail, X3Notification } from '../types';
import { CheckCircle2, Calendar, Mail, History, ArrowRight, ClipboardCheck } from 'lucide-vue-next';

const props = defineProps<{
  fiches: FicheNonConformite[];
  activeRole: ERPRole;
  emails: SimulatedEmail[];
  x3Notifications: X3Notification[];
}>();

const emit = defineEmits<{
  (e: 'saveCorrection', payload: { id: string; date: string }): void;
  (e: 'coordinateurVerif', payload: { id: string; choix: 'corrige' | 'non_corrige' }): void;
}>();

const fichesErreurCode = computed(() => {
  return props.fiches.filter(
    f => f.destination === DestinationType.ERREUR_CODE && !f.erreurCodeCorrigee
  );
});

const historiqueFiches = computed(() => {
  return props.fiches.filter(
    f => f.destination === DestinationType.ERREUR_CODE
  );
});

const formState = ref<Record<string, { date: string; verified: boolean }>>({});
const coordinateurState = ref<Record<string, { choix: 'corrige' | 'non_corrige' | null }>>({});

function initFormState() {
  fichesErreurCode.value.forEach(fiche => {
    if (!formState.value[fiche.id]) {
      formState.value[fiche.id] = {
        date: new Date().toISOString().split('T')[0],
        verified: false
      };
    }
    if (!coordinateurState.value[fiche.id]) {
      coordinateurState.value[fiche.id] = { choix: null };
    }
  });
}

onMounted(() => {
  initFormState();
});

watch(fichesErreurCode, () => {
  initFormState();
});

function handleValidate(fiche: FicheNonConformite) {
  const data = formState.value[fiche.id];
  if (!data || !data.date) return;
  
  emit('saveCorrection', {
    id: fiche.id,
    date: data.date
  });
}

function handleCoordinateurSubmit(fiche: FicheNonConformite) {
  const choix = coordinateurState.value[fiche.id]?.choix;
  if (!choix) return;
  emit('coordinateurVerif', { id: fiche.id, choix });
}

const isRespLogistique = computed(() => {
  return props.activeRole === ERPRole.RESP_LOGISTIQUE || props.activeRole === ERPRole.ADMINISTRATEUR;
});

const isCoordinateur = computed(() => {
  return props.activeRole === ERPRole.COORDINATEUR_PLANIFICATION || props.activeRole === ERPRole.ADMINISTRATEUR;
});

const isAllowed = computed(() => {
  return isRespLogistique.value || isCoordinateur.value;
});
</script>

<template>
  <div class="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
    <div class="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
      <div>
        <h2 class="text-lg font-black text-slate-800 tracking-tight">Correction Erreur Code</h2>
      </div>
      <div v-if="!isAllowed" class="bg-red-50 text-red-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-red-200">
        Accès en lecture seule
      </div>
    </div>

    <div class="p-6 overflow-y-auto flex-1 bg-slate-50/50">
      <template v-if="isAllowed">
        <div v-if="fichesErreurCode.length === 0" class="text-center py-12 text-slate-500">
          Aucune erreur de code en attente de correction.
        </div>

        <div v-else class="space-y-6">
        <div v-for="fiche in fichesErreurCode" :key="fiche.id" class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <!-- Header -->
          <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div class="flex items-center gap-3">
              <span class="font-black text-slate-800">{{ fiche.id }}</span>
              <span class="text-slate-500 text-sm">{{ fiche.referencePiece }} — {{ fiche.quantite }} pcs</span>
            </div>
            <div class="flex items-center gap-4">
              <span class="text-red-600 font-semibold text-xs border border-red-200 bg-red-50 px-2 py-1 rounded">Erreur Code</span>
            </div>
          </div>

          <!-- Body -->
          <div class="p-5 flex flex-col md:flex-row gap-8 justify-between">
            <div class="flex flex-col gap-2 flex-1">
              <div class="text-sm text-slate-600">
                <strong>Défaut déclaré :</strong> Erreur Code
              </div>
              <div class="text-sm text-slate-600">
                <strong>Code correct :</strong> {{ fiche.symptomeDetecte }}
              </div>
              
              <!-- Zone Coordinateur Planification -->
              <div v-if="isCoordinateur && coordinateurState[fiche.id]" class="mt-4 p-4 border border-blue-200 bg-blue-50/50 rounded-xl">
                <h4 class="text-xs font-bold text-blue-800 uppercase tracking-wider flex items-center gap-2 mb-3">
                  <ClipboardCheck class="w-4 h-4" />
                  Vérification Coordinateur
                </h4>
                
                <div v-if="!fiche.coordinateurVerifie" class="space-y-3">
                  <label class="flex items-center gap-2 text-sm text-slate-700 cursor-pointer p-2 hover:bg-blue-100/50 rounded transition-colors">
                    <input type="radio" v-model="coordinateurState[fiche.id].choix" value="corrige" class="text-blue-600 focus:ring-blue-500" />
                    <span>Le mouvement de l'OF est vérifié et le code est corrigé</span>
                  </label>
                  <label class="flex items-center gap-2 text-sm text-slate-700 cursor-pointer p-2 hover:bg-blue-100/50 rounded transition-colors">
                    <input type="radio" v-model="coordinateurState[fiche.id].choix" value="non_corrige" class="text-blue-600 focus:ring-blue-500" />
                    <span>Le mouvement de l'OF est vérifié et le code n'est pas corrigé</span>
                  </label>
                  
                  <button
                    :disabled="!coordinateurState[fiche.id].choix"
                    @click="handleCoordinateurSubmit(fiche)"
                    class="mt-3 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg shadow hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Envoyer au Responsable Logistique
                  </button>
                </div>
                <div v-else class="text-sm font-semibold text-emerald-700 flex items-center gap-2">
                  <CheckCircle2 class="w-4 h-4" />
                  Vérification transmise ({{ fiche.coordinateurChoix === 'corrige' ? 'Corrigé' : 'Non corrigé' }})
                </div>
              </div>
            </div>

            <!-- Right: Decision Responsable Logistique -->
            <div class="flex flex-col w-full md:w-64 gap-4" v-if="isRespLogistique && formState[fiche.id]">
              <div v-if="!fiche.coordinateurVerifie" class="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded-lg flex gap-2">
                <span class="w-2 h-2 rounded-full bg-amber-500 mt-1 shrink-0 animate-pulse" />
                En attente de la vérification par le Coordinateur de Planification avant validation.
              </div>
              
              <div class="flex flex-col gap-1" :class="{ 'opacity-50 pointer-events-none': !fiche.coordinateurVerifie }">
                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Date de correction</label>
                <input
                  type="date"
                  :disabled="!isRespLogistique || !fiche.coordinateurVerifie"
                  v-model="formState[fiche.id].date"
                  class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white mb-2"
                />
                
                <label class="flex items-start gap-2 text-[11px] text-slate-600 cursor-pointer bg-slate-50 p-2 rounded border border-slate-100">
                  <input type="checkbox" v-model="formState[fiche.id].verified" :disabled="!isRespLogistique || !fiche.coordinateurVerifie" class="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500" />
                  <span>Validation de la correction</span>
                </label>
              </div>
              
              <button
                :disabled="!isRespLogistique || !formState[fiche.id].verified || !fiche.coordinateurVerifie"
                @click="handleValidate(fiche)"
                class="w-full py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                :class="(isRespLogistique && formState[fiche.id].verified && fiche.coordinateurVerifie) ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'"
              >
                <CheckCircle2 class="w-4 h-4" />
                <span>Marquer comme corrigé</span>
              </button>
            </div>
          </div>
        </div>
        </div>
      </template>

      <!-- Historical records and Emails -->
      <div class="space-y-8" :class="isAllowed ? 'mt-12' : 'mt-0'">
        <!-- Historique des mouvements Erreur Code -->
        <div class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div class="px-5 py-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
            <History class="w-5 h-5 text-slate-500" />
            <h3 class="font-black text-slate-800">Historique des corrections "Erreur Code"</h3>
          </div>
          <div class="p-0">
            <div v-if="historiqueFiches.length === 0" class="text-center py-8 text-slate-500 text-sm">
              Aucun historique trouvé.
            </div>
            <ul v-else class="divide-y divide-slate-100">
              <li v-for="fiche in historiqueFiches" :key="fiche.id" class="px-5 py-3 flex justify-between items-center hover:bg-slate-50/50">
                <div class="flex flex-col">
                  <span class="text-sm font-bold text-slate-800">{{ fiche.id }} — {{ fiche.referencePiece }}</span>
                  <span class="text-xs text-slate-500">Défaut: Erreur Code | Code correct: {{ fiche.symptomeDetecte }}</span>
                </div>
                <div class="flex flex-col items-end">
                  <span v-if="fiche.erreurCodeCorrigee" class="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Corrigé</span>
                  <span v-else class="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">En attente</span>
                  <span v-if="fiche.dateCorrectionErreurCode" class="text-[10px] text-slate-400 mt-1 flex items-center gap-1"><Calendar class="w-3 h-3" /> {{ fiche.dateCorrectionErreurCode }}</span>
                  <span v-else class="text-[10px] text-slate-400 mt-1 flex items-center gap-1"><Calendar class="w-3 h-3" /> {{ fiche.dateCreation.split('-').reverse().join('/') }}</span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
