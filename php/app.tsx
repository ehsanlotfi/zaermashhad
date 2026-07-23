import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import {
  Bus,
  Users,
  BarChart2,
  LogOut,
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  Check,
  ChevronRight,
  ChevronLeft,
  Upload,
  Download,
  Printer,
  ArrowRightLeft,
  User,
  CheckSquare,
  Square,
  RefreshCw,
  FileText,
  AlertCircle,
  Camera,
} from "lucide-react";

const API = "/api";

function toJalali(date: Date): string {
  const g = [date.getFullYear(), date.getMonth() + 1, date.getDate()];
  const g_days_in_month = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const j_days_in_month = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];
  let jy: number, jm: number, jd: number;
  let gy = g[0] - 1600;
  let gm = g[1] - 1;
  let gd = g[2] - 1;
  let g_day_no =
    365 * gy +
    Math.floor((gy + 3) / 4) -
    Math.floor((gy + 99) / 100) +
    Math.floor((gy + 399) / 400);
  for (let i = 0; i < gm; ++i) g_day_no += g_days_in_month[i];
  if (gm > 1 && ((gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0))
    ++g_day_no;
  g_day_no += gd;
  let j_day_no = g_day_no - 79;
  let j_np = Math.floor(j_day_no / 12053);
  j_day_no %= 12053;
  jy = 979 + 33 * j_np + 4 * Math.floor(j_day_no / 1461);
  j_day_no %= 1461;
  if (j_day_no >= 366) {
    jy += Math.floor((j_day_no - 1) / 365);
    j_day_no = (j_day_no - 1) % 365;
  }
  let i: number;
  for (i = 0; i < 11 && j_day_no >= j_days_in_month[i]; ++i)
    j_day_no -= j_days_in_month[i];
  jm = i + 1;
  jd = j_day_no + 1;
  const h = date.getHours().toString().padStart(2, "0");
  const mn = date.getMinutes().toString().padStart(2, "0");
  return `${jy}/${jm.toString().padStart(2, "0")}/${jd
    .toString()
    .padStart(2, "0")} ${h}:${mn}`;
}

function formatJalali(dateStr: string): string {
  if (!dateStr) return "";
  try {
    return toJalali(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

const genderLabel = (g: string) => (g === "male" ? "مرد" : "زن");

async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<any> {
  const res = await fetch(`${API}${path}`, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "خطای سرور" }));
    throw new Error(err.error || "خطای سرور");
  }
  return res.json();
}

function useToast() {
  const [toasts, setToasts] = useState<
    { id: number; msg: string; type: "success" | "error" }[]
  >([]);
  const add = useCallback(
    (msg: string, type: "success" | "error" = "success") => {
      const id = Date.now();
      setToasts((p) => [...p, { id, msg, type }]);
      setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3000);
    },
    []
  );
  return { toasts, add };
}

function Toast({
  toasts,
}: {
  toasts: { id: number; msg: string; type: string }[];
}) {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 min-w-[260px]">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-5 py-3 rounded-xl shadow-lg text-white text-center text-sm font-medium transition-all ${
            t.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {t.msg}
        </div>
      ))}
    </div>
  );
}

function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div
        className={`bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] ${
          wide ? "w-full max-w-3xl" : "w-full max-w-md"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100"
          >
            <X size={20} />
          </button>
          <h2 className="font-bold text-lg">{title}</h2>
        </div>
        <div className="overflow-y-auto flex-1 p-5">{children}</div>
      </div>
    </div>
  );
}

function ImageUpload({
  currentId,
  folder,
  onFile,
}: {
  currentId?: string;
  folder: "caravans" | "pilgrims";
  onFile: (f: File | null) => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);
  const src =
    currentId ? `/api/uploads/${folder}/${currentId}.png?t=${Date.now()}` : null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    onFile(f);
    if (f) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(f);
    }
  };

  return (
    <div
      className="flex flex-col items-center gap-2 cursor-pointer"
      onClick={() => ref.current?.click()}
    >
      <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 overflow-hidden flex items-center justify-center bg-gray-50">
        {preview ? (
          <img src={preview} className="w-full h-full object-cover" alt="" />
        ) : src ? (
          <img
            src={src}
            className="w-full h-full object-cover"
            alt=""
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <Camera size={28} className="text-gray-400" />
        )}
      </div>
      <span className="text-xs text-gray-500">کلیک کنید برای آپلود تصویر</span>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}

function PilgrimImage({
  id,
  size = 48,
}: {
  id: string;
  size?: number;
}) {
  const [err, setErr] = useState(false);
  return err ? (
    <div
      className="rounded-full bg-gray-200 flex items-center justify-center text-gray-400"
      style={{ width: size, height: size }}
    >
      <User size={size * 0.5} />
    </div>
  ) : (
    <img
      src={`/api/uploads/pilgrims/${id}.png`}
      className="rounded-full object-cover"
      style={{ width: size, height: size }}
      onError={() => setErr(true)}
      alt=""
    />
  );
}

function CaravanImage({ id, size = 48 }: { id: string; size?: number }) {
  const [err, setErr] = useState(false);
  return err ? (
    <div
      className="rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-400"
      style={{ width: size, height: size }}
    >
      <Bus size={size * 0.5} />
    </div>
  ) : (
    <img
      src={`/api/uploads/caravans/${id}.png`}
      className="rounded-xl object-cover"
      style={{ width: size, height: size }}
      onError={() => setErr(true)}
      alt=""
    />
  );
}

interface Caravan {
  Id: string;
  Name: string;
  City: string;
  PilgrimCount: number;
}

interface Pilgrim {
  Id: string;
  CaravanId: string;
  FullName: string;
  NationalCode: string;
  Gender: string;
}

interface Traffic {
  Id: string;
  PilgrimId: string;
  DateTime: string;
  type: string;
}

function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [pass, setPass] = useState("");
  const [err, setErr] = useState(false);

  const handleLogin = () => {
    if (pass === "Aa123456") {
      onLogin();
    } else {
      setErr(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm flex flex-col items-center gap-6">
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center">
          <Bus size={32} className="text-white" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">
            سیستم مدیریت تردد زائرین
          </h1>
          <p className="text-sm text-gray-500 mt-1">لطفا رمز عبور را وارد کنید</p>
        </div>
        <div className="w-full">
          <input
            type="password"
            value={pass}
            onChange={(e) => {
              setPass(e.target.value);
              setErr(false);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="رمز عبور"
            className={`w-full border-2 rounded-xl px-4 py-3 text-center text-lg outline-none transition ${
              err ? "border-red-500" : "border-gray-200 focus:border-indigo-500"
            }`}
            autoFocus
          />
          {err && (
            <p className="text-red-500 text-sm text-center mt-2">
              رمز عبور اشتباه است
            </p>
          )}
        </div>
        <button
          onClick={handleLogin}
          className="w-full bg-indigo-600 text-white rounded-xl py-3 text-lg font-bold hover:bg-indigo-700 transition"
        >
          ورود
        </button>
      </div>
    </div>
  );
}

function PilgrimEditModal({
  open,
  onClose,
  pilgrim,
  caravans,
  onSaved,
  toast,
}: {
  open: boolean;
  onClose: () => void;
  pilgrim: Pilgrim | null;
  caravans: Caravan[];
  onSaved: () => void;
  toast: (msg: string, t?: "success" | "error") => void;
}) {
  const [form, setForm] = useState({
    fullName: "",
    nationalCode: "",
    gender: "male",
    caravanId: "",
  });
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (pilgrim) {
      setForm({
        fullName: pilgrim.FullName,
        nationalCode: pilgrim.NationalCode,
        gender: pilgrim.Gender,
        caravanId: pilgrim.CaravanId,
      });
    }
  }, [pilgrim]);

  const handleSave = async () => {
    if (!form.fullName || !form.nationalCode || !form.caravanId) {
      toast("همه فیلدها الزامی است", "error");
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      if (pilgrim) fd.append("id", pilgrim.Id);
      fd.append("caravanId", form.caravanId);
      fd.append("fullName", form.fullName);
      fd.append("nationalCode", form.nationalCode);
      fd.append("gender", form.gender);
      if (imgFile) fd.append("image", imgFile);
      await apiFetch("/pilgrim/upsert", { method: "POST", body: fd });
      toast("اطلاعات ذخیره شد");
      onSaved();
      onClose();
    } catch (e: any) {
      toast(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="ویرایش زائر">
      <div className="flex flex-col gap-4">
        <ImageUpload
          currentId={pilgrim?.Id}
          folder="pilgrims"
          onFile={setImgFile}
        />
        <div>
          <label className="text-sm text-gray-600 block mb-1">نام کامل</label>
          <input
            className="w-full border rounded-xl px-3 py-2 outline-none focus:border-indigo-500"
            value={form.fullName}
            onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
          />
        </div>
        <div>
          <label className="text-sm text-gray-600 block mb-1">کد ملی</label>
          <input
            className="w-full border rounded-xl px-3 py-2 outline-none focus:border-indigo-500"
            value={form.nationalCode}
            onChange={(e) =>
              setForm((p) => ({ ...p, nationalCode: e.target.value }))
            }
          />
        </div>
        <div>
          <label className="text-sm text-gray-600 block mb-1">جنسیت</label>
          <select
            className="w-full border rounded-xl px-3 py-2 outline-none focus:border-indigo-500"
            value={form.gender}
            onChange={(e) =>
              setForm((p) => ({ ...p, gender: e.target.value }))
            }
          >
            <option value="male">مرد</option>
            <option value="female">زن</option>
          </select>
        </div>
        <div>
          <label className="text-sm text-gray-600 block mb-1">کاروان</label>
          <select
            className="w-full border rounded-xl px-3 py-2 outline-none focus:border-indigo-500"
            value={form.caravanId}
            onChange={(e) =>
              setForm((p) => ({ ...p, caravanId: e.target.value }))
            }
          >
            <option value="">انتخاب کنید</option>
            {caravans.map((c) => (
              <option key={c.Id} value={c.Id}>
                {c.Name}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-indigo-600 text-white rounded-xl py-3 font-bold hover:bg-indigo-700 transition disabled:opacity-50"
        >
          {loading ? "در حال ذخیره..." : "ذخیره"}
        </button>
      </div>
    </Modal>
  );
}

function TrafficPage({
  caravans,
  onCaravanClick,
  toast,
}: {
  caravans: Caravan[];
  onCaravanClick: () => void;
  toast: (msg: string, t?: "success" | "error") => void;
}) {
  const [code, setCode] = useState("");
  const [lastCard, setLastCard] = useState<{
    pilgrim: Pilgrim;
    caravan: Caravan | undefined;
    lastTraffic: string;
    type: string;
  } | null>(null);
  const [editModal, setEditModal] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [searching, setSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleScan = useCallback(async () => {
    const trimmed = code.trim();
    if (!trimmed) return;
    setSearching(true);
    setNotFound(false);
    try {
      const pilgrimsRes = await apiFetch(
        `/pilgrim/list?caravanId=all_search&pilgrimId=${trimmed}`
      ).catch(() => null);

      let foundPilgrim: Pilgrim | null = null;
      for (const c of caravans) {
        const res = await apiFetch(`/pilgrim/list?caravanId=${c.Id}`);
        const pilgrims: Pilgrim[] = res.data || [];
        const p = pilgrims.find((pl) => pl.Id === trimmed);
        if (p) {
          foundPilgrim = p;
          break;
        }
      }

      if (!foundPilgrim) {
        setNotFound(true);
        setCode("");
        inputRef.current?.focus();
        return;
      }

      const trafficRes = await apiFetch("/traffic/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pilgrimId: foundPilgrim.Id }),
      });

      const trafficsRes = await apiFetch(
        `/traffic/list?pilgrimId=${foundPilgrim.Id}`
      );
      const traffics: Traffic[] = trafficsRes.data || [];
      const last = traffics[traffics.length - 1];
      const caravan = caravans.find((c) => c.Id === foundPilgrim!.CaravanId);

      setLastCard({
        pilgrim: foundPilgrim,
        caravan,
        lastTraffic: last?.DateTime || "",
        type: trafficRes.data?.type || "entry",
      });
      setCode("");
      inputRef.current?.focus();
      toast(
        `تردد ${trafficRes.data?.type === "entry" ? "ورود" : "خروج"} ثبت شد`,
        "success"
      );
    } catch (e: any) {
      toast(e.message, "error");
    } finally {
      setSearching(false);
    }
  }, [code, caravans, toast]);

  useEffect(() => {
    if (code.length === 6) {
      handleScan();
    }
  }, [code]);

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="bg-white rounded-2xl shadow p-4 flex flex-col gap-3">
        <label className="text-gray-600 text-sm font-medium text-center">
          کد زائر را وارد کنید یا اسکن نمایید
        </label>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
              setNotFound(false);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleScan()}
            placeholder="000000"
            maxLength={6}
            className={`w-full text-center text-4xl font-bold tracking-widest border-2 rounded-2xl px-4 py-5 outline-none transition ${
              notFound
                ? "border-red-500 bg-red-50"
                : "border-indigo-300 focus:border-indigo-600"
            }`}
            style={{ letterSpacing: "0.3em" }}
          />
          {searching && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <RefreshCw size={20} className="animate-spin text-indigo-500" />
            </div>
          )}
        </div>
        {notFound && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-xl p-3">
            <AlertCircle size={18} />
            <span className="text-sm">زائر با این کد یافت نشد</span>
          </div>
        )}
        <button
          onClick={handleScan}
          disabled={searching || code.length !== 6}
          className="w-full bg-indigo-600 text-white rounded-xl py-3 font-bold hover:bg-indigo-700 transition disabled:opacity-40"
        >
          ثبت تردد
        </button>
      </div>

      {lastCard && (
        <div
          className={`bg-white rounded-2xl shadow-lg border-r-4 ${
            lastCard.type === "entry" ? "border-green-500" : "border-red-500"
          } p-5`}
        >
          <div className="flex items-start gap-4">
            <PilgrimImage id={lastCard.pilgrim.Id} size={72} />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800">
                  {lastCard.pilgrim.FullName}
                </h3>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-bold ${
                    lastCard.type === "entry"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {lastCard.type === "entry" ? "ورود" : "خروج"}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-gray-600">
                <div>
                  <span className="text-gray-400">کد ملی: </span>
                  {lastCard.pilgrim.NationalCode}
                </div>
                <div>
                  <span className="text-gray-400">جنسیت: </span>
                  {genderLabel(lastCard.pilgrim.Gender)}
                </div>
                <div>
                  <span className="text-gray-400">کاروان: </span>
                  {lastCard.caravan?.Name || "-"}
                </div>
                <div>
                  <span className="text-gray-400">آخرین تردد: </span>
                  {formatJalali(lastCard.lastTraffic)}
                </div>
              </div>
              <button
                onClick={() => setEditModal(true)}
                className="mt-3 flex items-center gap-1 text-indigo-600 text-sm font-medium hover:underline"
              >
                <Edit2 size={14} />
                ویرایش
              </button>
            </div>
          </div>
        </div>
      )}

      <PilgrimEditModal
        open={editModal}
        onClose={() => setEditModal(false)}
        pilgrim={lastCard?.pilgrim || null}
        caravans={caravans}
        onSaved={() => {}}
        toast={toast}
      />
    </div>
  );
}

function PilgrimFormModal({
  open,
  onClose,
  pilgrim,
  caravanId,
  onSaved,
  toast,
}: {
  open: boolean;
  onClose: () => void;
  pilgrim: Pilgrim | null;
  caravanId: string;
  onSaved: () => void;
  toast: (msg: string, t?: "success" | "error") => void;
}) {
  const [form, setForm] = useState({
    fullName: "",
    nationalCode: "",
    gender: "male",
  });
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (pilgrim) {
      setForm({
        fullName: pilgrim.FullName,
        nationalCode: pilgrim.NationalCode,
        gender: pilgrim.Gender,
      });
    } else {
      setForm({ fullName: "", nationalCode: "", gender: "male" });
    }
    setImgFile(null);
  }, [pilgrim, open]);

  const handleSave = async () => {
    if (!form.fullName || !form.nationalCode) {
      toast("همه فیلدها الزامی است", "error");
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      if (pilgrim) fd.append("id", pilgrim.Id);
      fd.append("caravanId", caravanId);
      fd.append("fullName", form.fullName);
      fd.append("nationalCode", form.nationalCode);
      fd.append("gender", form.gender);
      if (imgFile) fd.append("image", imgFile);
      await apiFetch("/pilgrim/upsert", { method: "POST", body: fd });
      toast("زائر ذخیره شد");
      onSaved();
      onClose();
    } catch (e: any) {
      toast(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={pilgrim ? "ویرایش زائر" : "افزودن زائر"}
    >
      <div className="flex flex-col gap-4">
        <ImageUpload
          currentId={pilgrim?.Id}
          folder="pilgrims"
          onFile={setImgFile}
        />
        <div>
          <label className="text-sm text-gray-600 block mb-1">نام کامل</label>
          <input
            className="w-full border rounded-xl px-3 py-2 outline-none focus:border-indigo-500"
            value={form.fullName}
            onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
          />
        </div>
        <div>
          <label className="text-sm text-gray-600 block mb-1">کد ملی</label>
          <input
            className="w-full border rounded-xl px-3 py-2 outline-none focus:border-indigo-500"
            value={form.nationalCode}
            onChange={(e) =>
              setForm((p) => ({ ...p, nationalCode: e.target.value }))
            }
          />
        </div>
        <div>
          <label className="text-sm text-gray-600 block mb-1">جنسیت</label>
          <select
            className="w-full border rounded-xl px-3 py-2 outline-none focus:border-indigo-500"
            value={form.gender}
            onChange={(e) =>
              setForm((p) => ({ ...p, gender: e.target.value }))
            }
          >
            <option value="male">مرد</option>
            <option value="female">زن</option>
          </select>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-indigo-600 text-white rounded-xl py-3 font-bold hover:bg-indigo-700 transition disabled:opacity-50"
        >
          {loading ? "در حال ذخیره..." : "ذخیره"}
        </button>
      </div>
    </Modal>
  );
}

const CARD_CONFIG = {
  width: 320,
  height: 200,
  photo: { x: 16, y: 16, size: 80 },
  fields: [
    { key: "fullName", label: "نام:", x: 110, y: 24, fontSize: 14, bold: true },
    { key: "nationalCode", label: "کد ملی:", x: 110, y: 56, fontSize: 12, bold: false },
    { key: "id", label: "شناسه:", x: 110, y: 80, fontSize: 12, bold: false },
    { key: "caravan", label: "کاروان:", x: 110, y: 104, fontSize: 12, bold: false },
    { key: "fixed1", label: "حج تمتع ۱۴۰۳", x: 110, y: 136, fontSize: 11, bold: false },
  ],
};

function PilgrimCard({
  pilgrim,
  caravanName,
}: {
  pilgrim: Pilgrim;
  caravanName: string;
}) {
  const [imgErr, setImgErr] = useState(false);
  const { width, height, photo, fields } = CARD_CONFIG;

  const getValue = (key: string) => {
    if (key === "fullName") return pilgrim.FullName;
    if (key === "nationalCode") return pilgrim.NationalCode;
    if (key === "id") return pilgrim.Id;
    if (key === "caravan") return caravanName;
    if (key === "fixed1") return "حج تمتع ۱۴۰۳";
    return "";
  };

  return (
    <div
      className="relative rounded-xl overflow-hidden shadow-md border border-gray-200 print-card"
      style={{
        width,
        height,
        backgroundImage:
          "repeating-linear-gradient(45deg, #f0f4ff 0px, #f0f4ff 2px, transparent 2px, transparent 12px), repeating-linear-gradient(-45deg, #e8eeff 0px, #e8eeff 2px, transparent 2px, transparent 12px)",
        backgroundColor: "#f8f9ff",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: photo.x,
          top: photo.y,
          width: photo.size,
          height: photo.size,
        }}
      >
        {imgErr ? (
          <div
            className="rounded-full bg-indigo-100 flex items-center justify-center"
            style={{ width: photo.size, height: photo.size }}
          >
            <User size={photo.size * 0.5} className="text-indigo-400" />
          </div>
        ) : (
          <img
            src={`/api/uploads/pilgrims/${pilgrim.Id}.png`}
            className="rounded-full object-cover border-2 border-white shadow"
            style={{ width: photo.size, height: photo.size }}
            onError={() => setImgErr(true)}
            alt=""
          />
        )}
      </div>
      {fields.map((f) => (
        <div
          key={f.key}
          style={{
            position: "absolute",
            right: f.x,
            top: f.y,
            fontSize: f.fontSize,
            fontWeight: f.bold ? "bold" : "normal",
            color: "#1e293b",
            direction: "rtl",
          }}
        >
          <span className="text-gray-400 ml-1">{f.label}</span>
          {getValue(f.key)}
        </div>
      ))}
      <div
        style={{
          position: "absolute",
          bottom: 10,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: 9,
          color: "#6366f1",
        }}
      >
        سیستم مدیریت تردد زائرین
      </div>
    </div>
  );
}

function PrintCardsPage({
  caravan,
  pilgrims,
  onBack,
}: {
  caravan: Caravan;
  pilgrims: Pilgrim[];
  onBack: () => void;
}) {
  return (
    <div>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-area { display: flex !important; }
          body { background: white; }
          .print-card {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>
      <div className="no-print flex items-center gap-3 p-4 bg-white shadow mb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-indigo-600"
        >
          <ChevronRight size={20} />
          بازگشت
        </button>
        <span className="font-bold">کارت‌های زائرین - {caravan.Name}</span>
        <button
          onClick={() => window.print()}
          className="mr-auto flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700"
        >
          <Printer size={16} />
          چاپ
        </button>
      </div>
      <div
        className="print-area flex flex-wrap gap-4 p-4 justify-center"
        style={{ direction: "rtl" }}
      >
        {pilgrims.map((p) => (
          <PilgrimCard key={p.Id} pilgrim={p} caravanName={caravan.Name} />
        ))}
      </div>
    </div>
  );
}

function PilgrimManagementPage({
  caravan,
  onBack,
  toast,
}: {
  caravan: Caravan;
  onBack: () => void;
  toast: (msg: string, t?: "success" | "error") => void;
}) {
  const [pilgrims, setPilgrims] = useState<Pilgrim[]>([]);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Pilgrim | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Pilgrim | null>(null);
  const [printing, setPrinting] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/pilgrim/list?caravanId=${caravan.Id}`);
      setPilgrims(res.data || []);
    } catch (e: any) {
      toast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [caravan.Id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiFetch("/pilgrim/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteTarget.Id }),
      });
      toast("زائر حذف شد");
      setDeleteTarget(null);
      load();
    } catch (e: any) {
      toast(e.message, "error");
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("caravanId", caravan.Id);
    fd.append("file", file);
    try {
      const res = await apiFetch("/pilgrim/import", { method: "POST", body: fd });
      toast(`${res.data?.imported || 0} زائر وارد شد`);
      load();
    } catch (e: any) {
      toast(e.message, "error");
    }
    e.target.value = "";
  };

  const handleExport = async () => {
    const rows = pilgrims.map((p) => `"${p.FullName}","${p.NationalCode}","${p.Gender}"`);
    const csv = "\uFEFF" + "FullName,NationalCode,Gender\n" + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pilgrims_${caravan.Id}.csv`;
    a.click();
  };

  const filtered = pilgrims.filter(
    (p) =>
      p.FullName.includes(search) ||
      p.NationalCode.includes(search) ||
      p.Id.includes(search)
  );

  if (printing) {
    return (
      <PrintCardsPage
        caravan={caravan}
        pilgrims={pilgrims}
        onBack={() => setPrinting(false)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="p-2 rounded-xl hover:bg-gray-100 text-indigo-600"
        >
          <ChevronRight size={24} />
        </button>
        <div>
          <h2 className="font-bold text-lg">{caravan.Name}</h2>
          <p className="text-sm text-gray-500">{caravan.City}</p>
        </div>
        <button
          onClick={() => setPrinting(true)}
          className="mr-auto flex items-center gap-1 bg-purple-600 text-white px-3 py-2 rounded-xl text-sm hover:bg-purple-700"
        >
          <Printer size={15} />
          چاپ کارت
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <div className="flex-1 relative">
          <Search
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            placeholder="جستجو..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border rounded-xl pr-9 pl-3 py-2 outline-none focus:border-indigo-500 text-sm"
          />
        </div>
        <button
          onClick={() => {
            setEditTarget(null);
            setFormOpen(true);
          }}
          className="flex items-center gap-1 bg-indigo-600 text-white px-3 py-2 rounded-xl text-sm hover:bg-indigo-700"
        >
          <Plus size={15} />
          افزودن
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <a
          href="/api/pilgrim/import/template"
          className="flex items-center gap-1 border border-gray-300 px-3 py-2 rounded-xl text-sm hover:bg-gray-50"
        >
          <Download size={14} />
          نمونه اکسل
        </a>
        <label className="flex items-center gap-1 border border-gray-300 px-3 py-2 rounded-xl text-sm hover:bg-gray-50 cursor-pointer">
          <Upload size={14} />
          ورود از اکسل
          <input type="file" accept=".csv" className="hidden" onChange={handleImport} />
        </label>
        <button
          onClick={handleExport}
          className="flex items-center gap-1 border border-gray-300 px-3 py-2 rounded-xl text-sm hover:bg-gray-50"
        >
          <FileText size={14} />
          خروجی اکسل
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400">
          <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
          در حال بارگذاری...
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.length === 0 && (
            <div className="text-center py-10 text-gray-400">زائری یافت نشد</div>
          )}
          {filtered.map((p) => (
            <div
              key={p.Id}
              className="bg-white rounded-xl shadow-sm border p-3 flex items-center gap-3"
            >
              <PilgrimImage id={p.Id} size={48} />
              <div className="flex-1">
                <div className="font-medium">{p.FullName}</div>
                <div className="text-sm text-gray-500 flex gap-3">
                  <span>{p.NationalCode}</span>
                  <span>{genderLabel(p.Gender)}</span>
                  <span className="text-xs text-gray-400">#{p.Id}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setEditTarget(p);
                  setFormOpen(true);
                }}
                className="p-2 rounded-lg hover:bg-indigo-50 text-indigo-600"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={() => setDeleteTarget(p)}
                className="p-2 rounded-lg hover:bg-red-50 text-red-500"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      <PilgrimFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        pilgrim={editTarget}
        caravanId={caravan.Id}
        onSaved={load}
        toast={toast}
      />

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="حذف زائر"
      >
        <p className="text-gray-700 mb-4">
          آیا از حذف زائر <strong>{deleteTarget?.FullName}</strong> اطمینان
          دارید؟
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setDeleteTarget(null)}
            className="flex-1 border rounded-xl py-2"
          >
            انصراف
          </button>
          <button
            onClick={handleDelete}
            className="flex-1 bg-red-600 text-white rounded-xl py-2 font-bold hover:bg-red-700"
          >
            حذف
          </button>
        </div>
      </Modal>
    </div>
  );
}

function CaravanFormModal({
  open,
  onClose,
  caravan,
  onSaved,
  toast,
}: {
  open: boolean;
  onClose: () => void;
  caravan: Caravan | null;
  onSaved: () => void;
  toast: (msg: string, t?: "success" | "error") => void;
}) {
  const [form, setForm] = useState({ name: "", city: "" });
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (caravan) {
      setForm({ name: caravan.Name, city: caravan.City });
    } else {
      setForm({ name: "", city: "" });
    }
    setImgFile(null);
  }, [caravan, open]);

  const handleSave = async () => {
    if (!form.name || !form.city) {
      toast("نام و شهر الزامی است", "error");
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      if (caravan) fd.append("id", caravan.Id);
      fd.append("name", form.name);
      fd.append("city", form.city);
      if (imgFile) fd.append("image", imgFile);
      await apiFetch("/caravan/upsert", { method: "POST", body: fd });
      toast("کاروان ذخیره شد");
      onSaved();
      onClose();
    } catch (e: any) {
      toast(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={caravan ? "ویرایش کاروان" : "افزودن کاروان"}
    >
      <div className="flex flex-col gap-4">
        <ImageUpload
          currentId={caravan?.Id}
          folder="caravans"
          onFile={setImgFile}
        />
        <div>
          <label className="text-sm text-gray-600 block mb-1">نام کاروان</label>
          <input
            className="w-full border rounded-xl px-3 py-2 outline-none focus:border-indigo-500"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          />
        </div>
        <div>
          <label className="text-sm text-gray-600 block mb-1">شهر</label>
          <input
            className="w-full border rounded-xl px-3 py-2 outline-none focus:border-indigo-500"
            value={form.city}
            onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
          />
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-indigo-600 text-white rounded-xl py-3 font-bold hover:bg-indigo-700 transition disabled:opacity-50"
        >
          {loading ? "در حال ذخیره..." : "ذخیره"}
        </button>
      </div>
    </Modal>
  );
}

function CaravanManagementPage({
  caravans,
  onRefresh,
  onSelectCaravan,
  toast,
}: {
  caravans: Caravan[];
  onRefresh: () => void;
  onSelectCaravan: (c: Caravan) => void;
  toast: (msg: string, t?: "success" | "error") => void;
}) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Caravan | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Caravan | null>(null);
  const [bulkDelete, setBulkDelete] = useState(false);

  const filtered = caravans.filter(
    (c) => c.Name.includes(search) || c.City.includes(search)
  );

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((c) => c.Id)));
    }
  };

  const handleDelete = async (caravan: Caravan) => {
    try {
      await apiFetch("/caravan/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: caravan.Id }),
      });
      toast("کاروان حذف شد");
      setDeleteTarget(null);
      onRefresh();
    } catch (e: any) {
      toast(e.message, "error");
    }
  };

  const handleBulkDelete = async () => {
    try {
      for (const id of selected) {
        await apiFetch("/caravan/delete", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
      }
      toast(`${selected.size} کاروان حذف شد`);
      setSelected(new Set());
      setBulkDelete(false);
      onRefresh();
    } catch (e: any) {
      toast(e.message, "error");
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex gap-2 items-center flex-wrap">
        <div className="flex-1 relative">
          <Search
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            placeholder="جستجو..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border rounded-xl pr-9 pl-3 py-2 outline-none focus:border-indigo-500 text-sm"
          />
        </div>
        <button
          onClick={() => {
            setEditTarget(null);
            setFormOpen(true);
          }}
          className="flex items-center gap-1 bg-indigo-600 text-white px-3 py-2 rounded-xl text-sm hover:bg-indigo-700"
        >
          <Plus size={15} />
          افزودن
        </button>
        {selected.size > 0 && (
          <button
            onClick={() => setBulkDelete(true)}
            className="flex items-center gap-1 bg-red-600 text-white px-3 py-2 rounded-xl text-sm hover:bg-red-700"
          >
            <Trash2 size={15} />
            حذف ({selected.size})
          </button>
        )}
      </div>

      {filtered.length > 0 && (
        <button
          onClick={toggleAll}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600"
        >
          {selected.size === filtered.length ? (
            <CheckSquare size={18} className="text-indigo-600" />
          ) : (
            <Square size={18} />
          )}
          {selected.size === filtered.length
            ? "لغو انتخاب همه"
            : "انتخاب همه"}
        </button>
      )}

      <div className="flex flex-col gap-3">
        {filtered.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            کاروانی یافت نشد
          </div>
        )}
        {filtered.map((c) => (
          <div
            key={c.Id}
            className={`bg-white rounded-2xl shadow-sm border p-4 flex items-center gap-3 transition ${
              selected.has(c.Id) ? "border-indigo-400 bg-indigo-50" : ""
            }`}
          >
            <button onClick={() => toggleSelect(c.Id)} className="shrink-0">
              {selected.has(c.Id) ? (
                <CheckSquare size={20} className="text-indigo-600" />
              ) : (
                <Square size={20} className="text-gray-300" />
              )}
            </button>
            <CaravanImage id={c.Id} size={52} />
            <button
              className="flex-1 text-right"
              onClick={() => onSelectCaravan(c)}
            >
              <div className="font-bold text-gray-800">{c.Name}</div>
              <div className="text-sm text-gray-500 flex gap-3 mt-0.5">
                <span>{c.City}</span>
                <span className="text-indigo-600">
                  {c.PilgrimCount} زائر
                </span>
              </div>
            </button>
            <div className="flex gap-1 shrink-0">
              <button
                onClick={() => {
                  setEditTarget(c);
                  setFormOpen(true);
                }}
                className="p-2 rounded-lg hover:bg-indigo-50 text-indigo-600"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={() => setDeleteTarget(c)}
                className="p-2 rounded-lg hover:bg-red-50 text-red-500"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <CaravanFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        caravan={editTarget}
        onSaved={onRefresh}
        toast={toast}
      />

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="حذف کاروان"
      >
        <p className="text-gray-700 mb-4">
          آیا از حذف کاروان <strong>{deleteTarget?.Name}</strong> اطمینان
          دارید؟ تمام زائرین و ترددهای مرتبط حذف خواهند شد.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setDeleteTarget(null)}
            className="flex-1 border rounded-xl py-2"
          >
            انصراف
          </button>
          <button
            onClick={() => deleteTarget && handleDelete(deleteTarget)}
            className="flex-1 bg-red-600 text-white rounded-xl py-2 font-bold hover:bg-red-700"
          >
            حذف
          </button>
        </div>
      </Modal>

      <Modal
        open={bulkDelete}
        onClose={() => setBulkDelete(false)}
        title="حذف گروهی"
      >
        <p className="text-gray-700 mb-4">
          آیا از حذف <strong>{selected.size}</strong> کاروان انتخاب شده
          اطمینان دارید؟
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setBulkDelete(false)}
            className="flex-1 border rounded-xl py-2"
          >
            انصراف
          </button>
          <button
            onClick={handleBulkDelete}
            className="flex-1 bg-red-600 text-white rounded-xl py-2 font-bold hover:bg-red-700"
          >
            حذف
          </button>
        </div>
      </Modal>
    </div>
  );
}

function ReportPage({
  caravans,
  toast,
}: {
  caravans: Caravan[];
  toast: (msg: string, t?: "success" | "error") => void;
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detail, setDetail] = useState(false);
  const [result, setResult] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);

  const toggleCaravan = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === caravans.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(caravans.map((c) => c.Id)));
  };

  const fetchReport = async (isExcel = false) => {
    if (selectedIds.size === 0) {
      toast("حداقل یک کاروان انتخاب کنید", "error");
      return;
    }
    setLoading(true);
    try {
      const body = {
        caravanIds: Array.from(selectedIds),
        isExcel,
        detail,
      };
      if (isExcel) {
        const res = await fetch(`${API}/report`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `report.csv`;
        a.click();
      } else {
        const res = await apiFetch("/report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        setResult(res.data || []);
      }
    } catch (e: any) {
      toast(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <h2 className="font-bold text-xl text-gray-800">گزارشات</h2>

      <div className="bg-white rounded-2xl shadow-sm border p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="font-medium">انتخاب کاروان‌ها</span>
          <button
            onClick={toggleAll}
            className="text-sm text-indigo-600 flex items-center gap-1"
          >
            {selectedIds.size === caravans.length ? (
              <CheckSquare size={16} />
            ) : (
              <Square size={16} />
            )}
            {selectedIds.size === caravans.length ? "لغو همه" : "انتخاب همه"}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {caravans.map((c) => (
            <button
              key={c.Id}
              onClick={() => toggleCaravan(c.Id)}
              className={`px-3 py-1 rounded-full text-sm border transition ${
                selectedIds.has(c.Id)
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "border-gray-300 text-gray-600 hover:border-indigo-400"
              }`}
            >
              {c.Name}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border p-4 flex flex-col gap-3">
        <span className="font-medium">نوع گزارش</span>
        <div className="flex gap-3">
          <button
            onClick={() => setDetail(false)}
            className={`flex-1 py-2 rounded-xl border text-sm font-medium transition ${
              !detail
                ? "bg-indigo-600 text-white border-indigo-600"
                : "border-gray-300 text-gray-600"
            }`}
          >
            خلاصه
          </button>
          <button
            onClick={() => setDetail(true)}
            className={`flex-1 py-2 rounded-xl border text-sm font-medium transition ${
              detail
                ? "bg-indigo-600 text-white border-indigo-600"
                : "border-gray-300 text-gray-600"
            }`}
          >
            تفصیلی
          </button>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => fetchReport(false)}
          disabled={loading}
          className="flex-1 bg-indigo-600 text-white rounded-xl py-3 font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <RefreshCw size={16} className="animate-spin" />
          ) : (
            <BarChart2 size={16} />
          )}
          نمایش گزارش
        </button>
        <button
          onClick={() => fetchReport(true)}
          disabled={loading}
          className="flex-1 border border-indigo-600 text-indigo-600 rounded-xl py-3 font-bold hover:bg-indigo-50 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Download size={16} />
          دانلود اکسل
        </button>
      </div>

      {result !== null && (
        <div className="bg-white rounded-2xl shadow-sm border overflow-auto">
          {detail ? (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">
                    کاروان
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">
                    زائر
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">
                    تاریخ
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">
                    نوع
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.map((r, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3">{r.CaravanName}</td>
                    <td className="px-4 py-3">{r.PilgrimName}</td>
                    <td className="px-4 py-3">{formatJalali(r.DateTime)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          r.TrafficType === "ورود"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {r.TrafficType}
                      </span>
                    </td>
                  </tr>
                ))}
                {result.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-6 text-gray-400">
                      داده‌ای یافت نشد
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">
                    کاروان
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">
                    تعداد زائر
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">
                    کل تردد
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">
                    ورود
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">
                    خروج
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.map((r, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{r.CaravanName}</td>
                    <td className="px-4 py-3">{r.PilgrimCount}</td>
                    <td className="px-4 py-3">{r.TotalTraffic}</td>
                    <td className="px-4 py-3">
                      <span className="text-green-700 font-medium">
                        {r.EntryCount}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-red-700 font-medium">
                        {r.ExitCount}
                      </span>
                    </td>
                  </tr>
                ))}
                {result.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-gray-400">
                      داده‌ای یافت نشد
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

type Page = "traffic" | "caravans" | "pilgrim-management" | "report";

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [page, setPage] = useState<Page>("traffic");
  const [caravans, setCaravans] = useState<Caravan[]>([]);
  const [selectedCaravan, setSelectedCaravan] = useState<Caravan | null>(null);
  const { toasts, add: addToast } = useToast();

  const loadCaravans = useCallback(async () => {
    try {
      const res = await apiFetch("/caravan/list");
      setCaravans(res.data || []);
    } catch {}
  }, []);

  useEffect(() => {
    if (loggedIn) loadCaravans();
  }, [loggedIn, loadCaravans]);

  if (!loggedIn) {
    return <LoginPage onLogin={() => setLoggedIn(true)} />;
  }

  const handleSelectCaravan = (c: Caravan) => {
    setSelectedCaravan(c);
    setPage("pilgrim-management");
  };

  const renderPage = () => {
    if (page === "traffic") {
      return (
        <TrafficPage caravans={caravans} onCaravanClick={() => setPage("caravans")} toast={addToast} />
      );
    }
    if (page === "caravans") {
      if (selectedCaravan && page === ("pilgrim-management" as Page)) {
        return null;
      }
      return (
        <CaravanManagementPage
          caravans={caravans}
          onRefresh={loadCaravans}
          onSelectCaravan={handleSelectCaravan}
          toast={addToast}
        />
      );
    }
    if (page === "pilgrim-management" && selectedCaravan) {
      return (
        <PilgrimManagementPage
          caravan={selectedCaravan}
          onBack={() => {
            setSelectedCaravan(null);
            setPage("caravans");
          }}
          toast={addToast}
        />
      );
    }
    if (page === "report") {
      return <ReportPage caravans={caravans} toast={addToast} />;
    }
    return null;
  };

  const navItems = [
    { key: "traffic" as Page, icon: <ArrowRightLeft size={22} />, label: "تردد" },
    { key: "caravans" as Page, icon: <Bus size={22} />, label: "کاروان‌ها" },
    { key: "report" as Page, icon: <BarChart2 size={22} />, label: "گزارش" },
  ];

  const activePage = page === "pilgrim-management" ? "caravans" : page;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" dir="rtl">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          .print-card { break-inside: avoid; page-break-inside: avoid; }
        }
        * { font-family: 'Vazirmatn', 'Tahoma', 'Arial', sans-serif; }
      `}</style>
      <header className="no-print bg-white shadow-sm sticky top-0 z-40">
        <div className="flex items-center px-4 py-3 gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0">
            <Bus size={18} className="text-white" />
          </div>
          <h1 className="font-bold text-gray-800 text-base leading-tight flex-1">
            سیستم مدیریت تردد زائرین
          </h1>
          <button
            onClick={() => setLoggedIn(false)}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-500"
            title="خروج"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-20 no-print-padding">
        {renderPage()}
      </main>

      <nav className="no-print fixed bottom-0 inset-x-0 bg-white border-t shadow-lg z-40">
        <div className="flex">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => {
                setSelectedCaravan(null);
                setPage(item.key);
              }}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition ${
                activePage === item.key
                  ? "text-indigo-600"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition ${
                  activePage === item.key ? "bg-indigo-50" : ""
                }`}
              >
                {item.icon}
              </div>
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      <Toast toasts={toasts} />
    </div>
  );
}