<script setup lang="ts">
import { ref, computed } from 'vue';
import { Search, Filter, Wrench, Boxes, Calendar, FileText, CheckCircle2, ChevronRight, HelpCircle, ArrowUpDown } from 'lucide-vue-next';
import { AtelierSource, FicheNonConformite, FicheStatus, ERPRole, DestinationType } from '../types';

interface FicheListProps {
  fiches: FicheNonConformite[];
  activeRole: ERPRole;
}

const props = defineProps<FicheListProps>();
const emit = defineEmits<{
  (e: 'selectFiche', fiche: FicheNonConformite): void;
  (e: 'treatRetouche', fiche: FicheNonConformite): void;
  (e: 'moveStockX3', fiche: FicheNonConformite): void;
}>();

const searchTerm = ref('');
const statusFilter = ref<string>('all');
const atelierFilter = ref<string>('all');
const sortByDate = ref<'desc' | 'asc'>('desc');

// Filter & Sort Logic
const filteredFiches = computed(() => {
  return props.fiches.filter((f) => {
    const matchesSearch = f.id.toLowerCase().includes(searchTerm.value.toLowerCase()) || 
                          f.referencePiece.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
                          (f.of && f.of.toLowerCase().includes(searchTerm.value.toLowerCase())) ||
                          f.descriptionDefaut.toLowerCase().includes(searchTerm.value.toLowerCase());
    const matchesStatus = statusFilter.value === 'all' || f.statut === statusFilter.value;
    const matchesAtelier = atelierFilter.value === 'all' || f.atelierSource === atelierFilter.value;
    
    return matchesSearch && matchesStatus && matchesAtelier;
  }).sort((a, b) => {
    const dateA = new Date(a.dateCreation).getTime();
    const dateB = new Date(b.dateCreation).getTime();
    return sortByDate.value === 'desc' ? dateB - dateA : dateA - dateB;
  });
});

function getStatusStyle(status: FicheStatus) {
  switch (status) {
    case FicheStatus.NOUVEAU:
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case FicheStatus.EN_COURS:
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case FicheStatus.RETOUCHE:
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case FicheStatus.CLOTURE:
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
}

function toggleSort() {
  sortByDate.value = sortByDate.value === 'desc' ? 'asc' : 'desc';
}
</script>

<template>
  <div id="fiche-list-section" class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
    <!-- Search & Filters Bar -->
    <div class="p-5 border-b border-slate-100 bg-slate-50/50 space-y-3.5">
      <div class="flex flex-col md:flex-row gap-3">
        <!-- Search bar -->
        <div class="relative flex-1">
          <Search class="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par référence, n° de fiche, défaut..."
            v-model="searchTerm"
            class="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <!-- Status filter -->
        <div class="flex items-center gap-2">
          <Filter class="w-4 h-4 text-slate-500 shrink-0" />
          <select
            v-model="statusFilter"
            class="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">Tous les statuts</option>
            <option v-for="stat in Object.values(FicheStatus)" :key="stat" :value="stat">{{ stat }}</option>
          </select>
        </div>

        <!-- Atelier source filter -->
        <div class="flex items-center gap-2">
          <select
            v-model="atelierFilter"
            class="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">Tous les ateliers sources</option>
            <option v-for="atel in Object.values(AtelierSource)" :key="atel" :value="atel">{{ atel }}</option>
          </select>
        </div>

        <!-- Date sort toggle -->
        <button
          type="button"
          @click="toggleSort"
          class="px-3 py-1.5 border border-slate-200 hover:bg-slate-100 active:bg-slate-200 rounded-lg text-xs flex items-center gap-1 text-slate-600 transition-colors font-semibold cursor-pointer shrink-0"
        >
          <ArrowUpDown class="w-3.5 h-3.5" />
          Date : {{ sortByDate === 'desc' ? 'Plus récents' : 'Plus anciens' }}
        </button>
      </div>

      <!-- Quick Info / Help tip -->
      <div class="text-[11px] text-slate-500 leading-relaxed flex items-center gap-1.5 bg-blue-50/50 border border-blue-100 p-2.5 rounded-lg">
        <HelpCircle class="w-3.5 h-3.5 text-blue-600 shrink-0" />
        <span>
          En cliquant sur une fiche ci-dessous, vous accédez à son dossier complet : consultation de l'historique physique de transfert, saisie de la décision process, déclaration de fin de retouche et réintégration dans Sage X3.
        </span>
      </div>
    </div>

    <!-- Grid / Table of Fiches -->
    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs border-collapse">
        <thead class="bg-slate-50 border-b border-slate-200 font-bold uppercase text-slate-500 tracking-wider">
          <tr>
            <th class="p-4 pl-6 text-[10px]">Réf. Fiche / Date</th>
            <th class="p-4 text-[10px]">Article & OF</th>
            <th class="p-4 text-[10px]">Atelier de retouche</th>
            <th class="p-4 text-[10px] text-center">Quantité</th>
            <th class="p-4 text-[10px]">Défaut Qualité</th>
            <th class="p-4 text-[10px]">Statut</th>
            <th class="p-4 pr-6 text-right text-[10px]">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-if="filteredFiches.length === 0">
            <td colspan="7" class="p-8 text-center text-slate-400 italic">
              Aucune fiche de non-conformité ne correspond aux critères de filtre.
            </td>
          </tr>
          <tr
            v-for="fiche in filteredFiches"
            :key="fiche.id"
            class="hover:bg-slate-50/60 transition-all cursor-pointer group"
            @click="emit('selectFiche', fiche)"
          >
            <!-- Fiche ID and Date -->
            <td class="p-4 pl-6">
              <div class="font-bold text-slate-900 group-hover:text-blue-700 transition-colors font-mono tracking-wide">
                {{ fiche.id }}
              </div>
              <div class="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                <Calendar class="w-3 h-3" /> {{ fiche.dateCreation }}
              </div>
            </td>

            <!-- Article & OF -->
            <td class="p-4">
              <div class="font-extrabold text-slate-800 font-mono text-[11.5px] uppercase">
                {{ fiche.referencePiece }}
              </div>
              <div class="text-[10px] text-slate-400 font-mono mt-0.5">
                OF : <strong class="text-blue-900 bg-blue-50/60 px-1 rounded uppercase">{{ fiche.of || 'N/A' }}</strong>
              </div>
            </td>

            <!-- Atelier Source -->
            <td class="p-4">
              <span v-if="fiche.statut !== FicheStatus.NOUVEAU" class="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full text-[10px] uppercase font-mono">
                {{ fiche.atelierSource }}
              </span>
            </td>

            <!-- Quantité -->
            <td class="p-4 text-center">
              <span class="font-black text-slate-900 text-[13px] bg-slate-50 border border-slate-150 px-2 py-1 rounded">
                {{ fiche.quantite }}
              </span>
              <span class="text-[9px] text-slate-400 block mt-1">pièces</span>
            </td>

            <!-- Defect description -->
            <td class="p-4 max-w-xs">
              <div class="font-medium text-slate-700 line-clamp-1">
                {{ fiche.descriptionDefaut }}
              </div>
              <div class="text-[10px] text-slate-400 italic mt-0.5 line-clamp-1">
                Zone : {{ fiche.emplacementDefaut }} — {{ fiche.symptomeDetecte }}
              </div>
            </td>

            <!-- Status badge -->
            <td class="p-4">
              <span class="inline-block px-2.5 py-1 text-[10px] font-bold rounded-full border" :class="getStatusStyle(fiche.statut)">
                ● {{ (fiche.statut === FicheStatus.RETOUCHE && fiche.destination === DestinationType.ERREUR_CODE) ? 'Corrigé (Attente X3)' : fiche.statut }}
              </span>
            </td>

            <!-- Actions button group -->
            <td class="p-4 pr-6 text-right" @click.stop>
              <div class="flex gap-1.5 justify-end">
                <!-- Action triggers based on status and role -->
                <button
                  v-if="fiche.statut === FicheStatus.RETOUCHE && (props.activeRole === ERPRole.MAGASINIER || props.activeRole === ERPRole.ADMINISTRATEUR)"
                  type="button"
                  @click="emit('moveStockX3', fiche)"
                  class="px-2.5 py-1.5 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1 shadow-sm transition-colors cursor-pointer shrink-0 animate-pulse"
                >
                  <Boxes class="w-3.5 h-3.5" /> Saisir X3
                </button>

                <button
                  type="button"
                  @click="emit('selectFiche', fiche)"
                  class="px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                >
                  Consulter <ChevronRight class="w-3.5 h-3.5" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Bottom counter panel -->
    <div class="p-4 bg-slate-50 border-t border-slate-100 text-[10.5px] font-mono text-slate-500 text-center uppercase tracking-wider">
      Affichage de {{ filteredFiches.length }} dossiers qualité sur un total de {{ props.fiches.length }} dans l'Intranet
    </div>
  </div>
</template>
