// ============================================================================
// Focus Mood App - JavaScript Logic with To-Do List & Daywise Tracker
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  // --------------------------------------------------------------------------
  // 1. Mood Configuration & Theme Colors
  // --------------------------------------------------------------------------
  const MOOD_QUOTES = {
    forest: '"Quiet your mind, like the still trees in an ancient forest."',
    rain: '"Like raindrops falling steadily, small efforts accumulate into greatness."',
    sunset: '"Honor the rhythm of work and rest. Each sunset brings peace."',
    midnight: '"The stars shine brightest in the stillness of deep night."',
    minimal: '"Eliminate the unnecessary so that the essential may speak."'
  };

  const MOOD_THEME_COLORS = {
    forest: '#0b1712',
    rain: '#0c121e',
    sunset: '#1c0f16',
    midnight: '#070714',
    minimal: '#111111'
  };

  // --------------------------------------------------------------------------
  // 2. Timer Configuration & State (With Custom Durations)
  // --------------------------------------------------------------------------
  const DEFAULT_MINUTES = {
    focus: 25,
    shortBreak: 5,
    longBreak: 15
  };

  let customMinutes = { ...DEFAULT_MINUTES };
  try {
    const savedCustom = localStorage.getItem('fm_custom_durations');
    if (savedCustom) {
      customMinutes = Object.assign(customMinutes, JSON.parse(savedCustom));
    }
  } catch (e) {
    customMinutes = { ...DEFAULT_MINUTES };
  }

  const MODES = {
    focus: { name: 'Deep Focus', duration: customMinutes.focus * 60 },
    shortBreak: { name: 'Short Break', duration: customMinutes.shortBreak * 60 },
    longBreak: { name: 'Long Break', duration: customMinutes.longBreak * 60 }
  };

  let currentMode = 'focus';
  let timeLeft = MODES[currentMode].duration;
  let totalDuration = MODES[currentMode].duration;
  let timerInterval = null;
  let isRunning = false;

  // Global All-Time stats
  let totalMinutesFocused = parseInt(localStorage.getItem('fm_focus_minutes') || '0', 10);

  // DOM Elements - Timer
  const timeDisplay = document.getElementById('timeDisplay');
  const modeStatus = document.getElementById('modeStatus');
  const startPauseBtn = document.getElementById('startPauseBtn');
  const startPauseText = document.getElementById('startPauseText');
  const resetBtn = document.getElementById('resetBtn');
  const skipBtn = document.getElementById('skipBtn');
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabFocus = document.getElementById('tabFocus');
  const tabShort = document.getElementById('tabShort');
  const tabLong = document.getElementById('tabLong');
  const progressRing = document.getElementById('progressRing');
  const todaySessionsEl = document.getElementById('todaySessionsDisplay');
  const todayMinutesEl = document.getElementById('todayMinutesDisplay');
  const allTimeMinutesEl = document.getElementById('allTimeMinutesDisplay');
  const themeColorMeta = document.getElementById('themeColorMeta');
  const clockDisplayWrap = document.getElementById('clockDisplayWrap');
  const timerActiveTaskPill = document.getElementById('timerActiveTaskPill');
  const timerActiveTaskText = document.getElementById('timerActiveTaskText');
  const unfocusTaskBtn = document.getElementById('unfocusTaskBtn');

  const RING_CIRCUMFERENCE = 2 * Math.PI * 130; // 816.814
  progressRing.style.strokeDasharray = `${RING_CIRCUMFERENCE}`;
  progressRing.style.strokeDashoffset = '0';

  function updateTabLabels() {
    if (tabFocus) tabFocus.textContent = `Focus (${customMinutes.focus}m)`;
    if (tabShort) tabShort.textContent = `Short (${customMinutes.shortBreak}m)`;
    if (tabLong) tabLong.textContent = `Long (${customMinutes.longBreak}m)`;
  }

  // --------------------------------------------------------------------------
  // 3. Mood Theme Selector
  // --------------------------------------------------------------------------
  const moodChips = document.querySelectorAll('.mood-chip');
  const moodQuoteEl = document.getElementById('moodQuote');

  function setMood(moodKey) {
    if (!MOOD_QUOTES[moodKey]) moodKey = 'forest';
    document.body.dataset.mood = moodKey;
    localStorage.setItem('fm_saved_mood', moodKey);

    if (themeColorMeta && MOOD_THEME_COLORS[moodKey]) {
      themeColorMeta.setAttribute('content', MOOD_THEME_COLORS[moodKey]);
    }

    moodChips.forEach(chip => {
      chip.classList.toggle('active', chip.dataset.setMood === moodKey);
    });

    if (moodQuoteEl) {
      moodQuoteEl.textContent = MOOD_QUOTES[moodKey];
    }
  }

  moodChips.forEach(chip => {
    chip.addEventListener('click', () => {
      setMood(chip.dataset.setMood);
    });
  });

  const savedMood = localStorage.getItem('fm_saved_mood') || 'forest';
  setMood(savedMood);

  // --------------------------------------------------------------------------
  // 4. Daywise Focus Tracker Logic (LocalStorage)
  // --------------------------------------------------------------------------
  function getLocalDateKey(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function getDaywiseHistory() {
    try {
      const raw = localStorage.getItem('fm_daywise_history');
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveDaywiseHistory(data) {
    localStorage.setItem('fm_daywise_history', JSON.stringify(data));
  }

  function recordDaywiseSession(minutes) {
    const history = getDaywiseHistory();
    const todayKey = getLocalDateKey();

    if (!history[todayKey]) {
      history[todayKey] = { minutes: 0, sessions: 0 };
    }

    history[todayKey].minutes += minutes;
    history[todayKey].sessions += 1;

    saveDaywiseHistory(history);
    renderDaywiseTracker();
  }

  function calculateStreak(history) {
    let streak = 0;
    const now = new Date();
    const todayKey = getLocalDateKey(now);

    const hasToday = history[todayKey] && history[todayKey].minutes > 0;
    let checkDate = new Date();

    if (!hasToday) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const key = getLocalDateKey(checkDate);
      if (history[key] && history[key].minutes > 0) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  const streakBadge = document.getElementById('streakBadge');
  const weeklyTotalText = document.getElementById('weeklyTotalText');
  const activityBarsGrid = document.getElementById('activityBarsGrid');
  const dailyHistoryList = document.getElementById('dailyHistoryList');
  const historyToggleBtn = document.getElementById('historyToggleBtn');
  const historyContent = document.getElementById('historyContent');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');

  function renderDaywiseTracker() {
    const history = getDaywiseHistory();
    const todayKey = getLocalDateKey();
    const todayData = history[todayKey] || { minutes: 0, sessions: 0 };

    if (todaySessionsEl) todaySessionsEl.textContent = todayData.sessions;
    if (todayMinutesEl) todayMinutesEl.textContent = `${todayData.minutes}m`;
    if (allTimeMinutesEl) allTimeMinutesEl.textContent = `${totalMinutesFocused}m`;

    const streak = calculateStreak(history);
    if (streakBadge) {
      streakBadge.textContent = `🔥 ${streak} Day${streak === 1 ? '' : 's'} Streak`;
    }

    const past7Days = [];
    let weeklyMinutes = 0;
    let maxMinutesInWeek = 30;

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = getLocalDateKey(d);
      const dayData = history[key] || { minutes: 0, sessions: 0 };
      const dayName = d.toLocaleDateString(undefined, { weekday: 'short' });
      const isToday = (key === todayKey);

      weeklyMinutes += dayData.minutes;
      if (dayData.minutes > maxMinutesInWeek) {
        maxMinutesInWeek = dayData.minutes;
      }

      past7Days.push({
        key,
        dayName,
        minutes: dayData.minutes,
        sessions: dayData.sessions,
        isToday
      });
    }

    if (weeklyTotalText) {
      weeklyTotalText.textContent = `Week: ${weeklyMinutes}m`;
    }

    if (activityBarsGrid) {
      activityBarsGrid.innerHTML = '';
      past7Days.forEach(day => {
        const col = document.createElement('div');
        col.className = `bar-column ${day.isToday ? 'is-today' : ''}`;

        const heightPercent = day.minutes > 0 ? Math.max(12, Math.round((day.minutes / maxMinutesInWeek) * 100)) : 4;
        const tooltip = `${day.dayName} (${day.key}): ${day.minutes}m (${day.sessions} sessions)`;

        col.innerHTML = `
          <div class="bar-pill-wrap" title="${tooltip}">
            <div class="bar-fill" style="height: ${heightPercent}%;"></div>
          </div>
          <span class="bar-label">${day.dayName}</span>
        `;
        activityBarsGrid.appendChild(col);
      });
    }

    if (dailyHistoryList) {
      dailyHistoryList.innerHTML = '';
      const dateKeys = Object.keys(history).sort().reverse();

      if (dateKeys.length === 0) {
        dailyHistoryList.innerHTML = `<div class="history-empty">No focus sessions recorded yet. Start your first session!</div>`;
      } else {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayKey = getLocalDateKey(yesterday);

        dateKeys.forEach(key => {
          const item = history[key];
          let displayDate = key;

          if (key === todayKey) {
            displayDate = `Today <span class="today-tag">Now</span>`;
          } else if (key === yesterdayKey) {
            displayDate = `Yesterday`;
          } else {
            const parts = key.split('-');
            if (parts.length === 3) {
              const dObj = new Date(parts[0], parts[1] - 1, parts[2]);
              displayDate = dObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
            }
          }

          const row = document.createElement('div');
          row.className = 'history-item';
          row.innerHTML = `
            <div class="history-date">${displayDate}</div>
            <div class="history-stats-right">
              <span class="history-minutes">${item.minutes}m</span>
              <span class="history-sessions">(${item.sessions} session${item.sessions === 1 ? '' : 's'})</span>
            </div>
          `;
          dailyHistoryList.appendChild(row);
        });
      }
    }
  }

  if (historyToggleBtn && historyContent) {
    historyToggleBtn.addEventListener('click', () => {
      const isHidden = historyContent.classList.toggle('hidden');
      historyToggleBtn.classList.toggle('open', !isHidden);
    });
  }

  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear your daywise focus history?')) {
        localStorage.removeItem('fm_daywise_history');
        renderDaywiseTracker();
      }
    });
  }

  // --------------------------------------------------------------------------
  // 5. Timer Mechanics
  // --------------------------------------------------------------------------
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function updateDisplay() {
    timeDisplay.textContent = formatTime(timeLeft);
    document.title = `${formatTime(timeLeft)} • Focus Mood`;

    const progress = totalDuration > 0 ? (totalDuration - timeLeft) / totalDuration : 0;
    const offset = RING_CIRCUMFERENCE * (1 - Math.min(Math.max(progress, 0), 1));
    progressRing.style.strokeDashoffset = offset;
  }

  function switchMode(modeKey) {
    if (!MODES[modeKey]) return;
    pauseTimer();
    currentMode = modeKey;
    totalDuration = MODES[modeKey].duration;
    timeLeft = totalDuration;

    tabButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === modeKey);
    });

    modeStatus.textContent = `Ready to ${MODES[modeKey].name.toLowerCase()}`;
    updateDisplay();
  }

  function startTimer() {
    if (isRunning) return;
    isRunning = true;
    startPauseText.textContent = 'Pause';
    startPauseBtn.querySelector('.icon').textContent = '⏸';
    modeStatus.textContent = `Focusing...`;

    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    timerInterval = setInterval(() => {
      if (timeLeft > 0) {
        timeLeft--;
        updateDisplay();
      } else {
        handleTimerComplete();
      }
    }, 1000);
  }

  function pauseTimer() {
    isRunning = false;
    clearInterval(timerInterval);
    timerInterval = null;
    startPauseText.textContent = 'Start';
    startPauseBtn.querySelector('.icon').textContent = '▶';
    modeStatus.textContent = 'Paused';
  }

  function handleTimerComplete() {
    pauseTimer();
    playNotificationChime();

    if (currentMode === 'focus') {
      const minsCompleted = Math.round(MODES.focus.duration / 60);
      totalMinutesFocused += minsCompleted;
      localStorage.setItem('fm_focus_minutes', totalMinutesFocused);

      recordDaywiseSession(minsCompleted);

      switchMode('shortBreak');
      modeStatus.textContent = 'Session complete! Break time.';
    } else {
      switchMode('focus');
      modeStatus.textContent = 'Break finished! Back to focus.';
    }
  }

  function resetTimer() {
    pauseTimer();
    timeLeft = totalDuration;
    modeStatus.textContent = 'Ready to focus';
    updateDisplay();
  }

  function skipSession() {
    if (confirm('Skip to the next session?')) {
      if (currentMode === 'focus') {
        switchMode('shortBreak');
      } else {
        switchMode('focus');
      }
    }
  }

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      switchMode(btn.dataset.mode);
    });
  });

  startPauseBtn.addEventListener('click', () => {
    if (isRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  });

  resetBtn.addEventListener('click', resetTimer);
  skipBtn.addEventListener('click', skipSession);

  // --------------------------------------------------------------------------
  // 6. Quick Minute Adjuster Buttons (-5m, -1m, +1m, +5m)
  // --------------------------------------------------------------------------
  const quickAdjButtons = document.querySelectorAll('.quick-adj-btn');
  quickAdjButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const deltaMins = parseInt(btn.dataset.delta, 10);
      if (isNaN(deltaMins)) return;

      const deltaSecs = deltaMins * 60;
      const newTime = timeLeft + deltaSecs;

      if (newTime >= 10 && newTime <= 180 * 60) {
        timeLeft = newTime;
        if (!isRunning) {
          totalDuration = Math.max(totalDuration, timeLeft);
        } else {
          totalDuration = Math.max(totalDuration, totalDuration + deltaSecs);
        }
        updateDisplay();
      }
    });
  });

  // --------------------------------------------------------------------------
  // 7. Custom Timer Settings Modal
  // --------------------------------------------------------------------------
  const customTimerBtn = document.getElementById('customTimerBtn');
  const customTimerModal = document.getElementById('customTimerModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const customTimerForm = document.getElementById('customTimerForm');
  const customFocusInput = document.getElementById('customFocusInput');
  const customShortInput = document.getElementById('customShortInput');
  const customLongInput = document.getElementById('customLongInput');
  const valFocusLabel = document.getElementById('valFocusLabel');
  const valShortLabel = document.getElementById('valShortLabel');
  const valLongLabel = document.getElementById('valLongLabel');
  const resetDefaultsBtn = document.getElementById('resetDefaultsBtn');
  const presetChips = document.querySelectorAll('.preset-chip');

  function openCustomModal() {
    customFocusInput.value = customMinutes.focus;
    customShortInput.value = customMinutes.shortBreak;
    customLongInput.value = customMinutes.longBreak;
    valFocusLabel.textContent = customMinutes.focus;
    valShortLabel.textContent = customMinutes.shortBreak;
    valLongLabel.textContent = customMinutes.longBreak;
    customTimerModal.classList.remove('hidden');
  }

  function closeCustomModal() {
    customTimerModal.classList.add('hidden');
  }

  if (customTimerBtn) {
    customTimerBtn.addEventListener('click', openCustomModal);
  }

  if (clockDisplayWrap) {
    clockDisplayWrap.addEventListener('click', () => {
      if (!isRunning) {
        openCustomModal();
      }
    });
  }

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeCustomModal);
  }

  if (customTimerModal) {
    customTimerModal.addEventListener('click', (e) => {
      if (e.target === customTimerModal) {
        closeCustomModal();
      }
    });
  }

  customFocusInput.addEventListener('input', () => {
    valFocusLabel.textContent = customFocusInput.value || 0;
  });
  customShortInput.addEventListener('input', () => {
    valShortLabel.textContent = customShortInput.value || 0;
  });
  customLongInput.addEventListener('input', () => {
    valLongLabel.textContent = customLongInput.value || 0;
  });

  presetChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const targetId = chip.dataset.target;
      const val = parseInt(chip.dataset.val, 10);
      const targetInput = document.getElementById(targetId);
      if (targetInput) {
        targetInput.value = val;
        targetInput.dispatchEvent(new Event('input'));
      }
    });
  });

  if (resetDefaultsBtn) {
    resetDefaultsBtn.addEventListener('click', () => {
      customFocusInput.value = DEFAULT_MINUTES.focus;
      customShortInput.value = DEFAULT_MINUTES.shortBreak;
      customLongInput.value = DEFAULT_MINUTES.longBreak;
      valFocusLabel.textContent = DEFAULT_MINUTES.focus;
      valShortLabel.textContent = DEFAULT_MINUTES.shortBreak;
      valLongLabel.textContent = DEFAULT_MINUTES.longBreak;
    });
  }

  if (customTimerForm) {
    customTimerForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const newFocus = Math.max(1, Math.min(180, parseInt(customFocusInput.value, 10) || 25));
      const newShort = Math.max(1, Math.min(60, parseInt(customShortInput.value, 10) || 5));
      const newLong = Math.max(1, Math.min(60, parseInt(customLongInput.value, 10) || 15));

      customMinutes = {
        focus: newFocus,
        shortBreak: newShort,
        longBreak: newLong
      };

      localStorage.setItem('fm_custom_durations', JSON.stringify(customMinutes));

      MODES.focus.duration = customMinutes.focus * 60;
      MODES.shortBreak.duration = customMinutes.shortBreak * 60;
      MODES.longBreak.duration = customMinutes.longBreak * 60;

      updateTabLabels();

      pauseTimer();
      totalDuration = MODES[currentMode].duration;
      timeLeft = totalDuration;
      modeStatus.textContent = `Ready to ${MODES[currentMode].name.toLowerCase()}`;
      updateDisplay();

      closeCustomModal();
    });
  }

  // --------------------------------------------------------------------------
  // 8. Procedural Web Audio Ambient Sound Generator (100% Offline)
  // --------------------------------------------------------------------------
  let audioCtx = null;
  let activeNodes = [];
  let masterGain = null;

  function initAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContextClass();
      masterGain = audioCtx.createGain();
      const slider = document.getElementById('volumeSlider');
      masterGain.gain.setValueAtTime(parseFloat(slider.value), audioCtx.currentTime);
      masterGain.connect(audioCtx.destination);
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function stopAmbientSound() {
    activeNodes.forEach(node => {
      try {
        if (node.stop) node.stop();
        if (node.disconnect) node.disconnect();
      } catch (e) {}
    });
    activeNodes = [];
  }

  function createNoiseNode(type) {
    initAudioContext();
    const bufferSize = 2 * audioCtx.sampleRate;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = buffer.getChannelData(0);

    if (type === 'white') {
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
    } else if (type === 'brown') {
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5;
      }
    } else if (type === 'pink') {
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        output[i] *= 0.11;
        b6 = white * 0.115926;
      }
    }

    const whiteNoiseSource = audioCtx.createBufferSource();
    whiteNoiseSource.buffer = buffer;
    whiteNoiseSource.loop = true;
    return whiteNoiseSource;
  }

  function playAmbientSound(type) {
    stopAmbientSound();
    if (type === 'off') return;

    initAudioContext();

    if (type === 'brown') {
      const source = createNoiseNode('brown');
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, audioCtx.currentTime);

      source.connect(filter);
      filter.connect(masterGain);
      source.start();
      activeNodes.push(source, filter);
    } 
    else if (type === 'pink') {
      const source = createNoiseNode('pink');
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, audioCtx.currentTime);

      source.connect(filter);
      filter.connect(masterGain);
      source.start();
      activeNodes.push(source, filter);
    } 
    else if (type === 'rain') {
      const source = createNoiseNode('pink');
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, audioCtx.currentTime);
      filter.Q.setValueAtTime(1.2, audioCtx.currentTime);

      const rainGain = audioCtx.createGain();
      rainGain.gain.setValueAtTime(0.7, audioCtx.currentTime);

      source.connect(filter);
      filter.connect(rainGain);
      rainGain.connect(masterGain);
      source.start();
      activeNodes.push(source, filter, rainGain);
    } 
    else if (type === 'binaural') {
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const oscGain = audioCtx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(432, audioCtx.currentTime);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(436, audioCtx.currentTime);

      oscGain.gain.setValueAtTime(0.25, audioCtx.currentTime);

      osc1.connect(oscGain);
      osc2.connect(oscGain);
      oscGain.connect(masterGain);

      osc1.start();
      osc2.start();
      activeNodes.push(osc1, osc2, oscGain);
    }
  }

  function playNotificationChime() {
    try {
      initAudioContext();
      const chimeOsc = audioCtx.createOscillator();
      const chimeGain = audioCtx.createGain();
      const now = audioCtx.currentTime;

      chimeOsc.type = 'sine';
      chimeOsc.frequency.setValueAtTime(587.33, now); // D5
      chimeOsc.frequency.exponentialRampToValueAtTime(880, now + 0.3); // A5

      chimeGain.gain.setValueAtTime(0, now);
      chimeGain.gain.linearRampToValueAtTime(0.4, now + 0.05);
      chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      chimeOsc.connect(chimeGain);
      chimeGain.connect(masterGain);

      chimeOsc.start(now);
      chimeOsc.stop(now + 1.2);
    } catch (e) {
      console.warn('Audio chime could not play:', e);
    }
  }

  const soundChips = document.querySelectorAll('.sound-chip');
  soundChips.forEach(chip => {
    chip.addEventListener('click', () => {
      soundChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      playAmbientSound(chip.dataset.sound);
    });
  });

  const volumeSlider = document.getElementById('volumeSlider');
  if (volumeSlider) {
    volumeSlider.addEventListener('input', (e) => {
      if (masterGain && audioCtx) {
        masterGain.gain.setValueAtTime(parseFloat(e.target.value), audioCtx.currentTime);
      }
    });
  }

  // --------------------------------------------------------------------------
  // 9. Full To-Do Task List Features (LocalStorage)
  // --------------------------------------------------------------------------
  let tasks = [];
  try {
    const savedTasks = localStorage.getItem('fm_todo_tasks');
    tasks = savedTasks ? JSON.parse(savedTasks) : [];
  } catch (e) {
    tasks = [];
  }

  let activeFocusedTaskId = localStorage.getItem('fm_focused_task_id') || null;
  let currentTaskFilter = 'all';

  const todoForm = document.getElementById('todoForm');
  const todoInput = document.getElementById('todoInput');
  const todoList = document.getElementById('todoList');
  const todoProgressBadge = document.getElementById('todoProgressBadge');
  const todoProgressFill = document.getElementById('todoProgressFill');
  const clearCompletedBtn = document.getElementById('clearCompletedBtn');
  const filterChips = document.querySelectorAll('.todo-filters .filter-chip');
  const filterAll = document.getElementById('filterAll');
  const filterActive = document.getElementById('filterActive');
  const filterCompleted = document.getElementById('filterCompleted');

  function saveTasks() {
    localStorage.setItem('fm_todo_tasks', JSON.stringify(tasks));
    if (activeFocusedTaskId) {
      localStorage.setItem('fm_focused_task_id', activeFocusedTaskId);
    } else {
      localStorage.removeItem('fm_focused_task_id');
    }
  }

  function renderTasks() {
    const totalCount = tasks.length;
    const completedCount = tasks.filter(t => t.completed).length;
    const activeCount = totalCount - completedCount;

    // 1. Update Progress Header
    if (todoProgressBadge) {
      todoProgressBadge.textContent = `${completedCount} / ${totalCount} done`;
    }
    if (todoProgressFill) {
      const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
      todoProgressFill.style.width = `${pct}%`;
    }

    // 2. Update Filter Chip Counts
    if (filterAll) filterAll.textContent = `All (${totalCount})`;
    if (filterActive) filterActive.textContent = `Active (${activeCount})`;
    if (filterCompleted) filterCompleted.textContent = `Done (${completedCount})`;

    // 3. Clear Completed button visibility
    if (clearCompletedBtn) {
      clearCompletedBtn.classList.toggle('hidden', completedCount === 0);
    }

    // 4. Update Timer Card Active Focus Pill
    const focusedTask = tasks.find(t => String(t.id) === String(activeFocusedTaskId));
    if (focusedTask && timerActiveTaskPill && timerActiveTaskText) {
      timerActiveTaskPill.classList.remove('hidden');
      timerActiveTaskText.textContent = focusedTask.text;
    } else {
      if (timerActiveTaskPill) timerActiveTaskPill.classList.add('hidden');
      activeFocusedTaskId = null;
    }

    // 5. Render Filtered Tasks List
    if (!todoList) return;
    todoList.innerHTML = '';

    const filtered = tasks.filter(t => {
      if (currentTaskFilter === 'active') return !t.completed;
      if (currentTaskFilter === 'completed') return t.completed;
      return true;
    });

    if (filtered.length === 0) {
      let emptyMsg = 'No tasks yet. Add one above to get started!';
      if (currentTaskFilter === 'active' && totalCount > 0) emptyMsg = 'All tasks completed! Great work 🎉';
      if (currentTaskFilter === 'completed' && totalCount > 0) emptyMsg = 'No completed tasks yet.';
      todoList.innerHTML = `<div class="todo-empty">${emptyMsg}</div>`;
      return;
    }

    filtered.forEach(task => {
      const isFocused = String(task.id) === String(activeFocusedTaskId);
      const itemEl = document.createElement('div');
      itemEl.className = `todo-item ${task.completed ? 'completed' : ''} ${isFocused ? 'is-focused' : ''}`;
      itemEl.dataset.id = task.id;

      itemEl.innerHTML = `
        <div class="todo-left" title="Click to toggle done">
          <span class="todo-checkbox" aria-label="Toggle completed"></span>
          <span class="todo-text">${escapeHtml(task.text)}</span>
        </div>
        <div class="todo-actions">
          <button type="button" class="todo-action-btn todo-focus-btn" title="${isFocused ? 'Unlink from Timer' : 'Focus on this task with Timer'}">
            ${isFocused ? '🎯' : '🎯'}
          </button>
          <button type="button" class="todo-action-btn todo-delete-btn" title="Delete Task">✕</button>
        </div>
      `;

      // Checkbox click
      itemEl.querySelector('.todo-left').addEventListener('click', () => {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
      });

      // Focus button click (Sets task as the current focus timer intent)
      itemEl.querySelector('.todo-focus-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        if (String(activeFocusedTaskId) === String(task.id)) {
          activeFocusedTaskId = null;
        } else {
          activeFocusedTaskId = task.id;
        }
        saveTasks();
        renderTasks();
      });

      // Delete button click
      itemEl.querySelector('.todo-delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        tasks = tasks.filter(t => t.id !== task.id);
        if (String(activeFocusedTaskId) === String(task.id)) {
          activeFocusedTaskId = null;
        }
        saveTasks();
        renderTasks();
      });

      todoList.appendChild(itemEl);
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Add Task
  if (todoForm && todoInput) {
    todoForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = todoInput.value.trim();
      if (!text) return;

      const newTask = {
        id: Date.now(),
        text,
        completed: false,
        createdAt: Date.now()
      };

      tasks.unshift(newTask);

      // If no task is currently focused, automatically focus this first task
      if (!activeFocusedTaskId) {
        activeFocusedTaskId = newTask.id;
      }

      saveTasks();
      renderTasks();
      todoInput.value = '';
    });
  }

  // Filter Buttons
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentTaskFilter = chip.dataset.filter;
      renderTasks();
    });
  });

  // Clear Completed
  if (clearCompletedBtn) {
    clearCompletedBtn.addEventListener('click', () => {
      tasks = tasks.filter(t => !t.completed);
      saveTasks();
      renderTasks();
    });
  }

  // Unfocus button from timer pill
  if (unfocusTaskBtn) {
    unfocusTaskBtn.addEventListener('click', () => {
      activeFocusedTaskId = null;
      saveTasks();
      renderTasks();
    });
  }

  // --------------------------------------------------------------------------
  // 10. Fullscreen Toggle
  // --------------------------------------------------------------------------
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      }
    });
  }

  // --------------------------------------------------------------------------
  // 11. Initial Application Load
  // --------------------------------------------------------------------------
  updateTabLabels();
  renderDaywiseTracker();
  renderTasks();
  updateDisplay();
});
