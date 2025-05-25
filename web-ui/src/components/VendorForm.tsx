import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Vendor, Project } from '../types'
import { supabase } from '../utils/supabase'

interface VendorFormProps {
  vendor?: Vendor | null
  onSave: () => void
  onCancel: () => void
}

const VendorForm = ({ vendor, onSave, onCancel }: VendorFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    rate_per_hour: '',
  })
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [availableProjects, setAvailableProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchProjects()
    if (vendor) {
      setFormData({
        name: vendor.name,
        email: vendor.email,
        rate_per_hour: vendor.rate_per_hour?.toString() || '',
      })
      setSelectedProjects(vendor.projects?.map(p => p.id) || [])
    }
  }, [vendor])

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('status', 'active')
        .order('name')

      if (error) throw error
      setAvailableProjects(data || [])
    } catch (error) {
      console.error('Error fetching projects:', error)
    }
  }

  const handleProjectToggle = (projectId: string) => {
    setSelectedProjects(prev => 
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const vendorData = {
        name: formData.name,
        email: formData.email,
        rate_per_hour: formData.rate_per_hour ? parseFloat(formData.rate_per_hour) : null,
      }

      let vendorId: string

      if (vendor) {
        // Update existing vendor
        const { error } = await supabase
          .from('vendors')
          .update(vendorData)
          .eq('id', vendor.id)

        if (error) throw error
        vendorId = vendor.id
      } else {
        // Create new vendor
        const { data, error } = await supabase
          .from('vendors')
          .insert([vendorData])
          .select()
          .single()

        if (error) throw error
        vendorId = data.id
      }

      // Update vendor-project relationships
      if (vendor) {
        // Delete existing relationships
        await supabase
          .from('vendor_projects')
          .delete()
          .eq('vendor_id', vendorId)
      }

      // Insert new relationships
      if (selectedProjects.length > 0) {
        const relationships = selectedProjects.map(projectId => ({
          vendor_id: vendorId,
          project_id: projectId
        }))

        const { error: relationshipError } = await supabase
          .from('vendor_projects')
          .insert(relationships)

        if (relationshipError) throw relationshipError
      }

      onSave()
    } catch (error) {
      console.error('Error saving vendor:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">
            {vendor ? 'Edit Vendor' : 'Add New Vendor'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rate per Hour ($)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.rate_per_hour}
              onChange={(e) => setFormData({ ...formData, rate_per_hour: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assigned Projects
            </label>
            <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2">
              {availableProjects.length === 0 ? (
                <p className="text-gray-500 text-sm">No active projects available</p>
              ) : (
                <div className="space-y-2">
                  {availableProjects.map((project) => (
                    <label key={project.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedProjects.includes(project.id)}
                        onChange={() => handleProjectToggle(project.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">
                        {project.name} ({project.client_name})
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default VendorForm