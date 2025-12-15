import React, { ReactNode } from 'react';
import { View, ViewProps } from 'react-native';

/**
 * Wrapper component that dismisses keyboard when user taps outside input fields
 * Wrap your screen content with this component to enable tap-to-dismiss behavior
 */
interface KeyboardDismissWrapperProps extends ViewProps {
  children: ReactNode;
  enabled?: boolean; // Allow disabling the dismiss behavior if needed
}

export function KeyboardDismissWrapper({ 
  children, 
  enabled = true,
  style,
  ...props 
}: KeyboardDismissWrapperProps) {
  // Currently disabled to avoid scroll blocking issues
  // Keyboard can be dismissed manually or via ScrollView's keyboardDismissMode
  
  return (
    <View 
      style={[{ flex: 1 }, style]} 
      {...props}
    >
      {children}
    </View>
  );
}
