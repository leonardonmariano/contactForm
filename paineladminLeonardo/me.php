<?php
declare(strict_types=1);

require __DIR__ . DIRECTORY_SEPARATOR . "auth.php";

header("Content-Type: application/json; charset=utf-8");

echo json_encode([
    "ok" => true,
    "authenticated" => is_admin_authenticated(),
    "configured" => admin_password_hash() !== "",
    "csrf" => get_csrf_token(),
]);
?>
