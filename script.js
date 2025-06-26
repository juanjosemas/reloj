document.addEventListener('DOMContentLoaded', () => {
    // --- CONSTANTES Y VARIABLES GLOBALES ---
    const API_KEY = '04c7b803095cd48d76c3f1633056bd05';
    const SNOOZE_MINUTES = 5;
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const themes = { 'neon-classic': { textColor: '#FFFFFF', bgColor1: '#0000FF', bgColor2: '#000000', glowColor1: '#E6AB0A' },'ocean': { textColor: '#E0FFFF', bgColor1: '#00008B', bgColor2: '#008B8B', glowColor1: '#00FFFF' },'sunset': { textColor: '#FFFFE0', bgColor1: '#FF4500', bgColor2: '#8B0000', glowColor1: '#FFD700' },'matrix': { textColor: '#39FF14', bgColor1: '#000000', bgColor2: '#080808', glowColor1: '#008F11' } };
    let settings = { alarms: [], textColor: '#FFFFFF', bgColor1: '#0000FF', bgColor2: '#000000', glowColor1: '#E6AB0A', additionalTimeZones: [], weatherLocation: null, useGeolocation: true };
    let alarmSound = null; let activeAlarmId = null;

    // --- SELECCIÓN DE ELEMENTOS DEL DOM ---
    const $body = document.body;
    const $modeNavButtons = document.querySelectorAll('.mode-btn');
    const $fechaPrincipal = document.querySelector('.fecha');
    const $tiempoPrincipal = document.querySelector('.tiempo');
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
    
    // --- LÓGICA DE NAVEGACIÓN ENTRE MODOS ---
    function switchMode(mode) {
        $body.dataset.mode = mode;
        $modeNavButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.mode === mode));
        if (mode !== 'stopwatch' && stopwatchState.isRunning) stopStopwatch();
        if (mode !== 'timer' && timerState.isRunning) stopTimer();
    }
    
    // --- LÓGICA DEL CRONÓMETRO ---
    let stopwatchState = { isRunning: false, startTime: 0, elapsedTime: 0, laps: [], animationFrameId: null };
    function formatStopwatchTime(ms) {
        const d = new Date(ms);
        return `${String(d.getUTCMinutes()).padStart(2, '0')}:${String(d.getUTCSeconds()).padStart(2, '0')}.${String(d.getUTCMilliseconds()).padStart(3, '0')}`;
    }
    function updateStopwatch() {
        $stopwatchTime.textContent = formatStopwatchTime(Date.now() - stopwatchState.startTime + stopwatchState.elapsedTime);
        stopwatchState.animationFrameId = requestAnimationFrame(updateStopwatch);
    }
    function startStopwatch() {
        if (stopwatchState.isRunning) return;
        stopwatchState.isRunning = true;
        stopwatchState.startTime = Date.now();
        $startStopwatchBtn.textContent = 'Parar';
        $lapBtn.disabled = false; $resetStopwatchBtn.disabled = false;
        updateStopwatch();
    }
    function stopStopwatch() {
        if (!stopwatchState.isRunning) return;
        stopwatchState.isRunning = false;
        stopwatchState.elapsedTime += Date.now() - stopwatchState.startTime;
        cancelAnimationFrame(stopwatchState.animationFrameId);
        $startStopwatchBtn.textContent = 'Continuar';
    }
    function resetStopwatch() {
        if (stopwatchState.isRunning) stopStopwatch();
        stopwatchState.elapsedTime = 0;
        stopwatchState.laps = [];
        $stopwatchTime.textContent = '00:00:00.000';
        $lapsList.innerHTML = '';
        $startStopwatchBtn.textContent = 'Iniciar';
        $lapBtn.disabled = true; $resetStopwatchBtn.disabled = true;
    }
    function addLap() {
        if (!stopwatchState.isRunning) return;
        const lapTime = formatStopwatchTime(Date.now() - stopwatchState.startTime + stopwatchState.elapsedTime);
        stopwatchState.laps.push(lapTime);
        const li = document.createElement('li');
        li.innerHTML = `<span class="lap-number">Vuelta ${stopwatchState.laps.length}</span><span>${lapTime}</span>`;
        $lapsList.prepend(li);
    }

    // --- LÓGICA DEL TEMPORIZADOR (CORREGIDA) ---
    let timerState = { isRunning: false, remainingTime: 0, intervalId: null };
    function updateTimerDisplay() {
        const minutes = String(Math.floor(timerState.remainingTime / 60000)).padStart(2, '0');
        const seconds = String(Math.floor((timerState.remainingTime % 60000) / 1000)).padStart(2, '0');
        $timerCountdown.textContent = `${minutes}:${seconds}`;
    }
    function startTimer() {
        if (timerState.isRunning) return;
        
        // Si no está corriendo y no hay tiempo restante, coge el de los inputs
        if (timerState.remainingTime <= 0) {
            const minutes = parseInt($timerMinutesInput.value) || 0;
            const seconds = parseInt($timerSecondsInput.value) || 0;
            timerState.remainingTime = (minutes * 60 + seconds) * 1000;
        }

        if (timerState.remainingTime <= 0) return;
        
        timerState.isRunning = true;
        const endTime = Date.now() + timerState.remainingTime;

        $timerInputs.style.display = 'none'; $timerCountdown.style.display = 'block';
        $startTimerBtn.textContent = 'Iniciar'; $startTimerBtn.disabled = true;
        $stopTimerBtn.disabled = false; $resetTimerBtn.disabled = false;
        
        timerState.intervalId = setInterval(() => {
            const newRemaining = endTime - Date.now();
            if (newRemaining <= 0) {
                clearInterval(timerState.intervalId);
                timerState.remainingTime = 0;
                updateTimerDisplay();
                showAlarmDialog({ message: '¡Tiempo finalizado!' });
                $stopTimerBtn.disabled = true;
            } else {
                timerState.remainingTime = newRemaining;
                updateTimerDisplay();
            }
        }, 100);
    }
    function stopTimer() {
        if (!timerState.isRunning) return;
        timerState.isRunning = false;
        clearInterval(timerState.intervalId);
        $startTimerBtn.textContent = 'Continuar'; $startTimerBtn.disabled = false;
        $stopTimerBtn.disabled = true;
    }
    function resetTimer() {
        if (timerState.isRunning) stopTimer();
        timerState.remainingTime = 0;
        $timerInputs.style.display = 'flex'; $timerCountdown.style.display = 'none';
        $startTimerBtn.textContent = 'Iniciar'; $startTimerBtn.disabled = false;
        $stopTimerBtn.disabled = true; $resetTimerBtn.disabled = true;
        // Restaura la vista del countdown al valor de los inputs
        const minutes = String(parseInt($timerMinutesInput.value) || 0).padStart(2, '0');
        const seconds = String(parseInt($timerSecondsInput.value) || 0).padStart(2, '0');
        $timerCountdown.textContent = `${minutes}:${seconds}`;
    }
    
    // --- LÓGICA DE ALARMAS MEJORADA (sin cambios) ---
    function playAlarmSound(loop = false) { if (alarmSound) { alarmSound.pause(); alarmSound.currentTime = 0; } alarmSound = new Audio('alarm.mp3'); alarmSound.loop = loop; alarmSound.play().catch(e => console.error("Error al reproducir sonido:", e)); }
    function stopAlarmSound() { if (alarmSound) { alarmSound.pause(); alarmSound.currentTime = 0; alarmSound = null; } }
    function showAlarmDialog(alarm) { activeAlarmId = alarm.id || 'timer_alarm'; $dialogMessage.textContent = alarm.message || '¡Es la hora!'; $alarmDialogOverlay.classList.add('visible'); playAlarmSound(true); }
    function hideAlarmDialog() { $alarmDialogOverlay.classList.remove('visible'); stopAlarmSound(); if (activeAlarmId === 'timer_alarm') resetTimer(); activeAlarmId = null; }
    function handleStopAlarm() { if (activeAlarmId && activeAlarmId !== 'timer_alarm') { removeAlarm(activeAlarmId); } hideAlarmDialog(); }
    function handleSnoozeAlarm() { if (activeAlarmId && activeAlarmId !== 'timer_alarm') { const alarmIndex = settings.alarms.findIndex(a => a.id === activeAlarmId); if (alarmIndex !== -1) { const now = new Date(); now.setMinutes(now.getMinutes() + SNOOZE_MINUTES); const newHours = ('0' + now.getHours()).slice(-2); const newMinutes = ('0' + now.getMinutes()).slice(-2); settings.alarms[alarmIndex].time = `${newHours}:${newMinutes}`; renderAlarmList(); saveSettings(); } } hideAlarmDialog(); }
    function checkAlarms(currentTime) { if (activeAlarmId) return; const currentHM = ('0' + currentTime.getHours()).slice(-2) + ":" + ('0' + currentTime.getMinutes()).slice(-2); const triggeredAlarm = settings.alarms.find(alarm => alarm.time === currentHM); if (triggeredAlarm) { showAlarmDialog(triggeredAlarm); if (Notification.permission === 'granted') { new Notification(triggeredAlarm.message || '¡Alarma!', { body: `Son las ${triggeredAlarm.time}`, icon: 'icon.png' }); } } }
    
    // --- RESTO DE FUNCIONES (sin cambios lógicos importantes) ---
    $toggleControlsBtn.addEventListener('click', () => { $controlesContainer.classList.toggle('visible'); $body.classList.toggle('controls-active'); });
    async function getWeatherByCoords(lat, lon) { const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=es`; fetchAndDisplayWeather(url, `Coords: ${lat.toFixed(2)}, ${lon.toFixed(2)}`); }
    async function getWeatherByLocation(location) { if (!location) { return; } const url = `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${API_KEY}&units=metric&lang=es`; fetchAndDisplayWeather(url, location); }
    async function fetchAndDisplayWeather(url, locationString) { try { const response = await fetch(url); if (!response.ok) throw new Error(`Respuesta no válida: ${response.statusText}`); const data = await response.json(); displayWeather(data); settings.weatherLocation = locationString; saveSettings(); } catch (error) { console.error('Error al obtener el clima:', error); $weatherCity.textContent = 'Ubicación no válida'; $weatherTemp.textContent = ''; $weatherIcon.src = ''; $weatherContainer.classList.add('visible'); } }
    function displayWeather(data) { $weatherIcon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`; $weatherTemp.textContent = `${Math.round(data.main.temp)}°C`; $weatherCity.textContent = data.name; $weatherContainer.classList.add('visible'); }
    function requestGeolocation() { if (navigator.geolocation) { navigator.geolocation.getCurrentPosition( (position) => { settings.useGeolocation = true; getWeatherByCoords(position.coords.latitude, position.coords.longitude); }, (error) => { console.error("Error de geolocalización:", error); settings.useGeolocation = false; saveSettings(); } ); } else { alert("La geolocalización no es soportada por este navegador."); } }
    function applyTheme(themeName) { const theme = themes[themeName]; if (theme) { settings.textColor = theme.textColor; settings.bgColor1 = theme.bgColor1; settings.bgColor2 = theme.bgColor2; settings.glowColor1 = theme.glowColor1; applySettingsToUI(); saveSettings(); } }
    function updateColorsInDOM() { document.documentElement.style.setProperty('--text-color', settings.textColor); document.documentElement.style.setProperty('--bg-color-1', settings.bgColor1); document.documentElement.style.setProperty('--bg-color-2', settings.bgColor2); document.documentElement.style.setProperty('--glow-color-1', settings.glowColor1); }
    function handleColorChange() { settings.textColor = $textColorInput.value; settings.bgColor1 = $bgColor1Input.value; settings.bgColor2 = $bgColor2Input.value; settings.glowColor1 = $glowColor1Input.value; updateColorsInDOM(); saveSettings(); }
    function applySettingsToUI() { $textColorInput.value = settings.textColor; $bgColor1Input.value = settings.bgColor1; $bgColor2Input.value = settings.bgColor2; $glowColor1Input.value = settings.glowColor1; updateColorsInDOM(); }
    function saveSettings() { localStorage.setItem('relojAvanzadoSettings', JSON.stringify(settings)); }
    function loadSettings() { const savedSettings = localStorage.getItem('relojAvanzadoSettings'); if (savedSettings) { const loaded = JSON.parse(savedSettings); settings = { ...settings, ...loaded }; } applySettingsToUI(); renderAlarmList(); renderAdditionalClocks(); if (settings.useGeolocation) { requestGeolocation(); } else if (settings.weatherLocation) { getWeatherByLocation(settings.weatherLocation); } resetTimer(); }
    function actualizarRelojPrincipal() { const ahora = new Date(); const dia = ('0' + ahora.getDate()).slice(-2); const mesNum = ('0' + (ahora.getMonth() + 1)).slice(-2); const anio = ahora.getFullYear(); const diaSem = diasSemana[ahora.getDay()]; $fechaPrincipal.innerHTML = `${diaSem} ${dia}-${mesNum}-${anio}`; const horas = ('0' + ahora.getHours()).slice(-2); const minutos = ('0' + ahora.getMinutes()).slice(-2); const segundos = ('0' + ahora.getSeconds()).slice(-2); $tiempoPrincipal.innerHTML = `${horas}<span class="separador-tiempo">:</span>${minutos}<span class="separador-tiempo">:</span>${segundos}`; checkAlarms(ahora); updateAdditionalClocks(ahora); }
    function addAlarm() { const time = $alarmTimeInput.value; if (!time) return alert("Selecciona una hora"); const message = $alarmMessageInput.value || "¡Alarma!"; settings.alarms.push({ time, message, id: Date.now(), active: true }); renderAlarmList(); saveSettings(); $alarmTimeInput.value = ''; $alarmMessageInput.value = ''; }
    function renderAlarmList() { $alarmListUl.innerHTML = ''; settings.alarms.forEach(a => { if (a.active) { const li = document.createElement('li'); li.innerHTML = `<span>${a.time} - ${a.message}</span><button data-id="${a.id}">Eliminar</button>`; li.querySelector('button').addEventListener('click', () => removeAlarm(a.id)); $alarmListUl.appendChild(li); } }); }
    function removeAlarm(id) { settings.alarms = settings.alarms.filter(a => a.id !== id); renderAlarmList(); saveSettings(); }
    function addTimeZone() { const val = $timeZoneSelect.value; if (!val) return; if (settings.additionalTimeZones.find(tz => tz.id === val)) return; const name = $timeZoneSelect.options[$timeZoneSelect.selectedIndex].text; settings.additionalTimeZones.push({ id: val, name }); renderAdditionalClocks(); saveSettings(); $timeZoneSelect.value = ""; }
    function renderAdditionalClocks() { $additionalClocksContainer.innerHTML = ''; settings.additionalTimeZones.forEach(z => { const div = document.createElement('div'); div.className = 'additional-clock'; div.dataset.zoneId = z.id; div.innerHTML = `<h5>${z.name}</h5><p class="additional-time">...</p><button class="remove-tz-btn">Eliminar</button>`; div.querySelector('button').addEventListener('click', () => removeTimeZone(z.id)); $additionalClocksContainer.appendChild(div); }); updateAdditionalClocks(new Date()); }
    function removeTimeZone(id) { settings.additionalTimeZones = settings.additionalTimeZones.filter(z => z.id !== id); renderAdditionalClocks(); saveSettings(); }
    function updateAdditionalClocks(baseTime) { document.querySelectorAll('.additional-clock').forEach(div => { const id = div.dataset.zoneId, el = div.querySelector('.additional-time'); try { const time = baseTime.toLocaleTimeString('es-ES', { timeZone: id, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }); const date = baseTime.toLocaleDateString('es-ES', { timeZone: id, day: '2-digit', month: '2-digit', year: 'numeric' }); el.innerHTML = `${date} - ${time.replace(/:/g, '<span class="separador-tiempo">:</span>')}`; } catch (e) { el.textContent = "Error"; } }); }

    // --- ASIGNACIÓN DE EVENT LISTENERS ---
    $modeNavButtons.forEach(btn => btn.addEventListener('click', () => switchMode(btn.dataset.mode)));
    $startStopwatchBtn.addEventListener('click', () => { if (stopwatchState.isRunning) stopStopwatch(); else startStopwatch(); });
    $lapBtn.addEventListener('click', addLap);
    $resetStopwatchBtn.addEventListener('click', resetStopwatch);
    $startTimerBtn.addEventListener('click', startTimer);
    $stopTimerBtn.addEventListener('click', stopTimer);
    $resetTimerBtn.addEventListener('click', resetTimer);
    $snoozeBtn.addEventListener('click', handleSnoozeAlarm);
    $stopAlarmBtn.addEventListener('click', handleStopAlarm);
    $searchWeatherBtn.addEventListener('click', () => getWeatherByLocation($locationInput.value));
    $locationInput.addEventListener('keyup', e => { if (e.key === 'Enter') getWeatherByLocation($locationInput.value); });
    $geolocateBtn.addEventListener('click', requestGeolocation);
    $themeButtons.forEach(button => button.addEventListener('click', () => applyTheme(button.dataset.theme)));
    [$textColorInput, $bgColor1Input, $bgColor2Input, $glowColor1Input].forEach(i => i.addEventListener('input', handleColorChange));
    $setAlarmBtn.addEventListener('click', addAlarm);
    $addTimeZoneBtn.addEventListener('click', addTimeZone);

    // --- INICIALIZACIÓN ---
    loadSettings();
    actualizarRelojPrincipal();
    setInterval(actualizarRelojPrincipal, 1000);
});