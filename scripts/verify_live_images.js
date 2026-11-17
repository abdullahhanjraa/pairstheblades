async function checkLiveImages() {
  console.log('Fetching live homepage HTML from https://pairstheblades.vercel.app/ ...');
  const res = await fetch('https://pairstheblades.vercel.app/');
  const html = await res.text();

  const regex = /<img[^>]+src="([^">]+)"/g;
  let match;
  const foundImages = [];
  while ((match = regex.exec(html)) !== null) {
    foundImages.push(match[1]);
  }

  console.log(`Found ${foundImages.length} images on live homepage:`);
  foundImages.forEach((src, idx) => {
    console.log(` [${idx + 1}] ${src}`);
  });

  // Verify that all images return HTTP 200 directly
  console.log('\nTesting direct HTTP status for each image URL...');
  for (const src of foundImages) {
    let fullUrl = src;
    if (src.startsWith('/')) {
      fullUrl = `https://pairstheblades.vercel.app${src}`;
    }
    try {
      const imgRes = await fetch(fullUrl, { method: 'HEAD' });
      console.log(`  ✓ Status ${imgRes.status}: ${fullUrl.substring(0, 90)}... (Type: ${imgRes.headers.get('content-type')})`);
    } catch (e) {
      console.log(`  ❌ Failed: ${fullUrl} - ${e.message}`);
    }
  }
}

checkLiveImages().catch(console.error);
