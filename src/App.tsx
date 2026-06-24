import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  BookOpen, 
  User, 
  School, 
  Calendar, 
  FileText, 
  Layers, 
  Check, 
  ChevronRight, 
  Download, 
  Printer, 
  Save, 
  Search, 
  Filter, 
  RefreshCw, 
  Copy, 
  Trash2, 
  Eye, 
  Clock, 
  Laptop, 
  Cpu, 
  Plus, 
  ArrowRight,
  BookMarked,
  Grid,
  FileSpreadsheet,
  Settings,
  AlertCircle
} from "lucide-react";
import SampleFilesUploader from "./components/SampleFilesUploader";
import AdFooter from "./components/AdFooter";
import SettingsModal from "./components/SettingsModal";
import { 
  TeacherInfo, 
  LessonInfo, 
  LessonOptions, 
  LessonPlanResult, 
  CurriculumInfo, 
  CurriculumResult, 
  HistoryRecord 
} from "./types";
import { 
  exportLessonPlanToWord, 
  exportCurriculumToWord, 
  exportCurriculumToExcel,
  exportLessonPlanToPowerPoint
} from "./utils/exporter";

// Helper for loading tips during Gemini generation
const LOADING_TIPS = [
  "Đang khởi tạo cấu trúc giáo án theo khung chuẩn CTGDPT 2018...",
  "Đang phân tích sách giáo khoa và xây dựng mục tiêu bài giảng...",
  "Đang tích hợp sâu 6 năng lực số (Khai thác, Giao tiếp, Sáng tạo, An toàn, Giải quyết vấn đề, Công dân số)...",
  "Đang thiết kế 6 năng lực AI phù hợp (Hiểu, Sử dụng, Đánh giá, Đạo đức, Prompt, Sáng tạo với AI)...",
  "Đang thiết lập chuỗi 4 hoạt động học tập: Khởi động, Khám phá, Luyện tập, Vận dụng...",
  "Đang tự động thiết kế Phiếu học tập chi tiết và gợi ý Prompt AI dạy học hiệu quả...",
  "Đang biên soạn tiêu chí đánh giá và bảng Rubric sản phẩm học sinh...",
  "Đang hoàn thiện các bảng tích hợp công nghệ và phụ lục học liệu ảo..."
];

export default function App() {
  // API Key & Model settings state
  const [userApiKeys, setUserApiKeys] = useState<string[]>(() => {
    try {
      const savedKeys = localStorage.getItem("gemini_api_keys");
      if (savedKeys) return JSON.parse(savedKeys);
    } catch (e) {
      console.error(e);
    }
    const legacyKey = localStorage.getItem("gemini_api_key");
    return legacyKey ? [legacyKey] : [];
  });
  const [selectedModel, setSelectedModel] = useState<string>(() => localStorage.getItem("gemini_model") || "gemini-3-flash-preview");
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Navigation State
  const [activeTab, setActiveTab] = useState<"module1" | "module2" | "history">("module1");
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingTipIndex, setLoadingTipIndex] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Success Notification state
  const [notification, setNotification] = useState<string | null>(null);

  // MODULE 1 - State
  const [teacherInfo, setTeacherInfo] = useState<TeacherInfo>({
    fullName: "ThS. Nguyễn Văn Hải",
    school: "Trường THPT Chuyên Hà Nội - Amsterdam",
    province: "Hà Nội",
    subject: "Tin học",
    grade: "Lớp 10",
    bookSeries: "Cánh Diều",
    schoolYear: "2026 - 2027"
  });

  const [lessonInfo, setLessonInfo] = useState<LessonInfo>({
    lessonTitle: "Giới thiệu về Trí tuệ nhân tạo (AI)",
    chapter: "Chủ đề F: Giải quyết vấn đề với sự trợ giúp của máy tính",
    theme: "Giới thiệu khoa học máy tính",
    periods: 2,
    duration: "90 phút"
  });

  const [lessonOptions, setLessonOptions] = useState<LessonOptions>({
    lessonType: "both_digital_ai",
    detailLevel: "detailed"
  });

  const [templateText, setTemplateText] = useState<string>("");
  const [requirementsText, setRequirementsText] = useState<string>("");
  const [generatedLessonPlan, setGeneratedLessonPlan] = useState<LessonPlanResult | null>(null);

  // MODULE 2 - State
  const [curriculumInfo, setCurriculumInfo] = useState<CurriculumInfo>({
    subject: "Tin học",
    grade: "Lớp 10",
    bookSeries: "Cánh Diều",
    periodsPerYear: 70,
    weeks: 35,
    semester: "Cả năm",
    mode: "all_year"
  });

  const [generatedCurriculum, setGeneratedCurriculum] = useState<CurriculumResult | null>(null);

  // HISTORY & SAVED DATA State
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterSubject, setFilterSubject] = useState<string>("");
  const [filterGrade, setFilterGrade] = useState<string>("");
  const [filterSchoolYear, setFilterSchoolYear] = useState<string>("");
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<HistoryRecord | null>(null);

  // Active Lesson Plan visual sub-tab
  const [lpSubTab, setLpSubTab] = useState<"visual" | "table" | "appendix">("visual");
  // Active Curriculum visual sub-tab
  const [curSubTab, setCurSubTab] = useState<"distribution" | "goals" | "nls" | "ai" | "resources">("distribution");

  // Cycle through loading tips when generating
  useEffect(() => {
    let interval: any;
    if (loading) {
      interval = setInterval(() => {
        setLoadingTipIndex((prev) => (prev + 1) % LOADING_TIPS.length);
      }, 3500);
    } else {
      setLoadingTipIndex(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // Load History on mount
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await fetch("/api/history");
      if (response.ok) {
        const data = await response.json();
        setHistoryRecords(data);
        // Sync to localStorage
        localStorage.setItem("maris_history", JSON.stringify(data));
      } else {
        const localData = localStorage.getItem("maris_history") || "[]";
        setHistoryRecords(JSON.parse(localData));
      }
    } catch (err) {
      console.warn("Lỗi khi tải lịch sử từ API, dùng localStorage:", err);
      const localData = localStorage.getItem("maris_history") || "[]";
      setHistoryRecords(JSON.parse(localData));
    }
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // MODULE 1: CREATE LESSON PLAN
  const handleGenerateLessonPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      const response = await fetch("/api/generate-lesson-plan", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-gemini-key": userApiKeys.join(","),
          "x-gemini-model": selectedModel
        },
        body: JSON.stringify({
          teacherInfo,
          lessonInfo,
          lessonOptions,
          sampleTemplate: templateText,
          sampleRequirements: requirementsText
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Gặp sự cố khi kết nối tới máy chủ.");
      }

      const data: LessonPlanResult = await response.json();
      setGeneratedLessonPlan(data);
      
      // Auto-save a backup of the generated plan locally
      await handleSaveRecordToCloud("lesson_plan", data, null);
      showNotification("✨ Tạo và lưu giáo án AI thành công!");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Đã xảy ra lỗi không xác định.");
    } finally {
      setLoading(false);
    }
  };

  // MODULE 2: CREATE CURRICULUM
  const handleGenerateCurriculum = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      const response = await fetch("/api/generate-curriculum", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-gemini-key": userApiKeys.join(","),
          "x-gemini-model": selectedModel
        },
        body: JSON.stringify(curriculumInfo)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Gặp sự cố khi tạo phân phối chương trình.");
      }

      const data: CurriculumResult = await response.json();
      setGeneratedCurriculum(data);

      await handleSaveRecordToCloud("curriculum", null, data);
      showNotification("📅 Phân phối chương trình đã được tạo và lưu thành công!");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Đã xảy ra lỗi khi tạo phân phối chương trình.");
    } finally {
      setLoading(false);
    }
  };

  // CLOUD SAVE FUNCTION
  const handleSaveRecordToCloud = async (
    type: "lesson_plan" | "curriculum",
    lessonPlanData: LessonPlanResult | null,
    curriculumData: CurriculumResult | null
  ) => {
    try {
      const title = type === "lesson_plan" 
        ? `Giáo án: ${lessonInfo.lessonTitle}` 
        : `PPCT: Môn ${curriculumInfo.subject} ${curriculumInfo.grade}`;

      const subject = type === "lesson_plan" ? teacherInfo.subject : curriculumInfo.subject;
      const grade = type === "lesson_plan" ? teacherInfo.grade : curriculumInfo.grade;
      const schoolYear = type === "lesson_plan" ? teacherInfo.schoolYear : "2026 - 2027";

      const newRecord: Partial<HistoryRecord> = {
        id: "hist_" + Math.random().toString(36).substr(2, 9),
        type,
        createdAt: new Date().toISOString(),
        title,
        subject,
        grade,
        schoolYear,
        inputs: {
          teacherInfo: type === "lesson_plan" ? teacherInfo : undefined,
          lessonInfo: type === "lesson_plan" ? lessonInfo : undefined,
          lessonOptions: type === "lesson_plan" ? lessonOptions : undefined,
          sampleTemplate: type === "lesson_plan" ? templateText : undefined,
          sampleRequirements: type === "lesson_plan" ? requirementsText : undefined,
          curriculumInfo: type === "curriculum" ? curriculumInfo : undefined,
        },
        outputs: {
          lessonPlan: lessonPlanData || undefined,
          curriculum: curriculumData || undefined,
        }
      };

      // Always save to localStorage as a client-side backup
      const localData = JSON.parse(localStorage.getItem("maris_history") || "[]");
      localData.unshift(newRecord);
      localStorage.setItem("maris_history", JSON.stringify(localData));

      // Attempt to save to backend server
      const response = await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRecord)
      });

      if (response.ok) {
        fetchHistory(); // Refresh list from server
      } else {
        setHistoryRecords(localData);
      }
    } catch (err) {
      console.warn("Lỗi khi lưu lên Cloud, đã lưu tạm ở local:", err);
      const localData = JSON.parse(localStorage.getItem("maris_history") || "[]");
      setHistoryRecords(localData);
    }
  };

  // DELETE HISTORY
  const handleDeleteHistory = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm("Bạn có chắc chắn muốn xóa bản ghi này khỏi bộ nhớ lưu trữ?")) return;
    
    // Remove from localStorage first
    const localData = JSON.parse(localStorage.getItem("maris_history") || "[]").filter((r: any) => r.id !== id);
    localStorage.setItem("maris_history", JSON.stringify(localData));
    setHistoryRecords(localData);
    if (selectedHistoryItem?.id === id) {
      setSelectedHistoryItem(null);
    }

    try {
      const response = await fetch(`/api/history/${id}`, {
        method: "DELETE"
      });
      if (response.ok) {
        showNotification("Đã xóa bản ghi thành công.");
      }
    } catch (err) {
      console.warn("Lỗi khi kết nối tới server để xóa, dữ liệu local đã được xóa:", err);
      showNotification("Đã xóa bản ghi ở bộ nhớ local.");
    }
  };

  // DUPLICATE HISTORY
  const handleDuplicateHistory = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    const localHistory = JSON.parse(localStorage.getItem("maris_history") || "[]");
    const found = localHistory.find((r: any) => r.id === id);
    let duplicatedRecord: any = null;

    if (found) {
      duplicatedRecord = {
        ...found,
        id: "hist_" + Math.random().toString(36).substr(2, 9),
        title: `${found.title} (Bản sao)`,
        createdAt: new Date().toISOString()
      };
      localHistory.unshift(duplicatedRecord);
      localStorage.setItem("maris_history", JSON.stringify(localHistory));
      setHistoryRecords(localHistory);
    }

    try {
      const response = await fetch(`/api/history/${id}/duplicate`, {
        method: "POST"
      });
      if (response.ok) {
        showNotification("Nhân bản thành công bản ghi mẫu.");
      }
    } catch (err) {
      console.warn("Lỗi khi kết nối tới server để nhân bản, đã nhân bản ở local:", err);
      showNotification("Đã nhân bản bản ghi ở bộ nhớ local.");
    }
  };

  // LOAD RE-EDIT
  const handleLoadToForm = (record: HistoryRecord) => {
    if (record.type === "lesson_plan" && record.inputs.teacherInfo && record.inputs.lessonInfo) {
      setTeacherInfo(record.inputs.teacherInfo);
      setLessonInfo(record.inputs.lessonInfo);
      if (record.inputs.lessonOptions) setLessonOptions(record.inputs.lessonOptions);
      setTemplateText(record.inputs.sampleTemplate || "");
      setRequirementsText(record.inputs.sampleRequirements || "");
      setGeneratedLessonPlan(record.outputs.lessonPlan || null);
      setActiveTab("module1");
      showNotification("Đã tải dữ liệu giáo án vào khung soạn thảo.");
    } else if (record.type === "curriculum" && record.inputs.curriculumInfo) {
      setCurriculumInfo(record.inputs.curriculumInfo);
      setGeneratedCurriculum(record.outputs.curriculum || null);
      setActiveTab("module2");
      showNotification("Đã tải dữ liệu phân phối chương trình chuyên đề.");
    }
  };

  // PRINTING HANDLER
  const handlePrint = () => {
    window.print();
  };

  // SAVE SETTINGS HANDLER
  const handleSaveSettings = (apiKeys: string[], model: string) => {
    localStorage.setItem("gemini_api_keys", JSON.stringify(apiKeys));
    localStorage.setItem("gemini_model", model);
    setUserApiKeys(apiKeys);
    setSelectedModel(model);
    setIsSettingsOpen(false);
    showNotification("💾 Cấu hình API Keys & Model thành công!");
  };

  // EXPORT CURRICULUM TO WORD / EXCEL
  const handleExportCurriculum = (format: "word" | "excel") => {
    const cur = generatedCurriculum || (selectedHistoryItem?.outputs.curriculum);
    if (!cur) return;
    
    const info = curriculumInfo;
    const title = `Phân phối chương trình ${info.subject} ${info.grade} - Sách ${info.bookSeries}`;
    if (format === "word") {
      exportCurriculumToWord(cur, title);
    } else {
      exportCurriculumToExcel(cur, title);
    }
    showNotification("Đang tải xuống dữ liệu phân phối...");
  };

  // EXPORT LESSON PLAN TO WORD
  const handleExportLessonPlan = () => {
    const lp = generatedLessonPlan || (selectedHistoryItem?.outputs.lessonPlan);
    if (!lp) return;
    exportLessonPlanToWord(lp);
    showNotification("Tập tin giáo án Word (.docx) đang được chuẩn bị tải về...");
  };

  // EXPORT LESSON PLAN TO POWERPOINT
  const handleExportLessonPlanPPTX = () => {
    const lp = generatedLessonPlan || (selectedHistoryItem?.outputs.lessonPlan);
    if (!lp) return;
    exportLessonPlanToPowerPoint(lp);
    showNotification("Bài giảng slide PowerPoint (.pptx) đang được chuẩn bị tải về...");
  };

  // FILTERED HISTORY
  const filteredHistory = historyRecords.filter((rec) => {
    const matchesSearch = rec.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          rec.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = filterSubject ? rec.subject === filterSubject : true;
    const matchesGrade = filterGrade ? rec.grade === filterGrade : true;
    const matchesYear = filterSchoolYear ? rec.schoolYear === filterSchoolYear : true;
    return matchesSearch && matchesSubject && matchesGrade && matchesYear;
  });

  const uniqueSubjects = Array.from(new Set(historyRecords.map((r) => r.subject)));
  const uniqueGrades = Array.from(new Set(historyRecords.map((r) => r.grade)));
  const uniqueYears = Array.from(new Set(historyRecords.map((r) => r.schoolYear).filter(Boolean)));

  // Preset configuration templates to help testing
  const applyPresetLesson = (preset: "ai" | "nls" | "stem") => {
    if (preset === "ai") {
      setLessonInfo({
        lessonTitle: "Ứng dụng Trí tuệ nhân tạo (AI) trong cuộc sống",
        chapter: "Chủ đề F: Giải quyết vấn đề với sự trợ giúp của máy tính",
        theme: "Ứng dụng tin học",
        periods: 2,
        duration: "90 phút"
      });
      setLessonOptions({
        lessonType: "ai_integrated",
        detailLevel: "detailed"
      });
    } else if (preset === "nls") {
      setLessonInfo({
        lessonTitle: "Tìm kiếm thông tin trên Internet và Bản quyền số",
        chapter: "Chủ đề A: Máy tính và xã hội tri thức",
        theme: "Internet và đạo đức số",
        periods: 1,
        duration: "45 phút"
      });
      setLessonOptions({
        lessonType: "digital_competency",
        detailLevel: "detailed"
      });
    } else {
      setLessonInfo({
        lessonTitle: "Xây dựng ngôi nhà thông minh với sơ đồ khối",
        chapter: "Chủ đề E: Thiết kế đồ họa và tư duy lập trình",
        theme: "Tư duy máy tính & STEM",
        periods: 3,
        duration: "135 phút"
      });
      setLessonOptions({
        lessonType: "both_digital_ai",
        detailLevel: "contest"
      });
    }
    showNotification("Đã điền mẫu bài học thử nghiệm!");
  };

  return (
    <div className="flex h-screen w-screen bg-slate-50 text-gray-800 font-sans antialiased selection:bg-violet-100 selection:text-violet-900 overflow-hidden">
      
      {/* GLOBAL TOAST NOTIFICATION */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-5 py-3.5 rounded-xl shadow-xl flex items-center gap-2.5 max-w-sm border border-gray-800 animate-slide-in">
          <div className="p-1 bg-emerald-500 rounded-full text-white">
            <Check className="w-3.5 h-3.5" />
          </div>
          <span className="text-sm font-medium">{notification}</span>
        </div>
      )}

      {/* LEFT SIDEBAR MENU */}
      <aside className="w-64 sm:w-72 md:w-80 bg-slate-900 text-slate-100 flex flex-col justify-between border-r border-slate-800 shrink-0 select-none overflow-y-auto no-print">
        {/* Top Part: Branding & Navigation */}
        <div className="flex flex-col">
          {/* Header Block in Sidebar */}
          <div className="p-6 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-violet-500 to-indigo-500 text-white rounded-xl shadow-lg shadow-violet-500/20 shrink-0">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h1 className="text-sm font-extrabold tracking-tight text-white leading-tight uppercase font-display">
                  MARIS SLIDE
                </h1>
                <p className="text-[10px] text-slate-400 font-medium">
                  Hệ sinh thái Giáo viên 4.0
                </p>
              </div>
            </div>
            <div className="mt-4 bg-slate-800/40 rounded-lg px-3 py-1.5 border border-slate-800 text-[10px] text-slate-400 font-medium">
              ✨ Soạn Giáo Án AI &amp; Phân Phối
            </div>
          </div>

          {/* Navigation Menu Links */}
          <nav className="py-4 px-3 space-y-1">
            <button
              onClick={() => { setActiveTab("module1"); setSelectedHistoryItem(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 text-left ${
                activeTab === "module1"
                  ? "bg-violet-600 text-white shadow-md shadow-violet-600/10"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <FileText className={`w-4 h-4 shrink-0 ${activeTab === "module1" ? "text-white" : "text-slate-400"}`} />
              <span className="truncate">📝 Soạn Giáo Án AI</span>
            </button>

            <button
              onClick={() => { setActiveTab("module2"); setSelectedHistoryItem(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 text-left ${
                activeTab === "module2"
                  ? "bg-violet-600 text-white shadow-md shadow-violet-600/10"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <Calendar className={`w-4 h-4 shrink-0 ${activeTab === "module2" ? "text-white" : "text-slate-400"}`} />
              <span className="truncate">📅 Phân Phối Chương Trình</span>
            </button>

            <button
              onClick={() => { setActiveTab("history"); setSelectedHistoryItem(null); }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 text-left ${
                activeTab === "history"
                  ? "bg-violet-600 text-white shadow-md shadow-violet-600/10"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <Clock className={`w-4 h-4 shrink-0 ${activeTab === "history" ? "text-white" : "text-slate-400"}`} />
                <span className="truncate">📜 Lịch Sử Đã Lưu</span>
              </div>
              {historyRecords.length > 0 && (
                <span className="bg-violet-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ring-2 ring-slate-900 shrink-0">
                  {historyRecords.length}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Footer info inside sidebar */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center border border-violet-500/30 text-violet-300 shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-200 truncate">{teacherInfo.fullName}</p>
              <p className="text-[10px] text-slate-500 truncate">{teacherInfo.school}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* RIGHT MAIN PANEL */}
      <main className="flex-1 flex flex-col min-w-0 h-full bg-[#f8f9fc] overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-gray-100 bg-white px-6 flex items-center justify-between shrink-0 no-print">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:inline shrink-0">
              {activeTab === "module1" ? "Tính năng" : activeTab === "module2" ? "Tính năng" : "Hệ thống"}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-300 hidden sm:inline shrink-0" />
            <span className="text-xs sm:text-sm font-bold text-gray-800 truncate">
              {activeTab === "module1" ? "Soạn Giáo Án AI Sư Phạm" : activeTab === "module2" ? "Biên Soạn Phân Phối Chương Trình" : "Thư Viện Tài Liệu Cá Nhân"}
            </span>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <span className="text-xs text-gray-400 font-medium hidden md:inline">
              Năm học: {teacherInfo.schoolYear}
            </span>
            <div className="h-4 w-px bg-gray-200 hidden md:block"></div>
            
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 border border-slate-200 shadow-sm cursor-pointer shrink-0"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Cài đặt API</span>
            </button>
            
            <a
              href="https://aistudio.google.com/api-keys"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] font-bold text-red-600 hover:underline animate-pulse shrink-0"
            >
              Lấy API key để sử dụng app
            </a>

            <a
              href="https://marisslide.com"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold text-violet-600 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-lg transition shrink-0"
            >
              Maris Slide
            </a>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          
          {/* ERROR BANNER */}
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 flex items-start gap-3 no-print">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm">Gặp lỗi trong quá trình xử lý:</h4>
                <p className="text-xs text-red-700 mt-1 whitespace-pre-wrap">{errorMsg}</p>
                <p className="text-xs text-gray-500 mt-2">
                  Hãy đảm bảo rằng <strong className="text-gray-700">GEMINI_API_KEY</strong> đã được thiết lập đúng trong mục <strong>Settings &gt; Secrets</strong> trên AI Studio.
                </p>
              </div>
            </div>
          )}

        {/* LOADING OVERLAY STATE */}
        {loading && (
          <div className="fixed inset-0 z-50 bg-white/95 flex flex-col items-center justify-center p-6 text-center">
            <div className="relative mb-6">
              <div className="w-16 h-16 border-4 border-violet-100 border-t-violet-600 rounded-full animate-spin"></div>
              <Sparkles className="w-6 h-6 text-violet-600 absolute inset-0 m-auto animate-pulse" />
            </div>
            <h2 className="text-xl font-bold font-display text-gray-900 animate-pulse">
              Trí tuệ nhân tạo Maris AI đang biên soạn nội dung...
            </h2>
            <div className="max-w-lg mt-4 bg-violet-50/50 border border-violet-100 rounded-xl p-4 shadow-sm">
              <p className="text-sm font-semibold text-violet-800">
                {LOADING_TIPS[loadingTipIndex]}
              </p>
            </div>
            <p className="text-xs text-gray-400 mt-8">
              Quá trình này có thể mất khoảng 10-25 giây để suy luận toàn vẹn và chi tiết nhất. Vui lòng giữ màn hình ổn định.
            </p>
          </div>
        )}

        {/* TAB 1: MODULE 1 - SOẠN GIÁO ÁN AI */}
        {activeTab === "module1" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left form config column */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Form container */}
              <form onSubmit={handleGenerateLessonPlan} className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5 space-y-6">
                
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-violet-600" />
                    <h2 className="font-bold font-display text-gray-900 text-base sm:text-lg">
                      Thiết lập Giáo án AI
                    </h2>
                  </div>
                  
                  {/* Preset quick buttons */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-gray-400 font-medium uppercase">Mẫu thử:</span>
                    <button
                      type="button"
                      onClick={() => applyPresetLesson("ai")}
                      className="px-2 py-0.5 bg-violet-50 text-violet-600 text-[10px] font-semibold rounded hover:bg-violet-100 transition"
                      title="Bài học tích hợp AI"
                    >
                      AI
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPresetLesson("nls")}
                      className="px-2 py-0.5 bg-pink-50 text-pink-600 text-[10px] font-semibold rounded hover:bg-pink-100 transition"
                      title="Bài học tích hợp Năng lực số"
                    >
                      NLS
                    </button>
                  </div>
                </div>

                {/* Section A: Teacher profile details */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
                    <User className="w-3.5 h-3.5" /> THÔNG TIN GIÁO VIÊN
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Họ và tên giáo viên</label>
                      <input
                        type="text"
                        value={teacherInfo.fullName}
                        onChange={(e) => setTeacherInfo({ ...teacherInfo, fullName: e.target.value })}
                        required
                        className="w-full text-xs sm:text-sm border border-gray-200 rounded-lg p-2.5 focus:border-violet-500 focus:outline-none"
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Đơn vị công tác</label>
                      <input
                        type="text"
                        value={teacherInfo.school}
                        onChange={(e) => setTeacherInfo({ ...teacherInfo, school: e.target.value })}
                        required
                        className="w-full text-xs sm:text-sm border border-gray-200 rounded-lg p-2.5 focus:border-violet-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Tỉnh/Thành phố</label>
                      <input
                        type="text"
                        value={teacherInfo.province}
                        onChange={(e) => setTeacherInfo({ ...teacherInfo, province: e.target.value })}
                        required
                        className="w-full text-xs sm:text-sm border border-gray-200 rounded-lg p-2.5 focus:border-violet-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Năm học</label>
                      <input
                        type="text"
                        value={teacherInfo.schoolYear}
                        onChange={(e) => setTeacherInfo({ ...teacherInfo, schoolYear: e.target.value })}
                        required
                        className="w-full text-xs sm:text-sm border border-gray-200 rounded-lg p-2.5 focus:border-violet-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Môn học</label>
                      <input
                        type="text"
                        value={teacherInfo.subject}
                        onChange={(e) => setTeacherInfo({ ...teacherInfo, subject: e.target.value })}
                        required
                        className="w-full text-xs sm:text-sm border border-gray-200 rounded-lg p-2.5 focus:border-violet-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Khối lớp</label>
                      <input
                        type="text"
                        value={teacherInfo.grade}
                        onChange={(e) => setTeacherInfo({ ...teacherInfo, grade: e.target.value })}
                        required
                        className="w-full text-xs sm:text-sm border border-gray-200 rounded-lg p-2.5 focus:border-violet-500 focus:outline-none"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Bộ sách giáo khoa</label>
                      <select
                        value={teacherInfo.bookSeries}
                        onChange={(e) => setTeacherInfo({ ...teacherInfo, bookSeries: e.target.value })}
                        className="w-full text-xs sm:text-sm border border-gray-200 rounded-lg p-2.5 focus:border-violet-500 focus:outline-none bg-white"
                      >
                        <option value="Cánh Diều">Cánh Diều</option>
                        <option value="Kết nối tri thức với cuộc sống">Kết nối tri thức với cuộc sống</option>
                        <option value="Chân trời sáng tạo">Chân trời sáng tạo</option>
                        <option value="Sách chuyên đề khác">Sách chuyên đề khác</option>
                      </select>
                    </div>
                  </div>

                </div>

                {/* Section B: Lesson Info */}
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5" /> THÔNG TIN BÀI DẠY
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Tên bài dạy học</label>
                      <input
                        type="text"
                        value={lessonInfo.lessonTitle}
                        onChange={(e) => setLessonInfo({ ...lessonInfo, lessonTitle: e.target.value })}
                        required
                        className="w-full text-xs sm:text-sm border border-gray-200 rounded-lg p-2.5 focus:border-violet-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Chương học</label>
                        <input
                          type="text"
                          value={lessonInfo.chapter}
                          onChange={(e) => setLessonInfo({ ...lessonInfo, chapter: e.target.value })}
                          required
                          className="w-full text-xs sm:text-sm border border-gray-200 rounded-lg p-2.5 focus:border-violet-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Chủ đề bài</label>
                        <input
                          type="text"
                          value={lessonInfo.theme}
                          onChange={(e) => setLessonInfo({ ...lessonInfo, theme: e.target.value })}
                          required
                          className="w-full text-xs sm:text-sm border border-gray-200 rounded-lg p-2.5 focus:border-violet-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Số tiết học</label>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={lessonInfo.periods}
                          onChange={(e) => setLessonInfo({ ...lessonInfo, periods: parseInt(e.target.value) || 1 })}
                          required
                          className="w-full text-xs sm:text-sm border border-gray-200 rounded-lg p-2.5 focus:border-violet-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Thời lượng/Tiết</label>
                        <input
                          type="text"
                          value={lessonInfo.duration}
                          onChange={(e) => setLessonInfo({ ...lessonInfo, duration: e.target.value })}
                          required
                          className="w-full text-xs sm:text-sm border border-gray-200 rounded-lg p-2.5 focus:border-violet-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section C: Optional Framework upload / requirements */}
                <div className="pt-4 border-t border-gray-100">
                  <SampleFilesUploader 
                    templateText={templateText}
                    setTemplateText={setTemplateText}
                    requirementsText={requirementsText}
                    setRequirementsText={setRequirementsText}
                  />
                </div>

                {/* Section D: Integration Type */}
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
                    <Settings className="w-3.5 h-3.5" /> TÙY CHỌN TÍCH HỢP & CHI TIẾT
                  </h3>

                  <div className="space-y-3">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase">Khung định hướng tích hợp</label>
                    
                    <div className="grid grid-cols-1 gap-2.5">
                      
                      <label className="flex items-start gap-2.5 p-2.5 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-100 cursor-pointer transition">
                        <input
                          type="radio"
                          name="lessonType"
                          value="standard_2018"
                          checked={lessonOptions.lessonType === "standard_2018"}
                          onChange={() => setLessonOptions({ ...lessonOptions, lessonType: "standard_2018" })}
                          className="mt-0.5 text-violet-600 focus:ring-violet-500"
                        />
                        <div>
                          <p className="text-xs font-semibold text-gray-900">Giáo án Chuẩn CTGDPT 2018</p>
                          <p className="text-[10px] text-gray-500">Giáo án cơ bản chuẩn mực, không tích hợp bổ trợ đặc biệt.</p>
                        </div>
                      </label>

                      <label className="flex items-start gap-2.5 p-2.5 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-100 cursor-pointer transition">
                        <input
                          type="radio"
                          name="lessonType"
                          value="digital_competency"
                          checked={lessonOptions.lessonType === "digital_competency"}
                          onChange={() => setLessonOptions({ ...lessonOptions, lessonType: "digital_competency" })}
                          className="mt-0.5 text-violet-600 focus:ring-violet-500"
                        />
                        <div>
                          <p className="text-xs font-semibold text-gray-900">Giáo án tích hợp Năng lực số</p>
                          <p className="text-[10px] text-gray-500">Tích hợp đầy đủ cả 6 miền năng lực số cần thiết theo quy chuẩn mới.</p>
                        </div>
                      </label>

                      <label className="flex items-start gap-2.5 p-2.5 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-100 cursor-pointer transition">
                        <input
                          type="radio"
                          name="lessonType"
                          value="ai_integrated"
                          checked={lessonOptions.lessonType === "ai_integrated"}
                          onChange={() => setLessonOptions({ ...lessonOptions, lessonType: "ai_integrated" })}
                          className="mt-0.5 text-violet-600 focus:ring-violet-500"
                        />
                        <div>
                          <p className="text-xs font-semibold text-gray-900">Giáo án tích hợp Trí tuệ nhân tạo (AI)</p>
                          <p className="text-[10px] text-gray-500">Đưa 6 năng lực AI sư phạm lồng ghép vào cách học sinh khám phá kiến thức.</p>
                        </div>
                      </label>

                      <label className="flex items-start gap-2.5 p-2.5 bg-violet-50/50 hover:bg-violet-50 rounded-lg border border-violet-100 cursor-pointer transition">
                        <input
                          type="radio"
                          name="lessonType"
                          value="both_digital_ai"
                          checked={lessonOptions.lessonType === "both_digital_ai"}
                          onChange={() => setLessonOptions({ ...lessonOptions, lessonType: "both_digital_ai" })}
                          className="mt-0.5 text-violet-600 focus:ring-violet-500"
                        />
                        <div>
                          <p className="text-xs font-semibold text-violet-800">Tích hợp Năng lực số + AI (Chuyên sâu)</p>
                          <p className="text-[10px] text-violet-600">Lựa chọn tối ưu, lồng ghép đa dạng trải nghiệm học tập kỷ nguyên số.</p>
                        </div>
                      </label>

                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase">Mức độ chi tiết</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["basic", "detailed", "contest"] as const).map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setLessonOptions({ ...lessonOptions, detailLevel: level })}
                          className={`py-1.5 px-1.5 border text-center text-xs font-semibold rounded-lg transition-all ${
                            lessonOptions.detailLevel === level
                              ? "bg-gray-900 text-white border-gray-900"
                              : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          {level === "basic" ? "Cơ bản" : level === "detailed" ? "Chi tiết" : "Dự thi"}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold py-3 px-4 rounded-xl shadow-md hover:from-violet-700 hover:to-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Soạn Giáo Án Ngay
                </button>

              </form>

              {/* Promo box under config */}
              <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-4 text-white shadow-md">
                <h4 className="font-bold text-xs sm:text-sm tracking-tight flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Gợi ý sư phạm đắc lực
                </h4>
                <p className="text-[11px] text-indigo-200 mt-1 leading-relaxed">
                  Bản giáo án tạo ra tự động tuân thủ hoàn toàn theo Nghị quyết chuẩn hóa quốc gia CTGDPT 2018. Bạn có thể xuất trực tiếp sang Word để biên tập nhanh và in ấn chuyên nghiệp!
                </p>
              </div>

            </div>

            {/* Right Interactive Preview Column */}
            <div className="lg:col-span-7">
              {generatedLessonPlan ? (
                <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 space-y-6">
                  
                  {/* Result Header Actions */}
                  <div className="flex flex-wrap items-center justify-between border-b border-gray-100 pb-4 gap-3">
                    <div>
                      <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-2.5 py-1 rounded-full uppercase">KẾT QUẢ SOẠN AI</span>
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 mt-1 truncate max-w-[300px]" title={generatedLessonPlan.phan1.tenBai}>
                        {generatedLessonPlan.phan1.tenBai}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleExportLessonPlan}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:border-violet-300 hover:text-violet-600 text-gray-700 text-xs font-semibold rounded-lg transition shadow-sm cursor-pointer"
                        title="Xuất file Microsoft Word chuẩn (.docx)"
                      >
                        <Download className="w-3.5 h-3.5 text-blue-500" />
                        Tải Word
                      </button>
                      <button
                        type="button"
                        onClick={handleExportLessonPlanPPTX}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:border-violet-300 hover:text-violet-600 text-gray-700 text-xs font-semibold rounded-lg transition shadow-sm cursor-pointer"
                        title="Tải slide bài giảng trình chiếu (.pptx)"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-500" />
                        Tải Slide
                      </button>
                      <button
                        type="button"
                        onClick={handlePrint}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:border-violet-300 hover:text-violet-600 text-gray-700 text-xs font-semibold rounded-lg transition shadow-sm cursor-pointer"
                        title="In giáo án hoặc Lưu PDF"
                      >
                        <Printer className="w-3.5 h-3.5 text-orange-500" />
                        Lưu PDF
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveRecordToCloud("lesson_plan", generatedLessonPlan, null)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-semibold rounded-lg transition cursor-pointer"
                        title="Lưu trữ vĩnh viễn trên đám mây"
                      >
                        <Save className="w-3.5 h-3.5" />
                        Lưu Cloud
                      </button>
                    </div>
                  </div>

                  {/* Sub tabs to navigate through generated portions */}
                  <div className="flex border-b border-gray-100">
                    <button
                      onClick={() => setLpSubTab("visual")}
                      className={`px-4 py-2 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
                        lpSubTab === "visual"
                          ? "border-violet-600 text-violet-600 bg-violet-50/20"
                          : "border-transparent text-gray-500 hover:text-gray-900"
                      }`}
                    >
                      📖 Nội dung Giáo án (Phần 1 - 5)
                    </button>
                    <button
                      onClick={() => setLpSubTab("table")}
                      className={`px-4 py-2 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
                        lpSubTab === "table"
                          ? "border-violet-600 text-violet-600 bg-violet-50/20"
                          : "border-transparent text-gray-500 hover:text-gray-900"
                      }`}
                    >
                      📊 Bảng tích hợp Công nghệ (Phần 6 - 7)
                    </button>
                    <button
                      onClick={() => setLpSubTab("appendix")}
                      className={`px-4 py-2 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
                        lpSubTab === "appendix"
                          ? "border-violet-600 text-violet-600 bg-violet-50/20"
                          : "border-transparent text-gray-500 hover:text-gray-900"
                      }`}
                    >
                      📎 Tài liệu & Phụ lục (Phần 8)
                    </button>
                  </div>

                  {/* SUB TAB VIEWPORT */}
                  <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 mt-4 text-justify">
                    
                    {/* Visual Portions: PHẦN 1 - 5 */}
                    {lpSubTab === "visual" && (
                      <div className="space-y-6">
                        
                        {/* Phần 1: Thông tin bài dạy */}
                        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-2">
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">PHẦN 1: THÔNG TIN BÀI DẠY</h4>
                          <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                            <p><span className="font-semibold text-gray-500">Môn học:</span> <span className="font-medium text-gray-900">{generatedLessonPlan.phan1.monHoc}</span></p>
                            <p><span className="font-semibold text-gray-500">Khối lớp:</span> <span className="font-medium text-gray-900">{generatedLessonPlan.phan1.lop}</span></p>
                            <p><span className="font-semibold text-gray-500">Tên bài:</span> <span className="font-medium text-gray-900">{generatedLessonPlan.phan1.tenBai}</span></p>
                            <p><span className="font-semibold text-gray-500">Bộ sách:</span> <span className="font-medium text-gray-900">{generatedLessonPlan.phan1.boSach}</span></p>
                            <p className="col-span-2"><span className="font-semibold text-gray-500">Thời lượng học tập:</span> <span className="font-medium text-gray-900">{generatedLessonPlan.phan1.thoiLuong}</span></p>
                          </div>
                        </div>

                        {/* Phần 2: Mục tiêu */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-violet-600 uppercase tracking-wider">PHẦN 2: MỤC TIÊU BÀI DẠY</h4>
                          
                          <div className="space-y-2">
                            <p className="text-xs sm:text-sm font-bold text-gray-700 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 bg-violet-600 rounded-full"></span> Kiến thức cốt lõi
                            </p>
                            <ul className="list-disc pl-5 text-xs sm:text-sm text-gray-600 space-y-1">
                              {generatedLessonPlan.phan2.kienThuc.map((item, idx) => <li key={idx}>{item}</li>)}
                            </ul>
                          </div>

                          <div className="space-y-2 pt-2">
                            <p className="text-xs sm:text-sm font-bold text-gray-700 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 bg-violet-600 rounded-full"></span> Năng lực phát triển
                            </p>
                            <ul className="list-disc pl-5 text-xs sm:text-sm text-gray-600 space-y-1">
                              {generatedLessonPlan.phan2.nangLuc.map((item, idx) => <li key={idx}>{item}</li>)}
                            </ul>
                          </div>

                          <div className="space-y-2 pt-2">
                            <p className="text-xs sm:text-sm font-bold text-gray-700 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 bg-violet-600 rounded-full"></span> Phẩm chất cần đạt
                            </p>
                            <ul className="list-disc pl-5 text-xs sm:text-sm text-gray-600 space-y-1">
                              {generatedLessonPlan.phan2.phamChat.map((item, idx) => <li key={idx}>{item}</li>)}
                            </ul>
                          </div>

                          {generatedLessonPlan.phan2.nangLucSo && (
                            <div className="space-y-2 pt-2 bg-pink-50/50 border border-pink-100 rounded-xl p-3">
                              <p className="text-xs sm:text-sm font-bold text-pink-800 flex items-center gap-1.5">
                                <Cpu className="w-4 h-4" /> Năng lực số tích hợp (6 Miền)
                              </p>
                              <ul className="list-disc pl-5 text-xs sm:text-sm text-pink-900 space-y-1">
                                {generatedLessonPlan.phan2.nangLucSo.map((item, idx) => <li key={idx}>{item}</li>)}
                              </ul>
                            </div>
                          )}

                          {generatedLessonPlan.phan2.nangLucAI && (
                            <div className="space-y-2 pt-2 bg-violet-50 border border-violet-100 rounded-xl p-3">
                              <p className="text-xs sm:text-sm font-bold text-violet-800 flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4" /> Năng lực Trí tuệ nhân tạo (AI)
                              </p>
                              <ul className="list-disc pl-5 text-xs sm:text-sm text-violet-900 space-y-1">
                                {generatedLessonPlan.phan2.nangLucAI.map((item, idx) => <li key={idx}>{item}</li>)}
                              </ul>
                            </div>
                          )}
                        </div>

                        {/* Phần 3: Thiết bị dạy học */}
                        <div className="space-y-3 pt-2">
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">PHẦN 3: THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="border border-gray-100 rounded-xl p-3 bg-white">
                              <p className="text-xs sm:text-sm font-bold text-gray-800 mb-1.5 flex items-center gap-1">
                                <User className="w-3.5 h-3.5 text-violet-600" /> Dành cho Giáo viên
                              </p>
                              <ul className="list-disc pl-4 text-xs text-gray-600 space-y-1">
                                {generatedLessonPlan.phan3.giaoVien.map((item, idx) => <li key={idx}>{item}</li>)}
                              </ul>
                            </div>
                            <div className="border border-gray-100 rounded-xl p-3 bg-white">
                              <p className="text-xs sm:text-sm font-bold text-gray-800 mb-1.5 flex items-center gap-1">
                                <School className="w-3.5 h-3.5 text-pink-600" /> Dành cho Học sinh
                              </p>
                              <ul className="list-disc pl-4 text-xs text-gray-600 space-y-1">
                                {generatedLessonPlan.phan3.hocSinh.map((item, idx) => <li key={idx}>{item}</li>)}
                              </ul>
                            </div>
                          </div>
                        </div>

                        {/* Phần 4: Tiến trình dạy học */}
                        <div className="space-y-4 pt-2">
                          <h4 className="text-xs font-bold text-violet-600 uppercase tracking-wider">PHẦN 4: TIẾN TRÌNH DẠY HỌC (CHUỖI HOẠT ĐỘNG)</h4>
                          
                          {generatedLessonPlan.phan4.map((act, idx) => (
                            <div key={idx} className="border border-gray-100 bg-white rounded-xl p-4 shadow-sm space-y-3">
                              <div className="flex items-center justify-between bg-violet-50 text-violet-900 py-1 px-3 rounded-lg text-xs font-bold">
                                <span>HOẠT ĐỘNG {idx + 1}: {act.title || act.name}</span>
                              </div>
                              
                              <div className="space-y-2 text-xs sm:text-sm text-gray-700">
                                <p><strong className="text-gray-900">Mục tiêu:</strong> {act.mucTieu}</p>
                                <p><strong className="text-gray-900">Nội dung học tập:</strong> {act.noiDung}</p>
                                
                                {act.nhiemVuGv && <p><strong className="text-gray-900">Nhiệm vụ GV:</strong> {act.nhiemVuGv}</p>}
                                {act.nhiemVuHs && <p><strong className="text-gray-900">Nhiệm vụ HS:</strong> {act.nhiemVuHs}</p>}
                                {act.cachThucHien && <p><strong className="text-gray-900">Tổ chức thực hiện:</strong> {act.cachThucHien}</p>}
                                
                                <p><strong className="text-gray-900">Sản phẩm hoạt động:</strong> {act.sanPham}</p>
                                <p><strong className="text-gray-900">Phương pháp đánh giá:</strong> {act.danhGia}</p>

                                {/* Optional fields */}
                                {act.congCuSo && <p className="text-violet-700"><strong className="text-violet-900">Công cụ số:</strong> {act.congCuSo}</p>}
                                {act.nangLucSo && <p className="text-pink-700"><strong className="text-pink-900">Năng lực số tích hợp:</strong> {act.nangLucSo}</p>}
                                {act.nangLucAI && <p className="text-violet-800"><strong className="text-violet-950">Năng lực AI phát triển:</strong> {act.nangLucAI}</p>}

                                {act.baiTap && (
                                  <div className="mt-2.5 p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                                    <p className="font-bold text-gray-900">Bài tập luyện tập:</p>
                                    <p className="text-xs text-gray-600 mt-0.5">{act.baiTap}</p>
                                    {act.dapAn && <p className="text-xs text-emerald-700 font-medium mt-1">✓ Đáp án: {act.dapAn}</p>}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Phần 5: Kiểm tra đánh giá */}
                        <div className="space-y-3 pt-2">
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">PHẦN 5: KIỂM TRA ĐÁNH GIÁ CHUNG</h4>
                          <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/50 space-y-3">
                            <div>
                              <p className="text-xs sm:text-sm font-bold text-gray-800">1. Các công cụ đánh giá thường xuyên</p>
                              <ul className="list-disc pl-5 text-xs sm:text-sm text-gray-600 mt-1 space-y-1">
                                {generatedLessonPlan.phan5.danhGiaThuongXuyen.map((item, idx) => <li key={idx}>{item}</li>)}
                              </ul>
                            </div>
                            
                            <div className="pt-2 border-t border-gray-200">
                              <p className="text-xs sm:text-sm font-bold text-gray-800">2. Rubric chấm điểm / Tiêu chí đánh giá sản phẩm số</p>
                              <p className="text-xs text-gray-600 mt-1 leading-relaxed whitespace-pre-line bg-white p-3 rounded-lg border border-gray-100">
                                {generatedLessonPlan.phan5.danhGiaSanPham}
                              </p>
                            </div>
                          </div>
                        </div>

                      </div>
                    )}

                    {/* Sub Tab: Tích hợp công nghệ (Bảng 6, 7) */}
                    {lpSubTab === "table" && (
                      <div className="space-y-6">
                        
                        {/* Phần 6: Bảng tích hợp NLS */}
                        {generatedLessonPlan.phan6 && generatedLessonPlan.phan6.length > 0 ? (
                          <div className="space-y-3">
                            <h4 className="text-xs font-bold text-pink-600 uppercase tracking-wider flex items-center gap-1.5">
                              <Cpu className="w-4 h-4" /> PHẦN 6: BẢNG TÍCH HỢP NĂNG LỰC SỐ
                            </h4>
                            <div className="overflow-x-auto border border-gray-100 rounded-xl">
                              <table className="w-full text-xs sm:text-sm text-left">
                                <thead className="bg-gray-50 text-gray-700 font-bold">
                                  <tr>
                                    <th className="p-3">Hoạt động học tập</th>
                                    <th className="p-3">Công cụ công nghệ số</th>
                                    <th className="p-3">Năng lực số hình thành</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-gray-600">
                                  {generatedLessonPlan.phan6.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                      <td className="p-3 font-semibold text-gray-900">{row.hoatDong}</td>
                                      <td className="p-3">{row.congCu}</td>
                                      <td className="p-3"><span className="px-2 py-0.5 bg-pink-50 text-pink-700 text-[10px] font-bold rounded-full">{row.nangLucSo}</span></td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 bg-gray-50 rounded-xl text-center text-xs text-gray-500">
                            Không thiết lập tích hợp Năng lực số cho mẫu giáo án này. Chọn tùy chọn "Tích hợp Năng lực số" để tạo mới.
                          </div>
                        )}

                        {/* Phần 7: Bảng tích hợp AI */}
                        {generatedLessonPlan.phan7 && generatedLessonPlan.phan7.length > 0 ? (
                          <div className="space-y-3">
                            <h4 className="text-xs font-bold text-violet-600 uppercase tracking-wider flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4" /> PHẦN 7: BẢNG TÍCH HỢP TRÍ TUỆ NHÂN TẠO (AI)
                            </h4>
                            <div className="overflow-x-auto border border-gray-100 rounded-xl">
                              <table className="w-full text-xs sm:text-sm text-left">
                                <thead className="bg-gray-50 text-gray-700 font-bold">
                                  <tr>
                                    <th className="p-3">Hoạt động học tập</th>
                                    <th className="p-3">Công cụ AI đề xuất</th>
                                    <th className="p-3">Năng lực AI cần bồi dưỡng</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-gray-600">
                                  {generatedLessonPlan.phan7.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                      <td className="p-3 font-semibold text-gray-900">{row.hoatDong}</td>
                                      <td className="p-3">{row.congCuAI}</td>
                                      <td className="p-3"><span className="px-2 py-0.5 bg-violet-50 text-violet-700 text-[10px] font-bold rounded-full">{row.nangLucAI}</span></td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 bg-gray-50 rounded-xl text-center text-xs text-gray-500">
                            Không thiết lập tích hợp AI cho mẫu giáo án này. Chọn tùy chọn "Tích hợp AI" để tạo mới.
                          </div>
                        )}

                      </div>
                    )}

                    {/* Sub Tab: Tài liệu & Phụ lục (Phần 8) */}
                    {lpSubTab === "appendix" && (
                      <div className="space-y-5">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">PHẦN 8: PHỤ LỤC HỌC LIỆU & PROMPT AI</h4>
                        
                        {/* Phiếu học tập */}
                        <div className="space-y-2">
                          <p className="text-xs sm:text-sm font-bold text-gray-800">1. Phiếu học tập chi tiết (Dành cho HS)</p>
                          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 font-mono text-xs text-gray-700 whitespace-pre-line leading-relaxed">
                            {generatedLessonPlan.phan8.phieuHocTap}
                          </div>
                        </div>

                        {/* Prompt AI */}
                        <div className="space-y-2">
                          <p className="text-xs sm:text-sm font-bold text-violet-800">2. Prompt AI Giáo viên khuyên dùng (Mẫu câu lệnh dạy học)</p>
                          <div className="bg-violet-950 text-violet-100 border border-violet-900 rounded-xl p-4 font-mono text-xs leading-relaxed select-all">
                            {generatedLessonPlan.phan8.promptAI}
                          </div>
                          <p className="text-[10px] text-gray-400">💡 Click đúp hoặc bôi đen để sao chép Prompt trên và gửi cho Gemini/ChatGPT để hỗ trợ giảng dạy trực tiếp!</p>
                        </div>

                        {/* Mẫu sản phẩm */}
                        <div className="space-y-2">
                          <p className="text-xs sm:text-sm font-bold text-gray-800">3. Mô tả mẫu sản phẩm học sinh đạt yêu cầu</p>
                          <p className="text-xs sm:text-sm text-gray-600 bg-emerald-50/20 border border-emerald-100 rounded-xl p-4 leading-relaxed whitespace-pre-line">
                            {generatedLessonPlan.phan8.mauSanPham}
                          </p>
                        </div>

                        {/* Link học liệu */}
                        <div className="space-y-2">
                          <p className="text-xs sm:text-sm font-bold text-gray-800">4. Liên kết học liệu ảo / Nguồn tài nguyên tham khảo</p>
                          <ul className="list-disc pl-5 text-xs text-violet-600 space-y-1">
                            {generatedLessonPlan.phan8.linkHocLieu.map((link, idx) => (
                              <li key={idx}>
                                <a href="#" onClick={(e) => e.preventDefault()} className="hover:underline">{link}</a>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Tài liệu tham khảo */}
                        <div className="space-y-2">
                          <p className="text-xs sm:text-sm font-bold text-gray-800">5. Sách giáo khoa & Tài liệu tham khảo khác</p>
                          <ul className="list-disc pl-5 text-xs text-gray-600 space-y-1">
                            {generatedLessonPlan.phan8.taiLieuThamKhao.map((ref, idx) => <li key={idx}>{ref}</li>)}
                          </ul>
                        </div>

                      </div>
                    )}

                  </div>

                </div>
              ) : (
                <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-4">
                  <div className="p-4 bg-violet-50 text-violet-600 rounded-full">
                    <BookMarked className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-base sm:text-lg text-gray-900 font-display">Chưa có Giáo án được tạo</h3>
                  <p className="text-xs sm:text-sm text-gray-500 max-w-sm">
                    Hãy hoàn thiện các thông tin và nhấn nút <strong>"Soạn Giáo Án Ngay"</strong> ở bảng bên trái. Công nghệ Generative AI của chúng tôi sẽ thiết kế cho bạn giáo án hoàn mỹ trong vài giây!
                  </p>
                  
                  {/* Visual flowchart mock layout */}
                  <div className="flex items-center gap-2 pt-4">
                    <span className="text-[10px] bg-gray-100 text-gray-500 font-semibold px-2 py-1 rounded">1. Điền hồ sơ</span>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-[10px] bg-gray-100 text-gray-500 font-semibold px-2 py-1 rounded">2. Chọn tích hợp AI/NLS</span>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-[10px] bg-violet-600 text-white font-semibold px-2 py-1 rounded">3. Xuất file Word chuẩn</span>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 2: MODULE 2 - PHÂN PHỐI CHƯƠNG TRÌNH */}
        {activeTab === "module2" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left form config column */}
            <div className="lg:col-span-4">
              
              <form onSubmit={handleGenerateCurriculum} className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5 space-y-5">
                
                <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                  <h2 className="font-bold font-display text-gray-900 text-base sm:text-lg">
                    Thiết lập phân phối
                  </h2>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Môn học giảng dạy</label>
                    <input
                      type="text"
                      value={curriculumInfo.subject}
                      onChange={(e) => setCurriculumInfo({ ...curriculumInfo, subject: e.target.value })}
                      required
                      className="w-full text-xs sm:text-sm border border-gray-200 rounded-lg p-2.5 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Khối lớp</label>
                      <input
                        type="text"
                        value={curriculumInfo.grade}
                        onChange={(e) => setCurriculumInfo({ ...curriculumInfo, grade: e.target.value })}
                        required
                        className="w-full text-xs sm:text-sm border border-gray-200 rounded-lg p-2.5 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Bộ sách</label>
                      <input
                        type="text"
                        value={curriculumInfo.bookSeries}
                        onChange={(e) => setCurriculumInfo({ ...curriculumInfo, bookSeries: e.target.value })}
                        required
                        className="w-full text-xs sm:text-sm border border-gray-200 rounded-lg p-2.5 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Tổng tiết/năm</label>
                      <input
                        type="number"
                        min={1}
                        max={200}
                        value={curriculumInfo.periodsPerYear}
                        onChange={(e) => setCurriculumInfo({ ...curriculumInfo, periodsPerYear: parseInt(e.target.value) || 70 })}
                        required
                        className="w-full text-xs sm:text-sm border border-gray-200 rounded-lg p-2.5 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Tổng số tuần</label>
                      <input
                        type="number"
                        min={1}
                        max={52}
                        value={curriculumInfo.weeks}
                        onChange={(e) => setCurriculumInfo({ ...curriculumInfo, weeks: parseInt(e.target.value) || 35 })}
                        required
                        className="w-full text-xs sm:text-sm border border-gray-200 rounded-lg p-2.5 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Tên học kỳ</label>
                    <input
                      type="text"
                      value={curriculumInfo.semester}
                      onChange={(e) => setCurriculumInfo({ ...curriculumInfo, semester: e.target.value })}
                      required
                      className="w-full text-xs sm:text-sm border border-gray-200 rounded-lg p-2.5 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase">CHẾ ĐỘ BIÊN SOẠN</label>
                    
                    <div className="grid grid-cols-1 gap-2">
                      <label className="flex items-center gap-2 p-2.5 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 cursor-pointer text-xs font-semibold">
                        <input
                          type="radio"
                          name="curMode"
                          checked={curriculumInfo.mode === "all_year"}
                          onChange={() => setCurriculumInfo({ ...curriculumInfo, mode: "all_year", semester: "Cả năm" })}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        Toàn bộ năm học (35 tuần)
                      </label>

                      <label className="flex items-center gap-2 p-2.5 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 cursor-pointer text-xs font-semibold">
                        <input
                          type="radio"
                          name="curMode"
                          checked={curriculumInfo.mode === "semester_1"}
                          onChange={() => setCurriculumInfo({ ...curriculumInfo, mode: "semester_1", semester: "Học kỳ I" })}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        Chỉ soạn Học kỳ I (18 tuần)
                      </label>

                      <label className="flex items-center gap-2 p-2.5 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 cursor-pointer text-xs font-semibold">
                        <input
                          type="radio"
                          name="curMode"
                          checked={curriculumInfo.mode === "semester_2"}
                          onChange={() => setCurriculumInfo({ ...curriculumInfo, mode: "semester_2", semester: "Học kỳ II" })}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        Chỉ soạn Học kỳ II (17 tuần)
                      </label>
                    </div>

                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold py-3 px-4 rounded-xl shadow-md hover:from-indigo-700 hover:to-violet-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Xây Dựng Phân Phối
                </button>

              </form>

            </div>

            {/* Right Interactive Table viewport column */}
            <div className="lg:col-span-8">
              {generatedCurriculum ? (
                <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5 space-y-5">
                  
                  {/* Action Header bar */}
                  <div className="flex flex-wrap items-center justify-between border-b border-gray-100 pb-3 gap-3">
                    <div>
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full uppercase">KẾT QUẢ PHÂN PHỐI AI</span>
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 mt-1">
                        Phân phối chi tiết môn {curriculumInfo.subject} - {curriculumInfo.grade}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleExportCurriculum("word")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 text-gray-700 text-xs font-semibold rounded-lg transition"
                        title="Tải phân phối định dạng Microsoft Word"
                      >
                        <Download className="w-3.5 h-3.5 text-blue-500" />
                        Tải Word
                      </button>
                      <button
                        onClick={() => handleExportCurriculum("excel")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 text-gray-700 text-xs font-semibold rounded-lg transition"
                        title="Tải tệp bảng tính CSV / Excel"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                        Tải Excel
                      </button>
                    </div>
                  </div>

                  {/* Grid Sub-Tabs */}
                  <div className="flex flex-wrap border-b border-gray-100 gap-1">
                    <button
                      onClick={() => setCurSubTab("distribution")}
                      className={`px-3 py-2 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
                        curSubTab === "distribution"
                          ? "border-indigo-600 text-indigo-600 bg-indigo-50/20"
                          : "border-transparent text-gray-500 hover:text-gray-900"
                      }`}
                    >
                      📅 1. Bảng Phân Phối
                    </button>
                    <button
                      onClick={() => setCurSubTab("goals")}
                      className={`px-3 py-2 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
                        curSubTab === "goals"
                          ? "border-indigo-600 text-indigo-600 bg-indigo-50/20"
                          : "border-transparent text-gray-500 hover:text-gray-900"
                      }`}
                    >
                      🎯 2. Bảng Mục Tiêu
                    </button>
                    <button
                      onClick={() => setCurSubTab("nls")}
                      className={`px-3 py-2 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
                        curSubTab === "nls"
                          ? "border-indigo-600 text-indigo-600 bg-indigo-50/20"
                          : "border-transparent text-gray-500 hover:text-gray-900"
                      }`}
                    >
                      💻 3. Bảng NLS
                    </button>
                    <button
                      onClick={() => setCurSubTab("ai")}
                      className={`px-3 py-2 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
                        curSubTab === "ai"
                          ? "border-indigo-600 text-indigo-600 bg-indigo-50/20"
                          : "border-transparent text-gray-500 hover:text-gray-900"
                      }`}
                    >
                      🤖 4. Bảng AI
                    </button>
                    <button
                      onClick={() => setCurSubTab("resources")}
                      className={`px-3 py-2 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
                        curSubTab === "resources"
                          ? "border-indigo-600 text-indigo-600 bg-indigo-50/20"
                          : "border-transparent text-gray-500 hover:text-gray-900"
                      }`}
                    >
                      📎 5. Bảng Học Liệu
                    </button>
                  </div>

                  {/* Active Table Viewer */}
                  <div className="max-h-[500px] overflow-y-auto border border-gray-100 rounded-xl">
                    
                    {curSubTab === "distribution" && (
                      <table className="w-full text-xs sm:text-sm text-left">
                        <thead className="bg-gray-50 text-gray-700 font-bold">
                          <tr>
                            <th className="p-3 w-1/5 text-center">Tuần</th>
                            <th className="p-3 w-3/5">Bài dạy học chủ đạo</th>
                            <th className="p-3 w-1/5 text-center">Phân bổ tiết</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-600">
                          {generatedCurriculum.bangPhanPhoi.map((row, idx) => (
                            <tr key={idx} className="hover:bg-gray-50/50">
                              <td className="p-3 text-center font-bold text-gray-900 bg-gray-50/30">{row.tuan}</td>
                              <td className="p-3 font-medium text-gray-800">{row.bai}</td>
                              <td className="p-3 text-center"><span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded">{row.tiet}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    {curSubTab === "goals" && (
                      <table className="w-full text-xs sm:text-sm text-left">
                        <thead className="bg-gray-50 text-gray-700 font-bold">
                          <tr>
                            <th className="p-3 w-1/3">Bài giảng</th>
                            <th className="p-3 w-1/3">Kiến thức cốt lõi cần đạt</th>
                            <th className="p-3 w-1/3">Năng lực số & đặc thù bồi dưỡng</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-600">
                          {generatedCurriculum.bangMucTieu.map((row, idx) => (
                            <tr key={idx} className="hover:bg-gray-50/50">
                              <td className="p-3 font-bold text-gray-900 bg-gray-50/30">{row.bai}</td>
                              <td className="p-3 text-gray-700 leading-relaxed">{row.kienThuc}</td>
                              <td className="p-3 text-gray-600 leading-relaxed">{row.nangLuc}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    {curSubTab === "nls" && (
                      <table className="w-full text-xs sm:text-sm text-left">
                        <thead className="bg-gray-50 text-gray-700 font-bold">
                          <tr>
                            <th className="p-3 w-2/5">Tên bài học</th>
                            <th className="p-3 w-3/5">Phương hướng tích hợp Năng lực số (NLS)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-600">
                          {generatedCurriculum.bangNls && generatedCurriculum.bangNls.length > 0 ? (
                            generatedCurriculum.bangNls.map((row, idx) => (
                              <tr key={idx} className="hover:bg-gray-50/50">
                                <td className="p-3 font-bold text-gray-900 bg-gray-50/30">{row.bai}</td>
                                <td className="p-3 text-pink-700 font-medium leading-relaxed">{row.nls}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={2} className="p-6 text-center text-gray-400">Không có dữ liệu tích hợp Năng lực số.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    )}

                    {curSubTab === "ai" && (
                      <table className="w-full text-xs sm:text-sm text-left">
                        <thead className="bg-gray-50 text-gray-700 font-bold">
                          <tr>
                            <th className="p-3 w-2/5">Tên bài học</th>
                            <th className="p-3 w-3/5">Ứng dụng hoặc rèn luyện năng lực AI</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-600">
                          {generatedCurriculum.bangAi && generatedCurriculum.bangAi.length > 0 ? (
                            generatedCurriculum.bangAi.map((row, idx) => (
                              <tr key={idx} className="hover:bg-gray-50/50">
                                <td className="p-3 font-bold text-gray-900 bg-gray-50/30">{row.bai}</td>
                                <td className="p-3 text-violet-700 font-medium leading-relaxed">{row.ai}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={2} className="p-6 text-center text-gray-400">Không có dữ liệu tích hợp Trí tuệ nhân tạo.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    )}

                    {curSubTab === "resources" && (
                      <table className="w-full text-xs sm:text-sm text-left">
                        <thead className="bg-gray-50 text-gray-700 font-bold">
                          <tr>
                            <th className="p-3 w-2/5">Tên bài học</th>
                            <th className="p-3 w-3/5">Thiết bị, Link học liệu số khuyên dùng</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-600">
                          {generatedCurriculum.bangHocLieu.map((row, idx) => (
                            <tr key={idx} className="hover:bg-gray-50/50">
                              <td className="p-3 font-bold text-gray-900 bg-gray-50/30">{row.bai}</td>
                              <td className="p-3 text-gray-700 leading-relaxed italic">{row.hocLieu}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                  </div>

                </div>
              ) : (
                <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-4">
                  <div className="p-4 bg-indigo-50 text-indigo-600 rounded-full">
                    <Grid className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-base sm:text-lg text-gray-900 font-display">Chưa tạo Phân Phối Chương Trình</h3>
                  <p className="text-xs sm:text-sm text-gray-500 max-w-sm">
                    Xác nhận thông tin lớp, bộ sách và tổng thời lượng giảng dạy, sau đó nhấn nút <strong>"Xây Dựng Phân Phối"</strong> để khởi tạo một bảng phân phối bài giảng toàn diện 35 tuần chuẩn mực.
                  </p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 3: HISTORY PANEL (Saved logs) */}
        {activeTab === "history" && (
          <div className="space-y-6">
            
            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5 space-y-4">
              
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                <div>
                  <h2 className="text-base sm:text-lg font-bold font-display text-gray-900 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-violet-600" />
                    Lịch Sử Giáo Án & Phân Phối Đã Lưu
                  </h2>
                  <p className="text-xs text-gray-500">
                    Nơi lưu giữ các bản thiết kế phục vụ mục đích in ấn, chỉnh sửa lại hoặc nhân bản nhanh.
                  </p>
                </div>
              </div>

              {/* Advanced Search & Filtering block */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="relative sm:col-span-1">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm tiêu đề, bài dạy..."
                    className="w-full text-xs pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <select
                    value={filterSubject}
                    onChange={(e) => setFilterSubject(e.target.value)}
                    className="w-full text-xs p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-violet-500 bg-white"
                  >
                    <option value="">Lọc theo Môn học</option>
                    {uniqueSubjects.map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <select
                    value={filterGrade}
                    onChange={(e) => setFilterGrade(e.target.value)}
                    className="w-full text-xs p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-violet-500 bg-white"
                  >
                    <option value="">Lọc theo Lớp</option>
                    {uniqueGrades.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <select
                    value={filterSchoolYear}
                    onChange={(e) => setFilterSchoolYear(e.target.value)}
                    className="w-full text-xs p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-violet-500 bg-white"
                  >
                    <option value="">Lọc theo Năm học</option>
                    {uniqueYears.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

            </div>

            {/* Main History Table/Cards representation */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column list */}
              <div className="lg:col-span-5 space-y-3">
                {filteredHistory.length > 0 ? (
                  filteredHistory.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedHistoryItem(item)}
                      className={`p-4 bg-white border rounded-xl cursor-pointer hover:shadow-sm transition-all duration-200 ${
                        selectedHistoryItem?.id === item.id
                          ? "border-violet-500 ring-1 ring-violet-500 bg-violet-50/5"
                          : "border-gray-100"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase ${
                          item.type === "lesson_plan"
                            ? "bg-violet-100 text-violet-800"
                            : "bg-indigo-100 text-indigo-800"
                        }`}>
                          {item.type === "lesson_plan" ? "Giáo án AI" : "Phân Phối"}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                        </span>
                      </div>

                      <h4 className="font-bold text-xs sm:text-sm text-gray-900 mt-2 truncate">
                        {item.title}
                      </h4>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2.5 text-[11px] text-gray-500 font-medium">
                        <span>Môn: {item.subject}</span>
                        <span>•</span>
                        <span>Khối: {item.grade}</span>
                        {item.schoolYear && (
                          <>
                            <span>•</span>
                            <span>{item.schoolYear}</span>
                          </>
                        )}
                      </div>

                      {/* Action buttons inside card */}
                      <div className="flex items-center justify-end gap-1.5 mt-3 pt-2.5 border-t border-gray-100">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleLoadToForm(item); }}
                          className="px-2.5 py-1 text-[11px] font-semibold text-violet-600 hover:bg-violet-50 rounded"
                          title="Tải lại vào mẫu để chỉnh sửa"
                        >
                          Sửa lại
                        </button>
                        <button
                          onClick={(e) => handleDuplicateHistory(item.id, e)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-gray-600 hover:bg-gray-50 rounded"
                          title="Nhân bản thêm một bản sao"
                        >
                          Tạo bản sao
                        </button>
                        <button
                          onClick={(e) => handleDeleteHistory(item.id, e)}
                          className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition"
                          title="Xóa vĩnh viễn"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                    </div>
                  ))
                ) : (
                  <div className="bg-white border border-gray-100 rounded-xl p-8 text-center text-gray-400 text-xs">
                    Không tìm thấy bản ghi lịch sử nào phù hợp với điều kiện lọc.
                  </div>
                )}
              </div>

              {/* Right Column preview panel for Selected item */}
              <div className="lg:col-span-7">
                {selectedHistoryItem ? (
                  <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 space-y-6">
                    
                    <div className="flex flex-wrap items-center justify-between border-b border-gray-100 pb-4 gap-3">
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Xem trước bản ghi lịch sử</span>
                        <h3 className="text-base sm:text-lg font-bold text-gray-900 mt-1">
                          {selectedHistoryItem.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2">
                        {selectedHistoryItem.type === "lesson_plan" ? (
                          <>
                            <button
                              type="button"
                              onClick={() => exportLessonPlanToWord(selectedHistoryItem.outputs.lessonPlan!)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-gray-200 hover:border-violet-300 hover:text-violet-600 text-gray-700 text-xs font-semibold rounded-lg transition cursor-pointer"
                            >
                              <Download className="w-3 h-3 text-blue-500" />
                              Tải Word
                            </button>
                            <button
                              type="button"
                              onClick={() => exportLessonPlanToPowerPoint(selectedHistoryItem.outputs.lessonPlan!)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-gray-200 hover:border-violet-300 hover:text-violet-600 text-gray-700 text-xs font-semibold rounded-lg transition cursor-pointer"
                              title="Tải slide thuyết trình bài giảng (.pptx)"
                            >
                              <FileSpreadsheet className="w-3 h-3 text-indigo-500" />
                              Tải Slide
                            </button>
                            <button
                              type="button"
                              onClick={handlePrint}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-gray-200 hover:border-violet-300 hover:text-violet-600 text-gray-700 text-xs font-semibold rounded-lg transition cursor-pointer"
                            >
                              <Printer className="w-3 h-3 text-orange-500" />
                              Lưu PDF
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => exportCurriculumToWord(selectedHistoryItem.outputs.curriculum!, selectedHistoryItem.title)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-gray-200 hover:border-violet-300 hover:text-violet-600 text-gray-700 text-xs font-semibold rounded-lg transition"
                            >
                              <Download className="w-3 h-3 text-blue-500" />
                              Tải Word
                            </button>
                            <button
                              onClick={() => exportCurriculumToExcel(selectedHistoryItem.outputs.curriculum!, selectedHistoryItem.title)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-gray-200 hover:border-violet-300 hover:text-violet-600 text-gray-700 text-xs font-semibold rounded-lg transition"
                            >
                              <FileSpreadsheet className="w-3 h-3 text-emerald-500" />
                              Tải Excel
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleLoadToForm(selectedHistoryItem)}
                          className="px-2.5 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-lg transition"
                        >
                          Sửa lại / Biên tập
                        </button>
                      </div>
                    </div>

                    {/* SCROLLABLE DETAILED DATA VISUALIZATION */}
                    <div className="max-h-[500px] overflow-y-auto pr-2 space-y-6 text-justify">
                      
                      {selectedHistoryItem.type === "lesson_plan" && selectedHistoryItem.outputs.lessonPlan && (
                        <div className="space-y-6 text-xs sm:text-sm">
                          
                          {/* Profile box */}
                          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-1">
                            <h4 className="font-bold text-gray-900 text-xs uppercase text-violet-700 mb-1">HỒ SƠ BÀI DẠY</h4>
                            <p><span className="font-semibold text-gray-500">Môn học:</span> {selectedHistoryItem.outputs.lessonPlan.phan1.monHoc}</p>
                            <p><span className="font-semibold text-gray-500">Khối lớp:</span> {selectedHistoryItem.outputs.lessonPlan.phan1.lop}</p>
                            <p><span className="font-semibold text-gray-500">Bộ sách giáo khoa:</span> {selectedHistoryItem.outputs.lessonPlan.phan1.boSach}</p>
                            <p><span className="font-semibold text-gray-500">Thời lượng:</span> {selectedHistoryItem.outputs.lessonPlan.phan1.thoiLuong}</p>
                          </div>

                          {/* Objectives */}
                          <div className="space-y-2">
                            <h4 className="font-bold text-gray-900 uppercase text-xs">MỤC TIÊU BÀI HỌC</h4>
                            <p className="font-bold text-gray-700 mt-1">1. Kiến thức:</p>
                            <ul className="list-disc pl-5 space-y-0.5 text-gray-600">
                              {selectedHistoryItem.outputs.lessonPlan.phan2.kienThuc.map((k, idx) => <li key={idx}>{k}</li>)}
                            </ul>
                            <p className="font-bold text-gray-700 mt-2">2. Năng lực đặc thù:</p>
                            <ul className="list-disc pl-5 space-y-0.5 text-gray-600">
                              {selectedHistoryItem.outputs.lessonPlan.phan2.nangLuc.map((n, idx) => <li key={idx}>{n}</li>)}
                            </ul>
                            <p className="font-bold text-gray-700 mt-2">3. Phẩm chất:</p>
                            <ul className="list-disc pl-5 space-y-0.5 text-gray-600">
                              {selectedHistoryItem.outputs.lessonPlan.phan2.phamChat.map((p, idx) => <li key={idx}>{p}</li>)}
                            </ul>
                          </div>

                          {/* Activities */}
                          <div className="space-y-4">
                            <h4 className="font-bold text-gray-900 uppercase text-xs">TIẾN TRÌNH DẠY HỌC</h4>
                            {selectedHistoryItem.outputs.lessonPlan.phan4.map((act, idx) => (
                              <div key={idx} className="border border-gray-100 p-3 rounded-xl bg-gray-50/50 space-y-2">
                                <p className="font-bold text-gray-900 text-xs sm:text-sm text-violet-700 uppercase">Hoạt động {idx+1}: {act.title || act.name}</p>
                                <p><strong>Mục tiêu:</strong> {act.mucTieu}</p>
                                <p><strong>Nội dung:</strong> {act.noiDung}</p>
                                <p><strong>Sản phẩm:</strong> {act.sanPham}</p>
                                <p><strong>Đánh giá:</strong> {act.danhGia}</p>
                              </div>
                            ))}
                          </div>

                        </div>
                      )}

                      {selectedHistoryItem.type === "curriculum" && selectedHistoryItem.outputs.curriculum && (
                        <div className="space-y-6 text-xs sm:text-sm">
                          
                          <h4 className="font-bold text-gray-900 uppercase text-xs">BẢNG PHÂN PHỐI CHƯƠNG TRÌNH</h4>
                          
                          <div className="border border-gray-100 rounded-xl overflow-hidden">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-gray-50 text-gray-700 font-bold">
                                <tr>
                                  <th className="p-2 text-center">Tuần</th>
                                  <th className="p-2">Bài học</th>
                                  <th className="p-2 text-center">Tiết</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 text-gray-600">
                                {selectedHistoryItem.outputs.curriculum.bangPhanPhoi.map((row, idx) => (
                                  <tr key={idx}>
                                    <td className="p-2 text-center font-bold">{row.tuan}</td>
                                    <td className="p-2">{row.bai}</td>
                                    <td className="p-2 text-center">{row.tiet}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                        </div>
                      )}

                    </div>

                  </div>
                ) : (
                  <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center text-gray-400 text-xs">
                    Vui lòng chọn một bản ghi lịch sử ở cột bên trái để hiển thị nội dung xem trước chi tiết.
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

          {/* PROMOTION FOOTER COMPONENT */}
          <AdFooter />

        </div>

      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen || userApiKeys.length === 0}
        currentApiKeys={userApiKeys}
        currentModel={selectedModel}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveSettings}
      />
    </div>
  );
}
