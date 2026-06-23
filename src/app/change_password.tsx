import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { changePassword } from '../services/api';

export default function ChangePasswordScreen() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert("Error", "Please fill in both fields.");
      return;
    }

    setLoading(true);
    
    // Get the User ID from memory
    const userId = await AsyncStorage.getItem('userId');
    
    if (!userId) {
      Alert.alert("Error", "User session lost. Please log out and log back in.");
      setLoading(false);
      return;
    }

    const result = await changePassword(userId, currentPassword, newPassword);

    if (result.status === 'success') {
      Alert.alert("Success", "Your password has been updated securely!");
      setCurrentPassword('');
      setNewPassword('');
    } else {
      Alert.alert("Error", result.message);
    }
    
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Change Password</Text>
        
        <Text style={styles.label}>Current Password</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Enter current password"
          secureTextEntry
          value={currentPassword}
          onChangeText={setCurrentPassword}
        />

        <Text style={styles.label}>New Password</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Enter new password"
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
        />

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleUpdatePassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Update Password</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f4f6f9', justifyContent: 'center' },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 12, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 14, fontWeight: 'bold', color: '#6c757d', marginBottom: 8 },
  input: { backgroundColor: '#f8f9fa', borderWidth: 1, borderColor: '#dee2e6', padding: 12, borderRadius: 8, marginBottom: 20, fontSize: 16 },
  button: { backgroundColor: '#0d6efd', padding: 15, borderRadius: 8, alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#6ea8fe' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});