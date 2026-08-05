<script setup>
import { ref, onMounted } from 'vue'
import { 
  Cloud, CloudOff, ChevronLeft, ChevronRight, LayoutDashboard, CalendarDays, HeartPulse, 
  Clapperboard, Languages, BookOpen, Plus, Calendar, Flower2, Beef, TrendingUp, Lightbulb, 
  Trash2, BadgeDollarSign, Award, Video, Newspaper, UploadCloud, Library, Mic, PlayCircle, 
  Edit3, BookMarked, CalendarClock, BrainCircuit, PartyPopper, Target, FileUp, CheckCircle, 
  Circle, Sparkles 
} from 'lucide-vue-next'
import { useWorkspace } from './composables/useWorkspace'
import TaskItem from './components/TaskItem.vue'

// 1. Destructure everything from our workspace composable so we can use them directly in the template
const {
  activeTab, schedules, plans, toggleSchedule, addSchedule, deleteSchedule, getSchedulesForDate, togglePlanTask, addPlanTask, deletePlanTask, getPlans, 
  isSupabaseConfigured, isSyncing, loadData,
  tasks, health, getTasks, addTask, deleteTask, cyclePriority, proteinTarget,
  douyinProgress, douyinTopics, douyinOrders, youtubeSkillProgress, youtubeProdProgress, youtubeTopics, addDouyinItem, removeDouyinItem, addYoutubeTopic, removeYoutubeTopic,
  englishShortProgress, englishLongProgress, englishBooks, englishShadowing, collocations, addEnglishBook, removeEnglishBook, addShadowing, removeShadowing, addCollocation, removeCollocation, reviewTasks,
  japaneseProgress, japaneseBooks, jpTasks, jpVocabularies, addJapaneseBook, removeJapaneseBook, getJpTasks, addJpTask, deleteJpTask, addJpVocab, removeJpVocab, jpReviewTasks
} = useWorkspace()

// 2. Local UI State
const isSidebarOpen = ref(true)
const currentRoute = ref('work')
const plannerTab = ref('工作')
const videoSubTab = ref('douyin')
const englishSubTab = ref('reading')
const japaneseSubTab = ref('textbook')
const jpPlannerTab = ref('日计划')
const todayDate = new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }).format(new Date())

const isDraggingBook = ref(false)
const isDraggingJpBook = ref(false)
const quizIndex = ref(0)
const showAnswer = ref(false)
const jpQuizIndex = ref(0)
const showJpAnswer = ref(false)

// [核心] 控制工作计划板切换 (false代表当前, true代表下一个周期)
const columnTabs = ref({ '日计划': false, '周计划': false, '月计划': false })
const newPlanInputs = ref({ '日计划': '', '周计划': '', '月计划': '' })

// [核心] 控制全周期规划(planner)板切换
const plannerColumnTabs = ref({ '日计划': false, '周计划': false, '月计划': false })

// 处理回车或点击加号添加新计划
const handleAddNewPlan = (timeframe) => {
    const title = newPlanInputs.value[timeframe]
    if (title) {
        addPlanTask(timeframe, title, columnTabs.value[timeframe])
        newPlanInputs.value[timeframe] = ''
    }
}

// 计算本周日历数据
const currentWeek = ref([])
const initCurrentWeek = () => {
    const today = new Date();
    const currentDay = today.getDay() === 0 ? 7 : today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - currentDay + 1);
    
    currentWeek.value = Array.from({length: 7}, (_, i) => {
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
}

const navItems = [
  { id: 'work', icon: LayoutDashboard, label: '工作计划' },
  { id: 'planner', icon: CalendarDays, label: '日/周/月计划' },
  { id: 'health', icon: HeartPulse, label: '身体指标' },
  { id: 'video', icon: Clapperboard, label: '视频灵感' },
  { id: 'english', icon: Languages, label: '英文学习' },
  { id: 'japanese', icon: BookOpen, label: '日文学习' },
]

// 3. Drag & Drop Handlers
const handleBookDrop = (event) => {
  isDraggingBook.value = false
  const files = event.dataTransfer.files
  if (files.length > 0) {
    Array.from(files).forEach(file => {
      addEnglishBook(file.name.replace(/\.[^/.]+$/, ""), 'long', file.name.toLowerCase().endsWith('.pdf') ? '📄' : '📚')
    })
  }
}

const handleJpBookDrop = (event) => {
  isDraggingJpBook.value = false
  const files = event.dataTransfer.files
  if (files.length > 0) {
    Array.from(files).forEach(file => {
      addJapaneseBook(
        file.name.replace(/\.[^/.]+$/, ""), 
        file.name.toLowerCase().endsWith('.pdf') ? '📄' : '📚', 
        Array.from({length:6}, (_,i) => ({title:`第${i+1}章 自动解析...`, done:false}))
      )
    })
  }
}

const handleHighlight = () => {
  const selectedText = window.getSelection().toString().trim()
  if (selectedText && window.confirm(`💡 提取到: "${selectedText}"\n是否自动添加入今日词汇表？`)) {
    addCollocation(selectedText)
    window.getSelection().removeAllRanges()
  }
}

const nextQuiz = () => { showAnswer.value = false; if (quizIndex.value < reviewTasks.value.length - 1) quizIndex.value++ }
const nextJpQuiz = () => { showJpAnswer.value = false; if (jpQuizIndex.value < jpReviewTasks.value.length - 1) jpQuizIndex.value++ }

onMounted(() => {
    initCurrentWeek()
    loadData()
})
</script>

<template>
  <div class="flex w-full h-screen overflow-hidden">
    
    <!-- Sync Status -->
    <div v-if="isSupabaseConfigured" class="absolute top-6 right-8 flex items-center gap-2 text-xs font-bold z-50 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-sm border border-warmgray transition-all">
      <Cloud class="w-4 h-4" :class="isSyncing ? 'text-blue-500 animate-pulse' : 'text-matcha'" />
      <span :class="isSyncing ? 'text-blue-500' : 'text-matcha'">{{ isSyncing ? '正在同步云端...' : '云端已同步' }}</span>
    </div>
    <div v-else class="absolute top-6 right-8 flex items-center gap-2 text-xs font-bold z-50 bg-red-50 text-red-500 px-4 py-2 rounded-full shadow-sm border border-red-200">
      <CloudOff class="w-4 h-4" /> 数据库未连接 (单机模式)
    </div>

    <!-- Sidebar -->
    <aside :class="['bg-warmgray/50 border-r border-warmgray flex flex-col p-4 relative transition-all duration-300 z-40', isSidebarOpen ? 'w-64' : 'w-20']">
      <button @click="isSidebarOpen = !isSidebarOpen" class="absolute -right-3 top-6 bg-white border border-warmgray rounded-full p-1 text-graphite/50 hover:text-matcha shadow-sm z-10">
        <ChevronLeft v-if="isSidebarOpen" class="w-4 h-4" />
        <ChevronRight v-else class="w-4 h-4" />
      </button>
      <div class="flex items-center gap-3 mb-10 mt-2 px-2 overflow-hidden whitespace-nowrap">
        <div class="w-3 h-3 rounded-full bg-matcha shrink-0"></div>
        <div v-if="isSidebarOpen" class="flex-1 font-bold text-base tracking-wider text-graphite">Ming's Workspace</div>
      </div>
      <nav class="flex-1 space-y-2 overflow-hidden">
        <div v-for="nav in navItems" :key="nav.id" @click="currentRoute = nav.id"
          :class="['flex items-center gap-3 py-3 rounded-xl cursor-pointer transition-all whitespace-nowrap', 
                   isSidebarOpen ? 'px-4' : 'px-0 justify-center',
                   currentRoute === nav.id ? 'bg-white text-matcha shadow-sm border border-warmgray' : 'text-graphite/60 hover:bg-warmgray hover:text-graphite']">
          <component :is="nav.icon" class="w-5 h-5 shrink-0" />
          <span v-if="isSidebarOpen" class="font-medium text-sm">{{ nav.label }}</span>
        </div>
      </nav>
    </aside>

    <!-- Main Content Area -->
    <main class="flex-1 overflow-y-auto bg-cream">
      
      <!-- PAGE 1: Today -->
      <div v-if="currentRoute === 'work'" class="p-8 lg:p-12 max-w-7xl mx-auto space-y-8 animate-fade-in">
        <header>
          <h2 class="text-sm font-medium text-graphite/50 mb-2">{{ todayDate }}</h2>
          <h1 class="text-3xl font-bold flex items-center gap-4">工作计划与日程</h1>
        </header>

        <!-- 上下两层布局 -->
        <div class="flex flex-col gap-8">
            
            <!-- 上半部分：本周关键日程表 -->
            <div class="bg-white rounded-3xl p-6 shadow-sm border border-warmgray overflow-hidden">
                <h3 class="font-bold text-lg text-graphite mb-6 flex items-center gap-2"><CalendarClock class="w-5 h-5 text-matcha" /> 本周日程</h3>
                <div class="overflow-x-auto pb-2">
                    <div class="grid grid-cols-7 gap-3 min-w-[700px]">
                        <div v-for="day in currentWeek" :key="day.fullDate" class="flex flex-col border rounded-2xl overflow-hidden transition-all" :class="day.isToday ? 'border-matcha/50 bg-matcha/5 ring-1 ring-matcha/20' : 'border-warmgray bg-warmgray/20'">
                            <div class="text-center py-2.5 border-b" :class="day.isToday ? 'bg-matcha text-white border-matcha/50' : 'bg-warmgray text-graphite/60 border-warmgray'">
                                <div class="text-[11px] font-bold tracking-widest">{{ day.dayName }}</div>
                                <div class="text-lg font-black mt-0.5">{{ day.dateStr }}</div>
                            </div>
                            <div class="p-2 flex-1 min-h-[160px] space-y-2 relative group flex flex-col">
                                <div v-for="item in getSchedulesForDate(day.fullDate)" :key="item.id" class="relative bg-white border border-warmgray rounded-xl p-3 shadow-sm group/item space-y-1">
                                    <button @click="deleteSchedule(item.id)" class="absolute -top-2 -right-2 bg-white border border-warmgray text-red-400 rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover/item:opacity-100 hover:text-red-600 shadow-sm z-10 transition-opacity"><Trash2 class="w-3 h-3" /></button>
                                    <input type="text" v-model="item.timeNote" placeholder="时间(14:00)" class="w-full text-matcha text-sm font-extrabold bg-transparent outline-none">
                                    <textarea v-model="item.title" placeholder="输入日程..." class="w-full text-graphite text-sm font-semibold bg-transparent outline-none resize-none overflow-hidden leading-snug" rows="2" @input="(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }"></textarea>
                                </div>
                                <div class="flex-1"></div>
                                <button @click="addSchedule(day.fullDate, '新日程安排')" class="w-full py-2 rounded-lg border-2 border-dashed border-warmgray text-graphite/40 hover:text-matcha hover:border-matcha transition-colors opacity-0 group-hover:opacity-100 font-bold flex justify-center mt-2">
                                    <Plus class="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 下半部分：日/周/月计划（标题精简为：日、周、月） -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div v-for="(label, timeframe) in {'日计划': ['今日', '明日'], '周计划': ['本周', '下周'], '月计划': ['本月', '下月']}" :key="timeframe" class="bg-white p-6 rounded-3xl border border-warmgray shadow-sm flex flex-col">
                    
                    <!-- 头部切换器（精简标题为单字：日、周、月） -->
                    <div class="flex justify-between items-center border-b border-warmgray pb-4 mb-4">
                        <h3 class="font-bold text-graphite text-xl">
                            {{ {'日计划': '日', '周计划': '周', '月计划': '月'}[timeframe] }}
                        </h3>
                        <div class="flex bg-warmgray/50 p-1 rounded-xl">
                            <button @click="columnTabs[timeframe] = false" :class="!columnTabs[timeframe] ? 'bg-white text-matcha shadow-sm' : 'text-graphite/50 hover:text-graphite'" class="px-4 py-1.5 rounded-lg text-xs font-bold transition-all">{{ label[0] }}</button>
                            <button @click="columnTabs[timeframe] = true" :class="columnTabs[timeframe] ? 'bg-white text-matcha shadow-sm' : 'text-graphite/50 hover:text-graphite'" class="px-4 py-1.5 rounded-lg text-xs font-bold transition-all">{{ label[1] }}</button>
                        </div>
                    </div>
                    
                    <!-- 任务列表区域 -->
                    <div class="space-y-3 flex-1 min-h-[150px]">
                        <div v-for="task in getPlans(timeframe, columnTabs[timeframe])" :key="task.id" 
                            class="flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer group"
                            :class="[task.completed ? 'bg-warmgray/40 border-transparent opacity-60' : 'bg-white border-warmgray hover:border-graphite/20']"
                            @click="togglePlanTask(timeframe, task.id)">
                            
                            <div class="flex items-center gap-3">
                                <button class="shrink-0 flex items-center justify-center transition-all mt-0.5">
                                    <CheckCircle v-if="task.completed" class="w-[18px] h-[18px] text-matcha" />
                                    <div v-else class="w-4 h-4 rounded-[4px] border border-graphite/30 bg-white hover:border-matcha/50 transition-colors"></div>
                                </button>
                                <span class="text-sm font-medium break-words whitespace-pre-wrap leading-relaxed" :class="[task.completed ? 'line-through text-graphite/50' : 'text-graphite']">{{ task.title }}</span>
                            </div>
                            <button @click.stop="deletePlanTask(timeframe, task.id)" class="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity p-1 shrink-0"><Trash2 class="w-4 h-4" /></button>
                        </div>
                        
                        <div v-if="getPlans(timeframe, columnTabs[timeframe]).length === 0" class="text-xs text-graphite/40 py-8 text-center italic border-2 border-dashed border-warmgray rounded-2xl">
                            提前规划你的{{ columnTabs[timeframe] ? label[1] : label[0] }}...
                        </div>
                    </div>
                    
                    <!-- 底部添加栏 -->
                    <div class="mt-4 flex gap-2">
                        <input type="text" v-model="newPlanInputs[timeframe]" @keyup.enter="handleAddNewPlan(timeframe)" :placeholder="`添加${columnTabs[timeframe] ? label[1] : label[0]}任务...`" class="flex-1 p-3 rounded-xl border border-warmgray bg-warmgray/10 text-sm focus:outline-none focus:border-matcha text-graphite placeholder:text-graphite/40 transition-colors">
                        <button @click="handleAddNewPlan(timeframe)" class="px-4 py-2 bg-matcha/10 text-matcha rounded-xl text-sm font-bold hover:bg-matcha/20 transition-colors shadow-sm"><Plus class="w-5 h-5" /></button>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <!-- PAGE 2: Planner (全周期规划，已全面升级为带切换与时光传送带) -->
      <div v-else-if="currentRoute === 'planner'" class="p-8 lg:p-12 max-w-6xl mx-auto space-y-8 animate-fade-in">
        <header><h1 class="text-3xl font-bold">全周期规划</h1></header>
        <div class="flex gap-2 bg-warmgray/50 p-1 rounded-xl w-max border border-warmgray">
          <button v-for="tab in ['生活', '工作', '学习', '运动']" :key="tab" @click="plannerTab = tab"
            :class="['px-6 py-2 rounded-lg text-sm font-medium transition-colors', plannerTab === tab ? 'bg-white text-matcha shadow-sm' : 'text-graphite/60 hover:text-graphite']">
            {{ tab }}
          </button>
        </div>
        <div class="space-y-6">
          <div v-for="(label, timeframe) in {'日计划': ['今日', '明日'], '周计划': ['本周', '下周'], '月计划': ['本月', '下月']}" :key="timeframe" class="bg-white p-6 rounded-2xl border border-warmgray shadow-sm">
            
            <div class="flex justify-between items-center border-b border-warmgray pb-4 mb-4">
              <h3 class="font-bold text-lg text-graphite flex items-center gap-2">
                <Calendar class="w-5 h-5 text-matcha" /> {{ timeframe }}
              </h3>
              <div class="flex items-center gap-4">
                <!-- 切换开关：今日/明日、本周/下周、本月/下月 -->
                <div class="flex bg-warmgray/50 p-1 rounded-xl">
                    <button @click="plannerColumnTabs[timeframe] = false" :class="!plannerColumnTabs[timeframe] ? 'bg-white text-matcha shadow-sm' : 'text-graphite/50 hover:text-graphite'" class="px-4 py-1.5 rounded-lg text-xs font-bold transition-all">{{ label[0] }}</button>
                    <button @click="plannerColumnTabs[timeframe] = true" :class="plannerColumnTabs[timeframe] ? 'bg-white text-matcha shadow-sm' : 'text-graphite/50 hover:text-graphite'" class="px-4 py-1.5 rounded-lg text-xs font-bold transition-all">{{ label[1] }}</button>
                </div>
                <button @click="addTask(timeframe, plannerTab, plannerColumnTabs[timeframe])" class="text-matcha hover:bg-matcha/10 p-2 rounded-full flex gap-1 items-center text-xs font-bold"><Plus class="w-4 h-4" /> 添加任务</button>
              </div>
            </div>

            <div class="space-y-3">
              <TaskItem v-for="task in getTasks(timeframe, plannerTab, plannerColumnTabs[timeframe])" :key="task.id" :task="task" @delete="deleteTask" @cycle="cyclePriority" />
              <div v-if="getTasks(timeframe, plannerTab, plannerColumnTabs[timeframe]).length === 0" class="text-sm text-graphite/40 py-6 text-center italic">
                提前规划你的 {{ plannerTab }} {{ plannerColumnTabs[timeframe] ? label[1] : label[0] }}...
              </div>
            </div>

          </div>
        </div>
      </div>

      <!-- PAGE 3: Health -->
      <div v-else-if="currentRoute === 'health'" class="p-8 lg:p-12 max-w-5xl mx-auto space-y-8 animate-fade-in">
        <h1 class="text-3xl font-bold mb-8">健康与身体指标</h1>
        <div class="bg-white rounded-2xl border border-warmgray shadow-sm overflow-hidden mb-6">
          <div class="p-6 flex flex-wrap items-center justify-between gap-6">
            <div class="flex gap-8">
              <div><div class="text-xs text-graphite/50 mb-1">今日体重 (kg)</div><input type="number" v-model.number="health.weight" class="w-24 text-3xl font-bold text-graphite bg-transparent border-b border-dashed border-warmgray outline-none focus:border-matcha"></div>
              <div><div class="text-xs text-graphite/50 mb-1">目标体重 (kg)</div><input type="number" v-model.number="health.targetWeight" class="w-24 text-3xl font-bold text-matcha bg-transparent border-b border-dashed border-warmgray outline-none focus:border-matcha"></div>
              <div><div class="text-xs text-graphite/50 mb-1">体脂率 (%)</div><input type="number" v-model.number="health.bodyFat" class="w-24 text-3xl font-bold text-graphite bg-transparent border-b border-dashed border-warmgray outline-none focus:border-matcha"></div>
            </div>
          </div>
        </div>
        <div class="grid grid-cols-1 gap-6">
          <div class="bg-white p-6 rounded-2xl border border-warmgray shadow-sm">
            <div class="flex justify-between items-center mb-5">
              <h3 class="font-bold text-graphite flex items-center gap-2"><Flower2 class="w-5 h-5 text-matcha" /> Stacy Sims 生理与训练指南</h3>
            </div>
            <div class="space-y-5 text-sm">
              <div class="flex items-center justify-between">
                <span class="text-graphite/60 font-medium">当前生理周期阶段</span>
                <select v-model="health.cycle_phase" class="bg-warmgray/30 border border-warmgray rounded-lg px-3 py-1.5 outline-none text-graphite cursor-pointer font-medium hover:border-matcha transition-colors">
                  <option value="follicular">卵泡期 (低激素) - 适合突破</option>
                  <option value="luteal">黄体期 (高激素) - 适合耐力</option>
                  <option value="menstruation">经期阶段 - 倾听身体</option>
                  <option value="menopause">围绝经期 - 力量优先</option>
                </select>
              </div>
              <div class="flex items-center justify-between border-t border-warmgray pt-4 mt-2">
                <div class="flex items-center gap-2"><Beef class="w-4 h-4 text-graphite/50" /><span class="text-graphite/60">每日基础抗阻蛋白目标</span></div>
                <div class="flex items-baseline gap-1"><span class="text-xl font-bold text-matcha">{{ proteinTarget }}</span><span class="text-xs text-graphite/50">g</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- PAGE 4: Video -->
      <div v-else-if="currentRoute === 'video'" class="p-8 lg:p-12 max-w-6xl mx-auto space-y-8 animate-fade-in">
        <header class="flex justify-between items-center">
          <h1 class="text-3xl font-bold">视频灵感与内容矩阵</h1>
          <div class="flex gap-2 bg-warmgray/50 p-1 rounded-xl border border-warmgray">
            <button @click="videoSubTab = 'douyin'" :class="['px-5 py-2 rounded-lg text-sm font-medium transition-colors', videoSubTab === 'douyin' ? 'bg-white text-matcha shadow-sm' : 'text-graphite/60 hover:text-graphite']">抖音视频</button>
            <button @click="videoSubTab = 'youtube'" :class="['px-5 py-2 rounded-lg text-sm font-medium transition-colors', videoSubTab === 'youtube' ? 'bg-white text-matcha shadow-sm' : 'text-graphite/60 hover:text-graphite']">YouTube 视频</button>
          </div>
        </header>

        <div v-if="videoSubTab === 'douyin'" class="space-y-8 animate-fade-in">
          <div class="bg-white p-6 rounded-2xl border border-warmgray shadow-sm space-y-3">
            <div class="flex justify-between items-center">
              <h3 class="font-bold text-graphite flex items-center gap-2"><TrendingUp class="w-5 h-5 text-matcha" /> 抖音短视频进度</h3>
              <div class="flex items-center gap-2 text-sm font-semibold text-matcha"><input type="number" v-model.number="douyinProgress.current" class="w-12 bg-warmgray/40 text-center rounded border border-warmgray py-0.5 outline-none"> / <input type="number" v-model.number="douyinProgress.total" class="w-12 bg-warmgray/40 text-center rounded border border-warmgray py-0.5 outline-none"></div>
            </div>
            <div class="w-full bg-warmgray/50 h-3 rounded-full overflow-hidden"><div class="bg-matcha h-full transition-all" :style="{ width: Math.min(100, (douyinProgress.current / douyinProgress.total) * 100) + '%' }"></div></div>
          </div>
          
          <div class="bg-white p-6 rounded-2xl border border-warmgray shadow-sm space-y-4">
            <div class="flex justify-between items-center border-b border-warmgray pb-4">
              <h3 class="font-bold text-graphite flex items-center gap-2"><Lightbulb class="w-5 h-5 text-matcha" /> 抖音选题库</h3>
              <button @click="addDouyinItem('topic')" class="text-matcha hover:bg-matcha/10 px-3 py-1.5 rounded-full text-xs flex items-center gap-1 font-medium"><Plus class="w-4 h-4" /> 新增选题</button>
            </div>
            <div class="space-y-4">
              <div v-for="item in douyinTopics" :key="item.id" class="p-4 rounded-xl border border-warmgray bg-warmgray/20 space-y-3 relative group">
                <button @click="removeDouyinItem('topic', item.id)" class="absolute top-4 right-4 text-red-400 hover:text-red-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"><Trash2 class="w-4 h-4" /></button>
                <div class="flex gap-4 items-center pr-8"><input v-model="item.title" placeholder="视频标题..." class="flex-1 bg-white border border-warmgray rounded-lg px-3 py-1.5 text-sm font-semibold outline-none focus:border-matcha"><input v-model="item.publishTime" type="date" class="bg-white border border-warmgray rounded-lg px-3 py-1.5 text-xs outline-none text-graphite/70 cursor-pointer"></div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3"><input v-model="item.sceneProps" placeholder="场景 / 道具" class="bg-white border border-warmgray rounded-lg px-3 py-1.5 text-xs outline-none text-graphite/70"><input v-model="item.scriptLink" placeholder="脚本链接" class="bg-white border border-warmgray rounded-lg px-3 py-1.5 text-xs outline-none text-matcha underline"></div>
                <textarea v-model="item.notes" placeholder="添加备注..." rows="2" class="w-full bg-white border border-warmgray rounded-lg p-2 text-xs outline-none text-graphite/70 auto-expand"></textarea>
              </div>
            </div>
          </div>
          
          <div class="bg-white p-6 rounded-2xl border border-warmgray shadow-sm space-y-4">
            <div class="flex justify-between items-center border-b border-warmgray pb-4">
              <h3 class="font-bold text-graphite flex items-center gap-2"><BadgeDollarSign class="w-5 h-5 text-matcha" /> 抖音商单</h3>
              <button @click="addDouyinItem('order')" class="text-matcha hover:bg-matcha/10 px-3 py-1.5 rounded-full text-xs flex items-center gap-1 font-medium"><Plus class="w-4 h-4" /> 新增商单</button>
            </div>
            <div class="space-y-4">
              <div v-for="item in douyinOrders" :key="item.id" class="p-4 rounded-xl border border-warmgray bg-warmgray/20 space-y-3 relative group">
                <button @click="removeDouyinItem('order', item.id)" class="absolute top-4 right-4 text-red-400 hover:text-red-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"><Trash2 class="w-4 h-4" /></button>
                <div class="flex gap-4 items-center pr-8"><input v-model="item.title" placeholder="商单品牌主题..." class="flex-1 bg-white border border-warmgray rounded-lg px-3 py-1.5 text-sm font-semibold outline-none focus:border-matcha"><input v-model="item.publishTime" type="date" class="bg-white border border-warmgray rounded-lg px-3 py-1.5 text-xs outline-none text-graphite/70 cursor-pointer"></div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3"><input v-model="item.sceneProps" placeholder="场景要求" class="bg-white border border-warmgray rounded-lg px-3 py-1.5 text-xs outline-none text-graphite/70"><input v-model="item.scriptLink" placeholder="脚本链接" class="bg-white border border-warmgray rounded-lg px-3 py-1.5 text-xs outline-none text-matcha underline"></div>
                <textarea v-model="item.notes" placeholder="商单备注..." rows="2" class="w-full bg-white border border-warmgray rounded-lg p-2 text-xs outline-none text-graphite/70 auto-expand"></textarea>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="videoSubTab === 'youtube'" class="space-y-8 animate-fade-in">
          <div class="bg-white p-6 rounded-2xl border border-warmgray shadow-sm space-y-3">
            <div class="flex justify-between items-center"><h3 class="font-bold text-graphite flex items-center gap-2"><Award class="w-5 h-5 text-matcha" /> 视频能力提升进度</h3><div class="flex items-center gap-2 text-sm font-semibold text-matcha"><input type="number" v-model.number="youtubeSkillProgress.current" class="w-12 bg-warmgray/40 text-center rounded border border-warmgray py-0.5 outline-none"> / <input type="number" v-model.number="youtubeSkillProgress.total" class="w-12 bg-warmgray/40 text-center rounded border border-warmgray py-0.5 outline-none"></div></div>
            <div class="w-full bg-warmgray/50 h-3 rounded-full overflow-hidden"><div class="bg-matcha h-full transition-all" :style="{ width: Math.min(100, (youtubeSkillProgress.current / youtubeSkillProgress.total) * 100) + '%' }"></div></div>
          </div>
          <div class="bg-white p-6 rounded-2xl border border-warmgray shadow-sm space-y-3">
            <div class="flex justify-between items-center"><h3 class="font-bold text-graphite flex items-center gap-2"><Video class="w-5 h-5 text-matcha" /> YouTube 制作进度</h3><div class="flex items-center gap-2 text-sm font-semibold text-matcha"><input type="number" v-model.number="youtubeProdProgress.current" class="w-12 bg-warmgray/40 text-center rounded border border-warmgray py-0.5 outline-none"> / <input type="number" v-model.number="youtubeProdProgress.total" class="w-12 bg-warmgray/40 text-center rounded border border-warmgray py-0.5 outline-none"></div></div>
            <div class="w-full bg-warmgray/50 h-3 rounded-full overflow-hidden"><div class="bg-matcha h-full transition-all" :style="{ width: Math.min(100, (youtubeProdProgress.current / youtubeProdProgress.total) * 100) + '%' }"></div></div>
          </div>
          <div class="bg-white p-6 rounded-2xl border border-warmgray shadow-sm space-y-4">
            <div class="flex justify-between items-center border-b border-warmgray pb-4"><h3 class="font-bold text-graphite flex items-center gap-2"><Lightbulb class="w-5 h-5 text-matcha" /> YouTube 选题</h3><button @click="addYoutubeTopic" class="text-matcha hover:bg-matcha/10 px-3 py-1.5 rounded-full text-xs flex items-center gap-1 font-medium"><Plus class="w-4 h-4" /> 新增选题</button></div>
            <div class="space-y-4">
              <div v-for="item in youtubeTopics" :key="item.id" class="p-4 rounded-xl border border-warmgray bg-warmgray/20 space-y-3 relative group">
                <button @click="removeYoutubeTopic(item.id)" class="absolute top-4 right-4 text-red-400 hover:text-red-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"><Trash2 class="w-4 h-4" /></button>
                <div class="flex gap-4 items-center pr-8"><input v-model="item.title" placeholder="YouTube 标题..." class="flex-1 bg-white border border-warmgray rounded-lg px-3 py-1.5 text-sm font-semibold outline-none focus:border-matcha"><input v-model="item.publishTime" type="date" class="bg-white border border-warmgray rounded-lg px-3 py-1.5 text-xs outline-none text-graphite/70 cursor-pointer"></div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3"><input v-model="item.sceneProps" placeholder="场景说明" class="bg-white border border-warmgray rounded-lg px-3 py-1.5 text-xs outline-none text-graphite/70"><input v-model="item.scriptLink" placeholder="脚本链接" class="bg-white border border-warmgray rounded-lg px-3 py-1.5 text-xs outline-none text-matcha underline"></div>
                <textarea v-model="item.notes" placeholder="备注..." rows="2" class="w-full bg-white border border-warmgray rounded-lg p-2 text-xs outline-none text-graphite/70 auto-expand"></textarea>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- PAGE 5: English -->
      <div v-else-if="currentRoute === 'english'" class="p-8 lg:p-12 max-w-6xl mx-auto space-y-8 animate-fade-in">
        <header class="flex justify-between items-center mb-8">
          <h1 class="text-3xl font-bold">英文学习</h1>
          <div class="flex gap-2 bg-warmgray/50 p-1 rounded-xl border border-warmgray w-max">
            <button v-for="tab in [{id: 'reading', label: '阅读'}, {id: 'shadowing', label: '影子'}, {id: 'collocation', label: '积累'}, {id: 'review', label: '复习'}]" :key="tab.id"
              @click="englishSubTab = tab.id"
              :class="['px-5 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap', englishSubTab === tab.id ? 'bg-white text-matcha shadow-sm' : 'text-graphite/60 hover:text-graphite']">
              {{ tab.label }}
            </button>
          </div>
        </header>

        <div v-if="englishSubTab === 'reading'" class="space-y-8 animate-fade-in">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="bg-white p-6 rounded-2xl border border-warmgray shadow-sm space-y-3">
              <div class="flex justify-between items-center"><h3 class="font-bold text-graphite flex items-center gap-2"><Newspaper class="w-5 h-5 text-matcha" /> 短文章进度</h3><div class="flex items-center gap-2 text-sm font-semibold text-matcha"><input type="number" v-model.number="englishShortProgress.current" class="w-12 bg-warmgray/40 text-center rounded border border-warmgray py-0.5 outline-none"> / <input type="number" v-model.number="englishShortProgress.total" class="w-12 bg-warmgray/40 text-center rounded border border-warmgray py-0.5 outline-none"></div></div>
              <div class="w-full bg-warmgray/50 h-3 rounded-full overflow-hidden"><div class="bg-matcha h-full transition-all" :style="{ width: Math.min(100, (englishShortProgress.current / englishShortProgress.total) * 100 || 0) + '%' }"></div></div>
            </div>
            <div class="bg-white p-6 rounded-2xl border border-warmgray shadow-sm space-y-3">
              <div class="flex justify-between items-center"><h3 class="font-bold text-graphite flex items-center gap-2"><BookOpen class="w-5 h-5 text-matcha" /> 长书籍进度</h3><div class="flex items-center gap-2 text-sm font-semibold text-matcha"><input type="number" v-model.number="englishLongProgress.current" class="w-12 bg-warmgray/40 text-center rounded border border-warmgray py-0.5 outline-none"> / <input type="number" v-model.number="englishLongProgress.total" class="w-12 bg-warmgray/40 text-center rounded border border-warmgray py-0.5 outline-none"></div></div>
              <div class="w-full bg-warmgray/50 h-3 rounded-full overflow-hidden"><div class="bg-matcha h-full transition-all" :style="{ width: Math.min(100, (englishLongProgress.current / englishLongProgress.total) * 100 || 0) + '%' }"></div></div>
            </div>
          </div>
          <div class="bg-white p-6 rounded-2xl border border-warmgray shadow-sm space-y-4 relative" @dragover.prevent="isDraggingBook = true" @dragleave.prevent="isDraggingBook = false" @drop.prevent="handleBookDrop">
            <div v-if="isDraggingBook" class="absolute inset-0 bg-matcha/5 border-2 border-dashed border-matcha rounded-2xl z-20 flex items-center justify-center transition-all pointer-events-none">
              <p class="text-matcha font-bold text-lg flex items-center gap-2"><UploadCloud class="w-6 h-6" /> 松开鼠标自动导入</p>
            </div>
            <div class="flex justify-between items-center border-b border-warmgray pb-4 relative z-10"><h3 class="font-bold text-graphite flex items-center gap-2"><Library class="w-5 h-5 text-matcha" /> 英文阅读书库</h3><button @click="addEnglishBook" class="text-matcha hover:bg-matcha/10 px-3 py-1.5 rounded-full text-xs flex items-center gap-1 font-medium"><Plus class="w-4 h-4" /> 手动新增</button></div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
              <div v-for="book in englishBooks" :key="book.id" class="group border border-warmgray rounded-xl p-4 bg-warmgray/10 relative flex flex-col justify-between hover:shadow-lg transition-all">
                <button @click="removeEnglishBook(book.id)" class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity"><Trash2 class="w-4 h-4" /></button>
                <div class="text-5xl text-center mb-3 pt-4"><input v-model="book.cover" class="w-12 text-center bg-transparent border-b border-dashed border-warmgray outline-none focus:border-matcha"></div>
                <textarea v-model="book.title" placeholder="书名" rows="1" class="w-full font-bold text-sm bg-transparent border-b border-dashed border-warmgray outline-none mb-2 text-center auto-expand"></textarea>
                <select v-model="book.type" class="w-full text-xs text-graphite/60 bg-transparent outline-none mb-3 border-b border-dashed border-warmgray cursor-pointer text-center"><option value="short">短文阅读</option><option value="long">长文阅读</option></select>
                <div>
                  <div class="flex justify-between items-center text-xs text-graphite/60 mb-2">
                    <div class="flex items-center"><input type="number" v-model.number="book.readPages" class="w-10 bg-transparent text-right outline-none border-b border-warmgray text-graphite font-bold"> / <input type="number" v-model.number="book.totalPages" class="w-10 bg-transparent ml-1 outline-none border-b border-warmgray"> p</div>
                    <span class="font-bold">{{ Math.round((book.readPages/book.totalPages)*100 || 0) }}%</span>
                  </div>
                  <div class="h-1.5 bg-warmgray rounded-full overflow-hidden"><div class="h-full bg-matcha transition-all" :style="{ width: Math.min(100, (book.readPages/book.totalPages)*100 || 0) + '%' }"></div></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="englishSubTab === 'shadowing'" class="space-y-6 animate-fade-in">
          <div class="flex justify-between items-center mb-2"><h3 class="font-bold text-graphite flex items-center gap-2"><Mic class="w-5 h-5 text-matcha" /> 影子跟读</h3><button @click="addShadowing" class="text-matcha hover:bg-matcha/10 px-3 py-1.5 rounded-full text-xs flex items-center gap-1 font-medium"><Plus class="w-4 h-4" /> 新增素材</button></div>
          <div v-for="task in englishShadowing" :key="task.id" class="border border-warmgray bg-white rounded-2xl overflow-hidden shadow-sm relative group">
            <div class="bg-warmgray/30 p-4 flex justify-between items-center border-b border-warmgray pr-12"><input v-model="task.title" placeholder="视频标题..." class="font-bold text-graphite bg-transparent outline-none flex-1 border-b border-transparent focus:border-matcha"><input v-model="task.date" type="date" class="text-xs text-graphite/50 bg-transparent outline-none ml-4 cursor-pointer"></div>
            <button @click="removeShadowing(task.id)" class="absolute top-4 right-4 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 class="w-4 h-4" /></button>
            <div class="flex flex-col md:flex-row">
              <div class="md:w-1/3 bg-cream border-r border-warmgray flex flex-col items-center justify-center min-h-[200px] p-6 text-graphite/40"><PlayCircle class="w-10 h-10 mb-2 opacity-50" /><span class="text-xs text-center">Player</span></div>
              <div class="md:w-2/3 p-6 bg-white relative">
                <div class="flex justify-between mb-3 border-b border-warmgray pb-2"><span class="text-xs text-graphite/50">👆 划选下方文本自动提取</span><button @click="task.isEditing = !task.isEditing" class="text-xs text-matcha flex items-center gap-1"><Edit3 class="w-3 h-3" /> {{ task.isEditing ? '完成编辑' : '编辑文本' }}</button></div>
                <textarea v-if="task.isEditing" v-model="task.content" rows="6" class="w-full bg-warmgray/10 border border-warmgray rounded-lg p-3 text-sm text-graphite outline-none focus:border-matcha resize-y"></textarea>
                <p v-else class="text-base leading-relaxed text-graphite selection:bg-matcha/30 selection:text-matcha cursor-text" @mouseup="handleHighlight">{{ task.content || '暂无文本...' }}</p>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="englishSubTab === 'collocation'" class="space-y-6 animate-fade-in">
          <div class="flex justify-between items-center mb-2"><h3 class="font-bold text-graphite flex items-center gap-2"><BookMarked class="w-5 h-5 text-matcha" /> 词汇积累</h3><button @click="() => addCollocation('')" class="text-matcha hover:bg-matcha/10 px-3 py-1.5 rounded-full text-xs flex items-center gap-1 font-medium"><Plus class="w-4 h-4" /> 新增词汇</button></div>
          <div class="space-y-8">
            <div v-for="group in collocations" :key="group.date" class="bg-white rounded-2xl border border-warmgray shadow-sm overflow-hidden">
              <div class="bg-warmgray/50 text-graphite px-5 py-3 font-bold flex justify-between items-center border-b border-warmgray"><span class="flex items-center gap-2"><CalendarClock class="w-4 h-4 opacity-50" /> Batch: {{ group.date }}</span><span class="text-xs font-normal bg-white px-2 py-1 rounded border border-warmgray shadow-sm">{{ group.items.length }} 词组</span></div>
              <div class="overflow-x-auto">
                <table class="w-full text-left text-sm whitespace-normal align-top">
                  <thead class="bg-cream border-b border-warmgray text-graphite/60"><tr><th class="p-3 w-12 text-center">#</th><th class="p-3 font-semibold w-1/5">搭配</th><th class="p-3 font-semibold w-1/5">中文</th><th class="p-3 font-semibold w-1/4">英文解释</th><th class="p-3 font-semibold">例句</th><th class="p-3 w-10"></th></tr></thead>
                  <tbody class="divide-y divide-warmgray">
                    <tr v-for="(item, i) in group.items" :key="item.id" class="hover:bg-warmgray/20 transition-colors group/row">
                      <td class="p-3 text-center text-graphite/40 font-mono text-xs pt-4">{{ i + 1 }}</td>
                      <td class="p-3"><textarea v-model="item.collocation" rows="1" placeholder="词组" class="w-full font-bold text-graphite bg-transparent outline-none auto-expand"></textarea></td>
                      <td class="p-3"><textarea v-model="item.cn" rows="1" placeholder="中文" class="w-full text-graphite/80 bg-transparent outline-none auto-expand"></textarea></td>
                      <td class="p-3"><textarea v-model="item.en" rows="1" placeholder="English Def" class="w-full text-graphite/60 italic bg-transparent outline-none text-xs auto-expand"></textarea></td>
                      <td class="p-3"><textarea v-model="item.sentence" rows="1" placeholder="例句..." class="w-full text-graphite/70 bg-transparent outline-none text-xs border-l-2 border-matcha/30 pl-2 auto-expand"></textarea></td>
                      <td class="p-3 text-right pt-4"><button @click="removeCollocation(group.date, item.id)" class="opacity-0 group-hover/row:opacity-100 text-red-400 hover:text-red-600 p-1 transition-opacity"><Trash2 class="w-4 h-4" /></button></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="englishSubTab === 'review'" class="space-y-8 animate-fade-in">
          <div class="flex justify-between items-center"><h2 class="text-2xl font-bold flex items-center gap-2"><BrainCircuit class="w-6 h-6 text-matcha" /> 艾宾浩斯复习</h2><span class="bg-matcha text-white px-3 py-1 rounded-full text-xs font-bold">待复习: {{ reviewTasks.length }} 项</span></div>
          <div v-if="reviewTasks.length === 0" class="text-center py-24 text-graphite/40 bg-white border border-warmgray rounded-2xl shadow-sm"><PartyPopper class="w-12 h-12 mx-auto mb-4 text-matcha/50" /><p class="text-lg font-medium text-graphite">今日复习全清空！</p></div>
          <div v-else class="bg-white border border-warmgray rounded-3xl p-8 md:p-12 max-w-2xl mx-auto shadow-xl relative">
            <div class="absolute top-6 right-8 text-graphite/40 font-mono font-bold text-sm">{{ quizIndex + 1 }} / {{ reviewTasks.length }}</div>
            <div class="text-center space-y-6 my-10">
              <p class="text-xs font-bold text-matcha uppercase tracking-widest bg-matcha/10 inline-block px-3 py-1 rounded">来自: {{ reviewTasks[quizIndex].fromDate }}</p>
              <div class="text-3xl font-bold text-graphite">{{ reviewTasks[quizIndex].cn }}</div>
              <div class="text-graphite/50 italic text-sm">{{ reviewTasks[quizIndex].en }}</div>
              <div v-if="showAnswer" class="mt-8 p-6 bg-cream border border-warmgray rounded-2xl"><div class="text-2xl font-bold text-matcha mb-4">{{ reviewTasks[quizIndex].collocation }}</div><p class="text-graphite/70 text-sm leading-relaxed border-l-2 border-matcha/30 pl-4 text-left inline-block">{{ reviewTasks[quizIndex].sentence }}</p></div>
              <div v-else class="mt-8 p-8 border-2 border-dashed border-warmgray rounded-2xl text-graphite/40 bg-warmgray/10 text-sm">努力回想一下...</div>
            </div>
            <div class="flex gap-4 mt-12">
              <button v-if="!showAnswer" @click="showAnswer = true" class="flex-1 bg-graphite text-white py-4 rounded-xl font-bold shadow-md hover:bg-graphite/80 transition-all">显示答案</button>
              <template v-else><button @click="nextQuiz()" class="flex-1 bg-red-50 text-red-500 border border-red-100 py-4 rounded-xl font-bold hover:bg-red-100 transition-all">没想起来</button><button @click="nextQuiz()" class="flex-1 bg-matcha text-white py-4 rounded-xl font-bold shadow-md hover:bg-matcha/90 transition-all">记住了</button></template>
            </div>
          </div>
        </div>
      </div>

      <!-- PAGE 6: Japanese -->
      <div v-else-if="currentRoute === 'japanese'" class="p-8 lg:p-12 max-w-6xl mx-auto space-y-8 animate-fade-in">
        <header class="flex justify-between items-center mb-8">
          <h1 class="text-3xl font-bold">日语学习</h1>
          <div class="flex gap-2 bg-warmgray/50 p-1 rounded-xl border border-warmgray w-max">
            <button v-for="tab in [{id: 'textbook', label: '教材'}, {id: 'planner', label: '计划'}, {id: 'vocabulary', label: '积累'}, {id: 'review', label: '复习'}]" :key="tab.id"
              @click="japaneseSubTab = tab.id"
              :class="['px-5 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap', japaneseSubTab === tab.id ? 'bg-white text-matcha shadow-sm' : 'text-graphite/60 hover:text-graphite']">
              {{ tab.label }}
            </button>
          </div>
        </header>

        <div v-if="japaneseSubTab === 'textbook'" class="space-y-8 animate-fade-in">
          <div class="bg-white p-6 rounded-2xl border border-warmgray shadow-sm space-y-3">
            <div class="flex justify-between items-center"><h3 class="font-bold text-graphite flex items-center gap-2"><Target class="w-5 h-5 text-matcha" /> 2026 日语总进度</h3><div class="flex items-center gap-2 text-sm font-semibold text-matcha"><input type="number" v-model.number="japaneseProgress.current" class="w-12 bg-warmgray/40 text-center rounded border border-warmgray py-0.5 outline-none"> / <input type="number" v-model.number="japaneseProgress.total" class="w-12 bg-warmgray/40 text-center rounded border border-warmgray py-0.5 outline-none"> 章</div></div>
            <div class="w-full bg-warmgray/50 h-3 rounded-full overflow-hidden"><div class="bg-matcha h-full transition-all" :style="{ width: Math.min(100, (japaneseProgress.current / japaneseProgress.total) * 100 || 0) + '%' }"></div></div>
          </div>
          <div class="bg-white p-6 rounded-2xl border border-warmgray shadow-sm space-y-4 relative" @dragover.prevent="isDraggingJpBook = true" @dragleave.prevent="isDraggingJpBook = false" @drop.prevent="handleJpBookDrop">
            <div v-if="isDraggingJpBook" class="absolute inset-0 bg-matcha/5 border-2 border-dashed border-matcha rounded-2xl z-20 flex items-center justify-center transition-all pointer-events-none">
              <p class="text-matcha font-bold text-lg flex items-center gap-2"><FileUp class="w-6 h-6" /> 松开鼠标提取教材目录</p>
            </div>
            <div class="flex justify-between items-center border-b border-warmgray pb-4 relative z-10"><h3 class="font-bold text-graphite flex items-center gap-2"><BookMarked class="w-5 h-5 text-matcha" /> 日语教材库</h3><button @click="addJapaneseBook" class="text-matcha hover:bg-matcha/10 px-3 py-1.5 rounded-full text-xs flex items-center gap-1"><Plus class="w-4 h-4" /> 手动新增</button></div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
              <div v-for="book in japaneseBooks" :key="book.id" class="border border-warmgray rounded-2xl p-5 bg-warmgray/10 relative transition-all space-y-4">
                <button @click="removeJapaneseBook(book.id)" class="absolute top-4 right-4 text-red-400 hover:text-red-600 p-1 opacity-60 hover:opacity-100 transition-opacity"><Trash2 class="w-4 h-4" /></button>
                <div class="flex items-start gap-4"><div class="text-4xl bg-white p-3 rounded-xl border border-warmgray shadow-sm shrink-0">{{ book.cover }}</div><div class="flex-1 pr-6 space-y-1"><input v-model="book.title" class="font-bold text-graphite text-base bg-transparent border-b border-dashed border-warmgray outline-none w-full"><p class="text-xs text-graphite/50">{{ book.chapters.length }} 章节</p></div></div>
                <div class="bg-white rounded-xl border border-warmgray p-3 space-y-2 max-h-48 overflow-y-auto">
                  <div class="text-xs font-bold text-graphite/40 mb-2 flex justify-between items-center border-b border-warmgray/50 pb-1"><span>📑 目录</span><span>进度: {{ book.chapters.filter(c => c.done).length }} / {{ book.chapters.length }}</span></div>
                  <div v-for="(chap, cIdx) in book.chapters" :key="cIdx" @click="chap.done = !chap.done" class="flex items-center justify-between text-xs p-1.5 rounded hover:bg-warmgray/30 cursor-pointer">
                    <span class="flex items-center gap-2" :class="chap.done ? 'line-through text-graphite/40' : 'text-graphite font-medium'">
                      <CheckCircle v-if="chap.done" class="w-3.5 h-3.5 text-matcha" />
                      <Circle v-else class="w-3.5 h-3.5 text-graphite/30" />
                      {{ chap.title }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="japaneseSubTab === 'planner'" class="space-y-6 animate-fade-in">
          <div class="flex gap-2 bg-warmgray/50 p-1 rounded-xl w-max border border-warmgray"><button v-for="tab in ['日计划', '周计划', '月计划']" :key="tab" @click="jpPlannerTab = tab" :class="['px-6 py-2 rounded-lg text-sm font-medium transition-colors', jpPlannerTab === tab ? 'bg-white text-matcha shadow-sm' : 'text-graphite/60 hover:text-graphite']">{{ tab }}</button></div>
          <div class="bg-white p-6 rounded-2xl border border-warmgray shadow-sm space-y-4">
            <div class="flex justify-between items-center border-b border-warmgray pb-4"><h3 class="font-bold text-lg text-graphite flex items-center gap-2"><Calendar class="w-5 h-5 text-matcha" /> {{ jpPlannerTab }}</h3><button @click="addJpTask(jpPlannerTab)" class="text-matcha hover:bg-matcha/10 p-2 rounded-full flex gap-1 items-center text-xs"><Plus class="w-4 h-4" /> 添加</button></div>
            <div class="space-y-3"><TaskItem v-for="task in getJpTasks(jpPlannerTab)" :key="task.id" :task="task" @delete="deleteJpTask" @cycle="cyclePriority" /></div>
          </div>
        </div>

        <div v-else-if="japaneseSubTab === 'vocabulary'" class="space-y-6 animate-fade-in">
          <div class="flex justify-between items-center mb-2"><h3 class="font-bold text-graphite flex items-center gap-2"><Languages class="w-5 h-5 text-matcha" /> 日语单词</h3><button @click="() => addJpVocab('')" class="text-matcha hover:bg-matcha/10 px-3 py-1.5 rounded-full text-xs flex items-center gap-1 font-medium"><Plus class="w-4 h-4" /> 新增单词</button></div>
          <div class="space-y-8">
            <div v-for="group in jpVocabularies" :key="group.date" class="bg-white rounded-2xl border border-warmgray shadow-sm overflow-hidden">
              <div class="bg-warmgray/50 text-graphite px-5 py-3 font-bold flex justify-between items-center border-b border-warmgray"><span class="flex items-center gap-2"><CalendarClock class="w-4 h-4 opacity-50" /> Batch: {{ group.date }}</span></div>
              <div class="overflow-x-auto">
                <table class="w-full text-left text-sm whitespace-normal align-top">
                  <thead class="bg-cream border-b border-warmgray text-graphite/60"><tr><th class="p-3 w-12 text-center">#</th><th class="p-3 w-1/5">单词</th><th class="p-3 w-1/5">假名</th><th class="p-3 w-1/5">中文</th><th class="p-3">例句</th><th class="p-3 w-10"></th></tr></thead>
                  <tbody class="divide-y divide-warmgray">
                    <tr v-for="(item, i) in group.items" :key="item.id" class="hover:bg-warmgray/20 transition-colors group/row">
                      <td class="p-3 text-center text-graphite/40 font-mono text-xs pt-4">{{ i + 1 }}</td>
                      <td class="p-3"><textarea v-model="item.word" rows="1" class="w-full font-bold text-graphite bg-transparent outline-none auto-expand"></textarea></td>
                      <td class="p-3"><textarea v-model="item.kana" rows="1" class="w-full text-matcha font-medium bg-transparent outline-none auto-expand"></textarea></td>
                      <td class="p-3"><textarea v-model="item.cn" rows="1" class="w-full text-graphite/80 bg-transparent outline-none auto-expand"></textarea></td>
                      <td class="p-3"><textarea v-model="item.sentence" rows="1" class="w-full text-graphite/70 bg-transparent outline-none text-xs border-l-2 border-matcha/30 pl-2 auto-expand"></textarea></td>
                      <td class="p-3 text-right pt-4"><button @click="removeJpVocab(group.date, item.id)" class="opacity-0 group-hover/row:opacity-100 text-red-400 hover:text-red-600 p-1"><Trash2 class="w-4 h-4" /></button></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="japaneseSubTab === 'review'" class="space-y-8 animate-fade-in">
          <div class="flex justify-between items-center"><h2 class="text-2xl font-bold flex items-center gap-2"><BrainCircuit class="w-6 h-6 text-matcha" /> 单词复习</h2><span class="bg-matcha text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">今日待复习: {{ jpReviewTasks.length }} 项</span></div>
          <div v-if="jpReviewTasks.length === 0" class="text-center py-24 text-graphite/40 bg-white border border-warmgray rounded-2xl shadow-sm"><Sparkles class="w-12 h-12 mx-auto mb-4 text-matcha/50" /><p class="text-lg font-medium text-graphite">今日任务已完成！</p></div>
          <div v-else class="bg-white border border-warmgray rounded-3xl p-8 md:p-12 max-w-2xl mx-auto shadow-xl relative">
            <div class="absolute top-6 right-8 text-graphite/40 font-mono font-bold text-sm">{{ jpQuizIndex + 1 }} / {{ jpReviewTasks.length }}</div>
            <div class="text-center space-y-6 my-10">
              <p class="text-xs font-bold text-matcha uppercase tracking-widest bg-matcha/10 inline-block px-3 py-1 rounded">来自: {{ jpReviewTasks[jpQuizIndex].fromDate }}</p>
              <div class="text-3xl font-bold text-graphite">{{ jpReviewTasks[jpQuizIndex].cn }}</div>
              <div v-if="showJpAnswer" class="mt-8 p-6 bg-cream border border-warmgray rounded-2xl space-y-2"><div class="text-3xl font-bold text-matcha">{{ jpReviewTasks[jpQuizIndex].word }}</div><div class="text-sm text-graphite/60 font-mono">读音: {{ jpReviewTasks[jpQuizIndex].kana }}</div><p class="text-graphite/70 text-sm leading-relaxed border-l-2 border-matcha/30 pl-4 text-left inline-block mt-2">{{ jpReviewTasks[jpQuizIndex].sentence }}</p></div>
              <div v-else class="mt-8 p-8 border-2 border-dashed border-warmgray rounded-2xl text-graphite/40 bg-warmgray/10 text-sm">努力回想一下...</div>
            </div>
            <div class="flex gap-4 mt-12"><button v-if="!showJpAnswer" @click="showJpAnswer = true" class="flex-1 bg-graphite text-white py-4 rounded-xl font-bold shadow-md hover:bg-graphite/80">显示答案</button><template v-else><button @click="nextJpQuiz()" class="flex-1 bg-red-50 text-red-500 border border-red-100 py-4 rounded-xl font-bold hover:bg-red-100">没想起来</button><button @click="nextJpQuiz()" class="flex-1 bg-matcha text-white py-4 rounded-xl font-bold shadow-md hover:bg-matcha/90 shadow-md">记住了</button></template></div>
          </div>
        </div>
      </div>

    </main>
  </div>
</template>
