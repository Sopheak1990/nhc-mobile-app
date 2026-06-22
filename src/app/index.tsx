// 1. Add this import at the very top of src/app/index.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';

// 2. Update your handleLoginPress function:
const handleLoginPress = async () => {
  const result = await loginUser(username, password);

  if (result.status === 'success') {
      // Save the user's name to the phone's memory
      await AsyncStorage.setItem('userName', result.name);
      
      // Navigate to dashboard
      router.replace('/dashboard'); 
  } else {
      Alert.alert("Error", result.message);
  }
};

import { router } from 'expo-router';
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
// This steps out of the 'app' folder and into the 'services' folder
import { loginUser } from '../services/api'; 

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLoginPress = async () => {
    const result = await loginUser(username, password);

    if (result.status === 'success') {
        // Automatically navigate to the new dashboard screen!
        // We use 'replace' so they can't swipe back to the login screen without logging out
        router.replace('/dashboard'); 
    } else {
        Alert.alert("Error", result.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>NHC Mobile Login</Text>
      
      <TextInput 
        style={styles.input} 
        placeholder="Username" 
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      
      <TextInput 
        style={styles.input} 
        placeholder="Password" 
        value={password}
        onChangeText={setPassword}
        secureTextEntry={true}
      />
      
      <Button title="Sign In" onPress={handleLoginPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 15, borderRadius: 5 }
});