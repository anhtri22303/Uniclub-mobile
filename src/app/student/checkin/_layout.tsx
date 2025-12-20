import { Stack } from 'expo-router';
import React from 'react';

export default function CheckinLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    />
  );
}
