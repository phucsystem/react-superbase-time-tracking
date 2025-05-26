import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { Task } from '../types'
import { supabase } from '../utils/supabase'
import TaskForm from '../components/TaskForm'
import TaskList from '../components/TaskList'
import { useAuth } from '../hooks/useAuth'

const Tasks = () => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [vendorName, setVendorName] = useState<string | null>(null)
  const { user } = useAuth();

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    try {
      let vendorId: string | undefined = undefined;
      let fetchedVendorName: string | null = null;
      if (user && user.user_metadata?.role === 'vendor') {
        // Fetch vendor by user.email
        const { data: vendorData, error: vendorError } = await supabase
          .from('vendors')
          .select('id, email, name')
          .eq('email', user.email)
          .single();
        if (vendorError) throw vendorError;
        vendorId = vendorData?.id;
        fetchedVendorName = vendorData?.name || null;
      }

      setVendorName(fetchedVendorName);

      const { data, error } = await supabase
        .from('tasks')
        .select(`*, vendors(name), projects(name)`)
        .order('created_at', { ascending: false })

      if (error) throw error
      let filteredTasks = (data || []).map((task: any) => ({
        ...task,
        vendor_name: task.vendors ? task.vendors.name : undefined,
        project_name: task.projects ? task.projects.name : undefined,
      }));
      if (vendorId) {
        filteredTasks = filteredTasks.filter((task: Task & { vendor_id: string }) => task.vendor_id === vendorId);
      }
      setTasks(filteredTasks)
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddTask = () => {
    setEditingTask(null)
    setShowForm(true)
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setShowForm(true)
  }

  const handleTaskSaved = () => {
    setShowForm(false)
    setEditingTask(null)
    fetchTasks()
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (error) throw error
      fetchTasks()
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-8">Loading...</div>
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
        <button
          onClick={handleAddTask}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Task</span>
        </button>
      </div>

      {showForm && (
        <TaskForm
          task={editingTask}
          onSave={handleTaskSaved}
          onCancel={() => setShowForm(false)}
        />
      )}

      <TaskList
        tasks={tasks}
        onEdit={handleEditTask}
        onDelete={handleDeleteTask}
      />
    </div>
  )
}

export default Tasks