// SSML (Speech Synthesis Markup Language) 빌더
// 더 자연스럽고 표현력 있는 음성 생성을 위한 마크업 생성기

export class SSMLBuilder {
  private ssml: string = '';
  private isOpen: boolean = false;

  constructor() {
    this.open();
  }

  // SSML 문서 시작
  open(): this {
    this.ssml = '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ko-KR">';
    this.isOpen = true;
    return this;
  }

  // SSML 문서 종료
  close(): string {
    if (this.isOpen) {
      this.ssml += '</speak>';
      this.isOpen = false;
    }
    return this.ssml;
  }

  // 일반 텍스트 추가
  addText(text: string): this {
    this.ssml += this.escapeXml(text);
    return this;
  }

  // 문장 추가 (문장 경계 명시)
  addSentence(text: string, options?: {
    speed?: number;   // 50-200%
    pitch?: number;   // -50 to +50%
    volume?: number;  // -50 to +50dB
  }): this {
    let sentence = this.escapeXml(text);
    
    if (options && Object.keys(options).length > 0) {
      const prosodyAttrs: string[] = [];
      
      if (options.speed !== undefined) {
        prosodyAttrs.push(`rate="${options.speed}%"`);
      }
      
      if (options.pitch !== undefined) {
        const pitchValue = options.pitch > 0 ? `+${options.pitch}%` : `${options.pitch}%`;
        prosodyAttrs.push(`pitch="${pitchValue}"`);
      }
      
      if (options.volume !== undefined) {
        const volumeValue = options.volume > 0 ? `+${options.volume}dB` : `${options.volume}dB`;
        prosodyAttrs.push(`volume="${volumeValue}"`);
      }
      
      if (prosodyAttrs.length > 0) {
        sentence = `<prosody ${prosodyAttrs.join(' ')}>${sentence}</prosody>`;
      }
    }
    
    this.ssml += `<s>${sentence}</s>`;
    return this;
  }

  // 문단 추가
  addParagraph(text: string): this {
    this.ssml += `<p>${this.escapeXml(text)}</p>`;
    return this;
  }

  // 일시정지 추가
  addPause(duration: number | string): this {
    if (typeof duration === 'number') {
      this.ssml += `<break time="${duration}ms"/>`;
    } else {
      // 'weak', 'medium', 'strong', 'x-strong' 또는 '500ms', '1s' 형식
      this.ssml += `<break strength="${duration}"/>`;
    }
    return this;
  }

  // 강조 추가
  addEmphasis(text: string, level: 'strong' | 'moderate' | 'reduced' = 'moderate'): this {
    this.ssml += `<emphasis level="${level}">${this.escapeXml(text)}</emphasis>`;
    return this;
  }

  // 음성 속도, 높이, 볼륨 조정
  addProsody(text: string, options: {
    rate?: string;    // 'x-slow', 'slow', 'medium', 'fast', 'x-fast' 또는 '80%'
    pitch?: string;   // 'x-low', 'low', 'medium', 'high', 'x-high' 또는 '+20%'
    volume?: string;  // 'silent', 'x-soft', 'soft', 'medium', 'loud', 'x-loud' 또는 '+10dB'
    range?: string;   // 음높이 변화 범위
  }): this {
    const attrs: string[] = [];
    
    if (options.rate) attrs.push(`rate="${options.rate}"`);
    if (options.pitch) attrs.push(`pitch="${options.pitch}"`);
    if (options.volume) attrs.push(`volume="${options.volume}"`);
    if (options.range) attrs.push(`range="${options.range}"`);
    
    this.ssml += `<prosody ${attrs.join(' ')}>${this.escapeXml(text)}</prosody>`;
    return this;
  }

  // 특정 부분을 다른 텍스트로 읽기
  addSubstitute(text: string, alias: string): this {
    this.ssml += `<sub alias="${this.escapeXml(alias)}">${this.escapeXml(text)}</sub>`;
    return this;
  }

  // 숫자 읽기 방식 지정
  addSayAs(text: string, interpretAs: 'cardinal' | 'ordinal' | 'digits' | 'fraction' | 'unit' | 'date' | 'time' | 'telephone' | 'spell-out', format?: string): this {
    let sayAsTag = `<say-as interpret-as="${interpretAs}"`;
    if (format) {
      sayAsTag += ` format="${format}"`;
    }
    sayAsTag += `>${this.escapeXml(text)}</say-as>`;
    
    this.ssml += sayAsTag;
    return this;
  }

  // 음성 변경
  addVoice(text: string, name: string, options?: {
    gender?: 'male' | 'female' | 'neutral';
    age?: number;
    variant?: number;
    language?: string;
  }): this {
    let voiceAttrs = `name="${name}"`;
    
    if (options) {
      if (options.gender) voiceAttrs += ` gender="${options.gender}"`;
      if (options.age) voiceAttrs += ` age="${options.age}"`;
      if (options.variant) voiceAttrs += ` variant="${options.variant}"`;
      if (options.language) voiceAttrs += ` xml:lang="${options.language}"`;
    }
    
    this.ssml += `<voice ${voiceAttrs}>${this.escapeXml(text)}</voice>`;
    return this;
  }

  // 오디오 파일 삽입
  addAudio(src: string, alternateText?: string): this {
    if (alternateText) {
      this.ssml += `<audio src="${src}">${this.escapeXml(alternateText)}</audio>`;
    } else {
      this.ssml += `<audio src="${src}"/>`;
    }
    return this;
  }

  // 감정 표현 (확장 기능)
  addEmotion(text: string, emotion: 'happy' | 'sad' | 'angry' | 'fearful' | 'excited' | 'calm'): this {
    const emotionSettings = {
      happy: { rate: '110%', pitch: '+10%', volume: '+2dB' },
      sad: { rate: '90%', pitch: '-10%', volume: '-2dB' },
      angry: { rate: '120%', pitch: '+5%', volume: '+5dB' },
      fearful: { rate: '130%', pitch: '+15%', volume: '-3dB' },
      excited: { rate: '120%', pitch: '+15%', volume: '+3dB' },
      calm: { rate: '85%', pitch: '-5%', volume: '0dB' }
    };
    
    const settings = emotionSettings[emotion];
    return this.addProsody(text, settings);
  }

  // 속삭임 효과
  addWhisper(text: string): this {
    this.ssml += `<prosody volume="x-soft" rate="slow">${this.escapeXml(text)}</prosody>`;
    return this;
  }

  // 외침 효과
  addShout(text: string): this {
    this.ssml += `<prosody volume="x-loud" rate="fast" pitch="+20%">${this.escapeXml(text)}</prosody>`;
    return this;
  }

  // 호흡 소리 추가
  addBreath(): this {
    this.ssml += '<break time="250ms"/><audio src="breathe.wav"><break time="250ms"/></audio>';
    return this;
  }

  // 책 읽기 스타일 (북마크 포함)
  addBookmark(name: string): this {
    this.ssml += `<mark name="${name}"/>`;
    return this;
  }

  // 전화번호 읽기
  addPhoneNumber(number: string): this {
    return this.addSayAs(number, 'telephone');
  }

  // 날짜 읽기
  addDate(date: string, format: string = 'ymd'): this {
    return this.addSayAs(date, 'date', format);
  }

  // 시간 읽기  
  addTime(time: string, format: string = 'hms24'): this {
    return this.addSayAs(time, 'time', format);
  }

  // 금액 읽기
  addCurrency(amount: string, currency: string = 'KRW'): this {
    this.ssml += `<say-as interpret-as="currency" format="${currency}">${this.escapeXml(amount)}</say-as>`;
    return this;
  }

  // 단위 읽기
  addUnit(value: string, unit: string): this {
    return this.addSayAs(`${value} ${unit}`, 'unit');
  }

  // 철자 읽기
  addSpellOut(text: string): this {
    return this.addSayAs(text, 'spell-out');
  }

  // 빌드 (SSML 문서 완성)
  build(): string {
    return this.close();
  }

  // XML 특수문자 이스케이프
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  // 자동차 정비 영상용 SSML 생성 헬퍼
  static createAutoRepairSSML(script: string): string {
    const builder = new SSMLBuilder();
    const sentences = script.split(/[.!?]+/).filter(s => s.trim());
    
    sentences.forEach((sentence, index) => {
      const trimmed = sentence.trim();
      if (!trimmed) return;
      
      // 첫 문장은 차분하게
      if (index === 0) {
        builder.addSentence(trimmed, { speed: 95, pitch: -2 });
        builder.addPause(800);
      }
      // 기술 설명 부분은 명확하게
      else if (trimmed.includes('CNC') || trimmed.includes('샌드블라스터') || trimmed.includes('클리어')) {
        builder.addSentence(trimmed, { speed: 90, pitch: 0 });
        builder.addPause(600);
      }
      // 결과 부분은 만족감 있게
      else if (trimmed.includes('완벽') || trimmed.includes('새차') || trimmed.includes('만족')) {
        builder.addSentence(trimmed, { speed: 105, pitch: 5, volume: 2 });
        builder.addPause(800);
      }
      // 일반 문장
      else {
        builder.addSentence(trimmed, { speed: 100, pitch: 0 });
        builder.addPause(500);
      }
    });
    
    return builder.build();
  }
}