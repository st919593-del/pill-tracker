const grid = document.getElementById('pill-grid');
const startDateInput = document.getElementById('start-date');
const modal = document.getElementById('edit-modal');
const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

let currentEditingId = null;

// 1. 生成 28 顆藥丸
for (let i = 1; i <= 28; i++) {
    const div = document.createElement('div');
    div.className = 'pill';
    div.id = 'p-' + i;
    div.innerHTML = `<b>${i}</b>`;
    div.onclick = () => openModal(i);
    grid.appendChild(div);
}

// 輔助函式：確保日期計算不會因為時區產生誤差
function getSafeDate(dateString) {
    // 將 yyyy-mm-dd 轉換為午夜 12 點的 Date 物件，避免時區偏差
    const [y, m, d] = dateString.split('-').map(Number);
    return new Date(y, m - 1, d);
}

function openModal(index) {
    const startVal = startDateInput.value;
    if (!startVal) {
        alert("請先設定開始服藥日");
        return;
    }
    currentEditingId = 'p-' + index;
    document.getElementById('modal-title').innerText = `第 ${index} 天`;
    
    // 重新計算目標日期
    let targetDate = getSafeDate(startVal);
    targetDate.setDate(targetDate.getDate() + (index - 1));
    
    const formattedDate = `${targetDate.getFullYear()}/${targetDate.getMonth() + 1}/${targetDate.getDate()}`;
    const dayName = weekDays[targetDate.getDay()];
    
    document.getElementById('modal-date').innerText = `${formattedDate} (星期${dayName})`;
    modal.style.display = 'flex';
}

function closeModal() {
    modal.style.display = 'none';
}

function logStatus(status) {
    const p = document.getElementById(currentEditingId);
    let history = JSON.parse(localStorage.getItem('pillTrackerData')) || {};

    p.classList.remove('taken', 'period'); 
    if (status === 'clear') {
        delete history[currentEditingId];
    } else {
        history[currentEditingId] = status;
        p.classList.add(status);
    }

    localStorage.setItem('pillTrackerData', JSON.stringify(history));
    closeModal();
}

function updateDates() {
    const startVal = startDateInput.value;
    if (!startVal) return;
    
    const startDate = getSafeDate(startVal);

    // 1. 計算停藥日 (第 21 天吃完後)
    let pauseDate = new Date(startDate);
    pauseDate.setDate(startDate.getDate() + 21);
    document.getElementById('pause-date').innerText = `${pauseDate.getFullYear()}/${pauseDate.getMonth() + 1}/${pauseDate.getDate()}`;

    // 2. 計算下包開始日 (第 28 天吃完後，即第 29 天)
    let nextDate = new Date(startDate);
    nextDate.setDate(startDate.getDate() + 28);
    document.getElementById('next-pack-date').innerText = `${nextDate.getFullYear()}/${nextDate.getMonth() + 1}/${nextDate.getDate()}`;

    // 3. 更新每一顆藥丸格子的星期標籤
    for (let i = 1; i <= 28; i++) {
        let cur = new Date(startDate);
        cur.setDate(startDate.getDate() + (i - 1));
        const p = document.getElementById('p-' + i);
        const dayLabel = weekDays[cur.getDay()];
        p.innerHTML = `<small>${dayLabel}</small><b>${i}</b>`;
    }
}

window.onload = function() {
    const savedStart = localStorage.getItem('pillStartDate');
    if (savedStart) {
        startDateInput.value = savedStart;
        updateDates();
    }
    const savedData = JSON.parse(localStorage.getItem('pillTrackerData')) || {};
    for (let id in savedData) {
        const p = document.getElementById(id);
        if (p) p.classList.add(savedData[id]);
    }
};

startDateInput.onchange = function() {
    localStorage.setItem('pillStartDate', startDateInput.value);
    updateDates();
};

document.getElementById('reset-btn').onclick = function() {
    if (confirm('確定清空所有紀錄？')) {
        localStorage.clear();
        location.reload();
    }
};
