# Provenet Cultural — Plataforma de Projetos Culturais

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![PHP](https://img.shields.io/badge/PHP-777BB4?style=flat-square&logo=php&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=flat-square&logo=mysql&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)

Plataforma web completa para **cadastro, avaliação automática e pré-seleção de projetos culturais**, simulando um fluxo real de editais corporativos. Desenvolvida com foco em experiência do usuário, acessibilidade e boas práticas de segurança.

---

## Visão Geral

O sistema guia o proponente por um **formulário wizard de 7 etapas**, coleta todos os dados do projeto e gera automaticamente uma **pontuação de aderência** para apoiar o comitê de patrocínio na curadoria. Conta também com um **painel administrativo** protegido por autenticação para visualização e gestão das propostas recebidas.

---

## Funcionalidades

- **Wizard multi-step** com 7 etapas progressivas e barra de progresso visual
- **Validações em tempo real** por etapa, com feedback visual e mensagens claras
- **Campos dinâmicos** para adicionar despesas orçamentárias e membros da equipe executora
- **Cálculo automático de pontuação** com classificação de aderência ao edital
- **Resumo completo** de todos os dados preenchidos antes do envio
- **Salvar rascunho** para retomar o preenchimento posteriormente
- **Painel administrativo** com autenticação para gerenciar propostas recebidas
- **Configuração via JSON** — título, marca e textos sem editar o HTML
- **Headers de segurança** configurados no `.htaccess` (CSP, HSTS, X-Frame-Options)
- **Compressão e cache** de assets via `.htaccess` para melhor performance
- Layout **totalmente responsivo** para mobile, tablet e desktop

---

## Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| Frontend | HTML5 semântico, CSS3 (Flexbox + Grid), JavaScript ES6+ |
| Backend | PHP 8+ |
| Banco de dados | MySQL |
| Servidor | Apache (`.htaccess`) |

---

## Estrutura do Projeto

```
contactForm/
├── index.html              # Formulário público (wizard multi-step)
├── style.css               # Estilos globais
├── app.js                  # Lógica do wizard, validações e pontuação
├── submit.php              # Endpoint de envio ao banco de dados
├── database.sql            # Schema do banco de dados
├── site-config.json        # Configurações de marca e textos
├── .htaccess               # Segurança, compressão e cache
├── adminleo/               # Painel administrativo
│   ├── index.html
│   ├── login.php
│   ├── logout.php
│   ├── auth.php
│   ├── me.php
│   └── save-config.php
└── paineladminLeonardo/    # Área reservada de gestão
```

---

## Como rodar localmente

### Pré-requisitos

- PHP 8.0+
- MySQL 5.7+ ou MariaDB
- Apache com `mod_rewrite` habilitado (XAMPP, WAMP, Laragon ou similar)

### Passo a passo

1. **Clone o repositório**
   ```bash
   git clone https://github.com/leonardonmariano/contactForm.git
   cd contactForm
   ```

2. **Configure o banco de dados**

   Crie o banco e as tabelas a partir do schema:
   ```bash
   mysql -u root -p < database.sql
   ```

3. **Configure as credenciais do banco**

   Edite o arquivo `submit.php` com suas credenciais locais:
   ```php
   $servidor = "localhost";
   $usuario  = "seu_usuario";
   $senha    = "sua_senha";
   $banco    = "projetos_culturais";
   ```

4. **Sirva o projeto pelo Apache**

   Coloque a pasta dentro do diretório raiz do seu servidor (ex: `htdocs/` no XAMPP) e acesse:
   ```
   http://localhost/contactForm/
   ```

5. **Painel administrativo**

   Acesse em:
   ```
   http://localhost/contactForm/adminleo/
   ```

---

## Configuração de Marca

Edite o arquivo `site-config.json` para personalizar títulos, subtítulos e textos sem precisar alterar o HTML:

```json
{
  "pageTitle": "Plataforma de Projetos Culturais | Provenet",
  "brandTitle": "Provenet Cultural",
  "brandSubtitle": "Plataforma de patrocínios privados",
  "heroTitle": "Envie sua proposta cultural com clareza e impacto"
}
```

---

## Segurança

O arquivo `.htaccess` inclui as seguintes proteções:

- `Options -Indexes` — desabilita listagem de diretórios
- `Content-Security-Policy` — restringe fontes de scripts e recursos
- `X-Frame-Options: DENY` — previne clickjacking
- `Strict-Transport-Security` — força HTTPS
- `X-Content-Type-Options: nosniff` — previne MIME sniffing

> **Atenção:** Nunca suba credenciais reais de banco de dados para o repositório. Use variáveis de ambiente ou um arquivo de configuração separado e adicionado ao `.gitignore`.

---

## Licença

Este projeto está licenciado sob a [MIT License](LICENSE).

---

<p align="center">
  Desenvolvido por <a href="https://github.com/leonardonmariano">Leonardo Nascimento</a>
</p>
