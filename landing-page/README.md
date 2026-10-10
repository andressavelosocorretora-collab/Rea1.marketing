# Landing page — Análise gratuita de plano de saúde

Página estática (HTML/CSS/JS, sem dependências) para receber o tráfego dos anúncios do **Google Ads** e do **Meta Ads**.

| Arquivo | Para que serve |
|---|---|
| `config.js` | **Único arquivo que você precisa editar**: dados da empresa, parceiros, WhatsApp, rastreamento |
| `index.html` | Página principal com formulário |
| `politica-de-privacidade.html` | Política de privacidade (LGPD), obrigatória para Google e Meta |
| `termos-de-uso.html` | Termos de uso |
| `style.css` / `app.js` | Visual e funcionamento (não precisa mexer) |
| `pagina-pronta.html` | **Versão em arquivo único** (tudo embutido: visual, política e termos). Gerada com `python3 build.py` depois de editar o `config.js` |

---

## 1. Antes de publicar (obrigatório)

1. Abra `config.js` e troque **todos** os textos entre `[colchetes]`:
   - Razão social, nome fantasia, CNPJ, endereço completo, telefone, e-mail
   - Número do WhatsApp (formato `5511999999999`)
   - **Corretora parceira**: nome, CNPJ e número do registro SUSEP. Peça esses dados ao parceiro **e a autorização por escrito** para citá-lo.
2. Em `politica-de-privacidade.html` e `termos-de-uso.html`, preencha a data, o nome do encarregado de dados (DPO), o prazo de guarda e a cidade do foro.
3. Revise os textos com o parceiro ou com um advogado. Este modelo segue boas práticas, mas não substitui revisão jurídica.

## 2. Como a página atende às normas

| Exigência | Como foi atendida |
|---|---|
| **Google Ads: transparência do anunciante** | Razão social, CNPJ, endereço, telefone e e-mail no rodapé; seção "Quem somos" |
| **Google Ads: página de destino funcional** | Página própria com conteúdo e formulário (não é só um redirecionamento para o WhatsApp) |
| **Google/Meta: sem promessas enganosas** | Sem "economize X%", "sem carência" ou "o mais barato". Usa "pode custar menos" e avisa que a economia não é garantida |
| **Marcas de operadoras** | Nenhum nome ou logo de operadora. Só use com autorização |
| **Sem registro SUSEP próprio** | A página diz que a empresa é **assessoria**, que **não é operadora** e que a intermediação é feita por **corretora parceira registrada** (nome, CNPJ e SUSEP exibidos) |
| **ANS** | Avisos sobre variação de preço, carência e portabilidade conforme regras da ANS, com link para gov.br/ans |
| **Dados de saúde** | O formulário **não** pergunta sobre doenças (dado sensível pela LGPD e proibido para segmentação no Meta) |
| **LGPD: consentimento** | Caixa de autorização **desmarcada**, obrigatória, com link para a política |
| **LGPD: cookies** | Pixel do Meta e tag do Google **só carregam depois de "Aceitar"** |
| **Anti-spam** | Campo invisível (honeypot) bloqueia robôs |

> ⚠️ **Importante sem SUSEP:** não use as palavras "corretora", "corretor de seguros" ou "corretor habilitado" para a sua empresa, nem nos anúncios. Use "assessoria", "consultoria" ou "especialistas em planos de saúde".

## 3. Google Ads: verificação de serviços financeiros

No Brasil, o Google pode exigir a **verificação de serviços financeiros** de quem anuncia seguros e planos (a ANS e a SUSEP estão na lista de reguladores aceitos). Sem registro próprio, o enquadramento costuma ser o de **"terceiro aprovado"**, que anuncia com autorização de quem é registrado.

1. Peça à corretora parceira uma **carta de autorização/parceria** em papel timbrado com CNPJ e SUSEP dela, autorizando sua empresa a divulgar e captar clientes.
2. No Google Ads: **Ferramentas → Verificação do anunciante** e conclua a **verificação de identidade** com os dados do CNPJ (iguais aos do perfil de pagamento e aos do rodapé da página).
3. Se aparecer a exigência de "serviços financeiros", faça o pedido como terceiro/não regulamentado. O Google pode encaminhar você para a **G2 Risk Solutions**, que analisa a documentação (carta do parceiro + CNPJ) e gera um código para informar na conta.
4. Alternativa mais rápida: o anúncio ser veiculado **na conta do Google Ads da corretora parceira** (já registrada), apontando para esta página, enquanto sua verificação não sai.

## 4. Onde os leads chegam

**Opção A — sem configurar nada:** deixe `formEndpoint: ""`. Ao enviar, o lead abre o WhatsApp da empresa com todos os dados já preenchidos. Simples, mas você só recebe o lead se a pessoa enviar a mensagem.

**Opção B — Google Planilhas (recomendado, grátis):** todo lead fica salvo, mesmo que a pessoa não envie a mensagem no WhatsApp.

1. Crie uma planilha no Google Sheets.
2. Menu **Extensões → Apps Script**, apague o conteúdo e cole:

```javascript
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var d = JSON.parse(e.postData.contents);
  var cols = ["data","nome","whatsapp","cidade","situacao","valor","vidas","cnpj","aceite",
              "utm_source","utm_medium","utm_campaign","utm_content","utm_term","gclid","fbclid","pagina"];
  if (sheet.getLastRow() === 0) sheet.appendRow(cols);
  sheet.appendRow(cols.map(function (c) { return d[c] || ""; }));
  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

3. **Implantar → Nova implantação → Tipo: App da Web** → Executar como: *Você* → Quem pode acessar: *Qualquer pessoa* → Implantar.
4. Copie a URL gerada (`https://script.google.com/macros/s/.../exec`) e cole em `formEndpoint` no `config.js`.
5. Ative as notificações da planilha (**Ferramentas → Regras de notificação**) para saber de cada lead novo e responder em até 5 minutos.

Nos dois casos, a tela de agradecimento mostra o botão "Falar agora no WhatsApp".

## 5. Rastreamento de conversões

No `config.js`:
- `googleTagId`: ID da tag do Google Ads (`AW-...`)
- `googleAdsConversao`: rótulo da conversão de lead (`AW-.../...`)
- `metaPixelId`: ID do Pixel do Meta

Eventos enviados: `Lead` / `generate_lead` (formulário enviado) e `Contact` / `contato_whatsapp` (clique no WhatsApp). A página também guarda os parâmetros UTM, `gclid` e `fbclid` junto com o lead, para você saber qual anúncio trouxe cada contato.

Use links com UTM nos anúncios, por exemplo:
`https://seudominio.com.br/?utm_source=google&utm_medium=cpc&utm_campaign=planos-reducao-custos`

## 6. Como publicar

- **Domínio próprio** (ex.: `seudominio.com.br`) passa mais confiança e ajuda na aprovação do Google.
- Hospedagem gratuita: **Netlify** (arraste a pasta `landing-page` em app.netlify.com/drop), **Cloudflare Pages** ou **GitHub Pages**. Todas incluem HTTPS, que é obrigatório.
- Depois de publicar, teste: envio do formulário, botão do WhatsApp, links da política e dos termos, e versão no celular.
