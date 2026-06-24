import React from "react";
import { Phone, Globe, Cpu, Palette, BookOpen, Layers, Award, Sparkles } from "lucide-react";

export default function AdFooter() {
  return (
    <footer className="mt-12 border border-violet-100 bg-gradient-to-br from-violet-50/50 via-white to-fuchsia-50/30 rounded-2xl p-6 md:p-8 shadow-sm">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        
        {/* Left column: Brand Identity */}
        <div className="flex-1 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-100/60 text-violet-700 text-xs font-semibold rounded-full uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-violet-600 animate-pulse" />
            Tiên phong Công nghệ Giáo dục
          </div>
          <h3 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
            💖 MARIS SLIDE
          </h3>
          <p className="text-gray-600 text-sm max-w-lg leading-relaxed">
            Chuyên trang hàng đầu về đào tạo và chuyển đổi số cho giáo viên Việt Nam. Chúng tôi cung cấp các chương trình đào tạo chuyên sâu giúp nâng tầm bài giảng của bạn với công nghệ hiện đại.
          </p>
          
          <div className="flex flex-wrap gap-4 pt-2">
            <a 
              href="tel:0396581283" 
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:border-violet-300 hover:text-violet-700 text-gray-700 text-sm font-medium rounded-xl transition shadow-sm"
            >
              <Phone className="w-4 h-4 text-emerald-500" />
              Zalo: <span className="font-semibold text-gray-900">0396.581.283</span>
            </a>
            <a 
              href="https://marisslide.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition shadow-md shadow-violet-100"
            >
              <Globe className="w-4 h-4" />
              Ghé thăm Website
            </a>
          </div>
        </div>

        {/* Right column: Expertise Grid */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
          <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-gray-100 hover:shadow-sm transition">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 shrink-0">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 text-xs sm:text-sm">AI trong giáo dục</h4>
              <p className="text-xs text-gray-500">Ứng dụng ChatGPT, Gemini vào giảng dạy</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-gray-100 hover:shadow-sm transition">
            <div className="p-2 bg-fuchsia-50 rounded-lg text-fuchsia-600 shrink-0">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 text-xs sm:text-sm">Thiết kế E-Learning</h4>
              <p className="text-xs text-gray-500">Xây dựng bài giảng tương tác chuẩn quốc tế</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-gray-100 hover:shadow-sm transition">
            <div className="p-2 bg-violet-50 rounded-lg text-violet-600 shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 text-xs sm:text-sm">Canva chuyên sâu</h4>
              <p className="text-xs text-gray-500">Thiết kế ấn phẩm, infographics bài học</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-gray-100 hover:shadow-sm transition">
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600 shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 text-xs sm:text-sm">PowerPoint chuyên nghiệp</h4>
              <p className="text-xs text-gray-500">Tạo slide bài giảng chuyển động độc đáo</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-gray-100 hover:shadow-sm transition sm:col-span-2">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 shrink-0">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 text-xs sm:text-sm">Thiết kế App & Hoạt hình Giáo dục</h4>
              <p className="text-xs text-gray-500">Xây dựng ứng dụng giáo dục không code và dựng phim hoạt hình minh họa bài học.</p>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}
