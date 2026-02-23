const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function (file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.ts') || file.endsWith('.tsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk(srcDir);

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Replace firestore imports
    content = content.replace(/from\s+['"]firebase\/firestore['"]/g, 'from "@/lib/firebaseWrapper"');

    // Replace auth imports
    content = content.replace(/from\s+['"]firebase\/auth['"]/g, 'from "@/lib/firebaseWrapper"');

    // Replace storage imports
    content = content.replace(/from\s+['"]firebase\/storage['"]/g, 'from "@/lib/firebaseWrapper"');

    // Remove getAuth call assignment if any
    content = content.replace(/const auth = getAuth\([^)]*\);/g, '');

    // Some fix for getApp, getApps, etc. We probably shouldn't use them anymore, but if they are there, we redirect.
    content = content.replace(/from\s+['"]firebase\/app['"]/g, 'from "@/lib/firebaseWrapper"');

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated: ${file}`);
    }
});

console.log('Migration imports complete');
