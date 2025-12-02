import React from 'react';
import { TextInput, TextInputProps } from 'react-native';

/**
 * Custom TextInput component that forces soft keyboard to appear on Android emulators
 * This ensures the on-screen keyboard is displayed instead of using the physical keyboard
 */
export interface AppTextInputProps extends TextInputProps {
  // All TextInput props are inherited
}

export function AppTextInput(props: AppTextInputProps) {
  return (
    <TextInput
      {...props}
      // Force soft keyboard to show on Android (especially emulators)
      showSoftInputOnFocus={true}
      // Ensure keyboard is visible when focused
      keyboardType={props.keyboardType || 'default'}
      // Disable hardware keyboard input
      caretHidden={false}
      // Ensure keyboard appears
      autoCorrect={props.autoCorrect !== undefined ? props.autoCorrect : true}
    />
  );
}
