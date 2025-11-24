const phrases = [
    "HOLA",
    "BUEN DIA",
    "JUEGO DIVERTIDO",
    "APRENDE MAS",
    "SONRIE SIEMPRE"
];

//Niveles de retos 
const levels = {
    basico: [
        "HOLA",
        "BUEN DIA",
        "SALUDO",
        "AMIGO",
        "JUGAR"
    ],
    intermedio: [
        "JUEGO DIVERTIDO",
        "APRENDE MAS",
        "MENTE ACTIVA",
        "PIENSA RAPIDO",
        "SUMA NUMEROS"
    ],
    avanzado: [
        "SONRIE SIEMPRE",
        "DESAFIO FINAL",
        "LOGRA TU META",
        "RESUELVE EL RETO",
        "CONCENTRACION TOTAL"
    ]
};

let currentLevel = 0;
let selectedChallenges = [];
let score = 0; // Nueva variable para la puntuación

function encrypt(text) {
    const alphabet = [
        'A','B','C','D','E','F','G','H','I','J','K','L','M',
        'N','Ñ','O','P','Q','R','S','T','U','V','W','X','Y','Z'
    ];
    // Si hay más de una palabra, reemplaza los espacios por "_"
    const hasMultipleWords = text.trim().split(/\s+/).length > 1;
    return text.split('').map(char => {
        if (char === ' ' && hasMultipleWords) {
            return '_';
        }
        const upperChar = char.toUpperCase();
        const idx = alphabet.indexOf(upperChar);
        if (idx !== -1) {
            return String(idx).padStart(2, '0');
        }
        return char;
    }).join(' ');
}

function showLevel() {
    document.getElementById('level').textContent = `Nivel ${currentLevel + 1}`;
    document.getElementById('encrypted-message').textContent = encrypt(phrases[currentLevel]);
    document.getElementById('user-input').value = '';
    document.getElementById('score-value').textContent = score; // Actualiza la puntuación
}

function checkAnswer() {
    const userInput = document.getElementById('user-input').value.trim().toUpperCase();
    const correct = phrases[currentLevel].toUpperCase();

    const isCorrect = userInput === correct;

    // Mostrar animación AR con cámara
    showARValidationModal(isCorrect, () => {
        if (isCorrect) {
            score += 10; // Suma 10 puntos si es correcto
        }
        setTimeout(() => {
            currentLevel++;
            if (currentLevel < phrases.length) {
                showLevel();
            } else {
                document.getElementById('encrypted-message').textContent = "¡Felicidades! Has terminado el juego.";
                document.getElementById('level').textContent = "";
                document.getElementById('user-input').style.display = 'none';
                document.getElementById('check-btn').style.display = 'none';
                // Puedes mostrar la puntuación final aquí si lo deseas
                document.getElementById('score').textContent = `Puntuación final: ${score}`;
            }
        }, 1200);
    });
}

function showARValidationModal(isCorrect, callback) {
    // Si la validación es incorrecta, no pedimos cámara: mostramos un modal simple con fondo decorativo
    const modal = document.createElement('div');
    modal.id = 'ar-validation-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 4000;
        padding: 16px;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        border-radius: 12px;
        max-width: 460px;
        width: 100%;
        overflow: hidden;
        box-shadow: 0 20px 35px rgba(0,0,0,0.25);
        display: flex;
        flex-direction: column;
        position: relative;
        background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(245,249,255,0.95));
        padding: 16px;
        align-items: center;
        justify-content: center;
    `;

    // Mensaje principal
    const arFloatingText = document.createElement('div');
    arFloatingText.textContent = isCorrect ? '¡Correcto! 🎉' : 'Incorrecto 😢';
    arFloatingText.style.cssText = `
        color: ${isCorrect ? '#1b873f' : '#b00020'};
        font-size: 1.8rem;
        font-weight: 800;
        text-align: center;
        text-shadow: 0 4px 12px rgba(0,0,0,0.12);
        margin: 8px 0 14px 0;
    `;
    modalContent.appendChild(arFloatingText);

    // Si es incorrecto, mostramos fondo ilustrado y un texto de ayuda sin abrir la cámara
    if (!isCorrect) {
        const hint = document.createElement('div');
        hint.style.cssText = `
            width:100%;
            padding: 12px 14px;
            border-radius: 10px;
            background: linear-gradient(135deg,#fff1f2,#ffeef6);
            color:#420026;
            text-align:center;
            font-weight:700;
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.6);
        `;
        hint.innerHTML = 'Revisa la tabla de encriptación y prueba otra vez. Consejo: los espacios en el cifrado aparecen como separadores.';
        modalContent.appendChild(hint);

        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Cerrar';
        closeBtn.style.cssText = `
            margin-top:14px;padding:10px 16px;border-radius:10px;border:none;background:#ff6b6b;color:#fff;font-weight:800;cursor:pointer;box-shadow:0 8px 18px rgba(0,0,0,0.12);
        `;
        closeBtn.addEventListener('click', () => {
            modal.remove();
            if (callback) callback();
        });
        modalContent.appendChild(closeBtn);

        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        return;
    }

    // Si es correcto, mostramos la versión con cámara (como antes)
    const cameraContainer = document.createElement('div');
    cameraContainer.style.cssText = `
        position: relative;
        height: 320px; /* más alto para que la cámara ocupe espacio visible */
        background: #000;
        overflow: hidden;
        width:100%;
        border-radius:10px;
    `;

    const video = document.createElement('video');
    video.setAttribute('autoplay', '');
    video.setAttribute('playsinline', '');
    video.muted = true; // ayuda a permitir autoplay en algunos navegadores
    video.style.cssText = `
        width: 100%;
        height: 100%;
        object-fit: cover;
    `;
    cameraContainer.appendChild(video);

    // floating text over camera (titulo)
    arFloatingText.style.color = '#4cc9f0';
    arFloatingText.style.textShadow = '3px 3px 6px rgba(0,0,0,0.8)';
    arFloatingText.style.position = 'absolute';
    arFloatingText.style.top = '14px';
    cameraContainer.appendChild(arFloatingText);

    // Mensaje de motivación (subtítulo sobre el video)
    const motivations = [
        '¡Excelente! Sigue así ⭐',
        '¡Muy bien hecho! Cada intento te hace mejor 💪',
        '¡Perfecto! Tu cerebro está en forma 🧠',
        '¡Bien! ¡A por el siguiente reto! 🚀'
    ];
    const mot = motivations[Math.floor(Math.random() * motivations.length)];
    const motivateDiv = document.createElement('div');
    motivateDiv.textContent = mot;
    motivateDiv.style.cssText = `
        position: absolute;
        left: 50%;
        bottom: 14px;
        transform: translateX(-50%);
        background: rgba(0,0,0,0.5);
        color: #fff;
        padding: 10px 14px;
        border-radius: 10px;
        font-weight:700;
        box-shadow: 0 6px 18px rgba(0,0,0,0.35);
        backdrop-filter: blur(4px);
        max-width: 92%;
        text-align:center;
        font-size:1rem;
    `;
    cameraContainer.appendChild(motivateDiv);

    const closeBtnCam = document.createElement('button');
    closeBtnCam.innerHTML = '<span style="font-size:1.1rem;">&#10006;</span>';
    closeBtnCam.title = 'Cerrar ventana';
    closeBtnCam.style.cssText = `
        position: absolute;
        top: 12px;
        right: 12px;
        background: #4361ee;
        color: white;
        border: none;
        border-radius: 50%;
        width: 36px;
        height: 36px;
        font-size: 1.2rem;
        cursor: pointer;
        z-index: 20;
        box-shadow: 0 2px 8px rgba(67,97,238,0.15);
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    closeBtnCam.addEventListener('click', () => {
        if (window.arStream) {
            window.arStream.getTracks().forEach(track => track.stop());
            window.arStream = null;
        }
        modal.remove();
        if (callback) callback();
    });
    cameraContainer.appendChild(closeBtnCam);

    modalContent.appendChild(cameraContainer);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    navigator.mediaDevices.getUserMedia({
        video: {
            facingMode: 'environment',
            width: { ideal: 640 },
            height: { ideal: 480 }
        }
    })
    .then(function(stream) {
        video.srcObject = stream;
        window.arStream = stream;
    })
    .catch(function() {
        cameraContainer.innerHTML = '<p style="color: #f72585; text-align: center; margin-top: 50%; font-size: 1.2rem;">No se pudo acceder a la cámara</p>';
    });
}

// ---------- Explicación del Disco de cifrado (modal con cámara y disco interactivo)
function generateCipherSVG() {
    const SVG_NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('id', 'cipher-svg');
    svg.setAttribute('viewBox', '0 0 320 320');

    const centerX = 160;
    const centerY = 160;
    const outerR = 120;
    const innerR = 80;

    const alphabet = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','Ñ','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
    const count = alphabet.length;

    // Background circles
    const bgOuter = document.createElementNS(SVG_NS, 'circle');
    bgOuter.setAttribute('cx', centerX);
    bgOuter.setAttribute('cy', centerY);
    bgOuter.setAttribute('r', outerR + 6);
    bgOuter.setAttribute('fill', '#f0f7ff');
    svg.appendChild(bgOuter);

    const lettersGroup = document.createElementNS(SVG_NS, 'g');
    lettersGroup.setAttribute('id', 'letters-group');
    lettersGroup.dataset.count = count;

    for (let i = 0; i < count; i++) {
        const angle = (i / count) * 360 - 90; // start at top
        const rad = (angle * Math.PI) / 180;
        const x = centerX + Math.cos(rad) * outerR;
        const y = centerY + Math.sin(rad) * outerR;

        const text = document.createElementNS(SVG_NS, 'text');
        text.setAttribute('x', x);
        text.setAttribute('y', y);
        text.setAttribute('fill', '#0c4497');
        text.setAttribute('font-size', '18');
        text.setAttribute('font-family', 'Roboto Slab, serif');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.setAttribute('transform', `rotate(${angle + 90} ${x} ${y})`);
        text.textContent = alphabet[i];
        lettersGroup.appendChild(text);
    }

    svg.appendChild(lettersGroup);

    // center marker
    const centerDot = document.createElementNS(SVG_NS, 'circle');
    centerDot.setAttribute('cx', centerX);
    centerDot.setAttribute('cy', centerY);
    centerDot.setAttribute('r', 6);
    centerDot.setAttribute('fill', '#4361ee');
    svg.appendChild(centerDot);

    return svg;
}

function showExplanationModal() {
    // Modal wrapper
    const modal = document.createElement('div');
    modal.id = 'explain-modal';

    const card = document.createElement('div');
    card.className = 'modal-card';

    const left = document.createElement('div');
    left.className = 'modal-left';
    left.style.position = 'relative';

    const right = document.createElement('div');
    right.className = 'modal-right';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-explain';
    closeBtn.innerHTML = '&#10006;';
    closeBtn.title = 'Cerrar';
    closeBtn.addEventListener('click', closeModal);
    left.appendChild(closeBtn);

    // Camera background
    const cameraWrapper = document.createElement('div');
    cameraWrapper.style.cssText = 'position:absolute;inset:0;overflow:hidden;background:#000;';

    const video = document.createElement('video');
    video.setAttribute('autoplay', '');
    video.setAttribute('playsinline', '');
    video.style.cssText = 'width:100%;height:100%;object-fit:cover;opacity:0.45;';
    cameraWrapper.appendChild(video);
    left.appendChild(cameraWrapper);

    // Cipher disk
    const cipherContainer = document.createElement('div');
    cipherContainer.id = 'cipher-disk';
    cipherContainer.style.cssText = 'position:relative;z-index:2;padding:0.75rem;display:flex;align-items:center;justify-content:center;';
    const svg = generateCipherSVG();
    cipherContainer.appendChild(svg);
    left.appendChild(cipherContainer);

    // Controls
    const controls = document.createElement('div');
    controls.id = 'disk-controls';
    controls.style.cssText = 'position:relative;z-index:2;text-align:center;';
    controls.innerHTML = 'Girar disco: <input id="disk-rotate" type="range" min="0" max="26" value="0">';
    left.appendChild(controls);
    // botón para abrir historia en RA sin usar la cámara (reemplaza la explicación de uso)
    const storyBtn = document.createElement('button');
    storyBtn.id = 'disk-history-btn';
    storyBtn.textContent = 'Ver historia (RA)';
    storyBtn.style.cssText = 'margin-top:8px;background:#4cc9f0;color:#042a3a;border:none;padding:8px 12px;border-radius:10px;font-weight:800;cursor:pointer;box-shadow:0 8px 18px rgba(76,201,240,0.12);';
    storyBtn.addEventListener('click', (e) => { e.preventDefault(); showARStoryNoCamera(); });
    left.appendChild(storyBtn);

    // Explanation text on right
    right.innerHTML = `
        <h3>¿Qué es un Disco de cifrado?</h3>
        <p>Un disco de cifrado es una herramienta clásica para sustituir caracteres: contiene dos anillos, uno fijo y uno móvil. Al alinear las letras del anillo móvil con las del anillo fijo podemos cifrar o descifrar mensajes reemplazando cada letra por la correspondiente alineada.</p>
        <h4>Cómo usarlo</h4>
        <ol>
            <li>Gira el disco con el control para alinear las letras (esto define la clave).</li>
            <li>Para cifrar, reemplaza cada letra del mensaje por la letra alineada en el otro anillo.</li>
            <li>Para descifrar, realiza el proceso inverso usando la misma alineación.</li>
        </ol>
        <p style="margin-top:1rem;font-weight:600;color:#0c4497;">Ejemplo: con la alineación en 3 posiciones, A → D, B → E, etc.</p>
    `;

    card.appendChild(left);
    card.appendChild(right);
    modal.appendChild(card);
    document.body.appendChild(modal);

    // Start camera
    navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
    }).then(function(stream) {
        video.srcObject = stream;
        window.explainStream = stream;
    }).catch(function() {
        cameraWrapper.innerHTML = '<div style="color:#f72585;padding:1rem;text-align:center;">No se pudo acceder a la cámara</div>';
    });

    // Hook up slider to rotate letters group
    const slider = document.getElementById('disk-rotate');
    const lettersGroup = svg.querySelector('#letters-group');
    const total = parseInt(lettersGroup.dataset.count || '27', 10);
    slider.addEventListener('input', () => {
        const val = parseInt(slider.value, 10);
        const angle = (val / total) * 360;
        lettersGroup.setAttribute('transform', `rotate(${angle} 160 160)`);
    });

    // Close helper
    function closeModal() {
        if (window.explainStream) {
            window.explainStream.getTracks().forEach(t => t.stop());
            window.explainStream = null;
        }
        modal.remove();
    }
}

// Versión sin cámara del panel explicativo: muestra disco y controles, pero no inicia la cámara
function showExplanationPanelNoCamera() {
    const modal = document.createElement('div');
    modal.id = 'explain-panel-no-camera';
    modal.style.cssText = `
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.45);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 4000;
    `;

    // inject playful styles only once
    if (!document.getElementById('explain-panel-style')) {
        const style = document.createElement('style');
        style.id = 'explain-panel-style';
        style.textContent = `
            @keyframes floatUp { 0% { transform: translateY(12px) scale(0.95); opacity:0 } 50% { opacity:1 } 100% { transform: translateY(-14px) scale(1.05); opacity:0 } }
            @keyframes popIn { from { transform: scale(0.9); opacity:0 } to { transform: scale(1); opacity:1 } }
            .explain-card { max-width:820px; width:92vw; border-radius:14px; padding:1rem; background: linear-gradient(135deg,#fff8e6,#e6f7ff); box-shadow: 0 10px 30px rgba(20,40,80,0.12); position:relative; overflow:hidden; }
            .explain-header { display:flex;align-items:center;gap:0.6rem;margin-bottom:0.5rem; }
            .explain-title { font-size:1.35rem;color:#0c4497;font-weight:800; margin:0; text-shadow: 1px 1px 0 rgba(255,255,255,0.6); }
            .explain-emoji { font-size:1.6rem; animation: popIn 500ms ease both; }
            .explain-content { font-size:1rem;color:#143d6b; line-height:1.45; }
            .sparkle { position:absolute; font-size:1.2rem; opacity:0.9; animation: floatUp 4s ease-in-out infinite; }
            .sparkle.s1 { left:12%; top:10%; animation-delay:0s; }
            .sparkle.s2 { left:82%; top:14%; animation-delay:0.8s; }
            .sparkle.s3 { left:26%; top:72%; animation-delay:1.4s; }
            .explain-close { position:absolute; right:12px; top:12px; background:#ff6b6b;border:none;color:#fff;border-radius:8px;padding:6px 10px;cursor:pointer;font-weight:700; }
            .kid-bullet { display:flex; align-items:flex-start; gap:0.5rem; margin:0.6rem 0; }
            .kid-icon { font-size:1.15rem; }
            .understood-btn { margin-top:0.8rem; background:#4cc9f0;border:none;padding:8px 14px;border-radius:10px;color:#063a5b;font-weight:700; cursor:pointer; box-shadow: 0 6px 14px rgba(76,201,240,0.18); }
        `;
        document.head.appendChild(style);
    }

    const card = document.createElement('div');
    card.className = 'explain-card';

    // playful floating emojis/sparkles
    const s1 = document.createElement('div'); s1.className = 'sparkle s1'; s1.textContent = '✨';
    const s2 = document.createElement('div'); s2.className = 'sparkle s2'; s2.textContent = '🎈';
    const s3 = document.createElement('div'); s3.className = 'sparkle s3'; s3.textContent = '🧠';
    card.appendChild(s1); card.appendChild(s2); card.appendChild(s3);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'explain-close';
    closeBtn.innerHTML = '✕';
    closeBtn.title = 'Cerrar';
    closeBtn.addEventListener('click', () => modal.remove());
    card.appendChild(closeBtn);

    const header = document.createElement('div');
    header.className = 'explain-header';
    const emoji = document.createElement('div'); emoji.className = 'explain-emoji'; emoji.textContent = '🗝️';
    const title = document.createElement('h3'); title.className = 'explain-title'; title.textContent = '¡La rueda cifrada!';
    header.appendChild(emoji); header.appendChild(title);
    card.appendChild(header);

    const content = document.createElement('div');
    content.className = 'explain-content';
    content.innerHTML = `
        <h4>Historia breve: El cifrado César</h4>
        <p>Hace más de 2.000 años, Julio César usaba un método sencillo para enviar mensajes secretos a sus generales: desplazaba cada letra del mensaje un número fijo de posiciones en el alfabeto. Por ejemplo, con un desplazamiento de 3, la letra A se convierte en D, B en E, y así sucesivamente. Este método se conoce hoy como "cifrado César".</p>
        <p>En esta actividad usamos una rueda similar: al girarla defines la clave (cuántos pasos desplazas). Con la misma clave, quien recibe el mensaje puede girar la rueda al contrario y leer el mensaje original.</p>
        <p style="margin-top:0.6rem;font-weight:700;color:#0c4497;">Ejemplo simple: clave = 3 → A → D, B → E, C → F ...</p>
    `;

    // fun list for kids
    const list = document.createElement('div');
    list.innerHTML = `
        <div class="kid-bullet"><div class="kid-icon">🔎</div><div>Elige cuántos pasos giras y ¡pum!: A puede convertirse en D.</div></div>
        <div class="kid-bullet"><div class="kid-icon">🤝</div><div>Comparte la clave con tu amigo para que pueda leer tu mensaje.</div></div>
        <div class="kid-bullet"><div class="kid-icon">🎉</div><div>Usa la rueda para crear retos y descubrir mensajes escondidos.</div></div>
    `;

    content.appendChild(list);
    card.appendChild(content);

    const understood = document.createElement('button');
    understood.className = 'understood-btn';
    understood.textContent = '¡Entendido!';
    understood.addEventListener('click', () => modal.remove());
    card.appendChild(understood);

    modal.appendChild(card);
    document.body.appendChild(modal);
}

// Conectar botón de explicación (se ha eliminado del DOM para no mostrarlo en la interfaz)
const explainBtn = document.getElementById('explain-btn');
if (explainBtn) {
    // Removemos el botón para que no aparezca ni pueda abrir el modal
    explainBtn.remove();
}

// Añadir un botón de rueda en el área de referencia para activar el tooltip animado (si existe el contenedor)
function addWheelButton() {
    const ref = document.getElementById('reference-image');
    if (!ref) return;
    // evitar duplicados
    if (document.getElementById('wheel-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'wheel-btn';
    btn.title = 'Ver cómo funciona la rueda cifrada';
    btn.innerHTML = '🧭';
    btn.style.cssText = `
        position: absolute;
        right: 12px;
        bottom: 12px;
        width:56px;height:56px;border-radius:50%;border:none;background:linear-gradient(135deg,#ffd166,#f8961e);font-size:1.8rem;cursor:pointer;box-shadow:0 10px 20px rgba(248,150,30,0.2);
    `;

    // posicionar el contenedor relative si hace falta
    const parent = ref;
    if (getComputedStyle(parent).position === 'static') parent.style.position = 'relative';
    parent.appendChild(btn);

    // Al pulsar el botón naranja abrimos la historia RA sin usar la cámara
    btn.addEventListener('click', () => showARStoryNoCamera());
}

// Tooltip/modal animado educativo para explicar la rueda sin usar la cámara
function showWheelTooltip() {
    // evitar multiples instancias
    if (document.getElementById('wheel-tooltip-modal')) return;

    // estilos inyectados
    if (!document.getElementById('wheel-tooltip-style')) {
        const s = document.createElement('style');
        s.id = 'wheel-tooltip-style';
        s.textContent = `
            @keyframes spin360 { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
            @keyframes pulseIn { from { transform: scale(0.9); opacity:0 } to { transform: scale(1); opacity:1 } }
            .wheel-tooltip-card { width:92vw; max-width:760px; border-radius:12px; padding:12px; background: linear-gradient(180deg,#fff,#f0fbff); box-shadow: 0 18px 40px rgba(10,30,90,0.12); position:relative; }
            .wheel-center { display:flex; align-items:center; justify-content:center; gap:1rem; }
            .wheel-svg { width:280px; height:280px; animation: pulseIn 350ms ease both; }
            .wheel-overlay-label { position:absolute; left:50%; top:18%; transform:translateX(-50%); background:rgba(255,255,255,0.9); padding:6px 10px;border-radius:999px;font-weight:700;color:#0c4497;box-shadow:0 6px 18px rgba(12,68,151,0.12); }
            .map-bubble { position:absolute; background:linear-gradient(90deg,#ffd166,#f8961e); color:#001; padding:6px 8px; border-radius:8px; font-weight:800; box-shadow:0 8px 18px rgba(0,0,0,0.12); transform:translate(-50%,-50%); pointer-events:none; }
            .close-wheel { position:absolute; right:12px; top:12px; background:#ff6b6b;border:none;color:#fff;border-radius:8px;padding:6px 10px;cursor:pointer;font-weight:700; }
        `;
        document.head.appendChild(s);
    }

    const modal = document.createElement('div');
    modal.id = 'wheel-tooltip-modal';
    modal.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;z-index:5000;`;

    const card = document.createElement('div');
    card.className = 'wheel-tooltip-card';

    const close = document.createElement('button');
    close.className = 'close-wheel';
    close.textContent = 'Cerrar';
    close.addEventListener('click', () => {
        cleanup();
    });
    card.appendChild(close);

    const label = document.createElement('div');
    label.className = 'wheel-overlay-label';
    label.textContent = 'Toca la rueda para ver cómo cambia cada letra';
    card.appendChild(label);

    const center = document.createElement('div');
    center.className = 'wheel-center';

    // Insertamos la rueda SVG (usamos una copia para no alterar otras vistas)
    const svg = generateCipherSVG();
    svg.classList.add('wheel-svg');
    svg.setAttribute('viewBox', '0 0 320 320');
    svg.style.cursor = 'pointer';
    center.appendChild(svg);

    // explicación a la derecha
    const aside = document.createElement('div');
    aside.style.cssText = 'max-width:300px;flex:1;color:#073b6a;font-weight:600;';
    aside.innerHTML = `<div style="font-size:1.05rem;margin-bottom:0.6rem;color:#0c4497;font-weight:800;">¿Cómo leer la rueda?</div>
        <div style="font-size:0.98rem;line-height:1.45;color:#12325b;">La rueda muestra el abecedario. Al mover el anillo (simulado aquí) cada letra se desplaza. Observa la animación para ver A → D, B → E, etc. Después prueba descifrar usando la clave que elijas.</div>`;

    card.appendChild(center);
    card.appendChild(aside);
    modal.appendChild(card);
    document.body.appendChild(modal);

    // botón en el tooltip para mostrar la historia RA sin cámara
    const historyBtnTooltip = document.createElement('button');
    historyBtnTooltip.textContent = 'Ver historia (RA)';
    historyBtnTooltip.style.cssText = 'position:absolute;left:50%;transform:translateX(-50%);bottom:18px;background:#4cc9f0;color:#042a3a;border:none;padding:8px 12px;border-radius:10px;font-weight:800;cursor:pointer;box-shadow:0 8px 18px rgba(76,201,240,0.12);z-index:5100;';
    historyBtnTooltip.addEventListener('click', () => showARStoryNoCamera());
    card.appendChild(historyBtnTooltip);

    // animación de mapeo mejorada: resalta origen/destino, dibuja línea animada y muestra burbujas
    const lettersGroup = svg.querySelector('#letters-group');
    const total = parseInt(lettersGroup.dataset.count || '27', 10);
    let bubble = null;
    let overlaySvg = null;
    const timeouts = [];

    // añadir estilos para highlights y líneas (solo una vez)
    if (!document.getElementById('wheel-tooltip-extra-style')) {
        const sx = document.createElement('style');
        sx.id = 'wheel-tooltip-extra-style';
        sx.textContent = `
            .map-highlight { position:absolute; width:44px; height:44px; border-radius:50%; background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), rgba(244,148,34,0.95)); box-shadow:0 8px 20px rgba(248,150,30,0.22); transform:translate(-50%,-50%); pointer-events:none; animation: popIn 420ms ease; }
            .map-highlight.dest { background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), rgba(76,201,240,0.95)); box-shadow:0 8px 20px rgba(76,201,240,0.12); }
            .mapping-line { stroke:#ffd166; stroke-width:4; stroke-linecap:round; fill:none; stroke-dasharray:200; stroke-dashoffset:200; transition: stroke-dashoffset 600ms ease; }
        `;
        document.head.appendChild(sx);
    }

    // crear overlay SVG para líneas
    function ensureOverlay() {
        if (overlaySvg) return overlaySvg;
        const SVG_NS = 'http://www.w3.org/2000/svg';
        overlaySvg = document.createElementNS(SVG_NS, 'svg');
        overlaySvg.setAttribute('class', 'wheel-overlay-svg');
        overlaySvg.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;';
        card.appendChild(overlaySvg);
        return overlaySvg;
    }

    function clearOverlay() {
        if (overlaySvg) {
            overlaySvg.remove();
            overlaySvg = null;
        }
    }

    function showMapAnimated(idx, shift) {
        // limpiar bubble previo
        if (bubble) {
            bubble.remove();
            bubble = null;
        }

        const alphabet = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','Ñ','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
        const from = alphabet[idx % alphabet.length];
        const toIdx = (idx + shift) % alphabet.length;
        const to = alphabet[toIdx];

        const texts = lettersGroup.querySelectorAll('text');
        const tFrom = texts[idx];
        const tTo = texts[toIdx];
        if (!tFrom || !tTo) return;

        // bbox en coordenadas SVG
        const fromBox = tFrom.getBBox();
        const toBox = tTo.getBBox();

        const svgRect = svg.getBoundingClientRect();
        const parentRect = card.getBoundingClientRect();
        const fx = svgRect.left - parentRect.left + fromBox.x + fromBox.width / 2;
        const fy = svgRect.top - parentRect.top + fromBox.y + fromBox.height / 2;
        const tx = svgRect.left - parentRect.left + toBox.x + toBox.width / 2;
        const ty = svgRect.top - parentRect.top + toBox.y + toBox.height / 2;

        // highlight origen
        const hFrom = document.createElement('div');
        hFrom.className = 'map-highlight';
        hFrom.style.left = fx + 'px';
        hFrom.style.top = fy + 'px';
        card.appendChild(hFrom);

        // highlight destino
        const hTo = document.createElement('div');
        hTo.className = 'map-highlight dest';
        hTo.style.left = tx + 'px';
        hTo.style.top = ty + 'px';
        card.appendChild(hTo);

        // resaltar letras cambiando color temporalmente
        const originalFrom = tFrom.getAttribute('fill');
        const originalTo = tTo.getAttribute('fill');
        tFrom.setAttribute('fill', '#f8961e');
        tTo.setAttribute('fill', '#4cc9f0');

        // dibujar línea animada
        const ov = ensureOverlay();
        const SVG_NS = 'http://www.w3.org/2000/svg';
        const line = document.createElementNS(SVG_NS, 'line');
        line.setAttribute('x1', fx);
        line.setAttribute('y1', fy);
        line.setAttribute('x2', fx);
        line.setAttribute('y2', fy);
        line.classList.add('mapping-line');
        line.setAttribute('stroke', '#ffd166');
        ov.appendChild(line);

        // for proper coordinates, set viewbox and use absolute px positions
        // animate to target
        // small timeout to allow insertion
        timeouts.push(setTimeout(() => {
            line.setAttribute('x2', tx);
            line.setAttribute('y2', ty);
            // trigger dash animation
            requestAnimationFrame(() => { line.style.strokeDashoffset = '0'; });
        }, 30));

        // bubble mostrando mapeo
        bubble = document.createElement('div');
        bubble.className = 'map-bubble';
        bubble.textContent = `${from} → ${to}`;
        bubble.style.left = (fx + (tx - fx) * 0.55) + 'px';
        bubble.style.top = (fy + (ty - fy) * 0.45) + 'px';
        card.appendChild(bubble);

        // limpiar después de 850ms
        timeouts.push(setTimeout(() => {
            hFrom.remove();
            hTo.remove();
            if (bubble) { bubble.remove(); bubble = null; }
            if (line) line.remove();
            // restaurar colores
            tFrom.setAttribute('fill', originalFrom || '#0c4497');
            tTo.setAttribute('fill', originalTo || '#0c4497');
        }, 850));
    }

    // secuencia demo: muestra N letras (para no alargar demasiado)
    const demoShift = 3; // ejemplo A -> D
    function runDemoSequence() {
        const N = Math.min(total, 10); // hasta 10 pasos
        let i = 0;
        function next() {
            if (i >= N) {
                // finalizar: girar la rueda a la clave seleccionada
                lettersGroup.setAttribute('transform', `rotate(${(demoShift/total)*360} 160 160)`);
                // quitar overlay después un momento
                timeouts.push(setTimeout(() => clearOverlay(), 600));
                return;
            }
            showMapAnimated(i, demoShift);
            i++;
            timeouts.push(setTimeout(next, 900));
        }
        next();
    }

    svg.addEventListener('click', () => {
        // si hay animaciones en curso no reiniciamos
        if (timeousRunning()) return;
        runDemoSequence();
    });

    function timeousRunning() {
        return timeouts.length > 0 && timeouts.some(id => !!id);
    }

    // limpiar al cerrar
    function cleanup() {
        // clear pending timeouts
        timeouts.forEach(id => clearTimeout(id));
        timeouts.length = 0;
        if (bubble) { bubble.remove(); bubble = null; }
        clearOverlay();
        modal.remove();
    }
}

// (El botón lateral se eliminó; el modal tiene su propia X de cierre)

function showGenerator() {
    // Hide the split layout (both panes) and show the generator screen
    const split = document.querySelector('.split-layout');
    if (split) split.style.display = 'none';
    document.getElementById('generator-screen').style.display = 'block';
}

function startGameFromGenerator() {
    // Obtiene el nivel y cantidad seleccionados
    const level = document.getElementById('level-select').value;
    const count = parseInt(document.getElementById('challenge-count').value, 10);

    // Selecciona retos del nivel
    const pool = levels[level];
    selectedChallenges = pool.slice(0, count);

    // Si hay menos retos que el número pedido, repite algunos
    while (selectedChallenges.length < count) {
        selectedChallenges.push(pool[Math.floor(Math.random() * pool.length)]);
    }

    // Actualiza las frases y reinicia el juego
    phrases.length = 0;
    selectedChallenges.forEach(p => phrases.push(p));
    currentLevel = 0;
    score = 0; // Reinicia la puntuación al iniciar el juego
    // Hide generator and show the split layout (image left, game right)
    document.getElementById('generator-screen').style.display = 'none';
    const split = document.querySelector('.split-layout');
    if (split) split.style.display = 'grid';
    showLevel();
    // Mostrar el panel explicativo sin activar la cámara al iniciar el juego
    showExplanationPanelNoCamera();
}

// Mostrar generador al cargar
showGenerator();

// Botón para iniciar el juego
document.getElementById('start-game-btn').addEventListener('click', startGameFromGenerator);
document.getElementById('check-btn').addEventListener('click', checkAnswer);
document.getElementById('user-input').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') checkAnswer();
});

showLevel();

// Hacer que al tocar la imagen de referencia se abra el panel explicativo SIN cámara (historia del cifrado César)
try {
    const refImg = document.querySelector('#reference-image img');
    if (refImg) {
        refImg.style.cursor = 'pointer';
        refImg.addEventListener('click', (e) => {
            e.preventDefault();
            showExplanationPanelNoCamera();
        });
    }
    // también añadimos el botón de rueda si existe el contenedor
    addWheelButton();
    // añadimos botón X para cancelar el juego y volver al generador
    function addCancelButton() {
        const container = document.querySelector('.game-container');
        if (!container) return;
        if (document.getElementById('game-cancel-btn')) return; // no duplicar

        // asegurar posicionamiento relativo
        if (getComputedStyle(container).position === 'static') container.style.position = 'relative';

        const btn = document.createElement('button');
        btn.id = 'game-cancel-btn';
        btn.title = 'Cancelar juego y volver al generador';
        btn.innerHTML = '&#10006;'; // X
        btn.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            width:40px;height:40px;border-radius:50%;border:none;background:#ff6b6b;color:#fff;font-size:1.2rem;cursor:pointer;box-shadow:0 8px 20px rgba(0,0,0,0.12);z-index:1200;
        `;

        btn.addEventListener('click', () => {
            // detener cualquier stream activo
            try { if (window.arStream) { window.arStream.getTracks().forEach(t => t.stop()); window.arStream = null; } } catch(e){}
            try { if (window.explainStream) { window.explainStream.getTracks().forEach(t => t.stop()); window.explainStream = null; } } catch(e){}

            // remover modales abiertos si existen
            const modals = ['ar-validation-modal','explain-modal','explain-panel-no-camera','wheel-tooltip-modal'];
            modals.forEach(id => { const m = document.getElementById(id); if (m) m.remove(); });

            // reset UI: ocultar split y mostrar generador
            const split = document.querySelector('.split-layout');
            if (split) split.style.display = 'none';
            const gen = document.getElementById('generator-screen');
            if (gen) gen.style.display = 'block';

            // opcional: reiniciar estado del juego
            currentLevel = 0;
            score = 0;
            // actualizar indicadores si existen
            const levelEl = document.getElementById('level'); if (levelEl) levelEl.textContent = '';
            const enc = document.getElementById('encrypted-message'); if (enc) enc.textContent = '';
            const input = document.getElementById('user-input'); if (input) { input.value=''; input.style.display='block'; }
            const checkBtn = document.getElementById('check-btn'); if (checkBtn) checkBtn.style.display='inline-block';
        });

        container.appendChild(btn);
    }
    addCancelButton();
} catch (err) {
    console.warn('No fue posible conectar el evento de la imagen de encriptación:', err);
}

// Ventana tipo "RA" sin cámara que muestra la historia de la rueda cifrada y el cifrado César
function showARStoryNoCamera() {
    // evitar duplicados
    if (document.getElementById('ar-story-no-camera')) return;
    const modal = document.createElement('div');
    modal.id = 'ar-story-no-camera';
    modal.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:6000;padding:16px;`;

    const card = document.createElement('div');
    card.style.cssText = `max-width:860px;width:96vw;border-radius:14px;padding:18px;background:linear-gradient(180deg,#fffdf6,#eaf6ff);color:#05334a;box-shadow:0 18px 40px rgba(6,24,64,0.18);position:relative;`;

    const close = document.createElement('button');
    close.innerHTML = '&#10006;';
    close.title = 'Cerrar';
    close.style.cssText = 'position:absolute;right:12px;top:12px;background:#ff6b6b;border:none;color:#fff;border-radius:8px;padding:6px 10px;cursor:pointer;font-weight:800;';
    close.addEventListener('click', () => modal.remove());
    card.appendChild(close);

    const title = document.createElement('h2');
    title.textContent = 'Historia de la rueda cifrada y el cifrado César';
    title.style.cssText = 'margin:0 0 10px;color:#0c4497;text-shadow:1px 1px 0 rgba(255,255,255,0.6);';
    card.appendChild(title);

    const p1 = document.createElement('p');
    p1.textContent = 'Las ruedas de cifrado son dispositivos históricos usados para sustituir letras mediante la rotación de anillos con alfabetos. Originadas en herramientas de criptografía manual, permiten intercambiar letras del mensaje por otras según la alineación elegida.';
    p1.style.cssText = 'line-height:1.5;margin:8px 0;color:#12325b;';
    card.appendChild(p1);

    const p2 = document.createElement('p');
    p2.textContent = 'El cifrado César toma su nombre del líder romano Julio César, que alrededor del año 50 a.C. usaba un desplazamiento fijo para proteger mensajes militares. Con un desplazamiento de 3, por ejemplo, A → D, B → E, C → F, y así sucesivamente.';
    p2.style.cssText = 'line-height:1.5;margin:8px 0;color:#12325b;';
    card.appendChild(p2);

    const p3 = document.createElement('p');
    p3.innerHTML = 'Aunque sencillo y hoy inseguro frente a métodos modernos, el cifrado César es didáctico: enseña sustitución monoalfabética y la idea de clave (el número de pasos). Las ruedas cifradas (o discos) son una versión mecánica que facilita aplicar el desplazamiento.';
    p3.style.cssText = 'line-height:1.5;margin:8px 0;color:#12325b;';
    card.appendChild(p3);

    const example = document.createElement('pre');
    example.textContent = 'Ejemplo (clave = 3): A B C D E F ...\nCifrado: D E F G H I ...';
    example.style.cssText = 'background:rgba(255,255,255,0.8);padding:8px;border-radius:8px;margin-top:10px;color:#063a5b;font-weight:700;';
    card.appendChild(example);

    const tip = document.createElement('div');
    tip.textContent = 'Toca fuera o presiona la X para cerrar.';
    tip.style.cssText = 'margin-top:12px;color:#0c4497;font-weight:700;text-align:center;';
    card.appendChild(tip);

    modal.appendChild(card);
    document.body.appendChild(modal);
}