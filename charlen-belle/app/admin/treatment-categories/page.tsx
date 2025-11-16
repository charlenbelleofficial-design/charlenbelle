'use client';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

type Category = { 
  _id: string; 
  name: string; 
  description?: string; 
  is_active?: boolean; 
};

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => { 
    fetchCategories(); 
  }, []);

  async function fetchCategories() {
    setLoading(true);
    try {
      const res = await fetch('/api/treatment-categories');
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories || []);
      } else {
        throw new Error(data.error || 'Failed to fetch categories');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error loading categories');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const url = editingId ? `/api/treatment-categories/${editingId}` : '/api/treatment-categories';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save category');

      toast.success(editingId ? 'Category updated' : 'Category created');
      resetForm();
      fetchCategories();
    } catch (err: any) {
      toast.error(err.message || 'Error saving category');
    }
  }

  async function handleToggle(id: string, current: boolean) {
    try {
      const res = await fetch(`/api/treatment-categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !current })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update');

      toast.success('Category updated');
      fetchCategories();
    } catch (err: any) {
      toast.error(err.message || 'Error updating category');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this category?')) return;
    try {
      const res = await fetch(`/api/treatment-categories/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete');

      toast.success('Category deleted');
      fetchCategories();
    } catch (err: any) {
      toast.error(err.message || 'Error deleting category');
    }
  }

  function editCategory(category: Category) {
    setFormData({
      name: category.name,
      description: category.description || ''
    });
    setEditingId(category._id);
  }

  function resetForm() {
    setFormData({
      name: '',
      description: ''
    });
    setEditingId(null);
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Manage Treatment Categories</h1>

        {/* Category Form */}
        <form onSubmit={handleSubmit} className="mb-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">
            {editingId ? 'Edit Category' : 'Create New Category'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded">
              {editingId ? 'Update' : 'Create'} Category
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="bg-gray-500 text-white px-4 py-2 rounded">
                Cancel
              </button>
            )}
          </div>
        </form>

        {/* Categories List */}
        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="p-8 text-center">Loading categories...</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">Name</th>
                  <th className="text-left p-4">Description</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(category => (
                  <tr key={category._id} className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium">{category.name}</td>
                    <td className="p-4 text-sm text-gray-600">{category.description}</td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => handleToggle(category._id, !!category.is_active)}
                        className={`px-3 py-1 rounded text-sm ${
                          category.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {category.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2 justify-center">
                        <button 
                          onClick={() => editCategory(category)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(category._id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {categories.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-500">
                      No categories found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}