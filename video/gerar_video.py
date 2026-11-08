"""Gera vídeos de divulgação do Lipedema360 SEM apresentador:
site em funcionamento (gravado automaticamente) + narração automática em português.

Uso:  python video/gerar_video.py gratis
Saída: video/saida/<nome>.mp4  (vertical 1080x1920, com legendas e título)
"""
import asyncio, os, re, subprocess, sys, textwrap, time, shutil
import edge_tts, imageio_ffmpeg
from playwright.sync_api import sync_playwright

RAIZ = os.path.dirname(os.path.abspath(__file__))
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
SITE = os.environ.get("SITE", "https://www.lipedema360.com.br")
VOZ = os.environ.get("VOZ", "pt-BR-FranciscaNeural")
W, H = 1280, 720          # tamanho da gravação do site
OW, OH = 1080, 1920       # vídeo final (vertical: Reels, Stories, Feed)

# ------------------------------------------------------------------ ações na tela
def rolar(pg, px, seg):
    pg.evaluate("""([px, ms]) => new Promise(r => { const y0 = scrollY, t0 = performance.now();
      const f = t => { const k = Math.min(1, (t - t0) / ms), e = k < .5 ? 2*k*k : 1 - Math.pow(-2*k + 2, 2) / 2;
        scrollTo(0, y0 + px * e); k < 1 ? requestAnimationFrame(f) : r(); }; requestAnimationFrame(f); })""", [px, int(seg * 1000)])

def mover(pg, x, y, passos=40):
    pg.mouse.move(x, y, steps=passos)

def varrer_mouse(pg, seg):
    """passeia o mouse pela animação da capa"""
    t0 = time.time(); pts = [(900, 200), (1100, 300), (1000, 450), (800, 380), (1150, 160), (950, 560)]
    i = 0
    while time.time() - t0 < seg:
        x, y = pts[i % len(pts)]; mover(pg, x, y, 45); pg.wait_for_timeout(250); i += 1

def ir(pg, caminho):
    pg.goto(SITE + caminho, wait_until="networkidle"); pg.wait_for_timeout(700)

def esperar_resto(t0, seg, pg):
    sobra = seg - (time.time() - t0)
    if sobra > 0: pg.wait_for_timeout(int(sobra * 1000))

# cada cena: (título na tela, narração, função(pg, duração))
def c_abertura(pg, d):
    ir(pg, "/"); t0 = time.time(); varrer_mouse(pg, d - 0.3); esperar_resto(t0, d, pg)

def c_home(pg, d):
    t0 = time.time(); varrer_mouse(pg, d - 0.3); esperar_resto(t0, d, pg)

def c_busca(pg, d):
    t0 = time.time(); ir(pg, "/")
    pg.click("#q"); pg.keyboard.type("compressão", delay=130); pg.wait_for_timeout(500)
    pg.keyboard.press("Enter"); pg.wait_for_load_state("networkidle"); pg.wait_for_timeout(1200)
    rolar(pg, 520, max(2.0, d - (time.time() - t0) - 0.4)); esperar_resto(t0, d, pg)

def c_resumo(pg, d):
    t0 = time.time()
    pg.evaluate("scrollTo(0,0)"); pg.wait_for_timeout(600)
    pg.click("a[href^='/artigos/']"); pg.wait_for_load_state("networkidle"); pg.wait_for_timeout(1200)
    rolar(pg, 700, max(2.0, d - (time.time() - t0) - 0.4)); esperar_resto(t0, d, pg)

def c_evidencia(pg, d):
    t0 = time.time(); ir(pg, "/destaques"); rolar(pg, 900, max(2.0, d - (time.time() - t0) - 0.4)); esperar_resto(t0, d, pg)

def c_comparar(pg, d):
    t0 = time.time(); ir(pg, "/busca?q=compress%C3%A3o"); pg.wait_for_timeout(800)
    for i in range(3):
        pg.locator("button.comparar").nth(i).scroll_into_view_if_needed(); pg.locator("button.comparar").nth(i).click(); pg.wait_for_timeout(500)
    ir(pg, "/comparar"); pg.wait_for_timeout(500)
    rolar(pg, 600, max(2.0, d - (time.time() - t0) - 0.4)); esperar_resto(t0, d, pg)

def c_areas(pg, d):
    t0 = time.time(); ir(pg, "/areas"); rolar(pg, 500, max(2.0, d - (time.time() - t0) - 0.4)); esperar_resto(t0, d, pg)

def c_alertas(pg, d):
    t0 = time.time(); ir(pg, "/alertas"); rolar(pg, 600, max(2.0, d - (time.time() - t0) - 0.4)); esperar_resto(t0, d, pg)

def c_boletim(pg, d):
    t0 = time.time(); ir(pg, "/boletim"); rolar(pg, 700, max(2.0, d - (time.time() - t0) - 0.4)); esperar_resto(t0, d, pg)

def c_final(pg, d):
    t0 = time.time(); ir(pg, "/"); varrer_mouse(pg, d - 0.3); esperar_resto(t0, d, pg)

def c_premium(pg, d):
    t0 = time.time(); ir(pg, "/premium"); rolar(pg, 1500, max(2.0, d - (time.time() - t0) - 0.4)); esperar_resto(t0, d, pg)

VIDEOS = {
    "gratis": [
        ("O lipedema ainda é pouco estudado", "O lipedema ainda é uma doença com poucos estudos, e o conhecimento sobre ela está crescendo agora. Quem atende precisa saber de tudo o que sai, o quanto antes.", c_abertura),
        ("Todos os estudos em um só lugar", "O Lipedema360 reúne em um só lugar os estudos sobre lipedema publicados no PubMed. São mais de oitocentos, com atualização todos os dias.", c_home),
        ("Busca por tema, técnica ou autor", "Pesquise por tema, técnica ou autor. E filtre por área, tipo de estudo e data.", c_busca),
        ("Resumo em português e nível de evidência", "Cada estudo vem com resumo em português e nível de evidência, das diretrizes aos relatos de caso. Você sabe rápido o que merece leitura completa.", c_resumo),
        ("Só a melhor evidência", "Quer só o que há de mais sólido? A página Melhor evidência reúne diretrizes, consensos, metanálises e ensaios clínicos randomizados.", c_evidencia),
        ("Compare até três estudos", "Marque até três estudos e compare desenho, população e resultados lado a lado, na mesma tela.", c_comparar),
        ("Sete áreas clínicas", "Os estudos são organizados em sete áreas clínicas, como cirurgia, nutrição, tratamento conservador e diagnóstico.", c_areas),
        ("Alertas por área", "Escolha a sua área e receba cada estudo novo no seu leitor de feeds, sem precisar procurar.", c_alertas),
        ("Boletim semanal", "E toda semana, um boletim com o que entrou no PubMed, com a evidência mais forte primeiro.", c_boletim),
        ("lipedema360.com.br · grátis", "Tudo isso é gratuito. Acesse lipedema360 ponto com ponto br, e acompanhe a ciência do lipedema em foco.", c_final),
    ],
    "premium": [
        ("Do estudo à decisão clínica", "Ler o estudo é o começo. Decidir com ele é o que importa na consulta. O Lipedema360 Profissional foi feito para isso.", c_premium),
    ],
}

# ------------------------------------------------------------------ narração e montagem
async def gerar_audio(texto, caminho):
    await edge_tts.Communicate(texto, VOZ, rate="-4%").save(caminho)

def duracao(caminho):
    r = subprocess.run([FFMPEG, "-hide_banner", "-i", caminho], capture_output=True, text=True)
    m = re.search(r"Duration: (\d+):(\d+):([\d.]+)", r.stderr)
    return int(m[1]) * 3600 + int(m[2]) * 60 + float(m[3])

def quebrar(txt, largura):
    return "\n".join(textwrap.wrap(txt, largura))

def principal(nome):
    cenas = VIDEOS[nome]
    trab = os.path.join(RAIZ, "trabalho", nome); saida = os.path.join(RAIZ, "saida")
    shutil.rmtree(trab, ignore_errors=True); os.makedirs(trab); os.makedirs(saida, exist_ok=True)
    durs = []
    for i, (_, fala, _) in enumerate(cenas):
        a = os.path.join(trab, f"a{i}.mp3"); asyncio.run(gerar_audio(fala, a)); durs.append(duracao(a) + 0.55)
    print("durações:", [round(d, 1) for d in durs], "total", round(sum(durs), 1), "s")

    inicios = []
    with sync_playwright() as p:
        b = p.chromium.launch()
        ctx = b.new_context(viewport={"width": W, "height": H}, record_video_dir=trab, record_video_size={"width": W, "height": H}, locale="pt-BR")
        ctx.add_init_script("""
          addEventListener('DOMContentLoaded', () => {
            const c = document.createElement('div');
            c.style.cssText = 'position:fixed;z-index:2147483647;width:22px;height:22px;border-radius:50%;background:rgba(232,206,152,.55);border:2px solid #e8ce98;pointer-events:none;left:-50px;top:-50px;transform:translate(-50%,-50%)';
            document.documentElement.appendChild(c);
            addEventListener('mousemove', e => { c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px'; }, true);
          });""")
        pg = ctx.new_page(); t_ctx = time.time()
        pg.goto(SITE + "/", wait_until="networkidle"); pg.wait_for_timeout(1500)
        for (_, _, fn), d in zip(cenas, durs):
            inicios.append(time.time() - t_ctx); fn(pg, d)
        fim = time.time() - t_ctx
        webm = pg.video.path(); ctx.close(); b.close()
    base = inicios[0]
    print("início da 1ª cena:", round(base, 1), "s; fim:", round(fim, 1), "s")

    # textos das cenas
    flt = ["color=c=0x0c0c0d:s=%dx%d:r=30[bg]" % (OW, OH), "[0:v]scale=%d:-2,setsar=1[v]" % OW,
           "[bg][v]overlay=0:(H-h)/2-40:shortest=1[b0]"]
    ult = "b0"; n = 0
    for i, ((tit, fala, _), t0) in enumerate(zip(cenas, inicios)):
        ini, fi = t0 - base, t0 - base + durs[i]
        open(os.path.join(trab, f"t{i}.txt"), "w", encoding="utf-8").write(quebrar(tit, 20))
        open(os.path.join(trab, f"l{i}.txt"), "w", encoding="utf-8").write(quebrar(fala, 34))
        for nm, fs, y, cor in ((f"t{i}.txt", 88, 230, "0xf2ede5"), (f"l{i}.txt", 44, 1340, "0xd9d3c9")):
            n += 1
            flt.append(f"[{ult}]drawtext=fontfile=fonte.ttf:textfile={nm}:fontsize={fs}:fontcolor={cor}:x=(w-text_w)/2:y={y}:line_spacing=-6:box=0:"
                       f"enable='between(t,{ini:.2f},{fi:.2f})'[b{n}]")
            ult = f"b{n}"
    flt.append(f"[{ult}]drawtext=fontfile=fonte.ttf:text='lipedema360.com.br':fontsize=38:fontcolor=0xc9a66b:x=(w-text_w)/2:y=1830[vf]")
    # áudio: cada narração no seu instante
    ent = ["-ss", f"{base:.2f}", "-i", webm]
    for i in range(len(cenas)): ent += ["-i", os.path.join(trab, f"a{i}.mp3")]
    aud = []
    for i, t0 in enumerate(inicios):
        ms = int((t0 - base + 0.15) * 1000); aud.append(f"[{i+1}:a]adelay={ms}|{ms}[s{i}]")
    flt += aud; flt.append("".join(f"[s{i}]" for i in range(len(cenas))) + f"amix=inputs={len(cenas)}:normalize=0[af]")
    shutil.copy("C:/Windows/Fonts/georgia.ttf", os.path.join(trab, "fonte.ttf"))
    open(os.path.join(trab, "filtro.txt"), "w", encoding="utf-8").write(";\n".join(flt))
    out = os.path.join(saida, f"lipedema360-{nome}.mp4")
    cmd = [FFMPEG, "-y", "-hide_banner", "-loglevel", "error"] + ent + ["-filter_complex_script", "filtro.txt", "-map", "[vf]", "-map", "[af]",
           "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-t", f"{sum(durs)+0.3:.2f}", out]
    r = subprocess.run(cmd, cwd=trab, capture_output=True, text=True)
    print(r.stderr[-2000:] or "ok"); print(out)

if __name__ == "__main__":
    principal(sys.argv[1] if len(sys.argv) > 1 else "gratis")
