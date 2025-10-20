/**
 * Utility function to get the appropriate route based on user role
 */
export const getRoleRoute = (role?: string): string => {
  if (!role) return '/profile';
  
  switch (role) {
    case 'student':
      return '/profile';
    case 'club_leader':
      return '/club-leader';
    case 'uni_staff':
      return '/uni-staff';
    case 'admin':
      return '/admin';
    case 'staff':
      return '/staff';
    default:
      return '/profile';
  }
};

/**
 * Get role display name
 */
export const getRoleDisplayName = (role?: string): string => {
  if (!role) return 'User';
  
  switch (role) {
    case 'student':
      return 'Student';
    case 'club_leader':
      return 'Club Leader';
    case 'uni_staff':
      return 'University Staff';
    case 'admin':
      return 'Admin';
    case 'staff':
      return 'Staff';
    default:
      return 'User';
  }
};
