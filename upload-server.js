const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;

// Carpetas destino
const IMAGE_DIR = path.join(__dirname, 'CalculoMental', 'Imagen');
const AUDIO_DIR = path.join(__dirname, 'CalculoMental', 'Audio');
const VIDEO_DIR = path.join(__dirname, 'CalculoMental', 'Videos');
[IMAGE_DIR, AUDIO_DIR, VIDEO_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Multer configs
const imageStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, IMAGE_DIR),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + '-' + file.originalname)
});
const audioStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, AUDIO_DIR),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + '-' + file.originalname)
});
const videoStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, VIDEO_DIR),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + '-' + file.originalname)
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

// Subir imagen
app.post('/upload-image', uploadImage.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No se recibió archivo.' });
    const url = `/CalculoMental/Imagen/${req.file.filename}`;
    res.json({ success: true, filename: req.file.filename, url: url });
});

// Subir audio (solo formatos comunes y tamaño máximo 5MB)
app.post('/upload-audio', uploadAudio.single('audio'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No se recibió archivo.' });
    const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'];
    if (!allowedTypes.includes(req.file.mimetype) || req.file.size > 5 * 1024 * 1024) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: 'Formato o tamaño de audio no permitido.' });
    }
    const url = `/CalculoMental/Audio/${req.file.filename}`;
    res.json({ success: true, filename: req.file.filename, url: url });
});

// Subir video (solo formatos comunes y tamaño máximo 10MB)
app.post('/upload-video', uploadVideo.single('video'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No se recibió archivo.' });
    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg'];
    if (!allowedTypes.includes(req.file.mimetype) || req.file.size > 10 * 1024 * 1024) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: 'Formato o tamaño de video no permitido.' });
    }
    const url = `/CalculoMental/Videos/${req.file.filename}`;
    res.json({ success: true, filename: req.file.filename, url: url });
});

// Obtener última imagen
app.get('/imagenes/ultima', (req, res) => {
    fs.readdir(IMAGE_DIR, (err, files) => {
        if (err || !files.length) return res.json({ url: '' });
        const lastFile = files.map(f => ({
            name: f,
            time: fs.statSync(path.join(IMAGE_DIR, f)).mtime.getTime()
        })).sort((a, b) => b.time - a.time)[0].name;
        res.json({ url: `/CalculoMental/Imagen/${lastFile}` });
    });
});

// Obtener último audio
app.get('/audios/ultima', (req, res) => {
    fs.readdir(AUDIO_DIR, (err, files) => {
        if (err || !files.length) return res.json({ url: '' });
        const lastFile = files.map(f => ({
            name: f,
            time: fs.statSync(path.join(AUDIO_DIR, f)).mtime.getTime()
        })).sort((a, b) => b.time - a.time)[0].name;
        res.json({ url: `/CalculoMental/Audio/${lastFile}` });
    });
});

// Obtener último video
app.get('/videos/ultima', (req, res) => {
    fs.readdir(VIDEO_DIR, (err, files) => {
        if (err || !files.length) return res.json({ url: '' });
        const lastFile = files.map(f => ({
            name: f,
            time: fs.statSync(path.join(VIDEO_DIR, f)).mtime.getTime()
        })).sort((a, b) => b.time - a.time)[0].name;
        res.json({ url: `/CalculoMental/Videos/${lastFile}` });
    });
});

app.listen(PORT, () => {
    console.log(`Servidor de subida escuchando en http://localhost:${PORT}`);
});
