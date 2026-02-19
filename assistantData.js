// assistantData.js
// AENO Assistants - Cute Animal AI NPC

(() => {
  "use strict";

  const ASSISTANTS = {
    earth: {
      displayName: "AENO·Lupus",
      species: "wolf",
      dialogues: {
        idle: [
          "🐺 我係 Lupus，你嘅星域護衛。",
          "今日你學咗新發音未？",
          "要唔要派機器人去探索？"
        ]
      }
    },
    mars: {
      displayName: "AENO·Neko",
      species: "cat",
      dialogues: {
        idle: [
          "🐱 喵～歡迎來到日本星球！",
          "你嘅文明正在成長～",
          "發音越準，AENO 越易掉落！"
        ]
      }
    },
    ocean: {
      displayName: "AENO·Dolphinus",
      species: "dolphin",
      dialogues: {
        idle: [
          "🐬 Bonjour～你準備好學法語未？",
          "深海有稀有資源。",
          "我會幫你翻譯一切！"
        ]
      }
    },
    jungle: {
      displayName: "AENO·Simia",
      species: "monkey",
      dialogues: {
        idle: [
          "🐵 哈哈！叢林星球好多寶物！",
          "要小心獸潮。",
          "你嘅建築可以升級變靚～"
        ]
      }
    },

    planet05: { displayName: "AENO·Ursus", species: "bear", dialogues: { idle: ["🐻 德國工業文明，效率至上！"] } },
    planet06: { displayName: "AENO·Felix", species: "cat", dialogues: { idle: ["🐱 意大利星球：藝術與建築之都。"] } },
    planet07: { displayName: "AENO·Draco", species: "dragon", dialogues: { idle: ["🐉 俄羅斯星球寒冷而強大。"] } },
    planet08: { displayName: "AENO·Tigris", species: "wolf", dialogues: { idle: ["🐺 韓國星球：科技文明快速進化。"] } },

    planet09: { displayName: "AENO·Bunny", species: "cat", dialogues: { idle: ["🐱 泰國星球：熱帶農業天堂。"] } },
    planet10: { displayName: "AENO·Lotus", species: "dolphin", dialogues: { idle: ["🐬 越南星球：水稻與海岸。"] } },
    planet11: { displayName: "AENO·Indra", species: "dragon", dialogues: { idle: ["🐉 印度星球：古文明的智慧。"] } },
    planet12: { displayName: "AENO·Sphinx", species: "bear", dialogues: { idle: ["🐻 阿拉伯星球：沙漠與石油之力。"] } },

    planet13: { displayName: "AENO·Rio", species: "monkey", dialogues: { idle: ["🐵 巴西星球：森林與黃金。"] } },
    planet14: { displayName: "AENO·Cactus", species: "wolf", dialogues: { idle: ["🐺 墨西哥星球：沙漠與古代遺跡。"] } },
    planet15: { displayName: "AENO·Athena", species: "cat", dialogues: { idle: ["🐱 希臘星球：神話與哲學。"] } },
    planet16: { displayName: "AENO·Ottoman", species: "bear", dialogues: { idle: ["🐻 土耳其星球：東西交界之門。"] } },

    planet17: { displayName: "AENO·Nord", species: "wolf", dialogues: { idle: ["🐺 北歐星球：冰雪與極光。"] } },
    planet18: { displayName: "AENO·Koala", species: "bear", dialogues: { idle: ["🐻 澳洲星球：可愛但危險。"] } },
    planet19: { displayName: "AENO·Safari", species: "lion", dialogues: { idle: ["🦁 非洲星球：野獸之王的領土。"] } },
    planet20: { displayName: "AENO·Yue", species: "cat", dialogues: { idle: ["🐱 中原星球：粵語文明核心。"] } },

    blackhole: {
      displayName: "AENO·Genesis",
      species: "dragon",
      dialogues: {
        idle: [
          "🐉 你已踏入黑洞核心…",
          "元界守護者正在沉睡。",
          "AENO 母鑰在此等待你。"
        ]
      }
    }
  };

  window.getAssistantForPlanet = function(planetId){
    return ASSISTANTS[planetId] || ASSISTANTS.earth;
  };

})();
