'use client';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

type Category = { _id: string; name: string; description?: string; is_active?: boolean; };

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => { fetchCategories(); }, []);

  async function fetchCategories() {
    setLoading(true);
    const res = await fetch('/api/treatment-categories');
    const data = await res.json();
    setCategories(data.categories || []);
    setLoading(false);
  }

  async function handleCreate(e: any) {
    e.preventDefault();
    try {
      const res = await fetch('/api/treatment-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal membuat');
      toast.success('Kategori dibuat');
      setName(''); setDescription('');
      fetchCategories();
    } catch (err: any) {
      toast.error(err.message || 'Error');
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
      if (!res.ok) throw new Error(data.error || 'Gagal');
      toast.success('Updated');
      fetchCategories();
    } catch (err: any) {
      toast.error(err.message || 'Error');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus kategori?')) return;
    try {
      const res = await fetch(`/api/treatment-categories/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal hapus');
      toast.success('Deleted');
      fetchCategories();
    } catch (err: any) {
      toast.error(err.message || 'Error');
    }
  }

  return (
    <div className="p-8 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Manage Treatment Categories</h1>

        <form onSubmit={handleCreate} className="mb-6 bg-white p-4 rounded shadow">
          <div className="grid grid-cols-2 gap-3">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="p-2 border rounded" required />
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" className="p-2 border rounded" />
          </div>
          <div className="mt-3">
            <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded">Create</button>
          </div>
        </form>

        <div className="bg-white p-4 rounded shadow">
          {loading ? <div>Loading...</div> : (
            <table className="w-full table-auto">
              <thead>
                <tr>
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Description</th>
                  <th className="p-2">Active</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(c => (
                  <tr key={c._id} className="border-t">
                    <td className="p-2">{c.name}</td>
                    <td className="p-2 text-sm text-gray-600">{c.description}</td>
                    <td className="p-2 text-center">
                      <button onClick={() => handleToggle(c._id, !!c.is_active)} className={`px-3 py-1 rounded ${c.is_active ? 'bg-green-100' : 'bg-red-100'}`}>{c.is_active ? 'Active' : 'Inactive'}</button>
                    </td>
                    <td className="p-2">
                      <button onClick={() => handleDelete(c._id)} className="text-red-600">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
