#!/usr/bin/env node

/**
 * Post-build script to modify the tarball and convert exact call-ai version to flexible range
 * This extracts the tarball, modifies package.json, and repacks it
 */

import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'fs';
import { resolve, join } from 'path';
import { execSync } from 'child_process';
import { tmpdir } from 'os';

const tarballPath = resolve('../../dist/use-vibes.tgz');

try {
  // Create temporary directory
  const tmpDir = mkdtempSync(join(tmpdir(), 'use-vibes-fix-'));
  
  console.log('📦 Extracting tarball...');
  // Extract tarball to temp directory
  execSync(`tar -xzf "${tarballPath}" -C "${tmpDir}"`);
  
  const packageDir = join(tmpDir, 'package');
  const packageJsonPath = join(packageDir, 'package.json');
  
  // Read and modify package.json
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  
  if (packageJson.dependencies && packageJson.dependencies['call-ai']) {
    const currentVersion = packageJson.dependencies['call-ai'];
    
    // Extract version number (remove any pre-release suffixes)
    const versionMatch = currentVersion.match(/^(\d+\.\d+\.\d+)/);
    
    if (versionMatch) {
      const baseVersion = versionMatch[1];
      // Convert to caret range for compatible updates
      packageJson.dependencies['call-ai'] = `^${baseVersion}`;
      
      // Write back the modified package.json
      writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      
      console.log(`✅ Updated call-ai dependency from "${currentVersion}" to "^${baseVersion}"`);
      
      // Repack the tarball
      console.log('📦 Repacking tarball...');
      execSync(`tar -czf "${tarballPath}" -C "${tmpDir}" package`);
      
      console.log('✨ Tarball updated successfully');
    } else {
      console.log(`⚠️  Could not parse version from: ${currentVersion}`);
    }
  } else {
    console.log('ℹ️  No call-ai dependency found in package');
  }
  
  // Cleanup
  rmSync(tmpDir, { recursive: true, force: true });
  
} catch (error) {
  console.error('❌ Error fixing version ranges:', error.message);
  process.exit(1);
}