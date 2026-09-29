/* Mercado Já — vitrine, abas, busca, carrinho e checkout (Cria Site) */

(function () {
  "use strict";

  var PAGINA = 48;
  var setorAtivo = SETORES[0].id;
  var depAtivo = "";
  var catAtiva = "";
  var termo = "";
  var mostrando = PAGINA;
  var carrinho = [];

  var $ = function (id) { return document.getElementById(id); };
  var elAbas = $("abas");
  var elProdutos = $("produtos");
  var elMenu = $("menu");
  var elTrilha = $("trilha");
  var elCarregar = $("carregar");

  function semAcento(s) {
    return (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  /* ---------- índice de busca, feito uma vez ---------- */
  CATALOGO.forEach(function (p) { p._b = semAcento(p.n + " " + p.c + " " + p.dp); });

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
    depAtivo = "";
    catAtiva = "";
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
    montarMenu();
    montarTrilha();
    desenhar();
    var barra = document.querySelector(".abas-barra");
    if (window.scrollY > barra.offsetTop) barra.scrollIntoView({ block: "start" });
  }

  /* ---------- menu de departamentos e subcategorias ---------- */
  function montarMenu() {
    var doSetor = CATALOGO.filter(function (p) { return p.s === setorAtivo; });
    var mapa = {};
    doSetor.forEach(function (p) {
      if (!mapa[p.dp]) mapa[p.dp] = { total: 0, cats: {} };
      mapa[p.dp].total += 1;
      mapa[p.dp].cats[p.c] = (mapa[p.dp].cats[p.c] || 0) + 1;
    });

    var deps = Object.keys(mapa).sort(function (a, b) { return mapa[b].total - mapa[a].total; });
    elMenu.innerHTML = "";

    var tudo = document.createElement("button");
    tudo.type = "button";
    tudo.className = "menu-tudo" + (!depAtivo && !catAtiva ? " ativo" : "");
    tudo.innerHTML = "Ver tudo <span class='mono'>" + doSetor.length.toLocaleString("pt-BR") + "</span>";
    tudo.addEventListener("click", function () { depAtivo = ""; catAtiva = ""; mostrando = PAGINA; montarMenu(); desenhar(); });
    elMenu.appendChild(tudo);

    deps.forEach(function (d) {
      var bloco = document.createElement("div");
      bloco.className = "menu-dep" + (depAtivo === d ? " aberto" : "");

      var cab = document.createElement("button");
      cab.type = "button";
      cab.className = "menu-cab" + (depAtivo === d && !catAtiva ? " ativo" : "");
      cab.setAttribute("aria-expanded", depAtivo === d ? "true" : "false");
      cab.innerHTML = "<span>" + d + "</span><span class='mono'>" + mapa[d].total.toLocaleString("pt-BR") + "</span>";
      cab.addEventListener("click", function () {
        depAtivo = (depAtivo === d) ? "" : d;
        catAtiva = "";
        mostrando = PAGINA;
        montarMenu();
        desenhar();
      });
      bloco.appendChild(cab);

      var lista = document.createElement("div");
      lista.className = "menu-cats";
      Object.keys(mapa[d].cats)
        .sort(function (a, b) { return mapa[d].cats[b] - mapa[d].cats[a]; })
        .forEach(function (c) {
          var b = document.createElement("button");
          b.type = "button";
          b.className = "menu-cat" + (catAtiva === c ? " ativo" : "");
          b.innerHTML = "<span>" + c + "</span><span class='mono'>" + mapa[d].cats[c] + "</span>";
          b.addEventListener("click", function () {
            depAtivo = d;
            catAtiva = (catAtiva === c) ? "" : c;
            mostrando = PAGINA;
            montarMenu();
            desenhar();
            document.querySelector(".vitrine-grade").scrollIntoView({ block: "start" });
          });
          lista.appendChild(b);
        });
      bloco.appendChild(lista);
      elMenu.appendChild(bloco);
    });
  }

  function montarTrilha() {
    var s = SETORES.filter(function (x) { return x.id === setorAtivo; })[0];
    var caminho = [s.nome];
    if (depAtivo) caminho.push(depAtivo);
    if (catAtiva) caminho.push(catAtiva);
    elTrilha.innerHTML = caminho.map(function (t, i) {
      return (i ? '<i class="sep">/</i>' : "") + "<span>" + t + "</span>";
    }).join("");
  }

  /* ---------- lista atual ---------- */
  function lista() {
    var t = semAcento(termo).trim();
    return CATALOGO.filter(function (p) {
      if (t) return p._b.indexOf(t) !== -1;
      if (p.s !== setorAtivo) return false;
      if (catAtiva) return p.c === catAtiva;
      if (depAtivo) return p.dp === depAtivo;
      return true;
    });
  }


  /* ---------- desenho ilustrativo para quem nao tem foto ---------- */
  var ARTES = {
    lata:    '<rect x="26" y="14" width="28" height="52" rx="7"/><rect x="30" y="24" width="20" height="18" rx="3" opacity=".45"/>',
    garrafa: '<rect x="34" y="8" width="12" height="20" rx="4"/><path d="M30 28h20c4 0 7 4 7 9v30c0 5-3 9-7 9H30c-4 0-7-4-7-9V37c0-5 3-9 7-9z"/><rect x="28" y="44" width="24" height="16" rx="3" opacity=".4"/>',
    copo:    '<path d="M24 20h32l-4 48c0 4-3 6-12 6s-12-2-12-6L24 20z"/><rect x="28" y="26" width="24" height="10" rx="2" opacity=".4"/>',
    pao:     '<path d="M14 46c0-14 12-24 26-24s26 10 26 24c0 9-8 15-26 15s-26-6-26-15z"/><path d="M26 38c6-4 10-5 14-5s8 1 14 5" stroke="#fff" stroke-width="4" fill="none" opacity=".55"/>',
    salgado: '<path d="M40 14c10 0 18 10 18 24s-8 28-18 28-18-14-18-28 8-24 18-24z"/><path d="M34 34c4-3 8-3 12 0" stroke="#fff" stroke-width="4" fill="none" opacity=".5"/>',
    bolo:    '<path d="M18 40h44v26a4 4 0 01-4 4H22a4 4 0 01-4-4V40z"/><path d="M18 40c0-7 10-12 22-12s22 5 22 12" opacity=".55"/><rect x="38" y="12" width="4" height="12" rx="2"/>',
    fatia:   '<rect x="16" y="26" width="48" height="30" rx="6"/><rect x="22" y="34" width="36" height="5" rx="2.5" fill="#fff" opacity=".5"/><rect x="22" y="44" width="24" height="5" rx="2.5" fill="#fff" opacity=".35"/>',
    xicara:  '<path d="M20 28h34v22c0 8-6 14-17 14s-17-6-17-14V28z"/><path d="M54 34h6a7 7 0 010 14h-6" stroke-width="5" fill="none" stroke="currentColor"/>',
    folha:   '<path d="M40 14c16 0 26 12 26 26S54 68 40 68 14 56 14 40 24 14 40 14z" opacity=".25"/><path d="M40 16c14 8 18 22 12 34-10 4-20-4-22-14-2-9 3-16 10-20z"/>',
    ovo:     '<ellipse cx="40" cy="44" rx="20" ry="26"/><ellipse cx="33" cy="36" rx="6" ry="9" fill="#fff" opacity=".35"/>',
    caixa:   '<rect x="18" y="24" width="44" height="42" rx="6"/><path d="M18 36h44" opacity=".45"/><rect x="34" y="14" width="12" height="12" rx="3" opacity=".6"/>'
  };

  function desenho(p) {
    var d = ARTES[p.arte] || ARTES.caixa;
    return '<svg class="item-arte" viewBox="0 0 80 80" fill="currentColor" aria-hidden="true">' + d + "</svg>";
  }

  function cartao(p, i) {
    var div = document.createElement("article");
    div.className = "item";
    div.style.animationDelay = Math.min(i, 14) * 22 + "ms";
    var foto = p.foto
      ? '<img src="' + p.foto + '" alt="" loading="lazy" onerror="this.parentNode.innerHTML=\'<span class=&quot;item-vazio&quot;>' + (p.n[0] || "?") + '</span>\'">'
      : desenho(p);
    div.innerHTML =
      '<div class="item-foto">' + foto + "</div>" +
      '<div class="item-corpo">' +
        '<span class="item-cat">' + p.c + "</span>" +
        '<h3 class="item-nome">' + p.n + "</h3>" +
        '<div class="item-baixo">' +
          '<span class="item-preco mono">' + dinheiro(p.p) +
            (p.u === "kg" ? '<i class="por-kg">o kg</i>' : "") + "</span>" +
          '<button class="item-add" type="button" aria-label="Adicionar ' + p.n + ' ao carrinho">+</button>' +
        "</div>" +
      "</div>";
    div.querySelector(".item-add").addEventListener("click", function (ev) {
      if (p.u === "kg") { telaPeso(p); return; }
      adicionar(p);
      var b = ev.currentTarget;
      b.textContent = "✓";
      b.classList.add("feito");
      setTimeout(function () { b.textContent = "+"; b.classList.remove("feito"); }, 900);
    });
    return div;
  }

  function desenhar() {
    montarTrilha();
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


  /* ---------- quanto o cliente quer, quando o produto e por peso ---------- */
  var PESOS = [0.2, 0.3, 0.5, 0.75, 1, 1.5, 2, 3];

  function emPeso(q) {
    return q < 1 ? Math.round(q * 1000) + " g" : String(q).replace(".", ",") + " kg";
  }

  function telaPeso(p) {
    var botoes = PESOS.map(function (q) {
      return '<button class="peso-op" type="button" data-q="' + q + '">' +
        "<b>" + emPeso(q) + "</b><span class='mono'>" + dinheiro(p.p * q) + "</span></button>";
    }).join("");

    abrirJanela(
      "<h2>Quanto voce quer?</h2>" +
      '<p style="color:var(--apagado);font-size:15px">' + p.n +
        ' · <b class="mono">' + dinheiro(p.p) + " o kg</b></p>" +
      '<div class="peso-grade">' + botoes + "</div>" +
      '<div class="campo"><label for="pesoLivre">Ou digite em gramas</label>' +
        '<input id="pesoLivre" type="number" inputmode="numeric" min="50" step="50" placeholder="ex: 850"></div>' +
      '<div class="recibo mono" id="pesoRecibo">Escolha uma quantidade</div>' +
      '<div style="display:flex;gap:10px;margin-top:16px">' +
        '<button class="btn btn-linha" type="button" id="pesoVoltar">Voltar</button>' +
        '<button class="btn btn-viva" style="flex:1" type="button" id="pesoOk">Por no carrinho</button>' +
      "</div>"
    );

    var escolhido = 0;

    function marcar(q) {
      escolhido = q;
      Array.prototype.forEach.call(document.querySelectorAll(".peso-op"), function (b) {
        b.setAttribute("aria-pressed", Number(b.dataset.q) === q ? "true" : "false");
      });
      $("pesoRecibo").innerHTML = q
        ? "<div><span>" + emPeso(q) + "</span><span>" + dinheiro(p.p * q) + "</span></div>"
        : "Escolha uma quantidade";
    }

    Array.prototype.forEach.call(document.querySelectorAll(".peso-op"), function (b) {
      b.addEventListener("click", function () {
        $("pesoLivre").value = "";
        marcar(Number(b.dataset.q));
      });
    });

    $("pesoLivre").addEventListener("input", function (e) {
      var g = Number(e.target.value);
      marcar(g >= 50 ? Math.round(g) / 1000 : 0);
    });

    $("pesoVoltar").addEventListener("click", fecharJanela);
    $("pesoOk").addEventListener("click", function () {
      if (!escolhido) { alert("Escolha quantos gramas voce quer."); return; }
      adicionar(p, escolhido);
      fecharJanela();
    });

    marcar(0.5);
  }

  /* ---------- carrinho ---------- */
  function adicionar(p, quanto) {
    var passo = (p.u === "kg") ? (quanto || 1) : 1;
    var achou = carrinho.filter(function (x) { return x.id === p.id; })[0];
    if (achou) achou.q = Math.round((achou.q + passo) * 1000) / 1000;
    else carrinho.push({ id: p.id, n: p.n, p: p.p, s: p.s, u: p.u, arte: p.arte, foto: p.foto, q: passo });
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
        '<div class="linha-foto">' + (x.foto ? '<img src="' + x.foto + '" alt="">' : desenho(x)) + "</div>" +
        '<div class="linha-info"><div class="linha-nome">' + x.n + "</div>" +
        '<div class="linha-preco mono">' + (x.u === "kg"
            ? emPeso(x.q) + " · " + dinheiro(x.p * x.q)
            : dinheiro(x.p) + " cada") + "</div></div>" +
        '<div class="qtd"><button type="button" aria-label="Tirar">-</button>' +
        '<span class="mono">' + (x.u === "kg" ? emPeso(x.q) : x.q) + "</span>" +
        '<button type="button" aria-label="Por mais">+</button></div>';
      var bts = d.querySelectorAll(".qtd button");
      var passo = (x.u === "kg") ? 0.1 : 1;
      bts[0].addEventListener("click", function () {
        x.q = Math.round((x.q - passo) * 1000) / 1000;
        if (x.q <= 0) carrinho = carrinho.filter(function (y) { return y.id !== x.id; });
        atualizarCarrinho();
      });
      bts[1].addEventListener("click", function () {
        x.q = Math.round((x.q + passo) * 1000) / 1000;
        atualizarCarrinho();
      });
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
      itens: carrinho.map(function (x) { return { n: x.n, q: x.q, p: x.p, s: x.s, u: x.u }; }),
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
  $("menuAbrir").addEventListener("click", function () {
    var m = $("menu");
    var aberto = m.classList.toggle("aberto");
    $("menuAbrir").textContent = aberto ? "Fechar departamentos" : "Departamentos";
  });

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
  montarMenu();
  montarTrilha();
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
