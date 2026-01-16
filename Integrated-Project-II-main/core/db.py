import mysql.connector

class DB:
    def __init__(self, host, user, password, database):
        self.host = host
        self.user = user
        self.password = password
        self.database = database
        self.connection = None
        
    # Metodo para conectar ao banco de dados
    def __enter__(self):
        try:
            self.connection = mysql.connector.connect(
                host=self.host,
                user=self.user,
                password=self.password,
                database=self.database
            )
            print("Conexão bem-sucedida ao banco de dados.")
            return self
        except mysql.connector.Error as err:
            print(f"Erro ao conectar ao banco de dados: {err}")
            self.connection = None
            raise

    # Metodo para fechar a conexão com o banco de dados
    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.connection and self.connection.is_connected():
            self.connection.close()
            print("Conexão com o banco de dados fechada.")
        elif self.connection is None:
            print("Nenhuma conexão foi estabelecida.")
        
    # Metodo para inserir/atualizar/deletar dados no banco de dados
    def execute_query(self,query, data=None):
        if not self.connection or not self.connection.is_connected():
            print("Nenhuma conexão ativa. Conecte-se antes de executar as queries.")
            return False
        
        cursor = self.connection.cursor()
        try:
            if data:
                cursor.execute(query, data)
            else:
                cursor.execute(query)
            self.connection.commit()
            print("Comando executado e confirmado com sucesso.")
            return True
        except mysql.connector.Error as err:
            print(f"Erro ao executar o comando: {err}")
            self.connection.rollback()
            return False
        finally:
            cursor.close()
        
    # Metodo para consultar dados no banco de dados
    def fetch_data(self, query, data=None):
        if not self.connection or not self.connection.is_connected():
            print("Nenhuma conexão ativa. Conecte-se antes de buscar os dados.")
            return None
        
        cursor = self.connection.cursor()
        try:
            if data:
                cursor.execute(query, data)
            else:
                cursor.execute(query)
            results = cursor.fetchall() 
            return results   
        except mysql.connector.Error as err:
            print(f"Erro ao buscar a consulta: {err}")
            return None
        finally:
            cursor.close()
