// app/admin/reports/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { formatCurrency, formatDate } from '../../lib/utils';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface SalesData {
  summary: {
    totalRevenue: number;
    totalTransactions: number;
    averageTransaction: number;
  };
  dailySales: Array<{
    _id: string;
    revenue: number;
    transactions: number;
  }>;
  topTreatments: Array<{
    _id: string;
    treatmentName: string;
    totalRevenue: number;
    totalQuantity: number;
    transactionCount: number;
  }>;
  paymentMethods: Array<{
    _id: string;
    totalRevenue: number;
    transactionCount: number;
  }>;
  recentTransactions: any[];
}

interface FilterState {
  period: 'today' | 'week' | 'month' | 'year' | 'custom';
  startDate: string;
  endDate: string;
}

export default function SalesReportsPage() {
  const { data: session } = useSession();
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    period: 'today',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchSalesData();
  }, [filters]);

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('period', filters.period);
      
      if (filters.period === 'custom') {
        params.append('startDate', filters.startDate);
        params.append('endDate', filters.endDate);
      }

      const response = await fetch(`/api/admin/sales-reports?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setSalesData(data.data);
      }
    } catch (error) {
      console.error('Error fetching sales data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const params = new URLSearchParams();
      params.append('period', filters.period);
      
      if (filters.period === 'custom') {
        params.append('startDate', filters.startDate);
        params.append('endDate', filters.endDate);
      }

      const response = await fetch(`/api/admin/sales-reports/export?${params}`);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `sales-report-${filters.period}-${new Date().toISOString().split('T')[0]}.csv`;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting report:', error);
    } finally {
      setExporting(false);
    }
  };

  // Chart data configurations
//   const revenueChartData = {
//     labels: salesData?.dailySales.map(day => {
//       const date = new Date(day._id);
//       return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
//     }) || [],
//     datasets: [
//       {
//         label: 'Pendapatan (Rp)',
//         data: salesData?.dailySales.map(day => day.revenue) || [],
//         backgroundColor: 'rgba(139, 92, 246, 0.8)',
//         borderColor: 'rgba(139, 92, 246, 1)',
//         borderWidth: 2,
//         borderRadius: 4,
//         borderSkipped: false,
//       },
//       {
//         label: 'Transaksi',
//         data: salesData?.dailySales.map(day => day.transactions) || [],
//         backgroundColor: 'rgba(16, 185, 129, 0.8)',
//         borderColor: 'rgba(16, 185, 129, 1)',
//         borderWidth: 2,
//         borderRadius: 4,
//         borderSkipped: false,
//         yAxisID: 'y1',
//       }
//     ],
//   };

//   const revenueChartOptions = {
//     responsive: true,
//     interaction: {
//       mode: 'index' as const,
//       intersect: false,
//     },
//     scales: {
//       x: {
//         grid: {
//           display: false
//         }
//       },
//       y: {
//         type: 'linear' as const,
//         display: true,
//         position: 'left' as const,
//         title: {
//           display: true,
//           text: 'Pendapatan (Rp)'
//         },
//         ticks: {
//           callback: function(value: any) {
//             return 'Rp ' + value.toLocaleString('id-ID');
//           }
//         }
//       },
//       y1: {
//         type: 'linear' as const,
//         display: true,
//         position: 'right' as const,
//         title: {
//           display: true,
//           text: 'Jumlah Transaksi'
//         },
//         grid: {
//           drawOnChartArea: false,
//         },
//       },
//     },
//     plugins: {
//       legend: {
//         position: 'top' as const,
//       },
//       title: {
//         display: true,
//         text: 'Trend Pendapatan Harian',
//       },
//       tooltip: {
//         callbacks: {
//           label: function(context: any) {
//             let label = context.dataset.label || '';
//             if (label.includes('Pendapatan')) {
//               return `${label}: Rp ${context.parsed.y.toLocaleString('id-ID')}`;
//             } else {
//               return `${label}: ${context.parsed.y} transaksi`;
//             }
//           }
//         }
//       }
//     },
//   };

    const revenueChartData = {
    labels: salesData?.dailySales.map(day => {
        const date = new Date(day._id);
        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    }) || [],
    datasets: [
        {
        label: 'Pendapatan',
        data: salesData?.dailySales.map(day => day.revenue) || [],
        backgroundColor: 'rgba(139, 92, 246, 0.8)',
        borderColor: 'rgba(139, 92, 246, 1)',
        borderWidth: 2,
        borderRadius: 4,
        }
    ],
    };

    const revenueChartOptions = {
    responsive: true,
    plugins: {
        legend: {
        position: 'top' as const,
        },
        title: {
        display: true,
        text: 'Trend Pendapatan Harian',
        },
        tooltip: {
        callbacks: {
            label: function(context: any) {
            return `Pendapatan: Rp ${context.parsed.y.toLocaleString('id-ID')}`;
            }
        }
        }
    },
    scales: {
        x: {
        grid: {
            display: false
        }
        },
        y: {
        beginAtZero: true,
        ticks: {
            callback: function(value: any) {
            return 'Rp ' + (value / 1000000).toFixed(1) + 'JT';
            }
        }
        },
    },
    };

  const paymentMethodChartData = {
    labels: salesData?.paymentMethods.map(method => {
      const methodNames: { [key: string]: string } = {
        'bank_transfer': 'Transfer Bank',
        'credit_card': 'Kartu Kredit',
        'qris': 'QRIS',
        'cash': 'Tunai',
        'ewallet': 'E-Wallet'
      };
      return methodNames[method._id] || method._id;
    }) || [],
    datasets: [
      {
        data: salesData?.paymentMethods.map(method => method.totalRevenue) || [],
        backgroundColor: [
          'rgba(139, 92, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderColor: [
          'rgba(139, 92, 246, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const paymentMethodChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: 'Distribusi Metode Pembayaran',
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const value = context.parsed;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `Rp ${value.toLocaleString('id-ID')} (${percentage}%)`;
          }
        }
      }
    },
  };

  const treatmentChartData = {
    labels: salesData?.topTreatments.map(treatment => treatment.treatmentName) || [],
    datasets: [
      {
        label: 'Pendapatan per Treatment',
        data: salesData?.topTreatments.map(treatment => treatment.totalRevenue) || [],
        backgroundColor: 'rgba(139, 92, 246, 0.8)',
        borderColor: 'rgba(139, 92, 246, 1)',
        borderWidth: 2,
        borderRadius: 4,
      },
    ],
  };

  const treatmentChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Pendapatan per Treatment',
      },
    },
    scales: {
      x: {
        grid: {
          display: false
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return 'Rp ' + value.toLocaleString('id-ID');
          }
        }
      },
    },
  };

  const StatCard = ({ title, value, subtitle, icon, color }: any) => (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`text-2xl ${color}`}>{icon}</div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Laporan Penjualan</h1>
          <p className="text-gray-600 mt-2">
            Analisis dan laporan keuangan untuk manajemen bisnis
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:bg-green-400 flex items-center gap-2"
        >
          {exporting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Mengekspor...
            </>
          ) : (
            <>
              📊 Export CSV
            </>
          )}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter Laporan</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Periode
            </label>
            <select
              value={filters.period}
              onChange={(e) => setFilters({ ...filters, period: e.target.value as any })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
            >
              <option value="today">Hari Ini</option>
              <option value="week">Minggu Ini</option>
              <option value="month">Bulan Ini</option>
              <option value="year">Tahun Ini</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {filters.period === 'custom' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dari Tanggal
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sampai Tanggal
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                />
              </div>
            </>
          )}

          <div className="flex items-end">
            <button
              onClick={fetchSalesData}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Terapkan Filter
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      {salesData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard
              title="Total Pendapatan"
              value={formatCurrency(salesData.summary.totalRevenue)}
              subtitle={`${salesData.summary.totalTransactions} transaksi`}
              icon="💰"
              color="text-green-600"
            />
            <StatCard
              title="Rata-rata Transaksi"
              value={formatCurrency(salesData.summary.averageTransaction)}
              subtitle="Per transaksi"
              icon="📊"
              color="text-blue-600"
            />
            <StatCard
              title="Total Transaksi"
              value={salesData.summary.totalTransactions}
              subtitle="Transaksi berhasil"
              icon="🎯"
              color="text-purple-600"
            />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Revenue Trend Chart */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Trend Pendapatan</h2>
              <div className="h-80">
                <Bar data={revenueChartData} options={revenueChartOptions} />
              </div>
            </div>

            {/* Payment Methods Chart */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Metode Pembayaran</h2>
              <div className="h-80">
                <Doughnut data={paymentMethodChartData} options={paymentMethodChartOptions} />
              </div>
            </div>
          </div>

          {/* Treatment Performance Chart */}
          {salesData.topTreatments.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Performance Treatment</h2>
              <div className="h-80">
                <Bar data={treatmentChartData} options={treatmentChartOptions} />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Top Treatments */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Treatment Terpopuler</h2>
              <div className="space-y-3">
                {salesData.topTreatments.map((treatment, index) => (
                  <div key={treatment._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{treatment.treatmentName}</p>
                        <p className="text-sm text-gray-600">{treatment.totalQuantity} treatment</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatCurrency(treatment.totalRevenue)}</p>
                      <p className="text-sm text-gray-600">{treatment.transactionCount} transaksi</p>
                    </div>
                  </div>
                ))}
                {salesData.topTreatments.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    Tidak ada data treatment
                  </div>
                )}
              </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Metode Pembayaran</h2>
              <div className="space-y-3">
                {salesData.paymentMethods.map((method) => (
                  <div key={method._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 capitalize">{method._id}</p>
                      <p className="text-sm text-gray-600">{method.transactionCount} transaksi</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatCurrency(method.totalRevenue)}</p>
                      <p className="text-sm text-gray-600">
                        {((method.totalRevenue / salesData.summary.totalRevenue) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Transaksi Terbaru</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 font-semibold text-gray-900">ID Transaksi</th>
                    <th className="text-left py-3 font-semibold text-gray-900">Pelanggan</th>
                    <th className="text-left py-3 font-semibold text-gray-900">Metode</th>
                    <th className="text-left py-3 font-semibold text-gray-900">Jumlah</th>
                    <th className="text-left py-3 font-semibold text-gray-900">Tanggal</th>
                  </tr>
                </thead>
                <tbody>
                  {salesData.recentTransactions.map((transaction) => (
                    <tr key={transaction._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 text-sm text-gray-600">
                        {transaction._id.toString().slice(-8)}
                      </td>
                      <td className="py-3">
                        <p className="font-medium text-gray-900">{transaction.user_id?.name}</p>
                        <p className="text-sm text-gray-600">{transaction.user_id?.email}</p>
                      </td>
                      <td className="py-3">
                        <span className="capitalize px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {transaction.payment_method}
                        </span>
                      </td>
                      <td className="py-3 font-semibold text-gray-900">
                        {formatCurrency(transaction.amount)}
                      </td>
                      <td className="py-3 text-sm text-gray-600">
                        {formatDate(transaction.paid_at)}
                      </td>
                    </tr>
                  ))}
                  {salesData.recentTransactions.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-gray-500">
                        Tidak ada transaksi
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}