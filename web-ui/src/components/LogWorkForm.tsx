import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import { TimeEntry } from '../types'
import { X, Clock, FileText } from 'lucide-react'

interface LogWorkFormProps {
  taskId: string
  vendorId: string
  editingEntry?: TimeEntry | null
  onSubmit: () => void
  onCancel: () => void
}

const LogWorkForm = ({ taskId, vendorId, editingEntry, onSubmit, onCancel }: LogWorkFormProps) => {
  const [hours, setHours] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (editingEntry) {
      setHours(editingEntry.duration ? (editingEntry.duration / 3600).toString() : '')
      setDescription(editingEntry.description || '')
    } else {
      setHours('')
      setDescription('')
    }
  }, [editingEntry])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!hours || isNaN(Number(hours)) || Number(hours) <= 0) {
      setError('Please enter valid hours')
      setLoading(false)
      return
    }

    try {
      const durationInSeconds = Math.round(Number(hours) * 3600)
      const now = new Date().toISOString()
      const startTime = new Date(Date.now() - durationInSeconds * 1000).toISOString()

      const entryData = {
        task_id: taskId,
        vendor_id: vendorId,
        start_time: startTime,
        end_time: now,
        duration: durationInSeconds,
        description: description.trim() || null,
        updated_at: now
      }

      if (editingEntry) {
        const { error } = await supabase
          .from('time_entries')
          .update(entryData)
          .eq('id', editingEntry.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('time_entries')
          .insert([{
            ...entryData,
            created_at: now
          }])

        if (error) throw error
      }

      onSubmit()
    } catch (error) {
      console.error('Error saving time entry:', error)
      setError('Failed to save time entry. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-blue-600" />
            {editingEntry ? 'Edit Time Entry' : 'Log Work Hours'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hours Worked
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="number"
                step="0.25"
                min="0.25"
                max="24"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="pl-10 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 2.5"
                required
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Enter hours in decimal format (e.g., 1.5 for 1 hour 30 minutes)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Work Description
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="pl-10 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe what you worked on..."
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : editingEntry ? 'Update Entry' : 'Log Work'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default LogWorkForm