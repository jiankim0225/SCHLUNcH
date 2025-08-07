
// DOM 요소들
const mealDateInput = document.getElementById('meal-date');
const searchBtn = document.getElementById('search-btn');
const loadingDiv = document.getElementById('loading');
const mealInfoDiv = document.getElementById('meal-info');
const errorMessageDiv = document.getElementById('error-message');
const mealDateDisplay = document.getElementById('meal-date-display');

// 급식 메뉴 요소들
const breakfastMenu = document.getElementById('breakfast-menu');
const lunchMenu = document.getElementById('lunch-menu');
const dinnerMenu = document.getElementById('dinner-menu');

// 오늘 날짜를 기본값으로 설정
const today = new Date();
const todayString = today.toISOString().split('T')[0];
mealDateInput.value = todayString;

// 이벤트 리스너
searchBtn.addEventListener('click', searchMealInfo);
mealDateInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchMealInfo();
    }
});

// 페이지 로드 시 오늘 급식 정보 조회
window.addEventListener('load', () => {
    searchMealInfo();
});

// 급식 정보 조회 함수
async function searchMealInfo() {
    const selectedDate = mealDateInput.value;
    
    if (!selectedDate) {
        alert('날짜를 선택해주세요.');
        return;
    }
    
    // 날짜 형식 변환 (YYYY-MM-DD -> YYYYMMDD)
    const formattedDate = selectedDate.replace(/-/g, '');
    
    // 로딩 표시
    showLoading();
    
    try {
        const mealData = await fetchMealData(formattedDate);
        displayMealInfo(mealData, selectedDate);
    } catch (error) {
        console.error('급식 정보 조회 실패:', error);
        showError();
    }
}

// 급식 데이터 가져오기
async function fetchMealData(date) {
    const apiUrl = `https://open.neis.go.kr/hub/mealServiceDietInfo?ATPT_OFCDC_SC_CODE=J10&SD_SCHUL_CODE=7530079&MLSV_YMD=${date}`;
    
    // CORS 문제 해결을 위한 프록시 서버 사용
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(apiUrl)}`;
    
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
        throw new Error('네트워크 응답이 올바르지 않습니다.');
    }
    
    const xmlText = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    
    return parseXmlData(xmlDoc);
}

// XML 데이터 파싱
function parseXmlData(xmlDoc) {
    const meals = {
        breakfast: [],
        lunch: [],
        dinner: []
    };
    
    const rows = xmlDoc.getElementsByTagName('row');
    
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const mealType = getTextContent(row, 'MMEAL_SC_NM');
        const dishNames = getTextContent(row, 'DDISH_NM');
        
        if (dishNames) {
            // 메뉴 항목들을 분리하고 정리
            const menuItems = dishNames
                .split('<br/>')
                .map(item => item.trim())
                .filter(item => item.length > 0)
                .map(item => {
                    // 알레르기 정보 제거 (숫자와 점 제거)
                    return item.replace(/\d+\./g, '').trim();
                });
            
            // 급식 유형에 따라 분류
            if (mealType.includes('조식')) {
                meals.breakfast = menuItems;
            } else if (mealType.includes('중식')) {
                meals.lunch = menuItems;
            } else if (mealType.includes('석식')) {
                meals.dinner = menuItems;
            }
        }
    }
    
    return meals;
}

// XML 텍스트 내용 가져오기
function getTextContent(parent, tagName) {
    const element = parent.getElementsByTagName(tagName)[0];
    return element ? element.textContent : '';
}

// 급식 정보 표시
function displayMealInfo(meals, date) {
    hideLoading();
    hideError();
    
    // 날짜 표시 형식 변환
    const dateObj = new Date(date);
    const formattedDate = dateObj.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    });
    
    mealDateDisplay.textContent = `${formattedDate} 급식 정보`;
    
    // 각 급식 유형별 메뉴 표시
    displayMealType(breakfastMenu, meals.breakfast);
    displayMealType(lunchMenu, meals.lunch);
    displayMealType(dinnerMenu, meals.dinner);
    
    mealInfoDiv.classList.add('show');
}

// 급식 유형별 메뉴 표시
function displayMealType(menuElement, menuItems) {
    menuElement.innerHTML = '';
    
    if (menuItems.length === 0) {
        const noMealItem = document.createElement('li');
        noMealItem.textContent = '급식이 제공되지 않습니다.';
        noMealItem.className = 'no-meals';
        menuElement.appendChild(noMealItem);
    } else {
        menuItems.forEach(item => {
            const listItem = document.createElement('li');
            listItem.textContent = item;
            menuElement.appendChild(listItem);
        });
    }
}

// 로딩 표시
function showLoading() {
    loadingDiv.classList.remove('hidden');
    mealInfoDiv.classList.remove('show');
    errorMessageDiv.classList.add('hidden');
}

// 로딩 숨기기
function hideLoading() {
    loadingDiv.classList.add('hidden');
}

// 에러 표시
function showError() {
    hideLoading();
    mealInfoDiv.classList.remove('show');
    errorMessageDiv.classList.remove('hidden');
}

// 에러 숨기기
function hideError() {
    errorMessageDiv.classList.add('hidden');
}
