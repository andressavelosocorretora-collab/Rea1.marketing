(function () {
  var C = window.SITE_CONFIG || {};

  // ---------- Preenche os dados da empresa ----------
  document.querySelectorAll("[data-cfg]").forEach(function (el) {
    var v = C[el.getAttribute("data-cfg")];
    if (v) el.textContent = v;
  });
  document.querySelectorAll(".js-email").forEach(function (a) { a.href = "mailto:" + C.email; });
  document.getElementById("ano").textContent = new Date().getFullYear();

  var parceiros = C.parceiros || [];
  var lista = document.getElementById("lista-parceiros");
  var rodape = [];
  parceiros.forEach(function (p) {
    var li = document.createElement("li");
    li.textContent = p.nome + " — CNPJ " + p.cnpj + " — Registro SUSEP nº " + p.susep;
    lista.appendChild(li);
    rodape.push(p.nome + " (SUSEP " + p.susep + ")");
  });
  document.getElementById("parceiros-rodape").textContent = rodape.join("; ");
  document.querySelectorAll(".js-parceiros").forEach(function (el) {
    el.textContent = parceiros.map(function (p) { return p.nome + " (CNPJ " + p.cnpj + ", SUSEP " + p.susep + ")"; }).join("; ");
  });

  // ---------- WhatsApp ----------
  function waLink(msg) {
    return "https://wa.me/" + String(C.whatsapp).replace(/\D/g, "") + "?text=" + encodeURIComponent(msg);
  }
  var msgPadrao = "Olá! Vim pelo site e quero uma análise gratuita do meu plano de saúde.";
  document.querySelectorAll(".js-wa").forEach(function (a) {
    a.href = waLink(msgPadrao);
    a.addEventListener("click", function () { track("Contact", "contato_whatsapp"); });
  });

  // ---------- Cookies / rastreamento (LGPD) ----------
  var KEY = "cookie_consent";
  function getConsent() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function setConsent(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  var bar = document.getElementById("cookie");
  var temRastreio = C.googleTagId || C.metaPixelId;

  function loadTracking() {
    if (C.googleTagId && !window.gtag) {
      var s = document.createElement("script");
      s.async = true;
      s.src = "https://www.googletagmanager.com/gtag/js?id=" + C.googleTagId;
      document.head.appendChild(s);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { dataLayer.push(arguments); };
      gtag("js", new Date());
      gtag("config", C.googleTagId);
    }
    if (C.metaPixelId && !window.fbq) {
      !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments) }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s) }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
      fbq("init", C.metaPixelId);
      fbq("track", "PageView");
    }
  }
  function track(metaEvent, gaEvent) {
    if (window.fbq) fbq("track", metaEvent);
    if (window.gtag) {
      gtag("event", gaEvent);
      if (metaEvent === "Lead" && C.googleAdsConversao) gtag("event", "conversion", { send_to: C.googleAdsConversao });
    }
  }

  if (temRastreio) {
    var c = getConsent();
    if (c === "sim") loadTracking();
    else if (c !== "nao") bar.classList.add("show");
  }
  document.getElementById("cookie-aceitar").onclick = function () { setConsent("sim"); bar.classList.remove("show"); loadTracking(); };
  document.getElementById("cookie-recusar").onclick = function () { setConsent("nao"); bar.classList.remove("show"); };
  document.getElementById("abrir-cookies").onclick = function (e) { e.preventDefault(); bar.classList.add("show"); };

  // ---------- Formulário ----------
  var form = document.getElementById("lead-form");
  var msg = document.getElementById("form-msg");
  var btn = document.getElementById("btn-enviar");
  var tel = document.getElementById("whatsapp");

  tel.addEventListener("input", function () {
    var d = tel.value.replace(/\D/g, "").slice(0, 11);
    if (d.length > 6) tel.value = "(" + d.slice(0, 2) + ") " + d.slice(2, d.length - 4) + "-" + d.slice(-4);
    else if (d.length > 2) tel.value = "(" + d.slice(0, 2) + ") " + d.slice(2);
    else tel.value = d;
  });

  function erro(t) { msg.className = "form-msg err"; msg.textContent = t; }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    msg.textContent = "";
    if (form.site.value) return; // robô

    var dados = {};
    new FormData(form).forEach(function (v, k) { if (k !== "site") dados[k] = String(v).trim(); });

    if (!form.checkValidity()) {
      var inv = form.querySelector(":invalid");
      if (inv) inv.focus();
      return erro(inv && inv.type === "checkbox" ? "Para continuar, marque a autorização de contato." : "Preencha todos os campos.");
    }
    if (dados.whatsapp.replace(/\D/g, "").length < 10) { tel.focus(); return erro("Informe um WhatsApp válido com DDD."); }

    dados.aceite = "sim";
    dados.data = new Date().toISOString();
    dados.pagina = location.href;
    var p = new URLSearchParams(location.search);
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "fbclid"].forEach(function (k) {
      if (p.get(k)) dados[k] = p.get(k);
    });

    var texto = "Olá! Quero minha análise gratuita do plano de saúde.\n" +
      "Nome: " + dados.nome + "\nCidade: " + dados.cidade +
      "\nSituação: " + dados.situacao + "\nPago hoje: " + dados.valor +
      "\nPessoas: " + dados.vidas + "\nCNPJ/MEI: " + dados.cnpj;

    function sucesso() {
      track("Lead", "generate_lead");
      document.getElementById("form-area").innerHTML =
        '<div class="thanks"><h2>Recebemos seu pedido! ✅</h2>' +
        "<p>Em breve um consultor vai falar com você pelo WhatsApp. Se preferir, adiante a conversa agora:</p>" +
        '<a class="btn btn-wa btn-block" target="_blank" rel="noopener" href="' + waLink(texto) + '">💬 Falar agora no WhatsApp</a></div>';
    }

    if (!C.formEndpoint) {
      sucesso();
      window.open(waLink(texto), "_blank");
      return;
    }

    btn.disabled = true;
    btn.textContent = "Enviando...";
    fetch(C.formEndpoint, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8", "Accept": "application/json" },
      body: JSON.stringify(dados)
    }).then(function (r) {
      if (!r.ok && r.type !== "opaque") throw new Error();
      sucesso();
    }).catch(function () {
      btn.disabled = false;
      btn.textContent = "Quero minha análise gratuita";
      erro("Não foi possível enviar agora. Tente novamente ou fale conosco pelo WhatsApp.");
    });
  });
})();
