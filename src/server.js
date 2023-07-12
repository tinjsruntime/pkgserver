const Express = require('express');
const app = Express();
const fs = require('fs');

const cachedPkg = new Map();
const cachedDeps = new Map();

fs.readdirSync(process.cwd() + '/store').forEach((store) => {
    const base = process.cwd() + '/store/' + store;
    const pkg = require(base + '/pkg.info.json');
    cachedPkg.set(pkg.name, pkg);

    // now put everything from 
    // base + '/meta' into cachedDeps
    cachedDeps.set(pkg.name, new Map());

    putintoDep(cachedDeps.get(pkg.name), pkg, base);
});

function putintoDep(dep, pkg, base) {
    const files = fs.readdirSync(base + '/meta');

    files.forEach((file) => {
        base = base + '/meta/' + file;
        if (fs.lstatSync(base).isDirectory()) {
            putintoDep(dep, pkg, base);
        } else {
            dep.set(file, fs.readFileSync(base, 'utf8'));
        }
    });
}

console.log(cachedDeps);


app.get('/meta', (req, res) => {
    if (!('name' in req.query))
        return res.json({
            ok: false,
            error: 'missing name'
        })

    const name = req.query.name;

    if (!cachedPkg.has(name))
        return res.json({
            ok: false,
            error: 'package not found'
        });

    const pkg = cachedPkg.get(name);

    return res.json({
        ok: true,
        data: pkg
    });
});

app.get('/download', (req, res) => {
    if (!('name' in req.query))
        return res.json({
            ok: false,
            error: 'missing name'
        })

    const name = req.query.name;

    if (!cachedPkg.has(name))
        return res.json({
            ok: false,
            error: 'package not found'
        });

    const pkg = cachedDeps.get(name);
    const meta = cachedPkg.get(name);

    // convert pkg to json
    const pkgJson = {};

    pkg.forEach((value, key) => {
        pkgJson[key] = value;
    });
    
    return res.json({
        ok: true,
        data: pkgJson,
        meta: meta
    });
});

app.listen(3000, () => {});