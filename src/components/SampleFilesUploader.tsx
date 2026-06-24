import React, { useState, useRef } from "react";
import { Upload, FileText, Trash2, Edit3, HelpCircle, CheckCircle } from "lucide-react";

interface SampleFilesUploaderProps {
  templateText: string;
  setTemplateText: (val: string) => void;
  requirementsText: string;
  setRequirementsText: (val: string) => void;
}

export default function SampleFilesUploader({
  templateText,
  setTemplateText,
  requirementsText,
  setRequirementsText
}: SampleFilesUploaderProps) {
  const [templateFileName, setTemplateFileName] = useState<string>("");
  const [reqFileName, setReqFileName] = useState<string>("");
  
  const templateInputRef = useRef<HTMLInputElement>(null);
  const reqInputRef = useRef<HTMLInputElement>(null);

  const [isTemplateDragOver, setIsTemplateDragOver] = useState(false);
  const [isReqDragOver, setIsReqDragOver] = useState(false);

  // Default lesson plan template to pre-load for the teacher
  const DEFAULT_TEMPLATE = `KHUNG KẾ HOẠCH BÀI DẠY (GIÁO ÁN CHUẨN)
Môn học: ...; Lớp: ...
Tên bài dạy: ...; Thời lượng: ... tiết
I. MỤC TIÊU (Kiến thức, Năng lực, Phẩm chất)
II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU
III. TIẾN TRÌNH DẠY HỌC
- Hoạt động 1: Xác định vấn đề/Nhiệm vụ học tập/Khởi động
- Hoạt động 2: Hình thành kiến thức mới/Giải quyết vấn đề
- Hoạt động 3: Luyện tập
- Hoạt động 4: Vận dụng
IV. KIỂM TRA ĐÁNH GIÁ (Thường xuyên & Định kỳ)
V. PHỤ LỤC (Phiếu học tập, bài tập, prompt AI...)`;

  const handleFileRead = (file: File, type: "template" | "req") => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (type === "template") {
        setTemplateText(content);
        setTemplateFileName(file.name);
      } else {
        setRequirementsText(content);
        setReqFileName(file.name);
      }
    };
    reader.onerror = () => {
      alert("Không thể đọc file này. Vui lòng thử lại với file văn bản thường (.txt, .csv, v.v.)");
    };
    // Check if text or document
    reader.readAsText(file);
  };

  const onDragOver = (e: React.DragEvent, type: "template" | "req") => {
    e.preventDefault();
    if (type === "template") setIsTemplateDragOver(true);
    else setIsReqDragOver(true);
  };

  const onDragLeave = (type: "template" | "req") => {
    if (type === "template") setIsTemplateDragOver(false);
    else setIsReqDragOver(false);
  };

  const onDrop = (e: React.DragEvent, type: "template" | "req") => {
    e.preventDefault();
    onDragLeave(type);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileRead(file, type);
    }
  };

  const onFileSelectChange = (e: React.ChangeEvent<HTMLInputElement>, type: "template" | "req") => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleFileRead(file, type);
    }
  };

  const clearFile = (type: "template" | "req") => {
    if (type === "template") {
      setTemplateText("");
      setTemplateFileName("");
      if (templateInputRef.current) templateInputRef.current.value = "";
    } else {
      setRequirementsText("");
      setReqFileName("");
      if (reqInputRef.current) reqInputRef.current.value = "";
    }
  };

  const loadDefaultTemplate = () => {
    setTemplateText(DEFAULT_TEMPLATE);
    setTemplateFileName("khung_giao_an_mau_2018.txt");
  };

  return (
    <div className="space-y-5">
      {/* Box 1: Reference Template */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs sm:text-sm font-semibold text-gray-700 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-violet-600" />
            Mẫu giáo án tham khảo (Khung mẫu)
          </label>
          {!templateText && (
            <button
              type="button"
              onClick={loadDefaultTemplate}
              className="text-xs font-medium text-violet-600 hover:text-violet-800 hover:underline transition"
            >
              Áp dụng mẫu chuẩn 2018
            </button>
          )}
        </div>
        
        <div
          onDragOver={(e) => onDragOver(e, "template")}
          onDragLeave={() => onDragLeave("template")}
          onDrop={(e) => onDrop(e, "template")}
          className={`relative border-2 border-dashed rounded-xl p-4 transition-all duration-200 ${
            isTemplateDragOver
              ? "border-violet-500 bg-violet-50"
              : templateText
              ? "border-emerald-200 bg-emerald-50/10"
              : "border-gray-200 hover:border-gray-300 bg-gray-50/30"
          }`}
        >
          <input
            type="file"
            ref={templateInputRef}
            onChange={(e) => onFileSelectChange(e, "template")}
            accept=".txt,.doc,.docx,.json"
            className="hidden"
          />

          {!templateText ? (
            <div className="flex flex-col items-center justify-center py-4 text-center cursor-pointer" onClick={() => templateInputRef.current?.click()}>
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-xs font-semibold text-gray-700">Kéo thả file vào đây hoặc click để chọn</p>
              <p className="text-[10px] text-gray-500 mt-1">Hỗ trợ file văn bản (.txt, .docx, v.v.)</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-medium text-gray-800 truncate max-w-[200px]">
                    {templateFileName || "Văn bản mẫu tự soạn"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => clearFile("template")}
                  className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded transition"
                  title="Xóa mẫu"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <textarea
                value={templateText}
                onChange={(e) => setTemplateText(e.target.value)}
                rows={4}
                className="w-full text-xs bg-white border border-gray-200 rounded-lg p-2 font-mono text-gray-600 focus:outline-none focus:ring-1 focus:ring-violet-500"
                placeholder="Nội dung khung mẫu giáo án của bạn..."
              />
            </div>
          )}
        </div>
      </div>

      {/* Box 2: Custom Requirements */}
      <div className="space-y-2">
        <label className="text-xs sm:text-sm font-semibold text-gray-700 flex items-center gap-1.5">
          <Edit3 className="w-4 h-4 text-pink-600" />
          Yêu cầu soạn giáo án riêng biệt (nếu có)
        </label>
        
        <div
          onDragOver={(e) => onDragOver(e, "req")}
          onDragLeave={() => onDragLeave("req")}
          onDrop={(e) => onDrop(e, "req")}
          className={`relative border-2 border-dashed rounded-xl p-4 transition-all duration-200 ${
            isReqDragOver
              ? "border-pink-500 bg-pink-50"
              : requirementsText
              ? "border-emerald-200 bg-emerald-50/10"
              : "border-gray-200 hover:border-gray-300 bg-gray-50/30"
          }`}
        >
          <input
            type="file"
            ref={reqInputRef}
            onChange={(e) => onFileSelectChange(e, "req")}
            accept=".txt,.doc,.docx,.json"
            className="hidden"
          />

          {!requirementsText ? (
            <div className="flex flex-col items-center justify-center py-4 text-center cursor-pointer" onClick={() => reqInputRef.current?.click()}>
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-xs font-semibold text-gray-700">Kéo thả file vào đây hoặc click để chọn</p>
              <p className="text-[10px] text-gray-500 mt-1">Nơi tải lên chỉ thị, phân bổ hoặc yêu cầu riêng</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-medium text-gray-800 truncate max-w-[200px]">
                    {reqFileName || "Yêu cầu tùy chỉnh"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => clearFile("req")}
                  className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded transition"
                  title="Xóa yêu cầu"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <textarea
                value={requirementsText}
                onChange={(e) => setRequirementsText(e.target.value)}
                rows={4}
                className="w-full text-xs bg-white border border-gray-200 rounded-lg p-2 font-mono text-gray-600 focus:outline-none focus:ring-1 focus:ring-violet-500"
                placeholder="Ví dụ: Cần tập trung phát triển kỹ năng làm việc nhóm, lồng ghép thực hành trò chơi học tập hoặc tích hợp thêm phương pháp STEM..."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
