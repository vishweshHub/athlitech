import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RADIUS, useThemeColors } from '@/styles/tokens';

export function MiniAthletePreview() {
  const colors = useThemeColors();
  const styles = getStyles(colors);

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
        <Text style={styles.headerTitle}>ATHLETE DASHBOARD PREVIEW</Text>
      </View>

      {/* Grid Content */}
      <View style={styles.grid}>
        {/* Today's Workout Widget */}
        <View style={styles.widget}>
          <View style={styles.widgetHeader}>
            <Ionicons name="barbell-outline" size={14} color="#10B981" />
            <Text style={styles.widgetTitle}>TODAY&apos;S WORKOUT</Text>
          </View>
          <Text style={styles.widgetMainVal}>Sprint 5x100m</Text>
          <Text style={styles.widgetSub}>Block B • Max Velocity</Text>
        </View>

        {/* Weekly Progress Widget */}
        <View style={styles.widget}>
          <View style={styles.widgetHeader}>
            <Ionicons name="stats-chart-outline" size={14} color="#10B981" />
            <Text style={styles.widgetTitle}>WEEKLY PROGRESS</Text>
          </View>
          <Text style={styles.widgetMainVal}>85%</Text>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: '85%', backgroundColor: '#10B981' }]} />
          </View>
        </View>

        {/* PR Counter Widget */}
        <View style={styles.widget}>
          <View style={styles.widgetHeader}>
            <Ionicons name="trophy-outline" size={14} color="#10B981" />
            <Text style={styles.widgetTitle}>100M PR RECORD</Text>
          </View>
          <Text style={styles.widgetMainVal}>10.82s</Text>
          <Text style={styles.widgetSub}>+0.14s Improvement</Text>
        </View>

        {/* Streak Widget */}
        <View style={styles.widget}>
          <View style={styles.widgetHeader}>
            <Ionicons name="flame-outline" size={14} color="#F59E0B" />
            <Text style={styles.widgetTitle}>WORKOUT STREAK</Text>
          </View>
          <Text style={[styles.widgetMainVal, { color: '#F59E0B' }]}>🔥 5 Days</Text>
          <Text style={styles.widgetSub}>Active Training Week</Text>
        </View>
      </View>

      {/* Mini Performance Graph sparkline */}
      <View style={styles.graphCard}>
        <Text style={styles.graphTitle}>VELOCITY TREND (LAST 4 WEEKS)</Text>
        <View style={styles.graphBarsRow}>
          <View style={[styles.graphBar, { height: 16 }]} />
          <View style={[styles.graphBar, { height: 24 }]} />
          <View style={[styles.graphBar, { height: 32 }]} />
          <View style={[styles.graphBar, { height: 40, backgroundColor: '#10B981' }]} />
        </View>
      </View>
    </View>
  );
}

export function MiniCoachPreview() {
  const colors = useThemeColors();
  const styles = getStyles(colors);

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        <View style={[styles.dot, { backgroundColor: '#3B82F6' }]} />
        <Text style={styles.headerTitle}>COACH PLATFORM PREVIEW</Text>
      </View>

      {/* Grid Content */}
      <View style={styles.grid}>
        {/* Assigned Athletes */}
        <View style={styles.widget}>
          <View style={styles.widgetHeader}>
            <Ionicons name="people-outline" size={14} color="#3B82F6" />
            <Text style={styles.widgetTitle}>ASSIGNED ATHLETES</Text>
          </View>
          <Text style={[styles.widgetMainVal, { color: '#3B82F6' }]}>24 Active</Text>
          <Text style={styles.widgetSub}>Sprint & Velocity Roster</Text>
        </View>

        {/* Pending Reviews */}
        <View style={styles.widget}>
          <View style={styles.widgetHeader}>
            <Ionicons name="time-outline" size={14} color="#3B82F6" />
            <Text style={styles.widgetTitle}>PENDING REVIEWS</Text>
          </View>
          <Text style={[styles.widgetMainVal, { color: '#3B82F6' }]}>3 Logs</Text>
          <Text style={styles.widgetSub}>Awaiting Feedback</Text>
        </View>

        {/* Active Plans */}
        <View style={styles.widget}>
          <View style={styles.widgetHeader}>
            <Ionicons name="calendar-outline" size={14} color="#3B82F6" />
            <Text style={styles.widgetTitle}>ACTIVE PLANS</Text>
          </View>
          <Text style={styles.widgetMainVal}>Block B</Text>
          <Text style={styles.widgetSub}>Max Acceleration Cycle</Text>
        </View>

        {/* Upcoming Sessions */}
        <View style={styles.widget}>
          <View style={styles.widgetHeader}>
            <Ionicons name="navigate-outline" size={14} color="#3B82F6" />
            <Text style={styles.widgetTitle}>NEXT SESSION</Text>
          </View>
          <Text style={styles.widgetMainVal}>Tomorrow</Text>
          <Text style={styles.widgetSub}>09:00 AM • Main Track</Text>
        </View>
      </View>

      {/* Roster Readiness Sparkline */}
      <View style={styles.graphCard}>
        <Text style={styles.graphTitle}>TEAM COMPLETION RATE (92%)</Text>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: '92%', backgroundColor: '#3B82F6' }]} />
        </View>
      </View>
    </View>
  );
}

export function MiniOrgPreview() {
  const colors = useThemeColors();
  const styles = getStyles(colors);

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        <View style={[styles.dot, { backgroundColor: '#8B5CF6' }]} />
        <Text style={styles.headerTitle}>ORGANIZATION HUB PREVIEW</Text>
      </View>

      {/* Grid Content */}
      <View style={styles.grid}>
        {/* Total Members */}
        <View style={styles.widget}>
          <View style={styles.widgetHeader}>
            <Ionicons name="business-outline" size={14} color="#8B5CF6" />
            <Text style={styles.widgetTitle}>TOTAL MEMBERS</Text>
          </View>
          <Text style={[styles.widgetMainVal, { color: '#8B5CF6' }]}>142</Text>
          <Text style={styles.widgetSub}>Active Club Members</Text>
        </View>

        {/* Coaches */}
        <View style={styles.widget}>
          <View style={styles.widgetHeader}>
            <Ionicons name="person-outline" size={14} color="#8B5CF6" />
            <Text style={styles.widgetTitle}>STAFF COACHES</Text>
          </View>
          <Text style={styles.widgetMainVal}>12</Text>
          <Text style={styles.widgetSub}>Certified Staff</Text>
        </View>

        {/* Athletes */}
        <View style={styles.widget}>
          <View style={styles.widgetHeader}>
            <Ionicons name="fitness-outline" size={14} color="#8B5CF6" />
            <Text style={styles.widgetTitle}>ROSTER ATHLETES</Text>
          </View>
          <Text style={styles.widgetMainVal}>130</Text>
          <Text style={styles.widgetSub}>Across 3 Teams</Text>
        </View>

        {/* Monthly Activity */}
        <View style={styles.widget}>
          <View style={styles.widgetHeader}>
            <Ionicons name="pulse-outline" size={14} color="#8B5CF6" />
            <Text style={styles.widgetTitle}>MONTHLY LOGS</Text>
          </View>
          <Text style={[styles.widgetMainVal, { color: '#8B5CF6' }]}>1,240</Text>
          <Text style={styles.widgetSub}>Workouts Recorded</Text>
        </View>
      </View>

      {/* Branch Activity Sparkline */}
      <View style={styles.graphCard}>
        <Text style={styles.graphTitle}>CLUB SEAT CAPACITY (142 / 250)</Text>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: '56.8%', backgroundColor: '#8B5CF6' }]} />
        </View>
      </View>
    </View>
  );
}

const getStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    container: {
      backgroundColor: 'rgba(0,0,0,0.15)',
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: RADIUS.md,
      padding: 12,
      gap: 10,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 99,
    },
    headerTitle: {
      color: colors.textDimmed,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    widget: {
      flex: 1,
      minWidth: '45%',
      backgroundColor: 'rgba(255,255,255,0.02)',
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: RADIUS.sm,
      padding: 8,
      gap: 2,
    },
    widgetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    widgetTitle: {
      color: colors.textDimmed,
      fontSize: 9,
      fontWeight: '700',
    },
    widgetMainVal: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: '800',
    },
    widgetSub: {
      color: colors.textMuted,
      fontSize: 10,
    },
    progressBarBg: {
      height: 4,
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderRadius: RADIUS.full,
      marginTop: 4,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      borderRadius: RADIUS.full,
    },
    graphCard: {
      backgroundColor: 'rgba(255,255,255,0.02)',
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: RADIUS.sm,
      padding: 8,
      gap: 4,
    },
    graphTitle: {
      color: colors.textDimmed,
      fontSize: 9,
      fontWeight: '700',
    },
    graphBarsRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 6,
      height: 40,
      paddingTop: 4,
    },
    graphBar: {
      flex: 1,
      backgroundColor: 'rgba(255,255,255,0.15)',
      borderRadius: 2,
    },
  });
