<?php
declare(strict_types=1);

require __DIR__ . DIRECTORY_SEPARATOR . "auth.php";

header("Content-Type: application/json; charset=utf-8");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["ok" => false, "error" => "Method not allowed"]);
    exit;
}

$hash = admin_password_hash();
if ($hash === "") {
    http_response_code(500);
    echo json_encode(["ok" => false, "error" => "Admin password not configured"]);
    exit;
}

require_csrf();

if (is_login_locked()) {
    http_response_code(429);
    echo json_encode(["ok" => false, "error" => "Too many attempts"]);
    exit;
}

$data = read_json_body();
$password = $data["password"] ?? "";
if (!is_string($password) || $password === "") {
    http_response_code(400);
    echo json_encode(["ok" => false, "error" => "Password required"]);
    exit;
}

start_admin_session();
if (!password_verify($password, $hash)) {
    record_failed_login();
    http_response_code(401);
    echo json_encode(["ok" => false, "error" => "Invalid credentials"]);
    exit;
}

session_regenerate_id(true);
$_SESSION["is_admin"] = true;
clear_login_attempts();

echo json_encode(["ok" => true]);
?>
