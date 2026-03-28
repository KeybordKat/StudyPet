// Study Pet App
console.log('Study Pet initialised! 🐱');

// === Countdown Timer Visibility ===
function hideCountdownTimer() {
    const countdown = document.getElementById('countdownOverlay');
    if (countdown.classList.contains('active')) {
        countdown.style.display = 'none';
    }
}

function showCountdownTimer() {
    const countdown = document.getElementById('countdownOverlay');
    if (countdown.classList.contains('active')) {
        countdown.style.display = 'flex';
    }
}

// === Coin Management ===
let coins = 0;

// Load coins from localStorage
function loadCoins() {
    const savedCoins = localStorage.getItem('studyPetCoins');
    if (savedCoins) {
        coins = parseInt(savedCoins);
        updateCoinDisplay();
    }
}

// Save coins to localStorage
function saveCoins() {
    localStorage.setItem('studyPetCoins', coins);
}

// Update coin display
function updateCoinDisplay() {
    document.getElementById('coinCount').textContent = coins;
}

// Add coins
function addCoins(amount) {
    coins += amount;
    updateCoinDisplay();
    saveCoins();
}

// === Menu Management ===
let menuOpen = false;

function toggleMenu() {
    menuOpen = !menuOpen;
    const menuButton = document.getElementById('menuButton');
    const menuItems = document.getElementById('menuItems');

    if (menuOpen) {
        menuButton.classList.add('active');
        menuItems.classList.add('expanded');
    } else {
        menuButton.classList.remove('active');
        menuItems.classList.remove('expanded');
    }
}

// === Timer Overlay Management ===
let selectedSubject = null;
let subjects = [];

function openTimerOverlay() {
    document.getElementById('timerOverlay').classList.add('active');
    loadSubjectsToDropdown();
    hideCountdownTimer();
}

function closeTimerOverlay() {
    document.getElementById('timerOverlay').classList.remove('active');
    showCountdownTimer();
}

// Subject selector toggle
function toggleSubjectDropdown() {
    const dropdown = document.getElementById('subjectDropdown');
    dropdown.classList.toggle('active');
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    const selector = document.getElementById('subjectSelector');
    const dropdown = document.getElementById('subjectDropdown');
    if (!selector.contains(e.target)) {
        dropdown.classList.remove('active');
    }
});

// === Keypad Management ===
let currentKeypadTarget = null;
let keypadValue = '0';

function openKeypad(targetInputId) {
    currentKeypadTarget = targetInputId;
    const currentValue = document.getElementById(targetInputId).value;
    // Extract just the number from "X mins"
    keypadValue = currentValue.replace(' mins', '') || '0';
    document.getElementById('keypadDisplay').textContent = keypadValue;
    document.getElementById('keypadOverlay').classList.add('active');
}

function closeKeypad() {
    document.getElementById('keypadOverlay').classList.remove('active');
    currentKeypadTarget = null;
}

function handleKeypadInput(value) {
    if (value === 'clear') {
        keypadValue = '0';
    } else if (value === 'confirm') {
        if (currentKeypadTarget) {
            // Append " mins" to the value when setting it
            document.getElementById(currentKeypadTarget).value = keypadValue + ' mins';
        }
        closeKeypad();
        return;
    } else {
        if (keypadValue === '0') {
            keypadValue = value;
        } else if (keypadValue.length < 3) {
            keypadValue += value;
        }
    }
    document.getElementById('keypadDisplay').textContent = keypadValue;
}

// === Subject Management ===
let selectedColor = '#ff6b9d';

function loadSubjects() {
    const savedSubjects = localStorage.getItem('studyPetSubjects');
    if (savedSubjects) {
        subjects = JSON.parse(savedSubjects);
    }
}

function saveSubjects() {
    localStorage.setItem('studyPetSubjects', JSON.stringify(subjects));
}

function loadSubjectsToDropdown() {
    const dropdown = document.getElementById('subjectDropdown');

    // Clear existing subjects (keep the add button)
    const addButton = document.getElementById('addSubjectOption');
    dropdown.innerHTML = '';
    dropdown.appendChild(addButton);

    // Add all saved subjects
    subjects.forEach((subject, index) => {
        const option = document.createElement('div');
        option.className = 'subject-option';
        option.innerHTML = `
            <div class="subject-color-tag" style="background: ${subject.color};"></div>
            <span>${subject.name}</span>
        `;
        option.addEventListener('click', () => selectSubject(index));
        dropdown.appendChild(option);
    });
}

function selectSubject(index) {
    selectedSubject = subjects[index];
    const display = document.getElementById('subjectDisplay');
    display.innerHTML = `
        <div class="subject-color-tag" style="background: ${selectedSubject.color};"></div>
        <span class="subject-text">${selectedSubject.name}</span>
    `;
    toggleSubjectDropdown();
}

function openAddSubjectOverlay() {
    document.getElementById('addSubjectOverlay').classList.add('active');
    document.getElementById('subjectNameInput').value = '';
    selectedColor = '#ff6b9d';
    updateSubjectPreview();

    // Select first color by default
    document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
    document.querySelector('.color-option').classList.add('selected');

    hideCountdownTimer();
}

function closeAddSubjectOverlay() {
    document.getElementById('addSubjectOverlay').classList.remove('active');
    showCountdownTimer();
}

function updateSubjectPreview() {
    const name = document.getElementById('subjectNameInput').value || 'Preview';
    document.getElementById('previewSubjectName').textContent = name;
    document.getElementById('previewColorTag').style.background = selectedColor;
}

function addSubject() {
    const name = document.getElementById('subjectNameInput').value.trim();
    if (name) {
        subjects.push({ name, color: selectedColor });
        saveSubjects();
        loadSubjectsToDropdown();
        closeAddSubjectOverlay();
    }
}

// === Countdown Timer Management ===
let timerInterval = null;
let timeRemaining = 0; // in seconds
let timerState = 'study'; // 'study', 'shortBreak', or 'longBreak'
let isPaused = false;
let studyDuration = 25; // minutes
let shortBreakDuration = 5; // minutes
let longBreakDuration = 15; // minutes
let totalStudyTime = 0; // Track total study time in minutes
let totalBreakTime = 0; // Track total break time in minutes
let sessionStartTime = null;
let pomodoroCount = 0; // Number of completed study sessions (0-4)

function startTimer() {
    // Check if subject is selected
    if (!selectedSubject) {
        alert('⚠️ Please select a subject before starting your study session!');
        return;
    }

    // Get timer values (remove " mins" suffix)
    studyDuration = parseInt(document.getElementById('studyTimeInput').value.replace(' mins', ''));
    shortBreakDuration = parseInt(document.getElementById('breakTimeInput').value.replace(' mins', ''));
    longBreakDuration = parseInt(document.getElementById('longBreakTimeInput').value.replace(' mins', ''));

    // Start with study time
    timerState = 'study';
    timeRemaining = studyDuration * 60;
    totalStudyTime = 0;
    totalBreakTime = 0;
    pomodoroCount = 0;
    sessionStartTime = Date.now();

    // Update display
    updateTimerDisplay();
    updateTimerStatus();
    updatePomodoroDisplay();

    // Show countdown overlay, hide timer setup
    closeTimerOverlay();
    const countdownOverlay = document.getElementById('countdownOverlay');
    countdownOverlay.style.display = ''; // Clear any inline display style
    countdownOverlay.classList.add('active');

    // Start countdown
    isPaused = false;
    startCountdown();

    // Start study animation
    startStudyAnimation();
}

function startCountdown() {
    if (timerInterval) clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        if (!isPaused) {
            timeRemaining--;

            if (timeRemaining <= 0) {
                // Timer finished - switch state
                if (timerState === 'study') {
                    // Study session completed
                    totalStudyTime += studyDuration;
                    pomodoroCount++;

                    // Stop study animation
                    stopStudyAnimation();

                    // Check if it's time for long break
                    if (pomodoroCount >= 4) {
                        // Long break time
                        timerState = 'longBreak';
                        timeRemaining = longBreakDuration * 60;
                    } else {
                        // Short break time
                        timerState = 'shortBreak';
                        timeRemaining = shortBreakDuration * 60;
                    }

                    updatePomodoroDisplay();
                } else if (timerState === 'shortBreak') {
                    // Short break finished
                    totalBreakTime += shortBreakDuration;
                    timerState = 'study';
                    timeRemaining = studyDuration * 60;
                    updatePomodoroDisplay();

                    // Start study animation again
                    startStudyAnimation();
                } else if (timerState === 'longBreak') {
                    // Long break finished - reset pomodoro cycle
                    totalBreakTime += longBreakDuration;
                    pomodoroCount = 0;
                    timerState = 'study';
                    timeRemaining = studyDuration * 60;
                    updatePomodoroDisplay();

                    // Start study animation again
                    startStudyAnimation();
                }

                updateTimerStatus();
            }

            updateTimerDisplay();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    const display = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('countdownDisplay').textContent = display;
}

function updateTimerStatus() {
    const displayElement = document.getElementById('countdownDisplay');
    const labelElement = document.getElementById('timerStateLabel');

    if (timerState === 'study') {
        displayElement.style.color = '#ff6bb5';
        labelElement.textContent = 'Study Time';
        labelElement.style.color = '#ff6bb5';
    } else if (timerState === 'shortBreak') {
        displayElement.style.color = '#6bcf7f';
        labelElement.textContent = 'Short Break';
        labelElement.style.color = '#6bcf7f';
    } else if (timerState === 'longBreak') {
        displayElement.style.color = '#b8a4ff';
        labelElement.textContent = 'Long Break';
        labelElement.style.color = '#b8a4ff';
    }
}

function updatePomodoroDisplay() {
    // Update hearts based on completed pomodoros
    for (let i = 1; i <= 4; i++) {
        const heart = document.getElementById(`heart${i}`);

        if (i <= pomodoroCount) {
            // Completed pomodoro - fill heart
            heart.classList.add('filled');
            heart.classList.remove('pulsing');
        } else if (i === pomodoroCount + 1 && timerState === 'study') {
            // Current study session - pulse heart
            heart.classList.remove('filled');
            heart.classList.add('pulsing');
        } else {
            // Future pomodoro - unfilled
            heart.classList.remove('filled', 'pulsing');
        }
    }
}

function pauseTimer() {
    isPaused = !isPaused;
    const pauseButton = document.getElementById('pauseButton');
    pauseButton.textContent = isPaused ? '▶️' : '⏸️';

    // Pause/resume study animation
    if (timerState === 'study') {
        if (isPaused) {
            stopStudyAnimation();
        } else {
            startStudyAnimation();
        }
    }
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    // Stop study animation
    stopStudyAnimation();

    // Add partial time if timer was stopped mid-session
    let elapsedInCurrentPhase = 0;

    if (timerState === 'study') {
        elapsedInCurrentPhase = (studyDuration * 60 - timeRemaining) / 60;
        if (elapsedInCurrentPhase > 0) {
            totalStudyTime += Math.floor(elapsedInCurrentPhase);
        }
    } else if (timerState === 'shortBreak') {
        elapsedInCurrentPhase = (shortBreakDuration * 60 - timeRemaining) / 60;
        if (elapsedInCurrentPhase > 0) {
            totalBreakTime += Math.floor(elapsedInCurrentPhase);
        }
    } else if (timerState === 'longBreak') {
        elapsedInCurrentPhase = (longBreakDuration * 60 - timeRemaining) / 60;
        if (elapsedInCurrentPhase > 0) {
            totalBreakTime += Math.floor(elapsedInCurrentPhase);
        }
    }

    // Hide countdown overlay first
    const countdownOverlay = document.getElementById('countdownOverlay');
    countdownOverlay.classList.remove('active');
    countdownOverlay.style.display = 'none';

    // Reset state
    isPaused = false;
    document.getElementById('pauseButton').textContent = '⏸️';

    // Calculate coins earned (1 coin per 10 minutes)
    const coinsEarned = Math.floor(totalStudyTime / 10);
    if (coinsEarned > 0) {
        addCoins(coinsEarned);
    }

    // Show statistics overlay
    showSessionStats(coinsEarned);
}

function showSessionStats(coinsEarned) {
    // Update stats display
    document.getElementById('sessionSubject').textContent = selectedSubject ? selectedSubject.name : 'None';
    document.getElementById('sessionStudyTime').textContent = `${totalStudyTime} min`;
    document.getElementById('sessionBreakTime').textContent = `${totalBreakTime} min`;
    document.getElementById('sessionCoinsEarned').textContent = coinsEarned;

    // Show overlay (countdown timer already hidden by stopTimer)
    document.getElementById('sessionStatsOverlay').classList.add('active');
}

function closeSessionStats() {
    document.getElementById('sessionStatsOverlay').classList.remove('active');

    // Save session data to history
    if (totalStudyTime > 0) {
        saveStudySession({
            date: new Date().toISOString(),
            subject: selectedSubject,
            studyTime: totalStudyTime,
            breakTime: totalBreakTime
        });
    }

    showCountdownTimer();
}

// === Study History & Statistics ===
let studyHistory = [];
let currentViewMode = 'month'; // 'week', 'month', or 'year'
let currentViewDate = new Date();
let editingSessionIndex = -1;

function saveStudySession(session) {
    studyHistory.push(session);
    localStorage.setItem('studyPetHistory', JSON.stringify(studyHistory));
}

function loadStudyHistory() {
    const saved = localStorage.getItem('studyPetHistory');
    if (saved) {
        studyHistory = JSON.parse(saved);
        console.log(`Loaded ${studyHistory.length} study sessions from storage`);
    } else {
        console.log('No study history found in storage');
    }
}

function openStatsPage() {
    // Reset to current date when opening stats page
    currentViewDate = new Date();
    document.getElementById('statsPageOverlay').classList.add('active');
    updateStatsView();
    hideCountdownTimer();
}

function closeStatsPage() {
    document.getElementById('statsPageOverlay').classList.remove('active');
    showCountdownTimer();
}

function switchViewMode(mode) {
    currentViewMode = mode;

    // Update active tab
    document.querySelectorAll('.view-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(`${mode}Tab`).classList.add('active');

    updateStatsView();
}

function navigateDate(direction) {
    if (currentViewMode === 'month') {
        currentViewDate.setMonth(currentViewDate.getMonth() + direction);
    } else if (currentViewMode === 'week') {
        // Navigate by week
        currentViewDate.setDate(currentViewDate.getDate() + (direction * 7));
    } else if (currentViewMode === 'year') {
        // Navigate by year
        currentViewDate.setFullYear(currentViewDate.getFullYear() + direction);
    }
    updateStatsView();
}

function updateStatsView() {
    updateDateDisplay();
    renderChart();
    renderLegend();
}

function updateDateDisplay() {
    const display = document.getElementById('dateDisplay');
    if (currentViewMode === 'month') {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        display.textContent = `${monthNames[currentViewDate.getMonth()]} ${currentViewDate.getFullYear()}`;
    } else if (currentViewMode === 'week') {
        // Show week range
        const weekStart = getWeekStart(currentViewDate);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const options = { month: 'short', day: 'numeric' };
        const startStr = weekStart.toLocaleDateString('en-US', options);
        const endStr = weekEnd.toLocaleDateString('en-US', options);
        display.textContent = `${startStr} - ${endStr}`;
    } else if (currentViewMode === 'year') {
        display.textContent = `${currentViewDate.getFullYear()}`;
    }
}

function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
    return new Date(d.setDate(diff));
}

function renderChart() {
    const chartArea = document.getElementById('chartArea');
    chartArea.innerHTML = '';

    if (currentViewMode === 'month') {
        renderMonthChart(chartArea);
        // Add grid lines for 70 hours (every 10 hours)
        addGridLines(chartArea, 70, 10);
    } else if (currentViewMode === 'week') {
        renderWeekChart(chartArea);
        // Add grid lines for 24 hours (every 4 hours)
        addGridLines(chartArea, 24, 4);
    } else if (currentViewMode === 'year') {
        renderYearChart(chartArea);
        // Add grid lines for 840 hours (every 100 hours)
        addGridLines(chartArea, 840, 100);
    }
}

function addGridLines(container, maxHours, interval) {
    // Determine dashed line interval based on view mode
    let dashedInterval;
    if (maxHours === 840) {
        dashedInterval = 20; // 20 hours for year
    } else if (maxHours === 70) {
        dashedInterval = 2; // 2 hours for month
    } else if (maxHours === 24) {
        dashedInterval = 1; // 1 hour for week
    } else {
        dashedInterval = 1; // Default
    }

    // Add dashed grid lines
    for (let hour = dashedInterval; hour <= maxHours; hour += dashedInterval) {
        // Skip if this hour has a solid line
        if (hour % interval !== 0) {
            const gridLine = document.createElement('div');
            gridLine.className = 'chart-grid-line-dashed';
            gridLine.style.left = `${(hour / maxHours) * 100}%`;
            container.appendChild(gridLine);
        }
    }

    // Add solid vertical grid lines at each interval
    for (let hour = interval; hour <= maxHours; hour += interval) {
        const gridLine = document.createElement('div');
        gridLine.className = 'chart-grid-line';
        gridLine.style.left = `${(hour / maxHours) * 100}%`;
        container.appendChild(gridLine);
    }

    // Add hour labels at each interval, starting from 0
    for (let hour = 0; hour <= maxHours; hour += interval) {
        const label = document.createElement('div');
        label.className = 'chart-hour-label';
        label.textContent = `${hour}h`;
        label.style.left = `${(hour / maxHours) * 100}%`;
        container.appendChild(label);
    }
}

function renderMonthChart(container) {
    const year = currentViewDate.getFullYear();
    const month = currentViewDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    console.log(`Rendering month chart for ${month + 1}/${year}`);
    console.log(`Total study sessions in history: ${studyHistory.length}`);

    // Get all weeks that overlap with this month
    const weeks = [];
    let currentWeekStart = getWeekStart(firstDayOfMonth);

    while (currentWeekStart <= lastDayOfMonth) {
        const weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weeks.push({
            start: new Date(currentWeekStart),
            end: weekEnd
        });
        currentWeekStart = new Date(currentWeekStart);
        currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }

    console.log(`Found ${weeks.length} weeks in this month`);

    // Aggregate data by week
    const weekData = weeks.map(() => ({}));

    let matchingSessionsCount = 0;
    studyHistory.forEach(session => {
        const sessionDate = new Date(session.date);

        weeks.forEach((week, index) => {
            const weekEndPlusOne = new Date(week.end);
            weekEndPlusOne.setDate(weekEndPlusOne.getDate() + 1);

            if (sessionDate >= week.start && sessionDate < weekEndPlusOne) {
                matchingSessionsCount++;
                const subjectName = session.subject ? session.subject.name : 'Other';
                if (!weekData[index][subjectName]) {
                    weekData[index][subjectName] = 0;
                }
                weekData[index][subjectName] += session.studyTime;
            }
        });
    });

    console.log(`Found ${matchingSessionsCount} sessions for this month`);

    // Use fixed 70 hours (4200 minutes) scale to match x-axis
    const maxMinutes = 4200;
    console.log(`Max scale: ${maxMinutes} minutes (70 hours)`);

    let barsWithData = 0;
    // Render bars for each week
    weeks.forEach((week, index) => {
        const barContainer = document.createElement('div');
        barContainer.className = 'chart-bar-container';

        const label = document.createElement('div');
        label.className = 'bar-label';

        // Show full week range even if it spans months
        const startDay = week.start.getDate();
        const endDay = week.end.getDate();

        label.textContent = `${startDay}-${endDay}`;

        const bar = document.createElement('div');
        bar.className = 'chart-bar';

        const totalMinutes = Object.values(weekData[index]).reduce((sum, val) => sum + val, 0);
        const widthPercent = (totalMinutes / maxMinutes) * 100;
        bar.style.width = `${widthPercent}%`;

        if (totalMinutes > 0) {
            barsWithData++;
            console.log(`Week ${index + 1}: ${totalMinutes} minutes, width: ${widthPercent}%`);
        }

        // Add segments for each subject
        const subjects = Object.entries(weekData[index]);
        if (subjects.length > 0) {
            subjects.forEach(([subjectName, minutes]) => {
                const segment = document.createElement('div');
                segment.className = 'bar-segment';
                const segmentWidth = (minutes / totalMinutes) * 100;
                segment.style.width = `${segmentWidth}%`;

                const subjectObj = getSubjectByName(subjectName);
                const color = subjectObj ? subjectObj.color : '#ddd';
                segment.style.background = color;

                if (totalMinutes > 0) {
                    console.log(`  Segment: ${subjectName}, ${minutes}min, ${segmentWidth}%, color: ${color}`);
                }

                bar.appendChild(segment);
            });
        } else if (totalMinutes === 0) {
            // Empty week - set bar to transparent/minimal
            bar.style.minWidth = '2px';
            bar.style.opacity = '0.3';
        }

        barContainer.appendChild(label);
        barContainer.appendChild(bar);
        container.appendChild(barContainer);
    });
    console.log(`Created ${barsWithData} bars with data`);
}

function renderYearChart(container) {
    const year = currentViewDate.getFullYear();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    console.log(`Rendering year chart for ${year}`);
    console.log(`Total study sessions in history: ${studyHistory.length}`);

    // Aggregate data by month
    const monthData = Array(12).fill(null).map(() => ({}));

    let matchingSessionsCount = 0;
    studyHistory.forEach(session => {
        const sessionDate = new Date(session.date);

        if (sessionDate.getFullYear() === year) {
            matchingSessionsCount++;
            const month = sessionDate.getMonth();
            const subjectName = session.subject ? session.subject.name : 'Other';
            if (!monthData[month][subjectName]) {
                monthData[month][subjectName] = 0;
            }
            monthData[month][subjectName] += session.studyTime;
        }
    });

    console.log(`Found ${matchingSessionsCount} sessions for this year`);

    // Use fixed 840 hours (50400 minutes) scale to match x-axis
    const maxMinutes = 50400;
    console.log(`Max scale: ${maxMinutes} minutes (840 hours)`);

    // Render bars for each month
    for (let month = 0; month < 12; month++) {
        const barContainer = document.createElement('div');
        barContainer.className = 'chart-bar-container';

        const label = document.createElement('div');
        label.className = 'bar-label';
        label.textContent = monthNames[month];

        const bar = document.createElement('div');
        bar.className = 'chart-bar';

        const totalMinutes = Object.values(monthData[month]).reduce((sum, val) => sum + val, 0);
        const widthPercent = (totalMinutes / maxMinutes) * 100;
        bar.style.width = `${widthPercent}%`;

        // Add segments for each subject
        const subjects = Object.entries(monthData[month]);
        if (subjects.length > 0) {
            subjects.forEach(([subjectName, minutes]) => {
                const segment = document.createElement('div');
                segment.className = 'bar-segment';
                const segmentWidth = (minutes / totalMinutes) * 100;
                segment.style.width = `${segmentWidth}%`;

                const subjectObj = getSubjectByName(subjectName);
                segment.style.background = subjectObj ? subjectObj.color : '#ddd';

                bar.appendChild(segment);
            });
        } else if (totalMinutes === 0) {
            // Empty month - set bar to transparent/minimal
            bar.style.minWidth = '2px';
            bar.style.opacity = '0.3';
        }

        barContainer.appendChild(label);
        barContainer.appendChild(bar);
        container.appendChild(barContainer);
    }
}

function renderWeekChart(container) {
    const weekStart = getWeekStart(currentViewDate);
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    console.log(`Rendering week chart starting ${weekStart.toDateString()}`);
    console.log(`Total study sessions in history: ${studyHistory.length}`);

    // Collect sessions by day of week (Monday = 0, Sunday = 6)
    const weekData = Array(7).fill(null).map(() => []);

    let matchingSessionsCount = 0;
    studyHistory.forEach((session, index) => {
        const sessionDate = new Date(session.date);
        const currentWeekEnd = new Date(weekStart);
        currentWeekEnd.setDate(currentWeekEnd.getDate() + 7);

        // Check if session is within current week
        if (sessionDate >= weekStart && sessionDate < currentWeekEnd) {
            matchingSessionsCount++;
            const dayOfWeek = sessionDate.getDay();
            // Convert to Monday = 0, Sunday = 6
            const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

            // Store the session with its time and index
            weekData[adjustedDay].push({
                time: sessionDate.getHours() + sessionDate.getMinutes() / 60,
                duration: session.studyTime,
                subject: session.subject,
                sessionIndex: index
            });
        }
    });

    console.log(`Found ${matchingSessionsCount} sessions for this week`);

    // 24-hour scale
    const maxHours = 24;

    // Render timeline for each day of the week
    for (let day = 0; day < 7; day++) {
        const barContainer = document.createElement('div');
        barContainer.className = 'chart-bar-container';

        // Add separator class to all but the last day
        if (day < 6) {
            barContainer.classList.add('chart-day-separator');
        }

        const label = document.createElement('div');
        label.className = 'bar-label';
        label.textContent = dayNames[day];

        const bar = document.createElement('div');
        bar.className = 'chart-bar';
        bar.style.width = '100%';
        bar.style.position = 'relative';

        // Add session blocks for this day
        weekData[day].forEach(session => {
            const startHour = session.time;
            const durationHours = session.duration / 60;

            const block = document.createElement('div');
            block.className = 'session-block';
            block.style.left = `${(startHour / maxHours) * 100}%`;
            block.style.width = `${(durationHours / maxHours) * 100}%`;

            const subjectObj = session.subject ? getSubjectByName(session.subject.name) : null;
            block.style.background = subjectObj ? subjectObj.color : '#ddd';

            // Make block clickable
            block.addEventListener('click', () => openEditSession(session.sessionIndex));

            bar.appendChild(block);
        });

        barContainer.appendChild(label);
        barContainer.appendChild(bar);
        container.appendChild(barContainer);
    }
}

function renderLegend() {
    const legend = document.getElementById('chartLegend');
    legend.innerHTML = '';

    // Get unique subjects from history
    const uniqueSubjects = new Set();
    studyHistory.forEach(session => {
        if (session.subject) {
            uniqueSubjects.add(session.subject.name);
        }
    });

    uniqueSubjects.forEach(subjectName => {
        const subjectObj = getSubjectByName(subjectName);
        if (subjectObj) {
            const item = document.createElement('div');
            item.className = 'legend-item';
            item.style.cursor = 'pointer';
            item.innerHTML = `
                <div class="legend-color" style="background: ${subjectObj.color};"></div>
                <span class="legend-label">${subjectObj.name}</span>
            `;
            item.addEventListener('click', () => showSubjectStats(subjectName));
            legend.appendChild(item);
        }
    });
}

function getSubjectByName(name) {
    return subjects.find(s => s.name === name);
}

// === Subject Statistics ===
function showSubjectStats(subjectName) {
    const subjectObj = getSubjectByName(subjectName);
    if (!subjectObj) return;

    // Set title
    document.getElementById('subjectStatsTitle').innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
            <div class="subject-color-tag" style="background: ${subjectObj.color};"></div>
            <span>${subjectObj.name} Statistics 📈</span>
        </div>
    `;

    // Calculate statistics based on current view mode
    let stats;
    if (currentViewMode === 'week') {
        stats = calculateWeekStats(subjectName);
    } else if (currentViewMode === 'month') {
        stats = calculateMonthStats(subjectName);
    } else if (currentViewMode === 'year') {
        stats = calculateYearStats(subjectName);
    }

    // Display statistics
    const content = document.getElementById('subjectStatsContent');
    content.innerHTML = `
        <div class="stat-item">
            <div class="stat-icon">⏱️</div>
            <div class="stat-details">
                <div class="stat-label">Total Study Time</div>
                <div class="stat-value">${formatMinutes(stats.total)}</div>
            </div>
        </div>

        <div class="stat-item">
            <div class="stat-icon">📊</div>
            <div class="stat-details">
                <div class="stat-label">${stats.averageLabel}</div>
                <div class="stat-value">${formatMinutes(stats.average)}</div>
            </div>
        </div>

        <div class="stat-item">
            <div class="stat-icon">📅</div>
            <div class="stat-details">
                <div class="stat-label">Total Sessions</div>
                <div class="stat-value">${stats.sessionCount}</div>
            </div>
        </div>

        <div class="stat-item">
            <div class="stat-icon">${stats.comparison >= 0 ? '📈' : '📉'}</div>
            <div class="stat-details">
                <div class="stat-label">vs. ${stats.comparisonLabel}</div>
                <div class="stat-value" style="color: ${stats.comparison >= 0 ? '#6bcf7f' : '#ff6b9d'}">
                    ${stats.comparison >= 0 ? '+' : ''}${formatMinutes(stats.comparison)}
                </div>
            </div>
        </div>
    `;

    // Show overlay
    document.getElementById('subjectStatsOverlay').classList.add('active');
}

function formatMinutes(minutes) {
    if (minutes < 60) {
        return `${Math.round(minutes)} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function calculateWeekStats(subjectName) {
    const weekStart = getWeekStart(currentViewDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    // Previous week
    const prevWeekStart = new Date(weekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);
    const prevWeekEnd = new Date(weekStart);

    // Calculate current week stats
    let total = 0;
    let sessionCount = 0;
    studyHistory.forEach(session => {
        if (session.subject && session.subject.name === subjectName) {
            const sessionDate = new Date(session.date);
            if (sessionDate >= weekStart && sessionDate < weekEnd) {
                total += session.studyTime;
                sessionCount++;
            }
        }
    });

    // Calculate previous week stats
    let prevTotal = 0;
    studyHistory.forEach(session => {
        if (session.subject && session.subject.name === subjectName) {
            const sessionDate = new Date(session.date);
            if (sessionDate >= prevWeekStart && sessionDate < prevWeekEnd) {
                prevTotal += session.studyTime;
            }
        }
    });

    return {
        total,
        average: total / 7,
        averageLabel: 'Average per Day',
        sessionCount,
        comparison: total - prevTotal,
        comparisonLabel: 'Previous Week'
    };
}

function calculateMonthStats(subjectName) {
    const year = currentViewDate.getFullYear();
    const month = currentViewDate.getMonth();
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    const daysInMonth = monthEnd.getDate();

    // Previous month
    const prevMonthStart = new Date(year, month - 1, 1);
    const prevMonthEnd = new Date(year, month, 0);

    // Calculate current month stats
    let total = 0;
    let sessionCount = 0;
    studyHistory.forEach(session => {
        if (session.subject && session.subject.name === subjectName) {
            const sessionDate = new Date(session.date);
            if (sessionDate >= monthStart && sessionDate <= monthEnd) {
                total += session.studyTime;
                sessionCount++;
            }
        }
    });

    // Calculate previous month stats
    let prevTotal = 0;
    studyHistory.forEach(session => {
        if (session.subject && session.subject.name === subjectName) {
            const sessionDate = new Date(session.date);
            if (sessionDate >= prevMonthStart && sessionDate <= prevMonthEnd) {
                prevTotal += session.studyTime;
            }
        }
    });

    return {
        total,
        average: total / daysInMonth,
        averageLabel: 'Average per Day',
        sessionCount,
        comparison: total - prevTotal,
        comparisonLabel: 'Previous Month'
    };
}

function calculateYearStats(subjectName) {
    const year = currentViewDate.getFullYear();
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31);

    // Previous year
    const prevYearStart = new Date(year - 1, 0, 1);
    const prevYearEnd = new Date(year - 1, 11, 31);

    // Calculate current year stats
    let total = 0;
    let sessionCount = 0;
    studyHistory.forEach(session => {
        if (session.subject && session.subject.name === subjectName) {
            const sessionDate = new Date(session.date);
            if (sessionDate >= yearStart && sessionDate <= yearEnd) {
                total += session.studyTime;
                sessionCount++;
            }
        }
    });

    // Calculate previous year stats
    let prevTotal = 0;
    studyHistory.forEach(session => {
        if (session.subject && session.subject.name === subjectName) {
            const sessionDate = new Date(session.date);
            if (sessionDate >= prevYearStart && sessionDate <= prevYearEnd) {
                prevTotal += session.studyTime;
            }
        }
    });

    return {
        total,
        average: total / 12,
        averageLabel: 'Average per Month',
        sessionCount,
        comparison: total - prevTotal,
        comparisonLabel: 'Previous Year'
    };
}

function closeSubjectStats() {
    document.getElementById('subjectStatsOverlay').classList.remove('active');
    showCountdownTimer();
}

// === Edit Session Functions ===
function openAddSession() {
    editingSessionIndex = -1; // -1 indicates we're adding a new session

    // Change title
    document.getElementById('editSessionTitle').textContent = 'Add Study Session 📝';

    // Set default date to today
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    document.getElementById('editSessionDate').value = dateStr;

    // Set default time to current time
    const hours = today.getHours().toString().padStart(2, '0');
    const minutes = today.getMinutes().toString().padStart(2, '0');
    document.getElementById('editSessionTime').value = `${hours}:${minutes}`;

    // Clear duration
    document.getElementById('editSessionDuration').value = '';

    // Clear subject
    document.getElementById('editSubjectDisplay').innerHTML = '<span class="subject-text">Select a subject...</span>';

    // Show delete button only for editing
    document.getElementById('deleteSessionButton').style.display = 'none';

    // Load subjects into dropdown
    loadEditSubjectsToDropdown();

    // Show overlay
    document.getElementById('editSessionOverlay').classList.add('active');
    hideCountdownTimer();
}

function openEditSession(sessionIndex) {
    editingSessionIndex = sessionIndex;

    // Change title
    document.getElementById('editSessionTitle').textContent = 'Edit Study Session 📝';

    const session = studyHistory[sessionIndex];
    const sessionDate = new Date(session.date);

    // Set date input
    const dateStr = sessionDate.toISOString().split('T')[0];
    document.getElementById('editSessionDate').value = dateStr;

    // Set time input (HH:MM format)
    const hours = sessionDate.getHours().toString().padStart(2, '0');
    const minutes = sessionDate.getMinutes().toString().padStart(2, '0');
    document.getElementById('editSessionTime').value = `${hours}:${minutes}`;

    // Set duration
    document.getElementById('editSessionDuration').value = session.studyTime;

    // Set subject
    if (session.subject) {
        const display = document.getElementById('editSubjectDisplay');
        display.innerHTML = `
            <div class="subject-color-tag" style="background: ${session.subject.color};"></div>
            <span class="subject-text">${session.subject.name}</span>
        `;
    } else {
        document.getElementById('editSubjectDisplay').innerHTML = '<span class="subject-text">Select a subject...</span>';
    }

    // Show delete button for editing
    document.getElementById('deleteSessionButton').style.display = 'block';

    // Load subjects into dropdown
    loadEditSubjectsToDropdown();

    // Show overlay
    document.getElementById('editSessionOverlay').classList.add('active');
    hideCountdownTimer();
}

function closeEditSession() {
    document.getElementById('editSessionOverlay').classList.remove('active');
    editingSessionIndex = -1;
    showCountdownTimer();
}

function loadEditSubjectsToDropdown() {
    const dropdown = document.getElementById('editSubjectDropdown');
    dropdown.innerHTML = '';

    // Add all saved subjects
    subjects.forEach((subject, index) => {
        const option = document.createElement('div');
        option.className = 'subject-option';
        option.innerHTML = `
            <div class="subject-color-tag" style="background: ${subject.color};"></div>
            <span>${subject.name}</span>
        `;
        option.addEventListener('click', () => selectEditSubject(index));
        dropdown.appendChild(option);
    });
}

function selectEditSubject(index) {
    const subject = subjects[index];
    const display = document.getElementById('editSubjectDisplay');
    display.innerHTML = `
        <div class="subject-color-tag" style="background: ${subject.color};"></div>
        <span class="subject-text">${subject.name}</span>
    `;
    toggleEditSubjectDropdown();
}

function toggleEditSubjectDropdown() {
    const dropdown = document.getElementById('editSubjectDropdown');
    dropdown.classList.toggle('active');
}

function checkSessionOverlap(sessionDate, duration, excludeIndex = -1) {
    const sessionStart = new Date(sessionDate);
    const sessionEnd = new Date(sessionStart.getTime() + duration * 60000); // duration in minutes

    for (let i = 0; i < studyHistory.length; i++) {
        // Skip the session we're editing
        if (i === excludeIndex) continue;

        const existingStart = new Date(studyHistory[i].date);
        const existingEnd = new Date(existingStart.getTime() + studyHistory[i].studyTime * 60000);

        // Check if sessions overlap
        if (sessionStart < existingEnd && sessionEnd > existingStart) {
            return {
                overlaps: true,
                existingSession: studyHistory[i],
                existingStart: existingStart,
                existingEnd: existingEnd
            };
        }
    }

    return { overlaps: false };
}

function saveEditedSession() {
    const dateValue = document.getElementById('editSessionDate').value;
    const timeValue = document.getElementById('editSessionTime').value;
    const duration = parseInt(document.getElementById('editSessionDuration').value);

    if (!dateValue || !timeValue || !duration) {
        alert('Please fill in all fields');
        return;
    }

    // Get selected subject from display
    const displayText = document.getElementById('editSubjectDisplay').querySelector('.subject-text');
    let selectedSubject = null;
    if (displayText && displayText.textContent !== 'Select a subject...') {
        const subjectName = displayText.textContent;
        selectedSubject = subjects.find(s => s.name === subjectName);
    }

    // Parse date and time
    const [hours, minutes] = timeValue.split(':').map(Number);
    const sessionDate = new Date(dateValue);
    sessionDate.setHours(hours, minutes);

    // Check if session is in the future
    const now = new Date();
    const sessionEnd = new Date(sessionDate.getTime() + duration * 60000);

    if (sessionDate > now) {
        alert('⚠️ Cannot add a session that starts in the future!\n\nPlease choose a time that has already occurred.');
        return;
    }

    if (sessionEnd > now) {
        alert('⚠️ Cannot add a session that would end in the future!\n\nPlease reduce the duration or choose an earlier start time.');
        return;
    }

    // Check for overlaps (exclude current session if editing)
    const overlapCheck = checkSessionOverlap(sessionDate, duration, editingSessionIndex);

    if (overlapCheck.overlaps) {
        const existingSubject = overlapCheck.existingSession.subject ?
            overlapCheck.existingSession.subject.name : 'Unknown';
        const existingStartTime = overlapCheck.existingStart.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
        const existingEndTime = overlapCheck.existingEnd.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });

        alert(`⚠️ This session overlaps with an existing session!\n\nExisting session: ${existingSubject}\nTime: ${existingStartTime} - ${existingEndTime}\n\nPlease choose a different time.`);
        return;
    }

    if (editingSessionIndex === -1) {
        // Adding a new session
        const newSession = {
            date: sessionDate.toISOString(),
            subject: selectedSubject,
            studyTime: duration,
            breakTime: 0
        };
        studyHistory.push(newSession);
    } else {
        // Editing an existing session
        const session = studyHistory[editingSessionIndex];
        session.date = sessionDate.toISOString();
        session.studyTime = duration;
        session.subject = selectedSubject;
    }

    // Save to localStorage
    localStorage.setItem('studyPetHistory', JSON.stringify(studyHistory));

    // Close overlay and refresh view
    closeEditSession();
    updateStatsView();
}

function deleteSession() {
    if (editingSessionIndex === -1) return;

    if (confirm('Are you sure you want to delete this study session?')) {
        studyHistory.splice(editingSessionIndex, 1);
        localStorage.setItem('studyPetHistory', JSON.stringify(studyHistory));

        closeEditSession();
        updateStatsView();
    }
}

// === Shop Management ===
let ownedItems = {}; // { itemId: { owned: true, equipped: true } }

const shopItems = [
    { id: 'hat1', name: 'Wizard Hat', icon: '🎩', price: 10 },
    { id: 'hat2', name: 'Flower Crown', icon: '🌸', price: 15 },
    { id: 'hat3', name: 'Party Hat', icon: '🎉', price: 20 },
    { id: 'accessory1', name: 'Sunglasses', icon: '😎', price: 25 },
    { id: 'accessory2', name: 'Bow Tie', icon: '🎀', price: 12 },
    { id: 'accessory3', name: 'Crown', icon: '👑', price: 50 },
    { id: 'bg1', name: 'Forest BG', icon: '🌲', price: 30 },
    { id: 'bg2', name: 'Beach BG', icon: '🏖️', price: 35 },
    { id: 'bg3', name: 'Space BG', icon: '🌌', price: 40 },
    { id: 'food1', name: 'Cookie', icon: '🍪', price: 5 },
    { id: 'food2', name: 'Cake', icon: '🍰', price: 8 },
    { id: 'food3', name: 'Ice Cream', icon: '🍦', price: 10 },
    { id: 'theme-soft-lavender', name: 'Lavender Theme', icon: '💜', price: 50 },
    { id: 'theme-mint-dream', name: 'Mint Theme', icon: '💚', price: 50 },
    { id: 'theme-peachy-cream', name: 'Peach Theme', icon: '🧡', price: 50 },
    { id: 'theme-dark-purple', name: 'Dark Purple', icon: '🌙', price: 75 },
    { id: 'theme-midnight-blue', name: 'Midnight Blue', icon: '🌃', price: 75 },
    { id: 'theme-forest-night', name: 'Forest Night', icon: '🌲', price: 75 },
    { id: 'theme-rose-noir', name: 'Rose Noir', icon: '🌹', price: 75 }
];

function loadOwnedItems() {
    const saved = localStorage.getItem('studyPetOwnedItems');
    if (saved) {
        const parsed = JSON.parse(saved);
        // Convert old array format to new object format
        if (Array.isArray(parsed)) {
            ownedItems = {};
            parsed.forEach(itemId => {
                ownedItems[itemId] = { owned: true, equipped: true };
            });
            saveOwnedItems();
        } else {
            ownedItems = parsed;
        }
    }

    // Ensure pastel-pink theme is always owned (default theme)
    if (!ownedItems['theme-pastel-pink']) {
        ownedItems['theme-pastel-pink'] = { owned: true, equipped: false };
        saveOwnedItems();
    }

    // Ensure backdrop-1 is always owned (default background)
    if (!ownedItems['bg-backdrop-1']) {
        ownedItems['bg-backdrop-1'] = { owned: true, equipped: false };
        saveOwnedItems();
    }

    // Clean up: unequip any themes and backgrounds (they shouldn't be equipped, only selected)
    let needsSave = false;
    Object.keys(ownedItems).forEach(itemId => {
        // Themes start with 'theme-', backgrounds start with 'bg-' but not bg1, bg2, bg3 (those are shop items)
        const isTheme = itemId.startsWith('theme-');
        const isBackground = itemId.startsWith('bg-') && !['bg1', 'bg2', 'bg3'].includes(itemId);
        if ((isTheme || isBackground) && ownedItems[itemId].equipped) {
            ownedItems[itemId].equipped = false;
            needsSave = true;
        }
    });
    if (needsSave) {
        saveOwnedItems();
    }
}

function saveOwnedItems() {
    localStorage.setItem('studyPetOwnedItems', JSON.stringify(ownedItems));
}

function openShop() {
    document.getElementById('shopOverlay').classList.add('active');
    document.getElementById('shopCoinCount').textContent = coins;
    renderShopItems();
    renderShopThemes();
    renderShopBackgrounds();
    switchShopTab('items'); // Default to items tab
    hideCountdownTimer();
}

function closeShop() {
    document.getElementById('shopOverlay').classList.remove('active');
    showCountdownTimer();
}

function switchShopTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.shop-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    const tabId = tab === 'items' ? 'itemsTab' : (tab === 'themes' ? 'themesTab' : 'backgroundsTab');
    document.getElementById(tabId).classList.add('active');

    // Show/hide content
    document.getElementById('shopItemsGrid').style.display = tab === 'items' ? 'grid' : 'none';
    document.getElementById('shopThemesGrid').style.display = tab === 'themes' ? 'grid' : 'none';
    document.getElementById('shopBackgroundsGrid').style.display = tab === 'backgrounds' ? 'grid' : 'none';
}

function renderShopItems() {
    const grid = document.getElementById('shopItemsGrid');
    grid.innerHTML = '';

    // Filter out themes - they go in the themes tab
    const regularItems = shopItems.filter(item => !item.id.startsWith('theme-'));

    regularItems.forEach(item => {
        const isOwned = ownedItems[item.id]?.owned || false;
        const isEquipped = ownedItems[item.id]?.equipped || false;

        const itemEl = document.createElement('div');
        itemEl.className = 'shop-item';

        if (!isOwned) {
            itemEl.addEventListener('click', () => purchaseItem(item));
            itemEl.style.cursor = 'pointer';
        }

        itemEl.innerHTML = `
            <div class="shop-item-icon">${item.icon}</div>
            <div class="shop-item-name">${item.name}</div>
            ${isOwned ?
                `<button class="equip-button ${isEquipped ? 'equipped' : ''}" onclick="toggleEquip('${item.id}')">${isEquipped ? 'EQUIPPED ✓' : 'UNEQUIPPED'}</button>` :
                `<div class="shop-item-price">
                    <span class="shop-item-price-icon"><i class="fi fi-sr-circle-star"></i></span>
                    <span>${item.price}</span>
                </div>`
            }
        `;

        grid.appendChild(itemEl);
    });
}

function renderShopThemes() {
    const grid = document.getElementById('shopThemesGrid');
    grid.innerHTML = '';

    colorThemes.forEach(theme => {
        const themeId = `theme-${theme.id}`;
        const isOwned = theme.id === 'pastel-pink' || (ownedItems[themeId] && ownedItems[themeId].owned);
        const themeItem = shopItems.find(item => item.id === themeId);

        const themeOption = document.createElement('div');
        themeOption.className = 'theme-option';
        if (settings.colorTheme === theme.id) {
            themeOption.classList.add('selected');
        }
        if (!isOwned) {
            themeOption.classList.add('locked');
        }

        const preview = document.createElement('div');
        preview.className = 'theme-preview';
        preview.style.background = `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.secondary} 25%, ${theme.colors.tertiary} 50%, ${theme.colors.accent1} 75%, ${theme.colors.accent2} 100%)`;

        // Add lock icon if not owned
        if (!isOwned) {
            const lockIcon = document.createElement('div');
            lockIcon.className = 'theme-lock-icon';
            lockIcon.innerHTML = '<i class="fi fi-sr-heart-lock"></i>';
            preview.appendChild(lockIcon);
        }

        const name = document.createElement('div');
        name.className = 'theme-name';
        name.textContent = theme.name;

        // Add price if not owned
        if (!isOwned && themeItem) {
            const price = document.createElement('div');
            price.className = 'theme-price';
            price.innerHTML = `<i class="fi fi-sr-circle-star"></i> ${themeItem.price}`;
            themeOption.appendChild(preview);
            themeOption.appendChild(name);
            themeOption.appendChild(price);
        } else {
            themeOption.appendChild(preview);
            themeOption.appendChild(name);
        }

        themeOption.addEventListener('click', () => {
            if (!isOwned && themeItem) {
                purchaseItem(themeItem);
            } else if (isOwned) {
                settings.colorTheme = theme.id;
                saveSettings();
                applyTheme();
                renderShopThemes();
            }
        });

        grid.appendChild(themeOption);
    });
}

function renderShopBackgrounds() {
    const grid = document.getElementById('shopBackgroundsGrid');
    grid.innerHTML = '';

    backgrounds.forEach(bg => {
        const bgId = `bg-${bg.id}`;
        const isOwned = bg.price === 0 || (ownedItems[bgId] && ownedItems[bgId].owned);

        const bgOption = document.createElement('div');
        bgOption.className = 'background-option';
        if (settings.background === bg.id) {
            bgOption.classList.add('selected');
        }
        if (!isOwned) {
            bgOption.classList.add('locked');
        }

        const preview = document.createElement('div');
        preview.className = 'background-preview';
        preview.style.backgroundImage = `url('${bg.file}')`;

        // Add lock icon if not owned
        if (!isOwned) {
            const lockIcon = document.createElement('div');
            lockIcon.className = 'background-lock-icon';
            lockIcon.innerHTML = '<i class="fi fi-sr-heart-lock"></i>';
            preview.appendChild(lockIcon);
        }

        const name = document.createElement('div');
        name.className = 'background-name';
        name.textContent = bg.name;

        // Add price if not owned and not free
        if (!isOwned && bg.price > 0) {
            const price = document.createElement('div');
            price.className = 'background-price';
            price.innerHTML = `<i class="fi fi-sr-circle-star"></i> ${bg.price}`;
            bgOption.appendChild(preview);
            bgOption.appendChild(name);
            bgOption.appendChild(price);
        } else {
            bgOption.appendChild(preview);
            bgOption.appendChild(name);
        }

        bgOption.addEventListener('click', () => {
            if (!isOwned && bg.price > 0) {
                // Purchase background
                if (coins >= bg.price) {
                    coins -= bg.price;
                    ownedItems[bgId] = { owned: true, equipped: false };
                    saveCoins();
                    saveOwnedItems();
                    updateCoinDisplay();
                    document.getElementById('shopCoinCount').textContent = coins;

                    // Apply immediately after purchase
                    settings.background = bg.id;
                    saveSettings();
                    applyBackground();
                    renderShopBackgrounds();
                }
            } else if (isOwned) {
                // Select background
                settings.background = bg.id;
                saveSettings();
                applyBackground();
                renderShopBackgrounds();
            }
        });

        grid.appendChild(bgOption);
    });
}

function purchaseItem(item) {
    if (coins >= item.price && !ownedItems[item.id]?.owned) {
        coins -= item.price;
        ownedItems[item.id] = { owned: true, equipped: true };

        saveCoins();
        saveOwnedItems();
        updateCoinDisplay();

        // Update shop display
        document.getElementById('shopCoinCount').textContent = coins;
        renderShopItems();

        // If it's a theme, apply it automatically
        if (item.id.startsWith('theme-')) {
            const themeId = item.id.replace('theme-', '');
            settings.colorTheme = themeId;
            saveSettings();
            applyTheme();
            renderShopThemes(); // Update themes display to show it's owned
            alert(`🎉 ${item.name} has been applied!`);
        } else {
            // Render equipped items on main screen
            renderEquippedItems();
            // Show success message
            alert(`🎉 You purchased ${item.name}!`);
        }
    } else if (coins < item.price) {
        alert(`Not enough coins! You need ${item.price - coins} more coins.`);
    }
}

window.toggleEquip = function(itemId) {
    if (ownedItems[itemId]?.owned) {
        ownedItems[itemId].equipped = !ownedItems[itemId].equipped;
        saveOwnedItems();
        renderShopItems();
        renderEquippedItems();
    }
}

function renderEquippedItems() {
    // Remove existing equipped items
    document.querySelectorAll('.equipped-item').forEach(el => el.remove());

    // Render each equipped item (excluding themes)
    const regularItems = shopItems.filter(item => !item.id.startsWith('theme-'));
    regularItems.forEach(item => {
        if (ownedItems[item.id]?.equipped) {
            const itemEl = document.createElement('div');
            itemEl.className = 'equipped-item';
            itemEl.dataset.itemId = item.id;
            itemEl.innerHTML = item.icon;
            itemEl.style.fontSize = '60px';
            itemEl.style.position = 'absolute';
            itemEl.style.zIndex = '250';

            // Load saved position or use default
            const savedPosition = localStorage.getItem(`itemPosition_${item.id}`);
            if (savedPosition) {
                const pos = JSON.parse(savedPosition);
                itemEl.style.left = pos.x + 'px';
                itemEl.style.top = pos.y + 'px';
            } else {
                // Default position (offset from center)
                itemEl.style.top = '50%';
                itemEl.style.left = '50%';
                itemEl.style.transform = 'translate(-50%, -50%)';
            }

            document.querySelector('.main-screen').appendChild(itemEl);

            // Make draggable if setting is enabled
            if (settings.draggableItems) {
                enableItemDragging(itemEl);
            }
        }
    });
}

function enableItemDragging(itemEl) {
    itemEl.style.cursor = 'move';

    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };

    itemEl.addEventListener('mousedown', (e) => {
        if (!settings.draggableItems) return;

        isDragging = true;

        const rect = itemEl.getBoundingClientRect();
        const parentRect = itemEl.parentElement.getBoundingClientRect();

        const visualLeft = rect.left - parentRect.left;
        const visualTop = rect.top - parentRect.top;

        itemEl.style.left = visualLeft + 'px';
        itemEl.style.top = visualTop + 'px';
        itemEl.style.transform = 'none';

        dragOffset.x = e.clientX - rect.left;
        dragOffset.y = e.clientY - rect.top;

        const handleMouseMove = (e) => {
            if (!isDragging) return;

            const x = e.clientX - dragOffset.x;
            const y = e.clientY - dragOffset.y;

            itemEl.style.left = x + 'px';
            itemEl.style.top = y + 'px';
        };

        const handleMouseUp = () => {
            if (isDragging) {
                isDragging = false;

                // Save position
                const itemId = itemEl.dataset.itemId;
                localStorage.setItem(`itemPosition_${itemId}`, JSON.stringify({
                    x: parseInt(itemEl.style.left),
                    y: parseInt(itemEl.style.top)
                }));

                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            }
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        e.preventDefault();
    });
}

function disableItemDragging() {
    document.querySelectorAll('.equipped-item').forEach(itemEl => {
        itemEl.style.cursor = 'default';
    });
}

// === Settings Management ===
let settings = {
    volumeEnabled: true,
    draggableItems: false,
    petCustomize: false,
    colorTheme: 'pastel-pink',
    background: 'backdrop-1'
};

let petScale = 1.0;

const colorThemes = [
    {
        id: 'pastel-pink',
        name: 'Pastel Pink',
        type: 'light',
        colors: {
            primary: '#ffeef8',
            secondary: '#ffe4f3',
            tertiary: '#ffd4f0',
            accent1: '#e4d4ff',
            accent2: '#d4e4ff',
            buttonBorder: '#ffb3d9',
            buttonText: '#000000',
            toggleBg: '#b8a4ff',
            scrollbarThumb: '#ffb3d9',
            scrollbarTrack: '#ffd4f0',
            chartBg: '#fff5fb',
            text: '#000000',
            textSecondary: '#333333',
            panelBg: 'white',
            panelBorder: '#ffb3d9',
            inputBg: '#ffe4f3',
            overlayBg: 'rgba(255, 192, 203, 0.5)'
        }
    },
    {
        id: 'soft-lavender',
        name: 'Soft Lavender',
        type: 'light',
        colors: {
            primary: '#f3e5ff',
            secondary: '#e8d4ff',
            tertiary: '#dcc4ff',
            accent1: '#d4e4ff',
            accent2: '#e4f4ff',
            buttonBorder: '#b8a4ff',
            buttonText: '#000000',
            toggleBg: '#9d8ac7',
            scrollbarThumb: '#b8a4ff',
            scrollbarTrack: '#dcc4ff',
            chartBg: '#f7f0ff',
            text: '#000000',
            textSecondary: '#333333',
            panelBg: 'white',
            panelBorder: '#b8a4ff',
            inputBg: '#e8d4ff',
            overlayBg: 'rgba(232, 212, 255, 0.5)'
        }
    },
    {
        id: 'mint-dream',
        name: 'Mint Dream',
        type: 'light',
        colors: {
            primary: '#e0fff4',
            secondary: '#d0ffe8',
            tertiary: '#c0ffdc',
            accent1: '#d4f4ff',
            accent2: '#e4f4ff',
            buttonBorder: '#6bcf7f',
            buttonText: '#000000',
            toggleBg: '#5bb86f',
            scrollbarThumb: '#6bcf7f',
            scrollbarTrack: '#c0ffdc',
            chartBg: '#f0fff8',
            text: '#000000',
            textSecondary: '#333333',
            panelBg: 'white',
            panelBorder: '#6bcf7f',
            inputBg: '#d0ffe8',
            overlayBg: 'rgba(208, 255, 232, 0.5)'
        }
    },
    {
        id: 'peachy-cream',
        name: 'Peachy Cream',
        type: 'light',
        colors: {
            primary: '#fff5e8',
            secondary: '#ffe8d4',
            tertiary: '#ffd8c0',
            accent1: '#ffd4e4',
            accent2: '#ffe4f4',
            buttonBorder: '#ffb088',
            buttonText: '#000000',
            toggleBg: '#e89060',
            scrollbarThumb: '#ffb088',
            scrollbarTrack: '#ffd8c0',
            chartBg: '#fff8f0',
            text: '#000000',
            textSecondary: '#333333',
            panelBg: 'white',
            panelBorder: '#ffb088',
            inputBg: '#ffe8d4',
            overlayBg: 'rgba(255, 232, 212, 0.5)'
        }
    },
    {
        id: 'dark-purple',
        name: 'Dark Purple',
        type: 'dark',
        colors: {
            primary: '#0d0818',
            secondary: '#1a1028',
            tertiary: '#271838',
            accent1: '#3a2f4e',
            accent2: '#4a3f5e',
            buttonBorder: '#b8a4ff',
            buttonText: '#ffffff',
            toggleBg: '#a490d0',
            scrollbarThumb: '#b8a4ff',
            scrollbarTrack: '#3a2f4e',
            chartBg: '#1a1028',
            text: '#ffffff',
            textSecondary: '#e0e0e0',
            panelBg: '#1a1028',
            panelBorder: '#b8a4ff',
            inputBg: '#0d0818',
            overlayBg: 'rgba(13, 8, 24, 0.8)'
        }
    },
    {
        id: 'midnight-blue',
        name: 'Midnight Blue',
        type: 'dark',
        colors: {
            primary: '#08121e',
            secondary: '#101a28',
            tertiary: '#182232',
            accent1: '#2f3a4e',
            accent2: '#3f4a5e',
            buttonBorder: '#a4c4ff',
            buttonText: '#ffffff',
            toggleBg: '#7a9ad8',
            scrollbarThumb: '#a4c4ff',
            scrollbarTrack: '#2f3a4e',
            chartBg: '#101a28',
            text: '#ffffff',
            textSecondary: '#e0e0e0',
            panelBg: '#101a28',
            panelBorder: '#a4c4ff',
            inputBg: '#08121e',
            overlayBg: 'rgba(8, 18, 30, 0.8)'
        }
    },
    {
        id: 'forest-night',
        name: 'Forest Night',
        type: 'dark',
        colors: {
            primary: '#081808',
            secondary: '#102010',
            tertiary: '#183018',
            accent1: '#2f4e3a',
            accent2: '#3f5e4a',
            buttonBorder: '#a4ffb8',
            buttonText: '#ffffff',
            toggleBg: '#7adb90',
            scrollbarThumb: '#a4ffb8',
            scrollbarTrack: '#2f4e3a',
            chartBg: '#102010',
            text: '#ffffff',
            textSecondary: '#e0e0e0',
            panelBg: '#102010',
            panelBorder: '#a4ffb8',
            inputBg: '#081808',
            overlayBg: 'rgba(8, 24, 8, 0.8)'
        }
    },
    {
        id: 'rose-noir',
        name: 'Rose Noir',
        type: 'dark',
        colors: {
            primary: '#180810',
            secondary: '#281018',
            tertiary: '#381820',
            accent1: '#4e2f3a',
            accent2: '#5e3f4a',
            buttonBorder: '#ffb3d9',
            buttonText: '#ffffff',
            toggleBg: '#ff8ab8',
            scrollbarThumb: '#ffb3d9',
            scrollbarTrack: '#4e2f3a',
            chartBg: '#281018',
            text: '#ffffff',
            textSecondary: '#e0e0e0',
            panelBg: '#281018',
            panelBorder: '#ffb3d9',
            inputBg: '#180810',
            overlayBg: 'rgba(24, 8, 16, 0.8)'
        }
    }
];

const backgrounds = [
    {
        id: 'backdrop-1',
        name: 'Default Backdrop',
        file: 'Backdrop-1.png',
        price: 0
    }
];

let isDragging = false;
let dragOffset = { x: 0, y: 0 };
let petDragHandlers = null;

function loadSettings() {
    const saved = localStorage.getItem('studyPetSettings');
    if (saved) {
        settings = JSON.parse(saved);
    }
    applySettings();
}

function saveSettings() {
    localStorage.setItem('studyPetSettings', JSON.stringify(settings));
}

function applyTheme() {
    const theme = colorThemes.find(t => t.id === settings.colorTheme);
    if (!theme) return;

    const root = document.documentElement;

    // Set CSS custom properties
    root.style.setProperty('--color-primary', theme.colors.primary);
    root.style.setProperty('--color-secondary', theme.colors.secondary);
    root.style.setProperty('--color-tertiary', theme.colors.tertiary);
    root.style.setProperty('--color-accent1', theme.colors.accent1);
    root.style.setProperty('--color-accent2', theme.colors.accent2);
    root.style.setProperty('--color-button-border', theme.colors.buttonBorder);
    root.style.setProperty('--color-button-text', theme.colors.buttonText);
    root.style.setProperty('--color-toggle-bg', theme.colors.toggleBg);
    root.style.setProperty('--color-scrollbar-thumb', theme.colors.scrollbarThumb);
    root.style.setProperty('--color-scrollbar-track', theme.colors.scrollbarTrack);
    root.style.setProperty('--color-chart-bg', theme.colors.chartBg);
    root.style.setProperty('--color-text', theme.colors.text);
    root.style.setProperty('--color-text-secondary', theme.colors.textSecondary);
    root.style.setProperty('--color-panel-bg', theme.colors.panelBg);
    root.style.setProperty('--color-panel-border', theme.colors.panelBorder);
    root.style.setProperty('--color-input-bg', theme.colors.inputBg);
    root.style.setProperty('--color-overlay-bg', theme.colors.overlayBg);
}

function applyBackground() {
    const bg = backgrounds.find(b => b.id === settings.background);
    if (!bg) return;

    const backgroundEl = document.querySelector('.background');
    if (backgroundEl) {
        backgroundEl.style.background = `url('${bg.file}') no-repeat center center`;
        backgroundEl.style.backgroundSize = 'cover';
    }
}

function applySettings() {
    document.getElementById('volumeToggle').checked = settings.volumeEnabled;
    document.getElementById('draggableToggle').checked = settings.draggableItems;
    document.getElementById('petCustomizeToggle').checked = settings.petCustomize;

    // Apply pet customisation
    const characterContainer = document.querySelector('.character-container');
    const character = document.querySelector('.character');

    // Load saved scale
    const savedScale = localStorage.getItem('petScale');
    if (savedScale) {
        petScale = parseFloat(savedScale);
        character.style.transform = `scale(${petScale})`;
    }

    // Always load saved position if it exists, regardless of customisation setting
    const savedPosition = localStorage.getItem('petPosition');
    if (savedPosition) {
        const pos = JSON.parse(savedPosition);
        characterContainer.style.left = pos.x + 'px';
        characterContainer.style.top = pos.y + 'px';
        characterContainer.style.transform = 'none';
    }

    if (settings.petCustomize) {
        character.style.cursor = 'move';
        enablePetDragging(characterContainer, character);
        enablePetResizing(character);
    } else {
        character.style.cursor = 'default';
        disablePetDragging(characterContainer, character);
        disablePetResizing(character);
    }

    // Apply draggable items setting
    if (settings.draggableItems) {
        document.querySelectorAll('.equipped-item').forEach(itemEl => {
            enableItemDragging(itemEl);
        });
    } else {
        disableItemDragging();
    }

    // Apply theme
    applyTheme();
}

function enablePetDragging(container, character) {
    // Remove existing listeners if any
    if (petDragHandlers) {
        character.removeEventListener('mousedown', petDragHandlers.mouseDown);
    }

    // Create handler functions
    function handleMouseDown(e) {
        if (!settings.petCustomize) return;

        isDragging = true;

        // Get current visual position before removing transform
        const rect = container.getBoundingClientRect();
        const parentRect = container.parentElement.getBoundingClientRect();

        // Calculate where the top-left corner currently is visually
        const visualLeft = rect.left - parentRect.left;
        const visualTop = rect.top - parentRect.top;

        // Remove transform and set absolute position to maintain visual position
        container.style.left = visualLeft + 'px';
        container.style.top = visualTop + 'px';
        container.style.transform = 'none';

        // Calculate drag offset from new position
        dragOffset.x = e.clientX - rect.left;
        dragOffset.y = e.clientY - rect.top;

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        e.preventDefault();
    }

    function handleMouseMove(e) {
        if (!isDragging) return;

        const x = e.clientX - dragOffset.x;
        const y = e.clientY - dragOffset.y;

        container.style.left = x + 'px';
        container.style.top = y + 'px';
    }

    function handleMouseUp(e) {
        if (isDragging) {
            isDragging = false;

            // Save position
            localStorage.setItem('petPosition', JSON.stringify({
                x: parseInt(container.style.left),
                y: parseInt(container.style.top)
            }));

            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        }
    }

    // Store handlers for later removal
    petDragHandlers = {
        mouseDown: handleMouseDown,
        mouseMove: handleMouseMove,
        mouseUp: handleMouseUp
    };

    // Add drag listener
    character.addEventListener('mousedown', handleMouseDown);
}

function disablePetDragging(container, character) {
    // Remove event listeners
    if (petDragHandlers) {
        character.removeEventListener('mousedown', petDragHandlers.mouseDown);
        document.removeEventListener('mousemove', petDragHandlers.mouseMove);
        document.removeEventListener('mouseup', petDragHandlers.mouseUp);
        petDragHandlers = null;
    }

    // Keep the position saved so pet stays where it was placed
    // Don't remove from localStorage
}

let petResizeHandlers = null;
let initialPinchDistance = null;
let initialScale = 1.0;

function enablePetResizing(character) {
    let touches = [];

    // Touch events for touchscreen
    const handleTouchStart = (e) => {
        if (!settings.petCustomize) return;
        if (e.touches.length === 2) {
            e.preventDefault();
            touches = Array.from(e.touches);
            const touch1 = touches[0];
            const touch2 = touches[1];
            initialPinchDistance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            );
            initialScale = petScale;
        }
    };

    const handleTouchMove = (e) => {
        if (!settings.petCustomize) return;
        if (e.touches.length === 2 && initialPinchDistance) {
            e.preventDefault();
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const currentDistance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            );

            const scaleChange = currentDistance / initialPinchDistance;
            petScale = Math.max(0.3, Math.min(3.0, initialScale * scaleChange));

            character.style.transform = `scale(${petScale})`;
        }
    };

    const handleTouchEnd = (e) => {
        if (!settings.petCustomize) return;
        if (e.touches.length < 2) {
            initialPinchDistance = null;
            // Save scale
            localStorage.setItem('petScale', petScale.toString());
        }
    };

    // Safari/WebKit gesture events (MacBook trackpad)
    const handleGestureStart = (e) => {
        if (!settings.petCustomize) return;
        e.preventDefault();
        initialScale = petScale;
    };

    const handleGestureChange = (e) => {
        if (!settings.petCustomize) return;
        e.preventDefault();

        petScale = Math.max(0.3, Math.min(3.0, initialScale * e.scale));
        character.style.transform = `scale(${petScale})`;
    };

    const handleGestureEnd = (e) => {
        if (!settings.petCustomize) return;
        e.preventDefault();
        // Save scale
        localStorage.setItem('petScale', petScale.toString());
    };

    // Wheel event for touchpad pinch (Chrome/Firefox on Mac, and other browsers)
    // MacBook trackpad pinch automatically sets e.ctrlKey to true
    const handleWheel = (e) => {
        if (!settings.petCustomize) return;

        // Detect pinch gesture (MacBook trackpad pinch gesture sets ctrlKey automatically)
        if (e.ctrlKey) {
            e.preventDefault();

            const delta = e.deltaY > 0 ? -0.05 : 0.05;
            petScale = Math.max(0.3, Math.min(3.0, petScale + delta));

            character.style.transform = `scale(${petScale})`;

            // Save scale
            localStorage.setItem('petScale', petScale.toString());
        }
    };

    character.addEventListener('touchstart', handleTouchStart, { passive: false });
    character.addEventListener('touchmove', handleTouchMove, { passive: false });
    character.addEventListener('touchend', handleTouchEnd);
    character.addEventListener('gesturestart', handleGestureStart, { passive: false });
    character.addEventListener('gesturechange', handleGestureChange, { passive: false });
    character.addEventListener('gestureend', handleGestureEnd, { passive: false });
    character.addEventListener('wheel', handleWheel, { passive: false });

    petResizeHandlers = {
        touchStart: handleTouchStart,
        touchMove: handleTouchMove,
        touchEnd: handleTouchEnd,
        gestureStart: handleGestureStart,
        gestureChange: handleGestureChange,
        gestureEnd: handleGestureEnd,
        wheel: handleWheel
    };
}

function disablePetResizing(character) {
    if (petResizeHandlers) {
        character.removeEventListener('touchstart', petResizeHandlers.touchStart);
        character.removeEventListener('touchmove', petResizeHandlers.touchMove);
        character.removeEventListener('touchend', petResizeHandlers.touchEnd);
        character.removeEventListener('gesturestart', petResizeHandlers.gestureStart);
        character.removeEventListener('gesturechange', petResizeHandlers.gestureChange);
        character.removeEventListener('gestureend', petResizeHandlers.gestureEnd);
        character.removeEventListener('wheel', petResizeHandlers.wheel);
        petResizeHandlers = null;
    }
}

function openSettings() {
    document.getElementById('settingsOverlay').classList.add('active');
    applySettings();
    hideCountdownTimer();
}

function closeSettings() {
    document.getElementById('settingsOverlay').classList.remove('active');
    showCountdownTimer();
}

function toggleSetting(settingName, value) {
    settings[settingName] = value;
    saveSettings();
    applySettings();
}

// === Pet Blinking Animation ===
// Study animation variables
let studyAnimationInterval = null;
let isStudyAnimationActive = false;

function startPetBlinking() {
    const petImg = document.getElementById('petCharacter');
    if (!petImg) return;

    function blink() {
        // Don't blink if studying
        if (isStudyAnimationActive) return;

        // Close eyes
        petImg.src = '2-removebg-preview.png';

        // Open eyes after 150ms
        setTimeout(() => {
            if (!isStudyAnimationActive) {
                petImg.src = '1-removebg-preview.png';
            }
        }, 150);
    }

    function scheduleNextBlink() {
        // Random interval between 5-15 seconds
        const nextBlinkDelay = Math.random() * 10000 + 5000;
        setTimeout(() => {
            if (!isStudyAnimationActive) {
                blink();
            }
            scheduleNextBlink();
        }, nextBlinkDelay);
    }

    // Start the blinking cycle
    scheduleNextBlink();
}

function startStudyAnimation() {
    const petImg = document.getElementById('petCharacter');
    if (!petImg) return;

    // Stop blinking when studying
    isStudyAnimationActive = true;

    // Alternate between study sprites every 1000ms (1 second to match timer)
    let currentFrame = 1;

    // Set initial study sprite
    petImg.src = 'StudySprite1.png';

    // Clear any existing animation
    if (studyAnimationInterval) {
        clearInterval(studyAnimationInterval);
    }

    // Start the study animation
    studyAnimationInterval = setInterval(() => {
        currentFrame = currentFrame === 1 ? 2 : 1;
        petImg.src = `StudySprite${currentFrame}.png`;
    }, 1000);
}

function stopStudyAnimation() {
    const petImg = document.getElementById('petCharacter');
    if (!petImg) return;

    // Stop the study animation
    isStudyAnimationActive = false;

    if (studyAnimationInterval) {
        clearInterval(studyAnimationInterval);
        studyAnimationInterval = null;
    }

    // Return to normal idle sprite
    petImg.src = '1-removebg-preview.png';

    // Blinking will automatically resume via the original startPetBlinking cycle
}

// Initialise on load
window.addEventListener('DOMContentLoaded', () => {
    // Preload study sprites for flawless swapping
    const studySprite1 = new Image();
    const studySprite2 = new Image();
    studySprite1.src = 'StudySprite1.png';
    studySprite2.src = 'StudySprite2.png';

    // Apply saved pet position immediately to prevent glitch
    const savedPosition = localStorage.getItem('petPosition');
    if (savedPosition) {
        const pos = JSON.parse(savedPosition);
        const characterContainer = document.querySelector('.character-container');
        characterContainer.style.left = pos.x + 'px';
        characterContainer.style.top = pos.y + 'px';
        characterContainer.style.transform = 'none';
    }

    // Apply saved pet scale immediately
    const savedScale = localStorage.getItem('petScale');
    if (savedScale) {
        petScale = parseFloat(savedScale);
        const character = document.querySelector('.character');
        character.style.transform = `scale(${petScale})`;
    }

    loadCoins();
    loadSubjects();
    loadStudyHistory();
    loadOwnedItems();
    loadSettings();
    renderEquippedItems();
    applyTheme();
    applyBackground();
    startPetBlinking();

    // Menu button click handler
    document.getElementById('menuButton').addEventListener('click', toggleMenu);

    // Menu item click handlers
    document.getElementById('timerButton').addEventListener('click', () => {
        openTimerOverlay();
        toggleMenu();
    });

    document.getElementById('statsButton').addEventListener('click', () => {
        openStatsPage();
        toggleMenu();
    });

    document.getElementById('shopButton').addEventListener('click', () => {
        openShop();
        toggleMenu();
    });

    document.getElementById('settingsButton').addEventListener('click', () => {
        openSettings();
        toggleMenu();
    });

    // Timer input click handlers - open keypad
    document.getElementById('studyTimeInput').addEventListener('click', () => {
        openKeypad('studyTimeInput');
    });

    document.getElementById('breakTimeInput').addEventListener('click', () => {
        openKeypad('breakTimeInput');
    });

    document.getElementById('longBreakTimeInput').addEventListener('click', () => {
        openKeypad('longBreakTimeInput');
    });

    // Keypad button handlers
    document.querySelectorAll('.keypad-button').forEach(button => {
        button.addEventListener('click', () => {
            const value = button.getAttribute('data-value');
            handleKeypadInput(value);
        });
    });

    // Subject selector click handler
    document.getElementById('subjectDisplay').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleSubjectDropdown();
    });

    // Add subject option click handler
    document.getElementById('addSubjectOption').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleSubjectDropdown();
        openAddSubjectOverlay();
    });

    // Color picker handlers
    document.querySelectorAll('.color-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            selectedColor = option.getAttribute('data-color');
            updateSubjectPreview();
        });
    });

    // Subject name input handler
    document.getElementById('subjectNameInput').addEventListener('input', updateSubjectPreview);

    // Add subject buttons
    document.getElementById('confirmSubjectButton').addEventListener('click', addSubject);
    document.getElementById('cancelSubjectButton').addEventListener('click', closeAddSubjectOverlay);

    // Timer setup close button
    document.getElementById('closeTimerSetupButton').addEventListener('click', closeTimerOverlay);

    // Start button click handler
    document.getElementById('startTimerButton').addEventListener('click', startTimer);

    // Countdown control buttons
    document.getElementById('pauseButton').addEventListener('click', pauseTimer);
    document.getElementById('stopButton').addEventListener('click', stopTimer);

    // Session stats overlay buttons
    document.getElementById('closeStatsButton').addEventListener('click', closeSessionStats);
    document.getElementById('backToMainButton').addEventListener('click', closeSessionStats);

    // Stats page buttons
    document.getElementById('closeStatsPageButton').addEventListener('click', closeStatsPage);
    document.getElementById('weekTab').addEventListener('click', () => switchViewMode('week'));
    document.getElementById('monthTab').addEventListener('click', () => switchViewMode('month'));
    document.getElementById('yearTab').addEventListener('click', () => switchViewMode('year'));
    document.getElementById('prevDate').addEventListener('click', () => navigateDate(-1));
    document.getElementById('nextDate').addEventListener('click', () => navigateDate(1));
    document.getElementById('addSessionButton').addEventListener('click', openAddSession);

    // Edit session overlay buttons
    document.getElementById('closeEditSessionButton').addEventListener('click', closeEditSession);
    document.getElementById('saveSessionButton').addEventListener('click', saveEditedSession);
    document.getElementById('deleteSessionButton').addEventListener('click', deleteSession);
    document.getElementById('editSubjectDisplay').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleEditSubjectDropdown();
    });

    // Close edit subject dropdown when clicking outside
    document.addEventListener('click', (e) => {
        const editSelector = document.getElementById('editSubjectSelector');
        const editDropdown = document.getElementById('editSubjectDropdown');
        if (editSelector && !editSelector.contains(e.target)) {
            editDropdown.classList.remove('active');
        }
    });

    // Shop buttons
    document.getElementById('closeShopButton').addEventListener('click', closeShop);
    document.getElementById('itemsTab').addEventListener('click', () => switchShopTab('items'));
    document.getElementById('themesTab').addEventListener('click', () => switchShopTab('themes'));
    document.getElementById('backgroundsTab').addEventListener('click', () => switchShopTab('backgrounds'));

    // Subject stats overlay
    document.getElementById('closeSubjectStatsButton').addEventListener('click', closeSubjectStats);

    // Settings buttons
    document.getElementById('closeSettingsButton').addEventListener('click', closeSettings);
    document.getElementById('volumeToggle').addEventListener('change', (e) => {
        toggleSetting('volumeEnabled', e.target.checked);
    });
    document.getElementById('draggableToggle').addEventListener('change', (e) => {
        toggleSetting('draggableItems', e.target.checked);
    });
    document.getElementById('petCustomizeToggle').addEventListener('change', (e) => {
        toggleSetting('petCustomize', e.target.checked);
    });

    // Reset data button
    document.getElementById('resetDataButton').addEventListener('click', () => {
        const confirmed = confirm('⚠️ Are you sure you want to reset ALL data?\n\nThis will delete:\n• All study sessions and statistics\n• All coins\n• All purchased items and themes\n• All subjects\n\nThis action cannot be undone!');

        if (confirmed) {
            // Clear all localStorage
            localStorage.clear();

            // Reload the page to reset everything
            location.reload();
        }
    });
});
