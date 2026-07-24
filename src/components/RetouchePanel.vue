<script setup lang="ts">
import { ref, computed } from 'vue';
import { Wrench, CheckCircle2, User, Clock, AlertCircle, RefreshCw } from 'lucide-vue-next';
import { FicheNonConformite, ERPRole } from '../types';

interface RetouchePanelProps {
  fiche: FicheNonConformite;
  activeRole: ERPRole;
}

const props = defineProps<RetouchePanelProps>();
const emit = defineEmits<{
  (e: 'treatRetouche', fiche: FicheNonConformite): void;
  (e: 'back'): void;
}>();

const isSubmitting = ref(false);

const hasPermission = computed(() => {
  return props.activeRole === ERPRole.RESP_RETOUCHE || props.activeRole === ERPRole.OPERATEUR || props.activeRole === ERPRole.RESP_LOGISTIQUE;
});

function handleTreat() {
  isSubmitting.value = true;
  setTimeout(() => {
    emit('treatRetouche', props.fiche);
    isSubmitting.value = false;
  }, 1000);
}
</script>

<template>
  <div id="atelier-retouche-panel" class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
    <!-- Header banner -->
    <div class="bg-gradient-to-r from-purple-700 to-purple-600 px-6 py-4 flex items-center justify-between text-white">
      <div class="flex items-center gap-2.5">
        <div class="bg-white/10 p-2 rounded-xl">
          <Wrench class="w-5 h-5 text-purple-200" />
        </div>
        <div>
          <h2 class="text-sm font-extrabold uppercase tracking-wider">Atelier de Retouche SOPAL</h2>
          <p class="text-[10px] text-purple-100 font-mono">Banc d'Intervention : BANC-RET-01</p>
        </div>
      </div>
      <button 
        type="button"
        @click="emit('back')"
        class="text-xs text-purple-100 hover:text-white hover:underline cursor-pointer"
      >
        Retour à l'intranet
      </button>
    </div>

    <!-- Content body -->
    <div class="p-6 space-y-5 text-xs text-slate-700">
      <div class="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Détails de la Non-Conformité</span>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <span class="text-slate-400 font-mono block">Identifiant :</span>
            <span class="font-bold text-slate-800 font-mono">{{ props.fiche.id }}</span>
          </div>
          <div>
            <span class="text-slate-400 font-mono block">Code Article :</span>
            <span class="font-bold text-slate-800 font-mono uppercase">{{ props.fiche.referencePiece }}</span>
          </div>
          <div>
            <span class="text-slate-400 font-mono block">Quantité :</span>
            <span class="font-bold text-slate-800">{{ props.fiche.quantite }} pièces</span>
          </div>
          <div>
            <span class="text-slate-400 font-mono block">Symptôme constaté :</span>
            <span class="font-medium text-slate-600 italic">"{{ props.fiche.symptomeDetecte }}"</span>
          </div>
        </div>
      </div>

      <div v-if="hasPermission" class="bg-purple-50 border border-purple-100 text-purple-800 p-3 rounded-lg leading-relaxed flex gap-2">
        <Clock class="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          <span class="font-bold">Rôle habilité détecté :</span> Vous simulez le poste de <strong>{{ props.activeRole }}</strong>. Vous pouvez démarrer la réparation physique des pièces de ce lot de non-conformité.
        </div>
      </div>
      <div v-else class="bg-red-50 border border-red-100 text-red-800 p-3 rounded-lg leading-relaxed flex gap-2">
        <AlertCircle class="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          <span class="font-bold">Contrôle d'accès :</span> Seul le <strong>Responsable Retouche</strong> ou un administrateur peut valider formellement la fin des réparations sur le banc d'atelier.
        </div>
      </div>

      <div class="pt-4 border-t border-slate-100 flex items-center justify-between">
        <span class="text-[10px] text-slate-400">SMTP mail triggers after saving retouche</span>
        <button
          type="button"
          :disabled="!hasPermission || isSubmitting"
          @click="handleTreat"
          class="px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md transition-all"
          :class="hasPermission && !isSubmitting
            ? 'bg-purple-600 hover:bg-purple-700 text-white cursor-pointer'
            : 'bg-slate-100 text-slate-400 cursor-not-allowed'"
        >
          <template v-if="isSubmitting">
            <RefreshCw class="w-4 h-4 animate-spin" /> Traitement...
          </template>
          <template v-else>
            <CheckCircle2 class="w-4 h-4" /> Démarrer la Retouche & Passer à la Saisie de Fin
          </template>
        </button>
      </div>
    </div>
  </div>
</template>
