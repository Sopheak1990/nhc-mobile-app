import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Modal, TextInput } from 'react-native';
import { manageUsers } from '../services/api';

export default function ManageUsersScreen() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState({ id: '', username: '', fullname: '', role: '', password: '' });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const result = await manageUsers(); 
    if (result && result.status === 'success') {
      setUsers(result.data);
    } else {
      Alert.alert("Error", "Failed to load users");
    }
    setLoading(false);
  };

  const handleDelete = (userId, username) => {
    if (username === 'admin') {
      Alert.alert("Denied", "Cannot delete the master admin account.");
      return;
    }

    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete ${username}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            const result = await manageUsers({ action: 'delete', id: userId });
            if (result.status === 'success') {
              loadUsers(); 
            } else {
              Alert.alert("Error", result.message);
            }
          }
        }
      ]
    );
  };

  // --- EDIT FUNCTIONS ---
  const openEditModal = (user) => {
    setEditingUser({
      id: user.UserID,
      username: user.Username,
      fullname: user.FullName,
      role: user.Role,
      password: '' // Keep empty so we only update if they type something new
    });
    setEditModalVisible(true);
  };

  const saveEdit = async () => {
    if (!editingUser.fullname.trim()) {
      Alert.alert("Error", "Full Name cannot be empty.");
      return;
    }

    const result = await manageUsers({
      action: 'edit',
      id: editingUser.id,
      fullname: editingUser.fullname,
      role: editingUser.role,
      password: editingUser.password // If empty, the PHP API ignores it and keeps the old one!
    });

    if (result.status === 'success') {
      setEditModalVisible(false);
      loadUsers(); // Refresh the list to show new name/role
      Alert.alert("Success", "User updated successfully!");
    } else {
      Alert.alert("Error", result.message);
    }
  };

  const renderUserItem = ({ item }) => (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.usernameText}>{item.Username}</Text>
        <Text style={styles.fullnameText}>{item.FullName}</Text>
        <Text style={styles.roleBadge}>{item.Role.replace('_', ' ').toUpperCase()}</Text>
      </View>
      
      <View style={styles.actionButtons}>
        {/* EDIT BUTTON */}
        <TouchableOpacity 
            style={styles.editBtn} 
            onPress={() => openEditModal(item)}
        >
            <Text style={styles.btnText}>Edit</Text>
        </TouchableOpacity>

        {/* DELETE BUTTON */}
        {item.Username !== 'admin' && (
           <TouchableOpacity 
             style={styles.deleteBtn} 
             onPress={() => handleDelete(item.UserID, item.Username)}
           >
             <Text style={styles.btnText}>Delete</Text>
           </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>User Management</Text>
      
      {loading ? (
        <ActivityIndicator size="large" color="#0d6efd" style={{ marginTop: 20 }} />
      ) : (
        <FlatList 
          data={users}
          keyExtractor={(item) => item.UserID.toString()}
          renderItem={renderUserItem}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}

      {/* --- EDIT USER MODAL --- */}
      <Modal visible={isEditModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit User: {editingUser.username}</Text>

            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput 
              style={styles.input} 
              value={editingUser.fullname}
              onChangeText={(text) => setEditingUser({...editingUser, fullname: text})}
            />

            <Text style={styles.inputLabel}>Role</Text>
            <View style={styles.roleContainer}>
              {['normal_user', 'manager', 'super_admin'].map((roleType) => (
                <TouchableOpacity 
                  key={roleType}
                  style={[styles.roleOption, editingUser.role === roleType && styles.roleOptionActive]}
                  onPress={() => setEditingUser({...editingUser, role: roleType})}
                >
                  <Text style={[styles.roleOptionText, editingUser.role === roleType && styles.roleOptionTextActive]}>
                    {roleType.replace('_', ' ').toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Reset Password</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Leave empty to keep current password"
              placeholderTextColor="#999"
              secureTextEntry
              value={editingUser.password}
              onChangeText={(text) => setEditingUser({...editingUser, password: text})}
            />

            <View style={styles.modalButtonRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveEdit}>
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f4f6f9' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  card: { flexDirection: 'row', backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 10, elevation: 2, alignItems: 'center' },
  usernameText: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  fullnameText: { fontSize: 14, color: '#6c757d', marginBottom: 5 },
  roleBadge: { backgroundColor: '#e9ecef', color: '#495057', fontSize: 10, fontWeight: 'bold', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start' },
  
  actionButtons: { flexDirection: 'row' },
  editBtn: { backgroundColor: '#0d6efd', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, marginRight: 8 },
  deleteBtn: { backgroundColor: '#dc3545', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', padding: 20, borderRadius: 12, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  inputLabel: { fontSize: 12, fontWeight: 'bold', color: '#6c757d', marginBottom: 5, marginTop: 10 },
  input: { backgroundColor: '#f8f9fa', borderWidth: 1, borderColor: '#dee2e6', borderRadius: 6, padding: 10, fontSize: 14, color: '#333' },
  
  roleContainer: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 5 },
  roleOption: { flex: 1, paddingVertical: 8, marginHorizontal: 2, borderWidth: 1, borderColor: '#dee2e6', borderRadius: 6, alignItems: 'center' },
  roleOptionActive: { backgroundColor: '#e7f1ff', borderColor: '#0d6efd' },
  roleOptionText: { fontSize: 10, fontWeight: 'bold', color: '#6c757d' },
  roleOptionTextActive: { color: '#0d6efd' },

  modalButtonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 25 },
  cancelBtn: { flex: 1, padding: 12, alignItems: 'center', marginRight: 10 },
  cancelBtnText: { color: '#6c757d', fontWeight: 'bold' },
  saveBtn: { flex: 1, backgroundColor: '#0d6efd', padding: 12, borderRadius: 6, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: 'bold' }
});