// API 키 관리 시스템 (내부 도구용)

import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';

// 환경변수에서 API 키 로드
export const getApiKeys = () => ({
  gemini: process.env.GEMINI_API_KEY,
  azure: process.env.AZURE_SPEECH_KEY,
  openai: process.env.OPENAI_API_KEY
});

// API 키 검증
export const validateApiKeys = () => {
  const keys = getApiKeys();
  const missing = [];
  
  if (!keys.gemini) missing.push('GEMINI_API_KEY');
  if (!keys.azure) missing.push('AZURE_SPEECH_KEY');
  if (!keys.openai) missing.push('OPENAI_API_KEY');
  
  if (missing.length > 0) {
    throw new Error(`필수 API 키가 없습니다: ${missing.join(', ')}`);
  }
  
  return true;
};

// 관리자 전용 설정 API
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res);
  
  // 관리자 권한 확인 (내부 직원만)
  if (!session?.user?.role?.includes('admin')) {
    return res.status(403).json({ error: '관리자 권한이 필요합니다' });
  }

  if (req.method === 'GET') {
    // 현재 API 키 상태 확인 (키 값은 마스킹)
    const keys = getApiKeys();
    return res.json({
      gemini: keys.gemini ? `${keys.gemini.slice(0, 10)}...` : null,
      azure: keys.azure ? `${keys.azure.slice(0, 10)}...` : null,
      openai: keys.openai ? `${keys.openai.slice(0, 10)}...` : null
    });
  }

  if (req.method === 'POST') {
    // API 키 테스트
    const { apiKey, service } = req.body;
    
    try {
      if (service === 'gemini') {
        await testGeminiKey(apiKey);
      } else if (service === 'azure') {
        await testAzureKey(apiKey);
      }
      
      res.json({ valid: true, message: 'API 키가 유효합니다' });
    } catch (error) {
      res.status(400).json({ valid: false, error: error.message });
    }
  }
}

// Gemini API 키 테스트
async function testGeminiKey(apiKey: string): Promise<boolean> {
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    // 간단한 테스트 요청
    const result = await model.generateContent("테스트");
    const response = await result.response;
    
    return !!response.text();
  } catch (error) {
    throw new Error('Gemini API 키가 유효하지 않습니다');
  }
}

// Azure Speech 키 테스트
async function testAzureKey(apiKey: string): Promise<boolean> {
  try {
    // Azure Speech SDK 테스트 로직
    const response = await fetch('https://koreacentral.api.cognitive.microsoft.com/sts/v1.0/issueToken', {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    return response.ok;
  } catch (error) {
    throw new Error('Azure Speech API 키가 유효하지 않습니다');
  }
}

// React 컴포넌트: 관리자 설정 페이지
export const AdminSettingsComponent = () => {
  const [apiKeys, setApiKeys] = useState({
    gemini: '',
    azure: '',
    openai: ''
  });
  const [testing, setTesting] = useState(false);

  const testApiKey = async (service: string, key: string) => {
    setTesting(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: key, service })
      });
      
      const result = await response.json();
      if (result.valid) {
        alert('API 키가 유효합니다!');
      } else {
        alert(`API 키 오류: ${result.error}`);
      }
    } catch (error) {
      alert('테스트 중 오류가 발생했습니다');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="admin-settings p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">시스템 설정</h1>
      
      <div className="space-y-6">
        {/* Gemini API 설정 */}
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">Google Gemini AI</h2>
          <div className="flex gap-2">
            <input
              type="password"
              placeholder="AIza..."
              value={apiKeys.gemini}
              onChange={(e) => setApiKeys({...apiKeys, gemini: e.target.value})}
              className="flex-1 px-3 py-2 border rounded"
            />
            <button
              onClick={() => testApiKey('gemini', apiKeys.gemini)}
              disabled={testing || !apiKeys.gemini}
              className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
            >
              {testing ? '테스트 중...' : '테스트'}
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Google AI Studio에서 발급받은 API 키를 입력하세요
          </p>
        </div>

        {/* Azure Speech 설정 */}
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">Azure Speech Services</h2>
          <div className="flex gap-2">
            <input
              type="password"
              placeholder="Azure 구독 키"
              value={apiKeys.azure}
              onChange={(e) => setApiKeys({...apiKeys, azure: e.target.value})}
              className="flex-1 px-3 py-2 border rounded"
            />
            <button
              onClick={() => testApiKey('azure', apiKeys.azure)}
              disabled={testing || !apiKeys.azure}
              className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
            >
              {testing ? '테스트 중...' : '테스트'}
            </button>
          </div>
        </div>

        {/* 시스템 상태 */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <h2 className="text-lg font-semibold mb-3">시스템 상태</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">최대 동시 작업:</span> 3개
            </div>
            <div>
              <span className="font-medium">이미지 처리 한도:</span> 20개
            </div>
            <div>
              <span className="font-medium">기본 음성:</span> ko-KR-SunHiNeural
            </div>
            <div>
              <span className="font-medium">비디오 품질:</span> 1080p
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};