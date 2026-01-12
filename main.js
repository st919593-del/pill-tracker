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

// 【關鍵修正】手動解析日期字串，防止時區造成的一天誤差
function getFixedDate(dateString) {
    if (!dateString) return new Date();
    // 將 "2026-01-12" 拆解為年、月、日，並手動建立本地時間物件
    const parts = dateString.split('-');
    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
}

function openModal(index) {
    const startVal = startDateInput.value;
    if (!startVal) {
        alert("請先設定開始服藥日");
        return;
    }
    currentEditingId = 'p-' + index;
    document.getElementById('modal-title').innerText = `第 ${index} 天`;
    
    // 計算該藥丸對應的日期
    let targetDate = getFixedDate(startVal);
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
    
    const startDate = getFixedDate(startVal);

    // 1. 計算停藥日
    let pauseDate = new Date(startDate);
    pauseDate.setDate(startDate.getDate() + 21);
    document.getElementById('pause-date').innerText = `${pauseDate.getFullYear()}/${pauseDate.getMonth() + 1}/${pauseDate.getDate()}`;

    // 2. 計算下包開始日
    let nextDate = new Date(startDate);
    nextDate.setDate(startDate.getDate() + 28);
    document.getElementById('next-pack-date').innerText = `${nextDate.getFullYear()}/${nextDate.getMonth() + 1}/${nextDate.getDate()}`;

    // 3. 更新格子標籤
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
