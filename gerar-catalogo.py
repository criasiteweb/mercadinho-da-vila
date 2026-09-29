#!/usr/bin/env python3
# Gera assets/js/catalogo.js do Mercado Já (Cria Site).
# 1. Espelha os produtos do mercado-modelo (Mercado e Pet).
# 2. Reclassifica tudo em categorias que o cliente entende (arroz, feijao, molho...).
# 3. Cria Adega e Padaria com produtos de base e preco de referencia.

import re, io, json, unicodedata, collections

ORIGEM = "/home/matheus/projetos/mercado-modelo/assets/js/cardapio.js"
DESTINO = "/home/matheus/projetos/mercadinho-da-vila/assets/js/catalogo.js"


def sem_acento(s):
    s = unicodedata.normalize("NFD", s.lower())
    return "".join(c for c in s if unicodedata.category(c) != "Mn")


# ---------------------------------------------------------------- regras
# ordem importa: a primeira que casar ganha
REGRAS = [
    # --- mercearia / seco
    ("Arroz",            ["arroz"]),
    ("Feijao",           ["feijao"]),
    ("Macarrao e massa", ["macarrao", "espaguete", "penne", "parafuso", "lasanha", "nhoque", "talharim", "massa "]),
    ("Molho de tomate",  ["molho de tomate", "extrato de tomate", "polpa de tomate", "tomate pelado", "passata"]),
    ("Oleo e azeite",    ["oleo ", "azeite", "banha", "gordura vegetal"]),
    ("Acucar e adocante",["acucar", "adocante"]),
    ("Sal e tempero",    ["sal ", "tempero", "alho", "pimenta", "oregano", "colorau", "caldo ", "sazon", "curry", "cominho", "louro"]),
    ("Farinha e fuba",   ["farinha", "fuba", "polvilho", "amido", "maisena"]),
    ("Cafe e achocolatado", ["cafe", "achocolatado", "nescau", "toddy", "capuccino", "cappuccino", "chocolate em po"]),
    ("Leite",            ["leite integral", "leite desnatado", "leite semi", "leite em po", "leite condensado", "creme de leite", "leite longa"]),
    ("Biscoito e bolacha", ["biscoito", "bolacha", "cream cracker", "wafer", "waffer", "cookie", "rosquinha"]),
    ("Doce e sobremesa", ["chocolate", "bombom", "doce de", "gelatina", "pudim", "brigadeiro", "bala", "chiclete", "pirulito", "goiabada", "geleia", "mousse"]),
    ("Enlatado e conserva", ["milho verde", "ervilha", "seleta", "palmito", "azeitona", "atum", "sardinha", "conserva", "pepino", "champignon", "cogumelo"]),
    ("Matinais e cereal", ["aveia", "granola", "cereal", "sucrilhos", "musli", "mingau"]),
    ("Salgadinho e snack",["salgadinho", "batata palha", "amendoim", "castanha", "pipoca", "torresmo", "chips"]),
    ("Alimento infantil", ["infantil", "papinha", "nan ", "aptamil", "mucilon", "formula infantil"]),
    ("Suplemento",       ["whey", "suplemento", "proteina", "creatina", "colageno"]),

    # --- hortifruti
    ("Frutas",           ["banana", "maca", "laranja", "mamao", "melancia", "abacaxi", "uva", "manga", "pera", "morango", "limao", "melao", "goiaba", "kiwi", "abacate", "tangerina", "mexerica", "ameixa", "pessego", "coco", "maracuja", "fruta"]),
    ("Verduras e legumes",["alface", "tomate", "cebola", "batata", "cenoura", "abobrinha", "chuchu", "couve", "brocolis", "repolho", "pimentao", "beterraba", "mandioca", "abobora", "berinjela", "pepino", "vagem", "quiabo", "salsa", "cheiro verde", "rucula", "espinafre", "legume", "verdura"]),
    ("Ovos",             ["ovo "]),

    # --- acougue
    ("Carne bovina",     ["patinho", "alcatra", "coxao", "acem", "musculo", "fraldinha", "picanha", "maminha", "contra file", "file mignon", "costela bovina", "bovino", "carne moida", "cupim", "paleta bovina"]),
    ("Frango",           ["frango", "coxa", "sobrecoxa", "peito de frango", "asa de", "file de peito", "ave"]),
    ("Carne suina",      ["suino", "lombo", "pernil", "bisteca", "costela suina", "porco", "panceta", "bacon"]),
    ("Linguica e embutido", ["linguica", "salsicha", "salame", "mortadela", "presunto", "apresuntado", "calabresa", "paio"]),
    ("Peixe e frutos do mar", ["peixe", "tilapia", "salmao", "merluza", "sardinha fresca", "bacalhau", "camarao", "lula", "polvo", "marisco", "pescada", "atum fresco"]),

    # --- frios e congelados
    ("Queijo",           ["queijo", "mussarela", "muzzarela", "prato", "requeijao", "cream cheese", "parmesao", "provolone", "ricota", "catupiry"]),
    ("Iogurte e bebida lactea", ["iogurte", "bebida lactea", "danone", "activia", "coalhada"]),
    ("Manteiga e margarina", ["manteiga", "margarina", "halls creme"]),
    ("Congelados",       ["congelad", "nuggets", "hamburguer", "empanado", "pizza ", "lasanha congelada", "batata frita", "pao de alho", "acai"]),
    ("Sorvete",          ["sorvete", "picole", "gelato"]),

    # --- bebidas nao alcoolicas
    ("Refrigerante",     ["refrigerante", "coca cola", "guarana", "fanta", "sprite", "pepsi", "soda"]),
    ("Suco e refresco",  ["suco", "refresco", "nectar", "polpa de fruta"]),
    ("Agua",             ["agua mineral", "agua com gas", "agua sem gas", "agua de coco", "agua tonica"]),
    ("Cha e energetico", ["cha ", "energetic", "isotonic", "gatorade", "red bull"]),

    # --- limpeza
    ("Limpeza da casa",  ["detergente", "desinfetante", "agua sanitaria", "cloro", "multiuso", "limpador", "alvejante", "lustra", "veja", "pinho"]),
    ("Roupa",            ["sabao em po", "amaciante", "sabao liquido", "tira manchas", "omo", "ype liquido"]),
    ("Descartavel",      ["papel higienico", "guardanapo", "papel toalha", "saco de lixo", "saco para lixo", "copo descartavel", "prato descartavel", "aluminio", "filme pvc"]),
    ("Higiene pessoal",  ["shampoo", "condicionador", "sabonete", "creme dental", "pasta de dente", "desodorante", "absorvente", "fralda", "escova de dente", "hidratante", "barbear"]),

    # --- bazar
    ("Casa e utilidade", ["panela", "vassoura", "rodo", "balde", "cabide", "pote", "copo ", "prato ", "talher", "escorredor", "tabua", "lampada", "pilha", "isqueiro", "vela"]),
    ("Papelaria",        ["caderno", "caneta", "lapis", "borracha", "papel sulfite", "cola ", "tesoura", "fita adesiva"]),
    ("Festa",            ["festa", "balao", "bexiga", "vela de aniversario", "forminha", "toalha de mesa"]),
    ("Automotivo",       ["automotivo", "oleo motor", "aditivo", "limpa para", "cera automotiva"]),

    # --- pet
    ("Racao de cachorro",["racao cao", "racao para cao", "alimento cao", "pedigree", "golden ", "racao cachorro"]),
    ("Racao de gato",    ["racao gato", "alimento gato", "whiskas", "racao para gato"]),
    ("Petisco pet",      ["petisco", "bifinho", "osso ", "snack pet"]),
    ("Higiene pet",      ["areia", "tapete higienico", "shampoo pet", "higiene cao", "limpeza pet", "cuidado cao", "cuidado gato"]),
    ("Acessorio pet",    ["coleira", "comedouro", "bebedouro", "brinquedo pet", "acessorio cao", "arranhador"]),
    ("Passaro e outros", ["passaro", "alpiste", "racao peixe", "hamster", "roedor"]),
]

TROCO_GRUPO = {
    "hortifruti": "Frutas",
    "acougue": "Acougue",
    "peixaria": "Peixaria",
    "frios": "Frios e laticinios",
    "mercearia": "Mercearia",
    "bebidas": "Bebidas",
    "limpeza": "Limpeza",
    "bazar": "Bazar",
    "pet": "Pet",
}


REGRAS_PET = [r for r in REGRAS if r[0].endswith(" pet") or "Racao" in r[0] or r[0] == "Passaro e outros"]

_cache = {}


def _casa(chave, n):
    """casa por palavra inteira, para maca nao pegar macarrao"""
    r = _cache.get(chave)
    if r is None:
        r = re.compile(r"(?<![a-z0-9])" + re.escape(chave.strip()) + r"(?![a-z])")
        _cache[chave] = r
    return r.search(n) is not None


MAPA_PET = {
    "Alimento cao": "Racao de cachorro", "Racao cao": "Racao de cachorro",
    "Alimento gato": "Racao de gato", "Racao gato": "Racao de gato",
    "Petisco cao": "Petisco de cachorro", "Petisco gato": "Petisco de gato",
    "Cuidado cao": "Cuidado e higiene", "Cuidado gato": "Cuidado e higiene",
    "Higiene cao": "Cuidado e higiene", "Limpeza pet": "Limpeza e areia",
    "Acessorio cao": "Acessorio", "Pet passaro": "Passaro e roedor",
}


def classificar(nome, grupo, d=""):
    if grupo == "pet":
        return MAPA_PET.get(d, d or "Pet em geral")
    n = sem_acento(nome)
    regras = REGRAS
    for rotulo, chaves in regras:
        for c in chaves:
            if _casa(c, n):
                return rotulo
    return TROCO_GRUPO.get(grupo, "Outros")


# ---------------------------------------------------------------- espelho
bruto = io.open(ORIGEM, encoding="utf-8").read()
i = bruto.index("const CARDAPIO")
j = bruto.rindex("]")
prods = json.loads(re.sub(r",(\s*[\]\}])", r"\1", bruto[bruto.index("[", i):j + 1]))

MERCADO = {"hortifruti", "acougue", "peixaria", "frios", "mercearia", "bebidas", "limpeza", "bazar"}
HORTI = {"Frutas", "Verduras e legumes", "Ovos", "Hortifruti"}

catalogo = []
for p in prods:
    g = p["g"]
    setor = "pet" if g == "pet" else ("mercado" if g in MERCADO else None)
    if not setor:
        continue
    cat = classificar(p["n"], g, p.get("d", ""))
    if setor == "mercado" and cat in HORTI:
        setor = "horti"
    catalogo.append({
        "id": p["id"],
        "s": setor,
        "c": cat,
        "n": p["n"],
        "p": p["p"],
        "foto": p.get("foto", ""),
    })


# ---------------------------------------------------------------- adega
# Produtos de base, preco de referencia de supermercado (setembro/2026).
ADEGA = [
    ("Cerveja", [
        ("Cerveja Pilsen lata 350ml", 4.29), ("Cerveja Pilsen lata 269ml", 3.49),
        ("Cerveja Pilsen long neck 355ml", 6.49), ("Cerveja garrafa 600ml", 9.90),
        ("Cerveja litrao 1L", 11.90), ("Cerveja puro malte lata 350ml", 5.29),
        ("Cerveja zero alcool lata 350ml", 4.99), ("Cerveja IPA long neck 355ml", 12.90),
        ("Cerveja weiss garrafa 600ml", 14.90), ("Pack cerveja lata 350ml 12 unidades", 47.90),
        ("Pack cerveja lata 269ml 15 unidades", 44.90), ("Cerveja artesanal pilsen 500ml", 16.90),
    ]),
    ("Vinho", [
        ("Vinho tinto suave 750ml", 22.90), ("Vinho tinto seco 750ml", 29.90),
        ("Vinho branco seco 750ml", 27.90), ("Vinho rose 750ml", 32.90),
        ("Vinho tinto reserva 750ml", 59.90), ("Vinho de mesa garrafao 4,5L", 42.90),
        ("Espumante brut 750ml", 39.90), ("Espumante moscatel 750ml", 36.90),
        ("Sidra 660ml", 12.90), ("Sangria 750ml", 19.90),
    ]),
    ("Destilado", [
        ("Cachaca prata 965ml", 14.90), ("Cachaca ouro 700ml", 24.90),
        ("Vodka 1L", 34.90), ("Vodka importada 1L", 74.90),
        ("Whisky 8 anos 1L", 79.90), ("Whisky 12 anos 1L", 149.90),
        ("Gin nacional 750ml", 59.90), ("Gin importado 750ml", 129.90),
        ("Rum 980ml", 39.90), ("Tequila 750ml", 119.90),
        ("Conhaque 900ml", 29.90), ("Licor de creme 750ml", 64.90),
    ]),
    ("Gelo e acompanhamento", [
        ("Gelo em cubos 2kg", 12.90), ("Gelo de coco 1kg", 14.90),
        ("Agua tonica lata 350ml", 4.49), ("Energetico lata 250ml", 8.90),
        ("Suco para drink 1L", 11.90), ("Xarope de groselha 900ml", 13.90),
        ("Limao taiti kg", 7.99), ("Amendoim japones 500g", 16.90),
        ("Copo descartavel 200ml 100 unidades", 9.90), ("Balde de gelo 5L", 24.90),
    ]),
]

# ---------------------------------------------------------------- padaria
# Preco de referencia de padaria de bairro (setembro/2026).
PADARIA = [
    ("Pao", [
        ("Pao frances kg", 18.90), ("Pao frances unidade 50g", 0.95),
        ("Pao doce unidade", 3.50), ("Pao de leite unidade", 3.20),
        ("Pao integral kg", 24.90), ("Pao italiano unidade", 14.90),
        ("Pao de forma tradicional 450g", 9.90), ("Pao de forma integral 450g", 11.90),
        ("Baguete unidade", 8.90), ("Pao sirio pacote 5 unidades", 9.90),
        ("Pao de hamburguer pacote 4 unidades", 8.90), ("Pao de hot dog pacote 6 unidades", 9.50),
    ]),
    ("Salgado e lanche", [
        ("Pao de queijo kg", 39.90), ("Pao de queijo unidade", 4.50),
        ("Coxinha unidade", 8.50), ("Esfiha de carne unidade", 7.50),
        ("Empada de frango unidade", 8.90), ("Enroladinho de salsicha unidade", 7.50),
        ("Croissant unidade", 9.90), ("Misto quente unidade", 12.90),
        ("Torta salgada fatia", 14.90), ("Quiche de alho poro unidade", 13.90),
    ]),
    ("Doce e confeitaria", [
        ("Sonho de creme unidade", 6.50), ("Sonho de doce de leite unidade", 6.90),
        ("Bolo de cenoura com chocolate fatia", 9.90), ("Bolo de fuba fatia", 8.50),
        ("Bolo simples inteiro", 39.90), ("Torta de morango fatia", 16.90),
        ("Rosquinha de acucar unidade", 4.50), ("Bomba de chocolate unidade", 8.90),
        ("Carolina de creme unidade", 6.90), ("Brigadeiro unidade", 4.50),
        ("Pudim de leite fatia", 11.90), ("Bolo no pote 250g", 14.90),
    ]),
    ("Frios fatiados na hora", [
        ("Presunto cozido fatiado 200g", 12.90), ("Mortadela fatiada 200g", 8.90),
        ("Queijo mussarela fatiado 200g", 16.90), ("Queijo prato fatiado 200g", 17.90),
        ("Peito de peru fatiado 200g", 19.90), ("Salame fatiado 100g", 15.90),
        ("Queijo minas frescal 500g", 24.90), ("Requeijao cremoso 200g", 11.90),
    ]),
    ("Cafe da manha", [
        ("Cafe coado 300ml", 5.50), ("Cafe com leite 300ml", 7.50),
        ("Pingado com pao na chapa", 12.90), ("Suco de laranja natural 400ml", 12.90),
        ("Vitamina de banana 400ml", 13.90), ("Cappuccino 300ml", 9.90),
    ]),
]


def montar(setor, blocos, prefixo):
    saida = []
    k = 0
    for categoria, itens in blocos:
        for nome, preco in itens:
            k += 1
            saida.append({
                "id": prefixo + str(k),
                "s": setor,
                "c": categoria,
                "n": nome,
                "p": preco,
                "foto": "",
            })
    return saida



# ---------------------------------------------------------------- hortifruti de base
# O catalogo espelhado quase so tinha frutas. Estes itens completam a banca.
HORTIFRUTI = [
    ("Verduras e legumes", [
        ("Alface crespa unidade", 4.49), ("Alface americana unidade", 5.99),
        ("Rucula maco", 4.99), ("Agriao maco", 4.49),
        ("Couve manteiga maco", 4.29), ("Espinafre maco", 4.99),
        ("Acelga unidade", 6.99), ("Repolho verde unidade", 6.49),
        ("Repolho roxo unidade", 7.99), ("Cheiro verde maco", 3.99),
        ("Salsa maco", 3.49), ("Cebolinha maco", 3.49),
        ("Hortela maco", 3.99), ("Manjericao maco", 4.49),
        ("Coentro maco", 3.99), ("Almeirao maco", 4.49),
        ("Escarola maco", 4.99), ("Brocolis ninja unidade", 8.99),
        ("Couve flor unidade", 9.99), ("Alho poro unidade", 6.99),
    ]),
    ("Verduras e legumes", [
        ("Tomate kg", 8.99), ("Tomate italiano kg", 10.99),
        ("Cebola kg", 6.49), ("Cebola roxa kg", 9.99),
        ("Batata kg", 6.99), ("Batata doce kg", 7.49),
        ("Cenoura kg", 5.99), ("Beterraba kg", 5.49),
        ("Abobrinha italiana kg", 7.99), ("Abobora cabotia kg", 6.99),
        ("Chuchu kg", 4.99), ("Berinjela kg", 8.49),
        ("Pepino kg", 6.49), ("Pimentao verde kg", 9.99),
        ("Pimentao vermelho kg", 13.99), ("Vagem kg", 12.99),
        ("Quiabo kg", 11.99), ("Mandioca kg", 6.99),
        ("Inhame kg", 8.99), ("Milho verde espiga unidade", 3.49),
        ("Alho kg", 29.90), ("Gengibre kg", 14.90),
    ]),
    ("Ovos", [
        ("Ovo branco duzia", 12.90), ("Ovo vermelho duzia", 14.90),
        ("Ovo caipira duzia", 19.90), ("Ovo branco cartela 30 unidades", 28.90),
        ("Ovo de codorna 30 unidades", 12.90),
    ]),
    ("Temperos frescos", [
        ("Limao taiti kg", 7.99), ("Limao siciliano kg", 16.90),
        ("Pimenta dedo de moca 100g", 5.99), ("Pimenta biquinho 100g", 7.99),
    ]),
]

catalogo += montar("horti", HORTIFRUTI, "hf")

catalogo += montar("adega", ADEGA, "ad")
catalogo += montar("padaria", PADARIA, "pd")

# ---------------------------------------------------------------- grava
conta = collections.Counter(p["s"] for p in catalogo)
cabecalho = """/* Mercado Já - catalogo de demonstracao (Cria Site)
   Gerado por gerar-catalogo.py em 29/09/2026.

   Mercado e Pet: espelhados do modelo Mercado Bom Preco, com foto real.
   Adega e Padaria: produtos de base, montados a partir de pesquisa de preco
   de supermercado e de padaria de bairro em setembro de 2026. Sem foto.

   PRECOS SAO ILUSTRATIVOS. Numa venda real entra a tabela do proprio cliente.

   Mercado: %d | Hortifruti: %d | Adega: %d | Padaria: %d | Pet: %d | Total: %d
*/
const SETORES = [
  { id:"mercado", nome:"Mercado",    cor:"#00b84a", chamada:"Mercearia, acougue, frios, bebidas, limpeza e bazar" },
  { id:"horti",   nome:"Hortifruti", cor:"#7cb342", chamada:"Fruta, verdura, legume e ovo, colhidos para o dia" },
  { id:"adega",   nome:"Adega",   cor:"#ff2d6f", chamada:"Cerveja gelada, vinho, destilado e o gelo que faltou" },
  { id:"padaria", nome:"Padaria", cor:"#ff8a00", chamada:"Pao quentinho, salgado, doce e frios fatiados na hora" },
  { id:"pet",     nome:"Pet",     cor:"#2979ff", chamada:"Racao, petisco, areia e acessorio" }
];

const CATALOGO = """ % (conta["mercado"], conta["horti"], conta["adega"], conta["padaria"], conta["pet"], len(catalogo))

io.open(DESTINO, "w", encoding="utf-8").write(
    cabecalho + json.dumps(catalogo, ensure_ascii=False, separators=(",", ":")) + ";\n"
)

print("total:", len(catalogo), dict(conta))
for s in ("mercado", "horti", "adega", "padaria", "pet"):
    cats = collections.Counter(p["c"] for p in catalogo if p["s"] == s)
    print("\n" + s, "->", len(cats), "categorias")
    for k, v in cats.most_common(30):
        print("   ", k, v)
