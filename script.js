document.addEventListener('DOMContentLoaded', () => {
    // --- CONSTANTES Y VARIABLES GLOBALES ---
    const API_KEY = '04c7b803095cd48d76c3f1633056bd05';
    const SNOOZE_MINUTES = 5;
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const themes = { 'neon-classic': { textColor: '#FFFFFF', bgColor1: '#0000FF', bgColor2: '#000000', glowColor1: '#E6AB0A' },'ocean': { textColor: '#E0FFFF', bgColor1: '#00008B', bgColor2: '#008B8B', glowColor1: '#00FFFF' },'sunset': { textColor: '#FFFFE0', bgColor1: '#FF4500', bgColor2: '#8B0000', glowColor1: '#FFD700' },'matrix': { textColor: '#39FF14', bgColor1: '#000000', bgColor2: '#080808', glowColor1: '#008F11' } };
    let appState = { settings: { alarms: [], textColor: '#FFFFFF', bgColor1: '#0000FF', bgColor2: '#000000', glowColor1: '#E6AB0A', additionalTimeZones: [], weatherLocation: null, useGeolocation: true }, stopwatch: { isRunning: false, startTime: 0, elapsedTime: 0, laps: [] }, timer: { isRunning: false, remainingTime: 0, endTime: 0 } };
    let alarmSound = null; let activeAlarmId = null; let stopwatchAnimationFrameId = null; let timerIntervalId = null;

    // --- SELECCIÓN DE ELEMENTOS DEL DOM ---
    const $body = document.body;
    const $modeNavButtons = document.querySelectorAll('.mode-btn');
    const $fechaPrincipal = document.querySelector('.fecha');
    const $tiempoPrincipal = document.querySelector('.reloj-principal .tiempo');
    const $worldClocksSidebar = document.querySelector('.world-clocks-sidebar');
    const $stopwatchTime = document.querySelector('.stopwatch-time');
    const $startStopwatchBtn = document.getElementById('startStopwatchBtn');
    const $lapBtn = document.getElementById('lapBtn');
    const $resetStopwatchBtn = document.getElementById('resetStopwatchBtn');
    const $lapsList = document.querySelector('.laps-list');
    const $timerInputs = document.querySelector('.timer-inputs');
    const $timerMinutesInput = document.getElementById('timerMinutes');
    const $timerSecondsInput = document.getElementById('timerSeconds');
    const $timerCountdown = document.querySelector('.timer-countdown');
    const $startTimerBtn = document.getElementById('startTimerBtn');
    const $stopTimerBtn = document.getElementById('stopTimerBtn');
    const $resetTimerBtn = document.getElementById('resetTimerBtn');
    const $alarmDialogOverlay = document.getElementById('alarmDialogOverlay');
    const $dialogMessage = document.getElementById('dialogMessage');
    const $snoozeBtn = document.getElementById('snoozeBtn');
    const $stopAlarmBtn = document.getElementById('stopAlarmBtn');
    const $controlesContainer = document.querySelector('.controles-container');
    const $toggleControlsBtn = document.getElementById('toggleControlsBtn');
    const $weatherContainer = document.querySelector('.weather-container');
    const $weatherIcon = document.querySelector('.weather-icon');
    const $weatherTemp = document.querySelector('.weather-temp');
    const $weatherCity = document.querySelector('.weather-city');
    const $locationInput = document.getElementById('locationInput');
    const $searchWeatherBtn = document.getElementById('searchWeatherBtn');
    const $geolocateBtn = document.getElementById('geolocateBtn');
    const $textColorInput = document.getElementById('textColor');
    const $bgColor1Input = document.getElementById('bgColor1');
    const $bgColor2Input = document.getElementById('bgColor2');
    const $glowColor1Input = document.getElementById('glowColor1');
    const $themeButtons = document.querySelectorAll('.theme-btn');
    const $alarmTimeInput = document.getElementById('alarmTime');
    const $alarmMessageInput = document.getElementById('alarmMessage');
    const $setAlarmBtn = document.getElementById('setAlarmBtn');
    const $alarmListUl = document.querySelector('#alarmList ul');
    const $timeZoneSelect = document.getElementById('timeZoneSelect');
    const $addTimeZoneBtn = document.getElementById('addTimeZoneBtn');
    const $additionalClocksContainer = document.getElementById('additionalClocksContainer');
    
    // --- LÓGICA DE NAVEGACIÓN Y BUCLES PRINCIPALES ---
    function switchMode(mode) { $body.dataset.mode = mode; $modeNavButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.mode === mode)); if (mode !== 'stopwatch' && appState.stopwatch.isRunning) stopStopwatch(); if (mode !== 'timer' && appState.timer.isRunning) stopTimer(); }
    function mainUpdateLoop() { const ahora = new Date(); updateClockDisplay(ahora); checkAlarms(ahora); updateSidebarClocks(ahora); if ($controlesContainer.classList.contains('visible')) updateAdditionalClocksInSettings(ahora); }

    // --- LÓGICA DE LA BARRA LATERAL ---
    function renderSidebarClocks() { $worldClocksSidebar.innerHTML = ''; if (appState.settings.additionalTimeZones.length === 0) { $worldClocksSidebar.innerHTML = '<p class="sidebar-empty-msg" style="opacity: 0.5; font-size: 0.8em;">Añade zonas horarias en ⚙️</p>'; return; } appState.settings.additionalTimeZones.forEach(zone => { const clockItem = document.createElement('div'); clockItem.className = 'sidebar-clock-item'; clockItem.dataset.zoneId = zone.id; clockItem.innerHTML = `<div class="sidebar-top-line"><span class="sidebar-clock-city">${zone.name}</span><span class="sidebar-hyphen">-</span><span class="sidebar-clock-time">--:--:--</span></div><span class="sidebar-clock-date">--/--/----</span>`; $worldClocksSidebar.appendChild(clockItem); }); updateSidebarClocks(new Date()); }
    function updateSidebarClocks(baseTime) { document.querySelectorAll('.sidebar-clock-item').forEach(clockItem => { const zoneId = clockItem.dataset.zoneId; const timeEl = clockItem.querySelector('.sidebar-clock-time'); const dateEl = clockItem.querySelector('.sidebar-clock-date'); try { const timeString = baseTime.toLocaleTimeString('es-ES', { timeZone: zoneId, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }); const dateString = baseTime.toLocaleDateString('es-ES', { timeZone: zoneId, day: '2-digit', month: '2-digit', year: 'numeric' }); timeEl.innerHTML = timeString.replace(/:/g, '<span class="separador-tiempo">:</span>'); dateEl.textContent = dateString; } catch (e) {} }); }

    // --- LÓGICA DEL CRONÓMETRO Y TEMPORIZADOR (sin cambios lógicos) ---
    // (El resto del código está completo y sin cambios desde la última versión funcional)
    let stopwatchState = { isRunning: false, startTime: 0, elapsedTime: 0, laps: [], animationFrameId: null };
    function formatStopwatchTime(ms) { const d = new Date(ms); return `${String(d.getUTCMinutes()).padStart(2, '0')}:${String(d.getUTCSeconds()).padStart(2, '0')}.${String(Math.floor(d.getUTCMilliseconds() / 10)).padStart(2, '0')}`; }
    function updateStopwatch() { $stopwatchTime.textContent = formatStopwatchTime(Date.now() - appState.stopwatch.startTime + appState.stopwatch.elapsedTime); stopwatchAnimationFrameId = requestAnimationFrame(updateStopwatch); }
    function startStopwatch() { if (appState.stopwatch.isRunning) return; appState.stopwatch.isRunning = true; appState.stopwatch.startTime = Date.now(); $startStopwatchBtn.textContent = 'Parar'; $lapBtn.disabled = false; $resetStopwatchBtn.disabled = false; updateStopwatch(); saveState(); }
    function stopStopwatch() { if (!appState.stopwatch.isRunning) return; appState.stopwatch.isRunning = false; appState.stopwatch.elapsedTime += Date.now() - appState.stopwatch.startTime; cancelAnimationFrame(stopwatchAnimationFrameId); $startStopwatchBtn.textContent = 'Continuar'; saveState(); }
    function resetStopwatch() { if (appState.stopwatch.isRunning) stopStopwatch(); appState.stopwatch = { isRunning: false, startTime: 0, elapsedTime: 0, laps: [] }; $stopwatchTime.textContent = '00:00.00'; $lapsList.innerHTML = ''; $startStopwatchBtn.textContent = 'Iniciar'; $lapBtn.disabled = true; $resetStopwatchBtn.disabled = true; saveState(); }
    function addLap() { if (!appState.stopwatch.isRunning) return; const lapTime = formatStopwatchTime(Date.now() - appState.stopwatch.startTime + appState.stopwatch.elapsedTime); appState.stopwatch.laps.push(lapTime); renderLaps(); saveState(); }
    function renderLaps() { $lapsList.innerHTML = ''; appState.stopwatch.laps.forEach((lap, index) => { const li = document.createElement('li'); li.innerHTML = `<span class="lap-number">Vuelta ${index + 1}</span><span>${lap}</span>`; $lapsList.prepend(li); }); }
    let timerState = { isRunning: false, remainingTime: 0, intervalId: null };
    function updateTimerDisplay() { const minutes = String(Math.floor(appState.timer.remainingTime / 60000)).padStart(2, '0'); const seconds = String(Math.floor((appState.timer.remainingTime % 60000) / 1000)).padStart(2, '0'); $timerCountdown.textContent = `${minutes}:${seconds}`; }
    function startTimer() { if (appState.timer.isRunning) return; if (appState.timer.remainingTime <= 0) { const minutes = parseInt($timerMinutesInput.value) || 0; const seconds = parseInt($timerSecondsInput.value) || 0; appState.timer.remainingTime = (minutes * 60 + seconds) * 1000; } if (appState.timer.remainingTime <= 0) return; appState.timer.isRunning = true; appState.timer.endTime = Date.now() + appState.timer.remainingTime; $timerInputs.style.display = 'none'; $timerCountdown.style.display = 'block'; $startTimerBtn.textContent = 'Iniciar'; $startTimerBtn.disabled = true; $stopTimerBtn.disabled = false; $resetTimerBtn.disabled = false; timerIntervalId = setInterval(() => { const newRemaining = appState.timer.endTime - Date.now(); if (newRemaining <= 0) { clearInterval(timerIntervalId); appState.timer.remainingTime = 0; updateTimerDisplay(); showAlarmDialog({ message: '¡Tiempo finalizado!' }); $stopTimerBtn.disabled = true; } else { appState.timer.remainingTime = newRemaining; updateTimerDisplay(); } saveState(); }, 100); saveState(); }
    function stopTimer() { if (!appState.timer.isRunning) return; appState.timer.isRunning = false; clearInterval(timerIntervalId); appState.timer.remainingTime = appState.timer.endTime - Date.now(); $startTimerBtn.textContent = 'Continuar'; $startTimerBtn.disabled = false; $stopTimerBtn.disabled = true; saveState(); }
    function resetTimer() { if (appState.timer.isRunning) stopTimer(); appState.timer.remainingTime = 0; $timerInputs.style.display = 'flex'; $timerCountdown.style.display = 'none'; $startTimerBtn.textContent = 'Iniciar'; $startTimerBtn.disabled = false; $stopTimerBtn.disabled = true; $resetTimerBtn.disabled = true; const minutes = String(parseInt($timerMinutesInput.value) || 0).padStart(2, '0'); const seconds = String(parseInt($timerSecondsInput.value) || 0).padStart(2, '0'); $timerCountdown.textContent = `${minutes}:${seconds}`; saveState(); }
    function updateClockDisplay(ahora) { const dia = ('0' + ahora.getDate()).slice(-2); const mesNum = ('0' + (ahora.getMonth() + 1)).slice(-2); const anio = ahora.getFullYear(); const diaSem = diasSemana[ahora.getDay()]; $fechaPrincipal.innerHTML = `${diaSem} ${dia}-${mesNum}-${anio}`; const horas = ('0' + ahora.getHours()).slice(-2); const minutos = ('0' + ahora.getMinutes()).slice(-2); const segundos = ('0' + ahora.getSeconds()).slice(-2); $tiempoPrincipal.innerHTML = `${horas}<span class="separador-tiempo">:</span>${minutos}<span class="separador-tiempo">:</span>${segundos}`; }
    function playAlarmSound(loop = false) { if (alarmSound) { alarmSound.pause(); alarmSound.currentTime = 0; } alarmSound = new Audio('alarm.mp3'); alarmSound.loop = loop; alarmSound.play().catch(e => console.error("Error al reproducir sonido:", e)); }
    function stopAlarmSound() { if (alarmSound) { alarmSound.pause(); alarmSound.currentTime = 0; alarmSound = null; } }
    function showAlarmDialog(alarm) { activeAlarmId = alarm.id || 'timer_alarm'; $dialogMessage.textContent = alarm.message || '¡Es la hora!'; $alarmDialogOverlay.classList.add('visible'); playAlarmSound(true); }
    function hideAlarmDialog() { $alarmDialogOverlay.classList.remove('visible'); stopAlarmSound(); if (activeAlarmId === 'timer_alarm') resetTimer(); activeAlarmId = null; }
    function handleStopAlarm() { if (activeAlarmId && activeAlarmId !== 'timer_alarm') { removeAlarm(activeAlarmId); } hideAlarmDialog(); }
    function handleSnoozeAlarm() { if (activeAlarmId && activeAlarmId !== 'timer_alarm') { const alarmIndex = appState.settings.alarms.findIndex(a => a.id === activeAlarmId); if (alarmIndex !== -1) { const now = new Date(); now.setMinutes(now.getMinutes() + SNOOZE_MINUTES); const newHours = ('0' + now.getHours()).slice(-2); const newMinutes = ('0' + now.getMinutes()).slice(-2); appState.settings.alarms[alarmIndex].time = `${newHours}:${newMinutes}`; renderAlarmList(); saveState(); } } hideAlarmDialog(); }
    function checkAlarms(currentTime) { if (activeAlarmId) return; const currentHM = ('0' + currentTime.getHours()).slice(-2) + ":" + ('0' + currentTime.getMinutes()).slice(-2); const triggeredAlarm = appState.settings.alarms.find(alarm => alarm.time === currentHM); if (triggeredAlarm) { showAlarmDialog(triggeredAlarm); if (Notification.permission === 'granted') { new Notification(triggeredAlarm.message || '¡Alarma!', { body: `Son las ${triggeredAlarm.time}`, icon: 'icon.png' }); } } }
    async function getWeatherByCoords(lat, lon) { const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=es`; fetchAndDisplayWeather(url, `Coords: ${lat.toFixed(2)}, ${lon.toFixed(2)}`); }
    async function getWeatherByLocation(location) { if (!location) { return; } const url = `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${API_KEY}&units=metric&lang=es`; fetchAndDisplayWeather(url, location); }
    async function fetchAndDisplayWeather(url, locationString) { try { const response = await fetch(url); if (!response.ok) throw new Error(`Respuesta no válida: ${response.statusText}`); const data = await response.json(); displayWeather(data); appState.settings.weatherLocation = locationString; saveState(); } catch (error) { console.error('Error al obtener el clima:', error); $weatherCity.textContent = 'Ubicación no válida'; $weatherTemp.textContent = ''; $weatherIcon.src = ''; $weatherContainer.classList.add('visible'); } }
    function displayWeather(data) { $weatherIcon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`; $weatherTemp.textContent = `${Math.round(data.main.temp)}°C`; $weatherCity.textContent = data.name; $weatherContainer.classList.add('visible'); }
    function requestGeolocation() { if (navigator.geolocation) { navigator.geolocation.getCurrentPosition( (position) => { appState.settings.useGeolocation = true; getWeatherByCoords(position.coords.latitude, position.coords.longitude); }, (error) => { console.error("Error de geolocalización:", error); appState.settings.useGeolocation = false; saveState(); } ); } else { alert("La geolocalización no es soportada por este navegador."); } }
    function applyTheme(themeName) { const theme = themes[themeName]; if (theme) { appState.settings.textColor = theme.textColor; appState.settings.bgColor1 = theme.bgColor1; appState.settings.bgColor2 = theme.bgColor2; appState.settings.glowColor1 = theme.glowColor1; applySettingsToUI(); saveState(); } }
    function updateColorsInDOM() { document.documentElement.style.setProperty('--text-color', appState.settings.textColor); document.documentElement.style.setProperty('--bg-color-1', appState.settings.bgColor1); document.documentElement.style.setProperty('--bg-color-2', appState.settings.bgColor2); document.documentElement.style.setProperty('--glow-color-1', appState.settings.glowColor1); }
    function handleColorChange() { appState.settings.textColor = $textColorInput.value; appState.settings.bgColor1 = $bgColor1Input.value; appState.settings.bgColor2 = $bgColor2Input.value; appState.settings.glowColor1 = $glowColor1Input.value; updateColorsInDOM(); saveState(); }
    function applySettingsToUI() { $textColorInput.value = appState.settings.textColor; $bgColor1Input.value = appState.settings.bgColor1; $bgColor2Input.value = appState.settings.bgColor2; $glowColor1Input.value = appState.settings.glowColor1; updateColorsInDOM(); }
    function addAlarm() { const time = $alarmTimeInput.value; if (!time) return alert("Selecciona una hora"); const message = $alarmMessageInput.value || "¡Alarma!"; appState.settings.alarms.push({ time, message, id: Date.now(), active: true }); renderAlarmList(); saveState(); $alarmTimeInput.value = ''; $alarmMessageInput.value = ''; }
    function renderAlarmList() { $alarmListUl.innerHTML = ''; appState.settings.alarms.forEach(a => { if (a.active) { const li = document.createElement('li'); li.innerHTML = `<span>${a.time} - ${a.message}</span><button data-id="${a.id}">Eliminar</button>`; li.querySelector('button').addEventListener('click', () => removeAlarm(a.id)); $alarmListUl.appendChild(li); } }); }
    function removeAlarm(id) { appState.settings.alarms = appState.settings.alarms.filter(a => a.id !== id); renderAlarmList(); saveState(); }
    function addTimeZone() { const val = $timeZoneSelect.value; if (!val) return; if (appState.settings.additionalTimeZones.find(tz => tz.id === val)) return; const name = $timeZoneSelect.options[$timeZoneSelect.selectedIndex].text; appState.settings.additionalTimeZones.push({ id: val, name }); renderAdditionalClocksInSettings(); renderSidebarClocks(); saveState(); $timeZoneSelect.value = ""; }
    function renderAdditionalClocksInSettings() { $additionalClocksContainer.innerHTML = ''; appState.settings.additionalTimeZones.forEach(z => { const div = document.createElement('div'); div.className = 'additional-clock'; div.dataset.zoneId = z.id; div.innerHTML = `<h5>${z.name}</h5><p class="additional-time">...</p><button class="remove-tz-btn">Eliminar</button>`; div.querySelector('.remove-tz-btn').addEventListener('click', () => removeTimeZone(z.id)); $additionalClocksContainer.appendChild(div); }); updateAdditionalClocksInSettings(new Date()); }
    function removeTimeZone(id) { appState.settings.additionalTimeZones = appState.settings.additionalTimeZones.filter(z => z.id !== id); renderAdditionalClocksInSettings(); renderSidebarClocks(); saveState(); }
    function updateAdditionalClocksInSettings(baseTime) { document.querySelectorAll('#additionalClocksContainer .additional-clock').forEach(div => { const id = div.dataset.zoneId, el = div.querySelector('.additional-time'); try { const time = baseTime.toLocaleTimeString('es-ES', { timeZone: id, hour: '2-digit', minute: '2-digit', hour12: false }); el.innerHTML = `${time.replace(/:/g, '<span class="separador-tiempo">:</span>')}`; } catch (e) { el.textContent = "Error"; } }); }
    function saveState() { localStorage.setItem('relojAvanzadoState', JSON.stringify(appState)); }
    function loadState() {
        const savedState = localStorage.getItem('relojAvanzadoState');
        if (savedState) {
            const loadedState = JSON.parse(savedState);
            const defaultState = JSON.parse(JSON.stringify(appState));
            appState.settings = { ...defaultState.settings, ...loadedState.settings };
            if (loadedState.stopwatch) {
                appState.stopwatch = loadedState.stopwatch;
                if (appState.stopwatch.isRunning) {
                    const timePassedSinceSave = Date.now() - appState.stopwatch.startTime;
                    appState.stopwatch.elapsedTime += timePassedSinceSave;
                    startStopwatch();
                } else {
                    $stopwatchTime.textContent = formatStopwatchTime(appState.stopwatch.elapsedTime);
                    if(appState.stopwatch.elapsedTime > 0) $startStopwatchBtn.textContent = 'Continuar';
                }
                renderLaps();
            }
            if (loadedState.timer) {
                appState.timer = loadedState.timer;
                if (appState.timer.isRunning) {
                    const newRemaining = appState.timer.endTime - Date.now();
                    if (newRemaining > 0) { appState.timer.remainingTime = newRemaining; startTimer(); }
                    else { appState.timer.remainingTime = 0; resetTimer(); }
                } else if (appState.timer.remainingTime > 0) {
                    updateTimerDisplay(); $timerInputs.style.display = 'none'; $timerCountdown.style.display = 'block';
                    $startTimerBtn.disabled = false; $startTimerBtn.textContent = 'Continuar';
                    $stopTimerBtn.disabled = true; $resetTimerBtn.disabled = false;
                } else { resetTimer(); }
            }
        }
        applySettingsToUI(); renderAlarmList(); renderAdditionalClocksInSettings(); renderSidebarClocks();
        if (appState.settings.useGeolocation) { requestGeolocation(); }
        else if (appState.settings.weatherLocation) { getWeatherByLocation(appState.settings.weatherLocation); }
        if (!appState.timer.isRunning && appState.timer.remainingTime <= 0) resetTimer();
    }
    
    // --- ASIGNACIÓN DE EVENT LISTENERS ---
    $toggleControlsBtn.addEventListener('click', () => { $controlesContainer.classList.toggle('visible'); $body.classList.toggle('controls-active'); });
    $modeNavButtons.forEach(btn => btn.addEventListener('click', () => switchMode(btn.dataset.mode)));
    $startStopwatchBtn.addEventListener('click', () => { if (appState.stopwatch.isRunning) stopStopwatch(); else startStopwatch(); });
    $lapBtn.addEventListener('click', addLap);
    $resetStopwatchBtn.addEventListener('click', resetStopwatch);
    $startTimerBtn.addEventListener('click', startTimer);
    $stopTimerBtn.addEventListener('click', stopTimer);
    $resetTimerBtn.addEventListener('click', resetTimer);
    $snoozeBtn.addEventListener('click', handleSnoozeAlarm);
    $stopAlarmBtn.addEventListener('click', handleStopAlarm);
    $searchWeatherBtn.addEventListener('click', () => { appState.settings.useGeolocation = false; getWeatherByLocation($locationInput.value); });
    $locationInput.addEventListener('keyup', e => { if (e.key === 'Enter') { appState.settings.useGeolocation = false; getWeatherByLocation($locationInput.value); }});
    $geolocateBtn.addEventListener('click', requestGeolocation);
    $themeButtons.forEach(button => button.addEventListener('click', () => applyTheme(button.dataset.theme)));
    [$textColorInput, $bgColor1Input, $bgColor2Input, $glowColor1Input].forEach(i => i.addEventListener('input', handleColorChange));
    $setAlarmBtn.addEventListener('click', addAlarm);
    $addTimeZoneBtn.addEventListener('click', addTimeZone);

    // --- INICIALIZACIÓN ---
    loadState();
    setInterval(mainUpdateLoop, 1000);
    mainUpdateLoop();
});