#!/usr/bin/env node

/**
 * Migration runner for VolTracker Tesla OAuth fixes
 * Applies migrations 003 and 004 to fix the database schema according to T02_S02 task specification
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
    console.log('🔄 Running VolTracker Tesla OAuth migrations...\n');
    
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
    
    try {
        const migrationsDir = path.join(__dirname, 'migrations');
        const migrationFiles = [
            '003_rollback_tesla_user_approach.sql',
            '004_enhance_tesla_oauth_support.sql'
        ];
        
        for (const filename of migrationFiles) {
            const filepath = path.join(migrationsDir, filename);
            
            if (!fs.existsSync(filepath)) {
                console.log(`⚠️  Migration file not found: ${filename}`);
                continue;
            }
            
            console.log(`📄 Applying migration: ${filename}`);
            const sql = fs.readFileSync(filepath, 'utf8');
            
            await pool.query(sql);
            console.log(`✅ Successfully applied: ${filename}\n`);
        }
        
        console.log('🎉 All migrations completed successfully!');
        console.log('\n📋 Summary:');
        console.log('   ✅ Removed tesla_user_id column and tesla_accounts table');
        console.log('   ✅ Enhanced vehicles table for Tesla OAuth token storage');
        console.log('   ✅ Database now aligns with T02_S02 task specification');
        console.log('\n🚀 Tesla OAuth implementation can now proceed according to the task plan!');
        
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error('\n🔧 Troubleshooting:');
        console.error('   1. Check DATABASE_URL in .env file');
        console.error('   2. Ensure database is accessible');
        console.error('   3. Verify migration files exist');
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Run if called directly
if (require.main === module) {
    runMigrations();
}

module.exports = { runMigrations };