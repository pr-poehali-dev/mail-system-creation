import { useState, useEffect, useRef, useCallback } from "react";
import QRCode from "qrcode";
import jsQR from "jsqr";
import Icon from "@/components/ui/icon";

type Section = "envelopes" | "tracking" | "analytics" | "history" | "settings" | "support";

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

const STORAGE_KEY = "corpmail_envelopes";

function loadEnvelopes(): EnvelopeData[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveEnvelopes(list: EnvelopeData[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

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
  const [orgName, setOrgName] = useState(() => localStorage.getItem("corpmail_org_name") || "");
  const [orgInn, setOrgInn] = useState(() => localStorage.getItem("corpmail_org_inn") || "");
  const [orgAddress, setOrgAddress] = useState(() => localStorage.getItem("corpmail_org_address") || "");
  const [orgPhone, setOrgPhone] = useState(() => localStorage.getItem("corpmail_org_phone") || "");
  const [form, setForm] = useState<Partial<EnvelopeData>>({
    type: "Деловое письмо",
    weight: "0.1",
    createdAt: new Date().toISOString().split("T")[0],
    trackingCode: `ENV-${Date.now().toString().slice(-8)}`,
  });
  const [saved, setSaved] = useState<EnvelopeData[]>(loadEnvelopes);
  const [toast, setToast] = useState<string | null>(null);
  const [trackingInput, setTrackingInput] = useState("");
  const [trackingResult, setTrackingResult] = useState<EnvelopeData | null>(null);
  const [trackingNotFound, setTrackingNotFound] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [scannedRaw, setScannedRaw] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => { saveEnvelopes(saved); }, [saved]);

  const stopScanner = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setScanning(false);
  }, []);

  const handleScanned = useCallback((text: string) => {
    stopScanner();
    setScannerOpen(false);
    setScannedRaw(text);
    try {
      const data = JSON.parse(text);
      if (data.id) {
        setTrackingInput(data.id);
        const found = saved.find(
          (e) => e.trackingCode.toLowerCase() === data.id.toLowerCase() || e.id.toLowerCase() === data.id.toLowerCase()
        );
        if (found) { setTrackingResult(found); setTrackingNotFound(false); }
        else setTrackingNotFound(true);
      }
    } catch {
      setTrackingInput(text);
    }
  }, [stopScanner, saved]);

  useEffect(() => {
    if (!scannerOpen) { stopScanner(); return; }
    setScannerError(null);
    setScannedRaw(null);

    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setScanning(true);
        }
      })
      .catch(() => {
        setScannerError("Нет доступа к камере. Разрешите доступ в настройках браузера.");
      });

    return () => { stopScanner(); };
  }, [scannerOpen, stopScanner]);

  useEffect(() => {
    if (!scanning) return;
    const tick = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });
          if (code) { handleScanned(code.data); return; }
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [scanning, handleScanned]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handlePrint = async (env: Partial<EnvelopeData>) => {
    const qrData = JSON.stringify({
      id: env.trackingCode || "—",
      from: `${env.senderName}, ${env.senderAddress}, ${env.senderCity} ${env.senderIndex}`,
      to: `${env.recipientName}, ${env.recipientAddress}, ${env.recipientCity} ${env.recipientIndex}`,
      weight: `${env.weight} кг`,
      type: env.type,
      date: env.createdAt,
    });
    const qrDataUrl = await QRCode.toDataURL(qrData, {
      width: 160,
      margin: 1,
      color: { dark: "#1a2e5c", light: "#ffffff" },
    });
    const date = env.createdAt ? new Date(env.createdAt).toLocaleDateString("ru-RU") : new Date().toLocaleDateString("ru-RU");
    const html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8"/>
  <title>Конверт ${env.trackingCode || ""}</title>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'IBM Plex Sans', sans-serif; background: #f5f6fa; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 24px; }
    .envelope { width: 210mm; background: white; border: 1px solid #c5cfe8; box-shadow: 0 4px 24px rgba(24,48,96,.12); position: relative; overflow: hidden; }
    .corner { position: absolute; top: 0; right: 0; width: 100px; height: 100px;
      background: repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(26,46,92,0.05) 8px, rgba(26,46,92,0.05) 10px);
      clip-path: polygon(100% 0, 0 0, 100% 100%); }
    .header { background: #1b3468; padding: 10px 24px; display: flex; align-items: center; justify-content: space-between; }
    .header-logo { display: flex; align-items: center; gap: 8px; color: white; font-size: 11px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; font-family: 'IBM Plex Mono', monospace; }
    .header-logo-dot { width: 20px; height: 20px; background: #29afd4; border-radius: 3px; display: flex; align-items: center; justify-content: center; }
    .header-track { color: rgba(255,255,255,.5); font-size: 10px; font-family: 'IBM Plex Mono', monospace; }
    .body { padding: 24px; display: grid; grid-template-columns: 1fr auto; gap: 32px; }
    .addresses { display: flex; flex-direction: column; gap: 0; }
    .addr-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .12em; margin-bottom: 6px; }
    .addr-from .addr-label { color: #2e5aad; }
    .addr-to .addr-label { color: #1d8eb5; }
    .addr-name { font-size: 13px; font-weight: 700; color: #111827; }
    .addr-to .addr-name { font-size: 15px; }
    .addr-line { font-size: 11px; color: #6b7280; margin-top: 2px; }
    .divider { border: none; border-top: 1px solid #e5e9f2; margin: 14px 0; }
    .qr-block { display: flex; flex-direction: column; align-items: center; gap: 8px; }
    .qr-block img { width: 120px; height: 120px; border: 1px solid #e5e9f2; padding: 4px; }
    .qr-hint { font-size: 8px; color: #9ca3af; text-align: center; font-family: 'IBM Plex Mono', monospace; max-width: 120px; line-height: 1.4; }
    .meta { display: flex; gap: 12px; flex-direction: column; align-items: flex-end; }
    .badge { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; padding: 2px 8px; background: #eef0f6; color: #2e5aad; border-radius: 2px; }
    .meta-line { font-size: 9px; color: #9ca3af; }
    .footer { padding: 8px 24px; border-top: 1px dashed #e0e4ef; background: #f9fafb; display: flex; align-items: center; justify-content: space-between; }
    .footer-status { display: flex; align-items: center; gap: 6px; font-size: 10px; color: #6b7280; }
    .footer-dot { width: 6px; height: 6px; border-radius: 50%; background: #29afd4; }
    .footer-date { font-size: 10px; font-family: 'IBM Plex Mono', monospace; color: #9ca3af; }
    @media print {
      body { background: white; padding: 0; }
      .envelope { box-shadow: none; border: 1px solid #c5cfe8; width: 100%; }
      @page { size: A4 landscape; margin: 15mm; }
    }
  </style>
</head>
<body>
  <div class="envelope">
    <div class="corner"></div>
    <div class="header">
      <div class="header-logo">
        <div class="header-logo-dot">✉</div>
        КорпПочта
      </div>
      <div class="header-track">${env.trackingCode || "—"}</div>
    </div>
    <div class="body">
      <div class="addresses">
        <div class="addr-from">
          <div class="addr-label">От кого</div>
          <div class="addr-name">${env.senderName || "—"}</div>
          <div class="addr-line">${env.senderAddress || ""}</div>
          <div class="addr-line">${[env.senderCity, env.senderIndex].filter(Boolean).join(", ")}</div>
        </div>
        <hr class="divider"/>
        <div class="addr-to">
          <div class="addr-label">Кому</div>
          <div class="addr-name">${env.recipientName || "—"}</div>
          <div class="addr-line">${env.recipientAddress || ""}</div>
          <div class="addr-line">${[env.recipientCity, env.recipientIndex].filter(Boolean).join(", ")}</div>
        </div>
      </div>
      <div class="qr-block">
        <img src="${qrDataUrl}" alt="QR-код"/>
        <div class="qr-hint">Сканируйте для получения информации об отправлении</div>
        <div class="meta">
          <div class="badge">${env.type || ""}</div>
          <div class="meta-line">Вес: ${env.weight || "—"} кг</div>
          <div class="meta-line">${date}</div>
        </div>
      </div>
    </div>
    <div class="footer">
      <div class="footer-status"><div class="footer-dot"></div> Готов к отправке</div>
      <div class="footer-date">${date}</div>
    </div>
  </div>
  <script>window.onload = () => { window.print(); }
</body>
</html>`;
    const win = window.open("", "_blank");
    if (win) { win.document.write(html); win.document.close(); }
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
    { id: "settings", icon: "Settings", label: "Настройки" },
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
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold" style={{ color: "hsl(220,30%,12%)" }}>
                    Предпросмотр конверта
                  </h2>
                  <button
                    onClick={() => handlePrint(form)}
                    disabled={!form.senderName || !form.recipientName}
                    className="flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ background: "hsl(218,65%,22%)" }}
                  >
                    <Icon name="Printer" size={14} color="white" />
                    Распечатать конверт
                  </button>
                </div>
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
                    <div className="p-4 space-y-3">
                      {/* Видео с камеры */}
                      <div className="relative rounded-sm overflow-hidden bg-black" style={{ aspectRatio: "4/3" }}>
                        <video
                          ref={videoRef}
                          className="w-full h-full object-cover"
                          autoPlay
                          playsInline
                          muted
                        />
                        {/* Прицел */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="relative w-48 h-48">
                            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white rounded-tl" />
                            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white rounded-tr" />
                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white rounded-bl" />
                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white rounded-br" />
                            {/* Анимированная линия сканирования */}
                            <div
                              className="absolute left-2 right-2 h-0.5"
                              style={{
                                background: "hsl(199,80%,60%)",
                                animation: "scanLine 2s linear infinite",
                                top: "50%",
                              }}
                            />
                          </div>
                        </div>
                        {!scanning && !scannerError && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60">
                            <div className="text-white text-sm">Запуск камеры...</div>
                          </div>
                        )}
                      </div>
                      {/* Скрытый canvas для обработки */}
                      <canvas ref={canvasRef} className="hidden" />

                      {scannerError ? (
                        <div
                          className="p-3 rounded-sm text-xs"
                          style={{ background: "hsl(0,72%,97%)", color: "hsl(0,72%,40%)", border: "1px solid hsl(0,72%,88%)" }}
                        >
                          <div className="flex items-center gap-2">
                            <Icon name="AlertCircle" size={13} color="hsl(0,72%,50%)" />
                            {scannerError}
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-center" style={{ color: "hsl(215,16%,55%)" }}>
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
                    {saved.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-sm" style={{ color: "hsl(215,16%,55%)" }}>
                          История пуста — создайте первый конверт
                        </td>
                      </tr>
                    )}
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

          {/* === SETTINGS === */}
          {active === "settings" && (
            <div className="max-w-lg animate-fade-in">
              <h2 className="text-base font-semibold mb-6" style={{ color: "hsl(220,30%,12%)" }}>
                Настройки организации
              </h2>
              <div className="rounded-sm border p-6 bg-white space-y-4" style={{ borderColor: "hsl(214,20%,85%)" }}>
                {[
                  { label: "Название организации", value: orgName, set: setOrgName, key: "corpmail_org_name", placeholder: "ООО «Моя Компания»" },
                  { label: "ИНН", value: orgInn, set: setOrgInn, key: "corpmail_org_inn", placeholder: "7701234567" },
                  { label: "Юридический адрес", value: orgAddress, set: setOrgAddress, key: "corpmail_org_address", placeholder: "г. Москва, ул. Ленина, д. 1" },
                  { label: "Телефон", value: orgPhone, set: setOrgPhone, key: "corpmail_org_phone", placeholder: "+7 (000) 000-00-00" },
                ].map((field) => (
                  <div key={field.label}>
                    <label className="text-xs font-semibold uppercase tracking-widest block mb-1" style={{ color: "hsl(215,16%,47%)" }}>
                      {field.label}
                    </label>
                    <input
                      className="w-full text-sm px-3 py-2 rounded-sm border outline-none"
                      style={{ borderColor: "hsl(214,20%,85%)", color: "hsl(220,30%,12%)" }}
                      placeholder={field.placeholder}
                      value={field.value}
                      onChange={(e) => field.set(e.target.value)}
                    />
                  </div>
                ))}
                <button
                  className="px-5 py-2.5 rounded-sm text-sm font-semibold text-white"
                  style={{ background: "hsl(218,65%,22%)" }}
                  onClick={() => {
                    localStorage.setItem("corpmail_org_name", orgName);
                    localStorage.setItem("corpmail_org_inn", orgInn);
                    localStorage.setItem("corpmail_org_address", orgAddress);
                    localStorage.setItem("corpmail_org_phone", orgPhone);
                    showToast("Настройки сохранены");
                  }}
                >
                  Сохранить настройки
                </button>
              </div>

              <div className="mt-4 rounded-sm border p-5 bg-white space-y-3" style={{ borderColor: "hsl(214,20%,85%)" }}>
                <div className="text-sm font-semibold" style={{ color: "hsl(220,30%,12%)" }}>Данные системы</div>
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: "hsl(215,16%,47%)" }}>Всего конвертов в базе</span>
                  <span className="text-sm font-bold" style={{ color: "hsl(218,65%,28%)" }}>{saved.length}</span>
                </div>
                <div className="pt-2" style={{ borderTop: "1px solid hsl(214,20%,90%)" }}>
                  <button
                    className="text-xs font-medium px-3 py-1.5 rounded-sm border transition-colors hover:bg-red-50"
                    style={{ borderColor: "hsl(0,72%,80%)", color: "hsl(0,72%,45%)" }}
                    onClick={() => {
                      if (confirm("Удалить все конверты из истории? Это действие необратимо.")) {
                        setSaved([]);
                        showToast("История очищена");
                      }
                    }}
                  >
                    Очистить всю историю
                  </button>
                </div>
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