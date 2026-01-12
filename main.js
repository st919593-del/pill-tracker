const grid = document.getElementById('pill-grid');
const startDateInput = document.getElementById('start-date');
const modal = document.getElementById('edit-modal');
const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

let currentEditingId = null; // 紀錄目前正在點擊哪一顆

// 1. 初始化 28 顆藥丸
for (let i = 1; i <= 28; i++) {
    const div = document.createElement('div');
    div.className = 'pill';
    div.id = 'p-' + i;
    div.onclick = () => openModal(i); // 點擊藥丸開啟編輯
    grid.appendChild(div);
}

// 2. 開啟與關閉視窗
function openModal(index) {
    const startVal = startDateInput.value;
    if (!startVal) {
        alert("請先設定開始服藥日");
        return;
    }
    currentEditingId = 'p-' + index;
    document.getElementById('modal-title').innerText = `第 ${index} 天`;
    
    // 計算那一天的實際日期
    let targetDate = new Date(startVal);
    targetDate.setDate(targetDate.getDate() + (index - 1));
    document.getElementById('modal-date').innerText = targetDate.toLocaleDateString() + ` (星期${weekDays[targetDate.getDay()]})`;
    
    modal.style.display = 'flex';
}

function closeModal() {
    modal.style.display = 'none';
}

// 3. 紀錄狀態 (已吃藥 / 月經 / 清除)
function logStatus(status) {
    const p = document.getElementById(currentEditingId);
    let history = JSON.parse(localStorage.getItem('pillTrackerData')) || {};

    if (status === 'clear') {
        delete history[currentEditingId];
        p.classList.remove('taken', 'period');
    } else {
        history[currentEditingId] = status;
        p.className = 'pill ' + status;
    }

    localStorage.setItem('pillTrackerData', JSON.stringify(history));
    closeModal();
}

// 4. 更新日期資訊
function updateDates() {
    const startVal = startDateInput.value;
    if (!startVal) return;

    const startDate = new Date(startVal);
    
    // 停藥日
    let pauseDate = new Date(startDate);
    pauseDate.setDate(startDate.getDate() + 21);
    document.getElementById('pause-date').innerText = pauseDate.toLocaleDateString();

    // 下包開始日
    let nextDate = new Date(startDate);
    nextDate.setDate(startDate.getDate() + 28);
    document.getElementById('next-pack-date').innerText = nextDate.toLocaleDateString();

    // 更新格子上的星期顯示
    for (let i = 1; i <= 28; i++) {
        let cur = new Date(startDate);
        cur.setDate(startDate.getDate() + (i - 1));
        const p = document.getElementById('p-' + i);
        p.innerHTML = `<small>${weekDays[cur.getDay()]}</small><b>${i}</b>`;
    }
}

// 5. 啟動載入
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
