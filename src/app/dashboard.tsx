// src/app/dashboard.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { fetchDashboardData } from '../services/api';

export default function DashboardScreen() {
  const [filter, setFilter] = useState('today');
  const [summary, setSummary] = useState({ total_books: 0, total_pax: 0 });
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Reload data whenever the filter changes
  useEffect(() => {
    loadDashboard();
  }, [filter]);

  const loadDashboard = async () => {
    setLoading(true);
    const result = await fetchDashboardData(filter);
    
    if (result.status === 'success') {
      setSummary(result.summary);
      setBookings(result.data);
    }
    setLoading(false);
  };

  const renderBookingItem = ({ item }) => {
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
            <Text style={styles.detailText}>Date: <Text style={styles.boldText}>{item.BookingDate}</Text></Text>
            <Text style={styles.detailText}>Pax: <Text style={styles.boldText}>{item.Pax}</Text></Text>
        </View>
        <View style={styles.detailsRow}>
            <Text style={styles.detailText}>Meal: <Text style={styles.boldText}>{item.Meal}</Text></Text>
            <Text style={styles.detailText}>Guide: <Text style={styles.boldText}>{item.TourGuideName}</Text></Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        {['today', 'month', 'year'].map((f) => (
          <TouchableOpacity 
            key={f} 
            style={[styles.filterButton, filter === f && styles.filterButtonActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={[styles.summaryBox, { backgroundColor: '#0d6efd' }]}>
            <Text style={styles.summaryLabel}>Bookings</Text>
            <Text style={styles.summaryValue}>{summary.total_books}</Text>
        </View>
        <View style={[styles.summaryBox, { backgroundColor: '#198754' }]}>
            <Text style={styles.summaryLabel}>Guests (Pax)</Text>
            <Text style={styles.summaryValue}>{summary.total_pax}</Text>
        </View>
      </View>

      <Text style={styles.listTitle}>Schedule</Text>

      {/* List */}
      {loading ? (
        <ActivityIndicator size="large" color="#0d6efd" style={{ marginTop: 30 }} />
      ) : (
        <FlatList 
          data={bookings}
          keyExtractor={(item) => item.BookingID.toString()}
          renderItem={renderBookingItem}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={styles.emptyText}>No tours scheduled for this timeframe.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Removed paddingTop: 50 so it aligns perfectly with the Drawer header
  container: { flex: 1, padding: 20, backgroundColor: '#f4f6f9' },
  
  filterContainer: { flexDirection: 'row', backgroundColor: '#e9ecef', borderRadius: 8, padding: 4, marginBottom: 20 },
  filterButton: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  filterButtonActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  filterText: { color: '#6c757d', fontWeight: 'bold' },
  filterTextActive: { color: '#0d6efd' },

  summaryContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  summaryBox: { flex: 0.48, padding: 20, borderRadius: 10, alignItems: 'center', elevation: 3 },
  summaryLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '600', marginBottom: 5 },
  summaryValue: { color: '#fff', fontSize: 28, fontWeight: 'bold' },

  listTitle: { fontSize: 18, fontWeight: 'bold', color: '#495057', marginBottom: 10 },
  
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 12, elevation: 2, borderLeftWidth: 4, borderLeftColor: '#0d6efd' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  tourCompany: { fontSize: 16, fontWeight: 'bold', color: '#333', flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, fontSize: 12, fontWeight: 'bold', overflow: 'hidden' },
  statusConfirmed: { backgroundColor: '#d4edda', color: '#155724' },
  statusPending: { backgroundColor: '#fff3cd', color: '#856404' },
  detailsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  detailText: { fontSize: 14, color: '#6c757d' },
  boldText: { fontWeight: 'bold', color: '#333' },
  emptyText: { textAlign: 'center', marginTop: 30, fontSize: 15, color: '#888', fontStyle: 'italic' }
});