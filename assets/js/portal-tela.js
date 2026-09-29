/* Mercado Já — telas do portal da loja (Cria Site)
   Desenha as abas do portal em cima da camada PortalDados. */
(function () {
  "use strict";

  var D = window.PortalDados;
  var Config = D.Config, Estoque = D.Estoque, Codigos = D.Codigos;
  var Despesas = D.Despesas, Caixa = D.Caixa;
  var porId = D.porId, hora = D.hora, dataCurta = D.dataCurta, mesmoDia = D.mesmoDia;
  var quantidade = D.quantidade, nomeSetor = D.nomeSetor, esc = D.escapar, id = D.id;

  var abaAtual = "pedidos";
  var separandoNumero = null;
  var comanda = [];
  var novos = {};
  var relogio = null;

  var ABAS = [
    { id: "pedidos",   nome: "Pedidos" },
    { id: "separacao", nome: "Separacao" },
    { id: "estoque",   nome: "Estoque" },
    { id: "balcao",    nome: "Balcao" },
    { id: "caixa",     nome: "Caixa" },
    { id: "entrega",   nome: "Entrega" },
    { id: "historico", nome: "Historico" }
  ];

  /* ---------------- entrada ---------------- */
  function entrar() {
    var digitada = id("senha").value.trim();
    if (digitada !== Config.tudo().senha) {
      id("erroLogin").textContent = "Senha errada. Tente de novo.";
      id("senha").value = "";
      id("senha").focus();
      return;
    }
    sessionStorage.setItem("mj_portal", "1");
    abrirPortal();
  }

  function abrirPortal() {
    id("telaLogin").hidden = true;
    id("portal").hidden = false;
    montarAbas();
    desenhar();
    ligarRelogio();
  }

  function sair() {
    sessionStorage.removeItem("mj_portal");
    id("portal").hidden = true;
    id("telaLogin").hidden = false;
    id("senha").value = "";
    id("erroLogin").textContent = "";
  }

  /* ---------------- moldura ---------------- */
  function montarAbas() {
    var caixa = id("abas");
    caixa.innerHTML = "";
    ABAS.forEach(function (a) {
      var b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-pressed", a.id === abaAtual ? "true" : "false");
      b.innerHTML = a.nome + '<span class="marcador" data-marcador="' + a.id + '" hidden></span>';
      b.addEventListener("click", function () {
        abaAtual = a.id;
        montarAbas();
        desenhar();
      });
      caixa.appendChild(b);
    });
  }

  function marcadores() {
    var todos = Pedidos.todos();
    var conta = {
      pedidos: todos.filter(function (p) { return p.status === "Recebido"; }).length,
      separacao: todos.filter(function (p) { return p.status === "Recebido" || p.status === "Separando"; }).length,
      entrega: todos.filter(function (p) { return p.status === "Saiu para entrega"; }).length,
      estoque: Estoque.emFalta().length
    };
    ABAS.forEach(function (a) {
      var m = document.querySelector('[data-marcador="' + a.id + '"]');
      if (!m) return;
      var n = conta[a.id] || 0;
      m.hidden = !n;
      m.textContent = n;
    });

    var falta = Estoque.emFalta();
    var alerta = id("alerta");
    if (falta.length) {
      alerta.hidden = false;
      alerta.textContent = falta.length === 1
        ? "1 produto no fim do estoque. Toque para ver."
        : falta.length + " produtos no fim do estoque. Toque para ver.";
    } else {
      alerta.hidden = true;
    }
  }

  function estadoLoja() {
    var c = Config.tudo();
    var b = id("btLoja");
    b.setAttribute("aria-pressed", c.lojaAberta ? "true" : "false");
    b.textContent = c.lojaAberta ? "Loja aberta" : "Loja fechada";
  }

  function ligarRelogio() {
    if (relogio) clearInterval(relogio);
    relogio = setInterval(function () {
      if (Config.tudo().auto) desenhar();
    }, 10000);
  }

  /* ---------------- desenho geral ---------------- */
  function desenhar() {
    var area = id("area");
    area.innerHTML = "";
    if (abaAtual === "pedidos") telaPedidos(area);
    if (abaAtual === "separacao") telaSeparacao(area);
    if (abaAtual === "estoque") telaEstoque(area);
    if (abaAtual === "balcao") telaBalcao(area);
    if (abaAtual === "caixa") telaCaixa(area);
    if (abaAtual === "entrega") telaEntrega(area);
    if (abaAtual === "historico") telaHistorico(area);
    marcadores();
    estadoLoja();
    resumoTopo();
  }

  function resumoTopo() {
    var hoje = new Date().setHours(0, 0, 0, 0);
    var doDia = Pedidos.todos().filter(function (p) { return p.quando >= hoje; });
    id("pHoje").textContent = doDia.length;
    id("pTotal").textContent = dinheiro(doDia.reduce(function (s, p) { return s + p.total; }, 0));
  }

  function titulo(area, texto, ajuda) {
    area.appendChild(D.elemento("h1", "p-titulo", esc(texto)));
    if (ajuda) area.appendChild(D.elemento("p", "p-ajuda", esc(ajuda)));
  }

  function vazio(area, forte, fraco) {
    area.appendChild(D.elemento("div", "p-vazio", "<b>" + esc(forte) + "</b>" + esc(fraco)));
  }

  /* ---------------- aba: pedidos ---------------- */
  function telaPedidos(area) {
    titulo(area, "Pedidos em tempo real", "Todo pedido do site cai aqui na hora. Clique para avancar o status.");

    var hoje = new Date().setHours(0, 0, 0, 0);
    var todos = Pedidos.todos();
    var doDia = todos.filter(function (p) { return p.quando >= hoje; });
    var resumo = D.elemento("div", "resumo");
    resumo.innerHTML =
      bloco(doDia.length, "Pedidos hoje", true) +
      bloco(dinheiro(doDia.reduce(function (s, p) { return s + p.total; }, 0)), "Vendido hoje") +
      bloco(doDia.filter(function (p) { return p.origem === "balcao"; }).length, "Vendas no balcao") +
      bloco(todos.filter(function (p) { return p.status === "Saiu para entrega"; }).length, "Na rua agora");
    area.appendChild(resumo);

    var colunas = D.elemento("div", "colunas");
    STATUS.forEach(function (st) {
      var lista = todos.filter(function (p) { return p.status === st; });
      var c = D.elemento("section", "coluna", "<h2>" + st + "<i>" + lista.length + "</i></h2>");
      if (!lista.length) c.appendChild(D.elemento("p", "p-vazio", "Nenhum pedido"));
      lista.forEach(function (p) { c.appendChild(ficha(p)); });
      colunas.appendChild(c);
    });
    area.appendChild(colunas);
  }

  function bloco(valor, rotulo, destaque) {
    return '<div class="resumo-item' + (destaque ? " destaque" : "") + '"><b>' +
      esc(valor) + "</b><span>" + esc(rotulo) + "</span></div>";
  }

  function ficha(p) {
    var d = D.elemento("article", "ficha" + (novos[p.numero] ? " nova" : ""));
    var itens = p.itens.map(function (i) {
      return "<div><span>" + esc(quantidade(i) + " " + i.n) + "</span><span>" + dinheiro(i.p * i.q) + "</span></div>";
    }).join("");

    var setores = {};
    p.itens.forEach(function (i) { setores[i.s] = true; });
    var tags = Object.keys(setores).map(function (s) {
      return '<span class="tag">' + esc(nomeSetor(s)) + "</span>";
    }).join("");
    if (p.itens.some(function (i) { return i.u === "kg"; })) tags += '<span class="tag peso">tem peso</span>';
    if (p.faltou && p.faltou.length) tags += '<span class="tag falta">' + p.faltou.length + " faltou</span>";
    if (p.origem === "balcao") tags += '<span class="tag">balcao</span>';

    var proximo = STATUS[STATUS.indexOf(p.status) + 1];

    d.innerHTML =
      '<div class="ficha-topo"><span class="ficha-num mono">#' + p.numero + '</span>' +
      '<span class="ficha-hora mono">' + hora(p.quando) + "</span></div>" +
      '<div class="ficha-cliente">' + esc(p.cliente.nome) + " · " + esc(p.cliente.fone) + "</div>" +
      '<div class="ficha-end">' + esc(p.cliente.endereco) + " · " + esc(p.entrega.bairro) + "</div>" +
      '<div class="tags">' + tags + "</div>" +
      '<div class="ficha-itens">' + itens +
        "<div><span>Entrega</span><span>" + (p.entrega.taxa ? dinheiro(p.entrega.taxa) : "sem taxa") + "</span></div></div>" +
      '<div class="ficha-total"><span>' + esc(p.pagamento) + '</span><span class="mono">' + dinheiro(p.total) + "</span></div>" +
      '<div class="ficha-botoes">' +
        (proximo ? '<button type="button" data-acao="avancar">Marcar como ' + proximo + "</button>" : "") +
        (p.status === "Recebido" || p.status === "Separando"
          ? '<button type="button" class="secundario" data-acao="separar">Separar</button>' : "") +
      "</div>";

    var avancar = d.querySelector('[data-acao="avancar"]');
    if (avancar) avancar.addEventListener("click", function () {
      Pedidos.mudarStatus(p.numero, proximo);
      delete novos[p.numero];
      desenhar();
    });
    var separar = d.querySelector('[data-acao="separar"]');
    if (separar) separar.addEventListener("click", function () {
      separandoNumero = p.numero;
      abaAtual = "separacao";
      montarAbas();
      desenhar();
    });
    return d;
  }

  /* ---------------- aba: separacao ---------------- */
  function telaSeparacao(area) {
    titulo(area, "Separacao dos pedidos", "Bipe o codigo de barras ou toque em Separei. O estoque baixa sozinho.");

    var fila = Pedidos.todos().filter(function (p) {
      return p.status === "Recebido" || p.status === "Separando";
    });
    if (!fila.length) { vazio(area, "Nada para separar", "Quando entrar pedido novo ele aparece aqui."); return; }

    if (!separandoNumero || !fila.some(function (p) { return p.numero === separandoNumero; })) {
      separandoNumero = fila[0].numero;
    }
    var pedido = fila.filter(function (p) { return p.numero === separandoNumero; })[0];

    var grade = D.elemento("div", "sep-grade");
    var lista = D.elemento("aside", "sep-fila", "<h2>Fila de hoje</h2>");
    fila.forEach(function (p) {
      var b = D.elemento("button", "sep-item" + (p.numero === separandoNumero ? " ativo" : ""),
        "<b>#" + p.numero + " · " + esc(p.cliente.nome) + "</b>" +
        "<span>" + p.itens.length + " itens · " + esc(p.entrega.bairro) + " · " + hora(p.quando) + "</span>");
      b.type = "button";
      b.addEventListener("click", function () { separandoNumero = p.numero; desenhar(); });
      lista.appendChild(b);
    });
    grade.appendChild(lista);

    var trabalho = D.elemento("section", "sep-trabalho");
    var prontos = (pedido.separados || []).length;
    var faltaram = (pedido.faltou || []).length;
    var feitos = prontos + faltaram;
    var porcento = Math.round((feitos / pedido.itens.length) * 100);

    trabalho.innerHTML =
      '<div class="sep-cab"><div><h2>Pedido #' + pedido.numero + "</h2>" +
      "<p>" + esc(pedido.cliente.nome) + " · " + esc(pedido.entrega.bairro) + " · " + hora(pedido.quando) + "</p></div>" +
      '<div><button class="p-botao" type="button" id="btPronto">Separacao pronta</button></div></div>' +
      '<div class="sep-progresso"><i style="width:' + porcento + '%"></i></div>' +
      '<div class="bipar"><input id="bipe" type="text" inputmode="numeric" autocomplete="off" ' +
        'placeholder="Bipe o codigo de barras ou digite o nome"><button class="p-botao" type="button" id="btCamera">Camera</button></div>' +
      '<div id="itens"></div>';
    grade.appendChild(trabalho);
    area.appendChild(grade);

    desenharItens(pedido);

    id("btPronto").addEventListener("click", function () {
      var proximo = STATUS[STATUS.indexOf(pedido.status) + 1] || "Saiu para entrega";
      Pedidos.mudarStatus(pedido.numero, pedido.status === "Recebido" ? "Separando" : proximo);
      separandoNumero = null;
      desenhar();
    });

    var campo = id("bipe");
    campo.focus();
    campo.addEventListener("keydown", function (e) {
      if (e.key !== "Enter") return;
      e.preventDefault();
      receberBipe(campo.value.trim(), pedido);
      campo.value = "";
    });
    id("btCamera").addEventListener("click", function () {
      lerPelaCamera(function (codigo) { receberBipe(codigo, pedido); });
    });
  }

  function desenharItens(pedido) {
    var caixa = id("itens");
    caixa.innerHTML = "";
    var grupos = {};
    pedido.itens.forEach(function (i, indice) {
      var chave = (i.dp || nomeSetor(i.s));
      (grupos[chave] = grupos[chave] || []).push({ item: i, indice: indice });
    });

    Object.keys(grupos).sort().forEach(function (g) {
      var bloco = D.elemento("div", "sep-grupo", "<h3>" + esc(g) + "</h3>");
      grupos[g].forEach(function (linha) {
        bloco.appendChild(linhaItem(pedido, linha.item, linha.indice));
      });
      caixa.appendChild(bloco);
    });
  }

  function linhaItem(pedido, item, indice) {
    var separados = pedido.separados || [];
    var faltou = pedido.faltou || [];
    var pronto = separados.indexOf(indice) >= 0;
    var naoTem = faltou.indexOf(indice) >= 0;

    var l = D.elemento("div", "linha-item" + (pronto ? " pronto" : "") + (naoTem ? " faltou" : ""));
    l.innerHTML =
      '<span class="li-qtd mono">' + esc(quantidade(item)) + "</span>" +
      '<div class="li-info"><div class="li-nome">' + esc(item.n) + "</div>" +
      '<div class="li-cat">' + esc(item.c || nomeSetor(item.s)) + " · " + dinheiro(item.p * item.q) + "</div></div>" +
      (item.u === "kg" ? '<input class="li-peso" type="number" step="0.01" value="' + item.q + '" aria-label="Peso real em kg">' : "") +
      '<div class="li-acoes">' +
        '<button type="button" class="ok" data-acao="ok">Separei</button>' +
        '<button type="button" class="nao" data-acao="nao">Faltou</button>' +
      "</div>";

    var peso = l.querySelector(".li-peso");
    if (peso) peso.addEventListener("change", function () {
      var valor = Number(peso.value);
      if (!valor || valor <= 0) { peso.value = item.q; return; }
      trocarPeso(pedido.numero, indice, valor);
    });

    l.querySelector('[data-acao="ok"]').addEventListener("click", function () {
      marcarItem(pedido.numero, indice, "ok");
    });
    l.querySelector('[data-acao="nao"]').addEventListener("click", function () {
      marcarItem(pedido.numero, indice, "nao");
    });
    return l;
  }

  function salvarPedido(numero, mudar) {
    var lista = Pedidos.todos();
    var p = lista.filter(function (x) { return x.numero === numero; })[0];
    if (!p) return null;
    mudar(p);
    Pedidos.gravar(lista);
    if (Pedidos.canal) Pedidos.canal.postMessage({ tipo: "atualizou", numero: numero });
    return p;
  }

  function marcarItem(numero, indice, tipo) {
    var pedido = salvarPedido(numero, function (p) {
      p.separados = (p.separados || []).filter(function (x) { return x !== indice; });
      p.faltou = (p.faltou || []).filter(function (x) { return x !== indice; });
      if (tipo === "ok") {
        p.separados.push(indice);
        var item = p.itens[indice];
        if (item.id) Estoque.baixar(item.id, item.q);
      } else {
        p.faltou.push(indice);
        var fora = p.itens[indice];
        if (fora.id) Estoque.trocar(fora.id, "esgotado", true);
      }
      recalcular(p);
    });
    if (pedido) desenhar();
  }

  function trocarPeso(numero, indice, novoPeso) {
    salvarPedido(numero, function (p) {
      p.itens[indice].q = novoPeso;
      recalcular(p);
    });
    desenhar();
  }

  function recalcular(p) {
    var valem = p.itens.filter(function (i, n) { return (p.faltou || []).indexOf(n) < 0; });
    p.subtotal = valem.reduce(function (s, i) { return s + i.p * i.q; }, 0);
    p.total = p.subtotal + (p.entrega.taxa || 0);
  }

  function receberBipe(texto, pedido) {
    if (!texto) return;
    var produto = Codigos.produto(texto);
    var alvo = -1;

    if (produto) {
      pedido.itens.forEach(function (i, n) {
        if (alvo < 0 && i.id === produto.id) alvo = n;
      });
    }
    if (alvo < 0) {
      var busca = texto.toLowerCase();
      pedido.itens.forEach(function (i, n) {
        if (alvo < 0 && i.n.toLowerCase().indexOf(busca) >= 0) alvo = n;
      });
    }
    if (alvo < 0) {
      if (/^[0-9]{6,14}$/.test(texto)) {
        ligarCodigoAoItem(texto, pedido);
        return;
      }
      avisar("Nao achei esse item neste pedido.");
      return;
    }
    marcarItem(pedido.numero, alvo, "ok");
  }

  function ligarCodigoAoItem(codigo, pedido) {
    var nomes = pedido.itens.map(function (i, n) { return (n + 1) + ") " + i.n; }).join("\n");
    var escolha = prompt(
      "Codigo " + codigo + " ainda nao esta ligado a nenhum produto.\n\n" +
      "Digite o numero do item deste pedido para ligar:\n\n" + nomes
    );
    var n = Number(escolha) - 1;
    if (isNaN(n) || !pedido.itens[n]) return;
    var item = pedido.itens[n];
    if (item.id) Codigos.ligar(codigo, item.id);
    marcarItem(pedido.numero, n, "ok");
  }

  function avisar(texto) {
    var alerta = id("alerta");
    alerta.hidden = false;
    alerta.textContent = texto;
    setTimeout(marcadores, 3000);
  }

  /* ---------------- leitor pela camera ---------------- */
  function lerPelaCamera(quandoLer) {
    if (!("BarcodeDetector" in window)) {
      avisar("Este navegador nao le codigo pela camera. Use um leitor de mao, que funciona sempre.");
      return;
    }
    var caixa = id("camera");
    var video = id("cameraVideo");
    caixa.hidden = false;

    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then(function (fluxo) {
      video.srcObject = fluxo;
      video.play();
      var leitor = new window.BarcodeDetector({
        formats: ["ean_13", "ean_8", "code_128", "upc_a", "upc_e"]
      });
      var parar = false;

      function fechar() {
        parar = true;
        fluxo.getTracks().forEach(function (t) { t.stop(); });
        caixa.hidden = true;
      }
      id("btFecharCamera").onclick = fechar;

      (function procurar() {
        if (parar) return;
        leitor.detect(video).then(function (achados) {
          if (achados.length) {
            fechar();
            quandoLer(achados[0].rawValue);
            return;
          }
          setTimeout(procurar, 300);
        }).catch(function () { setTimeout(procurar, 500); });
      })();
    }).catch(function () {
      caixa.hidden = true;
      avisar("Nao consegui abrir a camera. Confira a permissao do navegador.");
    });
  }

  /* ---------------- aba: estoque ---------------- */
  var filtroEstoque = { texto: "", setor: "", so: "" };

  function telaEstoque(area) {
    titulo(area, "Estoque", "Quantidade, aviso de fim e codigo de barras. Quem nao tiver quantidade fica sem controle.");

    var topo = D.elemento("div", "est-topo");
    topo.innerHTML =
      '<input id="eBusca" type="search" placeholder="Buscar produto ou bipar o codigo" value="' + esc(filtroEstoque.texto) + '">' +
      '<select id="eSetor"><option value="">Todos os setores</option>' +
      SETORES.map(function (s) {
        return '<option value="' + s.id + '"' + (filtroEstoque.setor === s.id ? " selected" : "") + ">" + esc(s.nome) + "</option>";
      }).join("") + "</select>" +
      '<select id="eSo"><option value="">Tudo</option>' +
      '<option value="controlado"' + (filtroEstoque.so === "controlado" ? " selected" : "") + ">Com controle</option>" +
      '<option value="falta"' + (filtroEstoque.so === "falta" ? " selected" : "") + ">No fim ou esgotado</option></select>";
    area.appendChild(topo);

    var lista = D.elemento("div", "est-lista");
    area.appendChild(lista);

    id("eBusca").addEventListener("input", function () {
      filtroEstoque.texto = this.value;
      desenharEstoque(lista);
    });
    id("eBusca").addEventListener("keydown", function (e) {
      if (e.key !== "Enter") return;
      var p = Codigos.produto(this.value.trim());
      if (p) { filtroEstoque.texto = p.n; this.value = p.n; desenharEstoque(lista); }
    });
    id("eSetor").addEventListener("change", function () { filtroEstoque.setor = this.value; desenharEstoque(lista); });
    id("eSo").addEventListener("change", function () { filtroEstoque.so = this.value; desenharEstoque(lista); });

    desenharEstoque(lista);
  }

  function desenharEstoque(lista) {
    var busca = filtroEstoque.texto.trim().toLowerCase();
    var achados = CATALOGO.filter(function (p) {
      if (filtroEstoque.setor && p.s !== filtroEstoque.setor) return false;
      if (busca && p.n.toLowerCase().indexOf(busca) < 0) return false;
      var e = Estoque.item(p.id);
      if (filtroEstoque.so === "controlado" && (e.q === null || e.q === undefined)) return false;
      if (filtroEstoque.so === "falta" && !(e.esgotado || (e.q !== null && e.q !== undefined && e.min > 0 && e.q <= e.min))) return false;
      return true;
    });

    lista.innerHTML = "";
    if (!achados.length) {
      lista.appendChild(D.elemento("div", "p-vazio", "<b>Nada encontrado</b>Mude a busca ou o setor."));
      return;
    }

    achados.slice(0, 60).forEach(function (p) {
      var e = Estoque.item(p.id);
      var fim = e.esgotado || (e.q !== null && e.q !== undefined && e.min > 0 && e.q <= e.min);
      var linha = D.elemento("div", "est-linha" + (fim ? " esgotado" : ""));
      linha.innerHTML =
        '<div class="est-nome">' + esc(p.n) +
        '<div class="est-cat">' + esc(nomeSetor(p.s) + " · " + (p.c || "")) + " · " + dinheiro(p.p) +
        (p.u === "kg" ? " por kg" : "") + "</div></div>" +
        '<label class="est-campo"><span>Tem</span><input type="number" step="0.01" data-campo="q" value="' +
          (e.q === null || e.q === undefined ? "" : e.q) + '" placeholder="sem controle"></label>' +
        '<label class="est-campo"><span>Avisar em</span><input type="number" step="0.01" data-campo="min" value="' + (e.min || "") + '"></label>' +
        '<label class="est-campo"><span>Codigo de barras</span><input type="text" data-campo="cod" value="' +
          esc(Codigos.doProduto(p.id)) + '" placeholder="bipe aqui"></label>' +
        '<button class="marcar" type="button" aria-pressed="' + (e.esgotado ? "true" : "false") + '">' +
          (e.esgotado ? "Esgotado" : "Tem na loja") + "</button>";

      linha.querySelector('[data-campo="q"]').addEventListener("change", function () {
        var v = this.value.trim();
        Estoque.trocar(p.id, "q", v === "" ? null : Number(v));
        if (v !== "" && Number(v) > 0) Estoque.trocar(p.id, "esgotado", false);
        desenharEstoque(lista);
        marcadores();
      });
      linha.querySelector('[data-campo="min"]').addEventListener("change", function () {
        Estoque.trocar(p.id, "min", Number(this.value || 0));
        desenharEstoque(lista);
        marcadores();
      });
      linha.querySelector('[data-campo="cod"]').addEventListener("change", function () {
        var codigo = this.value.trim();
        if (codigo) Codigos.ligar(codigo, p.id);
      });
      linha.querySelector(".marcar").addEventListener("click", function () {
        Estoque.trocar(p.id, "esgotado", !Estoque.item(p.id).esgotado);
        desenharEstoque(lista);
        marcadores();
      });
      lista.appendChild(linha);
    });

    if (achados.length > 60) {
      lista.appendChild(D.elemento("p", "p-ajuda", "Mostrando 60 de " + achados.length + " produtos. Refine a busca."));
    }
  }

  /* ---------------- aba: balcao ---------------- */
  var buscaBalcao = "";

  function telaBalcao(area) {
    titulo(area, "Venda no balcao", "Bipe o produto ou busque pelo nome. Sai do estoque e entra no caixa do dia.");

    var grade = D.elemento("div", "bal-grade");
    var lado = D.elemento("div", "bal-busca");
    lado.innerHTML =
      '<input id="bBusca" type="text" placeholder="Bipe o codigo de barras ou busque pelo nome" value="' + esc(buscaBalcao) + '">' +
      '<div style="display:flex;gap:9px;margin-bottom:12px"><button class="p-botao" type="button" id="btCameraBal">Ler pela camera</button></div>' +
      '<div class="bal-itens" id="bItens"></div>';
    grade.appendChild(lado);

    var direita = D.elemento("aside", "bal-comanda");
    direita.innerHTML =
      "<h2>Comanda</h2>" +
      '<div class="bal-linhas" id="bLinhas"></div>' +
      '<div class="cx-total"><span>Total</span><b id="bTotal">R$ 0,00</b></div>' +
      '<label class="campo"><span>Pagamento</span><select id="bPag">' +
        LOJA.pagamentos.map(function (p) { return "<option>" + esc(p) + "</option>"; }).join("") +
      "</select></label>" +
      '<label class="campo"><span>Nome (opcional)</span><input id="bNome" type="text" placeholder="Cliente do balcao"></label>' +
      '<button class="btn btn-viva btn-bloco" type="button" id="btFechar">Fechar a venda</button>';
    grade.appendChild(direita);
    area.appendChild(grade);

    var campo = id("bBusca");
    campo.focus();
    campo.addEventListener("input", function () { buscaBalcao = this.value; desenharAchados(); });
    campo.addEventListener("keydown", function (e) {
      if (e.key !== "Enter") return;
      e.preventDefault();
      var p = Codigos.produto(this.value.trim());
      if (p) { juntar(p); this.value = ""; buscaBalcao = ""; desenharAchados(); return; }
      var achados = acharProdutos(this.value);
      if (achados.length === 1) { juntar(achados[0]); this.value = ""; buscaBalcao = ""; desenharAchados(); }
    });
    id("btCameraBal").addEventListener("click", function () {
      lerPelaCamera(function (codigo) {
        var p = Codigos.produto(codigo);
        if (p) { juntar(p); return; }
        avisar("Codigo " + codigo + " ainda nao esta ligado a um produto. Ligue na aba Estoque.");
      });
    });
    id("btFechar").addEventListener("click", fecharVenda);

    desenharAchados();
    desenharComanda();
  }

  function acharProdutos(texto) {
    var busca = texto.trim().toLowerCase();
    if (busca.length < 2) return [];
    return CATALOGO.filter(function (p) { return p.n.toLowerCase().indexOf(busca) >= 0; }).slice(0, 40);
  }

  function desenharAchados() {
    var caixa = id("bItens");
    if (!caixa) return;
    var achados = acharProdutos(buscaBalcao);
    caixa.innerHTML = "";
    if (!achados.length) {
      caixa.appendChild(D.elemento("p", "p-ajuda", "Digite pelo menos duas letras ou bipe o codigo."));
      return;
    }
    achados.forEach(function (p) {
      var b = D.elemento("button", "bal-item",
        "<span><b>" + esc(p.n) + "</b><span>" + esc(nomeSetor(p.s)) + " · " + (p.u === "kg" ? "por kg" : "unidade") + "</span></span>" +
        '<span class="mono">' + dinheiro(p.p) + "</span>");
      b.type = "button";
      b.addEventListener("click", function () { juntar(p); });
      caixa.appendChild(b);
    });
  }

  function juntar(produto) {
    var quanto = 1;
    if (produto.u === "kg") {
      var digitado = prompt("Quantos gramas de " + produto.n + "?", "500");
      if (!digitado) return;
      quanto = Number(String(digitado).replace(",", ".")) / 1000;
      if (!quanto || quanto <= 0) return;
    }
    var achado = comanda.filter(function (x) { return x.id === produto.id; })[0];
    if (achado) achado.q = Math.round((achado.q + quanto) * 1000) / 1000;
    else comanda.push({ id: produto.id, n: produto.n, p: produto.p, u: produto.u, s: produto.s, c: produto.c, dp: produto.dp, q: quanto });
    desenharComanda();
  }

  function desenharComanda() {
    var caixa = id("bLinhas");
    if (!caixa) return;
    caixa.innerHTML = "";
    if (!comanda.length) caixa.appendChild(D.elemento("p", "p-ajuda", "Comanda vazia."));
    comanda.forEach(function (x, n) {
      var l = D.elemento("div", "bal-linha",
        "<span>" + esc(quantidade(x) + " " + x.n) + "</span>" +
        '<span class="mono">' + dinheiro(x.p * x.q) + ' <button type="button" aria-label="Tirar">tirar</button></span>');
      l.querySelector("button").addEventListener("click", function () {
        comanda.splice(n, 1);
        desenharComanda();
      });
      caixa.appendChild(l);
    });
    id("bTotal").textContent = dinheiro(comanda.reduce(function (s, x) { return s + x.p * x.q; }, 0));
  }

  function fecharVenda() {
    if (!comanda.length) { avisar("A comanda esta vazia."); return; }
    var total = comanda.reduce(function (s, x) { return s + x.p * x.q; }, 0);
    var pedido = {
      numero: Pedidos.proximoNumero(),
      quando: Date.now(),
      origem: "balcao",
      cliente: { nome: (id("bNome").value.trim() || "Cliente do balcao"), fone: "", endereco: "Balcao da loja" },
      entrega: { bairro: "Balcao", taxa: 0, minutos: 0 },
      pagamento: id("bPag").value,
      observacao: "",
      itens: comanda.map(function (x) {
        return { id: x.id, n: x.n, q: x.q, p: x.p, s: x.s, u: x.u, c: x.c, dp: x.dp };
      }),
      subtotal: total,
      total: total,
      status: "Entregue",
      historico: [{ status: "Entregue", quando: Date.now() }]
    };
    comanda.forEach(function (x) { Estoque.baixar(x.id, x.q); });
    Pedidos.enviar(pedido).then(function () {
      comanda = [];
      desenhar();
      avisar("Venda #" + pedido.numero + " fechada em " + dinheiro(total) + ".");
    });
  }

  /* ---------------- aba: caixa ---------------- */
  function telaCaixa(area) {
    titulo(area, "Caixa do dia", "Entradas por forma de pagamento, gastos do dia e o que sobra limpo.");

    var hoje = new Date();
    var doDia = Pedidos.todos().filter(function (p) { return mesmoDia(p.quando, hoje) && p.status !== "Cancelado"; });
    var gastos = Despesas.doDia(hoje);
    var caixa = Caixa.tudo();

    var porPagamento = {};
    LOJA.pagamentos.forEach(function (p) { porPagamento[p] = 0; });
    doDia.forEach(function (p) {
      porPagamento[p.pagamento] = (porPagamento[p.pagamento] || 0) + p.total;
    });

    var vendas = doDia.reduce(function (s, p) { return s + p.total; }, 0);
    var taxas = doDia.reduce(function (s, p) { return s + (p.entrega.taxa || 0); }, 0);
    var gasto = gastos.reduce(function (s, d) { return s + d.valor; }, 0);
    var sobra = vendas - gasto;

    var grade = D.elemento("div", "caixa-grade");

    var esquerda = D.elemento("section", "cx-bloco");
    esquerda.innerHTML =
      "<h2>Entrou hoje</h2>" +
      Object.keys(porPagamento).map(function (p) {
        return '<div class="cx-linha"><span>' + esc(p) + "</span><b>" + dinheiro(porPagamento[p]) + "</b></div>";
      }).join("") +
      '<div class="cx-linha"><span>Taxa de entrega dentro do total</span><b>' + dinheiro(taxas) + "</b></div>" +
      '<div class="cx-linha"><span>Troco de abertura</span><b>' + dinheiro(caixa.aberto ? caixa.troco : 0) + "</b></div>" +
      '<div class="cx-linha"><span>Pedidos fechados</span><b>' + doDia.length + "</b></div>" +
      '<div class="cx-total' + (sobra < 0 ? " negativo" : "") + '"><span>Sobrou limpo</span><b>' + dinheiro(sobra) + "</b></div>" +
      '<div style="margin-top:16px;display:flex;gap:9px;flex-wrap:wrap">' +
        (caixa.aberto
          ? '<button class="p-botao" type="button" id="btFecharCaixa">Fechar o caixa do dia</button>'
          : '<button class="p-botao" type="button" id="btAbrirCaixa">Abrir o caixa</button>') +
      "</div>";
    grade.appendChild(esquerda);

    var direita = D.elemento("section", "cx-bloco");
    direita.innerHTML =
      "<h2>Gastos do dia</h2>" +
      '<div class="desp-form">' +
        '<label class="campo"><span>No que gastou</span><input id="dDesc" type="text" placeholder="Mercadoria, gelo, entregador"></label>' +
        '<label class="campo"><span>Valor</span><input id="dValor" type="number" step="0.01" placeholder="0,00"></label>' +
        '<button class="p-botao" type="button" id="btGasto">Lancar</button>' +
      "</div>" +
      '<div class="desp-lista" id="dLista"></div>' +
      '<div class="cx-total negativo"><span>Total gasto</span><b>' + dinheiro(gasto) + "</b></div>";
    grade.appendChild(direita);
    area.appendChild(grade);

    var lista = id("dLista");
    if (!gastos.length) lista.appendChild(D.elemento("p", "p-ajuda", "Nenhum gasto lancado hoje."));
    gastos.forEach(function (d) {
      var l = D.elemento("div", "desp-linha",
        "<span>" + esc(d.desc) + " · " + hora(d.quando) + '</span><span class="mono">' + dinheiro(d.valor) +
        ' <button class="apagar" type="button">apagar</button></span>');
      l.querySelector(".apagar").addEventListener("click", function () {
        Despesas.apagar(d.id);
        desenhar();
      });
      lista.appendChild(l);
    });

    id("btGasto").addEventListener("click", function () {
      var desc = id("dDesc").value.trim();
      var valor = Number(id("dValor").value);
      if (!desc || !valor || valor <= 0) { avisar("Escreva no que gastou e o valor."); return; }
      Despesas.lancar(desc, valor);
      desenhar();
    });

    var abrir = id("btAbrirCaixa");
    if (abrir) abrir.addEventListener("click", function () {
      var troco = Number(String(prompt("Quanto de troco entrou no caixa?", "100") || "").replace(",", "."));
      Caixa.abrir(isNaN(troco) ? 0 : troco);
      desenhar();
    });
    var fechar = id("btFecharCaixa");
    if (fechar) fechar.addEventListener("click", function () {
      if (!confirm("Fechar o caixa de hoje e guardar no historico?")) return;
      Caixa.fechar({
        quando: Date.now(), vendas: vendas, taxas: taxas, gastos: gasto,
        sobra: sobra, pedidos: doDia.length, troco: caixa.troco, porPagamento: porPagamento
      });
      desenhar();
    });
  }

  /* ---------------- aba: entrega ---------------- */
  function telaEntrega(area) {
    titulo(area, "Entregas na rua", "Quem saiu, para onde vai e quanto o cliente ja pagou.");

    var lista = Pedidos.todos().filter(function (p) {
      return p.status === "Separando" || p.status === "Saiu para entrega";
    });
    if (!lista.length) { vazio(area, "Nenhuma entrega na rua", "Os pedidos separados aparecem aqui."); return; }

    var grade = D.elemento("div", "ent-grade");
    lista.forEach(function (p) {
      var passo = STATUS.indexOf(p.status);
      var card = D.elemento("article", "ent-card");
      card.innerHTML =
        '<div class="ficha-topo"><span class="ficha-num mono">#' + p.numero + "</span>" +
        '<span class="ficha-hora mono">' + hora(p.quando) + "</span></div>" +
        '<div class="ficha-cliente">' + esc(p.cliente.nome) + " · " + esc(p.cliente.fone) + "</div>" +
        '<div class="ficha-end">' + esc(p.cliente.endereco) + " · " + esc(p.entrega.bairro) + "</div>" +
        '<div class="ent-rota">' + STATUS.map(function (s, n) {
          return '<i class="ent-passo' + (n <= passo ? " feito" : "") + '"></i>';
        }).join("") + "</div>" +
        '<div class="ficha-total"><span>' + esc(p.pagamento) + " · taxa " +
          (p.entrega.taxa ? dinheiro(p.entrega.taxa) : "sem taxa") +
          '</span><span class="mono">' + dinheiro(p.total) + "</span></div>" +
        '<div class="ficha-botoes">' +
          (p.status === "Separando" ? '<button type="button" data-acao="sair">Saiu para entrega</button>' : "") +
          (p.status === "Saiu para entrega" ? '<button type="button" data-acao="entregue">Entregue</button>' : "") +
          '<a class="p-botao" style="display:inline-grid;place-items:center" target="_blank" rel="noopener" href="https://www.google.com/maps/search/' +
            encodeURIComponent(p.cliente.endereco + " " + p.entrega.bairro) + '">Ver no mapa</a>' +
        "</div>";

      var sair = card.querySelector('[data-acao="sair"]');
      if (sair) sair.addEventListener("click", function () {
        Pedidos.mudarStatus(p.numero, "Saiu para entrega");
        desenhar();
      });
      var entregue = card.querySelector('[data-acao="entregue"]');
      if (entregue) entregue.addEventListener("click", function () {
        Pedidos.mudarStatus(p.numero, "Entregue");
        desenhar();
      });
      grade.appendChild(card);
    });
    area.appendChild(grade);
  }

  /* ---------------- aba: historico ---------------- */
  var diaHistorico = "";

  function telaHistorico(area) {
    titulo(area, "Historico", "Escolha o dia para ver os pedidos e o fechamento do caixa.");

    if (!diaHistorico) {
      var h = new Date();
      diaHistorico = h.getFullYear() + "-" + ("0" + (h.getMonth() + 1)).slice(-2) + "-" + ("0" + h.getDate()).slice(-2);
    }

    var topo = D.elemento("div", "hist-topo");
    topo.innerHTML = '<input type="date" id="hDia" value="' + diaHistorico + '">' +
      '<button class="p-botao" type="button" id="btBaixar">Baixar a lista do dia</button>';
    area.appendChild(topo);

    var escolhido = new Date(diaHistorico + "T12:00:00");
    var doDia = Pedidos.todos().filter(function (p) { return mesmoDia(p.quando, escolhido); });
    var gastos = Despesas.doDia(escolhido);
    var vendas = doDia.reduce(function (s, p) { return s + p.total; }, 0);
    var gasto = gastos.reduce(function (s, d) { return s + d.valor; }, 0);

    var resumo = D.elemento("div", "resumo");
    resumo.innerHTML =
      bloco(doDia.length, "Pedidos do dia", true) +
      bloco(dinheiro(vendas), "Vendido") +
      bloco(dinheiro(gasto), "Gasto") +
      bloco(dinheiro(vendas - gasto), "Sobrou");
    area.appendChild(resumo);

    id("hDia").addEventListener("change", function () { diaHistorico = this.value; desenhar(); });
    id("btBaixar").addEventListener("click", function () { baixarLista(doDia, diaHistorico); });

    if (!doDia.length) { vazio(area, "Nenhum pedido nesse dia", "Escolha outra data acima."); return; }

    var lista = D.elemento("div", "hist-lista");
    doDia.forEach(function (p) {
      var c = D.elemento("article", "ent-card",
        '<div class="ficha-topo"><span class="ficha-num mono">#' + p.numero + "</span>" +
        '<span class="ficha-hora mono">' + dataCurta(p.quando) + " " + hora(p.quando) + "</span></div>" +
        '<div class="ficha-cliente">' + esc(p.cliente.nome) + "</div>" +
        '<div class="ficha-end">' + esc(p.entrega.bairro) + " · " + esc(p.status) + " · " + esc(p.pagamento) + "</div>" +
        '<div class="ficha-total"><span>' + p.itens.length + ' itens</span><span class="mono">' + dinheiro(p.total) + "</span></div>");
      lista.appendChild(c);
    });
    area.appendChild(lista);
  }

  function baixarLista(pedidos, dia) {
    var linhas = ["numero;hora;cliente;bairro;status;pagamento;itens;total"];
    pedidos.forEach(function (p) {
      linhas.push([p.numero, hora(p.quando), p.cliente.nome, p.entrega.bairro, p.status,
        p.pagamento, p.itens.length, p.total.toFixed(2).replace(".", ",")].join(";"));
    });
    var arquivo = new Blob(["﻿" + linhas.join("\n")], { type: "text/csv;charset=utf-8" });
    var link = document.createElement("a");
    link.href = URL.createObjectURL(arquivo);
    link.download = "mercado-ja-" + dia + ".csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /* ---------------- ligacoes ---------------- */
  document.addEventListener("DOMContentLoaded", function () {
    id("btEntrar").addEventListener("click", entrar);
    id("senha").addEventListener("keydown", function (e) { if (e.key === "Enter") entrar(); });
    id("btSair").addEventListener("click", sair);

    id("btLoja").addEventListener("click", function () {
      Config.trocar("lojaAberta", !Config.tudo().lojaAberta);
      estadoLoja();
    });
    id("alerta").addEventListener("click", function () {
      abaAtual = "estoque";
      filtroEstoque.so = "falta";
      montarAbas();
      desenhar();
    });
    id("btAuto").addEventListener("click", function () {
      var ligado = !Config.tudo().auto;
      Config.trocar("auto", ligado);
      this.setAttribute("aria-pressed", ligado ? "true" : "false");
    });
    id("btSenha").addEventListener("click", function () {
      var nova = prompt("Nova senha do portal (so numeros ou letras):", "");
      if (!nova) return;
      Config.trocar("senha", nova.trim());
      alert("Senha trocada.");
    });
    id("btAuto").setAttribute("aria-pressed", Config.tudo().auto ? "true" : "false");

    if (Pedidos.canal) {
      Pedidos.canal.onmessage = function (e) {
        if (e.data && e.data.tipo === "novo") novos[e.data.pedido.numero] = true;
        if (!id("portal").hidden) desenhar();
      };
    }
    window.addEventListener("storage", function () {
      if (!id("portal").hidden) desenhar();
    });

    if (sessionStorage.getItem("mj_portal") === "1") abrirPortal();
    else id("senha").focus();
  });
})();
