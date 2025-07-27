#!/usr/bin/env node
// 환경 설정 초기화 스크립트

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🚀 AI Shorts Maker 환경 설정 초기화');
console.log('=====================================\n');

const projectRoot = process.cwd();
const envExamplePath = path.join(projectRoot, '.env.example');
const envLocalPath = path.join(projectRoot, '.env.local');
const gitignorePath = path.join(projectRoot, '.gitignore');

// 1. .env.example 파일 존재 확인
if (!fs.existsSync(envExamplePath)) {
  console.error('❌ .env.example 파일이 없습니다.');
  console.log('💡 먼저 .env.example 파일을 생성하세요.');
  process.exit(1);
}

// 2. .env.local 파일 확인 및 생성
if (fs.existsSync(envLocalPath)) {
  console.log('⚠️  .env.local 파일이 이미 존재합니다.');
  
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  readline.question('덮어쓰시겠습니까? (y/N): ', (answer) => {
    if (answer.toLowerCase() !== 'y') {
      console.log('🚫 설정을 취소했습니다.');
      readline.close();
      return;
    }
    
    createEnvFile();
    readline.close();
  });
} else {
  createEnvFile();
}

function createEnvFile() {
  console.log('📝 .env.local 파일 생성 중...');
  
  // .env.example 읽기
  let envContent = fs.readFileSync(envExamplePath, 'utf8');
  
  // 자동 생성 가능한 값들 설정
  const randomSecret = crypto.randomBytes(32).toString('hex');
  const encryptionKey = crypto.randomBytes(16).toString('hex').padEnd(32, '0');
  
  envContent = envContent
    .replace('your_nextauth_secret_here', randomSecret)
    .replace('your_32_character_encryption_key_', encryptionKey)
    .replace('username:password@localhost:5432', `ai_shorts_user:${crypto.randomBytes(8).toString('hex')}@localhost:5432`);
  
  // .env.local 파일 작성
  fs.writeFileSync(envLocalPath, envContent);
  console.log('✅ .env.local 파일이 생성되었습니다.');
  
  // .gitignore 확인 및 업데이트
  updateGitignore();
  
  // 다음 단계 안내
  showNextSteps();
}

function updateGitignore() {
  console.log('🔒 .gitignore 파일 확인 중...');
  
  let gitignoreContent = '';
  if (fs.existsSync(gitignorePath)) {
    gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  }
  
  const envRules = [
    '# 환경변수 파일 (API 키 보호)',
    '.env*',
    '!.env.example'
  ];
  
  let needsUpdate = false;
  envRules.forEach(rule => {
    if (!gitignoreContent.includes(rule)) {
      gitignoreContent += '\n' + rule;
      needsUpdate = true;
    }
  });
  
  if (needsUpdate) {
    fs.writeFileSync(gitignorePath, gitignoreContent);
    console.log('✅ .gitignore 파일이 업데이트되었습니다.');
  } else {
    console.log('✅ .gitignore 파일이 이미 올바르게 설정되어 있습니다.');
  }
}

function showNextSteps() {
  console.log('\n🎯 다음 단계:');
  console.log('=====================================');
  console.log('1. .env.local 파일에서 다음 값들을 설정하세요:');
  console.log('   • GEMINI_API_KEY (Google AI Studio에서 발급)');
  console.log('   • AZURE_SPEECH_KEY (Azure Portal에서 발급)');
  console.log('   • OPENAI_API_KEY (OpenAI Platform에서 발급)');
  console.log('   • DATABASE_URL (PostgreSQL 연결 정보)');
  console.log('');
  console.log('2. API 키 발급 링크:');
  console.log('   • Gemini: https://aistudio.google.com/');
  console.log('   • Azure: https://portal.azure.com/');
  console.log('   • OpenAI: https://platform.openai.com/api-keys');
  console.log('');
  console.log('3. 개발 서버 시작:');
  console.log('   npm run dev');
  console.log('');
  console.log('4. 관리자 페이지에서 API 키 테스트:');
  console.log('   http://localhost:3000/admin/settings');
  console.log('');
  console.log('⚠️  중요: .env.local 파일을 Git에 커밋하지 마세요!');
  console.log('🔐 API 키는 안전하게 보관하세요.');
}

// 스크립트가 직접 실행된 경우
if (require.main === module) {
  // 실행 로직은 이미 위에 있음
}