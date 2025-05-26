import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import { Task, TimeEntry, Vendor } from '../types'
import LogWorkForm from '../components/LogWorkForm'
import LogWorkList from '../components/LogWorkList'
import { Calendar, Clock, User } from 'lucide-react'

const LogWork = () => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [selectedVendorId, setSelectedVendorId] = useState<string>('')
  const [selectedTaskId, setSelectedTaskId] = useState<string>('')
  const [showLogForm, setShowLogForm] = useState(false)
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchVendors()
    fetchTasks()
  }, [])

  const getVendorTasks = () => {
    return selectedVendorId 
      ? tasks.filter(task => task.vendor_id === selectedVendorId)
      : []
  }

  useEffect(() => {
    if (selectedVendorId) {
      const vendorTasks = getVendorTasks()
      if (vendorTasks.length > 0 && !selectedTaskId) {
        setSelectedTaskId(vendorTasks[0].id)
      }
      fetchTimeEntries()
    }
  }, [selectedVendorId, tasks])

  useEffect(() => {
    if (selectedTaskId) {
      fetchTimeEntries()
    }
  }, [selectedTaskId])

  const fetchVendors = async () => {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      setVendors(data || [])
    } catch (error) {
      console.error('Error fetching vendors:', error)
    }
  }

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          projects:project_id (
            id,
            name,
            client_name
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTasks(data || [])
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTimeEntries = async () => {
    if (!selectedVendorId || !selectedTaskId) return

    try {
      const { data, error } = await supabase
        .from('time_entries')
        .select(`
          *,
          tasks (
            id,
            title,
            projects:project_id (
              name,
              client_name
            )
          )
        `)
        .eq('vendor_id', selectedVendorId)
        .eq('task_id', selectedTaskId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTimeEntries(data || [])
    } catch (error) {
      console.error('Error fetching time entries:', error)
    }
  }

  const handleSelectTask = (taskId: string) => {
    setSelectedTaskId(taskId)
  }

  const handleLogWork = (taskId: string) => {
    setSelectedTaskId(taskId)
    setShowLogForm(true)
    setEditingEntry(null)
  }

  const handleEditEntry = (entry: TimeEntry) => {
    setEditingEntry(entry)
    setSelectedTaskId(entry.task_id)
    setShowLogForm(true)
  }

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this time entry?')) return

    try {
      const { error } = await supabase
        .from('time_entries')
        .delete()
        .eq('id', entryId)

      if (error) throw error
      await fetchTimeEntries()
    } catch (error) {
      console.error('Error deleting time entry:', error)
    }
  }

  const handleFormSubmit = async () => {
    setShowLogForm(false)
    setEditingEntry(null)
    await fetchTimeEntries()
  }

  const vendorsWithTasks = vendors.filter(vendor => 
    tasks.some(task => task.vendor_id === vendor.id)
  )

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Clock className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">My Log Work</h1>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Vendor
          </label>
          <select
            value={selectedVendorId}
            onChange={(e) => setSelectedVendorId(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Choose a vendor...</option>
            {vendors.map(vendor => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.name}
              </option>
            ))}
          </select>
        </div>

        {selectedVendorId && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2 text-blue-600" />
                Assigned Tasks
              </h2>
              <div className="space-y-3">
                {getVendorTasks().map(task => (
                  <div 
                    key={task.id} 
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedTaskId === task.id 
                        ? 'border-blue-500 bg-blue-50 shadow-md' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleSelectTask(task.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className={`font-medium ${
                          selectedTaskId === task.id ? 'text-blue-900' : 'text-gray-900'
                        }`}>
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className={`text-sm mt-1 ${
                            selectedTaskId === task.id ? 'text-blue-700' : 'text-gray-600'
                          }`}>
                            {task.description}
                          </p>
                        )}
                        {task.projects && (
                          <div className="mt-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {task.projects.name} - {task.projects.client_name}
                            </span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleLogWork(task.id)
                        }}
                        className="ml-4 px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Log Work
                      </button>
                    </div>
                  </div>
                ))}
                {getVendorTasks().length === 0 && (
                  <p className="text-gray-500 text-center py-8">No tasks assigned to this vendor</p>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                Time Entries
                {selectedTaskId && (
                  <span className="ml-2 text-sm font-normal text-gray-600">
                    for {getVendorTasks().find(t => t.id === selectedTaskId)?.title || 'Selected Task'}
                  </span>
                )}
              </h2>
              <LogWorkList
                timeEntries={timeEntries}
                onEdit={handleEditEntry}
                onDelete={handleDeleteEntry}
              />
            </div>
          </div>
        )}
      </div>

      {showLogForm && (
        <LogWorkForm
          taskId={selectedTaskId}
          vendorId={selectedVendorId}
          editingEntry={editingEntry}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowLogForm(false)
            setEditingEntry(null)
          }}
        />
      )}
    </div>
  )
}

export default LogWork