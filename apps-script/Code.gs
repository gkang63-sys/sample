/**
 * Cafe Hub - Google Apps Script
 * 카페 예약 데이터를 Google Sheets에 저장하는 웹 API
 *
 * 사용 방법:
 * 1. Google Drive에서 새 Google Sheets 문서 생성
 * 2. 확장 프로그램 > Apps Script 클릭
 * 3. 이 코드를 복사하여 붙여넣기
 * 4. 배포 > 새 배포 > 웹 앱으로 배포
 */

// ============================================
// 설정
// ============================================

// 스프레드시트 설정 (자동으로 연결된 스프레드시트 사용)
const SHEET_NAME = '예약목록';

// 이메일 알림 설정 (선택사항)
const ADMIN_EMAIL = ''; // 관리자 이메일 주소 입력 (비워두면 알림 없음)
const SEND_CONFIRMATION_EMAIL = true; // 예약자에게 확인 이메일 발송 여부

// ============================================
// 웹 앱 엔드포인트
// ============================================

/**
 * GET 요청 처리 - 예약 조회
 */
function doGet(e) {
  try {
    const action = e.parameter.action || 'list';

    if (action === 'list') {
      return getReservations();
    } else if (action === 'check') {
      // 특정 날짜/시간의 예약 가능 여부 확인
      const date = e.parameter.date;
      const time = e.parameter.time;
      const spaceType = e.parameter.spaceType;
      return checkAvailability(date, time, spaceType);
    }

    return createResponse({ success: false, message: '알 수 없는 요청입니다.' });
  } catch (error) {
    return createResponse({ success: false, message: error.toString() });
  }
}

/**
 * POST 요청 처리 - 예약 생성
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    return createReservation(data);
  } catch (error) {
    return createResponse({ success: false, message: error.toString() });
  }
}

// ============================================
// 예약 관리 함수
// ============================================

/**
 * 새 예약 생성
 */
function createReservation(data) {
  const sheet = getOrCreateSheet();

  // 중복 예약 확인
  const isDuplicate = checkDuplicateReservation(
    data.reservationDate,
    data.reservationTime,
    data.spaceType,
    parseInt(data.duration)
  );

  if (isDuplicate) {
    return createResponse({
      success: false,
      message: '해당 시간에 이미 예약이 있습니다. 다른 시간을 선택해주세요.'
    });
  }

  // 예약 ID 생성
  const reservationId = generateReservationId();

  // 데이터 행 추가
  const row = [
    reservationId,
    data.name,
    data.department,
    data.email,
    data.phone,
    getSpaceTypeName(data.spaceType),
    data.guestCount,
    data.reservationDate,
    data.reservationTime,
    data.duration + '시간',
    data.purpose || '',
    data.requests || '',
    '대기중',
    new Date().toLocaleString('ko-KR'),
    data.submittedAt
  ];

  sheet.appendRow(row);

  // 확인 이메일 발송
  if (SEND_CONFIRMATION_EMAIL && data.email) {
    sendConfirmationEmail(data, reservationId);
  }

  // 관리자 알림
  if (ADMIN_EMAIL) {
    sendAdminNotification(data, reservationId);
  }

  return createResponse({
    success: true,
    message: '예약이 성공적으로 접수되었습니다.',
    reservationId: reservationId
  });
}

/**
 * 예약 목록 조회
 */
function getReservations() {
  const sheet = getOrCreateSheet();
  const data = sheet.getDataRange().getValues();

  if (data.length <= 1) {
    return createResponse({ success: true, data: [] });
  }

  const headers = data[0];
  const reservations = data.slice(1).map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });

  return createResponse({ success: true, data: reservations });
}

/**
 * 예약 가능 여부 확인
 */
function checkAvailability(date, time, spaceType) {
  const isDuplicate = checkDuplicateReservation(date, time, spaceType, 1);

  return createResponse({
    success: true,
    available: !isDuplicate
  });
}

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 시트 가져오기 또는 생성
 */
function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);

    // 헤더 행 추가
    const headers = [
      '예약ID',
      '예약자명',
      '부서',
      '이메일',
      '연락처',
      '공간유형',
      '인원수',
      '예약날짜',
      '예약시간',
      '이용시간',
      '이용목적',
      '요청사항',
      '상태',
      '등록일시',
      '원본제출시각'
    ];

    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

    // 헤더 스타일 적용
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#8B4513');
    headerRange.setFontColor('#FFFFFF');
    headerRange.setFontWeight('bold');

    // 열 너비 조정
    sheet.setColumnWidth(1, 120);  // 예약ID
    sheet.setColumnWidth(2, 80);   // 예약자명
    sheet.setColumnWidth(3, 80);   // 부서
    sheet.setColumnWidth(4, 180);  // 이메일
    sheet.setColumnWidth(5, 120);  // 연락처
    sheet.setColumnWidth(6, 100);  // 공간유형
    sheet.setColumnWidth(7, 60);   // 인원수
    sheet.setColumnWidth(8, 100);  // 예약날짜
    sheet.setColumnWidth(9, 80);   // 예약시간
    sheet.setColumnWidth(10, 80);  // 이용시간
    sheet.setColumnWidth(11, 150); // 이용목적
    sheet.setColumnWidth(12, 200); // 요청사항
    sheet.setColumnWidth(13, 80);  // 상태
    sheet.setColumnWidth(14, 150); // 등록일시

    // 첫 행 고정
    sheet.setFrozenRows(1);
  }

  return sheet;
}

/**
 * 예약 ID 생성
 */
function generateReservationId() {
  const now = new Date();
  const dateStr = Utilities.formatDate(now, 'Asia/Seoul', 'yyyyMMdd');
  const timeStr = Utilities.formatDate(now, 'Asia/Seoul', 'HHmmss');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `RSV-${dateStr}-${timeStr}-${random}`;
}

/**
 * 공간 유형 이름 변환
 */
function getSpaceTypeName(type) {
  const types = {
    'meeting': '미팅 테이블',
    'party': '파티 공간'
  };
  return types[type] || type;
}

/**
 * 중복 예약 확인
 */
function checkDuplicateReservation(date, time, spaceType, duration) {
  const sheet = getOrCreateSheet();
  const data = sheet.getDataRange().getValues();

  if (data.length <= 1) return false;

  const spaceTypeName = getSpaceTypeName(spaceType);
  const requestedStart = timeToMinutes(time);
  const requestedEnd = requestedStart + (duration * 60);

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rowDate = row[7]; // 예약날짜
    const rowTime = row[8]; // 예약시간
    const rowSpaceType = row[5]; // 공간유형
    const rowDuration = parseInt(row[9]); // 이용시간
    const rowStatus = row[12]; // 상태

    // 취소된 예약은 무시
    if (rowStatus === '취소') continue;

    // 같은 날짜, 같은 공간인 경우
    if (rowDate === date && rowSpaceType === spaceTypeName) {
      const existingStart = timeToMinutes(rowTime);
      const existingEnd = existingStart + (rowDuration * 60);

      // 시간 겹침 확인
      if (requestedStart < existingEnd && requestedEnd > existingStart) {
        return true;
      }
    }
  }

  return false;
}

/**
 * 시간을 분으로 변환
 */
function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + (minutes || 0);
}

/**
 * JSON 응답 생성
 */
function createResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================
// 이메일 알림
// ============================================

/**
 * 예약 확인 이메일 발송
 */
function sendConfirmationEmail(data, reservationId) {
  const subject = '[Cafe Hub] 예약 신청이 접수되었습니다';

  const htmlBody = `
    <div style="font-family: 'Noto Sans KR', sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #8B4513; color: white; padding: 30px; text-align: center;">
        <h1 style="margin: 0;">☕ Cafe Hub</h1>
        <p style="margin: 10px 0 0 0;">사내 카페 예약 서비스</p>
      </div>

      <div style="padding: 30px; background: #f9f9f9;">
        <h2 style="color: #2c3e50;">안녕하세요, ${data.name}님!</h2>
        <p>카페 공간 예약 신청이 정상적으로 접수되었습니다.</p>

        <div style="background: white; border-radius: 10px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #8B4513; border-bottom: 2px solid #E8DCC8; padding-bottom: 10px;">예약 정보</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; color: #666;">예약 번호</td>
              <td style="padding: 10px 0; font-weight: bold;">${reservationId}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #666;">공간</td>
              <td style="padding: 10px 0;">${getSpaceTypeName(data.spaceType)}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #666;">날짜</td>
              <td style="padding: 10px 0;">${data.reservationDate}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #666;">시간</td>
              <td style="padding: 10px 0;">${data.reservationTime} (${data.duration}시간)</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #666;">인원</td>
              <td style="padding: 10px 0;">${data.guestCount}명</td>
            </tr>
          </table>
        </div>

        <div style="background: #FFF3CD; border-radius: 10px; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #856404;">
            <strong>📌 안내사항</strong><br>
            예약 확정 여부는 별도로 안내드립니다.<br>
            문의사항은 내선 1234로 연락주세요.
          </p>
        </div>
      </div>

      <div style="background: #2c3e50; color: rgba(255,255,255,0.7); padding: 20px; text-align: center; font-size: 14px;">
        <p style="margin: 0;">© 2024 Cafe Hub. All rights reserved.</p>
      </div>
    </div>
  `;

  try {
    MailApp.sendEmail({
      to: data.email,
      subject: subject,
      htmlBody: htmlBody
    });
  } catch (error) {
    console.log('이메일 발송 실패:', error);
  }
}

/**
 * 관리자 알림 이메일 발송
 */
function sendAdminNotification(data, reservationId) {
  if (!ADMIN_EMAIL) return;

  const subject = '[Cafe Hub] 새로운 예약 신청';

  const body = `
새로운 예약 신청이 접수되었습니다.

[예약 정보]
- 예약 번호: ${reservationId}
- 예약자: ${data.name} (${data.department})
- 연락처: ${data.phone}
- 이메일: ${data.email}
- 공간: ${getSpaceTypeName(data.spaceType)}
- 날짜: ${data.reservationDate}
- 시간: ${data.reservationTime} (${data.duration}시간)
- 인원: ${data.guestCount}명
- 목적: ${data.purpose || '-'}
- 요청사항: ${data.requests || '-'}
- 신청일시: ${new Date().toLocaleString('ko-KR')}

Google Sheets에서 예약 현황을 확인하세요.
  `;

  try {
    MailApp.sendEmail({
      to: ADMIN_EMAIL,
      subject: subject,
      body: body
    });
  } catch (error) {
    console.log('관리자 알림 발송 실패:', error);
  }
}

// ============================================
// 테스트 함수
// ============================================

/**
 * 시트 초기화 테스트
 */
function testCreateSheet() {
  const sheet = getOrCreateSheet();
  console.log('시트 생성 완료:', sheet.getName());
}

/**
 * 예약 생성 테스트
 */
function testCreateReservation() {
  const testData = {
    name: '테스트',
    department: '개발팀',
    email: 'test@company.com',
    phone: '010-1234-5678',
    spaceType: 'meeting',
    guestCount: '4',
    reservationDate: '2024-12-25',
    reservationTime: '14:00',
    duration: '2',
    purpose: '팀 미팅',
    requests: '화이트보드 필요',
    submittedAt: new Date().toISOString()
  };

  const result = createReservation(testData);
  console.log('예약 생성 결과:', result.getContent());
}
