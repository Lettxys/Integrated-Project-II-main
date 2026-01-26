/*
 * Gerencia o fluxo de vendas (PDV), incluindo:
 * - Busca de produtos (Autocomplete)
 * - Adição de itens ao carrinho
 * - Controle de quantidade e remoção de itens
 * - Finalização da venda e envio para o backend
 */

let carrinho = [];

window.onload = function() {
    configurarBusca();
    renderizarCarrinho(); // Chama ao iniciar para mostrar o texto "Nenhum produto..."

    // Configura o toggle de parcelamento
    const checkParcelado = document.getElementById('check-parcelado');
    const containerInfo = document.getElementById('info-parcelas-container');
    
    if (checkParcelado && containerInfo) {
        checkParcelado.addEventListener('change', function() {
            containerInfo.style.display = this.checked ? 'block' : 'none';
        });
    }
};

/**
 * Configura o campo de busca de produtos com autocomplete.
 */
function configurarBusca() {
    const input = document.getElementById('input-busca-venda');
    const sugestoes = document.getElementById('sugestoes-venda');

    if (!input || !sugestoes) return;

    input.addEventListener('input', async function() {
        const texto = this.value;
        
        if (texto.length < 2) {
            sugestoes.style.display = 'none';
            return;
        }

        const resultados = await eel.autocomplete_produtos(texto)();
        
        sugestoes.innerHTML = '';
        
        if (resultados.length > 0) {
            sugestoes.style.display = 'block';
            
            // AGORA 'dado' É UMA LISTA: [nome, estoque, preço]
            resultados.forEach(dado => {
                const nome = dado[0];
                const estoque = dado[1];
                const preco = dado[2];

                const div = document.createElement('div');
                div.className = 'suggestion-item'; 
                
                div.innerHTML = `
                    <div class="suggestion-nome">${nome}</div>
                    <div class="suggestion-info">
                        Estoque: ${estoque} | Preço: R$ ${preco.toFixed(2)}
                    </div>
                `;
                
                div.onclick = async () => {
                    input.value = ''; 
                    sugestoes.style.display = 'none'; 
                    await adicionarAoCarrinho(nome); 
                };
                
                sugestoes.appendChild(div);
            });
        } else {
            sugestoes.style.display = 'none';
        }
    });

    // Fecha as sugestões ao clicar fora
    document.addEventListener('click', (e) => {
        if (e.target !== input && e.target !== sugestoes) {
            sugestoes.style.display = 'none';
        }
    });
}

/**
 * Busca os detalhes do produto e adiciona ao carrinho.
 */
async function adicionarAoCarrinho(nome) {
    const dados = await eel.buscar_produto(nome)();
    
    if (!dados) {
        alert("Erro ao buscar produto.");
        return;
    }

    // Verifica se já existe no carrinho para somar +1
    const existente = carrinho.find(p => p.id === dados[0]);
    if (existente) {
        existente.qtd += 1;
    } else {
        const produto = {
            id: dados[0],       // ID enviado para o backend
            nome: dados[1],
            preco: dados[3],    // Preço visual (o backend recalcula)
            qtd: 1
        };
        carrinho.push(produto);
    }
    
    renderizarCarrinho();
}

/**
 * Atualiza a visualização da lista de itens no carrinho e o total.
 */
function renderizarCarrinho() {
    const container = document.getElementById('lista-produtos');
    const elementoTotal = document.getElementById('valor-total');
    
    container.innerHTML = ''; 
    let total = 0;

    // 1. SE O CARRINHO ESTIVER VAZIO
    if (carrinho.length === 0) {
        container.classList.add('vazio');
        container.innerHTML = `
            <p class="texto-vazio">
                Nenhum produto adicionado. Use a busca abaixo para adicionar produtos.
            </p>
        `;
        elementoTotal.textContent = 'R$ 0,00';
        return;
    }

    // 2. SE TIVER PRODUTOS
    container.classList.remove('vazio');

    carrinho.forEach((prod, index) => {
        total += prod.preco * prod.qtd;

        const div = document.createElement('div');
        div.className = 'item-carrinho'; 
        
        div.innerHTML = `
            <div class="esquerda-item">
                <button class="btn-lixeira" onclick="removerDoCarrinho(${index})">
                    <i class="fa-solid fa-trash"></i>
                </button>
                <span class="nome-produto-carrinho">${prod.nome}:</span>
            </div>
            
            <div class="direita-item">
                <span style="margin-right: 15px; font-weight: 700; font-size: 0.9rem; color: #1a2d14;">
                    un. R$ ${prod.preco.toFixed(2)}
                </span>
                <button class="btn-qtd-controle" onclick="atualizarQtd(${index}, ${prod.qtd - 1})">
                    <i class="fa-solid fa-minus"></i>
                </button>
                
                <input type="number" class="input-qtd-visual" 
                       value="${prod.qtd}" 
                       onchange="atualizarQtd(${index}, this.value)">
                
                <button class="btn-qtd-controle" onclick="atualizarQtd(${index}, ${prod.qtd + 1})">
                    <i class="fa-solid fa-plus"></i>
                </button>
            </div>
        `;
        container.appendChild(div);
    });

    elementoTotal.textContent = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

window.atualizarQtd = function(index, novaQtd) {
    if (novaQtd < 1) novaQtd = 1;
    carrinho[index].qtd = parseInt(novaQtd);
    renderizarCarrinho(); 
}

window.removerDoCarrinho = function(index) {
    carrinho.splice(index, 1);
    renderizarCarrinho();
}

/**
 * Envia a venda para o backend.
 */
window.finalizarVenda = async function() {
    if (carrinho.length === 0) {
        mostrarAlerta("Adicione produtos antes de finalizar.");
        return;
    }

    const metodo = document.getElementById('metodo-pagamento').value;
    const descricao = document.getElementById('descricao').value;
    
    const checkParceladoEl = document.getElementById('check-parcelado');
    const infoParcelasEl = document.getElementById('info-parcelas');

    const isInstallment = checkParceladoEl ? checkParceladoEl.checked : false;
    const installmentInfo = infoParcelasEl ? infoParcelasEl.value : "";
    
    if (!metodo) {
        mostrarAlerta("Selecione um método de pagamento.");
        return;
    }

    const total = carrinho.reduce((acc, item) => acc + (item.preco * item.qtd), 0);
    
    // Envia o carrinho com IDs. O backend valida preço e estoque.
    const res = await eel.realizar_venda(total, metodo, descricao, carrinho, isInstallment, installmentInfo)();

    if (res[0]) {
        mostrarAlerta("Venda realizada com sucesso!");
        carrinho = []; 
        renderizarCarrinho(); 
        document.getElementById('metodo-pagamento').value = '';
        document.getElementById('descricao').value = '';
        
        if (checkParceladoEl) checkParceladoEl.checked = false;
        if (infoParcelasEl) infoParcelasEl.value = '';
        
        const infoContainer = document.getElementById('info-parcelas-container');
        if (infoContainer) infoContainer.style.display = 'none';
    } else {
        mostrarAlerta("Erro: " + res[1]);
    }
}
