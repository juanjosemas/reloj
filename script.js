// Espera a que todo el contenido del DOM esté cargado antes de ejecutar el script
document.addEventListener('DOMContentLoaded', () => {
    // --- SELECCIÓN DE ELEMENTOS DEL DOM ---
    // Elementos para el reloj principal
    const $tiempoPrincipal = document.querySelector('.reloj-principal .tiempo');
    const $fechaPrincipal = document.querySelector('.reloj-principal .fecha');
    
    // Elementos para los controles de alarma
    const $alarmTimeInput = document.getElementById('alarmTime');
    const $alarmMessageInput = document.getElementById('alarmMessage');
    const $setAlarmBtn = document.getElementById('setAlarmBtn');
    const $alarmListUl = document.querySelector('#alarmList ul');

    // Elementos para los controles de color
    const $textColorInput = document.getElementById('textColor');
    const $bgColor1Input = document.getElementById('bgColor1');
    const $bgColor2Input = document.getElementById('bgColor2');
    const $glowColor1Input = document.getElementById('glowColor1');
    const $glowColor2Input = document.getElementById('glowColor2');

    // Elementos para los controles de zonas horarias adicionales
    const $timeZoneSelect = document.getElementById('timeZoneSelect');
    const $addTimeZoneBtn = document.getElementById('addTimeZoneBtn');
    const $additionalClocksContainer = document.getElementById('additionalClocksContainer');

    // --- VARIABLES Y CONFIGURACIÓN INICIAL ---
    // Nombres de los días de la semana para formateo
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    // Objeto para almacenar la configuración del usuario.
    let settings = {
        alarms: [], // Array para almacenar las alarmas: { time: 'HH:MM', message: 'mensaje', id: timestamp, active: true }
        textColor: '#FFFFFF',
        bgColor1: 'blue',
        bgColor2: '#000000',
        glowColor1: 'rgb(230, 171, 10)',
        glowColor2: 'rgb(255, 255, 22)',
        additionalTimeZones: [] // Array para zonas horarias adicionales: [{ id: 'Asia/Tokyo', name: 'Tokio' }]
    };

    // --- FUNCIONES PARA GUARDAR Y CARGAR CONFIGURACIÓN (localStorage) ---
    function saveSettings() {
        // Guarda el objeto 'settings' en localStorage como una cadena JSON.
        localStorage.setItem('relojAvanzadoSettings', JSON.stringify(settings));
    }

    function loadSettings() {
        // Carga la configuración guardada desde localStorage.
        const savedSettings = localStorage.getItem('relojAvanzadoSettings');
        if (savedSettings) {
            settings = JSON.parse(savedSettings);
            // Asegurar que 'alarms' y 'additionalTimeZones' sean arrays.
            settings.alarms = settings.alarms || [];
            settings.additionalTimeZones = settings.additionalTimeZones || [];
        }
        // Aplica la configuración cargada (o por defecto) a la interfaz de usuario.
        applySettingsToUI();
        renderAlarmList(); // Muestra las alarmas guardadas.
        renderAdditionalClocks(); // Muestra los relojes adicionales guardados.
    }

    function applySettingsToUI() {
        // Aplica la configuración de colores a los inputs correspondientes.
        $textColorInput.value = settings.textColor;
        $bgColor1Input.value = settings.bgColor1;
        $bgColor2Input.value = settings.bgColor2;
        $glowColor1Input.value = settings.glowColor1;
        $glowColor2Input.value = settings.glowColor2;
        updateColorsInDOM(); // Actualiza los colores en el CSS.
    }

    // --- LÓGICA DEL RELOJ PRINCIPAL ---
    function actualizarRelojPrincipal() {
        const ahora = new Date(); // Obtiene la fecha y hora actual.
        
        // Formatear Fecha (formato fijo DD-MM-YYYY)
        let dia = ('0' + ahora.getDate()).slice(-2); 
        let mesNum = ('0' + (ahora.getMonth() + 1)).slice(-2); 
        let anio = ahora.getFullYear();
        let diaSem = diasSemana[ahora.getDay()]; 

        $fechaPrincipal.innerHTML = `${diaSem} ${dia}-${mesNum}-${anio}`;

        // Formatear Hora (formato fijo 24 horas)
        let horas = ('0' + ahora.getHours()).slice(-2); 
        let minutos = ('0' + ahora.getMinutes()).slice(-2); 
        let segundos = ('0' + ahora.getSeconds()).slice(-2); 
        
        $tiempoPrincipal.innerHTML = `${horas}<span class="separador-tiempo">:</span>${minutos}<span class="separador-tiempo">:</span>${segundos}`;

        checkAlarms(ahora);
        updateAdditionalClocks(ahora);
    }

    // --- LÓGICA DE ALARMAS ---
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
            li.innerHTML = `
                <span>${alarm.time} - ${alarm.message}</span>
                <button data-id="${alarm.id}" title="Eliminar alarma">Eliminar</button>
            `;
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
        // Formatea la hora y minuto actual a "HH:MM" para comparar con las alarmas.
        const currentHourMinute = ('0' + currentTime.getHours()).slice(-2) + ":" + ('0' + currentTime.getMinutes()).slice(-2);
        
        settings.alarms.forEach(alarm => {
            // Si la alarma está activa y coincide con la hora actual:
            if (alarm.active && alarm.time === currentHourMinute) {
                // Evita múltiples alertas y sonidos para la misma alarma en el mismo minuto.
                if (!alarm.triggeredThisMinute) { 
                    
                    // --- INICIO: REPRODUCIR SONIDO DE ALARMA ---
                    try {
                        // Crea una instancia del objeto Audio con tu archivo de sonido.
                        // Asegúrate de que 'alarm.mp3' (o el nombre de tu archivo) esté en la misma carpeta.
                        const alarmSound = new Audio('alarm.mp3'); 
                        
                        // Intenta reproducir el sonido.
                        alarmSound.play()
                            .catch(error => {
                                console.error("Error al reproducir el sonido de la alarma:", error);
                                // Como fallback, al menos mostramos la alerta.
                                alert(`¡ALARMA (audio bloqueado)!\n${alarm.time} - ${alarm.message}`);
                            });
                    } catch (e) {
                        console.error("Error al crear el objeto Audio:", e);
                         // Fallback si hay error creando el objeto Audio
                        alert(`¡ALARMA (error de audio)!\n${alarm.time} - ${alarm.message}`);
                    }
                    // --- FIN: REPRODUCIR SONIDO DE ALARMA ---

                    // Mantenemos la alerta visual también (puedes quitarla si solo quieres sonido)
                    alert(`¡ALARMA!\n${alarm.time} - ${alarm.message}`);
                    
                    alarm.triggeredThisMinute = true; 
                    // Consideraciones futuras para desactivar o eliminar la alarma después de sonar:
                    // alarm.active = false; 
                    // removeAlarm(alarm.id);
                    // renderAlarmList(); // Si la eliminas o desactivas, actualiza la UI.
                    // saveSettings(); // Y guarda los cambios.
                }
            } else {
                // Resetea el flag 'triggeredThisMinute' si ya no es el minuto de la alarma.
                alarm.triggeredThisMinute = false;
            }
        });
    }


    // --- LÓGICA DE PERSONALIZACIÓN DE COLORES ---
    function updateColorsInDOM() {
        // Actualiza las variables CSS globales (--variable) con los valores de 'settings'.
        document.documentElement.style.setProperty('--text-color', settings.textColor);
        document.documentElement.style.setProperty('--bg-color-1', settings.bgColor1);
        document.documentElement.style.setProperty('--bg-color-2', settings.bgColor2);
        document.documentElement.style.setProperty('--glow-color-1', settings.glowColor1);
        document.documentElement.style.setProperty('--glow-color-2', settings.glowColor2);
    }

    function handleColorChange() {
        // Cuando un input de color cambia, actualiza el objeto 'settings'.
        settings.textColor = $textColorInput.value;
        settings.bgColor1 = $bgColor1Input.value;
        settings.bgColor2 = $bgColor2Input.value;
        settings.glowColor1 = $glowColor1Input.value;
        settings.glowColor2 = $glowColor2Input.value;
        updateColorsInDOM(); // Aplica los nuevos colores al DOM.
        saveSettings(); // Guarda los cambios.
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
            clockDiv.innerHTML = `
                <h5>${zone.name}</h5>
                <p class="additional-time">Cargando...</p>
                <button class="remove-tz-btn" title="Eliminar este reloj">Eliminar</button>
            `;
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
                const timeString = baseTime.toLocaleTimeString('es-ES', { 
                    timeZone: zoneId,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false 
                });
                const dateString = baseTime.toLocaleDateString('es-ES', {
                    timeZone: zoneId,
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
                timeElement.innerHTML = `${dateString} - ${timeString.replace(/:/g, '<span class="separador-tiempo">:</span>')}`;

            } catch (error) {
                console.error(`Error al obtener la hora para ${zoneId}:`, error);
                timeElement.textContent = "Error de zona"; 
            }
        });
    }

    // --- ASIGNACIÓN DE EVENT LISTENERS A LOS CONTROLES ---
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