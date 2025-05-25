import { format } from 'date-fns'
import { TimeEntry } from '../types'

interface RecentEntriesProps {
  entries: TimeEntry[]
}

const RecentEntries = ({ entries }: RecentEntriesProps) => {
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'Running...'
    
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
        No time entries yet.
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="divide-y divide-gray-200">
        {entries.map((entry) => (
          <div key={entry.id} className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900">
                  {(entry as any).tasks?.title || 'Unknown Task'}
                </h4>
                {(entry as any).tasks?.project && (
                  <p className="text-xs text-gray-500">
                    {(entry as any).tasks.project}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {format(new Date(entry.start_time), 'MMM d, h:mm a')}
                  {entry.end_time && ` - ${format(new Date(entry.end_time), 'h:mm a')}`}
                </p>
              </div>
              <div className="text-sm font-medium text-gray-900">
                {formatDuration(entry.duration)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default RecentEntries