<?php
$servidor = "localhost";
$usuario = "root";
$senha = "";
$banco = "cadastro_de_projetos_culturais_provernet";

$conexao = new mysqli($servidor, $usuario, $senha, $banco);

if ($conexao->connect_error) {
    die("Erro de conexão: " . $conexao->connect_error);
}

$titulo = $_POST['Título'] ?? '';
$descricao = $_POST['descricao'] ?? '';
$categoria = $_POST['categoria'] ?? '';

$sql = $conexao->prepare("INSERT INTO projetos (Título, Descrição, Categoria) VALUES (?, ?, ?)");
$sql->bind_param("sss", $titulo, $descricao, $categoria);

echo "<div style='font-family: Arial, sans-serif; text-align: center; margin-top: 20px;'>"; 
if ($sql->execute()) {
    echo "<div class='mensagem'>Projeto cadastrado com sucesso!</div>";
} else {
    echo "<div class='mensagem' style='color: red;'>Erro ao cadastrar projeto: " . $conexao->error . "</div>";
}
echo "</div>";

$conexao->close();
?>
