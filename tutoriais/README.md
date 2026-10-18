# Central de tutoriais

A página pública é `index.html`. Os vídeos ficam em `midia/` e são carregados somente quando a pessoa aperta play.

## Adicionar ou trocar um vídeo

1. Coloque o arquivo MP4 novo em `midia/` com um nome simples, por exemplo `tutorial-05.mp4`.
2. Em `index.html`, copie um bloco `<article class="video-card">` e atualize o número, o título, a duração e o caminho em `<source src="...">`.
3. Troque o atributo `poster` para a capa correspondente em `midia/`. As capas SVG atuais são modelos editáveis.
4. Atualize o contador de vídeos no início da página.

Os convites do Discord ficam na seção “Acesso ao Discord” de `index.html`.
