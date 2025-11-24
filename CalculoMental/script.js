// ===== CONFIGURACIÓN DE SERVIDOR =====
// Detecta automáticamente si es local o en línea
const SERVER_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3001'
    : 'https://juegos-api.onrender.com'; // O el servidor que despliegues

// Datos del juego
const gameData = {
    operation: '',
    options: [],
    currentStep: 0,
    score: 0,
    displayTime: 500
};

// Elementos del DOM
const fileInput = document.getElementById('fileInput');
const validateBtn = document.getElementById('validateBtn');
const validationResult = document.getElementById('validationResult');
const gameOptions = document.getElementById('game-options');
const displayTime = document.getElementById('displayTime');
const startGameBtn = document.getElementById('startGameBtn');
const generatorScreen = document.getElementById('generator-screen');
const gameScreen = document.getElementById('game-screen');
const operationDisplay = document.getElementById('operation-display');
const optionsContainer = document.getElementById('options-container');
const validateContainer = document.getElementById('validate');
const scoreDisplay = document.getElementById('score-display');
const backBtn = document.getElementById('back-btn');
const levelSelect = document.getElementById('level-select');
const availableExercises = document.getElementById('available-exercises');
const exerciseCountInput = document.getElementById('exercise-count');

let arStream = null; // Ya no se usa la cámara, mantenido por compatibilidad
let exerciseBank = [];

// Símbolos matemáticos para elementos decorativos
const MATH_SYMBOLS = ['×', '+', '÷', '-', '=', '1', '2', '3'];

function initializeGame() {
    return fetch('ejercicios.json')
        .then(res => {
            if (!res.ok) {
                throw new Error(`Error al cargar ejercicios: ${res.status}`);
            }
            return res.json();
        })
        .then(json => {
            if (!Array.isArray(json) || json.length === 0) {
                throw new Error('El archivo de ejercicios está vacío o no es válido');
            }

            exerciseBank = json;
            
            // Llena el select de niveles dinámicamente
            const niveles = [...new Set(exerciseBank.map(ej => ej.nivel))];
            if (niveles.length === 0) {
                throw new Error('No se encontraron niveles en los ejercicios');
            }

            levelSelect.innerHTML = '';
            niveles.forEach(nivel => {
                const opt = document.createElement('option');
                opt.value = nivel;
                opt.textContent = nivel.charAt(0).toUpperCase() + nivel.slice(1);
                levelSelect.appendChild(opt);
            });

            // Habilita el botón de inicio
            startGameBtn.disabled = false;
            
            loadExerciseBank(); // Filtra ejercicios del primer nivel por defecto
        })
        .catch(error => {
            console.error('Error al cargar ejercicios:', error);
            availableExercises.textContent = 'Error al cargar los ejercicios';
            startGameBtn.disabled = true;
        });
}

window.addEventListener('DOMContentLoaded', () => {
    initializeGame();
});

function validateFile() {
    const file = fileInput.files[0];
    if (!file) {
        showValidationResult('❌ Selecciona un archivo primero', false);
        return;
    }

    // Solo aceptar archivos .json
    if (!file.name.endsWith('.json')) {
        showValidationResult('❌ El archivo debe ser formato .json', false);
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        let json;
        try {
            json = JSON.parse(e.target.result);
        } catch (err) {
            showValidationResult('❌ El archivo no es un JSON válido', false);
            return;
        }

        // Si es un array, validar cada ejercicio
        if (Array.isArray(json)) {
            if (json.length === 0) {
                showValidationResult('❌ El archivo no contiene ejercicios', false);
                return;
            }
            for (const ejercicio of json) {
                if (!ejercicio.operation || !Array.isArray(ejercicio.options)) {
                    showValidationResult('❌ Cada ejercicio debe tener "operation" y "options"', false);
                    return;
                }
            }
            showValidationResult('✅ Archivo válido. Puedes comenzar el juego', true);
            gameOptions.classList.remove('hidden');
            // Cargar ejercicios al banco
            exerciseBank = json;

            const niveles = [...new Set(exerciseBank.map(ej => ej.nivel))];
            levelSelect.innerHTML = '';
            niveles.forEach(nivel => {
                const opt = document.createElement('option');
                opt.value = nivel;
                opt.textContent = nivel.charAt(0).toUpperCase() + nivel.slice(1);
                levelSelect.appendChild(opt);
            });
            loadExerciseBank(); // Filtra ejercicios del primer nivel por defecto
            return;
        }

        // Si es un solo ejercicio (objeto)
        if (!json.operation || !Array.isArray(json.options)) {
            showValidationResult('❌ El JSON debe tener "operation" y "options"', false);
            return;
        }

        showValidationResult('✅ Archivo válido. Puedes comenzar el juego', true);
        gameOptions.classList.remove('hidden');
        exerciseBank = [json];
    };
    reader.readAsText(file);
}

function showValidationResult(message, isValid) {
    validationResult.textContent = message;
    validationResult.style.color = isValid ? 'green' : 'red';
}

// === FUNCIÓN PRINCIPAL PARA INICIAR EL JUEGO AR ===
function startGame() {
    const count = parseInt(exerciseCountInput.value) || 1;
    
    // Verifica que haya ejercicios disponibles
    if (!gameData.filteredExercises || gameData.filteredExercises.length === 0) {
        alert('No hay ejercicios disponibles para este nivel');
        return;
    }

    // Usa el banco filtrado por nivel
    const selectedExercises = gameData.filteredExercises
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.min(count, gameData.filteredExercises.length));

    if (selectedExercises.length === 0) {
        alert('No hay suficientes ejercicios disponibles');
        return;
    }

    gameData.currentStep = 0;
    gameData.score = 0;
    gameData.exercises = selectedExercises;
    gameData.operation = selectedExercises[0].operation;
    gameData.options = selectedExercises[0].options;

    generatorScreen.classList.add('hidden');
    gameScreen.classList.add('hidden');
    showWaitingScreen();
    updateScore();
}

function createFloatingSymbols(container) {
    MATH_SYMBOLS.forEach((symbol, index) => {
        const floatingSymbol = document.createElement('div');
        floatingSymbol.textContent = symbol;
        floatingSymbol.style.cssText = `
            position: absolute;
            color: rgba(255, 255, 255, 0.2);
            font-size: ${Math.random() * 30 + 20}px;
            animation: float${index} ${Math.random() * 5 + 5}s ease-in-out infinite;
            left: ${Math.random() * 80 + 10}%;
            top: ${Math.random() * 80 + 10}%;
        `;
        
        const keyframes = document.createElement('style');
        keyframes.textContent = `
            @keyframes float${index} {
                0%, 100% { transform: translate(0, 0) rotate(0deg); }
                50% { transform: translate(${Math.random() * 30 - 15}px, ${Math.random() * 30 - 15}px) rotate(${Math.random() * 30 - 15}deg); }
            }
        `;
        document.head.appendChild(keyframes);
        container.appendChild(floatingSymbol);
    });
}

async function getLastUploadedImageUrl() {
    try {
        const res = await fetch('http://localhost:3001/imagenes/ultima');
        if (!res.ok) return '';
        const data = await res.json();
        return data.url || '';
    } catch (e) {
        return '';
    }
}

async function getLastUploadedAudioUrl() {
    try {
        const res = await fetch('http://localhost:3001/audios/ultima');
        if (!res.ok) return '';
        const data = await res.json();
        return data.url || '';
    } catch (e) {
        return '';
    }
}

async function getLastUploadedVideoUrl() {
    try {
        const res = await fetch('http://localhost:3001/videos/ultima');
        if (!res.ok) return '';
        const data = await res.json();
        return data.url || '';
    } catch (e) {
        return '';
    }
}

async function showInstructionsModal() {
    let config = {};
    try { config = JSON.parse(localStorage.getItem('gameConfig') || '{}'); } catch (e) {}
    
    // Validar si hay contenido en Inicio
    const hasContent = config['Inicio'] && (
        (config['Inicio']['Texto'] && config['Inicio']['TextoValor']) ||
        (config['Inicio']['Imagen'] && config['Inicio']['ImagenUrl']) ||
        (config['Inicio']['Audio'] && config['Inicio']['AudioUrl']) ||
        (config['Inicio']['Video'] && config['Inicio']['VideoUrl'])
    );
    
    // Si no hay contenido, continuar directamente al juego
    if (!hasContent) {
        displayAROperation();
        return;
    }

    const mostrarInicioTexto = config['Inicio']['Texto'] && config['Inicio']['TextoValor'];
    const textoInicio = mostrarInicioTexto ? config['Inicio']['TextoValor'] : '';
    
    const mostrarInicioImagen = config['Inicio']['Imagen'] && config['Inicio']['ImagenUrl'];
    const imagenInicio = mostrarInicioImagen ? config['Inicio']['ImagenUrl'] : '';

    const mostrarInicioAudio = config['Inicio']['Audio'] && config['Inicio']['AudioUrl'];
    const audioInicio = mostrarInicioAudio ? config['Inicio']['AudioUrl'] : '';

    const mostrarInicioVideo = config['Inicio']['Video'] && config['Inicio']['VideoUrl'];
    const videoInicio = mostrarInicioVideo ? config['Inicio']['VideoUrl'] : '';

    const modal = document.createElement('div');
    modal.id = 'ar-inicio-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.85);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 4000;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
        border-radius: 24px;
        max-width: 480px;
        width: 90vw;
        overflow: hidden;
        box-shadow: 0 8px 32px #4361ee44;
        display: flex;
        flex-direction: column;
        align-items: center;
        background: #fff;
        animation: fadeIn 0.7s;
        position: relative;
    `;

    // Encabezado
    const header = document.createElement('div');
    header.style.cssText = `
        padding: 1.2rem;
        background: #4361ee;
        color: white;
        text-align: center;
        width: 100%;
    `;
    header.innerHTML = `<h2 style="margin:0;font-size:1.3rem;">¡Bienvenido!</h2>`;
    content.appendChild(header);

    // Fondo decorativo
    const bgContainer = document.createElement('div');
    bgContainer.style.cssText = `
        position: relative;
        min-height: 220px;
        width: 100%;
        background: linear-gradient(135deg, #4361ee 0%, #3a0ca3 100%);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1.2rem;
        padding: 1.2rem 0 1.2rem 0;
    `;
    const bgElements = document.createElement('div');
    bgElements.style.cssText = `
        position: absolute;
        width: 100%; height: 100%;
        background: 
            radial-gradient(circle at 20% 20%, rgba(255,255,255,0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 0%, transparent 50%);
        pointer-events: none;
    `;
    bgContainer.appendChild(bgElements);
    createFloatingSymbols(bgElements);

    // Texto arriba, centrado
    if (mostrarInicioTexto && textoInicio) {
        const inicioText = document.createElement('div');
        inicioText.style.cssText = `
            color: #ffd60a;
            font-size: 2.2rem;
            font-weight: bold;
            text-shadow: 2px 2px 8px #3a0ca3;
            text-align: center;
            z-index: 16;
            animation: arFloat 3s ease-in-out infinite;
            max-width: 90%;
            margin-bottom: 0.8rem;
        `;
        inicioText.textContent = textoInicio;
        bgContainer.appendChild(inicioText);
    }

    // Imagen debajo del texto, centrada
    if (mostrarInicioImagen && imagenInicio) {
        const img = document.createElement('img');
        img.src = imagenInicio;
        img.alt = 'Imagen de Inicio';
        img.style.cssText = `
            max-width: 180px;
            max-height: 120px;
            margin-top: 0.2rem;
            border-radius: 12px;
            box-shadow: 0 2px 12px #3a0ca3;
            z-index: 20;
            display: block;
        `;
        bgContainer.appendChild(img);
    }

    // Audio
    if (mostrarInicioAudio && audioInicio) {
        const audio = document.createElement('audio');
        audio.src = audioInicio;
        audio.controls = true;
        audio.autoplay = true; // Reproduce automáticamente
        audio.style.cssText = `
            margin-bottom: 1rem;
            width: 90%;
            z-index: 20;
        `;
        bgContainer.appendChild(audio);
    }

    // Video
    if (mostrarInicioVideo && videoInicio) {
        const video = document.createElement('video');
        video.src = videoInicio;
        video.controls = true;
        video.autoplay = true;
        video.style.cssText = `
            max-width: 95vw;
            max-height: 340px;
            width: 100%;
            height: auto;
            margin-bottom: 1rem;
            border-radius: 18px;
            box-shadow: 0 4px 24px #3a0ca3;
            z-index: 20;
            background: #000;
            display: block;
        `;
        bgContainer.appendChild(video);

        // Ajusta el alto del panel para el video
        bgContainer.style.minHeight = '380px';
    }

    content.appendChild(bgContainer);

    // Botón para continuar
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Siguiente';
    nextBtn.style.cssText = `
        background: #4361ee;
        color: white;
        border: none;
        border-radius: 8px;
        padding: 0.8rem 2rem;
        cursor: pointer;
        font-weight: 600;
        font-size: 1rem;
        margin: 1.5rem auto 1rem auto;
        display: block;
        transition: background 0.3s, transform 0.3s;
    `;
    nextBtn.addEventListener('mouseenter', () => {
        nextBtn.style.background = '#3a0ca3';
        nextBtn.style.transform = 'scale(1.05)';
    });
    nextBtn.addEventListener('mouseleave', () => {
        nextBtn.style.background = '#4361ee';
        nextBtn.style.transform = 'scale(1)';
    });
    nextBtn.addEventListener('click', () => {
        modal.remove();
        displayAROperation();
    });
    content.appendChild(nextBtn);

    // Animación CSS si no existe
    if (!document.getElementById('ar-inicio-anim-style')) {
        const style = document.createElement('style');
        style.id = 'ar-inicio-anim-style';
        style.textContent = `
            @keyframes arFloat {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }

    modal.appendChild(content);
    document.body.appendChild(modal);
}

function showWaitingScreen() {
    // Crear la pantalla de espera
    const waitingScreen = document.createElement('div');
    waitingScreen.id = 'waiting-screen';
    waitingScreen.style.cssText = `
        background: white;
        padding: 2.5rem 2rem;
        width: 100%;
        max-width: 600px;
        min-height: 100%;
        animation: fadeIn 0.5s ease-out;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    `;

    // Contenedor principal
    const contentContainer = document.createElement('div');
    contentContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 60vh;
        text-align: center;
        gap: 2rem;
        width: 100%;
    `;

    // Título principal
    const title = document.createElement('h2');
    title.textContent = 'Configuración de Realidad Aumentada - Cálculo Mental';
    title.style.cssText = `
        color: var(--secondary);
        font-size: 2.5rem;
        margin: 0 auto;
        text-shadow: 0 2px 8px #e0e7ff;
        animation: bounceIn 0.8s ease-out;
        text-align: center;
        width: 100%;
    `;

    // Subtítulo
    const subtitle = document.createElement('h3');
    subtitle.textContent = 'Selecciona la etapa y tipos de contenido';
    subtitle.style.cssText = `
        color: var(--primary);
        font-size: 1.5rem;
        margin: 1rem 0;
        font-weight: 500;
        animation: fadeIn 0.8s ease-out 0.2s both;
        text-align: center;
        width: 100%;
    `;

    // Etapas y tipos
    const stages = ['Inicio', 'Acierto', 'Final'];
    const types = ['Texto', 'Imagen', 'Audio', 'Video'];

    // Estado de configuración persistente
    let config = {};
    try { config = JSON.parse(localStorage.getItem('gameConfig') || '{}'); } catch (e) {}

    // Botones de etapa
    const stageButtonsContainer = document.createElement('div');
    stageButtonsContainer.style.cssText = `
        display: flex;
        gap: 1.2rem;
        margin-bottom: 1.2rem;
        justify-content: center;
        width: 100%;
    `;
    const stageIcons = { 'Inicio': '🚀', 'Acierto': '✅', 'Final': '🏁' };
    let selectedStage = stages[0];

    // Panel de opciones de etapa seleccionada
    const stagePanelContainer = document.createElement('div');
    stagePanelContainer.style.cssText = `
        width: 100%;
        margin-top: 1.2rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    `;

    // Definir íconos de tipo globales dentro de showWaitingScreen
    const typeIcons = { 'Texto': '📝', 'Imagen': '🖼️', 'Audio': '🔊', 'Video': '🎬' };

    // Función para crear el panel de opciones de una etapa
    function createStagePanel(stage) {
        const panel = document.createElement('div');
        panel.id = `stage-panel-${stage}`;
        panel.style.cssText = `
            background: #f8f9ff;
            border-radius: 12px;
            box-shadow: 0 2px 8px #4361ee22;
            padding: 1.2rem 1.5rem;
            margin-bottom: 0.5rem;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.7rem;
            animation: fadeIn 0.4s;
            width: 100%;
            max-width: 400px;
            border-left: 8px solid ${
                stage === 'Inicio' ? '#4361ee' :
                stage === 'Acierto' ? '#43aa8b' :
                stage === 'Final' ? '#ffd60a' : '#4361ee'
            };
            position: relative;
        `;

        // Encabezado destacado para el panel
        const panelHeader = document.createElement('div');
        panelHeader.textContent = `${stageIcons[stage] || ''} Opciones para ${stage}`;
        panelHeader.style.cssText = `
            font-size: 1.25rem;
            font-weight: bold;
            color: ${
                stage === 'Inicio' ? '#4361ee' :
                stage === 'Acierto' ? '#43aa8b' :
                stage === 'Final' ? '#ffd60a' : '#4361ee'
            };
            background: ${
                stage === 'Inicio' ? '#e0e7ff' :
                stage === 'Acierto' ? '#e6fff7' :
                stage === 'Final' ? '#fffbe6' : '#e0e7ff'
            };
            width: 100%;
            text-align: center;
            padding: 0.6rem 0;
            border-radius: 8px 8px 0 0;
            margin-bottom: 0.7rem;
            box-shadow: 0 2px 8px #4361ee11;
        `;
        panel.appendChild(panelHeader);

        // Botones horizontales de tipo
        const typeRow = document.createElement('div');
        typeRow.style.cssText = `
            display: flex;
            gap: 1.2rem;
            flex-wrap: wrap;
            justify-content: center;
            width: 100%;
            margin-bottom: 1rem;
        `;

        // Panel donde se muestra el input correspondiente
        const inputPanelWrapper = document.createElement('div');
        inputPanelWrapper.id = `input-panel-wrapper-${stage}`;
        inputPanelWrapper.style.cssText = `
            width: 100%;
            margin-top: 0.7rem;
            align-items: center;
            display: flex;
            flex-direction: column;
        `;

        // Estado de selección
        let selectedType = null;

        types.forEach(type => {
            const btn = document.createElement('button');
            btn.textContent = `${typeIcons[type]} ${type}`;
            btn.style.cssText = `
                background: #fff;
                color: var(--primary);
                border: 2px solid #e6eefc;
                border-radius: 8px;
                padding: 0.7rem 1.2rem;
                font-size: 1rem;
                font-weight: 500;
                cursor: pointer;
                transition: background 0.2s, color 0.2s, border 0.2s;
                margin-bottom: 0;
            `;
            btn.addEventListener('click', () => {
                // Quitar selección de todos los botones
                Array.from(typeRow.children).forEach(b => {
                    b.style.background = '#fff';
                    b.style.color = 'var(--primary)';
                    b.style.borderColor = '#e6eefc';
                });
                btn.style.background = '#e0e7ff';
                btn.style.color = '#4361ee';
                btn.style.borderColor = '#4361ee';

                // Inicializar config para esta etapa (sin guardar aún)
                if (!config[stage]) config[stage] = {};

                // Mostrar el panel correspondiente debajo del botón
                inputPanelWrapper.innerHTML = '';
                addInputPanel(stage, type, inputPanelWrapper);
                selectedType = type;
            });
            typeRow.appendChild(btn);
        });

        panel.appendChild(typeRow);
        panel.appendChild(inputPanelWrapper);

        return panel;
    }

    // Función para agregar input panel según tipo
    function addInputPanel(stage, type, wrapper) {
        const id = `input-panel-${stage}-${type}`;
        if (document.getElementById(id)) return;

        const inputPanel = document.createElement('div');
        inputPanel.id = id;
        inputPanel.style.cssText = `
            background: #fff;
            border-radius: 12px;
            box-shadow: 0 2px 8px #4361ee22;
            padding: 1.2rem 1.5rem;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.7rem;
            animation: fadeIn 0.4s;
            margin-bottom: 0.5rem;
            width: 100%;
            max-width: 350px;
        `;

        // Título con icono
        const label = document.createElement('div');
        label.innerHTML = `<span style="font-size:1.2rem;margin-right:0.4rem;">${typeIcons[type]}</span>${stage} - ${type}`;
        label.style.cssText = `
            color: var(--secondary);
            font-weight: bold;
            font-size: 1.08rem;
            display: flex;
            align-items: center;
            gap: 0.4rem;
            justify-content: center;
            width: 100%;
            text-align: center;
        `;
        inputPanel.appendChild(label);

        // Mensaje de error
        const errorMsg = document.createElement('div');
        errorMsg.style.cssText = 'color: #f72585; font-size: 0.95rem; margin-top: 0.3rem; display: none; text-align: center;';

        // Inicializar config si no existe
        if (!config[stage]) {
            config[stage] = {};
        }

        if (type === 'Texto') {
            const input = document.createElement('input');
            input.type = 'text';
            input.maxLength = 20;
            input.placeholder = 'Escribe aquí (máx. 20 caracteres)';
            input.style.cssText = `
                width: 100%;
                max-width: 340px;
                padding: 10px 12px;
                border-radius: 8px;
                border: 1.5px solid #e6eefc;
                font-size: 1rem;
                color: var(--primary);
                text-align: center;
            `;
            input.value = (config[stage] && config[stage]['TextoValor']) ? config[stage]['TextoValor'] : '';
            inputPanel.appendChild(input);

            // Botón para guardar texto
            const saveTextBtn = document.createElement('button');
            saveTextBtn.textContent = 'Guardar texto';
            saveTextBtn.style.cssText = `
                margin-top: 0.5rem;
                background: #4361ee;
                color: white;
                border: none;
                border-radius: 8px;
                padding: 0.5rem 1.5rem;
                cursor: pointer;
                font-weight: 600;
                font-size: 1rem;
                transition: background 0.3s;
                align-self: center;
            `;
            saveTextBtn.addEventListener('click', () => {
                if (!config[stage]) config[stage] = {};
                config[stage]['TextoValor'] = input.value;
                config[stage]['Texto'] = true;
                localStorage.setItem('gameConfig', JSON.stringify(config));
                saveTextBtn.textContent = '¡Guardado!';
                setTimeout(() => { saveTextBtn.textContent = 'Guardar texto'; }, 1200);
            });
            inputPanel.appendChild(saveTextBtn);
        } else if (type === 'Imagen') {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.jpg,.jpeg,.png,image/jpeg,image/png';
            input.style.cssText = `margin-top: 0.5rem; align-self: center;`;

            // Cuadro gris con restricciones
            const restrictionBox = document.createElement('div');
            restrictionBox.style.cssText = `
                background: #e6eefc;
                color: #222;
                border-radius: 8px;
                padding: 0.7rem 1rem;
                margin-left: 0.5rem;
                font-size: 0.98rem;
                margin-top: 0.5rem;
                max-width: 220px;
                text-align: left;
                display: inline-block;
            `;
            restrictionBox.innerHTML = `
                <strong>Restricciones:</strong><br>
                • Solo formatos <b>.jpg</b>, <b>.jpeg</b>, <b>.png</b><br>
                • Tamaño máximo: 5 MB
            `;

            inputPanel.appendChild(input);
            inputPanel.appendChild(restrictionBox);
            inputPanel.appendChild(errorMsg);

            const uploadBtn = document.createElement('button');
            uploadBtn.textContent = 'Subir imagen (.jpg, .png)';
            uploadBtn.style.cssText = `
                margin-top: 0.5rem;
                background: #4361ee;
                color: white;
                border: none;
                border-radius: 8px;
                padding: 0.5rem 1.5rem;
                cursor: pointer;
                font-weight: 600;
                font-size: 1rem;
                transition: background 0.3s;
                align-self: center;
            `;
            inputPanel.appendChild(uploadBtn);

            let selectedFile = null;
            input.addEventListener('change', () => {
                errorMsg.style.display = 'none';
                const file = input.files[0];
                selectedFile = file;
                if (!file) return;
                const validTypes = ['image/jpeg', 'image/png'];
                const validExt = /\.(jpg|jpeg|png)$/i;
                if (!validTypes.includes(file.type) || !validExt.test(file.name)) {
                    alert('Archivo no compatible. Solo se permite formato .jpg, .jpeg o .png');
                    input.value = '';
                    selectedFile = null;
                    return;
                }
                if (file.size > 5 * 1024 * 1024) {
                    alert('Archivo muy pesado. La imagen no debe ser mayor a 5 MB');
                    input.value = '';
                    selectedFile = null;
                    return;
                }
            });

            uploadBtn.addEventListener('click', () => {
                errorMsg.style.display = 'none';
                if (!selectedFile) {
                    errorMsg.textContent = 'Selecciona una imagen válida primero.';
                    errorMsg.style.display = 'block';
                    return;
                }
                const formData = new FormData();
                formData.append('image', selectedFile);
                uploadBtn.disabled = true;
                uploadBtn.textContent = 'Subiendo...';
                fetch(`${SERVER_URL}/upload-image`, {
                    method: 'POST',
                    body: formData
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        uploadBtn.textContent = '¡Imagen subida!';
                        uploadBtn.style.background = '#43aa8b';
                        if (!config[stage]) config[stage] = {};
                        config[stage]['ImagenUrl'] = data.url || '';
                        config[stage]['Imagen'] = true;
                        localStorage.setItem('gameConfig', JSON.stringify(config));
                        
                        setTimeout(() => {
                            uploadBtn.textContent = 'Subir imagen (.jpg, .png)';
                            uploadBtn.style.background = '#4361ee';
                            uploadBtn.disabled = false;
                        }, 1500);
                    } else {
                        errorMsg.textContent = 'Error al subir la imagen.';
                        errorMsg.style.display = 'block';
                        uploadBtn.disabled = false;
                        uploadBtn.textContent = 'Subir imagen (.jpg, .png)';
                    }
                })
                .catch(() => {
                    errorMsg.textContent = 'No se pudo conectar al servidor.';
                    errorMsg.style.display = 'block';
                    uploadBtn.disabled = false;
                    uploadBtn.textContent = 'Subir imagen (.jpg, .png)';
                });
            });
        } else if (type === 'Audio') {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.mp3,audio/mp3';
            input.style.cssText = `margin-top: 0.5rem; align-self: center;`;

            // Cuadro gris con restricciones
            const restrictionBox = document.createElement('div');
            restrictionBox.style.cssText = `
                background: #e6eefc;
                color: #222;
                border-radius: 8px;
                padding: 0.7rem 1rem;
                margin-left: 0.5rem;
                font-size: 0.98rem;
                margin-top: 0.5rem;
                max-width: 220px;
                text-align: left;
                display: inline-block;
            `;
            restrictionBox.innerHTML = `
                <strong>Restricciones:</strong><br>
                • Solo formato <b>.mp3</b><br>
                • Tamaño máximo: 3 MB
            `;

            inputPanel.appendChild(input);
            inputPanel.appendChild(restrictionBox);
            inputPanel.appendChild(errorMsg);

            const uploadBtn = document.createElement('button');
            uploadBtn.textContent = 'Subir audio (.mp3)';
            uploadBtn.style.cssText = `
                margin-top: 0.5rem;
                background: #4361ee;
                color: white;
                border: none;
                border-radius: 8px;
                padding: 0.5rem 1.5rem;
                cursor: pointer;
                font-weight: 600;
                font-size: 1rem;
                transition: background 0.3s;
                align-self: center;
            `;
            inputPanel.appendChild(uploadBtn);

            let selectedFile = null;
            input.addEventListener('change', () => {
                errorMsg.style.display = 'none';
                const file = input.files[0];
                selectedFile = file;
                if (!file) return;
                const validTypes = ['audio/mp3', 'audio/mpeg'];
                const validExt = /\.(mp3)$/i;
                if (!validTypes.includes(file.type) || !validExt.test(file.name)) {
                    alert('Archivo no compatible. Solo se permite formato .mp3');
                    input.value = '';
                    selectedFile = null;
                    return;
                }
                if (file.size > 3 * 1024 * 1024) {
                    alert('Archivo muy pesado. El audio no debe ser mayor a 3 MB');
                    input.value = '';
                    selectedFile = null;
                    return;
                }
            });

            uploadBtn.addEventListener('click', () => {
                errorMsg.style.display = 'none';
                if (!selectedFile) {
                    errorMsg.textContent = 'Selecciona un archivo de audio válido primero.';
                    errorMsg.style.display = 'block';
                    return;
                }
                const formData = new FormData();
                formData.append('audio', selectedFile);
                uploadBtn.disabled = true;
                uploadBtn.textContent = 'Subiendo...';
                fetch(`${SERVER_URL}/upload-audio`, {
                    method: 'POST',
                    body: formData
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        uploadBtn.textContent = '¡Audio subido!';
                        uploadBtn.style.background = '#43aa8b';
                        if (!config[stage]) config[stage] = {};
                        config[stage]['AudioUrl'] = data.url || '';
                        config[stage]['Audio'] = true;
                        localStorage.setItem('gameConfig', JSON.stringify(config));
                        
                        setTimeout(() => {
                            uploadBtn.textContent = 'Subir audio (.mp3)';
                            uploadBtn.style.background = '#4361ee';
                            uploadBtn.disabled = false;
                        }, 1500);
                    } else {
                        errorMsg.textContent = 'Error al subir el audio.';
                        errorMsg.style.display = 'block';
                        uploadBtn.disabled = false;
                        uploadBtn.textContent = 'Subir audio (.mp3)';
                    }
                })
                .catch(() => {
                    errorMsg.textContent = 'No se pudo conectar al servidor.';
                    errorMsg.style.display = 'block';
                    uploadBtn.disabled = false;
                    uploadBtn.textContent = 'Subir audio (.mp3)';
                });
            });
        } else if (type === 'Video') {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.mp4,video/mp4';
            input.style.cssText = `margin-top: 0.5rem; align-self: center;`;

            // Cuadro gris con restricciones
            const restrictionBox = document.createElement('div');
            restrictionBox.style.cssText = `
                background: #e6eefc;
                color: #222;
                border-radius: 8px;
                padding: 0.7rem 1rem;
                margin-left: 0.5rem;
                font-size: 0.98rem;
                margin-top: 0.5rem;
                max-width: 220px;
                text-align: left;
                display: inline-block;
            `;
            restrictionBox.innerHTML = `
                <strong>Restricciones:</strong><br>
                • Solo formato <b>.mp4</b><br>
                • Tamaño máximo: 10 MB
            `;

            inputPanel.appendChild(input);
            inputPanel.appendChild(restrictionBox);
            inputPanel.appendChild(errorMsg);

            const uploadBtn = document.createElement('button');
            uploadBtn.textContent = 'Subir video (.mp4)';
            uploadBtn.style.cssText = `
                margin-top: 0.5rem;
                background: #4361ee;
                color: white;
                border: none;
                border-radius: 8px;
                padding: 0.5rem 1.5rem;
                cursor: pointer;
                font-weight: 600;
                font-size: 1rem;
                transition: background 0.3s;
                align-self: center;
            `;
            inputPanel.appendChild(uploadBtn);

            let selectedFile = null;
            input.addEventListener('change', () => {
                errorMsg.style.display = 'none';
                const file = input.files[0];
                selectedFile = file;
                if (!file) return;
                const validTypes = ['video/mp4'];
                const validExt = /\.(mp4)$/i;
                if (!validTypes.includes(file.type) || !validExt.test(file.name)) {
                    alert('Archivo no compatible. Solo se permite formato .mp4');
                    input.value = '';
                    selectedFile = null;
                    return;
                }
                if (file.size > 10 * 1024 * 1024) {
                    alert('Archivo muy pesado. El video no debe ser mayor a 10 MB');
                    input.value = '';
                    selectedFile = null;
                    return;
                }
            });

            uploadBtn.addEventListener('click', () => {
                errorMsg.style.display = 'none';
                if (!selectedFile) {
                    errorMsg.textContent = 'Selecciona un archivo de video válido primero.';
                    errorMsg.style.display = 'block';
                    return;
                }
                const formData = new FormData();
                formData.append('video', selectedFile);
                uploadBtn.disabled = true;
                uploadBtn.textContent = 'Subiendo...';
                fetch(`${SERVER_URL}/upload-video`, {
                    method: 'POST',
                    body: formData
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        uploadBtn.textContent = '¡Video subido!';
                        uploadBtn.style.background = '#43aa8b';
                        if (!config[stage]) config[stage] = {};
                        config[stage]['VideoUrl'] = data.url || '';
                        config[stage]['Video'] = true;
                        localStorage.setItem('gameConfig', JSON.stringify(config));
                        
                        setTimeout(() => {
                            uploadBtn.textContent = 'Subir video (.mp4)';
                            uploadBtn.style.background = '#4361ee';
                            uploadBtn.disabled = false;
                        }, 1500);
                    } else {
                        errorMsg.textContent = 'Error al subir el video.';
                        errorMsg.style.display = 'block';
                        uploadBtn.disabled = false;
                        uploadBtn.textContent = 'Subir video (.mp4)';
                    }
                })
                .catch(() => {
                    errorMsg.textContent = 'No se pudo conectar al servidor.';
                    errorMsg.style.display = 'block';
                    uploadBtn.disabled = false;
                    uploadBtn.textContent = 'Subir video (.mp4)';
                });
            });
        }

        wrapper.appendChild(inputPanel);
    }

    // Crear los botones de etapa
    stages.forEach(stage => {
        const btn = document.createElement('button');
        btn.textContent = `${stageIcons[stage]} ${stage}`;
        btn.style.cssText = `
            background: #f8f9ff;
            color: var(--primary);
            border: 2px solid var(--primary);
            border-radius: 12px;
            padding: 0.7rem 1.5rem;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s, color 0.2s, border 0.2s;
            width: 120px;
            text-align: center;
        `;
        if (stage === selectedStage) {
            btn.style.background = '#4361ee';
            btn.style.color = 'white';
            btn.style.borderColor = '#4361ee';
        }
        btn.addEventListener('click', () => {
            selectedStage = stage;
            // Actualiza estilos de los botones
            Array.from(stageButtonsContainer.children).forEach(b => {
                b.style.background = '#f8f9ff';
                b.style.color = 'var(--primary)';
                b.style.borderColor = 'var(--primary)';
            });
            btn.style.background = '#4361ee';
            btn.style.color = 'white';
            btn.style.borderColor = '#4361ee';
            // Muestra el panel correspondiente
            showSelectedStagePanel();
        });
        stageButtonsContainer.appendChild(btn);
    });

    // Mostrar el panel de la etapa seleccionada
    function showSelectedStagePanel() {
        stagePanelContainer.innerHTML = '';
        stagePanelContainer.appendChild(createStagePanel(selectedStage));
    }

    // Inicialmente mostrar el panel de la primera etapa
    showSelectedStagePanel();

    // Botón para guardar toda la configuración
    const saveButton = document.createElement('button');
    saveButton.textContent = '💾 Guardar Configuración';
    saveButton.style.cssText = `
        background: linear-gradient(90deg, var(--success) 60%, var(--primary) 100%);
        color: white;
        border: none;
        padding: 1rem 2.5rem;
        border-radius: 18px;
        font-size: 1.2rem;
        font-weight: 700;
        cursor: pointer;
        box-shadow: 0 8px 24px rgba(67, 97, 238, 0.25);
        transition: transform 0.3s, background 0.3s;
        margin: 1.5rem auto 0 auto;
        display: block;
        align-self: center;
    `;
    saveButton.addEventListener('mouseenter', () => {
        saveButton.style.transform = 'scale(1.05)';
    });
    saveButton.addEventListener('mouseleave', () => {
        saveButton.style.transform = 'scale(1)';
    });
    // Referencia temporal al botón de inicio
    let startButtonRef = null;
    
    saveButton.addEventListener('click', () => {
        localStorage.setItem('gameConfig', JSON.stringify(config));
        saveButton.textContent = '¡Guardado!';
        
        // Habilitar botón de inicio cuando se guarde
        if (startButtonRef && startButtonRef.disabled) {
            startButtonRef.disabled = false;
            startButtonRef.style.opacity = '1';
            startButtonRef.style.cursor = 'pointer';
        }
        
        setTimeout(() => { saveButton.textContent = '💾 Guardar Configuración'; }, 1200);
    });

    // Botón para comenzar juego - deshabilitado hasta guardar configuración
    const startButton = document.createElement('button');
    startButton.textContent = 'Comenzar juego';
    startButton.disabled = true;
    startButton.style.cssText = `
        background: linear-gradient(90deg, var(--primary) 60%, var(--success) 100%);
        color: white;
        border: none;
        padding: 1rem 2.5rem;
        border-radius: 18px;
        font-size: 1.2rem;
        font-weight: 700;
        cursor: not-allowed;
        box-shadow: 0 8px 24px rgba(67, 97, 238, 0.25);
        transition: transform 0.3s, background 0.3s, opacity 0.3s, cursor 0.3s;
        animation: bounceBtn 1.2s infinite alternate;
        margin-top: 1rem;
        display: block;
        align-self: center;
        opacity: 0.5;
    `;
    
    // Guardar referencia para habilitar desde saveButton
    startButtonRef = startButton;
    
    startButton.addEventListener('mouseenter', () => {
        if (!startButton.disabled) {
            startButton.style.background = 'linear-gradient(90deg, var(--success) 60%, var(--primary) 100%)';
            startButton.style.transform = 'translateY(-5px)';
        }
    });
    startButton.addEventListener('mouseleave', () => {
        if (!startButton.disabled) {
            startButton.style.background = 'linear-gradient(90deg, var(--primary) 60%, var(--success) 100%)';
            startButton.style.transform = 'translateY(0)';
        }
    });
    startButton.addEventListener('click', () => {
        // Solo permitir si está habilitado
        if (startButton.disabled) return;
        
        waitingScreen.remove();
        gameScreen.classList.remove('hidden');
        let config = {};
        try {
            config = JSON.parse(localStorage.getItem('gameConfig') || '{}');
        } catch (e) {}
        if (
            config['Inicio'] &&
            (config['Inicio']['Texto'] ||
             config['Inicio']['Imagen'] ||
             config['Inicio']['Audio'] ||
             config['Inicio']['Video'])
        ) {
            showInstructionsModal();
        } else {
            displayAROperation();
        }
    });

    // Botón para volver
    const backButton = document.createElement('button');
    backButton.textContent = 'Volver';
    backButton.style.cssText = `
        background: transparent;
        color: var(--primary);
        border: 2px solid var(--primary);
        padding: 0.8rem 2rem;
        border-radius: 18px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s;
        margin-top: 1rem;
        align-self: center;
    `;
    backButton.addEventListener('mouseenter', () => {
        backButton.style.background = 'var(--danger)';
        backButton.style.borderColor = 'var(--danger)';
        backButton.style.color = 'white';
    });
    backButton.addEventListener('mouseleave', () => {
        backButton.style.background = 'transparent';
        backButton.style.borderColor = 'var(--primary)';
        backButton.style.color = 'var(--primary)';
    });
    backButton.addEventListener('click', () => {
        waitingScreen.remove();
        generatorScreen.classList.remove('hidden');
    });

    // Ensamblar la pantalla
    contentContainer.appendChild(title);
    contentContainer.appendChild(subtitle);
    contentContainer.appendChild(stageButtonsContainer);
    contentContainer.appendChild(stagePanelContainer);
    contentContainer.appendChild(saveButton);
    contentContainer.appendChild(startButton);
    contentContainer.appendChild(backButton);
    waitingScreen.appendChild(contentContainer);

    // Insertar la pantalla en el DOM
    const appContainer = document.querySelector('.app-container');
    appContainer.appendChild(waitingScreen);
}

function backToGenerator() {
    // Ya no es necesario detener la cámara
    arStream = null;
    gameScreen.classList.add('hidden');
    generatorScreen.classList.remove('hidden');

    operationDisplay.textContent = '';
    optionsContainer.innerHTML = '';
    validateContainer.innerHTML = '';
}

// Función separada para mostrar texto flotante AR
function showARFloatingText(message = '¡Ahora es tu turno ☝️!', duration = 4000) {
    // Crear texto AR flotante sobre toda la pantalla
    const arFloatingText = document.createElement('div');
    arFloatingText.id = 'ar-floating-text';
    arFloatingText.textContent = message;
    arFloatingText.style.cssText = `
        position: fixed;
        top: 30%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: #4361ee;
        font-size: 3rem;
        font-weight: bold;
        text-shadow: 3px 3px 6px rgba(0,0,0,0.8);
        z-index: 1001;
        white-space: nowrap;
        text-align: center;
        animation: arFloat 3s ease-in-out infinite;
        pointer-events: none;
    `;
    
    // Agregar animación CSS si no existe
    let existingStyle = document.getElementById('ar-float-style');
    if (!existingStyle) {
        const style = document.createElement('style');
        style.id = 'arFloatStyle';
        style.textContent = `
            @keyframes arFloat {
                0%, 100% { transform: translate(-50%, -50%) scale(1); }
                50% { transform: translate(-50%, -60%) scale(1.1); }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(arFloatingText);
    
    // Eliminar texto después del tiempo especificado
    setTimeout(() => {
        if (arFloatingText && arFloatingText.parentNode) {
            arFloatingText.remove();
        }
    }, duration);
    
    return arFloatingText; // Retornar elemento por si necesitas manipularlo
}

// Función para mostrar el juego de Cálculo mental
function displayAROperation() { 
    // Mostrar panel final si ya no hay más ejercicios
    if (gameData.currentStep >= gameData.exercises.length) {
        showGameCompletedModal(gameData.score);
        return;
    }

    const currentExercise = gameData.exercises[gameData.currentStep];
    gameData.operation = currentExercise.operation;
    gameData.options = currentExercise.options;
    validateContainer.innerHTML = '';
    operationDisplay.textContent = '';

    // Cambia el regex para que reconozca números de más de un dígito y operadores
    const parts = [];
    const regex = /(\d+|[+\-×÷*/])/g;
    const operationString = gameData.operation.replace(/,/g, ' ');
    let match;
    while ((match = regex.exec(operationString)) !== null) {
        parts.push(match[0]);
    }

    let step = 0;
    const slowTime = 1000; // 1 segundo por elemento

    function showNextPart() {
        if (step < parts.length) {
            operationDisplay.textContent = parts[step];
            step++;
            setTimeout(() => {
                operationDisplay.textContent = '';
                setTimeout(showNextPart, slowTime);
            }, slowTime);
        } else {
            operationDisplay.textContent = '¡Listo! Puedes responder.';
            showOptions();
        }
    }

    showNextPart();
}

function showOptions() {
    optionsContainer.innerHTML = '';
    validateContainer.innerHTML = '';

    const shuffledOptions = [...gameData.options].sort(() => Math.random() - 0.5);

    let selectedButton = null;
    let selectedOption = null;

    shuffledOptions.forEach(option => {
        const button = document.createElement('button');
        button.textContent = option.text;
        button.addEventListener('click', () => {
            // Quitar resaltado de todos los botones
            optionsContainer.querySelectorAll('button').forEach(btn => {
                btn.classList.remove('selected');
            });
            // Resaltar el botón seleccionado
            button.classList.add('selected');
            selectedButton = button;
            selectedOption = option;
        });
        optionsContainer.appendChild(button);
    });

    // Estilo para el botón seleccionado
    const style = document.createElement('style');
    style.textContent = `
        #options-container button.selected {
            background: var(--success);
            color: white;
            border-color: var(--success);
            transform: scale(1.08);
        }
    `;
    document.head.appendChild(style);

    const validateBtn = document.createElement('button');
    validateBtn.textContent = 'Validar resultado';
    validateBtn.style.gridColumn = '1 / -1';
    validateBtn.style.marginTop = '10px';
    validateBtn.style.background = '#4361ee';
    validateContainer.appendChild(validateBtn);

    validateBtn.addEventListener('click', () => {
        if (!selectedOption) {
            validateBtn.textContent = 'Selecciona una opción primero';
            validateBtn.style.background = '#f72585';
            setTimeout(() => {
                validateBtn.textContent = 'Validar resultado';
                validateBtn.style.background = '#4361ee';
            }, 1200);
            return;
        }

        validateBtn.disabled = true;
        optionsContainer.querySelectorAll('button').forEach(btn => btn.disabled = true);

        if (selectedOption.isCorrect) {
            selectedButton.classList.add('correct');
            gameData.score += 10;
            updateScore();
        } else {
            selectedButton.classList.add('incorrect');
            // Resalta la correcta
            const correctBtn = Array.from(optionsContainer.querySelectorAll('button')).find(btn => {
                const opt = shuffledOptions.find(o => o.text === btn.textContent);
                return opt && opt.isCorrect;
            });
            if (correctBtn) correctBtn.classList.add('correct');
        }

        // Mostrar cámara y mensaje AR
        showARValidationModal(selectedOption.isCorrect, () => {
            // Al cerrar el modal, avanzar al siguiente ejercicio o mostrar panel final
            gameData.currentStep++;
            optionsContainer.innerHTML = '';
            validateContainer.innerHTML = '';
            if (gameData.currentStep < gameData.exercises.length) {
                displayAROperation();
            } else {
                showGameCompletedModal(gameData.score); // Mostrar panel final automáticamente
            }
        });
    });
}

function getMotivationalMessage(isCorrect) {
    const correctMsgs = [
        '¡Excelente! ¡Respuesta correcta!',
        '¡Muy bien! Sigue así.',
        '¡Perfecto! Tienes gran habilidad.',
        '¡Correcto! Vas mejorando.',
        '¡Genial! ¡Sigue practicando!'
    ];
    const incorrectMsgs = [
        'No te desanimes, ¡intenta de nuevo!',
        '¡Ánimo! La práctica te hará mejor.',
        '¡Sigue adelante! Aprender es el objetivo.',
        '¡No te rindas! Cada error es una oportunidad.',
        '¡Vamos! La próxima será mejor.'
    ];
    return isCorrect ? 
        correctMsgs[Math.floor(Math.random() * correctMsgs.length)] :
        incorrectMsgs[Math.floor(Math.random() * incorrectMsgs.length)];
}

function updateScore() {
    scoreDisplay.textContent = `Puntuación: ${gameData.score}`;

    // Crear archivo de ejemplo para descargar
    document.addEventListener('DOMContentLoaded', () => {
        const exampleContent = `5,+3,*2,-1
            10*
            9
            14
            7
        `;
        
        const blob = new Blob([exampleContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const exampleLink = document.getElementById('download-example');
        if (exampleLink) {
            exampleLink.href = url;
            exampleLink.download = 'ejemplo_calculo.txt';
        }
    });
}

async function showARValidationModal(isCorrect, callback) {
    let config = {};
    try { config = JSON.parse(localStorage.getItem('gameConfig') || '{}'); } catch (e) {}
    
    // Validar si hay contenido en Acierto
    const hasContent = config['Acierto'] && (
        (config['Acierto']['Texto'] && config['Acierto']['TextoValor']) ||
        (config['Acierto']['Imagen'] && config['Acierto']['ImagenUrl']) ||
        (config['Acierto']['Audio'] && config['Acierto']['AudioUrl']) ||
        (config['Acierto']['Video'] && config['Acierto']['VideoUrl'])
    );
    
    // Si no hay contenido y la respuesta es incorrecta, no mostrar panel
    if (!hasContent && !isCorrect) {
        if (callback) callback();
        return;
    }

    const mostrarAciertoTexto = config['Acierto'] && config['Acierto']['Texto'] && config['Acierto']['TextoValor'];
    const textoAcierto = mostrarAciertoTexto ? config['Acierto']['TextoValor'] : '';
    
    const mostrarAciertoImagen = config['Acierto'] && config['Acierto']['Imagen'] && config['Acierto']['ImagenUrl'];
    const imagenAcierto = mostrarAciertoImagen ? config['Acierto']['ImagenUrl'] : '';

    const mostrarAciertoAudio = config['Acierto'] && config['Acierto']['Audio'] && config['Acierto']['AudioUrl'];
    const audioAcierto = mostrarAciertoAudio ? config['Acierto']['AudioUrl'] : '';

    const mostrarAciertoVideo = config['Acierto'] && config['Acierto']['Video'] && config['Acierto']['VideoUrl'];
    const videoAcierto = mostrarAciertoVideo ? config['Acierto']['VideoUrl'] : '';

    // Panel de RA para acierto
    const modal = document.createElement('div');
    modal.id = 'ar-acierto-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.85);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 4000;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
        border-radius: 18px;
        max-width: 480px;
        width: 90vw;
        overflow: hidden;
        box-shadow: 0 20px 25px rgba(67,97,238,0.18);
        display: flex;
        flex-direction: column;
        position: relative;
        background: #fff;
        animation: fadeIn 0.7s;
    `;

    // Encabezado
    const header = document.createElement('div');
    header.style.cssText = `
        padding: 1.2rem;
        background: #4361ee;
        color: white;
        text-align: center;
    `;
    header.innerHTML = `<h2 style="margin:0;font-size:1.3rem;">Validación de resultado</h2>`;
    content.appendChild(header);

    // Fondo decorativo y contenido
    const bgContainer = document.createElement('div');
    bgContainer.style.cssText = `
        position: relative;
        min-height: 220px;
        width: 100%;
        background: linear-gradient(135deg, #4361ee 0%, #3a0ca3 100%);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1.2rem;
        padding: 1.2rem 0 1.2rem 0;
    `;
    const bgElements = document.createElement('div');
    bgElements.style.cssText = `
        position: absolute;
        width: 100%; height: 100%;
        background: 
            radial-gradient(circle at 20% 20%, rgba(255,255,255,0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 0%, transparent 50%);
        pointer-events: none;
    `;
    bgContainer.appendChild(bgElements);
    createFloatingSymbols(bgElements);

    // Si la respuesta es correcta, muestra lo configurado
    if (isCorrect) {
        if (mostrarAciertoTexto && textoAcierto) {
            const aciertoText = document.createElement('div');
            aciertoText.style.cssText = `
                color: #ffd60a;
                font-size: 2.2rem;
                font-weight: bold;
                text-shadow: 2px 2px 8px #3a0ca3;
                text-align: center;
                z-index: 16;
                animation: arFloat 3s ease-in-out infinite;
                max-width: 90%;
                margin-bottom: 0.8rem;
            `;
            aciertoText.textContent = textoAcierto;
            bgContainer.appendChild(aciertoText);
        }
        if (mostrarAciertoImagen && imagenAcierto) {
            const img = document.createElement('img');
            img.src = imagenAcierto;
            img.alt = 'Imagen de Acierto';
            img.style.cssText = `
                max-width: 180px;
                max-height: 120px;
                margin-top: 0.2rem;
                border-radius: 12px;
                box-shadow: 0 2px 12px #3a0ca3;
                z-index: 20;
                display: block;
            `;
            bgContainer.appendChild(img);
        }
        if (mostrarAciertoAudio && audioAcierto) {
            const audio = document.createElement('audio');
            audio.src = audioAcierto;
            audio.controls = true;
            audio.autoplay = true;
            audio.style.cssText = `
                margin-bottom: 1rem;
                width: 90%;
                z-index: 20;
            `;
            bgContainer.appendChild(audio);
        }
        if (mostrarAciertoVideo && videoAcierto) {
            const video = document.createElement('video');
            video.src = videoAcierto;
            video.controls = true;
            video.autoplay = true;
            video.style.cssText = `
                max-width: 95vw;
                max-height: 340px;
                width: 100%;
                height: auto;
                margin-bottom: 1rem;
                border-radius: 18px;
                box-shadow: 0 4px 24px #3a0ca3;
                z-index: 20;
                background: #000;
                display: block;
            `;
            bgContainer.appendChild(video);
            bgContainer.style.minHeight = '380px';
        }
    } else {
        // Si la respuesta es incorrecta, solo muestra mensaje motivacional
        const motivText = document.createElement('div');
        motivText.textContent = getMotivationalMessage(false);
        motivText.style.cssText = `
            color: #ffd60a;
            font-size: 2rem;
            font-weight: bold;
            text-shadow: 2px 2px 8px #3a0ca3;
            text-align: center;
            z-index: 16;
            animation: arFloat 3s ease-in-out infinite;
            max-width: 90%;
            margin-bottom: 0.8rem;
        `;
        bgContainer.appendChild(motivText);
    }

    content.appendChild(bgContainer);

    // Botón para avanzar al siguiente ejercicio o finalizar
    const nextBtn = document.createElement('button');
    const isLastExercise = (gameData.currentStep + 1 >= gameData.exercises.length);
    nextBtn.textContent = isLastExercise ? 'Finalizar' : 'Siguiente ejercicio';
    nextBtn.style.cssText = `
        background: #4361ee;
        color: white;
        border: none;
        border-radius: 8px;
        padding: 0.8rem 2rem;
        cursor: pointer;
        font-weight: 600;
        font-size: 1rem;
        margin: 1.5rem auto 1rem auto;
        display: block;
        transition: background 0.3s, transform 0.3s;
    `;
    nextBtn.addEventListener('mouseenter', () => {
        nextBtn.style.background = '#3a0ca3';
        nextBtn.style.transform = 'scale(1.05)';
    });
    nextBtn.addEventListener('mouseleave', () => {
        nextBtn.style.background = '#4361ee';
        nextBtn.style.transform = 'scale(1)';
    });
    nextBtn.addEventListener('click', () => {
        modal.remove();
        if (isLastExercise) {
            showGameCompletedModal(gameData.score);
        } else if (callback) {
            callback();
        }
    });
    content.appendChild(nextBtn);

    // Animación CSS si no existe
    if (!document.getElementById('ar-acierto-anim-style')) {
        const style = document.createElement('style');
        style.id = 'ar-acierto-anim-style';
        style.textContent = `
            @keyframes arFloat {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }

    modal.appendChild(content);
    document.body.appendChild(modal);
}

function showGameCompletedModal(score) {
    (async () => {
        let config = {};
        try { config = JSON.parse(localStorage.getItem('gameConfig') || '{}'); } catch (e) {}
        
        // Validar si hay contenido en Final
        const hasContent = config['Final'] && (
            (config['Final']['Texto'] && config['Final']['TextoValor']) ||
            (config['Final']['Imagen'] && config['Final']['ImagenUrl']) ||
            (config['Final']['Audio'] && config['Final']['AudioUrl']) ||
            (config['Final']['Video'] && config['Final']['VideoUrl'])
        );
        
        // Si no hay contenido, no mostrar el panel RA
        if (!hasContent) return;

        const mostrarFinalTexto = config['Final']['Texto'] && config['Final']['TextoValor'];
        const textoFinal = mostrarFinalTexto ? config['Final']['TextoValor'] : '';
        
        const mostrarFinalImagen = config['Final']['Imagen'] && config['Final']['ImagenUrl'];
        const imagenFinal = mostrarFinalImagen ? config['Final']['ImagenUrl'] : '';

        const mostrarFinalAudio = config['Final']['Audio'] && config['Final']['AudioUrl'];
        const audioFinal = mostrarFinalAudio ? config['Final']['AudioUrl'] : '';

        const mostrarFinalVideo = config['Final']['Video'] && config['Final']['VideoUrl'];
        const videoFinal = mostrarFinalVideo ? config['Final']['VideoUrl'] : '';

        const modal = document.createElement('div');
        modal.id = 'ar-final-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.85);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 4000;
        `;

        const content = document.createElement('div');
        content.style.cssText = `
            border-radius: 24px;
            max-width: 480px;
            width: 90vw;
            overflow: hidden;
            box-shadow: 0 8px 32px #4361ee44;
            display: flex;
            flex-direction: column;
            align-items: center;
            background: #fff;
            animation: fadeIn 0.7s;
            position: relative;
        `;

        // Encabezado
        const header = document.createElement('div');
        header.style.cssText = `
            padding: 1.2rem;
            background: #4361ee;
            color: white;
            text-align: center;
            width: 100%;
        `;
        header.innerHTML = `<h2 style="margin:0;font-size:1.3rem;">¡Juego terminado!</h2>`;
        content.appendChild(header);

        // Fondo decorativo y contenido
        const bgContainer = document.createElement('div');
        bgContainer.style.cssText = `
            position: relative;
            min-height: 220px;
            width: 100%;
            background: linear-gradient(135deg, #4361ee 0%, #3a0ca3 100%);
            overflow: hidden;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 1.2rem;
            padding: 1.2rem 0 1.2rem 0;
        `;
        const bgElements = document.createElement('div');
        bgElements.style.cssText = `
            position: absolute;
            width: 100%; height: 100%;
            background: 
                radial-gradient(circle at 20% 20%, rgba(255,255,255,0.1) 0%, transparent 50%),
                radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 0%, transparent 50%);
            pointer-events: none;
        `;
        bgContainer.appendChild(bgElements);
        createFloatingSymbols(bgElements);

        // Texto arriba, centrado
        if (mostrarFinalTexto && textoFinal) {
            const finalText = document.createElement('div');
            finalText.textContent = textoFinal;
            finalText.style.cssText = `
                color: #ffd60a;
                font-size: 2rem;
                font-weight: bold;
                text-shadow: 2px 2px 8px #3a0ca3;
                text-align: center;
                z-index: 16;
                animation: arFloat 3s ease-in-out infinite;
                max-width: 90%;
                margin-bottom: 0.8rem;
            `;
            bgContainer.appendChild(finalText);
        }

        // Imagen debajo del texto, centrada
        if (mostrarFinalImagen && imagenFinal) {
            const img = document.createElement('img');
            img.src = imagenFinal;
            img.alt = 'Imagen Final';
            img.style.cssText = `
                max-width: 180px;
                max-height: 120px;
                margin-top: 0.2rem;
                border-radius: 12px;
                box-shadow: 0 2px 12px #3a0ca3;
                z-index: 20;
                display: block;
            `;
            bgContainer.appendChild(img);
        }

        // Audio debajo de imagen/texto
        if (mostrarFinalAudio && audioFinal) {
            const audio = document.createElement('audio');
            audio.src = audioFinal;
            audio.controls = true;
            audio.autoplay = true;
            audio.style.cssText = `
                margin-bottom: 1rem;
                width: 90%;
                z-index: 20;
            `;
            bgContainer.appendChild(audio);
        }

        // Video debajo de audio
        if (mostrarFinalVideo && videoFinal) {
            const video = document.createElement('video');
            video.src = videoFinal;
            video.controls = true;
            video.autoplay = true;
            video.style.cssText = `
                max-width: 95vw;
                max-height: 340px;
                width: 100%;
                height: auto;
                margin-bottom: 1rem;
                border-radius: 18px;
                box-shadow: 0 4px 24px #3a0ca3;
                z-index: 20;
                background: #000;
                display: block;
            `;
            bgContainer.appendChild(video);
            bgContainer.style.minHeight = '380px';
        }

        content.appendChild(bgContainer);

        // Mostrar puntuación final
        const scoreText = document.createElement('div');
        scoreText.textContent = `Puntuación final: ${score}`;
        scoreText.style.cssText = `
            color: #4361ee;
            font-size: 1.3rem;
            font-weight: bold;
            margin: 1.2rem 0 0.5rem 0;
            text-align: center;
        `;
        content.appendChild(scoreText);

        // Botón para reiniciar el juego
        const restartBtn = document.createElement('button');
        restartBtn.textContent = 'Reiniciar juego';
        restartBtn.style.cssText = `
            background: #4361ee;
            color: white;
            border: none;
            border-radius: 8px;
            padding: 0.8rem 2rem;
            cursor: pointer;
            font-weight: 600;
            font-size: 1rem;
            margin: 1.5rem auto 1rem auto;
            display: block;
            transition: background 0.3s, transform 0.3s;
        `;
        restartBtn.addEventListener('mouseenter', () => {
            restartBtn.style.background = '#3a0ca3';
            restartBtn.style.transform = 'scale(1.05)';
        });
        restartBtn.addEventListener('mouseleave', () => {
            restartBtn.style.background = '#4361ee';
            restartBtn.style.transform = 'scale(1)';
        });
        restartBtn.addEventListener('click', () => {
            modal.remove();
            location.reload(); // Reinicia la página
        });
        content.appendChild(restartBtn);

        // Animación CSS si no existe
        if (!document.getElementById('ar-final-anim-style')) {
            const style = document.createElement('style');
            style.id = 'ar-final-anim-style';
            style.textContent = `
                @keyframes arFloat {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }

        modal.appendChild(content);
        document.body.appendChild(modal);
    })();
}

function loadExerciseBank() {
    const level = levelSelect.value;
    
    // Verifica que el banco de ejercicios esté cargado
    if (!exerciseBank || exerciseBank.length === 0) {
        console.error('El banco de ejercicios no está cargado');
        availableExercises.textContent = 'Error: No hay ejercicios disponibles';
        return;
    }

    // Filtra los ejercicios por nivel del array cargado
    const filtered = exerciseBank.filter(ej => ej.nivel === level);
    
    if (filtered.length === 0) {
        console.warn(`No hay ejercicios para el nivel ${level}`);
        availableExercises.textContent = 'No hay ejercicios para este nivel';
        gameData.filteredExercises = [];
        return;
    }

    availableExercises.textContent = `Ejercicios disponibles: ${filtered.length}`;
    exerciseCountInput.max = filtered.length;
    
    // Ajusta el número máximo de ejercicios seleccionables
    if (parseInt(exerciseCountInput.value) > filtered.length) {
        exerciseCountInput.value = filtered.length;
    }

    // Guarda el banco filtrado para el juego
    gameData.filteredExercises = filtered;
}

// Llama la función al cargar la página
loadExerciseBank();

levelSelect.addEventListener('change', () => {
    loadExerciseBank();
    // Cambia automáticamente la velocidad según el nivel
    let ms = 500;
    if (levelSelect.value === 'intermedio') ms = 350;
    if (levelSelect.value === 'avanzado') ms = 200;
    displayTime.value = ms;
});

levelSelect.addEventListener('change', loadExerciseBank);

startGameBtn.addEventListener('click', () => {
    // Ajustar velocidad según el nivel
    let displayTime = 500;
 if (levelSelect.value === 'intermedio') displayTime = 300;
    if (levelSelect.value === 'avanzado') displayTime = 200;
    gameData.displayTime = displayTime;
    startGame();
});

backBtn.addEventListener('click', backToGenerator);

// Borra la configuración guardada al recargar la página
window.addEventListener('load', () => {
    localStorage.removeItem('gameConfig');
});

// Nueva función para obtener la URL de la última imagen subida
async function getLastUploadedImageUrl() {
    try {
        const res = await fetch(`${SERVER_URL}/imagenes/ultima`);
        if (!res.ok) return '';
        const data = await res.json();
        return data.url || '';
    } catch (e) {
        return '';
    }
}

async function getLastUploadedAudioUrl() {
    try {
        const res = await fetch(`${SERVER_URL}/audios/ultima`);
        if (!res.ok) return '';
        const data = await res.json();
        return data.url || '';
    } catch (e) {
        return '';
    }
}

async function getLastUploadedVideoUrl() {
    try {
        const res = await fetch(`${SERVER_URL}/videos/ultima`);
        if (!res.ok) return '';
        const data = await res.json();
        return data.url || '';
    } catch (e) {
        return '';
    }
}