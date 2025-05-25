import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { Vendor } from '../types'
import { supabase } from '../utils/supabase'
import VendorForm from '../components/VendorForm'
import VendorList from '../components/VendorList'

const Vendors = () => {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchVendors()
  }, [])

  const fetchVendors = async () => {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select(`
          *,
          vendor_projects (
            projects (*)
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Transform the data to include projects array
      const vendorsWithProjects = data?.map(vendor => ({
        ...vendor,
        projects: vendor.vendor_projects?.map((vp: any) => vp.projects) || []
      })) || []
      
      setVendors(vendorsWithProjects)
    } catch (error) {
      console.error('Error fetching vendors:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddVendor = () => {
    setEditingVendor(null)
    setShowForm(true)
  }

  const handleEditVendor = (vendor: Vendor) => {
    setEditingVendor(vendor)
    setShowForm(true)
  }

  const handleVendorSaved = () => {
    setShowForm(false)
    setEditingVendor(null)
    fetchVendors()
  }

  const handleDeleteVendor = async (vendorId: string) => {
    if (!confirm('Are you sure you want to delete this vendor? This will also delete all associated tasks and time entries.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('vendors')
        .delete()
        .eq('id', vendorId)

      if (error) throw error
      fetchVendors()
    } catch (error) {
      console.error('Error deleting vendor:', error)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-8">Loading...</div>
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
        <button
          onClick={handleAddVendor}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Vendor</span>
        </button>
      </div>

      {showForm && (
        <VendorForm
          vendor={editingVendor}
          onSave={handleVendorSaved}
          onCancel={() => setShowForm(false)}
        />
      )}

      <VendorList
        vendors={vendors}
        onEdit={handleEditVendor}
        onDelete={handleDeleteVendor}
      />
    </div>
  )
}

export default Vendors