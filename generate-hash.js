// generate-specific-hash.mjs
import bcrypt from 'bcrypt';

async function generateSpecificHash() {
  const password = '1234';
  const saltRounds = 12;
  
  try {
    const hash = await bcrypt.hash(password, saltRounds);
    console.log('\n=== HASH PARA "1234" ===');
    console.log('Password:', password);
    console.log('Hash:', hash);
    console.log('Length:', hash.length);
    console.log('\nPara .env:');
    console.log(`ADMIN_PASSWORD_HASH=${hash}`);
    
    // Verificar inmediatamente
    const verify = await bcrypt.compare(password, hash);
    console.log('\nVerification test:', verify ? 'SUCCESS' : 'FAILED');
    console.log('========================\n');
    
    return hash;
  } catch (error) {
    console.error('Error:', error);
  }
}

generateSpecificHash();