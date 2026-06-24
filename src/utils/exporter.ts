import { LessonPlanResult, CurriculumResult } from "../types";

// Declare global library references loaded via CDN scripts in index.html
declare const docx: any;
declare const PptxGenJS: any;

/**
 * Helper to download a string as a file in the browser (for fallbacks and CSVs)
 */
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * EXPORT LESSON PLAN TO WORD (.docx / fallback .doc)
 */
export function exportLessonPlanToWord(lp: LessonPlanResult) {
  const title = lp.phan1.tenBai || "Giao_an_AI";
  
  // If the docx library is not available, use the styled HTML fallback
  if (typeof docx === "undefined") {
    console.warn("docx library not loaded, using HTML fallback.");
    exportLessonPlanToWordHTML(lp);
    return;
  }

  try {
    const {
      Document,
      Paragraph,
      TextRun,
      Table,
      TableRow,
      TableCell,
      WidthType,
      BorderStyle,
      AlignmentType,
      HeadingLevel,
      Packer
    } = docx;

    const createBoldRun = (text: string) => new TextRun({ text, bold: true });
    const createRun = (text: string) => new TextRun({ text });

    // Table cell border styling helper
    const cellBorders = {
      top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
      left: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
      right: { style: BorderStyle.SINGLE, size: 4, color: "000000" }
    };

    // Build the DOCX layout
    const doc = new Document({
      styles: {
        default: {
          document: {
            run: {
              font: "Times New Roman",
              size: 26 // 13pt
            }
          }
        }
      },
      sections: [{
        properties: {
          page: {
            margin: {
              top: 1134,    // 2.0 cm
              bottom: 1134, // 2.0 cm
              left: 1701,   // 3.0 cm
              right: 850    // 1.5 cm
            }
          }
        },
        children: [
          // Header Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              insideHorizontal: { style: BorderStyle.NONE },
              insideVertical: { style: BorderStyle.NONE }
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [
                          createBoldRun(`BỘ SÁCH: ${lp.phan1.boSach.toUpperCase()}`),
                          new TextRun({ text: "\nTRƯỜNG: ......................................." })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          createBoldRun("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM"),
                          new TextRun({ text: "\nĐộc lập - Tự do - Hạnh phúc", italics: true })
                        ]
                      })
                    ]
                  })
                ]
              })
            ]
          }),

          new Paragraph({ text: "\n", spacing: { after: 120 } }),

          // Main Title
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "KẾ HOẠCH BÀI DẠY", bold: true, size: 32 }),
              new TextRun({ text: `\nTÊN BÀI HỌC: ${lp.phan1.tenBai.toUpperCase()}`, bold: true, size: 28 }),
              new TextRun({ text: `\nMôn học: ${lp.phan1.monHoc} - Khối lớp: ${lp.phan1.lop}`, italics: true }),
              new TextRun({ text: `\nThời lượng: ${lp.phan1.thoiLuong}`, italics: true })
            ],
            spacing: { after: 360 }
          }),

          // Section 1: General Info
          new Paragraph({
            children: [new TextRun({ text: "PHẦN 1: THÔNG TIN CHUNG", bold: true, size: 28 })],
            spacing: { before: 240, after: 120 }
          }),
          new Paragraph({ children: [createBoldRun("Môn học: "), createRun(lp.phan1.monHoc)] }),
          new Paragraph({ children: [createBoldRun("Khối lớp: "), createRun(lp.phan1.lop)] }),
          new Paragraph({ children: [createBoldRun("Tên bài học: "), createRun(lp.phan1.tenBai)] }),
          new Paragraph({ children: [createBoldRun("Thời lượng: "), createRun(lp.phan1.thoiLuong)] }),
          new Paragraph({ children: [createBoldRun("Bộ sách giáo khoa: "), createRun(lp.phan1.boSach)] }),

          // Section 2: Goals
          new Paragraph({
            children: [new TextRun({ text: "PHẦN 2: MỤC TIÊU BÀI HỌC", bold: true, size: 28 })],
            spacing: { before: 240, after: 120 }
          }),
          new Paragraph({ children: [createBoldRun("1. Kiến thức cần đạt:")], spacing: { before: 120 } }),
          ...lp.phan2.kienThuc.map(k => new Paragraph({ children: [createRun(`- ${k}`)] })),
          
          new Paragraph({ children: [createBoldRun("2. Năng lực cần bồi dưỡng:")], spacing: { before: 120 } }),
          ...lp.phan2.nangLuc.map(n => new Paragraph({ children: [createRun(`- ${n}`)] })),
          
          new Paragraph({ children: [createBoldRun("3. Phẩm chất chủ yếu:")], spacing: { before: 120 } }),
          ...lp.phan2.phamChat.map(p => new Paragraph({ children: [createRun(`- ${p}`)] })),

          ...(lp.phan2.nangLucSo ? [
            new Paragraph({ children: [createBoldRun("4. Năng lực số tích hợp:")], spacing: { before: 120 } }),
            ...lp.phan2.nangLucSo.map(nls => new Paragraph({ children: [createRun(`- ${nls}`)] }))
          ] : []),

          ...(lp.phan2.nangLucAI ? [
            new Paragraph({ children: [createBoldRun("5. Năng lực Trí tuệ nhân tạo (AI):")], spacing: { before: 120 } }),
            ...lp.phan2.nangLucAI.map(nlai => new Paragraph({ children: [createRun(`- ${nlai}`)] }))
          ] : []),

          // Section 3: Equipment
          new Paragraph({
            children: [new TextRun({ text: "PHẦN 3: THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU", bold: true, size: 28 })],
            spacing: { before: 240, after: 120 }
          }),
          new Paragraph({ children: [createBoldRun("1. Thiết bị, học liệu của Giáo viên:")], spacing: { before: 120 } }),
          ...lp.phan3.giaoVien.map(gv => new Paragraph({ children: [createRun(`- ${gv}`)] })),
          
          new Paragraph({ children: [createBoldRun("2. Thiết bị, học liệu của Học sinh:")], spacing: { before: 120 } }),
          ...lp.phan3.hocSinh.map(hs => new Paragraph({ children: [createRun(`- ${hs}`)] })),

          // Section 4: Activities
          new Paragraph({
            children: [new TextRun({ text: "PHẦN 4: TIẾN TRÌNH DẠY HỌC (CHUỖI HOẠT ĐỘNG)", bold: true, size: 28 })],
            spacing: { before: 240, after: 120 }
          }),
          ...lp.phan4.flatMap((act, idx) => [
            new Paragraph({
              children: [new TextRun({ text: `HOẠT ĐỘNG ${idx + 1}: ${act.title || act.name}`, bold: true, color: "1E293B" })],
              spacing: { before: 180, after: 60 }
            }),
            new Paragraph({ children: [createBoldRun("a) Mục tiêu: "), createRun(act.mucTieu)] }),
            new Paragraph({ children: [createBoldRun("b) Nội dung: "), createRun(act.noiDung)] }),
            ...(act.nhiemVuGv ? [new Paragraph({ children: [createBoldRun("c) Nhiệm vụ Giáo viên: "), createRun(act.nhiemVuGv)] })] : []),
            ...(act.nhiemVuHs ? [new Paragraph({ children: [createBoldRun("d) Nhiệm vụ Học sinh: "), createRun(act.nhiemVuHs)] })] : []),
            ...(act.cachThucHien ? [new Paragraph({ children: [createBoldRun("e) Tổ chức thực hiện: "), createRun(act.cachThucHien)] })] : []),
            new Paragraph({ children: [createBoldRun("f) Sản phẩm: "), createRun(act.sanPham)] }),
            new Paragraph({ children: [createBoldRun("g) Đánh giá: "), createRun(act.danhGia)] }),
            ...(act.congCuSo ? [new Paragraph({ children: [createBoldRun("h) Công cụ số: "), createRun(act.congCuSo)] })] : []),
            ...(act.nangLucSo ? [new Paragraph({ children: [createBoldRun("i) Năng lực số: "), createRun(act.nangLucSo)] })] : []),
            ...(act.nangLucAI ? [new Paragraph({ children: [createBoldRun("j) Năng lực AI: "), createRun(act.nangLucAI)] })] : []),
            ...(act.baiTap ? [new Paragraph({ children: [createBoldRun("Bài tập áp dụng: "), createRun(act.baiTap)] })] : []),
            ...(act.dapAn ? [new Paragraph({ children: [createBoldRun("Đáp án gợi ý: "), createRun(act.dapAn)] })] : [])
          ]),

          // Section 5: Assessment
          new Paragraph({
            children: [new TextRun({ text: "PHẦN 5: KIỂM TRA ĐÁNH GIÁ CHUNG", bold: true, size: 28 })],
            spacing: { before: 240, after: 120 }
          }),
          new Paragraph({ children: [createBoldRun("1. Phương pháp đánh giá thường xuyên:")], spacing: { before: 120 } }),
          ...lp.phan5.danhGiaThuongXuyen.map(tx => new Paragraph({ children: [createRun(`- ${tx}`)] })),
          
          new Paragraph({ children: [createBoldRun("2. Rubric tiêu chí đánh giá sản phẩm học tập:")], spacing: { before: 120 } }),
          ...lp.phan5.danhGiaSanPham.split("\n").map(line => new Paragraph({ children: [createRun(line)] })),

          // Section 6: Digital Integration Table
          ...(lp.phan6 && lp.phan6.length > 0 ? [
            new Paragraph({
              children: [new TextRun({ text: "PHẦN 6: BẢNG TÍCH HỢP NĂNG LỰC SỐ", bold: true, size: 28 })],
              spacing: { before: 240, after: 120 }
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [createBoldRun("Hoạt động")] })] }),
                    new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [createBoldRun("Công cụ số")] })] }),
                    new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [createBoldRun("Năng lực số tích hợp")] })] })
                  ]
                }),
                ...lp.phan6.map(row => new TableRow({
                  children: [
                    new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [createRun(row.hoatDong)] })] }),
                    new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [createRun(row.congCu)] })] }),
                    new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [createRun(row.nangLucSo)] })] })
                  ]
                }))
              ]
            })
          ] : []),

          // Section 7: AI Integration Table
          ...(lp.phan7 && lp.phan7.length > 0 ? [
            new Paragraph({
              children: [new TextRun({ text: "PHẦN 7: BẢNG TÍCH HỢP TRÍ TUỆ NHÂN TẠO (AI)", bold: true, size: 28 })],
              spacing: { before: 240, after: 120 }
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [createBoldRun("Hoạt động")] })] }),
                    new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [createBoldRun("Công cụ AI đề xuất")] })] }),
                    new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [createBoldRun("Năng lực AI bồi dưỡng")] })] })
                  ]
                }),
                ...lp.phan7.map(row => new TableRow({
                  children: [
                    new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [createRun(row.hoatDong)] })] }),
                    new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [createRun(row.congCuAI)] })] }),
                    new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [createRun(row.nangLucAI)] })] })
                  ]
                }))
              ]
            })
          ] : []),

          // Section 8: Appendix
          new Paragraph({
            children: [new TextRun({ text: "PHẦN 8: PHỤ LỤC TÀI LIỆU DẠY HỌC", bold: true, size: 28 })],
            spacing: { before: 240, after: 120 }
          }),
          new Paragraph({ children: [createBoldRun("1. Phiếu học tập dành cho học sinh:")], spacing: { before: 120 } }),
          ...lp.phan8.phieuHocTap.split("\n").map(line => new Paragraph({ children: [createRun(line)] })),

          new Paragraph({ children: [createBoldRun("2. Nguồn liên kết học liệu ảo:")], spacing: { before: 120 } }),
          ...lp.phan8.linkHocLieu.map(link => new Paragraph({ children: [createRun(link)] })),

          new Paragraph({ children: [createBoldRun("3. Prompt AI đề xuất cho giáo viên:")], spacing: { before: 120 } }),
          new Paragraph({ children: [new TextRun({ text: lp.phan8.promptAI, font: "Courier New", size: 22 })] }),

          new Paragraph({ children: [createBoldRun("4. Mô tả mẫu sản phẩm học sinh đạt yêu cầu:")], spacing: { before: 120 } }),
          ...lp.phan8.mauSanPham.split("\n").map(line => new Paragraph({ children: [createRun(line)] })),

          new Paragraph({ children: [createBoldRun("5. Sách giáo khoa & Tài liệu tham khảo:")], spacing: { before: 120 } }),
          ...lp.phan8.taiLieuThamKhao.map(ref => new Paragraph({ children: [createRun(ref)] })),

          new Paragraph({ text: "\n\n", spacing: { before: 480 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              insideHorizontal: { style: BorderStyle.NONE },
              insideVertical: { style: BorderStyle.NONE }
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, children: [] }),
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({ text: "Giáo viên soạn thảo\n\n\n\n\n___________________________", bold: true, italics: true })
                        ]
                      })
                    ]
                  })
                ]
              })
            ]
          })
        ]
      }]
    });

    Packer.toBlob(doc).then((blob: Blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${title.replace(/\s+/g, "_")}_CTGDPT_2018.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });

  } catch (error) {
    console.error("Lỗi khi tạo DOCX nguyên bản, chuyển sang HTML fallback:", error);
    exportLessonPlanToWordHTML(lp);
  }
}

/**
 * EXPORT CURRICULUM TO WORD (.docx / fallback .doc)
 */
export function exportCurriculumToWord(cur: CurriculumResult, title: string) {
  if (typeof docx === "undefined") {
    console.warn("docx library not loaded, using HTML fallback.");
    exportCurriculumToWordHTML(cur, title);
    return;
  }

  try {
    const {
      Document,
      Paragraph,
      TextRun,
      Table,
      TableRow,
      TableCell,
      WidthType,
      BorderStyle,
      AlignmentType,
      Packer
    } = docx;

    const createBoldRun = (text: string) => new TextRun({ text, bold: true });
    const createRun = (text: string) => new TextRun({ text });

    const cellBorders = {
      top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
      left: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
      right: { style: BorderStyle.SINGLE, size: 4, color: "000000" }
    };

    const doc = new Document({
      styles: {
        default: {
          document: {
            run: {
              font: "Times New Roman",
              size: 24 // 12pt
            }
          }
        }
      },
      sections: [{
        properties: {
          page: {
            margin: {
              top: 1134,
              bottom: 1134,
              left: 1701,
              right: 850
            }
          }
        },
        children: [
          // Main Title
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: title.toUpperCase(), bold: true, size: 28 })
            ],
            spacing: { after: 240 }
          }),

          // 1. Distribution Table
          new Paragraph({
            children: [new TextRun({ text: "1. BẢNG PHÂN PHỐI CHƯƠNG TRÌNH CHI TIẾT", bold: true, size: 26 })],
            spacing: { before: 180, after: 120 }
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createBoldRun("Tuần")] })] }),
                  new TableCell({ width: { size: 70, type: WidthType.PERCENTAGE }, borders: cellBorders, children: [new Paragraph({ children: [createBoldRun("Bài học / Chuyên đề")] })] }),
                  new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createBoldRun("Số tiết")] })] })
                ]
              }),
              ...cur.bangPhanPhoi.map(row => new TableRow({
                children: [
                  new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createRun(row.tuan)] })] }),
                  new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [createRun(row.bai)] })] }),
                  new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createRun(row.tiet)] })] })
                ]
              }))
            ]
          }),

          // 2. Goals Table
          new Paragraph({
            children: [new TextRun({ text: "2. BẢNG MỤC TIÊU KIẾN THỨC VÀ NĂNG LỰC CẦN ĐẠT", bold: true, size: 26 })],
            spacing: { before: 240, after: 120 }
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, borders: cellBorders, children: [new Paragraph({ children: [createBoldRun("Tên bài học")] })] }),
                  new TableCell({ width: { size: 35, type: WidthType.PERCENTAGE }, borders: cellBorders, children: [new Paragraph({ children: [createBoldRun("Yêu cầu về kiến thức")] })] }),
                  new TableCell({ width: { size: 35, type: WidthType.PERCENTAGE }, borders: cellBorders, children: [new Paragraph({ children: [createBoldRun("Năng lực phát triển")] })] })
                ]
              }),
              ...cur.bangMucTieu.map(row => new TableRow({
                children: [
                  new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [createBoldRun(row.bai)] })] }),
                  new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [createRun(row.kienThuc)] })] }),
                  new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [createRun(row.nangLuc)] })] })
                ]
              }))
            ]
          }),

          // 3. Digital Competency integration table
          ...(cur.bangNls && cur.bangNls.length > 0 ? [
            new Paragraph({
              children: [new TextRun({ text: "3. BẢNG TÍCH HỢP NĂNG LỰC SỐ (NLS)", bold: true, size: 26 })],
              spacing: { before: 240, after: 120 }
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ width: { size: 35, type: WidthType.PERCENTAGE }, borders: cellBorders, children: [new Paragraph({ children: [createBoldRun("Tên bài học")] })] }),
                    new TableCell({ width: { size: 65, type: WidthType.PERCENTAGE }, borders: cellBorders, children: [new Paragraph({ children: [createBoldRun("Nội dung tích hợp Năng lực số")] })] })
                  ]
                }),
                ...cur.bangNls.map(row => new TableRow({
                  children: [
                    new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [createBoldRun(row.bai)] })] }),
                    new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [createRun(row.nls)] })] })
                  ]
                }))
              ]
            })
          ] : []),

          // 4. AI integration table
          ...(cur.bangAi && cur.bangAi.length > 0 ? [
            new Paragraph({
              children: [new TextRun({ text: "4. BẢNG TÍCH HỢP TRÍ TUỆ NHÂN TẠO (AI)", bold: true, size: 26 })],
              spacing: { before: 240, after: 120 }
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ width: { size: 35, type: WidthType.PERCENTAGE }, borders: cellBorders, children: [new Paragraph({ children: [createBoldRun("Tên bài học")] })] }),
                    new TableCell({ width: { size: 65, type: WidthType.PERCENTAGE }, borders: cellBorders, children: [new Paragraph({ children: [createBoldRun("Ứng dụng & Năng lực AI bồi dưỡng")] })] })
                  ]
                }),
                ...cur.bangAi.map(row => new TableRow({
                  children: [
                    new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [createBoldRun(row.bai)] })] }),
                    new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [createRun(row.ai)] })] })
                  ]
                }))
              ]
            })
          ] : []),

          // 5. Digital Resources
          new Paragraph({
            children: [new TextRun({ text: "5. BẢNG HỆ THỐNG HỌC LIỆU VÀ THIẾT BỊ DẠY HỌC", bold: true, size: 26 })],
            spacing: { before: 240, after: 120 }
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ width: { size: 35, type: WidthType.PERCENTAGE }, borders: cellBorders, children: [new Paragraph({ children: [createBoldRun("Tên bài học")] })] }),
                  new TableCell({ width: { size: 65, type: WidthType.PERCENTAGE }, borders: cellBorders, children: [new Paragraph({ children: [createBoldRun("Thiết bị, Link học liệu số, phần mềm")] })] })
                ]
              }),
              ...cur.bangHocLieu.map(row => new TableRow({
                children: [
                  new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [createBoldRun(row.bai)] })] }),
                  new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [createRun(row.hocLieu)] })] })
                ]
              }))
            ]
          }),

          new Paragraph({ text: "\n\n", spacing: { before: 360 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              insideHorizontal: { style: BorderStyle.NONE },
              insideVertical: { style: BorderStyle.NONE }
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, children: [] }),
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({ text: "Trưởng tổ chuyên môn duyệt\n\n\n\n\n___________________________", bold: true, italics: true })
                        ]
                      })
                    ]
                  })
                ]
              })
            ]
          })
        ]
      }]
    });

    Packer.toBlob(doc).then((blob: Blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${title.replace(/\s+/g, "_")}_Phan_Phoi_Chuong_Trinh.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });

  } catch (error) {
    console.error("Lỗi khi tạo DOCX PPCT, chuyển sang HTML fallback:", error);
    exportCurriculumToWordHTML(cur, title);
  }
}

/**
 * EXPORT LESSON PLAN TO POWERPOINT (.pptx) - Using PptxGenJS (loaded via CDN)
 */
export function exportLessonPlanToPowerPoint(lp: LessonPlanResult) {
  if (typeof PptxGenJS === "undefined") {
    alert("Thư viện slide PptxGenJS chưa được tải hoàn toàn. Vui lòng kết nối mạng và thử lại.");
    return;
  }

  try {
    const pptx = new PptxGenJS();
    
    // Set 16:9 widescreen layout
    pptx.layout = "LAYOUT_16x9";
    
    // 1. SLIDE 1: Title Slide
    let slide = pptx.addSlide();
    slide.background = { fill: "0F172A" }; // Dark charcoal blue
    
    slide.addText(lp.phan1.tenBai.toUpperCase(), {
      x: 0.5,
      y: 1.0,
      w: 9.0,
      h: 1.6,
      fontSize: 28,
      bold: true,
      color: "F1F5F9",
      fontFace: "Arial",
      align: "center",
      margin: 10
    });

    slide.addText(`KẾ HOẠCH BÀI DẠY (CTGDPT 2018)\nMôn học: ${lp.phan1.monHoc} - Lớp: ${lp.phan1.lop}\nBộ sách: ${lp.phan1.boSach} - Thời lượng: ${lp.phan1.thoiLuong}`, {
      x: 0.5,
      y: 2.6,
      w: 9.0,
      h: 1.0,
      fontSize: 14,
      color: "94A3B8",
      fontFace: "Arial",
      align: "center"
    });

    // 2. SLIDE 2: Objectives
    slide = pptx.addSlide();
    slide.background = { fill: "F8FAFC" };
    
    slide.addText("MỤC TIÊU BÀI HỌC", {
      x: 0.5,
      y: 0.3,
      w: 9.0,
      h: 0.5,
      fontSize: 20,
      bold: true,
      color: "0F172A",
      fontFace: "Arial"
    });

    const objRuns = [];
    objRuns.push({ text: "🎯 Kiến thức:\n", options: { bold: true, color: "4F46E5", fontSize: 13 } });
    lp.phan2.kienThuc.slice(0, 3).forEach(k => {
      objRuns.push({ text: `• ${k}\n`, options: { fontSize: 11, color: "334155" } });
    });
    
    objRuns.push({ text: "\n🚀 Năng lực bồi dưỡng:\n", options: { bold: true, color: "06B6D4", fontSize: 13 } });
    lp.phan2.nangLuc.slice(0, 3).forEach(n => {
      objRuns.push({ text: `• ${n}\n`, options: { fontSize: 11, color: "334155" } });
    });

    objRuns.push({ text: "\n✨ Phẩm chất chủ yếu:\n", options: { bold: true, color: "F59E0B", fontSize: 13 } });
    lp.phan2.phamChat.slice(0, 2).forEach(p => {
      objRuns.push({ text: `• ${p}\n`, options: { fontSize: 11, color: "334155" } });
    });

    slide.addText(objRuns, {
      x: 0.5,
      y: 0.9,
      w: 9.0,
      h: 2.8,
      fontFace: "Arial"
    });

    // 3. SLIDES 3-6: Activities (Warm-up, Exploration, Practice, Application)
    lp.phan4.forEach((act, index) => {
      slide = pptx.addSlide();
      slide.background = { fill: "FFFFFF" };
      
      // Activity Title
      slide.addText(`HOẠT ĐỘNG ${index + 1}: ${act.title || act.name}`, {
        x: 0.5,
        y: 0.3,
        w: 9.0,
        h: 0.5,
        fontSize: 18,
        bold: true,
        color: "4F46E5",
        fontFace: "Arial"
      });

      // Left Column (Goal & Content)
      const leftColText = [
        { text: "🎯 Mục tiêu hoạt động:\n", options: { bold: true, color: "1E293B", fontSize: 12 } },
        { text: `${act.mucTieu}\n\n`, options: { fontSize: 10, color: "475569" } },
        { text: "📖 Nội dung học tập:\n", options: { bold: true, color: "1E293B", fontSize: 12 } },
        { text: `${act.noiDung}`, options: { fontSize: 10, color: "475569" } }
      ];
      slide.addText(leftColText, {
        x: 0.5,
        y: 0.9,
        w: 4.3,
        h: 2.8,
        fontFace: "Arial"
      });

      // Right Column (Product & Method & Technology)
      const rightColText = [
        { text: "📦 Sản phẩm học sinh:\n", options: { bold: true, color: "1E293B", fontSize: 12 } },
        { text: `${act.sanPham}\n\n`, options: { fontSize: 10, color: "475569" } },
        { text: "🔍 Kiểm tra đánh giá:\n", options: { bold: true, color: "1E293B", fontSize: 12 } },
        { text: `${act.danhGia}`, options: { fontSize: 10, color: "475569" } }
      ];

      // Add integrations if available
      if (act.congCuSo) {
        rightColText.push({ text: `\n\n💻 Công cụ số: ${act.congCuSo}`, options: { fontSize: 10, color: "06B6D4", bold: true } });
      }
      if (act.nangLucAI) {
        rightColText.push({ text: `\n🤖 Năng lực AI: ${act.nangLucAI}`, options: { fontSize: 10, color: "8B5CF6", bold: true } });
      }

      slide.addText(rightColText, {
        x: 5.1,
        y: 0.9,
        w: 4.4,
        h: 2.8,
        fontFace: "Arial"
      });
    });

    // 4. SLIDE 7: Homework & Appendix
    slide = pptx.addSlide();
    slide.background = { fill: "F8FAFC" };
    
    slide.addText("PHỤ LỤC & HƯỚNG DẪN TỰ HỌC", {
      x: 0.5,
      y: 0.3,
      w: 9.0,
      h: 0.5,
      fontSize: 20,
      bold: true,
      color: "0F172A",
      fontFace: "Arial"
    });

    const appRuns = [];
    appRuns.push({ text: "📋 Phiếu học tập:\n", options: { bold: true, color: "1E293B", fontSize: 12 } });
    appRuns.push({ text: `${lp.phan8.phieuHocTap.substring(0, 180)}...\n\n`, options: { fontSize: 10, color: "475569" } });
    
    appRuns.push({ text: "💡 Prompt AI đề xuất:\n", options: { bold: true, color: "1E293B", fontSize: 12 } });
    appRuns.push({ text: `${lp.phan8.promptAI}\n\n`, options: { fontSize: 9, color: "64748B", fontFace: "Courier New" } });

    appRuns.push({ text: "🔗 Liên kết học liệu ảo:\n", options: { bold: true, color: "1E293B", fontSize: 12 } });
    lp.phan8.linkHocLieu.slice(0, 2).forEach(link => {
      appRuns.push({ text: `• ${link}\n`, options: { fontSize: 10, color: "2563EB" } });
    });

    slide.addText(appRuns, {
      x: 0.5,
      y: 0.9,
      w: 9.0,
      h: 2.8,
      fontFace: "Arial"
    });

    // Export to slide presentation file
    const titleClean = lp.phan1.tenBai.replace(/\s+/g, "_");
    pptx.writeFile({ fileName: `${titleClean}_Slides.pptx` });

  } catch (err) {
    console.error("Lỗi khi tạo file PowerPoint:", err);
    alert("Đã xảy ra lỗi khi tạo slide trình chiếu.");
  }
}

/**
 * EXPORT CURRICULUM TO EXCEL (CSV Format)
 */
export function exportCurriculumToExcel(cur: CurriculumResult, title: string) {
  const filename = `${title.replace(/\s+/g, "_")}_Du_Lieu.csv`;
  
  // Create CSV Content with UTF-8 BOM so Excel opens Vietnamese characters correctly
  let csvContent = "\uFEFF";
  
  // Table 1: Phân phối chương trình chi tiết
  csvContent += "BẢNG 1: PHÂN PHỐI CHƯƠNG TRÌNH CHI TIẾT\n";
  csvContent += "Tuần,Bài học / Chuyên đề,Số tiết\n";
  cur.bangPhanPhoi.forEach(row => {
    csvContent += `"${row.tuan.replace(/"/g, '""')}","${row.bai.replace(/"/g, '""')}","${row.tiet.replace(/"/g, '""')}"\n`;
  });
  
  csvContent += "\n\n";

  // Table 2: Mục tiêu bài học
  csvContent += "BẢNG 2: MỤC TIÊU KIẾN THỨC VÀ NĂNG LỰC CẦN ĐẠT\n";
  csvContent += "Tên bài học,Yêu cầu kiến thức cần đạt,Định hướng phát triển năng lực\n";
  cur.bangMucTieu.forEach(row => {
    csvContent += `"${row.bai.replace(/"/g, '""')}","${row.kienThuc.replace(/"/g, '""')}","${row.nangLuc.replace(/"/g, '""')}"\n`;
  });

  csvContent += "\n\n";

  // Table 3: Năng lực số
  if (cur.bangNls && cur.bangNls.length > 0) {
    csvContent += "BẢNG 3: BẢNG TÍCH HỢP NĂNG LỰC SỐ (NLS)\n";
    csvContent += "Tên bài học,Nội dung tích hợp Năng lực số\n";
    cur.bangNls.forEach(row => {
      csvContent += `"${row.bai.replace(/"/g, '""')}","${row.nls.replace(/"/g, '""')}"\n`;
    });
    csvContent += "\n\n";
  }

  // Table 4: AI
  if (cur.bangAi && cur.bangAi.length > 0) {
    csvContent += "BẢNG 4: BẢNG TÍCH HỢP TRÍ TUỆ NHÂN TẠO (AI)\n";
    csvContent += "Tên bài học,Ứng dụng và năng lực AI cần bồi dưỡng\n";
    cur.bangAi.forEach(row => {
      csvContent += `"${row.bai.replace(/"/g, '""')}","${row.ai.replace(/"/g, '""')}"\n`;
    });
    csvContent += "\n\n";
  }

  // Table 5: Học liệu
  csvContent += "BẢNG 5: BẢNG HỆ THỐNG HỌC LIỆU VÀ THIẾT BỊ DẠY HỌC\n";
  csvContent += "Tên bài học,Thiết bị dạy học và Link học liệu số\n";
  cur.bangHocLieu.forEach(row => {
    csvContent += `"${row.bai.replace(/"/g, '""')}","${row.hocLieu.replace(/"/g, '""')}"\n`;
  });

  downloadFile(csvContent, filename, "text/csv;charset=utf-8");
}


/* ==================== FALLBACK HTML TO WORD EXPORTERS ==================== */

function exportLessonPlanToWordHTML(lp: LessonPlanResult) {
  const title = lp.phan1.tenBai || "Giao_an_AI";
  const filename = `${title.replace(/\s+/g, "_")}_CTGDPT_2018.doc`;

  let html = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <title>${lp.phan1.tenBai}</title>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.5; margin: 1in; }
        h1 { font-size: 16pt; text-align: center; text-transform: uppercase; margin-bottom: 20px; }
        h2 { font-size: 14pt; text-transform: uppercase; margin-top: 25px; border-bottom: 1.5px solid #000; padding-bottom: 3px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { border: 1px solid #000; padding: 8px; font-size: 12pt; vertical-align: top; }
        th { background-color: #f2f2f2; font-weight: bold; text-align: center; }
      </style>
    </head>
    <body>
      <h1>KẾ HOẠCH BÀI DẠY</h1>
      <p style="text-align: center; font-weight: bold;">TÊN BÀI HỌC: ${lp.phan1.tenBai.toUpperCase()}</p>
      <h2>PHẦN 1: THÔNG TIN BÀI DẠY</h2>
      <p><b>Môn học:</b> ${lp.phan1.monHoc} | <b>Khối lớp:</b> ${lp.phan1.lop}</p>
      <p><b>Bộ sách:</b> ${lp.phan1.boSach} | <b>Thời lượng:</b> ${lp.phan1.thoiLuong}</p>
      
      <h2>PHẦN 2: MỤC TIÊU BÀI HỌC</h2>
      <p><b>1. Kiến thức:</b></p>
      <ul>${lp.phan2.kienThuc.map(k => `<li>${k}</li>`).join("")}</ul>
      <p><b>2. Năng lực:</b></p>
      <ul>${lp.phan2.nangLuc.map(n => `<li>${n}</li>`).join("")}</ul>
      <p><b>3. Phẩm chất:</b></p>
      <ul>${lp.phan2.phamChat.map(p => `<li>${p}</li>`).join("")}</ul>
      
      <h2>PHẦN 3: THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU</h2>
      <p><b>1. Giáo viên:</b></p>
      <ul>${lp.phan3.giaoVien.map(gv => `<li>${gv}</li>`).join("")}</ul>
      <p><b>2. Học sinh:</b></p>
      <ul>${lp.phan3.hocSinh.map(hs => `<li>${hs}</li>`).join("")}</ul>

      <h2>PHẦN 4: TIẾN TRÌNH DẠY HỌC CHỦ CHỐT</h2>
      ${lp.phan4.map((act, index) => `
        <div style="border: 1px solid #000; padding: 10px; margin-bottom: 15px;">
          <p><b>HOẠT ĐỘNG ${index + 1}: ${act.title || act.name}</b></p>
          <p><b>a) Mục tiêu:</b> ${act.mucTieu}</p>
          <p><b>b) Nội dung:</b> ${act.noiDung}</p>
          <p><b>f) Sản phẩm:</b> ${act.sanPham}</p>
          <p><b>g) Đánh giá:</b> ${act.danhGia}</p>
        </div>
      `).join("")}
    </body>
    </html>
  `;
  downloadFile(html, filename, "application/msword;charset=utf-8");
}

function exportCurriculumToWordHTML(cur: CurriculumResult, title: string) {
  const filename = `${title.replace(/\s+/g, "_")}_Phan_Phoi_Chuong_Trinh.doc`;

  let html = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <title>${title}</title>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.5; margin: 1in; }
        h1 { font-size: 16pt; text-align: center; text-transform: uppercase; margin-bottom: 25px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { border: 1px solid #000; padding: 8px; font-size: 11pt; vertical-align: top; }
        th { background-color: #f2f2f2; font-weight: bold; text-align: center; }
      </style>
    </head>
    <body>
      <h1>${title.toUpperCase()}</h1>
      <h2>1. BẢNG PHÂN PHỐI CHƯƠNG TRÌNH CHI TIẾT</h2>
      <table>
        <thead>
          <tr><th>Tuần</th><th>Bài học</th><th>Số tiết</th></tr>
        </thead>
        <tbody>
          ${cur.bangPhanPhoi.map(row => `
            <tr><td>${row.tuan}</td><td>${row.bai}</td><td>${row.tiet}</td></tr>
          `).join("")}
        </tbody>
      </table>
    </body>
    </html>
  `;
  downloadFile(html, filename, "application/msword;charset=utf-8");
}
