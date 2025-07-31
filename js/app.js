// 메인 애플리케이션 로직

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // 파일 입력 이벤트
    const fileInput = document.getElementById('file-input');
    const uploadArea = document.getElementById('upload-area');
    
    fileInput.addEventListener('change', handleFileSelect);
    
    // 드래그 앤 드롭 이벤트
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleFileDrop);
    
    // 정렬 버튼 이벤트
    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.addEventListener('click', handleSortChange);
    });
}

// 파일 선택 처리
function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    processFiles(files);
}

// 드래그 오버
function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
}

// 드래그 떠남
function handleDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}

// 파일 드롭
function handleFileDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
}

// 파일 처리
function processFiles(files) {
    // 이미지 파일만 필터링
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
        alert('이미지 파일을 선택해주세요.');
        return;
    }
    
    if (imageFiles.length > 20) {
        alert('최대 20개까지만 업로드할 수 있습니다.');
        imageFiles.splice(20);
    }
    
    // 기존 파일에 추가
    currentFiles = [...currentFiles, ...imageFiles];
    
    // 현재 정렬 모드로 정렬
    sortFiles(sortMode);
    
    // UI 전환
    document.getElementById('upload-section').classList.add('hidden');
    document.getElementById('sort-section').classList.remove('hidden');
}

// 정렬 모드 변경
function handleSortChange(e) {
    const newMode = e.target.dataset.mode;
    sortMode = newMode;
    
    // 버튼 활성화 상태 변경
    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    e.target.classList.add('active');
    
    // 모드 정보 업데이트
    const modeInfo = document.getElementById('mode-info');
    const modeTexts = {
        'desc': '💡 현재 모드: 파일명 내림차순',
        'asc': '💡 현재 모드: 파일명 오름차순',
        'manual': '💡 현재 모드: 드래그로 순서 변경 - 이미지를 드래그하여 원하는 위치로 이동하세요.',
        'number': '🔢 현재 모드: 번호 직접 입력 - 각 이미지의 번호를 변경하여 순서를 조정하세요.'
    };
    modeInfo.innerHTML = modeTexts[newMode];
    
    // 정렬 적용
    if (newMode === 'asc' || newMode === 'desc') {
        sortFiles(newMode);
    } else {
        renderFiles(); // manual, number 모드는 재렌더링만
    }
}

// 전체 초기화
function resetAll() {
    if (confirm('모든 이미지와 설정을 초기화하시겠습니까?')) {
        currentFiles = [];
        sortMode = 'desc';
        document.getElementById('project-title').value = '';
        document.getElementById('file-input').value = '';
        
        // 활성 버튼 초기화
        document.querySelectorAll('.sort-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector('[data-mode="desc"]').classList.add('active');
        
        // UI 전환
        document.getElementById('sort-section').classList.add('hidden');
        document.getElementById('upload-section').classList.remove('hidden');
        
        // 메모리 정리
        document.querySelectorAll('.file-preview').forEach(img => {
            URL.revokeObjectURL(img.src);
        });
    }
}