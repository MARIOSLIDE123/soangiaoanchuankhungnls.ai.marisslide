import React, { useState, useEffect } from "react";
import { Key, Cpu, HelpCircle, Check, X, ShieldAlert } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (apiKeys: string[], selectedModel: string) => void;
  currentApiKeys: string[];
  currentModel: string;
}

const MODELS = [
  {
    id: "gemini-3-flash-preview",
    name: "Gemini 3 Flash",
    tag: "Khuyên dùng",
    desc: "Tốc độ xử lý cực nhanh, tối ưu hóa chi phí và hiệu năng tốt.",
  },
  {
    id: "gemini-3-pro-preview",
    name: "Gemini 3 Pro",
    tag: "Chất lượng cao",
    desc: "Khả năng suy luận sư phạm vượt trội, thích hợp cho giáo án phức tạp.",
  },
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    tag: "Ổn định",
    desc: "Mô hình ổn định thế hệ cũ, phản hồi nhanh và chính xác.",
  }
];

export default function SettingsModal({
  isOpen,
  onClose,
  onSave,
  currentApiKeys,
  currentModel
}: SettingsModalProps) {
  const [key1, setKey1] = useState("");
  const [key2, setKey2] = useState("");
  const [key3, setKey3] = useState("");
  const [selectedModel, setSelectedModel] = useState(currentModel || "gemini-3-flash-preview");
  const [showKeys, setShowKeys] = useState([false, false, false]);

  useEffect(() => {
    setKey1(currentApiKeys[0] || "");
    setKey2(currentApiKeys[1] || "");
    setKey3(currentApiKeys[2] || "");
    if (currentModel) {
      setSelectedModel(currentModel);
    }
  }, [currentApiKeys, currentModel, isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const keys = [key1.trim(), key2.trim(), key3.trim()].filter(Boolean);
    onSave(keys, selectedModel);
  };

  const toggleShowKey = (index: number) => {
    setShowKeys(prev => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  const hasAtLeastOneKey = key1.trim() !== "" || key2.trim() !== "" || key3.trim() !== "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden animate-zoom-in">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-violet-400" />
            <h3 className="font-bold text-base font-display">Cài đặt API Key &amp; Model AI</h3>
          </div>
          {hasAtLeastOneKey && (
            <button 
              type="button" 
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5 max-h-[85vh] overflow-y-auto">
          {/* API Keys Inputs */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-violet-600" /> Cấu hình 3 API Keys dự phòng (Gemini)
            </label>
            
            {/* Key 1 */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase">API Key 1 (Ưu tiên chính)</span>
                <span className="text-[9px] bg-violet-100 text-violet-800 font-bold px-1.5 py-0.2 rounded">Chính</span>
              </div>
              <div className="relative">
                <input
                  type={showKeys[0] ? "text" : "password"}
                  placeholder="Nhập API Key 1 (AI_...)"
                  value={key1}
                  onChange={(e) => setKey1(e.target.value)}
                  className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl pl-3 pr-20 py-2.5 focus:border-violet-500 focus:outline-none bg-slate-50 focus:bg-white transition"
                />
                <button
                  type="button"
                  onClick={() => toggleShowKey(0)}
                  className="absolute right-3 top-2 text-xs text-slate-500 hover:text-slate-900 font-semibold px-2 py-1 rounded hover:bg-slate-100 transition"
                >
                  {showKeys[0] ? "Ẩn" : "Hiện"}
                </button>
              </div>
            </div>

            {/* Key 2 */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase">API Key 2 (Dự phòng 1)</span>
                <span className="text-[9px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.2 rounded">Dự phòng</span>
              </div>
              <div className="relative">
                <input
                  type={showKeys[1] ? "text" : "password"}
                  placeholder="Nhập API Key 2 (AI_...)"
                  value={key2}
                  onChange={(e) => setKey2(e.target.value)}
                  className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl pl-3 pr-20 py-2.5 focus:border-violet-500 focus:outline-none bg-slate-50 focus:bg-white transition"
                />
                <button
                  type="button"
                  onClick={() => toggleShowKey(1)}
                  className="absolute right-3 top-2 text-xs text-slate-500 hover:text-slate-900 font-semibold px-2 py-1 rounded hover:bg-slate-100 transition"
                >
                  {showKeys[1] ? "Ẩn" : "Hiện"}
                </button>
              </div>
            </div>

            {/* Key 3 */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase">API Key 3 (Dự phòng 2)</span>
                <span className="text-[9px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.2 rounded">Dự phòng</span>
              </div>
              <div className="relative">
                <input
                  type={showKeys[2] ? "text" : "password"}
                  placeholder="Nhập API Key 3 (AI_...)"
                  value={key3}
                  onChange={(e) => setKey3(e.target.value)}
                  className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl pl-3 pr-20 py-2.5 focus:border-violet-500 focus:outline-none bg-slate-50 focus:bg-white transition"
                />
                <button
                  type="button"
                  onClick={() => toggleShowKey(2)}
                  className="absolute right-3 top-2 text-xs text-slate-500 hover:text-slate-900 font-semibold px-2 py-1 rounded hover:bg-slate-100 transition"
                >
                  {showKeys[2] ? "Ẩn" : "Hiện"}
                </button>
              </div>
            </div>

            {/* Safety Alerts */}
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-[11px] text-amber-800 space-y-1">
                <p className="font-bold">Cơ chế tự động xoay vòng API Key:</p>
                <p>Hệ thống sẽ sử dụng <b>Key 1</b> trước. Nếu Key 1 hết token/quota (Lỗi 429), ứng dụng sẽ tự động chuyển sang <b>Key 2</b> và tiếp tục đến <b>Key 3</b> mà không làm gián đoạn bài giảng của bạn.</p>
                <p className="pt-1">
                  👉 Chưa có API Key?{" "}
                  <a
                    href="https://aistudio.google.com/api-keys"
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold underline text-violet-700 hover:text-violet-900"
                  >
                    Bấm vào đây để lấy các API Key miễn phí từ Google AI Studio
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Model selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-violet-600" /> Mô hình xử lý (Model AI)
            </label>
            
            <div className="grid grid-cols-1 gap-2">
              {MODELS.map((model) => {
                const isSelected = selectedModel === model.id;
                return (
                  <div
                    key={model.id}
                    onClick={() => setSelectedModel(model.id)}
                    className={`border rounded-xl p-3 cursor-pointer transition-all duration-200 flex items-start gap-2.5 select-none ${
                      isSelected 
                        ? "border-violet-600 bg-violet-50/30 shadow-sm" 
                        : "border-slate-100 hover:border-slate-200 bg-white"
                    }`}
                  >
                    <div className={`p-1 rounded-lg shrink-0 mt-0.5 ${
                      isSelected ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-400"
                    }`}>
                      <Check className="w-3 h-3" />
                    </div>
                    
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-900">{model.name}</span>
                        {model.tag && (
                          <span className={`text-[8px] font-bold px-1 py-0.2 rounded-full ${
                            isSelected ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-500"
                          }`}>
                            {model.tag}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 leading-normal mt-0.5">{model.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Save Action */}
          <div className="pt-3 flex items-center gap-3 justify-end border-t border-slate-100">
            {hasAtLeastOneKey && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Hủy
              </button>
            )}
            <button
              type="submit"
              disabled={!hasAtLeastOneKey}
              className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl text-xs shadow-md transition disabled:opacity-50"
            >
              Lưu cấu hình
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
