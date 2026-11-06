"""
Lipedema360 - Gera resumos em portugues com a API do Claude.

Para cada artigo sem "resumo_pt", pede ao Claude: titulo em portugues, resumo
clinico (3-5 frases), pontos-chave, relevancia pratica e area.

Precisa da variavel de ambiente ANTHROPIC_API_KEY. Sem ela, o script avisa e
sai sem erro (o site publica o abstract original em ingles).

Uso:
    python pipeline/summarize.py              # resume ate 40 artigos novos por rodada
    python pipeline/summarize.py --limite 200
"""
import json
import os
import sys
import time
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "data" / "articles.json"
MODELO = os.environ.get("LIPEDEMA360_MODELO", "claude-sonnet-5-5")

AREAS = ["cirurgia", "nutricao", "fisioterapia", "diagnostico", "genetica", "psicossocial", "epidemiologia"]

PROMPT = """Voce e editor cientifico do Lipedema360, boletim para medicos, nutricionistas e
fisioterapeutas brasileiros. Leia o artigo abaixo (titulo e abstract em ingles) e
responda SOMENTE com um JSON valido, sem markdown, com estas chaves:

- "titulo_pt": traducao fiel do titulo, em portugues do Brasil.
- "resumo_pt": 3 a 5 frases, linguagem tecnica entre pares, com numeros do estudo
  (n, efeito, p, IC) quando existirem. Nao invente dados ausentes.
- "pontos_chave": lista de 3 frases curtas com os achados principais.
- "relevancia_clinica": 1 ou 2 frases sobre o que muda (ou nao) na pratica, e as limitacoes.
- "area": uma destas: {areas}.
- "destaque": true se for diretriz, metanalise, RCT, ou estudo original com impacto
  claro na pratica; false para cartas, relatos de caso e revisoes narrativas comuns.

Artigo:
Titulo: {titulo}
Revista: {revista} ({data})
Tipo: {tipos}
Abstract: {abstract}
"""


def main():
    chave = os.environ.get("ANTHROPIC_API_KEY")
    if not chave:
        print("ANTHROPIC_API_KEY nao definida: pulando resumos em portugues.")
        return
    try:
        import anthropic
    except ImportError:
        print("Instale o SDK: pip install anthropic")
        sys.exit(1)

    limite = 40
    if "--limite" in sys.argv:
        limite = int(sys.argv[sys.argv.index("--limite") + 1])

    artigos = json.loads(DATA.read_text(encoding="utf-8"))
    pendentes = [a for a in artigos if not a.get("resumo_pt") and a.get("resumo_original")]
    pendentes.sort(key=lambda a: (a["data"], a["peso"]), reverse=True)  # mais recentes e fortes primeiro
    print(f"{len(pendentes)} artigos sem resumo; processando ate {limite}")

    cliente = anthropic.Anthropic(api_key=chave)
    feitos = 0
    for a in pendentes[:limite]:
        prompt = PROMPT.format(areas=", ".join(AREAS), titulo=a["titulo"], revista=a["revista"],
                               data=a["data"], tipos=", ".join(a["tipos_publicacao"]),
                               abstract=a["resumo_original"][:6000])
        for tentativa in range(3):
            try:
                resp = cliente.messages.create(model=MODELO, max_tokens=1200,
                                               messages=[{"role": "user", "content": prompt}])
                texto = resp.content[0].text.strip()
                if texto.startswith("```"):
                    texto = texto.strip("`").replace("json\n", "", 1)
                dados = json.loads(texto)
                a["titulo_pt"] = dados.get("titulo_pt", "")
                a["resumo_pt"] = dados.get("resumo_pt", "")
                a["pontos_chave"] = dados.get("pontos_chave", [])
                a["relevancia_clinica"] = dados.get("relevancia_clinica", "")
                if dados.get("area") in AREAS:
                    a["area_ia"] = dados["area"]
                    a["area"] = dados["area"]
                a["destaque"] = bool(dados.get("destaque", False))
                feitos += 1
                print(f"  ok  {a['pmid']}  {a['titulo'][:70]}")
                break
            except Exception as e:  # noqa: BLE001
                print(f"  erro ({tentativa + 1}/3) {a['pmid']}: {e}")
                time.sleep(3)
        DATA.write_text(json.dumps(artigos, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{feitos} resumos gerados.")


if __name__ == "__main__":
    main()
