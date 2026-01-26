// CODIGO PRO MODAL BONITINHO

document.addEventListener("DOMContentLoaded", function() {
    // 1. Modal de Aviso (Alerta Simples)
    const modalAvisoHTML = `
    <div id="modal-aviso" class="modal">
        <div class="modal-conteudo">
            <div style="text-align: center; margin-bottom: 15px;">
                <i class="fa-solid fa-circle-exclamation" style="font-size: 3rem; color: #8fb677;"></i>
            </div>
            
            <h3 id="titulo-aviso" style="text-align: center; color: #26411d; margin-bottom: 10px;">Atenção</h3>
            
            <p id="texto-aviso" style="text-align: center; color: #333; margin-bottom: 20px; font-size: 1rem;"></p>
            
            <button id="btn-modal-entendido" class="btn-entrar" style="margin: 0 auto; display: block;">Entendido</button>
        </div>
    </div>
    `;
    
    // 2. Modal de Confirmação (Sim/Não)
    const modalConfirmacaoHTML = `
    <div id="modal-confirmacao" class="modal">
        <div class="modal-conteudo">
            <div style="text-align: center; margin-bottom: 15px;">
                <i class="fa-solid fa-circle-question" style="font-size: 3rem; color: #6a95d4;"></i>
            </div>
            
            <h3 id="titulo-confirmacao" style="text-align: center; color: #1a2d14; margin-bottom: 10px;">Confirmação</h3>
            
            <p id="texto-confirmacao" style="text-align: center; color: #333; margin-bottom: 20px; font-size: 1rem;"></p>
            
            <div class="modal-botoes">
                <button type="button" class="btn-modal-nao" id="btn-confirmar-nao">Não</button>
                <button type="button" class="btn-modal-sim" id="btn-confirmar-sim">Sim</button>
            </div>
        </div>
    </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalAvisoHTML);
    document.body.insertAdjacentHTML('beforeend', modalConfirmacaoHTML);

    // --- Fechar modais ao clicar fora ---
    window.addEventListener('click', function(event) {
        const modalAviso = document.getElementById('modal-aviso');
        const modalConfirmacao = document.getElementById('modal-confirmacao');
        const modalSair = document.getElementById('modal-sair');

        if (modalAviso && event.target == modalAviso) modalAviso.style.display = 'none';
        if (modalConfirmacao && event.target == modalConfirmacao) modalConfirmacao.style.display = 'none';
        if (modalSair && event.target == modalSair) modalSair.style.display = 'none';
    });

    // --- Lógica do Modal Sair (Existente nas páginas) ---
    const btnSair = document.getElementById('btn-sair');
    if (btnSair) {
        btnSair.onclick = () => {
            const modalSair = document.getElementById('modal-sair');
            if (modalSair) modalSair.style.display = 'flex';
        };
    }

    const btnNao = document.getElementById('btn-nao');
    if (btnNao) {
        btnNao.onclick = () => {
            const modalSair = document.getElementById('modal-sair');
            if (modalSair) modalSair.style.display = 'none';
        };
    }

    const btnSim = document.getElementById('btn-sim');
    if (btnSim) {
        btnSim.onclick = () => {
            window.location.href = 'index.html';
        };
    }
});

function mostrarAlerta(mensagem, linkRedirecionamento = null) {
    const modal = document.getElementById('modal-aviso');
    const texto = document.getElementById('texto-aviso');
    const botao = document.getElementById('btn-modal-entendido');

    if (!modal || !texto || !botao) return;

    texto.textContent = mensagem;
    modal.style.display = 'flex'; 

    botao.onclick = function() {
        modal.style.display = 'none';
        if (linkRedirecionamento) {
            window.location.href = linkRedirecionamento;
        }
    };
}

function mostrarConfirmacao(mensagem, callbackSim) {
    const modal = document.getElementById('modal-confirmacao');
    const texto = document.getElementById('texto-confirmacao');
    const btnSim = document.getElementById('btn-confirmar-sim');
    const btnNao = document.getElementById('btn-confirmar-nao');

    if (!modal || !texto || !btnSim || !btnNao) return;

    texto.textContent = mensagem;
    modal.style.display = 'flex';

    // Remove listeners antigos para evitar chamadas múltiplas (clonando o nó)
    const novoBtnSim = btnSim.cloneNode(true);
    btnSim.parentNode.replaceChild(novoBtnSim, btnSim);
    
    const novoBtnNao = btnNao.cloneNode(true);
    btnNao.parentNode.replaceChild(novoBtnNao, btnNao);

    novoBtnSim.onclick = function() {
        modal.style.display = 'none';
        if (callbackSim) callbackSim();
    };

    novoBtnNao.onclick = function() {
        modal.style.display = 'none';
    };
}
