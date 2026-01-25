import eel
from BD import database

# Inicializa o banco de dados e cria tabelas/usuários padrão se necessário
database.criar_banco()

# Inicializa a pasta do front-end
eel.init('Front-end')

# --- Funções Expostas para o JavaScript (Eel) ---

@eel.expose 
def tentar_cadastro(user, nome, cpf, senha, tipo, senha_mestra=""):
    """
    Tenta cadastrar um novo usuário.
    Se o tipo for 'dono', exige validação com a senha do usuário 'admin'.
    """
    if not user or not senha or not nome or not cpf:
        return False, "Preencha todos os campos obrigatórios."
    if tipo == "dono":
        # Verifica se a senha mestra corresponde à senha do administrador
        # O usuário 'admin' é garantido pela função database.criar_banco()
        is_admin, _, _ = database.validar_login("admin", senha_mestra)
        if not is_admin:
            return False, "Senha universal incorreta. Cadastro como dono negado!"
    
    sucesso, mensagem = database.cadastrar_usuario(user, nome, cpf, senha, tipo)
    return sucesso, mensagem

@eel.expose 
def tentar_login(user, senha):
    """
    Tenta realizar o login.
    Retorna (Sucesso, Mensagem, TipoUsuario).
    """
    sucesso, nome_encontrado, tipo_conta = database.validar_login(user, senha)

    if sucesso:
        print(f"Login realizado: {nome_encontrado} ({tipo_conta})")
        return True, f"Bem-vindo, {nome_encontrado}!", tipo_conta
    else:
        return False, "Usuário ou senha incorretos.", None
    
@eel.expose
def autocomplete_produtos(texto):
    """Retorna sugestões de produtos para o campo de busca."""
    return database.autocomplete_produtos(texto)

@eel.expose
def buscar_produto(nome):
    """Busca detalhes de um produto específico."""
    return database.buscar_produto(nome)

@eel.expose
def salvar_produto(nome, preco_compra, preco_venda, quantidade):
    """Salva ou atualiza um produto no estoque."""
    return database.salvar_produto(nome, preco_compra, preco_venda, quantidade)

@eel.expose
def obter_produtos():
    """Retorna a lista completa de produtos."""
    return database.listar_produtos()

@eel.expose
def realizar_venda(total, metodo, descricao, lista_itens):
    """
    Registra uma venda.
    O total é recalculado no backend por segurança.
    """
    return database.registrar_venda(total, metodo, descricao, lista_itens)

@eel.expose
def carregar_historico():
    """Retorna o histórico de vendas."""
    return database.obter_historico_vendas()

# Inicia a aplicação Eel
if __name__ == "__main__":
    eel.start('html/index.html', size=(1200, 800))
