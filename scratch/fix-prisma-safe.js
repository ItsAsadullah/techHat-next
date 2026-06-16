const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'prisma/schema.prisma');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Fix duplicates
content = content.replace(
    /fiscalYear FiscalYear @relation\(fields: \[fiscalYearId\], references: \[id\]\)\r?\n\s*fiscalYear\s+FiscalYear @relation\(fields: \[fiscalYearId\], references: \[id\]\)/,
    "fiscalYear FiscalYear @relation(fields: [fiscalYearId], references: [id])"
);

content = content.replace(
    /accountingPeriod AccountingPeriod\?\s+@relation\(fields: \[accountingPeriodId\], references: \[id\]\)\r?\n\s*accountingPeriod\s+AccountingPeriod\?\s+@relation\(fields: \[accountingPeriodId\], references: \[id\]\)/,
    "accountingPeriod AccountingPeriod?    @relation(fields: [accountingPeriodId], references: [id])"
);

// 2. Remove Customer fields from Order model
content = content.replace(
    /  Customer   Customer\? @relation\(fields: \[customerId\], references: \[id\]\)\r?\n  customerId String\?/g,
    ""
);

// 3. Remove orders from Customer model
// Find the Customer model block
const customerModelRegex = /(model Customer \{[^}]+)\s+orders\s+Order\[\]([^}]+})/g;
content = content.replace(customerModelRegex, "$1$2");

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed schema.prisma safely!');
