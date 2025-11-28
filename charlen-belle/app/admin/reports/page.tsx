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

// ==== ICONS (solid, senada tema cream-gold) ====
const IconMoney = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <rect
      x="3"
      y="6"
      width="18"
      height="12"
      rx="2"
      stroke="currentColor"
      strokeWidth={1.6}
    />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth={1.6} />
    <path
      d="M7 9h2M7 15h2M15 9h2M15 15h2"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
    />
  </svg>
);

const IconChartAvg = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path
      d="M4 19h16"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
    />
    <path
      d="M7 16l3-7 4 4 3-8"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="10" cy="9" r="1" fill="currentColor" />
    <circle cx="14" cy="13" r="1" fill="currentColor" />
    <circle cx="17" cy="5" r="1" fill="currentColor" />
  </svg>
);

const IconTarget = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <circle
      cx="12"
      cy="12"
      r="8"
      stroke="currentColor"
      strokeWidth={1.6}
    />
    <circle
      cx="12"
      cy="12"
      r="4"
      stroke="currentColor"
      strokeWidth={1.6}
    />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" />
  </svg>
);

const IconDownload = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path
      d="M6 19h12M12 5v10M8 11l4 4 4-4"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconLoader = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <circle
      cx="12"
      cy="12"
      r="8"
      stroke="currentColor"
      strokeWidth={1.6}
      opacity={0.25}
    />
    <path
      d="M20 12a8 8 0 0 0-8-8"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
    />
  </svg>
);

export default function SalesReportsPage() {
  const { data: session } = useSession();
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    period: 'today',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
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
      a.download = `sales-report-${filters.period}-${new Date()
        .toISOString()
        .split('T')[0]}.csv`;

      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting report:', error);
    } finally {
      setExporting(false);
    }
  };

  // === Chart data (logic sama, hanya ubah warna ke gold/cream) ===
  const revenueChartData = {
    labels:
      salesData?.dailySales.map((day) => {
        const date = new Date(day._id);
        return date.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
        });
      }) || [],
    datasets: [
      {
        label: 'Pendapatan',
        data: salesData?.dailySales.map((day) => day.revenue) || [],
        backgroundColor: 'rgba(180, 138, 90, 0.85)',
        borderColor: 'rgba(148, 109, 64, 1)',
        borderWidth: 2,
        borderRadius: 6,
      },
    ],
  };

  const revenueChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#5B4630',
        },
      },
      title: {
        display: true,
        text: 'Trend Pendapatan Harian',
        color: '#3A3530',
        font: {
          size: 14,
          weight: 'bold' as const, // Ganti '600' dengan 'bold'
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            return `Pendapatan: Rp ${context.parsed.y.toLocaleString('id-ID')}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#8B7B63',
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value: any) {
            return 'Rp ' + (value / 1000000).toFixed(1) + 'JT';
          },
          color: '#8B7B63',
        },
      },
    },
  };

  const paymentMethodChartData = {
    labels:
      salesData?.paymentMethods.map((method) => {
        const methodNames: { [key: string]: string } = {
          bank_transfer: 'Transfer Bank',
          credit_card: 'Kartu Kredit',
          qris: 'QRIS',
          cash: 'Tunai',
          ewallet: 'E-Wallet',
        };
        return methodNames[method._id] || method._id;
      }) || [],
    datasets: [
      {
        data: salesData?.paymentMethods.map((method) => method.totalRevenue) || [],
        backgroundColor: [
          'rgba(180, 138, 90, 0.9)',
          'rgba(222, 181, 120, 0.9)',
          'rgba(236, 206, 156, 0.9)',
          'rgba(206, 171, 121, 0.9)',
          'rgba(158, 118, 75, 0.9)',
        ],
        borderColor: [
          'rgba(148, 109, 64, 1)',
          'rgba(191, 146, 84, 1)',
          'rgba(204, 173, 120, 1)',
          'rgba(176, 139, 90, 1)',
          'rgba(124, 87, 49, 1)',
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
        labels: {
          color: '#5B4630',
        },
      },
      title: {
        display: true,
        text: 'Distribusi Metode Pembayaran',
        color: '#3A3530',
        font: {
          size: 14,
          weight: 'bold' as const, // Ganti '600' dengan 'bold'
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const value = context.parsed;
            const total = context.dataset.data.reduce(
              (a: number, b: number) => a + b,
              0
            );
            const percentage = ((value / total) * 100).toFixed(1);
            return `Rp ${value.toLocaleString('id-ID')} (${percentage}%)`;
          },
        },
      },
    },
  };


  const treatmentChartData = {
    labels:
      salesData?.topTreatments.map((treatment) => treatment.treatmentName) || [],
    datasets: [
      {
        label: 'Pendapatan per Treatment',
        data:
          salesData?.topTreatments.map((treatment) => treatment.totalRevenue) ||
          [],
        backgroundColor: 'rgba(180, 138, 90, 0.85)',
        borderColor: 'rgba(148, 109, 64, 1)',
        borderWidth: 2,
        borderRadius: 6,
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
        color: '#3A3530',
        font: {
          size: 14,
          weight: 'bold' as const, // Ganti '600' dengan 'bold'
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#8B7B63',
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value: any) {
            return 'Rp ' + value.toLocaleString('id-ID');
          },
          color: '#8B7B63',
        },
      },
    },
  };

  const StatCard = ({
    title,
    value,
    subtitle,
    icon,
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
  }) => (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E5D7BE]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-wide text-[#8B7B63] uppercase">
            {title}
          </p>
          <p className="text-2xl font-semibold text-[#3A3530] mt-2">{value}</p>
          {subtitle && (
            <p className="text-xs text-[#A08C6A] mt-1">{subtitle}</p>
          )}
        </div>
        <div className="w-10 h-10 rounded-full bg-[#F5E4C6] flex items-center justify-center text-[#8F6E45]">
          {icon}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-6 bg-[#F8F4E8] min-h-screen">
        <div className="flex items-center justify-center min-h-[60vh]">
          <IconLoader className="w-10 h-10 animate-spin text-[#B48A5A]" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#F8F4E8] min-h-screen">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-[#3A3530]">
            Laporan Penjualan
          </h1>
          <p className="text-sm text-[#8B7B63] mt-1">
            Analisis dan ringkasan performa keuangan klinik.
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="inline-flex items-center gap-2 bg-[#B48A5A] text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-[#8F6E45] disabled:bg-[#D6C7AF] disabled:text-[#F7F0E4] disabled:cursor-not-allowed transition-colors"
        >
          {exporting ? (
            <>
              <IconLoader className="w-4 h-4 animate-spin" />
              <span>Mengekspor...</span>
            </>
          ) : (
            <>
              <IconDownload className="w-4 h-4" />
              <span>Export CSV</span>
            </>
          )}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 md:p-7 shadow-sm border border-[#E5D7BE] mb-6">
        <h2 className="text-lg font-semibold text-[#3A3530] mb-4">
          Filter Laporan
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-5">
          <div>
            <label className="block text-xs font-semibold text-[#6E5A40] mb-1.5">
              Periode
            </label>
            <select
              value={filters.period}
              onChange={(e) =>
                setFilters({ ...filters, period: e.target.value as any })
              }
              className="w-full rounded-full border border-[#C9AE84] bg-[#FFFBF3] px-3 py-2.5 text-sm text-[#3A3530] focus:outline-none focus:ring-2 focus:ring-[#E2CBA4] focus:border-[#B48A5A]"
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
                <label className="block text-xs font-semibold text-[#6E5A40] mb-1.5">
                  Dari Tanggal
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    setFilters({ ...filters, startDate: e.target.value })
                  }
                  className="w-full rounded-full border border-[#C9AE84] bg-[#FFFBF3] px-3 py-2.5 text-sm text-[#3A3530] focus:outline-none focus:ring-2 focus:ring-[#E2CBA4] focus:border-[#B48A5A]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6E5A40] mb-1.5">
                  Sampai Tanggal
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) =>
                    setFilters({ ...filters, endDate: e.target.value })
                  }
                  className="w-full rounded-full border border-[#C9AE84] bg-[#FFFBF3] px-3 py-2.5 text-sm text-[#3A3530] focus:outline-none focus:ring-2 focus:ring-[#E2CBA4] focus:border-[#B48A5A]"
                />
              </div>
            </>
          )}

          <div className="flex items-end">
            <button
              onClick={fetchSalesData}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold bg-[#B48A5A] text-white hover:bg-[#8F6E45] transition-colors"
            >
              Terapkan Filter
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      {salesData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            <StatCard
              title="Total Pendapatan"
              value={formatCurrency(salesData.summary.totalRevenue)}
              subtitle={`${salesData.summary.totalTransactions} transaksi berhasil`}
              icon={<IconMoney className="w-5 h-5" />}
            />
            <StatCard
              title="Rata-rata Transaksi"
              value={formatCurrency(salesData.summary.averageTransaction)}
              subtitle="Per transaksi"
              icon={<IconChartAvg className="w-5 h-5" />}
            />
            <StatCard
              title="Total Transaksi"
              value={salesData.summary.totalTransactions}
              subtitle="Transaksi berhasil"
              icon={<IconTarget className="w-5 h-5" />}
            />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Revenue Trend Chart */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E5D7BE]">
              <h2 className="text-base font-semibold text-[#3A3530] mb-3">
                Trend Pendapatan
              </h2>
              <div className="h-80">
                <Bar data={revenueChartData} options={revenueChartOptions} />
              </div>
            </div>

            {/* Payment Methods Chart */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E5D7BE]">
              <h2 className="text-base font-semibold text-[#3A3530] mb-3">
                Metode Pembayaran
              </h2>
              <div className="h-80">
                <Doughnut
                  data={paymentMethodChartData}
                  options={paymentMethodChartOptions}
                />
              </div>
            </div>
          </div>

          {/* Treatment Performance Chart */}
          {salesData.topTreatments.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E5D7BE] mb-8">
              <h2 className="text-base font-semibold text-[#3A3530] mb-3">
                Performance Treatment
              </h2>
              <div className="h-80">
                <Bar data={treatmentChartData} options={treatmentChartOptions} />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Top Treatments */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E5D7BE]">
              <h2 className="text-base font-semibold text-[#3A3530] mb-4">
                Treatment Terpopuler
              </h2>
              <div className="space-y-3">
                {salesData.topTreatments.map((treatment, index) => (
                  <div
                    key={treatment._id}
                    className="flex items-center justify-between p-3 border border-[#F1E3CB] rounded-xl bg-[#FFFCF7]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#F5E4C6] text-[#8F6E45] rounded-full flex items-center justify-center text-sm font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-[#3A3530]">
                          {treatment.treatmentName}
                        </p>
                        <p className="text-xs text-[#8B7B63]">
                          {treatment.totalQuantity} treatment
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-[#3A3530]">
                        {formatCurrency(treatment.totalRevenue)}
                      </p>
                      <p className="text-xs text-[#8B7B63]">
                        {treatment.transactionCount} transaksi
                      </p>
                    </div>
                  </div>
                ))}
                {salesData.topTreatments.length === 0 && (
                  <div className="text-center py-4 text-sm text-[#8B7B63]">
                    Tidak ada data treatment
                  </div>
                )}
              </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E5D7BE]">
              <h2 className="text-base font-semibold text-[#3A3530] mb-4">
                Metode Pembayaran
              </h2>
              <div className="space-y-3">
                {salesData.paymentMethods.map((method) => (
                  <div
                    key={method._id}
                    className="flex items-center justify-between p-3 border border-[#F1E3CB] rounded-xl bg-[#FFFCF7]"
                  >
                    <div>
                      <p className="font-medium text-[#3A3530] capitalize">
                        {method._id}
                      </p>
                      <p className="text-xs text-[#8B7B63]">
                        {method.transactionCount} transaksi
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-[#3A3530]">
                        {formatCurrency(method.totalRevenue)}
                      </p>
                      <p className="text-xs text-[#8B7B63]">
                        {(
                          (method.totalRevenue /
                            salesData.summary.totalRevenue) *
                          100
                        ).toFixed(1)}
                        %
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E5D7BE]">
            <h2 className="text-base font-semibold text-[#3A3530] mb-4">
              Transaksi Terbaru
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-[#F1E3CB] text-xs text-[#6E5A40] uppercase tracking-wide bg-[#FBF5E7]">
                  <tr>
                    <th className="text-left py-3 px-3 font-semibold">
                      ID Transaksi
                    </th>
                    <th className="text-left py-3 px-3 font-semibold">
                      Pelanggan
                    </th>
                    <th className="text-left py-3 px-3 font-semibold">
                      Metode
                    </th>
                    <th className="text-left py-3 px-3 font-semibold">
                      Jumlah
                    </th>
                    <th className="text-left py-3 px-3 font-semibold">
                      Tanggal
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {salesData.recentTransactions.map((transaction) => (
                    <tr
                      key={transaction._id}
                      className="border-b border-[#F5E9D3] hover:bg-[#FFF9EB]"
                    >
                      <td className="py-3 px-3 text-xs font-mono text-[#8B7B63]">
                        {transaction._id.toString().slice(-8)}
                      </td>
                      <td className="py-3 px-3">
                        <p className="text-sm font-medium text-[#3A3530]">
                          {transaction.user_id?.name}
                        </p>
                        <p className="text-xs text-[#8B7B63]">
                          {transaction.user_id?.email}
                        </p>
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium bg-[#F5E4C6] text-[#6E4E2E] capitalize">
                          {transaction.payment_method}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-sm font-semibold text-[#3A3530]">
                        {formatCurrency(transaction.amount)}
                      </td>
                      <td className="py-3 px-3 text-xs text-[#8B7B63]">
                        {formatDate(transaction.paid_at)}
                      </td>
                    </tr>
                  ))}
                  {salesData.recentTransactions.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-5 text-center text-sm text-[#8B7B63]"
                      >
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
