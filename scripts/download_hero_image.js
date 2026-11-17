const https = require('https');
const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '..', 'public', 'images');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const targetFile = path.join(targetDir, 'hero-banner.png');
const url = 'https://pairsclothing.com/cdn/shop/files/IMG_7003.png?v=1794397107&width=2000';

console.log(`Downloading authentic hero banner from ${url}...`);

const file = fs.createWriteStream(targetFile);

https.get(url, (response) => {
  if (response.statusCode === 200) {
    response.pipe(file);
    file.on('finish', () => {
      file.close();
      const stats = fs.statSync(targetFile);
      console.log(`✅ Hero banner saved to ${targetFile} (${Math.round(stats.size / 1024)} KB)`);
    });
  } else {
    console.error(`❌ Download failed with status ${response.statusCode}`);
  }
}).on('error', (err) => {
  console.error('❌ Network error:', err.message);
});
