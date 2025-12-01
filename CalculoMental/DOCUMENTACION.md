# 📚 DOCUMENTACIÓN COMPLETA - Juego Cálculo Mental con Realidad Aumentada

## Tabla de Contenidos
1. [Introducción](#introducción)
2. [Configuración de Dificultad](#configuración-de-dificultad)
3. [Selección de Cantidad de Ejercicios](#selección-de-cantidad-de-ejercicios)
4. [Configuración de Realidad Aumentada (RA)](#configuración-de-realidad-aumentada-ra)
5. [Paneles de RA](#paneles-de-ra)
6. [Proceso del Juego](#proceso-del-juego)
7. [Estructura Técnica](#estructura-técnica)

---

## 🎮 Introducción

El **Juego de Cálculo Mental** es una aplicación educativa interactiva que utiliza **Realidad Aumentada (RA)** para presentar ejercicios matemáticos. Los estudiantes pueden:

- Seleccionar un nivel de dificultad
- Elegir cuántos ejercicios desean resolver
- Configurar elementos multimedia (texto, imágenes, audio, video) para diferentes etapas del juego
- Resolver ejercicios de cálculo mental
- Recibir retroalimentación inmediata con elementos de RA

### Tecnologías Utilizadas:
- **Frontend**: HTML5, CSS3, JavaScript vanilla
- **RA**: A-Frame, AR.js
- **Backend**: Node.js (para cargar/subir archivos)
- **Almacenamiento**: LocalStorage (para guardar configuraciones)

---

## 🎯 Configuración de Dificultad

### 1. Descripción General

La configuración de dificultad permite que los usuarios seleccionen entre **3 niveles** que determinan qué tipos de operaciones matemáticas aparecerán:

```
BÁSICO          → Sumas y Restas
INTERMEDIO      → Sumas, Restas y Divisiones
AVANZADO        → Todas las operaciones (Sumas, Restas, Multiplicaciones, Divisiones)
```

### 2. Implementación en HTML

```html
<div class="level-section">
    <label for="level-select"><strong>Selecciona nivel de dificultad:</strong></label>
    <select id="level-select">
        <option value="basico">Básico (Sumas y Restas)</option>
        <option value="intermedio">Intermedio (Sumas, Restas y Divisiones)</option>
        <option value="avanzado">Avanzado (Todas las operaciones)</option>
    </select>
    <span id="available-exercises"></span>
</div>
```

### 3. Código JavaScript - Inicialización

```javascript
// Carga los ejercicios desde el archivo JSON
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
            
            // Extrae los niveles únicos del JSON
            const niveles = [...new Set(exerciseBank.map(ej => ej.nivel))];
            if (niveles.length === 0) {
                throw new Error('No se encontraron niveles en los ejercicios');
            }

            // Llena dinámicamente el selector de niveles
            levelSelect.innerHTML = '';
            niveles.forEach(nivel => {
                const opt = document.createElement('option');
                opt.value = nivel;
                opt.textContent = nivel.charAt(0).toUpperCase() + nivel.slice(1);
                levelSelect.appendChild(opt);
            });

            startGameBtn.disabled = false;
            loadExerciseBank(); // Filtra ejercicios del primer nivel
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
```

### 4. Cargar Ejercicios por Nivel

```javascript
// Filtra los ejercicios según el nivel seleccionado
function loadExerciseBank() {
    const selectedLevel = levelSelect.value;
    
    // Filtra ejercicios que coincidan con el nivel seleccionado
    gameData.filteredExercises = exerciseBank.filter(ej => ej.nivel === selectedLevel);
    
    // Muestra cuántos ejercicios están disponibles
    const count = gameData.filteredExercises.length;
    availableExercises.textContent = `${count} ejercicios disponibles`;
}

// Se ejecuta cuando el usuario cambia de nivel
levelSelect.addEventListener('change', loadExerciseBank);
```

### 5. Estructura del Archivo de Ejercicios (JSON)

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
    "nivel": "intermedio",
    "operation": "20,÷4,*3,-5",
    "options": [
      { "text": "10", "isCorrect": true },
      { "text": "8", "isCorrect": false },
      { "text": "12", "isCorrect": false }
    ]
  }
]
```

### 6. Estilos CSS - Panel de Dificultad

```css
.level-section {
    background: linear-gradient(90deg, #e0e7ff 60%, #f8f9fa 100%);
    border-radius: 16px;
    box-shadow: 0 2px 8px #4361ee22;
    padding: 1rem 1.5rem;
    margin-bottom: 1.2rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

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
}
```

---

## 📊 Selección de Cantidad de Ejercicios

### 1. Descripción General

Permite que el usuario elija **cuántos ejercicios** desea resolver (de 1 a 5).

### 2. Implementación en HTML

```html
<div class="exercise-count-section">
    <label for="exercise-count"><strong>¿Cuántos ejercicios quieres hacer?</strong></label>
    <select id="exercise-count">
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
        <option value="4">4</option>
        <option value="5">5</option>
    </select>
</div>
```

### 3. Código JavaScript - Iniciar Juego

```javascript
// FUNCIÓN PRINCIPAL PARA INICIAR EL JUEGO
function startGame() {
    // Obtiene la cantidad de ejercicios seleccionados
    const count = parseInt(exerciseCountInput.value) || 1;
    
    // Verifica que haya ejercicios disponibles
    if (!gameData.filteredExercises || gameData.filteredExercises.length === 0) {
        alert('No hay ejercicios disponibles para este nivel');
        return;
    }

    // Mezcla los ejercicios aleatoriamente y toma la cantidad solicitada
    const selectedExercises = gameData.filteredExercises
        .sort(() => Math.random() - 0.5)  // Aleatoriza el orden
        .slice(0, Math.min(count, gameData.filteredExercises.length));

    if (selectedExercises.length === 0) {
        alert('No hay suficientes ejercicios disponibles');
        return;
    }

    // Configura el estado del juego
    gameData.currentStep = 0;        // Inicio en ejercicio 0
    gameData.score = 0;              // Puntuación desde 0
    gameData.exercises = selectedExercises;
    gameData.operation = selectedExercises[0].operation;
    gameData.options = selectedExercises[0].options;

    // Oculta la pantalla de configuración
    generatorScreen.classList.add('hidden');
    gameScreen.classList.add('hidden');
    showWaitingScreen();             // Muestra pantalla de espera
    updateScore();
}
```

### 4. Flujo de Selección

```
┌─────────────────────────────────────────┐
│  Usuario selecciona cantidad (1-5)      │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Usuario presiona "Siguiente"           │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Función startGame() se ejecuta         │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Se filtran ejercicios del nivel        │
│  Se mezclan aleatoriamente              │
│  Se seleccionan N ejercicios            │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Se inicia el juego (paso 0/N)          │
│  Se muestra la operación matemática     │
└─────────────────────────────────────────┘
```

### 5. Variables Globales Relacionadas

```javascript
// Datos del juego
const gameData = {
    operation: '',              // Operación actual
    options: [],                // Opciones de respuesta
    currentStep: 0,             // Número del ejercicio actual
    score: 0,                   // Puntuación acumulada
    displayTime: 500,           // Tiempo de visualización
    exercises: [],              // Array de ejercicios a resolver
    filteredExercises: []       // Ejercicios filtrados por nivel
};

const exerciseCountInput = document.getElementById('exercise-count');
```

---

## ⚙️ Configuración de Realidad Aumentada (RA)

### 1. Descripción General

La **Configuración de RA** permite que los docentes personalicen la experiencia del estudiante en **3 etapas**:

- **INICIO**: Contenido mostrado antes de comenzar los ejercicios
- **ACIERTO**: Contenido mostrado cuando el estudiante responde correctamente
- **FINAL**: Contenido mostrado al terminar todos los ejercicios

Cada etapa puede incluir: **Texto, Imagen, Audio, Video**

### 2. Panel de Configuración - HTML

```html
<!-- Botón para acceder a la configuración -->
<button id="configBtn">⚙️ Configurar Realidad Aumentada</button>

<!-- Modal de configuración (se genera dinámicamente con JavaScript) -->
```

### 3. Código JavaScript - Crear Panel de Configuración

```javascript
// Abre el modal de configuración de RA
function showConfigModal() {
    let config = {};
    try { 
        config = JSON.parse(localStorage.getItem('gameConfig') || '{}'); 
    } catch (e) {}

    const modal = document.createElement('div');
    modal.id = 'config-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 5000;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        border-radius: 24px;
        max-width: 600px;
        width: 90vw;
        max-height: 80vh;
        overflow-y: auto;
        padding: 2rem;
        box-shadow: 0 20px 60px rgba(67, 97, 238, 0.3);
        position: relative;
    `;

    // Encabezado
    const title = document.createElement('h2');
    title.textContent = '⚙️ Configurar Realidad Aumentada';
    title.style.color = '#4361ee';
    title.style.textAlign = 'center';
    title.style.marginBottom = '1.5rem';
    modalContent.appendChild(title);

    // Botones de etapas
    const stageButtonsContainer = document.createElement('div');
    stageButtonsContainer.style.cssText = `
        display: flex;
        gap: 1rem;
        justify-content: center;
        margin-bottom: 2rem;
        flex-wrap: wrap;
    `;

    const stagePanelContainer = document.createElement('div');
    stagePanelContainer.style.cssText = `
        margin-bottom: 1.5rem;
    `;

    const stages = ['Inicio', 'Acierto', 'Final'];
    let selectedStage = 'Inicio';

    // Crear botones de etapas
    stages.forEach(stage => {
        const btn = document.createElement('button');
        btn.textContent = `📋 ${stage}`;
        btn.style.cssText = `
            background: #f8f9ff;
            color: var(--primary);
            border: 2px solid var(--primary);
            border-radius: 12px;
            padding: 0.7rem 1.5rem;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            width: 120px;
            text-align: center;
        `;
        
        if (stage === selectedStage) {
            btn.style.background = '#4361ee';
            btn.style.color = 'white';
        }

        btn.addEventListener('click', () => {
            selectedStage = stage;
            // Actualiza estilos de todos los botones
            Array.from(stageButtonsContainer.children).forEach(b => {
                b.style.background = '#f8f9ff';
                b.style.color = 'var(--primary)';
                b.style.borderColor = 'var(--primary)';
            });
            btn.style.background = '#4361ee';
            btn.style.color = 'white';
            btn.style.borderColor = '#4361ee';
            
            // Muestra el panel de la etapa seleccionada
            showSelectedStagePanel();
        });
        stageButtonsContainer.appendChild(btn);
    });

    modalContent.appendChild(stageButtonsContainer);
    modalContent.appendChild(stagePanelContainer);

    // Función para mostrar el panel de la etapa seleccionada
    function showSelectedStagePanel() {
        stagePanelContainer.innerHTML = '';
        stagePanelContainer.appendChild(createStagePanel(selectedStage));
    }

    // Mostrar el primer panel
    showSelectedStagePanel();

    // Botón para cerrar
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '❌ Cerrar';
    closeBtn.style.cssText = `
        background: #f72585;
        color: white;
        border: none;
        padding: 0.8rem 2rem;
        border-radius: 12px;
        cursor: pointer;
        margin-top: 1rem;
        width: 100%;
        font-weight: 600;
    `;
    closeBtn.addEventListener('click', () => modal.remove());
    modalContent.appendChild(closeBtn);

    modal.appendChild(modalContent);
    document.body.appendChild(modal);
}
```

### 4. Crear Panel de Etapa

```javascript
function createStagePanel(stage) {
    const stageIcons = {
        'Inicio': '🚀',
        'Acierto': '✅',
        'Final': '🎉'
    };

    const types = ['Texto', 'Imagen', 'Audio', 'Video'];
    const typeIcons = {
        'Texto': '📝',
        'Imagen': '🖼️',
        'Audio': '🔊',
        'Video': '🎥'
    };

    const panel = document.createElement('div');
    panel.style.cssText = `
        background: linear-gradient(90deg, #e0e7ff 0%, #f1f5fe 100%);
        border-radius: 12px;
        padding: 1.5rem;
        border: 2px solid #4361ee;
        margin-bottom: 1rem;
    `;

    // Encabezado del panel
    const panelHeader = document.createElement('div');
    panelHeader.textContent = `${stageIcons[stage]} Opciones para ${stage}`;
    panelHeader.style.cssText = `
        font-size: 1.25rem;
        font-weight: bold;
        color: #4361ee;
        background: #e0e7ff;
        padding: 0.6rem;
        border-radius: 8px;
        margin-bottom: 0.7rem;
        text-align: center;
    `;
    panel.appendChild(panelHeader);

    // Contenedor de botones de tipo
    const typeRow = document.createElement('div');
    typeRow.style.cssText = `
        display: flex;
        gap: 1.2rem;
        flex-wrap: wrap;
        justify-content: center;
        margin-bottom: 1rem;
    `;

    // Panel para mostrar inputs
    const inputPanelWrapper = document.createElement('div');
    inputPanelWrapper.id = `input-panel-wrapper-${stage}`;
    inputPanelWrapper.style.cssText = `
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
    `;

    // Crear botones para cada tipo
    types.forEach(type => {
        const btn = document.createElement('button');
        btn.textContent = `${typeIcons[type]} ${type}`;
        btn.style.cssText = `
            background: #fff;
            color: var(--primary);
            border: 2px solid #e6eefc;
            border-radius: 8px;
            padding: 0.7rem 1.2rem;
            cursor: pointer;
            transition: all 0.2s;
        `;

        btn.addEventListener('click', () => {
            // Resalta el botón seleccionado
            Array.from(typeRow.children).forEach(b => {
                b.style.background = '#fff';
                b.style.color = 'var(--primary)';
                b.style.borderColor = '#e6eefc';
            });
            btn.style.background = '#e0e7ff';
            btn.style.color = '#4361ee';
            btn.style.borderColor = '#4361ee';

            // Muestra el panel de input
            inputPanelWrapper.innerHTML = '';
            addInputPanel(stage, type, inputPanelWrapper);
        });
        typeRow.appendChild(btn);
    });

    panel.appendChild(typeRow);
    panel.appendChild(inputPanelWrapper);

    return panel;
}
```

### 5. Almacenamiento en LocalStorage

```javascript
// La configuración se guarda en LocalStorage
// Estructura del objeto de configuración:
const gameConfig = {
    "Inicio": {
        "Texto": true,
        "TextoValor": "¡Bienvenido al juego!",
        "Imagen": false,
        "ImagenUrl": "",
        "Audio": false,
        "AudioUrl": "",
        "Video": false,
        "VideoUrl": ""
    },
    "Acierto": {
        "Texto": true,
        "TextoValor": "¡Correcto!",
        "Imagen": true,
        "ImagenUrl": "https://ejemplo.com/imagen.jpg",
        "Audio": true,
        "AudioUrl": "https://ejemplo.com/audio.mp3",
        "Video": false,
        "VideoUrl": ""
    },
    "Final": {
        "Texto": true,
        "TextoValor": "¡Felicidades! Completaste todos los ejercicios",
        "Imagen": false,
        "ImagenUrl": "",
        "Audio": false,
        "AudioUrl": "",
        "Video": false,
        "VideoUrl": ""
    }
};

// Guardar configuración
localStorage.setItem('gameConfig', JSON.stringify(gameConfig));

// Cargar configuración
const config = JSON.parse(localStorage.getItem('gameConfig') || '{}');
```

---

## 🎨 Paneles de RA

### 1. Paneles Disponibles

Hay **3 tipos de paneles** que se muestran en diferentes momentos del juego:

| Tipo | Momento de Aparición | Contenido |
|------|----------------------|-----------|
| **Panel de INICIO** | Antes de empezar los ejercicios | Instrucciones, motivación |
| **Panel de ACIERTO** | Cuando el usuario responde correctamente | Felicitaciones, recompensas |
| **Panel de FINAL** | Después de completar todos los ejercicios | Resumen, puntuación final |

### 2. Estructura de un Panel

Cada panel tiene:
- **Encabezado**: Título y fondo gradiente
- **Contenido**: Texto, imagen, audio, video
- **Elementos decorativos**: Símbolos matemáticos flotantes
- **Botón de acción**: Para continuar

### 3. Código - Panel de Validación (ACIERTO)

```javascript
async function showARValidationModal(isCorrect, callback) {
    // Cargar configuración desde LocalStorage
    let config = {};
    try { 
        config = JSON.parse(localStorage.getItem('gameConfig') || '{}'); 
    } catch (e) {}
    
    // Verificar si hay contenido configurado para "Acierto"
    const hasContent = config['Acierto'] && (
        (config['Acierto']['Texto'] && config['Acierto']['TextoValor']) ||
        (config['Acierto']['Imagen'] && config['Acierto']['ImagenUrl']) ||
        (config['Acierto']['Audio'] && config['Acierto']['AudioUrl']) ||
        (config['Acierto']['Video'] && config['Acierto']['VideoUrl'])
    );
    
    // Si no hay contenido y la respuesta es incorrecta, saltar el panel
    if (!hasContent && !isCorrect) {
        if (callback) callback();
        return;
    }

    // Crear el modal
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
        padding: 1.2rem 0;
    `;

    // Crear símbolos flotantes decorativos
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

    // Si la respuesta es correcta, mostrar contenido configurado
    if (isCorrect) {
        // Mostrar texto si está configurado
        if (config['Acierto']['Texto'] && config['Acierto']['TextoValor']) {
            const aciertoText = document.createElement('div');
            aciertoText.style.cssText = `
                color: #ffd60a;
                font-size: 2.2rem;
                font-weight: bold;
                text-shadow: 2px 2px 8px #3a0ca3;
                text-align: center;
                z-index: 16;
                animation: arFloat 3s ease-in-out infinite;
            `;
            aciertoText.textContent = config['Acierto']['TextoValor'];
            bgContainer.appendChild(aciertoText);
        }

        // Mostrar imagen si está configurada
        if (config['Acierto']['Imagen'] && config['Acierto']['ImagenUrl']) {
            const img = document.createElement('img');
            img.src = config['Acierto']['ImagenUrl'];
            img.style.cssText = `
                max-width: 180px;
                max-height: 120px;
                border-radius: 12px;
                box-shadow: 0 2px 12px #3a0ca3;
                z-index: 20;
            `;
            bgContainer.appendChild(img);
        }

        // Reproducir audio si está configurado
        if (config['Acierto']['Audio'] && config['Acierto']['AudioUrl']) {
            const audio = document.createElement('audio');
            audio.src = config['Acierto']['AudioUrl'];
            audio.controls = true;
            audio.autoplay = true;
            bgContainer.appendChild(audio);
        }

        // Reproducir video si está configurado
        if (config['Acierto']['Video'] && config['Acierto']['VideoUrl']) {
            const video = document.createElement('video');
            video.src = config['Acierto']['VideoUrl'];
            video.controls = true;
            video.autoplay = true;
            bgContainer.appendChild(video);
        }
    } else {
        // Si la respuesta es incorrecta, mostrar mensaje motivacional
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
        `;
        bgContainer.appendChild(motivText);
    }

    content.appendChild(bgContainer);

    // Botón para continuar
    const nextBtn = document.createElement('button');
    const isLastExercise = (gameData.currentStep + 1 >= gameData.exercises.length);
    nextBtn.textContent = isLastExercise ? 'Finalizar' : 'Siguiente ejercicio';
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
        modal.remove();
        if (callback) callback();
    });
    content.appendChild(nextBtn);

    modal.appendChild(content);
    document.body.appendChild(modal);
}
```

### 4. Panel de Inicio

```javascript
async function showInstructionsModal() {
    let config = {};
    try { 
        config = JSON.parse(localStorage.getItem('gameConfig') || '{}'); 
    } catch (e) {}
    
    // Verificar si hay contenido
    const hasContent = config['Inicio'] && (
        (config['Inicio']['Texto'] && config['Inicio']['TextoValor']) ||
        (config['Inicio']['Imagen'] && config['Inicio']['ImagenUrl']) ||
        (config['Inicio']['Audio'] && config['Inicio']['AudioUrl']) ||
        (config['Inicio']['Video'] && config['Inicio']['VideoUrl'])
    );
    
    // Si no hay contenido, continuar directamente
    if (!hasContent) {
        displayAROperation();
        return;
    }

    // Crear modal similar al de acierto...
    // (estructura similar al panel de validación)
}
```

### 5. Panel Final

```javascript
function showGameCompletedModal(score) {
    (async () => {
        let config = {};
        try { 
            config = JSON.parse(localStorage.getItem('gameConfig') || '{}'); 
        } catch (e) {}
        
        // Verificar si hay contenido en Final
        const hasContent = config['Final'] && (
            (config['Final']['Texto'] && config['Final']['TextoValor']) ||
            (config['Final']['Imagen'] && config['Final']['ImagenUrl']) ||
            (config['Final']['Audio'] && config['Final']['AudioUrl']) ||
            (config['Final']['Video'] && config['Final']['VideoUrl'])
        );
        
        // Si no hay contenido, salir
        if (!hasContent) return;

        // Mostrar puntuación final
        const scoreMessage = `Puntuación Final: ${score} puntos`;
        console.log(scoreMessage);

        // Mostrar modal con contenido configurado...
        // (estructura similar al panel de acierto)
    })();
}
```

### 6. Animaciones CSS

```css
@keyframes arFloat {
    0%, 100% { 
        transform: scale(1); 
    }
    50% { 
        transform: scale(1.1); 
    }
}

@keyframes fadeIn {
    from { 
        opacity: 0; 
        transform: scale(0.9);
    }
    to { 
        opacity: 1; 
        transform: scale(1);
    }
}

@keyframes float0 {
    0%, 100% { transform: translate(0, 0) rotate(0deg); }
    50% { transform: translate(15px, -15px) rotate(15deg); }
}
```

---

## 🎮 Proceso del Juego

### 1. Flujo General

```
INICIO
  │
  ├─→ Usuario selecciona nivel de dificultad
  │
  ├─→ Usuario selecciona cantidad de ejercicios
  │
  ├─→ Usuario presiona "Siguiente"
  │
  ├─→ startGame() inicia el juego
  │    ├─→ Filtra ejercicios por nivel
  │    ├─→ Mezcla aleatoriamente
  │    ├─→ Selecciona N ejercicios
  │    └─→ Configura el estado inicial
  │
  ├─→ showInstructionsModal() (Panel de INICIO)
  │    ├─→ Muestra contenido configurado
  │    └─→ Usuario presiona botón para continuar
  │
  ├─→ displayAROperation() inicia el primer ejercicio
  │    ├─→ Muestra la operación matemática
  │    ├─→ Muestra las opciones de respuesta
  │    └─→ Usuario selecciona una opción
  │
  ├─→ Validación de respuesta
  │    ├─→ Si es CORRECTA: +10 puntos
  │    ├─→ Si es INCORRECTA: +0 puntos
  │    └─→ Se muestra el panel de ACIERTO
  │
  ├─→ showARValidationModal() (Panel de ACIERTO)
  │    ├─→ Muestra contenido configurado o mensaje motivacional
  │    └─→ Usuario presiona "Siguiente ejercicio"
  │
  ├─→ Repetir displayAROperation() para todos los ejercicios
  │
  └─→ showGameCompletedModal() (Panel de FINAL)
       ├─→ Muestra puntuación total
       ├─→ Muestra contenido configurado
       └─→ Juego finaliza
```

### 2. Mostrar Operación Matemática

```javascript
function displayAROperation() { 
    // Verificar si ya se completaron todos los ejercicios
    if (gameData.currentStep >= gameData.exercises.length) {
        showGameCompletedModal(gameData.score);
        return;
    }

    // Obtener el ejercicio actual
    const currentExercise = gameData.exercises[gameData.currentStep];
    gameData.operation = currentExercise.operation;
    gameData.options = currentExercise.options;
    
    // Limpiar pantalla anterior
    validateContainer.innerHTML = '';
    operationDisplay.textContent = '';

    // Parsear la operación (ejemplo: "3,+2,-1" → ["3", "+", "2", "-", "1"])
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
            // Mostrar un elemento
            operationDisplay.textContent = parts[step];
            step++;
            
            // Esperar 1 segundo y limpiar
            setTimeout(() => {
                operationDisplay.textContent = '';
                setTimeout(showNextPart, slowTime);
            }, slowTime);
        } else {
            // Mostrar todas las opciones
            operationDisplay.textContent = '¡Listo! Puedes responder.';
            showOptions();
        }
    }

    showNextPart();
}
```

### 3. Mostrar Opciones de Respuesta

```javascript
function showOptions() {
    optionsContainer.innerHTML = '';
    validateContainer.innerHTML = '';

    // Mezclar las opciones aleatoriamente
    const shuffledOptions = [...gameData.options].sort(() => Math.random() - 0.5);

    let selectedButton = null;
    let selectedOption = null;

    // Crear botón para cada opción
    shuffledOptions.forEach(option => {
        const button = document.createElement('button');
        button.textContent = option.text;
        
        button.addEventListener('click', () => {
            // Limpiar selección previa
            optionsContainer.querySelectorAll('button').forEach(btn => {
                btn.classList.remove('selected');
            });
            
            // Marcar la nueva selección
            button.classList.add('selected');
            selectedButton = button;
            selectedOption = option;
        });
        
        optionsContainer.appendChild(button);
    });

    // Crear botón de validación
    const validateBtn = document.createElement('button');
    validateBtn.textContent = 'Validar resultado';
    validateBtn.style.gridColumn = '1 / -1';
    validateBtn.style.marginTop = '10px';
    validateBtn.style.background = '#4361ee';
    validateContainer.appendChild(validateBtn);

    validateBtn.addEventListener('click', () => {
        // Verificar que se seleccionó una opción
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

        // Validar respuesta
        if (selectedOption.isCorrect) {
            selectedButton.classList.add('correct');
            gameData.score += 10;  // Suma 10 puntos por acierto
            updateScore();
        } else {
            selectedButton.classList.add('incorrect');
            // Mostrar la respuesta correcta
            const correctBtn = Array.from(optionsContainer.querySelectorAll('button')).find(btn => {
                const opt = shuffledOptions.find(o => o.text === btn.textContent);
                return opt && opt.isCorrect;
            });
            if (correctBtn) correctBtn.classList.add('correct');
        }

        // Mostrar panel de validación
        showARValidationModal(selectedOption.isCorrect, () => {
            // Avanzar al siguiente ejercicio
            gameData.currentStep++;
            optionsContainer.innerHTML = '';
            validateContainer.innerHTML = '';
            
            if (gameData.currentStep < gameData.exercises.length) {
                displayAROperation();
            } else {
                showGameCompletedModal(gameData.score);
            }
        });
    });
}
```

### 4. Actualizar Puntuación

```javascript
function updateScore() {
    scoreDisplay.textContent = `Puntuación: ${gameData.score}`;
}
```

### 5. Mensajes Motivacionales

```javascript
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
    
    if (isCorrect) {
        return correctMsgs[Math.floor(Math.random() * correctMsgs.length)];
    } else {
        return incorrectMsgs[Math.floor(Math.random() * incorrectMsgs.length)];
    }
}
```

---

## 🏗️ Estructura Técnica

### 1. Variables Globales

```javascript
// Configuración del servidor
const SERVER_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3001'
    : 'https://juegos-o3jk.onrender.com';

// Datos del juego
const gameData = {
    operation: '',                  // Operación matemática
    options: [],                    // Opciones de respuesta
    currentStep: 0,                 // Número de ejercicio actual (0-indexed)
    score: 0,                       // Puntuación acumulada
    displayTime: 500,               // Tiempo de visualización
    exercises: [],                  // Ejercicios a resolver
    filteredExercises: []           // Ejercicios filtrados por nivel
};

// Símbolos matemáticos decorativos
const MATH_SYMBOLS = ['×', '+', '÷', '-', '=', '1', '2', '3'];
```

### 2. Elementos del DOM Principales

```javascript
const fileInput = document.getElementById('fileInput');
const validateBtn = document.getElementById('validateBtn');
const gameOptions = document.getElementById('game-options');
const startGameBtn = document.getElementById('startGameBtn');
const generatorScreen = document.getElementById('generator-screen');
const gameScreen = document.getElementById('game-screen');
const operationDisplay = document.getElementById('operation-display');
const optionsContainer = document.getElementById('options-container');
const validateContainer = document.getElementById('validate');
const scoreDisplay = document.getElementById('score-display');
const backBtn = document.getElementById('back-btn');
const levelSelect = document.getElementById('level-select');
const exerciseCountInput = document.getElementById('exercise-count');
```

### 3. Sistema de Reintentos

```javascript
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
                // Espera 1, 2 o 3 segundos según el intento
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
            }
        }
    }
    throw lastError;
}
```

### 4. Estructura de Archivos del Proyecto

```
CalculoMental/
├── index.html              # Estructura HTML principal
├── script.js               # Lógica del juego (2126 líneas)
├── style.css               # Estilos CSS
├── ejercicios.json         # Banco de ejercicios
├── package.json            # Configuración del proyecto
└── recursos/
    ├── Audio/              # Archivos de audio
    ├── Imagen/             # Archivos de imagen
    └── Videos/             # Archivos de video
```

### 5. Flujo de Datos

```
┌──────────────────────────┐
│   ejercicios.json        │
│  (Banco de ejercicios)   │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│ initializeGame()         │
│ (Carga datos)            │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│ gameData                 │
│ (Estado del juego)       │
└────────────┬─────────────┘
             │
      ┌──────┴──────┐
      │             │
      ▼             ▼
┌────────────┐ ┌─────────────────┐
│ LocalStorage│ │ Pantalla (DOM) │
│ (Config)   │ │ (Visualización) │
└────────────┘ └─────────────────┘
```

---

## 📝 Resumen

El **Juego de Cálculo Mental con RA** es una aplicación educativa completa que:

1. **Configura dificultad** mediante 3 niveles que determinan operaciones matemáticas
2. **Permite seleccionar cantidad** de ejercicios a resolver (1-5)
3. **Personaliza la experiencia RA** con texto, imágenes, audio y video en 3 etapas
4. **Moestra paneles interactivos** con contenido multimedia durante el juego
5. **Gestiona el proceso** del juego de forma fluida con retroalimentación inmediata
6. **Guarda configuraciones** en LocalStorage para reutilizar

---

**Autor:** Documentación Educativa
**Fecha:** Noviembre 2025
**Estado:** Completado

