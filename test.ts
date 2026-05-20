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
        
        // Let's test the blob wrapping logic
        const blob = new Blob([new Uint8Array(buffer)], { type: 'application/pdf' });
        console.log('Blob created, size:', blob.size);

        // Fetch fake telegram url
        const formData = new FormData();
        formData.append('document', blob, 'Vypiska.pdf');
        formData.append('chat_id', '12345');
        
        console.log('FormData created.');
    } catch (err) {
        console.error('Error:', err);
    }
}
test();
