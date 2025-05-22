const axios = require("axios");
const fs = require("fs");

module.exports = async function downloadImage(url, filepath) {
    try {
        const response = await axios({
            url,
            method: "GET",
            responseType: "stream",
        });

        const writer = fs.createWriteStream(filepath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on("finish", resolve);
            writer.on("error", reject);
        });
    } catch (error) {
        throw new Error(`Failed to download image: ${error.message}`);
    }
};