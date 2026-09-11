import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db, Question } from './server/db.js';
import { generateQuestionsWithAi } from './server/ai.js';

const app = express();
const PORT = 3000;

// Body parsers with high limits to support uploading large question banks and bulk code batches (up to 100MB)
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// 1. Health & Platform Stats
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: Date.now() });
});

app.get('/api/stats', (req, res) => {
  const mem = process.memoryUsage();
  res.json({
    totalQuestions: db.getQuestionCount(),
    questionsBySubject: db.getQuestionsCountBySubject(),
    totalCodes: db.codes.size,
    totalResults: db.results.length,
    activeSubscribers: Array.from(db.codes.values()).filter(c => !c.disabled && (!c.expiresAt || c.expiresAt > Date.now())).length,
    memoryUsageMB: Math.round(mem.rss / (1024 * 1024)),
    heapUsedMB: Math.round(mem.heapUsed / (1024 * 1024)),
    highCapacityBenchmark: {
      maxSupportedQuestions: '1,000,000+',
      concurrentUsersTarget: '10,000+',
      dailyPdfCapacity: '100,000+',
      dailyQuestionCreationCapacity: '200,000+'
    }
  });
});

// 2. Auth & Code verification with Device Locking & Reset support
app.post('/api/auth/verify-code', (req, res) => {
  const { code, deviceId, deviceType } = req.body;
  if (!code) {
    return res.status(400).json({ valid: false, message: 'الكود مطلوب' });
  }

  const cleanCode = String(code).trim();
  const codeObj = db.getCode(cleanCode);
  if (!codeObj) {
    return res.status(404).json({ valid: false, message: 'الكود غير صحيح، تأكد من إدخاله بدقة.' });
  }

  if (codeObj.disabled) {
    return res.status(403).json({ valid: false, message: 'هذا الكود موقوف من قبل الإدارة.' });
  }

  const now = Date.now();
  if (codeObj.expiresAt && now > codeObj.expiresAt) {
    return res.status(403).json({ valid: false, message: 'انتهت مدة صلاحية هذا الكود. يمكنك طلب التجديد من الإدارة.' });
  }

  // Device detection: Mobile Phone vs. Computer/Windows PC
  const ua = (req.headers['user-agent'] || '').toLowerCase();
  const isMobileUa = /android|iphone|ipad|ipod|mobile|blackberry|iemobile|opera mini/i.test(ua);
  const detectedType = (deviceType === 'mobile' || (!deviceType && isMobileUa)) ? 'mobile' : 'desktop';

  // 1. Dual-Device Locking specifically for Master Admin (aljarh123**)
  const isMasterAdmin = 
    cleanCode.toLowerCase() === 'aljarh123**' || 
    codeObj.code.toLowerCase() === 'aljarh123**' ||
    (db.settings.masterAdminCode && cleanCode.toLowerCase() === db.settings.masterAdminCode.toLowerCase());

  if (isMasterAdmin) {
    if (detectedType === 'mobile') {
      // 1 Phone Lock
      if (codeObj.mobileDeviceId && deviceId && codeObj.mobileDeviceId !== deviceId) {
        return res.status(403).json({
          valid: false,
          deviceLocked: true,
          message: '❌ تم تسجيل كود الإدارة (aljarh123**) مسبقاً على هاتف محمول آخر!\nالقيد المعتمد: هاتف ذكي واحد (1 Phone) + لابتوب ويندوز واحد (1 Windows PC) فقط.\nيُرجى استخدام هاتفك المسجل أو طلب إعادة تعيين الأجهزة من لوحة الإدارة.'
        });
      }
      if (deviceId) codeObj.mobileDeviceId = deviceId;
    } else {
      // 1 Windows / Laptop / Computer Lock
      if (codeObj.desktopDeviceId && deviceId && codeObj.desktopDeviceId !== deviceId) {
        return res.status(403).json({
          valid: false,
          deviceLocked: true,
          message: '❌ تم تسجيل كود الإدارة (aljarh123**) مسبقاً على جهاز كمبيوتر/لابتوب آخر!\nالقيد المعتمد: لابتوب ويندوز واحد (1 Windows PC) + هاتف ذكي واحد (1 Phone) فقط.\nيُرجى استخدام اللابتوب المسجل أو طلب إعادة تعيين الأجهزة من لوحة الإدارة.'
        });
      }
      if (deviceId) codeObj.desktopDeviceId = deviceId;
    }

    codeObj.deviceId = deviceId || codeObj.deviceId;
    codeObj.isAdmin = true;
    codeObj.kind = 'admin';
    codeObj.points = 99999;
    codeObj.credits = 99999;
    codeObj.firstUsedAt = codeObj.firstUsedAt || now;
    db.saveCode(codeObj);

    return res.json({
      valid: true,
      code: 'aljarh123**',
      branch: 'كل الشُعب',
      kind: 'admin',
      isAdmin: true,
      expiresAt: null,
      points: 99999,
      credits: 99999,
      deviceId: deviceId,
      mobileDeviceId: codeObj.mobileDeviceId,
      desktopDeviceId: codeObj.desktopDeviceId,
      deviceType: detectedType,
      message: 'مرحباً بك! تم تسجيل الدخول كمسؤول عام (Admin) للمنصة بنجاح.'
    });
  }

  // Other admin master codes
  if (codeObj.kind === 'admin' || codeObj.isAdmin || cleanCode.toUpperCase().startsWith('ADMIN-')) {
    return res.json({
      valid: true,
      code: codeObj.code,
      branch: 'كل الشُعب',
      kind: 'admin',
      isAdmin: true,
      expiresAt: null,
      points: 9999,
      credits: 9999,
      deviceId: deviceId || 'ADMIN_CONSOLE'
    });
  }

  // Standard student device locking validation
  if (deviceId) {
    if (codeObj.deviceId && codeObj.deviceId !== deviceId) {
      return res.status(403).json({
        valid: false,
        deviceLocked: true,
        message: 'هذا الكود مسجل ومربوط بجهاز آخر. يُرجى مراجعة إدارة المنصة لعمل «تجديد الجهاز» لفتحه على جهازك الحالي.'
      });
    }

    // Bind to this device on first use
    if (!codeObj.deviceId) {
      codeObj.deviceId = deviceId;
      codeObj.firstUsedAt = now;
      if (codeObj.durationMinutes && !codeObj.expiresAt) {
        codeObj.expiresAt = now + codeObj.durationMinutes * 60 * 1000;
      }
      if (codeObj.durationDays && !codeObj.expiresAt) {
        codeObj.expiresAt = now + codeObj.durationDays * 86400000;
      }
      db.saveCode(codeObj);
    }
  }

  res.json({
    valid: true,
    code: codeObj.code,
    branch: codeObj.branch,
    kind: codeObj.kind,
    isAdmin: Boolean(codeObj.isAdmin),
    expiresAt: codeObj.expiresAt,
    points: codeObj.points || 0,
    credits: codeObj.credits || 0,
    deviceId: codeObj.deviceId
  });
});

// Admin Dedicated Login
app.post('/api/auth/admin-login', (req, res) => {
  const { username, password, code } = req.body;
  const currentPin = db.settings.adminPin || '2027';

  // Check by master code
  if (code) {
    const cleanCode = String(code).trim();
    if (cleanCode.toLowerCase() === 'aljarh123**' || cleanCode.toUpperCase() === 'ADMIN-2027' || cleanCode.toUpperCase() === 'ADMIN-ABAQERA-2027') {
      return res.json({
        success: true,
        isAdmin: true,
        code: cleanCode,
        branch: 'كل الشُعب',
        role: 'admin'
      });
    }
  }

  // Check by credentials or master code as password
  const u = String(username || '').trim().toLowerCase();
  const p = String(password || '').trim();

  if (p === 'aljarh123**' || p.toLowerCase() === 'aljarh123**' || ((u === 'admin' || u === 'المدير' || u === 'مشرف' || u === 'root') && (p === currentPin || p === '2027'))) {
    return res.json({
      success: true,
      isAdmin: true,
      code: 'aljarh123**',
      branch: 'كل الشُعب',
      role: 'admin'
    });
  }

  return res.status(401).json({
    success: false,
    message: 'بيانات دخول الإدارة غير صحيحة. يمكنك استخدام الكود الإداري: aljarh123** أو كلمة المرور PIN: 2027'
  });
});

// 3. Questions APIs
app.get('/api/questions', (req, res) => {
  const { branch, subject, unit, lesson, search, limit, offset, random } = req.query;
  const result = db.queryQuestions({
    branch: branch ? String(branch) : undefined,
    subject: subject ? String(subject) : undefined,
    unit: unit ? String(unit) : undefined,
    lesson: lesson ? String(lesson) : undefined,
    search: search ? String(search) : undefined,
    limit: limit ? Number(limit) : 50,
    offset: offset ? Number(offset) : 0,
    random: random === 'true'
  });
  res.json(result);
});

app.post('/api/questions', (req, res) => {
  const item = req.body;
  if (!item || (!item.question && !item.q_text)) {
    return res.status(400).json({ error: 'نص السؤال مطلوب' });
  }
  const { added } = db.addQuestionsBatch([item]);
  res.json({ success: true, added });
});

// High-speed bulk ingestion endpoint
app.post('/api/questions/batch', (req, res) => {
  try {
    let questionsList: any[] = [];
    let defaultBranch = 'علمي علوم';
    let defaultSubject = 'عام';
    let defaultUnit = 'عام';

    if (Array.isArray(req.body)) {
      questionsList = req.body;
    } else if (req.body && typeof req.body === 'object') {
      defaultBranch = req.body.defaultBranch || defaultBranch;
      defaultSubject = req.body.defaultSubject || defaultSubject;
      defaultUnit = req.body.defaultUnit || defaultUnit;
      questionsList = Array.isArray(req.body.questions) 
        ? req.body.questions 
        : (Array.isArray(req.body.items) 
          ? req.body.items 
          : (Array.isArray(req.body.data) 
            ? req.body.data 
            : []));
    }

    if (!Array.isArray(questionsList) || questionsList.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'قائمة الأسئلة يجب أن تكون مصفوفة غير فارغة أو تحتوي على questions: []' 
      });
    }

    const prepared = questionsList.map(q => ({
      ...q,
      branch: q.branch || q['الشعبة'] || defaultBranch,
      subject: q.subject || q['المادة'] || defaultSubject,
      unit: q.unit || q.l1 || q['الوحدة'] || q['الباب'] || defaultUnit,
      lesson: q.lesson || q.l2 || q['الدرس'] || ''
    }));

    const start = Date.now();
    const result = db.addQuestionsBatch(prepared);
    const timeMs = Date.now() - start;

    res.json({
      success: true,
      added: result.added,
      skipped: result.skipped,
      totalInDb: db.getQuestionCount(),
      timeMs
    });
  } catch (err: any) {
    console.error('Error in /api/questions/batch:', err);
    res.status(500).json({ success: false, error: err.message || 'حدث خطأ أثناء حفظ الأسئلة' });
  }
});

app.delete('/api/questions/:id', (req, res) => {
  const deleted = db.deleteQuestion(req.params.id);
  res.json({ success: deleted });
});

// 4. Gemini AI Question Generator Endpoint
app.post('/api/ai/generate-questions', async (req, res) => {
  try {
    const { branch, subject, unit, lesson, count, difficulty, autoSave } = req.body;
    if (!subject || !unit) {
      return res.status(400).json({ error: 'المادة والوحدة مطلوبتان للتوليد' });
    }

    const aiRes = await generateQuestionsWithAi({
      branch: branch || 'علمي علوم',
      subject,
      unit,
      lesson,
      count: Number(count) || 5,
      difficulty: difficulty || 'medium'
    });

    let savedCount = 0;
    if (autoSave && aiRes.questions && aiRes.questions.length > 0) {
      const toSave: Partial<Question>[] = aiRes.questions.map(q => ({
        branch: branch || 'علمي علوم',
        subject,
        unit,
        lesson: lesson || '',
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        difficulty: q.difficulty,
        createdAt: Date.now()
      }));
      const r = db.addQuestionsBatch(toSave);
      savedCount = r.added;
    }

    res.json({
      success: true,
      questions: aiRes.questions,
      savedCount,
      message: aiRes.message
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'حدث خطأ في توليد الأسئلة' });
  }
});

// 5. Codes Management (Bulk, Renew, Device Reset, Toggle)
app.get('/api/codes', (req, res) => {
  const list = Array.from(db.codes.values()).sort((a, b) => b.createdAt - a.createdAt);
  res.json(list);
});

app.post('/api/codes/bulk', (req, res) => {
  const { branch, kind, count, days, credits } = req.body;
  const n = Math.max(1, Math.min(10000, Number(count) || 1));
  const created = db.generateBulkCodes({
    branch: branch || 'علمي علوم',
    kind: kind === 'trial' ? 'trial' : 'sub',
    count: n,
    days: days ? Number(days) : 30,
    credits: credits ? Number(credits) : 0
  });

  res.json({
    success: true,
    count: created.length,
    codes: created
  });
});

app.post('/api/codes/renew', (req, res) => {
  const { code, days } = req.body;
  if (!code) return res.status(400).json({ error: 'الكود مطلوب' });
  const codeObj = db.getCode(String(code));
  if (!codeObj) return res.status(404).json({ error: 'الكود غير موجود' });

  const numDays = Math.max(1, Number(days) || 30);
  const base = Math.max(Date.now(), codeObj.expiresAt || Date.now());
  codeObj.expiresAt = base + numDays * 86400000;
  codeObj.durationDays = undefined;
  codeObj.durationMinutes = undefined;
  codeObj.disabled = false;
  db.saveCode(codeObj);

  res.json({ success: true, code: codeObj });
});

app.post('/api/codes/reset-device', (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'الكود مطلوب' });
  const codeObj = db.getCode(String(code));
  if (!codeObj) return res.status(404).json({ error: 'الكود غير موجود' });

  codeObj.deviceId = '';
  codeObj.mobileDeviceId = '';
  codeObj.desktopDeviceId = '';
  codeObj.deviceResetAt = Date.now();
  db.saveCode(codeObj);

  res.json({
    success: true,
    message: 'تم فك ارتباط الجهاز بنجاح. أول جهاز يدخل بالكود سيصبح هو الجهاز المعتمد الجديد.',
    code: codeObj
  });
});

app.post('/api/codes/toggle', (req, res) => {
  const { code } = req.body;
  const codeObj = db.getCode(String(code));
  if (!codeObj) return res.status(404).json({ error: 'الكود غير موجود' });

  codeObj.disabled = !codeObj.disabled;
  db.saveCode(codeObj);
  res.json({ success: true, disabled: codeObj.disabled });
});

// 6. Results & Student Quiz Attempts
app.post('/api/results', (req, res) => {
  const { code, branch, subject, unit, lesson, score, total, durationSeconds, answersSummary } = req.body;
  const resultItem = {
    id: crypto.randomUUID(),
    code: String(code || 'ANONYMOUS'),
    branch: String(branch || ''),
    subject: String(subject || ''),
    unit: String(unit || ''),
    lesson: lesson ? String(lesson) : '',
    score: Number(score) || 0,
    total: Number(total) || 0,
    durationSeconds: Number(durationSeconds) || 0,
    createdAt: Date.now(),
    answersSummary
  };
  db.recordResult(resultItem);
  res.json({ success: true, id: resultItem.id });
});

app.get('/api/results', (req, res) => {
  const { code } = req.query;
  let list = db.results;
  if (code) {
    list = list.filter(r => r.code.toUpperCase() === String(code).toUpperCase());
  }
  res.json(list.slice(-500).reverse());
});

// 7. Settings & Admin PIN verification
app.get('/api/admin/settings', (req, res) => {
  const { adminPin, ...safeSettings } = db.settings;
  res.json({
    settings: safeSettings,
    hasPinSet: Boolean(adminPin)
  });
});

app.post('/api/admin/verify-pin', (req, res) => {
  const { pin } = req.body;
  const valid = String(pin || '') === db.settings.adminPin;
  res.json({ valid });
});

app.post('/api/admin/settings', (req, res) => {
  const { pin, newPin, siteName, allowTrial, trialMinutes, allowPdf, allowImages, pdfCover, pdfTitle, questionsPerPage } = req.body;

  if (db.settings.adminPin && String(pin || '') !== db.settings.adminPin) {
    return res.status(403).json({ error: 'رمز PIN الإدارة غير صحيح' });
  }

  if (newPin && String(newPin).trim().length >= 4) {
    db.settings.adminPin = String(newPin).trim();
  }
  if (siteName) db.settings.siteName = String(siteName).trim();
  if (typeof allowTrial === 'boolean') db.settings.allowTrial = allowTrial;
  if (typeof trialMinutes === 'number') db.settings.trialMinutes = trialMinutes;
  if (typeof allowPdf === 'boolean') db.settings.allowPdf = allowPdf;
  if (typeof allowImages === 'boolean') db.settings.allowImages = allowImages;
  if (typeof pdfCover === 'boolean') db.settings.pdfCover = pdfCover;
  if (typeof pdfTitle === 'boolean') db.settings.pdfTitle = pdfTitle;
  if (questionsPerPage) db.settings.questionsPerPage = Number(questionsPerPage);

  db.saveToDisk();
  res.json({ success: true, settings: db.settings });
});

// 8. High-Capacity Stress Benchmark Generator
app.post('/api/admin/clear-questions', (req, res) => {
  const cleared = db.clearAllQuestions();
  res.json({ success: true, cleared, totalNow: 0 });
});

app.post('/api/admin/benchmark', (req, res) => {
  const count = Math.min(100000, Math.max(1000, Number(req.body.count) || 20000));
  const benchmarkRes = db.generateBenchmarkLoad(count);
  res.json({
    success: true,
    addedSynthetic: count,
    totalQuestionsNow: benchmarkRes.totalNow,
    indexingDurationMs: benchmarkRes.durationMs,
    throughputPerSecond: Math.round((count / (benchmarkRes.durationMs || 1)) * 1000)
  });
});

// 9. Full System Backup & Restore
app.get('/api/admin/backup', (req, res) => {
  const backup = {
    version: '2027.1',
    exportedAt: Date.now(),
    settings: db.settings,
    codes: Array.from(db.codes.values()),
    results: db.results,
    questions: Array.from((db as any).questionsMap.values())
  };
  res.setHeader('Content-Disposition', 'attachment; filename="abaqera_full_backup.json"');
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(backup, null, 2));
});

app.post('/api/admin/restore', (req, res) => {
  const payload = req.body;
  if (!payload || !payload.version) {
    return res.status(400).json({ error: 'ملف النسخة الاحتياطية غير صالح' });
  }

  if (payload.settings) db.settings = { ...db.settings, ...payload.settings };
  if (Array.isArray(payload.codes)) {
    db.codes.clear();
    for (const c of payload.codes) db.codes.set(c.code.toUpperCase(), c);
  }
  if (Array.isArray(payload.results)) {
    db.results = payload.results;
  }
  if (Array.isArray(payload.questions)) {
    (db as any).questionsMap.clear();
    (db as any).questionsBySubject.clear();
    (db as any).questionsBySubjectUnit.clear();
    (db as any).questionsByBranch.clear();
    db.addQuestionsBatch(payload.questions, false);
  }
  db.saveToDisk();

  res.json({
    success: true,
    questionsRestored: db.getQuestionCount(),
    codesRestored: db.codes.size,
    resultsRestored: db.results.length
  });
});

// Mount Vite middleware for dev or serve static files for production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`منصة العباقرة 2027 Server running on http://localhost:${PORT}`);
  });
}

startServer();
