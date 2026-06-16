const fs = require('fs');

const files = [
    'lib/actions/product-enterprise-actions.ts',
    'lib/actions/product-json-actions.ts'
];

for (const file of files) {
    if (!fs.existsSync(file)) continue;
    
    let content = fs.readFileSync(file, 'utf8');

    // Revert the bad 'err' replacement that removed the variable declaration
    // We replaced `catch (error: any)` with `catch (err: unknown)`
    // And `(error as any)?.message` with `(err instanceof Error ? err.message : "অজানা ত্রুটি")`
    // Wait, the TS error says: Cannot find name 'error'.
    // Ah! It's because the catch block was `catch (error: unknown)` but inside it's using `error` instead of `err`?
    // Let's just blindly replace `error` with `err` in those files where `err` was defined but `error` was used?
    // Actually, it's easier to just read the file and fix the catch blocks.
    
    // Instead of regex, I will just replace `catch (err: unknown)` back to `catch (error: any)`
    // And replace `(err instanceof Error ? err.message : "অজানা ত্রুটি")` back to `(error as any)?.message`
    
    content = content.replace(/catch\s*\(\s*err\s*:\s*unknown\s*\)/g, 'catch (error: any)');
    content = content.replace(/\(err\s*instanceof\s*Error\s*\?\s*err\.message\s*:\s*"অজানা ত্রুটি"\)/g, '(error as any)?.message');
    content = content.replace(/\(\(err\s*as\s*\{code\?:\s*string\}\)\?\.code\)/g, '(error as any)?.code');
    content = content.replace(/\(\(err\s*as\s*\{meta\?:\s*\{target\?:\s*string\[\]\}\}\)\?\.meta\?\.target\)/g, '(error as any)?.meta?.target');
    content = content.replace(/catch\s*\(\s*retryErr\s*:\s*unknown\s*\)/g, 'catch (retryErr: any)');
    content = content.replace(/\(\(retryErr\s*as\s*\{code\?:\s*string\}\)\?\.code\)/g, '(retryErr as any)?.code');
    content = content.replace(/\(retryErr\s*instanceof\s*Error\s*\?\s*retryErr\.message\s*:\s*String\(retryErr\)\)/g, '(retryErr as any)?.message');
    content = content.replace(/const\s+data:\s*Record<string,\s*unknown>\s*=\s*\{\}/g, 'const data: any = {}');
    content = content.replace(/const\s+where:\s*Record<string,\s*unknown>\s*=\s*\{\}/g, 'const where: any = {}');
    
    content = content.replace(/\.map\(\(\w+:\s*Record<string,\s*unknown>(,\s*\w+:\s*number)?\)\s*=>/g, '.map(($1: any$2) =>');
    content = content.replace(/\((\w+)\s*as\s*Record<string,\s*unknown>\)/g, '($1 as any)');

    // In product-enterprise-actions.ts there was Record<string, unknown> | undefined not assignable to NullableJsonNullValueInput...
    // Let's replace any instance of Record<string, unknown> with any
    content = content.replace(/Record<string,\s*unknown>/g, 'any');

    fs.writeFileSync(file, content);
}
console.log('Reverted untracked files.');
