# Conquistou

Página de apresentação e download da versão de teste do app Conquistou (Android).

Site: https://conquistou.com.br/

O APK fica em [Releases](https://github.com/BandSpec/conquistou/releases/latest), sempre com o nome `Conquistou.apk`,
então o link `releases/latest/download/Conquistou.apk` aponta para a versão mais nova.

## Área do responsável (`/painel/`)

O pai/mãe faz pelo navegador o que faz no app (perfil Responsável): painel, aprovações e mesadas
(PIX), tarefas, castigos e regras, filhos, metas, perfil e excluir conta. Login por e-mail e senha
ou Google. Usa a API oficial (`https://conquistou-production.up.railway.app`), que precisa liberar
este site no CORS e no retorno do Google (configuração `PainelWeb` no backend).

- HTML/CSS/JS puro, sem build: `painel/index.html`, `painel/painel.css`, `painel/js/*.js`.
- `painel/js/qrcode.js` é a biblioteca `qrcode` (MIT) empacotada num arquivo só, para o QR do PIX.
- Imagens dos avatares e ícones de tarefa: cópia de `mobile/assets` do app.
- Sessão: o token de acesso fica só na memória; o de renovação na aba (ou no navegador, se marcar
  "Manter conectado"). Sair revoga no servidor.
- Testar no computador: em `localhost` o painel chama a API no próprio endereço (use um servidor
  local que simule a API); fora dele, sempre a oficial.
