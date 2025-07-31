// 비디오 생성 관련 기능

class VideoGenerator {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = 1280;
        this.height = 720;
        this.fps = 30;
        this.duration = 2; // 각 이미지당 2초
    }

    async generateSlideshow(files, title) {
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        const frames = [];
        
        // 제목 프레임 생성
        if (title) {
            const titleFrame = this.createTitleFrame(title);
            // 2초 동안 표시 (60 프레임)
            for (let i = 0; i < 60; i++) {
                frames.push(titleFrame);
            }
        }
        
        // 각 이미지 프레임 생성
        for (const file of files) {
            const imageFrames = await this.createImageFrames(file);
            frames.push(...imageFrames);
        }
        
        // 엔딩 프레임
        const endingFrame = this.createEndingFrame();
        for (let i = 0; i < 60; i++) {
            frames.push(endingFrame);
        }
        
        return frames;
    }

    createTitleFrame(title) {
        this.ctx.fillStyle = '#1e40af';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 60px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(title, this.width / 2, this.height / 2);
        
        return this.canvas.toDataURL();
    }

    async createImageFrames(file) {
        const frames = [];
        const img = new Image();
        
        return new Promise((resolve) => {
            img.onload = () => {
                // 이미지를 캔버스에 맞게 그리기
                this.ctx.fillStyle = '#000';
                this.ctx.fillRect(0, 0, this.width, this.height);
                
                const scale = Math.min(
                    this.width / img.width,
                    this.height / img.height
                );
                
                const x = (this.width - img.width * scale) / 2;
                const y = (this.height - img.height * scale) / 2;
                
                this.ctx.drawImage(
                    img,
                    x, y,
                    img.width * scale,
                    img.height * scale
                );
                
                // 파일명 표시
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                this.ctx.fillRect(0, this.height - 60, this.width, 60);
                
                this.ctx.fillStyle = 'white';
                this.ctx.font = '24px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(file.name, this.width / 2, this.height - 20);
                
                const frame = this.canvas.toDataURL();
                
                // 2초 동안 표시 (60 프레임)
                for (let i = 0; i < 60; i++) {
                    frames.push(frame);
                }
                
                resolve(frames);
            };
            
            img.src = URL.createObjectURL(file);
        });
    }

    createEndingFrame() {
        this.ctx.fillStyle = '#1e40af';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('감사합니다', this.width / 2, this.height / 2 - 40);
        
        this.ctx.font = '24px Arial';
        this.ctx.fillText('AI Shorts Maker로 제작', this.width / 2, this.height / 2 + 40);
        
        return this.canvas.toDataURL();
    }

    async exportAsWebM(frames) {
        // 간단한 WebM 비디오 생성 (실제로는 더 복잡한 인코딩 필요)
        // 여기서는 GIF로 대체하여 시연
        return this.exportAsGIF(frames);
    }

    exportAsGIF(frames) {
        // 실제 구현에서는 gif.js 등의 라이브러리 사용
        // 여기서는 데모용으로 첫 프레임만 반환
        return frames[0];
    }
}

// 비디오 생성 함수
async function generateVideo() {
    const title = document.getElementById('project-title').value;
    if (!title.trim()) {
        alert('프로젝트 제목을 입력해주세요.');
        return;
    }
    
    if (currentFiles.length === 0) {
        alert('이미지를 업로드해주세요.');
        return;
    }
    
    const btn = event.target;
    btn.disabled = true;
    btn.textContent = '생성 중...';
    
    try {
        const generator = new VideoGenerator();
        const frames = await generator.generateSlideshow(currentFiles, title);
        
        // 다운로드 링크 생성 (데모용)
        const link = document.createElement('a');
        link.download = `${title.replace(/[^a-z0-9]/gi, '_')}_slideshow.png`;
        link.href = frames[0]; // 첫 프레임을 이미지로 저장
        link.click();
        
        alert('슬라이드쇼가 생성되었습니다!\n\n실제 비디오 생성은 서버 사이드 처리가 필요합니다.\n현재는 첫 프레임을 이미지로 저장합니다.');
    } catch (error) {
        alert('비디오 생성 중 오류가 발생했습니다: ' + error.message);
    } finally {
        btn.disabled = false;
        btn.textContent = '🎬 비디오 생성';
    }
}