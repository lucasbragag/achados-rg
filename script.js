const form = document.getElementById("itemForm");
const itensContainer = document.getElementById("itensContainer");
const filtroTipo = document.getElementById("filtroTipo");
const filtroCategoria = document.getElementById("filtroCategoria");
const buscaTexto = document.getElementById("buscaTexto");
const fotoInput = document.getElementById("foto");

let itens = JSON.parse(localStorage.getItem("achadosRGItens")) || [];

function salvarItens() {
  localStorage.setItem("achadosRGItens", JSON.stringify(itens));
}

function formatarData(data) {
  if (!data) return "";
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

function renderizarItens() {
  const tipoSelecionado = filtroTipo.value;
  const categoriaSelecionada = filtroCategoria.value;
  const textoBusca = buscaTexto.value.toLowerCase().trim();

  const itensFiltrados = itens.filter((item) => {
    const bateTipo = tipoSelecionado === "Todos" || item.tipo === tipoSelecionado;
    const bateCategoria =
      categoriaSelecionada === "Todas" || item.categoria === categoriaSelecionada;

    const textoCompleto = `
      ${item.titulo}
      ${item.categoria}
      ${item.bairro}
      ${item.descricao}
    `.toLowerCase();

    const bateTexto = textoCompleto.includes(textoBusca);

    return bateTipo && bateCategoria && bateTexto;
  });

  if (itensFiltrados.length === 0) {
    itensContainer.innerHTML = `<p class="vazio">Nenhum anúncio encontrado.</p>`;
    return;
  }

  itensContainer.innerHTML = itensFiltrados
    .map((item, index) => {
      const classeBadge = item.tipo === "Perdido" ? "perdido" : "encontrado";

      return `
        <div class="item-card">
          ${item.foto ? `<img src="${item.foto}" alt="Foto do item" class="item-img">` : ""}

          <div class="item-topo">
            <span class="badge ${classeBadge}">${item.tipo}</span>
            <small>${formatarData(item.data)}</small>
          </div>

          <h4>${item.titulo}</h4>
          <p><strong>Categoria:</strong> ${item.categoria}</p>
          <p><strong>Bairro:</strong> ${item.bairro}</p>
          <p><strong>Descrição:</strong> ${item.descricao}</p>
          <p><strong>Contato:</strong> ${item.contato}</p>
          <a class="btn btn-whatsapp" target="_blank" href="https://wa.me/55${item.contato}?text=${encodeURIComponent(`Olá! Vi seu anúncio no Achados RG sobre: ${item.titulo}. Acho que pode ser meu.`)}">
             Falar no WhatsApp
          </a>
          <button class="btn btn-secundario" onclick="removerItem(${index})">Remover</button>
        </div>
      `;
    })
    .join("");
}

function removerItem(index) {
  if (confirm("Tem certeza que deseja remover este anúncio?")) {
    itens.splice(index, 1);
    salvarItens();
    renderizarItens();
  }
}

function salvarNovoItem(fotoBase64 = "", telefoneLimpo = "") {
  const novoItem = {
    tipo: document.getElementById("tipo").value,
    categoria: document.getElementById("categoria").value,
    titulo: document.getElementById("titulo").value,
    bairro: document.getElementById("bairro").value,
    data: document.getElementById("data").value,
    contato: telefoneLimpo,
    descricao: document.getElementById("descricao").value,
    foto: fotoBase64,
  };

  itens.unshift(novoItem);
  salvarItens();
  renderizarItens();
  form.reset();

  alert("Anúncio cadastrado com sucesso.");
}

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const telefoneLimpo = document.getElementById("contato").value.replace(/\D/g, "");
  const arquivo = fotoInput.files[0];

  if (!telefoneLimpo) {
    alert("Informe um telefone para contato.");
    return;
  }

  if (arquivo && arquivo.size > 2000000) {
    alert("A imagem deve ter no máximo 2MB.");
    return;
  }

  if (arquivo) {
    const reader = new FileReader();

    reader.onload = function (evento) {
      salvarNovoItem(evento.target.result, telefoneLimpo);
    };

    reader.readAsDataURL(arquivo);
  } else {
    salvarNovoItem("", telefoneLimpo);
  }
});

filtroTipo.addEventListener("change", renderizarItens);
filtroCategoria.addEventListener("change", renderizarItens);
buscaTexto.addEventListener("input", renderizarItens);

renderizarItens();
