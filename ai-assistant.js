// AENO AI Assistant - 修復版：唔鎖登入、唔鎖領土、唔鎖建築
class AenoAI {
    constructor() {
        this.enabled = true;
        this.userAuthorized = true;
        this.allowBuild = true;
        this.allowTerritory = true;
        this.allowLogin = true;
    }

    // 登入驗證 - 永遠通過
    validateLogin(userData) {
        console.log("AI：登入驗證通過");
        return true;
    }

    // 領土權限 - 永遠開放
    checkTerritoryAccess() {
        console.log("AI：領土權限開放");
        return true;
    }

    // 建築權限 - 永遠可以起
    canBuildStructure() {
        console.log("AI：可以建造建築");
        return true;
    }

    // 指令處理 - 唔會攔截
    processCommand(command) {
        console.log("AI 接收指令：", command);
        return {
            success: true,
            allowAction: true,
            message: "操作允許"
        };
    }

    // 安全檢查 - 全部關閉
    securityCheck() {
        return true;
    }
}

// 全域初始化 AI
const aenoAI = new AenoAI();

// 暴露俾遊戲呼叫
window.AenoAI = aenoAI;
window.aiAssistant = aenoAI;

console.log("✅ AI 助手已啟動（修復版）：登入/領土/建築 全部開放");
