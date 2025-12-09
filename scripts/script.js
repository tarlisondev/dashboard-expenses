
// Elementos do DOM
const selectAno = document.getElementById('filtro-ano');
const selectMes = document.getElementById('filtro-mes');
const selectCategoria = document.getElementById('filtro-categoria');
const btnReset = document.getElementById('btn-reset');

// Elementos dos resultados
const somaGeralElement = document.getElementById('soma-geral');
const somaAnoElement = document.getElementById('soma-ano');
const somaMesElement = document.getElementById('soma-mes');
const descGeralElement = document.getElementById('desc-geral');
const descAnoElement = document.getElementById('desc-ano');
const descMesElement = document.getElementById('desc-mes');

// Elementos dos gráficos
const graficoBarrasCanvas = document.getElementById('grafico-barras');
const graficoPizzaCanvas = document.getElementById('grafico-pizza');
const placeholderBarras = document.getElementById('placeholder-barras');
const placeholderPizza = document.getElementById('placeholder-pizza');

let dados;
let graficoBarras = null;
let graficoPizza = null;

// Cores para os gráficos
const coresBarras = [
    'rgba(74, 144, 226, 0.8)',
    'rgba(74, 144, 226, 0.7)',
    'rgba(74, 144, 226, 0.6)',
    'rgba(74, 144, 226, 0.5)',
    'rgba(74, 144, 226, 0.4)'
];

const coresCategorias = [
    '#4a90e2', '#27ae60', '#e74c3c', '#f39c12', '#9b59b6',
    '#1abc9c', '#d35400', '#34495e', '#16a085', '#8e44ad',
    '#2c3e50', '#7f8c8d'
];

// Buscar dados da API
const findExpense = async () => {
    const response = await fetch('https://api-expenses-0md8.onrender.com', { //https://api-expenses-0md8.onrender.com
        method: 'get',
        headers: { 'Content-Type': 'application/json' }
    });
    return await response.json();
}

// test

// Função para converter valor
function converterValorParaNumero(valorString) {
    const valorStr = String(valorString)
        .replace(/R\$\s*/gi, '')
        .replace(/\s+/g, '')
        .trim();

    if (valorStr.includes(',')) {
        return parseFloat(valorStr.replace(/\./g, '').replace(',', '.')) || 0;
    }

    if (valorStr.includes('.')) {
        const partes = valorStr.split('.');
        if (partes.length > 2) {
            return parseFloat(valorStr.replace(/\./g, '')) || 0;
        }
    }

    return parseFloat(valorStr) || 0;
}

// Função para formatar para Real
function formatarParaReal(valor) {
    return valor.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

// Extrair valores únicos
function extrairValoresUnicos(propriedade) {
    const valores = dados.map(item => item[propriedade]);
    return [...new Set(valores)].sort((a, b) => {
        if (propriedade === 'ano') return parseInt(a) - parseInt(b);
        return a.localeCompare(b);
    });
}

// Popular selects
function popularSelects() {
    // Anos
    const anos = extrairValoresUnicos('ano');
    anos.forEach(ano => {
        const option = document.createElement('option');
        option.value = ano;
        option.textContent = ano;
        selectAno.appendChild(option);
    });

    // Meses (em ordem cronológica)
    const mesesOrdem = [
        'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
        'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
    ];

    const mesesExistentes = extrairValoresUnicos('mes');
    mesesOrdem.forEach(mes => {
        if (mesesExistentes.includes(mes)) {
            const option = document.createElement('option');
            option.value = mes;
            option.textContent = mes.charAt(0).toUpperCase() + mes.slice(1);
            selectMes.appendChild(option);
        }
    });

    // Categorias
    const categorias = extrairValoresUnicos('categoria');
    categorias.forEach(categoria => {
        const option = document.createElement('option');
        option.value = categoria;
        option.textContent = categoria;
        selectCategoria.appendChild(option);
    });
}

// Função principal de cálculo
function calcularResultados() {
    const anoSelecionado = selectAno.value;
    const mesSelecionado = selectMes.value;
    const categoriaSelecionada = selectCategoria.value;

    // 1. Calcular SOMA DO ANO (total do ano selecionado, sem considerar filtros de mês/categoria)
    let somaAno = 0;
    let descAno = '';

    if (anoSelecionado !== 'all') {
        // Filtra apenas pelo ano selecionado
        const dadosAno = dados.filter(item => item.ano === anoSelecionado);
        somaAno = dadosAno.reduce((total, item) =>
            total + converterValorParaNumero(item.valor), 0);
        descAno = `Total do ano ${anoSelecionado}`;
    } else {
        // Se "todos os anos", mostra 0 ou soma de todos os anos?
        const dadosTodosAnos = dados.filter(item => {
            if (mesSelecionado !== 'all' && item.mes !== mesSelecionado) return false;
            if (categoriaSelecionada !== 'all' && item.categoria !== categoriaSelecionada) return false;
            return true;
        });
        somaAno = dadosTodosAnos.reduce((total, item) =>
            total + converterValorParaNumero(item.valor), 0);
        descAno = 'Selecione um ano para ver o total';
    }

    // 2. Calcular SOMA DO MÊS (total do mês selecionado, considerando filtro de ano se houver)
    let somaMes = 0;
    let descMes = '';

    if (mesSelecionado !== 'all') {
        const dadosMes = dados.filter(item => {
            if (anoSelecionado !== 'all' && item.ano !== anoSelecionado) return false;
            return item.mes === mesSelecionado;
        });
        somaMes = dadosMes.reduce((total, item) =>
            total + converterValorParaNumero(item.valor), 0);

        descMes = `Total de ${mesSelecionado.charAt(0).toUpperCase() + mesSelecionado.slice(1)}`;
        if (anoSelecionado !== 'all') {
            descMes += `/${anoSelecionado}`;
        }
    } else {
        // Se "todos os meses", mostra 0
        somaMes = 0;
        descMes = 'Selecione um mês para ver o total';
        if (anoSelecionado !== 'all') {
            descMes += ` do ano ${anoSelecionado}`;
        }
    }

    // 3. Calcular SOMA POR CATEGORIA (total da categoria selecionada, considerando outros filtros)
    let somaCategoria = 0;
    let descCategoria = '';

    if (categoriaSelecionada !== 'all') {
        const dadosCategoria = dados.filter(item => {
            if (anoSelecionado !== 'all' && item.ano !== anoSelecionado) return false;
            if (mesSelecionado !== 'all' && item.mes !== mesSelecionado) return false;
            return item.categoria === categoriaSelecionada;
        });
        somaCategoria = dadosCategoria.reduce((total, item) =>
            total + converterValorParaNumero(item.valor), 0);
        descCategoria = `Total da categoria: ${categoriaSelecionada}`;

        if (anoSelecionado !== 'all' || mesSelecionado !== 'all') {
            descCategoria += ' (com filtros aplicados)';
        }
    } else {
        // Se "todas categorias", mostra 0
        somaCategoria = 0;
        descCategoria = 'Selecione uma categoria para ver o total';
    }

    // Atualizar elementos do DOM
    atualizarResultados(somaAno, somaMes, somaCategoria, descAno, descMes, descCategoria);

    // Atualizar gráficos
    atualizarGraficos(anoSelecionado, mesSelecionado);
}

// Atualizar resultados na tela
function atualizarResultados(somaAno, somaMes, somaCategoria, descAno, descMes, descCategoria) {
    // Card 1: Soma do Ano
    somaGeralElement.textContent = formatarParaReal(somaAno);
    descGeralElement.textContent = descAno;

    // Card 2: Soma do Mês
    somaAnoElement.textContent = formatarParaReal(somaMes);
    descAnoElement.textContent = descMes;

    // Card 3: Soma por Categoria
    somaMesElement.textContent = formatarParaReal(somaCategoria);
    descMesElement.textContent = descCategoria;
}

// Atualizar gráficos
function atualizarGraficos(anoSelecionado, mesSelecionado) {
    // Destruir gráficos existentes
    if (graficoBarras) {
        graficoBarras.destroy();
        graficoBarras = null;
    }

    if (graficoPizza) {
        graficoPizza.destroy();
        graficoPizza = null;
    }

    // Mostrar/ocultar placeholders e gráficos
    if (anoSelecionado !== 'all') {
        // Mostrar gráfico de barras
        placeholderBarras.style.display = 'none';
        graficoBarrasCanvas.style.display = 'block';
        criarGraficoBarras(anoSelecionado);
    } else {
        // Mostrar placeholder do gráfico de barras
        placeholderBarras.style.display = 'flex';
        graficoBarrasCanvas.style.display = 'none';
    }

    if (anoSelecionado !== 'all' && mesSelecionado !== 'all') {
        // Mostrar gráfico de pizza
        placeholderPizza.style.display = 'none';
        graficoPizzaCanvas.style.display = 'block';
        criarGraficoPizza(anoSelecionado, mesSelecionado);
    } else {
        // Mostrar placeholder do gráfico de pizza
        placeholderPizza.style.display = 'flex';
        graficoPizzaCanvas.style.display = 'none';
    }
}

// Criar gráfico de barras (gastos mensais)
function criarGraficoBarras(anoSelecionado) {
    const mesesOrdem = [
        'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
        'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
    ];

    // Calcular totais por mês
    const totaisMensais = {};

    // Inicializar todos os meses com 0
    mesesOrdem.forEach(mes => {
        totaisMensais[mes] = 0;
    });

    // Preencher com dados reais
    dados.forEach(item => {
        if (item.ano === anoSelecionado) {
            const valor = converterValorParaNumero(item.valor);
            totaisMensais[item.mes] += valor;
        }
    });

    // Preparar dados para o gráfico
    const labels = mesesOrdem.map(mes => mes.charAt(0).toUpperCase() + mes.slice(1));
    const valores = mesesOrdem.map(mes => totaisMensais[mes]);

    // Criar o gráfico
    const ctx = graficoBarrasCanvas.getContext('2d');
    graficoBarras = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: `Gastos em ${anoSelecionado}`,
                data: valores,
                backgroundColor: coresBarras,
                borderColor: 'rgba(74, 144, 226, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += formatarParaReal(context.raw);
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            return formatarParaReal(value);
                        }
                    },
                    title: {
                        display: true,
                        text: 'Valor (R$)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Meses'
                    }
                }
            }
        }
    });
}

// Criar gráfico de pizza (distribuição por categoria)
function criarGraficoPizza(anoSelecionado, mesSelecionado) {
    // Filtrar dados por ano e mês
    const dadosFiltrados = dados.filter(item =>
        item.ano === anoSelecionado && item.mes === mesSelecionado
    );

    // Agrupar por categoria
    const totaisPorCategoria = {};

    dadosFiltrados.forEach(item => {
        const categoria = item.categoria;
        const valor = converterValorParaNumero(item.valor);

        if (!totaisPorCategoria[categoria]) {
            totaisPorCategoria[categoria] = 0;
        }

        totaisPorCategoria[categoria] += valor;
    });

    // Preparar dados para o gráfico
    const categorias = Object.keys(totaisPorCategoria);
    const valores = Object.values(totaisPorCategoria);

    // Criar o gráfico
    const ctx = graficoPizzaCanvas.getContext('2d');
    graficoPizza = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: categorias,
            datasets: [{
                data: valores,
                backgroundColor: coresCategorias.slice(0, categorias.length),
                borderColor: '#fff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'right',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${formatarParaReal(value)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Resetar filtros
function resetarFiltros() {
    selectAno.value = 'all';
    selectMes.value = 'all';
    selectCategoria.value = 'all';
    calcularResultados();
}

// Inicializar
async function inicializar() {
    try {
        dados = await findExpense();
        popularSelects();

        // Adicionar event listeners
        selectAno.addEventListener('change', calcularResultados);
        selectMes.addEventListener('change', calcularResultados);
        selectCategoria.addEventListener('change', calcularResultados);
        btnReset.addEventListener('click', resetarFiltros);

        // Calcular resultados iniciais
        calcularResultados();
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        alert('Erro ao carregar os dados. Verifique se o servidor está rodando.');
    }
}

// Iniciar quando o DOM carregar
document.addEventListener('DOMContentLoaded', inicializar);
