/**
 * Cafe Hub - 사내 카페 예약 서비스
 * JavaScript 메인 파일
 */

// ============================================
// 설정
// ============================================

// Google Apps Script 웹 앱 URL (배포 후 여기에 URL을 입력하세요)
const CONFIG = {
    APPS_SCRIPT_URL: 'YOUR_APPS_SCRIPT_WEB_APP_URL_HERE',
    MIN_RESERVATION_DAYS: 1, // 최소 예약 가능 일수 (오늘로부터)
    MAX_RESERVATION_DAYS: 30 // 최대 예약 가능 일수
};

// ============================================
// DOM 요소
// ============================================

const elements = {
    reservationForm: document.getElementById('reservationForm'),
    successModal: document.getElementById('successModal'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    mobileMenuBtn: document.querySelector('.mobile-menu-btn'),
    navLinks: document.querySelector('.nav-links'),
    reservationDate: document.getElementById('reservationDate'),
    spaceType: document.getElementById('spaceType'),
    guestCount: document.getElementById('guestCount')
};

// ============================================
// 초기화
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    initializeDatePicker();
    initializeFormValidation();
    initializeMobileMenu();
    initializeScrollEffects();
    initializeSpaceTypeHandler();
});

// ============================================
// 날짜 선택 초기화
// ============================================

function initializeDatePicker() {
    const dateInput = elements.reservationDate;
    if (!dateInput) return;

    // 최소 날짜 설정 (내일부터)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + CONFIG.MIN_RESERVATION_DAYS);

    // 최대 날짜 설정
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + CONFIG.MAX_RESERVATION_DAYS);

    // 날짜 형식 변환 (YYYY-MM-DD)
    dateInput.min = formatDate(tomorrow);
    dateInput.max = formatDate(maxDate);

    // 주말 선택 방지
    dateInput.addEventListener('change', function() {
        const selectedDate = new Date(this.value);
        const dayOfWeek = selectedDate.getDay();

        if (dayOfWeek === 0 || dayOfWeek === 6) {
            alert('주말은 예약이 불가능합니다. 평일을 선택해주세요.');
            this.value = '';
        }
    });
}

// ============================================
// 공간 타입 핸들러
// ============================================

function initializeSpaceTypeHandler() {
    const spaceType = elements.spaceType;
    const guestCount = elements.guestCount;

    if (!spaceType || !guestCount) return;

    spaceType.addEventListener('change', function() {
        const type = this.value;

        if (type === 'meeting') {
            guestCount.min = 1;
            guestCount.max = 6;
            guestCount.placeholder = '1-6명';
        } else if (type === 'party') {
            guestCount.min = 1;
            guestCount.max = 15;
            guestCount.placeholder = '1-15명';
        } else {
            guestCount.min = 1;
            guestCount.max = 15;
            guestCount.placeholder = '인원수';
        }
    });
}

// ============================================
// 폼 유효성 검사 및 제출
// ============================================

function initializeFormValidation() {
    const form = elements.reservationForm;
    if (!form) return;

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        // 유효성 검사
        if (!validateForm()) {
            return;
        }

        // 폼 데이터 수집
        const formData = collectFormData();

        // 예약 처리
        await submitReservation(formData);
    });
}

function validateForm() {
    const form = elements.reservationForm;

    // 필수 필드 검사
    const requiredFields = form.querySelectorAll('[required]');
    for (const field of requiredFields) {
        if (!field.value.trim()) {
            showFieldError(field, '이 필드를 입력해주세요.');
            field.focus();
            return false;
        }
    }

    // 이메일 형식 검사
    const email = document.getElementById('email');
    if (email && !isValidEmail(email.value)) {
        showFieldError(email, '올바른 이메일 형식을 입력해주세요.');
        email.focus();
        return false;
    }

    // 전화번호 형식 검사
    const phone = document.getElementById('phone');
    if (phone && !isValidPhone(phone.value)) {
        showFieldError(phone, '올바른 전화번호 형식을 입력해주세요. (예: 010-1234-5678)');
        phone.focus();
        return false;
    }

    // 인원수 검사
    const guestCount = document.getElementById('guestCount');
    const spaceType = document.getElementById('spaceType');
    if (guestCount && spaceType) {
        const count = parseInt(guestCount.value);
        const type = spaceType.value;

        if (type === 'meeting' && (count < 1 || count > 6)) {
            showFieldError(guestCount, '미팅 테이블은 1-6명까지 이용 가능합니다.');
            guestCount.focus();
            return false;
        }

        if (type === 'party' && (count < 1 || count > 15)) {
            showFieldError(guestCount, '파티 공간은 1-15명까지 이용 가능합니다.');
            guestCount.focus();
            return false;
        }
    }

    return true;
}

function collectFormData() {
    const form = elements.reservationForm;
    const formData = new FormData(form);

    return {
        name: formData.get('name'),
        department: formData.get('department'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        spaceType: formData.get('spaceType'),
        guestCount: formData.get('guestCount'),
        reservationDate: formData.get('reservationDate'),
        reservationTime: formData.get('reservationTime'),
        duration: formData.get('duration'),
        purpose: formData.get('purpose') || '',
        requests: formData.get('requests') || '',
        submittedAt: new Date().toISOString()
    };
}

async function submitReservation(data) {
    showLoading(true);

    try {
        // Google Apps Script URL이 설정되었는지 확인
        if (CONFIG.APPS_SCRIPT_URL === 'YOUR_APPS_SCRIPT_WEB_APP_URL_HERE') {
            // 데모 모드: URL이 설정되지 않은 경우
            console.log('예약 데이터:', data);
            await simulateApiCall();
            showSuccessModal();
            elements.reservationForm.reset();
        } else {
            // 실제 API 호출
            const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            showSuccessModal();
            elements.reservationForm.reset();
        }
    } catch (error) {
        console.error('예약 처리 중 오류 발생:', error);
        alert('예약 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
        showLoading(false);
    }
}

// API 호출 시뮬레이션 (데모용)
function simulateApiCall() {
    return new Promise(resolve => setTimeout(resolve, 1500));
}

// ============================================
// 모바일 메뉴
// ============================================

function initializeMobileMenu() {
    const menuBtn = elements.mobileMenuBtn;
    const navLinks = elements.navLinks;

    if (!menuBtn || !navLinks) return;

    menuBtn.addEventListener('click', function() {
        navLinks.classList.toggle('active');

        // 햄버거 아이콘 애니메이션
        const spans = menuBtn.querySelectorAll('span');
        spans.forEach(span => span.classList.toggle('active'));
    });

    // 메뉴 링크 클릭 시 메뉴 닫기
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', function() {
            navLinks.classList.remove('active');
        });
    });
}

// ============================================
// 스크롤 효과
// ============================================

function initializeScrollEffects() {
    // 네비게이션 스크롤 효과
    const navbar = document.querySelector('.navbar');

    window.addEventListener('scroll', function() {
        if (window.scrollY > 100) {
            navbar.style.boxShadow = '0 2px 30px rgba(0, 0, 0, 0.15)';
        } else {
            navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        }
    });

    // 부드러운 스크롤
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ============================================
// 유틸리티 함수
// ============================================

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPhone(phone) {
    const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
    return phoneRegex.test(phone.replace(/-/g, ''));
}

function showFieldError(field, message) {
    // 기존 에러 메시지 제거
    const existingError = field.parentElement.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }

    // 에러 스타일 적용
    field.style.borderColor = '#e74c3c';

    // 에러 메시지 표시
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.color = '#e74c3c';
    errorDiv.style.fontSize = '0.85rem';
    errorDiv.style.marginTop = '5px';
    errorDiv.textContent = message;
    field.parentElement.appendChild(errorDiv);

    // 입력 시 에러 스타일 제거
    field.addEventListener('input', function() {
        this.style.borderColor = '';
        const error = this.parentElement.querySelector('.error-message');
        if (error) error.remove();
    }, { once: true });
}

// ============================================
// 모달 & 로딩
// ============================================

function showSuccessModal() {
    const modal = elements.successModal;
    if (modal) {
        modal.classList.add('active');
    }
}

function closeModal() {
    const modal = elements.successModal;
    if (modal) {
        modal.classList.remove('active');
    }
}

function showLoading(show) {
    const overlay = elements.loadingOverlay;
    if (overlay) {
        if (show) {
            overlay.classList.add('active');
        } else {
            overlay.classList.remove('active');
        }
    }
}

// 전역 함수로 노출 (HTML onclick에서 사용)
window.closeModal = closeModal;
