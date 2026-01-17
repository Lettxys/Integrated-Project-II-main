import eel
from BD import database

database.criar_banco()

eel.init('Front-end')

@eel.expose 
def tentar_cadastro(user, nome, cpf, senha, tipo, senha_mestra=""):
    if not user or not senha or not nome or not cpf:
        return False, "Preencha todos os campos obrigatórios."
    if tipo == "dono":
        senha_CERTA = "admin123"
        if senha_mestra != senha_CERTA:
            return False, "Senha universal incorreta. Cadastro como dono negado!"
    
    sucesso, mensagem = database.cadastrar_usuario(user, nome, cpf, senha, tipo)
    return sucesso, mensagem

@eel.expose 
def tentar_login(user, senha):
    sucesso, nome_encontrado, tipo_conta = database.validar_login(user, senha)

    if sucesso:
        print(f"Login realizado: {nome_encontrado} ({tipo_conta})")
        return True, f"Bem-vindo, {nome_encontrado}!"
    else:
        return False, "Usuário ou senha incorretos."
    


eel.start('html/index.html', size=(1200, 800))