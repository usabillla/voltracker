// Jest setup file
// Load environment variables for tests
require('dotenv').config();

// Mock environment variables for tests if not provided
process.env.REACT_APP_SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://rtglyzhjqksbgcaeklbq.supabase.co';
process.env.REACT_APP_SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0Z2x5emhqcWtzYmdjYWVrbGJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MDMxMzYsImV4cCI6MjA2NDM3OTEzNn0.C1goCPJ3FIVGm2KbZeLFFZZ94rj6A-cqjqqkTCrg3rs';
process.env.REACT_APP_TESLA_CLIENT_ID = process.env.REACT_APP_TESLA_CLIENT_ID || 'd1155240-a0c2-4133-8ae4-b2d7005fa484';
process.env.REACT_APP_TESLA_CLIENT_SECRET = process.env.REACT_APP_TESLA_CLIENT_SECRET || 'ta-secret._cuz0%wuS&L0OnvH';
process.env.REACT_APP_TESLA_REDIRECT_URI = process.env.REACT_APP_TESLA_REDIRECT_URI || 'https://www.voltracker.com/auth/tesla/callback';

// Mock window object for React Native tests
global.window = {
  location: {
    href: 'http://localhost/',
    pathname: '/',
  },
  history: {
    replaceState: jest.fn(),
  },
};

// Mock console.warn for React Native warnings
global.console = {
  ...console,
  warn: jest.fn(),
};