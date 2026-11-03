"""Produce outlined SVG brand assets; no browser fonts are needed to render the logo."""
from pathlib import Path
from urllib.request import urlretrieve
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
import json, math

root=Path(__file__).resolve().parent.parent
sources=root/'source-recovery'/'brand-fonts'
output=root/'public'/'assets'/'brand'
sources.mkdir(parents=True,exist_ok=True);output.mkdir(parents=True,exist_ok=True)
downloads={
 'cormorant.ttf':'https://fonts.gstatic.com/s/cormorantgaramond/v21/co3umX5slCNuHLi8bLeY9MK7whWMhyjypVO7abI26QOD_v86GnM.ttf',
 'manrope.ttf':'https://fonts.gstatic.com/s/manrope/v23/xn7_YHE41ni1AdIRqAuZuw1Bx9mbZk7PFO_F.ttf',
 'Cormorant-OFL.txt':'https://raw.githubusercontent.com/google/fonts/main/ofl/cormorantgaramond/OFL.txt',
 'Manrope-OFL.txt':'https://raw.githubusercontent.com/google/fonts/main/ofl/manrope/OFL.txt'
}
for name,url in downloads.items():
 if not (sources/name).exists():urlretrieve(url,sources/name)

def outline(text,font_name,cap,spacing):
 font=TTFont(sources/font_name);glyphs=font.getGlyphSet();cmap=font.getBestCmap()
 scale=cap/font['OS/2'].sCapHeight;x=0;paths=[]
 for letter in text:
  glyph=cmap[ord(letter)];pen=SVGPathPen(glyphs);glyphs[glyph].draw(pen)
  if letter!=' ':paths.append({'d':pen.getCommands(),'x':round(x,4),'letter':letter})
  x+=font['hmtx'][glyph][0]*scale+spacing
 return {'paths':paths,'width':round(x-spacing,4),'scale':round(scale,6)}

points=[]
for i in range(16):
 angle=-math.pi/2+i*math.pi/8;radius=47 if i%2==0 else 30
 points.append((50+radius*math.cos(angle),50+radius*math.sin(angle)))
emblem='M'+' L'.join(f'{x:.4f} {y:.4f}' for x,y in points)+' Z '
for x,y in [(34,34),(66,34),(66,66),(34,66)]:
 r=13.5;emblem+=f'M{x-r} {y} a{r} {r} 0 1 0 {r*2} 0 a{r} {r} 0 1 0 {-r*2} 0 Z '
word=outline('NURA','cormorant.ttf',104,25)
byline=outline('BY BIN SADHIK','manrope.ttf',13,5)
horizontal_word=outline('NURA','cormorant.ttf',88,21)
horizontal_byline=outline('BY BIN SADHIK','manrope.ttf',12,4.3)
data={'emblem':emblem,'word':word,'byline':byline}
(root/'src'/'brand-data.json').write_text(json.dumps(data,separators=(',',':')),encoding='utf-8')

def text_group(data,x,baseline,fill):
 return '<g fill="'+fill+'">'+''.join(f'<path d="{p["d"]}" transform="translate({x+p["x"]:.4f} {baseline}) scale({data["scale"]} {-data["scale"]})"/>' for p in data['paths'])+'</g>'

def svg(body,width,height,title):
 return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" role="img" aria-labelledby="title"><title id="title">{title}</title>{body}</svg>'

for name,paper,gold in [('nura-logo','#efeade','#c7b385'),('nura-logo-dark','#11291f','#947338')]:
 body=f'<path d="{emblem}" fill="{gold}" fill-rule="evenodd" transform="translate(270 22)"/>'
 body+=text_group(word,(640-word['width'])/2,258,paper)
 body+=text_group(byline,(640-byline['width'])/2,307,gold)
 (output/(name+'.svg')).write_text(svg(body,640,340,'NURA by Bin Sadhik'),encoding='utf-8')

body=f'<path d="{emblem}" fill="#c7b385" fill-rule="evenodd" transform="translate(4 29) scale(1.05)"/>'
body+=text_group(horizontal_word,149,111,'#efeade')
body+=text_group(horizontal_byline,149+(horizontal_word['width']-horizontal_byline['width'])/2,148,'#c7b385')
(output/'nura-logo-horizontal.svg').write_text(svg(body,149+horizontal_word['width']+6,166,'NURA by Bin Sadhik'),encoding='utf-8')
(output/'nura-emblem.svg').write_text(svg(f'<path d="{emblem}" fill="#c7b385" fill-rule="evenodd"/>',100,100,'NURA emblem'),encoding='utf-8')
(output/'nura-favicon.svg').write_text(svg(f'<rect width="100" height="100" rx="20" fill="#091810"/><path d="{emblem}" fill="#c7b385" fill-rule="evenodd" transform="translate(12 12) scale(.76)"/>',100,100,'NURA'),encoding='utf-8')
print('Created five outlined SVG brand assets and intro paths.')
