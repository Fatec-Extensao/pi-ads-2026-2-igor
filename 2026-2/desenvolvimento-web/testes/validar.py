from pathlib import Path
from html.parser import HTMLParser
import xml.etree.ElementTree as ET
from urllib.parse import urlsplit, unquote

root=Path(__file__).resolve().parent.parent
src=root/'src'
class Document(HTMLParser):
    def __init__(self):
        super().__init__();self.ids=[];self.labels=[];self.inputs=[];self.refs=[];self.tags=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs);self.tags.append(tag)
        if 'id' in a:self.ids.append(a['id'])
        if tag=='label':self.labels.append(a.get('for'))
        if tag in ['input','select','textarea']:self.inputs.append(a.get('id'))
        if tag=='img':assert a.get('alt'), 'Imagem sem alt'
        if tag=='form':assert a.get('method')=='post', 'Formulário sem proteção contra GET'
        for key in ['href','src']:
            if key in a:self.refs.append(a[key])

count=0
for path in src.rglob('*.html'):
    doc=Document();doc.feed(path.read_text(encoding='utf-8'))
    assert len(doc.ids)==len(set(doc.ids)), (path,'IDs duplicados')
    assert set(doc.inputs)<=set(doc.labels),(path,'Campo sem label')
    for tag in ['header','main','section','footer']:assert tag in doc.tags,(path,tag)
    for ref in doc.refs:
        parts=urlsplit(ref)
        if parts.scheme or parts.netloc:continue
        target=(path.parent/unquote(parts.path)).resolve() if parts.path else path
        assert target.exists(),(path,ref)
        if parts.fragment and target.suffix=='.html':
            other=Document();other.feed(target.read_text(encoding='utf-8'));assert parts.fragment in other.ids,(path,ref)
        count+=1
for path in (root/'wireframes').glob('*.svg'):ET.parse(path)
print(f'OK: 12 páginas, {count} referências locais, semântica/rótulos/IDs e quatro SVG válidos.')
