import { RegionConfig, RegionId } from '../types/game';

export const REGIONS: Record<RegionId, RegionConfig> = {
  sanaa: {
    id: 'sanaa',
    nameAr: 'صنعاء القديمة',
    nameEn: "Old Sana'a",
    titleAr: 'أمانة العاصمة وحصون آزال',
    titleEn: 'The Ancient Capital of Azal',
    subtitleAr: 'أرض القمريات والقصور الطينية التاريخية وباب اليمن العتيد',
    subtitleEn: 'City of Qamariya stained glass, ancient gates and gingerbread facades',
    bgGradStart: '#141c2b',
    bgGradEnd: '#090d16',
    arenaGroundColor: '#172033',
    accentColor: '#f59e0b', // Amber/gold
    enemyBaseColor: '#ef4444',
    enemySpeedMult: 1.0,
    enemySpawnInterval: 1350,
    relicsNeeded: 5,
    landmarks: ['باب اليمن العتيق', 'قصر دار الحجر', 'سوق الملح التراثي', 'الجامع الكبير بصنعاء'],
    coordinates: { lat: 15.3547, lng: 44.2066 },
    mapZoom: 14,
    relics: [
      {
        id: 'sanaa_1',
        nameAr: 'جنبية صيفانية مذهبة',
        nameEn: 'Heritage Golden Janbiya',
        descAr: 'خنجر يمني تراثي صقيل مرصع بنقوش عتيقة يرمز للشرف والبأس.',
        descEn: 'Authentic curved Yemeni dagger symbolizing honor and valor.',
        icon: '🗡️'
      },
      {
        id: 'sanaa_2',
        nameAr: 'مفتاح باب اليمن البرونزي',
        nameEn: 'Bronze Bab al-Yaman Key',
        descAr: 'مفتاح الحصن التاريخي الذي صمد لقرون على بوابات العاصمة.',
        descEn: 'Historical bronze key to the ancient gates of Old Sanaa.',
        icon: '🗝️'
      },
      {
        id: 'sanaa_3',
        nameAr: 'قمرية ملونة من دار الحجر',
        nameEn: 'Stained Glass Qamariya',
        descAr: 'تحفة معمارية يمنية تعكس ألوان الطيف بنقاء الجص والزجاج.',
        descEn: 'Traditional alabaster and stained-glass arch window.',
        icon: '✨'
      },
      {
        id: 'sanaa_4',
        nameAr: 'بن خولاني أصيل',
        nameEn: 'Prime Khawlani Coffee',
        descAr: 'أجود حبات البن اليمني من مدرجات خولان الشاهقة.',
        descEn: 'World-renowned high-altitude Yemeni specialty coffee beans.',
        icon: '☕'
      },
      {
        id: 'sanaa_5',
        nameAr: 'مخطوطة صنعاء الأثرية',
        nameEn: 'Ancient Sanaa Parchment',
        descAr: 'سجل أثري نادر يحفظ تاريخ وبطولات اليمنيين عبر الأزمان.',
        descEn: 'Rare historical manuscript chronicling ancient Yemeni lore.',
        icon: '📜'
      }
    ]
  },
  marib: {
    id: 'marib',
    nameAr: 'مأرب الحضارة',
    nameEn: 'Marib',
    titleAr: 'مهد الحضارة السبئية وسد العرم',
    titleEn: 'Cradle of Sheba & The Great Dam',
    subtitleAr: 'أرض الملكة بلقيس ومعبد برّان وأعمدة الشمس الشامخة',
    subtitleEn: 'Domain of Queen Bilqis, the Temple of Awwam and ancient canals',
    bgGradStart: '#2d1c0c',
    bgGradEnd: '#130c05',
    arenaGroundColor: '#2b1b0e',
    accentColor: '#f97316', // Bronze/Orange
    enemyBaseColor: '#fb923c',
    enemySpeedMult: 1.15,
    enemySpawnInterval: 1200,
    relicsNeeded: 5,
    landmarks: ['سد مأرب التاريخي', 'معبد أوام (محرم بلقيس)', 'معبد برّان (عرش بلقيس)', 'واحة صرواح'],
    coordinates: { lat: 15.4215, lng: 45.3268 },
    mapZoom: 13,
    relics: [
      {
        id: 'marib_1',
        nameAr: 'حجر أساس سد مأرب',
        nameEn: 'Great Dam Foundation Stone',
        descAr: 'حجر هندسي منحوت بدقة أشرف عليه السبئيون لهندسة مياه الجنتين.',
        descEn: 'Precision-hewn block from the legendary 8th-century BC dam.',
        icon: '🧱'
      },
      {
        id: 'marib_2',
        nameAr: 'تمثال الوعل السبئي البرونزي',
        nameEn: 'Sabaean Bronze Ibex',
        descAr: 'رمز القوة والرشاقة عند السبئيين القدماء بنقوش مسندية.',
        descEn: 'Sacred bronze ibex statue etched with ancient Musnad script.',
        icon: '🐐'
      },
      {
        id: 'marib_3',
        nameAr: 'ختم الملكة بلقيس العتيق',
        nameEn: 'Queen Bilqis Royal Seal',
        descAr: 'ختم ملكي يحمل شمس سبأ المشرقة وأقمار الحضارة.',
        descEn: 'Ancient royal signet bearing solar and lunar motifs.',
        icon: '👑'
      },
      {
        id: 'marib_4',
        nameAr: 'لوح المسند السبئي',
        nameEn: 'Musnad Inscribed Stele',
        descAr: 'نقش صخري بالخط المسندي العريق يخلد معاهدات السلم والتجارة.',
        descEn: 'Ancient South Arabian Musnad inscription plaque.',
        icon: '🪨'
      },
      {
        id: 'marib_5',
        nameAr: 'مبخرة عرش بلقيس',
        nameEn: 'Altar Incense Burner',
        descAr: 'مبخرة حجرية مقدسة فاح منها عطر اللبان السبئي لآلاف السنين.',
        descEn: 'Ancient ceremonial burner from the columns of Barran.',
        icon: '🔥'
      }
    ]
  },
  hadramout: {
    id: 'hadramout',
    nameAr: 'حضرموت الأصالة',
    nameEn: 'Hadramout',
    titleAr: 'شبام ناطحات السحاب ووادي دوعن',
    titleEn: 'Shibam Mud Skyscraper Valley',
    subtitleAr: 'مانهاتن الصحراء، قوافل اللبان، وعمارة الطين المعجزة',
    subtitleEn: 'Manhattan of the Desert, ancient frankincense routes and Doan valley',
    bgGradStart: '#1e1b24',
    bgGradEnd: '#0d0b12',
    arenaGroundColor: '#1c1722',
    accentColor: '#a855f7', // Mystic purple
    enemyBaseColor: '#c084fc',
    enemySpeedMult: 1.25,
    enemySpawnInterval: 1100,
    relicsNeeded: 5,
    landmarks: ['شبام حضرموت المسورة', 'قصر الكثيري بسيئون', 'وادي دوعن الخصيب', 'ميناء المكلا العريق'],
    coordinates: { lat: 15.9267, lng: 48.6272 },
    mapZoom: 14,
    relics: [
      {
        id: 'hadramout_1',
        nameAr: 'نموذج شبام الطيني المصغر',
        nameEn: 'Shibam Earthen Skyscraper',
        descAr: 'أقدم ناطحة سحاب طينية في العالم صامدة في وجه الرياح والزمن.',
        descEn: 'Ancient multi-story mudbrick architectural wonder.',
        icon: '🏛️'
      },
      {
        id: 'hadramout_2',
        nameAr: 'عسل دوعني ملكي نقي',
        nameEn: 'Pure Doani Sidr Honey',
        descAr: 'إكسير الشفاء المستخلص من أزهار السدر البرية بوادي دوعن.',
        descEn: 'World-famous Sidr honey praised for rare restorative purity.',
        icon: '🍯'
      },
      {
        id: 'hadramout_3',
        nameAr: 'بلورات اللبان الحضرمي',
        nameEn: 'Hadhrami Frankincense Resin',
        descAr: 'راتنج شجرة اللبان النادرة التي كانت أثمن من الذهب في طريق البخور.',
        descEn: 'Sacred aromatic resin harvested along historical caravan trails.',
        icon: '💎'
      },
      {
        id: 'hadramout_4',
        nameAr: 'سيف سيئون الفضي',
        nameEn: 'Silver Seiyun Scimitar',
        descAr: 'سيف يماني مطعم بالفضة الخالصة من صناع قصر الكثيري.',
        descEn: 'Mastercrafted silver-inlaid scimitar of the desert lords.',
        icon: '⚔️'
      },
      {
        id: 'hadramout_5',
        nameAr: 'لؤلؤة بحر المكلا',
        nameEn: 'Mukalla Deep Pearl',
        descAr: 'درة طبيعية غاص لأجلها بحارة حضرموت في أعماق خليج عدن.',
        descEn: 'Luminous natural Arabian pearl recovered by sea navigators.',
        icon: '🦪'
      }
    ]
  },
  socotra: {
    id: 'socotra',
    nameAr: 'أرخبيل سقطرى',
    nameEn: 'Socotra Archipelago',
    titleAr: 'عروس البكر وجزيرة شجرة دم الأخوين',
    titleEn: 'Island of Dragon Blood Trees',
    subtitleAr: 'غرائب الطبيعة الأسطورية، شواطئ الفيروز ووديان الديسق الساحرة',
    subtitleEn: 'Legendary endemic biodiversity, dragon blood trees and turquoise sea',
    bgGradStart: '#062c24',
    bgGradEnd: '#031411',
    arenaGroundColor: '#07332b',
    accentColor: '#10b981', // Emerald green/cyan
    enemyBaseColor: '#2dd4bf',
    enemySpeedMult: 1.35,
    enemySpawnInterval: 950,
    relicsNeeded: 5,
    landmarks: ['غابة فرمهن لأشجار دم الأخوين', 'شاطئ قلنسية ومحمية ديطوح', 'وادي درهور الجبلي', 'كهف هوق التاريخي'],
    coordinates: { lat: 12.4634, lng: 53.8237 },
    mapZoom: 11,
    relics: [
      {
        id: 'socotra_1',
        nameAr: 'عصارة دم الأخوين النقية',
        nameEn: 'Dragon Blood Tree Resin',
        descAr: 'الراتنج القرمزي الأسطوري المستخرج من أشجار دم الأخوين الفريدة.',
        descEn: 'Mystical crimson resin with legendary curative properties.',
        icon: '🩸'
      },
      {
        id: 'socotra_2',
        nameAr: 'زهرة شجرة الزجاجة النادرة',
        nameEn: 'Desert Rose Blossom',
        descAr: 'زهرة وردية زاهية تنمو على جذوع الأشجار الصخرية بسقطرى.',
        descEn: 'Exotic Adenium desert rose bloom endemic to rocky cliffs.',
        icon: '🌸'
      },
      {
        id: 'socotra_3',
        nameAr: 'عقيق ديسق الفيروزي',
        nameEn: 'Dixam Turquoise Agate',
        descAr: 'حجر كريم ساحر يعكس ألوان مياه بحر العرب وأعماق المحيط.',
        descEn: 'Rare coastal gemstone sparkling with sea-green crystal veins.',
        icon: '💠'
      },
      {
        id: 'socotra_4',
        nameAr: 'صدفة السلحفاة الذهبية',
        nameEn: 'Nautical Amber Shell',
        descAr: 'أصداف شواطئ سقطرى البكر التي حوت أسرار التيارات البحرية.',
        descEn: 'Pristine pearlescent shell from protected coral lagoons.',
        icon: '🐚'
      },
      {
        id: 'socotra_5',
        nameAr: 'نيزك جبال حجهر',
        nameEn: 'Hajhir Mountain Meteorite',
        descAr: 'حجر سماوي هبط على أعلى قمم سقطرى ويشع بطاقة غامضة.',
        descEn: 'Cosmic stone resting upon the highest granite pinnacles.',
        icon: '☄️'
      }
    ]
  }
};
