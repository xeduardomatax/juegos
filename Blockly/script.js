const workspace = Blockly.inject('blocklyDiv', {
  toolbox: document.getElementById('toolbox'),
  trashcan: true,
  grid: {
    spacing: 20,
    length: 3,
    colour: '#ccc',
    snap: true
  }
});

let arStream = null;

const problemGenerator = {
  currentProblem: null,
  difficulty: 'medium',
  currentTestCase: null,

  problems: {
    easy: [
      {
        title: "Suma de dos números",
        description: "Crea una función que tome dos números y devuelva su suma.",
        solution: function (a, b) { return a + b; },
        generateTestCase: () => {
          const a = Math.floor(Math.random() * 10);
          const b = Math.floor(Math.random() * 10);
          return { input: [a, b], expected: a + b };
        },
        testCases: 3,
        arVisualization: 'sum'
      },
      {
        title: "Número par o impar",
        description: "Crea una función que determine si un número es par. Devuelve true si es par, false si es impar.",
        solution: function (num) { return num % 2 === 0; },
        generateTestCase: () => {
          const num = Math.floor(Math.random() * 20);
          return { input: [num], expected: num % 2 === 0 };
        },
        testCases: 3,
        arVisualization: 'evenOdd'
      },
      {
        title: "Concatenar texto",
        description: "Crea una función que tome dos cadenas de texto y las concatene en una sola.",
        solution: function (text1, text2) { return text1 + text2; },
        generateTestCase: () => {
          const texts = ["Hola ", "Mundo", "Blockly ", "es ", "genial"];
          const index1 = Math.floor(Math.random() * (texts.length - 1));
          const index2 = Math.floor(Math.random() * (texts.length - 1)) + 1;
          return { input: [texts[index1], texts[index2]], expected: texts[index1] + texts[index2] };
        },
        testCases: 3,
        arVisualization: 'concat'
      }
    ],
    medium: [
      {
        title: "Factorial de un número",
        description: "Crea una función que calcule el factorial de un número entero positivo.",
        solution: function (n) {
          let result = 1;
          for (let i = 2; i <= n; i++) result *= i;
          return result;
        },
        generateTestCase: () => {
          const n = Math.floor(Math.random() * 6) + 1;
          let expected = 1;
          for (let i = 2; i <= n; i++) expected *= i;
          return { input: [n], expected };
        },
        testCases: 3
      },
      {
        title: "Fibonacci",
        description: "Crea una función que devuelva el n-ésimo número de la secuencia de Fibonacci.",
        solution: function (n) {
          let a = 0, b = 1;
          for (let i = 2; i <= n; i++) {
            const temp = a + b;
            a = b;
            b = temp;
          }
          return n === 0 ? a : b;
        },
        generateTestCase: () => {
          const n = Math.floor(Math.random() * 8);
          let expected, a = 0, b = 1;
          for (let i = 2; i <= n; i++) {
            const temp = a + b;
            a = b;
            b = temp;
          }
          expected = n === 0 ? a : b;
          return { input: [n], expected };
        },
        testCases: 3
      },
      {
        title: "Longitud del texto",
        description: "Crea una función que tome una cadena de texto y devuelva su longitud.",
        solution: function (text) { return text.length; },
        generateTestCase: () => {
          const texts = ["Hola", "Blockly", "JavaScript", "Programación", "Web"];
          const text = texts[Math.floor(Math.random() * texts.length)];
          return { input: [text], expected: text.length };
        },
        testCases: 3
      }
    ],
    hard: [
      {
        title: "Palíndromo",
        description: "Crea una función que determine si una palabra es un palíndromo (se lee igual de izquierda a derecha y de derecha a izquierda).",
        solution: function (word) {
          const cleaned = word.toLowerCase().replace(/[^a-z]/g, '');
          return cleaned === cleaned.split('').reverse().join('');
        },
        generateTestCase: () => {
          const palindromes = ["racecar", "level", "noon"];
          const nonPalindromes = ["casa", "programación", "computadora"];

          if (Math.random() > 0.5) {
            const word = palindromes[Math.floor(Math.random() * palindromes.length)];
            return { input: [word], expected: true };
          } else {
            const word = nonPalindromes[Math.floor(Math.random() * nonPalindromes.length)];
            return { input: [word], expected: false };
          }
        },
        testCases: 4
      },
      {
        title: "Ordenamiento",
        description: "Crea una función que ordene un arreglo de números del más pequeño al más grande.",
        solution: function (arr) {
          return arr.slice().sort((a, b) => a - b);
        },
        generateTestCase: () => {
          const length = Math.floor(Math.random() * 5) + 3;
          const arr = Array.from({ length }, () => Math.floor(Math.random() * 100));
          const expected = arr.slice().sort((a, b) => a - b);
          return { input: [arr], expected };
        },
        testCases: 3
      },
      {
        title: "Suma de lista",
        description: "Crea una función que tome una lista de números y devuelva la suma de todos sus elementos.",
        solution: function (arr) {
          return arr.reduce((sum, num) => sum + num, 0);
        },
        generateTestCase: () => {
          const length = Math.floor(Math.random() * 5) + 3;
          const arr = Array.from({ length }, () => Math.floor(Math.random() * 10));
          const expected = arr.reduce((sum, num) => sum + num, 0);
          return { input: [arr], expected };
        },
        testCases: 3
      }
    ]
  },

  generateNewProblem: function () {
    this.difficulty = document.getElementById('difficulty').value;
    const problems = this.problems[this.difficulty];
    this.currentProblem = problems[Math.floor(Math.random() * problems.length)];

    this.displayProblem();
  },

  displayProblem: function () {
    const problemDesc = document.getElementById('problemDescription');
    const testCasesDiv = document.getElementById('testCases');

    problemDesc.innerHTML = `
      <h3>${this.currentProblem.title}</h3>
      <p>${this.currentProblem.description}</p>
    `;

    testCasesDiv.innerHTML = '<h4>Casos de prueba:</h4>';
    for (let i = 0; i < this.currentProblem.testCases; i++) {
      const testCase = this.currentProblem.generateTestCase();
      const testCaseDiv = document.createElement('div');
      testCaseDiv.className = 'test-case';
      testCaseDiv.innerHTML = `
        <p><strong>Entrada:</strong> ${JSON.stringify(testCase.input)}</p>
        <p><strong>Salida esperada:</strong> ${JSON.stringify(testCase.expected)}</p>
      `;
      testCasesDiv.appendChild(testCaseDiv);
    }
  }
};

function downloadProject() {
  const workspaceXml = Blockly.Xml.workspaceToDom(workspace);
  const xmlText = Blockly.Xml.domToPrettyText(workspaceXml);

  const blob = new Blob([xmlText], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'blockly_project.xml';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function createEducationalARScene(visualizationType, testCase, userResult) {
  
  const sceneContainer = document.createElement('div');
  sceneContainer.style.cssText = `
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
  `;
  
  let sceneHTML = '';
  
  switch(visualizationType) {
    case 'sum':
      sceneHTML = createSumVisualizationHTML(testCase);
      break;
    case 'evenOdd':
      sceneHTML = createEvenOddVisualizationHTML(testCase);
      break;
    case 'concat':
      sceneHTML = createConcatVisualizationHTML(testCase);
      break;
  }
  
  sceneContainer.innerHTML = sceneHTML;
  
  return sceneContainer;
}

function createSumVisualizationHTML(testCase) {
  const [num1, num2] = testCase.input;
  const result = testCase.expected;
  
  let spheresHTML = '';
  
  for (let i = 0; i < num1; i++) {
    const x = (i % 5) * 0.12 - 0.95;
    const y = Math.floor(i / 5) * 0.12 + 1.5;
    const delay = i * 100;
    
    spheresHTML += `
      <a-sphere 
        radius="0.03" 
        color="#4361ee" 
        position="${x} ${y} -2"
        animation="property: scale; from: 0 0 0; to: 1 1 1; dur: 500; delay: ${delay}; easing: easeOutQuad">
      </a-sphere>
    `;
  }
  
  spheresHTML += `
    <a-text 
      value="+" 
      position="-0.4 1.55 -2"
      color="#06d6a0" 
      width="1" 
      align="center">
    </a-text>
  `;
  
  for (let i = 0; i < num2; i++) {
    const x = (i % 5) * 0.12 - 0.3;
    const y = Math.floor(i / 5) * 0.12 + 1.5;
    const delay = (num1 * 100) + (i * 100);
    
    spheresHTML += `
      <a-sphere 
        radius="0.03" 
        color="#06d6a0" 
        position="${x} ${y} -2"
        animation="property: scale; from: 0 0 0; to: 1 1 1; dur: 500; delay: ${delay}; easing: easeOutQuad">
      </a-sphere>
    `;
  }
  
  spheresHTML += `
    <a-text 
      value="=" 
      position="0.3 1.55 -2" 
      color="#f72585" 
      width="1" 
      align="center">
    </a-text>
  `;
  
  for (let i = 0; i < result; i++) {
    const x = (i % 5) * 0.12 + 0.4;
    const y = Math.floor(i / 5) * 0.12 + 1.5;
    const color = i < num1 ? '#4361ee' : '#06d6a0';
    const totalDelay = (num1 + num2) * 100 + 500 + (i * 50);
    
    spheresHTML += `
      <a-sphere 
        radius="0.03" 
        color="${color}" 
        position="${x} ${y} -2"
        animation="property: scale; from: 0 0 0; to: 1 1 1; dur: 300; delay: ${totalDelay}; easing: easeOutQuad">
      </a-sphere>
    `;
  }
  
  const sceneHTML = `
    <a-scene embedded style="width: 100%; height: 100%;">
      <a-text 
        value="${num1} + ${num2} = ${result}" 
        position="0 2 -2" 
        color="#4361ee" 
        width="3" 
        align="center">
      </a-text>
      
      ${spheresHTML}
      
      <a-text 
        value="Excelente! Has sumado correctamente" 
        position="0 1 -2" 
        color="#2ec4b6" 
        width="2.5" 
        align="center">
      </a-text>
      
      <a-entity camera look-controls position="0 1.6 0"></a-entity>
    </a-scene>
  `;
  
  return sceneHTML;
}

function createEvenOddVisualizationHTML(testCase) {
  const num = testCase.input[0];
  const isEven = testCase.expected;
  
  const cubeSize = 0.1;
  const spacing = 0.16;
  let cubesHTML = '';
  
  for (let i = 0; i < num; i++) {
    const pairIndex = Math.floor(i / 2);
    const isLeftOfPair = i % 2 === 0;
    const x = (pairIndex * spacing * 2.2) - 0.7 + (isLeftOfPair ? 0 : spacing);
    const y = 1.7;
    const startY = 3;
    const delay = i * 150;
    
    let color, animation;
    
    if (i === num - 1 && !isEven) {
      color = '#f72585';
      animation = `
        animation="property: position; from: ${x} ${startY} -2; to: ${x} ${y} -2; dur: 600; delay: ${delay}; easing: easeInQuad"
        animation__scale="property: scale; to: 1.5 1.5 1.5; dur: 800; delay: ${delay + 500}; easing: easeOutQuad"
      `;
    } else {
      color = isLeftOfPair ? '#4361ee' : '#06d6a0';
      animation = `animation="property: position; from: ${x} ${startY} -2; to: ${x} ${y} -2; dur: 600; delay: ${delay}; easing: easeInQuad"`;
    }
    
    cubesHTML += `
      <a-box 
        width="${cubeSize}" 
        height="${cubeSize}" 
        depth="${cubeSize}" 
        color="${color}" 
        position="${x} ${y} -2"
        ${animation}>
      </a-box>
    `;
  }
  
  const resultMessage = isEven 
    ? `¡Correcto! ${num} es PAR\\nTodos tienen pareja`
    : `¡Correcto! ${num} es IMPAR\\nUno queda sin pareja`;
  
  const resultColor = isEven ? '#06d6a0' : '#f72585';
  
  const sceneHTML = `
    <a-scene embedded style="width: 100%; height: 100%;">
      <a-text 
        value="¿${num} es par o impar?" 
        position="0 2.3 -2" 
        color="#4361ee" 
        width="2.5" 
        align="center">
      </a-text>
      
      ${cubesHTML}
      
      <a-text 
        value="${resultMessage}" 
        position="0 1.1 -2" 
        color="${resultColor}" 
        width="2.5" 
        align="center">
      </a-text>
      
      <a-entity camera look-controls position="0 1.6 0"></a-entity>
    </a-scene>
  `;
  
  return sceneHTML;
}

function createConcatVisualizationHTML(testCase) {
  const [text1, text2] = testCase.input;
  const result = testCase.expected;
  
  const letterSpacing = 0.15;
  let currentX = -1.2;
  let lettersHTML = '';
  
  for (let i = 0; i < text1.length; i++) {
    const char = text1[i];
    const x = currentX;
    const finalY = 1.7;
    const startY = 2.5;
    const delay = i * 100;
    
    lettersHTML += `
      <a-entity position="${x} ${startY} -2">
        <a-plane 
          width="0.12" 
          height="0.15" 
          color="#4361ee" 
          position="0 0 -0.01">
        </a-plane>
        <a-text 
          value="${char}" 
          color="white" 
          width="0.8" 
          align="center" 
          position="0 0 0">
        </a-text>
        <a-animation 
          attribute="position" 
          to="${x} ${finalY} -2" 
          dur="800" 
          delay="${delay}" 
          easing="ease-in-out">
        </a-animation>
        <a-animation 
          attribute="rotation" 
          from="0 0 45" 
          to="0 0 0" 
          dur="800" 
          delay="${delay}" 
          easing="ease-out">
        </a-animation>
      </a-entity>
    `;
    
    currentX += letterSpacing;
  }
  
  const plusX = currentX;
  const plusDelay = text1.length * 100 - 100;
  lettersHTML += `
    <a-text 
      value="+" 
      position="${plusX} 1.7 -2" 
      color="#f72585" 
      width="1" 
      align="center"
      animation="property: scale; from: 0 0 0; to: 1 1 1; dur: 500; delay: ${plusDelay}; easing: easeOutQuad">
    </a-text>
  `;
  
  currentX += letterSpacing;
  
  for (let i = 0; i < text2.length; i++) {
    const char = text2[i];
    const x = currentX;
    const finalY = 1.7;
    const startY = 1;
    const delay = text1.length * 100 + i * 100;
    
    lettersHTML += `
      <a-entity position="${x} ${startY} -2">
        <a-plane 
          width="0.12" 
          height="0.15" 
          color="#06d6a0" 
          position="0 0 -0.01">
        </a-plane>
        <a-text 
          value="${char}" 
          color="white" 
          width="0.8" 
          align="center" 
          position="0 0 0">
        </a-text>
        <a-animation 
          attribute="position" 
          to="${x} ${finalY} -2" 
          dur="800" 
          delay="${delay}" 
          easing="ease-in-out">
        </a-animation>
        <a-animation 
          attribute="rotation" 
          from="0 0 -45" 
          to="0 0 0" 
          dur="800" 
          delay="${delay}" 
          easing="ease-out">
        </a-animation>
      </a-entity>
    `;
    
    currentX += letterSpacing;
  }
  
  const totalDelay = (text1.length + text2.length) * 100 + 500;
  
  const sceneHTML = `
    <a-scene embedded style="width: 100%; height: 100%;">
      <a-text 
        value="Uniendo textos..." 
        position="-0.5 2.3 -2" 
        color="#4361ee" 
        width="2" 
        align="center">
      </a-text>
      
      ${lettersHTML}
      
      <a-text 
        value='Resultado: "${result}"' 
        position="-0.8 1 -2" 
        color="#2ec4b6" 
        width="2.5" 
        align="center"
        animation="property: opacity; from: 0; to: 1; dur: 1000; delay: ${totalDelay}">
      </a-text>
      
      <a-entity camera look-controls position="0 1.6 0"></a-entity>
    </a-scene>
  `;
  
  return sceneHTML;
}

function showInstructionsModal() {
  if (!problemGenerator.currentProblem || !problemGenerator.currentTestCase) {
    console.error('No problem information to visualize');
    return;
  }
  
  const modal = document.createElement('div');
  modal.id = 'instructions-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.47);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 3000;
  `;

  const modalContent = document.createElement('div');
  modalContent.style.cssText = `
    width: 90vw;
    height: 80vh;
    max-width: 800px;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 20px 25px rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
    position: relative;
    background: #000;
  `;

  const header = document.createElement('div');
  header.style.cssText = `
    padding: 1rem;
    background: #4285f4;
    color: white;
    text-align: center;
    position: relative;
    z-index: 20;
  `;
  header.innerHTML = `
    <h2 style="margin: 0; font-size: 1.3rem; font-weight: 600;">
      ¡Excelente! Tu solución es correcta
    </h2>
    <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem; opacity: 0.9;">
      Observa cómo funciona tu código en realidad aumentada
    </p>
  `;

  const arContainer = document.createElement('div');
  arContainer.id = 'ar-container';
  arContainer.style.cssText = `
    flex: 1;
    position: relative;
    background: #000;
    overflow: hidden;
  `;

  const loadingMessage = document.createElement('div');
  loadingMessage.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: white;
    font-size: 1.2rem;
    text-align: center;
    z-index: 10;
    background: rgba(0, 0, 0, 0.7);
    padding: 2rem;
    border-radius: 8px;
  `;
  loadingMessage.innerHTML = `
    <div style="margin-bottom: 1rem;">📷</div>
    <div>Activando cámara...</div>
  `;
  arContainer.appendChild(loadingMessage);

  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '✕';
  closeBtn.style.cssText = `
    position: absolute;
    top: 1rem;
    right: 1rem;
    width: 40px;
    height: 40px;
    background: rgba(239, 71, 111, 0.9);
    color: white;
    border: none;
    border-radius: 50%;
    font-size: 1.5rem;
    cursor: pointer;
    z-index: 30;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  `;
  
  closeBtn.addEventListener('mouseenter', () => {
    closeBtn.style.background = 'rgba(200, 40, 80, 1)';
    closeBtn.style.transform = 'scale(1.1)';
  });
  
  closeBtn.addEventListener('mouseleave', () => {
    closeBtn.style.background = 'rgba(239, 71, 111, 0.9)';
    closeBtn.style.transform = 'scale(1)';
  });
  
  closeBtn.addEventListener('click', () => {
    if (arStream) {
      arStream.getTracks().forEach(track => track.stop());
      arStream = null;
    }
    modal.remove();
  });

  modalContent.appendChild(header);
  modalContent.appendChild(arContainer);
  modalContent.appendChild(closeBtn);
  modal.appendChild(modalContent);
  document.body.appendChild(modal);

  navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: 'environment',
      width: { ideal: 1280 },
      height: { ideal: 720 }
    }
  })
    .then(function (stream) {
      arStream = stream;
      loadingMessage.remove();
      
      const videoBackground = document.createElement('video');
      videoBackground.id = 'camera-background';
      videoBackground.setAttribute('autoplay', '');
      videoBackground.setAttribute('playsinline', '');
      videoBackground.setAttribute('muted', '');
      videoBackground.srcObject = stream;
      
      videoBackground.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        z-index: 1;
      `;
      
      arContainer.appendChild(videoBackground);
      
      if (problemGenerator.currentProblem.arVisualization) {
        const arScene = createEducationalARScene(
          problemGenerator.currentProblem.arVisualization,
          problemGenerator.currentTestCase,
          problemGenerator.currentTestCase.expected
        );
        
        arScene.style.position = 'absolute';
        arScene.style.top = '0';
        arScene.style.left = '0';
        arScene.style.width = '100%';
        arScene.style.height = '100%';
        arScene.style.zIndex = '2';
        arScene.style.pointerEvents = 'none';
        
        arContainer.appendChild(arScene);
        
        setTimeout(() => {
          const aframeCanvas = arContainer.querySelector('canvas');
          if (aframeCanvas) {
            aframeCanvas.style.background = 'transparent';
          }
          
          const aScene = arContainer.querySelector('a-scene');
          if (aScene) {
            aScene.setAttribute('background', 'transparent: true');
          }
        }, 100);
        
      } else {
        const successMessage = document.createElement('div');
        successMessage.style.cssText = `
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: #06d6a0;
          font-size: 2rem;
          font-weight: bold;
          text-shadow: 3px 3px 8px rgba(0,0,0,0.8);
          text-align: center;
          z-index: 15;
        `;
  successMessage.textContent = '🎉 ¡Problema resuelto!';
        arContainer.appendChild(successMessage);
      }
      
      videoBackground.play().catch(err => {
        console.error('Error playing video:', err);
      });
    })
    .catch(function (err) {
      console.log('No se pudo acceder a la cámara trasera, intentando la frontal...', err);
      
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(function (stream) {
          arStream = stream;
          loadingMessage.remove();
          
          const videoBackground = document.createElement('video');
          videoBackground.id = 'camera-background';
          videoBackground.setAttribute('autoplay', '');
          videoBackground.setAttribute('playsinline', '');
          videoBackground.setAttribute('muted', '');
          videoBackground.srcObject = stream;
          videoBackground.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            z-index: 1;
          `;
          
          arContainer.appendChild(videoBackground);
          
          if (problemGenerator.currentProblem.arVisualization) {
            const arScene = createEducationalARScene(
              problemGenerator.currentProblem.arVisualization,
              problemGenerator.currentTestCase,
              problemGenerator.currentTestCase.expected
            );
            
            arScene.style.position = 'absolute';
            arScene.style.top = '0';
            arScene.style.left = '0';
            arScene.style.width = '100%';
            arScene.style.height = '100%';
            arScene.style.zIndex = '2';
            arScene.style.pointerEvents = 'none';
            
            arContainer.appendChild(arScene);
            
            setTimeout(() => {
              const aframeCanvas = arContainer.querySelector('canvas');
              if (aframeCanvas) {
                aframeCanvas.style.background = 'transparent';
              }
              const aScene = arContainer.querySelector('a-scene');
              if (aScene) {
                aScene.setAttribute('background', 'transparent: true');
              }
            }, 100);
          } else {
            const successMessage = document.createElement('div');
            successMessage.style.cssText = `
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              color: #06d6a0;
              font-size: 2rem;
              font-weight: bold;
              text-shadow: 3px 3px 8px rgba(0,0,0,0.8);
              text-align: center;
              z-index: 15;
            `;
            successMessage.textContent = '🎉 ¡Problema resuelto!';
            arContainer.appendChild(successMessage);
          }
          
          videoBackground.play().catch(err => {
            console.error('Error playing video:', err);
          });
        })
        .catch(function (err) {
          console.error('No se pudo acceder a ninguna cámara:', err);
          loadingMessage.innerHTML = `
            <div style="margin-bottom: 1rem;">❌</div>
            <div>No se pudo acceder a la cámara</div>
            <div style="font-size: 0.9rem; margin-top: 1rem; opacity: 0.8;">
              Revisa los permisos en tu navegador
            </div>
          `;
        });
    });
}

const SPIN_EMOJI_DURATION = 2300;
const SPIN_EMOJI_COUNT = 6;
const SPIN_EMOJIS = ['🎉', '✨', '🥳', '🏆', '👍'];

function getMotivationalMessage(isCorrect) {
  const correctMsgs = [
    '¡Excelente! Respuesta correcta!',
    '¡Muy bien! Sigue así.',
    '¡Perfecto! Tienes gran habilidad.',
    '¡Correcto! Estás mejorando.',
    '¡Genial! Sigue practicando.'
  ];
  const incorrectMsgs = [
    'No te desanimes, inténtalo de nuevo!',
    '¡Ánimo! La práctica te hará mejor.',
    'Sigue adelante, aprender es la meta.',
    'No abandones, cada error es una oportunidad.',
    '¡Vamos! La próxima será mejor.'
  ];
  return isCorrect ?
    correctMsgs[Math.floor(Math.random() * correctMsgs.length)] :
    incorrectMsgs[Math.floor(Math.random() * incorrectMsgs.length)];
}

document.getElementById('newChallenge').addEventListener('click', () => {
  problemGenerator.generateNewProblem();
});

document.getElementById('runCode').addEventListener('click', () => {
  if (!problemGenerator.currentProblem) {
    alert('Genera un desafío primero');
    return;
  }

  try {
    const userCode = Blockly.JavaScript.workspaceToCode(workspace);
    const resultDiv = document.getElementById('executionResult');
    resultDiv.innerHTML = '';

    const functionMatch = userCode.match(/function\s+(\w+)\s*\(/);

    if (!functionMatch) {
      throw new Error('Function definition not found');
    }

    const functionName = functionMatch[1];
    const userFunction = new Function(userCode + `\nreturn ${functionName};`)();

    let allTestsPassed = true;

    for (let i = 0; i < problemGenerator.currentProblem.testCases; i++) {
      const testCase = problemGenerator.currentProblem.generateTestCase();
      const testResult = userFunction(...testCase.input);
      const isEqual = JSON.stringify(testResult) === JSON.stringify(testCase.expected);
      
      if (i === problemGenerator.currentProblem.testCases - 1) {
        problemGenerator.currentTestCase = testCase;
      }
      
      if (!isEqual) allTestsPassed = false;
    }

    if (allTestsPassed) {
      showInstructionsModal();
    } else {
      const tpl = document.getElementById("sceneTplError");
      const node = tpl.content.cloneNode(true);
      resultDiv.appendChild(node);
    }

  } catch (error) {
    document.getElementById('executionResult').innerHTML = `
      <div class="error">
        <h3>Error de ejecución:</h3>
        <p>${error.message}</p>
      </div>
    `;
  }
});

document.getElementById('downloadProject').addEventListener('click', downloadProject);

window.addEventListener('load', () => {
  problemGenerator.generateNewProblem();
});