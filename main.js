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

function openModal(index) {
    const startVal = startDateInput.value;
    if (!startVal) {
        alert("請先設定開始服藥日");
        return;
    }
    currentEditingId = 'p-' + index;
    document.getElementById('modal-title').innerText = `第 ${index} 天`;
    
    let targetDate = new Date(startVal);
    targetDate.setDate(targetDate.getDate() + (index - 1));
    document.getElementById('modal-date').innerText = `${targetDate.getFullYear()}/${targetDate.getMonth()+1}/${targetDate.getDate()} (星期${weekDays[targetDate.getDay()]})`;
    
    modal.style.display = 'flex';
}

function closeModal() {
    modal.style.display = 'none';
}

function logStatus(status) {
    const p = document.getElementById(currentEditingId);
    let history = JSON.parse(localStorage.getItem('pillTrackerData')) || {};

    p.classList.remove('taken', 'period'); // 先清空舊狀態
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
    const startDate = new Date(startVal);

    // 停藥日
    let pauseDate = new Date(startDate);
    pauseDate.setDate(startDate.getDate() + 21);
    document.getElementById('pause-date').innerText = pauseDate.toLocaleDateString();

    // 下包開始日
    let nextDate = new Date(startDate);
    nextDate.setDate(startDate.getDate() + 28);
    document.getElementById('next-pack-date').innerText = nextDate.toLocaleDateString();

    for (let i = 1; i <= 28; i++) {
        let cur = new Date(startDate);
        cur.setDate(startDate.getDate() + (i - 1));
        const p = document.getElementById('p-' + i);
        p.innerHTML = `<small>${weekDays[cur.getDay()]}</small><b>${i}</b>`;
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
