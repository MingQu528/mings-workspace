<script setup>
// 引入全新的 CheckCircle 绿色圆圈完成图标
import { Trash2, CheckCircle } from 'lucide-vue-next'

const props = defineProps(['task'])
const emit = defineEmits(['cycle', 'delete'])

const priorityColors = {
  p1: { bg: 'bg-p1-light', text: 'text-p1-text', border: 'border-p1-border' },
  p2: { bg: 'bg-p2-light', text: 'text-p2-text', border: 'border-p2-border' },
  p3: { bg: 'bg-p3-light', text: 'text-p3-text', border: 'border-p3-border' },
  p4: { bg: 'bg-p4-light', text: 'text-p4-text', border: 'border-p4-border' },
}

// 🪄 [核心魔法] 自定义 Vue 指令：自动聚焦、自动全选、并自动撑开多行高度
const vFocusSelect = {
  mounted: (el) => {
    el.focus()
    // 如果是系统默认的占位文字，立刻全选它，用户一打字就会直接覆盖
    if (el.value === '新任务' || el.value === '新计划') {
      el.select()
    }
    // 渲染时立刻计算一次文本高度，防止长文本初始显示不全
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }
}
</script>

<template>
  <!-- 外层容器：改为 items-start 保证多行文本时，勾选框始终在第一行对齐 -->
  <div @click="emit('cycle', task)" class="flex items-start gap-3 p-3 rounded-xl border transition-all group cursor-pointer" :class="[task.completed ? 'bg-warmgray/40 border-transparent opacity-60' : priorityColors[task.priority].bg + ' ' + priorityColors[task.priority].border]">
    
    <!-- 升级版勾选框 -->
    <button @click.stop="task.completed = !task.completed" class="shrink-0 flex items-center justify-center transition-all mt-0.5" title="标记完成">
      <!-- 勾选后：图4同款绿色圆圈对勾 -->
      <CheckCircle v-if="task.completed" class="w-[18px] h-[18px] text-matcha" />
      <!-- 未勾选：瘦身后的精致小方框 -->
      <div v-else class="w-4 h-4 rounded-[4px] border border-graphite/30 bg-white hover:border-matcha/50 transition-colors"></div>
    </button>

    <div class="flex-1 min-w-0" @click.stop>
      <!-- 编辑模式：升级为支持自动换行的 textarea -->
      <textarea
        v-if="task.isEditing"
        v-model="task.title"
        v-focus-select
        @blur="task.isEditing = false"
        @keydown.enter.prevent="task.isEditing = false"
        @input="(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }"
        rows="1"
        class="w-full bg-white/50 px-1 border-b border-graphite/30 outline-none text-sm text-graphite resize-none overflow-hidden block"
        style="min-height: 24px; padding-top: 2px;"
      ></textarea>
      
      <!-- 展示模式：增加 break-words whitespace-pre-wrap 确保长句子能优雅换行 -->
      <span 
        v-else 
        @dblclick="task.isEditing = true" 
        class="text-sm font-medium cursor-text block w-full py-0.5 break-words whitespace-pre-wrap leading-relaxed" 
        :class="task.completed ? 'line-through text-graphite/50' : priorityColors[task.priority].text"
      >
        {{ task.title }}
      </span>
    </div>
    
    <!-- 删除按钮：微调位置对齐第一行 -->
    <button @click.stop="emit('delete', task.id)" class="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity p-1 shrink-0 mt-[-2px]">
      <Trash2 class="w-4 h-4" />
    </button>
  </div>
</template>