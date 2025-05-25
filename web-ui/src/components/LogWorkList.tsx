import { TimeEntry } from '../types'
import { Edit2, Trash2, Clock, Calendar } from 'lucide-react'
import { format } from 'date-fns'

interface LogWorkListProps {
  timeEntries: TimeEntry[]
  onEdit: (entry: TimeEntry) => void
  onDelete: (entryId: string) => void
}

const LogWorkList = ({ timeEntries, onEdit, onDelete }: LogWorkListProps) => {
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours === 0) {
      return `${minutes}m`
    } else if (minutes === 0) {
      return `${hours}h`
    } else {
      return `${hours}h ${minutes}m`
    }
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy')
  }

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'HH:mm')
  }

  if (timeEntries.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No time entries logged yet</p>
        <p className="text-sm text-gray-400">Start by logging work on your assigned tasks</p>
      </div>
    )
  }

  return (
    <div className="space-y-3 overflow-y-auto max-h-screen">
      {timeEntries.map(entry => (
        <div key={entry.id} className="border border-gray-200 rounded-lg p-4 bg-white">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {formatDate(entry.created_at)}
                </span>
                {entry.start_time && entry.end_time && (
                  <>
                    <span className="text-gray-400">•</span>
                    <span className="text-sm text-gray-600">
                      {formatTime(entry.start_time)} - {formatTime(entry.end_time)}
                    </span>
                  </>
                )}
              </div>
              
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-gray-900">
                  {entry.duration ? formatDuration(entry.duration) : 'No duration'}
                </span>
              </div>

              {(entry as any).tasks && (
                <div className="mb-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {(entry as any).tasks.title}
                  </span>
                  {(entry as any).tasks.projects && (
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {(entry as any).tasks.projects.name}
                    </span>
                  )}
                </div>
              )}

              {entry.description && (
                <p className="text-sm text-gray-600 mt-2">{entry.description}</p>
              )}
            </div>

            <div className="flex space-x-2 ml-4">
              <button
                onClick={() => onEdit(entry)}
                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                title="Edit entry"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDelete(entry.id)}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                title="Delete entry"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default LogWorkList