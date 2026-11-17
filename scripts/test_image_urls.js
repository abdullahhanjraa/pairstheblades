const https = require('https');

const urls = [
  'https://cdn.shopify.com/s/files/1/0971/9447/5817/files/IMG_7003.png?v=1794397107&width=3840',
  'https://pairsclothing.com/cdn/shop/files/IMG_7003.png?v=1794397107&width=2000',
  'https://pairsclothing.com/cdn/shop/files/70.png',
  'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80&w=2000'
];

async function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve({ url, status: res.statusCode, contentType: res.headers['content-type'] });
    }).on('error', (err) => resolve({ url, error: err.message }));
  });
}

async function run() {
  for (const u of urls) {
    const res = await checkUrl(u);
    console.log(res);
  }
}

run();
