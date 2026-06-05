import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { useState } from "react";
import { useCreateReport } from "../../use-cases/hooks/useReports";
import type { ReportCategory } from "../../domain/entities/report";
import { FileText, Compass, CheckCircle, WifiOff, Send } from "lucide-react";

export const Route = createFileRoute("/warga/report-safety")({
  component: WargaReportSafety,
});

const reportValidationSchema = z.object({
  category: z.enum([
    "crime",
    "accident",
    "natural_disaster",
    "hazard",
    "road_block",
    "other",
  ]),
  title: z.string().min(5, "Judul minimal 5 karakter"),
  description: z.string().min(10, "Deskripsi kejadian minimal 10 karakter"),
  district: z.string().min(3, "Nama kecamatan wajib diisi"),
  latitude: z.number({ message: "Latitude wajib diisi" }),
  longitude: z.number({ message: "Longitude wajib diisi" }),
});

function WargaReportSafety() {
  const createReport = useCreateReport();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // TanStack Form Setup
  const form = useForm({
    defaultValues: {
      category: "hazard" as ReportCategory,
      title: "",
      description: "",
      district: "",
      latitude: 0,
      longitude: 0,
      image: undefined as File | undefined,
    },
    onSubmit: async ({ value }) => {
      try {
        const result = await createReport.mutateAsync(value);
        setSuccessMessage(result.message);
        setPreviewUrl(null);
        form.reset();
      } catch (err) {
        console.error(err);
      }
    },
  });

  const acquireGPS = () => {
    setGpsLoading(true);
    if (!navigator.geolocation) {
      alert("Geolocation tidak didukung browser.");
      setGpsLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        form.setFieldValue("latitude", pos.coords.latitude);
        form.setFieldValue("longitude", pos.coords.longitude);
        setGpsLoading(false);
      },
      () => {
        // Fallback mockup coordinate in Madiun
        form.setFieldValue("latitude", -7.6167);
        form.setFieldValue("longitude", 111.65);
        setGpsLoading(false);
      },
      { enableHighAccuracy: true },
    );
  };

  return (
    <div className="flex flex-col flex-1 p-5 space-y-4 bg-slate-50">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-100">
          <FileText className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h3 className="font-extrabold text-slate-800 text-sm">
            Laporkan Kerawanan Wilayah
          </h3>
          <p className="text-[10px] text-slate-400">
            Laporkan lubang jalan, pohon tumbang, kriminalitas, dll.
          </p>
        </div>
      </div>

      {/* Success banner */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-250 rounded-2xl flex items-start gap-2.5 animate-fade-in-up">
          <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-emerald-800">
              Laporan Tercatat
            </h4>
            <p className="text-[10px] text-slate-500 leading-relaxed mt-1">
              {successMessage}
            </p>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-[10px] text-emerald-600 font-bold underline mt-2"
            >
              Buat Laporan Baru
            </button>
          </div>
        </div>
      )}

      {/* Connection notification if offline */}
      {!navigator.onLine && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2 text-[10px] text-amber-800">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>
            Koneksi Offline. Laporan akan disimpan di HP Anda dan dikirim saat
            internet aktif.
          </span>
        </div>
      )}

      {!successMessage && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4"
        >
          {/* Category */}
          <form.Field name="category">
            {(field) => (
              <div className="space-y-1">
                <label
                  htmlFor={field.name}
                  className="text-xs font-bold text-slate-500 block"
                >
                  Kategori Kejadian
                </label>
                <select
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) =>
                    field.handleChange(e.target.value as ReportCategory)
                  }
                  className="w-full text-xs py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="hazard">
                    Bahaya Jalan (Pohon, Kabel, Jalan Rusak)
                  </option>
                  <option value="crime">
                    Tindakan Kriminal (Pencurian, Begal, Sajam)
                  </option>
                  <option value="accident">Kecelakaan Lalu Lintas</option>
                  <option value="natural_disaster">
                    Bencana Alam (Tanah Longsor, Banjir)
                  </option>
                  <option value="road_block">Penutupan Jalan / Hambatan</option>
                  <option value="other">Kejadian Lainnya</option>
                </select>
              </div>
            )}
          </form.Field>

          {/* Title */}
          <form.Field
            name="title"
            validators={{
              onChange: reportValidationSchema.shape.title,
            }}
          >
            {(field) => (
              <div className="space-y-1">
                <label
                  htmlFor={field.name}
                  className="text-xs font-bold text-slate-500 block"
                >
                  Judul Laporan
                </label>
                <input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Misal: Pohon tumbang menutup jalan lingkar"
                  className="w-full text-xs py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                {field.state.meta.errors && (
                  <span className="text-[10px] text-red-500 mt-0.5 block px-1">
                    {field.state.meta.errors.join(", ")}
                  </span>
                )}
              </div>
            )}
          </form.Field>

          {/* Description */}
          <form.Field
            name="description"
            validators={{
              onChange: reportValidationSchema.shape.description,
            }}
          >
            {(field) => (
              <div className="space-y-1">
                <label
                  htmlFor={field.name}
                  className="text-xs font-bold text-slate-500 block"
                >
                  Deskripsi Detail
                </label>
                <textarea
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Jelaskan kondisi secara detil (misal: menghalangi total jalan, bisa dilewati motor saja)"
                  rows={3}
                  className="w-full text-xs py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                {field.state.meta.errors && (
                  <span className="text-[10px] text-red-500 mt-0.5 block px-1">
                    {field.state.meta.errors.join(", ")}
                  </span>
                )}
              </div>
            )}
          </form.Field>

          {/* District */}
          <form.Field
            name="district"
            validators={{
              onChange: reportValidationSchema.shape.district,
            }}
          >
            {(field) => (
              <div className="space-y-1">
                <label
                  htmlFor={field.name}
                  className="text-xs font-bold text-slate-500 block"
                >
                  Kecamatan Wilayah
                </label>
                <input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Misal: Saradan, Dagangan, Kare"
                  className="w-full text-xs py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                {field.state.meta.errors && (
                  <span className="text-[10px] text-red-500 mt-0.5 block px-1">
                    {field.state.meta.errors.join(", ")}
                  </span>
                )}
              </div>
            )}
          </form.Field>

          {/* Image Upload Field */}
          <form.Field name="image">
            {(field) => {
              const handleFileChange = (
                e: React.ChangeEvent<HTMLInputElement>,
              ) => {
                const file = e.target.files?.[0];
                if (file) {
                  field.handleChange(file);
                  setPreviewUrl(URL.createObjectURL(file));
                } else {
                  field.handleChange(undefined);
                  setPreviewUrl(null);
                }
              };

              return (
                <div className="space-y-1">
                  <label
                    htmlFor="image-upload"
                    className="text-xs font-bold text-slate-500 block"
                  >
                    Foto Kejadian / Lokasi (Opsional)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      id="image-upload"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="image-upload"
                      className="cursor-pointer px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 font-semibold hover:bg-slate-100 transition-colors flex items-center gap-2"
                    >
                      <span>Pilih Foto</span>
                    </label>
                    {field.state.value && (
                      <span className="text-[10px] text-slate-400 truncate max-w-37.5">
                        {(field.state.value as File).name}
                      </span>
                    )}
                  </div>
                  {previewUrl && (
                    <div className="mt-2 relative w-full h-40 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center">
                      <img
                        src={previewUrl}
                        alt="Preview aduan"
                        className="max-h-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          field.handleChange(undefined);
                          setPreviewUrl(null);
                        }}
                        className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg hover:bg-red-500 shadow-sm"
                      >
                        Hapus
                      </button>
                    </div>
                  )}
                </div>
              );
            }}
          </form.Field>

          {/* GPS Coordinates Group */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold text-slate-500">
                Koordinat Lokasi Kejadian
              </span>
              <button
                type="button"
                onClick={acquireGPS}
                className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-600 font-bold rounded-lg text-[10px] transition-colors flex items-center gap-1"
              >
                <Compass
                  className={`w-3.5 h-3.5 ${gpsLoading ? "animate-spin" : ""}`}
                />
                <span>{gpsLoading ? "Melacak GPS..." : "Gunakan GPS HP"}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <form.Field
                name="latitude"
                validators={{
                  onChange: reportValidationSchema.shape.latitude,
                }}
              >
                {(field) => (
                  <div>
                    <label
                      htmlFor={field.name}
                      className="text-[9px] text-slate-400 uppercase tracking-wider block mb-1"
                    >
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onChange={(e) =>
                        field.handleChange(parseFloat(e.target.value) || 0)
                      }
                      className="w-full text-[10px] p-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                )}
              </form.Field>

              <form.Field
                name="longitude"
                validators={{
                  onChange: reportValidationSchema.shape.longitude,
                }}
              >
                {(field) => (
                  <div>
                    <label
                      htmlFor={field.name}
                      className="text-[9px] text-slate-400 uppercase tracking-wider block mb-1"
                    >
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onChange={(e) =>
                        field.handleChange(parseFloat(e.target.value) || 0)
                      }
                      className="w-full text-[10px] p-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                )}
              </form.Field>
            </div>
          </div>

          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
          >
            {([canSubmit, isSubmitting]) => (
              <button
                type="submit"
                disabled={!canSubmit || isSubmitting || createReport.isPending}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {isSubmitting || createReport.isPending
                    ? "Mengirim Laporan..."
                    : "Kirim Laporan Kerawanan"}
                </span>
              </button>
            )}
          </form.Subscribe>
        </form>
      )}
    </div>
  );
}
