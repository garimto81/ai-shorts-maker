// 비디오 생성 관련 기능

class VideoGenerator {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = 1280;
        this.height = 720;
        this.fps = 30;
        this.defaultDuration = 4; // 기본값: 각 이미지당 4초
    }

    async generateSlideshow(files, title, script = null) {
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        const frames = [];
        
        // 오프닝 프레임 생성
        if (title) {
            const openingDuration = script?.opening?.duration || 3;
            const titleFrame = this.createTitleFrame(title, script?.opening?.narration);
            const openingFrames = Math.round(openingDuration * this.fps);
            
            for (let i = 0; i < openingFrames; i++) {
                frames.push(titleFrame);
            }
        }
        
        // 각 이미지 프레임 생성 (AI 스크립트 기반)
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const scene = script?.scenes?.[i];
            const duration = scene?.duration || this.defaultDuration;
            
            const imageFrames = await this.createImageFrames(file, scene, duration);
            frames.push(...imageFrames);
        }
        
        // 클로징 프레임
        const closingDuration = script?.closing?.duration || 3;
        const endingFrame = this.createEndingFrame(script?.closing?.narration);
        const closingFrames = Math.round(closingDuration * this.fps);
        
        for (let i = 0; i < closingFrames; i++) {
            frames.push(endingFrame);
        }
        
        return frames;
    }

    createTitleFrame(title, narration = null) {
        // 배경 그라디언트
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#1e40af');
        gradient.addColorStop(1, '#3b82f6');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // 제목
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 60px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(title, this.width / 2, this.height / 2 - 50);
        
        // 나레이션 텍스트 (있는 경우)
        if (narration) {
            this.ctx.font = '28px Arial';
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            this.wrapText(narration, this.width / 2, this.height / 2 + 50, this.width - 100, 35);
        }
        
        return this.canvas.toDataURL();
    }

    async createImageFrames(file, scene = null, duration = null) {
        const frames = [];
        const img = new Image();
        const frameDuration = duration || this.defaultDuration;
        const totalFrames = Math.round(frameDuration * this.fps);
        
        return new Promise((resolve) => {
            img.onload = () => {
                // 배경 그라디언트
                const gradient = this.ctx.createRadialGradient(
                    this.width/2, this.height/2, 0,
                    this.width/2, this.height/2, Math.max(this.width, this.height)/2
                );
                gradient.addColorStop(0, '#000');
                gradient.addColorStop(1, '#1a1a1a');
                this.ctx.fillStyle = gradient;
                this.ctx.fillRect(0, 0, this.width, this.height);
                
                // 이미지를 캔버스에 맞게 그리기
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
                
                // 나레이션 텍스트 오버레이
                if (scene?.narration) {
                    // 텍스트 배경
                    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                    this.ctx.fillRect(0, this.height - 120, this.width, 120);
                    
                    // 나레이션 텍스트
                    this.ctx.fillStyle = 'white';
                    this.ctx.font = '32px Arial';
                    this.ctx.textAlign = 'center';
                    this.wrapText(scene.narration, this.width / 2, this.height - 60, this.width - 60, 40);
                } else {
                    // 기본 파일명 표시
                    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                    this.ctx.fillRect(0, this.height - 60, this.width, 60);
                    
                    this.ctx.fillStyle = 'white';
                    this.ctx.font = '24px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText(file.name, this.width / 2, this.height - 20);
                }
                
                const frame = this.canvas.toDataURL();
                
                // 지정된 시간 동안 프레임 생성
                for (let i = 0; i < totalFrames; i++) {
                    frames.push(frame);
                }
                
                resolve(frames);
            };
            
            img.src = URL.createObjectURL(file);
        });
    }

    createEndingFrame(narration = null) {
        // 배경 그라디언트
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#1e40af');
        gradient.addColorStop(1, '#3b82f6');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // 메인 메시지
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        const mainText = narration || '감사합니다';
        this.ctx.fillText(mainText, this.width / 2, this.height / 2 - 40);
        
        // 서브 텍스트
        this.ctx.font = '24px Arial';
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.fillText('AI Shorts Maker로 제작', this.width / 2, this.height / 2 + 40);
        
        return this.canvas.toDataURL();
    }

    // 텍스트 줄바꿈 헬퍼 함수
    wrapText(text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        let lines = [];
        
        for (const word of words) {
            const testLine = line + word + ' ';
            const metrics = this.ctx.measureText(testLine);
            const testWidth = metrics.width;
            
            if (testWidth > maxWidth && line !== '') {
                lines.push(line.trim());
                line = word + ' ';
            } else {
                line = testLine;
            }
        }
        lines.push(line.trim());
        
        // 텍스트 중앙 정렬
        const startY = y - (lines.length - 1) * lineHeight / 2;
        
        lines.forEach((line, index) => {
            this.ctx.fillText(line, x, startY + index * lineHeight);
        });
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

// 비디오 생성 함수 (AI 스크립트 연동)
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
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = '비디오 생성 중...';
    
    try {
        const generator = new VideoGenerator();
        const script = window.generatedScript; // AI로 생성된 스크립트 사용
        
        // 스크립트 기반 슬라이드쇼 생성
        const frames = await generator.generateSlideshow(currentFiles, title, script);
        
        // 프레임 정보 표시
        const totalDuration = script ? script.totalDuration : (currentFiles.length * 4 + 6);
        const totalFrames = frames.length;
        
        console.log(`생성된 비디오 정보:
- 총 프레임: ${totalFrames}개
- 예상 재생 시간: ${Math.round(totalDuration)}초
- AI 스크립트: ${script ? '적용됨' : '미적용'}`);
        
        // 첫 프레임을 샘플로 다운로드
        const link = document.createElement('a');
        link.download = `${title.replace(/[^a-z0-9]/gi, '_')}_preview.png`;
        link.href = frames[0];
        link.click();
        
        // 성공 메시지
        const message = script 
            ? `AI 스크립트 기반 슬라이드쇼가 생성되었습니다!

📊 생성 정보:
• 총 장면: ${script.scenes.length}개
• 재생 시간: ${Math.round(totalDuration)}초
• 프레임 수: ${totalFrames}개

🎬 현재는 첫 번째 프레임을 미리보기로 저장합니다.
실제 비디오 생성은 추가 개발이 필요합니다.`
            : `기본 슬라이드쇼가 생성되었습니다!

💡 더 나은 결과를 위해 'AI 스크립트 생성'을 먼저 실행해보세요.`;
        
        alert(message);
        
    } catch (error) {
        alert('비디오 생성 중 오류가 발생했습니다: ' + error.message);
        console.error('비디오 생성 오류:', error);
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
}