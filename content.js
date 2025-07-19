console.log('content.js loaded!');
console.log('Tesseract:', typeof Tesseract);

let customKey = 'P';

// 저장된 키 불러오기
chrome.storage.local.get(['customKey'], (result) => {
  if (result.customKey) {
    customKey = result.customKey;
  }
});

// storage 값이 바뀌면 동기화
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.customKey) {
    customKey = changes.customKey.newValue;
  }
});

// // 네모 박스 생성 함수
// function showBox() {
//   if (document.getElementById('my-custom-box')) return; // 이미 있으면 생성하지 않음

//   const box = document.createElement('div');
//   box.id = 'my-custom-box';
//   Object.assign(box.style, {
//     position: 'fixed',
//     top: '30%',
//     left: '50%',
//     transform: 'translate(-50%, -50%)',
//     width: '180px',
//     height: '140px',
//     background: '#4a90e2',
//     color: '#fff',
//     fontSize: '2em',
//     textAlign: 'center',
//     lineHeight: '140px',
//     borderRadius: '16px',
//     zIndex: 999999,
//     boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
//   });

//   // 닫기 버튼
//   const closeBtn = document.createElement('span');
//   closeBtn.textContent = '×';
//   Object.assign(closeBtn.style, {
//     position: 'absolute',
//     top: '8px',
//     right: '14px',
//     fontSize: '1.3em',
//     color: '#fff',
//     cursor: 'pointer',
//     fontWeight: 'bold',
//     zIndex: 1000000
//   });
//   closeBtn.addEventListener('click', () => {
//     box.remove();
//   });

//   box.appendChild(closeBtn);

//   // 내용
//   const content = document.createElement('div');
//   content.textContent = '네모!';
//   content.style.userSelect = 'none';
//   box.appendChild(content);

//   document.body.appendChild(box);
// }

// // 네모 박스 닫기 함수
// function hideBox() {
//   const box = document.getElementById('my-custom-box');
//   if (box) box.remove();
// }

// // 키 입력 감지
// window.addEventListener('keydown', (e) => {
//   let pressedKey = '';
//   if (e.code.startsWith('Key')) {
//     pressedKey = e.code.replace('Key', '').toUpperCase();
//   } else if (e.code.startsWith('Digit')) {
//     pressedKey = e.code.replace('Digit', '');
//   } else {
//     pressedKey = e.code;
//   }

//   if (pressedKey === customKey) {
//     const box = document.getElementById('my-custom-box');
//     if (box) {
//       // 이미 네모가 있으면 닫기
//       hideBox();
//     } else {
//       // 없으면 띄우기
//       showBox();
//     }
//   }
// });

const worker = Tesseract.createWorker({
    workerPath: chrome.runtime.getURL('libs/worker.min.js'),
    corePath: chrome.runtime.getURL('libs/'), // 디렉토리 경로!
    langPath: chrome.runtime.getURL('libs/'),
    workerBlobURL: false
  });

// 2. 저장된 키 불러오기 (storage 사용 안 하면 'P'로 고정)
chrome.storage?.local.get(['customKey'], (result) => {
  if (result?.customKey) customKey = result.customKey;
});
chrome.storage?.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.customKey) {
    customKey = changes.customKey.newValue;
  }
});

// 3. 네모박스 생성/업데이트 함수
function showBox(text) {
  let box = document.getElementById('my-custom-box');
  if (!box) {
    box = document.createElement('div');
    box.id = 'my-custom-box';
    Object.assign(box.style, {
      position: 'fixed',
      top: '30%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '340px',
      minHeight: '100px',
      background: '#4a90e2',
      color: '#fff',
      fontSize: '1.3em',
      textAlign: 'center',
      padding: '30px 20px',
      borderRadius: '16px',
      zIndex: 999999,
      boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
    });
    // 닫기 버튼
    const closeBtn = document.createElement('span');
    closeBtn.textContent = '×';
    Object.assign(closeBtn.style, {
      position: 'absolute',
      top: '8px',
      right: '18px',
      fontSize: '1.4em',
      color: '#fff',
      cursor: 'pointer',
      fontWeight: 'bold'
    });
    closeBtn.onclick = () => box.remove();
    box.appendChild(closeBtn);

    // 텍스트 영역
    const textDiv = document.createElement('div');
    textDiv.id = 'ocr-result-text';
    box.appendChild(textDiv);

    document.body.appendChild(box);
  }
  box.querySelector('#ocr-result-text').textContent = text;
}

// 4. canvas에서 특정 영역을 잘라 OCR하기
async function ocrFromCanvas(canvas, left, top, width, height) {
    // 잘라낼 영역을 별도 캔버스에 복사
    const subCanvas = document.createElement('canvas');
    subCanvas.width = width;
    subCanvas.height = height;
    const subCtx = subCanvas.getContext('2d');
    subCtx.drawImage(canvas, left, top, width, height, 0, 0, width, height);
  
    // OCR 실행
    await worker.load();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    const { data: { text } } = await worker.recognize(subCanvas);
    await worker.terminate();
    return text.trim();
  }

// 5. 키 입력 감지
window.addEventListener('keydown', async (e) => {
  let pressedKey = '';
  if (e.code.startsWith('Key')) {
    pressedKey = e.code.replace('Key', '').toUpperCase();
  } else if (e.code.startsWith('Digit')) {
    pressedKey = e.code.replace('Digit', '');
  } else {
    pressedKey = e.code;
  }

  if (pressedKey === customKey) {
    // 1) 대상 canvas 선택 (예: 첫 번째 canvas)
    const canvas = document.querySelector('canvas');
    if (!canvas) {
      showBox('canvas를 찾을 수 없습니다.');
      return;
    }

    // 2) OCR할 영역 좌표 지정 (예: x=100, y=100, w=200, h=50)
    const sx = 50, sy = 200, sw = 400, sh = 50; // 원하는 영역으로 수정

    // 3) Tesseract.js가 로드될 때까지 대기
    if (typeof Tesseract === 'undefined') {
      showBox('OCR 엔진 로딩 중...');
      await new Promise(res => setTimeout(res, 1000));
      if (typeof Tesseract === 'undefined') {
        showBox('OCR 엔진이 준비되지 않았습니다.');
        return;
      }
    }

    // 4) OCR 실행 및 결과 표시
    showBox('텍스트 추출 중...');
    try {
      const text = await ocrFromCanvas(canvas, sx, sy, sw, sh);
      showBox(text || '텍스트를 인식하지 못했습니다.');
    } catch (err) {
      showBox('OCR 오류: ' + err.message);
    }
  }
});
