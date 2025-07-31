# GitHub Pages 배포 가이드

## 🚀 빠른 배포 (3분)

### 1. GitHub 설정
1. GitHub 저장소로 이동: https://github.com/garimto81/ai-shorts-maker
2. Settings 탭 클릭
3. 왼쪽 메뉴에서 "Pages" 클릭
4. Source: "Deploy from a branch" 선택
5. Branch: "master" (또는 "main") 선택
6. Folder: "/ (root)" 선택
7. Save 클릭

### 2. 배포 확인
- 1-2분 후 https://garimto81.github.io/ai-shorts-maker/ 에서 확인
- 처음 배포 시 최대 10분 소요될 수 있음

## ✨ 특징

### 100% 클라이언트 사이드
- 서버 불필요
- API 키 불필요
- 데이터베이스 불필요
- 모든 처리가 브라우저에서 실행

### 지원 기능
- ✅ 이미지 업로드 (드래그 앤 드롭)
- ✅ 4가지 정렬 방식
  - 파일명 내림차순 (Z→A)
  - 파일명 오름차순 (A→Z)
  - 드래그로 순서 변경
  - 번호 직접 입력
- ✅ 실시간 미리보기
- ✅ 슬라이드쇼 생성

## 📁 파일 구조
```
ai-shorts-maker/
├── index.html          # 메인 페이지
├── js/
│   ├── app.js         # 메인 로직
│   ├── file-sorter.js # 정렬 기능
│   └── video-generator.js # 비디오 생성
├── _config.yml        # GitHub Pages 설정
└── README.md          # 프로젝트 설명
```

## 🛠️ 커스터마이징

### 스타일 변경
`index.html`의 `<style>` 섹션에서 CSS 수정

### 기능 추가
`js/` 폴더의 JavaScript 파일 수정

### 로고/타이틀 변경
`index.html`의 `<header>` 섹션 수정

## 🐛 문제 해결

### 페이지가 안 보임
- Settings > Pages에서 설정 확인
- 브랜치 이름 확인 (master 또는 main)
- 10분 정도 기다린 후 재시도

### 404 에러
- index.html 파일이 루트에 있는지 확인
- GitHub Pages가 활성화되었는지 확인

### 업데이트 반영 안됨
- 브라우저 캐시 삭제 (Ctrl+F5)
- GitHub Actions 탭에서 배포 상태 확인