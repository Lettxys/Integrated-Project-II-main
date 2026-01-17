import sqlite3
from datetime import datetime

DB_NAME = "mercado_projeto.db"

def criar_banco():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    # 1. Tabela Usuário
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS usuarios (
            id_usuario INTEGER PRIMARY KEY AUTOINCREMENT,
            user TEXT NOT NULL UNIQUE,
            nome TEXT NOT NULL,
            cpf TEXT NOT NULL,
            senha TEXT NOT NULL,
            tipo_usuario TEXT NOT NULL
        )
    ''')

    # 2. Tabela Produtos
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS produtos (
            id_produto INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            preco_custo REAL NOT NULL,
            preco_venda REAL NOT NULL,
            estoque_atual INTEGER NOT NULL
        )
    ''')

    # 3. Tabela Vendas 
    # Boolean no SQLite é salvo como 0 (False) ou 1 (True)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS vendas (
            id_venda INTEGER PRIMARY KEY AUTOINCREMENT,
            valor REAL NOT NULL,
            mtd_pagamento TEXT,
            status_pagamento INTEGER, 
            data_venda TEXT,
            descricao TEXT
        )
    ''')

    # 4. Tabela ItensVenda 
    # Aqui guardamos o preço do momento da venda. Se o preço do produto mudar no futuro,
    # o histórico dessa venda não é alterado.
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS itens_venda (
            id_item INTEGER PRIMARY KEY AUTOINCREMENT,
            id_venda INTEGER,
            id_produto INTEGER,
            quantidade INTEGER,
            preco_unitario REAL,
            FOREIGN KEY (id_venda) REFERENCES vendas(id_venda),
            FOREIGN KEY (id_produto) REFERENCES produtos(id_produto)
        )
    ''')

    conn.commit()
    conn.close()
    print("Banco de dados atualizado com sucesso!")

if __name__ == "__main__":
    criar_banco()

def cadastrar_usuario(id_usuario, user, nome, cpf, senha, tipo_usuario):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    try:
        cursor.execute('''
            INSERT INTO usuarios (id_usuario, user, nome, cpf, senha, tipo_usuario)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (id_usuario, user, nome, cpf, senha, tipo_usuario))
        conn.commit()
        return True, "Cadastro realizado com sucesso!"
    
    except sqlite3.IntegrityError as e:
        return False, f"Erro: Usuário, CPF ou ID já cadastrados."
    except Exception as e:
        return False, f"Erro desconhecido: {str(e)}"
    finally:
        conn.close()
