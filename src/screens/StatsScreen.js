import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Share, StyleSheet } from 'react-native';
import { getReunioesByMonth } from '../storage/database';

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DIAS_SEMANA_PT = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];

const formatDate = (iso) => {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

export default function StatsScreen({ route }) {
  const { year, month } = route.params;
  const [reunioes, setReunioes] = useState([]);

  useEffect(() => {
    getReunioesByMonth(year, month).then(setReunioes);
  }, []);

  const reunioesSemZero = reunioes.filter(r => r.zoom + r.presencial > 0);

  const totalZoom = reunioes.reduce((a, r) => a + r.zoom, 0);
  const totalPres = reunioes.reduce((a, r) => a + r.presencial, 0);
  const totalGeral = totalZoom + totalPres;

  const reunioesQuarta = reunioesSemZero.filter(r => new Date(r.data).getDay() === 3);
  const reunioesSabado = reunioesSemZero.filter(r => new Date(r.data).getDay() === 6);

  const somarTotal = arr => arr.reduce((a, r) => a + r.zoom + r.presencial, 0);

  const mediaQuarta = reunioesQuarta.length ? (somarTotal(reunioesQuarta) / reunioesQuarta.length).toFixed(1) : '—';
  const mediaSabado = reunioesSabado.length ? (somarTotal(reunioesSabado) / reunioesSabado.length).toFixed(1) : '—';
  const mediaGeral  = reunioesSemZero.length  ? (somarTotal(reunioesSemZero)  / reunioesSemZero.length).toFixed(1)  : '—';

  const maiorReuniao = reunioes.reduce((a, r) => (r.zoom + r.presencial > (a ? a.zoom + a.presencial : 0) ? r : a), null);
  const menorReuniao = reunioes.reduce((a, r) => (r.zoom + r.presencial < (a ? a.zoom + a.presencial : Infinity) ? r : a), null);

  const gerarTexto = () => {
    let texto = `📊 RELATÓRIO DE ASSISTÊNCIA\n`;
    texto += `${MESES[month - 1]} ${year}\n`;
    texto += `${'─'.repeat(32)}\n\n`;

    reunioes.forEach(r => {
      const diaSemana = DIAS_SEMANA_PT[new Date(r.data).getDay()];
      texto += `${formatDate(r.data)} ${diaSemana}`;
      if (r.eventoEspecial) texto += ` (${r.eventoEspecial})`;
      texto += `\n`;
      texto += `Zoom: ${r.zoom}\n`;
      texto += `Presencial: ${r.presencial}\n`;
      texto += `Total: ${r.zoom + r.presencial}\n`;
      texto += `${'─'.repeat(26)}\n`;
    });

    texto += `\n📈 MÉDIAS DO MÊS\n`;
    texto += `${'─'.repeat(32)}\n`;
    texto += `Média Quarta-feira: ${mediaQuarta}\n`;
    texto += `Média Sábado: ${mediaSabado}\n`;
    texto += `Média Geral: ${mediaGeral}\n`;

    return texto;
  };

  const compartilhar = async () => {
    await Share.share({ message: gerarTexto() });
  };

  if (reunioes.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Nenhuma reunião encontrada neste mês.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <Text style={styles.title}>📊 {MESES[month - 1]} {year}</Text>

        {/* Cards resumo */}
        <View style={styles.cardsRow}>
          <View style={[styles.summaryCard, { backgroundColor: '#1a237e' }]}>
            <Text style={styles.summaryNum}>{reunioes.length}</Text>
            <Text style={styles.summaryLabel}>Reuniões</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#283593' }]}>
            <Text style={styles.summaryNum}>{totalGeral}</Text>
            <Text style={styles.summaryLabel}>Total Geral</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#3949ab' }]}>
            <Text style={styles.summaryNum}>{media}</Text>
            <Text style={styles.summaryLabel}>Média</Text>
          </View>
        </View>

        <View style={styles.cardsRow}>
          <View style={[styles.summaryCard, { backgroundColor: '#00796b', flex: 1 }]}>
            <Text style={styles.summaryNum}>{totalZoom}</Text>
            <Text style={styles.summaryLabel}>🖥️ Total Zoom</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#00897b', flex: 1 }]}>
            <Text style={styles.summaryNum}>{totalPres}</Text>
            <Text style={styles.summaryLabel}>🪑 Total Presencial</Text>
          </View>
        </View>

        {/* Lista reuniões */}
        <Text style={styles.sectionTitle}>Reuniões do Mês</Text>
        {reunioes.map(r => (
          <View key={r.id} style={styles.card}>
            <Text style={styles.cardDate}>
              {formatDate(r.data)} — {DIAS_SEMANA_PT[new Date(r.data).getDay()]}
              {r.eventoEspecial ? `\n📌 ${r.eventoEspecial}` : ''}
            </Text>
            <View style={styles.cardStats}>
              <Text style={styles.statItem}>🖥️ {r.zoom}</Text>
              <Text style={styles.statItem}>🪑 {r.presencial}</Text>
              <Text style={styles.statTotal}>Total: {r.zoom + r.presencial}</Text>
            </View>
          </View>
        ))}

        {/* Destaques */}
        <Text style={styles.sectionTitle}>Destaques</Text>
        {maiorReuniao && (
          <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: '#43a047' }]}>
            <Text style={styles.destaque}>🏆 Maior assistência</Text>
            <Text style={styles.cardDate}>{formatDate(maiorReuniao.data)} — {maiorReuniao.zoom + maiorReuniao.presencial} pessoas</Text>
          </View>
        )}
        {menorReuniao && menorReuniao.id !== maiorReuniao?.id && (
          <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: '#e53935' }]}>
            <Text style={styles.destaque}>📉 Menor assistência</Text>
            <Text style={styles.cardDate}>{formatDate(menorReuniao.data)} — {menorReuniao.zoom + menorReuniao.presencial} pessoas</Text>
          </View>
        )}
      </ScrollView>

      {/* Botão Compartilhar fixo */}
      <View style={styles.shareBar}>
        <TouchableOpacity style={styles.shareBtn} onPress={compartilhar}>
          <Text style={styles.shareBtnText}>📤 Compartilhar Relatório</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2ff' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#9e9e9e', fontSize: 16 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1a237e', textAlign: 'center', marginBottom: 16 },
  cardsRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  summaryCard: { flex: 1, borderRadius: 12, padding: 14, alignItems: 'center' },
  summaryNum: { fontSize: 26, fontWeight: 'bold', color: '#fff' },
  summaryLabel: { fontSize: 11, color: '#e8eaf6', marginTop: 2 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#3949ab', marginTop: 16, marginBottom: 8 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4 },
  cardDate: { fontSize: 13, fontWeight: '700', color: '#1a237e', marginBottom: 6 },
  cardStats: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  statItem: { fontSize: 14, color: '#555' },
  statTotal: { fontSize: 14, fontWeight: 'bold', color: '#c62828', marginLeft: 'auto' },
  destaque: { fontSize: 12, fontWeight: 'bold', color: '#555', marginBottom: 4 },
  shareBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e0e0e0' },
  shareBtn: { backgroundColor: '#1a237e', borderRadius: 25, paddingVertical: 14, alignItems: 'center' },
  shareBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
