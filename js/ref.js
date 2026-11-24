// Link de afiliado: conquistou.com.br/?ref=CODIGO guarda o código por 30 dias neste navegador.
// O painel ("Criar conta") preenche o campo "Código de indicação" com ele. Só o código (letras e números) é guardado.
(function () {
  var CHAVE = "conquistou.ref";
  try {
    var ref = new URLSearchParams(location.search).get("ref");
    if (ref) {
      ref = ref.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 30);
      if (ref) localStorage.setItem(CHAVE, JSON.stringify({ c: ref, ate: Date.now() + 30 * 864e5 }));
    }
    var guardado = JSON.parse(localStorage.getItem(CHAVE) || "null");
    if (guardado && guardado.ate > Date.now()) {
      var el = document.getElementById("indicacao");
      if (el) {
        el.textContent = "Indicação ativa: ao criar a conta, use o código " + guardado.c + ".";
        el.hidden = false;
      }
    } else if (guardado) {
      localStorage.removeItem(CHAVE);
    }
  } catch (e) {
    /* sem armazenamento: o código pode ser digitado na hora de criar a conta */
  }
})();
