import { useState, useEffect } from 'react'
import { Task, TimeEntry } from '../types'
import { supabase } from '../utils/supabase'
import TaskList from '../components/TaskList'
import RecentEntries from '../components/RecentEntries'

const Dashboard = () => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [recentEntries, setRecentEntries] = useState<TimeEntry[]>([])
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchActiveEntry, 1000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      await Promise.all([
        fetchTasks(),
        fetchRecentEntries(),
        fetchActiveEntry()
      ])
    } finally {
      setLoading(false)
    }
  }

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) throw error
      setTasks(data || [])
    } catch (error) {
      console.error('Error fetching tasks:', error)
    }
  }

  const fetchRecentEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('time_entries')
        .select(`
          *,
          tasks (title, project)
        `)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setRecentEntries(data || [])
    } catch (error) {
      console.error('Error fetching recent entries:', error)
    }
  }

  const fetchActiveEntry = async () => {
    try {
      const { data, error } = await supabase
        .from('time_entries')
        .select(`
          *,
          tasks (title, project)
        `)
        .is('end_time', null)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      setActiveEntry(data || null)
    } catch (error) {
      console.error('Error fetching active entry:', error)
    }
  }

  const startTimer = async (task: Task) => {
    try {
      if (activeEntry) {
        await stopTimer()
      }

      const { data, error } = await supabase
        .from('time_entries')
        .insert([
          {
            task_id: task.id,
            vendor_id: task.vendor_id,
            start_time: new Date().toISOString(),
          }
        ])
        .select(`
          *,
          tasks (title, project)
        `)
        .single()

      if (error) throw error
      setActiveEntry(data)
    } catch (error) {
      console.error('Error starting timer:', error)
    }
  }

  const stopTimer = async () => {
    if (!activeEntry) return

    try {
      const endTime = new Date()
      const duration = Math.floor((endTime.getTime() - new Date(activeEntry.start_time).getTime()) / 1000)

      const { error } = await supabase
        .from('time_entries')
        .update({
          end_time: endTime.toISOString(),
          duration: duration
        })
        .eq('id', activeEntry.id)

      if (error) throw error
      setActiveEntry(null)
      fetchRecentEntries()
    } catch (error) {
      console.error('Error stopping timer:', error)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-8">Loading...</div>
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Tasks</h2>
          <TaskList
            tasks={tasks}
            onEdit={() => {}}
            onDelete={() => {}}
            onStartTimer={startTimer}
          />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Time Entries</h2>
          <RecentEntries entries={recentEntries} />
        </div>
      </div>
    </div>
  )
}

export default Dashboard