import { generateDischargePdf } from './src/lib/pdf.ts';

async function test() {
    try {
        console.log('Generating dummy PDF...');
        const buffer = await generateDischargePdf(
            { lastName: 'Test', firstName: 'User', dateOfBirth: '1990-01-01', phone: '+79991234567' },
            { 
                status: 'COMPLETED',
                startDate: '2024-01-01', 
                endDate: '2024-01-10', 
                diagnosis: 'Healthy',
                attendingDoctorName: 'Dr. House',
                updatedAt: new Date().toISOString()
            }
        );
        console.log('PDF generated, size:', buffer.length);
        
        const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
        const start = Buffer.from(
            `--${boundary}\r\n` +
            `Content-Disposition: form-data; name="chat_id"\r\n\r\n` +
            `12345\r\n` +
            `--${boundary}\r\n` +
            `Content-Disposition: form-data; name="document"; filename="test.pdf"\r\n` +
            `Content-Type: application/pdf\r\n\r\n`
        );
        const end = Buffer.from(`\r\n--${boundary}--\r\n`);
        const body = Buffer.concat([start, buffer, end]);
        console.log('Body constructed, size:', body.length);
    } catch (err) {
        console.error('Error:', err);
    }
}
test();
