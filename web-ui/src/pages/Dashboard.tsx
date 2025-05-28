import { useState, useEffect } from 'react'
import { Task, TimeEntry } from '../types'
import { supabase } from '../utils/supabase'
import TaskList from '../components/TaskList'
import RecentEntries from '../components/RecentEntries'

const Dashboard = () => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [recentEntries, setRecentEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      await Promise.all([
        fetchTasks(),
        fetchRecentEntries(),
      ])
    } finally {
      setLoading(false)
    }
  }

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`*, vendors(name)`)
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
          tasks (title, project),
          vendors (name)
        `)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setRecentEntries(data || [])
    } catch (error) {
      console.error('Error fetching recent entries:', error)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-8">Loading...</div>
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Time Entries</h2>
          <RecentEntries entries={recentEntries} />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Tasks</h2>
          <TaskList
            tasks={tasks}
            onEdit={() => {}}
            onDelete={() => {}}
          />
        </div>
      </div>
    </div>
  )
}

export default Dashboard