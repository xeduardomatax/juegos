# 🎮 Juegos Educativos - Cálculo Mental con AR

Una colección de mini-juegos educativos con características de Realidad Aumentada (AR) para practicar habilidades matemáticas de forma interactiva y divertida.

## 🎯 Características

- **Cálculo Mental**: Practica operaciones matemáticas con diferentes niveles de dificultad
- **Configuración de RA**: Personaliza cada etapa del juego con texto, imágenes, audio y video
- **Tres Etapas Interactivas**:
  - 🚀 **Inicio**: Contenido de bienvenida
  - ✅ **Acierto**: Feedback visual/auditivo cuando aciertas
  - 🏁 **Final**: Pantalla de conclusión con puntuación

## 🚀 Inicio Rápido

### Requisitos
- Node.js (v14 o superior)
- npm o yarn

### Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/tu-usuario/Juegos.git
cd Juegos
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Iniciar el servidor**
```bash
npm start
```

El servidor se iniciará en `http://localhost:3001`

4. **Abrir la aplicación**
Accede a `http://localhost:3001` en tu navegador

## 📁 Estructura del Proyecto

```
Juegos/
├── CalculoMental/          # Juego de cálculo mental
│   ├── index.html
│   ├── script.js
│   ├── style.css
│   ├── ejercicios.json     # Banco de ejercicios
│   ├── Imagen/             # Carpeta de imágenes subidas
│   ├── Audio/              # Carpeta de audios subidos
│   └── Videos/             # Carpeta de videos subidos
├── Encriptación/           # Juego de encriptación
├── Blockly/                # Actividades con Blockly
├── index.html              # Menú principal
├── main-script.js
├── main-style.css
├── upload-server.js        # Servidor de subida de archivos
└── package.json
```

## 🎮 Cómo Usar

### 1. Seleccionar Nivel
Elige entre:
- **Fácil**: Números simples
- **Intermedio**: Operaciones más complejas
- **Avanzado**: Desafíos matemáticos

### 2. Configurar RA (Opcional)
1. Haz clic en "Configuración de RA" antes de empezar
2. Personaliza cada etapa con:
   - 📝 **Texto**: Mensaje personalizado
   - 🖼️ **Imagen**: Sube una imagen (.jpg, .png)
   - 🔊 **Audio**: Sube un audio (.mp3)
   - 🎬 **Video**: Sube un video (.mp4)
3. Haz clic en "Guardar Configuración"

### 3. Comenzar Juego
- Haz clic en "Comenzar juego"
- Resuelve los ejercicios matemáticos
- Valida tus respuestas
- Gana puntos y mejora tu puntuación

## 📝 Añadir Ejercicios

Edita `CalculoMental/ejercicios.json` para agregar nuevos ejercicios:

```json
[
  {
    "nivel": "fácil",
    "operation": "5 + 3",
    "options": [
      { "text": "8", "isCorrect": true },
      { "text": "7", "isCorrect": false },
      { "text": "9", "isCorrect": false }
    ]
  }
]
```

## 🎨 Personalización

- Modifica `main-style.css` para cambiar colores y estilos
- Ajusta la velocidad de visualización en `script.js`
- Cambia los emojis y textos según necesites

## 🛠️ Desarrollo

### Scripts Disponibles

```bash
# Iniciar servidor
npm start

# El servidor escucha en puerto 3001
```

## ⚙️ Configuración del Servidor

El archivo `upload-server.js` maneja:
- Subida de imágenes (.jpg, .png) - Máx 5MB
- Subida de audios (.mp3) - Máx 3MB
- Subida de videos (.mp4) - Máx 10MB

Las carpetas de destino se crean automáticamente si no existen.

## 📊 Estadísticas

Cada sesión de juego muestra:
- Puntuación final
- Errores cometidos
- Tiempo utilizado

## 🎓 Casos de Uso

- 👨‍🏫 Educadores: Personaliza con contenido específico para tu aula
- 👨‍💻 Estudiantes: Practica de forma interactiva y divertida
- 👥 Padres: Herramienta de apoyo escolar en casa

## 🐛 Solución de Problemas

### El servidor no inicia
```bash
# Verifica que el puerto 3001 esté disponible
netstat -ano | findstr :3001

# Si está en uso, cambia el puerto en upload-server.js
```

### Las imágenes no se suben
- Verifica que las carpetas `Imagen/`, `Audio/`, `Videos/` existan
- Comprueba los permisos de escritura
- Revisa la consola del servidor para errores

### El juego se mueve muy rápido/lento
Ajusta `displayTime` en `script.js`:
```javascript
const displayTime = 500; // milisegundos
```

## 📄 Licencia

Este proyecto está bajo licencia MIT - Libre para uso educativo.

## 🤝 Contribuir

¿Tienes ideas para mejorar? ¡Contribuye!

1. Fork el proyecto
2. Crea una rama con tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📞 Soporte

Si tienes preguntas o encuentras problemas, abre un Issue en GitHub.

## 🎉 ¡Diviértete Aprendiendo!

---

**Creado con ❤️ para la educación**
