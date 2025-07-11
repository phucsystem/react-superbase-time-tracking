import { useState, useEffect } from 'react'
import { Task, TimeEntry, TimeReport, Project, Vendor } from '../types'
import { supabase } from '../utils/supabase'
import TaskList from '../components/TaskList'
import RecentEntries from '../components/RecentEntries'
import { Calendar, Download } from 'lucide-react'
import { format as formatDateFns, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, Legend, ReferenceLine } from 'recharts';

const Dashboard = () => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [recentEntries, setRecentEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [reports, setReports] = useState<TimeReport[]>([])
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [dateRange, setDateRange] = useState('week')
  const [customStart, setCustomStart] = useState<string>('')
  const [customEnd, setCustomEnd] = useState<string>('')
  const [totalHours, setTotalHours] = useState(0)
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [activeTab, setActiveTab] = useState<'entries' | 'reports' | 'costs'>('entries')

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => { fetchReports() }, [dateRange])
  useEffect(() => { fetchVendors() }, [])
  useEffect(() => { fetchProjects() }, [])

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
        .select(`*, vendors(name), projects(name)`)
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
          tasks (
            title,
            project,
            project_id,
            projects (
              name
            )
          ),
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
        .select(`*, tasks (id, title, project, project_id, vendor_id)`)
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
      Start: formatDateFns(new Date(entry.start_time), 'yyyy-MM-dd HH:mm:ss'),
      End: entry.end_time ? formatDateFns(new Date(entry.end_time), 'yyyy-MM-dd HH:mm:ss') : '',
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
    a.download = `time-report-${formatDateFns(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const now = new Date();
  const beforeLast = subMonths(now, 2);
  const beforeLastMonthLabel = formatDateFns(beforeLast, 'MMMM yyyy');
  const getWeekLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const weekStart = startOfWeek(date, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
    return `${formatDateFns(weekStart, 'MM/dd')}-${formatDateFns(weekEnd, 'MM/dd')}`;
  };
  const weekVendorMap: Record<string, Record<string, number>> = {};
  filteredEntries.forEach((entry: any) => {
    const vendorId = entry.tasks?.vendor_id || entry.tasks?.vendor;
    if (!vendorId) return;
    const week = getWeekLabel(entry.start_time);
    if (!weekVendorMap[week]) weekVendorMap[week] = {};
    weekVendorMap[week][vendorId] = (weekVendorMap[week][vendorId] || 0) + (entry.duration || 0);
  });
  const weekKeys = Object.keys(weekVendorMap).sort();
  const vendorIds = vendors.map(v => v.id);
  const vendorIdToName: Record<string, string> = Object.fromEntries(vendors.map(v => [v.id, v.name || v.id]));
  const vendorColors = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff7f50', '#a4de6c', '#d0ed57', '#8dd1e1', '#d88884', '#b0a4e3', '#e384d8',
  ];
  const vendorIdToColor: Record<string, string> = Object.fromEntries(vendorIds.map((id, idx) => [id, vendorColors[idx % vendorColors.length]]));
  const weekChartData = weekKeys.map(week => {
    const row: Record<string, any> = { week };
    vendorIds.forEach(id => {
      row[vendorIdToName[id]] = +(weekVendorMap[week][id] || 0) / 3600;
    });
    return row;
  });

  if (loading) {
    return <div className="flex justify-center py-8">Loading...</div>
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <div className="flex space-x-4 border-b mb-6">
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'entries' ? 'border-b-2 border-blue-600 text-blue-700' : 'text-gray-500'}`}
          onClick={() => setActiveTab('entries')}
        >
          Recent Time Entries
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'reports' ? 'border-b-2 border-blue-600 text-blue-700' : 'text-gray-500'}`}
          onClick={() => setActiveTab('reports')}
        >
          Reports & Analytics
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'costs' ? 'border-b-2 border-blue-600 text-blue-700' : 'text-gray-500'}`}
          onClick={() => setActiveTab('costs')}
        >
          Costs
        </button>
      </div>
      {activeTab === 'entries' && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Time Entries</h2>
          <RecentEntries entries={recentEntries} />
        </div>
      )}
      {activeTab === 'reports' && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Reports & Analytics</h2>
          <div className="flex flex-wrap gap-4 mb-6">
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
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Worklog by Vendor</h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={weekChartData} margin={{ top: 5, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
                <XAxis dataKey="week" />
                <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} domain={[0, 20]} />
                <Tooltip />
                <Legend />
                <ReferenceLine y={10} stroke="#ff0000" strokeDasharray="3 3" label={{ value: 'Target 10h', position: 'right', fill: '#ff0000', fontSize: 12 }} />
                {vendorIds.map((id, idx) => (
                  <Bar key={id} dataKey={vendorIdToName[id]} fill={vendorIdToColor[id]} barSize={30} isAnimationActive={false} />
                ))}
              </BarChart>
            </ResponsiveContainer>
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
      )}
      {activeTab === 'costs' && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Vendor Costs</h2>
          <div className="flex flex-wrap gap-4 mb-6 items-center justify-between">
            <div className="flex flex-wrap gap-4">
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
            </div>
            {/* Total Cost Display */}
            {(() => {
              const vndFormatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
              const totalCost = vendors.reduce((sum, vendor) => {
                const vendorEntries = filteredEntries.filter(e => e.vendor_id === vendor.id)
                const totalSeconds = vendorEntries.reduce((s, e) => s + (e.duration || 0), 0)
                const totalHours = totalSeconds / 3600
                const rate = vendor.rate_per_hour || 0
                return sum + totalHours * rate
              }, 0)
              return (
                <div className="ml-auto">
                  <span className="text-lg font-semibold text-gray-700 mr-2">Total Cost:</span>
                  <span className="text-2xl font-bold text-blue-700">{vndFormatter.format(totalCost)}</span>
                </div>
              )
            })()}
          </div>
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Hours</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate/Hour</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vendors.map(vendor => {
                  const vendorEntries = filteredEntries.filter(e => e.vendor_id === vendor.id)
                  const totalSeconds = vendorEntries.reduce((sum, e) => sum + (e.duration || 0), 0)
                  const totalHours = totalSeconds / 3600
                  const rate = vendor.rate_per_hour || 0
                  const cost = totalHours * rate
                  const vndFormatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
                  return (
                    <tr key={vendor.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{vendor.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{totalHours.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{vndFormatter.format(rate)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-700">{vndFormatter.format(cost)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard