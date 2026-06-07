import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import type { ColumnDef } from '@tanstack/react-table';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
} from '@tanstack/react-table';
import { useReports, useVerifyReport, useRejectReport, useResolveReport, useDeleteReport } from '../../use-cases/hooks/useReports';
import type { Report, ReportCategory, ReportStatus } from '../../domain/entities/report';
import { ShieldCheck, RefreshCw, ChevronLeft, ChevronRight, Search, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { Toast } from "../../components/atomic/atoms/Toast";

export const Route = createFileRoute('/admin/reports')({
  component: AdminReportsManager,
});

function AdminReportsManager() {
  const { data: serverReports, isLoading, refetch } = useReports();
  const [globalFilter, setGlobalFilter] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Use server reports
  const tableData = useMemo(() => {
    return serverReports || [];
  }, [serverReports]);

  const verifyMutation = useVerifyReport();
  const rejectMutation = useRejectReport();
  const resolveMutation = useResolveReport();
  const deleteMutation = useDeleteReport();

  // Actions handler
  const handleVerify = async (id: string) => {
    try {
      await verifyMutation.mutateAsync(id);
      setToast({ message: `Laporan ${id} berhasil diverifikasi.`, type: 'success' });
    } catch (err: any) {
      setToast({ message: err.message || "Gagal memverifikasi laporan.", type: 'error' });
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await resolveMutation.mutateAsync(id);
      setToast({ message: `Kejadian ${id} dinyatakan telah diselesaikan.`, type: 'success' });
    } catch (err: any) {
      setToast({ message: err.message || "Gagal menyelesaikan kejadian.", type: 'error' });
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectMutation.mutateAsync(id);
      setToast({ message: `Laporan ${id} berhasil ditolak.`, type: 'success' });
    } catch (err: any) {
      setToast({ message: err.message || "Gagal menolak laporan.", type: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus laporan ini secara permanen dari basis data?")) {
      try {
        await deleteMutation.mutateAsync(id);
        setToast({ message: `Laporan ${id} berhasil dihapus.`, type: 'success' });
      } catch (err: any) {
        setToast({ message: err.message || "Gagal menghapus laporan.", type: 'error' });
      }
    }
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
        accessorKey: 'imageUrl',
        header: 'Foto',
        cell: (info) => {
          const url = info.getValue() as string;
          if (!url) return <span className="text-slate-400 text-[10px]">Tidak ada foto</span>;
          return (
            <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 cursor-zoom-in bg-slate-50 flex items-center justify-center shrink-0">
              <img
                src={url}
                alt="Laporan"
                className="w-full h-full object-cover hover:scale-110 transition-transform duration-200"
                onClick={() => setZoomedImage(url)}
              />
            </div>
          );
        },
      },
      {
        accessorKey: 'category',
        header: 'Kategori',
        cell: (info) => {
          const cat = info.getValue() as ReportCategory;
          const config: Record<ReportCategory, { label: string; style: string }> = {
            crime: { label: 'Kriminalitas', style: 'bg-red-50 text-red-700 border-red-200' },
            hazard: { label: 'Bahaya Jalan', style: 'bg-amber-50 text-amber-700 border-amber-200' },
            natural_disaster: { label: 'Bencana Alam', style: 'bg-orange-50 text-orange-700 border-orange-200' },
            road_block: { label: 'Jalan Ditutup', style: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
            accident: { label: 'Kecelakaan', style: 'bg-rose-50 text-rose-700 border-rose-200' },
            other: { label: 'Lainnya', style: 'bg-slate-100 text-slate-700 border-slate-200' },
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
              <span className="font-bold text-slate-800 text-xs sm:text-sm block leading-snug">
                {row.title}
              </span>
              <span className="text-[10px] text-slate-500 block font-bold">
                Kecamatan: <span className="text-teal-600">{row.location.district || 'Madiun'}</span> • GPS: {row.location.latitude.toFixed(4)}, {row.location.longitude.toFixed(4)}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'upvotes',
        header: 'Upvotes',
        cell: (info) => <span className="font-bold text-slate-600">{info.getValue() as number} 👍</span>,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: (info) => {
          const status = info.getValue() as ReportStatus;
          const config: Record<ReportStatus, { label: string; style: string }> = {
            pending: { label: 'Menunggu', style: 'bg-amber-50 border border-amber-250 text-amber-700' },
            verified: { label: 'Terverifikasi', style: 'bg-teal-50 border border-teal-250 text-teal-700' },
            resolved: { label: 'Selesai', style: 'bg-emerald-50 border border-emerald-250 text-emerald-700' },
            rejected: { label: 'Ditolak', style: 'bg-red-50 border border-red-250 text-red-700' },
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
            <div className="flex gap-1.5">
              {row.status === 'pending' && (
                <button
                  onClick={() => handleVerify(row.id)}
                  title="Verifikasi Laporan"
                  className="p-1.5 bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-700 rounded-lg transition-colors"
                >
                  <ShieldCheck className="w-4 h-4" />
                </button>
              )}
              {row.status === 'verified' && (
                <button
                  onClick={() => handleResolve(row.id)}
                  title="Selesaikan Kejadian"
                  className="p-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-lg transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                </button>
              )}
              {row.status !== 'rejected' && row.status !== 'resolved' && (
                <button
                  onClick={() => handleReject(row.id)}
                  title="Tolak Laporan"
                  className="p-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-lg transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => handleDelete(row.id)}
                title="Hapus Laporan"
                className="p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
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
            className="w-full text-xs py-2.5 pl-9 pr-4 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        {/* Refresh Trigger */}
        <button
          onClick={() => refetch()}
          className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-2 transition-colors w-full sm:w-auto justify-center"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Muat Ulang Data</span>
        </button>
      </div>

      {/* Main Datagrid Container */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-slate-200 bg-slate-50">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-3.5 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider select-none cursor-pointer hover:text-slate-700"
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
                  <td colSpan={columns.length} className="px-6 py-12 text-center text-xs text-slate-400">
                    Memuat Laporan...
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center text-xs text-slate-400">
                    Tidak ada laporan ditemukan.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-slate-150 hover:bg-slate-50/50 transition-colors"
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
        <div className="p-4 border-t border-slate-200 flex justify-between items-center bg-white">
          <div className="text-xs text-slate-500 font-bold">
            Halaman{' '}
            <span className="text-slate-800">{table.getState().pagination.pageIndex + 1}</span> dari{' '}
            <span className="text-slate-800">{table.getPageCount()}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Zoom Image Modal */}
      {zoomedImage && createPortal(
        <div
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[85vh] bg-white p-2 rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <img
              src={zoomedImage}
              alt="Zoomed Report"
              className="max-w-full max-h-[80vh] object-contain rounded-xl"
            />
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute top-4 right-4 bg-black/60 hover:bg-black text-white px-3 py-1.5 rounded-full font-bold transition-colors"
            >
              Tutup ✕
            </button>
          </div>
        </div>,
        document.body
      )}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
