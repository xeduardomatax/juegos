// ===== CONFIGURACIÓN DE SERVIDOR =====
// Versión: 2025-12-01 - Actualización de GitHub Pages
// Detecta automáticamente si es local o en línea
const SERVER_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3001'
    : 'https://juegos-o3jk.onrender.com';

// Función para hacer fetch con reintentos automáticos
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, {
                ...options,
                timeout: 30000
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return response;
        } catch (error) {
            lastError = error;
            if (i < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
            }
        }
    }
    throw lastError;
}

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
        align-items: flex-start;
        justify-content: flex-start;
        min-height: 60vh;
        text-align: center;
        gap: 2rem;
        width: 100%;
        padding-left: 2rem;
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

    // Checkboxes de selección de etapas (múltiple selección)
    const stageCheckboxesContainer = document.createElement('div');
    stageCheckboxesContainer.style.cssText = `
        display: flex;
        gap: 1.5rem;
        margin-bottom: 1.5rem;
        justify-content: center;
        width: 100%;
        flex-wrap: wrap;
    `;
    
    const stageIcons = { 'Inicio': '🚀', 'Acierto': '✅', 'Final': '🏁' };
    const stageLetters = { 'Inicio': 'I', 'Acierto': 'A', 'Final': 'F' };
    const stageColors = {
        'Inicio': '#4361ee',
        'Acierto': '#43aa8b',
        'Final': '#ffd60a'
    };
    
    // Objeto para rastrear etapas seleccionadas
    let selectedStages = {};
    stages.forEach(stage => {
        selectedStages[stage] = false;
    });
    
    // Cargar etapas seleccionadas guardadas anteriormente
    const savedSelectedStages = localStorage.getItem('selectedStages');
    if (savedSelectedStages) {
        try {
            const loaded = JSON.parse(savedSelectedStages);
            selectedStages = { ...selectedStages, ...loaded };
        } catch (e) {
            console.log('Error cargando etapas seleccionadas');
        }
    }

    // Contenedor de paneles de configuración
    const configPanelsContainer = document.createElement('div');
    configPanelsContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        width: 100%;
        max-width: 520px;
    `;

    // Definir íconos de tipo
    const typeIcons = { 'Texto': '📝', 'Imagen': '🖼️', 'Audio': '🔊', 'Video': '🎬' };

    // Función para crear el panel de configuración
    function createConfigPanel(stage, selectedTypeParam = 'Texto') {
        const panel = document.createElement('div');
        panel.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
        `;

        // Encabezado
        const header = document.createElement('div');
        header.style.cssText = `
            font-size: 1.3rem;
            font-weight: bold;
            color: ${stageColors[stage]};
            text-align: center;
            padding-bottom: 1rem;
            border-bottom: 2px solid ${stageColors[stage]};
        `;
        header.textContent = `${stageIcons[stage]} Configurar ${stage}`;
        panel.appendChild(header);

        // Contenedor de botones de tipos
        const typeButtonsContainer = document.createElement('div');
        typeButtonsContainer.style.cssText = `
            display: flex;
            gap: 0.8rem;
            justify-content: center;
            flex-wrap: wrap;
        `;

        // Variable para rastrear el tipo seleccionado
        let selectedType = selectedTypeParam;

        // Crear botones de tipos
        const typeButtons = {};
        types.forEach(type => {
            const typeBtn = document.createElement('button');
            typeBtn.textContent = `${typeIcons[type]} ${type}`;
            typeBtn.style.cssText = `
                background: ${type === selectedType ? stageColors[stage] : '#ffffff'};
                color: ${type === selectedType ? 'white' : stageColors[stage]};
                border: 2px solid ${stageColors[stage]};
                border-radius: 10px;
                padding: 0.7rem 1.2rem;
                font-size: 0.95rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s;
                box-shadow: ${type === selectedType ? `0 4px 12px ${stageColors[stage]}40` : 'none'};
            `;

            typeBtn.addEventListener('click', () => {
                selectedType = type;
                // Guardar el tipo seleccionado
                localStorage.setItem(`selectedType_${stage}`, selectedType);
                // Actualizar estilos de botones
                types.forEach(t => {
                    const isSelected = t === selectedType;
                    typeButtons[t].style.background = isSelected ? stageColors[stage] : '#ffffff';
                    typeButtons[t].style.color = isSelected ? 'white' : stageColors[stage];
                    typeButtons[t].style.boxShadow = isSelected ? `0 4px 12px ${stageColors[stage]}40` : 'none';
                });
                // Mostrar solo el contenido del tipo seleccionado
                contentDiv.innerHTML = '';
                loadTypeContent(stage, selectedType, contentDiv);
            });

            typeBtn.addEventListener('mouseenter', () => {
                if (type !== selectedType) {
                    typeBtn.style.background = stageColors[stage] + '15';
                }
            });

            typeBtn.addEventListener('mouseleave', () => {
                if (type !== selectedType) {
                    typeBtn.style.background = '#ffffff';
                }
            });

            typeButtonsContainer.appendChild(typeBtn);
            typeButtons[type] = typeBtn;
        });

        panel.appendChild(typeButtonsContainer);

        // Contenedor para el contenido del tipo seleccionado
        const contentDiv = document.createElement('div');
        contentDiv.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 0.8rem;
        `;

        // Cargar contenido inicial (Texto o el tipo guardado)
        loadTypeContent(stage, selectedType, contentDiv);
        panel.appendChild(contentDiv);

        return panel;
    }

    // Función para cargar contenido específico de cada tipo
    function loadTypeContent(stage, type, container) {
        container.innerHTML = '';

        if (type === 'Texto') {
            const input = document.createElement('input');
            input.type = 'text';
            input.maxLength = 20;
            input.placeholder = 'Escribe aquí (máx. 20 caracteres)';
            input.style.cssText = `
                width: 100%;
                padding: 10px 12px;
                border-radius: 8px;
                border: 1.5px solid #e6eefc;
                font-size: 1rem;
                color: var(--primary);
                text-align: center;
            `;
            input.value = (config[stage] && config[stage]['TextoValor']) ? config[stage]['TextoValor'] : '';
            container.appendChild(input);

            const saveBtn = document.createElement('button');
            saveBtn.textContent = 'Guardar texto';
            saveBtn.style.cssText = `
                background: ${stageColors[stage]};
                color: white;
                border: none;
                border-radius: 8px;
                padding: 0.6rem 1.2rem;
                cursor: pointer;
                font-weight: 600;
                font-size: 0.95rem;
                transition: all 0.3s;
            `;
            saveBtn.addEventListener('click', () => {
                if (!config[stage]) config[stage] = {};
                config[stage]['TextoValor'] = input.value;
                config[stage]['Texto'] = true;
                localStorage.setItem('gameConfig', JSON.stringify(config));
                saveBtn.textContent = '✅ Guardado exitosamente';
                saveBtn.disabled = true;
                setTimeout(() => { 
                    saveBtn.textContent = 'Guardar texto';
                    saveBtn.disabled = false;
                    updateUI();
                }, 3000);
            });
            container.appendChild(saveBtn);

        } else if (type === 'Imagen') {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.jpg,.jpeg,.png,image/jpeg,image/png';
            input.style.cssText = `display: none;`;

            // Contenedor superior con botón y restricciones lado a lado
            const topContainer = document.createElement('div');
            topContainer.style.cssText = `
                display: flex;
                gap: 1rem;
                align-items: flex-start;
            `;

            const examineBtn = document.createElement('button');
            examineBtn.textContent = '📁 Examinar';
            examineBtn.style.cssText = `
                background: linear-gradient(135deg, ${stageColors[stage]} 0%, ${stageColors[stage]}dd 100%);
                color: white;
                border: none;
                border-radius: 8px;
                padding: 0.6rem 1rem;
                cursor: pointer;
                font-weight: 600;
                font-size: 0.85rem;
                transition: all 0.3s;
                box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                white-space: nowrap;
                flex-shrink: 0;
            `;
            examineBtn.addEventListener('click', () => input.click());
            topContainer.appendChild(examineBtn);

            const restrictionsDiv = document.createElement('div');
            restrictionsDiv.style.cssText = `
                background: #f0f0f0;
                padding: 0.6rem 0.8rem;
                border-radius: 8px;
                font-size: 0.85rem;
                color: #666;
                text-align: left;
                flex-grow: 1;
                border-left: 3px solid ${stageColors[stage]};
            `;
            restrictionsDiv.innerHTML = `📸 Formatos: .jpg, .jpeg, .png<br>⚖️ Máximo: 5 MB`;
            topContainer.appendChild(restrictionsDiv);

            container.appendChild(input);
            container.appendChild(topContainer);

            // Contenedor de previsualización
            const previewDiv = document.createElement('div');
            previewDiv.style.cssText = `
                display: none;
                text-align: center;
                padding: 1rem;
                background: #f9f9f9;
                border-radius: 8px;
                border: 2px dashed ${stageColors[stage]};
            `;
            container.appendChild(previewDiv);

            const uploadBtn = document.createElement('button');
            uploadBtn.textContent = 'Guardar';
            uploadBtn.style.cssText = `
                background: linear-gradient(90deg, #43aa8b 60%, ${stageColors[stage]} 100%);
                color: white;
                border: none;
                border-radius: 12px;
                padding: 0.6rem 1.5rem;
                cursor: pointer;
                font-weight: 600;
                font-size: 0.95rem;
                transition: all 0.3s;
            `;
            container.appendChild(uploadBtn);

            let selectedFile = null;
            
            // Función para mostrar previsualización
            function showImagePreview(imageSrc, fileName = null) {
                previewDiv.innerHTML = `<strong style="color: ${stageColors[stage]};">Vista previa:</strong><br><img src="${imageSrc}" style="max-width: 200px; max-height: 120px; border-radius: 8px; margin-top: 0.8rem;">`;
                previewDiv.style.display = 'block';
                if (fileName) {
                    examineBtn.textContent = '✅ Seleccionado';
                }
            }
            
            // Mostrar imagen guardada si existe
            if (config[stage] && config[stage]['ImagenUrl']) {
                showImagePreview(config[stage]['ImagenUrl']);
            }
            
            input.addEventListener('change', () => {
                const file = input.files[0];
                selectedFile = file;
                if (!file) return;
                const validTypes = ['image/jpeg', 'image/png'];
                const validExt = /\.(jpg|jpeg|png)$/i;
                if (!validTypes.includes(file.type) || !validExt.test(file.name)) {
                    alert('Solo .jpg, .jpeg o .png');
                    input.value = '';
                    selectedFile = null;
                    return;
                }
                if (file.size > 5 * 1024 * 1024) {
                    alert('Máximo 5 MB');
                    input.value = '';
                    selectedFile = null;
                    return;
                }
                const reader = new FileReader();
                reader.onload = (e) => {
                    showImagePreview(e.target.result, file.name);
                };
                reader.readAsDataURL(file);
            });

            uploadBtn.addEventListener('click', () => {
                if (!selectedFile) {
                    alert('Selecciona una imagen primero');
                    return;
                }
                const formData = new FormData();
                formData.append('image', selectedFile);
                uploadBtn.disabled = true;
                uploadBtn.textContent = 'Guardando...';
                
                fetchWithRetry(`${SERVER_URL}/upload-image`, { method: 'POST', body: formData })
                    .then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            uploadBtn.textContent = '✅ Guardado exitosamente';
                            uploadBtn.disabled = true;
                            if (!config[stage]) config[stage] = {};
                            config[stage]['ImagenUrl'] = data.url || '';
                            config[stage]['Imagen'] = true;
                            localStorage.setItem('gameConfig', JSON.stringify(config));
                            uploadBtn.textContent = '✅ Guardado exitosamente';
                            uploadBtn.disabled = true;
                            setTimeout(() => {
                                uploadBtn.textContent = 'Guardar';
                                uploadBtn.disabled = false;
                                updateUI();
                            }, 3000);
                        }
                    })
                    .catch(err => {
                        alert('Error al guardar');
                        uploadBtn.disabled = false;
                        uploadBtn.textContent = 'Guardar';
                    });
            });

        } else if (type === 'Audio') {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.mp3,audio/mp3';
            input.style.cssText = `display: none;`;

            // Contenedor superior con botón y restricciones lado a lado
            const topContainer = document.createElement('div');
            topContainer.style.cssText = `
                display: flex;
                gap: 1rem;
                align-items: flex-start;
            `;

            const examineBtn = document.createElement('button');
            examineBtn.textContent = '📁 Examinar';
            examineBtn.style.cssText = `
                background: linear-gradient(135deg, ${stageColors[stage]} 0%, ${stageColors[stage]}dd 100%);
                color: white;
                border: none;
                border-radius: 8px;
                padding: 0.6rem 1rem;
                cursor: pointer;
                font-weight: 600;
                font-size: 0.85rem;
                transition: all 0.3s;
                box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                white-space: nowrap;
                flex-shrink: 0;
            `;
            examineBtn.addEventListener('click', () => input.click());
            topContainer.appendChild(examineBtn);

            const restrictionsDiv = document.createElement('div');
            restrictionsDiv.style.cssText = `
                background: #f0f0f0;
                padding: 0.6rem 0.8rem;
                border-radius: 8px;
                font-size: 0.85rem;
                color: #666;
                text-align: left;
                flex-grow: 1;
                border-left: 3px solid ${stageColors[stage]};
            `;
            restrictionsDiv.innerHTML = `🔊 Formato: .mp3<br>⚖️ Máximo: 3 MB`;
            topContainer.appendChild(restrictionsDiv);

            container.appendChild(input);
            container.appendChild(topContainer);

            // Contenedor de previsualización
            const previewDiv = document.createElement('div');
            previewDiv.style.cssText = `
                display: none;
                text-align: center;
                padding: 1rem;
                background: #f9f9f9;
                border-radius: 8px;
                border: 2px dashed ${stageColors[stage]};
                font-size: 0.9rem;
            `;
            
            // Crear elemento de audio para reproducción
            const audioPlayer = document.createElement('audio');
            audioPlayer.controls = true;
            audioPlayer.style.cssText = `
                width: 100%;
                margin: 0.8rem 0;
                border-radius: 8px;
            `;
            
            const previewInfo = document.createElement('div');
            previewInfo.style.cssText = `
                margin: 0.5rem 0;
                color: ${stageColors[stage]};
                font-weight: 600;
            `;
            
            previewDiv.appendChild(previewInfo);
            previewDiv.appendChild(audioPlayer);
            container.appendChild(previewDiv);

            const uploadBtn = document.createElement('button');
            uploadBtn.textContent = 'Guardar';
            uploadBtn.style.cssText = `
                background: linear-gradient(90deg, #43aa8b 60%, ${stageColors[stage]} 100%);
                color: white;
                border: none;
                border-radius: 12px;
                padding: 0.6rem 1.5rem;
                cursor: pointer;
                font-weight: 600;
                font-size: 0.95rem;
                transition: all 0.3s;
            `;
            container.appendChild(uploadBtn);

            let selectedFile = null;
            
            // Función para mostrar previsualización de audio
            function showAudioPreview(audioUrl, fileName = null) {
                previewInfo.innerHTML = fileName || '🔊 Audio guardado';
                audioPlayer.src = audioUrl;
                previewDiv.style.display = 'block';
                if (fileName) {
                    examineBtn.textContent = '✅ Seleccionado';
                }
            }
            
            // Mostrar audio guardado si existe
            if (config[stage] && config[stage]['AudioUrl']) {
                showAudioPreview(config[stage]['AudioUrl']);
            }
            
            input.addEventListener('change', () => {
                const file = input.files[0];
                selectedFile = file;
                if (!file) return;
                const validTypes = ['audio/mp3', 'audio/mpeg'];
                const validExt = /\.(mp3)$/i;
                if (!validTypes.includes(file.type) || !validExt.test(file.name)) {
                    alert('Solo .mp3');
                    input.value = '';
                    selectedFile = null;
                    return;
                }
                if (file.size > 3 * 1024 * 1024) {
                    alert('Máximo 3 MB');
                    input.value = '';
                    selectedFile = null;
                    return;
                }
                const fileSize = (file.size / 1024 / 1024).toFixed(2);
                showAudioPreview(URL.createObjectURL(file), `🔊 ${file.name} (${fileSize} MB)`);
            });

            uploadBtn.addEventListener('click', () => {
                if (!selectedFile) {
                    alert('Selecciona un audio primero');
                    return;
                }
                const formData = new FormData();
                formData.append('audio', selectedFile);
                uploadBtn.disabled = true;
                uploadBtn.textContent = 'Guardando...';
                
                fetchWithRetry(`${SERVER_URL}/upload-audio`, { method: 'POST', body: formData })
                    .then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            uploadBtn.textContent = '✅ Guardado exitosamente';
                            uploadBtn.disabled = true;
                            if (!config[stage]) config[stage] = {};
                            config[stage]['AudioUrl'] = data.url || '';
                            config[stage]['Audio'] = true;
                            localStorage.setItem('gameConfig', JSON.stringify(config));
                            setTimeout(() => {
                                uploadBtn.textContent = 'Guardar';
                                uploadBtn.disabled = false;
                                updateUI();
                            }, 3000);
                        }
                    })
                    .catch(() => {
                        alert('Error al guardar');
                        uploadBtn.disabled = false;
                        uploadBtn.textContent = 'Guardar';
                    });
            });

        } else if (type === 'Video') {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.mp4,video/mp4';
            input.style.cssText = `display: none;`;

            // Contenedor superior con botón y restricciones lado a lado
            const topContainer = document.createElement('div');
            topContainer.style.cssText = `
                display: flex;
                gap: 1rem;
                align-items: flex-start;
            `;

            const examineBtn = document.createElement('button');
            examineBtn.textContent = '📁 Examinar';
            examineBtn.style.cssText = `
                background: linear-gradient(135deg, ${stageColors[stage]} 0%, ${stageColors[stage]}dd 100%);
                color: white;
                border: none;
                border-radius: 8px;
                padding: 0.6rem 1rem;
                cursor: pointer;
                font-weight: 600;
                font-size: 0.85rem;
                transition: all 0.3s;
                box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                white-space: nowrap;
                flex-shrink: 0;
            `;
            examineBtn.addEventListener('click', () => input.click());
            topContainer.appendChild(examineBtn);

            const restrictionsDiv = document.createElement('div');
            restrictionsDiv.style.cssText = `
                background: #f0f0f0;
                padding: 0.6rem 0.8rem;
                border-radius: 8px;
                font-size: 0.85rem;
                color: #666;
                text-align: left;
                flex-grow: 1;
                border-left: 3px solid ${stageColors[stage]};
            `;
            restrictionsDiv.innerHTML = `🎬 Formato: .mp4<br>⚖️ Máximo: 10 MB`;
            topContainer.appendChild(restrictionsDiv);

            container.appendChild(input);
            container.appendChild(topContainer);

            // Contenedor de previsualización
            const previewDiv = document.createElement('div');
            previewDiv.style.cssText = `
                display: none;
                text-align: center;
                padding: 1rem;
                background: #f9f9f9;
                border-radius: 8px;
                border: 2px dashed ${stageColors[stage]};
                font-size: 0.9rem;
            `;
            
            // Crear elemento de video para reproducción
            const videoPlayer = document.createElement('video');
            videoPlayer.controls = true;
            videoPlayer.style.cssText = `
                width: 100%;
                max-height: 200px;
                margin: 0.8rem 0;
                border-radius: 8px;
                background: #000;
            `;
            
            const previewInfo = document.createElement('div');
            previewInfo.style.cssText = `
                margin: 0.5rem 0;
                color: ${stageColors[stage]};
                font-weight: 600;
            `;
            
            previewDiv.appendChild(previewInfo);
            previewDiv.appendChild(videoPlayer);
            container.appendChild(previewDiv);

            const uploadBtn = document.createElement('button');
            uploadBtn.textContent = 'Guardar';
            uploadBtn.style.cssText = `
                background: linear-gradient(90deg, #43aa8b 60%, ${stageColors[stage]} 100%);
                color: white;
                border: none;
                border-radius: 12px;
                padding: 0.6rem 1.5rem;
                cursor: pointer;
                font-weight: 600;
                font-size: 0.95rem;
                transition: all 0.3s;
            `;
            container.appendChild(uploadBtn);

            let selectedFile = null;
            
            // Función para mostrar previsualización de video
            function showVideoPreview(videoUrl, fileName = null) {
                previewInfo.innerHTML = fileName || '🎬 Video guardado';
                videoPlayer.src = videoUrl;
                previewDiv.style.display = 'block';
                if (fileName) {
                    examineBtn.textContent = '✅ Seleccionado';
                }
            }
            
            // Mostrar video guardado si existe
            if (config[stage] && config[stage]['VideoUrl']) {
                showVideoPreview(config[stage]['VideoUrl']);
            }
            
            input.addEventListener('change', () => {
                const file = input.files[0];
                selectedFile = file;
                if (!file) return;
                const validTypes = ['video/mp4'];
                const validExt = /\.(mp4)$/i;
                if (!validTypes.includes(file.type) || !validExt.test(file.name)) {
                    alert('Solo .mp4');
                    input.value = '';
                    selectedFile = null;
                    return;
                }
                if (file.size > 10 * 1024 * 1024) {
                    alert('Máximo 10 MB');
                    input.value = '';
                    selectedFile = null;
                    return;
                }
                const fileSize = (file.size / 1024 / 1024).toFixed(2);
                showVideoPreview(URL.createObjectURL(file), `🎬 ${file.name} (${fileSize} MB)`);
            });

            uploadBtn.addEventListener('click', () => {
                if (!selectedFile) {
                    alert('Selecciona un video primero');
                    return;
                }
                const formData = new FormData();
                formData.append('video', selectedFile);
                uploadBtn.disabled = true;
                uploadBtn.textContent = 'Guardando...';
                
                fetchWithRetry(`${SERVER_URL}/upload-video`, { method: 'POST', body: formData })
                    .then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            uploadBtn.textContent = '✅ Guardado exitosamente';
                            uploadBtn.disabled = true;
                            if (!config[stage]) config[stage] = {};
                            config[stage]['VideoUrl'] = data.url || '';
                            config[stage]['Video'] = true;
                            localStorage.setItem('gameConfig', JSON.stringify(config));
                            setTimeout(() => {
                                uploadBtn.textContent = 'Guardar';
                                uploadBtn.disabled = false;
                                updateUI();
                            }, 3000);
                        }
                    })
                    .catch(() => {
                        alert('Error al guardar');
                        uploadBtn.disabled = false;
                        uploadBtn.textContent = 'Guardar';
                    });
            });
        }
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
            input.style.cssText = `display: none;`;
            inputPanel.appendChild(input);

            // Contenedor para examinar y restricciones
            const fileControlsContainer = document.createElement('div');
            fileControlsContainer.style.cssText = `
                display: flex;
                flex-direction: column;
                gap: 0.8rem;
                width: 100%;
                align-items: center;
                margin-top: 0.5rem;
            `;

            // Botón de examinar con diseño mejorado
            const examineBtn = document.createElement('button');
            examineBtn.textContent = '📁 Examinar archivo';
            examineBtn.style.cssText = `
                background: linear-gradient(135deg, #4361ee 0%, #3a0ca3 100%);
                color: white;
                border: none;
                border-radius: 12px;
                padding: 0.8rem 1.5rem;
                cursor: pointer;
                font-weight: 600;
                font-size: 1rem;
                transition: all 0.3s;
                box-shadow: 0 4px 12px rgba(67, 97, 238, 0.3);
                display: flex;
                align-items: center;
                gap: 0.5rem;
                justify-content: center;
                width: 100%;
                max-width: 280px;
            `;
            examineBtn.addEventListener('mouseenter', () => {
                examineBtn.style.transform = 'translateY(-2px)';
                examineBtn.style.boxShadow = '0 6px 16px rgba(67, 97, 238, 0.4)';
            });
            examineBtn.addEventListener('mouseleave', () => {
                examineBtn.style.transform = 'translateY(0)';
                examineBtn.style.boxShadow = '0 4px 12px rgba(67, 97, 238, 0.3)';
            });
            examineBtn.addEventListener('click', () => input.click());

            // Restricciones al lado del botón
            const restrictionBox = document.createElement('div');
            restrictionBox.style.cssText = `
                background: linear-gradient(135deg, #e0e7ff 0%, #ede9fe 100%);
                color: #2c3e50;
                border-radius: 12px;
                padding: 0.8rem 1.2rem;
                font-size: 0.95rem;
                border-left: 4px solid #4361ee;
                width: 100%;
                max-width: 280px;
            `;
            restrictionBox.innerHTML = `
                <strong style="color: #4361ee;">Restricciones:</strong><br>
                <span style="font-size: 0.9rem;">📸 .jpg, .jpeg, .png</span><br>
                <span style="font-size: 0.9rem;">⚖️ Máximo: 5 MB</span>
            `;

            fileControlsContainer.appendChild(examineBtn);
            fileControlsContainer.appendChild(restrictionBox);
            inputPanel.appendChild(fileControlsContainer);

            // Preview container
            const previewContainer = document.createElement('div');
            previewContainer.id = `preview-${stage}-imagen`;
            previewContainer.style.cssText = `
                width: 100%;
                height: auto;
                margin-top: 1rem;
                display: none;
                text-align: center;
            `;
            inputPanel.appendChild(previewContainer);

            inputPanel.appendChild(errorMsg);

            const uploadBtn = document.createElement('button');
            uploadBtn.textContent = 'Guardar';
            uploadBtn.style.cssText = `
                margin-top: 1rem;
                background: linear-gradient(90deg, #43aa8b 60%, #4361ee 100%);
                color: white;
                border: none;
                border-radius: 12px;
                padding: 0.7rem 2rem;
                cursor: pointer;
                font-weight: 600;
                font-size: 1rem;
                transition: all 0.3s;
                box-shadow: 0 4px 12px rgba(67, 152, 139, 0.3);
            `;
            uploadBtn.addEventListener('mouseenter', () => {
                uploadBtn.style.transform = 'translateY(-2px)';
                uploadBtn.style.boxShadow = '0 6px 16px rgba(67, 152, 139, 0.4)';
            });
            uploadBtn.addEventListener('mouseleave', () => {
                uploadBtn.style.transform = 'translateY(0)';
                uploadBtn.style.boxShadow = '0 4px 12px rgba(67, 152, 139, 0.3)';
            });
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
                // Mostrar preview
                const reader = new FileReader();
                reader.onload = (e) => {
                    previewContainer.innerHTML = `
                        <img src="${e.target.result}" style="max-width: 200px; max-height: 150px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">
                    `;
                    previewContainer.style.display = 'block';
                    examineBtn.textContent = '✅ Archivo seleccionado';
                };
                reader.readAsDataURL(file);
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
                uploadBtn.textContent = 'Guardando...';
                
                fetchWithRetry(`${SERVER_URL}/upload-image`, {
                    method: 'POST',
                    body: formData
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        uploadBtn.textContent = '✅ Guardado';
                        uploadBtn.style.background = 'linear-gradient(90deg, #43aa8b 60%, #2a9d6f 100%)';
                        if (!config[stage]) config[stage] = {};
                        config[stage]['ImagenUrl'] = data.url || '';
                        config[stage]['Imagen'] = true;
                        localStorage.setItem('gameConfig', JSON.stringify(config));
                        
                        setTimeout(() => {
                            uploadBtn.textContent = 'Guardar';
                            uploadBtn.style.background = 'linear-gradient(90deg, #43aa8b 60%, #4361ee 100%)';
                            uploadBtn.disabled = false;
                        }, 1500);
                    } else {
                        errorMsg.textContent = 'Error al guardar: ' + (data.error || 'Error desconocido');
                        errorMsg.style.display = 'block';
                        uploadBtn.disabled = false;
                        uploadBtn.textContent = 'Guardar';
                    }
                })
                .catch(err => {
                    console.error('Error:', err);
                    errorMsg.textContent = 'No se pudo conectar. Verifica tu conexión.';
                    errorMsg.style.display = 'block';
                    uploadBtn.disabled = false;
                    uploadBtn.textContent = 'Guardar';
                });
            });
        } else if (type === 'Audio') {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.mp3,audio/mp3';
            input.style.cssText = `display: none;`;
            inputPanel.appendChild(input);

            // Contenedor para examinar y restricciones
            const fileControlsContainer = document.createElement('div');
            fileControlsContainer.style.cssText = `
                display: flex;
                flex-direction: column;
                gap: 0.8rem;
                width: 100%;
                align-items: center;
                margin-top: 0.5rem;
            `;

            // Botón de examinar con diseño mejorado
            const examineBtn = document.createElement('button');
            examineBtn.textContent = '📁 Examinar archivo';
            examineBtn.style.cssText = `
                background: linear-gradient(135deg, #4361ee 0%, #3a0ca3 100%);
                color: white;
                border: none;
                border-radius: 12px;
                padding: 0.8rem 1.5rem;
                cursor: pointer;
                font-weight: 600;
                font-size: 1rem;
                transition: all 0.3s;
                box-shadow: 0 4px 12px rgba(67, 97, 238, 0.3);
                display: flex;
                align-items: center;
                gap: 0.5rem;
                justify-content: center;
                width: 100%;
                max-width: 280px;
            `;
            examineBtn.addEventListener('mouseenter', () => {
                examineBtn.style.transform = 'translateY(-2px)';
                examineBtn.style.boxShadow = '0 6px 16px rgba(67, 97, 238, 0.4)';
            });
            examineBtn.addEventListener('mouseleave', () => {
                examineBtn.style.transform = 'translateY(0)';
                examineBtn.style.boxShadow = '0 4px 12px rgba(67, 97, 238, 0.3)';
            });
            examineBtn.addEventListener('click', () => input.click());

            // Restricciones al lado del botón
            const restrictionBox = document.createElement('div');
            restrictionBox.style.cssText = `
                background: linear-gradient(135deg, #e0e7ff 0%, #ede9fe 100%);
                color: #2c3e50;
                border-radius: 12px;
                padding: 0.8rem 1.2rem;
                font-size: 0.95rem;
                border-left: 4px solid #4361ee;
                width: 100%;
                max-width: 280px;
            `;
            restrictionBox.innerHTML = `
                <strong style="color: #4361ee;">Restricciones:</strong><br>
                <span style="font-size: 0.9rem;">🔊 Solo .mp3</span><br>
                <span style="font-size: 0.9rem;">⚖️ Máximo: 3 MB</span>
            `;

            fileControlsContainer.appendChild(examineBtn);
            fileControlsContainer.appendChild(restrictionBox);
            inputPanel.appendChild(fileControlsContainer);

            // Preview container
            const previewContainer = document.createElement('div');
            previewContainer.id = `preview-${stage}-audio`;
            previewContainer.style.cssText = `
                width: 100%;
                height: auto;
                margin-top: 1rem;
                display: none;
                text-align: center;
            `;
            inputPanel.appendChild(previewContainer);

            inputPanel.appendChild(errorMsg);

            const uploadBtn = document.createElement('button');
            uploadBtn.textContent = 'Guardar';
            uploadBtn.style.cssText = `
                margin-top: 1rem;
                background: linear-gradient(90deg, #43aa8b 60%, #4361ee 100%);
                color: white;
                border: none;
                border-radius: 12px;
                padding: 0.7rem 2rem;
                cursor: pointer;
                font-weight: 600;
                font-size: 1rem;
                transition: all 0.3s;
                box-shadow: 0 4px 12px rgba(67, 152, 139, 0.3);
            `;
            uploadBtn.addEventListener('mouseenter', () => {
                uploadBtn.style.transform = 'translateY(-2px)';
                uploadBtn.style.boxShadow = '0 6px 16px rgba(67, 152, 139, 0.4)';
            });
            uploadBtn.addEventListener('mouseleave', () => {
                uploadBtn.style.transform = 'translateY(0)';
                uploadBtn.style.boxShadow = '0 4px 12px rgba(67, 152, 139, 0.3)';
            });
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
                // Mostrar preview
                const fileSize = (file.size / 1024 / 1024).toFixed(2);
                previewContainer.innerHTML = `
                    <div style="background: linear-gradient(135deg, #e0e7ff 0%, #ede9fe 100%); border-radius: 12px; padding: 1rem; border-left: 4px solid #4361ee;">
                        <div style="font-size: 2rem; margin-bottom: 0.5rem;">🔊</div>
                        <div style="font-weight: bold; color: #2c3e50;">${file.name}</div>
                        <div style="font-size: 0.9rem; color: #666; margin-top: 0.3rem;">${fileSize} MB</div>
                    </div>
                `;
                previewContainer.style.display = 'block';
                examineBtn.textContent = '✅ Archivo seleccionado';
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
                uploadBtn.textContent = 'Guardando...';
                
                fetchWithRetry(`${SERVER_URL}/upload-audio`, {
                    method: 'POST',
                    body: formData
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        uploadBtn.textContent = '✅ Guardado';
                        uploadBtn.style.background = 'linear-gradient(90deg, #43aa8b 60%, #2a9d6f 100%)';
                        if (!config[stage]) config[stage] = {};
                        config[stage]['AudioUrl'] = data.url || '';
                        config[stage]['Audio'] = true;
                        localStorage.setItem('gameConfig', JSON.stringify(config));
                        
                        setTimeout(() => {
                            uploadBtn.textContent = 'Guardar';
                            uploadBtn.style.background = 'linear-gradient(90deg, #43aa8b 60%, #4361ee 100%)';
                            uploadBtn.disabled = false;
                        }, 1500);
                    } else {
                        errorMsg.textContent = 'Error al guardar: ' + (data.error || 'Error desconocido');
                        errorMsg.style.display = 'block';
                        uploadBtn.disabled = false;
                        uploadBtn.textContent = 'Guardar';
                    }
                })
                .catch(err => {
                    console.error('Error:', err);
                    errorMsg.textContent = 'No se pudo conectar. Verifica tu conexión.';
                    errorMsg.style.display = 'block';
                    uploadBtn.disabled = false;
                    uploadBtn.textContent = 'Guardar';
                });
            });
        } else if (type === 'Video') {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.mp4,video/mp4';
            input.style.cssText = `display: none;`;
            inputPanel.appendChild(input);

            // Contenedor para examinar y restricciones
            const fileControlsContainer = document.createElement('div');
            fileControlsContainer.style.cssText = `
                display: flex;
                flex-direction: column;
                gap: 0.8rem;
                width: 100%;
                align-items: center;
                margin-top: 0.5rem;
            `;

            // Botón de examinar con diseño mejorado
            const examineBtn = document.createElement('button');
            examineBtn.textContent = '📁 Examinar archivo';
            examineBtn.style.cssText = `
                background: linear-gradient(135deg, #4361ee 0%, #3a0ca3 100%);
                color: white;
                border: none;
                border-radius: 12px;
                padding: 0.8rem 1.5rem;
                cursor: pointer;
                font-weight: 600;
                font-size: 1rem;
                transition: all 0.3s;
                box-shadow: 0 4px 12px rgba(67, 97, 238, 0.3);
                display: flex;
                align-items: center;
                gap: 0.5rem;
                justify-content: center;
                width: 100%;
                max-width: 280px;
            `;
            examineBtn.addEventListener('mouseenter', () => {
                examineBtn.style.transform = 'translateY(-2px)';
                examineBtn.style.boxShadow = '0 6px 16px rgba(67, 97, 238, 0.4)';
            });
            examineBtn.addEventListener('mouseleave', () => {
                examineBtn.style.transform = 'translateY(0)';
                examineBtn.style.boxShadow = '0 4px 12px rgba(67, 97, 238, 0.3)';
            });
            examineBtn.addEventListener('click', () => input.click());

            // Restricciones al lado del botón
            const restrictionBox = document.createElement('div');
            restrictionBox.style.cssText = `
                background: linear-gradient(135deg, #e0e7ff 0%, #ede9fe 100%);
                color: #2c3e50;
                border-radius: 12px;
                padding: 0.8rem 1.2rem;
                font-size: 0.95rem;
                border-left: 4px solid #4361ee;
                width: 100%;
                max-width: 280px;
            `;
            restrictionBox.innerHTML = `
                <strong style="color: #4361ee;">Restricciones:</strong><br>
                <span style="font-size: 0.9rem;">🎬 Solo .mp4</span><br>
                <span style="font-size: 0.9rem;">⚖️ Máximo: 10 MB</span>
            `;

            fileControlsContainer.appendChild(examineBtn);
            fileControlsContainer.appendChild(restrictionBox);
            inputPanel.appendChild(fileControlsContainer);

            // Preview container
            const previewContainer = document.createElement('div');
            previewContainer.id = `preview-${stage}-video`;
            previewContainer.style.cssText = `
                width: 100%;
                height: auto;
                margin-top: 1rem;
                display: none;
                text-align: center;
            `;
            inputPanel.appendChild(previewContainer);

            inputPanel.appendChild(errorMsg);

            const uploadBtn = document.createElement('button');
            uploadBtn.textContent = 'Guardar';
            uploadBtn.style.cssText = `
                margin-top: 1rem;
                background: linear-gradient(90deg, #43aa8b 60%, #4361ee 100%);
                color: white;
                border: none;
                border-radius: 12px;
                padding: 0.7rem 2rem;
                cursor: pointer;
                font-weight: 600;
                font-size: 1rem;
                transition: all 0.3s;
                box-shadow: 0 4px 12px rgba(67, 152, 139, 0.3);
            `;
            uploadBtn.addEventListener('mouseenter', () => {
                uploadBtn.style.transform = 'translateY(-2px)';
                uploadBtn.style.boxShadow = '0 6px 16px rgba(67, 152, 139, 0.4)';
            });
            uploadBtn.addEventListener('mouseleave', () => {
                uploadBtn.style.transform = 'translateY(0)';
                uploadBtn.style.boxShadow = '0 4px 12px rgba(67, 152, 139, 0.3)';
            });
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
                // Mostrar preview
                const fileSize = (file.size / 1024 / 1024).toFixed(2);
                previewContainer.innerHTML = `
                    <div style="background: linear-gradient(135deg, #e0e7ff 0%, #ede9fe 100%); border-radius: 12px; padding: 1rem; border-left: 4px solid #4361ee;">
                        <div style="font-size: 2rem; margin-bottom: 0.5rem;">🎬</div>
                        <div style="font-weight: bold; color: #2c3e50;">${file.name}</div>
                        <div style="font-size: 0.9rem; color: #666; margin-top: 0.3rem;">${fileSize} MB</div>
                    </div>
                `;
                previewContainer.style.display = 'block';
                examineBtn.textContent = '✅ Archivo seleccionado';
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
                uploadBtn.textContent = 'Guardando...';
                
                fetchWithRetry(`${SERVER_URL}/upload-video`, {
                    method: 'POST',
                    body: formData
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        uploadBtn.textContent = '✅ Guardado';
                        uploadBtn.style.background = 'linear-gradient(90deg, #43aa8b 60%, #2a9d6f 100%)';
                        if (!config[stage]) config[stage] = {};
                        config[stage]['VideoUrl'] = data.url || '';
                        config[stage]['Video'] = true;
                        localStorage.setItem('gameConfig', JSON.stringify(config));
                        
                        setTimeout(() => {
                            uploadBtn.textContent = 'Guardar';
                            uploadBtn.style.background = 'linear-gradient(90deg, #43aa8b 60%, #4361ee 100%)';
                            uploadBtn.disabled = false;
                        }, 1500);
                    } else {
                        errorMsg.textContent = 'Error al guardar: ' + (data.error || 'Error desconocido');
                        errorMsg.style.display = 'block';
                        uploadBtn.disabled = false;
                        uploadBtn.textContent = 'Guardar';
                    }
                })
                .catch(err => {
                    console.error('Error:', err);
                    errorMsg.textContent = 'No se pudo conectar. Verifica tu conexión.';
                    errorMsg.style.display = 'block';
                    uploadBtn.disabled = false;
                    uploadBtn.textContent = 'Guardar';
                });
            });
        }
    }

    // Crear checkboxes para seleccionar múltiples etapas
    stages.forEach(stage => {
        const checkboxWrapper = document.createElement('label');
        checkboxWrapper.style.cssText = `
            display: flex;
            align-items: center;
            gap: 0.8rem;
            padding: 0.8rem 1.2rem;
            background: #ffffff;
            border: 2.5px solid ${stageColors[stage]};
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.3s;
            user-select: none;
            font-weight: 600;
            color: ${stageColors[stage]};
            font-size: 1rem;
        `;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = selectedStages[stage];
        checkbox.style.cssText = `
            width: 20px;
            height: 20px;
            cursor: pointer;
            accent-color: ${stageColors[stage]};
        `;

        const label = document.createElement('span');
        label.textContent = `${stageIcons[stage]} ${stage}`;

        checkboxWrapper.appendChild(checkbox);
        checkboxWrapper.appendChild(label);

        checkbox.addEventListener('change', () => {
            selectedStages[stage] = checkbox.checked;
            checkboxWrapper.style.background = checkbox.checked ? stageColors[stage] + '20' : '#ffffff';
            checkboxWrapper.style.boxShadow = checkbox.checked ? `0 4px 12px ${stageColors[stage]}40` : 'none';
            updateUI();
        });

        checkboxWrapper.addEventListener('mouseenter', () => {
            checkboxWrapper.style.transform = 'translateY(-2px)';
        });
        checkboxWrapper.addEventListener('mouseleave', () => {
            checkboxWrapper.style.transform = 'translateY(0)';
        });

        stageCheckboxesContainer.appendChild(checkboxWrapper);
    });

    // Variable para rastrear la etapa actualmente visible
    let currentVisibleStage = null;

    // Contenedor para botones-etiquetas de navegación (dentro del panel)
    const stageLabelButtonsContainer = document.createElement('div');
    stageLabelButtonsContainer.style.cssText = `
        display: flex;
        gap: 0.6rem;
        position: absolute;
        top: 1.2rem;
        left: 1.2rem;
    `;

    // Crear botones-etiquetas (I, A, F)
    const labelButtons = {};
    stages.forEach(stage => {
        const labelBtn = document.createElement('button');
        labelBtn.textContent = stageLetters[stage];
        labelBtn.style.cssText = `
            background: ${stageColors[stage]};
            color: white;
            border: none;
            width: 40px;
            height: 40px;
            border-radius: 8px;
            font-weight: 700;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.3s;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            display: none;
        `;
        labelBtn.addEventListener('click', () => {
            currentVisibleStage = stage;
            // Limpiar el tipo seleccionado para esta etapa para que abra en Texto
            localStorage.removeItem(`selectedType_${stage}`);
            updateUI();
        });
        labelBtn.addEventListener('mouseenter', () => {
            labelBtn.style.transform = 'scale(1.1)';
            labelBtn.style.boxShadow = `0 4px 12px ${stageColors[stage]}60`;
        });
        labelBtn.addEventListener('mouseleave', () => {
            labelBtn.style.transform = 'scale(1)';
            labelBtn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
        });
        stageLabelButtonsContainer.appendChild(labelBtn);
        labelButtons[stage] = labelBtn;
    });

    // Panel único de configuración
    const configPanel = document.createElement('div');
    configPanel.style.cssText = `
        background: white;
        border-radius: 16px;
        padding: 2rem;
        width: 520px;
        max-width: 100%;
        box-shadow: 0 4px 16px rgba(67, 97, 238, 0.2);
        animation: fadeIn 0.4s;
        position: relative;
        min-height: 300px;
        padding-top: 4rem;
        margin-left: 0;
    `;
    configPanel.appendChild(stageLabelButtonsContainer);

    // Función para actualizar la UI
    function updateUI() {
        // Actualizar visibilidad de botones-etiquetas
        let hasSelectedStages = false;
        stages.forEach(stage => {
            const shouldShow = selectedStages[stage];
            labelButtons[stage].style.display = shouldShow ? 'block' : 'none';
            if (shouldShow) hasSelectedStages = true;
        });

        // Verificar si hay al menos una etapa con contenido configurado
        let hasAnyConfiguredStage = false;
        stages.forEach(stage => {
            const hasContent = config[stage] && (
                (config[stage]['Texto'] && config[stage]['TextoValor']) ||
                (config[stage]['Imagen'] && config[stage]['ImagenUrl']) ||
                (config[stage]['Audio'] && config[stage]['AudioUrl']) ||
                (config[stage]['Video'] && config[stage]['VideoUrl'])
            );
            if (hasContent) hasAnyConfiguredStage = true;
        });

        // Mostrar/ocultar y activar/desactivar botón de guardar
        saveButton.style.display = hasSelectedStages ? 'block' : 'none';
        saveButton.disabled = !hasAnyConfiguredStage;
        saveButton.style.opacity = hasAnyConfiguredStage ? '1' : '0.5';
        saveButton.style.cursor = hasAnyConfiguredStage ? 'pointer' : 'not-allowed';

        // Si no hay etapas seleccionadas, limpiar panel
        if (!hasSelectedStages) {
            configPanel.innerHTML = '<p style="text-align: center; color: #999;">Selecciona una etapa para comenzar</p>';
            currentVisibleStage = null;
            configPanelsContainer.innerHTML = '';
            return;
        }

        // Si la etapa actual visible ya no está seleccionada, cambiar a la primera disponible
        if (!selectedStages[currentVisibleStage]) {
            currentVisibleStage = stages.find(s => selectedStages[s]);
        }

        // Si aún no hay etapa visible, asignar la primera disponible
        if (!currentVisibleStage) {
            currentVisibleStage = stages.find(s => selectedStages[s]);
        }

        // Actualizar panel con la etapa actual
        configPanel.innerHTML = '';
        
        // Recrear botones-etiquetas
        stageLabelButtonsContainer.innerHTML = '';
        stages.forEach(stage => {
            if (selectedStages[stage]) {
                labelButtons[stage].style.display = 'block';
                stageLabelButtonsContainer.appendChild(labelButtons[stage]);
            }
        });
        
        configPanel.appendChild(stageLabelButtonsContainer);
        
        // Restaurar el tipo seleccionado guardado en localStorage, o usar Texto por defecto
        const savedSelectedType = localStorage.getItem(`selectedType_${currentVisibleStage}`) || 'Texto';
        configPanel.appendChild(createConfigPanel(currentVisibleStage, savedSelectedType));

        // Mostrar el panel
        configPanelsContainer.innerHTML = '';
        configPanelsContainer.appendChild(configPanel);

        // Actualizar estilos de botones-etiquetas
        stages.forEach(stage => {
            if (stage === currentVisibleStage) {
                labelButtons[stage].style.opacity = '1';
                labelButtons[stage].style.boxShadow = `0 4px 12px ${stageColors[stage]}60`;
            } else if (selectedStages[stage]) {
                labelButtons[stage].style.opacity = '0.6';
                labelButtons[stage].style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
            }
        });
    }

    // Botón para guardar toda la configuración (DEBE SER ANTES DE updateUI())
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
        cursor: not-allowed;
        box-shadow: 0 8px 24px rgba(67, 97, 238, 0.25);
        transition: transform 0.3s, background 0.3s, opacity 0.3s;
        margin: 1.5rem auto 0 auto;
        display: none;
        align-self: center;
        opacity: 0.5;
    `;
    saveButton.disabled = true;

    // Inicializar UI (sin etapas seleccionadas inicialmente)
    updateUI();
    saveButton.addEventListener('mouseenter', () => {
        if (!saveButton.disabled) {
            saveButton.style.transform = 'scale(1.05)';
        }
    });
    saveButton.addEventListener('mouseleave', () => {
        saveButton.style.transform = 'scale(1)';
    });
    // Referencia temporal al botón de inicio - YA NO SE USA
    let startButtonRef = null;
    
    saveButton.addEventListener('click', () => {
        // Validar que todas las etapas seleccionadas tengan al menos una configuración
        let validationError = '';
        
        stages.forEach(stage => {
            if (selectedStages[stage]) {
                // Verificar si la etapa tiene al menos un tipo de contenido configurado
                const hasContent = config[stage] && (
                    (config[stage]['Texto'] && config[stage]['TextoValor']) ||
                    (config[stage]['Imagen'] && config[stage]['ImagenUrl']) ||
                    (config[stage]['Audio'] && config[stage]['AudioUrl']) ||
                    (config[stage]['Video'] && config[stage]['VideoUrl'])
                );
                
                if (!hasContent) {
                    validationError += `\n• ${stage}: Debes configurar al menos un contenido (texto, imagen, audio o video)`;
                }
            }
        });
        
        // Si hay errores de validación, mostrar alerta
        if (validationError) {
            alert('❌ No puedes guardar la configuración:\n' + validationError);
            return;
        }
        
        localStorage.setItem('gameConfig', JSON.stringify(config));
        localStorage.setItem('selectedStages', JSON.stringify(selectedStages));
        saveButton.textContent = '✅ Guardado exitosamente';
        saveButton.disabled = true;
        
        setTimeout(() => {
            saveButton.textContent = '💾 Guardar Configuración';
            saveButton.disabled = false;
            // Mostrar pantalla de resumen después de guardar
            waitingScreen.remove();
            showConfigurationSummary(config);
        }, 3000);
    });

    // Botón para volver
    const backButton = document.createElement('button');
    backButton.textContent = '← Volver';
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
        backButton.style.background = '#4361ee';
        backButton.style.color = 'white';
    });
    backButton.addEventListener('mouseleave', () => {
        backButton.style.background = 'transparent';
        backButton.style.color = '#4361ee';
    });
    backButton.addEventListener('click', () => {
        waitingScreen.remove();
        generatorScreen.classList.remove('hidden');
    });

    // Ensamblar la pantalla
    contentContainer.appendChild(title);
    contentContainer.appendChild(subtitle);
    contentContainer.appendChild(stageCheckboxesContainer);
    contentContainer.appendChild(configPanelsContainer);
    contentContainer.appendChild(saveButton);
    contentContainer.appendChild(backButton);
    waitingScreen.appendChild(contentContainer);

    // Insertar la pantalla en el DOM
    const appContainer = document.querySelector('.app-container');
    appContainer.appendChild(waitingScreen);
}

// Nueva función: Mostrar resumen de configuración
function showConfigurationSummary(config) {
    const summaryScreen = document.createElement('div');
    summaryScreen.style.cssText = `
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
        gap: 1.5rem;
        width: 100%;
    `;

    // Título
    const title = document.createElement('h2');
    title.textContent = '📋 Resumen de Configuración - Cálculo Mental RA';
    title.style.cssText = `
        color: var(--secondary);
        font-size: 2rem;
        margin: 0 auto;
        text-shadow: 0 2px 8px #e0e7ff;
        animation: bounceIn 0.8s ease-out;
        text-align: center;
        width: 100%;
    `;

    // Subtítulo
    const subtitle = document.createElement('h3');
    subtitle.textContent = 'Aquí está todo lo que configuraste';
    subtitle.style.cssText = `
        color: var(--primary);
        font-size: 1.1rem;
        margin: 0;
        font-weight: 500;
        animation: fadeIn 0.8s ease-out 0.2s both;
        text-align: center;
        width: 100%;
    `;

    // Contenedor de tarjetas de configuración
    const cardsContainer = document.createElement('div');
    cardsContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 1.2rem;
        width: 100%;
        max-width: 500px;
    `;

    // Función para crear una tarjeta de etapa
    function createStageCard(stageName, stageIcon) {
        const card = document.createElement('div');
        card.style.cssText = `
            background: linear-gradient(135deg, #f8f9ff 0%, #ede9fe 100%);
            border-radius: 16px;
            padding: 1.5rem;
            border-left: 6px solid;
            box-shadow: 0 4px 12px rgba(67, 97, 238, 0.15);
            animation: fadeIn 0.6s ease-out;
        `;

        // Establecer color del borde según etapa
        if (stageName === 'Inicio') card.style.borderLeftColor = '#4361ee';
        else if (stageName === 'Acierto') card.style.borderLeftColor = '#43aa8b';
        else if (stageName === 'Final') card.style.borderLeftColor = '#ffd60a';

        // Encabezado de la tarjeta
        const cardHeader = document.createElement('div');
        cardHeader.style.cssText = `
            font-size: 1.3rem;
            font-weight: bold;
            color: var(--secondary);
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            justify-content: center;
        `;
        cardHeader.innerHTML = `${stageIcon} ${stageName}`;

        // Contenedor de contenidos
        const contentsList = document.createElement('div');
        contentsList.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 0.8rem;
            text-align: left;
        `;

        const stageConfig = config[stageName];
        let hasContent = false;

        // Verificar y mostrar texto
        if (stageConfig && stageConfig['Texto'] && stageConfig['TextoValor']) {
            const textDiv = document.createElement('div');
            textDiv.style.cssText = `
                background: white;
                padding: 0.8rem 1rem;
                border-radius: 8px;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            `;
            textDiv.innerHTML = `<span style="font-size: 1.2rem;">📝</span> <strong>Texto:</strong> <span style="color: #666;">"${stageConfig['TextoValor']}"</span>`;
            contentsList.appendChild(textDiv);
            hasContent = true;
        }

        // Verificar y mostrar imagen
        if (stageConfig && stageConfig['Imagen'] && stageConfig['ImagenUrl']) {
            const imageDiv = document.createElement('div');
            imageDiv.style.cssText = `
                background: white;
                padding: 0.8rem 1rem;
                border-radius: 8px;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            `;
            imageDiv.innerHTML = `<span style="font-size: 1.2rem;">🖼️</span> <strong>Imagen:</strong> <span style="color: #666;">Configurada ✓</span>`;
            contentsList.appendChild(imageDiv);
            hasContent = true;
        }

        // Verificar y mostrar audio
        if (stageConfig && stageConfig['Audio'] && stageConfig['AudioUrl']) {
            const audioDiv = document.createElement('div');
            audioDiv.style.cssText = `
                background: white;
                padding: 0.8rem 1rem;
                border-radius: 8px;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            `;
            audioDiv.innerHTML = `<span style="font-size: 1.2rem;">🔊</span> <strong>Audio:</strong> <span style="color: #666;">Configurado ✓</span>`;
            contentsList.appendChild(audioDiv);
            hasContent = true;
        }

        // Verificar y mostrar video
        if (stageConfig && stageConfig['Video'] && stageConfig['VideoUrl']) {
            const videoDiv = document.createElement('div');
            videoDiv.style.cssText = `
                background: white;
                padding: 0.8rem 1rem;
                border-radius: 8px;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            `;
            videoDiv.innerHTML = `<span style="font-size: 1.2rem;">🎬</span> <strong>Video:</strong> <span style="color: #666;">Configurado ✓</span>`;
            contentsList.appendChild(videoDiv);
            hasContent = true;
        }

        // Si no hay contenido, mostrar mensaje
        if (!hasContent) {
            const noContentDiv = document.createElement('div');
            noContentDiv.style.cssText = `
                background: #fff;
                padding: 0.8rem 1rem;
                border-radius: 8px;
                color: #999;
                text-align: center;
                font-style: italic;
            `;
            noContentDiv.textContent = 'Sin contenido configurado';
            contentsList.appendChild(noContentDiv);
        }

        card.appendChild(cardHeader);
        card.appendChild(contentsList);
        return card;
    }

    // Agregar tarjetas para cada etapa
    cardsContainer.appendChild(createStageCard('Inicio', '🚀'));
    cardsContainer.appendChild(createStageCard('Acierto', '✅'));
    cardsContainer.appendChild(createStageCard('Final', '🏁'));

    // Botón para comenzar el juego
    const startGameBtn = document.createElement('button');
    startGameBtn.textContent = '▶️ Comenzar juego';
    startGameBtn.style.cssText = `
        background: linear-gradient(90deg, #4361ee 60%, #43aa8b 100%);
        color: white;
        border: none;
        padding: 1rem 2.5rem;
        border-radius: 18px;
        font-size: 1.2rem;
        font-weight: 700;
        cursor: pointer;
        box-shadow: 0 8px 24px rgba(67, 97, 238, 0.3);
        transition: transform 0.3s, background 0.3s;
        margin-top: 1.5rem;
        display: block;
        align-self: center;
    `;
    startGameBtn.addEventListener('mouseenter', () => {
        startGameBtn.style.transform = 'scale(1.05)';
        startGameBtn.style.boxShadow = '0 12px 32px rgba(67, 97, 238, 0.4)';
    });
    startGameBtn.addEventListener('mouseleave', () => {
        startGameBtn.style.transform = 'scale(1)';
        startGameBtn.style.boxShadow = '0 8px 24px rgba(67, 97, 238, 0.3)';
    });
    startGameBtn.addEventListener('click', () => {
        summaryScreen.remove();
        gameScreen.classList.remove('hidden');
        let configData = {};
        try {
            configData = JSON.parse(localStorage.getItem('gameConfig') || '{}');
        } catch (e) {}
        if (
            configData['Inicio'] &&
            (configData['Inicio']['Texto'] ||
             configData['Inicio']['Imagen'] ||
             configData['Inicio']['Audio'] ||
             configData['Inicio']['Video'])
        ) {
            showInstructionsModal();
        } else {
            displayAROperation();
        }
    });

    // Botón para volver a la configuración de RA
    const editButton = document.createElement('button');
    editButton.textContent = '← Volver';
    editButton.style.cssText = `
        background: transparent;
        color: var(--primary);
        border: 2px solid var(--primary);
        padding: 0.8rem 2rem;
        border-radius: 18px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s;
        margin-top: 0.5rem;
        display: block;
        align-self: center;
    `;
    editButton.addEventListener('mouseenter', () => {
        editButton.style.background = '#4361ee';
        editButton.style.color = 'white';
    });
    editButton.addEventListener('mouseleave', () => {
        editButton.style.background = 'transparent';
        editButton.style.color = '#4361ee';
    });
    editButton.addEventListener('click', () => {
        summaryScreen.remove();
        showWaitingScreen();
    });

    // Ensamblar la interfaz
    contentContainer.appendChild(title);
    contentContainer.appendChild(subtitle);
    contentContainer.appendChild(cardsContainer);
    contentContainer.appendChild(startGameBtn);
    contentContainer.appendChild(editButton);
    summaryScreen.appendChild(contentContainer);

    // Insertar en el DOM
    const appContainer = document.querySelector('.app-container');
    appContainer.appendChild(summaryScreen);
}

function backToGenerator() {
    // Ya no es necesario detener la cámara
    arStream = null;
    gameScreen.classList.add('hidden');
    generatorScreen.classList.remove('hidden');

    // Limpiar pantallas modales que puedan estar abiertas
    const modals = document.querySelectorAll('[id*="modal"]');
    modals.forEach(modal => {
        if (modal && modal.parentNode) {
            modal.remove();
        }
    });

    // Limpiar pantalla de espera si existe
    const waitingScreen = document.getElementById('waiting-screen');
    if (waitingScreen && waitingScreen.parentNode) {
        waitingScreen.remove();
    }

    // Limpiar pantalla de resumen si existe
    const summaryScreens = document.querySelectorAll('div[style*="background: white"]');
    summaryScreens.forEach(screen => {
        if (screen.style.animation && screen.style.animation.includes('fadeIn')) {
            screen.remove();
        }
    });

    // Reiniciar datos del juego
    gameData.currentStep = 0;
    gameData.score = 0;
    gameData.exercises = [];
    gameData.filteredExercises = [];

    // Limpiar elementos de la pantalla del juego
    operationDisplay.textContent = '';
    optionsContainer.innerHTML = '';
    validateContainer.innerHTML = '';
    scoreDisplay.textContent = 'Puntuación: 0';

    // Reiniciar valores por defecto
    levelSelect.value = 'basico';
    exerciseCountInput.value = '1';
    
    // Recargar los ejercicios del nivel básico
    loadExerciseBank();

    // Remover configuración guardada
    localStorage.removeItem('gameConfig');
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