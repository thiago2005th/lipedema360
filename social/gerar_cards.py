"""Gera os cards (imagem 1080x1350) e as legendas dos posts de Instagram/Facebook
a partir dos estudos novos do Lipedema360.

Uso:  python social/gerar_cards.py [quantidade]      (padrão: 1)
Saída: site/public/social/<pmid>.png  +  social/fila.json (legendas prontas)
Estado: social/postados.json (PMIDs que já viraram post)
"""
import ast, json, os, sys, textwrap
from PIL import Image, ImageDraw, ImageFont

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DADOS = os.path.join(RAIZ, "data", "articles.json")
SAIDA = os.path.join(RAIZ, "site", "public", "social")
ESTADO = os.path.join(RAIZ, "social", "postados.json")
FILA = os.path.join(RAIZ, "social", "fila.json")
SITE = "lipedema360.com.br"
W, H = 1080, 1350
BG, OURO, OURO2, TXT, SUB = (15, 14, 13), (201, 166, 107), (224, 196, 143), (240, 235, 226), (150, 143, 132)

SERIF = ["C:/Windows/Fonts/georgia.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf"]
SERIF_B = ["C:/Windows/Fonts/georgiab.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"]
SANS = ["C:/Windows/Fonts/segoeui.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"]
SANS_B = ["C:/Windows/Fonts/segoeuib.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"]

def fonte(opcoes, tam):
    for c in opcoes:
        if os.path.exists(c):
            return ImageFont.truetype(c, tam)
    return ImageFont.load_default()

def lista(v):
    if isinstance(v, list): return v
    try: return ast.literal_eval(v)
    except Exception: return []

def ajustar(d, txt, f, largura, max_linhas):
    """quebra o texto pela largura em pixels; corta com reticências se passar de max_linhas"""
    palavras, linhas, atual = txt.split(), [], ""
    for p in palavras:
        t = (atual + " " + p).strip()
        if d.textlength(t, font=f) <= largura: atual = t
        else: linhas.append(atual); atual = p
    if atual: linhas.append(atual)
    if len(linhas) > max_linhas:
        linhas = linhas[:max_linhas]; linhas[-1] = linhas[-1].rstrip(" ,.;:") + "…"
    return linhas

def card(a, caminho):
    im = Image.new("RGB", (W, H), BG); d = ImageDraw.Draw(im)
    d.rectangle([0, 0, W, 10], fill=OURO)
    m = 80
    d.text((m, 70), "LIPEDEMA360", font=fonte(SANS_B, 30), fill=OURO)
    d.text((W - m, 70), "NOVO ESTUDO", font=fonte(SANS_B, 30), fill=SUB, anchor="ra")
    y = 170
    ft = fonte(SERIF_B, 62)
    for l in ajustar(d, a["titulo_pt"], ft, W - 2 * m, 5):
        d.text((m, y), l, font=ft, fill=TXT); y += 76
    y += 24; d.line([m, y, m + 120, y], fill=OURO, width=4); y += 40
    fp = fonte(SANS, 38)
    for ponto in lista(a["pontos_chave"])[:3]:
        ls = ajustar(d, ponto, fp, W - 2 * m - 50, 4)
        d.ellipse([m, y + 15, m + 14, y + 29], fill=OURO2)
        for l in ls:
            d.text((m + 50, y), l, font=fp, fill=TXT); y += 50
        y += 22
        if y > H - 300: break
    # rodapé
    fr = fonte(SANS, 28)
    ref = f'{a["revista"]} · {a["data"][:7]} · PMID {a["pmid"]}'
    d.line([m, H - 200, W - m, H - 200], fill=(60, 56, 50), width=2)
    d.text((m, H - 175), ref, font=fr, fill=SUB)
    d.text((m, H - 125), "Resumo em português gerado por IA a partir do PubMed.", font=fonte(SANS, 24), fill=SUB)
    d.text((m, H - 80), SITE, font=fonte(SANS_B, 34), fill=OURO2)
    im.save(caminho, optimize=True)

def legenda(a):
    pts = lista(a["pontos_chave"])[:3]
    corpo = "\n".join(f"• {p}" for p in pts)
    return (f'📄 {a["titulo_pt"]}\n\n{corpo}\n\n'
            f'Fonte: {a["revista"]} ({a["data"][:4]}) · PMID {a["pmid"]}\n'
            f'Resumo em português gerado por IA a partir do PubMed; leia o artigo original antes de aplicar na prática.\n\n'
            f'Todos os estudos sobre lipedema, atualizados todo dia, em {SITE} (link na bio)\n\n'
            f'#lipedema #lipedemabrasil #ciencia #medicina #saude #pubmed')

def principal(n):
    dados = json.load(open(DADOS, encoding="utf-8"))
    feitos = set(json.load(open(ESTADO))) if os.path.exists(ESTADO) else set()
    # mais recentes primeiro; só os que têm resumo em português; em inglês/qualquer idioma
    cand = sorted([a for a in dados if a.get("titulo_pt") and a.get("pontos_chave") and a["pmid"] not in feitos],
                  key=lambda a: (a["data"], int(a.get("peso") or 0)), reverse=True)
    os.makedirs(SAIDA, exist_ok=True)
    fila = []
    for a in cand[:n]:
        arq = os.path.join(SAIDA, f'{a["pmid"]}.png'); card(a, arq)
        fila.append({"pmid": a["pmid"], "imagem": f'https://www.{SITE}/social/{a["pmid"]}.png', "texto": legenda(a)})
    json.dump(fila, open(FILA, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print(f"{len(fila)} card(s) em {SAIDA}")

if __name__ == "__main__":
    principal(int(sys.argv[1]) if len(sys.argv) > 1 else 1)
