/* Mercadinho da Vila — configuração da loja e camada de pedidos (Cria Site)

   O pedido NÃO vai para o WhatsApp. Ele entra no sistema:
   fica gravado, ganha número, aparece no painel da loja e muda de status.

   Hoje grava no próprio navegador (localStorage) e avisa o painel na hora
   (BroadcastChannel). É o suficiente para demonstrar o fluxo inteiro.
   Quando o mercado fechar, troca-se só o objeto Pedidos.enviar por Firebase
   ou por outro servidor, sem mexer no resto do site.
*/

const LOJA = {
  nome: "Mercadinho da Vila",
  entregaMedia: "38 min",
  taxas: [
    { bairro: "Centro",        valor: 6.9,  minutos: 30 },
    { bairro: "Vila Nova",     valor: 7.9,  minutos: 38 },
    { bairro: "Jardim das Flores", valor: 9.9, minutos: 45 },
    { bairro: "Parque Industrial", valor: 12.9, minutos: 55 },
    { bairro: "Retirar na loja", valor: 0, minutos: 20 }
  ],
  pagamentos: ["Pix", "Cartão na entrega", "Dinheiro"],
  minimo: 20
};

const Pedidos = {
  chave: "mv_pedidos",
  canal: ("BroadcastChannel" in window) ? new BroadcastChannel("mv_pedidos") : null,

  todos() {
    try { return JSON.parse(localStorage.getItem(this.chave) || "[]"); }
    catch (e) { return []; }
  },

  gravar(lista) {
    localStorage.setItem(this.chave, JSON.stringify(lista));
  },

  proximoNumero() {
    const lista = this.todos();
    return lista.length ? Math.max.apply(null, lista.map(p => p.numero)) + 1 : 1;
  },

  /* ponto único de troca: aqui entra o Firebase quando for cliente real */
  enviar(pedido) {
    const lista = this.todos();
    lista.unshift(pedido);
    this.gravar(lista);
    if (this.canal) this.canal.postMessage({ tipo: "novo", pedido: pedido });
    return Promise.resolve(pedido);
  },

  mudarStatus(numero, status) {
    const lista = this.todos();
    const p = lista.find(x => x.numero === numero);
    if (!p) return;
    p.status = status;
    p.historico = p.historico || [];
    p.historico.push({ status: status, quando: Date.now() });
    this.gravar(lista);
    if (this.canal) this.canal.postMessage({ tipo: "status", numero: numero, status: status });
  }
};

const STATUS = ["Recebido", "Separando", "Saiu para entrega", "Entregue"];

function dinheiro(v) {
  return "R$ " + Number(v).toFixed(2).replace(".", ",");
}
