const fs = require('fs');
let code = fs.readFileSync('prisma/schema.prisma', 'utf8');
code = code.replace(/model\s+(\w+)\s+\{([\s\S]*?)\}/g, (m, name, inner) => {
    if (inner.includes('@@schema')) return m;
    return m.substring(0, m.lastIndexOf('}')) + '  @@schema("public")\r\n}';
});
code = code.replace(/enum\s+(\w+)\s+\{([\s\S]*?)\}/g, (m, name, inner) => {
    if (inner.includes('@@schema')) return m;
    return m.substring(0, m.lastIndexOf('}')) + '  @@schema("public")\r\n}';
});
fs.writeFileSync('prisma/schema.prisma', code);
