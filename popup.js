// 팝업 열 때 background에서 현재 상태 받아오기
chrome.runtime.sendMessage({type: "getDarkMode"}, (response) => {
    document.getElementById('toggle').checked = response.enabled;
  });
  
  // 토글 변경 시 background에 상태 전달
  document.getElementById('toggle').addEventListener('change', function() {
    chrome.runtime.sendMessage({type: "setDarkMode", enabled: this.checked});
  });
  
  const toggle = document.getElementById('toggle');

toggle.addEventListener('change', function() {
  if (this.checked) {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }
});

window.addEventListener('DOMContentLoaded', () => {
    if (toggle.checked) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  });





  // p
  const setKeyBtn = document.getElementById('setKeyBtn');
const info = document.getElementById('info');
let waitingForKey = false;
let currentKey = 'P';

// 팝업이 열릴 때 저장된 키 불러오기
chrome.storage.local.get(['customKey'], (result) => {
  if (result.customKey) {
    currentKey = result.customKey;
  }
  setKeyBtn.textContent = currentKey;
});

// 버튼 클릭 시 키 입력 대기
setKeyBtn.addEventListener('click', () => {
  waitingForKey = true;
  setKeyBtn.textContent = '입력 대기 중...';
  info.textContent = '변경할 키를 눌러주세요!';
});

// 키 입력 감지
document.addEventListener('keydown', (e) => {
  if (!waitingForKey) return;

  // 한 글자 키만 허용 (예: A, B, 1 등)
  if (e.code.startsWith('Key')) {
    currentKey = e.code.replace('Key', '').toUpperCase(); // 예: 'KeyA' → 'A'
  } else if (e.code.startsWith('Digit')) {
    currentKey = e.code.replace('Digit', ''); // 예: 'Digit1' → '1'
  } else {
    currentKey = e.code; // 기타: Space, Enter 등
  }

  chrome.storage.local.set({ customKey: currentKey }, () => {
    setKeyBtn.textContent = currentKey;
    info.textContent = `저장되었습니다: ${currentKey}`;
    waitingForKey = false;
  });
});