import { useState, useEffect } from 'react'
import { Pause, Square } from 'lucide-react'
import { TimeEntry } from '../types'

interface TimerProps {
  activeEntry: TimeEntry | null
  onStop: () => void
}

const Timer = ({ activeEntry, onStop }: TimerProps) => {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (activeEntry) {
      const updateElapsed = () => {
        const now = new Date().getTime()
        const start = new Date(activeEntry.start_time).getTime()
        setElapsed(Math.floor((now - start) / 1000))
      }

      updateElapsed()
      interval = setInterval(updateElapsed, 1000)
    } else {
      setElapsed(0)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [activeEntry])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (!activeEntry) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="text-4xl font-mono text-gray-400 mb-4">00:00:00</div>
        <p className="text-gray-500">No active timer. Start a timer from a task to begin tracking time.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {(activeEntry as any).tasks?.title || 'Unknown Task'}
          </h3>
          {(activeEntry as any).tasks?.project && (
            <p className="text-sm text-gray-500">
              Project: {(activeEntry as any).tasks.project}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-4xl font-mono text-blue-600">
            {formatTime(elapsed)}
          </div>
          <button
            onClick={onStop}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center space-x-2"
          >
            <Square className="h-4 w-4" />
            <span>Stop</span>
          </button>
        </div>
      </div>
      <div className="mt-4 bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
          style={{ width: `${Math.min((elapsed % 3600) / 36, 100)}%` }}
        />
      </div>
    </div>
  )
}

export default Timer