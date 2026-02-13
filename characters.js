// characters.js - 量子行星文明模擬 角色與動畫模組
class CharacterManager {
  constructor(scene) {
    this.scene = scene;
    this.characters = new Map();
  }

  // 創建動漫風格角色
  createAnimeCharacter(key, x, y, name) {
    const character = this.scene.add.sprite(x, y, key).setScale(2);
    
    // 呼吸動畫（動漫常見效果）
    this.scene.tweens.add({
      targets: character,
      y: character.y - 10,
      duration: 1200,
      yoyo: true,
      repeat: -1
    });

    // 輕微閃爍光效
    this.scene.tweens.add({
      targets: character,
      alpha: 0.8,
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    this.characters.set(name, character);
    return character;
  }

  // 角色移動動畫
  moveCharacter(name, targetX, targetY, speed = 2000) {
    const character = this.characters.get(name);
    if (!character) return;

    this.scene.tweens.add({
      targets: character,
      x: targetX,
      y: targetY,
      duration: speed,
      ease: 'Power1'
    });
  }

  // 角色表情變化（動漫風格）
  setEmotion(name, emotion) {
    const character = this.characters.get(name);
    if (!character) return;

    switch (emotion) {
      case 'happy':
        character.setTint(0xffffcc);
        break;
      case 'sad':
        character.setTint(0x6666ff);
        break;
      case 'angry':
        character.setTint(0xff6666);
        break;
      default:
        character.clearTint();
    }

    // 表情動畫
    this.scene.tweens.add({
      targets: character,
      scale: 2.2,
      duration: 200,
      yoyo: true
    });
  }
}

// 匯出模組，方便喺 game.js 入面使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CharacterManager;
}
