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
    // No necesitamos mesesAnio si el formato de fecha es fijo DD-MM-YYYY

    // Objeto para almacenar la configuración del usuario.
    // Los formatos de fecha y hora ahora son fijos y no necesitan guardarse aquí.
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
            // Asegurar que 'alarms' y 'additionalTimeZones' sean arrays, incluso si no estaban en la versión guardada.
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

        // La sección de formato de fecha/hora ha sido eliminada, no hay UI que actualizar aquí.
    }

    // --- LÓGICA DEL RELOJ PRINCIPAL ---
    function actualizarRelojPrincipal() {
        const ahora = new Date(); // Obtiene la fecha y hora actual.
        
        // Formatear Fecha (formato fijo DD-MM-YYYY)
        let dia = ('0' + ahora.getDate()).slice(-2); // Asegura dos dígitos para el día.
        let mesNum = ('0' + (ahora.getMonth() + 1)).slice(-2); // getMonth es 0-indexado, suma 1 y asegura dos dígitos.
        let anio = ahora.getFullYear();
        let diaSem = diasSemana[ahora.getDay()]; // Nombre del día de la semana.

        // Muestra la fecha en el formato "DIASEMANA DD-MM-YYYY".
        $fechaPrincipal.innerHTML = `${diaSem} ${dia}-${mesNum}-${anio}`;

        // Formatear Hora (formato fijo 24 horas)
        let horas = ('0' + ahora.getHours()).slice(-2); // Asegura dos dígitos.
        let minutos = ('0' + ahora.getMinutes()).slice(-2); // Asegura dos dígitos.
        let segundos = ('0' + ahora.getSeconds()).slice(-2); // Asegura dos dígitos.
        
        // Muestra la hora con separadores que pueden parpadear.
        $tiempoPrincipal.innerHTML = `${horas}<span class="separador-tiempo">:</span>${minutos}<span class="separador-tiempo">:</span>${segundos}`;

        // Comprueba si alguna alarma debe sonar y actualiza los relojes adicionales.
        checkAlarms(ahora);
        updateAdditionalClocks(ahora);
    }

    // --- LÓGICA DE ALARMAS ---
    function addAlarm() {
        const time = $alarmTimeInput.value; // Obtiene la hora de la alarma del input.
        const message = $alarmMessageInput.value || "¡Alarma!"; // Mensaje, o uno por defecto.
        if (!time) {
            alert("Por favor, selecciona una hora para la alarma.");
            return;
        }
        const newAlarm = { time, message, id: Date.now(), active: true }; // Crea objeto de alarma.
        settings.alarms.push(newAlarm); // Añade al array de alarmas.
        renderAlarmList(); // Actualiza la lista visible de alarmas.
        saveSettings(); // Guarda los cambios.
        $alarmTimeInput.value = ''; // Limpia el input de hora.
        $alarmMessageInput.value = ''; // Limpia el input de mensaje.
    }

    function renderAlarmList() {
        // Limpia la lista actual de alarmas en el DOM.
        $alarmListUl.innerHTML = '';
        // Itera sobre las alarmas y crea un elemento <li> para cada una.
        settings.alarms.forEach(alarm => {
            if (!alarm.active) return; // Opcional: No mostrar alarmas ya sonadas/desactivadas.
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${alarm.time} - ${alarm.message}</span>
                <button data-id="${alarm.id}" title="Eliminar alarma">Eliminar</button>
            `;
            // Añade event listener al botón de eliminar de esta alarma.
            li.querySelector('button').addEventListener('click', () => removeAlarm(alarm.id));
            $alarmListUl.appendChild(li);
        });
    }

    function removeAlarm(id) {
        // Filtra el array de alarmas para quitar la que coincide con el ID.
        settings.alarms = settings.alarms.filter(alarm => alarm.id !== id);
        renderAlarmList(); // Actualiza la lista visible.
        saveSettings(); // Guarda los cambios.
    }

    function checkAlarms(currentTime) {
        // Formatea la hora y minuto actual a "HH:MM" para comparar con las alarmas.
        const currentHourMinute = ('0' + currentTime.getHours()).slice(-2) + ":" + ('0' + currentTime.getMinutes()).slice(-2);
        
        settings.alarms.forEach(alarm => {
            // Si la alarma está activa y coincide con la hora actual:
            if (alarm.active && alarm.time === currentHourMinute) {
                // Evita múltiples alertas para la misma alarma en el mismo minuto.
                if (!alarm.triggeredThisMinute) { 
                    alert(`¡ALARMA!\n${alarm.time} - ${alarm.message}`);
                    alarm.triggeredThisMinute = true; 
                    // Consideraciones futuras:
                    // alarm.active = false; // Para que no suene más.
                    // removeAlarm(alarm.id); // Para eliminarla después de sonar.
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
        const selectedValue = $timeZoneSelect.value; // ID de la zona horaria (ej: "Asia/Tokyo").
        if (!selectedValue) {
            alert("Por favor, selecciona una zona horaria.");
            return;
        }
        // Evita añadir la misma zona horaria múltiples veces.
        if (settings.additionalTimeZones.find(tz => tz.id === selectedValue)) {
            alert("Esa zona horaria ya ha sido añadida.");
            return;
        }
        
        const selectedOption = $timeZoneSelect.options[$timeZoneSelect.selectedIndex];
        const zoneName = selectedOption.text; // Nombre legible de la zona (ej: "Tokio").

        settings.additionalTimeZones.push({ id: selectedValue, name: zoneName });
        renderAdditionalClocks(); // Muestra el nuevo reloj adicional.
        saveSettings(); // Guarda los cambios.
        $timeZoneSelect.value = ""; // Resetea el selector de zona horaria.
    }
    
    function renderAdditionalClocks() {
        // Limpia el contenedor de relojes adicionales antes de volver a dibujarlos.
        $additionalClocksContainer.innerHTML = ''; 
        settings.additionalTimeZones.forEach(zone => {
            const clockDiv = document.createElement('div');
            clockDiv.classList.add('additional-clock');
            clockDiv.dataset.zoneId = zone.id; // Almacena el ID de la zona para referencia.
            clockDiv.innerHTML = `
                <h5>${zone.name}</h5>
                <p class="additional-time">Cargando...</p>
                <button class="remove-tz-btn" title="Eliminar este reloj">Eliminar</button>
            `;
            // Añade event listener al botón de eliminar de este reloj adicional.
            clockDiv.querySelector('.remove-tz-btn').addEventListener('click', () => removeTimeZone(zone.id));
            $additionalClocksContainer.appendChild(clockDiv);
        });
        updateAdditionalClocks(new Date()); // Actualiza la hora de los relojes adicionales inmediatamente.
    }

    function removeTimeZone(zoneIdToRemove) {
        // Filtra el array para quitar la zona horaria especificada.
        settings.additionalTimeZones = settings.additionalTimeZones.filter(zone => zone.id !== zoneIdToRemove);
        renderAdditionalClocks(); // Vuelve a dibujar los relojes.
        saveSettings(); // Guarda los cambios.
    }

    function updateAdditionalClocks(baseTime) {
        // Itera sobre cada reloj adicional en el DOM.
        document.querySelectorAll('#additionalClocksContainer .additional-clock').forEach(clockDiv => {
            const zoneId = clockDiv.dataset.zoneId;
            const timeElement = clockDiv.querySelector('.additional-time');
            try {
                // Formatea la hora para la zona horaria específica.
                // El formato de hora (12h/24h) para relojes adicionales ahora es siempre 24h con segundos.
                const timeString = baseTime.toLocaleTimeString('es-ES', { 
                    timeZone: zoneId,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false // Forzar 24h para relojes adicionales
                });
                // Formato de fecha para relojes adicionales (DD/MM/YYYY).
                const dateString = baseTime.toLocaleDateString('es-ES', {
                    timeZone: zoneId,
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
                // Muestra fecha y hora, añadiendo spans para el parpadeo de los dos puntos.
                timeElement.innerHTML = `${dateString} - ${timeString.replace(/:/g, '<span class="separador-tiempo">:</span>')}`;

            } catch (error) {
                console.error(`Error al obtener la hora para ${zoneId}:`, error);
                timeElement.textContent = "Error de zona"; // Mensaje de error si la zona no es válida.
            }
        });
    }

    // --- ASIGNACIÓN DE EVENT LISTENERS A LOS CONTROLES ---
    $setAlarmBtn.addEventListener('click', addAlarm); // Botón para añadir alarma.
    // Inputs de color: usan 'input' para actualizar en tiempo real mientras se selecciona el color.
    [$textColorInput, $bgColor1Input, $bgColor2Input, $glowColor1Input, $glowColor2Input].forEach(input => {
        input.addEventListener('input', handleColorChange); 
    });
    // La sección de formato de fecha/hora ha sido eliminada, no se necesitan listeners aquí.
    $addTimeZoneBtn.addEventListener('click', addTimeZone); // Botón para añadir zona horaria.

    // --- INICIALIZACIÓN DE LA APLICACIÓN ---
    loadSettings(); // Carga cualquier configuración guardada previamente.
    actualizarRelojPrincipal(); // Ejecuta la función del reloj una vez para mostrar la hora inmediatamente al cargar.
    setInterval(actualizarRelojPrincipal, 1000); // Establece un intervalo para actualizar el reloj cada segundo.
});