const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const certDir = path.join(__dirname, 'ssl');
const keyPath = path.join(certDir, 'key.pem');
const certPath = path.join(certDir, 'cert.pem');

if (!fs.existsSync(certDir)) {
    fs.mkdirSync(certDir);
}

// Generate key pair
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

// Generate self-signed certificate using Node.js built-in X509Certificate (Node 15+)
const cert = crypto.X509Certificate ? generateWithBuiltin() : null;

function generateWithBuiltin() {
    // Node 20+ has createCertificate (experimental) but we need a fallback
    // Use the forge-like approach with node-forge
    return null;
}

// Since Node.js doesn't have a simple built-in cert generator,
// let's use the child_process to call openssl OR create a minimal cert with node-forge
const { execSync } = require('child_process');

// Try PowerShell's New-SelfSignedCertificate and export, or use a JS-only approach
try {
    // Try creating with PowerShell (Windows built-in)
    console.log('Generating SSL certificate via PowerShell...');
    
    // Create cert in Windows cert store, export it, then remove from store
    const ps = `
$cert = New-SelfSignedCertificate -DnsName "localhost" -CertStoreLocation "Cert:\\CurrentUser\\My" -NotAfter (Get-Date).AddYears(1) -KeyAlgorithm RSA -KeyLength 2048 -FriendlyName "Localhost Dev"
$pwd = ConvertTo-SecureString -String "temppass" -Force -AsPlainText
$pfxPath = "${certDir.replace(/\\/g, '\\\\')}\\localhost.pfx"
Export-PfxCertificate -Cert $cert -FilePath $pfxPath -Password $pwd
Remove-Item -Path $cert.PSPath
Write-Output $pfxPath
    `.trim();
    
    execSync(`powershell -Command "${ps.replace(/"/g, '\\"').replace(/\n/g, '; ')}"`, { stdio: 'pipe' });
    
    // Convert PFX to PEM using Node.js
    // We need to install node-forge for PFX conversion
    console.log('Installing node-forge for PFX to PEM conversion...');
    execSync('npm install node-forge', { cwd: __dirname, stdio: 'pipe' });
    
    const forge = require('node-forge');
    const pfxPath = path.join(certDir, 'localhost.pfx');
    const pfxDer = fs.readFileSync(pfxPath, 'binary');
    const pfxAsn1 = forge.asn1.fromDer(pfxDer);
    const pfx = forge.pkcs12.pkcs12FromAsn1(pfxAsn1, 'temppass');
    
    // Extract private key
    const keyBags = pfx.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
    const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag][0];
    fs.writeFileSync(keyPath, forge.pki.privateKeyToPem(keyBag.key));
    
    // Extract certificate
    const certBags = pfx.getBags({ bagType: forge.pki.oids.certBag });
    const certBag = certBags[forge.pki.oids.certBag][0];
    fs.writeFileSync(certPath, forge.pki.certificateToPem(certBag.cert));
    
    // Clean up PFX
    fs.unlinkSync(pfxPath);
    
    console.log('SSL certificate generated successfully!');
    console.log('  Key:  ' + keyPath);
    console.log('  Cert: ' + certPath);
    
} catch (e) {
    console.log('PowerShell method failed, using node-forge directly...');
    
    try {
        execSync('npm install node-forge', { cwd: __dirname, stdio: 'pipe' });
    } catch(installErr) {
        // Already installed
    }
    
    const forge = require('node-forge');
    const pki = forge.pki;
    
    // Generate key pair
    const keys = pki.rsa.generateKeyPair(2048);
    
    // Create certificate
    const forgeCert = pki.createCertificate();
    forgeCert.publicKey = keys.publicKey;
    forgeCert.serialNumber = '01';
    forgeCert.validity.notBefore = new Date();
    forgeCert.validity.notAfter = new Date();
    forgeCert.validity.notAfter.setFullYear(forgeCert.validity.notBefore.getFullYear() + 1);
    
    const attrs = [
        { name: 'commonName', value: 'localhost' },
        { name: 'organizationName', value: 'Dev Server' },
    ];
    forgeCert.setSubject(attrs);
    forgeCert.setIssuer(attrs);
    
    forgeCert.setExtensions([
        { name: 'subjectAltName', altNames: [{ type: 2, value: 'localhost' }, { type: 7, ip: '127.0.0.1' }] },
    ]);
    
    // Self-sign
    forgeCert.sign(keys.privateKey, forge.md.sha256.create());
    
    // Write PEM files
    fs.writeFileSync(keyPath, pki.privateKeyToPem(keys.privateKey));
    fs.writeFileSync(certPath, pki.certificateToPem(forgeCert));
    
    console.log('SSL certificate generated successfully with node-forge!');
    console.log('  Key:  ' + keyPath);
    console.log('  Cert: ' + certPath);
}
