const grid = document.getElementById('pill-grid');
const startDateInput = document.getElementById('start-date');
const modal = document.getElementById('edit-modal');
const warningBox = document.getElementById('stock-warning');
const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

let currentEditingId = null;

// 初始化 28 顆藥丸
for (let i = 1; i <= 28; i++) {
    const div = document.createElement('div');
    div.className = 'pill';
    div.id = 'p-' + i;
    div.innerHTML = `<b>${i}</b>`;
    div.onclick = () => openModal(i);
    grid.appendChild(div);
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
    
    // 清除上次勾選
    document.querySelectorAll('.sym-check').forEach(c => c.checked = false);
    
    // 讀取舊有副作用紀錄
    let history = JSON.parse(localStorage.getItem('pillTrackerData')) || {};
    if (history[currentEditingId] && history[currentEditingId].symptoms) {
        history[currentEditingId].symptoms.forEach(sym => {
            const cb = document.querySelector(`.sym-check[value="${sym}"]`);
            if (cb) cb.checked = true;
        });
    }

    modal.style.display = 'flex';
}

function closeModal() {
    modal.style.display = 'none';
}

function logStatus(status) {
    const p = document.getElementById(currentEditingId);
    let history = JSON.parse(localStorage.getItem('pillTrackerData')) || {};
    
    // 獲取勾選的副作用
    const checks = document.querySelectorAll('.sym-check:checked');
    const selectedSyms = Array.from(checks).map(c => c.value);

    p.classList.remove('taken', 'period', 'has-symptoms');

    if (status === 'clear') {
        delete history[currentEditingId];
    } else {
        history[currentEditingId] = {
            status: status,
            symptoms: selectedSyms
        };
        p.classList.add(status);
        if (selectedSyms.length > 0) p.classList.add('has-symptoms');
    }

    localStorage.setItem('pillTrackerData', JSON.stringify(history));
    checkStock(history);
    closeModal();
}

function checkStock(history) {
    // 計算已吃掉幾顆 (status 為 taken 的)
    const takenCount = Object.values(history).filter(item => item.status === 'taken').length;
    const remaining = 21 - takenCount; // 以 21 顆藥效期計算
    
    if (remaining <= 3 && remaining > 0) {
        warningBox.style.display = 'block';
    } else {
        warningBox.style.display = 'none';
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
        if (p) {
            p.classList.add(savedData[id].status || savedData[id]);
            if (savedData[id].symptoms && savedData[id].symptoms.length > 0) {
                p.classList.add('has-symptoms');
            }
        }
    }
    checkStock(savedData);
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
