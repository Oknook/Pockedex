let darkModeEnabled = false;
// dark mode 전환
// popup에서 상태 요청 시 응답
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "getDarkMode") {
    sendResponse({enabled: darkModeEnabled});
    console.log("get");
    
  }
  if (message.type === "setDarkMode") {
    darkModeEnabled = message.enabled;
    // 필요하다면 여기서 다른 동작(예: 탭에 메시지 전송)도 추가 가능
    console.log("set");
    
  }
});