#!/usr/bin/env node

// PWA Setup Script for Splitfact
// This script helps validate and complete PWA setup

const fs = require('fs');
const path = require('path');

console.log('🚀 Splitfact PWA Setup Script');
console.log('=============================\n');

// Validate manifest.json
function validateManifest() {
  const manifestPath = path.join(process.cwd(), 'public', 'manifest.json');
  
  if (!fs.existsSync(manifestPath)) {
    console.log('❌ manifest.json not found');
    return false;
  }

  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    console.log('✅ manifest.json found and valid');
    console.log(`   - Name: ${manifest.name}`);
    console.log(`   - Short name: ${manifest.short_name}`);
    console.log(`   - Start URL: ${manifest.start_url}`);
    console.log(`   - Display: ${manifest.display}`);
    console.log(`   - Icons: ${manifest.icons.length} defined`);
    console.log(`   - Shortcuts: ${manifest.shortcuts.length} defined`);
    return true;
  } catch (error) {
    console.log('❌ manifest.json is invalid JSON:', error.message);
    return false;
  }
}

// Validate icons
function validateIcons() {
  const iconsDir = path.join(process.cwd(), 'public', 'icons');
  
  if (!fs.existsSync(iconsDir)) {
    console.log('❌ Icons directory not found');
    return false;
  }

  const requiredSizes = ['72x72', '96x96', '128x128', '144x144', '152x152', '192x192', '384x384', '512x512'];
  const foundIcons = [];
  const missingIcons = [];

  requiredSizes.forEach(size => {
    const iconPath = path.join(iconsDir, `icon-${size}.png`);
    if (fs.existsSync(iconPath)) {
      foundIcons.push(size);
    } else {
      missingIcons.push(size);
    }
  });

  console.log(`✅ Icons directory found`);
  console.log(`   - Found: ${foundIcons.length}/${requiredSizes.length} icons`);
  
  if (missingIcons.length > 0) {
    console.log(`   - Missing: ${missingIcons.join(', ')}`);
  }

  return missingIcons.length === 0;
}

// Validate Next.js config
function validateNextConfig() {
  const configPath = path.join(process.cwd(), 'next.config.ts');
  
  if (!fs.existsSync(configPath)) {
    console.log('❌ next.config.ts not found');
    return false;
  }

  const config = fs.readFileSync(configPath, 'utf8');
  const hasNextPWA = config.includes('next-pwa');
  const hasWithPWA = config.includes('withPWA');

  if (hasNextPWA && hasWithPWA) {
    console.log('✅ next.config.ts configured with next-pwa');
    return true;
  } else {
    console.log('❌ next.config.ts missing PWA configuration');
    return false;
  }
}

// Validate dependencies
function validateDependencies() {
  const packagePath = path.join(process.cwd(), 'package.json');
  
  if (!fs.existsSync(packagePath)) {
    console.log('❌ package.json not found');
    return false;
  }

  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };

  const requiredDeps = ['next-pwa', 'workbox-webpack-plugin', 'idb'];
  const foundDeps = [];
  const missingDeps = [];

  requiredDeps.forEach(dep => {
    if (deps[dep]) {
      foundDeps.push(dep);
    } else {
      missingDeps.push(dep);
    }
  });

  console.log(`✅ Package.json found`);
  console.log(`   - PWA deps: ${foundDeps.length}/${requiredDeps.length} installed`);
  
  if (missingDeps.length > 0) {
    console.log(`   - Missing: ${missingDeps.join(', ')}`);
    console.log(`   - Run: npm install ${missingDeps.join(' ')}`);
  }

  return missingDeps.length === 0;
}

// Check PWA components
function validatePWAComponents() {
  const componentsDir = path.join(process.cwd(), 'src', 'app', 'components');
  const hooksDir = path.join(process.cwd(), 'src', 'hooks');
  
  const pwaComponents = [
    'PWAInstallPrompt.tsx',
    'OfflineIndicator.tsx',
    'PWAUpdatePrompt.tsx'
  ];

  const pwaHooks = [
    'usePWAInstall.ts',
    'useOfflineStatus.ts'
  ];

  let allFound = true;

  console.log('✅ Checking PWA components:');
  pwaComponents.forEach(component => {
    const componentPath = path.join(componentsDir, component);
    if (fs.existsSync(componentPath)) {
      console.log(`   ✅ ${component}`);
    } else {
      console.log(`   ❌ ${component}`);
      allFound = false;
    }
  });

  console.log('✅ Checking PWA hooks:');
  pwaHooks.forEach(hook => {
    const hookPath = path.join(hooksDir, hook);
    if (fs.existsSync(hookPath)) {
      console.log(`   ✅ ${hook}`);
    } else {
      console.log(`   ❌ ${hook}`);
      allFound = false;
    }
  });

  return allFound;
}

// Main validation
async function runValidation() {
  console.log('🔍 Validating PWA setup...\n');

  const validations = [
    { name: 'Manifest', fn: validateManifest },
    { name: 'Icons', fn: validateIcons },
    { name: 'Next.js Config', fn: validateNextConfig },
    { name: 'Dependencies', fn: validateDependencies },
    { name: 'PWA Components', fn: validatePWAComponents }
  ];

  let allPassed = true;

  for (const validation of validations) {
    console.log(`\n📋 ${validation.name}:`);
    const passed = validation.fn();
    if (!passed) allPassed = false;
  }

  console.log('\n=============================');
  if (allPassed) {
    console.log('🎉 PWA setup is complete!');
    console.log('\nNext steps:');
    console.log('1. Run: npm run build');
    console.log('2. Run: npm run start');
    console.log('3. Open Chrome DevTools > Application > Manifest');
    console.log('4. Test installation prompt');
    console.log('5. Test offline functionality');
  } else {
    console.log('❌ PWA setup has issues. Please fix the errors above.');
  }

  return allPassed;
}

// Generate PWA report
function generateReport() {
  const report = {
    timestamp: new Date().toISOString(),
    manifest: fs.existsSync(path.join(process.cwd(), 'public', 'manifest.json')),
    serviceWorker: fs.existsSync(path.join(process.cwd(), 'public', 'sw.js')),
    icons: fs.existsSync(path.join(process.cwd(), 'public', 'icons')),
    components: fs.existsSync(path.join(process.cwd(), 'src', 'app', 'components', 'PWAInstallPrompt.tsx'))
  };

  fs.writeFileSync(
    path.join(process.cwd(), 'pwa-report.json'),
    JSON.stringify(report, null, 2)
  );

  console.log('\n📊 PWA report saved to pwa-report.json');
}

// Run the script
if (require.main === module) {
  runValidation().then(success => {
    generateReport();
    process.exit(success ? 0 : 1);
  });
}

module.exports = { runValidation, generateReport };