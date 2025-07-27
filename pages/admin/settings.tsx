// 관리자 설정 페이지 - API 키 관리 및 백업 옵션

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  Download,
  Upload,
  Shield,
  Activity,
  Settings,
  Key,
  Database,
  AlertTriangle
} from 'lucide-react';

interface ApiKeyStatus {
  service: string;
  valid: boolean;
  error?: string;
  masked?: string;
}

interface HealthStatus {
  healthy: boolean;
  apis: ApiKeyStatus[];
  environment: any;
  timestamp: string;
}

export default function AdminSettingsPage() {
  const [apiKeys, setApiKeys] = useState({
    gemini: '',
    azure: '',
    openai: ''
  });
  
  const [showKeys, setShowKeys] = useState({
    gemini: false,
    azure: false,
    openai: false
  });
  
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [validationResults, setValidationResults] = useState<ApiKeyStatus[]>([]);

  // 컴포넌트 마운트 시 상태 확인
  useEffect(() => {
    loadHealthStatus();
    loadCurrentKeys();
  }, []);

  // 건강 상태 조회
  const loadHealthStatus = async () => {
    try {
      const response = await fetch('/api/admin/health');
      const health = await response.json();
      setHealthStatus(health);
    } catch (error) {
      console.error('건강 상태 조회 실패:', error);
    }
  };

  // 현재 설정된 키 조회 (마스킹됨)
  const loadCurrentKeys = async () => {
    try {
      const response = await fetch('/api/admin/api-keys');
      const keys = await response.json();
      
      // 마스킹된 키 표시
      Object.entries(keys).forEach(([service, maskedKey]) => {
        if (maskedKey && maskedKey !== '❌ 미설정') {
          setApiKeys(prev => ({ ...prev, [service]: maskedKey as string }));
        }
      });
    } catch (error) {
      console.error('API 키 조회 실패:', error);
    }
  };

  // API 키 테스트
  const testApiKey = async (service: string, key?: string) => {
    if (!key && !apiKeys[service as keyof typeof apiKeys]) {
      alert('API 키를 입력해주세요');
      return;
    }

    setTesting(service);
    try {
      const response = await fetch('/api/admin/validate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          service, 
          apiKey: key || apiKeys[service as keyof typeof apiKeys] 
        })
      });
      
      const result = await response.json();
      
      if (result.valid) {
        alert(`✅ ${service} API 키가 유효합니다!`);
      } else {
        alert(`❌ ${service} API 키 오류: ${result.error}`);
      }
    } catch (error) {
      alert('테스트 중 오류가 발생했습니다');
    } finally {
      setTesting(null);
    }
  };

  // 모든 API 키 검증
  const validateAllKeys = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/validate-all');
      const results = await response.json();
      setValidationResults(results);
      
      const failedCount = results.filter((r: ApiKeyStatus) => !r.valid).length;
      if (failedCount === 0) {
        alert('✅ 모든 API 키가 유효합니다!');
      } else {
        alert(`⚠️ ${failedCount}개의 API 키에 문제가 있습니다`);
      }
    } catch (error) {
      alert('검증 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  // 환경설정 내보내기 (민감한 정보 제외)
  const exportConfig = () => {
    const config = {
      exportDate: new Date().toISOString(),
      environment: healthStatus?.environment,
      apiKeyStatus: validationResults.map(r => ({
        service: r.service,
        configured: r.valid,
        // 실제 키값은 제외
      })),
      settings: {
        maxImages: 20,
        maxDuration: 60,
        storageType: 'local'
      }
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-shorts-config-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  // 환경설정 가져오기
  const importConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target?.result as string);
        console.log('설정 파일 로드:', config);
        // 설정 적용 로직 (API 키 제외)
        alert('설정 파일이 로드되었습니다 (API 키는 별도 입력 필요)');
      } catch (error) {
        alert('설정 파일 형식이 올바르지 않습니다');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="w-8 h-8" />
          시스템 관리
        </h1>
        <div className="flex gap-2">
          <Button onClick={exportConfig} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            설정 내보내기
          </Button>
          <label className="cursor-pointer">
            <Button variant="outline" className="gap-2">
              <Upload className="w-4 h-4" />
              설정 가져오기
            </Button>
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={importConfig}
            />
          </label>
        </div>
      </div>

      <Tabs defaultValue="api-keys" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="api-keys" className="gap-2">
            <Key className="w-4 h-4" />
            API 키
          </TabsTrigger>
          <TabsTrigger value="health" className="gap-2">
            <Activity className="w-4 h-4" />
            시스템 상태
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="w-4 h-4" />
            보안
          </TabsTrigger>
          <TabsTrigger value="backup" className="gap-2">
            <Database className="w-4 h-4" />
            백업 관리
          </TabsTrigger>
        </TabsList>

        {/* API 키 관리 탭 */}
        <TabsContent value="api-keys" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                API 키 관리
                <Button 
                  onClick={validateAllKeys} 
                  disabled={loading}
                  className="gap-2"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  전체 검증
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Gemini API */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Google Gemini AI API Key</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showKeys.gemini ? "text" : "password"}
                      placeholder="AIzaSyC..."
                      value={apiKeys.gemini}
                      onChange={(e) => setApiKeys({...apiKeys, gemini: e.target.value})}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={() => setShowKeys({...showKeys, gemini: !showKeys.gemini})}
                    >
                      {showKeys.gemini ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  <Button
                    onClick={() => testApiKey('gemini')}
                    disabled={testing === 'gemini'}
                    variant="outline"
                  >
                    {testing === 'gemini' ? '테스트 중...' : '테스트'}
                  </Button>
                </div>
                <p className="text-xs text-gray-600">
                  Google AI Studio에서 발급: https://aistudio.google.com/
                </p>
              </div>

              {/* Azure Speech API */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Azure Speech Services Key</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showKeys.azure ? "text" : "password"}
                      placeholder="Azure 구독 키"
                      value={apiKeys.azure}
                      onChange={(e) => setApiKeys({...apiKeys, azure: e.target.value})}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={() => setShowKeys({...showKeys, azure: !showKeys.azure})}
                    >
                      {showKeys.azure ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  <Button
                    onClick={() => testApiKey('azure')}
                    disabled={testing === 'azure'}
                    variant="outline"
                  >
                    {testing === 'azure' ? '테스트 중...' : '테스트'}
                  </Button>
                </div>
              </div>

              {/* OpenAI API */}
              <div className="space-y-2">
                <label className="text-sm font-medium">OpenAI API Key</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showKeys.openai ? "text" : "password"}
                      placeholder="sk-..."
                      value={apiKeys.openai}
                      onChange={(e) => setApiKeys({...apiKeys, openai: e.target.value})}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={() => setShowKeys({...showKeys, openai: !showKeys.openai})}
                    >
                      {showKeys.openai ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  <Button
                    onClick={() => testApiKey('openai')}
                    disabled={testing === 'openai'}
                    variant="outline"
                  >
                    {testing === 'openai' ? '테스트 중...' : '테스트'}
                  </Button>
                </div>
              </div>

              {/* 검증 결과 */}
              {validationResults.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      {validationResults.map(result => (
                        <div key={result.service} className="flex items-center gap-2">
                          {result.valid ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                          <span className="capitalize">{result.service}</span>
                          {!result.valid && <span className="text-red-600">: {result.error}</span>}
                        </div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 시스템 상태 탭 */}
        <TabsContent value="health" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                시스템 건강 상태
                <Button onClick={loadHealthStatus} variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {healthStatus && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant={healthStatus.healthy ? "default" : "destructive"}>
                      {healthStatus.healthy ? "건강함" : "문제 있음"}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      마지막 확인: {new Date(healthStatus.timestamp).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">환경 설정</h4>
                      <div className="space-y-1 text-sm">
                        <div>환경: {healthStatus.environment.nodeEnv}</div>
                        <div>최대 이미지: {healthStatus.environment.maxImages}개</div>
                        <div>최대 영상 길이: {healthStatus.environment.maxDuration}초</div>
                        <div>저장소: {healthStatus.environment.storageType}</div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">API 상태</h4>
                      <div className="space-y-1">
                        {healthStatus.apis.map(api => (
                          <div key={api.service} className="flex items-center gap-2 text-sm">
                            {api.valid ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )}
                            <span className="capitalize">{api.service}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 보안 탭 */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>보안 설정</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <strong>중요:</strong> API 키는 환경변수로 관리하는 것이 가장 안전합니다.
                  .env.local 파일이 Git에 커밋되지 않도록 주의하세요.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 백업 관리 탭 */}
        <TabsContent value="backup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>백업 및 복구</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">환경변수 백업</h4>
                <p className="text-sm text-gray-600 mb-2">
                  현재 .env.local 파일을 안전한 곳에 백업하세요 (API 키 포함)
                </p>
                <Textarea
                  placeholder="# 백업용 환경변수 텍스트&#10;GEMINI_API_KEY=your_key&#10;AZURE_SPEECH_KEY=your_key"
                  rows={6}
                  className="font-mono text-xs"
                />
                <p className="text-xs text-red-600 mt-1">
                  ⚠️ 이 텍스트에는 민감한 정보가 포함되어 있습니다. 안전하게 관리하세요.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}