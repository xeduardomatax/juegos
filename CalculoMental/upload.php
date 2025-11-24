<?php
// upload.php
// Carpeta destino según tipo
$allowed_types = ['Imagen', 'Audio', 'Videos'];
$type = isset($_POST['type']) ? $_POST['type'] : '';
if (!in_array($type, $allowed_types)) {
    die('Tipo de archivo no permitido');
}

$folder = $type;
$target_dir = __DIR__ . "/$folder/";
if (!is_dir($target_dir)) {
    mkdir($target_dir, 0777, true);
}

if (isset($_FILES['file'])) {
    $file = $_FILES['file'];
    $filename = basename($file['name']);
    $target_file = $target_dir . $filename;
    if (move_uploaded_file($file['tmp_name'], $target_file)) {
        echo "Archivo subido correctamente a $folder/$filename";
    } else {
        echo "Error al subir el archivo";
    }
} else {
    echo "No se recibió archivo";
}
?>
