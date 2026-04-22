<?php
declare(strict_types=1);

require __DIR__ . DIRECTORY_SEPARATOR . "auth.php";

header("Content-Type: application/json; charset=utf-8");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["ok" => false, "error" => "Method not allowed"]);
    exit;
}

require_admin();
require_csrf();

start_admin_session();
$_SESSION = [];

if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), "", time() - 42000, $params["path"], $params["domain"] ?? "", (bool) $params["secure"], (bool) $params["httponly"]);
}

session_destroy();
echo json_encode(["ok" => true]);
?>
