import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { fetchDashboardData } from '../services/api';

// Define the shape of your dashboard data
interface DashboardStats {
  total_bookings: number;
  confirmed: number;
  pending: number;
  total_pax: number;
  recent_bookings: any[];
}

export default function DashboardScreen() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // State for Pull-to-Refresh
  const [activeFilter, setActiveFilter] = useState('today'); // 'today', 'week', 'month', 'all'

  // Standard load function
  const loadDashboard = async (filter = activeFilter) => {
    setLoading(true);
    const result = await fetchDashboardData(filter);
    if (result.status === 'success') {
      setStats(result.data);
    }
    setLoading(false);
  };

  // Pull-to-Refresh function
  const onRefresh = useCallback(async () => {
    setRefreshing(true); // Show the spinning wheel
    const result = await fetchDashboardData(activeFilter); // Fetch latest data for current filter
    if (result.status === 'success') {
      setStats(result.data);
    }
    setRefreshing(false); // Hide the spinning wheel
  }, [activeFilter]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [activeFilter])
  );

  // Helper component for filter buttons
  const FilterButton = ({ label, value }: { label: string, value: string }) => (
    <TouchableOpacity 
      style={[styles.filterBtn, activeFilter === value && styles.filterBtnActive]} 
      onPress={() => setActiveFilter(value)}
    >
      <Text style={[styles.filterText, activeFilter === value && styles.filterTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* HEADER FILTERS */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <FilterButton label="Today" value="today" />
          <FilterButton label="This Week" value="week" />
          <FilterButton label="This Month" value="month" />
          <FilterButton label="All Time" value="all" />
        </ScrollView>
      </View>

      {/* Show big spinner only on first load, not during pull-to-refresh */}
      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#0d6efd" style={{ marginTop: 50 }} />
      ) : (
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          // --- PULL TO REFRESH CONTROL ---
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              colors={["#0d6efd"]} 
              tintColor="#0d6efd" 
            />
          }
        >
          {/* SUMMARY GRID */}
          <View style={styles.grid}>
            <View style={[styles.statCard, { borderTopColor: '#0d6efd' }]}>
              <Text style={styles.statLabel}>Total Bookings</Text>
              <Text style={styles.statValue}>{stats?.total_bookings || 0}</Text>
            </View>
            <View style={[styles.statCard, { borderTopColor: '#17a2b8' }]}>
              <Text style={styles.statLabel}>Total Pax</Text>
              <Text style={styles.statValue}>{stats?.total_pax || 0}</Text>
            </View>
            <View style={[styles.statCard, { borderTopColor: '#28a745' }]}>
              <Text style={styles.statLabel}>Confirmed</Text>
              <Text style={[styles.statValue, { color: '#28a745' }]}>{stats?.confirmed || 0}</Text>
            </View>
            <View style={[styles.statCard, { borderTopColor: '#ffc107' }]}>
              <Text style={styles.statLabel}>Pending</Text>
              <Text style={[styles.statValue, { color: '#d39e00' }]}>{stats?.pending || 0}</Text>
            </View>
          </View>

          {/* RECENT BOOKINGS PREVIEW */}
          <Text style={styles.sectionTitle}>Recent Bookings (All Time)</Text>
          <View style={styles.recentList}>
            {stats?.recent_bookings && stats.recent_bookings.length > 0 ? (
              stats.recent_bookings.map((booking, index) => {
                const isConfirmed = booking.Confirm && booking.Confirm.trim() === 'True';
                return (
                  <View key={index} style={styles.recentItem}>
                    <View>
                      <Text style={styles.recentCompany}>{booking.TourCompany}</Text>
                      <Text style={styles.recentDate}>Date: {booking.BookingDate} | Pax: {booking.Pax}</Text>
                    </View>
                    <Text style={[styles.badge, isConfirmed ? styles.badgeConfirmed : styles.badgePending]}>
                      {isConfirmed ? 'Confirmed' : 'Pending'}
                    </Text>
                  </View>
                );
              })
            ) : (
              <Text style={styles.emptyText}>No recent bookings found.</Text>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f9' },
  filterContainer: { backgroundColor: '#fff', paddingVertical: 10, elevation: 2, zIndex: 10 },
  filterScroll: { paddingHorizontal: 15, gap: 10 },
  filterBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#e9ecef' },
  filterBtnActive: { backgroundColor: '#0d6efd' },
  filterText: { color: '#495057', fontWeight: 'bold', fontSize: 13 },
  filterTextActive: { color: '#fff' },
  
  scrollContent: { padding: 15, paddingBottom: 30 },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 25 },
  statCard: { 
    width: '48%', 
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 8, 
    marginBottom: 15, 
    elevation: 2,
    borderTopWidth: 4 
  },
  statLabel: { fontSize: 13, color: '#6c757d', fontWeight: '600', marginBottom: 5 },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#333' },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  recentList: { backgroundColor: '#fff', borderRadius: 8, elevation: 2, overflow: 'hidden' },
  recentItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f1f1f1' 
  },
  recentCompany: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 3 },
  recentDate: { fontSize: 12, color: '#6c757d' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, fontSize: 11, fontWeight: 'bold', overflow: 'hidden' },
  badgeConfirmed: { backgroundColor: '#d4edda', color: '#155724' },
  badgePending: { backgroundColor: '#fff3cd', color: '#856404' },
  emptyText: { padding: 20, textAlign: 'center', color: '#888' }
});