// Espera a que todo el contenido del DOM esté cargado antes de ejecutar el script
document.addEventListener('DOMContentLoaded', () => {
    // --- SELECCIÓN DE ELEMENTOS DEL DOM ---
    const $tiempoPrincipal = document.querySelector('.reloj-principal .tiempo');
    const $fechaPrincipal = document.querySelector('.reloj-principal .fecha');
    const $alarmTimeInput = document.getElementById('alarmTime');
    const $alarmMessageInput = document.getElementById('alarmMessage');
    const $setAlarmBtn = document.getElementById('setAlarmBtn');
    const $alarmListUl = document.querySelector('#alarmList ul');
    const $textColorInput = document.getElementById('textColor');
    const $bgColor1Input = document.getElementById('bgColor1');
    const $bgColor2Input = document.getElementById('bgColor2');
    const $glowColor1Input = document.getElementById('glowColor1');
    const $glowColor2Input = document.getElementById('glowColor2');
    const $timeZoneSelect = document.getElementById('timeZoneSelect');
    const $addTimeZoneBtn = document.getElementById('addTimeZoneBtn');
    const $additionalClocksContainer = document.getElementById('additionalClocksContainer');

    // --- VARIABLES Y CONFIGURACIÓN INICIAL ---
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    let settings = {
        alarms: [],
        textColor: '#FFFFFF',
        bgColor1: 'blue',
        bgColor2: '#000000',
        glowColor1: 'rgb(230, 171, 10)',
        glowColor2: 'rgb(255, 255, 22)',
        additionalTimeZones: []
    };

    // --- LÓGICA DE NOTIFICACIONES ---
    // Función para solicitar permiso para mostrar notificaciones al usuario.
    function solicitarPermisoNotificaciones() {
        // Comprueba si el navegador soporta la API de Notificaciones.
        if ('Notification' in window) {
            console.log('El navegador soporta notificaciones.');
            // Solicita el permiso. Esto mostrará un popup al usuario.
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    console.log('Permiso para notificaciones concedido.');
                } else {
                    console.log('Permiso para notificaciones denegado.');
                }
            });
        } else {
            console.log('Este navegador no soporta notificaciones de escritorio.');
        }
    }
    
    // Llamamos a la función al cargar la página para pedir permiso lo antes posible.
    solicitarPermisoNotificaciones();

    // --- FUNCIONES PARA GUARDAR Y CARGAR CONFIGURACIÓN ---
    function saveSettings() {
        localStorage.setItem('relojAvanzadoSettings', JSON.stringify(settings));
    }

    function loadSettings() {
        const savedSettings = localStorage.getItem('relojAvanzadoSettings');
        if (savedSettings) {
            settings = JSON.parse(savedSettings);
            settings.alarms = settings.alarms || [];
            settings.additionalTimeZones = settings.additionalTimeZones || [];
        }
        applySettingsToUI();
        renderAlarmList();
        renderAdditionalClocks();
    }

    function applySettingsToUI() {
        $textColorInput.value = settings.textColor;
        $bgColor1Input.value = settings.bgColor1;
        $bgColor2Input.value = settings.bgColor2;
        $glowColor1Input.value = settings.glowColor1;
        $glowColor2Input.value = settings.glowColor2;
        updateColorsInDOM();
    }

    // --- LÓGICA DEL RELOJ PRINCIPAL ---
    function actualizarRelojPrincipal() {
        const ahora = new Date();
        let dia = ('0' + ahora.getDate()).slice(-2);
        let mesNum = ('0' + (ahora.getMonth() + 1)).slice(-2);
        let anio = ahora.getFullYear();
        let diaSem = diasSemana[ahora.getDay()];
        $fechaPrincipal.innerHTML = `${diaSem} ${dia}-${mesNum}-${anio}`;

        let horas = ('0' + ahora.getHours()).slice(-2);
        let minutos = ('0' + ahora.getMinutes()).slice(-2);
        let segundos = ('0' + ahora.getSeconds()).slice(-2);
        $tiempoPrincipal.innerHTML = `${horas}<span class="separador-tiempo">:</span>${minutos}<span class="separador-tiempo">:</span>${segundos}`;

        checkAlarms(ahora);
        updateAdditionalClocks(ahora);
    }

    // --- LÓGICA DE ALARMAS (MODIFICADA) ---
    function addAlarm() {
        const time = $alarmTimeInput.value;
        const message = $alarmMessageInput.value || "¡Alarma!";
        if (!time) {
            alert("Por favor, selecciona una hora para la alarma.");
            return;
        }
        const newAlarm = { time, message, id: Date.now(), active: true };
        settings.alarms.push(newAlarm);
        renderAlarmList();
        saveSettings();
        $alarmTimeInput.value = '';
        $alarmMessageInput.value = '';
    }

    function renderAlarmList() {
        $alarmListUl.innerHTML = '';
        settings.alarms.forEach(alarm => {
            if (!alarm.active) return;
            const li = document.createElement('li');
            li.innerHTML = `<span>${alarm.time} - ${alarm.message}</span><button data-id="${alarm.id}" title="Eliminar alarma">Eliminar</button>`;
            li.querySelector('button').addEventListener('click', () => removeAlarm(alarm.id));
            $alarmListUl.appendChild(li);
        });
    }

    function removeAlarm(id) {
        settings.alarms = settings.alarms.filter(alarm => alarm.id !== id);
        renderAlarmList();
        saveSettings();
    }

    function checkAlarms(currentTime) {
        const currentHourMinute = ('0' + currentTime.getHours()).slice(-2) + ":" + ('0' + currentTime.getMinutes()).slice(-2);
        settings.alarms.forEach(alarm => {
            if (alarm.active && alarm.time === currentHourMinute) {
                if (!alarm.triggeredThisMinute) {
                    
                    // --- LÓGICA DE NOTIFICACIÓN Y SONIDO ---
                    // Primero, intenta mostrar una notificación nativa si tenemos permiso.
                    if ('Notification' in window && Notification.permission === 'granted') {
                        // Crear la notificación
                        new Notification(alarm.message || '¡Alarma!', {
                            body: `Son las ${alarm.time}`, // Texto secundario de la notificación
                            icon: 'icon.png', // Opcional: un icono para la notificación (debe estar en la carpeta)
                            vibrate: [200, 100, 200, 100, 200] // Opcional: patrón de vibración para móviles
                        });
                    } else {
                        // Si no hay notificaciones, usa el alert() como fallback.
                        alert(`¡ALARMA!\n${alarm.time} - ${alarm.message}`);
                    }
                    
                    // En paralelo, intenta reproducir el sonido.
                    try {
                        const alarmSound = new Audio('alarm.mp3');
                        alarmSound.play().catch(error => {
                            console.error("Error al reproducir el sonido directamente:", error);
                        });
                    } catch (e) {
                        console.error("Error al crear el objeto Audio para la alarma:", e);
                    }
                    
                    alarm.triggeredThisMinute = true;
                }
            } else {
                alarm.triggeredThisMinute = false;
            }
        });
    }

    // --- LÓGICA DE PERSONALIZACIÓN DE COLORES ---
    function updateColorsInDOM() {
        document.documentElement.style.setProperty('--text-color', settings.textColor);
        document.documentElement.style.setProperty('--bg-color-1', settings.bgColor1);
        document.documentElement.style.setProperty('--bg-color-2', settings.bgColor2);
        document.documentElement.style.setProperty('--glow-color-1', settings.glowColor1);
        document.documentElement.style.setProperty('--glow-color-2', settings.glowColor2);
    }

    function handleColorChange() {
        settings.textColor = $textColorInput.value;
        settings.bgColor1 = $bgColor1Input.value;
        settings.bgColor2 = $bgColor2Input.value;
        settings.glowColor1 = $glowColor1Input.value;
        settings.glowColor2 = $glowColor2Input.value;
        updateColorsInDOM();
        saveSettings();
    }

    // --- LÓGICA DE ZONAS HORARIAS ADICIONALES ---
    function addTimeZone() {
        const selectedValue = $timeZoneSelect.value;
        if (!selectedValue) {
            alert("Por favor, selecciona una zona horaria.");
            return;
        }
        if (settings.additionalTimeZones.find(tz => tz.id === selectedValue)) {
            alert("Esa zona horaria ya ha sido añadida.");
            return;
        }
        const selectedOption = $timeZoneSelect.options[$timeZoneSelect.selectedIndex];
        const zoneName = selectedOption.text;
        settings.additionalTimeZones.push({ id: selectedValue, name: zoneName });
        renderAdditionalClocks();
        saveSettings();
        $timeZoneSelect.value = "";
    }

    function renderAdditionalClocks() {
        $additionalClocksContainer.innerHTML = '';
        settings.additionalTimeZones.forEach(zone => {
            const clockDiv = document.createElement('div');
            clockDiv.classList.add('additional-clock');
            clockDiv.dataset.zoneId = zone.id;
            clockDiv.innerHTML = `<h5>${zone.name}</h5><p class="additional-time">Cargando...</p><button class="remove-tz-btn" title="Eliminar este reloj">Eliminar</button>`;
            clockDiv.querySelector('.remove-tz-btn').addEventListener('click', () => removeTimeZone(zone.id));
            $additionalClocksContainer.appendChild(clockDiv);
        });
        updateAdditionalClocks(new Date());
    }

    function removeTimeZone(zoneIdToRemove) {
        settings.additionalTimeZones = settings.additionalTimeZones.filter(zone => zone.id !== zoneIdToRemove);
        renderAdditionalClocks();
        saveSettings();
    }

    function updateAdditionalClocks(baseTime) {
        document.querySelectorAll('#additionalClocksContainer .additional-clock').forEach(clockDiv => {
            const zoneId = clockDiv.dataset.zoneId;
            const timeElement = clockDiv.querySelector('.additional-time');
            try {
                const timeString = baseTime.toLocaleTimeString('es-ES', { timeZone: zoneId, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
                const dateString = baseTime.toLocaleDateString('es-ES', { timeZone: zoneId, day: '2-digit', month: '2-digit', year: 'numeric' });
                timeElement.innerHTML = `${dateString} - ${timeString.replace(/:/g, '<span class="separador-tiempo">:</span>')}`;
            } catch (error) {
                console.error(`Error al obtener la hora para ${zoneId}:`, error);
                timeElement.textContent = "Error de zona";
            }
        });
    }

    // --- ASIGNACIÓN DE EVENT LISTENERS ---
    $setAlarmBtn.addEventListener('click', addAlarm);
    [$textColorInput, $bgColor1Input, $bgColor2Input, $glowColor1Input, $glowColor2Input].forEach(input => {
        input.addEventListener('input', handleColorChange);
    });
    $addTimeZoneBtn.addEventListener('click', addTimeZone);

    // --- INICIALIZACIÓN DE LA APLICACIÓN ---
    loadSettings();
    actualizarRelojPrincipal();
    setInterval(actualizarRelojPrincipal, 1000);
});