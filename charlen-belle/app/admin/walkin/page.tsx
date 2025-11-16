// app/admin/walkin/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
// import AdminLayout from '../../components/layouts/admin-layout';
import UnifiedLayout from '../../components/layouts/unified-layout';
import { formatCurrency, formatDate } from '../../lib/utils';

interface WalkinTransaction {
  _id: string;
  customer_name: string;
  payment_method: string;
  amount: number;
  status: 'pending' | 'paid' | 'failed';
  created_at: string;
  paid_at?: string;
  kasir_id: { _id: string; name: string };
  items?: any[];
}

export default function AdminWalkinPage() {
  const { data: session } = useSession();
  const [transactions, setTransactions] = useState<WalkinTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/admin/walkin');
      const data = await response.json();
      
      if (data.success) {
        setTransactions(data.transactions);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Transaksi Walk-in</h1>
            <p className="text-gray-600 mt-2">Kelola transaksi pelanggan langsung</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            + Transaksi Baru
          </button>
        </div>

        {/* Transactions List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <p className="mt-2 text-gray-600">Memuat data transaksi...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kasir
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Metode
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tanggal
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <tr key={transaction._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {transaction.customer_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transaction.kasir_id.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(transaction.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transaction.payment_method}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                          {transaction.status === 'paid' ? 'Lunas' : 
                           transaction.status === 'pending' ? 'Pending' : 'Gagal'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(transaction.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add Transaction Modal */}
        {showAddModal && (
          <WalkinModal
            onClose={() => setShowAddModal(false)}
            onSuccess={() => {
              setShowAddModal(false);
              fetchTransactions();
            }}
          />
        )}
      </div>
  );
}

function WalkinModal({ onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({
    customer_name: '',
    payment_method: 'cash',
    items: [] as any[],
    notes: ''
  });
  const [treatments, setTreatments] = useState<any[]>([]);
  const [selectedTreatment, setSelectedTreatment] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTreatments();
  }, []);

  const fetchTreatments = async () => {
    try {
      const response = await fetch('/api/treatments');
      const data = await response.json();
      
      if (data.success) {
        setTreatments(data.treatments.filter((t: any) => t.is_active));
      }
    } catch (error) {
      console.error('Error fetching treatments:', error);
    }
  };

  const addTreatment = () => {
    if (!selectedTreatment) return;

    const treatment = treatments.find(t => t._id === selectedTreatment);
    if (!treatment) return;

    const existingItem = formData.items.find(item => item.treatment_id === selectedTreatment);
    
    if (existingItem) {
      // Update quantity if already exists
      setFormData(prev => ({
        ...prev,
        items: prev.items.map(item =>
          item.treatment_id === selectedTreatment
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      }));
    } else {
      // Add new item
      setFormData(prev => ({
        ...prev,
        items: [...prev.items, {
          treatment_id: selectedTreatment,
          treatment_name: treatment.name,
          quantity,
          price: treatment.base_price
        }]
      }));
    }

    setSelectedTreatment('');
    setQuantity(1);
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const calculateTotal = () => {
    return formData.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      alert('Tambahkan minimal satu treatment');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/admin/walkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: calculateTotal()
        })
      });

      const data = await response.json();
      
      if (data.success) {
        onSuccess();
        alert('Transaksi berhasil dicatat');
      } else {
        alert('Gagal: ' + data.error);
      }
    } catch (error) {
      console.error('Error creating transaction:', error);
      alert('Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Transaksi Walk-in Baru
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Info */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Customer
              </label>
              <input
                type="text"
                required
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                placeholder="Nama customer"
              />
            </div>

            {/* Add Treatments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tambah Treatment
              </label>
              <div className="flex gap-2">
                <select
                  value={selectedTreatment}
                  onChange={(e) => setSelectedTreatment(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                >
                  <option value="">Pilih Treatment</option>
                  {treatments.map((treatment) => (
                    <option key={treatment._id} value={treatment._id}>
                      {treatment.name} - {formatCurrency(treatment.base_price)}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value))}
                  className="w-20 border border-gray-300 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                />
                <button
                  type="button"
                  onClick={addTreatment}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Tambah
                </button>
              </div>
            </div>

            {/* Selected Treatments */}
            {formData.items.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Treatment Dipilih</h3>
                <div className="space-y-2">
                  {formData.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{item.treatment_name}</p>
                        <p className="text-sm text-gray-600">Qty: {item.quantity} × {formatCurrency(item.price)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                  <span className="text-lg font-bold">Total:</span>
                  <span className="text-lg font-bold text-purple-600">
                    {formatCurrency(calculateTotal())}
                  </span>
                </div>
              </div>
            )}

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Metode Pembayaran
              </label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
              >
                <option value="cash">Tunai</option>
                <option value="debit">Kartu Debit</option>
                <option value="credit">Kartu Kredit</option>
                <option value="qris">QRIS</option>
                <option value="transfer">Transfer Bank</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catatan (Opsional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-purple-400"
              >
                {loading ? 'Menyimpan...' : 'Simpan Transaksi'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}