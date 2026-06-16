const fs = require('fs');
const path = './prisma/schema.prisma';
let schema = fs.readFileSync(path, 'utf8');

const customerModel = `
model Customer {
  id            String   @id @default(uuid())
  customerCode  String   @unique @map("customer_code")
  name          String
  phone         String?
  email         String?
  address       String?
  companyName   String?  @map("company_name")
  taxId         String?  @map("tax_id")
  customerGroup String   @default("RETAIL") @map("customer_group")
  openingBalance Float   @default(0) @map("opening_balance")
  balance       Float    @default(0)
  creditLimit   Float    @default(0) @map("credit_limit")
  status        String   @default("ACTIVE")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @default(now()) @updatedAt @map("updated_at")

  customerLedgers CustomerLedger[]
  orders          Order[]

  @@map("customers")
}
`;

if (!schema.includes('model Customer {')) {
  schema += '\n' + customerModel;
}

fs.writeFileSync(path, schema);
