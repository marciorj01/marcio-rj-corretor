<?php
/**
 * MRJ CMS - Manipulador Seguro de Gravação e Upload de Mídias
 * Suporta persistência de configurações, imóveis e uploads de fotos/vídeos.
 */

// Headers de segurança e CORS
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');

// Carrega o middleware de autenticação
require_once __DIR__ . '/auth-guard.php';

// Limita método a POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método não permitido']);
    exit;
}

$uploadsDir = __DIR__ . '/uploads';
if (!is_dir($uploadsDir)) {
    mkdir($uploadsDir, 0755, true);
}

// ==============================================================================
// 1. PROCESSAMENTO DE UPLOAD DE ARQUIVOS (Imagens e Vídeos da Capa)
// ==============================================================================
if (!empty($_FILES['file'])) {
    $file = $_FILES['file'];

    if ($file['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Erro no upload do arquivo (Código: ' . $file['error'] . ')']);
        exit;
    }

    // Validação estrita de tipo MIME via finfo binário
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mimeType = $finfo->file($file['tmp_name']);

    $allowedMimes = [
        // Imagens (Máx 8MB)
        'image/jpeg' => ['ext' => 'jpg', 'max_size' => 8 * 1024 * 1024],
        'image/png'  => ['ext' => 'png', 'max_size' => 8 * 1024 * 1024],
        'image/webp' => ['ext' => 'webp', 'max_size' => 8 * 1024 * 1024],
        // Vídeos da Capa (Máx 60MB)
        'video/mp4'  => ['ext' => 'mp4', 'max_size' => 60 * 1024 * 1024],
        'video/webm' => ['ext' => 'webm', 'max_size' => 60 * 1024 * 1024],
        // Documentos PDF (Máx 25MB)
        'application/pdf' => ['ext' => 'pdf', 'max_size' => 25 * 1024 * 1024]
    ];

    if (!array_key_exists($mimeType, $allowedMimes)) {
        http_response_code(415);
        echo json_encode([
            'success' => false,
            'message' => 'Tipo de arquivo não permitido (' . htmlspecialchars($mimeType, ENT_QUOTES, 'UTF-8') . '). Formatos aceitos: JPG, PNG, WEBP, MP4, WEBM e PDF.'
        ]);
        exit;
    }

    $rule = $allowedMimes[$mimeType];
    if ($file['size'] > $rule['max_size']) {
        $maxMb = round($rule['max_size'] / (1024 * 1024));
        http_response_code(413);
        echo json_encode(['success' => false, 'message' => "O arquivo excede o limite máximo permitido de {$maxMb}MB."]);
        exit;
    }

    // Gera nome de arquivo com hash aleatório e extensão segura
    $fileName = bin2hex(random_bytes(16)) . '.' . $rule['ext'];
    $destination = $uploadsDir . '/' . $fileName;

    if (!move_uploaded_file($file['tmp_name'], $destination)) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Falha ao salvar o arquivo no servidor.']);
        exit;
    }

    $publicUrl = 'uploads/' . $fileName;
    echo json_encode([
        'success' => true,
        'url' => $publicUrl,
        'mime' => $mimeType,
        'message' => 'Arquivo enviado com sucesso!'
    ]);
    exit;
}

// ==============================================================================
// 2. PROCESSAMENTO DE SALVAMENTO DE CONFIGURAÇÕES (JSON Payload)
// ==============================================================================
$rawInput = file_get_contents('php://input');
$payload = json_decode($rawInput, true);

if (!$payload) {
    // Tenta receber via formulário POST comum
    $payload = $_POST;
}

if (empty($payload)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Nenhum dado enviado para gravação.']);
    exit;
}

$action = $payload['action'] ?? 'save_all';

// A. Salvar Configurações Gerais do Site (Hero, Cores, Contatos)
if ($action === 'save_config' || $action === 'save_all') {
    $configData = $payload['config'] ?? $payload['site_config'] ?? null;
    if ($configData) {
        $configFile = __DIR__ . '/site-config.json';
        file_put_contents($configFile, json_encode($configData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), LOCK_EX);
    }
}

// B. Salvar Lista de Imóveis
if ($action === 'save_imoveis' || $action === 'save_all') {
    $imoveisData = $payload['imoveis'] ?? $payload['projects'] ?? null;
    if ($imoveisData && is_array($imoveisData)) {
        $imoveisFile = __DIR__ . '/imoveis.json';
        file_put_contents($imoveisFile, json_encode($imoveisData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), LOCK_EX);
    }
}

echo json_encode([
    'success' => true,
    'message' => 'Configurações e imóveis gravados com sucesso no servidor!',
    'updated_at' => date('c')
]);
