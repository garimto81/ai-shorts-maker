# AI Shorts Maker - Vercel 배포 가이드

## 빠른 배포 (5분 소요)

### 1. GitHub 저장소 생성
1. https://github.com/new 접속
2. Repository name: `ai-shorts-maker`
3. Public 선택 → Create repository

### 2. 코드 푸시
```bash
git remote add origin https://github.com/YOUR_USERNAME/ai-shorts-maker.git
git branch -M main
git push -u origin main
```

### 3. Vercel 배포
1. https://vercel.com/import 접속
2. GitHub 로그인 → `ai-shorts-maker` 저장소 선택
3. 환경 변수 설정:
   - `GOOGLE_AI_API_KEY`: (필수) Google AI API 키

### 4. 완료!
- 배포 URL: `https://ai-shorts-maker-[username].vercel.app`
- 자동 배포: GitHub push 시 자동 업데이트

## 주요 기능
- ✅ 이미지 파일명 기반 정렬 (오름차순/내림차순)
- ✅ 드래그 앤 드롭으로 수동 순서 조정
- ✅ AI 스크립트 생성
- ✅ TTS 음성 생성
- ✅ 비디오 렌더링

## 문제 해결
- API 키 오류: Vercel 프로젝트 설정에서 환경 변수 확인
- 빌드 실패: Node.js 18+ 사용 확인
- 배포 실패: vercel.json 파일 확인