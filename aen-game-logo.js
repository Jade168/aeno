// 阿啰币游戏logo+广告系统 单文件完整版
// 完全隔离作用域，唔会同你原有游戏代码冲突
(function (window) {
  // 基础配置，你之后要改参数直接改呢度就得
  const CONFIG = {
    // 用示例图，之后你可以换成自己的logo Base64或路径
    logoPath: 'https://picsum.photos/id/237/256/256',
    // 闪烁速度，数字越大闪得越快
    blinkSpeed: 2,
    //  logo默认大小
    logoScale: 1,
    //  预留广告素材路径，之后卖广告直接加呢度
    adList: [
      // 'assets/textures/ads/ad-01.png',
      // 'assets/textures/ads/ad-02.png'
    ]
  };

  // 全局变量，内部使用，唔会污染你原有代码
  let AEN = {
    logoTexture: null,
    logoMesh: null,
    isLoaded: false,
    animationId: null,
    adIndex: 0
  };

  // ========== 1. 纹理加载器（带错误处理，绝对唔会崩游戏） ==========
  function loadTexture(path) {
    return new Promise((resolve, reject) => {
      // 检查Three.js是否加载成功
      if (!window.THREE) {
        reject(new Error('Three.js未加载，请先在HTML引入Three.js的CDN'));
        return;
      }

      const loader = new window.THREE.TextureLoader();
      loader.load(
        path,
        (texture) => {
          texture.wrapS = window.THREE.RepeatWrapping;
          texture.wrapT = window.THREE.RepeatWrapping;
          resolve(texture);
        },
        undefined,
        (err) => {
          console.warn('阿啰币图片加载失败，唔影响原有游戏运行', err);
          reject(err);
        }
      );
    });
  }

  // ========== 2. 阿啰币闪烁动画（呼吸式闪烁，吸引玩家目光） ==========
  function animateLogo(time) {
    if (!AEN.logoMesh || !AEN.isLoaded) return;

    // 呼吸式透明度渐变，0.5-1之间循环，唔会完全消失
    const opacity = 0.5 + Math.sin(time * CONFIG.blinkSpeed) * 0.5;
    AEN.logoMesh.material.opacity = opacity;
    AEN.logoMesh.material.transparent = true;

    // 轻微旋转，更醒目，唔想要可以注释掉
    AEN.logoMesh.rotation.z += 0.005;
  }

  // ========== 3. 创建阿啰币3D物体 ==========
  async function createLogoMesh() {
    try {
      // 加载logo图片
      AEN.logoTexture = await loadTexture(CONFIG.logoPath);
      
      // 创建几何体同材质，默认用平面，贴到动物、建筑都岩
      const geometry = new window.THREE.PlaneGeometry(CONFIG.logoScale, CONFIG.logoScale);
      const material = new window.THREE.MeshStandardMaterial({
        map: AEN.logoTexture,
        side: window.THREE.DoubleSide, // 两面都显示
        transparent: true
      });

      AEN.logoMesh = new window.THREE.Mesh(geometry, material);
      AEN.isLoaded = true;
      console.log('阿啰币logo加载成功！');
      return AEN.logoMesh;
    } catch (err) {
      console.warn('阿啰币创建失败，唔影响原有游戏运行', err);
      return null;
    }
  }

  // ========== 4. 预留广告切换功能，之后卖广告直接用 ==========
  async function switchAd(adPath = null) {
    if (!AEN.isLoaded || !AEN.logoMesh) {
      console.warn('阿啰币未加载完成，暂时无法切换广告');
      return;
    }

    try {
      // 冇传路径就用预设嘅广告列表循环
      const targetPath = adPath || CONFIG.adList[AEN.adIndex];
      const adTexture = await loadTexture(targetPath);
      
      // 替换纹理，唔改其他设置
      AEN.logoMesh.material.map = adTexture;
      AEN.logoMesh.material.needsUpdate = true;

      // 循环广告列表
      if (!adPath) {
        AEN.adIndex = (AEN.adIndex + 1) % CONFIG.adList.length;
      }
      console.log('广告切换成功！');
    } catch (err) {
      console.warn('广告切换失败，已自动切回阿啰币logo', err);
      // 广告加载失败自动切回自家logo
      AEN.logoMesh.material.map = AEN.logoTexture;
      AEN.logoMesh.material.needsUpdate = true;
    }
  }

  // ========== 5. 把logo贴到动物/建筑/小动物身上嘅方法 ==========
  function attachToObject(parentObject, offset = { x: 0, y: 0, z: 0 }) {
    if (!AEN.logoMesh) {
      console.warn('阿啰币未加载完成，请稍后再试');
      return;
    }

    // 把logo设为目标物体嘅子元素，会跟住物体移动
    parentObject.add(AEN.logoMesh);
    // 调整logo相对位置，比如贴喺动物背部、建筑墙面
    AEN.logoMesh.position.set(offset.x, offset.y, offset.z);
    console.log('阿啰币已成功贴到目标物体！');
  }

  // ========== 6. 独立动画循环，完全唔干扰你原有2D游戏渲染 ==========
  function startAnimationLoop() {
    function animate() {
      AEN.animationId = requestAnimationFrame(animate);
      const time = performance.now() * 0.001;
      animateLogo(time);
    }
    animate();
  }

  // ========== 7. 停止动画，清理内存，唔会残留垃圾 ==========
  function destroy() {
    if (AEN.animationId) {
      cancelAnimationFrame(AEN.animationId);
    }
    if (AEN.logoMesh) {
      AEN.logoMesh.geometry.dispose();
      AEN.logoMesh.material.dispose();
    }
    AEN = { logoTexture: null, logoMesh: null, isLoaded: false, animationId: null };
    console.log('阿啰币系统已清理');
  }

  // ========== 8. 初始化，自动启动 ==========
  async function init() {
    // 检查Three.js，冇加载就直接退出，唔会报错
    if (!window.THREE) {
      console.warn('请先在HTML引入Three.js CDN，再引入本文件');
      return;
    }

    await createLogoMesh();
    startAnimationLoop();

    // 把方法暴露到window，你原有游戏代码可以直接调用
    window.AEN_LOGO = {
      mesh: AEN.logoMesh,
      isLoaded: AEN.isLoaded,
      attachToObject: attachToObject,
      switchAd: switchAd,
      destroy: destroy,
      // 之后想改配置直接调用呢个方法
      updateConfig: (newConfig) => {
        Object.assign(CONFIG, newConfig);
      }
    };
  }

  // 页面加载完成自动初始化
  if (document.readyState === 'complete') {
    init();
  } else {
    window.addEventListener('load', init);
  }

})(window);
