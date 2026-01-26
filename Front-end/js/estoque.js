/* 
 * Gerencia a lógica da página de estoque (estoque.html), incluindo:
 * - Listagem de produtos (Recentes e Alfabéticos)
 * - Busca de produtos
 * - Adição e Edição de produtos (com Modal)
 * - Integração com o Python via Eel
 */

let estoque = [];
let produtoSelecionado = null; 

window.onload = async function() {
    await carregarDoPython();
    setupEventListeners();
};

/* Configura os ouvintes de eventos da página. */
function setupEventListeners() {
    // --- Autocomplete no modal de adicionar/editar ---
    const inputNome = document.getElementById('input-nome');
    if (inputNome) {
        inputNome.addEventListener('input', async function() {
            const texto = this.value;
            const lista = document.getElementById('autocomplete-list'); 
            
            if (texto.length < 2) {
                if (lista) lista.style.display = 'none';
                return;
            }

            // Busca sugestões no backend
            const sugestoes = await eel.autocomplete_produtos(texto)();
            
            if (lista) {
                if (sugestoes.length > 0) {
                    lista.innerHTML = sugestoes.map(dado => {
                        const nome = dado[0];
                        const estoque = dado[1];
                        const preco = dado[2];

                        return `
                            <div class="suggestion-item" onclick="selecionarSugestao('${nome}')">
                                <div class="suggestion-nome">${nome}</div>
                                <div class="suggestion-info">
                                    Estoque: ${estoque} | Preço: R$ ${preco.toFixed(2)}
                                </div>
                            </div>
                        `;
                    }).join('');
                    lista.style.display = 'block';
                } else {
                    lista.style.display = 'none';
                }
            }
        });
    }

    // --- Busca geral na página (Filtro) ---
     const inputBusca = document.getElementById('busca-geral');
    if (inputBusca) {
        inputBusca.addEventListener('input', function(e) {
            // Normaliza o termo de busca (remove acentos e lowercase)
            const termo = e.target.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            
            const secaoRecentes = document.querySelector('.secao-estoque:has(#cards-recentes)') || (document.getElementById('cards-recentes') ? document.getElementById('cards-recentes').parentElement : null);
            const containerAlfabetico = document.getElementById('estoque-alfabetico');
            const tituloAlfabetico = containerAlfabetico ? containerAlfabetico.previousElementSibling : null;

            if (!containerAlfabetico) return;

            // 1. LIMPOU A BUSCA: Remove a classe e volta ao normal
            if (termo === "") {
                if(secaoRecentes) secaoRecentes.style.display = ''; 
                if(tituloAlfabetico) tituloAlfabetico.textContent = "Estoque Completo:";
                
                // REMOVE A CLASSE DA BUSCA
                containerAlfabetico.classList.remove('grade-busca');
                containerAlfabetico.style.display = ''; 
                
                renderizarEstoqueAlfabetico(); 
                return;
            }

            // 2. DIGITANDO: Adiciona a classe e desenha os cards filtrados
            if(secaoRecentes) secaoRecentes.style.display = 'none';
            if(tituloAlfabetico) tituloAlfabetico.textContent = `Resultados para "${e.target.value}":`;

            const filtrados = estoque.filter(p => {
                const nomeNorm = p.nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                return nomeNorm.includes(termo);
            });

            containerAlfabetico.innerHTML = '';
            containerAlfabetico.classList.add('grade-busca');

            if (filtrados.length === 0) {
                containerAlfabetico.classList.remove('grade-busca');
                containerAlfabetico.innerHTML = '<p style="text-align: center; color: #666; width: 100%;">Nenhum produto encontrado.</p>';
                return;
            }

            // Desenha os cards filtrados
            containerAlfabetico.innerHTML = filtrados.map(p => `
                <div class="card-produto">
                    <img src="${p.imagem}" alt="${p.nome}">
                    <div class="card-produto-info">
                        <div class="card-produto-nome" title="${p.nome}">${p.nome}</div>
                        <div class="card-produto-data">${p.dataAdicao}</div>
                    </div>
                    <div class="card-produto-acoes">
                        <button class="btn-card btn-quantidade-card">
                            ${p.quantidade}x
                        </button>
                        <button class="btn-card btn-editar-card" onclick="editarProduto(${p.id})">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        });
    }

    // Fechar modal ao clicar fora
    window.addEventListener('click', function(event) {
        const modalAdicionar = document.getElementById('modal-adicionar');
        if (modalAdicionar && event.target == modalAdicionar) {
            fecharModalAdicionar();
        }
    });
}

/**
 * Carrega a lista completa de produtos do Python e atualiza a interface.
 */
async function carregarDoPython() {
    const inputBusca = document.getElementById('busca-geral');
    const containerAlfabetico = document.getElementById('estoque-alfabetico');
    const secaoRecentes = document.getElementById('cards-recentes'); 
    
    // Reseta visualização
    if (secaoRecentes && secaoRecentes.parentElement) {
        secaoRecentes.parentElement.style.display = 'block';
    }

    if (inputBusca) inputBusca.value = '';

    if (containerAlfabetico) {
        containerAlfabetico.classList.remove('grade-busca');
        const tituloAlfabetico = containerAlfabetico.previousElementSibling;
        if (tituloAlfabetico) tituloAlfabetico.textContent = "Estoque Completo:";
    }

    const loadingHTML = `
        <div style="width: 100%; text-align: center; padding: 40px; color: #4a5f8a;">
            <i class="fa-solid fa-circle-notch fa-spin" style="font-size: 2.5rem;"></i>
            <p style="margin-top: 15px; font-weight: bold;">Carregando estoque...</p>
        </div>
    `;
    
    if(secaoRecentes) secaoRecentes.innerHTML = loadingHTML;
    if(containerAlfabetico) containerAlfabetico.innerHTML = loadingHTML;

    // Chama o backend
    const dadosBrutos = await eel.obter_produtos()();
    
    // Mapeia os dados (Tupla -> Objeto)
    estoque = dadosBrutos.map(dado => ({
        id: dado[0],          
        nome: dado[1],        
        quantidade: dado[2],  
        precoVenda: dado[3],  
        dataAdicao: dado[4] || "Sem data", 
        precoCompra: dado[5], 
        imagem: "../img/produto-placeholder.png"
    }));

    renderizarRecentes();
    renderizarEstoqueAlfabetico();
}

/**
 * Renderiza os 5 produtos adicionados mais recentemente.
 */
function renderizarRecentes() {
    const container = document.getElementById('cards-recentes');
    if (!container) return;
    
    const recentes = [...estoque].sort((a, b) => b.id - a.id).slice(0, 5); 

    if (recentes.length === 0) {
        container.innerHTML = '<p style="color: #666;">Nenhum produto recente.</p>';
        return;
    }

    container.innerHTML = recentes.map(p => `
        <div class="card-produto">
            <img src="${p.imagem}" alt="${p.nome}">
            <div class="card-produto-info">
                <div class="card-produto-nome" title="${p.nome}">${p.nome}</div>
                <div class="card-produto-data">${p.dataAdicao}</div>
            </div>
            <div class="card-produto-acoes">
                <button class="btn-card btn-quantidade-card">
                    ${p.quantidade}x
                </button>
                <button class="btn-card btn-editar-card" onclick="editarProduto(${p.id})">
                    <i class="fa-solid fa-pen"></i>
                </button>
            </div>
        </div>
    `).join('');
}

/**
 * Renderiza todos os produtos agrupados por letra inicial.
 */
function renderizarEstoqueAlfabetico() {
    const container = document.getElementById('estoque-alfabetico');
    if (!container) return;
    
    if (estoque.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666;">Nenhum produto cadastrado.</p>';
        return;
    }

    const grupos = {};
    estoque.forEach(p => {
        const letra = p.nome.charAt(0).toUpperCase();
        if (!grupos[letra]) grupos[letra] = [];
        grupos[letra].push(p);
    });

    let html = '';
    Object.keys(grupos).sort().forEach((letra, index) => {
        const corClasse = index % 2 === 0 ? '' : 'verde';
        
        html += `
            <div class="area-alfabetica ${corClasse}">
                <div class="letra-divisor">${letra}</div>
                <div class="produtos-alfabeticos">
                    ${grupos[letra].map(p => `
                        <div class="item-produto-alfabetico">
                            <span class="nome">${p.nome}</span>
                            <div class="acoes">
                                <span style="margin-right: 15px; font-weight: bold; color: #555;">R$ ${p.precoVenda.toFixed(2)}</span>
                                <button class="btn-card btn-quantidade-card">
                                    ${p.quantidade}x
                                </button>
                                <button class="btn-card btn-editar-card" onclick="editarProduto(${p.id})">
                                    <i class="fa-solid fa-pen"></i>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

/**
 * Envia os dados do formulário para salvar um produto (novo ou edição).
 */
async function salvarProduto(event) {
    event.preventDefault(); 

    const nome = document.getElementById('input-nome').value.trim();
    const compra = parseFloat(document.getElementById('input-preco-compra').value);
    const venda = parseFloat(document.getElementById('input-preco-venda').value);
    const qtd = parseInt(document.getElementById('input-quantidade').value);

    const resultado = await eel.salvar_produto(nome, compra, venda, qtd)();

    if (resultado[0]) {
        if (typeof mostrarAlerta === "function") {
            mostrarAlerta("Produto salvo com sucesso!");
        } else {
            alert("Produto salvo com sucesso!");
        }
        
        fecharModalAdicionar();
        carregarDoPython(); 
    } else {
        alert("Erro ao salvar: " + resultado[1]);
    }
}

/**
 * Prepara o modal para edição de um produto existente.
 */
async function editarProduto(id) {
    const prod = estoque.find(p => p.id === id);
    
    if (prod) {
        const modal = document.getElementById('modal-adicionar');
        if (!modal) return;
        
        document.getElementById('prod-id').value = prod.id;
        document.getElementById('input-nome').value = prod.nome;
        document.getElementById('input-preco-compra').value = prod.precoCompra;
        document.getElementById('input-preco-venda').value = prod.precoVenda;
        document.getElementById('input-quantidade').value = prod.quantidade; 
        
        document.getElementById('badge-existente').innerHTML = 
            '<span style="color: blue; font-size: 0.8rem; margin-left: 10px;">(EDITANDO)</span>';
        
        abrirModalAdicionar();
    }
}

/**
 * Preenche o formulário com dados de um produto selecionado no autocomplete.
 */
async function selecionarSugestao(nome) {
    const inputNome = document.getElementById('input-nome');
    const lista = document.getElementById('autocomplete-list');
    
    if (inputNome) inputNome.value = nome;
    if (lista) lista.style.display = 'none';

    // Retorno esperado do Python: [id, nome, custo, venda, estoque, data]
    const dados = await eel.buscar_produto(nome)();

    if (dados) {
        const inputCusto = document.getElementById('input-preco-compra');
        const inputVenda = document.getElementById('input-preco-venda');
        const inputQtd = document.getElementById('input-quantidade');

        if (inputCusto) inputCusto.value = dados[2]; 
        if (inputVenda) inputVenda.value = dados[3];
        if (inputQtd) inputQtd.value = dados[4]; 
    }
}

function abrirModalAdicionar() {
    const modal = document.getElementById('modal-adicionar');
    if (modal) {
        modal.style.display = 'flex';
        if (!document.getElementById('prod-id').value) {
            document.getElementById('input-nome').value = '';
            document.getElementById('input-preco-compra').value = '';
            document.getElementById('input-preco-venda').value = '';
            document.getElementById('input-quantidade').value = '';
            const badge = document.getElementById('badge-existente');
            if (badge) badge.innerHTML = '';
        }
    }
}

function fecharModalAdicionar() {
    const modal = document.getElementById('modal-adicionar');
    if (modal) modal.style.display = 'none';
    const prodId = document.getElementById('prod-id');
    if (prodId) prodId.value = ''; 
}

/**
 * Função global para o botão de busca.
 * Aciona o evento 'input' do campo de busca para reaproveitar a lógica.
 */
window.buscarProduto = function() {
    const inputBusca = document.getElementById('busca-geral');
    if (inputBusca) {
        inputBusca.dispatchEvent(new Event('input'));
    }
}
