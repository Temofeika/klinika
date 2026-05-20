async function test() {
    const regularFontUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf'
    try {
        const res = await fetch(regularFontUrl);
        console.log('Status:', res.status, res.headers.get('content-type'));
        const buf = await res.arrayBuffer();
        console.log('Size:', buf.byteLength);
        console.log('First 4 bytes:', Buffer.from(buf).slice(0, 4).toString('hex'));
    } catch (e) {
        console.error(e);
    }
}
test();
