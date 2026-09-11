export interface SubjectStyle {
  name: string;
  emoji: string;
  secondaryEmoji: string;
  badge: string;
  gradient: string;
  borderHover: string;
  accentColor: string;
  glowColor: string;
  category: string;
}

export const SUBJECT_STYLES: Record<string, SubjectStyle> = {
  'اللغة العربية': {
    name: 'اللغة العربية',
    emoji: '📖',
    secondaryEmoji: '✍️',
    badge: 'لغة الضاد والنحو والبلاغة',
    gradient: 'from-[#2e1c14] to-[#120b08]',
    borderHover: 'hover:border-[#ff9f43]',
    accentColor: '#ff9f43',
    glowColor: 'rgba(255, 159, 67, 0.2)',
    category: 'مواد عامة مشتركة'
  },
  'الكيمياء': {
    name: 'الكيمياء',
    emoji: '🧪',
    secondaryEmoji: '⚗️',
    badge: 'معادلات وتجارب وعضوية',
    gradient: 'from-[#0b282c] to-[#041215]',
    borderHover: 'hover:border-[#43e6a8]',
    accentColor: '#43e6a8',
    glowColor: 'rgba(67, 230, 168, 0.2)',
    category: 'العلوم الطبيعية'
  },
  'الفيزياء': {
    name: 'الفيزياء',
    emoji: '⚡',
    secondaryEmoji: '🧲',
    badge: 'كهربية ومغناطيسية وحديثة',
    gradient: 'from-[#14233c] to-[#080e18]',
    borderHover: 'hover:border-[#55a8ff]',
    accentColor: '#55a8ff',
    glowColor: 'rgba(85, 168, 255, 0.2)',
    category: 'العلوم الطبيعية'
  },
  'الأحياء': {
    name: 'الأحياء',
    emoji: '🧬',
    secondaryEmoji: '🔬',
    badge: 'DNA ومناعة وتكاثر وحركة',
    gradient: 'from-[#112d1b] to-[#07130b]',
    borderHover: 'hover:border-[#2ecc71]',
    accentColor: '#2ecc71',
    glowColor: 'rgba(46, 204, 113, 0.2)',
    category: 'العلوم الطبيعية'
  },
  'الجيولوجيا': {
    name: 'الجيولوجيا',
    emoji: '🌋',
    secondaryEmoji: '🪨',
    badge: 'صخور وحفريات وعلوم بيئة',
    gradient: 'from-[#2d2215] to-[#120e08]',
    borderHover: 'hover:border-[#e67e22]',
    accentColor: '#e67e22',
    glowColor: 'rgba(230, 126, 34, 0.2)',
    category: 'العلوم الطبيعية'
  },
  'الجيولوجيا وعلوم البيئة': {
    name: 'الجيولوجيا وعلوم البيئة',
    emoji: '🌋',
    secondaryEmoji: '🪨',
    badge: 'صخور وحفريات وعلوم بيئة',
    gradient: 'from-[#2d2215] to-[#120e08]',
    borderHover: 'hover:border-[#e67e22]',
    accentColor: '#e67e22',
    glowColor: 'rgba(230, 126, 34, 0.2)',
    category: 'العلوم الطبيعية'
  },
  'الرياضيات البحتة': {
    name: 'الرياضيات البحتة',
    emoji: '📐',
    secondaryEmoji: '♾️',
    badge: 'تفاضل وتكامل وجبر فراغية',
    gradient: 'from-[#251538] to-[#0f0817]',
    borderHover: 'hover:border-[#a55eea]',
    accentColor: '#a55eea',
    glowColor: 'rgba(165, 94, 234, 0.2)',
    category: 'رياضيات'
  },
  'الرياضيات التطبيقية': {
    name: 'الرياضيات التطبيقية',
    emoji: '⚙️',
    secondaryEmoji: '🎯',
    badge: 'استاتيكا وديناميكا وقوى',
    gradient: 'from-[#311c1d] to-[#140b0c]',
    borderHover: 'hover:border-[#fc5c65]',
    accentColor: '#fc5c65',
    glowColor: 'rgba(252, 92, 101, 0.2)',
    category: 'رياضيات'
  },
  'اللغة الإنجليزية': {
    name: 'اللغة الإنجليزية',
    emoji: '🇬🇧',
    secondaryEmoji: '🗣️',
    badge: 'Grammar, Vocab & Novel',
    gradient: 'from-[#10233b] to-[#060e19]',
    borderHover: 'hover:border-[#4b7bec]',
    accentColor: '#4b7bec',
    glowColor: 'rgba(75, 123, 236, 0.2)',
    category: 'اللغات الأجنبية'
  },
  'اللغة الفرنسية': {
    name: 'اللغة الفرنسية',
    emoji: '🇫🇷',
    secondaryEmoji: '💬',
    badge: 'Vocabulaire & Grammaire',
    gradient: 'from-[#17223b] to-[#080d17]',
    borderHover: 'hover:border-[#3867d6]',
    accentColor: '#3867d6',
    glowColor: 'rgba(56, 103, 214, 0.2)',
    category: 'اللغات الأجنبية'
  },
  'الجغرافيا': {
    name: 'الجغرافيا',
    emoji: '🌍',
    secondaryEmoji: '🗺️',
    badge: 'جغرافيا سياسية وخرائط',
    gradient: 'from-[#0e272a] to-[#051113]',
    borderHover: 'hover:border-[#20bf6b]',
    accentColor: '#20bf6b',
    glowColor: 'rgba(32, 191, 107, 0.2)',
    category: 'المواد الأدبية'
  },
  'التاريخ': {
    name: 'التاريخ',
    emoji: '🏛️',
    secondaryEmoji: '📜',
    badge: 'حضارات وثورات وقضايا',
    gradient: 'from-[#2d1e11] to-[#130d07]',
    borderHover: 'hover:border-[#d1d8e0]',
    accentColor: '#f7b731',
    glowColor: 'rgba(247, 183, 49, 0.2)',
    category: 'المواد الأدبية'
  },
  'الفلسفة والمنطق': {
    name: 'الفلسفة والمنطق',
    emoji: '🧠',
    secondaryEmoji: '💭',
    badge: 'فكر استدلالي وأخلاقيات',
    gradient: 'from-[#2b1731] to-[#120914]',
    borderHover: 'hover:border-[#d980fa]',
    accentColor: '#d980fa',
    glowColor: 'rgba(217, 128, 250, 0.2)',
    category: 'المواد الأدبية'
  },
  'علم النفس والاجتماع': {
    name: 'علم النفس والاجتماع',
    emoji: '👥',
    secondaryEmoji: '💡',
    badge: 'سلوك ونظريات ومجتمع',
    gradient: 'from-[#2f1325] to-[#13070f]',
    borderHover: 'hover:border-[#fd79a8]',
    accentColor: '#fd79a8',
    glowColor: 'rgba(253, 121, 168, 0.2)',
    category: 'المواد الأدبية'
  },
  'الإحصاء': {
    name: 'الإحصاء',
    emoji: '📊',
    secondaryEmoji: '📈',
    badge: 'ارتباط وانحدار وتوزيعات',
    gradient: 'from-[#122b1f] to-[#06120c]',
    borderHover: 'hover:border-[#26de81]',
    accentColor: '#26de81',
    glowColor: 'rgba(38, 222, 129, 0.2)',
    category: 'رياضيات وإحصاء'
  },
  'مواد الأزهر': {
    name: 'مواد الأزهر',
    emoji: '🕌',
    secondaryEmoji: '📜',
    badge: 'فقه وتفسير وحديث وتوحيد',
    gradient: 'from-[#0e2c21] to-[#05130e]',
    borderHover: 'hover:border-[#2ed573]',
    accentColor: '#2ed573',
    glowColor: 'rgba(46, 213, 115, 0.2)',
    category: 'العلوم الشرعية والعربية'
  }
};

export function getSubjectStyle(subjectName: string): SubjectStyle {
  if (!subjectName) {
    return {
      name: 'مادة دراسية',
      emoji: '📚',
      secondaryEmoji: '✨',
      badge: 'منهج 2027',
      gradient: 'from-[#132942] to-[#0b1a2b]',
      borderHover: 'hover:border-[#55a8ff]',
      accentColor: '#55a8ff',
      glowColor: 'rgba(85, 168, 255, 0.2)',
      category: 'عام'
    };
  }

  const trimmed = subjectName.trim();
  if (SUBJECT_STYLES[trimmed]) return SUBJECT_STYLES[trimmed];

  // Fuzzy match
  for (const [key, val] of Object.entries(SUBJECT_STYLES)) {
    if (trimmed.includes(key) || key.includes(trimmed)) {
      return val;
    }
  }

  return {
    name: trimmed,
    emoji: '📚',
    secondaryEmoji: '✨',
    badge: 'منهج 2027',
    gradient: 'from-[#132942] to-[#0b1a2b]',
    borderHover: 'hover:border-[#43e6a8]',
    accentColor: '#43e6a8',
    glowColor: 'rgba(67, 230, 168, 0.2)',
    category: 'عام'
  };
}
