<script setup>
import { Check, Trash2 } from 'lucide-vue-next'

const props = defineProps(['task'])
const emit = defineEmits(['cycle', 'delete'])

const priorityColors = {
  p1: { bg: 'bg-p1-light', text: 'text-p1-text', border: 'border-p1-border' },
  p2: { bg: 'bg-p2-light', text: 'text-p2-text', border: 'border-p2-border' },
  p3: { bg: 'bg-p3-light', text: 'text-p3-text', border: 'border-p3-border' },
  p4: { bg: 'bg-p4-light', text: 'text-p4-text', border: 'border-p4-border' },
}
</script>

<template>
  <div @click="emit('cycle', task)" class="flex items-center gap-3 p-3 rounded-xl border transition-all group cursor-pointer" :class="[task.completed ? 'bg-warmgray/40 border-transparent opacity-60' : priorityColors[task.priority].bg + ' ' + priorityColors[task.priority].border]">
    <button @click.stop="task.completed = !task.completed" class="w-5 h-5 rounded flex items-center justify-center border shrink-0 bg-white" :class="task.completed ? 'bg-matcha border-matcha text-white' : 'border-graphite/30'">
      <Check v-if="task.completed" class="w-3.5 h-3.5" />
    </button>
    <div class="flex-1" @click.stop>
      <input v-if="task.isEditing" v-model="task.title" @blur="task.isEditing = false" @keyup.enter="task.isEditing = false" class="w-full bg-white/50 px-1 border-b border-graphite/30 outline-none text-sm text-graphite">
      <span v-else @dblclick="task.isEditing = true" class="text-sm font-medium cursor-text block w-full py-0.5" :class="task.completed ? 'line-through text-graphite/50' : priorityColors[task.priority].text">
        {{ task.title }}
      </span>
    </div>
    <button @click.stop="emit('delete', task.id)" class="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity p-1 shrink-0">
      <Trash2 class="w-4 h-4" />
    </button>
  </div>
</template>