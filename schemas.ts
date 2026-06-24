export const lessonPlanSchema = {
  type: "OBJECT",
  properties: {
    phan1: {
      type: "OBJECT",
      properties: {
        monHoc: { type: "STRING" },
        lop: { type: "STRING" },
        tenBai: { type: "STRING" },
        thoiLuong: { type: "STRING" },
        boSach: { type: "STRING" }
      },
      required: ["monHoc", "lop", "tenBai", "thoiLuong", "boSach"]
    },
    phan2: {
      type: "OBJECT",
      properties: {
        kienThuc: { type: "ARRAY", items: { type: "STRING" } },
        nangLuc: { type: "ARRAY", items: { type: "STRING" } },
        phamChat: { type: "ARRAY", items: { type: "STRING" } },
        nangLucSo: { type: "ARRAY", items: { type: "STRING" } },
        nangLucAI: { type: "ARRAY", items: { type: "STRING" } }
      },
      required: ["kienThuc", "nangLuc", "phamChat"]
    },
    phan3: {
      type: "OBJECT",
      properties: {
        giaoVien: { type: "ARRAY", items: { type: "STRING" } },
        hocSinh: { type: "ARRAY", items: { type: "STRING" } }
      },
      required: ["giaoVien", "hocSinh"]
    },
    phan4: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          id: { type: "STRING" },
          name: { type: "STRING" },
          title: { type: "STRING" },
          mucTieu: { type: "STRING" },
          noiDung: { type: "STRING" },
          nhiemVuGv: { type: "STRING" },
          nhiemVuHs: { type: "STRING" },
          cachThucHien: { type: "STRING" },
          sanPham: { type: "STRING" },
          danhGia: { type: "STRING" },
          congCuSo: { type: "STRING" },
          nangLucSo: { type: "STRING" },
          nangLucAI: { type: "STRING" },
          baiTap: { type: "STRING" },
          dapAn: { type: "STRING" },
          tieuChiDanhGia: { type: "STRING" },
          nhiemVuThucTien: { type: "STRING" },
          hoatDongNhom: { type: "STRING" },
          sanPhamSo: { type: "STRING" }
        },
        required: ["id", "name", "title", "mucTieu", "noiDung", "sanPham", "danhGia"]
      }
    },
    phan5: {
      type: "OBJECT",
      properties: {
        danhGiaThuongXuyen: { type: "ARRAY", items: { type: "STRING" } },
        danhGiaSanPham: { type: "STRING" }
      },
      required: ["danhGiaThuongXuyen", "danhGiaSanPham"]
    },
    phan6: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          hoatDong: { type: "STRING" },
          congCu: { type: "STRING" },
          nangLucSo: { type: "STRING" }
        },
        required: ["hoatDong", "congCu", "nangLucSo"]
      }
    },
    phan7: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          hoatDong: { type: "STRING" },
          congCuAI: { type: "STRING" },
          nangLucAI: { type: "STRING" }
        },
        required: ["hoatDong", "congCuAI", "nangLucAI"]
      }
    },
    phan8: {
      type: "OBJECT",
      properties: {
        phieuHocTap: { type: "STRING" },
        linkHocLieu: { type: "ARRAY", items: { type: "STRING" } },
        promptAI: { type: "STRING" },
        mauSanPham: { type: "STRING" },
        taiLieuThamKhao: { type: "ARRAY", items: { type: "STRING" } }
      },
      required: ["phieuHocTap", "linkHocLieu", "promptAI", "mauSanPham", "taiLieuThamKhao"]
    }
  },
  required: ["phan1", "phan2", "phan3", "phan4", "phan5", "phan8"]
};

export const curriculumSchema = {
  type: "OBJECT",
  properties: {
    bangPhanPhoi: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          tuan: { type: "STRING" },
          bai: { type: "STRING" },
          tiet: { type: "STRING" }
        },
        required: ["tuan", "bai", "tiet"]
      }
    },
    bangMucTieu: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          bai: { type: "STRING" },
          kienThuc: { type: "STRING" },
          nangLuc: { type: "STRING" }
        },
        required: ["bai", "kienThuc", "nangLuc"]
      }
    },
    bangNls: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          bai: { type: "STRING" },
          nls: { type: "STRING" }
        },
        required: ["bai", "nls"]
      }
    },
    bangAi: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          bai: { type: "STRING" },
          ai: { type: "STRING" }
        },
        required: ["bai", "ai"]
      }
    },
    bangHocLieu: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          bai: { type: "STRING" },
          hocLieu: { type: "STRING" }
        },
        required: ["bai", "hocLieu"]
      }
    }
  },
  required: ["bangPhanPhoi", "bangMucTieu", "bangHocLieu"]
};
