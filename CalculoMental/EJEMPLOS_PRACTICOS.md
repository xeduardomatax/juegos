# 💻 EJEMPLOS PRÁCTICOS Y CÓDIGO COMENTADO

## Tabla de Contenidos
1. [Ejemplo: Sistema de Dificultad Completo](#ejemplo-sistema-de-dificultad-completo)
2. [Ejemplo: Flujo Completo del Juego](#ejemplo-flujo-completo-del-juego)
3. [Ejemplo: Configuración de RA](#ejemplo-configuración-de-ra)
4. [Ejemplo: JSON de Ejercicios](#ejemplo-json-de-ejercicios)
5. [Casos de Uso](#casos-de-uso)

---

## Ejemplo: Sistema de Dificultad Completo

### Paso 1: Estructura HTML

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Calculadora Mental</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="app-container">
        <!-- PANTALLA DE CONFIGURACIÓN -->
        <div id="generator-screen">
            <h1>🧮 Cálculo Mental</h1>
            
            <!-- SELECCIÓN DE DIFICULTAD -->
            <div class="level-section">
                <label for="level-select">
                    <strong>📊 Selecciona nivel de dificultad:</strong>
                </label>
                <select id="level-select">
                    <option value="basico">
                        Básico (Sumas y Restas)
                    </option>
                    <option value="intermedio">
                        Intermedio (Sumas, Restas y Divisiones)
                    </option>
                    <option value="avanzado">
                        Avanzado (Todas las operaciones)
                    </option>
                </select>
                <span id="available-exercises"></span>
            </div>

            <!-- SELECCIÓN DE CANTIDAD -->
            <div class="exercise-count-section">
                <label for="exercise-count">
                    <strong>📝 ¿Cuántos ejercicios quieres hacer?</strong>
                </label>
                <select id="exercise-count">
                    <option value="1">1 ejercicio</option>
                    <option value="2">2 ejercicios</option>
                    <option value="3">3 ejercicios</option>
                    <option value="4">4 ejercicios</option>
                    <option value="5">5 ejercicios</option>
                </select>
            </div>

            <!-- BOTÓN INICIAR -->
            <div id="game-options">
                <button id="startGameBtn">✨ Siguiente</button>
            </div>
        </div>

        <!-- PANTALLA DEL JUEGO -->
        <div id="game-screen" class="hidden">
            <h1>🧮 Cálculo Mental</h1>
            <div id="operation-display"></div>
            <div id="options-container"></div>
            <div id="validate"></div>
            <div id="score-display">Puntuación: 0</div>
            <button id="back-btn">Volver al Generador</button>
        </div>
    </div>

    <script src="script.js"></script>
</body>
</html>
```

### Paso 2: Código JavaScript Comentado

```javascript
// ===== PASO 1: VARIABLES GLOBALES =====
const gameData = {
    operation: '',              // "3,+2,-1,+4"
    options: [],                // [{text: "6", isCorrect: true}, ...]
    currentStep: 0,             // Qué ejercicio estamos en (0, 1, 2, ...)
    score: 0,                   // Puntuación total
    exercises: [],              // Todos los ejercicios a resolver
    filteredExercises: []       // Ejercicios del nivel seleccionado
};

// Referencias a elementos HTML
const levelSelect = document.getElementById('level-select');
const exerciseCountInput = document.getElementById('exercise-count');
const startGameBtn = document.getElementById('startGameBtn');
const availableExercises = document.getElementById('available-exercises');
const generatorScreen = document.getElementById('generator-screen');
const gameScreen = document.getElementById('game-screen');

// Banco global de ejercicios (cargado desde JSON)
let exerciseBank = [];

// ===== PASO 2: CARGAR EJERCICIOS =====
function initializeGame() {
    return fetch('ejercicios.json')
        .then(res => {
            // Validar respuesta HTTP
            if (!res.ok) {
                throw new Error(`Error HTTP: ${res.status}`);
            }
            return res.json();
        })
        .then(json => {
            // Validar que JSON sea un array válido
            if (!Array.isArray(json) || json.length === 0) {
                throw new Error('JSON vacío o inválido');
            }

            // Guardar en memoria
            exerciseBank = json;
            
            // Extraer niveles únicos: ["basico", "intermedio", "avanzado"]
            const niveles = [...new Set(exerciseBank.map(ej => ej.nivel))];
            
            if (niveles.length === 0) {
                throw new Error('No hay niveles disponibles');
            }

            // Llenar select de niveles
            levelSelect.innerHTML = '';
            niveles.forEach(nivel => {
                const option = document.createElement('option');
                option.value = nivel;
                option.textContent = nivel.charAt(0).toUpperCase() + nivel.slice(1);
                levelSelect.appendChild(option);
            });

            // Habilitar botón
            startGameBtn.disabled = false;
            
            // Cargar ejercicios del primer nivel por defecto
            loadExerciseBank();
        })
        .catch(error => {
            console.error('Error al cargar ejercicios:', error);
            availableExercises.textContent = '❌ Error al cargar ejercicios';
            startGameBtn.disabled = true;
        });
}

// ===== PASO 3: FILTRAR EJERCICIOS POR NIVEL =====
function loadExerciseBank() {
    // Obtener nivel seleccionado del dropdown
    const selectedLevel = levelSelect.value;
    
    console.log(`Filtrando ejercicios para nivel: ${selectedLevel}`);
    
    // Filtrar: solo mantener ejercicios del nivel seleccionado
    gameData.filteredExercises = exerciseBank.filter(ej => ej.nivel === selectedLevel);
    
    // Mostrar cuántos hay disponibles
    const count = gameData.filteredExercises.length;
    availableExercises.textContent = `✅ ${count} ejercicios disponibles para ${selectedLevel}`;
    
    console.log(`Ejercicios disponibles: ${count}`);
}

// Escuchar cambios en el select de nivel
levelSelect.addEventListener('change', loadExerciseBank);

// ===== PASO 4: VALIDAR CANTIDAD SELECCIONADA =====
function startGame() {
    // 1. Obtener cantidad seleccionada
    const count = parseInt(exerciseCountInput.value) || 1;
    console.log(`El usuario seleccionó ${count} ejercicio(s)`);
    
    // 2. Validar que hay ejercicios disponibles
    if (!gameData.filteredExercises || gameData.filteredExercises.length === 0) {
        alert('❌ No hay ejercicios disponibles para este nivel');
        return;
    }
    
    // 3. Mezclar los ejercicios aleatoriamente
    const shuffled = gameData.filteredExercises.sort(() => Math.random() - 0.5);
    console.log(`Ejercicios después de mezclar: ${shuffled.length}`);
    
    // 4. Seleccionar solo N ejercicios
    const selectedExercises = shuffled.slice(0, Math.min(count, shuffled.length));
    console.log(`Ejercicios seleccionados: ${selectedExercises.length}`);
    
    // 5. Validar que hay ejercicios
    if (selectedExercises.length === 0) {
        alert('❌ No hay suficientes ejercicios');
        return;
    }
    
    // 6. Configurar estado del juego
    gameData.currentStep = 0;       // Empezar en ejercicio 0
    gameData.score = 0;             // Puntuación desde 0
    gameData.exercises = selectedExercises;
    gameData.operation = selectedExercises[0].operation;
    gameData.options = selectedExercises[0].options;
    
    console.log(`Ejercicios a resolver: ${gameData.exercises.length}`);
    console.log(`Ejercicio 1: ${gameData.operation}`);
    
    // 7. Cambiar a pantalla de juego
    generatorScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    
    // 8. Mostrar primer ejercicio
    displayAROperation();
}

// Asignar evento al botón "Siguiente"
startGameBtn.addEventListener('click', startGame);

// ===== PASO 5: INICIALIZAR AL CARGAR PÁGINA =====
window.addEventListener('DOMContentLoaded', () => {
    initializeGame();
});
```

### Paso 3: Estilos CSS

```css
/* Variables de color */
:root {
    --primary: #4361ee;
    --secondary: #3a0ca3;
    --success: #4cc9f0;
    --danger: #f72585;
}

/* Contenedor principal */
.app-container {
    background: white;
    border-radius: 16px;
    box-shadow: 0 8px 24px rgba(67, 97, 238, 0.12);
    padding: 2.5rem 2rem;
    width: 100%;
    max-width: 600px;
}

/* Secciones de selección */
.level-section, 
.exercise-count-section {
    background: linear-gradient(90deg, #e0e7ff 60%, #f8f9fa 100%);
    border-radius: 16px;
    box-shadow: 0 2px 8px #4361ee22;
    padding: 1rem 1.5rem;
    margin-bottom: 1.2rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

/* Etiquetas */
label {
    color: var(--secondary);
    font-weight: bold;
    font-size: 1.1rem;
}

/* Selectores */
select {
    padding: 0.7rem;
    border: 2px solid var(--primary);
    border-radius: 12px;
    font-size: 1.1rem;
    background: #f5faff;
    transition: border 0.2s;
    margin-bottom: 0.5rem;
}

select:focus {
    border-color: var(--success);
    background: #e0e7ff;
    outline: none;
}

/* Botón */
button {
    background: linear-gradient(90deg, var(--primary) 60%, var(--success) 100%);
    color: white;
    border: none;
    padding: 0.9rem 1.7rem;
    border-radius: 18px;
    cursor: pointer;
    font-weight: 700;
    font-size: 1.1rem;
    box-shadow: 0 2px 8px #4361ee33;
    transition: transform 0.15s;
}

button:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 16px #4361ee44;
}

button:active {
    transform: translateY(-2px);
}

/* Clase oculta */
.hidden {
    display: none !important;
}
```

---

## Ejemplo: Flujo Completo del Juego

### Visualización del Flujo

```
┌─────────────────────────────────────────────────────────────┐
│                   PANTALLA 1: CONFIGURACIÓN                 │
│                                                             │
│  📊 Selecciona nivel de dificultad:                        │
│  ┌─────────────────────────────────────┐                  │
│  │ ▼ Básico (Sumas y Restas)          │                  │
│  └─────────────────────────────────────┘                  │
│  ✅ 45 ejercicios disponibles                             │
│                                                             │
│  📝 ¿Cuántos ejercicios quieres hacer?                    │
│  ┌─────────────────────────────────────┐                  │
│  │ ▼ 3 ejercicios                     │                  │
│  └─────────────────────────────────────┘                  │
│                                                             │
│              ┌──────────────────────┐                       │
│              │    ✨ Siguiente      │                       │
│              └──────────────────────┘                       │
│                                                             │
│  Estado: gameData.currentStep = 0, gameData.score = 0    │
└─────────────────────────────────────────────────────────────┘
              │ (Usuario presiona "Siguiente")
              ▼
┌─────────────────────────────────────────────────────────────┐
│               PANTALLA 2: JUEGO (EJERCICIO 1/3)            │
│                                                             │
│                    🧮 Cálculo Mental                       │
│                                                             │
│                         3                                   │
│                                                             │
│  ┌──────────────┬──────────────┬──────────────┐           │
│  │      5       │      7       │      6       │           │
│  └──────────────┴──────────────┴──────────────┘           │
│                                                             │
│            ┌─────────────────────────────┐                │
│            │  Validar resultado          │                │
│            └─────────────────────────────┘                │
│                  Puntuación: 0                             │
│                                                             │
│  Estado: gameData.currentStep = 0, operación = "3,+2"   │
└─────────────────────────────────────────────────────────────┘
              │ (Usuario selecciona 5 y presiona validar)
              ▼
┌─────────────────────────────────────────────────────────────┐
│            MODAL: VALIDACIÓN (Panel de RA)                 │
│                                                             │
│    ╔════════════════════════════════════╗                 │
│    ║     Validación de resultado        ║                 │
│    ╠════════════════════════════════════╣                 │
│    ║                                    ║                 │
│    ║     ¡No te desanimes!              ║  (Incorrect)   │
│    ║                                    ║                 │
│    ║     × + ÷ -  = ÷ + ×              ║  (Decorativo)   │
│    ║                                    ║                 │
│    ║  ┌──────────────────────────────┐  ║                 │
│    ║  │  Siguiente ejercicio         │  ║                 │
│    ║  └──────────────────────────────┘  ║                 │
│    ║                                    ║                 │
│    ╚════════════════════════════════════╝                 │
│                                                             │
│  Estado: gameData.currentStep = 0, puntuación sin cambios │
└─────────────────────────────────────────────────────────────┘
              │ (Usuario presiona "Siguiente ejercicio")
              ▼
┌─────────────────────────────────────────────────────────────┐
│               PANTALLA 3: JUEGO (EJERCICIO 2/3)            │
│                                                             │
│                    🧮 Cálculo Mental                       │
│                                                             │
│                    ¡Listo! Puedes responder               │
│                                                             │
│  ┌──────────────┬──────────────┬──────────────┐           │
│  │      12      │      10      │      8       │           │
│  └──────────────┴──────────────┴──────────────┘           │
│                                                             │
│            ┌─────────────────────────────┐                │
│            │  Validar resultado          │                │
│            └─────────────────────────────┘                │
│                  Puntuación: 0                             │
│                                                             │
│  Estado: gameData.currentStep = 1, nueva operación       │
└─────────────────────────────────────────────────────────────┘
              │ (Usuario selecciona 10 - CORRECTA y valida)
              ▼
┌─────────────────────────────────────────────────────────────┐
│            MODAL: VALIDACIÓN (Panel de RA)                 │
│                                                             │
│    ╔════════════════════════════════════╗                 │
│    ║     Validación de resultado        ║                 │
│    ╠════════════════════════════════════╣                 │
│    ║                                    ║                 │
│    ║     ¡Excelente! ¡Respuesta        ║  (Correct)      │
│    ║     correcta!                      ║                 │
│    ║                                    ║                 │
│    ║     × + ÷ -  = ÷ + ×              ║  (Decorativo)   │
│    ║                                    ║                 │
│    ║  ┌──────────────────────────────┐  ║                 │
│    ║  │  Siguiente ejercicio         │  ║                 │
│    ║  └──────────────────────────────┘  ║                 │
│    ║                                    ║                 │
│    ╚════════════════════════════════════╝                 │
│                                                             │
│  Estado: gameData.currentStep = 1, puntuación = 10       │
└─────────────────────────────────────────────────────────────┘
              │ (Usuario presiona siguiente)
              ▼
┌─────────────────────────────────────────────────────────────┐
│               PANTALLA 4: JUEGO (EJERCICIO 3/3)            │
│   ... (repetir proceso para ejercicio 3) ...              │
│   ... (al terminar, puntuación final = 20) ...            │
└─────────────────────────────────────────────────────────────┘
              │ (Usuario completa el ejercicio 3)
              ▼
┌─────────────────────────────────────────────────────────────┐
│            MODAL: JUEGO COMPLETADO (Panel Final)           │
│                                                             │
│    ╔════════════════════════════════════╗                 │
│    ║      ¡Juego terminado!             ║                 │
│    ╠════════════════════════════════════╣                 │
│    ║                                    ║                 │
│    ║   Puntuación Final: 20 puntos     ║                 │
│    ║                                    ║                 │
│    ║   [Contenido configurado aquí]     ║                 │
│    ║                                    ║                 │
│    ║  ┌──────────────────────────────┐  ║                 │
│    ║  │  Volver al Menú             │  ║                 │
│    ║  └──────────────────────────────┘  ║                 │
│    ║                                    ║                 │
│    ╚════════════════════════════════════╝                 │
│                                                             │
│  Estado: gameData.currentStep = 3, juego finalizado      │
└─────────────────────────────────────────────────────────────┘
```

### Código de Visualización

```javascript
// FUNCIÓN: Mostrar operación
function displayAROperation() {
    console.log(`\n=== EJERCICIO ${gameData.currentStep + 1}/${gameData.exercises.length} ===`);
    
    // Verificar si ya terminó
    if (gameData.currentStep >= gameData.exercises.length) {
        console.log('✅ Todos los ejercicios completados');
        showGameCompletedModal(gameData.score);
        return;
    }

    // Obtener ejercicio actual
    const ejercicio = gameData.exercises[gameData.currentStep];
    console.log(`Operación: ${ejercicio.operation}`);
    console.log(`Opciones: ${ejercicio.options.map(o => `${o.text} (${o.isCorrect ? 'correcta' : 'incorrecta'})`).join(', ')}`);
    
    gameData.operation = ejercicio.operation;
    gameData.options = ejercicio.options;

    // Mostrar operación lentamente
    const parts = ejercicio.operation.split(',');
    let index = 0;

    function mostrarParte() {
        if (index < parts.length) {
            document.getElementById('operation-display').textContent = parts[index];
            console.log(`Mostrando: ${parts[index]}`);
            index++;
            setTimeout(() => {
                document.getElementById('operation-display').textContent = '';
                setTimeout(mostrarParte, 1000);
            }, 1000);
        } else {
            document.getElementById('operation-display').textContent = '¡Listo! Puedes responder.';
            showOptions();
        }
    }

    mostrarParte();
}

// FUNCIÓN: Mostrar opciones
function showOptions() {
    console.log('Mostrando opciones...');
    const container = document.getElementById('options-container');
    container.innerHTML = '';

    gameData.options.forEach((option, i) => {
        const btn = document.createElement('button');
        btn.textContent = option.text;
        btn.addEventListener('click', () => {
            console.log(`Usuario seleccionó: ${option.text} (${option.isCorrect ? 'correcta' : 'incorrecta'})`);
            validarRespuesta(option);
        });
        container.appendChild(btn);
    });
}

// FUNCIÓN: Validar respuesta
function validarRespuesta(option) {
    if (option.isCorrect) {
        console.log('✅ ¡CORRECTO! +10 puntos');
        gameData.score += 10;
    } else {
        console.log('❌ Respuesta incorrecta');
    }

    console.log(`Puntuación actual: ${gameData.score}`);
    
    // Mostrar modal de validación
    showARValidationModal(option.isCorrect, () => {
        gameData.currentStep++;
        
        if (gameData.currentStep < gameData.exercises.length) {
            // Siguiente ejercicio
            displayAROperation();
        } else {
            // Fin del juego
            console.log(`🎉 ¡JUEGO TERMINADO! Puntuación final: ${gameData.score}`);
            showGameCompletedModal(gameData.score);
        }
    });
}
```

---

## Ejemplo: Configuración de RA

### Estructura de LocalStorage

```javascript
// Estructura guardada en localStorage bajo la clave "gameConfig"
const gameConfig = {
    "Inicio": {
        // El docente quiere mostrar instrucciones al inicio
        "Texto": true,
        "TextoValor": "¡Bienvenido! Lee cada operación cuidadosamente.",
        
        "Imagen": true,
        "ImagenUrl": "https://servidor.com/imagenes/inicio.jpg",
        
        "Audio": false,
        "AudioUrl": "",
        
        "Video": false,
        "VideoUrl": ""
    },
    
    "Acierto": {
        // El docente quiere celebrar aciertos con contenido
        "Texto": true,
        "TextoValor": "¡FELICITACIONES! ¡Respuesta correcta!",
        
        "Imagen": true,
        "ImagenUrl": "https://servidor.com/imagenes/estrella.png",
        
        "Audio": true,
        "AudioUrl": "https://servidor.com/audios/aplausos.mp3",
        
        "Video": false,
        "VideoUrl": ""
    },
    
    "Final": {
        // El docente quiere mostrar resumen al final
        "Texto": true,
        "TextoValor": "¡Juego completado! Puntuación final: 30 puntos",
        
        "Imagen": false,
        "ImagenUrl": "",
        
        "Audio": false,
        "AudioUrl": "",
        
        "Video": true,
        "VideoUrl": "https://servidor.com/videos/resumen.mp4"
    }
};

// Guardar
localStorage.setItem('gameConfig', JSON.stringify(gameConfig));

// Cargar
const config = JSON.parse(localStorage.getItem('gameConfig') || '{}');
console.log(config.Acierto.TextoValor); // "¡FELICITACIONES! ¡Respuesta correcta!"
```

### Cargar Configuración

```javascript
async function loadConfigFromLocalStorage() {
    // Intenta cargar la configuración guardada
    let config = {};
    try {
        const saved = localStorage.getItem('gameConfig');
        if (saved) {
            config = JSON.parse(saved);
            console.log('✅ Configuración cargada desde LocalStorage');
            console.log(config);
        } else {
            console.log('ℹ️  Sin configuración guardada (primera vez)');
        }
    } catch (error) {
        console.error('❌ Error al cargar configuración:', error);
    }
    
    return config;
}

// Usar
const miConfig = await loadConfigFromLocalStorage();
```

### Panel de INICIO - Código Completo

```javascript
async function showInstructionsModal() {
    console.log('Mostrando modal de instrucciones...');
    
    // Cargar configuración
    let config = {};
    try { 
        config = JSON.parse(localStorage.getItem('gameConfig') || '{}'); 
    } catch (e) {}

    // Verificar si hay contenido en la etapa "Inicio"
    const hasContent = config['Inicio'] && (
        (config['Inicio']['Texto'] && config['Inicio']['TextoValor']) ||
        (config['Inicio']['Imagen'] && config['Inicio']['ImagenUrl']) ||
        (config['Inicio']['Audio'] && config['Inicio']['AudioUrl']) ||
        (config['Inicio']['Video'] && config['Inicio']['VideoUrl'])
    );

    // Si no hay contenido configurado, saltar directamente al juego
    if (!hasContent) {
        console.log('Sin contenido de inicio configurado, iniciando juego...');
        displayAROperation();
        return;
    }

    console.log('Contenido de inicio encontrado, mostrando modal...');

    // Crear modal
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
        animation: fadeIn 0.5s;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
        border-radius: 18px;
        max-width: 480px;
        width: 90vw;
        overflow: hidden;
        background: white;
        display: flex;
        flex-direction: column;
    `;

    // Encabezado
    const header = document.createElement('div');
    header.style.cssText = `
        padding: 1.2rem;
        background: linear-gradient(90deg, #4361ee 0%, #3a0ca3 100%);
        color: white;
        text-align: center;
    `;
    header.innerHTML = `<h2 style="margin:0;">🚀 Bienvenida</h2>`;
    content.appendChild(header);

    // Contenido del modal
    const bgContainer = document.createElement('div');
    bgContainer.style.cssText = `
        position: relative;
        min-height: 220px;
        width: 100%;
        background: linear-gradient(135deg, #4361ee 0%, #3a0ca3 100%);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        padding: 1.2rem;
    `;

    // Mostrar texto
    if (config['Inicio']['Texto'] && config['Inicio']['TextoValor']) {
        const texto = document.createElement('div');
        texto.style.cssText = `
            color: #ffd60a;
            font-size: 1.8rem;
            font-weight: bold;
            text-align: center;
            z-index: 10;
        `;
        texto.textContent = config['Inicio']['TextoValor'];
        bgContainer.appendChild(texto);
        console.log(`Texto: ${config['Inicio']['TextoValor']}`);
    }

    // Mostrar imagen
    if (config['Inicio']['Imagen'] && config['Inicio']['ImagenUrl']) {
        const img = document.createElement('img');
        img.src = config['Inicio']['ImagenUrl'];
        img.style.cssText = `
            max-width: 180px;
            max-height: 120px;
            border-radius: 12px;
            z-index: 10;
        `;
        bgContainer.appendChild(img);
        console.log(`Imagen: ${config['Inicio']['ImagenUrl']}`);
    }

    // Reproducir audio
    if (config['Inicio']['Audio'] && config['Inicio']['AudioUrl']) {
        const audio = document.createElement('audio');
        audio.src = config['Inicio']['AudioUrl'];
        audio.controls = true;
        audio.autoplay = true;
        bgContainer.appendChild(audio);
        console.log(`Audio: ${config['Inicio']['AudioUrl']}`);
    }

    // Reproducir video
    if (config['Inicio']['Video'] && config['Inicio']['VideoUrl']) {
        const video = document.createElement('video');
        video.src = config['Inicio']['VideoUrl'];
        video.controls = true;
        video.autoplay = true;
        video.style.cssText = `max-width: 95%; max-height: 300px;`;
        bgContainer.appendChild(video);
        console.log(`Video: ${config['Inicio']['VideoUrl']}`);
    }

    content.appendChild(bgContainer);

    // Botón para continuar
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Comenzar juego';
    nextBtn.style.cssText = `
        background: #4361ee;
        color: white;
        border: none;
        padding: 0.8rem 2rem;
        cursor: pointer;
        font-weight: 600;
        margin: 1.5rem auto 1rem auto;
    `;
    nextBtn.addEventListener('click', () => {
        console.log('Usuario presionó "Comenzar juego"');
        modal.remove();
        displayAROperation();
    });
    content.appendChild(nextBtn);

    modal.appendChild(content);
    document.body.appendChild(modal);
}
```

---

## Ejemplo: JSON de Ejercicios

```json
[
  {
    "nivel": "basico",
    "operation": "3,+2,-1,+4,-2",
    "options": [
      { "text": "6", "isCorrect": true },
      { "text": "5", "isCorrect": false },
      { "text": "7", "isCorrect": false }
    ]
  },
  {
    "nivel": "basico",
    "operation": "5,+3,-2,+1,-4",
    "options": [
      { "text": "3", "isCorrect": true },
      { "text": "2", "isCorrect": false },
      { "text": "4", "isCorrect": false }
    ]
  },
  {
    "nivel": "intermedio",
    "operation": "20,÷4,*3,-5",
    "options": [
      { "text": "10", "isCorrect": true },
      { "text": "8", "isCorrect": false },
      { "text": "12", "isCorrect": false }
    ]
  },
  {
    "nivel": "intermedio",
    "operation": "36,÷6,+2,*2",
    "options": [
      { "text": "16", "isCorrect": true },
      { "text": "14", "isCorrect": false },
      { "text": "18", "isCorrect": false }
    ]
  },
  {
    "nivel": "avanzado",
    "operation": "2,*3,+4,÷2,-1",
    "options": [
      { "text": "4", "isCorrect": true },
      { "text": "5", "isCorrect": false },
      { "text": "3", "isCorrect": false }
    ]
  },
  {
    "nivel": "avanzado",
    "operation": "10,*2,-5,÷3,+1",
    "options": [
      { "text": "6", "isCorrect": true },
      { "text": "7", "isCorrect": false },
      { "text": "5", "isCorrect": false }
    ]
  }
]
```

### Cómo Leer el JSON

```javascript
// Cada ejercicio tiene:
{
    "nivel": "basico" o "intermedio" o "avanzado",
    
    "operation": "3,+2,-1,+4,-2"
    // Separado por comas para parsing
    // Se muestra elemento por elemento
    
    "options": [
        { "text": "6", "isCorrect": true },     // Respuesta correcta
        { "text": "5", "isCorrect": false },    // Distractores
        { "text": "7", "isCorrect": false }
    ]
}

// Significado de la operación "3,+2,-1,+4,-2":
// Inicio: 3
// + 2 = 5
// - 1 = 4
// + 4 = 8
// - 2 = 6  ← RESPUESTA CORRECTA

// El usuario tiene que calcular mentalmente: 3 + 2 - 1 + 4 - 2 = 6
```

---

## Casos de Uso

### Caso 1: Docente Principiante

**Objetivo**: Crear un juego básico sin RA personalizada

```javascript
// 1. El docente abre el juego
// 2. Selecciona "Básico" (Sumas y Restas)
// 3. Selecciona "3 ejercicios"
// 4. Presiona "Siguiente"

// El juego:
// - Mezcla aleatoriamente 3 ejercicios del nivel "basico"
// - Los muestra uno por uno
// - No hay paneles de RA (porque no se configuró nada)
// - Muestra solo la puntuación
// - Finaliza después de 3 ejercicios

// Resultado esperado: Puntuación final visible
```

### Caso 2: Docente Avanzado

**Objetivo**: Personalizar la experiencia con RA completa

```javascript
// 1. El docente presiona "⚙️ Configurar Realidad Aumentada"
// 2. Selecciona etapa "INICIO"
// 3. Agrega:
//    - Texto: "¡Bienvenido al desafío matemático!"
//    - Imagen: logo.png (upload)
//    - Audio: instrucciones.mp3 (upload)
// 4. Selecciona etapa "ACIERTO"
// 5. Agrega:
//    - Texto: "¡CORRECTO!"
//    - Imagen: estrella.png (upload)
//    - Audio: aplausos.mp3 (upload)
// 6. Selecciona etapa "FINAL"
// 7. Agrega:
//    - Texto: "¡Excelente trabajo!"
//    - Video: resumen.mp4 (upload)
// 8. Presiona "💾 Guardar Configuración"

// El juego ahora:
// - Muestra panel de inicio con todo el contenido multimedia
// - Celebra cada acierto con contenido personalizado
// - Al final, muestra un video de resumen
// - La configuración se guarda en localStorage y persiste

// Resultado esperado: Experiencia educativa enriquecida
```

### Caso 3: Estudiante Resolviendo Ejercicios

```javascript
// 1. Abre el juego
// 2. Selecciona "Intermedio" y "2 ejercicios"
// 3. Presiona "Siguiente"

// Ejercicio 1:
// - Muestra: "20 ÷ 4 * 3 - 5"
// - Paso a paso: 20 → ÷ → 4 → * → 3 → - → 5
// - Muestra opciones: 8, 10, 12
// - Estudiante selecciona 10 (CORRECTA)
// - Suma 10 puntos
// - Panel de acierto (con contenido multimedia)

// Ejercicio 2:
// - Muestra: "36 ÷ 6 + 2 * 2"
// - Paso a paso: 36 → ÷ → 6 → + → 2 → * → 2
// - Muestra opciones: 16, 14, 18
// - Estudiante selecciona 18 (INCORRECTA)
// - Sin puntos
// - Panel motivacional

// Final:
// - Puntuación total: 10 puntos
// - Panel final con resumen
```

---

**Creado para:** Documentación Educativa - Noviembre 2025

