from core.db import DB
from core.registro import Registro

class App():
    def __init__(self):
        self.db_config = {
                'host': '127.0.0.1',
                'user': 'root',
                'password': 'root',
                'database': 'mercado'
                }
        self.db_manager = None

        try:
            self.db_manager = DB(**self.db_config)
            self.db_manager.__enter__()
        except Exception as e:
            print("Erro de Conexão DB", f"Não foi possível conectar ao banco de dados: {e}")
            self.db_manager = None
            return
        
        self.registro = Registro(self.db_manager)

    def cadastrar_usuario(self):
        while True:
            nome = input("Nome: ")
            cpf = input("CPF: ")
            usuario = input("Usuário: ")
            senha = input("senha: ")
            mensagem = self.registro.cadastrar( nome, cpf, usuario, senha )
            print(mensagem)
            if  mensagem == "usuário cadastrado":
                break


if __name__ == "__main__":
    app = App()
    app.cadastrar_usuario()