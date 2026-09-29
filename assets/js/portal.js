/* Mercado Já — portal da loja (Cria Site)
   Estoque, separação, balcão com leitor de código de barras, caixa,
   entrega e histórico. Depende de loja.js (LOJA, Pedidos, STATUS, dinheiro)
   e de catalogo.js (CATALOGO, SETORES).

   Hoje tudo grava no próprio navegador (localStorage) e conversa entre as
   abas na hora (BroadcastChannel). Quando o mercado fechar, troca-se a
   camada Banco por Firebase sem mexer no resto da tela.
*/
(function (janela) {
  "use strict";

  /* ---------------- base de dados local ---------------- */
  var Banco = {
    ler: function (chave, padrao) {
      try { return JSON.parse(localStorage.getItem(chave)) || padrao; }
      catch (e) { return padrao; }
    },
    gravar: function (chave, valor) {
      localStorage.setItem(chave, JSON.stringify(valor));
    }
  };

  var CH = {
    config: "mj_config",
    estoque: "mj_estoque",
    codigos: "mj_codigos",
    despesas: "mj_despesas",
    caixa: "mj_caixa"
  };

  var Config = {
    tudo: function () {
      return Banco.ler(CH.config, { senha: "1234", lojaAberta: true, som: true, auto: true });
    },
    salvar: function (c) { Banco.gravar(CH.config, c); },
    trocar: function (campo, valor) { var c = this.tudo(); c[campo] = valor; this.salvar(c); return c; }
  };

  var Estoque = {
    tudo: function () { return Banco.ler(CH.estoque, {}); },
    salvar: function (e) { Banco.gravar(CH.estoque, e); },
    item: function (id) {
      var e = this.tudo();
      return e[id] || { q: null, min: 0, esgotado: false };
    },
    trocar: function (id, campo, valor) {
      var e = this.tudo();
      var i = e[id] || { q: null, min: 0, esgotado: false };
      i[campo] = valor;
      e[id] = i;
      this.salvar(e);
    },
    baixar: function (id, quantidade) {
      var e = this.tudo();
      var i = e[id];
      if (!i || i.q === null || i.q === undefined) return;
      i.q = Math.round((i.q - quantidade) * 1000) / 1000;
      if (i.q < 0) i.q = 0;
      if (i.q === 0) i.esgotado = true;
      e[id] = i;
      this.salvar(e);
    },
    emFalta: function () {
      var e = this.tudo();
      var lista = [];
      Object.keys(e).forEach(function (id) {
        var i = e[id];
        var p = porId(id);
        if (!p) return;
        if (i.esgotado || (i.q !== null && i.q !== undefined && i.min > 0 && i.q <= i.min)) lista.push(p);
      });
      return lista;
    }
  };

  var Codigos = {
    tudo: function () { return Banco.ler(CH.codigos, {}); },
    produto: function (codigo) {
      var id = this.tudo()[String(codigo).trim()];
      return id ? porId(id) : null;
    },
    ligar: function (codigo, idProduto) {
      var c = this.tudo();
      c[String(codigo).trim()] = idProduto;
      Banco.gravar(CH.codigos, c);
    },
    doProduto: function (id) {
      var c = this.tudo(), achado = "";
      Object.keys(c).forEach(function (k) { if (c[k] === id) achado = k; });
      return achado;
    }
  };

  var Despesas = {
    tudo: function () { return Banco.ler(CH.despesas, []); },
    lancar: function (desc, valor) {
      var l = this.tudo();
      l.unshift({ id: Date.now(), quando: Date.now(), desc: desc, valor: valor });
      Banco.gravar(CH.despesas, l);
    },
    apagar: function (id) {
      Banco.gravar(CH.despesas, this.tudo().filter(function (d) { return d.id !== id; }));
    },
    doDia: function (dia) {
      return this.tudo().filter(function (d) { return mesmoDia(d.quando, dia); });
    }
  };

  var Caixa = {
    tudo: function () { return Banco.ler(CH.caixa, { aberto: false, abertura: 0, troco: 0, fechamentos: [] }); },
    salvar: function (c) { Banco.gravar(CH.caixa, c); },
    abrir: function (troco) {
      var c = this.tudo();
      c.aberto = true; c.abertura = Date.now(); c.troco = troco;
      this.salvar(c);
    },
    fechar: function (resumo) {
      var c = this.tudo();
      c.aberto = false;
      c.fechamentos.unshift(resumo);
      this.salvar(c);
    }
  };

  /* ---------------- apoio ---------------- */
  var porIdCache = null;
  function porId(id) {
    if (!porIdCache) {
      porIdCache = {};
      CATALOGO.forEach(function (p) { porIdCache[p.id] = p; });
    }
    return porIdCache[id] || null;
  }

  function mesmoDia(quando, dia) {
    var a = new Date(quando), b = new Date(dia);
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  function hora(t) {
    var d = new Date(t);
    return ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
  }

  function dataCurta(t) {
    var d = new Date(t);
    return ("0" + d.getDate()).slice(-2) + "/" + ("0" + (d.getMonth() + 1)).slice(-2);
  }

  function quantidade(item) {
    if (item.u === "kg") {
      return item.q < 1 ? Math.round(item.q * 1000) + " g" : String(item.q).replace(".", ",") + " kg";
    }
    return item.q + "x";
  }

  function nomeSetor(id) {
    var s = SETORES.filter(function (x) { return x.id === id; })[0];
    return s ? s.nome : id;
  }

  function escapar(t) {
    return String(t == null ? "" : t)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function elemento(tag, classe, html) {
    var e = document.createElement(tag);
    if (classe) e.className = classe;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  function id(x) { return document.getElementById(x); }

  janela.PortalDados = {
    Banco: Banco, Config: Config, Estoque: Estoque, Codigos: Codigos,
    Despesas: Despesas, Caixa: Caixa,
    porId: porId, mesmoDia: mesmoDia, hora: hora, dataCurta: dataCurta,
    quantidade: quantidade, nomeSetor: nomeSetor, escapar: escapar,
    elemento: elemento, id: id
  };
})(window);
