#!/usr/bin/env node

/**
 * AI Shorts Maker - 버전 관리 스크립트
 * 
 * 사용법:
 * node scripts/version-manager.js patch "버그 수정 내용"
 * node scripts/version-manager.js minor "새로운 기능 추가"
 * node scripts/version-manager.js major "호환성 변경"
 */

const fs = require('fs');
const path = require('path');

// 버전 타입 정의
const VERSION_TYPES = {
  patch: 2,  // x.x.PATCH
  minor: 1,  // x.MINOR.x  
  major: 0   // MAJOR.x.x
};

// 현재 날짜 포맷팅
function getCurrentDate() {
  return new Date().toISOString().split('T')[0];
}

// package.json에서 현재 버전 읽기
function getCurrentVersion() {
  const packagePath = path.join(__dirname, '..', 'package.json');
  const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  return packageData.version;
}

// 버전 증가
function incrementVersion(currentVersion, type) {
  const parts = currentVersion.split('.').map(Number);
  
  const index = VERSION_TYPES[type];
  parts[index]++;
  
  // 하위 버전들은 0으로 리셋
  for (let i = index + 1; i < parts.length; i++) {
    parts[i] = 0;
  }
  
  return parts.join('.');
}

// package.json 버전 업데이트
function updatePackageVersion(newVersion) {
  const packagePath = path.join(__dirname, '..', 'package.json');
  const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  packageData.version = newVersion;
  fs.writeFileSync(packagePath, JSON.stringify(packageData, null, 2) + '\n');
}

// VERSION.json 업데이트
function updateVersionJson(newVersion, type, description) {
  const versionPath = path.join(__dirname, '..', 'VERSION.json');
  const versionData = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
  
  // 이전 버전을 history에 추가
  const previousVersion = {
    version: versionData.version,
    releaseDate: versionData.releaseDate,
    codename: versionData.codename,
    major_changes: versionData.changelog.major.concat(versionData.changelog.minor)
  };
  
  versionData.previous_versions.unshift(previousVersion);
  
  // 새로운 버전 정보 업데이트
  versionData.version = newVersion;
  versionData.releaseDate = getCurrentDate();
  versionData.stability = "stable";
  
  // 변경사항 초기화 및 새 항목 추가
  versionData.changelog = {
    major: type === 'major' ? [description] : [],
    minor: type === 'minor' ? [description] : [],
    patch: type === 'patch' ? [description] : []
  };
  
  fs.writeFileSync(versionPath, JSON.stringify(versionData, null, 2) + '\n');
}

// CHANGELOG.md 업데이트
function updateChangelog(newVersion, type, description) {
  const changelogPath = path.join(__dirname, '..', 'CHANGELOG.md');
  const currentChangelog = fs.readFileSync(changelogPath, 'utf8');
  
  // 변경 타입별 이모지
  const typeEmojis = {
    major: '🚀',
    minor: '🆕', 
    patch: '🐛'
  };
  
  const typeLabels = {
    major: 'Changed (호환성 변경)',
    minor: 'Added (새로운 기능)',
    patch: 'Fixed (버그 수정)'
  };
  
  // 새 버전 섹션 생성
  const newSection = `## [${newVersion}] - ${getCurrentDate()}

### ${typeEmojis[type]} ${typeLabels[type]}
- ${description}

---

`;
  
  // [Unreleased] 다음에 새 섹션 삽입
  const unreleasedEnd = currentChangelog.indexOf('---\n\n## [');
  if (unreleasedEnd !== -1) {
    const before = currentChangelog.substring(0, unreleasedEnd + 5);
    const after = currentChangelog.substring(unreleasedEnd + 5);
    const updated = before + '\n' + newSection + after;
    
    fs.writeFileSync(changelogPath, updated);
  }
}

// 메인 실행 함수
function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('사용법: node version-manager.js <patch|minor|major> "변경사항 설명"');
    process.exit(1);
  }
  
  const [type, description] = args;
  
  if (!VERSION_TYPES.hasOwnProperty(type)) {
    console.error('버전 타입은 patch, minor, major 중 하나여야 합니다.');
    process.exit(1);
  }
  
  try {
    const currentVersion = getCurrentVersion();
    const newVersion = incrementVersion(currentVersion, type);
    
    console.log(`버전 업데이트: ${currentVersion} → ${newVersion}`);
    console.log(`변경 타입: ${type}`);
    console.log(`설명: ${description}`);
    
    // 파일들 업데이트
    updatePackageVersion(newVersion);
    updateVersionJson(newVersion, type, description);
    updateChangelog(newVersion, type, description);
    
    console.log('\n✅ 버전 업데이트가 완료되었습니다!');
    console.log(`📄 CHANGELOG.md를 확인하여 추가 수정사항을 입력하세요.`);
    
  } catch (error) {
    console.error('버전 업데이트 중 오류 발생:', error.message);
    process.exit(1);
  }
}

// 스크립트가 직접 실행될 때만 main() 호출
if (require.main === module) {
  main();
}

module.exports = {
  incrementVersion,
  getCurrentVersion,
  updatePackageVersion,
  updateVersionJson,
  updateChangelog
};