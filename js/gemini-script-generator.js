// Gemini AI 스크립트 생성 로직

class GeminiScriptGenerator {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent';
        this.textApiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
    }

    // 이미지를 base64로 변환
    async imageToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // 단일 이미지 분석
    async analyzeImage(imageFile, index, totalImages) {
        try {
            const base64Image = await this.imageToBase64(imageFile);
            
            const requestBody = {
                contents: [{
                    parts: [
                        {
                            text: `이미지를 분석하여 3-5초 동안 나레이션할 스크립트를 생성해주세요.
                            
요구사항:
- 이미지 ${index + 1}/${totalImages}
- 파일명: ${imageFile.name}
- 길이: 3-5초 분량 (한국어 기준 30-50자)
- 스타일: 자연스럽고 흥미로운 설명
- 이미지의 주요 요소와 분위기를 포착
- 전체 스토리의 연속성 고려

출력 형식:
{
    "narration": "나레이션 텍스트",
    "duration": 3.5,
    "keywords": ["키워드1", "키워드2"],
    "emotion": "positive/neutral/dramatic"
}`
                        },
                        {
                            inlineData: {
                                mimeType: imageFile.type,
                                data: base64Image
                            }
                        }
                    ]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 200
                }
            };

            const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`API 오류: ${response.status}`);
            }

            const data = await response.json();
            const content = data.candidates[0].content.parts[0].text;
            
            // JSON 파싱 시도
            try {
                return JSON.parse(content);
            } catch {
                // JSON 파싱 실패 시 기본값 반환
                return {
                    narration: content.trim(),
                    duration: 4,
                    keywords: [],
                    emotion: "neutral"
                };
            }
        } catch (error) {
            console.error('이미지 분석 오류:', error);
            // 오류 시 기본 스크립트 반환
            return {
                narration: `${index + 1}번째 이미지입니다.`,
                duration: 3,
                keywords: [imageFile.name],
                emotion: "neutral"
            };
        }
    }

    // 전체 스크립트 생성
    async generateFullScript(title, imageFiles) {
        const script = {
            title: title,
            totalDuration: 0,
            scenes: [],
            opening: null,
            closing: null
        };

        // 오프닝 생성
        script.opening = await this.generateOpening(title, imageFiles.length);
        script.totalDuration += script.opening.duration;

        // 각 이미지 분석 및 스크립트 생성
        for (let i = 0; i < imageFiles.length; i++) {
            const scene = await this.analyzeImage(imageFiles[i], i, imageFiles.length);
            scene.index = i;
            scene.fileName = imageFiles[i].name;
            script.scenes.push(scene);
            script.totalDuration += scene.duration;

            // 진행 상황 콜백
            if (this.onProgress) {
                this.onProgress(i + 1, imageFiles.length);
            }
        }

        // 클로징 생성
        script.closing = await this.generateClosing(title, script.scenes);
        script.totalDuration += script.closing.duration;

        // 스크립트 최적화
        return this.optimizeScript(script);
    }

    // 오프닝 생성
    async generateOpening(title, imageCount) {
        try {
            const requestBody = {
                contents: [{
                    parts: [{
                        text: `다음 제목의 영상에 대한 3-5초 분량의 오프닝 멘트를 작성해주세요.

제목: ${title}
이미지 수: ${imageCount}개

요구사항:
- 시청자의 관심을 끄는 도입부
- 3-5초 분량 (30-50자)
- 자연스럽고 친근한 톤

출력 형식:
{
    "narration": "오프닝 멘트",
    "duration": 4,
    "emotion": "engaging"
}`
                    }]
                }],
                generationConfig: {
                    temperature: 0.8,
                    maxOutputTokens: 100
                }
            };

            const response = await fetch(`${this.textApiUrl}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`API 오류: ${response.status}`);
            }

            const data = await response.json();
            const content = data.candidates[0].content.parts[0].text;
            
            try {
                return JSON.parse(content);
            } catch {
                return {
                    narration: `${title}, 지금 시작합니다!`,
                    duration: 3,
                    emotion: "engaging"
                };
            }
        } catch (error) {
            console.error('오프닝 생성 오류:', error);
            return {
                narration: `${title}, 함께 보시죠!`,
                duration: 3,
                emotion: "engaging"
            };
        }
    }

    // 클로징 생성
    async generateClosing(title, scenes) {
        try {
            const keywords = scenes.flatMap(s => s.keywords || []);
            const uniqueKeywords = [...new Set(keywords)].slice(0, 5);

            const requestBody = {
                contents: [{
                    parts: [{
                        text: `다음 영상의 마무리 멘트를 작성해주세요.

제목: ${title}
주요 키워드: ${uniqueKeywords.join(', ')}
장면 수: ${scenes.length}개

요구사항:
- 영상을 마무리하는 감사 인사
- 3-5초 분량 (30-50자)
- 긍정적이고 기억에 남는 마무리

출력 형식:
{
    "narration": "클로징 멘트",
    "duration": 4,
    "emotion": "thankful"
}`
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 100
                }
            };

            const response = await fetch(`${this.textApiUrl}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`API 오류: ${response.status}`);
            }

            const data = await response.json();
            const content = data.candidates[0].content.parts[0].text;
            
            try {
                return JSON.parse(content);
            } catch {
                return {
                    narration: "시청해 주셔서 감사합니다!",
                    duration: 3,
                    emotion: "thankful"
                };
            }
        } catch (error) {
            console.error('클로징 생성 오류:', error);
            return {
                narration: "함께해 주셔서 감사합니다!",
                duration: 3,
                emotion: "thankful"
            };
        }
    }

    // 스크립트 최적화
    optimizeScript(script) {
        // 연속성 검사 및 조정
        for (let i = 1; i < script.scenes.length; i++) {
            const prevScene = script.scenes[i - 1];
            const currScene = script.scenes[i];
            
            // 중복 단어 제거
            if (this.hasDuplicateStart(prevScene.narration, currScene.narration)) {
                currScene.narration = this.adjustNarration(currScene.narration);
            }
        }

        // 전체 길이 조정
        if (script.totalDuration > 120) { // 2분 초과 시
            this.compressScript(script);
        }

        return script;
    }

    // 중복 시작 단어 확인
    hasDuplicateStart(prev, curr) {
        const prevWords = prev.split(' ');
        const currWords = curr.split(' ');
        return prevWords[prevWords.length - 1] === currWords[0];
    }

    // 나레이션 조정
    adjustNarration(narration) {
        const connectors = ['그리고', '다음은', '이어서', '또한'];
        const randomConnector = connectors[Math.floor(Math.random() * connectors.length)];
        return `${randomConnector} ${narration}`;
    }

    // 스크립트 압축
    compressScript(script) {
        script.scenes.forEach(scene => {
            if (scene.duration > 4) {
                scene.duration = 4;
                // 긴 나레이션 줄이기
                if (scene.narration.length > 50) {
                    scene.narration = scene.narration.substring(0, 47) + '...';
                }
            }
        });
        
        // 총 시간 재계산
        script.totalDuration = script.opening.duration + 
                              script.scenes.reduce((sum, s) => sum + s.duration, 0) + 
                              script.closing.duration;
    }

    // 진행 상황 콜백 설정
    setProgressCallback(callback) {
        this.onProgress = callback;
    }
}

// 스크립트 생성 UI 통합
async function generateScriptWithAI() {
    const apiKey = document.getElementById('gemini-api-key').value;
    const title = document.getElementById('project-title').value;
    
    if (!apiKey) {
        alert('Gemini API 키를 입력해주세요.');
        return;
    }
    
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
    
    try {
        const generator = new GeminiScriptGenerator(apiKey);
        
        // 진행 상황 표시
        generator.setProgressCallback((current, total) => {
            btn.textContent = `분석 중... (${current}/${total})`;
        });
        
        btn.textContent = '스크립트 생성 중...';
        const script = await generator.generateFullScript(title, currentFiles);
        
        // 결과 표시
        displayGeneratedScript(script);
        
        // 스크립트를 전역 변수에 저장
        window.generatedScript = script;
        
        alert(`스크립트 생성 완료!\n총 ${script.scenes.length}개 장면, ${Math.round(script.totalDuration)}초`);
        
    } catch (error) {
        alert('스크립트 생성 중 오류가 발생했습니다: ' + error.message);
        console.error(error);
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

// 생성된 스크립트 표시
function displayGeneratedScript(script) {
    const container = document.getElementById('script-preview');
    if (!container) return;
    
    let html = `
        <div class="script-container">
            <h3>생성된 스크립트</h3>
            <div class="script-info">
                <p>총 재생 시간: ${Math.round(script.totalDuration)}초</p>
                <p>장면 수: ${script.scenes.length}개</p>
            </div>
            
            <div class="script-timeline">
                <div class="scene-item opening">
                    <div class="scene-header">오프닝 (${script.opening.duration}초)</div>
                    <div class="scene-narration">${script.opening.narration}</div>
                </div>
                
                ${script.scenes.map((scene, i) => `
                    <div class="scene-item">
                        <div class="scene-header">
                            장면 ${i + 1}: ${scene.fileName} (${scene.duration}초)
                        </div>
                        <div class="scene-narration">${scene.narration}</div>
                        ${scene.keywords.length > 0 ? 
                            `<div class="scene-keywords">키워드: ${scene.keywords.join(', ')}</div>` : 
                            ''
                        }
                    </div>
                `).join('')}
                
                <div class="scene-item closing">
                    <div class="scene-header">클로징 (${script.closing.duration}초)</div>
                    <div class="scene-narration">${script.closing.narration}</div>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
    container.classList.remove('hidden');
}