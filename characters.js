class CharacterManager {
  constructor(scene) {
    this.scene = scene;
    this.char = null;
  }

  createAnimeCharacter(x, y) {
    const char = this.scene.add.circle(x, y, 26, 0xffb6e1).setStrokeStyle(4, 0x222);
    this.scene.tweens.add({
      targets: char,
      scale: 1.1,
      duration: 900,
      yoyo: true,
      repeat: -1
    });
    this.char = char;
    return char;
  }
}
