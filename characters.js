// characters.js
// AENO - AI Assistant Animals (Full Body)
// Version: 2026-02-15
// 注意：呢個檔案只放角色資料，唔處理遊戲邏輯
// 遊戲邏輯會由 game.js 控制（例如：點擊助手彈出對話框）

window.AENO_CHARACTERS = {
  // =========================
  // DEFAULT AI ASSISTANT
  // =========================
  defaultAssistant: {
    id: "lupus",
    displayName: "Lupus",
    title: "語言學習AI助手",
    species: "wolf",
    themeColor: "#38bdf8",

    // 角色形象（用 canvas 畫出來）
    bodyStyle: {
      headType: "round",
      bodyType: "chubby",
      earType: "wolf",
      tailType: "wolf",
      hasArms: true,
      hasLegs: true,
      eyeType: "cute",
      mouthType: "smile",
      clothingSlot: true, // 之後可以賣廣告衫
      adBadge: true
    },

    // AI 對話（會由 game.js 隨機抽）
    dialogues: {
      greet: [
        "你好呀～我係 Lupus 🐺",
        "歡迎嚟到 AENO 世界！",
        "你準備好用學習外語嚟挖 AENO 未？"
      ],
      idle: [
        "你可以點領土空地起建築。",
        "如果資源唔夠，可以派機器人去探索星球。",
        "記住：玩家離線最多只計 24 小時外掛收益。"
      ],
      warning: [
        "⚠️ 資源不足！你要先收集木、石、鐵。",
        "⚠️ 金幣不足！你需要建築產金。",
        "⚠️ 領土唔夠！你要用金幣擴展領土。"
      ],
      success: [
        "做得好！你嘅文明開始成形啦！",
        "你升級得好快～繼續努力！",
        "恭喜！你成功建立新建築。"
      ],
      adSong: [
        "🎵 播廣告歌可以提升 AENO 掉落機率！",
        "聽歌 + 學習語言 = AENO 挖礦成本。",
        "你越專注，挖到 AENO 機率越高。"
      ],
      pronunciation: [
        "📢 試下跟我讀：Wood / Stone / Iron",
        "📢 今日任務：讀出野獸名字，40% 以上先算合格！",
        "📢 你越準確，AENO 掉落率越高。"
      ],
      buildTips: [
        "🏗️ 提示：玩家可以手動起建築。",
        "🏗️ 提示：點空地會彈出建築選單。",
        "🏗️ AI 自動建造會跟你設定優先順序。"
      ]
    }
  },

  // =========================
  // PLANET ASSISTANTS
  // =========================
  planetAssistants: {
    earth: {
      id: "felis",
      displayName: "Felis",
      title: "地球生態助手",
      species: "cat",
      themeColor: "#22c55e",
      bodyStyle: {
        headType: "round",
        bodyType: "small",
        earType: "cat",
        tailType: "cat",
        hasArms: true,
        hasLegs: true,
        eyeType: "cute",
        mouthType: "smile",
        clothingSlot: true,
        adBadge: true
      },
      dialogues: {
        greet: [
          "喵～我係 Felis 🐱",
          "地球資源豐富，但競爭亦好大。",
          "記得起房屋，先有工人！"
        ],
        idle: [
          "🌲 樹林可以產木。",
          "⛰️ 山脈附近可以產石同鐵。",
          "🌊 河流附近會增加糧食產量。"
        ],
        warning: [
          "⚠️ 工人不足！起多幾間房屋。",
          "⚠️ 糧食不足！你需要農田或漁場。"
        ],
        success: [
          "好耶！文明升級！",
          "地球嘅生態開始穩定啦。"
        ]
      }
    },

    mars: {
      id: "ursus",
      displayName: "Ursus",
      title: "火星工業助手",
      species: "bear",
      themeColor: "#f97316",
      bodyStyle: {
        headType: "round",
        bodyType: "big",
        earType: "bear",
        tailType: "short",
        hasArms: true,
        hasLegs: true,
        eyeType: "serious",
        mouthType: "smile",
        clothingSlot: true,
        adBadge: true
      },
      dialogues: {
        greet: [
          "吼～我係 Ursus 🐻",
          "火星資源少，但礦產價值高。",
          "你要靠機器人探索先會快。"
        ],
        idle: [
          "⛏️ 火星鐵礦密度高。",
          "🏭 建工廠可以加速科技。",
          "💰 金幣係前期最大瓶頸。"
        ],
        warning: [
          "⚠️ 你冇足夠石頭建築。",
          "⚠️ 你冇足夠鐵升級。"
        ],
        success: [
          "工業化成功！",
          "你已經開始進入高科技階段。"
        ]
      }
    },

    ocean: {
      id: "delphinus",
      displayName: "Delphinus",
      title: "海洋探索助手",
      species: "dolphin",
      themeColor: "#0ea5e9",
      bodyStyle: {
        headType: "long",
        bodyType: "slim",
        earType: "none",
        tailType: "fin",
        hasArms: true,
        hasLegs: false,
        eyeType: "cute",
        mouthType: "smile",
        clothingSlot: true,
        adBadge: true
      },
      dialogues: {
        greet: [
          "啾啾～我係 Delphinus 🐬",
          "海洋星球糧食超多！",
          "但石同鐵會比較難搵。"
        ],
        idle: [
          "🐟 漁場產糧效率高。",
          "🚀 探索可以抽到稀有碎片。",
          "🎵 聽歌可以提高 AENO 掉落機率。"
        ],
        warning: [
          "⚠️ 你冇足夠礦產。",
          "⚠️ 你需要更多工人去建築。"
        ],
        success: [
          "海洋基地已建立！",
          "你已經掌握海洋資源優勢！"
        ]
      }
    },

    jungle: {
      id: "simia",
      displayName: "Simia",
      title: "叢林文明助手",
      species: "monkey",
      themeColor: "#16a34a",
      bodyStyle: {
        headType: "round",
        bodyType: "medium",
        earType: "round",
        tailType: "long",
        hasArms: true,
        hasLegs: true,
        eyeType: "cute",
        mouthType: "smile",
        clothingSlot: true,
        adBadge: true
      },
      dialogues: {
        greet: [
          "吱吱～我係 Simia 🐵",
          "叢林木材多，但野獸亦多。",
          "要 100% 城牆完整先會出獸潮。"
        ],
        idle: [
          "🌳 木多，適合早期發展。",
          "🦴 野獸碎片可以換 AENO 掉落機率。",
          "🛡️ 城牆升級好重要。"
        ],
        warning: [
          "⚠️ 野獸活動增加！",
          "⚠️ 你嘅防禦不足。"
        ],
        success: [
          "叢林文明成長得好快！",
          "你已經掌控叢林資源！"
        ]
      }
    }
  },

  // =========================
  // BLACK HOLE / DEVELOPER ISLAND
  // =========================
  blackHole: {
    id: "draco",
    displayName: "Draco",
    title: "黑洞孤島守護者",
    species: "dragon",
    themeColor: "#a855f7",

    bodyStyle: {
      headType: "dragon",
      bodyType: "long",
      earType: "horn",
      tailType: "dragon",
      hasArms: true,
      hasLegs: true,
      eyeType: "mystic",
      mouthType: "smile",
      clothingSlot: true,
      adBadge: false
    },

    dialogues: {
      greet: [
        "……你終於嚟到黑洞孤島。",
        "我係 Draco 🐉，呢度只屬於你。",
        "孤島全部土地都係你領土，全開放。"
      ],
      idle: [
        "黑洞孤島係開發者島。",
        "未來遷移需要 FTL 機器 + AENO 晶體。",
        "當全球 AENO 達到 6M，世界會出現大公告板。"
      ],
      warning: [
        "⚠️ 黑洞不允許普通玩家進入。",
        "⚠️ 只有你可以擁有母鑰權限（隱藏）。"
      ],
      success: [
        "你已經掌控黑洞規則。",
        "你係唯一真正的島主。"
      ]
    }
  }
};


// =========================
// Helper functions (optional)
// =========================

// Get assistant data by planetName
window.getAssistantForPlanet = function(planetName) {
  const p = (planetName || "").toLowerCase();
  if (p.includes("black") || p.includes("hole")) return window.AENO_CHARACTERS.blackHole;
  if (window.AENO_CHARACTERS.planetAssistants[p]) return window.AENO_CHARACTERS.planetAssistants[p];
  return window.AENO_CHARACTERS.defaultAssistant;
};
