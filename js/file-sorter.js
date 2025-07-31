// 파일 정렬 관련 기능

class FileSorter {
    static sortByNameDesc(files) {
        return [...files].sort((a, b) => 
            b.name.localeCompare(a.name, 'ko-KR', { numeric: true, sensitivity: 'base' })
        );
    }

    static sortByNameAsc(files) {
        return [...files].sort((a, b) => 
            a.name.localeCompare(b.name, 'ko-KR', { numeric: true, sensitivity: 'base' })
        );
    }
}

// 전역 변수
let currentFiles = [];
let sortMode = 'desc';
let draggedItem = null;

// 파일 정렬 함수
function sortFiles(mode) {
    switch (mode) {
        case 'asc':
            currentFiles = FileSorter.sortByNameAsc(currentFiles);
            break;
        case 'desc':
            currentFiles = FileSorter.sortByNameDesc(currentFiles);
            break;
        // manual과 number는 순서 유지
    }
    renderFiles();
}

// 파일 렌더링
function renderFiles() {
    const grid = document.getElementById('file-grid');
    grid.innerHTML = '';

    currentFiles.forEach((file, index) => {
        const item = document.createElement('div');
        item.className = 'file-item';
        item.draggable = sortMode === 'manual';
        item.dataset.index = index;

        const imgUrl = URL.createObjectURL(file);
        
        item.innerHTML = `
            <img src="${imgUrl}" alt="${file.name}" class="file-preview">
            ${sortMode === 'number' ? 
                `<input type="number" class="number-input" min="1" max="${currentFiles.length}" 
                 value="${index + 1}" onchange="handleNumberChange(${index}, this.value)">` :
                `<div class="file-number">${index + 1}</div>`
            }
            <button class="file-remove" onclick="removeFile(${index})">×</button>
            <div class="file-info">${file.name}</div>
        `;

        // 드래그 이벤트
        if (sortMode === 'manual') {
            item.addEventListener('dragstart', handleDragStart);
            item.addEventListener('dragend', handleDragEnd);
            item.addEventListener('dragover', handleDragOver);
            item.addEventListener('drop', handleDrop);
            item.addEventListener('dragenter', handleDragEnter);
            item.addEventListener('dragleave', handleDragLeave);
        }

        grid.appendChild(item);
    });
}

// 드래그 앤 드롭 핸들러
function handleDragStart(e) {
    draggedItem = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    draggedItem = null;
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDragEnter(e) {
    if (this !== draggedItem) {
        this.style.border = '2px solid #3b82f6';
    }
}

function handleDragLeave(e) {
    this.style.border = '';
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }

    if (draggedItem !== this) {
        const draggedIndex = parseInt(draggedItem.dataset.index);
        const targetIndex = parseInt(this.dataset.index);
        
        // 파일 순서 변경
        const [removed] = currentFiles.splice(draggedIndex, 1);
        currentFiles.splice(targetIndex, 0, removed);
        
        renderFiles();
    }

    return false;
}

// 번호 입력 처리
function handleNumberChange(currentIndex, newPosition) {
    const position = parseInt(newPosition);
    if (isNaN(position) || position < 1 || position > currentFiles.length) return;
    
    const targetIndex = position - 1;
    if (currentIndex === targetIndex) return;
    
    const [movedFile] = currentFiles.splice(currentIndex, 1);
    currentFiles.splice(targetIndex, 0, movedFile);
    renderFiles();
}

// 파일 제거
function removeFile(index) {
    currentFiles.splice(index, 1);
    if (currentFiles.length === 0) {
        document.getElementById('sort-section').classList.add('hidden');
        document.getElementById('upload-section').classList.remove('hidden');
    }
    renderFiles();
}