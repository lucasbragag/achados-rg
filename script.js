const SUPABASE_URL = "https://ceolrqfiklmimmhdbtjl.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_zCGNenDL064O7ExkDA1HOA_2XoYffZf";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const form = document.getElementById("itemForm");
const itensContainer = document.getElementById("itensContainer");
const filtroTipo = document.getElementById("filtroTipo");
const filtroCategoria = document.getElementById("filtroCategoria");
const buscaTexto = document.getElementById("buscaTexto");
const fotoInput = document.getElementById("foto");

let itens = [];

function formatarData(data) {
  if (!data) return "";
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

function aplicarFiltros(lista) {
  const tipoSelecionado = filtroTipo.value;
  const categoriaSelecionada = filtroCategoria.value;
  const textoBusca = buscaTexto.value.toLowerCase().trim();

  return lista.filter((item) => {
    const bateTipo = tipoSelecionado === "Todos" || item.tipo === tipoSelecionado;
    const bateCategoria =
      categoriaSelecionada === "Todas" || item.categoria === categoriaSelecionada;

    const textoCompleto = `
      ${item.titulo}
      ${item.categoria}
      ${item.bairro}
      ${item.descricao}
      ${item.cidade || ""}
      ${item.estado || ""}
    `.toLowerCase();

    const bateTexto = textoCompleto.includes(textoBusca);

    return bateTipo && bateCategoria && bateTexto;
  });
}

function renderizarItens() {
  const itensFiltrados = aplicarFiltros(itens);

  if (itensFiltrados.length === 0) {
    itensContainer.innerHTML = `<p class="vazio">Nenhum anúncio encontrado.</p>`;
    return;
  }

  itensContainer.innerHTML = itensFiltrados
    .map((item) => {
      const classeBadge = item.tipo === "Perdido" ? "perdido" : "encontrado";

      return `
        <div class="item-card">
          ${item.foto_url ? `<img src="${item.foto_url}" alt="Foto do item" class="item-img">` : ""}

          <div class="item-topo">
            <span class="badge ${classeBadge}">${item.tipo}</span>
            <small>${formatarData(item.data_ocorrido)}</small>
          </div>

          <h4>${item.titulo}</h4>
          <p><strong>Categoria:</strong> ${item.categoria}</p>
          <p><strong>Bairro:</strong> ${item.bairro}</p>
          <p><strong>Cidade:</strong> ${item.cidade}</p>
          <p><strong>Descrição:</strong> ${item.descricao}</p>
          <p><strong>Contato:</strong> ${item.contato}</p>

          <a
            class="btn btn-whatsapp"
            target="_blank"
            href="https://wa.me/55${item.contato}?text=${encodeURIComponent(
              `Olá! Vi seu anúncio no Achados RG sobre: ${item.titulo}. Acho que pode ser meu.`
            )}"
          >
            Falar no WhatsApp
          </a>

          <button class="btn btn-secundario" onclick="removerItem('${item.id}')">
            Remover
          </button>
        </div>
      `;
    })
    .join("");
}

async function carregarItens() {
  const { data, error } = await supabaseClient
    .from("anuncios")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao carregar anúncios:", error);
    itensContainer.innerHTML = `<p class="vazio">Erro ao carregar anúncios.</p>`;
    return;
  }

  itens = data || [];
  renderizarItens();
}

async function uploadImagem(arquivo) {
  if (!arquivo) return null;

  const extensao = arquivo.name.split(".").pop();
  const nomeArquivo = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extensao}`;
  const caminho = `public/${nomeArquivo}`;

  const { error: uploadError } = await supabaseClient.storage
    .from("itens")
    .upload(caminho, arquivo, {
      cacheControl: "3600",
      upsert: false,
      contentType: arquivo.type,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabaseClient.storage.from("itens").getPublicUrl(caminho);
  return data.publicUrl;
}

async function removerItem(id) {
  const confirmou = confirm("Tem certeza que deseja remover este anúncio?");
  if (!confirmou) return;

  const item = itens.find((x) => x.id === id);

  if (!item) return;

  const { error } = await supabaseClient
    .from("anuncios")
    .delete()
    .eq("id", id);

  if (error) {
    alert("Erro ao remover anúncio.");
    console.error(error);
    return;
  }

  if (item.foto_url) {
    try {
      const url = new URL(item.foto_url);
      const partes = url.pathname.split("/object/public/itens/");
      if (partes[1]) {
        await supabaseClient.storage.from("itens").remove([partes[1]]);
      }
    } catch (e) {
      console.warn("Não foi possível remover a imagem do storage.", e);
    }
  }

  await carregarItens();
}

async function salvarNovoItem(fotoUrl = "", telefoneLimpo = "") {
  const novoItem = {
    tipo: document.getElementById("tipo").value,
    categoria: document.getElementById("categoria").value,
    titulo: document.getElementById("titulo").value,
    bairro: document.getElementById("bairro").value,
    cidade: "Rio Grande",
    estado: "RS",
    data_ocorrido: document.getElementById("data").value,
    contato: telefoneLimpo,
    descricao: document.getElementById("descricao").value,
    foto_url: fotoUrl,
  };

  const { error } = await supabaseClient.from("anuncios").insert([novoItem]);

  if (error) {
    alert("Erro ao cadastrar anúncio.");
    console.error(error);
    return;
  }

  form.reset();
  alert("Anúncio cadastrado com sucesso.");
  await carregarItens();
}

form.addEventListener("submit", async (e) => {
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

  try {
    let fotoUrl = "";

    if (arquivo) {
      fotoUrl = await uploadImagem(arquivo);
    }

    await salvarNovoItem(fotoUrl, telefoneLimpo);
  } catch (error) {
    alert("Erro ao enviar imagem.");
    console.error(error);
  }
});

filtroTipo.addEventListener("change", renderizarItens);
filtroCategoria.addEventListener("change", renderizarItens);
buscaTexto.addEventListener("input", renderizarItens);

carregarItens();