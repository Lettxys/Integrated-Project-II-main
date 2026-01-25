let todasVendasCache = []; // Guarda as vendas para filtrar na busca

/* --- 1. BLOQUEIO DE F5 (PARA NÃO ABRIR NOVA JANELA) --- */
document.addEventListener('keydown', function(e) {
    if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
        e.preventDefault();
        window.location.reload();
    }
});

/* --- 2. INICIALIZAÇÃO --- */
window.onload = async function() {
    configurarBusca();
    configurarModalSair();
    await carregarVendasDoPython(); 
};

/* --- 3. CARREGAR DADOS DO PYTHON --- */
async function carregarVendasDoPython() {
    const container = document.getElementById('container-meses');
    
    // Loading Animado
    if (container) {
        container.innerHTML = `
            <div style="text-align:center; padding: 40px; color: #3b7a2f;">
                <i class="fa-solid fa-circle-notch fa-spin" style="font-size: 2rem;"></i>
                <p style="margin-top: 10px; font-weight: bold;">Carregando histórico...</p>
            </div>
        `;
    }

    try {
        // Chama o Back-end
        const vendas = await eel.carregar_historico()();
        todasVendasCache = vendas; 
        renderizarVendas(vendas);
    } catch (error) {
        console.error("Erro ao buscar histórico:", error);
        if (container) {
            container.innerHTML = '<p style="text-align:center; color:#d9534f; padding: 20px;">Erro ao conectar com o banco de dados.</p>';
        }
    }
}

/* --- 4. CONVERTER DATA --- */
function converterData(dataString) {
    try {
        const partes = dataString.split(/\s+/); 
        
        const dataPart = partes[0]; // "23/01/2026"
        const horaPart = partes[1]; // "18:30"
        
        const [dia, mes, ano] = dataPart.split('/');
        
        if (horaPart) {
            const [hora, min] = horaPart.split(':');
            return new Date(ano, mes - 1, dia, hora, min);
        } else {
            return new Date(ano, mes - 1, dia);
        }
    } catch (e) {
        return new Date(); 
    }
}

/* --- 5. LÓGICA DE AGRUPAMENTO E CÁLCULOS --- */
function agruparPorMes(vendas) {
    const grupos = {};
    
    vendas.forEach(venda => {
        const dataObj = converterData(venda.data);
        const mesAno = `${dataObj.getFullYear()}-${String(dataObj.getMonth() + 1).padStart(2, '0')}`;
        
        if (!grupos[mesAno]) {
            grupos[mesAno] = [];
        }
        grupos[mesAno].push(venda);
    });
    
    return grupos;
}

function calcularTotais(vendas) {
    let entradas = 0;
    let saidas = 0;
    
    vendas.forEach(venda => {
        entradas += venda.total;
        if (venda.produtos) {
            venda.produtos.forEach(produto => {
                const custo = produto.precoCusto || 0;
                saidas += custo * produto.quantidade;
            });
        }
    });
    
    const lucro = entradas - saidas;
    return { entradas, saidas, lucro };
}

/* --- 6. RENDERIZAÇÃO NA TELA --- */
function renderizarVendas(vendas) {
    const container = document.getElementById('container-meses');
    if (!container) return;

    if (!vendas || vendas.length === 0) {
        container.innerHTML = `
            <div class="estado-vazio" style="text-align: center; padding: 40px; color: #999;">
                <i class="fa-solid fa-receipt" style="font-size: 3rem; margin-bottom: 15px;"></i>
                <p>Nenhuma venda registrada ainda</p>
            </div>
        `;
        return;
    }
    
    // Ordenar vendas: Mais recente primeiro
    vendas.sort((a, b) => converterData(b.data) - converterData(a.data));
    
    const grupos = agruparPorMes(vendas);
    container.innerHTML = '';

    // Ordenar meses (Dezembro antes de Janeiro)
    Object.keys(grupos).sort().reverse().forEach(mesAno => {
        const [ano, mes] = mesAno.split('-');
        const nomesMeses = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 
                            'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];
        const nomeMes = nomesMeses[parseInt(mes) - 1];
        
        const { entradas, saidas, lucro } = calcularTotais(grupos[mesAno]);
        
        const secaoMes = document.createElement('div');
        secaoMes.className = 'secao-mes';
        
        // Cabeçalho do mês e Resumo Financeiro
        secaoMes.innerHTML = `
            <div class="header-mes">
                <i class="fa-solid fa-calendar"></i>
                <span>${nomeMes}</span>
            </div>
            
            <div class="resumo-mes">
                <div class="card-resumo">
                    <i class="fa-solid fa-arrow-up icone-entrada"></i>
                    <div>
                        <p class="label-resumo">Entradas</p>
                        <p class="valor-resumo">R$ ${entradas.toFixed(2)}</p>
                    </div>
                </div>
                <div class="card-resumo">
                    <i class="fa-solid fa-arrow-down icone-saida"></i>
                    <div>
                        <p class="label-resumo">Saídas</p>
                        <p class="valor-resumo">R$ ${saidas.toFixed(2)}</p>
                    </div>
                </div>
                <div class="card-resumo">
                    <i class="fa-solid fa-chart-line icone-lucro"></i>
                    <div>
                        <p class="label-resumo">Lucro Bruto</p>
                        <p class="valor-resumo">R$ ${lucro.toFixed(2)}</p>
                    </div>
                </div>
            </div>
            
            <div class="lista-vendas" id="lista-${mesAno}"></div>
        `;
        
        container.appendChild(secaoMes);
        
        const listaVendasDiv = document.getElementById(`lista-${mesAno}`);
        
        // Renderizar cada venda dentro do mês
        grupos[mesAno].forEach(venda => {
            const dataObj = converterData(venda.data);
            
            const dia = String(dataObj.getDate()).padStart(2, '0');
            const mesNum = String(dataObj.getMonth() + 1).padStart(2, '0');
            const hora = String(dataObj.getHours()).padStart(2, '0');
            const min = String(dataObj.getMinutes()).padStart(2, '0');
            
            // Tratamento visual para o método de pagamento
            let metodoPagamento = venda.metodoPagamento || "Outros";
            const metodoSlug = metodoPagamento.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const metodoClasse = `metodo-${metodoSlug}`;
            
            const itemVenda = document.createElement('div');
            itemVenda.className = 'item-venda';
            
            itemVenda.innerHTML = `
                <div><div class="venda-data">${dia}/${mesNum}</div></div>
                <div class="venda-hora">${hora}:${min}</div>
                <div class="venda-metodo ${metodoClasse}">${metodoPagamento.toUpperCase()}</div>
                <div class="venda-total">
                    <div class="label-total">TOTAL</div>
                    R$ ${venda.total.toFixed(2)}
                </div>
            `;
            
            // Clique para ver detalhes
            itemVenda.addEventListener('click', () => abrirDetalhes(venda));
            listaVendasDiv.appendChild(itemVenda);
        });
    });
}

/* --- 7. BUSCA --- */
function configurarBusca() {
    const input = document.getElementById('busca-historico');
    if (!input) return;
    
    input.addEventListener('input', function() {
        const termo = this.value.toLowerCase().trim();
        
        if (termo === '') {
            renderizarVendas(todasVendasCache);
            return;
        }
        
        const filtrados = todasVendasCache.filter(venda => {
            const dataTexto = venda.data || ""; 
            const produtosTexto = venda.produtos ? venda.produtos.map(p => p.nome.toLowerCase()).join(' ') : "";
            const valorTexto = venda.total.toString();
            const metodoTexto = (venda.metodoPagamento || "").toLowerCase();
            
            return dataTexto.includes(termo) || 
                   produtosTexto.includes(termo) || 
                   valorTexto.includes(termo) ||
                   metodoTexto.includes(termo);
        });
        
        renderizarVendas(filtrados);
    });
}

/* --- 8. MODAL DE DETALHES --- */
function abrirDetalhes(venda) {
    const modal = document.getElementById('modal-detalhes');
    const conteudo = document.getElementById('conteudo-detalhes');
    
    if (!modal || !conteudo) return;

    let custosTotal = 0;
    let htmlProdutos = '';
    
    if (venda.produtos) {
        venda.produtos.forEach(p => {
            custosTotal += (p.precoCusto || 0) * p.quantidade;
            htmlProdutos += `
                <div class="produto-detalhe">
                    <div>
                        <div class="produto-detalhe-nome">${p.nome}</div>
                        <div style="color: #666; font-size: 0.9rem;">${p.quantidade}x R$ ${p.preco.toFixed(2)}</div>
                    </div>
                    <div class="produto-detalhe-info">
                        <strong>R$ ${(p.quantidade * p.preco).toFixed(2)}</strong>
                    </div>
                </div>
            `;
        });
    }
    
    const lucroVenda = venda.total - custosTotal;

    conteudo.innerHTML = `
        <div class="detalhes-header">
            <p><strong>Data:</strong> ${venda.data}</p>
            <p><strong>Método:</strong> ${(venda.metodoPagamento || "").toUpperCase()}</p>
            ${venda.descricao ? `<p><strong>Descrição:</strong> ${venda.descricao}</p>` : ''}
        </div>
        
        <div class="detalhes-produtos">
            <h4>Produtos:</h4>
            ${htmlProdutos}
        </div>
        
        <div class="detalhes-totais">
            <p><span>Subtotal:</span> <span>R$ ${venda.total.toFixed(2)}</span></p>
            <p><span>Custos:</span> <span>R$ ${custosTotal.toFixed(2)}</span></p>
            <p class="total-final"><span>Lucro Líquido:</span> <span>R$ ${lucroVenda.toFixed(2)}</span></p>
        </div>
    `;
    
    modal.style.display = 'flex';
}

function fecharModalDetalhes() {
    const modal = document.getElementById('modal-detalhes');
    if (modal) modal.style.display = 'none';
}

/* --- 9. MODAL SAIR --- */
function configurarModalSair() {
    const btnSair = document.getElementById('btn-sair');
    const modal = document.getElementById('modal-sair');
    const btnNao = document.getElementById('btn-nao');
    const btnSim = document.getElementById('btn-sim');

    if (btnSair && modal) {
        btnSair.onclick = () => modal.style.display = 'flex';
    }
    if (btnNao && modal) {
        btnNao.onclick = () => modal.style.display = 'none';
    }
    if (btnSim) {
        btnSim.onclick = () => window.location.href = 'index.html';
    }

    // Fecha modais ao clicar fora
    window.onclick = function(event) {
        if (modal && event.target == modal) {
            modal.style.display = 'none';
        }
        const modalDetalhes = document.getElementById('modal-detalhes');
        if (modalDetalhes && event.target == modalDetalhes) {
            fecharModalDetalhes();
        }
    };
}