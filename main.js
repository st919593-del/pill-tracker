const grid = document.getElementById('pill-grid');
const startDateInput = document.getElementById('start-date');
const modal = document.getElementById('edit-modal');
const warningBox = document.getElementById('stock-warning');
const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

let currentEditingId = null;

// 初始化 28 顆藥丸
function initGrid() {
    grid.innerHTML = ''; 
    for (let i = 1; i <= 28; i++) {
        const div = document.createElement('div');
        div.className = 'pill';
        div.id = 'p-' + i;
        div.innerHTML = `<b>${i}</b>`;
        div.onclick = () => openModal(i);
        grid.appendChild(div);
    }
}

function getFixedDate(dateString) {
    if (!dateString) return new Date();
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
    
    let targetDate = getFixedDate(startVal);
    targetDate.setDate(targetDate.getDate() + (index - 1));
    document.getElementById('modal-date').innerText = `${targetDate.getFullYear()}/${targetDate.getMonth() + 1}/${targetDate.getDate()} (星期${weekDays[targetDate.getDay()]})`;
    
    // 清除副作用勾選
    document.querySelectorAll('.sym-check').forEach(c => c.checked = false);
    
    let history = JSON.parse(localStorage.getItem('pillTrackerData')) || {};
    let record = history[currentEditingId] || { taken: false, period: false, symptoms: [] };

    // 恢復副作用勾選
    if (record.symptoms) {
        record.symptoms.forEach(sym => {
            const cb = document.querySelector(`.sym-check[value="${sym}"]`);
            if (cb) cb.checked = true;
        });
    }

    modal.style.display = 'flex';
}

function closeModal() {
    modal.style.display = 'none';
}

// 核心邏輯：分開紀錄「吃藥」與「生理紀錄」
function logAction(type) {
    const p = document.getElementById(currentEditingId);
    let history = JSON.parse(localStorage.getItem('pillTrackerData')) || {};
    
    // 初始化該格資料
    if (!history[currentEditingId] || typeof history[currentEditingId] !== 'object') {
        history[currentEditingId] = { taken: false, period: false, symptoms: [] };
    }

    const checks = document.querySelectorAll('.sym-check:checked');
    history[currentEditingId].symptoms = Array.from(checks).map(c => c.value);

    if (type === 'taken') {
        history[currentEditingId].taken = !history[currentEditingId].taken; // 切換吃藥狀態
    } else if (type === 'period') {
        history[currentEditingId].period = !history[currentEditingId].period; // 切換月經狀態
    } else if (type === 'clear') {
        history[currentEditingId] = { taken: false, period: false, symptoms: [] };
    }

    saveAndRefresh(history);
}

function saveAndRefresh(history) {
    localStorage.setItem('pillTrackerData', JSON.stringify(history));
    
    // 更新所有藥丸的視覺外觀
    for (let id in history) {
        const p = document.getElementById(id);
        if (!p) continue;
        const data = history[id];

        p.classList.remove('taken', 'period', 'has-symptoms');
        if (data.taken) p.classList.add('taken');
        if (data.period) p.classList.add('period');
        if (data.symptoms && data.symptoms.length > 0) p.classList.add('has-symptoms');
    }

    checkStock(history);
    closeModal();
}

function checkStock(history) {
    let takenCount = 0;
    for (let key in history) {
        if (history[key].taken) takenCount++;
    }
    const remaining = 21 - takenCount;
    if (warningBox) {
        warningBox.style.display = (remaining <= 3 && remaining > 0) ? 'block' : 'none';
    }
}

function updateDates() {
    const startVal = startDateInput.value;
    if (!startVal) return;
    const startDate = getFixedDate(startVal);

    document.getElementById('pause-date').innerText = new Date(startDate.getTime() + 21 * 24 * 60 * 60 * 1000).toLocaleDateString();
    document.getElementById('next-pack-date').innerText = new Date(startDate.getTime() + 28 * 24 * 60 * 60 * 1000).toLocaleDateString();

    for (let i = 1; i <= 28; i++) {
        let cur = new Date(startDate);
        cur.setDate(startDate.getDate() + (i - 1));
        const p = document.getElementById('p-' + i);
        if (p) p.innerHTML = `<small>${weekDays[cur.getDay()]}</small><b>${i}</b>`;
    }
}

window.onload = function() {
    initGrid();
    const savedStart = localStorage.getItem('pillStartDate');
    if (savedStart) {
        startDateInput.value = savedStart;
        updateDates();
    }
    
    const savedData = JSON.parse(localStorage.getItem('pillTrackerData')) || {};
    saveAndRefresh(savedData); // 初始化外觀
};

startDateInput.onchange = function() {
    localStorage.setItem('pillStartDate', startDateInput.value);
    updateDates();
};

document.getElementById('reset-btn').onclick = function() {
    if (confirm('確定重置所有資料？')) {
        localStorage.clear();
        location.reload();
    }
};
