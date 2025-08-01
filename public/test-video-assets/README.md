# 테스트용 영상 에셋

이 폴더에는 영상+음성 합성 기능을 테스트하기 위한 파일들이 있습니다.

## 파일 목록

### 이미지 파일
- test_image_01.png (빨간색)
- test_image_02.png (청록색) 
- test_image_03.png (파란색)
- test_image_04.png (녹색)
- test_image_05.png (노란색)
- test_image_06.png (보라색)
- test_image_07.png (분홍색)
- test_image_08.png (카키색)

### 음성 스크립트
- test_audio_script.json

## 사용법

1. `/video-audio-test` 페이지로 이동
2. 이미지 파일들을 모두 선택하여 업로드
3. TTS 기능을 사용하여 test_audio_script.json의 내용으로 음성 생성
4. 또는 별도의 음성 파일 업로드
5. 렌더링 모드 선택 후 '영상 생성 시작' 클릭

## 예상 결과

- 총 영상 길이: 16초 (8개 이미지 × 2초)
- 해상도: 설정에 따라 가변
- 형식: 선택한 출력 형식

## 트러블슈팅

### FFmpeg 모드가 작동하지 않는 경우
- 브라우저에서 SharedArrayBuffer 지원 확인
- HTTPS 환경에서 실행 (localhost 제외)
- Cross-Origin-Embedder-Policy 헤더 확인

### 브라우저 모드 오류
- MediaRecorder API 지원 브라우저 사용
- Canvas.captureStream() 지원 확인
- 최신 Chrome/Firefox 사용 권장

생성일: 2025-07-30T09:40:56.347Z
