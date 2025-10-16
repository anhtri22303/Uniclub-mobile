import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function SimpleLoginTest() {
  console.log('🚀 SimpleLoginTest rendering');
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Simple Login Test</Text>
      <Text style={styles.subtitle}>This should be visible!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
});