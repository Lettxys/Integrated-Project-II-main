// CODIGO PRO MODAL BONITINHO

document.addEventListener("DOMContentLoaded", function() {
    const modalHTML = `
    <div id="modal-aviso" class="modal">
        <div class="modal-conteudo">
            <div style="text-align: center; margin-bottom: 15px;">
                <i class="fa-solid fa-circle-exclamation" style="font-size: 3rem; color: #8fb677;"></i>
            </div>
            
            <h3 style="text-align: center; color: #26411d; margin-bottom: 10px;">Atenção</h3>
            
            <p id="texto-aviso" style="text-align: center; color: #333; margin-bottom: 20px; font-size: 1rem;"></p>
            
            <button id="btn-modal-entendido" class="btn-entrar" style="margin: 0 auto;">Entendido</button>
        </div>
    </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const modal = document.getElementById('modal-aviso');
    
    window.addEventListener('click', function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
        const modalPergunta = document.getElementById('modal-pergunta');
        if (modalPergunta && event.target == modalPergunta) {
            modalPergunta.style.display = 'none';
        }
    });

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

    window.addEventListener('click', function(event) {
        const modalSair = document.getElementById('modal-sair');
        if (modalSair && event.target == modalSair) modalSair.style.display = 'none';
    });
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
