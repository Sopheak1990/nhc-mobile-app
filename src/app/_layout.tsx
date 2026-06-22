// src/app/_layout.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

function CustomDrawerContent(props: any) {
  const [userName, setUserName] = useState('Loading...');

  // Fetch the user's name from memory when the sidebar loads
  useEffect(() => {
    const loadUser = async () => {
      const storedName = await AsyncStorage.getItem('userName');
      if (storedName) {
        setUserName(storedName);
      } else {
        setUserName('Admin');
      }
    };
    loadUser();
  }, []);

  // Clear memory when logging out
  const handleLogout = async () => {
    await AsyncStorage.removeItem('userName');
    router.replace('/');
  };

  return (
    <View style={{ flex: 1 }}>
      <DrawerContentScrollView {...props}>
        
        {/* --- NEW HEADER WITH LOGO AND NAME --- */}
        <View style={styles.drawerHeader}>
          <Image 
            source={require('../../assets/nhc-logo.png')} 
            style={styles.logo} 
            resizeMode="contain"
          />
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.drawerSubtitle}>NHC Reservation System</Text>
        </View>

        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer 
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          headerStyle: { backgroundColor: '#343a40' },
          headerTintColor: '#fff',
          drawerActiveTintColor: '#0d6efd',
        }}
      >
        <Drawer.Screen 
          name="index" 
          options={{ headerShown: false, drawerItemStyle: { display: 'none' } }} 
        />
        <Drawer.Screen 
          name="dashboard" 
          options={{ drawerLabel: 'Dashboard', title: 'Overview Bookings' }} 
        />
        
        {/* --- ADD THIS NEW SCREEN HERE --- */}
        <Drawer.Screen 
          name="all-bookings" 
          options={{ drawerLabel: 'All Bookings', title: 'Bookings List' }} 
        />
        <Drawer.Screen name="add-booking" options={{ drawerLabel: 'Add New Booking', title: 'New Reservation' }} />
      </Drawer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  drawerHeader: { 
    padding: 20, 
    backgroundColor: '#f4f6f9', 
    marginBottom: 10, 
    borderBottomWidth: 1, 
    borderBottomColor: '#ddd',
    alignItems: 'center' // Centers the logo and text
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 15,
    borderRadius: 10
  },
  userName: { fontSize: 20, fontWeight: 'bold', color: '#343a40', textAlign: 'center' },
  drawerSubtitle: { fontSize: 13, color: '#0d6efd', marginTop: 5, textAlign: 'center', fontWeight: 'bold' },
  
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#ddd', backgroundColor: '#fff' },
  logoutButton: { backgroundColor: '#ffeeba', padding: 12, borderRadius: 8, alignItems: 'center' },
  logoutText: { color: '#dc3545', fontWeight: 'bold', fontSize: 16 }
});