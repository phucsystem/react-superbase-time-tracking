import { useState, useEffect } from 'react'
import { Calendar, Download } from 'lucide-react'
import { TimeReport, TimeEntry } from '../types'
import { supabase } from '../utils/supabase'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'

const Reports = () => {
  const [reports, setReports] = useState<TimeReport[]>([])
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [dateRange, setDateRange] = useState('week')
  const [loading, setLoading] = useState(true)
  const [totalHours, setTotalHours] = useState(0)

  useEffect(() => {
    fetchReports()
  }, [dateRange])

  const getDateRange = () => {
    const now = new Date()
    switch (dateRange) {
      case 'week':
        return {
          start: startOfWeek(now),
          end: endOfWeek(now)
        }
      case 'month':
        return {
          start: startOfMonth(now),
          end: endOfMonth(now)
        }
      default:
        return {
          start: startOfWeek(now),
          end: endOfWeek(now)
        }
    }
  }

  const fetchReports = async () => {
    try {
      const { start, end } = getDateRange()
      
      const { data: entries, error } = await supabase
        .from('time_entries')
        .select(`
          *,
          tasks (
            id,
            title,
            project,
            vendor_id
          )
        `)
        .gte('start_time', start.toISOString())
        .lte('start_time', end.toISOString())
        .not('duration', 'is', null)
        .order('start_time', { ascending: false })

      if (error) throw error

      setTimeEntries(entries || [])

      const groupedByTask = (entries || []).reduce((acc, entry) => {
        const taskId = entry.task_id
        if (!acc[taskId]) {
          acc[taskId] = {
            task: (entry as any).tasks,
            total_duration: 0,
            entries: []
          }
        }
        acc[taskId].total_duration += entry.duration || 0
        acc[taskId].entries.push(entry)
        return acc
      }, {} as Record<string, TimeReport>)

      const reportsArray = Object.values(groupedByTask)
      setReports(reportsArray)

      const total = reportsArray.reduce((sum, report) => sum + report.total_duration, 0)
      setTotalHours(total / 3600)
    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  const exportToCsv = () => {
    const csvData = timeEntries.map(entry => ({
      Task: (entry as any).tasks?.title || 'Unknown',
      Project: (entry as any).tasks?.project || '',
      Start: format(new Date(entry.start_time), 'yyyy-MM-dd HH:mm:ss'),
      End: entry.end_time ? format(new Date(entry.end_time), 'yyyy-MM-dd HH:mm:ss') : '',
      Duration: entry.duration ? formatDuration(entry.duration) : '',
      Description: entry.description || ''
    }))

    const headers = Object.keys(csvData[0] || {})
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `time-report-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return <div className="flex justify-center py-8">Loading...</div>
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <div className="flex space-x-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          <button
            onClick={exportToCsv}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900">Total Hours</h3>
          <p className="text-3xl font-bold text-blue-600">{totalHours.toFixed(1)}h</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900">Total Tasks</h3>
          <p className="text-3xl font-bold text-green-600">{reports.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900">Entries</h3>
          <p className="text-3xl font-bold text-purple-600">{timeEntries.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Time by Task</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Task
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entries
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reports.map((report) => (
                <tr key={report.task.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {report.task.title}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {report.task.project || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDuration(report.total_duration)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {report.entries.length}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Reports