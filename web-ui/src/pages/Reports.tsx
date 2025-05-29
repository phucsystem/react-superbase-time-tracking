import { useState, useEffect } from 'react'
import { Calendar, Download } from 'lucide-react'
import { TimeReport, TimeEntry, Vendor, Project } from '../types'
import { supabase } from '../utils/supabase'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

const Reports = () => {
  const [reports, setReports] = useState<TimeReport[]>([])
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [dateRange, setDateRange] = useState('week')
  const [customStart, setCustomStart] = useState<string>('')
  const [customEnd, setCustomEnd] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [totalHours, setTotalHours] = useState(0)
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])

  useEffect(() => {
    fetchReports()
  }, [dateRange])

  useEffect(() => {
    fetchVendors()
  }, [])

  useEffect(() => {
    fetchProjects()
  }, [])

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
      case 'last_month': {
        const lastMonth = subMonths(now, 1)
        return {
          start: startOfMonth(lastMonth),
          end: endOfMonth(lastMonth)
        }
      }
      case 'month_before_last': {
        const beforeLast = subMonths(now, 2)
        return {
          start: startOfMonth(beforeLast),
          end: endOfMonth(beforeLast)
        }
      }
      case 'custom':
        return {
          start: customStart ? new Date(customStart) : startOfWeek(now),
          end: customEnd ? new Date(customEnd) : endOfWeek(now)
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

      const reportsArray = Object.values(groupedByTask) as TimeReport[]
      setReports(reportsArray)

      const total = reportsArray.reduce((sum, report) => sum + report.total_duration, 0)
      setTotalHours(total / 3600)
    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setLoading(false)
    }
  }

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

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('name', { ascending: true })
      if (error) throw error
      setProjects(data || [])
    } catch (error) {
      console.error('Error fetching projects:', error)
    }
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  // Filtered data
  const filteredEntries = timeEntries.filter((entry: any) => {
    const task = entry.tasks || entry.task || {};
    const projectMatch = !selectedProject ||
      (task.project_id && task.project_id === selectedProject) ||
      (task.project && task.project === selectedProject);
    const vendorMatch = !selectedVendor || task.vendor_id === selectedVendor;
    return projectMatch && vendorMatch;
  });
  const filteredReports = reports.filter((report) => {
    const task = report.task || {};
    const projectMatch = !selectedProject ||
      (task.project_id && task.project_id === selectedProject) ||
      (task.project && task.project === selectedProject);
    const vendorMatch = !selectedVendor || task.vendor_id === selectedVendor;
    return projectMatch && vendorMatch;
  });

  const exportToCsv = () => {
    const csvData = filteredEntries.map(entry => ({
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

  // Compute month before last label
  const now = new Date();
  const beforeLast = subMonths(now, 2);
  const beforeLastMonthLabel = format(beforeLast, 'MMMM yyyy');

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
            <option value="last_month">Last Month</option>
            <option value="month_before_last">{beforeLastMonthLabel}</option>
            <option value="custom">Custom Range</option>
          </select>
          {dateRange === 'custom' && (
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Start date"
                value={customStart ? new Date(customStart) : null}
                onChange={date => setCustomStart(date ? date.toISOString().slice(0, 10) : '')}
                slotProps={{ textField: { size: 'small', className: 'bg-white' } }}
              />
              <span className="mx-2">to</span>
              <DatePicker
                label="End date"
                value={customEnd ? new Date(customEnd) : null}
                onChange={date => setCustomEnd(date ? date.toISOString().slice(0, 10) : '')}
                minDate={customStart ? new Date(customStart) : undefined}
                slotProps={{ textField: { size: 'small', className: 'bg-white' } }}
              />
            </LocalizationProvider>
          )}
          <select
            value={selectedProject ?? ''}
            onChange={e => setSelectedProject(e.target.value || null)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select
            value={selectedVendor ?? ''}
            onChange={e => setSelectedVendor(e.target.value || null)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Vendors</option>
            {vendors.map(v => (
              <option key={v.id} value={v.id}>{v.name || v.id}</option>
            ))}
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
          <p className="text-3xl font-bold text-blue-600">{(filteredReports.reduce((sum, report) => sum + report.total_duration, 0) / 3600).toFixed(1)}h</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900">Total Tasks</h3>
          <p className="text-3xl font-bold text-green-600">{filteredReports.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900">Entries</h3>
          <p className="text-3xl font-bold text-purple-600">{filteredEntries.length}</p>
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
                  Vendor Name
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
              {filteredReports.map((report) => {
                const vendor = vendors.find(v => v.id === report.task.vendor_id)
                let projectName = '';
                if (report.task.project_id) {
                  const project = projects.find(p => p.id === report.task.project_id);
                  projectName = project ? project.name : '';
                } else if (report.task.project) {
                  // fallback for legacy project field (string)
                  const project = projects.find(p => p.id === report.task.project || p.name === report.task.project);
                  projectName = project ? project.name : report.task.project;
                }
                return (
                  <tr key={report.task.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {report.task.title}
                        {projectName && (
                          <span className="ml-1 mt-1 inline-block bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded font-semibold align-middle">
                            {projectName}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {vendor ? vendor.name : report.task.vendor_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDuration(report.total_duration)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {report.entries.length}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Reports