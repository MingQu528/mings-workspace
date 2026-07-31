import { ref, computed, watch } from 'vue'
import { supabase } from '../lib/supabase'

// Global State
const isSupabaseConfigured = ref(true)
const isSyncing = ref(false)

const tasks = ref([])
const health = ref({ weight: 0, targetWeight: 0, bodyFat: 0, cycle_phase: 'follicular' })

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

export function useWorkspace() {
  const loadData = async () => {
    if (!supabase) { isSupabaseConfigured.value = false; return; }
    isSyncing.value = true
    try {
      const { data, error } = await supabase.from('my_workspace').select('data').eq('id', 1).single()
      if (data && data.data) {
        const d = data.data
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
      
      // FIX: Strip Vue Proxies before sending to Supabase
      const stateToSave = JSON.parse(JSON.stringify({
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
        jpVocabularies: jpVocabularies.value
      }))

      try {
        const { error } = await supabase.from('my_workspace').upsert({ id: 1, data: stateToSave })
        
        // FIX: Alert if Supabase rejects the save (e.g., Row Level Security issues)
        if (error) {
          console.error("Supabase 写入失败:", error.message)
          alert("数据库同步失败: " + error.message)
        }
      } catch (err) {
        console.error("Unexpected Save Error:", err)
      } finally {
        isSyncing.value = false
      }
    }, 2000)
  }

  // Auto-save when ANY data changes
  watch([tasks, health, douyinProgress, douyinTopics, douyinOrders, youtubeSkillProgress, youtubeProdProgress, youtubeTopics, englishShortProgress, englishLongProgress, englishBooks, englishShadowing, collocations, japaneseProgress, japaneseBooks, jpTasks, jpVocabularies], () => {
    saveData()
  }, { deep: true })

  // --- Tasks Logic ---
  const getTasks = (timeframe, category) => tasks.value.filter(t => t.timeframe === timeframe && t.category === category)
  const addTask = (timeframe, category) => tasks.value.unshift({ id: Date.now(), title: '新任务', category, timeframe, priority: 'p2', completed: false, isEditing: true })
  const deleteTask = (id) => tasks.value = tasks.value.filter(t => t.id !== id)
  const cyclePriority = (task) => { if (!task.completed) task.priority = { p1: 'p2', p2: 'p3', p3: 'p4', p4: 'p1' }[task.priority] }

  // --- Health Logic ---
  const proteinTarget = computed(() => (health.value.weight * 1.8).toFixed(0))

  // --- Video Logic ---
  const addDouyinItem = (type) => { type === 'topic' ? douyinTopics.value.unshift({ id: Date.now(), title: '' }) : douyinOrders.value.unshift({ id: Date.now(), title: '' }) }
  const removeDouyinItem = (type, id) => { type === 'topic' ? douyinTopics.value = douyinTopics.value.filter(i => i.id !== id) : douyinOrders.value = douyinOrders.value.filter(i => i.id !== id) }
  const addYoutubeTopic = () => youtubeTopics.value.unshift({ id: Date.now(), title: '' })
  const removeYoutubeTopic = (id) => youtubeTopics.value = youtubeTopics.value.filter(i => i.id !== id)

  // --- English Logic ---
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
      if ([1, 2, 4, 7, 15, 30].includes(Math.ceil(Math.abs(today - d) / 86400000))) list.push(...g.items.map(i => ({ ...i, fromDate: g.date })))
    })
    return list
  })

  // --- Japanese Logic ---
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
      if ([1, 2, 4, 7, 15, 30].includes(Math.ceil(Math.abs(today - d) / 86400000))) list.push(...g.items.map(i => ({ ...i, fromDate: g.date })))
    })
    return list
  })

  return {
    isSupabaseConfigured, isSyncing, loadData,
    tasks, health, getTasks, addTask, deleteTask, cyclePriority, proteinTarget,
    douyinProgress, douyinTopics, douyinOrders, youtubeSkillProgress, youtubeProdProgress, youtubeTopics, addDouyinItem, removeDouyinItem, addYoutubeTopic, removeYoutubeTopic,
    englishShortProgress, englishLongProgress, englishBooks, englishShadowing, collocations, addEnglishBook, removeEnglishBook, addShadowing, removeShadowing, addCollocation, removeCollocation, reviewTasks,
    japaneseProgress, japaneseBooks, jpTasks, jpVocabularies, addJapaneseBook, removeJapaneseBook, getJpTasks, addJpTask, deleteJpTask, addJpVocab, removeJpVocab, jpReviewTasks
  }
}