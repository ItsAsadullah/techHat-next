const fs = require('fs');

const tempPrisma = fs.readFileSync('prisma/temp.prisma', 'utf8');
const schemaPrisma = fs.readFileSync('prisma/schema.prisma', 'utf8');

// Parse temp.prisma to build a map of model -> { hasCreatedAt, hasUpdatedAt, hasCreated_at, hasUpdated_at }
const modelData = {};
let currentModel = null;

for (const line of tempPrisma.split('\n')) {
    const modelMatch = line.match(/^model\s+(\w+)\s+\{/);
    if (modelMatch) {
        currentModel = modelMatch[1];
        modelData[currentModel] = {
            createdAt: false,
            updatedAt: false,
            created_at: false,
            updated_at: false
        };
        continue;
    }
    if (line.trim() === '}') {
        currentModel = null;
        continue;
    }
    if (currentModel) {
        if (line.match(/^\s+createdAt\s+/)) modelData[currentModel].createdAt = true;
        if (line.match(/^\s+updatedAt\s+/)) modelData[currentModel].updatedAt = true;
        if (line.match(/^\s+created_at\s+/)) modelData[currentModel].created_at = true;
        if (line.match(/^\s+updated_at\s+/)) modelData[currentModel].updated_at = true;
    }
}

// Now map these back to schema.prisma model names. 
// Note that schema.prisma uses PascalCase (e.g., Product), but temp.prisma uses database names (e.g., products).
// We can find the @@map in schema.prisma or just guess based on Plural/Singular or direct match.
// Let's parse schema.prisma to link them.
const schemaModels = {};
let currentSchemaModel = null;

for (const line of schemaPrisma.split('\n')) {
    const modelMatch = line.match(/^model\s+(\w+)\s+\{/);
    if (modelMatch) {
        currentSchemaModel = {
            name: modelMatch[1],
            dbName: modelMatch[1], // default
            lines: []
        };
        schemaModels[currentSchemaModel.name] = currentSchemaModel;
    }
    
    if (currentSchemaModel) {
        currentSchemaModel.lines.push(line);
        const mapMatch = line.match(/^\s+@@map\("(\w+)"\)/);
        if (mapMatch) {
            currentSchemaModel.dbName = mapMatch[1];
        }
        if (line.trim() === '}') {
            currentSchemaModel = null;
        }
    }
}

let newSchemaLines = [];
let insideModel = null;

for (let line of schemaPrisma.split('\n')) {
    const modelMatch = line.match(/^model\s+(\w+)\s+\{/);
    if (modelMatch) {
        insideModel = schemaModels[modelMatch[1]];
        newSchemaLines.push(line);
        continue;
    }
    if (line.trim() === '}') {
        insideModel = null;
        newSchemaLines.push(line);
        continue;
    }
    
    if (insideModel) {
        const dbModel = modelData[insideModel.dbName];
        if (dbModel) {
            // Check createdAt
            if (line.match(/^\s+createdAt\s+DateTime/)) {
                if (dbModel.createdAt) {
                    // DB has createdAt, so we should NOT have @map("created_at")
                    line = line.replace(/@map\("created_at"\)/, '').replace(/\s+$/, '');
                } else if (dbModel.created_at) {
                    // DB has created_at, so we MUST have @map("created_at")
                    if (!line.includes('@map("created_at")')) {
                        line = line + ' @map("created_at")';
                    }
                }
            }
            // Check updatedAt
            if (line.match(/^\s+updatedAt\s+DateTime/)) {
                if (dbModel.updatedAt) {
                    // DB has updatedAt, so we should NOT have @map("updated_at")
                    line = line.replace(/@map\("updated_at"\)/, '').replace(/\s+$/, '');
                } else if (dbModel.updated_at) {
                    // DB has updated_at, so we MUST have @map("updated_at")
                    if (!line.includes('@map("updated_at")')) {
                        line = line + ' @map("updated_at")';
                    }
                }
            }
        }
    }
    
    newSchemaLines.push(line);
}

fs.writeFileSync('prisma/schema.prisma', newSchemaLines.join('\n'));
console.log("Fixed createdAt/updatedAt mappings!");
