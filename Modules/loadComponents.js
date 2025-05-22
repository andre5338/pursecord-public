const { Collection } = require('discord.js');
const fs = require('fs');
const path = require('node:path');

function loadComponents(client, componentType) {
    client[componentType] = new Collection();
    const componentsDir = `./Components/${componentType.charAt(0).toUpperCase() + componentType.slice(1)}`;

    if (!fs.existsSync(componentsDir)) {
        fs.mkdirSync(componentsDir, { recursive: true });
    }

    const componentFolders = fs.readdirSync(componentsDir);

    for (const folder of componentFolders) {
        const folderPath = path.join(componentsDir, folder);

        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
        }

        const componentFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
        for (const file of componentFiles) {
            const component = require(`../${path.join(folderPath, file)}`);
            if (component.name) {
                client[componentType].set(component.name, component);
            }
        }
    }
    console.log(`[Components] - Loaded ${client[componentType].size} ${componentType} components.`);
}

module.exports = { loadComponents };