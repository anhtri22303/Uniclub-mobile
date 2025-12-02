import React, { ReactNode } from 'react';
import { Keyboard, TouchableWithoutFeedback, View, ViewProps } from 'react-native';

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
  const handleDismiss = () => {
    if (enabled) {
      Keyboard.dismiss();
    }
  };

  return (
    <TouchableWithoutFeedback onPress={handleDismiss} accessible={false}>
      <View style={[{ flex: 1 }, style]} {...props}>
        {children}
      </View>
    </TouchableWithoutFeedback>
  );
}
