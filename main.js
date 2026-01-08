const grid = document.getElementById('pill-grid');
const btn = document.getElementById('btn');
const resetBtn = document.getElementById('reset-btn');
const startDateInput = document.getElementById('start-date');

const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

// 1. 初始化 28 顆藥丸
for (let i = 1; i <= 28; i++) {
    const div = document.createElement('div');
    div.className = 'pill';
    div.id = 'p-' + i;
    div.innerHTML = `<span>${i}</span>`;
    grid.appendChild(div);
}

// 2. 計算所有關鍵日期
function updateDates() {
    const startVal = startDateInput.value;
    
    // 顯示今天星期幾
    const today = new Date();
    document.getElementById('today-weekday').innerText = `星期${weekDays[today.getDay()]}`;

    if (!startVal) return;

    const startDate = new Date(startVal);
    
    // 計算停藥日 (第 21 顆吃完後的隔天，即第 22 天)
    let pauseDate = new Date(startDate);
    pauseDate.setDate(startDate.getDate() + 21);
    document.getElementById('pause-date').innerText = pauseDate.toLocaleDateString();

    // 計算下包開始日 (第 29 天)
    let nextDate = new Date(startDate);
    nextDate.setDate(startDate.getDate() + 28);
    document.getElementById('next-pack-date').innerText = nextDate.toLocaleDateString();
    
    // 更新藥丸顯示的星期 (進階功能：讓你知道每顆藥是星期幾)
    for (let i = 1; i <= 28; i++) {
        let currentPillDate = new Date(startDate);
        currentPillDate.setDate(startDate.getDate() + (i - 1));
        const dayLabel = weekDays[currentPillDate.getDay()];
        const p = document.getElementById('p-' + i);
        p.innerHTML = `<small>${dayLabel}</small><b>${i}</b>`;
    }
}

// 3. 儲存與讀取
startDateInput.onchange = function() {
    localStorage.setItem('pillStartDate', startDateInput.value);
    updateDates();
};

window.onload = function() {
    const savedStartDate = localStorage.getItem('pillStartDate');
    if (savedStartDate) {
        startDateInput.value = savedStartDate;
    }
    updateDates();

    const savedData = localStorage.getItem('pillHistory');
    if (savedData) {
        const history = JSON.parse(savedData);
        history.forEach(pillId => {
            const p = document.getElementById(pillId);
            if (p) p.classList.add('taken');
        });
    }
};

// 4. 按鈕功能
btn.onclick = function() {
    const startVal = startDateInput.value;
    if (!startVal) {
        alert("請先設定「開始服藥日」！");
        return;
    }

    const startDate = new Date(startVal);
    const today = new Date();
    
    // 計算今天是第幾天 (當天算第1天)
    const diffTime = today - startDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

    if (diffDays < 1 || diffDays > 28) {
        alert("今天不在這 28 天的週期內喔！");
        return;
    }

    const pillId = 'p-' + diffDays;
    const p = document.getElementById(pillId);
    
    if (p) {
        if (p.classList.contains('taken')) {
            alert('今天已經紀錄過了！');
        } else {
            p.classList.add('taken');
            let history = JSON.parse(localStorage.getItem('pillHistory')) || [];
            history.push(pillId);
            localStorage.setItem('pillHistory', JSON.stringify(history));
            alert(`第 ${diffDays} 天紀錄成功！`);
        }
    }
};

resetBtn.onclick = function() {
    if (confirm('確定要清除所有紀錄並重新開始嗎？')) {
        localStorage.clear();
        location.reload();
    }
};