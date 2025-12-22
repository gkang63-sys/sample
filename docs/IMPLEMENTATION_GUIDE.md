# Cafe Hub - 사내 카페 예약 서비스 구현 가이드

> 비개발자도 따라할 수 있는 단계별 설정 가이드입니다.

---

## 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [필요한 것들](#2-필요한-것들)
3. [Google Sheets 설정](#3-google-sheets-설정)
4. [Google Apps Script 설정](#4-google-apps-script-설정)
5. [웹페이지에 API 연결하기](#5-웹페이지에-api-연결하기)
6. [웹페이지 호스팅하기](#6-웹페이지-호스팅하기)
7. [카페 정보 수정하기](#7-카페-정보-수정하기)
8. [문제 해결](#8-문제-해결)

---

## 1. 프로젝트 개요

### 이 서비스는 무엇인가요?

사내 직원들이 카페 공간(미팅 테이블, 파티 공간)을 예약할 수 있는 웹페이지입니다.

### 어떻게 작동하나요?

```
[직원이 예약 폼 작성] → [Google Sheets에 자동 저장] → [이메일 알림 발송]
```

### 프로젝트 구조

```
sample/
├── index.html          ← 메인 웹페이지
├── css/
│   └── style.css       ← 디자인 스타일
├── js/
│   └── app.js          ← 기능 동작 코드
├── apps-script/
│   └── Code.gs         ← Google Sheets 연동 코드
├── images/             ← 이미지 저장 폴더
└── docs/
    └── IMPLEMENTATION_GUIDE.md  ← 이 문서
```

---

## 2. 필요한 것들

시작하기 전에 다음을 준비하세요:

- [ ] Google 계정 (Gmail)
- [ ] 웹 브라우저 (Chrome 권장)
- [ ] 텍스트 편집기 (메모장도 가능, VS Code 권장)

---

## 3. Google Sheets 설정

### 3.1 새 스프레드시트 만들기

1. [Google Drive](https://drive.google.com)에 접속합니다
2. 왼쪽 상단 **`+ 새로 만들기`** 버튼 클릭
3. **`Google 스프레드시트`** 선택
4. 문서 이름을 **"카페 예약 관리"**로 변경

### 3.2 스프레드시트 ID 확인하기

스프레드시트 URL에서 ID를 확인할 수 있습니다:

```
https://docs.google.com/spreadsheets/d/[이 부분이 스프레드시트 ID]/edit
```

예시:
```
https://docs.google.com/spreadsheets/d/1a2b3c4d5e6f7g8h9i0j/edit
                                       ↑ 이것이 ID입니다
```

> 💡 이 ID는 나중에 사용하지 않습니다. Apps Script가 자동으로 연결됩니다.

---

## 4. Google Apps Script 설정

### 4.1 Apps Script 열기

1. 위에서 만든 스프레드시트를 엽니다
2. 상단 메뉴에서 **`확장 프로그램`** 클릭
3. **`Apps Script`** 클릭

### 4.2 코드 붙여넣기

1. 기존 코드(`function myFunction() { }`)를 모두 삭제합니다
2. `apps-script/Code.gs` 파일의 내용을 전체 복사합니다
3. Apps Script 편집기에 붙여넣습니다
4. **`Ctrl + S`** (Mac: `Cmd + S`)로 저장합니다

### 4.3 이메일 설정 (선택사항)

코드 상단에서 이메일 설정을 변경할 수 있습니다:

```javascript
// 관리자 이메일 (예약 알림을 받을 주소)
const ADMIN_EMAIL = 'admin@company.com';  // 여기에 이메일 입력

// 예약자에게 확인 이메일 발송 여부
const SEND_CONFIRMATION_EMAIL = true;  // true: 발송, false: 발송 안함
```

### 4.4 테스트 실행

1. 상단 함수 선택 드롭다운에서 **`testCreateSheet`** 선택
2. **▶ 실행** 버튼 클릭
3. 권한 요청 팝업이 나타나면:
   - "권한 검토" 클릭
   - 본인 Google 계정 선택
   - "고급" 클릭 → "안전하지 않음" 페이지로 이동
   - "허용" 클릭

4. 스프레드시트로 돌아가면 **"예약목록"** 시트가 생성되어 있습니다!

### 4.5 웹 앱으로 배포하기

1. Apps Script에서 **`배포`** → **`새 배포`** 클릭
2. 설정:
   - **유형**: `웹 앱` 선택 (톱니바퀴 아이콘 클릭)
   - **설명**: "카페 예약 API v1"
   - **실행 주체**: "나"
   - **액세스 권한**: "모든 사용자"
3. **`배포`** 버튼 클릭
4. **웹 앱 URL이 표시됩니다** - 이것을 복사해두세요!

예시 URL:
```
https://script.google.com/macros/s/AKfycbx.../exec
```

> ⚠️ **중요**: 이 URL은 절대 외부에 공개하지 마세요!

---

## 5. 웹페이지에 API 연결하기

### 5.1 JavaScript 파일 수정

1. `js/app.js` 파일을 텍스트 편집기로 엽니다
2. 상단의 설정 부분을 찾습니다:

```javascript
const CONFIG = {
    APPS_SCRIPT_URL: 'YOUR_APPS_SCRIPT_WEB_APP_URL_HERE',
    ...
};
```

3. `YOUR_APPS_SCRIPT_WEB_APP_URL_HERE`를 위에서 복사한 URL로 변경합니다:

```javascript
const CONFIG = {
    APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbx.../exec',
    ...
};
```

4. 파일을 저장합니다

---

## 6. 웹페이지 호스팅하기

웹페이지를 인터넷에 공개하는 방법입니다. 가장 쉬운 방법들을 소개합니다.

### 방법 1: GitHub Pages (무료, 권장)

#### 6.1 GitHub 계정 만들기

1. [GitHub.com](https://github.com) 접속
2. "Sign up" 클릭하여 계정 생성

#### 6.2 저장소(Repository) 만들기

1. GitHub에 로그인
2. 오른쪽 상단 **`+`** → **`New repository`** 클릭
3. 설정:
   - Repository name: `cafe-reservation`
   - Public 선택
   - "Add a README file" 체크
4. **`Create repository`** 클릭

#### 6.3 파일 업로드

1. 생성된 저장소 페이지에서 **`Add file`** → **`Upload files`** 클릭
2. 프로젝트 폴더의 파일들을 드래그 앤 드롭:
   - `index.html`
   - `css/` 폴더
   - `js/` 폴더
   - `images/` 폴더 (이미지가 있는 경우)
3. 하단의 **`Commit changes`** 클릭

#### 6.4 GitHub Pages 활성화

1. 저장소의 **`Settings`** 탭 클릭
2. 왼쪽 메뉴에서 **`Pages`** 클릭
3. Source에서 **`Deploy from a branch`** 선택
4. Branch에서 **`main`** 선택, 폴더는 **`/ (root)`** 유지
5. **`Save`** 클릭

#### 6.5 웹사이트 확인

몇 분 후 다음 주소에서 웹사이트를 확인할 수 있습니다:
```
https://[사용자명].github.io/cafe-reservation
```

### 방법 2: 로컬에서 테스트하기

개발 중 로컬에서 테스트하려면:

1. 프로젝트 폴더에서 `index.html` 파일을 더블클릭
2. 웹 브라우저에서 페이지가 열립니다

> ⚠️ 로컬 테스트 시 일부 기능(API 호출 등)이 제한될 수 있습니다.

---

## 7. 카페 정보 수정하기

### 7.1 카페 기본 정보 수정

`index.html` 파일을 열고 다음 부분을 찾아 수정하세요:

#### 카페 이름 변경
```html
<span class="logo-text">Cafe Hub</span>
```
→ "Cafe Hub"를 원하는 이름으로 변경

#### 위치 정보 변경
```html
<div class="info-card">
    <div class="info-icon">📍</div>
    <h4>위치</h4>
    <p>본사 1층 로비 옆<br>엘리베이터 앞</p>
</div>
```
→ 실제 카페 위치로 변경

#### 운영 시간 변경
```html
<div class="info-card">
    <div class="info-icon">🕐</div>
    <h4>운영 시간</h4>
    <p>평일 08:00 - 18:00<br>주말 및 공휴일 휴무</p>
</div>
```
→ 실제 운영 시간으로 변경

### 7.2 메뉴 수정

`index.html`에서 메뉴 섹션을 찾아 수정하세요:

```html
<li>
    <span class="menu-name">아메리카노</span>
    <span class="menu-price">2,500원</span>
</li>
```
→ 메뉴 이름과 가격 변경

### 7.3 이미지 추가하기

1. `images/` 폴더에 이미지 파일 저장
2. `index.html`에서 플레이스홀더를 실제 이미지로 교체:

```html
<!-- 변경 전 -->
<div class="image-placeholder">
    <span>☕</span>
    <p>카페 전경 사진</p>
</div>

<!-- 변경 후 -->
<img src="images/cafe-photo.jpg" alt="카페 전경">
```

### 7.4 색상 테마 변경

`css/style.css`에서 주요 색상을 변경할 수 있습니다:

```css
/* 메인 색상 (갈색 계열) */
.logo { color: #8B4513; }  /* 로고 색상 */
.btn-submit { background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%); }
```

색상 코드 참고:
- `#8B4513` - 새들브라운 (기본)
- `#2E8B57` - 시그린 (녹색 테마)
- `#4169E1` - 로열블루 (파란 테마)
- `#DC143C` - 크림슨 (빨간 테마)

---

## 8. 문제 해결

### Q1: 예약 버튼을 눌러도 아무 반응이 없어요

**확인사항:**
1. 브라우저 개발자 도구 열기 (F12)
2. Console 탭에서 오류 메시지 확인
3. `js/app.js`의 URL이 올바른지 확인

### Q2: Google Sheets에 데이터가 저장되지 않아요

**확인사항:**
1. Apps Script가 "웹 앱"으로 배포되었는지 확인
2. 배포 시 "모든 사용자" 액세스 권한 설정 확인
3. 새로 배포 후 URL이 변경되었다면 `app.js` 업데이트 필요

### Q3: 이메일이 발송되지 않아요

**확인사항:**
1. `Code.gs`에서 `ADMIN_EMAIL` 설정 확인
2. Gmail 일일 발송 한도 (100통) 초과 여부 확인
3. 스팸 폴더 확인

### Q4: 스타일이 깨져 보여요

**확인사항:**
1. `css/style.css` 파일이 업로드되었는지 확인
2. `index.html`에서 CSS 경로가 올바른지 확인:
```html
<link rel="stylesheet" href="css/style.css">
```

### Q5: Apps Script 권한 오류가 발생해요

**해결방법:**
1. Apps Script 편집기에서 `testCreateSheet` 함수 실행
2. 권한 요청 팝업에서 "고급" → "안전하지 않음 페이지로 이동" 클릭
3. "허용" 클릭

---

## 도움이 필요하신가요?

- 📧 문의: [담당자 이메일]
- 📞 내선: [담당자 연락처]

---

*이 가이드는 비개발자를 위해 작성되었습니다. 추가 질문이 있으시면 언제든 문의해주세요!*
