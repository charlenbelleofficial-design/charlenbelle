'use client';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

type Category = { _id: string; name: string; };
type Treatment = { _id: string; name: string; base_price: number; duration_minutes: number; category_id?: Category | string; };

export default function AdminTreatmentsPage() {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', base_price: '', duration_minutes: '', category_id: '' });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const [res1, res2] = await Promise.all([fetch('/api/treatments'), fetch('/api/treatment-categories')]);
    const data1 = await res1.json();
    const data2 = await res2.json();
    setTreatments(data1.treatments || []);
    setCategories(data2.categories || []);
    setLoading(false);
  }

  async function handleCreate(e: any) {
    e.preventDefault();
    try {
      const payload = {
        name: form.name,
        description: form.description,
        base_price: Number(form.base_price),
        duration_minutes: Number(form.duration_minutes),
        category_id: form.category_id || undefined
      };
      const res = await fetch('/api/treatments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal membuat');
      toast.success('Treatment dibuat');
      setShowCreate(false);
      setForm({ name: '', description: '', base_price: '', duration_minutes: '', category_id: '' });
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Error');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus treatment?')) return;
    try {
      const res = await fetch(`/api/treatments/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal hapus');
      toast.success('Deleted');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Error');
    }
  }

  return (
    <div className="p-8 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Manage Treatments</h1>
          <button onClick={() => setShowCreate(true)} className="bg-purple-600 text-white px-4 py-2 rounded">Create Treatment</button>
        </div>

        <div className="bg-white p-4 rounded shadow mb-6">
          {loading ? <div>Loading...</div> : (
            <table className="w-full table-auto">
              <thead><tr><th className="p-2 text-left">Name</th><th className="p-2">Category</th><th className="p-2">Price</th><th className="p-2">Durasi</th><th className="p-2">Actions</th></tr></thead>
              <tbody>
                {treatments.map(t => (
                  <tr key={t._id} className="border-t">
                    <td className="p-2">{t.name}</td>
                    <td className="p-2">{(t.category_id as any)?.name || '-'}</td>
                    <td className="p-2">{t.base_price?.toLocaleString?.() ?? '-'}</td>
                    <td className="p-2">{t.duration_minutes}m</td>
                    <td className="p-2">
                      <button onClick={() => handleDelete(t._id)} className="text-red-600">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {showCreate && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
            <div className="bg-white p-6 rounded shadow w-[720px]">
              <h2 className="text-xl mb-3">Create Treatment</h2>
              <form onSubmit={handleCreate} className="space-y-3">
                <input className="w-full p-2 border rounded" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                <textarea className="w-full p-2 border rounded" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                <div className="grid grid-cols-3 gap-3">
                  <input className="p-2 border rounded" placeholder="Base price" value={form.base_price} onChange={e => setForm({ ...form, base_price: e.target.value })} required />
                  <input className="p-2 border rounded" placeholder="Duration minutes" value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: e.target.value })} required />
                  <select className="p-2 border rounded" value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}>
                    <option value="">-- pilih kategori --</option>
                    {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="flex gap-3 justify-end">
                  <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 border rounded">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded">Create</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
