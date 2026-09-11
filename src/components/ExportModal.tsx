import React, { useState } from 'react';
import { Question } from '../types.ts';
import { X, FileText, Image as ImageIcon, Download, Printer, Check, Settings2, Loader2 } from 'lucide-react';

interface ExportModalProps {
  mode: 'pdf' | 'images';
  subject: string;
  unit: string;
  lesson?: string;
  questions: Question[];
  onClose: () => void;
  siteName: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  mode,
  subject,
  unit,
  lesson,
  questions,
  onClose,
  siteName
}) => {
  const maxAvailable = questions.length;
  const [questionCount, setQuestionCount] = useState(Math.min(20, maxAvailable || 1));
  const [order, setOrder] = useState<'normal' | 'random'>('normal');
  const [showAnswers, setShowAnswers] = useState(false);
  const [includeAnswerKey, setIncludeAnswerKey] = useState(false);
  const [includeCover, setIncludeCover] = useState(true);
  const [questionsPerPage, setQuestionsPerPage] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');

  const prepareQuestions = () => {
    let list = [...questions];
    if (order === 'random') {
      list.sort(() => Math.random() - 0.5);
    }
    return list.slice(0, Math.min(questionCount, list.length));
  };

  const handlePrintPdf = () => {
    const selected = prepareQuestions();
    if (selected.length === 0) return alert('لا توجد أسئلة مختارة');

    const chunks: Question[][] = [];
    for (let i = 0; i < selected.length; i += questionsPerPage) {
      chunks.push(selected.slice(i, i + questionsPerPage));
    }

    const title = `${subject} — ${unit}${lesson ? ' — ' + lesson : ''}`;

    const coverHtml = includeCover
      ? `<section class="page cover">
          <div class="cover-box">
            <div class="brand">${siteName} 2027</div>
            <h1 class="c-sub">${subject}</h1>
            <h2 class="c-unit">${unit}</h2>
            ${lesson ? `<h3 class="c-les">${lesson}</h3>` : ''}
            <div class="c-meta">
              <span>إجمالي الأسئلة: ${selected.length} سؤال</span> •
              <span>الدرجة الكلية: ${selected.length * 2} درجة</span> •
              <span>الصف الثالث الثانوي</span>
            </div>
            <div class="c-student">
              <div>اسم الطالب: ................................................................</div>
              <div style="margin-top: 10px;">رقم الجلوس: .............................. المدرسة: ..............................</div>
            </div>
          </div>
        </section>`
      : '';

    const pagesHtml = chunks
      .map((chunk, pi) => {
        return `<section class="page">
          <header class="p-header">
            <div>
              <span class="brand-small">${siteName}</span>
              <span class="sub-small"> | ${title}</span>
            </div>
            <div class="page-num">صفحة ${pi + 1} من ${chunks.length}</div>
          </header>

          <div class="questions-list">
            ${chunk
              .map((q, qi) => {
                const num = pi * questionsPerPage + qi + 1;
                const opts = q.options || [];
                const isEssay = q.question_type === 'essay' || q.type === 'essay';

                return `<article class="question-block">
                  <div class="q-title">${num}) ${q.question || q.q_text}</div>
                  ${
                    isEssay
                      ? `<div style="margin-top: 8px; border: 1px dashed #bbb; border-radius: 4px; padding: 10px; background: #fafafa;">
                          <div style="font-weight: bold; color: #666; font-size: 11px; margin-bottom: 6px;">مساحة إجابة الطالب:</div>
                          <div style="border-bottom: 1px dotted #ccc; height: 24px;"></div>
                          <div style="border-bottom: 1px dotted #ccc; height: 24px;"></div>
                          ${showAnswers && q.model_answer ? `<div style="margin-top: 8px; color: #0b7a4b; font-weight: bold; font-size: 12px;">الإجابة النموذجية: ${q.model_answer}</div>` : ''}
                        </div>`
                      : `<div class="opts-grid">
                          ${opts
                            .map((opt, oi) => {
                              const isCorrect = oi === q.correctAnswer;
                              const letter = ['أ', 'ب', 'ج', 'د'][oi] || oi + 1;
                              return `<div class="opt-item ${showAnswers && isCorrect ? 'correct-mark' : ''}">
                                <span class="opt-badge">${letter}</span>
                                <span>${opt}</span>
                                ${showAnswers && isCorrect ? ' <b style="color:#0b7a4b;">✓ الإجابة الصحيحة</b>' : ''}
                              </div>`;
                            })
                            .join('')}
                        </div>`
                  }
                </article>`;
              })
              .join('')}
          </div>

          <footer class="p-footer">
            <span>منصة العباقرة التعليمية 2027 — مع تمنياتنا لجميع الطلاب بالتفوق</span>
          </footer>
        </section>`;
      })
      .join('');

    const answerKeyHtml = includeAnswerKey
      ? `<section class="page">
          <header class="p-header">
            <div>
              <span class="brand-small">${siteName}</span>
              <span class="sub-small"> | جدول مفتاح الإجابات النموذجية</span>
            </div>
            <div class="page-num">مفتاح الحلول</div>
          </header>

          <div style="flex: 1;">
            <h3 style="text-align: center; margin: 15px 0 25px; font-size: 22px; color: #132942; border-bottom: 2px solid #132942; padding-bottom: 10px;">
              جدول الإجابات النموذجية المعتمدة (${selected.length} سؤال)
            </h3>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; direction: rtl;">
              ${selected
                .map((q, idx) => {
                  const isEssay = q.question_type === 'essay' || q.type === 'essay';
                  const letter = ['أ', 'ب', 'ج', 'د'][q.correctAnswer] || q.correctAnswer + 1;
                  return `<div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px; text-align: center; background: #f8fafc;">
                    <div style="font-weight: bold; color: #132942; font-size: 13px;">السؤال (${idx + 1})</div>
                    <div style="font-size: 18px; font-weight: 900; color: #0b7a4b; margin-top: 4px;">
                      ${isEssay ? 'سؤال مقالي' : letter}
                    </div>
                    ${isEssay && q.model_answer ? `<div style="font-size: 11px; color: #475569; margin-top: 4px;">${q.model_answer}</div>` : ''}
                  </div>`;
                })
                .join('')}
            </div>
          </div>

          <footer class="p-footer">
            <span>منصة العباقرة التعليمية 2027 — مع تمنياتنا لجميع الطلاب بالتفوق</span>
          </footer>
        </section>`
      : '';

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('المتصفح منع فتح نافذة الطباعة. يرجى السماح بالنوافذ المنبثقة ثم المحاولة ثانية.');
      return;
    }

    printWindow.document.write(`<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <title>${title} - ${siteName}</title>
  <style>
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #eee; font-family: 'Cairo', Arial, sans-serif; color: #111; line-height: 1.6; }
    .page { width: 210mm; min-height: 297mm; margin: 0 auto 10mm; background: white; padding: 16mm 18mm; page-break-after: always; display: flex; flex-direction: column; justify-content: space-between; }
    .page:last-child { page-break-after: auto; }
    .cover { display: flex; align-items: center; justify-content: center; text-align: center; background: #fafafa; border: 4mm solid #132942; }
    .cover-box { width: 100%; border: 2px dashed #223b57; padding: 25mm 15mm; border-radius: 8mm; }
    .brand { font-size: 26px; font-weight: 900; color: #132942; margin-bottom: 8mm; }
    .c-sub { font-size: 34px; font-weight: 900; margin: 4mm 0; }
    .c-unit { font-size: 24px; color: #333; margin: 3mm 0; }
    .c-les { font-size: 18px; color: #555; }
    .c-meta { font-size: 15px; font-weight: bold; color: #223b57; margin: 12mm 0; padding: 4mm; background: #eef4fb; border-radius: 3mm; }
    .c-student { text-align: right; font-size: 15px; margin-top: 15mm; padding-top: 6mm; border-top: 1px solid #ccc; line-height: 2; }
    .p-header { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 2px solid #132942; padding-bottom: 3mm; margin-bottom: 6mm; }
    .brand-small { font-weight: 900; font-size: 14px; color: #132942; }
    .sub-small { font-size: 13px; color: #444; }
    .page-num { font-size: 12px; color: #666; font-weight: bold; }
    .questions-list { flex: 1; display: flex; flex-direction: column; gap: 5mm; }
    .question-block { border-bottom: 1px solid #ddd; padding-bottom: 4mm; break-inside: avoid; }
    .q-title { font-size: 15px; font-weight: 800; color: #111; margin-bottom: 3mm; }
    .opts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2.5mm 6mm; font-size: 13px; }
    .opt-item { display: flex; align-items: center; gap: 2mm; padding: 1.5mm 2mm; border-radius: 2mm; background: #f8f9fa; }
    .opt-badge { width: 18px; height: 18px; display: inline-flex; align-items: center; justify-content: center; background: #e5e9f0; border-radius: 50%; font-size: 11px; font-weight: bold; }
    .correct-mark { background: #eefbf4; font-weight: bold; border: 1px solid #33c58e; }
    .q-exp { margin-top: 2.5mm; font-size: 12px; background: #fffbe6; padding: 2mm 3mm; border-radius: 2mm; border-right: 3px solid #ffc857; }
    .p-footer { border-top: 1px solid #ddd; padding-top: 3mm; margin-top: 4mm; text-align: center; font-size: 11px; color: #777; }
    @media print {
      body { background: white; }
      .page { margin: 0; padding: 14mm 16mm; width: 100%; min-height: 100vh; }
    }
  </style>
</head>
<body>
  ${coverHtml}
  ${pagesHtml}
  ${answerKeyHtml}
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 350);
    };
  <\/script>
</body>
</html>`);
    printWindow.document.close();
  };

  const handleGenerateImages = async () => {
    const selected = prepareQuestions();
    if (selected.length === 0) return alert('لا توجد أسئلة مختارة');

    setGenerating(true);
    const chunks: Question[][] = [];
    for (let i = 0; i < selected.length; i += questionsPerPage) {
      chunks.push(selected.slice(i, i + questionsPerPage));
    }

    try {
      for (let p = 0; p < chunks.length; p++) {
        setProgressMsg(`جاري رسم صفحة عالية الدقة (${p + 1} من ${chunks.length})...`);
        const canvas = document.createElement('canvas');
        canvas.width = 2480;
        canvas.height = 3508;
        const ctx = canvas.getContext('2d')!;

        // Fill background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.direction = 'rtl';
        ctx.textAlign = 'right';

        let y = 180;

        // Draw header
        ctx.font = 'bold 56px Arial, sans-serif';
        ctx.fillStyle = '#132942';
        ctx.fillText(`${siteName} — ${subject}`, 2300, y);
        y += 70;

        ctx.font = '36px Arial, sans-serif';
        ctx.fillStyle = '#555555';
        ctx.fillText(`${unit}${lesson ? ' — ' + lesson : ''} (صفحة ${p + 1}/${chunks.length})`, 2300, y);
        y += 40;

        ctx.strokeStyle = '#223b57';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(180, y);
        ctx.lineTo(2300, y);
        ctx.stroke();
        y += 80;

        // Draw Questions
        for (let qi = 0; qi < chunks[p].length; qi++) {
          const q = chunks[p][qi];
          const num = p * questionsPerPage + qi + 1;

          ctx.font = 'bold 44px Arial, sans-serif';
          ctx.fillStyle = '#111111';
          y = wrapCanvasText(ctx, `${num}) ${q.question || q.q_text}`, 2100, 2280, y, 62) + 24;

          // Draw Options or Essay lines
          const isEssay = q.question_type === 'essay' || q.type === 'essay';
          if (isEssay) {
            ctx.font = 'italic 34px Arial, sans-serif';
            ctx.fillStyle = '#666666';
            y = wrapCanvasText(ctx, '[سؤال مقالي - مساحة الإجابة: ................................................................]', 2000, 2220, y, 52) + 10;
            if (showAnswers && q.model_answer) {
              ctx.font = 'bold 36px Arial, sans-serif';
              ctx.fillStyle = '#0b7a4b';
              y = wrapCanvasText(ctx, `الإجابة النموذجية: ${q.model_answer}`, 2000, 2220, y + 8, 48) + 10;
            }
          } else {
            ctx.font = '38px Arial, sans-serif';
            for (let oi = 0; oi < (q.options || []).length; oi++) {
              const isCorrect = oi === q.correctAnswer;
              ctx.fillStyle = showAnswers && isCorrect ? '#0b7a4b' : '#333333';
              const letter = ['أ', 'ب', 'ج', 'د'][oi] || oi + 1;
              const optTxt = `${letter}) ${q.options[oi]}${showAnswers && isCorrect ? '  [✓ الإجابة الصحيحة]' : ''}`;
              y = wrapCanvasText(ctx, optTxt, 2000, 2220, y, 52) + 10;
            }
          }

          ctx.strokeStyle = '#e0e0e0';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(180, y + 20);
          ctx.lineTo(2300, y + 20);
          ctx.stroke();
          y += 65;
        }

        // Footer
        ctx.font = '30px Arial, sans-serif';
        ctx.fillStyle = '#888888';
        ctx.textAlign = 'center';
        ctx.fillText(`منصة العباقرة 2027 — صفحة ${p + 1} من ${chunks.length}`, 1240, 3420);

        // Download PNG
        await new Promise<void>((resolve) => {
          canvas.toBlob((blob) => {
            if (blob) {
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = `${subject}_${unit}_صفحة_${p + 1}.png`.replace(/\s+/g, '_');
              document.body.appendChild(a);
              a.click();
              a.remove();
              setTimeout(() => URL.revokeObjectURL(a.href), 1500);
            }
            setTimeout(resolve, 200);
          }, 'image/png');
        });
      }

      alert(`تم تحميل ${chunks.length} صفحة بصيغة صور عالية الدقة (300DPI).`);
    } catch (e: any) {
      alert('خطأ أثناء تصدير الصور: ' + e.message);
    } finally {
      setGenerating(false);
      setProgressMsg('');
    }
  };

  const wrapCanvasText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number, x: number, y: number, lineHeight: number) => {
    const words = String(text || '').split(/\s+/);
    let line = '';
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line, x, y);
        line = w;
        y += lineHeight;
      } else {
        line = test;
      }
    }
    if (line) {
      ctx.fillText(line, x, y);
      y += lineHeight;
    }
    return y;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0f2035] border border-[#223b57] rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative animate-fadeIn max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-xl bg-[#091827] text-[#9fb1c7] hover:text-[#f5f8ff] border border-[#223b57] transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
            mode === 'pdf' ? 'bg-[#55a8ff]/20 text-[#55a8ff]' : 'bg-[#ffc857]/20 text-[#ffc857]'
          }`}>
            {mode === 'pdf' ? <FileText className="w-6 h-6" /> : <ImageIcon className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-[#f5f8ff]">
              إنشاء {mode === 'pdf' ? 'ملف PDF للطباعة' : 'صور A4 عالية الدقة'}
            </h3>
            <p className="text-xs text-[#9fb1c7]">
              {subject} — {unit}
            </p>
          </div>
        </div>

        {/* Configuration options */}
        <div className="space-y-4 mb-6 text-xs">
          <div>
            <label className="block text-[#bfd0e5] font-semibold mb-1">
              عدد الأسئلة (المتاح بالقسم: {maxAvailable} سؤال)
            </label>
            <input
              type="number"
              min={1}
              max={maxAvailable}
              value={questionCount}
              onChange={(e) => setQuestionCount(Math.max(1, Math.min(maxAvailable, +e.target.value || 1)))}
              className="w-full bg-[#091827] border border-[#223b57] rounded-xl px-4 py-2.5 text-[#f5f8ff] outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#bfd0e5] font-semibold mb-1">ترتيب الأسئلة</label>
              <select
                value={order}
                onChange={(e: any) => setOrder(e.target.value)}
                className="w-full bg-[#091827] border border-[#223b57] rounded-xl px-3 py-2.5 text-[#f5f8ff] outline-none"
              >
                <option value="normal">بالترتيب الأصلي</option>
                <option value="random">عشوائي</option>
              </select>
            </div>

            <div>
              <label className="block text-[#bfd0e5] font-semibold mb-1">أسئلة في كل صفحة</label>
              <select
                value={questionsPerPage}
                onChange={(e) => setQuestionsPerPage(Number(e.target.value))}
                className="w-full bg-[#091827] border border-[#223b57] rounded-xl px-3 py-2.5 text-[#f5f8ff] outline-none"
              >
                <option value={3}>3 أسئلة (واسع)</option>
                <option value={5}>5 أسئلة (قياسي)</option>
                <option value={8}>8 أسئلة (مكثف)</option>
              </select>
            </div>
          </div>

          <div className="bg-[#091827] border border-[#223b57] rounded-2xl p-4 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showAnswers}
                onChange={(e) => setShowAnswers(e.target.checked)}
                className="w-4 h-4 rounded text-[#43e6a8] accent-[#43e6a8]"
              />
              <span className="text-[#f5f8ff] font-semibold">تحديد الإجابة الصحيحة بجانب كل سؤال مباشرة</span>
            </label>

            {mode === 'pdf' && (
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeAnswerKey}
                  onChange={(e) => setIncludeAnswerKey(e.target.checked)}
                  className="w-4 h-4 rounded text-[#43e6a8] accent-[#43e6a8]"
                />
                <span className="text-[#f5f8ff] font-semibold">إلحاق جدول مفتاح الحلول (Answer Key) في نهاية المذكرة</span>
              </label>
            )}

            {mode === 'pdf' && (
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeCover}
                  onChange={(e) => setIncludeCover(e.target.checked)}
                  className="w-4 h-4 rounded text-[#43e6a8] accent-[#43e6a8]"
                />
                <span className="text-[#f5f8ff] font-semibold">إضافة غلاف رسمي للملزمة / الامتحان</span>
              </label>
            )}
          </div>
        </div>

        {generating && (
          <div className="mb-4 p-3 rounded-xl bg-[#091827] border border-[#55a8ff]/40 text-xs text-[#55a8ff] flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{progressMsg}</span>
          </div>
        )}

        <div className="flex items-center gap-3">
          {mode === 'pdf' ? (
            <button
              onClick={handlePrintPdf}
              className="flex-1 py-3.5 rounded-xl font-black text-xs bg-gradient-to-r from-[#55a8ff] to-[#388cff] hover:brightness-110 text-white transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#55a8ff]/20"
            >
              <Printer className="w-4 h-4" />
              <span>معاينة وطباعة PDF الآن</span>
            </button>
          ) : (
            <button
              onClick={handleGenerateImages}
              disabled={generating}
              className="flex-1 py-3.5 rounded-xl font-black text-xs bg-gradient-to-r from-[#ffc857] to-[#e69f10] hover:brightness-110 disabled:opacity-50 text-[#04121a] transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#ffc857]/20"
            >
              <Download className="w-4 h-4" />
              <span>تحميل صور A4 عالية الدقة</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="px-5 py-3.5 rounded-xl font-bold text-xs bg-[#18324f] hover:bg-[#223b57] text-[#9fb1c7] transition cursor-pointer"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
};
