import sqlite3
import random
from datetime import datetime, timedelta
from BD import database 

DB_NAME = database.DB_NAME

# ========================================
# DADOS DE EXEMPLO
# ========================================

PRODUTOS = [
    ("Arroz Tipo 1 5kg", 18.50, 24.90),
    ("Feijão Preto 1kg", 6.80, 9.50),
    ("Feijão Carioca 1kg", 7.20, 9.90),
    ("Açúcar Cristal 1kg", 3.50, 4.90),
    ("Sal Refinado 1kg", 1.20, 1.80),
    ("Óleo de Soja 900ml", 5.80, 7.90),
    ("Macarrão Espaguete 500g", 2.50, 3.90),
    ("Farinha de Trigo 1kg", 3.80, 5.50),
    ("Café Torrado 500g", 12.00, 16.90),
    ("Leite Integral 1L", 3.20, 4.50),
    ("Refrigerante Cola 2L", 4.50, 6.90),
    ("Refrigerante Guaraná 2L", 4.30, 6.50),
    ("Suco de Laranja 1L", 5.50, 8.90),
    ("Água Mineral 1.5L", 1.50, 2.50),
    ("Cerveja Lata 350ml", 2.80, 4.50),
    ("Sabonete 90g", 1.50, 2.50),
    ("Shampoo 400ml", 8.90, 12.90),
    ("Pasta de Dente 90g", 3.50, 5.90),
    ("Papel Higiênico 4 Rolos", 6.50, 9.90),
    ("Sabão em Pó 1kg", 7.80, 11.50),
]

USUARIOS = [
    ("admin", "João Silva", "111.111.111-11", "admin123", "dono"),
    ("caixa", "Maria Santos", "222.222.222-22", "1234", "caixa"),
]

METODOS_PAGAMENTO = ["dinheiro", "pix", "debito", "credito"]
DESCRICOES = ["Venda normal", "Cliente frequente", "Compra rápida", "", "Pagamento à vista"]

# ========================================
# FUNÇÕES
# ========================================

def conectar():
    return sqlite3.connect(DB_NAME)

def popular_tudo(num_vendas=30):
    print(f" Usando banco de dados: {DB_NAME}")
    
    # 1. GARANTE QUE AS TABELAS EXISTEM 
    print(" Criando/Verificando tabelas...")
    database.criar_banco()
    
    conn = conectar()
    cursor = conn.cursor()

    # 2. Limpar dados antigos 
    print(" Limpando dados antigos...")
    try:
        cursor.execute("DELETE FROM itens_venda")
        cursor.execute("DELETE FROM vendas")
        cursor.execute("DELETE FROM produtos")
        cursor.execute("DELETE FROM usuarios")
        # Reseta os IDs para começar do 1
        cursor.execute("DELETE FROM sqlite_sequence") 
    except Exception as e:
        print(f"Aviso ao limpar: {e}")

    # 3. Inserir Usuários
    print(" Inserindo usuários...")
    for user, nome, cpf, senha, tipo in USUARIOS:
        try:
            senha_hash = database.hash_password(senha)
            cursor.execute('''
                INSERT INTO usuarios (user, nome, cpf, senha, tipo_usuario)
                VALUES (?, ?, ?, ?, ?)
            ''', (user, nome, cpf, senha_hash, tipo))
        except sqlite3.IntegrityError:
            pass # Ignora se já existir

    # 4. Inserir Produtos
    print(" Inserindo produtos...")
    data_base = datetime.now()
    for nome, custo, venda in PRODUTOS:
        dias_atras = random.randint(0, 30)
        data_compra = (data_base - timedelta(days=dias_atras)).strftime("%d/%m/%Y")
        estoque = random.randint(10, 100)
        
        cursor.execute('''
            INSERT INTO produtos (nome, preco_custo, preco_venda, estoque_atual, data_compra)
            VALUES (?, ?, ?, ?, ?)
        ''', (nome, custo, venda, estoque, data_compra))

    # 5. Inserir Vendas 
    print(" Inserindo vendas...")
    # Pega os produtos do banco (para ter o ID certo)
    cursor.execute("SELECT id_produto, preco_venda, preco_custo FROM produtos")
    produtos_db = cursor.fetchall()
    
    if not produtos_db:
        print("Erro: Nenhum produto cadastrado.")
        return

    for i in range(num_vendas):
        # Data aleatória (últimos 60 dias)
        dias_atras = random.randint(0, 60)
        hora = random.randint(8, 20)
        minuto = random.randint(0, 59)
        data_venda = (data_base - timedelta(days=dias_atras)).replace(hour=hora, minute=minuto)
        data_str = data_venda.strftime("%d/%m/%Y %H:%M") 
        
        # Sorteia itens
        qtd_itens = random.randint(1, 5)
        itens_escolhidos = random.sample(produtos_db, min(qtd_itens, len(produtos_db)))
        
        total_venda = 0
        itens_para_gravar = []
        
        for prod in itens_escolhidos:
            # prod é uma tupla: (id, preco_venda, preco_custo)
            pid, p_venda, p_custo = prod[0], prod[1], prod[2]
            qtd = random.randint(1, 3)
            total_venda += p_venda * qtd
            itens_para_gravar.append((pid, qtd, p_venda, p_custo))
        
        # Cria a Venda
        mtd = random.choice(METODOS_PAGAMENTO)
        desc = random.choice(DESCRICOES)
        
        cursor.execute('''
            INSERT INTO vendas (valor, mtd_pagamento, status_pagamento, data_venda, descricao)
            VALUES (?, ?, 1, ?, ?)
        ''', (total_venda, mtd, data_str, desc))
        
        id_venda = cursor.lastrowid
        
        # Cria os Itens da Venda
        for pid, qtd, p_venda, p_custo in itens_para_gravar:
            # Verifica se sua tabela itens_venda tem a coluna preco_custo
            cursor.execute('''
                INSERT INTO itens_venda (id_venda, id_produto, quantidade, preco_unitario, preco_custo)
                VALUES (?, ?, ?, ?, ?)
            ''', (id_venda, pid, qtd, p_venda, p_custo))

            # Atualiza Estoque
            cursor.execute("UPDATE produtos SET estoque_atual = estoque_atual - ? WHERE id_produto = ?", (qtd, pid))

    conn.commit()
    conn.close()
    print("\n SUCESSO! Banco populado e pronto para uso.")
    print("Login Dono: admin / admin123")
    print("Login Caixa: caixa / 1234")

if __name__ == "__main__":
    popular_tudo(50)