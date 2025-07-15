const API_URL = "https://script.google.com/macros/s/AKfycbxrONxEXFU_JemcK9BZ-QOHc2uatgo4QVZYIz2JuWjP9nBIeeO7JPOOmS8uBDK0iogA8g/exec";


const alunosPorTurma = {
  "Criancas": [],
  "Adolescentes": [],
  "Jovens": [],
  "Adulto": [],
  "Terceira Idade": [],
  "Discipulado": []
};


function getDomingosDoMes(ano, mes) {
  const datas = [];
  const date = new Date(ano, mes, 1);
  while (date.getMonth() === mes) {
    if (date.getDay() === 0) {
      datas.push(new Date(date));
    }
    date.setDate(date.getDate() + 1);
  }
  return datas;
}

function carregarAlunos() {
  const turma = document.getElementById("turma").value;
  const mes = parseInt(document.getElementById("mes").value);
  const ano = parseInt(document.getElementById("ano").value);

  const cabecalho = document.getElementById("cabecalho");
  const tbody = document.getElementById("listaAlunos");
  cabecalho.innerHTML = "";
  tbody.innerHTML = "";

  if (!turma || isNaN(mes) || isNaN(ano)) return;

  const chave = `alunos_${turma}`;
  let lista = JSON.parse(localStorage.getItem(chave)) || alunosPorTurma[turma];
  if (!lista) return;

  alunosPorTurma[turma] = lista;

  const domingos = getDomingosDoMes(ano, mes);

  const thInicio = document.createElement("th");
  thInicio.textContent = "Quant.";
  cabecalho.appendChild(thInicio);

  const thNome = document.createElement("th");
  thNome.textContent = "Nome";
  cabecalho.appendChild(thNome);

  domingos.forEach(d => {
    const th = document.createElement("th");
    th.textContent = d.toLocaleDateString("pt-BR");
    cabecalho.appendChild(th);
  });

  lista.forEach((nome, index) => {
    const tr = document.createElement("tr");
    const isNovo = nome.startsWith("(NOVO)");
    const nomeLimpo = nome.replace("(NOVO) ", "");

    tr.innerHTML = `<td>${index + 1}</td><td${isNovo ? ' class="aluno-novo"' : ''}>${nomeLimpo}</td>`;

    domingos.forEach(d => {
      const dataStr = d.toISOString().split("T")[0];
      const select = `<select name="${index}_${dataStr}">
        <option value="">-</option>
        <option value="P">P</option>
        <option value="F">F</option>
      </select>`;
      const td = document.createElement("td");
      td.innerHTML = select;
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });
}

function salvarFrequencia() {
  const turma = document.getElementById("turma").value;
  const mes = parseInt(document.getElementById("mes").value);
  const ano = parseInt(document.getElementById("ano").value);

  if (!turma || isNaN(mes) || isNaN(ano)) {
    alert("Selecione o ano, mês e turma!");
    return;
  }

  const domingos = getDomingosDoMes(ano, mes);
  const dados = [
    ["Igreja do Nazareno"],
    ["Frequência da Escola Bíblica Dominical"],
    [`Ano: ${ano}   Mês: ${mes + 1}   Turma: ${turma.charAt(0).toUpperCase() + turma.slice(1)}`],
    [],
    ["Nº", "Nome", ...domingos.map(d => d.toLocaleDateString("pt-BR"))]
  ];

  const presencasParaEnviar = [];

  const rows = document.querySelectorAll("#listaAlunos tr");

  rows.forEach((row, i) => {
    let nome = row.children[1].textContent;
    if (row.children[1].classList.contains("aluno-novo")) {
      nome += " (Novo)";
    }
    const presencas = [];
    domingos.forEach((d) => {
      const dataStr = d.toISOString().split("T")[0];
      const select = row.querySelector(`select[name='${i}_${dataStr}']`);
      presencas.push(select ? select.value : "");
    });
    dados.push([i + 1, nome, ...presencas]);
    presencasParaEnviar.push({ nome: nome, presenca: presencas.join(", ") });
  });

  // Salvar Excel local
  const ws = XLSX.utils.aoa_to_sheet(dados);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Frequência");
  XLSX.writeFile(wb, `frequencia_${turma}_${ano}_${mes + 1}.xlsx`);

  // Enviar para Google Sheets via API
fetch(API_URL, {
  method: "POST",
  body: JSON.stringify({
    ano,
    mes,
    turma,
    presencas: presencasParaEnviar
  }),
  headers: {
    "Content-Type": "application/json"
  }
})
.then(res => res.text())
.then(msg => console.log("Planilha:", msg))
.catch(err => console.error("Erro ao enviar para planilha:", err));


  document.getElementById("mensagem").classList.remove("oculto");
  setTimeout(() => {
    document.getElementById("mensagem").classList.add("oculto");
  }, 3000);
}

function gerarPDF() {
  const turma = document.getElementById("turma").value;
  const mes = parseInt(document.getElementById("mes").value);
  const ano = parseInt(document.getElementById("ano").value);

  if (!turma || isNaN(mes) || isNaN(ano)) {
    alert("Selecione o ano, mês e turma!");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const domingos = getDomingosDoMes(ano, mes);
  const header = ["#", "Nome", ...domingos.map(d => d.toLocaleDateString("pt-BR"))];
  const rows = [];

  document.querySelectorAll("#listaAlunos tr").forEach((row, i) => {
    let nome = row.children[1].textContent;
    if (row.children[1].classList.contains("aluno-novo")) {
      nome += " (Novo)";
    }
    const presencas = [];
    domingos.forEach((d) => {
      const dataStr = d.toISOString().split("T")[0];
      const select = row.querySelector(`select[name='${i}_${dataStr}']`);
      presencas.push(select ? select.value : "");
    });
    rows.push([i + 1, nome, ...presencas]);
  });

  let y = 10;
  doc.setFontSize(14);
  doc.text(`Frequência EBD - ${turma} - ${mes + 1}/${ano}`, 10, y);
  y += 10;
  rows.unshift(header);
  rows.forEach(r => {
    doc.text(r.join("  "), 10, y);
    y += 8;
    if (y > 280) {
      doc.addPage();
      y = 10;
    }
  });

  doc.save(`frequencia_${turma}_${ano}_${mes + 1}.pdf`);
}

document.addEventListener("change", function (e) {
  if (e.target.tagName === "SELECT") {
    const valor = e.target.value;
    e.target.classList.remove("presente", "falta");
    if (valor === "P") {
      e.target.classList.add("presente");
    } else if (valor === "F") {
      e.target.classList.add("falta");
    }
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const anoSelect = document.getElementById("ano");
  const currentYear = new Date().getFullYear();
  for (let i = currentYear - 2; i <= currentYear + 1; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.text = i;
    if (i === currentYear) option.selected = true;
    anoSelect.appendChild(option);
  }
  carregarAlunos();
});

function adicionarAluno() {
  const nome = document.getElementById("novoAlunoNome").value.trim();
  const turma = document.getElementById("turma").value;

  if (!nome || !turma) {
    alert("Digite o nome e selecione a turma.");
    return;
  }

  const chave = `alunos_${turma}`;
  let lista = JSON.parse(localStorage.getItem(chave)) || alunosPorTurma[turma] || [];

  const nomeMarcado = `(NOVO) ${nome}`;
  lista.push(nomeMarcado);
  localStorage.setItem(chave, JSON.stringify(lista));

  alunosPorTurma[turma] = lista;
  document.getElementById("novoAlunoNome").value = "";
  carregarAlunos();
}
