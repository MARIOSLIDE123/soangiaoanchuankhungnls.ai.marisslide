import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables from .env
dotenv.config();

const app = express();
const PORT = 3000;

// Set up middleware to parse JSON requests
app.use(express.json({ limit: "50mb" }));

// History local file path
const HISTORY_FILE_PATH = path.join(process.cwd(), "data", "history.json");

// Ensure data folder exists
const ensureDataFolderExists = () => {
  const dir = path.dirname(HISTORY_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(HISTORY_FILE_PATH)) {
    fs.writeFileSync(HISTORY_FILE_PATH, JSON.stringify([], null, 2), "utf-8");
  }
};

// Lazy initialization check for Gemini API Key
const getGeminiClient = (customApiKey?: string) => {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    throw new Error("GEMINI_API_KEY is not configured. Vui lòng thiết lập API Key cá nhân trong Cài đặt.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

const getModelList = (requestedModel?: string): string[] => {
  const defaultModels = [
    "gemini-3-flash-preview",
    "gemini-3-pro-preview",
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-2.0-flash",
    "gemini-1.5-flash"
  ];
  
  if (requestedModel && requestedModel.trim() !== "") {
    const filtered = defaultModels.filter(m => m !== requestedModel);
    return [requestedModel, ...filtered];
  }
  return defaultModels;
};

async function generateContentWithFallback(
  customApiKey: string | undefined,
  requestedModel: string | undefined,
  promptText: string,
  systemInstruction: string,
  responseSchema: any
) {
  // Parse api keys from client-side comma separated header, fallback to server key
  const apiKeys = (customApiKey || "")
    .split(",")
    .map(k => k.trim())
    .filter(Boolean);
    
  const apiKeysToTry = apiKeys.length > 0 ? apiKeys : [process.env.GEMINI_API_KEY].filter(Boolean) as string[];
  
  if (apiKeysToTry.length === 0) {
    throw new Error("GEMINI_API_KEY chưa được cấu hình. Vui lòng thiết lập API Key trong phần Cài đặt.");
  }

  const modelsToTry = getModelList(requestedModel);
  let lastError: any = null;

  for (const model of modelsToTry) {
    for (let i = 0; i < apiKeysToTry.length; i++) {
      const apiKey = apiKeysToTry[i];
      try {
        console.log(`Trying model: ${model} with API Key index: ${i + 1}/${apiKeysToTry.length}`);
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build",
            },
          },
        });
        const response = await ai.models.generateContent({
          model: model,
          contents: promptText,
          config: {
            systemInstruction,
            temperature: 0.2,
            responseMimeType: "application/json",
            responseSchema,
          },
        });
        console.log(`Successfully generated content using model: ${model} with API Key index: ${i + 1}`);
        return response;
      } catch (error: any) {
        const errorMsg = (error.message || "").toLowerCase();
        console.error(`Failed model ${model} with API Key index ${i + 1}:`, error.message || error);
        lastError = error;

        // If it is an invalid API key, we should try the next key immediately
        if (errorMsg.includes("api_key_invalid") || errorMsg.includes("invalid api key") || errorMsg.includes("api key not found") || errorMsg.includes("api key")) {
          console.warn(`API Key index ${i + 1} is invalid, skipping...`);
          continue;
        }

        // If it is a rate limit or quota exceeded (429) error, we rotate to the next key
        if (errorMsg.includes("429") || errorMsg.includes("quota") || errorMsg.includes("exhausted") || errorMsg.includes("rate limit") || errorMsg.includes("limit")) {
          console.warn(`API Key index ${i + 1} exceeded token limit/quota, rotating to next key...`);
          continue;
        }
      }
    }
  }

  throw lastError || new Error("Tất cả các API Keys và mô hình AI đều thất bại khi xử lý yêu cầu.");
}

// ----------------- API ENDPOINTS -----------------

// 1. Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// 2. Local History API
app.get("/api/history", (req, res) => {
  try {
    ensureDataFolderExists();
    const data = fs.readFileSync(HISTORY_FILE_PATH, "utf-8");
    const records = JSON.parse(data);
    res.json(records);
  } catch (error) {
    console.error("Error reading history:", error);
    res.status(500).json({ error: "Could not read history records." });
  }
});

app.post("/api/history", (req, res) => {
  try {
    ensureDataFolderExists();
    const records = JSON.parse(fs.readFileSync(HISTORY_FILE_PATH, "utf-8"));
    const newRecord = req.body;

    if (!newRecord.id) {
      newRecord.id = "hist_" + Math.random().toString(36).substr(2, 9);
    }
    if (!newRecord.createdAt) {
      newRecord.createdAt = new Date().toISOString();
    }

    // Check if record with this ID already exists, if so update it
    const index = records.findIndex((r: any) => r.id === newRecord.id);
    if (index > -1) {
      records[index] = newRecord;
    } else {
      records.unshift(newRecord); // add to top
    }

    fs.writeFileSync(HISTORY_FILE_PATH, JSON.stringify(records, null, 2), "utf-8");
    res.status(200).json(newRecord);
  } catch (error) {
    console.error("Error saving history:", error);
    res.status(500).json({ error: "Could not save history record." });
  }
});

app.delete("/api/history/:id", (req, res) => {
  try {
    ensureDataFolderExists();
    const { id } = req.params;
    let records = JSON.parse(fs.readFileSync(HISTORY_FILE_PATH, "utf-8"));
    records = records.filter((r: any) => r.id !== id);
    fs.writeFileSync(HISTORY_FILE_PATH, JSON.stringify(records, null, 2), "utf-8");
    res.json({ success: true, message: `Deleted history item ${id}` });
  } catch (error) {
    console.error("Error deleting history:", error);
    res.status(500).json({ error: "Could not delete history record." });
  }
});

app.post("/api/history/:id/duplicate", (req, res) => {
  try {
    ensureDataFolderExists();
    const { id } = req.params;
    const records = JSON.parse(fs.readFileSync(HISTORY_FILE_PATH, "utf-8"));
    const found = records.find((r: any) => r.id === id);
    if (!found) {
      return res.status(404).json({ error: "History record not found." });
    }

    const duplicated = {
      ...found,
      id: "hist_" + Math.random().toString(36).substr(2, 9),
      title: `${found.title} (Bản sao)`,
      createdAt: new Date().toISOString()
    };

    records.unshift(duplicated);
    fs.writeFileSync(HISTORY_FILE_PATH, JSON.stringify(records, null, 2), "utf-8");
    res.json(duplicated);
  } catch (error) {
    console.error("Error duplicating history:", error);
    res.status(500).json({ error: "Could not duplicate history record." });
  }
});

// Define schemas for response validation
const lessonPlanSchema = {
  type: Type.OBJECT,
  properties: {
    phan1: {
      type: Type.OBJECT,
      properties: {
        monHoc: { type: Type.STRING },
        lop: { type: Type.STRING },
        tenBai: { type: Type.STRING },
        thoiLuong: { type: Type.STRING },
        boSach: { type: Type.STRING }
      },
      required: ["monHoc", "lop", "tenBai", "thoiLuong", "boSach"]
    },
    phan2: {
      type: Type.OBJECT,
      properties: {
        kienThuc: { type: Type.ARRAY, items: { type: Type.STRING } },
        nangLuc: { type: Type.ARRAY, items: { type: Type.STRING } },
        phamChat: { type: Type.ARRAY, items: { type: Type.STRING } },
        nangLucSo: { type: Type.ARRAY, items: { type: Type.STRING } },
        nangLucAI: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["kienThuc", "nangLuc", "phamChat"]
    },
    phan3: {
      type: Type.OBJECT,
      properties: {
        giaoVien: { type: Type.ARRAY, items: { type: Type.STRING } },
        hocSinh: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["giaoVien", "hocSinh"]
    },
    phan4: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          name: { type: Type.STRING },
          title: { type: Type.STRING },
          mucTieu: { type: Type.STRING },
          noiDung: { type: Type.STRING },
          nhiemVuGv: { type: Type.STRING },
          nhiemVuHs: { type: Type.STRING },
          cachThucHien: { type: Type.STRING },
          sanPham: { type: Type.STRING },
          danhGia: { type: Type.STRING },
          congCuSo: { type: Type.STRING },
          nangLucSo: { type: Type.STRING },
          nangLucAI: { type: Type.STRING },
          baiTap: { type: Type.STRING },
          dapAn: { type: Type.STRING },
          tieuChiDanhGia: { type: Type.STRING },
          nhiemVuThucTien: { type: Type.STRING },
          hoatDongNhom: { type: Type.STRING },
          sanPhamSo: { type: Type.STRING }
        },
        required: ["id", "name", "title", "mucTieu", "noiDung", "sanPham", "danhGia"]
      }
    },
    phan5: {
      type: Type.OBJECT,
      properties: {
        danhGiaThuongXuyen: { type: Type.ARRAY, items: { type: Type.STRING } },
        danhGiaSanPham: { type: Type.STRING }
      },
      required: ["danhGiaThuongXuyen", "danhGiaSanPham"]
    },
    phan6: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          hoatDong: { type: Type.STRING },
          congCu: { type: Type.STRING },
          nangLucSo: { type: Type.STRING }
        },
        required: ["hoatDong", "congCu", "nangLucSo"]
      }
    },
    phan7: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          hoatDong: { type: Type.STRING },
          congCuAI: { type: Type.STRING },
          nangLucAI: { type: Type.STRING }
        },
        required: ["hoatDong", "congCuAI", "nangLucAI"]
      }
    },
    phan8: {
      type: Type.OBJECT,
      properties: {
        phieuHocTap: { type: Type.STRING },
        linkHocLieu: { type: Type.ARRAY, items: { type: Type.STRING } },
        promptAI: { type: Type.STRING },
        mauSanPham: { type: Type.STRING },
        taiLieuThamKhao: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["phieuHocTap", "linkHocLieu", "promptAI", "mauSanPham", "taiLieuThamKhao"]
    }
  },
  required: ["phan1", "phan2", "phan3", "phan4", "phan5", "phan8"]
};

const curriculumSchema = {
  type: Type.OBJECT,
  properties: {
    bangPhanPhoi: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          tuan: { type: Type.STRING },
          bai: { type: Type.STRING },
          tiet: { type: Type.STRING }
        },
        required: ["tuan", "bai", "tiet"]
      }
    },
    bangMucTieu: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          bai: { type: Type.STRING },
          kienThuc: { type: Type.STRING },
          nangLuc: { type: Type.STRING }
        },
        required: ["bai", "kienThuc", "nangLuc"]
      }
    },
    bangNls: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          bai: { type: Type.STRING },
          nls: { type: Type.STRING }
        },
        required: ["bai", "nls"]
      }
    },
    bangAi: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          bai: { type: Type.STRING },
          ai: { type: Type.STRING }
        },
        required: ["bai", "ai"]
      }
    },
    bangHocLieu: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          bai: { type: Type.STRING },
          hocLieu: { type: Type.STRING }
        },
        required: ["bai", "hocLieu"]
      }
    }
  },
  required: ["bangPhanPhoi", "bangMucTieu", "bangHocLieu"]
};

// 3. Gemini Lesson Plan Generation Proxy
app.post("/api/generate-lesson-plan", async (req, res) => {
  try {
    const { teacherInfo, lessonInfo, lessonOptions, sampleTemplate, sampleRequirements } = req.body;
    
    // Retrieve credentials from headers or body
    const userApiKey = req.headers["x-gemini-key"] as string;
    const requestedModel = req.headers["x-gemini-model"] as string;

    let integrationPrompt = "";
    if (lessonOptions.lessonType === "digital_competency") {
      integrationPrompt = "Hãy TÍCH HỢP ĐẦY ĐỦ 6 miền NĂNG LỰC SỐ (NLS) vào bài học:\n1. Khai thác dữ liệu số\n2. Giao tiếp và hợp tác số\n3. Sáng tạo nội dung số\n4. An toàn số\n5. Giải quyết vấn đề số\n6. Công dân số. Hãy phân bổ chúng trong các hoạt động học tập và liệt kê cụ thể ở Phần 2 mục Năng lực số và Phần 6 bảng tích hợp.";
    } else if (lessonOptions.lessonType === "ai_integrated") {
      integrationPrompt = "Hãy TÍCH HỢP ĐẦY ĐỦ 6 miền NĂNG LỰC AI vào bài học:\n1. Hiểu AI\n2. Sử dụng AI\n3. Đánh giá kết quả AI\n4. Đạo đức AI\n5. Thiết kế Prompt\n6. Sáng tạo với AI. Hãy phân bổ chúng trong các hoạt động học tập và liệt kê cụ thể ở Phần 2 mục Năng lực AI và Phần 7 bảng tích hợp.";
    } else if (lessonOptions.lessonType === "both_digital_ai") {
      integrationPrompt = "Hãy TÍCH HỢP ĐỒNG THỜI cả 6 miền NĂNG LỰC SỐ (NLS) và 6 miền NĂNG LỰC AI vào bài học. Thể hiện rõ ràng và chi tiết trong từng hoạt động học tập, các mục tiêu ở Phần 2 và các bảng tích hợp ở Phần 6, Phần 7.";
    } else {
      integrationPrompt = "Soạn thảo giáo án chuẩn theo Chương trình GDPT 2018 (không yêu cầu tích hợp NLS hay AI).";
    }

    let detailPrompt = "";
    if (lessonOptions.detailLevel === "basic") {
      detailPrompt = "Mức độ chi tiết: Cơ bản, tập trung vào các nội dung cốt lõi, ngắn gọn, dễ hiểu.";
    } else if (lessonOptions.detailLevel === "detailed") {
      detailPrompt = "Mức độ chi tiết: Chi tiết, đầy đủ mọi hướng dẫn, nội dung hoạt động phong phú, cụ thể.";
    } else {
      detailPrompt = "Mức độ chi tiết: Chuyên đề dự thi giáo viên giỏi, cấu trúc cực kỳ chặt chẽ, sáng tạo học liệu độc đáo, kịch bản sư phạm tỉ mỉ.";
    }

    const referenceFilesPrompt = `
${sampleTemplate ? `GIÁO ÁN MẪU THAM KHẢO:\n${sampleTemplate}\n` : ""}
${sampleRequirements ? `YÊU CẦU SOẠN GIÁO ÁN RIÊNG BIỆT:\n${sampleRequirements}\n` : ""}
`;

    const promptText = `
Bạn là chuyên gia thiết kế kế hoạch bài dạy theo Chương trình Giáo dục Phổ thông (CTGDPT) 2018 tại Việt Nam.
Hãy tạo một giáo án hoàn chỉnh và chi tiết bằng tiếng Việt theo đúng thông tin và tùy chọn sau:

THÔNG TIN GIÁO VIÊN:
- Họ và tên: ${teacherInfo.fullName}
- Đơn vị công tác: ${teacherInfo.school}
- Tỉnh/Thành phố: ${teacherInfo.province}
- Môn học: ${teacherInfo.subject}
- Khối lớp: ${teacherInfo.grade}
- Bộ sách: ${teacherInfo.bookSeries}
- Năm học: ${teacherInfo.schoolYear}

THÔNG TIN BÀI DẠY:
- Tên bài học: ${lessonInfo.lessonTitle}
- Chương: ${lessonInfo.chapter}
- Chủ đề: ${lessonInfo.theme}
- Số tiết: ${lessonInfo.periods} tiết
- Thời lượng: ${lessonInfo.duration}

TÙY CHỌN TÍCH HỢP:
${integrationPrompt}

MỨC ĐỘ CHI TIẾT:
${detailPrompt}

${referenceFilesPrompt}

YÊU CẦU CỤ THỂ VỀ KẾT QUẢ ĐẦU RA JSON:
Hãy tạo một giáo án chuyên nghiệp, chất lượng cao, đúng quy chuẩn CTGDPT 2018 gồm 8 phần chính như được mô tả trong schema.
- 'phan1' (Thông tin bài dạy): Chứa thông tin cơ bản về môn học, lớp, tên bài, thời lượng, bộ sách.
- 'phan2' (Mục tiêu): Chứa mảng kiến thức, mảng năng lực (chung & đặc thù), mảng phẩm chất. Nếu tích hợp NLS, hãy thêm mảng 'nangLucSo' gồm 6 miền. Nếu tích hợp AI, hãy thêm mảng 'nangLucAI' gồm 6 miền.
- 'phan3' (Thiết bị dạy học): Gồm mảng thiết bị của giáo viên (ví dụ: Laptop, Máy chiếu, Internet, Canva, Gemini, PowerPoint...) và thiết bị của học sinh (Điện thoại, Máy tính bảng, Tài khoản học tập...).
- 'phan4' (Tiến trình dạy học): Chứa chính xác 4 hoạt động sau:
  1. Hoạt động 1: KHỞI ĐỘNG (Warm-up): Điền đầy đủ mục tiêu, nội dung, cách thực hiện, sản phẩm, đánh giá, công cụ số. Nếu có tích hợp, thêm năng lực số và năng lực AI.
  2. Hoạt động 2: HÌNH THÀNH KIẾN THỨC (Knowledge construction): Điền đầy đủ mục tiêu, nội dung, nhiệm vụ GV, nhiệm vụ HS, sản phẩm, đánh giá, công cụ số, năng lực số, năng lực AI.
  3. Hoạt động 3: LUYỆN TẬP (Practice): Điền đầy đủ bài tập, đáp án, cách tổ chức, sản phẩm, tiêu chí đánh giá.
  4. Hoạt động 4: VẬN DỤNG (Application): Điền đầy đủ nhiệm vụ thực tiễn, hoạt động nhóm, sản phẩm số, tiêu chí đánh giá.
- 'phan5' (Kiểm tra đánh giá): Gồm mảng 'danhGiaThuongXuyen' (Quan sát, Hỏi đáp, Phiếu học tập...) và một chuỗi 'danhGiaSanPham' chứa Rubric đánh giá chi tiết.
- 'phan6' (Bảng tích hợp năng lực số): Trả về mảng các dòng (hoạt động, công cụ, năng lực số) nếu có tích hợp NLS.
- 'phan7' (Bảng tích hợp AI): Trả về mảng các dòng (hoạt động, công cụ AI, năng lực AI) nếu có tích hợp AI.
- 'phan8' (Phụ lục): Tự sinh phiếu học tập, link học liệu ảo, prompt AI mẫu cho bài học, mô tả mẫu sản phẩm học sinh, và tài liệu tham khảo cụ thể.

Lưu ý: Viết nội dung bằng tiếng Việt chuẩn sư phạm, lịch sự, phong phú, thực tế và sáng tạo. Tránh các câu tóm tắt chung chung. Đảm bảo toàn bộ nội dung trong file JSON là hoàn chỉnh và chi tiết nhất.
`;

    const response = await generateContentWithFallback(
      userApiKey,
      requestedModel,
      promptText,
      "Bạn là một Trợ lý AI thiết kế giáo án chuyên nghiệp hàng đầu tại Việt Nam. Bạn luôn tuân thủ cấu trúc giáo án theo CTGDPT 2018 và tích hợp khéo léo công nghệ số, năng lực số và AI vào bài giảng một cách thực tế.",
      lessonPlanSchema
    );

    const resultText = response.text || "{}";
    res.json(JSON.parse(resultText));
  } catch (error: any) {
    console.error("Error generating lesson plan:", error);
    res.status(500).json({ error: error.message || "An error occurred while generating the lesson plan." });
  }
});

// 4. Gemini Curriculum Generation Proxy
app.post("/api/generate-curriculum", async (req, res) => {
  try {
    const { subject, grade, bookSeries, periodsPerYear, weeks, semester, mode } = req.body;
    
    // Retrieve credentials from headers or body
    const userApiKey = req.headers["x-gemini-key"] as string;
    const requestedModel = req.headers["x-gemini-model"] as string;

    let semesterPrompt = "";
    if (mode === "all_year") {
      semesterPrompt = `Lập phân phối chương trình cho CẢ NĂM HỌC (${weeks} tuần, tổng cộng ${periodsPerYear} tiết).`;
    } else if (mode === "semester_1") {
      semesterPrompt = `Lập phân phối chương trình cho HỌC KỲ I (${weeks} tuần, tương đương khoảng một nửa số tiết trong cả năm).`;
    } else {
      semesterPrompt = `Lập phân phối chương trình cho HỌC KỲ II (${weeks} tuần, tương đương khoảng một nửa số tiết trong cả năm).`;
    }

    const promptText = `
Bạn là chuyên gia xây dựng Phân phối chương trình (Syllabus/Curriculum Distribution) cho các trường phổ thông tại Việt Nam theo CTGDPT 2018.
Hãy tạo một phân phối chương trình môn học chi tiết bằng tiếng Việt dựa trên các thông số sau:

THÔNG TIN MÔN HỌC & CHƯƠNG TRÌNH:
- Môn học: ${subject}
- Khối lớp: ${grade}
- Bộ sách: ${bookSeries}
- Tổng số tiết cả năm: ${periodsPerYear} tiết
- Số tuần thực hiện: ${weeks} tuần
- Kỳ học thực hiện: ${semester} (Chế độ soạn: ${mode})

YÊU CẦU CHI TIẾT:
Lập một bản kế hoạch dạy học gồm 5 bảng biểu chi tiết sau (trả về dưới dạng JSON khớp với responseSchema):
1. 'bangPhanPhoi' (Bảng phân phối): Mảng các dòng chứa 'tuan' (Tuần 1, Tuần 2,...), 'bai' (Tên bài học cụ thể theo thứ tự sư phạm của bộ sách), và 'tiet' (Tiết số bao nhiêu, ví dụ: "Tiết 1-2" hoặc "Tiết 5").
2. 'bangMucTieu' (Bảng mục tiêu): Mảng các dòng liên kết 'bai' với 'kienThuc' (Kiến thức trọng tâm cần đạt) và 'nangLuc' (Năng lực đặc thù phát triển).
3. 'bangNls' (Bảng tích hợp năng lực số): Mảng các dòng liên kết 'bai' với năng lực số (NLS) cụ thể được tích hợp trong bài đó.
4. 'bangAi' (Bảng tích hợp AI): Mảng các dòng liên kết 'bai' với ứng dụng/năng lực AI tương ứng trong bài giảng (nếu có).
5. 'bangHocLieu' (Bảng học liệu): Mảng các dòng liên kết 'bai' với các học liệu số, phần mềm, thiết bị dạy học trực quan sử dụng.

Hãy đảm bảo dữ liệu trải dài đủ ${weeks} tuần và tổng số tiết khớp hoặc xấp xỉ với số tiết yêu cầu. Các bài học phải có tên thực tế, phù hợp với môn học ${subject} lớp ${grade} của bộ sách ${bookSeries}. Nội dung viết phong phú, mang tính thực tiễn cao, đậm chất sư phạm.
`;

    const response = await generateContentWithFallback(
      userApiKey,
      requestedModel,
      promptText,
      "Bạn là một chuyên viên Sở Giáo dục chuyên lập phân phối chương trình dạy học mẫu chuẩn mực, khoa học và tích hợp chuyển đổi số mạnh mẽ.",
      curriculumSchema
    );

    const resultText = response.text || "{}";
    res.json(JSON.parse(resultText));
  } catch (error: any) {
    console.error("Error generating curriculum:", error);
    res.status(500).json({ error: error.message || "An error occurred while generating the curriculum." });
  }
});


// Vite Dev Server / Static Hosting configuration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production mode
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
