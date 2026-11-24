const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const gameOverlay = document.getElementById("gameOverlay");
const menuPanel = document.getElementById("menuPanel");
const pausePanel = document.getElementById("pausePanel");
const gameOverPanel = document.getElementById("gameOverPanel");
const startButton = document.getElementById("startButton");
const resumeButton = document.getElementById("resumeButton");
const restartButton = document.getElementById("restartButton");
const tryAgainButton = document.getElementById("tryAgainButton");

startButton.addEventListener("click", iniciarPartida);
resumeButton.addEventListener("click", retomarPartida);
restartButton.addEventListener("click", iniciarPartida);
tryAgainButton.addEventListener("click", iniciarPartida);

function mostrarPainel(painel) {

    gameOverlay.hidden = false;
    menuPanel.hidden = true;
    pausePanel.hidden = true;
    gameOverPanel.hidden = true;
    painel.hidden = false;
}

function ocultarOverlay() {
    gameOverlay.hidden = true;
}

const nave = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    angulo: -Math.PI / 2,
    velocidadeX: 0,
    velocidadeY: 0,
    raio: 18,
    aceleracao: 260,
    velocidadeMaxima: 360,
    rotacao: 3.5,
    invulneravel: false,
    tempoInvulnerabilidade: 0
};

const teclas = new Set();

document.addEventListener("keydown", (event) => {

    if (["ArrowUp", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) {
        event.preventDefault();
    }

    if (event.code === "Escape") {

        if (event.repeat) {
            return;
        }

        if (estadoJogo === "jogando") {
            pausarPartida();

        } else if (estadoJogo === "pausado") {
            retomarPartida();
        }

        return;
    }

    teclas.add(event.code);
});

document.addEventListener("keyup", (event) => {
    teclas.delete(event.code);
});

const estrelas = Array.from({ length: 80 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    tamanho: Math.random() * 2
}));

function atualizarNave(deltaTime) {

    if (teclas.has("ArrowLeft") || teclas.has("KeyA")) {
        nave.angulo -= nave.rotacao * deltaTime;
    }

    if (teclas.has("ArrowRight") || teclas.has("KeyD")) {
        nave.angulo += nave.rotacao * deltaTime;
    }

    if (teclas.has("ArrowUp") || teclas.has("KeyW")) {

        nave.velocidadeX += Math.cos(nave.angulo) * nave.aceleracao * deltaTime;

        nave.velocidadeY += Math.sin(nave.angulo) * nave.aceleracao * deltaTime;
    }

    const velocidade = Math.hypot(
        nave.velocidadeX,
        nave.velocidadeY
    );

    if (velocidade > nave.velocidadeMaxima) {

        const fator = nave.velocidadeMaxima / velocidade;

        nave.velocidadeX *= fator;
        nave.velocidadeY *= fator;
    }

    const atrito = Math.pow(0.985, deltaTime * 60);
    nave.velocidadeX *= atrito;
    nave.velocidadeY *= atrito;

    nave.x += nave.velocidadeX * deltaTime;
    nave.y += nave.velocidadeY * deltaTime;

    if (nave.x > canvas.width + nave.raio) {
        nave.x = -nave.raio;
    }

    if (nave.x < -nave.raio) {
        nave.x = canvas.width + nave.raio;
    }

    if (nave.y > canvas.height + nave.raio) {
        nave.y = -nave.raio;
    }

    if (nave.y < -nave.raio) {
        nave.y = canvas.height + nave.raio;
    }

    if (nave.tempoInvulnerabilidade > 0) {

    nave.tempoInvulnerabilidade -= deltaTime;

    if (nave.tempoInvulnerabilidade < 0) {
        nave.tempoInvulnerabilidade = 0;
    }
    }

    if (tempoEscudoEspecial > 0) {

        tempoEscudoEspecial -= deltaTime;

        if (tempoEscudoEspecial < 0) {
            tempoEscudoEspecial = 0;
        }
    }

    nave.invulneravel = nave.tempoInvulnerabilidade > 0 || tempoEscudoEspecial > 0;
}


function desenharCenario() {
    ctx.fillStyle = "white";
    estrelas.forEach(estrela => {
        ctx.beginPath();
        ctx.arc(
            estrela.x,
            estrela.y,
            estrela.tamanho,
            0,
            Math.PI * 2
        );
        ctx.fill();
    });
}


function desenharNave() {

    if (nave.tempoInvulnerabilidade > 0 && Math.floor(performance.now() / 120) % 2 === 0) {
        return;
    }

    ctx.save();
    ctx.translate(nave.x, nave.y);
    ctx.rotate(nave.angulo);

    ctx.strokeStyle = "#00e5ff";
    ctx.lineWidth = 2;
    ctx.shadowBlur = 12;
    ctx.shadowColor = "#00e5ff";

    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(-12, -11);
    ctx.lineTo(-7, 0);
    ctx.lineTo(-12, 11);
    ctx.closePath();
    ctx.stroke();

    if (teclas.has("ArrowUp") || teclas.has("KeyW")) {
        ctx.strokeStyle = "#ff9d00";
        ctx.shadowColor = "#ff9d00";

        ctx.beginPath();
        ctx.moveTo(-9, -5);
        ctx.lineTo(-21, 0);
        ctx.lineTo(-9, 5);
        ctx.stroke();
    }

    ctx.restore();
}

const configuracaoVidas = {
    quantidadeInicial: 3,
    quantidadeMaxima: 5,
    tempoInvulnerabilidade: 2
};

let vidas = configuracaoVidas.quantidadeInicial;
let pontuacao = 0;
let estadoJogo = "menu";

let multiplicadorPontuacao = 1;
let tempoMultiplicadorPontuacao = 0;
let tempoEscudoEspecial = 0;
let tempoTiroRapido = 0;
let tempoTiroTriplo = 0;

const configuracaoEfeitosEspeciais = {
    duracaoPontos: 10,
    duracaoInvulnerabilidade: 5,
    duracaoTiroRapido: 8,
    duracaoTiroTriplo: 8
};



function verificarColisoes() {

    for (let i = tiros.length - 1; i >= 0; i--) {

        for (let j = asteroides.length - 1; j >= 0; j--) {

            const tiro = tiros[i];
            const asteroide = asteroides[j];

            const distancia = Math.hypot(
                tiro.x - asteroide.x,
                tiro.y - asteroide.y
            );

            const raioColisao = asteroide.raio * 1.15;

            if (distancia <= raioColisao + configuracaoTiro.raio) {

                const asteroideDestruido = asteroides[j];

                tiros.splice(i, 1);
                asteroides.splice(j, 1);

                destruirAsteroide(asteroideDestruido);
                break;
            }
        }
    }

    for (let i = tiros.length - 1; i >= 0; i--) {

        for (let j = meteorosEspeciais.length - 1; j >= 0; j--) {

            const tiro = tiros[i];
            const meteoro = meteorosEspeciais[j];

            const distancia = Math.hypot(
                tiro.x - meteoro.x,
                tiro.y - meteoro.y
            );

            const raioColisao = meteoro.raio * 1.15;

            if (distancia <= raioColisao + configuracaoTiro.raio) {

                tiros.splice(i, 1);
                meteorosEspeciais.splice(j, 1);

                ativarEfeitoMeteoro(meteoro);
                break;
            }
        }
    }

    if (nave.invulneravel) {
        return;
    }

    for (let i = asteroides.length - 1; i >= 0; i--) {

        const asteroide = asteroides[i];

        const distancia = Math.hypot(
            nave.x - asteroide.x,
            nave.y - asteroide.y
        );

        const raioColisao = asteroide.raio * 1.15;

        if (distancia <= nave.raio + raioColisao) {

            vidas--;

            nave.x = canvas.width / 2;
            nave.y = canvas.height / 2;

            nave.velocidadeX = 0;
            nave.velocidadeY = 0;

            nave.invulneravel = true;
            nave.tempoInvulnerabilidade =
                configuracaoVidas.tempoInvulnerabilidade;

            if (vidas <= 0) {
                estadoJogo = "gameover";
                mostrarPainel(gameOverPanel);
                teclas.clear();
            }

            break;
        }
    }
}



const tiros = [];

const configuracaoTiro = {
    velocidade: 650,
    distanciaMaxima: 550,
    intervalo: 0.25,
    intervaloTiroRapido: 0.12,
    raio: 3
};

let tempoParaProximoTiro = 0;

function criarTiro(angulo) {

    const direcaoX = Math.cos(angulo);
    const direcaoY = Math.sin(angulo);

    const tiro = {
        x: nave.x + direcaoX * nave.raio,
        y: nave.y + direcaoY * nave.raio,

        velocidadeX: direcaoX * configuracaoTiro.velocidade,
        velocidadeY: direcaoY * configuracaoTiro.velocidade,

        distanciaPercorrida: 0
    };

    tiros.push(tiro);
}

function disparar() {

    if (tempoTiroTriplo > 0) {
        criarTiro(nave.angulo);
        criarTiro(nave.angulo - Math.PI / 4);
        criarTiro(nave.angulo + Math.PI / 4);
        return;
    }
    criarTiro(nave.angulo);
}


function atualizarDisparos(deltaTime) {

    tempoParaProximoTiro -= deltaTime;

    if (teclas.has("Space") && tempoParaProximoTiro <= 0) {

        disparar();

        const intervaloAtual = tempoTiroRapido > 0 ? configuracaoTiro.intervaloTiroRapido : configuracaoTiro.intervalo;
        tempoParaProximoTiro = intervaloAtual;
    }
}


function atualizarTiros(deltaTime) {

    tiros.forEach(tiro => {
        tiro.x += tiro.velocidadeX * deltaTime;
        tiro.y += tiro.velocidadeY * deltaTime;

        const distancia = Math.hypot( tiro.velocidadeX, tiro.velocidadeY) * deltaTime;

        tiro.distanciaPercorrida += distancia;

        if (tiro.x > canvas.width + configuracaoTiro.raio) {
            tiro.x = -configuracaoTiro.raio;
        }

        if (tiro.x < -configuracaoTiro.raio) {
            tiro.x = canvas.width + configuracaoTiro.raio;
        }

        if (tiro.y > canvas.height + configuracaoTiro.raio) {
            tiro.y = -configuracaoTiro.raio;
        }

        if (tiro.y < -configuracaoTiro.raio) {
            tiro.y = canvas.height + configuracaoTiro.raio;
        }

    });


    for (let i = tiros.length - 1; i >= 0; i--) {

        if (tiros[i].distanciaPercorrida >= configuracaoTiro.distanciaMaxima) {
            tiros.splice(i, 1);
        }
    }
}


function desenharTiros() {
    ctx.save();
    ctx.fillStyle = "#ff9d00";
    ctx.shadowBlur = 12;
    ctx.shadowColor = "#ff9d00";
    tiros.forEach(tiro => {
        ctx.beginPath();
        ctx.arc(
            tiro.x,
            tiro.y,
            configuracaoTiro.raio,
            0,
            Math.PI * 2
        );
        ctx.fill();
    });
    ctx.restore();
}


const asteroides = [];

const meteorosEspeciais = [];

const configuracaoMeteorosEspeciais = {
    intervaloGeracao: 15,

    efeitos: [
        {
            tipo: "vida",
            cor: "#39ff14"
        },
        {
            tipo: "pontos",
            cor: "#ffd700"
        },
        {
            tipo: "invulnerabilidade",
            cor: "#bf5fff"
        },
        {
            tipo: "invulnerabilidade",
            cor: "#bf5fff"
        },
        {
            tipo: "tiroRapido",
            cor: "#ff3030"
        },
        {
            tipo: "tiroTriplo",
            cor: "#ff8c00"
        }
    ]
};

let tempoParaGerarMeteoro = configuracaoMeteorosEspeciais.intervaloGeracao;

const configuracaoAsteroides = {
    quantidadeInicial: 6,
    quantidadeDesejada: 6,
    quantidadeMaxima: 12,
    intervaloReposicao: 2,

    tamanhos: {
        grande: {
            raioMinimo: 36,
            raioMaximo: 48,
            pontuacao: 20
        },

        medio: {
            raioMinimo: 24,
            raioMaximo: 32,
            pontuacao: 50
        },

        pequeno: {
            raioMinimo: 12,
            raioMaximo: 18,
            pontuacao: 100
        }
    },

    velocidadeMinima: 45,
    velocidadeMaxima: 100,

    verticesMinimo: 8,
    verticesMaximo: 12
};

const niveisDificuldade = [
    {
        pontuacaoMinima: 0,
        quantidadeAsteroides: 6,
        velocidadeMinima: 45,
        velocidadeMaxima: 100
    },
    {
        pontuacaoMinima: 1000,
        quantidadeAsteroides: 7,
        velocidadeMinima: 55,
        velocidadeMaxima: 110
    },
    {
        pontuacaoMinima: 3000,
        quantidadeAsteroides: 8,
        velocidadeMinima: 65,
        velocidadeMaxima: 120
    },
    {
        pontuacaoMinima: 5000,
        quantidadeAsteroides: 9,
        velocidadeMinima: 75,
        velocidadeMaxima: 130
    },
    {
        pontuacaoMinima: 7000,
        quantidadeAsteroides: 10,
        velocidadeMinima: 85,
        velocidadeMaxima: 140
    },
    {
        pontuacaoMinima: 10000,
        quantidadeAsteroides: 11,
        velocidadeMinima: 95,
        velocidadeMaxima: 150
    },
    {
        pontuacaoMinima: 3000,
        quantidadeAsteroides: 12,
        velocidadeMinima: 105,
        velocidadeMaxima: 160
    }
];

let nivelAtual = 0;

function numeroAleatorio(min, max) {
    return Math.random() * (max - min) + min;
}

function criarAsteroide(tamanho = "grande") {

    const configuracaoTamanho = configuracaoAsteroides.tamanhos[tamanho];

    if (!configuracaoTamanho) {
        throw new Error(`Tamanho de asteroide inválido: ${tamanho}`);
    }

    const raio = numeroAleatorio(
        configuracaoTamanho.raioMinimo,
        configuracaoTamanho.raioMaximo
    );

    const quantidadeVertices = Math.floor(
        numeroAleatorio(
            configuracaoAsteroides.verticesMinimo,
            configuracaoAsteroides.verticesMaximo + 1
        )
    );

    const pontos = [];

    for (let i = 0; i < quantidadeVertices; i++) {

        const angulo = (Math.PI * 2 / quantidadeVertices) * i;

        const raioVariavel = numeroAleatorio(
            raio * 0.75,
            raio * 1.15
        );

        pontos.push({
            x: Math.cos(angulo) * raioVariavel,
            y: Math.sin(angulo) * raioVariavel
        });
    }

    const velocidade = numeroAleatorio(
        configuracaoAsteroides.velocidadeMinima,
        configuracaoAsteroides.velocidadeMaxima
    );

    const anguloMovimento = numeroAleatorio(0, Math.PI * 2);

    const detalhes = Array.from(
        { length: Math.floor(numeroAleatorio(1, 4)) }, () => {

            const angulo = numeroAleatorio(0, Math.PI * 2);
            const distancia = numeroAleatorio(raio * 0.15, raio * 0.4);

            return {
                x: Math.cos(angulo) * distancia,
                y: Math.sin(angulo) * distancia,
                raio: numeroAleatorio(raio * 0.08, raio * 0.16)
            };
        }
    );

    return {
        x: 0,
        y: 0,

        tamanho,
        raio,
        valorPontuacao: configuracaoTamanho.pontuacao,
        pontos,
        detalhes,

        velocidadeX: Math.cos(anguloMovimento) * velocidade,
        velocidadeY: Math.sin(anguloMovimento) * velocidade,

        angulo: numeroAleatorio(0, Math.PI * 2),

        velocidadeRotacao: numeroAleatorio(-1, 1)
    };
}

function criarAsteroideNaBorda(tamanho = "grande") {

    const asteroide = criarAsteroide(tamanho);

    const lado = Math.floor(Math.random() * 4);

    let angulo;

    if (lado === 0) {

        asteroide.x = -asteroide.raio;
        asteroide.y = numeroAleatorio(0, canvas.height);

        angulo = numeroAleatorio(-Math.PI / 3, Math.PI / 3);

    } else if (lado === 1) {

        asteroide.x = canvas.width + asteroide.raio;
        asteroide.y = numeroAleatorio(0, canvas.height);

        angulo = numeroAleatorio(2 * Math.PI / 3, 4 * Math.PI / 3);

    } else if (lado === 2) {

        asteroide.x = numeroAleatorio(0, canvas.width);
        asteroide.y = -asteroide.raio;

        angulo = numeroAleatorio(Math.PI / 6, 5 * Math.PI / 6);

    } else {

        asteroide.x = numeroAleatorio(0, canvas.width);
        asteroide.y = canvas.height + asteroide.raio;

        angulo = numeroAleatorio(7 * Math.PI / 6, 11 * Math.PI / 6);
    }

    const velocidade = Math.hypot(
        asteroide.velocidadeX,
        asteroide.velocidadeY
    );

    asteroide.velocidadeX = Math.cos(angulo) * velocidade;
    asteroide.velocidadeY = Math.sin(angulo) * velocidade;

    return asteroide;
}

function criarMeteoroEspecial() {

    const meteoro = criarAsteroideNaBorda("pequeno");

    const indiceEfeito = Math.floor(
        Math.random() * configuracaoMeteorosEspeciais.efeitos.length
    );

    const efeito = configuracaoMeteorosEspeciais.efeitos[indiceEfeito];

    meteoro.tipo = efeito.tipo;
    meteoro.cor = efeito.cor;

    return meteoro;
}

function ativarEfeitoMeteoro(meteoro) {

    switch (meteoro.tipo) {

        case "vida":
            if (vidas < configuracaoVidas.quantidadeMaxima) {
                vidas++;
            }
            break;

        case "pontos":
            multiplicadorPontuacao = 2;
            tempoMultiplicadorPontuacao = configuracaoEfeitosEspeciais.duracaoPontos;
            break;

        case "invulnerabilidade":
            tempoEscudoEspecial = configuracaoEfeitosEspeciais.duracaoInvulnerabilidade;
            nave.invulneravel = true;
            break;
        
        case "tiroRapido":
            tempoTiroRapido = configuracaoEfeitosEspeciais.duracaoTiroRapido;
        break;

        case "tiroTriplo":
            tempoTiroTriplo = configuracaoEfeitosEspeciais.duracaoTiroTriplo;
        break;
    }
}

function atualizarEfeitosEspeciais(deltaTime) {

    if (tempoMultiplicadorPontuacao > 0) {

        tempoMultiplicadorPontuacao -= deltaTime;

        if (tempoMultiplicadorPontuacao <= 0) {

            tempoMultiplicadorPontuacao = 0;
            multiplicadorPontuacao = 1;
        }
    }

    if (tempoTiroRapido > 0) {

        tempoTiroRapido -= deltaTime;

        if (tempoTiroRapido <= 0) {
            tempoTiroRapido = 0;
        }
    }

    if (tempoTiroTriplo > 0) {

        tempoTiroTriplo -= deltaTime;

        if (tempoTiroTriplo <= 0) {
            tempoTiroTriplo = 0;
        }
    }
}

function atualizarMeteorosEspeciais(deltaTime) {

    if (meteorosEspeciais.length === 0) {

        tempoParaGerarMeteoro -= deltaTime;

        if (tempoParaGerarMeteoro <= 0) {

            meteorosEspeciais.push(criarMeteoroEspecial());

            tempoParaGerarMeteoro =
                configuracaoMeteorosEspeciais.intervaloGeracao;
        }
    }

    meteorosEspeciais.forEach(meteoro => {

        meteoro.x += meteoro.velocidadeX * deltaTime;
        meteoro.y += meteoro.velocidadeY * deltaTime;

        meteoro.angulo += meteoro.velocidadeRotacao * deltaTime;

        if (meteoro.x > canvas.width + meteoro.raio) {
            meteoro.x = -meteoro.raio;
        }

        if (meteoro.x < -meteoro.raio) {
            meteoro.x = canvas.width + meteoro.raio;
        }

        if (meteoro.y > canvas.height + meteoro.raio) {
            meteoro.y = -meteoro.raio;
        }

        if (meteoro.y < -meteoro.raio) {
            meteoro.y = canvas.height + meteoro.raio;
        }
    });
}



function destruirAsteroide(asteroide) {

    pontuacao += asteroide.valorPontuacao * multiplicadorPontuacao;

    const proximoTamanho = {
        grande: "medio",
        medio: "pequeno",
        pequeno: null
    };

    const tamanhoFilho = proximoTamanho[asteroide.tamanho];

    if (!tamanhoFilho) {
        return;
    }

    const espacosDisponiveis = configuracaoAsteroides.quantidadeMaxima - asteroides.length;

    const quantidadeFilhos = Math.min(2, espacosDisponiveis);

    for (let i = 0; i < quantidadeFilhos; i++) {

        const novoAsteroide = criarAsteroide(tamanhoFilho);

        novoAsteroide.x = asteroide.x;
        novoAsteroide.y = asteroide.y;

        asteroides.push(novoAsteroide);
    }
}

function atualizarAsteroides(deltaTime) {

    asteroides.forEach(asteroide => {

        asteroide.x += asteroide.velocidadeX * deltaTime;
        asteroide.y += asteroide.velocidadeY * deltaTime;
        asteroide.angulo += asteroide.velocidadeRotacao * deltaTime;

        if (asteroide.x > canvas.width + asteroide.raio) {
            asteroide.x = -asteroide.raio;
        }

        if (asteroide.x < -asteroide.raio) {
            asteroide.x = canvas.width + asteroide.raio;
        }

        if (asteroide.y > canvas.height + asteroide.raio) {
            asteroide.y = -asteroide.raio;
        }

        if (asteroide.y < -asteroide.raio) {
            asteroide.y = canvas.height + asteroide.raio;
        }

    });
}

let tempoParaReposicao = configuracaoAsteroides.intervaloReposicao;

function atualizarReposicaoAsteroides(deltaTime) {

    const quantidadeAlvo = Math.min(
        configuracaoAsteroides.quantidadeDesejada,
        configuracaoAsteroides.quantidadeMaxima
    );

    if (asteroides.length >= quantidadeAlvo) {
        tempoParaReposicao = configuracaoAsteroides.intervaloReposicao;
        return;
    }

    tempoParaReposicao -= deltaTime;

    if (tempoParaReposicao <= 0) {

        asteroides.push(criarAsteroideNaBorda());

        tempoParaReposicao = configuracaoAsteroides.intervaloReposicao;
    }
}

function atualizarDificuldade() {

    let novoNivel = 0;

    for (let i = 0; i < niveisDificuldade.length; i++) {

        if (pontuacao >= niveisDificuldade[i].pontuacaoMinima) {
            novoNivel = i;
        }
    }

    if (novoNivel === nivelAtual) {
        return;
    }

    nivelAtual = novoNivel;

    const configuracaoNivel = niveisDificuldade[nivelAtual];

    configuracaoAsteroides.quantidadeDesejada =
        configuracaoNivel.quantidadeAsteroides;

    configuracaoAsteroides.velocidadeMinima =
        configuracaoNivel.velocidadeMinima;

    configuracaoAsteroides.velocidadeMaxima =
        configuracaoNivel.velocidadeMaxima;
}

function desenharAsteroides() {

    asteroides.forEach(asteroide => {

        ctx.save();

        ctx.translate(asteroide.x, asteroide.y);
        ctx.rotate(asteroide.angulo);

        ctx.fillStyle = "#111b2a";
        ctx.strokeStyle = "#71849b";
        ctx.lineWidth = 2;

        ctx.shadowBlur = 8;
        ctx.shadowColor = "#526d91";

        ctx.beginPath();

        ctx.moveTo(
            asteroide.pontos[0].x,
            asteroide.pontos[0].y
        );

        for (let i = 1; i < asteroide.pontos.length; i++) {

            ctx.lineTo(
                asteroide.pontos[i].x,
                asteroide.pontos[i].y
            );
        }

        ctx.closePath();

        ctx.fill();
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.strokeStyle = "#34465e";
        ctx.lineWidth = 1.5;

        asteroide.detalhes.forEach(detalhe => {

            ctx.beginPath();

            ctx.arc(
                detalhe.x,
                detalhe.y,
                detalhe.raio,
                0,
                Math.PI * 2
            );

            ctx.stroke();
        });

        ctx.restore();
    });
}

function desenharMeteorosEspeciais() {

    meteorosEspeciais.forEach(meteoro => {

        ctx.save();

        ctx.translate(meteoro.x, meteoro.y);
        ctx.rotate(meteoro.angulo);

        ctx.fillStyle = "#111b2a";
        ctx.strokeStyle = meteoro.cor;
        ctx.lineWidth = 2;

        ctx.shadowBlur = 18;
        ctx.shadowColor = meteoro.cor;

        ctx.beginPath();

        ctx.moveTo(
            meteoro.pontos[0].x,
            meteoro.pontos[0].y
        );

        for (let i = 1; i < meteoro.pontos.length; i++) {

            ctx.lineTo(
                meteoro.pontos[i].x,
                meteoro.pontos[i].y
            );
        }

        ctx.closePath();

        ctx.fill();
        ctx.stroke();

        ctx.restore();
    });
}

function iniciarPartida() {

    estadoJogo = "jogando";
    vidas = configuracaoVidas.quantidadeInicial;
    pontuacao = 0;
    nave.x = canvas.width / 2;
    nave.y = canvas.height / 2;
    nave.angulo = -Math.PI / 2;
    nave.velocidadeX = 0;
    nave.velocidadeY = 0;
    nave.invulneravel = false;
    nave.tempoInvulnerabilidade = 0;

    tiros.length = 0;
    asteroides.length = 0;

    tempoParaProximoTiro = 0;
    tempoParaReposicao = configuracaoAsteroides.intervaloReposicao;

    nivelAtual = 0;
    const dificuldadeInicial = niveisDificuldade[0];

    multiplicadorPontuacao = 1;
    tempoMultiplicadorPontuacao = 0;
    tempoEscudoEspecial = 0;
    tempoTiroRapido = 0;
    tempoTiroTriplo = 0;

    configuracaoAsteroides.quantidadeDesejada = dificuldadeInicial.quantidadeAsteroides;
    configuracaoAsteroides.velocidadeMinima = dificuldadeInicial.velocidadeMinima;
    configuracaoAsteroides.velocidadeMaxima = dificuldadeInicial.velocidadeMaxima;
    meteorosEspeciais.length = 0;
    tempoParaGerarMeteoro = configuracaoMeteorosEspeciais.intervaloGeracao;

    for (let i = 0; i < configuracaoAsteroides.quantidadeInicial; i++) {
        asteroides.push(criarAsteroideNaBorda());
    }

    teclas.clear();
    ultimoFrame = performance.now();
    ocultarOverlay();
}

function pausarPartida() {

    if (estadoJogo !== "jogando") {
        return;
    }

    estadoJogo = "pausado";

    teclas.clear();

    mostrarPainel(pausePanel);
}

function retomarPartida() {

    if (estadoJogo !== "pausado") {
        return;
    }

    estadoJogo = "jogando";
    teclas.clear();
    ultimoFrame = performance.now();
    ocultarOverlay();
}

function desenharVidas() {
    ctx.save();
    ctx.font = "24px Arial";
    ctx.textAlign = "left";

    for (let i = 0; i < vidas; i++) {
        ctx.fillText("❤️", 20 + i * 35, 35);
    }

    ctx.restore();
}

function desenharInterface() {
    ctx.save();
    desenharVidas();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 20px Arial";
    ctx.textAlign = "right";
    const textoPontuacao = `PONTOS: ${pontuacao}`;
    ctx.fillText(
        textoPontuacao,
        canvas.width - 20,
        35
    );

    if (multiplicadorPontuacao > 1) {
        const larguraPontuacao = ctx.measureText(textoPontuacao).width;
        ctx.fillStyle = "#ffd700";
        ctx.shadowBlur = 12;
        ctx.shadowColor = "#ffd700";
        ctx.fillText(
            "2X",
            canvas.width - 20 - larguraPontuacao - 12,
            35
        );
    }
    ctx.restore();
}



function desenharEscudo() {
    if (tempoEscudoEspecial <= 0) {
        return;
    }
    const pulsacao = Math.sin(performance.now() / 120) * 3;
    ctx.save();
    ctx.translate(nave.x, nave.y);
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = "#bf5fff";
    ctx.lineWidth = 2.5;
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#bf5fff";
    ctx.beginPath();
    ctx.arc(
        0,
        0,
        nave.raio + 12 + pulsacao,
        0,
        Math.PI * 2
    );
    ctx.stroke();
    ctx.restore();
}


function desenhar() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    desenharCenario();
    desenharEscudo();
    desenharNave();
    desenharTiros();
    desenharAsteroides();
    desenharMeteorosEspeciais();
    desenharInterface();
}

let ultimoFrame = 0;

function gameLoop(timestamp) {

    const deltaTime = Math.min(
        (timestamp - ultimoFrame) / 1000,
        0.05
    );

    ultimoFrame = timestamp;

    if (estadoJogo === "jogando") {

        atualizarNave(deltaTime);
        atualizarEfeitosEspeciais(deltaTime);
        atualizarDisparos(deltaTime);
        atualizarTiros(deltaTime);
        atualizarAsteroides(deltaTime);
        atualizarMeteorosEspeciais(deltaTime);
        atualizarReposicaoAsteroides(deltaTime);
        atualizarDificuldade();
        verificarColisoes();
    }

    desenhar();

    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);