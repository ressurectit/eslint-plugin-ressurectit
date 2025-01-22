import fs from 'fs';

const pkg = JSON.parse(fs.readFileSync(new URL("./package.json", import.meta.url), "utf8"));

const meta = 
{
    name: pkg.name,
    version: pkg.version,
};

export default meta;