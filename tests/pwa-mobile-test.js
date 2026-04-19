const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class PWAMobileTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      timestamp: new Date().toISOString(),
      tests: {},
      scores: {},
      summary: { passed: 0, failed: 0, total: 0 }
    };
  }

  async init() {
    console.log('🚀 Initializing Puppeteer...');
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--allow-running-insecure-content'
      ]
    });
    this.page = await this.browser.newPage();
    
    // Set viewport to mobile first
    await this.page.setViewport({ width: 375, height: 667 });
    
    console.log('✅ Puppeteer initialized');
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  log(testName, status, message) {
    const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏳';
    console.log(`${emoji} ${testName}: ${message}`);
    
    this.results.tests[testName] = { status, message, timestamp: new Date().toISOString() };
    
    if (status === 'PASS') this.results.summary.passed++;
    if (status === 'FAIL') this.results.summary.failed++;
    this.results.summary.total++;
  }

  async testPWAInstallability() {
    console.log('\n🔍 Testing PWA Installability...');
    
    try {
      await this.page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
      
      // Check for manifest
      const manifestLink = await this.page.$('link[rel="manifest"]');
      if (manifestLink) {
        const href = await this.page.evaluate(el => el.href, manifestLink);
        this.log('PWA Manifest', 'PASS', `Manifest found at ${href}`);
      } else {
        this.log('PWA Manifest', 'FAIL', 'No manifest link found');
        return;
      }

      // Check manifest content
      const manifestResponse = await this.page.goto('http://localhost:3000/manifest.json');
      const manifestContent = await manifestResponse.json();
      
      if (manifestContent.name && manifestContent.short_name) {
        this.log('PWA Manifest Content', 'PASS', `App name: ${manifestContent.name}`);
      } else {
        this.log('PWA Manifest Content', 'FAIL', 'Invalid manifest structure');
      }

      // Check service worker
      const swRegistered = await this.page.evaluate(async () => {
        return 'serviceWorker' in navigator;
      });
      
      if (swRegistered) {
        this.log('Service Worker Support', 'PASS', 'Service Worker API available');
      } else {
        this.log('Service Worker Support', 'FAIL', 'Service Worker not supported');
      }

    } catch (error) {
      this.log('PWA Installability', 'FAIL', error.message);
    }
  }

  async testMobileResponsiveness() {
    console.log('\n📱 Testing Mobile Responsiveness...');
    
    const breakpoints = [
      { name: 'Mobile Small', width: 375, height: 667 },
      { name: 'Mobile Large', width: 414, height: 896 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1200, height: 800 }
    ];

    try {
      await this.page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle2' });

      for (const bp of breakpoints) {
        await this.page.setViewport({ width: bp.width, height: bp.height });
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait for responsive adjustments

        // Check for horizontal scrollbar
        const hasHorizontalScroll = await this.page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        });

        if (!hasHorizontalScroll) {
          this.log(`Responsive ${bp.name}`, 'PASS', `No horizontal scroll at ${bp.width}px`);
        } else {
          this.log(`Responsive ${bp.name}`, 'FAIL', `Horizontal scroll detected at ${bp.width}px`);
        }
      }

      // Test mobile table conversion
      await this.page.setViewport({ width: 375, height: 667 });
      
      // Check if mobile cards are visible instead of tables
      const mobileCardsVisible = await this.page.$('.mobile-table-container');
      const desktopTableHidden = await this.page.evaluate(() => {
        const table = document.querySelector('.table-responsive-mobile');
        return table && window.getComputedStyle(table).display === 'none';
      });

      if (mobileCardsVisible && desktopTableHidden) {
        this.log('Mobile Table Conversion', 'PASS', 'Tables converted to cards on mobile');
      } else {
        this.log('Mobile Table Conversion', 'FAIL', 'Table conversion not working properly');
      }

    } catch (error) {
      this.log('Mobile Responsiveness', 'FAIL', error.message);
    }
  }

  async testTouchInteractions() {
    console.log('\n👆 Testing Touch Interactions...');
    
    try {
      await this.page.setViewport({ width: 375, height: 667 });
      await this.page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle2' });

      // Test touch target sizes
      const touchTargets = await this.page.$$eval('button, a, .nav-link', elements => {
        return elements.map(el => {
          const rect = el.getBoundingClientRect();
          return {
            width: rect.width,
            height: rect.height,
            tagName: el.tagName,
            className: el.className
          };
        });
      });

      const minTouchSize = 48;
      const validTouchTargets = touchTargets.filter(target => 
        target.width >= minTouchSize && target.height >= minTouchSize
      );

      const touchTargetPercentage = (validTouchTargets.length / touchTargets.length) * 100;
      
      if (touchTargetPercentage >= 90) {
        this.log('Touch Target Sizes', 'PASS', `${touchTargetPercentage.toFixed(1)}% of targets >= ${minTouchSize}px`);
      } else {
        this.log('Touch Target Sizes', 'FAIL', `Only ${touchTargetPercentage.toFixed(1)}% of targets >= ${minTouchSize}px`);
      }

      // Test navigation interactions
      const navButton = await this.page.$('.navbar-toggler');
      if (navButton) {
        await navButton.click();
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const sidebarVisible = await this.page.evaluate(() => {
          const sidebar = document.querySelector('.offcanvas');
          return sidebar && window.getComputedStyle(sidebar).display !== 'none';
        });
        
        if (sidebarVisible) {
          this.log('Mobile Navigation', 'PASS', 'Mobile navigation opens successfully');
        } else {
          this.log('Mobile Navigation', 'FAIL', 'Mobile navigation not working');
        }
      }

    } catch (error) {
      this.log('Touch Interactions', 'FAIL', error.message);
    }
  }

  async testOfflineFunctionality() {
    console.log('\n🌐 Testing Offline Functionality...');
    
    try {
      await this.page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle2' });
      
      // Check if service worker is registered
      const swRegistration = await this.page.evaluate(async () => {
        if ('serviceWorker' in navigator) {
          try {
            const registration = await navigator.serviceWorker.ready;
            return !!registration.active;
          } catch (e) {
            return false;
          }
        }
        return false;
      });

      if (swRegistration) {
        this.log('Service Worker Registration', 'PASS', 'Service Worker is active');
      } else {
        this.log('Service Worker Registration', 'FAIL', 'Service Worker not registered or inactive');
        return;
      }

      // Test offline mode
      await this.page.setOfflineMode(true);
      
      // Try to navigate to a cached page
      await this.page.goto('http://localhost:3000/dashboard', { waitUntil: 'domcontentloaded' });
      
      const pageLoaded = await this.page.evaluate(() => {
        return document.readyState === 'complete' && document.body.children.length > 0;
      });

      await this.page.setOfflineMode(false);

      if (pageLoaded) {
        this.log('Offline Navigation', 'PASS', 'Page loads successfully offline');
      } else {
        this.log('Offline Navigation', 'FAIL', 'Page fails to load offline');
      }

    } catch (error) {
      this.log('Offline Functionality', 'FAIL', error.message);
    }
  }

  async testPerformance() {
    console.log('\n⚡ Testing Performance...');
    
    try {
      // Enable performance metrics
      await this.page.goto('http://localhost:3000/dashboard');
      
      const performanceMetrics = await this.page.evaluate(() => {
        return new Promise((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const metrics = {};
            
            entries.forEach((entry) => {
              if (entry.entryType === 'navigation') {
                metrics.domContentLoaded = entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart;
                metrics.loadComplete = entry.loadEventEnd - entry.loadEventStart;
              }
              if (entry.entryType === 'paint') {
                metrics[entry.name] = entry.startTime;
              }
            });
            
            resolve(metrics);
          }).observe({ entryTypes: ['navigation', 'paint'] });
          
          // Fallback timeout
          setTimeout(() => resolve({}), 3000);
        });
      });

      if (performanceMetrics['first-contentful-paint'] && performanceMetrics['first-contentful-paint'] < 2000) {
        this.log('Performance FCP', 'PASS', `First Contentful Paint: ${performanceMetrics['first-contentful-paint'].toFixed(0)}ms`);
      } else {
        this.log('Performance FCP', 'FAIL', `First Contentful Paint too slow or not measured`);
      }

    } catch (error) {
      this.log('Performance Testing', 'FAIL', error.message);
    }
  }

  async testFormUsability() {
    console.log('\n📝 Testing Form Usability...');
    
    try {
      await this.page.setViewport({ width: 375, height: 667 });
      await this.page.goto('http://localhost:3000/dashboard/create-invoice', { waitUntil: 'networkidle2' });
      
      // Check if form inputs have proper mobile sizing
      const inputSizes = await this.page.$$eval('input, select, textarea', inputs => {
        return inputs.map(input => {
          const styles = window.getComputedStyle(input);
          return {
            fontSize: parseFloat(styles.fontSize),
            height: input.getBoundingClientRect().height,
            type: input.type || input.tagName
          };
        });
      });

      const properMobileInputs = inputSizes.filter(input => 
        input.fontSize >= 16 && input.height >= 44
      );

      const mobileInputPercentage = (properMobileInputs.length / inputSizes.length) * 100;
      
      if (mobileInputPercentage >= 90) {
        this.log('Form Mobile Optimization', 'PASS', `${mobileInputPercentage.toFixed(1)}% of inputs properly sized for mobile`);
      } else {
        this.log('Form Mobile Optimization', 'FAIL', `Only ${mobileInputPercentage.toFixed(1)}% of inputs properly sized for mobile`);
      }

    } catch (error) {
      this.log('Form Usability', 'FAIL', error.message);
    }
  }

  async runAllTests() {
    console.log('🧪 Starting PWA Mobile Test Suite...\n');
    
    await this.init();
    
    try {
      await this.testPWAInstallability();
      await this.testMobileResponsiveness();
      await this.testTouchInteractions();
      await this.testOfflineFunctionality();
      await this.testPerformance();
      await this.testFormUsability();
      
      // Generate report
      await this.generateReport();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
    } finally {
      await this.close();
    }
  }

  async generateReport() {
    console.log('\n📊 Generating Test Report...');
    
    const { passed, failed, total } = this.results.summary;
    const passRate = ((passed / total) * 100).toFixed(1);
    
    console.log(`\n🎯 Test Results Summary:`);
    console.log(`   Total Tests: ${total}`);
    console.log(`   Passed: ${passed} ✅`);
    console.log(`   Failed: ${failed} ❌`);
    console.log(`   Pass Rate: ${passRate}%`);
    
    // Create detailed report
    const reportPath = path.join(process.cwd(), 'PWA_AUTOMATED_TEST_RESULTS.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    
    if (passRate >= 90) {
      console.log('\n🎉 Excellent! Your PWA passes the mobile testing suite!');
    } else if (passRate >= 75) {
      console.log('\n👍 Good! Your PWA is mostly ready, with some minor issues to address.');
    } else {
      console.log('\n⚠️  Your PWA needs some improvements before it\'s mobile-ready.');
    }
  }
}

// Run the tests
async function runTests() {
  const tester = new PWAMobileTester();
  await tester.runAllTests();
}

// Export for use as module or run directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = PWAMobileTester;