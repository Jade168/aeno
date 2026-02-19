// characters.js
// 可愛AI助手小動物 + 星球管理者設定

window.AENO_CHARACTERS = {
  mainAssistant: {
    name: "AENO",
    face: "🦊",
    style: "fox",
    voice: "yue"
  }
};

window.PLANET_DATA = [
  { id:"uk",      name:"英倫星球",   lang:"English",     langCode:"en",  flag:"🇬🇧", theme:"europe" },
  { id:"canton",  name:"中原星球",   lang:"粵語",        langCode:"yue", flag:"🇭🇰", theme:"canton" },
  { id:"japan",   name:"櫻月星球",   lang:"日本語",      langCode:"ja",  flag:"🇯🇵", theme:"japan" },
  { id:"korea",   name:"晨韓星球",   lang:"한국어",      langCode:"ko",  flag:"🇰🇷", theme:"korea" },
  { id:"france",  name:"法蘭星球",   lang:"Français",    langCode:"fr",  flag:"🇫🇷", theme:"france" },
  { id:"germany", name:"鋼鐵星球",   lang:"Deutsch",     langCode:"de",  flag:"🇩🇪", theme:"germany" },
  { id:"spain",   name:"西陽星球",   lang:"Español",     langCode:"es",  flag:"🇪🇸", theme:"spain" },
  { id:"italy",   name:"羅馬星球",   lang:"Italiano",    langCode:"it",  flag:"🇮🇹", theme:"italy" },
  { id:"russia",  name:"雪原星球",   lang:"Русский",     langCode:"ru",  flag:"🇷🇺", theme:"russia" },
  { id:"arab",    name:"沙海星球",   lang:"العربية",     langCode:"ar",  flag:"🇸🇦", theme:"arab" },
  { id:"india",   name:"梵光星球",   lang:"हिन्दी",      langCode:"hi",  flag:"🇮🇳", theme:"india" },
  { id:"thai",    name:"泰蘭星球",   lang:"ไทย",         langCode:"th",  flag:"🇹🇭", theme:"thai" },
  { id:"vietnam", name:"越風星球",   lang:"Tiếng Việt",  langCode:"vi",  flag:"🇻🇳", theme:"vietnam" },
  { id:"brazil",  name:"森舞星球",   lang:"Português",   langCode:"pt",  flag:"🇧🇷", theme:"brazil" },
  { id:"mexico",  name:"仙人掌星球", lang:"Español MX",  langCode:"es-mx", flag:"🇲🇽", theme:"mexico" },
  { id:"africa",  name:"金鼓星球",   lang:"Swahili",     langCode:"sw",  flag:"🌍", theme:"africa" },
  { id:"nordic",  name:"極光星球",   lang:"Svenska",     langCode:"sv",  flag:"🇸🇪", theme:"nordic" },
  { id:"australia",name:"海袋星球",  lang:"English AU",  langCode:"en-au", flag:"🇦🇺", theme:"australia" },
  { id:"greece",  name:"神殿星球",   lang:"Ελληνικά",    langCode:"el",  flag:"🇬🇷", theme:"greece" },
  { id:"usa",     name:"自由星球",   lang:"English US",  langCode:"en-us", flag:"🇺🇸", theme:"usa" }
];

// 黑洞不在星球列表，後期解鎖
window.BLACKHOLE_DATA = {
  id:"blackhole",
  name:"黑洞中心",
  lang:"宇宙語",
  flag:"🕳️"
};

// 外語資源詞庫（簡化版本，可擴展）
window.LANGUAGE_WORDS = {
  wood: {
    en:"Wood",
    yue:"木",
    ja:"木材",
    ko:"나무",
    fr:"Bois",
    de:"Holz",
    es:"Madera",
    it:"Legno",
    ru:"Дерево",
    ar:"خشب",
    hi:"लकड़ी",
    th:"ไม้",
    vi:"Gỗ",
    pt:"Madeira",
    sw:"Mbao",
    sv:"Trä",
    el:"Ξύλο"
  },
  stone: {
    en:"Stone",
    yue:"石",
    ja:"石",
    ko:"돌",
    fr:"Pierre",
    de:"Stein",
    es:"Piedra",
    it:"Pietra",
    ru:"Камень",
    ar:"حجر",
    hi:"पत्थर",
    th:"หิน",
    vi:"Đá",
    pt:"Pedra",
    sw:"Jiwe",
    sv:"Sten",
    el:"Πέτρα"
  },
  iron: {
    en:"Iron",
    yue:"鐵",
    ja:"鉄",
    ko:"철",
    fr:"Fer",
    de:"Eisen",
    es:"Hierro",
    it:"Ferro",
    ru:"Железо",
    ar:"حديد",
    hi:"लोहा",
    th:"เหล็ก",
    vi:"Sắt",
    pt:"Ferro",
    sw:"Chuma",
    sv:"Järn",
    el:"Σίδηρος"
  },
  food: {
    en:"Food",
    yue:"糧",
    ja:"食料",
    ko:"식량",
    fr:"Nourriture",
    de:"Essen",
    es:"Comida",
    it:"Cibo",
    ru:"Еда",
    ar:"طعام",
    hi:"भोजन",
    th:"อาหาร",
    vi:"Lương thực",
    pt:"Comida",
    sw:"Chakula",
    sv:"Mat",
    el:"Τροφή"
  },
  gem: {
    en:"Gem",
    yue:"寶石",
    ja:"宝石",
    ko:"보석",
    fr:"Gemme",
    de:"Edelstein",
    es:"Gema",
    it:"Gemma",
    ru:"Драгоценность",
    ar:"جوهرة",
    hi:"रत्न",
    th:"อัญมณี",
    vi:"Đá quý",
    pt:"Gema",
    sw:"Kito",
    sv:"Ädelsten",
    el:"Πολύτιμος λίθος"
  }
};
