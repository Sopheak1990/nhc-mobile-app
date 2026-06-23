import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Platform, Modal, TextInput, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { fetchBookings, updateBooking, deleteBooking } from '../services/api';

// --- DEFINED INTERFACE TO FIX 'PROPERTY DOES NOT EXIST' ERROR ---
interface Booking {
  BookingID: number;
  TourCompany: string;
  BookingCode: string;
  BookingDate: string;
  Pax: number | string;
  Meal: string;
  TourGuideName: string;
  TourGuideContact: string;
  Confirm: string;
}

export default function AllBookingsScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('');
  
  // Modal States
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [isDeleteModalVisible, setDeleteModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Booking | null>(null);

  // Filter & Sort States
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [sortOrder, setSortOrder] = useState('desc'); 

  useFocusEffect(
    useCallback(() => {
      const initPage = async () => {
        const role = await AsyncStorage.getItem('userRole');
        setUserRole(role || '');
        loadBookings();
      };
      initPage();
    }, [sortOrder])
  );

  const formatDateForDB = (date: Date | null) => date ? date.toISOString().split('T')[0] : '';
  const formatDateForScreen = (date: Date | null) => date ? date.toLocaleDateString('en-GB') : 'Select Date';

  const loadBookings = async (overrideStart = startDate, overrideEnd = endDate) => {
    setLoading(true);
    const result = await fetchBookings(formatDateForDB(overrideStart), formatDateForDB(overrideEnd), sortOrder);
    if (result.status === 'success') setBookings(result.data);
    setLoading(false);
  };

  const clearFilters = () => {
    setStartDate(null);
    setEndDate(null);
    loadBookings(null, null); 
  };

  const handleEdit = (item: Booking) => { setEditingItem(item); setEditModalVisible(true); };
  const handleDelete = (item: Booking) => { setEditingItem(item); setDeleteModalVisible(true); };

  const saveEdit = async () => {
    if (!editingItem) return; // Guard clause to prevent null errors
    
    const result = await updateBooking(editingItem);
    
    if (result && result.status === 'success') {
      Alert.alert("Success", "Booking updated successfully!");
      setEditModalVisible(false);
      loadBookings(); // Refresh the list
    } else {
      Alert.alert("Error", result ? result.message : "Failed to update.");
    }
  };

  const confirmDelete = async () => {
    if (!editingItem) return; // Guard clause to prevent null errors

    const userId = await AsyncStorage.getItem('userId');
    const result = await deleteBooking(editingItem.BookingID, userId);
    
    if (result && result.status === 'success') {
      Alert.alert("Success", "Booking deleted.");
      setDeleteModalVisible(false);
      loadBookings();
    } else {
      Alert.alert("Error", result ? result.message : "Failed to delete.");
    }
  };

  const renderBookingItem = ({ item }: { item: Booking }) => {
    const isConfirmed = item.Confirm && item.Confirm.trim() === 'True';
    const role = userRole ? userRole.toLowerCase().trim() : '';
    const canModify = role === 'super_admin' || role === 'manager';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.tourCompany}>{item.TourCompany}</Text>
          <Text style={[styles.statusBadge, isConfirmed ? styles.statusConfirmed : styles.statusPending]}>
            {isConfirmed ? 'Confirmed' : 'Pending'}
          </Text>
        </View>
        <View style={styles.detailsRow}>
            <Text style={styles.detailText}>Code: <Text style={styles.boldText}>{item.BookingCode}</Text></Text>
            <Text style={styles.detailText}>Date: <Text style={styles.boldText}>{item.BookingDate}</Text></Text>
        </View>
        <View style={styles.detailsRow}>
            <Text style={styles.detailText}>Pax: <Text style={styles.boldText}>{item.Pax}</Text></Text>
            <Text style={styles.detailText}>Meal: <Text style={styles.boldText}>{item.Meal}</Text></Text>
        </View>
        <View style={styles.guideBox}>
            <Text style={styles.guideText}>Guide: {item.TourGuideName}</Text>
            <Text style={styles.guideText}>Contact: {item.TourGuideContact}</Text>
        </View>

        {canModify && (
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity style={styles.editBtn} onPress={() => handleEdit(item)}><Text style={styles.btnText}>Edit</Text></TouchableOpacity>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}><Text style={styles.btnText}>Delete</Text></TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.filterBox}>
        <View style={styles.dateButtonsRow}>
            <TouchableOpacity style={styles.dateButton} onPress={() => setShowStartPicker(true)}>
                <Text style={styles.dateLabel}>From:</Text>
                <Text style={styles.dateValue}>{formatDateForScreen(startDate)}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dateButton} onPress={() => setShowEndPicker(true)}>
                <Text style={styles.dateLabel}>To:</Text>
                <Text style={styles.dateValue}>{formatDateForScreen(endDate)}</Text>
            </TouchableOpacity>
        </View>
        <View style={styles.actionButtonsRow}>
            <TouchableOpacity style={styles.clearButton} onPress={clearFilters}><Text style={styles.clearButtonText}>Clear</Text></TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={() => loadBookings()}><Text style={styles.applyButtonText}>Apply Filter</Text></TouchableOpacity>
        </View>
      </View>

      {Platform.OS === 'android' && showStartPicker && <DateTimePicker value={startDate || new Date()} mode="date" display="default" onChange={(e, d) => { setShowStartPicker(false); if(d) setStartDate(d); }} />}
      {Platform.OS === 'android' && showEndPicker && <DateTimePicker value={endDate || new Date()} mode="date" display="default" onChange={(e, d) => { setShowEndPicker(false); if(d) setEndDate(d); }} />}

      <View style={styles.listHeaderRow}>
        <Text style={styles.listTitle}>Master List</Text>
        <TouchableOpacity style={styles.sortButton} onPress={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}>
          <Text style={styles.sortButtonText}>{sortOrder === 'desc' ? '↓ Newest' : '↑ Oldest'}</Text>
        </TouchableOpacity>
      </View>

      {loading ? <ActivityIndicator size="large" color="#0d6efd" style={{ marginTop: 30 }} /> : (
        <FlatList data={bookings} keyExtractor={(item) => item.BookingID.toString()} renderItem={renderBookingItem} contentContainerStyle={{ paddingBottom: 20 }} ListEmptyComponent={<Text style={styles.emptyText}>No bookings found.</Text>} />
      )}

      {/* EDIT MODAL */}
      <Modal visible={isEditModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Booking #{editingItem?.BookingID}</Text>
            
            <Text style={styles.inputLabel}>Tour Company</Text>
            <TextInput style={styles.input} value={editingItem?.TourCompany} onChangeText={(t) => setEditingItem(prev => prev ? {...prev, TourCompany: t} : null)} />
            
            <Text style={styles.inputLabel}>Booking Code</Text>
            <TextInput style={styles.input} value={editingItem?.BookingCode} onChangeText={(t) => setEditingItem(prev => prev ? {...prev, BookingCode: t} : null)} />
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ flex: 0.45 }}>
                <Text style={styles.inputLabel}>Pax</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={String(editingItem?.Pax || '')} onChangeText={(t) => setEditingItem(prev => prev ? {...prev, Pax: t} : null)} />
              </View>
              <View style={{ flex: 0.45 }}>
                <Text style={styles.inputLabel}>Meal</Text>
                <TextInput style={styles.input} value={editingItem?.Meal} onChangeText={(t) => setEditingItem(prev => prev ? {...prev, Meal: t} : null)} />
              </View>
            </View>

            <Text style={styles.inputLabel}>Tour Guide Name</Text>
            <TextInput style={styles.input} value={editingItem?.TourGuideName} onChangeText={(t) => setEditingItem(prev => prev ? {...prev, TourGuideName: t} : null)} />

            <View style={styles.actionButtonsRow}>
              <TouchableOpacity style={styles.clearButton} onPress={() => setEditModalVisible(false)}>
                <Text style={styles.clearButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyButton} onPress={saveEdit}>
                <Text style={styles.applyButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* DELETE MODAL */}
      <Modal visible={isDeleteModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Delete</Text>
            <Text>Are you sure you want to delete #{editingItem?.BookingCode}?</Text>
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity style={styles.clearButton} onPress={() => setDeleteModalVisible(false)}><Text style={styles.clearButtonText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.deleteBtn, {flex: 0.65}]} onPress={confirmDelete}><Text style={styles.btnText}>Delete</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: '#f4f6f9' },
  filterBox: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, elevation: 2 },
  dateButtonsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  dateButton: { flex: 0.48, padding: 10, borderWidth: 1, borderColor: '#dee2e6', borderRadius: 6, backgroundColor: '#f8f9fa' },
  dateLabel: { fontSize: 12, color: '#6c757d' },
  dateValue: { fontSize: 14, fontWeight: 'bold' },
  actionButtonsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  clearButton: { flex: 0.3, padding: 10, alignItems: 'center', borderRadius: 6, backgroundColor: '#e9ecef' },
  clearButtonText: { fontWeight: 'bold', color: '#333' },
  applyButton: { flex: 0.65, padding: 10, alignItems: 'center', borderRadius: 6, backgroundColor: '#0d6efd' },
  applyButtonText: { color: '#fff', fontWeight: 'bold' },
  listHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  listTitle: { fontSize: 18, fontWeight: 'bold' },
  sortButton: { backgroundColor: '#e9ecef', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  sortButtonText: { fontSize: 12, fontWeight: 'bold', color: '#0d6efd' },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 12, elevation: 2, borderLeftWidth: 4, borderLeftColor: '#0d6efd' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  tourCompany: { fontSize: 16, fontWeight: 'bold' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, fontSize: 12, fontWeight: 'bold' },
  statusConfirmed: { backgroundColor: '#d4edda', color: '#155724' },
  statusPending: { backgroundColor: '#fff3cd', color: '#856404' },
  detailsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  detailText: { fontSize: 14, color: '#6c757d' },
  boldText: { fontWeight: 'bold', color: '#333' },
  guideBox: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#eee' },
  guideText: { fontSize: 13, color: '#555' },
  editBtn: { backgroundColor: '#0d6efd', padding: 8, borderRadius: 5, flex: 1, alignItems: 'center', marginRight: 10 },
  deleteBtn: { backgroundColor: '#dc3545', padding: 8, borderRadius: 5, flex: 1, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  emptyText: { textAlign: 'center', marginTop: 30, fontSize: 15, color: '#888' },
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 },
  modalContent: { backgroundColor: '#fff', padding: 20, borderRadius: 10, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 5, marginBottom: 15 },
  inputLabel: { fontSize: 12, color: '#666', marginBottom: 5, fontWeight: '600' } // Added missing style
});