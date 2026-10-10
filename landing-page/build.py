"""Gera um único HTML autocontido (CSS, JS, política e termos embutidos).
Uso: python3 build.py  ->  pagina-pronta.html"""
import re, pathlib
d = pathlib.Path(__file__).parent
html = (d / "index.html").read_text()
main_of = lambda f: re.search(r'<main class="doc">(.*?)</main>', (d / f).read_text(), re.S).group(1)
legal = ('<section class="alt" id="privacidade"><div class="doc">%s</div></section>'
         '<section id="termos"><div class="doc">%s</div></section>') % (
    main_of("politica-de-privacidade.html"), main_of("termos-de-uso.html"))
html = html.replace("</main>", legal + "\n</main>", 1)
html = html.replace('href="politica-de-privacidade.html" target="_blank"', 'href="#privacidade"')
html = html.replace('href="politica-de-privacidade.html"', 'href="#privacidade"')
html = html.replace('href="termos-de-uso.html"', 'href="#termos"')
html = html.replace('<link rel="stylesheet" href="style.css">', "<style>\n%s</style>" % (d / "style.css").read_text())
html = html.replace('<script src="config.js"></script>', "<script>\n%s</script>" % (d / "config.js").read_text())
html = html.replace('<script src="app.js"></script>', "<script>\n%s</script>" % (d / "app.js").read_text())
(d / "pagina-pronta.html").write_text(html)
print("ok:", d / "pagina-pronta.html")
