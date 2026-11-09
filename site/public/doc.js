/* Documentos profissionais das ferramentas: timbre da clínica (logo, nome, registro),
   gráficos em SVG e impressão / PDF. Tudo roda no navegador; o timbre fica salvo neste navegador. */
(function () {
  var KP = 'l360_perfil';
  function lerPerfil() { try { return JSON.parse(localStorage.getItem(KP) || '{}') || {}; } catch (e) { return {}; } }
  function gravarPerfil(p) { try { localStorage.setItem(KP, JSON.stringify(p)); return true; } catch (e) { return false; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fm(n) { return String(Math.round(n * 100) / 100).replace('.', ','); }

  /* ---------- gráficos (mesmo desenho do servidor, src/lib/svg.ts) ---------- */
  function barras(linhas, W) {
    W = W || 560;
    var rh = 38, top = 8, bx = 190, bw = W - bx - 110, h = top + linhas.length * rh + 8;
    var s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + h + '" width="100%" role="img" font-family="Instrument Sans,Segoe UI,Arial,sans-serif">';
    linhas.forEach(function (l, i) {
      var y = top + i * rh, mx = l.max || Math.max(l.valor, l.corte) * 1.3 || 1;
      var sc = l.corte != null, vw = Math.max(2, Math.min(1, l.valor / mx) * bw), cx = sc ? Math.min(1, l.corte / mx) * bw : 0, un = l.un || '';
      s += '<text x="0" y="' + (y + 17) + '" font-size="12" fill="#333">' + esc(l.rotulo) + '</text>';
      s += '<rect x="' + bx + '" y="' + (y + 6) + '" width="' + bw + '" height="14" rx="2" fill="#ece8e1"/>';
      s += '<rect x="' + bx + '" y="' + (y + 6) + '" width="' + vw + '" height="14" rx="2" fill="' + (!sc || l.valor >= l.corte ? '#8a6d3b' : '#8c939b') + '"/>';
      if (sc) s += '<line x1="' + (bx + cx) + '" x2="' + (bx + cx) + '" y1="' + (y + 1) + '" y2="' + (y + 25) + '" stroke="#1d1a16" stroke-width="2"/>';
      s += '<text x="' + (bx + bw + 8) + '" y="' + (y + 14) + '" font-size="12" font-weight="600" fill="#1d1a16">' + fm(l.valor) + un + '</text>';
      if (sc) s += '<text x="' + (bx + bw + 8) + '" y="' + (y + 27) + '" font-size="10" fill="#6b645b">corte ' + fm(l.corte) + un + '</text>';
    });
    return s + '</svg>';
  }

  /* evolução entre visitas: séries na mesma escala (mesmo desenho de src/lib/svg.ts) */
  function linhas(datas, series, W, H, un) {
    W = W || 560; H = H || 200; un = un || '';
    var pl = 40, pr = 16, pt = 14, pb = 34, todos = [];
    series.forEach(function (s) { todos = todos.concat(s.pontos.filter(function (v) { return v != null; })); });
    if (!todos.length) return '';
    var mn = Math.floor(Math.min.apply(null, todos) - 1), mx = Math.ceil(Math.max.apply(null, todos) + 1);
    function X(i) { return pl + (datas.length === 1 ? 0 : i * (W - pl - pr) / (datas.length - 1)); }
    function Y(v) { return pt + (1 - (v - mn) / (mx - mn)) * (H - pt - pb); }
    var s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" width="100%" role="img" font-family="Instrument Sans,Segoe UI,Arial,sans-serif">';
    for (var k = 0; k <= 3; k++) { var v = mn + (mx - mn) * k / 3; s += '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" stroke="#e6e1d8"/><text x="' + (pl - 6) + '" y="' + (Y(v) + 4) + '" font-size="10" text-anchor="end" fill="#6b645b">' + fm(v) + '</text>'; }
    datas.forEach(function (d, i) { s += '<text x="' + X(i) + '" y="' + (H - 12) + '" font-size="10" text-anchor="middle" fill="#6b645b">' + esc(d) + '</text>'; });
    var cores = ['#8a6d3b', '#3f5f73', '#7a4b5f', '#5b7a4a'];
    series.forEach(function (sr, k) {
      var c = cores[k % cores.length], d = '', ult = -1;
      sr.pontos.forEach(function (v, i) { if (v == null) return; d += (d ? 'L' : 'M') + X(i) + ',' + Y(v); ult = i; s += '<circle cx="' + X(i) + '" cy="' + Y(v) + '" r="3.4" fill="' + c + '"/>'; });
      s += '<path d="' + d + '" fill="none" stroke="' + c + '" stroke-width="2"/>';
      if (ult >= 0) s += '<text x="' + (X(ult) - 4) + '" y="' + (Y(sr.pontos[ult]) - 8) + '" font-size="10" text-anchor="end" fill="' + c + '" font-weight="600">' + esc(sr.nome) + ' ' + fm(sr.pontos[ult]) + un + '</text>';
    });
    return s + '</svg>';
  }

  /* ---------- timbre: painel de edição ---------- */
  function reduzir(arquivo, cb) {
    var r = new FileReader();
    r.onload = function () {
      var im = new Image();
      im.onload = function () {
        var k = Math.min(1, 400 / Math.max(im.width, im.height)), c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(im.width * k)); c.height = Math.max(1, Math.round(im.height * k));
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        cb(c.toDataURL('image/png'));
      };
      im.onerror = function () { cb(null); };
      im.src = r.result;
    };
    r.onerror = function () { cb(null); };
    r.readAsDataURL(arquivo);
  }

  function iniciarPainel() {
    var box = document.getElementById('timbre');
    if (!box) return;
    var campos = { clinica: 'pf-clinica', profissional: 'pf-prof', registro: 'pf-reg', contato: 'pf-contato' };
    var p = lerPerfil(), msg = document.getElementById('pf-msg');
    Object.keys(campos).forEach(function (k) {
      var el = document.getElementById(campos[k]); el.value = p[k] || '';
      el.addEventListener('input', function () {
        var q = lerPerfil(); q[k] = el.value; gravarPerfil(q);
        msg.textContent = 'Salvo neste navegador'; resumo();
      });
    });
    var img = document.getElementById('pf-logo-img'), rm = document.getElementById('pf-logo-rm');
    function mostrarLogo() { var q = lerPerfil(); img.hidden = !q.logo; if (q.logo) img.src = q.logo; rm.hidden = !q.logo; resumo(); }
    function resumo() {
      var q = lerPerfil(), el = document.getElementById('pf-resumo');
      el.textContent = q.clinica || q.profissional || q.logo ? '· ' + (q.clinica || q.profissional) : '· ainda não configurado';
    }
    document.getElementById('pf-logo').addEventListener('change', function () {
      var f = this.files && this.files[0]; if (!f) return;
      reduzir(f, function (d) {
        if (!d) { msg.textContent = 'Não consegui ler essa imagem. Use PNG, JPG ou SVG.'; return; }
        var q = lerPerfil(); q.logo = d;
        msg.textContent = gravarPerfil(q) ? 'Logo salvo neste navegador' : 'Imagem grande demais para salvar. Tente uma menor.';
        mostrarLogo();
      });
    });
    rm.addEventListener('click', function () { var q = lerPerfil(); delete q.logo; gravarPerfil(q); msg.textContent = 'Logo removido'; mostrarLogo(); });
    mostrarLogo();
  }

  /* ---------- montar e imprimir a folha ---------- */
  var CHAVE = { 'criterios-diagnosticos': 'criterios', 'classificacao': 'classificacao', 'diferencial': 'diferencial', 'antropometria': 'antropometria', 'laudo-ultrassom': 'ultrassom', 'plano-terapeutico': 'plano', 'seguimento': 'seguimento', 'instrumentos': 'escores_texto' };

  function textoDaFerramenta() {
    var tt = window.l360tool || {};
    if (tt.textoImpressao) { var ti = tt.textoImpressao(); if (ti && ti.trim()) return ti.trim(); }
    var ta = document.querySelector('textarea.texto-saida');
    if (ta && ta.value.trim()) return ta.value.trim();
    var slug = (window.l360tool || {}).slug, c = window.l360caso ? window.l360caso.get() : {}, v = c[CHAVE[slug]];
    return v ? (typeof v === 'string' ? v : v.texto || '') : '';
  }

  function folha(o) {
    var p = lerPerfil(), pac = null;
    try { pac = window.l360pac && window.l360pac.atual && window.l360pac.atual(); } catch (e) {}
    var hoje = new Date().toLocaleDateString('pt-BR');
    var temCab = p.logo || p.clinica || p.profissional || p.contato;
    var h = '<div class="folha">';
    if (temCab) {
      h += '<div class="fo-cab">' + (p.logo ? '<img class="fo-logo" src="' + p.logo + '" alt="">' : '') +
        '<div>' + (p.clinica ? '<div class="fo-clin">' + esc(p.clinica) + '</div>' : '') +
        (p.profissional ? '<div class="fo-prof">' + esc(p.profissional) + (p.registro ? ' · ' + esc(p.registro) : '') + '</div>' : '') +
        (p.contato ? '<div class="fo-ct">' + esc(p.contato) + '</div>' : '') + '</div></div>';
    }
    h += '<h4>' + esc(o.titulo) + '</h4>';
    h += '<div class="fo-meta"><span><b>Data:</b> ' + hoje + '</span>' + (pac && pac.nome ? '<span><b>Paciente:</b> ' + esc(pac.nome) + (pac.codigo ? ' (código ' + esc(pac.codigo) + ')' : '') + '</span>' : '') + '</div>';
    if (o.grafico) h += '<h6>Gráfico</h6><div>' + o.grafico + '</div>';
    h += '<h6>' + esc(o.rotuloTexto || 'Resultado') + '</h6><div class="fo-texto">' + esc(o.texto) + '</div>';
    if (o.assinatura !== false) h += '<div class="fo-assin">' + esc(p.profissional || 'Assinatura do profissional') + (p.registro ? ' · ' + esc(p.registro) : '') + '</div>';
    var refs = Array.prototype.map.call(document.querySelectorAll('.ferr-lado .fonte-box:first-child li'), function (li) { var e = li.cloneNode(true); var em = e.querySelector('em'); if (em) em.remove(); return e.textContent.trim(); });
    h += '<div class="fo-rod">' + (refs.length ? '<b>Referências:</b><ul>' + refs.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') + '</ul>' : '') +
      'Ferramenta de apoio à decisão clínica; não substitui o julgamento do profissional. Gerado em Lipedema360 Profissional (lipedema360.com.br).</div>';
    return h + '</div>';
  }

  function imprimir(o) {
    var no = document.getElementById('doc-folha');
    if (!no) { no = document.createElement('div'); no.id = 'doc-folha'; document.body.appendChild(no); }
    no.innerHTML = folha(o);
    setTimeout(function () { window.print(); }, 60);
  }

  function imprimirFerramenta() {
    var t = window.l360tool || {}, titulo = (document.querySelector('.ferr-main h1') || {}).textContent || 'Documento';
    var texto = textoDaFerramenta();
    if (!texto) { alert('Preencha a ferramenta antes de imprimir: ainda não há resultado para o documento.'); return; }
    var g = ''; try { g = t.grafico ? t.grafico() : (window.l360grafico ? window.l360grafico() : ''); } catch (e) {}
    imprimir({ titulo: titulo.trim(), texto: texto, grafico: g, rotuloTexto: slugRotulo(t.slug) });
  }
  function slugRotulo(s) { return s === 'laudo-ultrassom' ? 'Laudo' : s === 'nota-consulta' ? 'Nota de consulta' : 'Resultado'; }

  function iniciar() {
    iniciarPainel();
    // botões "Imprimir" existentes passam a gerar o documento com timbre
    document.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('#b-imprimir, #doc-pdf');
      if (!b) return;
      e.preventDefault(); e.stopImmediatePropagation(); imprimirFerramenta();
    }, true);
    var ex = document.getElementById('b-imprimir'); if (ex) ex.textContent = 'Imprimir / salvar PDF';
    var barra = document.getElementById('doc-bar'); if (barra && ex) barra.hidden = true;
  }

  window.l360doc = { perfil: lerPerfil, barras: barras, linhas: linhas, imprimir: imprimir, imprimirFerramenta: imprimirFerramenta };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
