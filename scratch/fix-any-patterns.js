const fs = require('fs');

const files = [
    'lib/actions/expense-actions.ts',
    'lib/actions/vendor-actions.ts',
    'lib/actions/review-actions.ts',
    'lib/actions/report-actions.ts',
    'lib/actions/order-actions.ts',
    'lib/actions/product-actions.ts',
    'lib/actions/pos-customer-actions.ts',
    'lib/actions/product-json-actions.ts',
    'lib/actions/invoice-settings-actions.ts',
    'lib/actions/product-enterprise-actions.ts',
    'lib/actions/pos-actions.ts'
];

for (const file of files) {
    if (!fs.existsSync(file)) continue;
    
    let content = fs.readFileSync(file, 'utf8');

    // Pattern 1: catch (error: any)
    content = content.replace(/catch\s*\(\s*error\s*:\s*any\s*\)/g, 'catch (err: unknown)');

    // Pattern 2: (error as any)?.message
    content = content.replace(/\(error as any\)\?\.message/g, '(err instanceof Error ? err.message : "অজানা ত্রুটি")');
    content = content.replace(/\(error as any\)\.message/g, '(err instanceof Error ? err.message : "অজানা ত্রুটি")');

    // Pattern 3: (error as any)?.code
    content = content.replace(/\(error as any\)\?\.code/g, '((err as {code?: string})?.code)');

    // Pattern 4: (error as any)?.meta?.target
    content = content.replace(/\(error as any\)\?\.meta\?\.target/g, '((err as {meta?: {target?: string[]}})?.meta?.target)');

    // Pattern 5: catch (retryErr: any)
    content = content.replace(/catch\s*\(\s*retryErr\s*:\s*any\s*\)/g, 'catch (retryErr: unknown)');
    content = content.replace(/\(retryErr as any\)\?\.code/g, '((retryErr as {code?: string})?.code)');
    content = content.replace(/\(retryErr as any\)\?\.message/g, '(retryErr instanceof Error ? retryErr.message : String(retryErr))');

    // Pattern 6: const data: any = {}
    content = content.replace(/const\s+data\s*:\s*any\s*=\s*\{\}/g, 'const data: Record<string, unknown> = {}');
    content = content.replace(/const\s+where\s*:\s*any\s*=\s*\{\}/g, 'const where: Record<string, unknown> = {}');
    
    // Pattern 7: map((item: any)
    // We will replace : any with : Record<string, unknown> in maps that don't need strict types
    content = content.replace(/\.map\(\s*\(\s*(\w+)\s*:\s*any\s*(,\s*\w+\s*:\s*number\s*)?\)\s*=>/g, '.map(($1: Record<string, unknown>$2) =>');
    
    // Pattern 8: (cat as any).name -> (cat as Record<string, unknown>).name
    content = content.replace(/\((\w+)\s*as\s*any\)/g, '($1 as Record<string, unknown>)');

    // Replace db queries that return any
    content = content.replace(/const\s+db\s*=\s*prisma\s*as\s*any/g, 'const db = prisma as unknown as Record<string, any>');

    // Write back
    fs.writeFileSync(file, content);
}
console.log('Codemod applied successfully to actions.');
