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

require_admin();
require_csrf();

$data = read_json_body();

$allowedKeys = [
    "pageTitle",
    "brandTitle",
    "brandSubtitle",
    "statusPill",
    "heroEyebrow",
    "heroTitle",
    "heroText",
    "logoUrl",
    "logoAlt",
    "footerHtml",
];

$config = [];
foreach ($allowedKeys as $key) {
    $value = $data[$key] ?? "";
    if (!is_string($value)) {
        http_response_code(400);
        echo json_encode(["ok" => false, "error" => "Invalid value for " . $key]);
        exit;
    }
    if (strlen($value) > 5000) {
        http_response_code(400);
        echo json_encode(["ok" => false, "error" => "Value too long for " . $key]);
        exit;
    }
    $config[$key] = $value;
}

$config["footerHtml"] = sanitize_footer_html($config["footerHtml"] ?? "");

$rootDir = dirname(__DIR__);
$configPath = $rootDir . DIRECTORY_SEPARATOR . "site-config.json";

$encoded = json_encode($config, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
if ($encoded === false) {
    http_response_code(500);
    echo json_encode(["ok" => false, "error" => "Failed to encode JSON"]);
    exit;
}

$written = @file_put_contents($configPath, $encoded . PHP_EOL, LOCK_EX);
if ($written === false) {
    http_response_code(500);
    echo json_encode(["ok" => false, "error" => "Failed to write site-config.json"]);
    exit;
}

echo json_encode(["ok" => true]);
?>
