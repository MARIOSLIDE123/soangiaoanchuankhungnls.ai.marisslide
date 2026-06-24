export interface TeacherInfo {
  fullName: string;
  school: string;
  province: string;
  subject: string;
  grade: string;
  bookSeries: string;
  schoolYear: string;
}

export interface LessonInfo {
  lessonTitle: string;
  chapter: string;
  theme: string;
  periods: number;
  duration: string; // e.g., "45 phút / tiết" or "90 phút"
}

export interface LessonOptions {
  lessonType: 'standard_2018' | 'digital_competency' | 'ai_integrated' | 'both_digital_ai';
  detailLevel: 'basic' | 'detailed' | 'contest';
}

// Subcomponents of a generated Lesson Plan
export interface LessonPlanResult {
  phan1: {
    monHoc: string;
    lop: string;
    tenBai: string;
    thoiLuong: string;
    boSach: string;
  };
  phan2: {
    kienThuc: string[];
    nangLuc: string[];
    phamChat: string[];
    nangLucSo?: string[];
    nangLucAI?: string[];
  };
  phan3: {
    giaoVien: string[];
    hocSinh: string[];
  };
  phan4: {
    id: string;
    name: string;
    title: string;
    mucTieu: string;
    noiDung: string;
    nhiemVuGv?: string;
    nhiemVuHs?: string;
    cachThucHien?: string;
    sanPham: string;
    danhGia: string;
    congCuSo?: string;
    nangLucSo?: string;
    nangLucAI?: string;
    baiTap?: string;
    dapAn?: string;
    tieuChiDanhGia?: string;
    nhiemVuThucTien?: string;
    hoatDongNhom?: string;
    sanPhamSo?: string;
  }[];
  phan5: {
    danhGiaThuongXuyen: string[];
    danhGiaSanPham: string; // Rubric or criteria
  };
  phan6?: {
    hoatDong: string;
    congCu: string;
    nangLucSo: string;
  }[]; // Digital Competency integration table
  phan7?: {
    hoatDong: string;
    congCuAI: string;
    nangLucAI: string;
  }[]; // AI integration table
  phan8: {
    phieuHocTap: string;
    linkHocLieu: string[];
    promptAI: string;
    mauSanPham: string;
    taiLieuThamKhao: string[];
  };
}

export interface CurriculumInfo {
  subject: string;
  grade: string;
  bookSeries: string;
  periodsPerYear: number;
  weeks: number;
  semester: string; // e.g., "Cả năm", "Học kỳ I", "Học kỳ II"
  mode: 'all_year' | 'semester_1' | 'semester_2';
}

export interface CurriculumResult {
  bangPhanPhoi: {
    tuan: string;
    bai: string;
    tiet: string;
  }[];
  bangMucTieu: {
    bai: string;
    kienThuc: string;
    nangLuc: string;
  }[];
  bangNls?: {
    bai: string;
    nls: string;
  }[];
  bangAi?: {
    bai: string;
    ai: string;
  }[];
  bangHocLieu: {
    bai: string;
    hocLieu: string;
  }[];
}

export interface HistoryRecord {
  id: string;
  type: 'lesson_plan' | 'curriculum';
  createdAt: string;
  title: string;
  subject: string;
  grade: string;
  schoolYear: string;
  inputs: {
    teacherInfo?: TeacherInfo;
    lessonInfo?: LessonInfo;
    lessonOptions?: LessonOptions;
    sampleTemplate?: string;
    sampleRequirements?: string;
    curriculumInfo?: CurriculumInfo;
  };
  outputs: {
    lessonPlan?: LessonPlanResult;
    curriculum?: CurriculumResult;
    rawText?: string;
  };
}
