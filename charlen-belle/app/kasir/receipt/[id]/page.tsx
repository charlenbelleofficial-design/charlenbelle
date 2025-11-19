'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { formatCurrency, formatDate } from '../../../lib/utils';

export default function ReceiptPage() {
  const params = useParams();
  const [transaction, setTransaction] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTransaction();
  }, []);

  const fetchTransaction = async () => {
    try {
      const response = await fetch(`/api/kasir/transactions/${params.id}`);
      const data = await response.json();
      setTransaction(data.transaction);
    } catch (error) {
      console.error('Failed to fetch transaction:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Transaksi tidak ditemukan</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8">
        {/* Print Button (hidden when printing) */}
        <div className="mb-6 print:hidden">
          <button
            onClick={handlePrint}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            🖨️ Print Struk
          </button>
        </div>

        {/* Receipt Content */}
        <div className="border-2 border-gray-200 rounded-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Klinik Kecantikan
            </h1>
            <p className="text-gray-600">Jl. Kecantikan No. 123, Jakarta</p>
            <p className="text-gray-600">Telp: (021) 1234-5678</p>
          </div>

          <div className="border-t-2 border-dashed border-gray-300 my-6"></div>

          {/* Transaction Info */}
          <div className="mb-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">No. Transaksi:</span>
              <span className="font-mono font-semibold">#{transaction._id.slice(-8)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tanggal:</span>
              <span className="font-semibold">{formatDate(transaction.created_at)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Customer:</span>
              <span className="font-semibold">{transaction.customer_name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Kasir:</span>
              <span className="font-semibold">{transaction.kasir_id?.name}</span>
            </div>
          </div>

          <div className="border-t-2 border-dashed border-gray-300 my-6"></div>

          {/* Items */}
          <div className="mb-6">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 text-sm font-semibold">Item</th>
                  <th className="text-center py-2 text-sm font-semibold">Qty</th>
                  <th className="text-right py-2 text-sm font-semibold">Harga</th>
                  <th className="text-right py-2 text-sm font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {transaction.items?.map((item: any, index: number) => (
                  <tr key={index} className="border-b">
                    <td className="py-3 text-sm">{item.treatment_id?.name}</td>
                    <td className="py-3 text-center text-sm">{item.quantity}</td>
                    <td className="py-3 text-right text-sm">{formatCurrency(item.price)}</td>
                    <td className="py-3 text-right text-sm font-semibold">
                      {formatCurrency(item.price * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t-2 border-dashed border-gray-300 my-6"></div>

          {/* Total */}
          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-lg">
              <span className="font-semibold">Total:</span>
              <span className="text-2xl font-bold text-purple-600">
                {formatCurrency(transaction.amount)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Metode Pembayaran:</span>
              <span className="font-semibold">{getPaymentMethodLabel(transaction.payment_method)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Status:</span>
              <span className={`font-semibold ${
                transaction.status === 'paid' ? 'text-green-600' : 'text-yellow-600'
              }`}>
                {transaction.status === 'paid' ? 'LUNAS' : 'PENDING'}
              </span>
            </div>
          </div>

          <div className="border-t-2 border-dashed border-gray-300 my-6"></div>

          {/* Footer */}
          <div className="text-center text-sm text-gray-600">
            <p className="mb-2">Terima kasih atas kunjungan Anda!</p>
            <p>Barang yang sudah dibeli tidak dapat dikembalikan</p>
            <p className="mt-4 text-xs">Simpan struk ini sebagai bukti pembayaran</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function getPaymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    manual_cash: 'Tunai',
    manual_edc: 'Kartu (EDC)',
    manual_transfer: 'Transfer',
    midtrans_qris: 'QRIS',
    midtrans_cc: 'Kartu Kredit',
    midtrans_va: 'Virtual Account'
  };
  return labels[method] || method;
}