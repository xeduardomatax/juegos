const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Habilitar CORS
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: false
}));

// Configurar Cloudinary con credenciales por defecto (cuenta gratuita)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dyyqzm0gn',
    api_key: process.env.CLOUDINARY_API_KEY || '187945893884849',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'cFh-YP7P0K4nq0Qf-3T4VLhOx3I'
});

// Configurar almacenamiento en Cloudinary para imágenes
const imageStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'juegos/imagenes',
        resource_type: 'auto',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp']
    }
});

// Configurar almacenamiento en Cloudinary para audios
const audioStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'juegos/audios',
        resource_type: 'auto',
        allowed_formats: ['mp3', 'wav', 'ogg', 'm4a']
    }
});

// Configurar almacenamiento en Cloudinary para videos
const videoStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'juegos/videos',
        resource_type: 'video',
        allowed_formats: ['mp4', 'webm', 'ogg', 'mov']
    }
});

const uploadImage = multer({ storage: imageStorage });
const uploadAudio = multer({ storage: audioStorage });
const uploadVideo = multer({ storage: videoStorage });

// Servir archivos estáticos de la raíz
app.use(express.static(__dirname));

// Servir index.html en la raíz
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Endpoint de prueba para verificar configuración
app.get('/test', (req, res) => {
    const config = {
        cloudinary_configured: !!cloudinary.config().cloud_name,
        node_env: process.env.NODE_ENV || 'production',
        timestamp: new Date().toISOString()
    };
    res.json(config);
});

// Subir imagen
app.post('/upload-image', uploadImage.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No se recibió archivo.' });
    res.json({ 
        success: true, 
        filename: req.file.filename, 
        url: req.file.secure_url || req.file.url 
    });
});

// Subir audio
app.post('/upload-audio', uploadAudio.single('audio'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No se recibió archivo.' });
    res.json({ 
        success: true, 
        filename: req.file.filename, 
        url: req.file.secure_url || req.file.url 
    });
});

// Subir video
app.post('/upload-video', uploadVideo.single('video'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No se recibió archivo.' });
    res.json({ 
        success: true, 
        filename: req.file.filename, 
        url: req.file.secure_url || req.file.url 
    });
});

// Obtener última imagen
app.get('/imagenes/ultima', async (req, res) => {
    try {
        const result = await cloudinary.search
            .expression('folder:juegos/imagenes')
            .sort_by('created_at', 'desc')
            .max_results(1)
            .execute();
        
        if (result.resources && result.resources.length > 0) {
            const lastFile = result.resources[0];
            res.json({ url: lastFile.secure_url });
        } else {
            res.json({ url: '' });
        }
    } catch (err) {
        console.error('Error en /imagenes/ultima:', err);
        res.json({ url: '' });
    }
});

// Obtener último audio
app.get('/audios/ultima', async (req, res) => {
    try {
        const result = await cloudinary.search
            .expression('folder:juegos/audios')
            .sort_by('created_at', 'desc')
            .max_results(1)
            .execute();
        
        if (result.resources && result.resources.length > 0) {
            const lastFile = result.resources[0];
            res.json({ url: lastFile.secure_url });
        } else {
            res.json({ url: '' });
        }
    } catch (err) {
        console.error('Error en /audios/ultima:', err);
        res.json({ url: '' });
    }
});

// Obtener último video
app.get('/videos/ultima', async (req, res) => {
    try {
        const result = await cloudinary.search
            .expression('folder:juegos/videos')
            .sort_by('created_at', 'desc')
            .max_results(1)
            .execute();
        
        if (result.resources && result.resources.length > 0) {
            const lastFile = result.resources[0];
            res.json({ url: lastFile.secure_url });
        } else {
            res.json({ url: '' });
        }
    } catch (err) {
        console.error('Error en /videos/ultima:', err);
        res.json({ url: '' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor de subida escuchando en puerto ${PORT}`);
});
