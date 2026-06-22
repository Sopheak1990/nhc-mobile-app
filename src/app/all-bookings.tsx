// src/app/all-bookings.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Platform, Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { fetchBookings } from '../services/api';

export default function AllBookingsScreen() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & Sort States
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [sortOrder, setSortOrder] = useState('desc'); 

  useEffect(() => {
    loadBookings();
  }, [sortOrder]);

  const formatDateForDB = (date: Date | null) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  const formatDateForScreen = (date: Date | null) => {
    if (!date) return 'Select Date';
    return date.toLocaleDateString('en-GB'); 
  };

  const loadBookings = async (overrideStart = startDate, overrideEnd = endDate) => {
    setLoading(true);
    const result = await fetchBookings(formatDateForDB(overrideStart), formatDateForDB(overrideEnd), sortOrder);
    if (result.status === 'success') {
      setBookings(result.data);
    }
    setLoading(false);
  };

  const clearFilters = () => {
    setStartDate(null);
    setEndDate(null);
    loadBookings(null, null); 
  };

  // --- UPDATED PICKER HANDLERS ---
  const onChangeStart = (event: any, selectedDate?: Date) => {
    // Android auto-closes on selection. iOS stays open until "Done" is pressed.
    if (Platform.OS === 'android') setShowStartPicker(false);
    if (selectedDate) setStartDate(selectedDate);
  };

  const onChangeEnd = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowEndPicker(false);
    if (selectedDate) setEndDate(selectedDate);
  };

  const closeIOSPicker = () => {
    setShowStartPicker(false);
    setShowEndPicker(false);
  };
  // --------------------------------

  const renderBookingItem = ({ item }: any) => {
    const isConfirmed = item.Confirm && item.Confirm.trim() === 'True';
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
      </View>
    );
  };

  return (
    <View style={styles.container}>
      
      {/* Date Range Filter UI */}
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
            <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
                <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={() => loadBookings()}>
                <Text style={styles.applyButtonText}>Apply Filter</Text>
            </TouchableOpacity>
        </View>
      </View>

      {/* --- ANDROID DATE PICKERS --- */}
      {Platform.OS === 'android' && showStartPicker && (
        <DateTimePicker value={startDate || new Date()} mode="date" display="default" onChange={onChangeStart} />
      )}
      {Platform.OS === 'android' && showEndPicker && (
        <DateTimePicker value={endDate || new Date()} mode="date" display="default" onChange={onChangeEnd} />
      )}

      {/* --- IOS NATIVE BOTTOM SHEET PICKER --- */}
      {Platform.OS === 'ios' && (showStartPicker || showEndPicker) && (
        <Modal transparent={true} animationType="slide" visible={true}>
          <View style={styles.iosPickerContainer}>
            <View style={styles.iosPickerInner}>
              <View style={styles.iosPickerHeader}>
                <TouchableOpacity onPress={closeIOSPicker}>
                  <Text style={styles.iosPickerDone}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker 
                value={(showStartPicker ? startDate : endDate) || new Date()} 
                mode="date" 
                display="spinner" // Uses the classic Apple spinning wheel
                onChange={showStartPicker ? onChangeStart : onChangeEnd} 
                style={{ backgroundColor: 'white' }}
                textColor="#000" // Forces black text for Light/Dark mode compatibility
              />
            </View>
          </View>
        </Modal>
      )}

      {/* List Header and Sort Toggle */}
      <View style={styles.listHeaderRow}>
        <Text style={styles.listTitle}>Master List</Text>
        <TouchableOpacity 
          style={styles.sortButton} 
          onPress={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
        >
          <Text style={styles.sortButtonText}>
            {sortOrder === 'desc' ? '↓ Newest First' : '↑ Oldest First'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* The Scrollable List */}
      {loading ? (
        <ActivityIndicator size="large" color="#0d6efd" style={{ marginTop: 30 }} />
      ) : (
        <FlatList 
          data={bookings}
          keyExtractor={(item) => item.BookingID.toString()}
          renderItem={renderBookingItem}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={styles.emptyText}>No bookings found for this criteria.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: '#f4f6f9' },
  
  // Filter Styles
  filterBox: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, elevation: 2 },
  dateButtonsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  dateButton: { flex: 0.48, padding: 10, borderWidth: 1, borderColor: '#dee2e6', borderRadius: 6, backgroundColor: '#f8f9fa' },
  dateLabel: { fontSize: 12, color: '#6c757d', marginBottom: 2 },
  dateValue: { fontSize: 14, fontWeight: 'bold', color: '#343a40' },
  actionButtonsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  clearButton: { flex: 0.3, padding: 10, alignItems: 'center', borderRadius: 6, backgroundColor: '#e9ecef' },
  clearButtonText: { color: '#495057', fontWeight: 'bold' },
  applyButton: { flex: 0.65, padding: 10, alignItems: 'center', borderRadius: 6, backgroundColor: '#0d6efd' },
  applyButtonText: { color: '#fff', fontWeight: 'bold' },

  // --- NEW IOS PICKER STYLES ---
  iosPickerContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  iosPickerInner: { backgroundColor: '#fff', paddingBottom: 20 },
  iosPickerHeader: { flexDirection: 'row', justifyContent: 'flex-end', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: '#f8f9fa' },
  iosPickerDone: { color: '#0d6efd', fontWeight: 'bold', fontSize: 16 },

  // Sort Header Styles
  listHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingHorizontal: 5 },
  listTitle: { fontSize: 18, fontWeight: 'bold', color: '#495057' },
  sortButton: { backgroundColor: '#e9ecef', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  sortButtonText: { fontSize: 13, fontWeight: 'bold', color: '#0d6efd' },

  // Card Styles
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 12, elevation: 2, borderLeftWidth: 4, borderLeftColor: '#0d6efd' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  tourCompany: { fontSize: 16, fontWeight: 'bold', color: '#333', flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, fontSize: 12, fontWeight: 'bold', overflow: 'hidden' },
  statusConfirmed: { backgroundColor: '#d4edda', color: '#155724' },
  statusPending: { backgroundColor: '#fff3cd', color: '#856404' },
  detailsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  detailText: { fontSize: 14, color: '#6c757d' },
  boldText: { fontWeight: 'bold', color: '#333' },
  guideBox: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#eee' },
  guideText: { fontSize: 13, color: '#555' },
  emptyText: { textAlign: 'center', marginTop: 30, fontSize: 15, color: '#888', fontStyle: 'italic' }
});