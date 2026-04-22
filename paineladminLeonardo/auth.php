<?php
declare(strict_types=1);

function admin_password_hash(): string {
    $hash = getenv("ADMIN_PASSWORD_HASH");
    if (is_string($hash) && $hash !== "") return $hash;

    if (function_exists("apache_getenv")) {
        $apache = apache_getenv("ADMIN_PASSWORD_HASH", true);
        if (is_string($apache) && $apache !== "") return $apache;
    }

    $server = $_SERVER["ADMIN_PASSWORD_HASH"] ?? "";
    if (is_string($server) && $server !== "") return $server;

    $env = $_ENV["ADMIN_PASSWORD_HASH"] ?? "";
    if (is_string($env) && $env !== "") return $env;

    return "";
}

function app_base_path(): string {
    $script = $_SERVER["SCRIPT_NAME"] ?? "/";
    if (!is_string($script) || $script === "") $script = "/";
    $base = dirname(dirname($script));
    if ($base === "\\" || $base === ".") $base = "/";
    $base = str_replace("\\", "/", $base);
    if ($base === "/") return "/";
    return rtrim($base, "/") . "/";
}

function start_admin_session(): void {
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    session_name("contactform_admin");

    $forwardedProto = $_SERVER["HTTP_X_FORWARDED_PROTO"] ?? "";
    if (!is_string($forwardedProto)) $forwardedProto = "";

    $isHttps = (!empty($_SERVER["HTTPS"]) && $_SERVER["HTTPS"] !== "off")
        || (isset($_SERVER["SERVER_PORT"]) && (int) $_SERVER["SERVER_PORT"] === 443)
        || strtolower($forwardedProto) === "https";

    session_set_cookie_params([
        "httponly" => true,
        "secure" => $isHttps,
        "samesite" => "Strict",
        "path" => app_base_path(),
    ]);

    ini_set("session.use_only_cookies", "1");
    session_start();
}

function get_request_header(string $name): string {
    $normalized = "HTTP_" . strtoupper(str_replace("-", "_", $name));
    $value = $_SERVER[$normalized] ?? "";
    return is_string($value) ? $value : "";
}

function get_csrf_token(): string {
    start_admin_session();
    if (!isset($_SESSION["csrf"]) || !is_string($_SESSION["csrf"]) || $_SESSION["csrf"] === "") {
        $_SESSION["csrf"] = bin2hex(random_bytes(32));
    }
    return $_SESSION["csrf"];
}

function require_csrf(): void {
    $expected = get_csrf_token();
    $provided = get_request_header("X-CSRF-Token");
    if (!is_string($provided) || $provided === "" || !hash_equals($expected, $provided)) {
        http_response_code(403);
        header("Content-Type: application/json; charset=utf-8");
        echo json_encode(["ok" => false, "error" => "Invalid CSRF token"]);
        exit;
    }
}

function is_admin_authenticated(): bool {
    start_admin_session();
    return isset($_SESSION["is_admin"]) && $_SESSION["is_admin"] === true;
}

function require_admin(): void {
    if (!is_admin_authenticated()) {
        http_response_code(401);
        header("Content-Type: application/json; charset=utf-8");
        echo json_encode(["ok" => false, "error" => "Unauthorized"]);
        exit;
    }
}

function ensure_content_type_json(): void {
    $contentType = $_SERVER["CONTENT_TYPE"] ?? "";
    if (!is_string($contentType)) $contentType = "";
    if ($contentType === "" || stripos($contentType, "application/json") !== 0) {
        http_response_code(415);
        header("Content-Type: application/json; charset=utf-8");
        echo json_encode(["ok" => false, "error" => "Unsupported Content-Type"]);
        exit;
    }
}

function read_json_body(): array {
    ensure_content_type_json();
    $raw = file_get_contents("php://input");
    $data = json_decode($raw ?: "", true);
    if (!is_array($data)) {
        http_response_code(400);
        header("Content-Type: application/json; charset=utf-8");
        echo json_encode(["ok" => false, "error" => "Invalid JSON"]);
        exit;
    }
    return $data;
}

function is_login_locked(): bool {
    start_admin_session();
    $lockUntil = $_SESSION["login_lock_until"] ?? 0;
    if (!is_int($lockUntil)) $lockUntil = 0;
    return $lockUntil > time();
}

function record_failed_login(): void {
    start_admin_session();
    $attempts = $_SESSION["login_attempts"] ?? 0;
    if (!is_int($attempts)) $attempts = 0;
    $attempts += 1;
    $_SESSION["login_attempts"] = $attempts;

    if ($attempts >= 8) {
        $_SESSION["login_lock_until"] = time() + (15 * 60);
    }
}

function clear_login_attempts(): void {
    start_admin_session();
    unset($_SESSION["login_attempts"], $_SESSION["login_lock_until"]);
}

function sanitize_footer_html(string $html): string {
    $clean = strip_tags($html, "<a><span><strong><em><b><i><br><small>");
    $clean = preg_replace('/\son\w+\s*=\s*(".*?"|\'.*?\'|[^\s>]+)/i', "", $clean) ?? "";
    $clean = preg_replace('/href\s*=\s*(["\'])\s*javascript:[\s\S]*?\1/i', 'href="#"', $clean) ?? "";
    $clean = preg_replace('/href\s*=\s*(["\'])\s*data:[\s\S]*?\1/i', 'href="#"', $clean) ?? "";
    return $clean;
}
?>
