import eel
from BD import database

database.criar_banco()

eel.init('Front-end')

@eel.expose 
def tentar_cadastro(id_usuario, user, nome, cpf, senha, tipo, senha_mestra=""):
    if not id_usuario or not user or not senha:
        return False, "Preencha todos os campos obrigatórios."
    if tipo == "dono":
        senha_CERTA = "admin123"
        if senha_mestra != senha_CERTA:
            return False, "Senha universal incorreta. Cadastro como dono negado!"
    
    sucesso, mensagem = database.cadastrar_usuario(id_usuario, user, nome, cpf, senha, tipo)
    return sucesso, mensagem

