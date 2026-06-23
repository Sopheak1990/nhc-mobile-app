import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { router, usePathname } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

function CustomDrawerContent(props: any) {
  const [userName, setUserName] = useState('Loading...');
  const [userRole, setUserRole] = useState('');
  const pathname = usePathname();

  useEffect(() => {
    const loadUser = async () => {
      const storedName = await AsyncStorage.getItem('userName');
      const storedRole = await AsyncStorage.getItem('userRole');
      
      if (storedName) {
        setUserName(storedName);
      } else {
        setUserName('Guest');
      }

      if (storedRole) {
        setUserRole(storedRole.replace('_', ' ').toUpperCase());
      } else {
        setUserRole('');
      }
    };
    loadUser();
  }, [pathname]);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('userName');
    await AsyncStorage.removeItem('userRole');
    await AsyncStorage.removeItem('userId');

    setUserName('Guest');
    setUserRole('');

    router.replace('/');
  };

  return (
    <View style={{ flex: 1 }}>
      <DrawerContentScrollView {...props}>
        <View style={styles.drawerHeader}>
          <Image 
            source={require('../../assets/nhc-logo.png')} 
            style={styles.logo} 
            resizeMode="contain"
          />
          <Text style={styles.userName}>{userName}</Text>
          {userRole ? <Text style={styles.roleBadge}>{userRole}</Text> : null}
          <Text style={styles.drawerSubtitle}>NHC Reservation</Text>
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
  const [role, setRole] = useState('');
  const pathname = usePathname();

  useEffect(() => {
    const fetchRole = async () => {
      const storedRole = await AsyncStorage.getItem('userRole');
      if (storedRole) {
        setRole(storedRole);
      } else {
        setRole('');
      }
    };
    fetchRole();
  }, [pathname]);

  // Helper boolean to check if the user is allowed to add/edit bookings
  const canModify = role === 'super_admin' || role === 'manager';

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
        <Drawer.Screen 
          name="all-bookings" 
          options={{ drawerLabel: 'All Bookings', title: 'Bookings List' }} 
        />
        
        {/* RESTRICTED: Add New Booking */}
        <Drawer.Screen 
          name="add-booking" 
          options={{ 
            drawerLabel: 'Add New Booking', 
            title: 'New Reservation',
            drawerItemStyle: { display: canModify ? 'flex' : 'none' } 
          }} 
        />
        
        {/* RESTRICTED: Manage Users */}
        <Drawer.Screen 
          name="manage_users" 
          options={{ 
            drawerLabel: 'Manage Users', 
            title: 'User Management',
            drawerItemStyle: { display: role === 'super_admin' ? 'flex' : 'none' }
          }} 
        />
        
        <Drawer.Screen 
          name="change_password" 
          options={{ drawerLabel: 'Change Password', title: 'Security' }} 
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  drawerHeader: { padding: 20, backgroundColor: '#f4f6f9', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#ddd', alignItems: 'center' },
  logo: { width: 100, height: 100, marginBottom: 15, borderRadius: 10 },
  userName: { fontSize: 20, fontWeight: 'bold', color: '#343a40', textAlign: 'center' },
  roleBadge: { backgroundColor: '#0d6efd', color: '#fff', fontSize: 10, fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, marginTop: 5, overflow: 'hidden' },
  drawerSubtitle: { fontSize: 13, color: '#6c757d', marginTop: 8, textAlign: 'center', fontWeight: 'bold' },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#ddd', backgroundColor: '#fff' },
  logoutButton: { backgroundColor: '#ffeeba', padding: 12, borderRadius: 8, alignItems: 'center' },
  logoutText: { color: '#dc3545', fontWeight: 'bold', fontSize: 16 }
});