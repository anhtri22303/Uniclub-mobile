// Test script để verify logic của sidebar menu items

const testCases = [
  {
    name: "Case 1: No club, not staff",
    user: {
      clubIds: [],
      staff: false
    },
    expected: ["Clubs", "History"],
    expectedCount: 2
  },
  {
    name: "Case 2: Has club, not staff",
    user: {
      clubIds: [1],
      staff: false
    },
    expected: ["Clubs", "History", "My Club", "Events", "Check In", "Gift", "Wallet"],
    expectedCount: 7
  },
  {
    name: "Case 3: No club, is staff",
    user: {
      clubIds: [],
      staff: true
    },
    expected: ["Clubs", "History", "Staff History", "Staff Gift"],
    expectedCount: 4
  },
  {
    name: "Case 4: Has club, is staff",
    user: {
      clubIds: [1],
      staff: true
    },
    expected: ["Clubs", "History", "My Club", "Events", "Check In", "Gift", "Wallet", "Staff History", "Staff Gift"],
    expectedCount: 9
  },
  {
    name: "Case 5: clubIds undefined, not staff",
    user: {
      clubIds: undefined,
      staff: false
    },
    expected: ["Clubs", "History"],
    expectedCount: 2
  },
  {
    name: "Case 6: Multiple clubs, is staff",
    user: {
      clubIds: [1, 2, 3],
      staff: true
    },
    expected: ["Clubs", "History", "My Club", "Events", "Check In", "Gift", "Wallet", "Staff History", "Staff Gift"],
    expectedCount: 9
  }
];

// Simulate the logic from Sidebar component
function getMenuItemsForStudent(user) {
  const hasClub = user?.clubIds && user.clubIds.length > 0;
  const isStaff = user?.staff === true;
  
  console.log(`\nProcessing user:`, JSON.stringify(user));
  console.log(`hasClub: ${hasClub}`);
  console.log(`isStaff: ${isStaff}`);
  
  const baseItems = ["Clubs", "History"];
  const clubMemberItems = hasClub ? ["My Club", "Events", "Check In", "Gift", "Wallet"] : [];
  const staffItems = isStaff ? ["Staff History", "Staff Gift"] : [];
  
  return [...baseItems, ...clubMemberItems, ...staffItems];
}

// Run tests
console.log("=== TESTING SIDEBAR MENU LOGIC ===\n");

testCases.forEach((testCase, index) => {
  console.log(`\n--- ${testCase.name} ---`);
  const result = getMenuItemsForStudent(testCase.user);
  const passed = result.length === testCase.expectedCount;
  
  console.log(`Expected count: ${testCase.expectedCount}`);
  console.log(`Actual count: ${result.length}`);
  console.log(`Items: ${result.join(", ")}`);
  console.log(`Status: ${passed ? " PASSED" : " FAILED"}`);
  
  if (!passed) {
    console.log(`Expected items: ${testCase.expected.join(", ")}`);
  }
});

console.log("\n=== END OF TESTS ===\n");
