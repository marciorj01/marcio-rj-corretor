<?php
/**
 * MRJ CMS - Middleware de Autenticação e Segurança (Auth Guard)
 * Protege rotas restritas e valida sessões ativas
 */

if (session_status() === PHP_SESSION_NONE) {
    // Configurações de cookie de sessão seguros
    ini_set('session.cookie_httponly', 1);
    ini_set('session.use_only_cookies', 1);
    if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
        ini_set('session.cookie_secure', 1);
    }
    session_start();
}

// Timeout de inatividade: 30 minutos
$sessionTimeout = 30 * 60;

if (isset($_SESSION['mrj_last_activity'])) {
    if ((time() - $_SESSION['mrj_last_activity']) > $sessionTimeout) {
        session_unset();
        session_destroy();
        handleUnauthorized("Sua sessão expirou por inatividade. Faça login novamente.");
        exit;
    }
}
$_SESSION['mrj_last_activity'] = time();

// Validação de autenticação
if (empty($_SESSION['mrj_authenticated']) || $_SESSION['mrj_authenticated'] !== true) {
    handleUnauthorized("Acesso restrito. Faça login para continuar.");
    exit;
}

/**
 * Responde adequadamente a acessos não autorizados
 */
function handleUnauthorized(string $message): void {
    $isJson = (
        (!empty($_SERVER['HTTP_ACCEPT']) && str_contains($_SERVER['HTTP_ACCEPT'], 'application/json')) ||
        (!empty($_SERVER['CONTENT_TYPE']) && str_contains($_SERVER['CONTENT_TYPE'], 'application/json')) ||
        (!empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest')
    );

    if ($isJson) {
        http_response_code(401);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'success' => false,
            'message' => $message,
            'redirect' => 'login.php'
        ]);
        exit;
    }

    header("Location: login.php?msg=" . urlencode($message));
    exit;
}

/**
 * Helper para validação de token CSRF
 */
function validateCsrfToken(?string $token): bool {
    if (empty($token) || empty($_SESSION['mrj_csrf_token'])) {
        return false;
    }
    return hash_equals($_SESSION['mrj_csrf_token'], $token);
}

/**
 * Gera ou recupera token CSRF
 */
function getCsrfToken(): string {
    if (empty($_SESSION['mrj_csrf_token'])) {
        $_SESSION['mrj_csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['mrj_csrf_token'];
}

