const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Almacenamiento en memoria para archivos
const fileCache = {
    images: [],
    audios: [],
    videos: []
};

// Habilitar CORS
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: false
}));

// Configurar multer para memoria
const memoryStorage = multer.memoryStorage();
const uploadImage = multer({ 
    storage: memoryStorage,
    limits: { fileSize: 5 * 1024 * 1024 }
});
const uploadAudio = multer({ 
    storage: memoryStorage,
    limits: { fileSize: 3 * 1024 * 1024 }
});
const uploadVideo = multer({ 
    storage: memoryStorage,
    limits: { fileSize: 10 * 1024 * 1024 }
});

// Servir archivos estáticos de la raíz
app.use(express.static(__dirname));

// Servir index.html en la raíz
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Endpoint de prueba para verificar configuración
app.get('/test', (req, res) => {
    const config = {
        status: 'online',
        timestamp: new Date().toISOString(),
        cached_files: {
            images: fileCache.images.length,
            audios: fileCache.audios.length,
            videos: fileCache.videos.length
        }
    };
    res.json(config);
});

// Subir imagen
app.post('/upload-image', uploadImage.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No se recibió archivo.' });
    
    // Convertir a Base64
    const base64 = req.file.buffer.toString('base64');
    const dataUrl = `data:${req.file.mimetype};base64,${base64}`;
    
    // Guardar en cache
    fileCache.images.push({
        filename: req.file.originalname,
        url: dataUrl,
        timestamp: Date.now()
    });
    
    // Mantener solo los últimos 5 archivos
    if (fileCache.images.length > 5) {
        fileCache.images.shift();
    }
    
    res.json({ 
        success: true, 
        filename: req.file.originalname, 
        url: dataUrl
    });
});

// Subir audio
app.post('/upload-audio', uploadAudio.single('audio'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No se recibió archivo.' });
    
    // Convertir a Base64
    const base64 = req.file.buffer.toString('base64');
    const dataUrl = `data:${req.file.mimetype};base64,${base64}`;
    
    // Guardar en cache
    fileCache.audios.push({
        filename: req.file.originalname,
        url: dataUrl,
        timestamp: Date.now()
    });
    
    // Mantener solo los últimos 5 archivos
    if (fileCache.audios.length > 5) {
        fileCache.audios.shift();
    }
    
    res.json({ 
        success: true, 
        filename: req.file.originalname, 
        url: dataUrl
    });
});

// Subir video
app.post('/upload-video', uploadVideo.single('video'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No se recibió archivo.' });
    
    // Convertir a Base64
    const base64 = req.file.buffer.toString('base64');
    const dataUrl = `data:${req.file.mimetype};base64,${base64}`;
    
    // Guardar en cache
    fileCache.videos.push({
        filename: req.file.originalname,
        url: dataUrl,
        timestamp: Date.now()
    });
    
    // Mantener solo los últimos 5 archivos
    if (fileCache.videos.length > 5) {
        fileCache.videos.shift();
    }
    
    res.json({ 
        success: true, 
        filename: req.file.originalname, 
        url: dataUrl
    });
});

// Obtener última imagen
app.get('/imagenes/ultima', (req, res) => {
    if (fileCache.images.length > 0) {
        const lastImage = fileCache.images[fileCache.images.length - 1];
        res.json({ url: lastImage.url });
    } else {
        res.json({ url: '' });
    }
});

// Obtener último audio
app.get('/audios/ultima', (req, res) => {
    if (fileCache.audios.length > 0) {
        const lastAudio = fileCache.audios[fileCache.audios.length - 1];
        res.json({ url: lastAudio.url });
    } else {
        res.json({ url: '' });
    }
});

// Obtener último video
app.get('/videos/ultima', (req, res) => {
    if (fileCache.videos.length > 0) {
        const lastVideo = fileCache.videos[fileCache.videos.length - 1];
        res.json({ url: lastVideo.url });
    } else {
        res.json({ url: '' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor de subida escuchando en puerto ${PORT}`);
});
