#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import requests
import json
import time
import os
from datetime import datetime

# API 엔드포인트
API_URL = "http://localhost:3000/api/tts/generate"

# 테스트 샘플 목록
test_samples = [
    {
        "name": "기본_나레이션",
        "text": "안녕하세요. AI Shorts Maker 음성 테스트입니다. 이것은 기본 나레이션 스타일의 음성입니다. 차분하고 안정적인 톤으로 정보를 전달합니다.",
        "config": {
            "enhanced": True,
            "preset": "narration",
            "style": "neutral"
        }
    },
    {
        "name": "자동차정비_전문가",
        "text": "오늘 입고된 차량은 BMW 5시리즈입니다. 휠복원 작업을 진행하겠습니다. 먼저 휠의 상태를 점검하고, 굴절이나 크랙을 확인합니다. 샌드블라스터로 표면의 이물질을 제거한 후, CNC 가공을 통해 정밀하게 복원합니다. 마지막으로 클리어코트를 도포하여 새 것과 같은 광택을 되찾았습니다.",
        "config": {
            "enhanced": True,
            "videoType": "auto_repair",
            "keywords": ["BMW", "휠복원", "샌드블라스터", "CNC", "클리어코트"],
            "formalTone": True
        }
    },
    {
        "name": "친근한_튜토리얼",
        "text": "여러분 안녕하세요! 오늘은 정말 쉽고 재미있는 방법을 알려드릴게요. 먼저 이렇게 해보세요. 그 다음에는 이런 식으로 진행하면 됩니다. 어때요? 정말 간단하죠? 여러분도 충분히 할 수 있어요!",
        "config": {
            "enhanced": True,
            "preset": "tutorial",
            "style": "cheerful"
        }
    },
    {
        "name": "감성적인_스토리",
        "text": "어느 가을날, 작은 마을에 특별한 일이 일어났습니다. 오래된 자동차 한 대가 새로운 주인을 만났고, 그들의 여정이 시작되었습니다. 녹슨 차체와 낡은 엔진이었지만, 주인의 정성스러운 손길로 조금씩 새로운 생명을 얻어갔습니다.",
        "config": {
            "enhanced": True,
            "preset": "storytelling",
            "style": "calm"
        }
    },
    {
        "name": "활기찬_광고",
        "text": "놀라운 소식! 지금 바로 만나보세요! 최고의 품질, 최상의 서비스! 여러분이 기다리던 바로 그 제품입니다! 오늘만 특별 할인 30%! 절대 놓치지 마세요! 지금 주문하시면 무료 배송까지!",
        "config": {
            "enhanced": True,
            "preset": "advertisement",
            "style": "excited",
            "keywords": ["놀라운", "최고", "특별 할인", "지금"]
        }
    },
    {
        "name": "전문적인_뉴스",
        "text": "오늘 주요 뉴스를 전해드립니다. 정부는 새로운 정책을 발표했습니다. 이번 정책은 국민들의 생활에 직접적인 영향을 미칠 것으로 예상됩니다. 전문가들은 이번 조치가 경제 활성화에 기여할 것으로 전망하고 있습니다.",
        "config": {
            "enhanced": True,
            "preset": "news",
            "style": "professional"
        }
    },
    {
        "name": "교육용_설명",
        "text": "오늘은 자동차의 기본 구조에 대해 알아보겠습니다. 자동차는 크게 엔진, 변속기, 차체, 전기 시스템으로 구성됩니다. 각 부분은 서로 유기적으로 연결되어 있으며, 하나라도 문제가 생기면 전체 성능에 영향을 미칩니다. 이제 각 부분을 자세히 살펴보겠습니다.",
        "config": {
            "enhanced": True,
            "preset": "educational",
            "style": "calm",
            "formalTone": True
        }
    },
    {
        "name": "숫자와_영어_변환",
        "text": "2025년 1월 30일, BMW X5 차량이 입고되었습니다. 차량 가격은 1억 2천만원이며, 95% 상태를 유지하고 있습니다. CNC 가공과 AI 기술을 활용하여 3시간 만에 작업을 완료했습니다.",
        "config": {
            "enhanced": True,
            "preset": "narration",
            "keywords": ["BMW", "CNC", "AI"]
        }
    },
    {
        "name": "감정_변화_테스트",
        "text": "처음에는 걱정이 많았습니다. 과연 잘 될까? 하지만 작업을 진행하면서 점점 자신감이 생겼고, 마침내 완성했을 때는 정말 기뻤습니다! 고객님의 만족스러운 표정을 보니 모든 피로가 사라지는 것 같았습니다.",
        "config": {
            "enhanced": True,
            "preset": "storytelling",
            "style": "neutral"
        }
    },
    {
        "name": "속도_변화_테스트",
        "text": "천천히 시작해보겠습니다. 이제 조금 빠르게 진행합니다. 중요한 부분은 다시 천천히 설명드리겠습니다. 마지막으로 정상 속도로 마무리하겠습니다.",
        "config": {
            "enhanced": True,
            "preset": "tutorial"
        }
    }
]

def generate_tts(sample):
    """TTS API를 호출하여 음성 생성"""
    print(f"\n{'='*50}")
    print(f"🎙️ 생성 중: {sample['name']}")
    print(f"텍스트: {sample['text'][:50]}...")
    
    # API 요청 데이터 준비
    request_data = {
        "text": sample["text"],
        "voice": "Kore",
        "speed": "normal",
        "language": "ko",
        **sample["config"]
    }
    
    try:
        # API 호출
        response = requests.post(
            API_URL,
            headers={"Content-Type": "application/json; charset=utf-8"},
            data=json.dumps(request_data, ensure_ascii=False).encode('utf-8')
        )
        
        if response.status_code == 200:
            result = response.json()
            if result["success"]:
                print(f"✅ 성공!")
                print(f"- 오디오 URL: {result['data']['audioUrl']}")
                print(f"- 재생 시간: {result['data']['duration']}초")
                print(f"- 처리 시간: {result['metadata']['processingTime']}ms")
                print(f"- 엔진: {result['metadata']['engine']}")
                
                # 오디오 파일 다운로드 (선택사항)
                audio_url = f"http://localhost:3000{result['data']['audioUrl']}"
                audio_filename = f"tts_sample_{sample['name']}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.wav"
                
                # 다운로드는 별도로 구현 필요
                print(f"- 저장 파일명: {audio_filename}")
                
                return result
            else:
                print(f"❌ 실패: {result.get('error', '알 수 없는 오류')}")
        else:
            print(f"❌ HTTP 오류: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"❌ 오류 발생: {str(e)}")
    
    return None

def main():
    """메인 실행 함수"""
    print("🎙️ AI Shorts Maker - 한국어 음성 테스트 시작")
    print(f"총 {len(test_samples)}개의 샘플을 생성합니다.")
    
    results = []
    
    for i, sample in enumerate(test_samples, 1):
        print(f"\n진행률: {i}/{len(test_samples)}")
        result = generate_tts(sample)
        
        if result:
            results.append({
                "name": sample["name"],
                "success": True,
                "audioUrl": result["data"]["audioUrl"],
                "duration": result["data"]["duration"]
            })
        else:
            results.append({
                "name": sample["name"],
                "success": False
            })
        
        # API 부하 방지를 위한 대기
        if i < len(test_samples):
            time.sleep(2)
    
    # 결과 요약
    print(f"\n{'='*50}")
    print("📊 테스트 결과 요약")
    print(f"{'='*50}")
    
    success_count = sum(1 for r in results if r["success"])
    print(f"성공: {success_count}/{len(results)}")
    
    print("\n생성된 음성 파일:")
    for result in results:
        if result["success"]:
            print(f"- {result['name']}: {result['audioUrl']} ({result['duration']}초)")
        else:
            print(f"- {result['name']}: 실패")
    
    # 결과를 JSON 파일로 저장
    with open("tts_test_results.json", "w", encoding="utf-8") as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "total_samples": len(test_samples),
            "success_count": success_count,
            "results": results
        }, f, ensure_ascii=False, indent=2)
    
    print("\n✅ 테스트 완료! 결과가 tts_test_results.json에 저장되었습니다.")

if __name__ == "__main__":
    # UTF-8 인코딩 설정
    os.environ['PYTHONIOENCODING'] = 'utf-8'
    main()