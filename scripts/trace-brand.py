"""Trace the user-supplied logo into outlined SVGs, retaining the website palette.

This extracts vector geometry only; it does not use or reproduce the source colours.
"""
from pathlib import Path
from PIL import Image
from collections import defaultdict
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
import json

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'public/assets/brand'
SOURCE = Path(__file__).with_name('brand-reference.png')

def trace(box):
    image = Image.open(SOURCE).convert('RGB').crop(box)
    width, height = image.size
    mask = {(x, y) for y in range(height) for x in range(width)
            if min(image.getpixel((x, y))) > 110}
    edges = defaultdict(list)
    for x, y in mask:
        if (x,y-1) not in mask: edges[(x,y)].append((x+1,y))
        if (x+1,y) not in mask: edges[(x+1,y)].append((x+1,y+1))
        if (x,y+1) not in mask: edges[(x+1,y+1)].append((x,y+1))
        if (x-1,y) not in mask: edges[(x,y+1)].append((x,y))
    contours = []
    while edges:
        start = next(iter(edges)); point = start; points = []
        while True:
            points.append(point)
            target = edges[point].pop()
            if not edges[point]: del edges[point]
            point = target
            if point == start: break
        if len(points) < 8: continue
        # Remove collinear vertices without changing the supplied outline.
        clean = []
        for i,b in enumerate(points):
            a,c = points[i-1],points[(i+1)%len(points)]
            if (b[0]-a[0])*(c[1]-b[1]) != (b[1]-a[1])*(c[0]-b[0]): clean.append(b)
        contours.append('M'+'L'.join(f'{x},{y}' for x,y in clean)+'Z')
    return {'d': ''.join(contours), 'width': width, 'height': height}

data = {'emblem':trace((498,59,750,312)),
        'word':trace((303,356,947,499)),
        'byline':trace((299,834,949,890))}
font = TTFont(Path(__file__).with_name('brand-fonts')/'cormorant.ttf')
glyphs = font.getGlyphSet(); cmap = font.getBestCmap()
data['font'] = {'units':font['head'].unitsPerEm,'glyphs':{}}
for code in list(range(32,127))+[0xcf]:
    if code not in cmap: continue
    glyph = cmap[code]; pen = SVGPathPen(glyphs); glyphs[glyph].draw(pen)
    data['font']['glyphs'][chr(code)] = {'d':pen.getCommands(),'ha':font['hmtx'][glyph][0]}
OUT.mkdir(parents=True, exist_ok=True)
(ROOT/'src/brand-data.json').write_text(json.dumps(data,separators=(',',':')),encoding='utf-8')

def placed(part,x,y,width,colour):
    p=data[part]
    return f'<path fill="{colour}" fill-rule="evenodd" d="{p["d"]}" transform="translate({x} {y}) scale({width/p["width"]})"/>'

def svg(body,width,height,title='NURA by Bin Sadhik'):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" role="img" aria-label="{title}">{body}</svg>'

for name,paper,gold in [('nura-logo','#efeade','#c7b385'),('nura-logo-dark','#11291f','#947338')]:
    body=placed('emblem',260,6,120,gold)+placed('word',30,158,580,paper)+placed('byline',180,307,280,gold)
    (OUT/(name+'.svg')).write_text(svg(body,640,340),encoding='utf-8')
body=placed('emblem',4,18,102,'#c7b385')+placed('word',140,18,390,'#efeade')+placed('byline',220,124,230,'#c7b385')
(OUT/'nura-logo-horizontal.svg').write_text(svg(body,540,155),encoding='utf-8')
(OUT/'nura-emblem.svg').write_text(svg(placed('emblem',0,0,100,'#c7b385'),100,101,'NURA emblem'),encoding='utf-8')
(OUT/'nura-favicon.svg').write_text(svg('<rect width="100" height="100" rx="20" fill="#091810"/>'+placed('emblem',12,12,76,'#c7b385'),100,100,'NURA'),encoding='utf-8')
print('Traced supplied emblem, NURA lettering and byline; exported five SVG brand assets.')
