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
        div.onclick = (e) => {
            e.preventDefault();
            openModal(i);
        };
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
    
    // 重置勾選
    document.querySelectorAll('.sym-check').forEach(c => c.checked = false);
    
    // 讀取紀錄（加入強大容錯）
    let history = {};
    try {
        history = JSON.parse(localStorage.getItem('pillTrackerData')) || {};
    } catch(e) { history = {}; }

    let record = history[currentEditingId];
    // 容錯：如果舊紀錄是字串，轉換為物件
    if (record && typeof record !== 'object') {
        record = { taken: (record === 'taken'), period: (record === 'period'), symptoms: [] };
    }
    
    if (record && record.symptoms) {
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

// 核心點擊處理函式
function logAction(type) {
    if (!currentEditingId) return;
    
    let history = {};
    try {
        history = JSON.parse(localStorage.getItem('pillTrackerData')) || {};
    } catch(e) { history = {}; }
    
    // 初始化該格資料物件
    if (!history[currentEditingId] || typeof history[currentEditingId] !== 'object') {
        history[currentEditingId] = { taken: false, period: false, symptoms: [] };
    }

    // 更新副作用
    const checks = document.querySelectorAll('.sym-check:checked');
    history[currentEditingId].symptoms = Array.from(checks).map(c => c.value);

    // 處理不同按鈕行為
    if (type === 'taken') {
        history[currentEditingId].taken = !history[currentEditingId].taken;
    } else if (type === 'period') {
        history[currentEditingId].period = !history[currentEditingId].period;
    } else if (type === 'clear') {
        history[currentEditingId] = { taken: false, period: false, symptoms: [] };
    }

    // 存檔與更新畫面
    localStorage.setItem('pillTrackerData', JSON.stringify(history));
    applyStyles(history);
    checkStock(history);
    
    // 點擊「已服藥」或「清除」後自動關閉，點「月經」則留在視窗內方便繼續勾選副作用
    if (type === 'taken' || type === 'clear') {
        closeModal();
    }
}

function applyStyles(history) {
    for (let i = 1; i <= 28; i++) {
        const id = 'p-' + i;
        const p = document.getElementById(id);
        if (!p) continue;
        
        let data = history[id];
        // 渲染時也做一次格式相容處理
        if (data && typeof data !== 'object') {
            data = { taken: (data === 'taken'), period: (data === 'period'), symptoms: [] };
        }
        if (!data) data = { taken: false, period: false, symptoms: [] };

        p.classList.remove('taken', 'period', 'has-symptoms');
        if (data.taken) p.classList.add('taken');
        if (data.period) p.classList.add('period');
        if (data.symptoms && data.symptoms.length > 0) p.classList.add('has-symptoms');
    }
}

function checkStock(history) {
    let takenCount = 0;
    for (let key in history) {
        let data = history[key];
        let isTaken = (typeof data === 'object') ? data.taken : (data === 'taken');
        if (isTaken) takenCount++;
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
    let savedData = {};
    try {
        savedData = JSON.parse(localStorage.getItem('pillTrackerData')) || {};
    } catch(e) { savedData = {}; }
    applyStyles(savedData);
    checkStock(savedData);
};

startDateInput.onchange = function() {
    localStorage.setItem('pillStartDate', startDateInput.value);
    updateDates();
};

document.getElementById('reset-btn').onclick = function() {
    if (confirm('確定重置所有資料？這會清除您的藥量紀錄與日期。')) {
        localStorage.clear();
        location.reload();
    }
};
