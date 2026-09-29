/* Mercadinho da Vila — vitrine, abas, busca, carrinho e checkout (Cria Site) */

(function () {
  "use strict";

  var PAGINA = 48;
  var setorAtivo = SETORES[0].id;
  var filtroAtivo = "";
  var termo = "";
  var mostrando = PAGINA;
  var carrinho = [];

  var $ = function (id) { return document.getElementById(id); };
  var elAbas = $("abas");
  var elProdutos = $("produtos");
  var elFiltros = $("filtros");
  var elCarregar = $("carregar");

  function semAcento(s) {
    return (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  /* ---------- índice de busca, feito uma vez ---------- */
  CATALOGO.forEach(function (p) { p._b = semAcento(p.n + " " + p.d); });

  function corDoSetor(id) {
    var s = SETORES.filter(function (x) { return x.id === id; })[0];
    return s ? s.cor : "#00b84a";
  }

  function pintar(id) {
    var cor = corDoSetor(id);
    document.documentElement.style.setProperty("--viva", cor);
    document.documentElement.style.setProperty("--viva-fraca",
      "color-mix(in srgb, " + cor + " 12%, transparent)");
  }

  /* ---------- abas ---------- */
  function montarAbas() {
    elAbas.innerHTML = "";
    SETORES.forEach(function (s) {
      var n = CATALOGO.filter(function (p) { return p.s === s.id; }).length;
      var b = document.createElement("button");
      b.className = "aba";
      b.type = "button";
      b.setAttribute("role", "tab");
      b.setAttribute("aria-selected", s.id === setorAtivo ? "true" : "false");
      b.style.setProperty("--c", s.cor);
      b.innerHTML = '<i class="luz"></i><b>' + s.nome + "</b>" +
        '<small class="mono">' + (n ? n : "em breve") + "</small>";
      b.addEventListener("click", function () { trocarSetor(s.id); });
      elAbas.appendChild(b);
    });
  }

  function trocarSetor(id) {
    setorAtivo = id;
    filtroAtivo = "";
    termo = "";
    $("busca").value = "";
    mostrando = PAGINA;
    pintar(id);
    Array.prototype.forEach.call(elAbas.children, function (b, i) {
      b.setAttribute("aria-selected", SETORES[i].id === id ? "true" : "false");
    });
    var s = SETORES.filter(function (x) { return x.id === id; })[0];
    $("vitrineTitulo").textContent = s.nome;
    $("vitrineChamada").textContent = s.chamada;
    montarFiltros();
    desenhar();
    var barra = document.querySelector(".abas-barra");
    if (window.scrollY > barra.offsetTop) barra.scrollIntoView({ block: "start" });
  }

  /* ---------- filtros do setor ---------- */
  function montarFiltros() {
    var doSetor = CATALOGO.filter(function (p) { return p.s === setorAtivo; });
    var contas = {};
    doSetor.forEach(function (p) { contas[p.d] = (contas[p.d] || 0) + 1; });
    var nomes = Object.keys(contas).sort(function (a, b) { return contas[b] - contas[a]; }).slice(0, 18);

    elFiltros.innerHTML = "";
    if (!nomes.length) return;

    var todos = document.createElement("button");
    todos.className = "filtro";
    todos.type = "button";
    todos.textContent = "Tudo";
    todos.setAttribute("aria-pressed", "true");
    todos.addEventListener("click", function () { filtroAtivo = ""; mostrando = PAGINA; montarFiltros(); desenhar(); });
    elFiltros.appendChild(todos);

    nomes.forEach(function (n) {
      var b = document.createElement("button");
      b.className = "filtro";
      b.type = "button";
      b.textContent = n;
      b.setAttribute("aria-pressed", filtroAtivo === n ? "true" : "false");
      if (filtroAtivo === n) todos.setAttribute("aria-pressed", "false");
      b.addEventListener("click", function () {
        filtroAtivo = (filtroAtivo === n) ? "" : n;
        mostrando = PAGINA;
        montarFiltros();
        desenhar();
      });
      elFiltros.appendChild(b);
    });
  }

  /* ---------- lista atual ---------- */
  function lista() {
    var t = semAcento(termo).trim();
    return CATALOGO.filter(function (p) {
      if (t) return p._b.indexOf(t) !== -1;
      if (p.s !== setorAtivo) return false;
      if (filtroAtivo && p.d !== filtroAtivo) return false;
      return true;
    });
  }

  function cartao(p, i) {
    var div = document.createElement("article");
    div.className = "item";
    div.style.animationDelay = Math.min(i, 14) * 22 + "ms";
    var foto = p.foto
      ? '<img src="' + p.foto + '" alt="" loading="lazy" onerror="this.parentNode.innerHTML=\'<span class=&quot;item-vazio&quot;>' + (p.n[0] || "?") + '</span>\'">'
      : '<span class="item-vazio">' + (p.n[0] || "?") + "</span>";
    div.innerHTML =
      '<div class="item-foto">' + foto + "</div>" +
      '<div class="item-corpo">' +
        '<span class="item-cat">' + p.d + "</span>" +
        '<h3 class="item-nome">' + p.n + "</h3>" +
        '<div class="item-baixo">' +
          '<span class="item-preco mono">' + dinheiro(p.p) + "</span>" +
          '<button class="item-add" type="button" aria-label="Adicionar ' + p.n + ' ao carrinho">+</button>' +
        "</div>" +
      "</div>";
    div.querySelector(".item-add").addEventListener("click", function (ev) {
      adicionar(p);
      var b = ev.currentTarget;
      b.textContent = "✓";
      b.classList.add("feito");
      setTimeout(function () { b.textContent = "+"; b.classList.remove("feito"); }, 900);
    });
    return div;
  }

  function desenhar() {
    var itens = lista();
    $("vitrineConta").textContent = itens.length
      ? itens.length.toLocaleString("pt-BR") + " produtos"
      : "";

    elProdutos.innerHTML = "";
    elCarregar.innerHTML = "";

    if (!itens.length) {
      elProdutos.innerHTML =
        '<div class="vazio" style="grid-column:1/-1"><b>Nada por aqui ainda</b>' +
        (termo ? "Tente outra palavra." : "Este setor ainda esta sendo montado.") + "</div>";
      return;
    }

    itens.slice(0, mostrando).forEach(function (p, i) { elProdutos.appendChild(cartao(p, i)); });

    if (itens.length > mostrando) {
      var b = document.createElement("button");
      b.className = "btn btn-linha";
      b.type = "button";
      b.textContent = "Ver mais produtos";
      b.addEventListener("click", function () { mostrando += PAGINA; desenhar(); });
      elCarregar.appendChild(b);
    }
  }

  /* ---------- carrinho ---------- */
  function adicionar(p) {
    var achou = carrinho.filter(function (x) { return x.id === p.id; })[0];
    if (achou) achou.q += 1;
    else carrinho.push({ id: p.id, n: p.n, p: p.p, s: p.s, foto: p.foto, q: 1 });
    atualizarCarrinho();
    abrirCarrinho(true);
  }

  function totalCarrinho() {
    return carrinho.reduce(function (s, x) { return s + x.p * x.q; }, 0);
  }

  function atualizarCarrinho() {
    var qtd = carrinho.reduce(function (s, x) { return s + x.q; }, 0);
    $("contaCarrinho").textContent = qtd;
    $("carrinhoTotal").textContent = dinheiro(totalCarrinho());

    var setores = {};
    carrinho.forEach(function (x) { setores[x.s] = true; });
    var nomes = Object.keys(setores).map(function (id) {
      return SETORES.filter(function (s) { return s.id === id; })[0].nome;
    });
    $("avisoSetores").textContent = nomes.length > 1
      ? "Voce esta levando " + nomes.join(", ") + " na mesma entrega."
      : "";

    var lista = $("carrinhoLista");
    lista.innerHTML = "";
    if (!carrinho.length) {
      lista.innerHTML = '<div class="vazio"><b>Carrinho vazio</b>Escolha produtos nos quatro setores.</div>';
      return;
    }

    carrinho.forEach(function (x) {
      var d = document.createElement("div");
      d.className = "linha";
      d.innerHTML =
        '<div class="linha-foto">' + (x.foto ? '<img src="' + x.foto + '" alt="">' : "") + "</div>" +
        '<div class="linha-info"><div class="linha-nome">' + x.n + "</div>" +
        '<div class="linha-preco mono">' + dinheiro(x.p) + " cada</div></div>" +
        '<div class="qtd"><button type="button" aria-label="Tirar um">-</button>' +
        '<span class="mono">' + x.q + "</span>" +
        '<button type="button" aria-label="Por mais um">+</button></div>';
      var bts = d.querySelectorAll(".qtd button");
      bts[0].addEventListener("click", function () {
        x.q -= 1;
        if (x.q <= 0) carrinho = carrinho.filter(function (y) { return y.id !== x.id; });
        atualizarCarrinho();
      });
      bts[1].addEventListener("click", function () { x.q += 1; atualizarCarrinho(); });
      lista.appendChild(d);
    });
  }

  function abrirCarrinho(abrir) {
    $("carrinho").classList.toggle("aberto", abrir);
    $("sombra").classList.toggle("aberta", abrir);
  }

  /* ---------- checkout ---------- */
  function abrirJanela(html) {
    $("janelaCaixa").innerHTML = html;
    $("janela").classList.add("aberta");
  }
  function fecharJanela() { $("janela").classList.remove("aberta"); }

  function telaCheckout() {
    var opcoes = LOJA.taxas.map(function (t, i) {
      return '<option value="' + i + '">' + t.bairro +
        (t.valor ? " — " + dinheiro(t.valor) : " — sem taxa") + "</option>";
    }).join("");
    var pags = LOJA.pagamentos.map(function (p) { return '<option>' + p + "</option>"; }).join("");

    abrirJanela(
      "<h2>Fechar pedido</h2>" +
      '<p style="color:var(--apagado);font-size:15px">O pedido entra direto no sistema da loja. Voce recebe um numero para acompanhar.</p>' +
      '<div class="campo"><label for="cNome">Seu nome</label><input id="cNome" autocomplete="name"></div>' +
      '<div class="campo"><label for="cFone">Telefone</label><input id="cFone" inputmode="tel" autocomplete="tel"></div>' +
      '<div class="campo"><label for="cBairro">Entrega</label><select id="cBairro">' + opcoes + "</select></div>" +
      '<div class="campo"><label for="cEndereco">Endereco e numero</label><input id="cEndereco" autocomplete="street-address"></div>' +
      '<div class="campo"><label for="cPag">Pagamento</label><select id="cPag">' + pags + "</select></div>" +
      '<div class="campo"><label for="cObs">Observacao (opcional)</label><textarea id="cObs" rows="2"></textarea></div>' +
      '<div class="recibo mono" id="recibo"></div>' +
      '<div style="display:flex;gap:10px;margin-top:16px">' +
        '<button class="btn btn-linha" type="button" id="btVoltar">Voltar</button>' +
        '<button class="btn btn-viva" style="flex:1" type="button" id="btEnviar">Enviar para a loja</button>' +
      "</div>"
    );

    function recalcular() {
      var t = LOJA.taxas[Number($("cBairro").value)];
      var prod = totalCarrinho();
      $("recibo").innerHTML =
        "<div><span>Produtos</span><span>" + dinheiro(prod) + "</span></div>" +
        "<div><span>Entrega</span><span>" + (t.valor ? dinheiro(t.valor) : "sem taxa") + "</span></div>" +
        "<div><span>Previsao</span><span>" + t.minutos + " min</span></div>" +
        '<div class="grande"><span>Total</span><span>' + dinheiro(prod + t.valor) + "</span></div>";
    }
    $("cBairro").addEventListener("change", recalcular);
    recalcular();

    $("btVoltar").addEventListener("click", fecharJanela);
    $("btEnviar").addEventListener("click", enviar);
  }

  function enviar() {
    var nome = $("cNome").value.trim();
    var fone = $("cFone").value.trim();
    var endereco = $("cEndereco").value.trim();
    var t = LOJA.taxas[Number($("cBairro").value)];

    if (!nome || !fone) { alert("Preencha nome e telefone."); return; }
    if (t.valor > 0 && !endereco) { alert("Preencha o endereco da entrega."); return; }

    var prod = totalCarrinho();
    var pedido = {
      numero: Pedidos.proximoNumero(),
      quando: Date.now(),
      cliente: { nome: nome, fone: fone, endereco: endereco || "Retirar na loja" },
      entrega: { bairro: t.bairro, taxa: t.valor, minutos: t.minutos },
      pagamento: $("cPag").value,
      observacao: $("cObs").value.trim(),
      itens: carrinho.map(function (x) { return { n: x.n, q: x.q, p: x.p, s: x.s }; }),
      subtotal: prod,
      total: prod + t.valor,
      status: "Recebido",
      historico: [{ status: "Recebido", quando: Date.now() }]
    };

    Pedidos.enviar(pedido).then(function () {
      carrinho = [];
      atualizarCarrinho();
      abrirCarrinho(false);
      abrirJanela(
        '<div class="sucesso">' +
          '<div class="marca-ok"><svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></div>' +
          "<h2>Pedido na cozinha da loja</h2>" +
          "<p>O balcao ja recebeu. Anote o seu numero:</p>" +
          '<div class="codigo mono">#' + pedido.numero + "</div>" +
          "<p>Previsao de " + pedido.entrega.minutos + " minutos. Total " + dinheiro(pedido.total) + ".</p>" +
          '<button class="btn btn-viva btn-bloco" style="margin-top:18px" type="button" id="btOk">Continuar comprando</button>' +
          '<p style="margin-top:12px;font-size:14px"><a href="painel.html" style="text-decoration:underline">Ver no painel da loja</a></p>' +
        "</div>"
      );
      $("btOk").addEventListener("click", fecharJanela);
      contarPedidos();
    });
  }

  function contarPedidos() {
    var hoje = new Date().setHours(0, 0, 0, 0);
    $("stPedidos").textContent = Pedidos.todos().filter(function (p) { return p.quando >= hoje; }).length;
  }

  /* ---------- ligações ---------- */
  $("abrirCarrinho").addEventListener("click", function () { abrirCarrinho(true); });
  $("fecharCarrinho").addEventListener("click", function () { abrirCarrinho(false); });
  $("sombra").addEventListener("click", function () { abrirCarrinho(false); });
  $("janela").addEventListener("click", function (e) { if (e.target === $("janela")) fecharJanela(); });
  $("irCheckout").addEventListener("click", function () {
    if (!carrinho.length) { alert("Seu carrinho esta vazio."); return; }
    if (totalCarrinho() < LOJA.minimo) { alert("Pedido minimo de " + dinheiro(LOJA.minimo) + "."); return; }
    abrirCarrinho(false);
    telaCheckout();
  });

  var espera;
  $("busca").addEventListener("input", function (e) {
    clearTimeout(espera);
    var v = e.target.value;
    espera = setTimeout(function () { termo = v; mostrando = PAGINA; desenhar(); }, 180);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { abrirCarrinho(false); fecharJanela(); }
  });

  /* ---------- início ---------- */
  $("plProdutos").textContent = CATALOGO.length.toLocaleString("pt-BR");
  $("stMedia").textContent = LOJA.entregaMedia;
  contarPedidos();
  pintar(setorAtivo);
  montarAbas();
  montarFiltros();
  desenhar();
  atualizarCarrinho();
})();

/* ---------- abertura: parede de produtos e frase que troca ---------- */
(function () {
  "use strict";

  var comFoto = CATALOGO.filter(function (p) { return p.foto; });
  if (!comFoto.length) return;

  function sorteio(qtd) {
    var fora = [];
    for (var i = 0; i < qtd; i++) {
      fora.push(comFoto[Math.floor(Math.random() * comFoto.length)]);
    }
    return fora;
  }

  function encher(id, qtd) {
    var alvo = document.getElementById(id);
    if (!alvo) return;
    var itens = sorteio(qtd);
    var html = itens.map(function (p) {
      return '<div class="pd"><img src="' + p.foto + '" alt="" loading="lazy"></div>';
    }).join("");
    alvo.innerHTML = html + html;   /* duas voltas, para o laço não dar salto */
  }

  encher("fila1", 14);
  encher("fila2", 14);
  encher("fila3", 14);

  /* a frase troca sozinha */
  var troca = document.getElementById("troca");
  if (troca) {
    var frases = ["38 minutos.", "um carrinho.", "uma entrega.", "um clique."];
    var k = 0;
    setInterval(function () {
      k = (k + 1) % frases.length;
      troca.style.transition = "opacity .25s ease, transform .25s ease";
      troca.style.opacity = "0";
      troca.style.transform = "translateY(-8px)";
      setTimeout(function () {
        troca.textContent = frases[k];
        troca.style.transform = "translateY(8px)";
        setTimeout(function () {
          troca.style.opacity = "1";
          troca.style.transform = "translateY(0)";
        }, 30);
      }, 260);
    }, 3200);
  }
})();
