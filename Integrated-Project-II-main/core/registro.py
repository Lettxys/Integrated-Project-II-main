class Registro():
    def __init__(self, db):
        self.db = db

    def cadastrar(self, nome, cpf, usuario, senha):
        query = "SELECT COUNT(*) FROM usuario WHERE login = %s"
        resultado = self.db.fetch_data( query,(usuario,))
        cpf_query = "SELECT COUNT(*) FROM usuario WHERE cpf = %s"
        cpf_resultado =self.db.fetch_data( cpf_query,(cpf,))
        tem_num = any(char.isdigit() for char in senha)
        tem_esp = any(not char.isalnum() for char in senha)

        if resultado and resultado[0][0] > 0:
            return "já existe o usuario"
        elif cpf_resultado and cpf_resultado[0][0] > 0:
            return "CPF já cadstrado"
        elif not tem_esp or not tem_num:
            return "precisa ter número e caractere especial"
            
        elif len(senha)< 8:
            return "senha tem que ter no mínimo 8 caracteres"
        

        else:
            insert_query = """INSERT INTO usuario (nome, cpf, login, senha)
            VALUES (%s, %s, %s, %s)
        
            """
            dados = (nome, cpf, usuario, senha)

            
            if self.db.execute_query(insert_query, dados):
                return "usuário cadastrado"
            else:
                return "erro ao cadastrar"

        