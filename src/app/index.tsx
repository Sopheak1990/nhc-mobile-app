// src/app/index.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginUser } from '../services/api'; 

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLoginPress = async () => {
    // 1. Call the PHP API
    const result = await loginUser(username, password);

    if (result.status === 'success') {
        // 2. Save the user's name AND role to the phone's memory
        // We use result.user because of how our login.php formats the JSON
        await AsyncStorage.setItem('userId', result.user.id.toString());
        await AsyncStorage.setItem('userName', result.user.name);
        await AsyncStorage.setItem('userRole', result.user.role);
        
        // 3. Navigate to dashboard (replace prevents swiping back to login)
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