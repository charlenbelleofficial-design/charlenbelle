'use client';

import { useState, useEffect } from 'react';
import { Button } from '../components/ui/buttons';
import { Input } from '../components/ui/input';
import { formatCurrency } from '../lib/utils';
import toast from 'react-hot-toast';

export default function KasirDashboardPage() {
  const [activeTab, setActiveTab] = useState<'walk-in' | 'booked'>('walk-in');
  const [treatments, setTreatments] = useState([]);
  const [cart, setCart] = useState<any[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('manual_cash');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchTreatments();
  }, []);

  const fetchTreatments = async () => {
    try {
      const response = await fetch('/api/treatments');
      const data = await response.json();
      setTreatments(data.treatments);
    } catch (error) {
      toast.error('Gagal memuat data treatment');
    }
  };

  const addToCart = (treatment: any) => {
    const existingItem = cart.find(item => item._id === treatment._id);
    
    if (existingItem) {
      setCart(cart.map(item =>
        item._id === treatment._id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...treatment, quantity: 1 }]);
    }
  };

  const removeFromCart = (treatmentId: string) => {
    setCart(cart.filter(item => item._id !== treatmentId));
  };

  const updateQuantity = (treatmentId: string, quantity: number) => {
    if (quantity === 0) {
      removeFromCart(treatmentId);
    } else {
      setCart(cart.map(item =>
        item._id === treatmentId ? { ...item, quantity } : item
      ));
    }
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.base_price * item.quantity), 0);
  };

  const handleProcessTransaction = async () => {
    if (cart.length === 0) {
      toast.error('Keranjang kosong');
      return;
    }

    if (!customerName.trim()) {
      toast.error('Masukkan nama customer');
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch('/api/kasir/walk-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: customerName,
          payment_method: paymentMethod,
          items: cart.map(item => ({
            treatment_id: item._id,
            quantity: item.quantity,
            price: item.base_price
          })),
          amount: calculateTotal()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      toast.success('Transaksi berhasil!');
      
      // Reset form
      setCart([]);
      setCustomerName('');
      setPaymentMethod('manual_cash');

      // Print receipt option
      if (confirm('Cetak struk?')) {
        window.open(`/kasir/receipt/${data.transaction._id}`, '_blank');
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Kasir</h1>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm p-2 inline-flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('walk-in')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'walk-in'
                ? 'bg-purple-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Walk-in Customer
          </button>
          <button
            onClick={() => setActiveTab('booked')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'booked'
                ? 'bg-purple-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Customer Booking
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Treatment Selection */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Pilih Treatment</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {treatments.map((treatment: any) => (
                  <button
                    key={treatment._id}
                    onClick={() => addToCart(treatment)}
                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-600 hover:bg-purple-50 transition-all text-left"
                  >
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {treatment.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                      {treatment.description}
                    </p>
                    <p className="text-lg font-bold text-purple-600">
                      {formatCurrency(treatment.base_price)}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Cart & Checkout */}
          <div className="space-y-4">
            {/* Customer Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold mb-3">Data Customer</h3>
              <Input
                type="text"
                placeholder="Nama Customer"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>

            {/* Cart */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold mb-4">Keranjang</h3>
              {cart.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Keranjang kosong</p>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item._id} className="flex items-center justify-between pb-3 border-b">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-gray-500">
                          {formatCurrency(item.base_price)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item._id, item.quantity - 1)}
                          className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item._id, item.quantity + 1)}
                          className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeFromCart(item._id)}
                          className="ml-2 text-red-500 hover:text-red-700"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold mb-3">Metode Pembayaran</h3>
              <div className="space-y-2">
                {[
                  { value: 'manual_cash', label: 'Tunai', icon: '💵' },
                  { value: 'manual_edc', label: 'Kartu (EDC)', icon: '💳' },
                  { value: 'manual_transfer', label: 'Transfer', icon: '🏦' },
                  { value: 'midtrans_qris', label: 'QRIS', icon: '📱' },
                ].map((method) => (
                  <button
                    key={method.value}
                    onClick={() => setPaymentMethod(method.value)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                      paymentMethod === method.value
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <span className="text-xl">{method.icon}</span>
                    <span className="font-medium">{method.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Total & Checkout */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-4 pb-4 border-b">
                <span className="text-gray-600">Subtotal:</span>
                <span className="text-2xl font-bold text-purple-600">
                  {formatCurrency(calculateTotal())}
                </span>
              </div>
              <Button
                onClick={handleProcessTransaction}
                disabled={isProcessing || cart.length === 0 || !customerName.trim()}
                className="w-full"
                size="lg"
              >
                {isProcessing ? 'Memproses...' : 'Proses Pembayaran'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}