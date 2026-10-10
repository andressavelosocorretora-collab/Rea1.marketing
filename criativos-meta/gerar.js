/*
 * Gera as imagens dos anúncios (PNG) a partir de HTML.
 * Uso: node gerar.js   (requer o pacote "playwright")
 * Para mudar textos, edite os blocos abaixo e rode de novo.
 */
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const MARCA = "Demais Consultoria";
const RODAPE = "Valores variam conforme idade, região, operadora e tipo de contratação.";

const ICON = {
  logo: '<svg viewBox="0 0 48 48" width="56" height="56"><rect width="48" height="48" rx="14" fill="#f4a259"/><path d="M20 12h8v8h8v8h-8v8h-8v-8h-8v-8h8z" fill="#fff"/></svg>',
  check: '<svg viewBox="0 0 24 24" width="44" height="44"><circle cx="12" cy="12" r="12" fill="#f4a259"/><path d="M7 12.5l3.2 3.2L17 9" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" width="40" height="40"><path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" stroke-width="2.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  chat: '<svg viewBox="0 0 24 24" width="42" height="42"><path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3z" fill="#fff"/><path d="M8.5 10.5h7M8.5 13.5h4.5" stroke="#1f8a4c" stroke-width="1.8" stroke-linecap="round"/></svg>',
  hosp: '<svg viewBox="0 0 64 64" width="120" height="120"><rect x="8" y="14" width="48" height="42" rx="6" fill="#fff"/><rect x="26" y="4" width="12" height="14" rx="3" fill="#fff"/><path d="M28 26h8v8h8v8h-8v8h-8v-8h-8v-8h8z" fill="#0b7a75"/></svg>',
};

const CSS = `
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Inter,sans-serif;color:#fff;-webkit-font-smoothing:antialiased}
.c{position:relative;overflow:hidden;display:flex;flex-direction:column;padding:72px 72px 56px;
  background:radial-gradient(1200px 800px at 110% -10%,#13a39c 0%,transparent 60%),linear-gradient(160deg,#0b7a75 0%,#06504c 100%)}
.c.light{background:linear-gradient(170deg,#fff7ec 0%,#ffe9cf 100%);color:#14213d}
.brand{display:flex;align-items:center;gap:18px;font-weight:800;font-size:34px;letter-spacing:-.01em}
.brand small{display:block;font-weight:600;font-size:22px;opacity:.75;letter-spacing:0}
.tag{display:inline-block;background:rgba(255,255,255,.16);border:2px solid rgba(255,255,255,.35);padding:12px 26px;border-radius:999px;font-weight:700;font-size:28px}
.light .tag{background:#0b7a75;color:#fff;border:0}
h1{font-weight:800;letter-spacing:-.035em;line-height:1.02}
h1 em{font-style:normal;color:#f4a259}
.light h1 em{color:#0b7a75}
p.sub{font-size:40px;line-height:1.3;font-weight:500;opacity:.92}
.cta{display:inline-flex;align-items:center;gap:16px;background:#f4a259;color:#14213d;font-weight:800;font-size:38px;padding:28px 44px;border-radius:999px;align-self:flex-start;box-shadow:0 14px 40px rgba(0,0,0,.18)}
.cta.wa{background:#1f8a4c;color:#fff}
.light .cta{background:#0b7a75;color:#fff}
.foot{margin-top:auto;font-size:21px;opacity:.7;font-weight:500}
.list{display:flex;flex-direction:column;gap:26px}
.list div{display:flex;gap:22px;align-items:center;font-size:40px;font-weight:600;line-height:1.2}
.list svg{flex:none}
.num{flex:none;width:84px;height:84px;border-radius:24px;background:#f4a259;color:#14213d;font-weight:800;font-size:44px;display:grid;place-items:center}
.boleto{background:#fff;color:#14213d;border-radius:28px;padding:40px 44px;box-shadow:0 30px 70px rgba(0,0,0,.28);position:relative;transform:rotate(-2.5deg)}
.boleto .l{font-size:24px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.08em}
.boleto .v{font-size:96px;font-weight:800;letter-spacing:-.03em;margin:6px 0 18px}
.boleto .v span{color:#b42318}
.boleto .bars{height:70px;background:repeating-linear-gradient(90deg,#14213d 0 4px,transparent 4px 9px,#14213d 9px 11px,transparent 11px 17px);opacity:.85;border-radius:4px}
.stamp{position:absolute;right:30px;top:34px;border:6px solid #b42318;color:#b42318;font-weight:900;font-size:40px;padding:8px 20px;border-radius:14px;transform:rotate(10deg);letter-spacing:.06em;background:rgba(255,255,255,.85)}
.pill-row{display:flex;flex-wrap:wrap;gap:16px}
.pill{background:rgba(255,255,255,.14);border-radius:18px;padding:18px 26px;font-size:30px;font-weight:700}
.light .pill{background:#fff;box-shadow:0 6px 20px rgba(20,33,61,.08)}
.blob{position:absolute;border-radius:50%;background:#f4a259;opacity:.18}
.dots{display:flex;gap:12px;margin-top:8px}.dots i{width:18px;height:18px;border-radius:50%;background:rgba(255,255,255,.35)}.dots i.on{background:#f4a259}
.light .dots i{background:rgba(20,33,61,.2)}.light .dots i.on{background:#0b7a75}
`;

const brand = (light) => `<div class="brand">${ICON.logo}<div>${MARCA}<small>Assessoria em planos de saúde</small></div></div>`;
const foot = (t = RODAPE) => `<div class="foot">${t}</div>`;
const sp = (h) => `<div style="height:${h}px;flex:none"></div>`;

const criativos = [
  // ---------- FEED 4:5 ----------
  { nome: "feed-01-boleto-reajuste", w: 1080, h: 1350, html: `<div class="c">
    <div class="blob" style="width:520px;height:520px;right:-180px;bottom:180px"></div>
    ${brand()}${sp(60)}
    <h1 style="font-size:92px">O boleto do plano de saúde <em>subiu de novo?</em></h1>${sp(56)}
    <div class="boleto"><div class="stamp">REAJUSTE</div><div class="l">Plano de saúde · mensalidade</div><div class="v">R$ <span>???</span></div><div class="bars"></div></div>${sp(60)}
    <p class="sub">Compare com outras operadoras antes de pagar.</p>${sp(36)}
    <div class="cta">Análise gratuita ${ICON.arrow}</div>
    ${foot()}</div>` },

  { nome: "feed-02-cnpj-mei", w: 1080, h: 1350, html: `<div class="c light">
    <div class="blob" style="width:600px;height:600px;right:-220px;top:-200px;opacity:.35"></div>
    ${brand(true)}${sp(90)}
    <span class="tag" style="align-self:flex-start">Para MEI e autônomos</span>${sp(34)}
    <h1 style="font-size:122px">Tem CNPJ <br>ou <em>MEI?</em></h1>${sp(40)}
    <p class="sub" style="font-size:44px">Você pode ter acesso a planos de saúde <b>empresariais</b>, que costumam ter condições diferentes do plano individual.*</p>${sp(56)}
    <div class="list">
      <div>${ICON.check} Comparação entre operadoras</div>
      <div>${ICON.check} Análise gratuita</div>
      <div>${ICON.check} Atendimento pelo WhatsApp</div>
    </div>
    ${foot("*Conforme regras e elegibilidade de cada operadora. " + RODAPE)}</div>` },

  { nome: "feed-03-empresas", w: 1080, h: 1350, html: `<div class="c">
    <div class="blob" style="width:700px;height:700px;left:-300px;bottom:-260px"></div>
    ${brand()}${sp(80)}
    <span class="tag" style="align-self:flex-start">Para empresas a partir de 2 vidas</span>${sp(36)}
    <h1 style="font-size:94px">O plano de saúde da equipe está <em>pesando no caixa?</em></h1>${sp(44)}
    <p class="sub">Revisamos o contrato atual e comparamos opções com rede credenciada equivalente.</p>${sp(50)}
    <div class="pill-row"><div class="pill">Várias operadoras</div><div class="pill">Sem custo</div><div class="pill">Sem compromisso</div></div>${sp(56)}
    <div class="cta">Solicitar cotação ${ICON.arrow}</div>
    ${foot()}</div>` },

  { nome: "feed-04-3-sinais", w: 1080, h: 1350, html: `<div class="c light">
    ${brand(true)}${sp(80)}
    <h1 style="font-size:86px"><em>3 sinais</em> de que é hora de revisar seu plano de saúde</h1>${sp(64)}
    <div class="list" style="gap:38px">
      <div><span class="num">1</span>O reajuste deste ano pesou no orçamento</div>
      <div><span class="num">2</span>Alguém da família mudou de faixa etária</div>
      <div><span class="num">3</span>Você nunca comparou com outras operadoras</div>
    </div>${sp(70)}
    <div class="cta">Peça sua análise gratuita ${ICON.arrow}</div>
    ${foot()}</div>` },

  { nome: "feed-05-hospital", w: 1080, h: 1350, html: `<div class="c">
    <div class="blob" style="width:560px;height:560px;right:-200px;top:260px"></div>
    ${brand()}${sp(90)}
    <div style="width:180px;height:180px;border-radius:44px;background:rgba(255,255,255,.14);display:grid;place-items:center">${ICON.hosp}</div>${sp(50)}
    <h1 style="font-size:100px">Trocar de plano <em>não significa</em> perder seu hospital.</h1>${sp(44)}
    <p class="sub">Comparamos a rede credenciada de cada opção antes de qualquer recomendação.</p>${sp(56)}
    <div class="cta">Quero comparar ${ICON.arrow}</div>
    ${foot()}</div>` },

  // ---------- STORIES / REELS 9:16 (área segura: 250px topo, 340px base) ----------
  { nome: "story-01-boleto-reajuste", w: 1080, h: 1920, html: `<div class="c" style="padding:250px 80px 340px">
    <div class="blob" style="width:700px;height:700px;right:-260px;top:520px"></div>
    ${brand()}${sp(90)}
    <h1 style="font-size:112px">O boleto do plano <em>subiu de novo?</em></h1>${sp(80)}
    <div class="boleto"><div class="stamp">REAJUSTE</div><div class="l">Plano de saúde · mensalidade</div><div class="v">R$ <span>???</span></div><div class="bars"></div></div>${sp(90)}
    <p class="sub" style="font-size:46px">Antes de pagar, compare com outras operadoras. <b>A análise é gratuita.</b></p>
    <div style="margin-top:auto"></div>
    <div class="cta wa">${ICON.chat} Toque e fale no WhatsApp</div>${sp(24)}
    <div class="foot" style="margin-top:0">${RODAPE}</div></div>` },

  { nome: "story-02-cnpj-mei", w: 1080, h: 1920, html: `<div class="c light" style="padding:250px 80px 340px">
    <div class="blob" style="width:800px;height:800px;right:-300px;top:-200px;opacity:.35"></div>
    ${brand(true)}${sp(110)}
    <span class="tag" style="align-self:flex-start">Para MEI e autônomos</span>${sp(40)}
    <h1 style="font-size:150px">Tem CNPJ<br>ou <em>MEI?</em></h1>${sp(50)}
    <p class="sub" style="font-size:50px">Você pode ter acesso a planos de saúde <b>empresariais</b>.*</p>${sp(70)}
    <div class="list"><div>${ICON.check} Comparação gratuita</div><div>${ICON.check} Várias operadoras</div><div>${ICON.check} Atendimento humano</div></div>
    <div style="margin-top:auto"></div>
    <div class="cta">${ICON.chat.replace('#fff"/>','#fff"/>')} Quero saber mais</div>${sp(24)}
    <div class="foot" style="margin-top:0">*Conforme regras de cada operadora. ${RODAPE}</div></div>` },

  { nome: "story-03-como-funciona", w: 1080, h: 1920, html: `<div class="c" style="padding:250px 80px 340px">
    ${brand()}${sp(100)}
    <h1 style="font-size:104px">Análise <em>gratuita</em> do seu plano de saúde</h1>${sp(80)}
    <div class="list" style="gap:44px">
      <div><span class="num">1</span>Você conta quanto paga hoje</div>
      <div><span class="num">2</span>Comparamos várias operadoras</div>
      <div><span class="num">3</span>Você decide, sem compromisso</div>
    </div>
    <div style="margin-top:auto"></div>
    <div class="cta wa">${ICON.chat} Enviar mensagem</div>${sp(24)}
    <div class="foot" style="margin-top:0">${RODAPE}</div></div>` },

  // ---------- CARROSSEL 1:1 ----------
  { nome: "carrossel-01", w: 1080, h: 1080, html: `<div class="c">
    <div class="blob" style="width:600px;height:600px;right:-240px;bottom:-240px"></div>
    ${brand()}${sp(110)}
    <h1 style="font-size:104px">Antes de <em>cancelar</em> seu plano de saúde por causa do preço…</h1>
    <div class="foot" style="display:flex;justify-content:space-between;align-items:center"><div class="dots"><i class="on"></i><i></i><i></i></div><span style="font-size:30px;font-weight:700;opacity:1">Arraste →</span></div></div>` },
  { nome: "carrossel-02", w: 1080, h: 1080, html: `<div class="c light">
    ${brand(true)}${sp(90)}
    <h1 style="font-size:84px">…saiba que existem opções com <em>rede parecida</em> e valores diferentes.</h1>${sp(50)}
    <p class="sub" style="font-size:38px">Cada operadora tem preços e regras próprias. Comparar faz diferença.</p>
    <div class="foot" style="display:flex;justify-content:space-between;align-items:center"><div class="dots"><i></i><i class="on"></i><i></i></div><span style="font-size:30px;font-weight:700;opacity:1">Arraste →</span></div></div>` },
  { nome: "carrossel-03", w: 1080, h: 1080, html: `<div class="c">
    ${brand()}${sp(90)}
    <h1 style="font-size:96px">Peça uma <em>comparação gratuita.</em></h1>${sp(36)}
    <p class="sub">Sem custo e sem compromisso.</p>${sp(56)}
    <div class="cta">Peça sua análise ${ICON.arrow}</div>
    <div class="foot" style="display:flex;justify-content:space-between;align-items:center;gap:30px"><div class="dots"><i></i><i></i><i class="on"></i></div><span>${RODAPE}</span></div></div>` },
];

(async () => {
  const out = path.join(__dirname, "imagens");
  fs.mkdirSync(out, { recursive: true });
  const opts = process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {};
  const browser = await chromium.launch(opts);
  for (const c of criativos) {
    const page = await browser.newPage({ viewport: { width: c.w, height: c.h } });
    await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${CSS}.c{width:${c.w}px;height:${c.h}px}</style></head><body>${c.html}</body></html>`);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(out, c.nome + ".png") });
    await page.close();
    console.log("ok", c.nome);
  }
  await browser.close();
})();
