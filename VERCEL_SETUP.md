# Vercel 배포 설정 가이드

## 문제 상황
현재 https://ai-shorts-maker.vercel.app/ 에 기본 Next.js 템플릿이 표시되고 있으며, 우리의 코드가 반영되지 않고 있습니다.

## 해결 방법

### 방법 1: Vercel 대시보드에서 재연결 (권장)

1. **Vercel 대시보드 접속**
   - https://vercel.com/dashboard 로그인

2. **기존 프로젝트 삭제** (있다면)
   - `ai-shorts-maker` 프로젝트 찾기
   - Settings → Delete Project

3. **새 프로젝트 생성**
   - "New Project" 클릭
   - GitHub 연동
   - `garimto81/ai-shorts-maker` 저장소 선택

4. **환경 변수 설정**
   ```
   GOOGLE_AI_API_KEY = [Google AI API 키 입력]
   ```

5. **Deploy 클릭**

### 방법 2: Deploy 버튼 사용

아래 버튼을 클릭하여 한 번에 배포:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/garimto81/ai-shorts-maker&env=GOOGLE_AI_API_KEY&project-name=ai-shorts-maker&repository-name=ai-shorts-maker)

### 방법 3: Vercel CLI 사용

1. **Vercel CLI 설치**
   ```bash
   npm i -g vercel
   ```

2. **프로젝트 폴더에서 실행**
   ```bash
   cd ai-shorts-maker
   vercel
   ```

3. **설정 선택**
   - Setup and deploy? Yes
   - Which scope? (본인 계정 선택)
   - Link to existing project? No
   - Project name? ai-shorts-maker
   - Directory? ./
   - Override settings? No

4. **환경 변수 추가**
   ```bash
   vercel env add GOOGLE_AI_API_KEY
   ```

5. **프로덕션 배포**
   ```bash
   vercel --prod
   ```

## 확인 사항

배포 후 다음을 확인:

1. **버전 API 확인**
   - https://ai-shorts-maker.vercel.app/api/version

2. **메인 페이지 확인**
   - 파란색 헤더: "AI Shorts Maker - 간단한 파일 정렬 버전"
   - 버전 표시: v2.0.1
   - 파일 업로드 후 4개 정렬 버튼 표시

## 현재 구현된 기능

✅ **파일명 내림차순 (Z→A)**: 파일명을 기준으로 역순 정렬
✅ **파일명 오름차순 (A→Z)**: 파일명을 기준으로 순차 정렬  
✅ **드래그로 순서 변경**: 마우스로 이미지를 드래그하여 순서 변경
✅ **번호 직접 입력**: 각 이미지에 번호를 입력하여 순서 지정

## 문제 해결

만약 여전히 기본 템플릿이 보인다면:

1. 브라우저 캐시 지우기 (Ctrl+F5)
2. 다른 브라우저로 접속
3. Vercel 대시보드에서 "Redeploy" 클릭
4. GitHub Actions 탭에서 워크플로우 상태 확인