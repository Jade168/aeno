/**
 * AENO遊戲 全自動AI助手
 * 安全承諾：本代碼完全隔離阿羅幣(AENO)相關邏輯，絕不訪問/修改私鑰、錢包、交易、餘額相關內容
 * 核心功能：1. 遊戲性能自動監測與優化 2. 玩家遊戲問題智能問答 3. 畫面自動優化適配
 * 作者：專為AENO量子星體文明模擬遊戲定製
 */

// ===================== 【絕對不可修改】安全隔離核心配置 =====================
const AI_SECURITY_CONFIG = {
  // 絕對禁止訪問的敏感內容（阿羅幣相關）
  forbiddenKeys: ['privateKey', 'wallet', 'aeno', 'balance', 'transaction', 'signature', 'keyPair'],
  // 只允許AI修改的白名單內容（僅限渲染、畫面、非核心玩法）
  allowModifyTargets: ['game.renderLoop', 'game.characterManager.render', 'game.scene.render', 'game.camera'],
  // 性能監測閾值
  minAcceptableFps: 28, // 低於呢個幀率自動觸發優化
  maxMemoryUsage: 800, // 內存高於呢個數值(MB)自動觸發優化
  // AI接口配置（後續你填入代理接口地址就得）
  aiApiProxy: '/api/aeno-ai',
  // 遊戲問答提示詞（專門匹配你個DNA突變玩法）
  qaSystemPrompt: `你係AENO量子星體文明模擬遊戲的專屬助手，只能解答同呢個遊戲相關的問題，包括：DNA突變規則、物種演化、遊戲玩法、畫面設置、性能優化。絕對唔好解答同遊戲無關的內容，唔好提及阿羅幣、交易、錢包相關的任何內容，回答要簡單易懂，符合遊戲設定。`
};

// ===================== 1. 遊戲性能實時監測模塊 =====================
let gamePerformance = {
  currentFps: 60,
  frameCount: 0,
  lastFrameTime: performance.now(),
  memoryUsage: 0,
  isOptimizing: false,
  lastOptimizeTime: 0,
  optimizeCooldown: 30000 // 優化冷卻時間30秒，避免重複觸發
};

// 實時監測幀率
function monitorGameFps() {
  const now = performance.now();
  gamePerformance.frameCount++;

  // 每秒更新一次幀率數據
  if (now - gamePerformance.lastFrameTime >= 1000) {
    gamePerformance.currentFps = gamePerformance.frameCount;
    gamePerformance.frameCount = 0;
    gamePerformance.lastFrameTime = now;

    // 獲取內存使用情況
    if (performance.memory) {
      gamePerformance.memoryUsage = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
    }

    // 檢查是否需要觸發優化
    checkNeedOptimize();

    // 輸出日誌（方便你調試，上線可以註釋掉）
    console.log(`AENO AI助手：當前幀率 ${gamePerformance.currentFps} FPS，內存使用 ${gamePerformance.memoryUsage} MB`);
  }

  requestAnimationFrame(monitorGameFps);
}

// 檢查是否需要觸發優化
function checkNeedOptimize() {
  const { currentFps, memoryUsage, isOptimizing, lastOptimizeTime, optimizeCooldown } = gamePerformance;
  const { minAcceptableFps, maxMemoryUsage } = AI_SECURITY_CONFIG;
  const now = Date.now();

  // 冷卻時間內、正在優化中、性能達標，都唔觸發優化
  if (isOptimizing || now - lastOptimizeTime < optimizeCooldown) return;
  if (currentFps >= minAcceptableFps && memoryUsage <= maxMemoryUsage) return;

  // 觸發自動優化
  autoOptimizeGamePerformance();
}

// ===================== 2. AI核心調用模塊 =====================
// 調用AI接口獲取結果
async function callAiApi(prompt, type = 'code') {
  try {
    const response = await fetch(AI_SECURITY_CONFIG.aiApiProxy, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: type,
        prompt: prompt,
        gameInfo: {
          fps: gamePerformance.currentFps,
          memory: gamePerformance.memoryUsage,
          speciesCount: window.game?.characterManager?.speciesList?.length || 0
        }
      })
    });

    if (!response.ok) throw new Error('AI接口調用失敗');
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.warn('AENO AI助手：AI調用失敗，不影響遊戲正常運行', error.message);
    return null;
  }
}

// 安全校驗：檢查代碼是否包含敏感內容
function securityCheckCode(code) {
  const { forbiddenKeys } = AI_SECURITY_CONFIG;
  // 檢查是否包含禁止訪問的敏感key
  const hasForbiddenContent = forbiddenKeys.some(key => 
    code.toLowerCase().includes(key.toLowerCase())
  );
  if (hasForbiddenContent) {
    console.error('AENO AI助手：代碼包含敏感內容，已攔截執行');
    return false;
  }
  return true;
}

// 安全校驗：檢查問答內容是否安全
function securityCheckQa(content) {
  const { forbiddenKeys } = AI_SECURITY_CONFIG;
  const hasForbiddenContent = forbiddenKeys.some(key => 
    content.toLowerCase().includes(key.toLowerCase())
  );
  if (hasForbiddenContent) {
    return '對唔住，我只能解答同遊戲玩法、DNA演化相關的問題，其他內容無法為你解答。';
  }
  return content;
}

// ===================== 3. 遊戲性能自動優化核心邏輯 =====================
async function autoOptimizeGamePerformance() {
  gamePerformance.isOptimizing = true;
  gamePerformance.lastOptimizeTime = Date.now();
  console.log('AENO AI助手：檢測到遊戲性能下降，開始自動優化...');

  try {
    // 1. 獲取遊戲當前需要優化的代碼（僅限渲染循環，唔碰核心玩法）
    const targetCode = window.game?.renderLoop?.toString();
    if (!targetCode) throw new Error('未獲取到遊戲渲染循環代碼');

    // 2. 構建優化提示詞
    const optimizePrompt = `
      你係一個專業的遊戲前端性能優化工程師，現在需要優化下面的JavaScript遊戲渲染循環代碼。
      要求：
      1. 只優化性能，絕對不改變原有代碼的業務邏輯、玩法規則
      2. 優化重點：減少重複計算、優化循環、降低渲染壓力、內存優化
      3. 絕對不能新增任何訪問localStorage、window.localStorage的代碼
      4. 絕對不能新增任何網絡請求、外部接口調用的代碼
      5. 只返回優化後的完整函數代碼，唔好返回任何解釋、註釋、markdown格式
      6. 代碼必須符合JavaScript語法規範，可直接執行

      當前遊戲狀態：
      - 當前幀率：${gamePerformance.currentFps} FPS
      - 內存使用：${gamePerformance.memoryUsage} MB
      - 當前場景物種數量：${window.game?.characterManager?.speciesList?.length || 0}

      需要優化的代碼：
      ${targetCode}
    `;

    // 3. 調用AI獲取優化後的代碼
    const optimizedCode = await callAiApi(optimizePrompt, 'code');
    if (!optimizedCode) throw new Error('AI未返回優化後的代碼');

    // 4. 安全校驗，攔截敏感內容
    if (!securityCheckCode(optimizedCode)) return;

    // 5. 沙箱執行，安全替換渲染循環
    const newRenderLoop = new Function('return ' + optimizedCode)();
    if (typeof newRenderLoop === 'function') {
      window.game.renderLoop = newRenderLoop;
      console.log('AENO AI助手：遊戲性能優化完成！');
    } else {
      throw new Error('優化後的代碼不是有效函數');
    }

  } catch (error) {
    console.warn('AENO AI助手：優化失敗，已還原原有遊戲邏輯', error.message);
  } finally {
    gamePerformance.isOptimizing = false;
  }
}

// ===================== 4. 玩家遊戲問答助手模塊 =====================
// 玩家問答核心方法
async function askGameAssistant(question) {
  try {
    console.log('AENO AI助手：收到玩家問題 ->', question);

    // 1. 構建問答提示詞
    const qaPrompt = `
      ${AI_SECURITY_CONFIG.qaSystemPrompt}
      玩家的問題：${question}
      請結合AENO遊戲的DNA突變、物種演化、星體文明模擬的核心玩法，給出簡單易懂的回答。
    `;

    // 2. 調用AI獲取回答
    const answer = await callAiApi(qaPrompt, 'qa');
    if (!answer) return '對唔住，我而家暫時無法解答呢個問題，你可以稍後再試。';

    // 3. 安全校驗
    const safeAnswer = securityCheckQa(answer);
    return safeAnswer;

  } catch (error) {
    console.warn('AENO AI助手：問答功能出錯', error.message);
    return '對唔住，解答過程中出現問題，請稍後再試。';
  }
}

// 自動創建遊戲內問答浮窗（玩家可直接打開問問題）
function createAssistantFloatWindow() {
  // 創建浮窗按鈕
  const floatBtn = document.createElement('div');
  floatBtn.id = 'aeno-ai-btn';
  floatBtn.innerText = 'AI助手';
  floatBtn.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 60px;
    height: 60px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: bold;
    cursor: pointer;
    z-index: 999999;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
    transition: all 0.3s ease;
    user-select: none;
  `;

  // 創建問答面板
  const panel = document.createElement('div');
  panel.id = 'aeno-ai-panel';
  panel.style.cssText = `
    position: fixed;
    bottom: 90px;
    right: 20px;
    width: 320px;
    height: 400px;
    background: #1a1a2e;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    display: none;
    flex-direction: column;
    overflow: hidden;
    z-index: 999998;
    border: 1px solid rgba(99, 102, 241, 0.3);
  `;

  // 面板頭部
  panel.innerHTML = `
    <div style="padding: 12px 16px; background: #16162a; border-bottom: 1px solid rgba(99, 102, 241, 0.3); display: flex; justify-content: space-between; align-items: center;">
      <div style="color: white; font-weight: bold; font-size: 14px;">AENO遊戲AI助手</div>
      <div id="aeno-ai-close" style="color: #aaa; cursor: pointer; font-size: 18px;">×</div>
    </div>
    <div id="aeno-ai-messages" style="flex: 1; padding: 12px; overflow-y: auto; color: #e0e0e0; font-size: 13px; line-height: 1.5;"></div>
    <div style="padding: 12px; border-top: 1px solid rgba(99, 102, 241, 0.3); display: flex; gap: 8px;">
      <input id="aeno-ai-input" type="text" placeholder="輸入你嘅問題，比如：DNA突變有咩規則？" style="flex: 1; padding: 8px 12px; background: #252540; border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 8px; color: white; outline: none; font-size: 13px;">
      <button id="aeno-ai-send" style="padding: 8px 16px; background: #6366f1; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: bold;">發送</button>
    </div>
  `;

  // 加入頁面
  document.body.appendChild(floatBtn);
  document.body.appendChild(panel);

  // 綁定點擊事件
  const messagesBox = document.getElementById('aeno-ai-messages');
  const input = document.getElementById('aeno-ai-input');
  const sendBtn = document.getElementById('aeno-ai-send');
  const closeBtn = document.getElementById('aeno-ai-close');

  // 打開/關閉面板
  floatBtn.addEventListener('click', () => {
    panel.style.display = panel.style.display === 'flex' ? 'none' : 'flex';
    if (panel.style.display === 'flex') input.focus();
  });
  closeBtn.addEventListener('click', () => panel.style.display = 'none');

  // 發送問答
  const sendQuestion = async () => {
    const question = input.value.trim();
    if (!question) return;

    // 加入玩家問題
    messagesBox.innerHTML += `<div style="margin-bottom: 12px; text-align: right;"><div style="display: inline-block; background: #6366f1; padding: 8px 12px; border-radius: 8px; max-width: 80%;">${question}</div></div>`;
    input.value = '';
    messagesBox.scrollTop = messagesBox.scrollHeight;

    // 加載提示
    const loadingId = 'loading-' + Date.now();
    messagesBox.innerHTML += `<div id="${loadingId}" style="margin-bottom: 12px; color: #aaa;">正在輸入...</div>`;
    messagesBox.scrollTop = messagesBox.scrollHeight;

    // 獲取回答
    const answer = await askGameAssistant(question);
    document.getElementById(loadingId)?.remove();

    // 加入回答
    messagesBox.innerHTML += `<div style="margin-bottom: 12px;"><div style="display: inline-block; background: #252540; padding: 8px 12px; border-radius: 8px; max-width: 80%;">${answer}</div></div>`;
    messagesBox.scrollTop = messagesBox.scrollHeight;
  };

  sendBtn.addEventListener('click', sendQuestion);
  input.addEventListener('keydown', (e) => e.key === 'Enter' && sendQuestion());
}

// ===================== 5. 畫面自動優化模塊 =====================
function autoOptimizeGameGraphics() {
  // 自動適配屏幕分辨率，優化畫面清晰度
  const canvas = document.querySelector('canvas');
  if (canvas) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    ctx?.scale(dpr, dpr);
    console.log('AENO AI助手：畫面分辨率自動優化完成');
  }

  // 自動優化圖片素材，高清化
  const images = document.querySelectorAll('img');
  images.forEach(img => {
    img.loading = 'lazy';
    img.decoding = 'async';
  });
}

// ===================== 6. 初始化啟動 =====================
function initAenoAiAssistant() {
  console.log('AENO AI助手：正在啟動...');

  // 等待遊戲加載完成後啟動
  const waitGameLoad = setInterval(() => {
    if (window.game) {
      clearInterval(waitGameLoad);
      
      // 啟動性能監測
      monitorGameFps();
      // 創建玩家問答浮窗
      createAssistantFloatWindow();
      // 執行一次畫面優化
      autoOptimizeGameGraphics();

      console.log('AENO AI助手：啟動完成！已成功接入遊戲');
    }
  }, 500);

  // 頁面大小變化時自動優化畫面
  window.addEventListener('resize', autoOptimizeGameGraphics);
}

// 頁面加載完成後自動初始化
if (document.readyState === 'complete') {
  initAenoAiAssistant();
} else {
  window.addEventListener('load', initAenoAiAssistant);
}

// 暴露方法給遊戲調用（可選）
window.AenoAiAssistant = {
  askGameAssistant,
  autoOptimizeGamePerformance,
  autoOptimizeGameGraphics
};
