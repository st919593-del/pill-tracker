const grid = document.getElementById('pill-grid');
const startDateInput = document.getElementById('start-date');
const modal = document.getElementById('edit-modal');
const warningBox = document.getElementById('stock-warning');
const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

let currentEditingId = null;

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
    
    document.querySelectorAll('.sym-check').forEach(c => c.checked = false);
    document.getElementById('modal-note').value = ''; // 清空備註欄
    
    let history = JSON.parse(localStorage.getItem('pillTrackerData')) || {};
    let record = history[currentEditingId] || { taken: false, period: false, symptoms: [], note: "" };

    if (record.symptoms) {
        record.symptoms.forEach(sym => {
            const cb = document.querySelector(`.sym-check[value="${sym}"]`);
            if (cb) cb.checked = true;
        });
    }
    if (record.note) {
        document.getElementById('modal-note').value = record.note;
    }

    modal.style.display = 'flex';
}

function closeModal() {
    modal.style.display = 'none';
}

function logAction(type) {
    if (!currentEditingId) return;
    let history = JSON.parse(localStorage.getItem('pillTrackerData')) || {};
    
    if (!history[currentEditingId] || typeof history[currentEditingId] !== 'object') {
        history[currentEditingId] = { taken: false, period: false, symptoms: [], note: "" };
    }

    // 儲存副作用與備註
    const checks = document.querySelectorAll('.sym-check:checked');
    history[currentEditingId].symptoms = Array.from(checks).map(c => c.value);
    history[currentEditingId].note = document.getElementById('modal-note').value;

    if (type === 'taken') {
        history[currentEditingId].taken = !history[currentEditingId].taken;
    } else if (type === 'period') {
        history[currentEditingId].period = !history[currentEditingId].period;
    } else if (type === 'clear') {
        history[currentEditingId] = { taken: false, period: false, symptoms: [], note: "" };
    }

    localStorage.setItem('pillTrackerData', JSON.stringify(history));
    applyStyles(history);
    checkStock(history);
    closeModal();
}

function applyStyles(history) {
    for (let i = 1; i <= 28; i++) {
        const id = 'p-' + i;
        const p = document.getElementById(id);
        if (!p) continue;
        
        let data = history[id] || { taken: false, period: false, symptoms: [] };
        p.classList.remove('taken', 'period', 'has-symptoms');
        
        // 重新填寫內容，加入圖示邏輯
        let iconHtml = '';
        if (data.taken) {
            p.classList.add('taken');
            iconHtml += '<span class="icon-pill">💊</span>';
        }
        if (data.period) {
            p.classList.add('period');
            iconHtml += '<span class="icon-drop">🩸</span>';
        }
        
        p.innerHTML = `<small>${p.querySelector('small')?.innerText || ''}</small><b>${i}</b>${iconHtml}`;
        if (data.symptoms && data.symptoms.length > 0) p.classList.add('has-symptoms');
    }
}

function checkStock(history) {
    let takenCount = 0;
    for (let key in history) { if (history[key].taken) takenCount++; }
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
    const savedData = JSON.parse(localStorage.getItem('pillTrackerData')) || {};
    applyStyles(savedData);
}

window.onload = function() {
    initGrid();
    const savedStart = localStorage.getItem('pillStartDate');
    if (savedStart) {
        startDateInput.value = savedStart;
        updateDates();
    }
    const savedData = JSON.parse(localStorage.getItem('pillTrackerData')) || {};
    applyStyles(savedData);
    checkStock(savedData);
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
