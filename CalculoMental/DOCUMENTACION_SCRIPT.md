# Documentación de script.js - Juego Cálculo Mental

## 📌 Índice
1. [Configuración Inicial](#configuración-inicial)
2. [Estructura del Juego](#estructura-del-juego)
3. [Funciones Principales](#funciones-principales)
4. [Sistema de RA (Realidad Aumentada)](#sistema-de-ra)
5. [Flujo del Juego](#flujo-del-juego)

---

## Configuración Inicial

### 1. Servidor y Variables Globales

```javascript
const SERVER_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3001'
    : 'https://juegos-o3jk.onrender.com';
```

**¿Qué hace?** Detecta si estás en tu computadora (localhost) o en internet (producción) y elige el servidor correcto.

- Si es **localhost** → usa servidor local en puerto 3001
- Si es **internet** → usa servidor en línea (Render)

### 2. Función fetchWithRetry

```javascript
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, {...options, timeout: 30000});
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
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
```

**¿Qué hace?** Intenta enviar datos al servidor hasta 3 veces. Si la conexión falla:
- Espera 1 segundo antes de reintentar
- Espera 2 segundos antes del 2do intento
- Espera 3 segundos antes del 3er intento
- Si falla 3 veces, muestra error

### 3. Variables de Estado (gameData)

```javascript
const gameData = {
    operation: '',          // Operación matemática actual (ej: "3,+2,-1")
    options: [],           // Array de opciones de respuesta
    currentStep: 0,        // Número del ejercicio actual (0 = primero)
    score: 0,              // Puntos acumulados
    displayTime: 500,      // Milisegundos para mostrar cada número
    exercises: [],         // Lista de ejercicios seleccionados
    filteredExercises: []  // Ejercicios del nivel elegido
};
```

**Explicación:**
- `operation`: "3,+2,-1" significa "muestra 3, luego +, luego 2, luego -, luego 1"
- `currentStep`: Si currentStep = 0, es el primer ejercicio. Si = 1, es el segundo
- `score`: Se suma 10 puntos por respuesta correcta
- `displayTime`: Velocidad de mostrar números (500ms = medio segundo)

---

## Estructura del Juego

### Elementos del HTML (DOM)

```javascript
const fileInput = document.getElementById('fileInput');           // Input para cargar JSON
const levelSelect = document.getElementById('level-select');     // Select de nivel
const exerciseCountInput = document.getElementById('exercise-count'); // Cantidad a jugar
const operationDisplay = document.getElementById('operation-display'); // Donde se muestra la operación
const optionsContainer = document.getElementById('options-container'); // Botones de respuesta
const scoreDisplay = document.getElementById('score-display');   // Puntuación
const generatorScreen = document.getElementById('generator-screen'); // Pantalla de configuración
const gameScreen = document.getElementById('game-screen');       // Pantalla de juego
```

---

## Funciones Principales

### 1. initializeGame() - Cargar Ejercicios

```javascript
function initializeGame() {
    return fetch('ejercicios.json')
        .then(res => {
            if (!res.ok) throw new Error(`Error: ${res.status}`);
            return res.json();
        })
        .then(json => {
            exerciseBank = json;  // Guarda los ejercicios
            
            // Extrae todos los niveles únicos
            const niveles = [...new Set(exerciseBank.map(ej => ej.nivel))];
            
            // Llena el select con los niveles
            levelSelect.innerHTML = '';
            niveles.forEach(nivel => {
                const opt = document.createElement('option');
                opt.value = nivel;
                opt.textContent = nivel.charAt(0).toUpperCase() + nivel.slice(1);
                levelSelect.appendChild(opt);
            });
            
            startGameBtn.disabled = false;  // Habilita botón de inicio
        })
        .catch(error => {
            console.error('Error:', error);
            startGameBtn.disabled = true;
        });
}
```

**¿Qué hace?**
1. Abre `ejercicios.json`
2. Lee todos los ejercicios
3. Extrae los niveles únicos (básico, intermedio, avanzado)
4. Llena el selector de niveles en el HTML
5. Si hay error, deshabilita el botón de inicio

**Ejemplo de ejercicios.json:**
```json
[
  {
    "nivel": "basico",
    "operation": "3,+2,-1",
    "options": [
      {"text": "4", "isCorrect": true},
      {"text": "3", "isCorrect": false},
      {"text": "5", "isCorrect": false}
    ]
  }
]
```

### 2. loadExerciseBank() - Filtrar por Nivel

```javascript
function loadExerciseBank() {
    const level = levelSelect.value;  // Obtiene nivel seleccionado
    
    // Filtra ejercicios del nivel elegido
    const filtered = exerciseBank.filter(ej => ej.nivel === level);
    
    // Muestra cantidad disponible
    availableExercises.textContent = `Ejercicios disponibles: ${filtered.length}`;
    
    // Limita el número máximo que puedes jugar
    exerciseCountInput.max = filtered.length;
    
    // Guarda para usar en el juego
    gameData.filteredExercises = filtered;
}
```

**Ejemplo:**
- Si eliges **"básico"** y hay 20 ejercicios básicos
- El select de cantidad te permitirá elegir de 1 a 20

### 3. startGame() - Iniciar Sesión

```javascript
function startGame() {
    const count = parseInt(exerciseCountInput.value) || 1;
    
    // Selecciona N ejercicios al azar del nivel elegido
    const selectedExercises = gameData.filteredExercises
        .sort(() => Math.random() - 0.5)  // Desordena
        .slice(0, count);                  // Toma los N primeros
    
    gameData.currentStep = 0;    // Comienza en 0
    gameData.score = 0;           // Puntuación en 0
    gameData.exercises = selectedExercises;  // Guarda los ejercicios a jugar
    gameData.operation = selectedExercises[0].operation;  // Primer ejercicio
    gameData.options = selectedExercises[0].options;
    
    generatorScreen.classList.add('hidden');    // Oculta pantalla de config
    showWaitingScreen();  // Muestra pantalla de configuración de RA
}
```

**¿Qué hace?**
1. Lee cuántos ejercicios quieres jugar
2. Toma ese número de ejercicios del nivel elegido, al azar
3. Reinicia puntuación y paso
4. Muestra la pantalla de configuración de Realidad Aumentada

---

## Sistema de RA

### Estructura de Configuración (localStorage)

La configuración de RA se guarda en `localStorage` con esta estructura:

```javascript
{
  "Inicio": {
    "Texto": true,              // ¿Mostrar texto en inicio?
    "TextoValor": "¡Hola!",    // El texto
    "Imagen": true,
    "ImagenUrl": "url/imagen.jpg",
    "Audio": false,
    "Audios": "",
    "Video": false,
    "VideoUrl": ""
  },
  "Acierto": {
    // Mismo formato para respuesta correcta
  },
  "Final": {
    // Mismo formato para fin del juego
  }
}
```

### 1. showWaitingScreen() - Configurar RA

Esta es la pantalla donde el **docente** configura qué mostrar en cada etapa.

**Etapas del juego:**
1. **Inicio** 🚀 - Se muestra antes de empezar a jugar
2. **Acierto** ✅ - Se muestra cuando responde correctamente
3. **Final** 🏁 - Se muestra al terminar el juego

**Tipos de contenido:**
- **Texto** 📝 - Máximo 20 caracteres (ej: "¡Muy bien!")
- **Imagen** 🖼️ - Máximo 5 MB (.jpg, .png)
- **Audio** 🔊 - Máximo 3 MB (.mp3)
- **Video** 🎬 - Máximo 10 MB (.mp4)

**Flujo:**
1. Elige una etapa (Inicio, Acierto, Final)
2. Elige un tipo (Texto, Imagen, Audio, Video)
3. Ingresa/sube el contenido
4. Guarda la configuración
5. Haz clic en "Comenzar juego"

```javascript
// Ejemplo: Guardar texto en "Inicio"
config['Inicio']['TextoValor'] = input.value;  // "¡Bienvenido!"
config['Inicio']['Texto'] = true;
localStorage.setItem('gameConfig', JSON.stringify(config));
```

### 2. showInstructionsModal() - Panel Inicial

Se muestra al empezar el juego si hay contenido configurado en "Inicio".

```javascript
async function showInstructionsModal() {
    let config = JSON.parse(localStorage.getItem('gameConfig') || '{}');
    
    // Verifica si hay algo configurado en "Inicio"
    const hasContent = config['Inicio'] && (
        (config['Inicio']['Texto'] && config['Inicio']['TextoValor']) ||
        (config['Inicio']['Imagen'] && config['Inicio']['ImagenUrl']) ||
        (config['Inicio']['Audio'] && config['Inicio']['AudioUrl']) ||
        (config['Inicio']['Video'] && config['Inicio']['VideoUrl'])
    );
    
    // Si no hay contenido, continúa directamente al juego
    if (!hasContent) {
        displayAROperation();
        return;
    }
    
    // Crear modal con el contenido
    // (se muestra texto, imagen, audio, video según esté configurado)
}
```

**¿Qué muestra?**
- Si configuraste texto: lo muestra en amarillo y grande
- Si configuraste imagen: la muestra debajo
- Si configuraste audio: botón de reproducción
- Si configuraste video: reproductor

---

## Flujo del Juego

### 1. displayAROperation() - Mostrar Operación

Muestra la operación matemática **paso a paso**, con demoras entre cada número/operador.

```javascript
function displayAROperation() {
    if (gameData.currentStep >= gameData.exercises.length) {
        showGameCompletedModal(gameData.score);  // Terminó
        return;
    }

    const currentExercise = gameData.exercises[gameData.currentStep];
    gameData.operation = currentExercise.operation;
    gameData.options = currentExercise.options;
    
    // Separa en partes: "3,+2,-1" → ["3", "+", "2", "-", "1"]
    const parts = [];
    const regex = /(\d+|[+\-×÷*/])/g;
    const operationString = gameData.operation.replace(/,/g, ' ');
    let match;
    while ((match = regex.exec(operationString)) !== null) {
        parts.push(match[0]);
    }

    let step = 0;
    const slowTime = 1000;  // 1 segundo por elemento

    function showNextPart() {
        if (step < parts.length) {
            operationDisplay.textContent = parts[step];  // Muestra la parte
            step++;
            setTimeout(() => {
                operationDisplay.textContent = '';  // Borra
                setTimeout(showNextPart, slowTime);  // Espera 1 seg
            }, slowTime);
        } else {
            operationDisplay.textContent = '¡Listo! Puedes responder.';
            showOptions();  // Muestra botones de respuesta
        }
    }

    showNextPart();
}
```

**Ejemplo visual:**
```
Pantalla 1: "3"      (1 segundo)
Pantalla 2: (en blanco)
Pantalla 3: "+"      (1 segundo)
Pantalla 4: (en blanco)
Pantalla 5: "2"      (1 segundo)
Pantalla 6: (en blanco)
Pantalla 7: "-"      (1 segundo)
Pantalla 8: (en blanco)
Pantalla 9: "1"      (1 segundo)
Pantalla 10: "¡Listo! Puedes responder."
→ Mostrar botones de respuesta
```

### 2. showOptions() - Mostrar Respuestas

```javascript
function showOptions() {
    // Desordena las opciones
    const shuffledOptions = [...gameData.options].sort(() => Math.random() - 0.5);
    
    let selectedButton = null;
    let selectedOption = null;

    // Crea un botón para cada opción
    shuffledOptions.forEach(option => {
        const button = document.createElement('button');
        button.textContent = option.text;  // Ej: "4"
        button.addEventListener('click', () => {
            // Marca como seleccionado
            button.classList.add('selected');
            selectedOption = option;
        });
        optionsContainer.appendChild(button);
    });
    
    // Botón de validación
    const validateBtn = document.createElement('button');
    validateBtn.textContent = 'Validar resultado';
    validateBtn.addEventListener('click', () => {
        if (!selectedOption) {
            validateBtn.textContent = 'Selecciona una opción primero';
            return;
        }
        
        // Valida respuesta
        if (selectedOption.isCorrect) {
            gameData.score += 10;  // +10 puntos
            updateScore();
        }
        
        // Muestra panel de validación (RA)
        showARValidationModal(selectedOption.isCorrect, () => {
            gameData.currentStep++;  // Siguiente ejercicio
            displayAROperation();
        });
    });
    validateContainer.appendChild(validateBtn);
}
```

**¿Qué hace?**
1. Muestra 3 botones con las opciones de respuesta (desordenados)
2. El estudiante elige uno (se pone verde)
3. Haz clic en "Validar resultado"
4. Si es correcto: +10 puntos
5. Muestra el panel de RA (Acierto)
6. Pasa al siguiente ejercicio

### 3. showARValidationModal() - Panel Después de Responder

Se muestra después de que responde (correcta o incorrecta).

```javascript
async function showARValidationModal(isCorrect, callback) {
    let config = JSON.parse(localStorage.getItem('gameConfig') || '{}');
    
    // Si es correcto Y hay contenido en "Acierto"
    if (isCorrect) {
        // Muestra el contenido configurado en "Acierto"
        if (config['Acierto']['Texto']) mostrarTexto(config['Acierto']['TextoValor']);
        if (config['Acierto']['Imagen']) mostrarImagen(config['Acierto']['ImagenUrl']);
        if (config['Acierto']['Audio']) reproducirAudio(config['Acierto']['AudioUrl']);
        if (config['Acierto']['Video']) reproducirVideo(config['Acierto']['VideoUrl']);
    } else {
        // Si es incorrecta, muestra mensaje motivacional
        mostrarMensajeMotivacional();
    }
    
    // Botón para continuar
    const nextBtn = document.createElement('button');
    nextBtn.textContent = gameData.currentStep + 1 >= gameData.exercises.length ? 'Finalizar' : 'Siguiente ejercicio';
    nextBtn.addEventListener('click', () => {
        modal.remove();
        if (callback) callback();
    });
}
```

### 4. showGameCompletedModal() - Panel Final

Se muestra cuando termina el juego.

```javascript
function showGameCompletedModal(score) {
    let config = JSON.parse(localStorage.getItem('gameConfig') || '{}');
    
    // Si hay contenido en "Final", lo muestra
    if (config['Final']) {
        if (config['Final']['Texto']) mostrarTexto(config['Final']['TextoValor']);
        if (config['Final']['Imagen']) mostrarImagen(config['Final']['ImagenUrl']);
        if (config['Final']['Audio']) reproducirAudio(config['Final']['AudioUrl']);
        if (config['Final']['Video']) reproducirVideo(config['Final']['VideoUrl']);
    }
    
    // Muestra la puntuación final
    scoreText.textContent = `Puntuación final: ${score}`;
    
    // Botón para reiniciar
    const restartBtn = document.createElement('button');
    restartBtn.textContent = 'Reiniciar juego';
    restartBtn.addEventListener('click', () => {
        location.reload();  // Recarga la página
    });
}
```

---

## Ejemplo Completo: Flujo de un Juego

### Paso 1: Usuario abre el juego

```
1. initializeGame() se ejecuta
2. Carga ejercicios.json
3. Llena el select de niveles
```

### Paso 2: Usuario configura y elige

```
1. Selecciona nivel: "básico"
2. loadExerciseBank() filtra ejercicios básicos
3. Selecciona cantidad: 3 ejercicios
4. Clica en "Comenzar juego"
5. startGame() selecciona 3 ejercicios al azar
6. Guarda en gameData.exercises
```

### Paso 3: Configuración de RA (Docente)

```
1. showWaitingScreen() muestra la pantalla
2. Elige etapa: "Inicio"
3. Elige tipo: "Texto"
4. Escribe: "¡Bienvenido!"
5. Hace clic en "Guardar texto"
6. localStorage guarda la config
7. Hace clic en "Comenzar juego"
```

### Paso 4: Juego comienza

```
1. showInstructionsModal() muestra panel inicial
   → Texto amarillo: "¡Bienvenido!"
   → Botón "Siguiente"

2. displayAROperation() muestra primer ejercicio
   → "3" (1 seg)
   → (en blanco)
   → "+" (1 seg)
   → (en blanco)
   → "2" (1 seg)
   → "¡Listo! Puedes responder."

3. showOptions() muestra botones
   → Botones: "5", "4", "6" (desordenados)
   → Estudiante clica "5" (correcta)
   → Botón "Validar resultado"

4. showARValidationModal() valida respuesta
   → Respuesta correcta: +10 puntos
   → Muestra contenido de "Acierto"
   → Botón "Siguiente ejercicio"

5. Repite con ejercicio 2, 3...

6. showGameCompletedModal() final
   → Puntuación: 30 puntos
   → Muestra contenido de "Final"
   → Botón "Reiniciar juego"
```

---

## Configuración de Velocidad

La velocidad cambia según el nivel:

```javascript
levelSelect.addEventListener('change', () => {
    let ms = 500;  // básico: 500ms por número
    if (levelSelect.value === 'intermedio') ms = 350;   // Más rápido
    if (levelSelect.value === 'avanzado') ms = 200;     // Muy rápido
    gameData.displayTime = ms;
});
```

| Nivel | Velocidad | Explicación |
|-------|-----------|-------------|
| Básico | 1 seg | Lento, fácil de ver |
| Intermedio | 0.35 seg | Más rápido |
| Avanzado | 0.2 seg | Muy rápido, difícil |

---

## Resumen de Funciones Clave

| Función | ¿Qué hace? |
|---------|-----------|
| `initializeGame()` | Carga ejercicios del JSON |
| `loadExerciseBank()` | Filtra ejercicios por nivel |
| `startGame()` | Inicia sesión de juego |
| `showWaitingScreen()` | Muestra configuración de RA |
| `showInstructionsModal()` | Panel inicial con RA |
| `displayAROperation()` | Muestra operación paso a paso |
| `showOptions()` | Muestra botones de respuesta |
| `showARValidationModal()` | Panel después de responder |
| `showGameCompletedModal()` | Panel final con puntuación |
| `updateScore()` | Actualiza puntos en pantalla |
| `backToGenerator()` | Vuelve a pantalla de configuración |

---

## Casos de Error Comunes

### "No se cargan los ejercicios"
- Verifica que `ejercicios.json` esté en la misma carpeta
- Abre la consola (F12) y mira si hay errores

### "No se guardan los paneles de RA"
- Asegúrate de hacer clic en "Guardar texto/imagen/audio/video"
- Luego clica en "Guardar Configuración"
- Luego en "Comenzar juego"

### "El servidor no se conecta"
- Si es localhost: asegúrate que `node upload-server.js` está corriendo
- Si es en línea: verifica conexión a internet

---

## Conclusión

El script funciona en este orden:
1. **Carga** → Lee ejercicios del JSON
2. **Configura** → Usuario elige nivel y cantidad
3. **RA Config** → Docente configura paneles
4. **Juega** → Muestra operaciones, estudiante responde
5. **Valida** → Comprueba si es correcto
6. **Repite** → Próximo ejercicio
7. **Termina** → Muestra puntuación final

¡Listo! 🎮

