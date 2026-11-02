<?php
/**
 * MRJ CMS - Tela de Login Seguro com Proteção Anti-Força Bruta e CSRF
 */

if (session_status() === PHP_SESSION_NONE) {
    ini_set('session.cookie_httponly', 1);
    ini_set('session.use_only_cookies', 1);
    if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
        ini_set('session.cookie_secure', 1);
    }
    session_start();
}

// Se já estiver logado, redireciona para admin.html
if (!empty($_SESSION['mrj_authenticated']) && $_SESSION['mrj_authenticated'] === true) {
    header("Location: admin.html");
    exit;
}

// Arquivo de configuração de credenciais
$authConfigFile = __DIR__ . '/auth-config.json';
if (!file_exists($authConfigFile)) {
    // Cria credenciais padrão na primeira execução: usuário 'marcio' e senha 'mrj@2025'
    $defaultAuthConfig = [
        'user' => 'marcio',
        'password_hash' => password_hash('mrj@2025', PASSWORD_DEFAULT),
        'updated_at' => date('c')
    ];
    file_put_contents($authConfigFile, json_encode($defaultAuthConfig, JSON_PRETTY_PRINT));
}

$authConfig = json_decode(file_get_contents($authConfigFile), true);

// ==============================================================================
// SISTEMA DE RATE LIMITING (Máximo 5 tentativas a cada 15 minutos por IP)
// ==============================================================================
$rateLimitFile = __DIR__ . '/login-attempts.json';
$maxAttempts = 5;
$lockoutTime = 15 * 60; // 15 minutos
$clientIp = $_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
// Sanitiza IP
$clientIp = filter_var(explode(',', $clientIp)[0], FILTER_VALIDATE_IP) ?: '0.0.0.0';

$attemptsData = [];
if (file_exists($rateLimitFile)) {
    $attemptsData = json_decode(file_get_contents($rateLimitFile), true) ?: [];
}

// Limpeza de tentativas antigas
$currentTime = time();
foreach ($attemptsData as $ip => $info) {
    if (($currentTime - $info['last_attempt']) > $lockoutTime) {
        unset($attemptsData[$ip]);
    }
}

$isBlocked = false;
$secondsRemaining = 0;
if (isset($attemptsData[$clientIp])) {
    if ($attemptsData[$clientIp]['count'] >= $maxAttempts) {
        $elapsed = $currentTime - $attemptsData[$clientIp]['last_attempt'];
        if ($elapsed < $lockoutTime) {
            $isBlocked = true;
            $secondsRemaining = $lockoutTime - $elapsed;
        } else {
            // Tempo expirou, zera contador
            unset($attemptsData[$clientIp]);
        }
    }
}

// ==============================================================================
// PROCESSAMENTO DO FORMULÁRIO (POST)
// ==============================================================================
$errorMessage = '';
$successMessage = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // 1. Verifica se IP está bloqueado
    if ($isBlocked) {
        $minutes = ceil($secondsRemaining / 60);
        $errorMessage = "Muitas tentativas incorretas. Acesso bloqueado por segurança por mais {$minutes} minuto(s).";
    } else {
        // 2. Validação CSRF
        $submittedCsrf = $_POST['csrf_token'] ?? '';
        if (empty($_SESSION['mrj_csrf_token']) || !hash_equals($_SESSION['mrj_csrf_token'], $submittedCsrf)) {
            $errorMessage = "Token de segurança inválido ou expirado. Tente novamente.";
        } else {
            $username = trim($_POST['username'] ?? '');
            $password = trim($_POST['password'] ?? '');

            $validUser = $authConfig['user'] ?? 'marcio';
            $validHash = $authConfig['password_hash'] ?? '';

            // Verifica usuário e hash
            if ($username === $validUser && password_verify($password, $validHash)) {
                // Sucesso: zera tentativas de falha
                unset($attemptsData[$clientIp]);
                file_put_contents($rateLimitFile, json_encode($attemptsData), LOCK_EX);

                // Regeneração de ID de sessão contra Session Fixation
                session_regenerate_id(true);
                $_SESSION['mrj_authenticated'] = true;
                $_SESSION['mrj_user'] = $username;
                $_SESSION['mrj_last_activity'] = time();

                // Gera novo CSRF para a sessão autenticada
                $_SESSION['mrj_csrf_token'] = bin2hex(random_bytes(32));

                header("Location: admin.html");
                exit;
            } else {
                // Falha: incrementa contador de tentativas
                if (!isset($attemptsData[$clientIp])) {
                    $attemptsData[$clientIp] = ['count' => 0, 'last_attempt' => $currentTime];
                }
                $attemptsData[$clientIp]['count']++;
                $attemptsData[$clientIp]['last_attempt'] = $currentTime;
                file_put_contents($rateLimitFile, json_encode($attemptsData), LOCK_EX);

                $remaining = max(0, $maxAttempts - $attemptsData[$clientIp]['count']);
                if ($remaining > 0) {
                    $errorMessage = "Usuário ou senha incorretos. Você tem mais {$remaining} tentativa(s).";
                } else {
                    $errorMessage = "Tentativas excedidas! O acesso foi bloqueado por 15 minutos por segurança.";
                    $isBlocked = true;
                }
            }
        }
    }
}

// Gera token CSRF para o formulário
if (empty($_SESSION['mrj_csrf_token'])) {
    $_SESSION['mrj_csrf_token'] = bin2hex(random_bytes(32));
}
$csrfToken = $_SESSION['mrj_csrf_token'];
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Acesso Administrativo | Marcio Rogério CMS</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Manrope:wght@600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0f1013;
      --card-bg: #18191f;
      --gold: #b49a70;
      --gold-dark: #8f744e;
      --text: #ffffff;
      --muted: #8b8d98;
      --danger: #ef4444;
      --border: rgba(180, 154, 112, 0.25);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: 'DM Sans', sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      position: relative;
      overflow-x: hidden;
    }
    body::before {
      content: "";
      position: absolute;
      top: -20%;
      left: 50%;
      transform: translateX(-50%);
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, rgba(180, 154, 112, 0.12) 0%, transparent 70%);
      pointer-events: none;
    }
    .login-container {
      width: 100%;
      max-width: 420px;
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 40px 32px;
      box-shadow: 0 30px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(180, 154, 112, 0.08);
      position: relative;
      z-index: 1;
    }
    .brand-header {
      text-align: center;
      margin-bottom: 28px;
    }
    .brand-mark {
      width: 44px;
      height: 44px;
      margin: 0 auto 14px;
      display: grid;
      place-items: center;
      border: 1px solid var(--gold);
      color: var(--gold);
      font: 700 15px Georgia, serif;
    }
    .brand-title {
      font-family: 'Manrope', sans-serif;
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.02em;
      margin-bottom: 6px;
    }
    .brand-sub {
      color: var(--muted);
      font-size: 13px;
    }
    .alert-error {
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #fca5a5;
      padding: 12px 14px;
      border-radius: 6px;
      font-size: 12px;
      margin-bottom: 20px;
      line-height: 1.4;
    }
    .form-group {
      margin-bottom: 18px;
    }
    .form-label {
      display: block;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--gold);
      margin-bottom: 8px;
    }
    .form-input {
      width: 100%;
      background: #111215;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      padding: 13px 15px;
      color: #fff;
      font-size: 14px;
      font-family: inherit;
      transition: all 0.2s;
    }
    .form-input:focus {
      outline: none;
      border-color: var(--gold);
      box-shadow: 0 0 0 3px rgba(180, 154, 112, 0.2);
      background: #0b0c0e;
    }
    .btn-submit {
      width: 100%;
      min-height: 48px;
      background: var(--gold);
      color: #fff;
      border: none;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.2s;
      margin-top: 10px;
    }
    .btn-submit:hover:not(:disabled) {
      background: var(--gold-dark);
      transform: translateY(-1px);
    }
    .btn-submit:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .login-footer {
      text-align: center;
      margin-top: 24px;
      font-size: 11px;
      color: var(--muted);
    }
    .login-footer a {
      color: var(--gold);
      text-decoration: none;
    }
    .login-footer a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="login-container">
    <div class="brand-header">
      <div class="brand-mark">MR</div>
      <h1 class="brand-title">Painel de Controle</h1>
      <p class="brand-sub">Gestão visual e imobiliária (MRJ CMS)</p>
    </div>

    <?php if (!empty($errorMessage)): ?>
      <div class="alert-error">
        <strong>Atenção:</strong> <?= htmlspecialchars($errorMessage, ENT_QUOTES, 'UTF-8') ?>
      </div>
    <?php endif; ?>

    <form method="POST" action="login.php" autocomplete="off">
      <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($csrfToken, ENT_QUOTES, 'UTF-8') ?>">

      <div class="form-group">
        <label class="form-label" for="username">Usuário</label>
        <input class="form-input" type="text" id="username" name="username" value="marcio" required <?= $isBlocked ? 'disabled' : '' ?>>
      </div>

      <div class="form-group">
        <label class="form-label" for="password">Senha de Acesso</label>
        <input class="form-input" type="password" id="password" name="password" placeholder="••••••••" autofocus required <?= $isBlocked ? 'disabled' : '' ?>>
      </div>

      <button type="submit" class="btn-submit" <?= $isBlocked ? 'disabled' : '' ?>>
        Entrar no Painel →
      </button>
    </form>

    <div class="login-footer">
      <p>Acesso protegido por criptografia e rate-limiting.</p>
      <p style="margin-top:8px;"><a href="index.html">← Voltar para o Site</a></p>
    </div>
  </div>
</body>
</html>

