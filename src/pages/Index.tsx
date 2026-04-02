import { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { Html5Qrcode } from "html5-qrcode";
import Icon from "@/components/ui/icon";

type Section = "envelopes" | "tracking" | "analytics" | "history" | "profile" | "support";

interface EnvelopeData {
  id: string;
  senderName: string;
  senderAddress: string;
  senderCity: string;
  senderIndex: string;
  recipientName: string;
  recipientAddress: string;
  recipientCity: string;
  recipientIndex: string;
  weight: string;
  type: string;
  createdAt: string;
  status: string;
  trackingCode: string;
}

const MOCK_HISTORY: EnvelopeData[] = [
  {
    id: "ENV-001",
    senderName: "Петров Алексей Владимирович",
    senderAddress: "ул. Ленина, д. 45, офис 312",
    senderCity: "Москва",
    senderIndex: "101000",
    recipientName: "Иванова Марина Сергеевна",
    recipientAddress: "пр. Невский, д. 78, кв. 15",
    recipientCity: "Санкт-Петербург",
    recipientIndex: "190000",
    weight: "0.5",
    type: "Деловое письмо",
    createdAt: "2026-04-01",
    status: "delivered",
    trackingCode: "ENV-2026-001-MSK-SPB",
  },
  {
    id: "ENV-002",
    senderName: "Сидоров Николай Петрович",
    senderAddress: "ул. Тверская, д. 12",
    senderCity: "Москва",
    senderIndex: "125009",
    recipientName: "Козлов Дмитрий Иванович",
    recipientAddress: "ул. Красная, д. 3",
    recipientCity: "Краснодар",
    recipientIndex: "350000",
    weight: "1.2",
    type: "Документы",
    createdAt: "2026-03-30",
    status: "transit",
    trackingCode: "ENV-2026-002-MSK-KRD",
  },
  {
    id: "ENV-003",
    senderName: "Захарова Ольга Николаевна",
    senderAddress: "ул. Садовая, д. 22",
    senderCity: "Новосибирск",
    senderIndex: "630000",
    recipientName: "Фролов Андрей Михайлович",
    recipientAddress: "пр. Ленина, д. 56, оф. 101",
    recipientCity: "Екатеринбург",
    recipientIndex: "620000",
    weight: "0.3",
    type: "Уведомление",
    createdAt: "2026-03-28",
    status: "created",
    trackingCode: "ENV-2026-003-NSK-EKB",
  },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  created: { label: "Создан", color: "bg-blue-100 text-blue-700", icon: "FileText" },
  transit: { label: "В пути", color: "bg-amber-100 text-amber-700", icon: "Truck" },
  delivered: { label: "Доставлен", color: "bg-green-100 text-green-700", icon: "CheckCircle" },
  returned: { label: "Возврат", color: "bg-red-100 text-red-700", icon: "RotateCcw" },
};

const NavItem = ({
  icon,
  label,
  active,
  onClick,
}: {
  icon: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <div className={`nav-item ${active ? "nav-active" : ""}`} onClick={onClick}>
    <Icon name={icon as Parameters<typeof Icon>[0]["name"]} size={16} />
    <span>{label}</span>
  </div>
);

const QRCanvas = ({ data }: { data: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && data) {
      QRCode.toCanvas(canvasRef.current, data, {
        width: 100,
        margin: 1,
        color: { dark: "#1a2e5c", light: "#ffffff" },
      });
    }
  }, [data]);

  return <canvas ref={canvasRef} style={{ width: 100, height: 100 }} />;
};

const EnvelopePreview = ({ env }: { env: Partial<EnvelopeData> }) => {
  const qrData = JSON.stringify({
    id: env.trackingCode || "—",
    from: `${env.senderName || "—"}, ${env.senderAddress || "—"}, ${env.senderCity || "—"} ${env.senderIndex || ""}`,
    to: `${env.recipientName || "—"}, ${env.recipientAddress || "—"}, ${env.recipientCity || "—"} ${env.recipientIndex || ""}`,
    weight: env.weight ? `${env.weight} кг` : "—",
    type: env.type || "—",
    date: env.createdAt || new Date().toISOString().split("T")[0],
  });

  return (
    <div
      className="envelope-shadow rounded-sm bg-white border animate-slide-up"
      style={{
        borderColor: "#c5cfe8",
        minHeight: 280,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 120,
          height: 120,
          background:
            "repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(26,46,92,0.06) 8px, rgba(26,46,92,0.06) 10px)",
          clipPath: "polygon(100% 0, 0 0, 100% 100%)",
        }}
      />
      <div
        className="px-6 py-3 flex items-center justify-between"
        style={{ background: "hsl(218,65%,18%)" }}
      >
        <div className="flex items-center gap-2">
          <Icon name="Mail" size={16} color="white" />
          <span className="text-white text-xs font-semibold tracking-widest uppercase" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            КорпПочта
          </span>
        </div>
        <span
          className="text-xs"
          style={{ color: "rgba(255,255,255,0.55)", fontFamily: "'IBM Plex Mono', monospace" }}
        >
          {env.trackingCode || "—"}
        </span>
      </div>

      <div className="p-6 grid grid-cols-2 gap-6">
        <div className="space-y-5">
          <div>
            <div
              className="text-xs font-semibold uppercase tracking-widest mb-1.5"
              style={{ color: "hsl(218,65%,40%)" }}
            >
              От кого
            </div>
            <div className="text-sm font-semibold" style={{ color: "hsl(220,30%,12%)" }}>
              {env.senderName || <span style={{ color: "#d1d5db" }}>ФИО отправителя</span>}
            </div>
            <div className="text-xs mt-0.5" style={{ color: "hsl(215,16%,47%)" }}>
              {env.senderAddress || "Адрес не указан"}
            </div>
            <div className="text-xs" style={{ color: "hsl(215,16%,47%)" }}>
              {[env.senderCity, env.senderIndex].filter(Boolean).join(", ") || ""}
            </div>
          </div>

          <div
            className="flex items-center gap-2"
            style={{ borderTop: "1px solid hsl(214,20%,88%)", paddingTop: 16 }}
          >
            <Icon name="ArrowDown" size={14} color="hsl(218,65%,40%)" />
          </div>

          <div>
            <div
              className="text-xs font-semibold uppercase tracking-widest mb-1.5"
              style={{ color: "hsl(199,80%,40%)" }}
            >
              Кому
            </div>
            <div
              className="text-base font-bold"
              style={{ color: "hsl(220,30%,12%)" }}
            >
              {env.recipientName || (
                <span style={{ color: "#d1d5db" }}>ФИО получателя</span>
              )}
            </div>
            <div className="text-sm mt-0.5" style={{ color: "hsl(215,16%,47%)" }}>
              {env.recipientAddress || "Адрес не указан"}
            </div>
            <div className="text-sm font-medium" style={{ color: "hsl(220,30%,12%)" }}>
              {[env.recipientCity, env.recipientIndex]
                .filter(Boolean)
                .join(" — ") || ""}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end justify-between">
          <div className="flex flex-col items-center gap-2">
            <div
              className="p-2 rounded-sm border"
              style={{ borderColor: "hsl(214,20%,85%)" }}
            >
              <QRCanvas data={qrData} />
            </div>
            <span
              className="text-xs"
              style={{ color: "hsl(215,16%,55%)", fontFamily: "'IBM Plex Mono', monospace" }}
            >
              Сканировать для отслеживания
            </span>
          </div>
          <div className="text-right space-y-1">
            {env.type && (
              <div
                className="text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-sm inline-block"
                style={{
                  background: "hsl(214,20%,93%)",
                  color: "hsl(218,65%,28%)",
                }}
              >
                {env.type}
              </div>
            )}
            {env.weight && (
              <div className="text-xs" style={{ color: "hsl(215,16%,55%)" }}>
                Вес: {env.weight} кг
              </div>
            )}
            {env.createdAt && (
              <div className="text-xs" style={{ color: "hsl(215,16%,55%)" }}>
                {new Date(env.createdAt).toLocaleDateString("ru-RU")}
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        className="px-6 py-2 flex items-center justify-between"
        style={{
          borderTop: "1px dashed hsl(214,20%,85%)",
          background: "hsl(220,25%,97%)",
        }}
      >
        <div className="flex items-center gap-1.5">
          <div
            className="w-2 h-2 rounded-full"
            style={{
              background:
                env.senderName && env.recipientName
                  ? "hsl(199,80%,48%)"
                  : "hsl(214,20%,82%)",
            }}
          />
          <span className="text-xs" style={{ color: "hsl(215,16%,55%)" }}>
            {env.senderName && env.recipientName
              ? "Готов к отправке"
              : "Заполните данные"}
          </span>
        </div>
        <span
          className="text-xs"
          style={{ color: "hsl(215,16%,65%)", fontFamily: "'IBM Plex Mono', monospace" }}
        >
          {new Date().toLocaleDateString("ru-RU")}
        </span>
      </div>
    </div>
  );
};

export default function Index() {
  const [active, setActive] = useState<Section>("envelopes");
  const [form, setForm] = useState<Partial<EnvelopeData>>({
    type: "Деловое письмо",
    weight: "0.1",
    createdAt: new Date().toISOString().split("T")[0],
    trackingCode: `ENV-${Date.now().toString().slice(-8)}`,
  });
  const [saved, setSaved] = useState<EnvelopeData[]>(MOCK_HISTORY);
  const [toast, setToast] = useState<string | null>(null);
  const [trackingInput, setTrackingInput] = useState("");
  const [trackingResult, setTrackingResult] = useState<EnvelopeData | null>(null);
  const [trackingNotFound, setTrackingNotFound] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [scannedRaw, setScannedRaw] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerDivId = "qr-scanner-region";

  useEffect(() => {
    if (scannerOpen) {
      setScannerError(null);
      setScannedRaw(null);
      const qr = new Html5Qrcode(scannerDivId);
      scannerRef.current = qr;
      qr.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          qr.stop().then(() => {
            setScannerOpen(false);
            setScannedRaw(decodedText);
            try {
              const data = JSON.parse(decodedText);
              if (data.id) {
                setTrackingInput(data.id);
                const found = saved.find(
                  (e) => e.trackingCode.toLowerCase() === data.id.toLowerCase() || e.id.toLowerCase() === data.id.toLowerCase()
                );
                if (found) { setTrackingResult(found); setTrackingNotFound(false); }
                else setTrackingNotFound(true);
              }
            } catch {
              setTrackingInput(decodedText);
            }
          }).catch(() => {});
        },
        () => {}
      ).catch((err: Error) => {
        setScannerError("Нет доступа к камере: " + err.message);
      });
      return () => {
        qr.stop().catch(() => {});
      };
    }
  }, [scannerOpen]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = () => {
    if (!form.senderName || !form.recipientName) {
      showToast("Укажите ФИО отправителя и получателя");
      return;
    }
    const newEnv: EnvelopeData = {
      id: `ENV-${String(saved.length + 1).padStart(3, "0")}`,
      senderName: form.senderName || "",
      senderAddress: form.senderAddress || "",
      senderCity: form.senderCity || "",
      senderIndex: form.senderIndex || "",
      recipientName: form.recipientName || "",
      recipientAddress: form.recipientAddress || "",
      recipientCity: form.recipientCity || "",
      recipientIndex: form.recipientIndex || "",
      weight: form.weight || "0.1",
      type: form.type || "Деловое письмо",
      createdAt: form.createdAt || new Date().toISOString().split("T")[0],
      status: "created",
      trackingCode: form.trackingCode || `ENV-${Date.now()}`,
    };
    setSaved([newEnv, ...saved]);
    setForm({
      type: "Деловое письмо",
      weight: "0.1",
      createdAt: new Date().toISOString().split("T")[0],
      trackingCode: `ENV-${Date.now().toString().slice(-8)}`,
    });
    showToast("Конверт создан и сохранён в историю");
  };

  const handleTrack = () => {
    setTrackingNotFound(false);
    setTrackingResult(null);
    const found = saved.find(
      (e) =>
        e.trackingCode.toLowerCase() === trackingInput.toLowerCase() ||
        e.id.toLowerCase() === trackingInput.toLowerCase()
    );
    if (found) setTrackingResult(found);
    else setTrackingNotFound(true);
  };

  const navItems: { id: Section; icon: string; label: string }[] = [
    { id: "envelopes", icon: "Mail", label: "Конверты" },
    { id: "tracking", icon: "MapPin", label: "Отслеживание" },
    { id: "analytics", icon: "BarChart3", label: "Аналитика" },
    { id: "history", icon: "Clock", label: "История" },
    { id: "profile", icon: "User", label: "Профиль" },
    { id: "support", icon: "LifeBuoy", label: "Поддержка" },
  ];

  const analyticsStats = {
    total: saved.length,
    delivered: saved.filter((e) => e.status === "delivered").length,
    transit: saved.filter((e) => e.status === "transit").length,
    created: saved.filter((e) => e.status === "created").length,
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
      {/* Sidebar */}
      <div
        className="w-56 flex-shrink-0 flex flex-col"
        style={{ background: "hsl(218,65%,16%)" }}
      >
        <div
          className="px-5 py-5 flex items-center gap-3"
          style={{ borderBottom: "1px solid hsl(218,40%,22%)" }}
        >
          <div
            className="w-8 h-8 rounded flex items-center justify-center"
            style={{ background: "hsl(199,80%,48%)" }}
          >
            <Icon name="Mail" size={16} color="white" />
          </div>
          <div>
            <div className="text-white text-sm font-bold tracking-tight">КорпПочта</div>
            <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
              v1.0 Enterprise
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          <div
            className="text-xs font-semibold uppercase tracking-widest px-4 py-2"
            style={{ color: "rgba(255,255,255,0.3)" }}
          >
            Меню
          </div>
          {navItems.map((item) => (
            <NavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={active === item.id}
              onClick={() => setActive(item.id)}
            />
          ))}
        </nav>

        <div
          className="p-4"
          style={{ borderTop: "1px solid hsl(218,40%,22%)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ background: "hsl(199,80%,48%)" }}
            >
              АД
            </div>
            <div>
              <div className="text-xs text-white font-medium">Администратор</div>
              <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                admin@corp.ru
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div
          className="flex items-center justify-between px-8 py-4 bg-white"
          style={{ borderBottom: "1px solid hsl(214,20%,88%)" }}
        >
          <div>
            <h1 className="text-lg font-semibold" style={{ color: "hsl(220,30%,12%)" }}>
              {navItems.find((n) => n.id === active)?.label}
            </h1>
            <div className="text-xs" style={{ color: "hsl(215,16%,55%)" }}>
              {new Date().toLocaleDateString("ru-RU", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-sm text-xs font-medium"
              style={{
                background: "hsl(220,25%,97%)",
                border: "1px solid hsl(214,20%,88%)",
                color: "hsl(215,16%,47%)",
              }}
            >
              <Icon name="Bell" size={14} />
              <span>Уведомления</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8">

          {/* === ENVELOPES === */}
          {active === "envelopes" && (
            <div className="grid grid-cols-2 gap-8 animate-fade-in">
              <div className="space-y-6">
                <div>
                  <h2 className="text-base font-semibold mb-4" style={{ color: "hsl(220,30%,12%)" }}>
                    Создать конверт
                  </h2>

                  <div
                    className="rounded-sm border p-5 space-y-3 mb-4"
                    style={{ borderColor: "hsl(214,20%,85%)", background: "white" }}
                  >
                    <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: "hsl(218,65%,40%)" }}>
                      Отправитель
                    </div>
                    <input
                      className="w-full text-sm px-3 py-2 rounded-sm border outline-none"
                      style={{ borderColor: "hsl(214,20%,85%)", color: "hsl(220,30%,12%)" }}
                      placeholder="ФИО отправителя"
                      value={form.senderName || ""}
                      onChange={(e) => setForm({ ...form, senderName: e.target.value })}
                    />
                    <input
                      className="w-full text-sm px-3 py-2 rounded-sm border outline-none"
                      style={{ borderColor: "hsl(214,20%,85%)", color: "hsl(220,30%,12%)" }}
                      placeholder="Улица, дом, квартира / офис"
                      value={form.senderAddress || ""}
                      onChange={(e) => setForm({ ...form, senderAddress: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        className="w-full text-sm px-3 py-2 rounded-sm border outline-none"
                        style={{ borderColor: "hsl(214,20%,85%)", color: "hsl(220,30%,12%)" }}
                        placeholder="Город"
                        value={form.senderCity || ""}
                        onChange={(e) => setForm({ ...form, senderCity: e.target.value })}
                      />
                      <input
                        className="w-full text-sm px-3 py-2 rounded-sm border outline-none"
                        style={{ borderColor: "hsl(214,20%,85%)", color: "hsl(220,30%,12%)", fontFamily: "'IBM Plex Mono', monospace" }}
                        placeholder="Индекс"
                        value={form.senderIndex || ""}
                        onChange={(e) => setForm({ ...form, senderIndex: e.target.value })}
                      />
                    </div>
                  </div>

                  <div
                    className="rounded-sm border p-5 space-y-3 mb-4"
                    style={{ borderColor: "hsl(199,80%,72%)", background: "white" }}
                  >
                    <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: "hsl(199,80%,40%)" }}>
                      Получатель
                    </div>
                    <input
                      className="w-full text-sm px-3 py-2 rounded-sm border outline-none"
                      style={{ borderColor: "hsl(214,20%,85%)", color: "hsl(220,30%,12%)" }}
                      placeholder="ФИО получателя"
                      value={form.recipientName || ""}
                      onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
                    />
                    <input
                      className="w-full text-sm px-3 py-2 rounded-sm border outline-none"
                      style={{ borderColor: "hsl(214,20%,85%)", color: "hsl(220,30%,12%)" }}
                      placeholder="Улица, дом, квартира / офис"
                      value={form.recipientAddress || ""}
                      onChange={(e) => setForm({ ...form, recipientAddress: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        className="w-full text-sm px-3 py-2 rounded-sm border outline-none"
                        style={{ borderColor: "hsl(214,20%,85%)", color: "hsl(220,30%,12%)" }}
                        placeholder="Город"
                        value={form.recipientCity || ""}
                        onChange={(e) => setForm({ ...form, recipientCity: e.target.value })}
                      />
                      <input
                        className="w-full text-sm px-3 py-2 rounded-sm border outline-none"
                        style={{ borderColor: "hsl(214,20%,85%)", color: "hsl(220,30%,12%)", fontFamily: "'IBM Plex Mono', monospace" }}
                        placeholder="Индекс"
                        value={form.recipientIndex || ""}
                        onChange={(e) => setForm({ ...form, recipientIndex: e.target.value })}
                      />
                    </div>
                  </div>

                  <div
                    className="rounded-sm border p-5 space-y-3"
                    style={{ borderColor: "hsl(214,20%,85%)", background: "white" }}
                  >
                    <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: "hsl(215,16%,47%)" }}>
                      Параметры
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs mb-1 block" style={{ color: "hsl(215,16%,55%)" }}>
                          Тип отправления
                        </label>
                        <select
                          className="w-full text-sm px-3 py-2 rounded-sm border outline-none"
                          style={{ borderColor: "hsl(214,20%,85%)", color: "hsl(220,30%,12%)", background: "white" }}
                          value={form.type || "Деловое письмо"}
                          onChange={(e) => setForm({ ...form, type: e.target.value })}
                        >
                          <option>Деловое письмо</option>
                          <option>Документы</option>
                          <option>Уведомление</option>
                          <option>Договор</option>
                          <option>Счёт-фактура</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs mb-1 block" style={{ color: "hsl(215,16%,55%)" }}>
                          Вес (кг)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0.01"
                          className="w-full text-sm px-3 py-2 rounded-sm border outline-none"
                          style={{ borderColor: "hsl(214,20%,85%)", color: "hsl(220,30%,12%)", fontFamily: "'IBM Plex Mono', monospace" }}
                          value={form.weight || ""}
                          onChange={(e) => setForm({ ...form, weight: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: "hsl(215,16%,55%)" }}>
                        Трекинг-код (генерируется автоматически)
                      </label>
                      <input
                        className="w-full text-sm px-3 py-2 rounded-sm border outline-none"
                        style={{ borderColor: "hsl(214,20%,85%)", color: "hsl(218,65%,28%)", background: "hsl(220,25%,97%)", fontFamily: "'IBM Plex Mono', monospace" }}
                        readOnly
                        value={form.trackingCode || ""}
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleSave}
                    className="w-full mt-4 py-3 rounded-sm text-sm font-semibold text-white transition-all duration-150 hover:opacity-90 active:scale-[0.99]"
                    style={{ background: "hsl(218,65%,22%)" }}
                  >
                    Создать конверт с QR-кодом
                  </button>
                </div>
              </div>

              <div>
                <h2 className="text-base font-semibold mb-4" style={{ color: "hsl(220,30%,12%)" }}>
                  Предпросмотр конверта
                </h2>
                <EnvelopePreview env={form} />
                <div
                  className="mt-4 p-4 rounded-sm text-sm"
                  style={{
                    background: "hsl(199,80%,97%)",
                    border: "1px solid hsl(199,80%,85%)",
                    color: "hsl(199,80%,30%)",
                  }}
                >
                  <div className="flex items-center gap-2 font-medium mb-1">
                    <Icon name="Info" size={14} />
                    QR-код содержит полную информацию
                  </div>
                  <div className="text-xs opacity-80">
                    ФИО, адреса, тип, вес и трекинг-код — всё зашито в QR. При сканировании отображаются полные данные доставки.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* === TRACKING === */}
          {active === "tracking" && (
            <div className="max-w-xl animate-fade-in">
              <h2 className="text-base font-semibold mb-6" style={{ color: "hsl(220,30%,12%)" }}>
                Отслеживание отправления
              </h2>
              <div
                className="rounded-sm border p-6 bg-white space-y-4"
                style={{ borderColor: "hsl(214,20%,85%)" }}
              >
                <label className="text-xs font-semibold uppercase tracking-widest block" style={{ color: "hsl(215,16%,47%)" }}>
                  Введите трекинг-код или отсканируйте QR
                </label>
                <div className="flex gap-2">
                  <input
                    className="flex-1 text-sm px-4 py-2.5 rounded-sm border outline-none"
                    style={{ borderColor: "hsl(214,20%,85%)", color: "hsl(220,30%,12%)", fontFamily: "'IBM Plex Mono', monospace" }}
                    placeholder="ENV-2026-001-MSK-SPB"
                    value={trackingInput}
                    onChange={(e) => setTrackingInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleTrack()}
                  />
                  <button
                    onClick={() => { setScannerOpen(true); setTrackingResult(null); setTrackingNotFound(false); }}
                    className="px-3 py-2.5 rounded-sm text-sm font-semibold text-white flex items-center gap-2"
                    style={{ background: "hsl(199,80%,48%)" }}
                    title="Сканировать QR-код"
                  >
                    <Icon name="ScanLine" size={16} color="white" />
                  </button>
                  <button
                    onClick={handleTrack}
                    className="px-5 py-2.5 rounded-sm text-sm font-semibold text-white"
                    style={{ background: "hsl(218,65%,22%)" }}
                  >
                    Найти
                  </button>
                </div>
                <div className="text-xs" style={{ color: "hsl(215,16%,60%)" }}>
                  Попробуйте: <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: "hsl(218,65%,40%)" }}>ENV-2026-001-MSK-SPB</span>
                </div>
              </div>

              {/* QR Scanner */}
              {scannerOpen && (
                <div className="mt-4 animate-slide-up">
                  <div
                    className="rounded-sm border bg-white overflow-hidden"
                    style={{ borderColor: "hsl(199,80%,72%)" }}
                  >
                    <div
                      className="px-5 py-3 flex items-center justify-between"
                      style={{ background: "hsl(218,65%,18%)" }}
                    >
                      <div className="flex items-center gap-2 text-white text-sm font-semibold">
                        <Icon name="ScanLine" size={16} color="white" />
                        Сканер QR-кода
                      </div>
                      <button
                        onClick={() => setScannerOpen(false)}
                        className="text-white opacity-60 hover:opacity-100 transition-opacity"
                      >
                        <Icon name="X" size={16} color="white" />
                      </button>
                    </div>
                    <div className="p-5">
                      <div
                        id={scannerDivId}
                        className="rounded-sm overflow-hidden"
                        style={{ width: "100%", minHeight: 280 }}
                      />
                      {scannerError && (
                        <div
                          className="mt-3 p-3 rounded-sm text-xs"
                          style={{ background: "hsl(0,72%,97%)", color: "hsl(0,72%,40%)", border: "1px solid hsl(0,72%,88%)" }}
                        >
                          <div className="flex items-center gap-2">
                            <Icon name="AlertCircle" size={13} color="hsl(0,72%,50%)" />
                            {scannerError}
                          </div>
                        </div>
                      )}
                      {!scannerError && (
                        <div
                          className="mt-3 text-xs text-center"
                          style={{ color: "hsl(215,16%,55%)" }}
                        >
                          Наведите камеру на QR-код конверта
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Scanned raw data (if not parsed as envelope) */}
              {scannedRaw && !trackingResult && !trackingNotFound && (
                <div
                  className="mt-4 p-4 rounded-sm text-sm animate-slide-up"
                  style={{ background: "hsl(199,80%,97%)", border: "1px solid hsl(199,80%,85%)", color: "hsl(199,80%,30%)" }}
                >
                  <div className="flex items-center gap-2 font-medium mb-2">
                    <Icon name="CheckCircle" size={14} color="hsl(199,80%,48%)" />
                    QR отсканирован
                  </div>
                  <pre className="text-xs whitespace-pre-wrap break-all" style={{ fontFamily: "'IBM Plex Mono', monospace", color: "hsl(218,65%,28%)" }}>
                    {(() => {
                      try { return JSON.stringify(JSON.parse(scannedRaw), null, 2); }
                      catch { return scannedRaw; }
                    })()}
                  </pre>
                </div>
              )}

              {trackingNotFound && (
                <div
                  className="mt-4 p-4 rounded-sm text-sm animate-slide-up"
                  style={{ background: "hsl(0,72%,97%)", border: "1px solid hsl(0,72%,88%)", color: "hsl(0,72%,40%)" }}
                >
                  Отправление не найдено. Проверьте трекинг-код.
                </div>
              )}

              {trackingResult && (
                <div className="mt-6 animate-slide-up space-y-4">
                  <EnvelopePreview env={trackingResult} />
                  <div className="grid grid-cols-3 gap-3">
                    {["created", "transit", "delivered"].map((s) => (
                      <div
                        key={s}
                        className="p-3 rounded-sm border text-center"
                        style={{
                          borderColor: trackingResult.status === s ? "hsl(199,80%,72%)" : "hsl(214,20%,88%)",
                          background: trackingResult.status === s ? "hsl(199,80%,97%)" : "white",
                        }}
                      >
                        <div
                          className="text-xs font-semibold"
                          style={{ color: trackingResult.status === s ? "hsl(199,80%,35%)" : "hsl(215,16%,55%)" }}
                        >
                          {STATUS_CONFIG[s].label}
                        </div>
                        {trackingResult.status === s && (
                          <div className="mt-1 flex justify-center">
                            <Icon name="CheckCircle" size={14} color="hsl(199,80%,48%)" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* === ANALYTICS === */}
          {active === "analytics" && (
            <div className="animate-fade-in space-y-6">
              <h2 className="text-base font-semibold" style={{ color: "hsl(220,30%,12%)" }}>
                Аналитика отправлений
              </h2>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: "Всего конвертов", value: analyticsStats.total, icon: "Mail", color: "hsl(218,65%,22%)" },
                  { label: "Доставлено", value: analyticsStats.delivered, icon: "CheckCircle", color: "hsl(142,70%,40%)" },
                  { label: "В пути", value: analyticsStats.transit, icon: "Truck", color: "hsl(38,92%,50%)" },
                  { label: "Создано", value: analyticsStats.created, icon: "FileText", color: "hsl(199,80%,48%)" },
                ].map((stat) => (
                  <div key={stat.label} className="stat-card">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium" style={{ color: "hsl(215,16%,55%)" }}>
                        {stat.label}
                      </span>
                      <Icon name={stat.icon as Parameters<typeof Icon>[0]["name"]} size={16} color={stat.color} />
                    </div>
                    <div className="text-3xl font-bold" style={{ color: stat.color }}>
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-sm border p-6 bg-white" style={{ borderColor: "hsl(214,20%,85%)" }}>
                <div className="text-sm font-semibold mb-4" style={{ color: "hsl(220,30%,12%)" }}>
                  Распределение по статусам
                </div>
                <div className="space-y-4">
                  {[
                    { key: "delivered", label: "Доставлено", count: analyticsStats.delivered, color: "hsl(142,70%,40%)" },
                    { key: "transit", label: "В пути", count: analyticsStats.transit, color: "hsl(38,92%,50%)" },
                    { key: "created", label: "Создано", count: analyticsStats.created, color: "hsl(199,80%,48%)" },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center gap-4">
                      <div className="w-28 text-xs font-medium" style={{ color: "hsl(215,16%,47%)" }}>
                        {item.label}
                      </div>
                      <div className="flex-1 h-2 rounded-full" style={{ background: "hsl(214,20%,92%)" }}>
                        <div
                          className="h-2 rounded-full transition-all duration-700"
                          style={{
                            background: item.color,
                            width: analyticsStats.total > 0 ? `${(item.count / analyticsStats.total) * 100}%` : "0%",
                          }}
                        />
                      </div>
                      <div className="w-8 text-xs font-bold text-right" style={{ color: item.color }}>
                        {item.count}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* === HISTORY === */}
          {active === "history" && (
            <div className="animate-fade-in">
              <h2 className="text-base font-semibold mb-6" style={{ color: "hsl(220,30%,12%)" }}>
                История отправлений
              </h2>
              <div className="rounded-sm border overflow-hidden bg-white" style={{ borderColor: "hsl(214,20%,85%)" }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: "hsl(220,25%,97%)", borderBottom: "1px solid hsl(214,20%,88%)" }}>
                      {["ID", "Отправитель", "Получатель", "Тип", "Статус", "Дата"].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest"
                          style={{ color: "hsl(215,16%,47%)" }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {saved.map((env, i) => (
                      <tr
                        key={env.id}
                        style={{ borderBottom: i < saved.length - 1 ? "1px solid hsl(214,20%,92%)" : "none" }}
                        className="hover:bg-[hsl(220,25%,98%)] transition-colors"
                      >
                        <td className="px-4 py-3 text-xs" style={{ color: "hsl(218,65%,35%)", fontFamily: "'IBM Plex Mono', monospace" }}>
                          {env.id}
                        </td>
                        <td className="px-4 py-3" style={{ color: "hsl(220,30%,12%)" }}>
                          {env.senderName}
                        </td>
                        <td className="px-4 py-3 font-medium" style={{ color: "hsl(220,30%,12%)" }}>
                          {env.recipientName}
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: "hsl(215,16%,55%)" }}>
                          {env.type}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-sm font-medium ${STATUS_CONFIG[env.status]?.color}`}>
                            {STATUS_CONFIG[env.status]?.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: "hsl(215,16%,55%)", fontFamily: "'IBM Plex Mono', monospace" }}>
                          {new Date(env.createdAt).toLocaleDateString("ru-RU")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* === PROFILE === */}
          {active === "profile" && (
            <div className="max-w-lg animate-fade-in">
              <h2 className="text-base font-semibold mb-6" style={{ color: "hsl(220,30%,12%)" }}>
                Профиль организации
              </h2>
              <div className="rounded-sm border p-6 bg-white space-y-4" style={{ borderColor: "hsl(214,20%,85%)" }}>
                <div className="flex items-center gap-4 pb-4" style={{ borderBottom: "1px solid hsl(214,20%,90%)" }}>
                  <div
                    className="w-14 h-14 rounded-sm flex items-center justify-center text-xl font-bold text-white"
                    style={{ background: "hsl(218,65%,22%)" }}
                  >
                    АД
                  </div>
                  <div>
                    <div className="text-base font-semibold" style={{ color: "hsl(220,30%,12%)" }}>
                      Администратор
                    </div>
                    <div className="text-sm" style={{ color: "hsl(215,16%,55%)" }}>
                      admin@corp.ru
                    </div>
                    <div
                      className="text-xs px-2 py-0.5 rounded-sm inline-block mt-1 font-medium"
                      style={{ background: "hsl(218,65%,95%)", color: "hsl(218,65%,28%)" }}
                    >
                      Суперадминистратор
                    </div>
                  </div>
                </div>
                {[
                  { label: "Организация", value: "ООО «КорпПочта»" },
                  { label: "ИНН", value: "7701234567" },
                  { label: "Адрес", value: "г. Москва, ул. Деловая, 1" },
                  { label: "Телефон", value: "+7 (495) 000-00-00" },
                ].map((field) => (
                  <div key={field.label}>
                    <label className="text-xs font-semibold uppercase tracking-widest block mb-1" style={{ color: "hsl(215,16%,47%)" }}>
                      {field.label}
                    </label>
                    <input
                      className="w-full text-sm px-3 py-2 rounded-sm border outline-none"
                      style={{ borderColor: "hsl(214,20%,85%)", color: "hsl(220,30%,12%)" }}
                      defaultValue={field.value}
                    />
                  </div>
                ))}
                <button
                  className="px-5 py-2.5 rounded-sm text-sm font-semibold text-white"
                  style={{ background: "hsl(218,65%,22%)" }}
                  onClick={() => showToast("Профиль обновлён")}
                >
                  Сохранить изменения
                </button>
              </div>
            </div>
          )}

          {/* === SUPPORT === */}
          {active === "support" && (
            <div className="max-w-lg animate-fade-in">
              <h2 className="text-base font-semibold mb-6" style={{ color: "hsl(220,30%,12%)" }}>
                Служба поддержки
              </h2>
              <div className="space-y-4">
                {[
                  { icon: "Phone", title: "Телефон", desc: "+7 (800) 000-00-00", sub: "Бесплатно, пн–пт 9:00–18:00" },
                  { icon: "Mail", title: "Email", desc: "support@corpmail.ru", sub: "Ответим в течение 24 часов" },
                  { icon: "MessageSquare", title: "Онлайн-чат", desc: "Открыть чат поддержки", sub: "Сейчас онлайн: 3 оператора" },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-sm border p-5 bg-white flex items-center gap-4"
                    style={{ borderColor: "hsl(214,20%,85%)" }}
                  >
                    <div
                      className="w-10 h-10 rounded-sm flex items-center justify-center flex-shrink-0"
                      style={{ background: "hsl(218,65%,95%)" }}
                    >
                      <Icon name={item.icon as Parameters<typeof Icon>[0]["name"]} size={18} color="hsl(218,65%,28%)" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold" style={{ color: "hsl(220,30%,12%)" }}>
                        {item.title}
                      </div>
                      <div className="text-sm" style={{ color: "hsl(218,65%,40%)" }}>
                        {item.desc}
                      </div>
                      <div className="text-xs" style={{ color: "hsl(215,16%,55%)" }}>
                        {item.sub}
                      </div>
                    </div>
                  </div>
                ))}
                <div className="rounded-sm border p-5 bg-white space-y-3" style={{ borderColor: "hsl(214,20%,85%)" }}>
                  <div className="text-sm font-semibold" style={{ color: "hsl(220,30%,12%)" }}>
                    Написать запрос
                  </div>
                  <textarea
                    className="w-full text-sm px-3 py-2 rounded-sm border outline-none resize-none"
                    style={{ borderColor: "hsl(214,20%,85%)", color: "hsl(220,30%,12%)" }}
                    rows={4}
                    placeholder="Опишите вашу проблему..."
                  />
                  <button
                    className="px-5 py-2.5 rounded-sm text-sm font-semibold text-white"
                    style={{ background: "hsl(218,65%,22%)" }}
                    onClick={() => showToast("Запрос отправлен в службу поддержки")}
                  >
                    Отправить запрос
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div
          className="fixed bottom-6 right-6 px-5 py-3 rounded-sm text-sm font-medium text-white shadow-lg animate-slide-up z-50"
          style={{ background: "hsl(218,65%,22%)" }}
        >
          <div className="flex items-center gap-2">
            <Icon name="CheckCircle" size={14} color="white" />
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}