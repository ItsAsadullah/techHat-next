const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'prisma/schema.prisma');
let content = fs.readFileSync(filePath, 'utf8');

// Fix duplicates
content = content.replace(
    /fiscalYear FiscalYear @relation\(fields: \[fiscalYearId\], references: \[id\]\)\r?\n\s*fiscalYear\s+FiscalYear @relation\(fields: \[fiscalYearId\], references: \[id\]\)/,
    "fiscalYear FiscalYear @relation(fields: [fiscalYearId], references: [id])"
);

content = content.replace(
    /accountingPeriod AccountingPeriod\?\s+@relation\(fields: \[accountingPeriodId\], references: \[id\]\)\r?\n\s*accountingPeriod\s+AccountingPeriod\?\s+@relation\(fields: \[accountingPeriodId\], references: \[id\]\)/,
    "accountingPeriod AccountingPeriod?    @relation(fields: [accountingPeriodId], references: [id])"
);

// We also need to check if there are other duplicates. 
// Just to be safe, let's write it and run prisma format to see if it catches anything else.
fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed schema.prisma duplicates');
