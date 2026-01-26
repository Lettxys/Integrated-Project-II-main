import sqlite3
import hashlib
import secrets
from datetime import datetime
import unicodedata

DB_NAME = "mercado_projeto.db"

# --- Funções de Segurança ---

def hash_password(password):
    """
    Gera um hash seguro da senha usando PBKDF2 com um sal aleatório.
    
    Args:
        password (str): A senha em texto plano.
    
    Returns:
        str: O hash formatado como 'salt$hash'.
    """
    salt = secrets.token_hex(16)
    hash_obj = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000)
    return f"{salt}${hash_obj.hex()}"

def check_password(stored_password, provided_password):
    """
    Verifica se a senha fornecida corresponde ao hash armazenado.
    
    Args:
        stored_password (str): O hash armazenado no banco de dados.
        provided_password (str): A senha fornecida pelo usuário.
    
    Returns:
        bool: True se a senha estiver correta, False caso contrário.
    """
    try:
        salt, stored_hash = stored_password.split('$')
        hash_obj = hashlib.pbkdf2_hmac('sha256', provided_password.encode(), salt.encode(), 100000)
        return hash_obj.hex() == stored_hash
    except ValueError:
        # Fallback para senhas antigas em texto plano (migração/legado)
        return stored_password == provided_password

def criar_banco():
    """
    Inicializa o banco de dados SQLite, criando as tabelas necessárias se não existirem.
    Também cria o usuário 'admin' padrão se a tabela de usuários estiver vazia para esse user.
    """
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
            estoque_atual INTEGER NOT NULL,
            data_compra TEXT
        )
    ''')

    # 3. Tabela Vendas 
    #is_installment = é parcelado/fiado, depende do contexto
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS vendas (
            id_venda INTEGER PRIMARY KEY AUTOINCREMENT,
            valor REAL NOT NULL,
            mtd_pagamento TEXT,
            status_pagamento INTEGER, 
            data_venda TEXT,
            descricao TEXT,
            is_installment INTEGER DEFAULT 0,  
            installments_info TEXT DEFAULT ''
        )
    ''')

    # 4. Tabela ItensVenda 
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS itens_venda (
            id_item INTEGER PRIMARY KEY AUTOINCREMENT,
            id_venda INTEGER,
            id_produto INTEGER,
            quantidade INTEGER,
            preco_unitario REAL,
            preco_custo REAL,
            FOREIGN KEY (id_venda) REFERENCES vendas(id_venda),
            FOREIGN KEY (id_produto) REFERENCES produtos(id_produto)
        )
    ''')
    
    # 5. Criar usuário admin padrão se não existir
    cursor.execute("SELECT id_usuario FROM usuarios WHERE user = 'admin'")
    if not cursor.fetchone():
        senha_hash = hash_password("admin123")
        cursor.execute('''
            INSERT INTO usuarios (user, nome, cpf, senha, tipo_usuario)
            VALUES (?, ?, ?, ?, ?)
        ''', ("admin", "Administrador", "00000000000", senha_hash, "dono"))
        print("Usuário 'admin' criado com senha padrão 'admin123'.")

    conn.commit()
    conn.close()
    print("Banco de dados atualizado com sucesso!")

if __name__ == "__main__":
    criar_banco()

# --- Funções de Operação do Banco ---

def cadastrar_usuario(user, nome, cpf, senha, tipo_usuario):
    """
    Cadastra um novo usuário no sistema.
    A senha é armazenada como hash.
    """
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    try:
        senha_hash = hash_password(senha)
        cursor.execute('''
            INSERT INTO usuarios (user, nome, cpf, senha, tipo_usuario)
            VALUES (?, ?, ?, ?, ?)
        ''', (user, nome, cpf, senha_hash, tipo_usuario))
        conn.commit()
        return True, "Cadastro realizado com sucesso!"
    
    except sqlite3.IntegrityError:
        return False, "Erro: Usuário, CPF ou ID já cadastrados."
    except Exception as e:
        return False, f"Erro desconhecido: {str(e)}"
    finally:
        conn.close()
    
def validar_login(user, senha):
    """
    Valida as credenciais de login do usuário.
    Retorna (Sucesso, Nome, Tipo) se válido, ou (False, None, None) se inválido.
    """
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    cursor.execute('''
        SELECT senha, nome, tipo_usuario
        FROM usuarios
        WHERE user = ?
    ''', (user,))

    resultado = cursor.fetchone()
    conn.close()

    if resultado:
        senha_banco, nome, tipo = resultado
        if check_password(senha_banco, senha):
            return True, nome, tipo
    
    return False, None, None

def normalize_db_string(text):
    """Remove acentos e converte para minúsculas para facilitar a busca."""
    if text is None: return ""
    return ''.join(c for c in unicodedata.normalize('NFD', text) if unicodedata.category(c) != 'Mn').lower()

def autocomplete_produtos(texto):
    """
    Busca produtos que contenham o texto fornecido no nome.
    A busca ignora acentos e maiúsculas/minúsculas.
    Retorna uma lista de tuplas (nome, estoque, preço).
    Usado para sugestões na tela de vendas.
    """
    conn = sqlite3.connect(DB_NAME)
    # Registra a função de normalização no SQLite
    conn.create_function("NORMALIZE", 1, normalize_db_string)
    cursor = conn.cursor()
    try:
        texto_norm = normalize_db_string(texto)
        cursor.execute("SELECT nome, estoque_atual, preco_venda FROM produtos WHERE NORMALIZE(nome) LIKE ? LIMIT 10", (f"%{texto_norm}%",))
        return cursor.fetchall() 
    finally:
        conn.close()

def buscar_produto(nome):
    """
    Busca os detalhes completos de um produto pelo nome exato.
    """
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id_produto, nome, preco_custo, preco_venda, estoque_atual, data_compra FROM produtos WHERE nome = ?", (nome,))
        return cursor.fetchone()
    finally:
        conn.close()

def salvar_produto(nome, preco_compra, preco_venda, quantidade, id_produto=None):
    """
    Salva um produto no estoque.
    Se um id_produto for fornecido, atualiza o produto específico.
    Caso contrário, verifica se existe pelo nome para atualizar ou inserir.
    """
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    data_hoje = datetime.now().strftime("%d/%m/%Y")
    
    try:
        if id_produto:
            # Atualiza pelo ID
            cursor.execute("""
                UPDATE produtos
                SET nome = ?, estoque_atual = ?, preco_custo = ?, preco_venda = ?, data_compra = ?
                WHERE id_produto = ?
            """, (nome, quantidade, preco_compra, preco_venda, data_hoje, id_produto))
        else:
            # Verifica se já existe pelo nome
            cursor.execute("SELECT id_produto FROM produtos WHERE nome = ?", (nome,))
            produto = cursor.fetchone()
            
            if produto:
                cursor.execute("""
                    UPDATE produtos
                    SET estoque_atual = ?, preco_custo = ?, preco_venda = ?, data_compra = ?
                    WHERE id_produto = ?
                """, (quantidade, preco_compra, preco_venda, data_hoje, produto[0]))
            else:
                cursor.execute("""
                    INSERT INTO produtos (nome, preco_custo, preco_venda, estoque_atual, data_compra)
                    VALUES (?, ?, ?, ?, ?)
                """, (nome, preco_compra, preco_venda, quantidade, data_hoje))
        
        conn.commit()
        return True, "Produto salvo com sucesso!"
    except Exception as e:
        return False, f"Erro ao salvar: {str(e)}"
    finally:
        conn.close()

def listar_produtos():
    """
    Retorna todos os produtos ordenados por nome para a listagem do estoque.
    """
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id_produto, nome, estoque_atual, preco_venda, data_compra, preco_custo FROM produtos ORDER BY nome")
        return cursor.fetchall()
    finally:
        conn.close()

def registrar_venda(total_cliente, metodo_pagamento, descricao, itens, is_installment=False, installments_info=""):
    """
    Registra uma nova venda no sistema e atualiza o estoque.
    
    Args:
        total_cliente: Valor total calculado pelo front-end (ignorado para cálculo final).
        metodo_pagamento: Método escolhido (Dinheiro, Cartão, etc).
        descricao: Descrição opcional da venda.
        itens: Lista de dicionários contendo {'id': ..., 'qtd': ...}.
        is_installment (bool): Se é uma venda parcelada/fiada.
        installments_info (str): Detalhes do parcelamento (ex: "3x").
    """
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    data_hoje = datetime.now().strftime("%d/%m/%Y %H:%M")

    try:
        # Validar estoque e calcular preços
        itens_validados = []
        valor_total_real = 0.0

        for item in itens:
            id_produto_input = item['id']
            qtd_vendida = int(item['qtd'])
            
            # Busca dados atuais do produto
            cursor.execute("SELECT id_produto, estoque_atual, preco_custo, preco_venda, nome FROM produtos WHERE id_produto = ?", (id_produto_input,))
            dados_produto = cursor.fetchone()

            if not dados_produto:
                raise Exception(f"Produto ID {id_produto_input} não encontrado no banco.")
            
            id_produto = dados_produto[0]
            estoque_atual = dados_produto[1]
            preco_custo = dados_produto[2]
            preco_venda = dados_produto[3]
            nome_produto = dados_produto[4]

            if estoque_atual < qtd_vendida:
                raise Exception(f"Estoque insuficiente para '{nome_produto}'. Restam apenas {estoque_atual}.")
            
            valor_total_real += preco_venda * qtd_vendida
            itens_validados.append({
                "id_produto": id_produto,
                "qtd": qtd_vendida,
                "preco_unitario": preco_venda,
                "preco_custo": preco_custo
            })

        # Define status: 1 = Pago, 0 = Pendente (Parcelado/Fiado)
        status_inicial = 0 if is_installment else 1
        flag_installment = 1 if is_installment else 0

        # Registrar a venda
        cursor.execute('''
            INSERT INTO vendas (valor, mtd_pagamento, status_pagamento, data_venda, descricao, is_installment, installments_info)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (valor_total_real, metodo_pagamento, status_inicial, data_hoje, descricao, flag_installment, installments_info))

        id_venda = cursor.lastrowid

        # Gravar itens da venda e atualizar estoque
        for item in itens_validados:
            cursor.execute("UPDATE produtos SET estoque_atual = estoque_atual - ? WHERE id_produto = ?", (item['qtd'], item['id_produto']))

            cursor.execute('''
                INSERT INTO itens_venda (id_venda, id_produto, quantidade, preco_unitario, preco_custo)
                VALUES (?, ?, ?, ?, ?)
            ''', (id_venda, item['id_produto'], item['qtd'], item['preco_unitario'], item['preco_custo']))

        conn.commit()
        return True, "Venda realizada com sucesso!"
    
    except Exception as e:
        conn.rollback()
        return False, f"Erro ao registrar venda: {str(e)}"
    finally:
        conn.close()

def obter_historico_vendas():
    """
    Retorna o histórico completo de vendas, incluindo os itens de cada venda.
    """
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT * FROM vendas ORDER BY id_venda DESC")
        vendas_db = cursor.fetchall()

        resultado = []
        for venda in vendas_db:
            cursor.execute('''
                SELECT 
                    i.quantidade,
                    i.preco_unitario,
                    p.nome,
                    i.preco_custo
                FROM itens_venda i
                JOIN produtos p ON i.id_produto = p.id_produto
                WHERE i.id_venda = ?
               ''', (venda['id_venda'],))
            
            itens_db = cursor.fetchall()

            produtos_lista = []
            for item in itens_db:
                produtos_lista.append({
                    "nome": item['nome'],
                    "quantidade": item['quantidade'],
                    "preco": item['preco_unitario'],
                    "precoCusto": item['preco_custo']
                })
            
            # Recupera campos de parcelamento com fallback seguro (Pra quem não sabe "Fallback" é tipo um plano B)
            is_installment = bool(venda['is_installment']) if 'is_installment' in venda.keys() else False
            installments_info = venda['installments_info'] if 'installments_info' in venda.keys() else ""
            status_pagamento = venda['status_pagamento']

            resultado.append({
                "id": venda['id_venda'],
                "data": venda['data_venda'],
                "metodoPagamento": venda['mtd_pagamento'],
                "total": venda['valor'],
                "descricao": venda['descricao'] or "",
                "produtos": produtos_lista,
                "isInstallment": is_installment,
                "installmentsInfo": installments_info,
                "statusPagamento": status_pagamento
            })

        return resultado

    except Exception as e:
        return []
    finally:
        conn.close()

def atualizar_status_pagamento(id_venda, novo_status):
    """
    Atualiza o status de pagamento de uma venda.
    novo_status: 1 (Pago), 0 (Pendente)
    """
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE vendas SET status_pagamento = ? WHERE id_venda = ?", (novo_status, id_venda))
        conn.commit()
        return True, "Status atualizado com sucesso."
    except Exception as e:
        return False, str(e)
    finally:
        conn.close()
