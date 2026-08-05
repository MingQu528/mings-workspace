import { ref, computed, watch } from 'vue'
import { supabase } from '../lib/supabase'

const isSupabaseConfigured = ref(true)
const isSyncing = ref(false)
const tasks = ref([])

// 🩺 升级后的健康与身体指标状态（支持历史趋势与多维围度）
const health = ref({
  height: 165, // 身高 (cm)
  weight: 62.6, // 当前体重
  targetWeight: 58, // 目标体重
  bodyFat: 29, // 当前体脂率
  targetBodyFat: 26, // 目标体脂率
  measurements: { waist: '', hips: '', thigh: '' }, // 围度
  history: [
    { id: 1, date: '2026-07-18', weight: 62.6, bodyFat: 29, waist: '', hips: '' },
    { id: 2, date: '2026-08-01', weight: 62.2, bodyFat: 28.5, waist: '', hips: '' }
  ]
})

// 🏋️‍♀️ 内置的科学抗阻训练计划 (Week A & Week B 双周循环)
const workoutPlans = ref({
  'Week A': [
    {
      day: 'Day 1: 上肢 A1 (推为主)',
      focus: '上胸 / 背阔肌宽度 / 三角肌中束',
      exercises: [
        { name: '上斜哑铃卧推', weight: '20kg (总重/单只按习惯)', sets: '3组 × 8-10次', rir: 'RIR 1-2' },
        { name: '胸支撑划船 / 坐姿划船', weight: '27kg', sets: '3组 × 10-12次', rir: '保护下背部' },
        { name: '高位下拉', weight: '30kg', sets: '3组 × 10-12次', rir: '拉宽背阔肌' },
        { name: '哑铃推肩', weight: '8kg', sets: '3组 × 8-10次', rir: '核心收紧' },
        { name: '缆绳侧平举', weight: '轻重量', sets: '3组 × 12-15次', rir: '全程恒定张力' },
        { name: '二头/三头超级组', weight: '自选', sets: '各 3组 × 12次', rir: '手臂线条雕刻' }
      ]
    },
    {
      day: 'Day 2: 下肢 A1 (臀与后侧链)',
      focus: '臀大肌 / 腘绳肌 (扁平足友好)',
      exercises: [
        { name: '杠铃臀推', weight: '80kg', sets: '3组 × 8-10次', rir: '核心王牌动作' },
        { name: '罗马尼亚硬拉', weight: '40kg', sets: '3组 × 8-10次', rir: '平底鞋发力防足弓塌陷' },
        { name: '坐姿腿弯举 (固定器械)', weight: '固定器械', sets: '3组 × 10-12次', rir: '零足部压力' },
        { name: '斜向腿压板 (高脚位)', weight: '中等', sets: '3组 × 10-12次', rir: '主攻臀大肌' },
        { name: '死虫式核心训练', weight: '自重', sets: '3组 × 每侧10次', rir: '核心稳定' }
      ]
    },
    {
      day: 'Day 3: 上肢 A2 (拉与厚度雕刻)',
      focus: '胸肌下沿 / 中背部厚度 / 肩后束',
      exercises: [
        { name: '平板哑铃卧推 / 机器推胸', weight: '自选', sets: '3组 × 8-10次', rir: '长行程刺激' },
        { name: '单臂哑铃划船', weight: '自选', sets: '3组 × 8-12次/侧', rir: '单侧深度雕刻' },
        { name: '反握高位下拉', weight: '30kg', sets: '3组 × 10-12次', rir: '更多动用二头' },
        { name: '哑铃侧平举', weight: '小重量', sets: '3组 × 12-15次', rir: '三角肌中束' },
        { name: '缆绳夹胸 / 飞鸟', weight: '轻重量', sets: '3组 × 12-15次', rir: '伸展顶点拉伸' },
        { name: '俯身哑铃飞鸟', weight: '小重量', sets: '3组 × 15次', rir: '改善圆肩驼背' }
      ]
    },
    {
      day: 'Day 4: 下肢 A2 (前侧大腿与单侧)',
      focus: '股四头肌 / 单侧平衡',
      exercises: [
        { name: '哈克深蹲 或 坐姿腿屈伸', weight: '机器', sets: '3组 × 10-12次', rir: '对扁平足绝对安全' },
        { name: '保加利亚分腿蹲', weight: '轻哑铃/徒手', sets: '3组 × 8-10次/侧', rir: '雕刻线条' },
        { name: '俯卧腿弯举', weight: '机器', sets: '3组 × 12次', rir: '腘绳肌孤立' },
        { name: '45度山羊挺身 (圆背主攻臀)', weight: '自重/轻铃', sets: '3组 × 12-15次', rir: '臀部发力拉起' },
        { name: '平板支撑', weight: '自重', sets: '3组 × 45秒', rir: '核心强化' }
      ]
    }
  ],
  'Week B': [
    {
      day: 'Day 1: 上肢 B1 (变式推与厚度)',
      focus: '自由重量平衡 / 中背部 / 手臂',
      exercises: [
        { name: '平板哑铃卧推', weight: '自选', sets: '3组 × 8-10次', rir: '锻炼核心平衡' },
        { name: '窄距坐姿划船 (V把)', weight: '27kg', sets: '3组 × 10-12次', rir: '刺激中背部厚度' },
        { name: '直臂下压', weight: '轻重量', sets: '3组 × 12-15次', rir: '孤立背阔肌' },
        { name: '坐姿哑铃推肩 (靠椅背)', weight: '8kg', sets: '3组 × 8-10次', rir: '保护腰椎' },
        { name: '哑铃侧平举', weight: '小重量', sets: '3组 × 12-15次', rir: '中束持续刺激' },
        { name: '哑铃交替二头弯举', weight: '自选', sets: '3组 × 12次', rir: '手臂线条' }
      ]
    },
    {
      day: 'Day 2: 下肢 B1 (髋关节主导)',
      focus: '臀桥变式 / 高脚杯深蹲',
      exercises: [
        { name: '杠铃/壶铃高位臀桥', weight: '自选', sets: '3组 × 10-12次', rir: '改变发力行程' },
        { name: '哑铃罗马尼亚硬拉', weight: '灵活重量', sets: '3组 × 10-12次', rir: '灵活度更高' },
        { name: '单腿坐姿腿弯举', weight: '单侧', sets: '3组 × 10次/侧', rir: '排查两侧不平衡' },
        { name: '高脚杯深蹲 (抱哑铃)', weight: '轻哑铃', sets: '3组 × 10-12次', rir: '重心靠后,扁平足友好' },
        { name: '鸟狗式核心训练', weight: '自重', sets: '3组 × 每侧10次', rir: '核心稳定性' }
      ]
    },
    {
      day: 'Day 3: 上肢 B2 (夹胸与背宽度变式)',
      focus: '上斜推胸 / 宽握下拉 / 三角肌后束',
      exercises: [
        { name: '上斜机器推胸', weight: '中等', sets: '3组 × 8-10次', rir: '安全高效' },
        { name: 'T杠划船 或 杠铃划船', weight: '控制重量', sets: '3组 × 8-10次', rir: '背部整体厚度' },
        { name: '宽握高位下拉', weight: '30kg', sets: '3组 × 10-12次', rir: '强化背阔肌外侧' },
        { name: '蝴蝶机夹胸', weight: '固定器械', sets: '3组 × 12-15次', rir: '纯粹胸部孤立' },
        { name: '面拉 (Face Pull)', weight: '缆绳', sets: '3组 × 15次', rir: '三角肌后束与体态黄金动作' }
      ]
    },
    {
      day: 'Day 4: 下肢 B2 (股四头肌孤立与单侧)',
      focus: '大腿前侧燃烧 / 反向弓步',
      exercises: [
        { name: '坐姿腿屈伸', weight: '机器', sets: '3组 × 12-15次', rir: '股四头肌孤立燃烧' },
        { name: '单腿腿压板', weight: '单侧', sets: '3组 × 10次/侧', rir: '单侧突破' },
        { name: '仰卧双腿腿弯举', weight: '器械', sets: '3组 × 12次', rir: '后侧链强化' },
        { name: '反向弓步蹲 (护膝足弓)', weight: '徒手/轻铃', sets: '3组 × 每侧10次', rir: '对膝盖和足弓更友好' },
        { name: '侧支撑', weight: '自重', sets: '3组 × 每侧30-45秒', rir: '侧腹与稳定性' }
      ]
    }
  ]
})

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

const schedules = ref([
  {
    id: 'sch-initial',
    date: '2026-08-06',
    timeNote: '14:00 (北京时间)',
    title: '和森下开线上会议',
    completed: false
  }
])

const plans = ref({
  '日计划': [],
  '周计划': [],
  '月计划': []
})

export function useWorkspace() {
  // ✨ 添加身体指标历史记录的方法
  const addHealthRecord = () => {
    const today = new Date().toISOString().split('T')[0]
    // 避免同一天重复添加多条，直接更新或新增
    const existing = health.value.history.find(h => h.date === today)
    if (existing) {
      existing.weight = health.value.weight
      existing.bodyFat = health.value.bodyFat
      existing.waist = health.value.measurements.waist
      existing.hips = health.value.measurements.hips
    } else {
      health.value.history.push({
        id: Date.now(),
        date: today,
        weight: health.value.weight,
        bodyFat: health.value.bodyFat,
        waist: health.value.measurements.waist,
        hips: health.value.measurements.hips
      })
    }
    saveData()
  }

  // ✨ [核心魔法] 午夜清零与时光胶囊传送带
  const checkAndResetTasks = () => {
    if (!lastSyncDate.value) return false;
    const last = new Date(lastSyncDate.value);
    const now = new Date();

    const lastDay = new Date(last.getFullYear(), last.getMonth(), last.getDate());
    const currentDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (currentDay > lastDay) {
        let shouldSave = false;

        if (plans.value['日计划']) {
            plans.value['日计划'] = plans.value['日计划'].filter(t => !(t.completed && !t.isNext));
            plans.value['日计划'].forEach(t => { if (t.isNext) t.isNext = false; });
            shouldSave = true;
        }

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

        if (currentDay.getMonth() !== lastDay.getMonth() || currentDay.getFullYear() !== lastDay.getFullYear()) {
            if (plans.value['月计划']) {
                plans.value['月计划'] = plans.value['月计划'].filter(t => !(t.completed && !t.isNext));
                plans.value['月计划'].forEach(t => { if (t.isNext) t.isNext = false; });
                shouldSave = true;
            }
        }

        if (shouldSave) {
            lastSyncDate.value = now.toISOString();
            return true;
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
    return plans.value[period].filter(t => !!t.isNext === isNext)
  }

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
    tasks, health, addHealthRecord, workoutPlans, getTasks, addTask, deleteTask, cyclePriority, proteinTarget,
    agendaItems, addAgendaItem, deleteAgendaItem,
    douyinProgress, douyinTopics, douyinOrders, youtubeSkillProgress, youtubeProdProgress, youtubeTopics, addDouyinItem, removeDouyinItem, addYoutubeTopic, removeYoutubeTopic,
    englishShortProgress, englishLongProgress, englishBooks, englishShadowing, collocations, addEnglishBook, removeEnglishBook, addShadowing, removeShadowing, addCollocation, removeCollocation, reviewTasks,
    japaneseProgress, japaneseBooks, jpTasks, jpVocabularies, addJapaneseBook, removeJapaneseBook, getJpTasks, addJpTask, deleteJpTask, addJpVocab, removeJpVocab, jpReviewTasks
  }
}
