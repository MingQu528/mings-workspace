<template>
  <div class="min-h-screen bg-[#f7f8fa] py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-4xl mx-auto space-y-6">
      
      <!-- 头部时间与状态 -->
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold text-gray-400 uppercase">{{ currentDateText }}</p>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1">工作计划与日程</h1>
        </div>
        <div class="flex items-center space-x-2 px-3.5 py-1.5 bg-white rounded-full border text-xs text-gray-600">
          <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>云端已同步</span>
        </div>
      </div>

      <!-- 导航标签 -->
      <div class="flex items-center space-x-2 bg-gray-200/60 p-1.5 rounded-2xl w-fit">
        <button 
          v-for="tab in ['生活', '工作', '学习', '运动']" 
          :key="tab"
          @click="activeTab = tab"
          class="px-6 py-2.5 text-sm font-bold rounded-xl transition-all"
          :class="[activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500']"
        >
          {{ tab }}
        </button>
      </div>

      <!-- 工作板块内容 -->
      <div v-if="activeTab === '工作'" class="space-y-6">
        
        <!-- 🗓️ 模块一：苹果式周日程表 -->
        <div class="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 overflow-hidden">
            <h3 class="font-bold text-lg text-gray-900 mb-6 flex items-center gap-2">
                📅 本周关键日程
            </h3>
            <div class="overflow-x-auto pb-2">
                <div class="grid grid-cols-7 gap-3 min-w-[700px]">
                    <div v-for="day in currentWeek" :key="day.fullDate" class="flex flex-col border rounded-2xl overflow-hidden transition-all" :class="day.isToday ? 'border-emerald-500/50 bg-emerald-50 ring-1 ring-emerald-500/20' : 'border-gray-200 bg-gray-50/50'">
                        <div class="text-center py-2.5 border-b" :class="day.isToday ? 'bg-emerald-500 text-white border-emerald-500/50' : 'bg-gray-100 text-gray-500 border-gray-200'">
                            <div class="text-[11px] font-bold tracking-widest">{{ day.dayName }}</div>
                            <div class="text-lg font-black mt-0.5">{{ day.dateStr }}</div>
                        </div>
                        <div class="p-2 flex-1 min-h-[120px] space-y-2 relative group">
                            <div v-for="item in getAgendaForDate(day.fullDate)" :key="item.id" class="relative bg-white border border-gray-200 rounded-xl p-2.5 shadow-sm hover:border-emerald-500 transition-colors">
                                <button @click="deleteAgendaItem(item.id)" class="absolute -top-1.5 -right-1.5 bg-white border border-gray-200 text-red-400 rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 hover:text-red-600 shadow-sm z-10">✕</button>
                                <input v-if="item.isEditing" v-model="item.time" @keyup.enter="item.isEditing = false" class="w-full text-emerald-600 text-xs font-bold outline-none bg-transparent border-b border-emerald-500/30 pb-1 mb-1" placeholder="时间(如14:00)">
                                <div v-else @dblclick="item.isEditing = true" class="text-emerald-600 text-xs font-bold mb-1 cursor-pointer" title="双击修改时间">{{ item.time || '全天' }}</div>
                                <textarea v-if="item.isEditing" v-model="item.title" @blur="item.isEditing = false" class="w-full text-gray-700 text-xs outline-none bg-transparent resize-none leading-relaxed" placeholder="如:和森下开会..."></textarea>
                                <div v-else @dblclick="item.isEditing = true" class="text-gray-700 text-xs leading-relaxed break-words cursor-pointer" title="双击修改内容">{{ item.title }}</div>
                            </div>
                            <button @click="addAgendaItem(day.fullDate)" class="w-full py-1.5 rounded-lg border-2 border-dashed border-gray-300 text-gray-400 hover:text-emerald-600 hover:border-emerald-500 hover:bg-emerald-50 transition-colors flex justify-center items-center opacity-0 group-hover:opacity-100 absolute bottom-2 left-0 right-0 w-[calc(100%-16px)] mx-auto bg-white/90 backdrop-blur font-bold">+</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 📝 模块二：时间规划胶囊 (日/周/月) -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div v-for="(label, timeframe) in {'日计划': ['今日', '明日'], '周计划': ['本周', '下周'], '月计划': ['本月', '下月']}" :key="timeframe" class="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col">
                <div class="flex justify-between items-center border-b border-gray-100 pb-4 mb-4">
                    <h3 class="font-bold text-gray-900 text-lg flex items-center gap-2">
                        {{ timeframe }}
                    </h3>
                    <div class="flex bg-gray-100 p-1 rounded-xl">
                        <button @click="columnTabs[timeframe] = false" :class="!columnTabs[timeframe] ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'" class="px-4 py-1.5 rounded-lg text-xs font-bold transition-all">{{ label[0] }}</button>
                        <button @click="columnTabs[timeframe] = true" :class="columnTabs[timeframe] ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'" class="px-4 py-1.5 rounded-lg text-xs font-bold transition-all">{{ label[1] }}</button>
                    </div>
                </div>
                
                <div class="space-y-3 flex-1 min-h-[150px]">
                    <TaskItem v-for="task in getTasks(timeframe, 'b2b', columnTabs[timeframe])" :key="task.id" :task="task" @delete="deleteTask" @cycle="cyclePriority"></TaskItem>
                    
                    <div v-if="getTasks(timeframe, 'b2b', columnTabs[timeframe]).length === 0" class="text-xs text-gray-400 py-8 text-center italic border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2 h-full">
                        {{ columnTabs[timeframe] ? `提前规划你的${label[1]}...` : `太棒了，${label[0]}暂无安排~` }}
                    </div>
                </div>
                
                <button @click="addTask(timeframe, 'b2b', columnTabs[timeframe])" class="mt-4 w-full py-3 bg-gray-50 hover:bg-emerald-50 text-gray-500 hover:text-emerald-600 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1 border border-transparent hover:border-emerald-200">
                    + 新增{{ columnTabs[timeframe] ? label[1] : label[0] }}计划
                </button>
            </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useWorkspace } from './composables/useWorkspace.js'

const columnTabs = ref({ '日计划': false, '周计划': false, '月计划': false }); // false代表看当下，true代表看未来

const currentWeek = computed(() => {
    const today = new Date();
    const currentDay = today.getDay() === 0 ? 7 : today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - currentDay + 1);
    
    return Array.from({length: 7}, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const m = d.getMonth() + 1;
        const date = d.getDate();
        return {
            dayName: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'][i],
            dateStr: `${m}.${date}`,
            fullDate: `${d.getFullYear()}-${String(m).padStart(2, '0')}-${String(date).padStart(2, '0')}`,
            isToday: d.toDateString() === today.toDateString()
        };
    });
});

const getAgendaForDate = (dateStr) => {
    return (agendaItems?.value || []).filter(a => a.date === dateStr).sort((a,b) => a.time.localeCompare(b.time));
};

const { 
  activeTab, schedules, plans, 
  toggleSchedule, addSchedule, 
  togglePlanTask, addPlanTask, 
  agendaItems, addAgendaItem, deleteAgendaItem,
  getTasks, addTask, deleteTask, cyclePriority
} = useWorkspace()

const activePeriod = ref('日计划')
const newTaskTitle = ref('')

const showAddScheduleModal = ref(false)
const newScheduleDateDisplay = ref('')
const newScheduleTimeNote = ref('')
const newScheduleTitle = ref('')

const currentDateText = computed(() => {
  const d = new Date()
  const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  return `${d.getMonth() + 1}月${d.getDate()}日 ${days[d.getDay()]}`
})

const handleAddTask = () => {
  if (!newTaskTitle.value.trim()) return
  addPlanTask(activePeriod.value, newTaskTitle.value.trim())
  newTaskTitle.value = ''
}

const handleAddScheduleSubmit = () => {
  if (!newScheduleTitle.value.trim()) return
  addSchedule(
    null, 
    newScheduleTitle.value.trim(), 
    newScheduleTimeNote.value.trim(),
    newScheduleDateDisplay.value.trim()
  )
  newScheduleDateDisplay.value = ''
  newScheduleTimeNote.value = ''
  newScheduleTitle.value = ''
  showAddScheduleModal.value = false
}
</script>