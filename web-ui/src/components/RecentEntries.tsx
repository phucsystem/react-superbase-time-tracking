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
      <div className="px-6 pt-6 pb-2 border-b border-gray-200 flex text-xs font-semibold text-gray-600">
        <div className="w-1/4">Task</div>
        <div className="w-1/5">Project</div>
        <div className="w-1/5">Vendor</div>
        <div className="w-1/5">Date</div>
        <div className="w-1/6 text-right">Duration</div>
      </div>
      <div>
        {entries.map((entry, idx) => (
          <div
            key={entry.id}
            className={`flex items-center px-6 py-4 text-sm ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'} border-b last:border-b-0 border-gray-100`}
          >
            <div className="w-1/4 font-medium text-gray-900 truncate">
              {(entry as any).tasks?.title || 'Unknown Task'}
            </div>
            <div className="w-1/5 text-gray-700 truncate">
              {(entry as any).tasks?.projects?.name || (entry as any).tasks?.project || '-'}
            </div>
            <div className="w-1/5 text-gray-700 truncate">
              {(entry as any).vendors?.name || '-'}
            </div>
            <div className="w-1/5 text-gray-500">
              {format(new Date(entry.start_time), 'MMM d, yyyy')}
            </div>
            <div className="w-1/6 text-right font-semibold text-blue-700">
              {formatDuration(entry.duration)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default RecentEntries