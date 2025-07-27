// TTS 음성 생성기 페이지 (v1.5.0)

import React from 'react';
import TTSGeneratorUI from '@/components/tts-generator-ui';

export default function TTSPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <TTSGeneratorUI />
      </div>
    </div>
  );
}