import { lessonPlanSchema, curriculumSchema } from "./schemas";
import { TeacherInfo, LessonInfo, LessonOptions, LessonPlanResult, CurriculumInfo, CurriculumResult } from "../types";

export async function generateContentWithFallbackClient(
  apiKeys: string[],
  requestedModel: string,
  promptText: string,
  systemInstruction: string,
  responseSchema: any
): Promise<any> {
  const defaultModels = [
    "gemini-3-flash-preview",
    "gemini-3-pro-preview",
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-2.0-flash",
    "gemini-1.5-flash"
  ];

  // Deduplicate starting with requested model
  const modelsToTry = [requestedModel, ...defaultModels].filter(
    (model, idx, self) => model && model.trim() !== "" && self.indexOf(model) === idx
  );

  const apiKeysToTry = apiKeys.filter(Boolean);
  if (apiKeysToTry.length === 0) {
    throw new Error("Không có API Key nào được cấu hình. Vui lòng thiết lập API Key trong phần Cài đặt.");
  }

  let lastError: any = null;

  for (const model of modelsToTry) {
    for (let i = 0; i < apiKeysToTry.length; i++) {
      const apiKey = apiKeysToTry[i];
      try {
        console.log(`[Client AI] Đang thử model: ${model} với API Key thứ ${i + 1}/${apiKeysToTry.length}`);
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: promptText,
                  },
                ],
              },
            ],
            systemInstruction: {
              parts: [
                {
                  text: systemInstruction,
                },
              ],
            },
            generationConfig: {
              temperature: 0.2,
              responseMimeType: "application/json",
              responseSchema: responseSchema,
            },
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          const errMsg = errData.error?.message || `HTTP error ${response.status}`;
          throw new Error(errMsg);
        }

        const data = await response.json();
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!textResponse) {
          throw new Error("Không nhận được nội dung phản hồi từ mô hình AI.");
        }

        // Return parsed JSON
        const parsed = JSON.parse(textResponse);
        console.log(`[Client AI] Tạo thành công bằng model: ${model} và API Key thứ ${i + 1}`);
        return parsed;
      } catch (error: any) {
        const errorMsg = (error.message || "").toLowerCase();
        console.error(`[Client AI] Thất bại model ${model} với API Key thứ ${i + 1}:`, error.message || error);
        lastError = error;

        // Skip to next key if key is invalid
        if (
          errorMsg.includes("api_key_invalid") ||
          errorMsg.includes("invalid api key") ||
          errorMsg.includes("api key not found") ||
          errorMsg.includes("api key")
        ) {
          console.warn(`[Client AI] API Key thứ ${i + 1} không hợp lệ, bỏ qua...`);
          continue;
        }

        // Rotate key if rate-limited or quota exceeded
        if (
          errorMsg.includes("429") ||
          errorMsg.includes("quota") ||
          errorMsg.includes("exhausted") ||
          errorMsg.includes("rate limit") ||
          errorMsg.includes("limit")
        ) {
          console.warn(`[Client AI] API Key thứ ${i + 1} đạt giới hạn lượt dùng/quota, xoay sang key kế tiếp...`);
          continue;
        }
      }
    }
  }

  throw lastError || new Error("Tất cả các API Keys và mô hình AI đều thất bại khi xử lý yêu cầu.");
}

export async function generateLessonPlanClient(
  apiKeys: string[],
  model: string,
  teacherInfo: TeacherInfo,
  lessonInfo: LessonInfo,
  lessonOptions: LessonOptions,
  sampleTemplate?: string,
  sampleRequirements?: string
): Promise<LessonPlanResult> {
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

  return await generateContentWithFallbackClient(
    apiKeys,
    model,
    promptText,
    "Bạn là một Trợ lý AI thiết kế giáo án chuyên nghiệp hàng đầu tại Việt Nam. Bạn luôn tuân thủ cấu trúc giáo án theo CTGDPT 2018 và tích hợp khéo léo công nghệ số, năng lực số và AI vào bài giảng một cách thực tế.",
    lessonPlanSchema
  );
}

export async function generateCurriculumClient(
  apiKeys: string[],
  model: string,
  curriculumInfo: CurriculumInfo
): Promise<CurriculumResult> {
  const { subject, grade, bookSeries, periodsPerYear, weeks, semester, mode } = curriculumInfo;

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

  return await generateContentWithFallbackClient(
    apiKeys,
    model,
    promptText,
    "Bạn là một chuyên viên Sở Giáo dục chuyên lập phân phối chương trình dạy học mẫu chuẩn mực, khoa học và tích hợp chuyển đổi số mạnh mẽ.",
    curriculumSchema
  );
}
