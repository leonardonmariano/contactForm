<?php
$servidor = "localhost";
$usuario = "root";
$senha = "";
$banco = "projetos_culturais";

$conexao = new mysqli($servidor, $usuario, $senha, $banco);

if ($conexao->connect_error) {
    die("Erro de conexão: " . $conexao->connect_error);
}

$titulo = $_POST['Título'];
$descricao = $_POST['descricao'];
$categoria = $_POST['categoria'];
$publico_alvo = $_POST['publico_alvo'];
$periodo_inicio = $_POST['periodo_inicio'];
$periodo_fim = $_POST['periodo_fim'];
$justificativa = $_POST['justificativa'];
$impacto_esperado = $_POST['impacto_esperado'];
$orcamento_total = $_POST['orcamento_total'];
$valor_solicitado = $_POST['valor_solicitado'];
$outros_patrocinios = $_POST['outros_patrocinios'];
$responsavel_nome = $_POST['responsavel_nome'];
$responsavel_contato = $_POST['responsavel_contato'];

$sql = "INSERT INTO projetos (titulo, descricao, categoria, publico_alvo, periodo_inicio, periodo_fim, justificativa, impacto_esperado, orcamento_total, valor_solicitado, outros_patrocinios, responsavel_nome, responsavel_contato) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

$stmt = $conexao->prepare($sql);
$stmt->bind_param("ssssssssssssss", $titulo, $descricao, $categoria, $publico_alvo, $periodo_inicio, $periodo_fim, $justificativa, $impacto_esperado, $orcamento_total, $valor_solicitado, $outros_patrocinios, $responsavel_nome, $responsavel_contato);

if ($stmt->execute()) {
    echo "Projeto cadastrado com sucesso!";
} else {
    echo "Erro ao cadastrar projeto: " . $stmt->error;
}

$stmt->close();
$conexao->close();
?>
