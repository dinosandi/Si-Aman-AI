import { createFileRoute } from "@tanstack/react-router";
import { useForm, useStore } from "@tanstack/react-form";
import { z } from "zod";
import { useState, useEffect, useRef } from "react";
import { useCreateReport } from "../../use-cases/hooks/useReports";
import type { ReportCategory } from "../../domain/entities/report";
import { FileText, Compass, CheckCircle, WifiOff, Send } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet marker icons in Vite
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIconRetina from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIconRetina,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

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
  district: z.string().min(3, "Deskripsi lokasi wajib diisi"),
  latitude: z.number({ message: "Latitude wajib diisi" }),
  longitude: z.number({ message: "Longitude wajib diisi" }),
});

function WargaReportSafety() {
  const createReport = useCreateReport();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Map elements ref
  const miniMapRef = useRef<HTMLDivElement>(null);
  const miniMapInstanceRef = useRef<L.Map | null>(null);
  const markerInstanceRef = useRef<L.Marker | null>(null);

  // TanStack Form Setup
  const form = useForm({
    defaultValues: {
      category: "hazard" as ReportCategory,
      title: "JalanRusak",
      description: "",
      district: "",
      latitude: -7.6167,
      longitude: 111.65,
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

  const currentCategory = useStore(
    form.store,
    (state) => state.values.category,
  );
  const latValue = useStore(form.store, (state) => state.values.latitude);
  const lngValue = useStore(form.store, (state) => state.values.longitude);

  // Initialize mini map
  useEffect(() => {
    if (!miniMapRef.current) return;

    const initialLat = form.state.values.latitude || -7.6167;
    const initialLng = form.state.values.longitude || 111.65;

    const map = L.map(miniMapRef.current, {
      zoomControl: true,
      attributionControl: false,
    }).setView([initialLat, initialLng], 15);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(
      map,
    );

    const marker = L.marker([initialLat, initialLng], {
      draggable: true,
    }).addTo(map);

    marker.on("dragend", () => {
      const latLng = marker.getLatLng();
      form.setFieldValue("latitude", latLng.lat);
      form.setFieldValue("longitude", latLng.lng);
    });

    miniMapInstanceRef.current = map;
    markerInstanceRef.current = marker;

    map.on("click", (e) => {
      marker.setLatLng(e.latlng);
      form.setFieldValue("latitude", e.latlng.lat);
      form.setFieldValue("longitude", e.latlng.lng);
    });

    return () => {
      map.remove();
      miniMapInstanceRef.current = null;
      markerInstanceRef.current = null;
    };
  }, []);

  // Sync marker position when lat/lng state changes
  useEffect(() => {
    if (miniMapInstanceRef.current && markerInstanceRef.current) {
      const currentLatLng = markerInstanceRef.current.getLatLng();
      if (currentLatLng.lat !== latValue || currentLatLng.lng !== lngValue) {
        markerInstanceRef.current.setLatLng([latValue, lngValue]);
        miniMapInstanceRef.current.setView([latValue, lngValue]);
      }
    }
  }, [latValue, lngValue]);

  const acquireGPS = () => {
    if (!navigator.geolocation) {
      alert("Geolocation tidak didukung browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        form.setFieldValue("latitude", pos.coords.latitude);
        form.setFieldValue("longitude", pos.coords.longitude);
      },
      () => {
        // Fallback mockup coordinate in Madiun
        form.setFieldValue("latitude", -7.6167);
        form.setFieldValue("longitude", 111.65);
      },
      { enableHighAccuracy: true },
    );
  };

  // Auto-acquire GPS on mount
  useEffect(() => {
    acquireGPS();
  }, []);

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
                  onChange={(e) => {
                    const val = e.target.value as ReportCategory;
                    field.handleChange(val);

                    const autoTitles: Record<string, string> = {
                      accident: "Kecelakaan",
                      crime: "Kriminal",
                      natural_disaster: "BencanaAlam",
                      hazard: "JalanRusak",
                    };

                    if (val !== "other") {
                      form.setFieldValue("title", autoTitles[val] || "Other");
                    } else {
                      form.setFieldValue("title", "");
                    }
                  }}
                  className="w-full text-xs py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="accident">Kecelakaan</option>
                  <option value="crime">Kriminal</option>
                  <option value="natural_disaster">Bencana Alam</option>
                  <option value="hazard">Jalan Rusak</option>
                  <option value="other">Lainnya</option>
                </select>
              </div>
            )}
          </form.Field>

          {/* Title - Only visible if category is "other" */}
          {currentCategory === "other" && (
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
          )}

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
                  <span className="text-[10px] text-red-500 block mt-0.5">
                    {field.state.meta.errors.map((err: any) => err.message)}
                  </span>
                )}
              </div>
            )}
          </form.Field>

          {/* District -> Deskripsi Lokasi */}
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
                  Deskripsi Lokasi
                </label>
                <input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Misal: Dekat pos ronda RT 02, depan warung Madura"
                  className="w-full text-xs py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                {field.state.meta.errors && (
                  <span className="text-[10px] text-red-500 mt-0.5 block px-1">
                    {field.state.meta.errors.map((err: any) => err.message)}
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
                    Foto Kejadian / Lokasi
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

            {/* Mini Interactive Map */}
            <div className="relative w-full h-44 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 z-10">
              <div ref={miniMapRef} className="w-full h-full" />
              <div className="absolute bottom-2 left-2 bg-slate-900/75 backdrop-blur-sm text-[8px] font-black text-white px-2 py-1 rounded shadow-md pointer-events-none z-[1000]">
                Geser pin untuk akurasi lokasi
              </div>
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
