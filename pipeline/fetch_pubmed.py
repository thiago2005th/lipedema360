"""
Lipedema360 - Coletor de artigos do PubMed.

Busca todos os artigos sobre lipedema no PubMed (API gratuita E-utilities),
extrai titulo, resumo, autores, revista, data, DOI, tipo de publicacao,
classifica por area clinica e salva em data/articles.json.

Roda sem chave de API. Uso:
    python pipeline/fetch_pubmed.py            # busca so o que e novo (ultimos 60 dias)
    python pipeline/fetch_pubmed.py --tudo     # recarrega a base inteira
"""
import json
import re
import sys
import time
import datetime as dt
import xml.etree.ElementTree as ET
from pathlib import Path

import requests

BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
QUERY = '("lipedema"[Title/Abstract] OR "lipoedema"[Title/Abstract] OR "lipedema"[MeSH Terms])'
DATA = Path(__file__).resolve().parent.parent / "data" / "articles.json"
TOOL = {"tool": "lipedema360", "email": ""}  # NCBI pede identificacao; email opcional

MESES = {"Jan": 1, "Feb": 2, "Mar": 3, "Apr": 4, "May": 5, "Jun": 6,
         "Jul": 7, "Aug": 8, "Sep": 9, "Oct": 10, "Nov": 11, "Dec": 12}

# Areas clinicas. A area com mais palavras-chave encontradas vence.
AREAS = [
    ("cirurgia", "Cirurgia e lipoaspiração",
     ["liposuction", "lipectomy", "surgical", "surgery", "tumescent", "water-jet", "water jet", "power-assisted"]),
    ("nutricao", "Nutrição e metabolismo",
     ["diet", "nutrition", "ketogenic", "keto", "nutritional", "supplement", "weight loss", "glp-1",
      "semaglutide", "tirzepatide", "metabolic", "insulin"]),
    ("fisioterapia", "Tratamento conservador e fisioterapia",
     ["compression", "manual lymphatic", "physiotherapy", "physical therapy", "exercise", "rehabilitation",
      "conservative", "garment", "pneumatic", "aquatic"]),
    ("diagnostico", "Diagnóstico e imagem",
     ["diagnos", "ultrasound", "ultrasonograph", "mri", "magnetic resonance", "lymphoscintigraphy", "imaging",
      "dexa", "bioimpedance", "questionnaire", "screening", "criteria", "differential", "score",
      "classification", "staging"]),
    ("genetica", "Genética e fisiopatologia",
     ["gene", "genetic", "genom", "mutation", "variant", "pathophysiolog", "adipocyte", "adipose tissue",
      "inflammat", "estrogen", "hormon", "fibrosis", "lymphatic vessel", "capillar", "histolog", "biomarker",
      "proteom", "transcriptom", "mouse", "mice", "in vitro"]),
    ("psicossocial", "Qualidade de vida e saúde mental",
     ["quality of life", "psycholog", "depression", "anxiety", "mental health", "stigma", "body image",
      "eating disorder", "social"]),
    ("epidemiologia", "Epidemiologia e clínica",
     ["prevalence", "incidence", "epidemiolog", "cohort", "registry", "population", "comorbid", "obesity",
      "lymphedema", "lipo-lymphedema"]),
]

TIPOS = [
    ("guideline", "Diretriz / consenso", ["Practice Guideline", "Guideline", "Consensus Development Conference"]),
    ("meta", "Metanálise / revisão sistemática", ["Meta-Analysis", "Systematic Review"]),
    ("rct", "Ensaio clínico randomizado", ["Randomized Controlled Trial"]),
    ("ensaio", "Ensaio clínico", ["Clinical Trial", "Clinical Trial, Phase I", "Clinical Trial, Phase II",
                                  "Clinical Trial, Phase III"]),
    ("revisao", "Revisão", ["Review"]),
    ("caso", "Relato de caso", ["Case Reports"]),
    ("carta", "Carta / editorial / comentário", ["Letter", "Editorial", "Comment"]),
    ("observacional", "Estudo original", ["Journal Article", "Observational Study", "Comparative Study",
                                           "Multicenter Study", "Validation Study"]),
]

# Peso para ordenar destaques: evidencia mais forte primeiro.
PESO_TIPO = {"guideline": 100, "meta": 90, "rct": 85, "ensaio": 70, "observacional": 50,
             "revisao": 45, "caso": 20, "carta": 10}


def get(url, params, tries=4):
    params = {**params, **{k: v for k, v in TOOL.items() if v}}
    for i in range(tries):
        try:
            r = requests.get(url, params=params, timeout=60)
            if r.status_code == 200:
                return r
            print(f"  aviso: HTTP {r.status_code}, tentando de novo...")
        except requests.RequestException as e:
            print(f"  aviso: {e}, tentando de novo...")
        time.sleep(2 * (i + 1))
    raise RuntimeError("PubMed nao respondeu")


def buscar_ids(dias=None):
    params = {"db": "pubmed", "term": QUERY, "retmax": 10000, "retmode": "json"}
    if dias:
        hoje = dt.date.today()
        params.update({"datetype": "edat",
                       "mindate": (hoje - dt.timedelta(days=dias)).strftime("%Y/%m/%d"),
                       "maxdate": hoje.strftime("%Y/%m/%d")})
    r = get(f"{BASE}/esearch.fcgi", params)
    return r.json()["esearchresult"]["idlist"]


def texto(el):
    if el is None:
        return ""
    return "".join(el.itertext()).strip()


def data_pub(art):
    pd = art.find(".//Journal/JournalIssue/PubDate")
    ad = art.find(".//ArticleDate")
    for node in (ad, pd):
        if node is None:
            continue
        y = texto(node.find("Year"))
        m = texto(node.find("Month")) or "1"
        d = texto(node.find("Day")) or "1"
        if not y:
            md = texto(node.find("MedlineDate"))
            anos = re.findall(r"\d{4}", md)
            y = anos[0] if anos else ""
            m, d = "1", "1"
        if y:
            try:
                mm = int(m) if m.isdigit() else MESES.get(m[:3], 1)
                return dt.date(int(y), mm, int(d)).isoformat()
            except ValueError:
                return f"{y}-01-01"
    return ""


def classificar_area(txt):
    t = txt.lower()
    pontos = {chave: sum(t.count(k) for k in kws) for chave, _, kws in AREAS}
    melhor = max(pontos, key=pontos.get)
    return melhor if pontos[melhor] > 0 else "epidemiologia"


def classificar_tipo(pubtypes, titulo):
    pts = set(pubtypes)
    for chave, _, lista in TIPOS:
        if pts & set(lista):
            if chave == "revisao" and re.search(r"systematic|meta-analy", titulo, re.I):
                return "meta"
            return chave
    return "observacional"


def iniciais(nome):
    return "".join(p[0] for p in nome.split() if p)


def parse(xml_text):
    root = ET.fromstring(xml_text)
    out = []
    for pa in root.findall("PubmedArticle"):
        mc = pa.find("MedlineCitation")
        art = mc.find("Article")
        pmid = texto(mc.find("PMID"))
        titulo = texto(art.find("ArticleTitle")).rstrip(".")
        partes = []
        for ab in art.findall(".//Abstract/AbstractText"):
            label = ab.get("Label")
            t = texto(ab)
            partes.append(f"{label}: {t}" if label else t)
        resumo = "\n".join(partes)
        autores = []
        for a in art.findall(".//AuthorList/Author"):
            ln, fn, col = texto(a.find("LastName")), texto(a.find("ForeName")), texto(a.find("CollectiveName"))
            if ln:
                autores.append(f"{ln} {iniciais(fn)}".strip())
            elif col:
                autores.append(col)
        doi, pmcid = "", ""
        for aid in pa.findall(".//ArticleIdList/ArticleId"):
            if aid.get("IdType") == "doi":
                doi = texto(aid)
            elif aid.get("IdType") == "pmc":
                pmcid = texto(aid)
        pubtypes = [texto(p) for p in art.findall(".//PublicationTypeList/PublicationType")]
        keywords = [texto(k) for k in mc.findall(".//KeywordList/Keyword")]
        mesh = [texto(m.find("DescriptorName")) for m in mc.findall(".//MeshHeadingList/MeshHeading")]
        revista = texto(art.find(".//Journal/Title"))
        idioma = texto(art.find("Language"))
        tipo = classificar_tipo(pubtypes, titulo)
        area = classificar_area(" ".join([titulo, resumo] + keywords + mesh))
        out.append({
            "pmid": pmid,
            "titulo": titulo,
            "resumo_original": resumo,
            "autores": autores,
            "revista": revista,
            "data": data_pub(art),
            "doi": doi,
            "pmcid": pmcid,
            "idioma": idioma,
            "tipos_publicacao": pubtypes,
            "keywords": keywords,
            "mesh": mesh,
            "tipo": tipo,
            "area": area,
            "peso": PESO_TIPO.get(tipo, 30) + (10 if resumo else 0),
            "url": f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/",
        })
    return out


def baixar(ids):
    artigos = []
    for i in range(0, len(ids), 100):
        lote = ids[i:i + 100]
        r = get(f"{BASE}/efetch.fcgi", {"db": "pubmed", "id": ",".join(lote), "retmode": "xml"})
        artigos.extend(parse(r.text))
        print(f"  baixados {min(i + 100, len(ids))}/{len(ids)}")
        time.sleep(0.4)  # limite do NCBI: 3 requisicoes por segundo sem chave
    return artigos


CAMPOS_IA = ("titulo_pt", "resumo_pt", "pontos_chave", "relevancia_clinica", "area_ia", "destaque")


def main():
    tudo = "--tudo" in sys.argv
    base = {}
    if DATA.exists() and not tudo:
        base = {a["pmid"]: a for a in json.loads(DATA.read_text(encoding="utf-8"))}
    print("Buscando ids no PubMed...")
    ids = buscar_ids(None if tudo or not base else 60)
    novos = ids if tudo else [i for i in ids if i not in base]
    print(f"{len(ids)} encontrados, {len(novos)} para baixar")
    if novos:
        for a in baixar(novos):
            antigo = base.get(a["pmid"], {})
            for k in CAMPOS_IA:  # preserva o que a IA ja gerou
                if k in antigo:
                    a[k] = antigo[k]
            a["coletado_em"] = antigo.get("coletado_em") or dt.date.today().isoformat()
            base[a["pmid"]] = a
    lista = sorted(base.values(), key=lambda a: (a["data"], a["pmid"]), reverse=True)
    DATA.parent.mkdir(exist_ok=True)
    DATA.write_text(json.dumps(lista, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"Base salva: {len(lista)} artigos em {DATA}")


if __name__ == "__main__":
    main()
