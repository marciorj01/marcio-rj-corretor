<?php
/**
 * MRJ CMS - Logout Seguro e Destruição de Sessão
 */

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Limpa variáveis de sessão
$_SESSION = [];

// Invalida o cookie de sessão no navegador
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(
        session_name(),
        '',
        time() - 42000,
        $params["path"],
        $params["domain"],
        $params["secure"],
        $params["httponly"]
    );
}

// Destrói a sessão
session_destroy();

// Redireciona para login ou home
header("Location: login.php?msg=" . urlencode("Sessão encerrada com sucesso."));
exit;

