/**
 * Test utility to verify handling of both clubId and clubIds formats
 * 
 * Backend may return either:
 * 1. clubId: number (singular) - for accounts with single club
 * 2. clubIds: number[] (plural) - for accounts with multiple clubs
 */

import { LoginResponse } from '@models/auth/auth.types';

// Mock response with clubId (singular)
const mockResponseWithClubId: LoginResponse = {
  token: "eyJhbGciOiJIUzI1NiJ9...",
  userId: 9,
  email: "clubleader@gmail.com",
  role: "CLUB_LEADER",
  clubId: 2, // Single club ID
};

// Mock response with clubIds (plural)
const mockResponseWithClubIds: LoginResponse = {
  token: "eyJhbGciOiJIUzI1NiJ9...",
  userId: 10,
  email: "multiclub@gmail.com",
  role: "CLUB_LEADER",
  clubIds: [1, 2, 3], // Multiple club IDs
};

// Mock response with no club data
const mockResponseWithNoClub: LoginResponse = {
  token: "eyJhbGciOiJIUzI1NiJ9...",
  userId: 11,
  email: "student@gmail.com",
  role: "STUDENT",
  // No clubId or clubIds
};

/**
 * Normalize club data to always return an array or undefined
 * This is the same logic used in auth.store.ts
 */
export function normalizeClubIds(response: LoginResponse): number[] | undefined {
  if (response.clubIds) {
    // If clubIds exists (array), use it directly
    return response.clubIds;
  } else if (response.clubId !== undefined && response.clubId !== null) {
    // If clubId exists (single number), convert to array
    return [response.clubId];
  }
  // Return undefined if no club data
  return undefined;
}

/**
 * Test cases
 */
export function runClubIdTests() {
  console.log('=== Testing Club ID Normalization ===\n');

  // Test 1: Single clubId
  const test1 = normalizeClubIds(mockResponseWithClubId);
  console.log('Test 1 - Single clubId:');
  console.log('  Input:', mockResponseWithClubId.clubId);
  console.log('  Output:', test1);
  console.log('  Expected: [2]');
  console.log('    Pass:', JSON.stringify(test1) === JSON.stringify([2]));
  console.log('');

  // Test 2: Multiple clubIds
  const test2 = normalizeClubIds(mockResponseWithClubIds);
  console.log('Test 2 - Multiple clubIds:');
  console.log('  Input:', mockResponseWithClubIds.clubIds);
  console.log('  Output:', test2);
  console.log('  Expected: [1, 2, 3]');
  console.log('    Pass:', JSON.stringify(test2) === JSON.stringify([1, 2, 3]));
  console.log('');

  // Test 3: No club data
  const test3 = normalizeClubIds(mockResponseWithNoClub);
  console.log('Test 3 - No club data:');
  console.log('  Input: undefined');
  console.log('  Output:', test3);
  console.log('  Expected: undefined');
  console.log('    Pass:', test3 === undefined);
  console.log('');

  console.log('=== All Tests Completed ===');
}

// Example usage in component:
/*
import { useAuthStore } from '@stores/auth.store';

const user = useAuthStore((state) => state.user);

// Access club IDs (always as array or undefined)
if (user?.clubIds && user.clubIds.length > 0) {
  console.log('User belongs to clubs:', user.clubIds);
  const firstClubId = user.clubIds[0];
  // Use firstClubId for API calls
}
*/
