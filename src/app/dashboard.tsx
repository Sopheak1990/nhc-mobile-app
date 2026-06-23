import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchDashboardData } from '../services/api';

// Define the shape of your dashboard data
interface DashboardStats {
  total_bookings: number;
  total_pax: number;
  confirmed: number;
  pending: number;
  recent_bookings: any[];
}

export default function DashboardScreen() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('today'); // 'today', 'month', 'year'
  const [userRole, setUserRole] = useState(''); // Added user role state

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
    setRefreshing(true);
    const result = await fetchDashboardData(activeFilter);
    if (result.status === 'success') {
      setStats(result.data);
    }
    setRefreshing(false);
  }, [activeFilter]);

  // Load Role and Dashboard Data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const initPage = async () => {
        const role = await AsyncStorage.getItem('userRole');
        setUserRole(role || '');
        loadDashboard();
      };
      initPage();
    }, [activeFilter])
  );

  // Dynamic Text Helpers
  const getOverviewTitle = () => {
    if (activeFilter === 'month') return "This Month's Overview";
    if (activeFilter === 'year') return "This Year's Overview";
    return "Today's Overview";
  };

  const getDateBadge = () => {
    const date = new Date();
    if (activeFilter === 'month') return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    if (activeFilter === 'year') return date.getFullYear().toString();
    return date.toLocaleDateString('en-GB', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  // Format list dates elegantly (e.g., "Tue, 23 Jun 2026")
  const formatListDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; 
    return date.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Filter Button Component
  const FilterButton = ({ label, value }: { label: string, value: string }) => (
    <TouchableOpacity 
      style={[styles.filterBtn, activeFilter === value ? styles.filterBtnActive : styles.filterBtnInactive]} 
      onPress={() => setActiveFilter(value)}
    >
      <Text style={[styles.filterText, activeFilter === value ? styles.filterTextActive : styles.filterTextInactive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  // Role verification (True if super_admin or manager)
  const role = userRole ? userRole.toLowerCase().trim() : '';
  const canModify = role === 'super_admin' || role === 'manager';

  return (
    <View style={styles.container}>
      {/* HEADER SECTION */}
      <View style={styles.headerContainer}>
        <View style={styles.headerTextRow}>
          <Text style={styles.pageTitle}>{getOverviewTitle()}</Text>
          <View style={styles.dateBadge}>
            <Text style={styles.dateBadgeText}>📅 {getDateBadge()}</Text>
          </View>
        </View>

        {/* BUTTON GROUP */}
        <View style={styles.btnGroup}>
          <FilterButton label="Today" value="today" />
          <FilterButton label="Month" value="month" />
          <FilterButton label="Year" value="year" />
        </View>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#0d6efd" style={{ marginTop: 50 }} />
      ) : (
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#0d6efd"]} />}
          stickyHeaderIndices={[0]} // <--- THIS LOCKS THE FIRST CHILD (The Sticky Wrapper)
        >
          {/* INDEX 0: STICKY WRAPPER (Stats Cards + Quick Action) */}
          <View style={styles.stickyWrapper}>
            {/* STATS CARDS */}
            <View style={styles.row}>
              <View style={[styles.statCard, styles.bgPrimary]}>
                <Text style={styles.statCardTitle}>Bookings</Text>
                <Text style={styles.statCardValue}>{stats?.total_bookings || 0}</Text>
              </View>
              <View style={[styles.statCard, styles.bgSuccess]}>
                <Text style={styles.statCardTitle}>Guests (Pax)</Text>
                <Text style={styles.statCardValue}>{stats?.total_pax || 0}</Text>
              </View>
            </View>

            {/* QUICK ACTION CARD MOVED INSIDE STICKY WRAPPER */}
            {canModify && (
              <View style={[styles.quickActionCard, styles.bgWarning]}>
                <Text style={styles.quickActionTitle}>Quick Action</Text>
                <TouchableOpacity style={styles.quickActionBtn} onPress={() => router.navigate('/add-booking')}>
                  <Text style={styles.quickActionBtnText}>➕ Add New Booking</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* INDEX 1+: SCROLLABLE CONTENT (List starts here) */}
          <View style={styles.scrollableContentSection}>
            {/* BOOKING SCHEDULE LIST */}
            <View style={styles.listContainer}>
              <View style={styles.listHeader}>
                <Text style={styles.listHeaderTitle}>📋 Booking Schedule</Text>
              </View>
              <View style={styles.listBody}>
                {stats?.recent_bookings && stats.recent_bookings.length > 0 ? (
                  stats.recent_bookings.map((tour) => {
                    const isConfirmed = tour.Confirm && tour.Confirm.trim() === 'True';
                    const isLunch = tour.Meal === 'Lunch';

                    return (
                      <View key={tour.BookingID} style={styles.listItem}>
                        {/* Top Row: Company & Status */}
                        <View style={styles.itemRow}>
                          <Text style={styles.itemCompany}>{tour.TourCompany}</Text>
                          <Text style={[styles.statusBadge, isConfirmed ? styles.statusConfirmed : styles.statusPending]}>
                            {isConfirmed ? '✓ Confirmed' : '⏱ Pending'}
                          </Text>
                        </View>
                        
                        {/* Second Row: Date & Pax */}
                        <View style={styles.itemRow}>
                          <Text style={styles.itemDate}>{formatListDate(tour.BookingDate)}</Text>
                          <Text style={styles.itemPax}>Pax: {tour.Pax}</Text>
                        </View>

                        {/* Third Row: Guide & Meal */}
                        <View style={[styles.itemRow, { marginTop: 8 }]}>
                          <View style={styles.guideInfo}>
                            <Text style={styles.guideName}>{tour.TourGuideName}</Text>
                            <Text style={styles.guideContact}>📞 {tour.TourGuideContact || 'N/A'}</Text>
                          </View>
                          <View>
                            <Text style={[styles.mealBadge, isLunch ? styles.mealLunch : styles.mealDinner]}>
                              {isLunch ? '☀️ Lunch' : '🌙 Dinner'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  })
                ) : (
                  <Text style={styles.emptyText}>No tours scheduled for this timeframe.</Text>
                )}
              </View>
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f9' },
  
  // Header & Filters
  headerContainer: { backgroundColor: '#fff', padding: 15, borderBottomWidth: 1, borderBottomColor: '#dee2e6', zIndex: 10 },
  headerTextRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  pageTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  dateBadge: { backgroundColor: '#6c757d', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  dateBadgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  
  btnGroup: { flexDirection: 'row', borderRadius: 6, overflow: 'hidden', borderWidth: 1, borderColor: '#0d6efd' },
  filterBtn: { flex: 1, paddingVertical: 8, alignItems: 'center' },
  filterBtnActive: { backgroundColor: '#0d6efd' },
  filterBtnInactive: { backgroundColor: '#fff' },
  filterText: { fontSize: 13, fontWeight: 'bold' },
  filterTextActive: { color: '#fff' },
  filterTextInactive: { color: '#0d6efd' },

  scrollContent: { paddingBottom: 40 }, // Removed horizontal padding so sticky header goes edge-to-edge

  // Sticky Wrapper
  stickyWrapper: {
    backgroundColor: '#f4f6f9', // Matches app background so list hides under it
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 5,
    zIndex: 100, // Keeps it above the scrolling list
  },
  
  // Scrollable Content Layout
  scrollableContentSection: {
    paddingHorizontal: 15,
  },

  // Summary Cards
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  statCard: { flex: 0.48, padding: 15, borderRadius: 8, elevation: 2 },
  bgPrimary: { backgroundColor: '#0d6efd' },
  bgSuccess: { backgroundColor: '#198754' },
  statCardTitle: { color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 5 },
  statCardValue: { color: '#fff', fontSize: 28, fontWeight: 'bold' },

  // Quick Action Card
  quickActionCard: { padding: 15, borderRadius: 8, elevation: 2, marginBottom: 10, alignItems: 'center' },
  bgWarning: { backgroundColor: '#ffc107' },
  quickActionTitle: { color: '#212529', fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  quickActionBtn: { backgroundColor: '#212529', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 6, width: '100%', alignItems: 'center' },
  quickActionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

  // List Container
  listContainer: { backgroundColor: '#fff', borderRadius: 8, elevation: 2, overflow: 'hidden' },
  listHeader: { backgroundColor: '#fff', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  listHeaderTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  listBody: { padding: 0 },
  
  // List Item Formats
  listItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#f1f1f1' },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  itemCompany: { fontSize: 16, fontWeight: 'bold', color: '#0d6efd' },
  itemDate: { fontSize: 14, color: '#495057', fontWeight: '500' },
  itemPax: { fontSize: 14, fontWeight: 'bold', color: '#212529' },
  
  guideInfo: { flex: 1 },
  guideName: { fontSize: 14, color: '#333' },
  guideContact: { fontSize: 12, color: '#6c757d', marginTop: 2 },
  
  // Badges
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, fontSize: 11, fontWeight: 'bold' },
  statusConfirmed: { backgroundColor: '#d4edda', color: '#155724' },
  statusPending: { backgroundColor: '#fff3cd', color: '#856404' },
  
  mealBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, fontSize: 11, fontWeight: 'bold' },
  mealLunch: { backgroundColor: '#ffc107', color: '#000' },
  mealDinner: { backgroundColor: '#212529', color: '#fff' },

  emptyText: { padding: 20, textAlign: 'center', color: '#888', fontStyle: 'italic' }
});