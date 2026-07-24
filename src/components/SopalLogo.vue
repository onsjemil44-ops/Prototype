<script setup lang="ts">
import { computed } from 'vue';

interface SopalLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  lightMode?: boolean;
}

const props = withDefaults(defineProps<SopalLogoProps>(), {
  className: '',
  size: 'md',
  lightMode: true
});

const dimensions = {
  sm: { width: 120, height: 40 },
  md: { width: 180, height: 60 },
  lg: { width: 240, height: 80 }
};

const height = computed(() => dimensions[props.size].height);
</script>

<template>
  <div id="sopal-logo-wrapper" :class="`flex items-center gap-3 ${props.className}`">
    <!-- SOPAL Graphic Icon -->
    <svg 
      :width="height * 0.8" 
      :height="height * 0.8" 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      class="shrink-0 drop-shadow-sm"
    >
      <defs>
        <mask id="sopal-cutout">
          <rect width="100" height="100" fill="white" />
          <path d="M 110,32 C 70,32 55,42 20,42" stroke="black" stroke-width="12" stroke-linecap="round" fill="none" />
          <path d="M -10,68 C 30,68 45,58 80,58" stroke="black" stroke-width="12" stroke-linecap="round" fill="none" />
        </mask>
      </defs>
      <circle cx="50" cy="50" r="46" :fill="props.lightMode ? '#003764' : 'white'" mask="url(#sopal-cutout)" />
    </svg>

    <!-- Corporate text brand -->
    <div class="flex flex-col justify-center select-none pt-0.5 ml-1">
      <span 
        :class="`font-black tracking-normal leading-none ${
          props.lightMode ? 'text-[#003764]' : 'text-white'
        }`" 
        :style="{ fontSize: height * 0.6 + 'px', fontFamily: '\'Inter\', sans-serif' }"
      >
        SOPAL
      </span>
    </div>
  </div>
</template>
