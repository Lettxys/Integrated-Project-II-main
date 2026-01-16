CREATE SCHEMA IF NOT EXISTS mercado;

USE mercado;

CREATE TABLE IF NOT EXISTS usuario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255),
    cpf VARCHAR(11), 
    login VARCHAR(255),
    senha VARCHAR (20)
) ENGINE = InnoDB;



CREATE TABLE IF NOT EXISTS estoque (
    id_produto INT AUTO_INCREMENT PRIMARY KEY,
    nome_produto VARCHAR(255),
    valor FLOAT,
    pagamento VARCHAR(25),
    estoque_atual INT
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS vendas (
    id_venda INT AUTO_INCREMENT PRIMARY KEY,
    nome_produto VARCHAR(255),
    preco_custo FLOAT,
    preco_venda FLOAT,
    status_pagamento BOOLEAN   
) ENGINE = InnoDB;

