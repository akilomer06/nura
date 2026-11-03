import fs from 'node:fs/promises';
let app=await fs.readFile('src/App.jsx','utf8');
app=app.replace('function ProductDetail({product,format:defaultFormat,size:defaultSize,onClose,onAdd,onNavigate,ready})','function ProductDetail({product,format:defaultFormat,size:defaultSize,onClose,onAdd,onNavigate,ready,onVariant,onBag,bagCount})');
app=app.replace('setSize(defaultSize);setQuantity(1);setAdded(false);},[product.id,defaultFormat,defaultSize]);','setSize(defaultSize);setAdded(false);},[product.id,defaultFormat,defaultSize]);\n useEffect(()=>{setQuantity(1);},[product.id]);');
app=app.replace("history.replaceState({},'',`/products/${product.id}?format=${f}&size=${s}`);","onVariant(f,s);");
app=app.replace('<IconButton label="Close product details" onClick={onClose}><X size={23}/></IconButton>','<div className="detail-header-actions"><button className="bag-toggle" aria-label={`Open bag, ${bagCount} items`} onClick={onBag}>Bag <span className="bag-count">{bagCount}</span></button><IconButton label="Close product details" onClick={onClose}><X size={23}/></IconButton></div>');
app=app.replace('<ProductDetail ready={!sceneBusy} product={product}','<ProductDetail ready={!sceneBusy} onBag={()=>setPanel(\'bag\')} bagCount={cart.reduce((n,i)=>n+i.quantity,0)} onVariant={(f,s)=>{const url=\`/products/\${product.id}?format=\${f}&size=\${s}\`;history.replaceState({},\'\',url);setRoute(url);}} product={product}');
await fs.writeFile('src/App.jsx',app);
console.log('The product view now keeps direct bag access and variant URL state.');
