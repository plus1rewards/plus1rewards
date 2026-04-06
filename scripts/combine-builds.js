const fs = require('fs-extra');
const path = require('path');

const rewardsDistDir = path.join(__dirname, '../plus1-rewards/dist');
const goDistDir = path.join(__dirname, '../plus1-go/dist');
const outputDir = path.join(__dirname, '../dist');

async function combineBuild() {
  try {
    // Clean output directory
    await fs.remove(outputDir);
    await fs.ensureDir(outputDir);

    // Copy plus1-rewards to root dist
    await fs.copy(rewardsDistDir, outputDir);

    // Copy plus1-go to dist/go
    await fs.copy(goDistDir, path.join(outputDir, 'go'));

    console.log('✓ Builds combined successfully');
    console.log(`  - plus1-rewards → ${outputDir}`);
    console.log(`  - plus1-go → ${path.join(outputDir, 'go')}`);
  } catch (error) {
    console.error('✗ Failed to combine builds:', error.message);
    process.exit(1);
  }
}

combineBuild();
