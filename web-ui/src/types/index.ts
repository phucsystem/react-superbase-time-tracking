export interface Project {
  id: string
  name: string
  client_name: string
  status: 'active' | 'inactive'
  description?: string
  created_at: string
  updated_at: string
}

export interface Vendor {
  id: string
  name: string
  email: string
  rate_per_hour?: number
  created_at: string
  updated_at: string
  projects?: Project[]
}

export interface VendorProject {
  id: string
  vendor_id: string
  project_id: string
  created_at: string
}

export interface Task {
  id: string
  title: string
  description?: string
  project?: string // legacy field
  project_id?: string
  vendor_id: string
  created_at: string
  updated_at: string
  projects?: Project
}

export interface TimeEntry {
  id: string
  task_id: string
  vendor_id: string
  start_time: string
  end_time?: string
  duration?: number
  description?: string
  created_at: string
  updated_at: string
  worked_date?: string
}

export interface TimeReport {
  task: Task
  total_duration: number
  entries: TimeEntry[]
}