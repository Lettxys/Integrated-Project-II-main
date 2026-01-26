# Mercado Ximenes - Sistema de Gestão (PDV)

Este projeto é um sistema completo de Ponto de Venda (PDV) e Gestão de Estoque para um mercado, desenvolvido com **Python (Eel)** e **SQLite** no backend, e **HTML/CSS/JS** no frontend.

## Funcionalidades Principais

*   **Autenticação e Perfis:**
    *   Login seguro com senhas criptografadas (PBKDF2).
    *   Dois perfis de usuário: **Dono** (acesso total) e **Caixa** (acesso restrito a vendas).
    *   Cadastro de novos funcionários.
*   **Gestão de Estoque:**
    *   Adicionar e editar produtos.
    *   Visualização em cards com busca inteligente (ignora acentos e maiúsculas/minúsculas).
    *   Listagem alfabética e por ordem de adição.
*   **Frente de Caixa (PDV):**
    *   Busca rápida de produtos por nome (Autocomplete).
    *   Adição de itens ao carrinho com cálculo automático.
    *   Múltiplos métodos de pagamento (Dinheiro, Pix, Cartão).
*   **Vendas Parceladas / Fiado:**
    *   Opção de marcar uma venda como "Parcelada" ou "Pendente".
    *   Registro de detalhes do parcelamento (ex: "Entrada + 2x").
*   **Histórico de Vendas:**
    *   Visualização detalhada de todas as vendas agrupadas por mês.
    *   Resumo financeiro (Entradas, Saídas, Lucro).
    *   **Gestão de Pagamentos:** Marcar vendas pendentes como "Pagas" diretamente no histórico.

## Tecnologias Utilizadas

*   **Backend:** Python 3
*   **Interface Gráfica:** Eel (Biblioteca Python que permite criar GUIs usando tecnologias Web)
*   **Banco de Dados:** SQLite 3
*   **Frontend:** HTML5, CSS3 (Grid/Flexbox), JavaScript (ES6+)
*   **Ícones:** Font Awesome

## Instalação e Execução

1.  **Pré-requisitos:**
    *   Tenha o [Python 3.x](https://www.python.org/downloads/) instalado.

2.  **Instalar Dependências:**
    Abra o terminal na pasta do projeto e execute:
    ```bash
    pip install eel
    ```

3.  **Executar o Sistema:**
    ```bash
    python main.py
    ```

## Acesso Inicial (Padrão)

Ao rodar o sistema pela primeira vez, um usuário administrador padrão será criado automaticamente:

*   **Usuário:** `admin`
*   **Senha:** `admin123`

> **Nota:** Recomenda-se criar um novo usuário "Dono" e remover ou alterar a senha do admin padrão para segurança.

## Estrutura do Projeto

*   **`main.py`**: Arquivo principal. Inicia o servidor Eel e expõe as funções Python para o JavaScript.
*   **`BD/`**:
    *   `database.py`: Lógica de conexão com o banco, criação de tabelas e queries SQL.
    *   `mercado_projeto.db`: Arquivo do banco de dados (criado automaticamente).
*   **`Front-end/`**:
    *   `html/`: Telas do sistema (Login, Estoque, Compras, Histórico).
    *   `css/`: Estilos das páginas.
    *   `js/`: Lógica de interface e comunicação com o Python.
    *   `img/`: Imagens e logotipos.

## Segurança

*   **Senhas:** Todas as senhas são armazenadas como hashes seguros (PBKDF2 com Salt).
*   **Preços:** O cálculo do valor total da venda é feito exclusivamente no servidor (backend) para impedir manipulação de preços pelo navegador.
*   **SQL Injection:** Uso estrito de queries parametrizadas em todas as operações de banco de dados.

## Notas de Desenvolvimento

*   O sistema suporta busca insensível a acentos (ex: buscar "pao" encontra "Pão").
*   O layout é responsivo e se adapta a diferentes tamanhos de janela.
*   Em caso de atualização da página (F5), o servidor aguarda 5 segundos antes de encerrar, evitando quedas acidentais.
