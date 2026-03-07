"use client";

import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 28, fontSize: 11, color: "#1f2937" },
  header: { marginBottom: 16, borderBottomWidth: 1, borderBottomColor: "#e5e7eb", paddingBottom: 10 },
  brand: { fontSize: 16, fontWeight: 700, color: "#2563eb" },
  subtitle: { fontSize: 10, color: "#64748b", marginTop: 2 },
  section: { marginTop: 10, marginBottom: 10 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  label: { color: "#64748b" },
  value: { fontWeight: 600 },
  table: { marginTop: 10, borderWidth: 1, borderColor: "#e5e7eb" },
  tr: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  th: { flex: 1, padding: 8, fontSize: 10, fontWeight: 700, backgroundColor: "#f8fafc" },
  td: { flex: 1, padding: 8, fontSize: 10 },
  paid: { color: "#059669", fontWeight: 700 },
  pending: { color: "#d97706", fontWeight: 700 },
});

type MilestoneInvoice = {
  milestone_label: string;
  percentage: number;
  amount: number;
  status: string;
};

export function InvoicePDF({
  orderId,
  clientName,
  serviceName,
  milestones,
  total,
}: {
  orderId: string;
  clientName: string;
  serviceName: string;
  milestones: MilestoneInvoice[];
  total: number;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>BANDARIN</Text>
          <Text style={styles.subtitle}>Invoice Pembayaran Bertahap (Milestone)</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Invoice Order</Text>
            <Text style={styles.value}>#{orderId.slice(0, 8).toUpperCase()}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Nama Klien</Text>
            <Text style={styles.value}>{clientName || "-"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Layanan</Text>
            <Text style={styles.value}>{serviceName || "-"}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tr}>
            <Text style={styles.th}>Milestone</Text>
            <Text style={styles.th}>Persentase</Text>
            <Text style={styles.th}>Nominal</Text>
            <Text style={styles.th}>Status</Text>
          </View>
          {milestones.map((m) => (
            <View style={styles.tr} key={m.milestone_label}>
              <Text style={styles.td}>{m.milestone_label}</Text>
              <Text style={styles.td}>{m.percentage}%</Text>
              <Text style={styles.td}>Rp {Number(m.amount || 0).toLocaleString("id-ID")}</Text>
              <Text style={[styles.td, m.status === "paid" ? styles.paid : styles.pending]}>{m.status}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.section, { marginTop: 18 }]}>
          <View style={styles.row}>
            <Text style={styles.label}>Total Biaya</Text>
            <Text style={{ fontWeight: 700 }}>Rp {Number(total || 0).toLocaleString("id-ID")}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

