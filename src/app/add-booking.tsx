import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Platform, Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { createBooking } from '../services/api';

export default function AddBookingScreen() {
  const [loading, setLoading] = useState(false);

  // Form States
  const [bookingDate, setBookingDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  
  const [tourCompany, setTourCompany] = useState('');
  const [bookingCode, setBookingCode] = useState('');
  const [pax, setPax] = useState('');
  const [meal, setMeal] = useState('Lunch'); // Default to Lunch
  const [guideName, setGuideName] = useState('');
  const [guideContact, setGuideContact] = useState('');
  const [confirm, setConfirm] = useState('False'); // Default to Pending (False)

  // Date Handlers
  const onChangeDate = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowPicker(false);
    if (selectedDate) setBookingDate(selectedDate);
  };

  const formatDateForDB = (date: Date) => date.toISOString().split('T')[0];
  const formatDateForScreen = (date: Date) => date.toLocaleDateString('en-GB');

  // Submit Handler
  const handleSubmit = async () => {
    // 1. Basic Validation
    if (!tourCompany || !bookingCode || !pax || !guideName) {
      Alert.alert("Missing Fields", "Please fill out all required fields before saving.");
      return;
    }

    setLoading(true);

    // 2. Format data for the PHP API
    const newBookingData = {
      BookingDate: formatDateForDB(bookingDate),
      TourCompany: tourCompany,
      BookingCode: bookingCode,
      Pax: pax,
      Meal: meal,
      TourGuideName: guideName,
      TourGuideContact: guideContact,
      Confirm: confirm
    };

    // 3. Send to Server
    const result = await createBooking(newBookingData);
    
    setLoading(false);

    if (result.status === 'success') {
      Alert.alert("Success!", result.message, [
        { text: "OK", onPress: () => router.navigate('/all-bookings') } // Send them to the list to see it
      ]);
    } else {
      Alert.alert("Error", result.message);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* --- ADDED BACK BUTTON --- */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.navigate('/all-bookings')}>
          <Text style={styles.backButtonText}>← Back to All Bookings</Text>
        </TouchableOpacity>

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>New Reservation</Text>

          {/* Date Picker Trigger */}
          <Text style={styles.label}>Booking Date *</Text>
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowPicker(true)}>
            <Text style={styles.dateButtonText}>{formatDateForScreen(bookingDate)}</Text>
          </TouchableOpacity>

          <Text style={styles.label}>Tour Company *</Text>
          <TextInput style={styles.input} placeholder="e.g., G-Adventure" value={tourCompany} onChangeText={setTourCompany} />

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>Booking Code *</Text>
              <TextInput style={styles.input} placeholder="Must be unique" value={bookingCode} onChangeText={setBookingCode} autoCapitalize="characters" />
            </View>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>Total Pax *</Text>
              <TextInput style={styles.input} placeholder="0" value={pax} onChangeText={setPax} keyboardType="numeric" />
            </View>
          </View>

          {/* Custom Meal Toggle */}
          <Text style={styles.label}>Meal Type</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity style={[styles.toggleBtn, meal === 'Lunch' && styles.toggleBtnActive]} onPress={() => setMeal('Lunch')}>
              <Text style={[styles.toggleText, meal === 'Lunch' && styles.toggleTextActive]}>☀️ Lunch</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.toggleBtn, meal === 'Dinner' && styles.toggleBtnActive]} onPress={() => setMeal('Dinner')}>
              <Text style={[styles.toggleText, meal === 'Dinner' && styles.toggleTextActive]}>🌙 Dinner</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Tour Guide Name *</Text>
          <TextInput style={styles.input} placeholder="Guide Full Name" value={guideName} onChangeText={setGuideName} />

          <Text style={styles.label}>Guide Contact</Text>
          <TextInput style={styles.input} placeholder="Phone Number" value={guideContact} onChangeText={setGuideContact} keyboardType="phone-pad" />

          {/* Custom Status Toggle */}
          <Text style={styles.label}>Confirmation Status</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity style={[styles.toggleBtn, confirm === 'False' && styles.togglePending]} onPress={() => setConfirm('False')}>
              <Text style={[styles.toggleText, confirm === 'False' && styles.togglePendingText]}>Pending</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.toggleBtn, confirm === 'True' && styles.toggleConfirmed]} onPress={() => setConfirm('True')}>
              <Text style={[styles.toggleText, confirm === 'True' && styles.toggleConfirmedText]}>Confirmed</Text>
            </TouchableOpacity>
          </View>

          {/* Submit Button */}
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Save Booking</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* --- DATE PICKERS --- */}
      {Platform.OS === 'android' && showPicker && (
        <DateTimePicker value={bookingDate} mode="date" display="calendar" onChange={onChangeDate} />
      )}
      {Platform.OS === 'ios' && showPicker && (
        <Modal transparent={true} animationType="slide" visible={true}>
          <View style={styles.iosPickerContainer}>
            <View style={styles.iosPickerInner}>
              <View style={styles.iosPickerHeader}>
                <TouchableOpacity onPress={() => setShowPicker(false)}><Text style={styles.iosPickerDone}>Done</Text></TouchableOpacity>
              </View>
              <DateTimePicker value={bookingDate} mode="date" display="spinner" onChange={onChangeDate} style={{ backgroundColor: 'white' }} textColor="#000" />
            </View>
          </View>
        </Modal>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f9' },
  scrollContent: { padding: 15, paddingBottom: 40 },
  
  // --- Back Button Styles ---
  backButton: { marginBottom: 15, alignSelf: 'flex-start' },
  backButtonText: { color: '#0d6efd', fontSize: 16, fontWeight: '600' },

  formCard: { backgroundColor: '#fff', padding: 20, borderRadius: 10, elevation: 3 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', color: '#343a40', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 10 },
  
  label: { fontSize: 13, fontWeight: 'bold', color: '#6c757d', marginBottom: 6, marginTop: 10 },
  input: { borderWidth: 1, borderColor: '#ced4da', borderRadius: 8, padding: 12, fontSize: 15, backgroundColor: '#f8f9fa', color: '#333' },
  
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  halfWidth: { flex: 0.48 },

  dateButton: { borderWidth: 1, borderColor: '#ced4da', borderRadius: 8, padding: 14, backgroundColor: '#f8f9fa' },
  dateButtonText: { fontSize: 15, color: '#333', fontWeight: '500' },

  toggleRow: { flexDirection: 'row', backgroundColor: '#e9ecef', borderRadius: 8, padding: 4, marginTop: 5 },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6 },
  toggleText: { color: '#6c757d', fontWeight: 'bold', fontSize: 14 },
  
  toggleBtnActive: { backgroundColor: '#0d6efd', elevation: 2 },
  toggleTextActive: { color: '#fff' },
  
  togglePending: { backgroundColor: '#ffc107', elevation: 2 },
  togglePendingText: { color: '#000' },
  toggleConfirmed: { backgroundColor: '#198754', elevation: 2 },
  toggleConfirmedText: { color: '#fff' },

  submitButton: { backgroundColor: '#0d6efd', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 30 },
  submitButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  // iOS Picker Styles
  iosPickerContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  iosPickerInner: { backgroundColor: '#fff', paddingBottom: 20 },
  iosPickerHeader: { flexDirection: 'row', justifyContent: 'flex-end', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: '#f8f9fa' },
  iosPickerDone: { color: '#0d6efd', fontWeight: 'bold', fontSize: 16 }
});