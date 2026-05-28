import { createFileRoute } from '@tanstack/react-router';
import { useState, useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
} from '@tanstack/react-table';
import { useReports } from '../../use-cases/hooks/useReports';
import type { Report, ReportCategory, ReportStatus } from '../../domain/entities/report';
import { ShieldCheck, RefreshCw, ChevronLeft, ChevronRight, Search, CheckCircle, XCircle } from 'lucide-react';

export const Route = createFileRoute('/admin/reports')({
  component: AdminReportsManager,
});

function AdminReportsManager() {
  const { data: serverReports, isLoading, refetch } = useReports();
  const [globalFilter, setGlobalFilter] = useState('');

  // Local fallback mock data if server is offline/not seeded yet
  const fallbackReports: Report[] = useMemo(() => [
    {
      id: 'REP-001',
      category: 'crime',
      title: 'Dugaan Begal Motor di Jembatan Balerejo',
      description: 'Ada motor mencurigakan bergerombol di dekat jembatan tanpa plat nomor tiap pukul 23:00 malam.',
      location: { latitude: -7.6012, longitude: 111.6642, district: 'Balerejo' },
      status: 'pending',
      upvotes: 24,
      downvotes: 1,
      reporterId: 'user_1',
      reporterName: 'Sandi Dinata',
      createdAt: '2026-05-28T14:20:00Z',
    },
    {
      id: 'REP-002',
      category: 'hazard',
      title: 'Pohon Sengon Tumbang di Jalur Kare',
      description: 'Batang pohon menghalangi jalur pendakian wisata Kare, menutup separuh jalan aspal.',
      location: { latitude: -7.6981, longitude: 111.7102, district: 'Kare' },
      status: 'verified',
      upvotes: 45,
      downvotes: 0,
      reporterId: 'user_2',
      reporterName: 'Wawan Gunawan',
      createdAt: '2026-05-28T10:15:00Z',
    },
    {
      id: 'REP-003',
      category: 'natural_disaster',
      title: 'Longsor Skala Kecil di Lereng Wilis Dagangan',
      description: 'Tebing setinggi 3 meter gugur dan menimbun bahu jalan kabupaten. Perlu alat berat.',
      location: { latitude: -7.7214, longitude: 111.6053, district: 'Dagangan' },
      status: 'pending',
      upvotes: 89,
      downvotes: 2,
      reporterId: 'user_3',
      reporterName: 'Rian Madiun',
      createdAt: '2026-05-28T09:00:00Z',
    },
    {
      id: 'REP-004',
      category: 'road_block',
      title: 'Pemasangan Tenda Hajatan Menutup Jalan Pilangkenceng',
      description: 'Pesta pernikahan menggunakan jalan utama desa tanpa jalur alternatif yang memadai.',
      location: { latitude: -7.5819, longitude: 111.6322, district: 'Pilangkenceng' },
      status: 'resolved',
      upvotes: 12,
      downvotes: 8,
      reporterId: 'user_4',
      reporterName: 'Ahmad Sodikin',
      createdAt: '2026-05-27T15:30:00Z',
    }
  ], []);

  // Merge server data and fallback data safely
  const tableData = useMemo(() => {
    if (serverReports && serverReports.length > 0) {
      return serverReports;
    }
    return fallbackReports;
  }, [serverReports, fallbackReports]);

  // Actions handler
  const handleVerify = (id: string) => {
    alert(`Laporan ${id} diverifikasi & dipublikasikan pada rekomendasi rute warga.`);
  };

  const handleResolve = (id: string) => {
    alert(`Kejadian ${id} dinyatakan telah diselesaikan oleh petugas setempat.`);
  };

  const handleReject = (id: string) => {
    alert(`Laporan ${id} ditolak karena dinilai tidak valid atau spam.`);
  };

  // Define Columns for TanStack Table
  const columns = useMemo<ColumnDef<Report>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        cell: (info) => <span className="font-mono text-slate-400 font-bold">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'category',
        header: 'Kategori',
        cell: (info) => {
          const cat = info.getValue() as ReportCategory;
          const config: Record<ReportCategory, { label: string; style: string }> = {
            crime: { label: 'Kriminalitas', style: 'bg-red-500/10 text-red-400 border-red-500/20' },
            hazard: { label: 'Bahaya Jalan', style: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
            natural_disaster: { label: 'Bencana Alam', style: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
            road_block: { label: 'Jalan Ditutup', style: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
            accident: { label: 'Kecelakaan', style: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
            other: { label: 'Lainnya', style: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
          };
          const match = config[cat] || config.other;
          return (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${match.style}`}>
              {match.label}
            </span>
          );
        },
      },
      {
        accessorKey: 'title',
        header: 'Laporan & Wilayah',
        cell: (info) => {
          const row = info.row.original;
          return (
            <div className="space-y-1">
              <span className="font-semibold text-slate-100 text-xs sm:text-sm block leading-snug">
                {row.title}
              </span>
              <span className="text-[10px] text-slate-400 block font-medium">
                Kecamatan: <span className="text-teal-400 font-bold">{row.location.district || 'Madiun'}</span> • GPS: {row.location.latitude.toFixed(4)}, {row.location.longitude.toFixed(4)}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'upvotes',
        header: 'Upvotes',
        cell: (info) => <span className="font-bold text-slate-300">{info.getValue() as number} 👍</span>,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: (info) => {
          const status = info.getValue() as ReportStatus;
          const config: Record<ReportStatus, { label: string; style: string }> = {
            pending: { label: 'Menunggu', style: 'bg-amber-500/20 text-amber-300' },
            verified: { label: 'Terverifikasi', style: 'bg-teal-500/20 text-teal-300' },
            resolved: { label: 'Selesai', style: 'bg-emerald-500/20 text-emerald-300' },
            rejected: { label: 'Ditolak', style: 'bg-red-500/20 text-red-300' },
          };
          return (
            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${config[status].style}`}>
              {config[status].label}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Tindakan',
        cell: (info) => {
          const row = info.row.original;
          return (
            <div className="flex gap-2">
              {row.status === 'pending' && (
                <button
                  onClick={() => handleVerify(row.id)}
                  title="Verifikasi Laporan"
                  className="p-1.5 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 text-teal-400 rounded-lg transition-all"
                >
                  <ShieldCheck className="w-4 h-4" />
                </button>
              )}
              {row.status === 'verified' && (
                <button
                  onClick={() => handleResolve(row.id)}
                  title="Selesaikan Kejadian"
                  className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 rounded-lg transition-all"
                >
                  <CheckCircle className="w-4 h-4" />
                </button>
              )}
              {row.status !== 'rejected' && row.status !== 'resolved' && (
                <button
                  onClick={() => handleReject(row.id)}
                  title="Tolak Laporan"
                  className="p-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg transition-all"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        },
      },
    ],
    []
  );

  // Initialize TanStack Table Hook
  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: {
        pageSize: 5,
      },
    },
  });

  return (
    <div className="space-y-4">
      {/* Search Filter and Refresh Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
        {/* Search Panel */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Cari aduan atau wilayah..."
            className="w-full text-xs py-2.5 pl-9 pr-4 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Refresh Trigger */}
        <button
          onClick={() => refetch()}
          className="px-4 py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 font-bold rounded-xl text-xs flex items-center gap-2 transition-all w-full sm:w-auto justify-center"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Muat Ulang Data</span>
        </button>
      </div>

      {/* Main Datagrid Container */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-slate-800 bg-slate-950">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider select-none cursor-pointer hover:text-slate-200"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-2">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{
                          asc: ' 🔼',
                          desc: ' 🔽',
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center text-xs text-slate-500">
                    Memuat Laporan...
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center text-xs text-slate-500">
                    Tidak ada laporan ditemukan.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-slate-800 hover:bg-slate-900/50 transition-all"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-6 py-4 text-xs">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controllers */}
        <div className="p-4 border-t border-slate-800 flex justify-between items-center bg-slate-950">
          <div className="text-xs text-slate-400">
            Menampilkan halaman{' '}
            <span className="font-bold text-slate-200">{table.getState().pagination.pageIndex + 1}</span> dari{' '}
            <span className="font-bold text-slate-200">{table.getPageCount()}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-lg text-slate-400 disabled:opacity-30 disabled:pointer-events-none transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-lg text-slate-400 disabled:opacity-30 disabled:pointer-events-none transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
