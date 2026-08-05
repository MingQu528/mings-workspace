import { ref, computed, watch } from 'vue'
import { supabase } from '../lib/supabase'

// Global State
const isSupabaseConfigured = ref(true)
const isSyncing = ref(false)

const tasks = ref([])
const health = ref({ weight: 0, targetWeight: 0, bodyFat: 0, cycle_phase: 'follicular' })
const agendaItems = ref([]); // 存放苹果式日程表的数据

const douyinProgress = ref({ current: 0, total: 40 })
const douyinTopics = ref([])
const douyinOrders = ref([])
const youtubeSkillProgress = ref({ current: 0, total: 30 })
const youtubeProdProgress = ref({ current: 0, total: 8 })
const youtubeTopics = ref([])

const englishShortProgress = ref({ current: 0, total: 10 })
const englishLongProgress = ref({ current: 0, total: 5 })
const englishBooks = ref([])
const englishShadowing = ref([])
const collocations = ref([])

const japaneseProgress = ref({ current: 0, total: 15 })
const japaneseBooks = ref([])
const jpTasks = ref([])
const jpVocabularies = ref([])

// Sync date tracking
const lastSyncDate = ref(new Date().toISOString())

// Work Plan & Schedule State
const activeTab = ref('工作')
const activePlanPeriod = ref('日计划')

const schedules = ref([
  {
    id: 'sch-1',
    date: '2026-08-06',
    dateDisplay: '8月6日',
    timeNote: '日本时间 16:00 / 北京时间 14:00',
    title: '线上视频会',
    description: '重要项目线上沟通对接会议',
    completed: false
  },
  {
    id: 'sch-2',
    date: '2026-08-07',
    dateDisplay: '8月7日前',
    timeNote: '全天截止',
    title: '做好定价方案',
    description: '完成产品定价方案与成本收益测算',
    completed: false
  }
])

const plans = ref({
  '日计划': [
    { id: 'p-1', title: '工作计划面板修改', completed: true },
    { id: 'p-2', title: '考勤发给陈豆', completed: false },
    { id: 'p-3', title: '乳垫ph刷单*2', completed: false },
    { id: 'p-4', title: '发4个指甲油视频', completed: false },
    { id: 'p-5', title: '指甲油链接折扣', completed: false },
    { id: 'p-6', title: '托腹带2.0brief', completed: true },
    { id: 'p-7', title: 'nh妊娠霜达人发brief*5', completed: false }
  ],
  '周计划': [
    { id: 'pw-1', title: '整理本周销售数据', completed: false }
  ],
  '月计划': [
    { id: 'pm-1', title: '8月份推广策略方案', completed: false }
  ]
})

// Auto-reset tasks across periods
const checkAndResetTasks = (lastDateStr) => {
    if (!lastDateStr) return false;
    const last = new Date(lastDateStr);
    const now = new Date();
    
    const lastDay = new Date(last.getFullYear(), last.getMonth(), last.getDate());
    const currentDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (currentDay > lastDay) {
        // 1. 【日计划】更新：删掉昨天打勾的，把"明日"计划变成"今日"
        tasks.value = tasks.value.filter(t => !(t.timeframe === '日计划' && !t.isNext && t.completed));
        tasks.value.forEach(t => { if (t.timeframe === '日计划' && t.isNext) t.isNext = false; });
        
        // 2. 【周计划】更新（每周日跨周一刷新）
        const getMonday = (d) => { const x = new Date(d); x.setDate(x.getDate() - (x.getDay() === 0 ? 7 : x.getDay()) + 1); return x; };
        if (getMonday(currentDay) > getMonday(lastDay)) {
            tasks.value = tasks.value.filter(t => !(t.timeframe === '周计划' && !t.isNext && t.completed));
            tasks.value.forEach(t => { if (t.timeframe === '周计划' && t.isNext) t.isNext = false; });
            
            // 顺便清理上周已经过去的日程表事件
            agendaItems.value = agendaItems.value.filter(item => new Date(item.date) >= getMonday(currentDay));
        }
        
        // 3. 【月计划】更新（跨月刷新）
        if (currentDay.getMonth() !== lastDay.getMonth() || currentDay.getFullYear() !== lastDay.getFullYear()) {
            tasks.value = tasks.value.filter(t => !(t.timeframe === '月计划' && !t.isNext && t.completed));
            tasks.value.forEach(t => { if (t.timeframe === '月计划' && t.isNext) t.isNext = false; });
        }
        return true; // 告诉系统需要保存云端
    }
    return false;
};

export function useWorkspace() {
  const loadData = async () => {
    if (!supabase) { isSupabaseConfigured.value = false; return; }
    isSyncing.value = true
    try {
      const { data } = await supabase.from('my_workspace').select('data').eq('id', 1).single()
      if (data && data.data) {
        const d = data.data
        if (d.agendaItems) agendaItems.value = d.agendaItems
        if (d.tasks) tasks.value = d.tasks
        if (d.health) health.value = d.health
        if (d.douyinProgress) douyinProgress.value = d.douyinProgress
        if (d.douyinTopics) douyinTopics.value = d.douyinTopics
        if (d.douyinOrders) douyinOrders.value = d.douyinOrders
        if (d.youtubeSkillProgress) youtubeSkillProgress.value = d.youtubeSkillProgress
        if (d.youtubeProdProgress) youtubeProdProgress.value = d.youtubeProdProgress
        if (d.youtubeTopics) youtubeTopics.value = d.youtubeTopics
        if (d.englishShortProgress) englishShortProgress.value = d.englishShortProgress
        if (d.englishLongProgress) englishLongProgress.value = d.englishLongProgress
        if (d.englishBooks) englishBooks.value = d.englishBooks
        if (d.englishShadowing) englishShadowing.value = d.englishShadowing
        if (d.collocations) collocations.value = d.collocations
        if (d.japaneseProgress) japaneseProgress.value = d.japaneseProgress
        if (d.japaneseBooks) japaneseBooks.value = d.japaneseBooks
        if (d.jpTasks) jpTasks.value = d.jpTasks
        if (d.jpVocabularies) jpVocabularies.value = d.jpVocabularies
        if (d.schedules) schedules.value = d.schedules
        if (d.plans) plans.value = d.plans
        if (d.lastSyncDate) lastSyncDate.value = d.lastSyncDate
      }
    } catch (e) {
      console.error("加载云端数据失败", e)
      isSupabaseConfigured.value = false
    }
    isSyncing.value = false
  }

  let syncTimeout
  const saveData = () => {
    if (!supabase) return
    clearTimeout(syncTimeout)
    
    syncTimeout = setTimeout(async () => {
      isSyncing.value = true
      
      const stateToSave = JSON.parse(JSON.stringify({
        agendaItems: agendaItems.value,
        lastSyncDate: lastSyncDate.value,
        tasks: tasks.value, 
        health: health.value,
        douyinProgress: douyinProgress.value, 
        douyinTopics: douyinTopics.value, 
        douyinOrders: douyinOrders.value,
        youtubeSkillProgress: youtubeSkillProgress.value, 
        youtubeProdProgress: youtubeProdProgress.value, 
        youtubeTopics: youtubeTopics.value,
        englishShortProgress: englishShortProgress.value, 
        englishLongProgress: englishLongProgress.value, 
        englishBooks: englishBooks.value, 
        englishShadowing: englishShadowing.value, 
        collocations: collocations.value,
        japaneseProgress: japaneseProgress.value, 
        japaneseBooks: japaneseBooks.value, 
        jpTasks: jpTasks.value, 
        jpVocabularies: jpVocabularies.value,
        schedules: schedules.value,
        plans: plans.value
      }))

      try {
        const { error } = await supabase.from('my_workspace').upsert({ id: 1, data: stateToSave })
        if (error) {
          console.error("Supabase 写入失败:", error.message)
        }
      } catch (err) {
        console.error("Unexpected Save Error:", err)
      } finally {
        isSyncing.value = false
      }
    }, 2000)
  }

  watch([tasks, health, douyinProgress, douyinTopics, douyinOrders, youtubeSkillProgress, youtubeProdProgress, youtubeTopics, englishShortProgress, englishLongProgress, englishBooks, englishShadowing, collocations, japaneseProgress, japaneseBooks, jpTasks, jpVocabularies, schedules, plans], () => {
    saveData()
  }, { deep: true })

  // Schedule Logic
  const toggleSchedule = (id) => {
    const item = schedules.value.find(s => s.id === id)
    if (item) item.completed = !item.completed
  }

  const addSchedule = (date, title, timeNote = '', dateDisplay = '') => {
    if (!title.trim()) return
    const d = new Date()
    schedules.value.unshift({
      id: 'sch-' + Date.now(),
      date: date || new Date().toISOString().split('T')[0],
      dateDisplay: dateDisplay || `${d.getMonth() + 1}月${d.getDate()}日`,
      timeNote: timeNote || '全天',
      title: title.trim(),
      completed: false
    })
  }

  const togglePlanTask = (period, id) => {
    if (!plans.value[period]) return
    const task = plans.value[period].find(t => t.id === id)
    if (task) task.completed = !task.completed
  }

  const addPlanTask = (period, title) => {
    if (!title.trim()) return
    if (!plans.value[period]) plans.value[period] = []
    plans.value[period].unshift({
      id: 'task-' + Date.now(),
      title: title.trim(),
      completed: false
    })
  }

  // Tasks Logic
  const getTasks = (timeframe, category, isNext = false) => {
    return tasks.value.filter(t => t.timeframe === timeframe && t.category === category && !!t.isNext === isNext);
  };
  const addTask = (timeframe, category, isNext = false) => {
    tasks.value.unshift({ id: Date.now(), title: '新计划', category, timeframe, isNext, priority: 'p2', completed: false, isEditing: true });
  };
  // 苹果日程表的专属新增和删除
  const addAgendaItem = (dateStr) => {
    agendaItems.value.push({ id: Date.now(), date: dateStr, time: '14:00', title: '新日程安排', isEditing: true });
  };
  const deleteAgendaItem = (id) => agendaItems.value = agendaItems.value.filter(i => i.id !== id);
  const deleteTask = (id) => tasks.value = tasks.value.filter(t => t.id !== id)
  const cyclePriority = (task) => { if (!task.completed) task.priority = { p1: 'p2', p2: 'p3', p3: 'p4', p4: 'p1' }[task.priority] }

  // Health Logic
  const proteinTarget = computed(() => (health.value.weight * 1.8).toFixed(0))

  // Video Logic
  const addDouyinItem = (type) => { type === 'topic' ? douyinTopics.value.unshift({ id: Date.now(), title: '' }) : douyinOrders.value.unshift({ id: Date.now(), title: '' }) }
  const removeDouyinItem = (type, id) => { type === 'topic' ? douyinTopics.value = douyinTopics.value.filter(i => i.id !== id) : douyinOrders.value = douyinOrders.value.filter(i => i.id !== id) }
  const addYoutubeTopic = () => youtubeTopics.value.unshift({ id: Date.now(), title: '' })
  const removeYoutubeTopic = (id) => youtubeTopics.value = youtubeTopics.value.filter(i => i.id !== id)

  // English Logic
  const addEnglishBook = (title = "", type = "short", cover = "📖") => englishBooks.value.unshift({ id: Date.now() + Math.random(), title, type, readPages: 0, totalPages: 100, cover })
  const removeEnglishBook = (id) => englishBooks.value = englishBooks.value.filter(b => b.id !== id)
  const addShadowing = () => englishShadowing.value.unshift({ id: Date.now(), title: "", date: new Date().toISOString().split('T')[0], content: "", isEditing: true })
  const removeShadowing = (id) => englishShadowing.value = englishShadowing.value.filter(s => s.id !== id)
  const addCollocation = (w = "") => {
    const today = new Date().toISOString().split('T')[0]
    let group = collocations.value.find(g => g.date === today)
    if (!group) { group = { date: today, items: [] }; collocations.value.unshift(group) }
    group.items.push({ id: Date.now(), collocation: w, en: "", cn: "", sentence: "" })
  }
  const removeCollocation = (date, id) => {
    const group = collocations.value.find(g => g.date === date)
    if (group) { group.items = group.items.filter(i => i.id !== id); if (group.items.length === 0) collocations.value = collocations.value.filter(g => g.date !== date) }
  }
  const reviewTasks = computed(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0); let list = []
    collocations.value.forEach(g => {
      const d = new Date(g.date); d.setHours(0, 0, 0, 0)
      if ([1, 2, 4, 7, 15].includes(Math.ceil(Math.abs(today - d) / 86400000))) list.push(...g.items.map(i => ({ ...i, fromDate: g.date })))
    })
    return list
  })

  // Japanese Logic
  const addJapaneseBook = (title = "", cover = "📖", chapters = null) => japaneseBooks.value.unshift({ id: Date.now() + Math.random(), title, cover, chapters: chapters || [{ title: "第1课", done: false }] })
  const removeJapaneseBook = (id) => japaneseBooks.value = japaneseBooks.value.filter(b => b.id !== id)
  const getJpTasks = (tf) => jpTasks.value.filter(t => t.timeframe === tf)
  const addJpTask = (tf) => jpTasks.value.unshift({ id: Date.now(), title: '新计划', category: '日语', timeframe: tf, priority: 'p2', completed: false, isEditing: true })
  const deleteJpTask = (id) => jpTasks.value = jpTasks.value.filter(t => t.id !== id)
  const addJpVocab = (w = "") => {
    const today = new Date().toISOString().split('T')[0]
    let group = jpVocabularies.value.find(g => g.date === today)
    if (!group) { group = { date: today, items: [] }; jpVocabularies.value.unshift(group) }
    group.items.push({ id: Date.now(), word: w, kana: "", cn: "", sentence: "" })
  }
  const removeJpVocab = (date, id) => {
    const group = jpVocabularies.value.find(g => g.date === date)
    if (group) { group.items = group.items.filter(i => i.id !== id); if (group.items.length === 0) jpVocabularies.value = jpVocabularies.value.filter(g => g.date !== date) }
  }
  const jpReviewTasks = computed(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0); let list = []
    jpVocabularies.value.forEach(g => {
      const d = new Date(g.date); d.setHours(0, 0, 0, 0)
      if ([1, 2, 4, 7, 15].includes(Math.ceil(Math.abs(today - d) / 86400000))) list.push(...g.items.map(i => ({ ...i, fromDate: g.date })))
    })
    return list
  })

  return {
    activeTab, activePlanPeriod, schedules, plans, toggleSchedule, addSchedule, togglePlanTask, addPlanTask,
    lastSyncDate, checkAndResetTasks,
    isSupabaseConfigured, isSyncing, loadData,
    tasks, health, getTasks, addTask, deleteTask, cyclePriority, proteinTarget,
    agendaItems, addAgendaItem, deleteAgendaItem,
    douyinProgress, douyinTopics, douyinOrders, youtubeSkillProgress, youtubeProdProgress, youtubeTopics, addDouyinItem, removeDouyinItem, addYoutubeTopic, removeYoutubeTopic,
    englishShortProgress, englishLongProgress, englishBooks, englishShadowing, collocations, addEnglishBook, removeEnglishBook, addShadowing, removeShadowing, addCollocation, removeCollocation, reviewTasks,
    japaneseProgress, japaneseBooks, jpTasks, jpVocabularies, addJapaneseBook, removeJapaneseBook, getJpTasks, addJpTask, deleteJpTask, addJpVocab, removeJpVocab, jpReviewTasks
  }
}