import { ref, computed, watch } from 'vue'
import { supabase } from '../lib/supabase'

// 保持你原有所有模块的状态不变
const isSupabaseConfigured = ref(true)
const isSyncing = ref(false)
const tasks = ref([])
const health = ref({ weight: 0, targetWeight: 0, bodyFat: 0, cycle_phase: 'follicular' })
const agendaItems = ref([])
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

const lastSyncDate = ref(new Date().toISOString())
const activeTab = ref('工作')
const activePlanPeriod = ref('日计划')

// 📅 你的新日程表（预设了和森下的会议）
const schedules = ref([
  {
    id: 'sch-initial',
    date: '2026-08-06',
    timeNote: '14:00 (北京时间)',
    title: '和森下开线上会议',
    completed: false
  }
])

// 📝 你的新计划板（干净的底子，等待装填）
const plans = ref({
  '日计划': [],
  '周计划': [],
  '月计划': []
})

export function useWorkspace() {
  // ✨ [核心魔法] 午夜清零与时光胶囊传送带
  const checkAndResetTasks = () => {
    if (!lastSyncDate.value) return false;
    const last = new Date(lastSyncDate.value);
    const now = new Date();

    const lastDay = new Date(last.getFullYear(), last.getMonth(), last.getDate());
    const currentDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (currentDay > lastDay) {
        let shouldSave = false;

        // 1. 【日计划】午夜魔法：清空今天打勾的，把"明日(isNext:true)"变成"今日(isNext:false)"
        if (plans.value['日计划']) {
            plans.value['日计划'] = plans.value['日计划'].filter(t => !(t.completed && !t.isNext));
            plans.value['日计划'].forEach(t => { if (t.isNext) t.isNext = false; });
            shouldSave = true;
        }

        // 2. 【周计划】周日跨周一魔法：清空本周打勾的，把"下周"变成"本周"
        const getMonday = (d) => {
            const x = new Date(d);
            x.setDate(x.getDate() - (x.getDay() === 0 ? 7 : x.getDay()) + 1);
            return new Date(x.getFullYear(), x.getMonth(), x.getDate());
        };
        if (getMonday(currentDay) > getMonday(lastDay)) {
            if (plans.value['周计划']) {
                plans.value['周计划'] = plans.value['周计划'].filter(t => !(t.completed && !t.isNext));
                plans.value['周计划'].forEach(t => { if (t.isNext) t.isNext = false; });
                shouldSave = true;
            }
        }

        // 3. 【月计划】跨月魔法：清空本月打勾的，把"下月"变成"本月"
        if (currentDay.getMonth() !== lastDay.getMonth() || currentDay.getFullYear() !== lastDay.getFullYear()) {
            if (plans.value['月计划']) {
                plans.value['月计划'] = plans.value['月计划'].filter(t => !(t.completed && !t.isNext));
                plans.value['月计划'].forEach(t => { if (t.isNext) t.isNext = false; });
                shouldSave = true;
            }
        }

        if (shouldSave) {
            lastSyncDate.value = now.toISOString();
            return true; // 告诉系统数据变了，需要保存云端
        }
    }
    return false;
  }

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

        // 数据一落地，立刻检查需不需要启动时光传送带
        if (checkAndResetTasks()) { saveData() }
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
        agendaItems: agendaItems.value, lastSyncDate: lastSyncDate.value, tasks: tasks.value, health: health.value,
        douyinProgress: douyinProgress.value, douyinTopics: douyinTopics.value, douyinOrders: douyinOrders.value,
        youtubeSkillProgress: youtubeSkillProgress.value, youtubeProdProgress: youtubeProdProgress.value, youtubeTopics: youtubeTopics.value,
        englishShortProgress: englishShortProgress.value, englishLongProgress: englishLongProgress.value, englishBooks: englishBooks.value, englishShadowing: englishShadowing.value, collocations: collocations.value,
        japaneseProgress: japaneseProgress.value, japaneseBooks: japaneseBooks.value, jpTasks: jpTasks.value, jpVocabularies: jpVocabularies.value,
        schedules: schedules.value, plans: plans.value
      }))
      try {
        await supabase.from('my_workspace').upsert({ id: 1, data: stateToSave })
      } catch (err) {} finally { isSyncing.value = false }
    }, 2000)
  }

  watch([tasks, health, douyinProgress, douyinTopics, douyinOrders, youtubeSkillProgress, youtubeProdProgress, youtubeTopics, englishShortProgress, englishLongProgress, englishBooks, englishShadowing, collocations, japaneseProgress, japaneseBooks, jpTasks, jpVocabularies, schedules, plans], () => {
    saveData()
  }, { deep: true })

  // --- 提供给新界面的【日/周/月计划】与【日程表】操作接口 ---
  const toggleSchedule = (id) => { const item = schedules.value.find(s => s.id === id); if (item) item.completed = !item.completed }
  const addSchedule = (dateStr, title, timeNote = '') => {
    if (!title.trim()) return
    schedules.value.push({ id: 'sch-' + Date.now(), date: dateStr, timeNote: timeNote, title: title.trim(), completed: false })
  }
  const deleteSchedule = (id) => { schedules.value = schedules.value.filter(s => s.id !== id) }
  const getSchedulesForDate = (dateStr) => { return schedules.value.filter(s => s.date === dateStr) }

  const togglePlanTask = (period, id) => {
    if (!plans.value[period]) return
    const task = plans.value[period].find(t => t.id === id)
    if (task) task.completed = !task.completed
  }
  const addPlanTask = (period, title, isNext = false) => {
    if (!title.trim()) return
    if (!plans.value[period]) plans.value[period] = []
    plans.value[period].unshift({ id: 'task-' + Date.now(), title: title.trim(), completed: false, isNext: isNext })
  }
  const deletePlanTask = (period, id) => {
    if (!plans.value[period]) return
    plans.value[period] = plans.value[period].filter(t => t.id !== id)
  }
  const getPlans = (period, isNext = false) => {
    if (!plans.value[period]) return []
    return plans.value[period].filter(t => !!t.isNext === isNext) // 核心：通过 isNext 判断是今天还是明天
  }

  // --- 保持原有其它模块的老接口不变 ---
  const getTasks = (timeframe, category, isNext = false) => { return tasks.value.filter(t => t.timeframe === timeframe && t.category === category && !!t.isNext === isNext); };
  const addTask = (timeframe, category, isNext = false) => { tasks.value.unshift({ id: Date.now(), title: '新计划', category, timeframe, isNext, priority: 'p2', completed: false, isEditing: true }); };
  const addAgendaItem = (dateStr) => { agendaItems.value.push({ id: Date.now(), date: dateStr, time: '14:00', title: '新日程安排', isEditing: true }); };
  const deleteAgendaItem = (id) => agendaItems.value = agendaItems.value.filter(i => i.id !== id);
  const deleteTask = (id) => tasks.value = tasks.value.filter(t => t.id !== id)
  const cyclePriority = (task) => { if (!task.completed) task.priority = { p1: 'p2', p2: 'p3', p3: 'p4', p4: 'p1' }[task.priority] }

  const proteinTarget = computed(() => (health.value.weight * 1.8).toFixed(0))
  const addDouyinItem = (type) => { type === 'topic' ? douyinTopics.value.unshift({ id: Date.now(), title: '' }) : douyinOrders.value.unshift({ id: Date.now(), title: '' }) }
  const removeDouyinItem = (type, id) => { type === 'topic' ? douyinTopics.value = douyinTopics.value.filter(i => i.id !== id) : douyinOrders.value = douyinOrders.value.filter(i => i.id !== id) }
  const addYoutubeTopic = () => youtubeTopics.value.unshift({ id: Date.now(), title: '' })
  const removeYoutubeTopic = (id) => youtubeTopics.value = youtubeTopics.value.filter(i => i.id !== id)
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
    activeTab, activePlanPeriod,
    schedules, plans, toggleSchedule, addSchedule, deleteSchedule, getSchedulesForDate, togglePlanTask, addPlanTask, deletePlanTask, getPlans,
    lastSyncDate, checkAndResetTasks,
    isSupabaseConfigured, isSyncing, loadData,
    tasks, health, getTasks, addTask, deleteTask, cyclePriority, proteinTarget,
    agendaItems, addAgendaItem, deleteAgendaItem,
    douyinProgress, douyinTopics, douyinOrders, youtubeSkillProgress, youtubeProdProgress, youtubeTopics, addDouyinItem, removeDouyinItem, addYoutubeTopic, removeYoutubeTopic,
    englishShortProgress, englishLongProgress, englishBooks, englishShadowing, collocations, addEnglishBook, removeEnglishBook, addShadowing, removeShadowing, addCollocation, removeCollocation, reviewTasks,
    japaneseProgress, japaneseBooks, jpTasks, jpVocabularies, addJapaneseBook, removeJapaneseBook, getJpTasks, addJpTask, deleteJpTask, addJpVocab, removeJpVocab, jpReviewTasks
  }
}
