# Publicar o Cronograma privado no Cloudflare

O endereço antigo do GitHub Pages continua usando armazenamento local. Os dados privados só circulam no endereço novo do Cloudflare Pages.

1. Em **Workers & Pages → Create → Pages → Import an existing Git repository**, escolha `wpm-git/CRONOGRAMA`, branch `main`, build command `exit 0`, output directory `.`. Não use upload manual: Pages Functions exigem deploy via Git ou Wrangler.
2. Em **Storage & Databases → D1**, crie `cronograma-privado`. No console SQL do banco, execute o conteúdo de `schema.sql` uma vez.
3. No projeto Pages, adicione em **Settings → Bindings** o binding D1 **DB** apontando para `cronograma-privado`. Publique novamente após incluir o binding.
4. Em **Settings → Variables and Secrets**, configure `ACCESS_TEAM_DOMAIN` (por exemplo `minha-equipe.cloudflareaccess.com`), `ACCESS_AUD` (Application AUD Tag exibida na aplicação Access) e `OWNER_EMAIL` (seu e-mail exato, minúsculas ou maiúsculas). Não coloque credenciais no GitHub.
5. Em **Settings → Enable access policy**, ative a proteção de previews. Em Zero Trust → Access → Applications, crie/configure também proteção para o endereço principal `<projeto>.pages.dev`, com uma política **Allow** somente para `OWNER_EMAIL`. A proteção padrão de previews sozinha **não** protege o endereço principal. Siga as instruções atuais do Cloudflare para remover `*` do subdomínio da aplicação e criar política separada para previews. Se usar domínio próprio, proteja também esse domínio.
6. Teste em janela anônima: a página deve exigir login; ao entrar com o e-mail escolhido, `api/state` deve mostrar a lista vazia. Sem Access, o middleware recusa acesso e nunca mostra os dados.
7. No aparelho/navegador original, abra o endereço antigo → Configurações → **Exportar backup**. Entre no endereço Cloudflare e use **Importar backup**. Confira os registros em um segundo aparelho antes de deixar de usar o endereço antigo.

A importação substitui os dados atuais depois de confirmação. Não trabalhe nos dois endereços ao mesmo tempo: eles não sincronizam entre si. O aplicativo guarda uma cópia local para recuperar falhas de conexão; o acesso ao servidor exige internet. Se dois dispositivos alterarem a mesma versão simultaneamente, a interface mostra conflito e bloqueia novos envios até revisar/exportar os dados e atualizar. Exporte backups periódicos.

**Privacidade:** não registre dados pessoais ou informações sigilosas de inquéritos sem autorização institucional para armazená-los neste serviço. O repositório é público; nele só há código e esquema, nunca os registros ou chaves.
