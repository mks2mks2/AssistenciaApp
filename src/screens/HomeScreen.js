import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, Alert, ScrollView, Modal, Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { saveReuniao, getReunioesByMonth, deleteReuniao } from '../storage/database';
import { useFocusEffect } from '@react-navigation/native';

const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

const getNextMeetings = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = [];
  // próximas quarta (3) e sábado (6)
  for (let i = 0; i <= 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    if (d.getDay() === 3 || d.getDay() === 6) days.push(d);
    if (days.length === 2) break;
  }
  return days;
};

const formatDate = (iso) => {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

export default function HomeScreen({ navigation }) {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [reunioes, setReunioes] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editando, setEditando] = useState(null);

  // form
  const [formData, setFormData] = useState('');
  const [formZoom, setFormZoom] = useState('');
  const [formPresencial, setFormPresencial] = useState('');
  const [formEvento, setFormEvento] = useState('');
  const [usarOutraData, setUsarOutraData] = useState(false);
  const [outraData, setOutraData] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [sugestoes, setSugestoes] = useState([]);

  const loadReunioes = useCallback(async () => {
    const data = await getReunioesByMonth(selectedYear, selectedMonth);
    setReunioes(data);
  }, [selectedYear, selectedMonth]);

  useFocusEffect(useCallback(() => { loadReunioes(); }, [loadReunioes]));

  useEffect(() => { loadReunioes(); }, [selectedYear, selectedMonth]);

  useEffect(() => {
    setSugestoes(getNextMeetings());
  }, []);

  const openNovaReuniao = (dataSugerida) => {
    setEditando(null);
    setFormZoom('');
    setFormPresencial('');
    setFormEvento('');
    setUsarOutraData(false);
    setOutraData(dataSugerida || new Date());
    setFormData(dataSugerida ? dataSugerida.toISOString() : new Date().toISOString());
    setModalVisible(true);
  };

  const openEditar = (r) => {
    setEditando(r);
    setFormZoom(String(r.zoom));
    setFormPresencial(String(r.presencial));
    setFormEvento(r.eventoEspecial || '');
    setUsarOutraData(false);
    setFormData(r.data);
    setOutraData(new Date(r.data));
    setModalVisible(true);
  };

  const salvar = async () => {
    const zoom = parseInt(formZoom) || 0;
    const presencial = parseInt(formPresencial) || 0;
    const dataFinal = usarOutraData ? outraData.toISOString() : formData;
    const d = new Date(dataFinal);
    const id = editando ? editando.id : `${d.toISOString()}_${Date.now()}`;
    const reuniao = {
      id,
      data: dataFinal,
      diaSemana: DIAS_SEMANA[d.getDay()],
      zoom,
      presencial,
      eventoEspecial: formEvento.trim(),
    };
    await saveReuniao(reuniao);
    setModalVisible(false);
    loadReunioes();
    // update month view if needed
    setSelectedYear(d.getFullYear());
    setSelectedMonth(d.getMonth() + 1);
  };

  const excluir = (r) => {
    Alert.alert('Excluir', `Excluir reunião de ${formatDate(r.data)}?`, [
      { text: 'Cancelar' },
      { text: 'Excluir', style: 'destructive', onPress: async () => { await deleteReuniao(r.id); loadReunioes(); } },
    ]);
  };

  const totalMes = reunioes.reduce((acc, r) => acc + r.zoom + r.presencial, 0);
  const totalZoom = reunioes.reduce((acc, r) => acc + r.zoom, 0);
  const totalPres = reunioes.reduce((acc, r) => acc + r.presencial, 0);

  const changeMonth = (delta) => {
    let m = selectedMonth + delta;
    let y = selectedYear;
    if (m > 12) { m = 1; y++; }
    if (m < 1) { m = 12; y--; }
    setSelectedMonth(m);
    setSelectedYear(y);
  };

  return (
    <View style={styles.container}>
      {/* Header mês */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.navBtn}>
          <Text style={styles.navBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthTitle}>{MESES[selectedMonth - 1]} {selectedYear}</Text>
        <TouchableOpacity onPress={() => changeMonth(1)} style={styles.navBtn}>
          <Text style={styles.navBtnText}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Sugestões rápidas */}
      <View style={styles.sugestoesRow}>
        {sugestoes.map((d, i) => (
          <TouchableOpacity key={i} style={styles.sugestaoBtn} onPress={() => openNovaReuniao(d)}>
            <Text style={styles.sugestaoBtnText}>+ {DIAS_SEMANA[d.getDay()]} {String(d.getDate()).padStart(2,'0')}/{String(d.getMonth()+1).padStart(2,'0')}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={[styles.sugestaoBtn, { backgroundColor: '#5c6bc0' }]} onPress={() => openNovaReuniao(null)}>
          <Text style={styles.sugestaoBtnText}>+ Outra data</Text>
        </TouchableOpacity>
      </View>

      {/* Lista */}
      <FlatList
        data={reunioes}
        keyExtractor={r => r.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={<Text style={styles.empty}>Nenhum registro neste mês.</Text>}
        renderItem={({ item: r }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardDate}>
                {formatDate(r.data)} — {r.diaSemana}
                {r.eventoEspecial ? `\n📌 ${r.eventoEspecial}` : ''}
              </Text>
              <View style={styles.cardActions}>
                <TouchableOpacity onPress={() => openEditar(r)} style={styles.editBtn}>
                  <Text style={styles.editBtnText}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => excluir(r)} style={styles.delBtn}>
                  <Text style={styles.delBtnText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardStat}>🖥️ Zoom: <Text style={styles.cardNum}>{r.zoom}</Text></Text>
              <Text style={styles.cardStat}>🪑 Presencial: <Text style={styles.cardNum}>{r.presencial}</Text></Text>
              <Text style={styles.cardTotal}>Total: {r.zoom + r.presencial}</Text>
            </View>
          </View>
        )}
      />

      {/* Resumo + Estatísticas */}
      {reunioes.length > 0 && (
        <View style={styles.footer}>
          <Text style={styles.footerText}>Reuniões: {reunioes.length}  |  Zoom: {totalZoom}  |  Presencial: {totalPres}  |  Total: {totalMes}</Text>
          <TouchableOpacity
            style={styles.statsBtn}
            onPress={() => navigation.navigate('Stats', { year: selectedYear, month: selectedMonth })}>
            <Text style={styles.statsBtnText}>📊 Gerar Estatísticas</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal Formulário */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalBox} contentContainerStyle={{ paddingBottom: 30 }}>
            <Text style={styles.modalTitle}>{editando ? 'Editar Reunião' : 'Nova Reunião'}</Text>

            {/* Data */}
            {!editando && (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Data</Text>
                {!usarOutraData ? (
                  <View style={styles.dataRow}>
                    <Text style={styles.dataAtual}>
                      {formData ? `${formatDate(formData)} (${DIAS_SEMANA[new Date(formData).getDay()]})` : '—'}
                    </Text>
                    <TouchableOpacity onPress={() => setUsarOutraData(true)}>
                      <Text style={styles.linkText}>Mudar data</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View>
                    <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.datePickerBtn}>
                      <Text style={styles.datePickerText}>
                        {formatDate(outraData.toISOString())} ({DIAS_SEMANA[outraData.getDay()]})
                      </Text>
                    </TouchableOpacity>
                    {showDatePicker && (
                      <DateTimePicker
                        value={outraData}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={(_, date) => { setShowDatePicker(false); if (date) setOutraData(date); }}
                      />
                    )}
                  </View>
                )}
              </View>
            )}

            {editando && (
              <Text style={styles.editDateLabel}>
                {formatDate(editando.data)} — {editando.diaSemana}
              </Text>
            )}

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>🖥️ Zoom</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={formZoom}
                onChangeText={setFormZoom} placeholder="0" placeholderTextColor="#999" />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>🪑 Presencial</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={formPresencial}
                onChangeText={setFormPresencial} placeholder="0" placeholderTextColor="#999" />
            </View>

            {(formZoom || formPresencial) ? (
              <Text style={styles.totalPreview}>
                Total: {(parseInt(formZoom) || 0) + (parseInt(formPresencial) || 0)}
              </Text>
            ) : null}

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>📌 Evento especial (opcional)</Text>
              <TextInput style={styles.input} value={formEvento}
                onChangeText={setFormEvento} placeholder="Ex: Reunião Especial" placeholderTextColor="#999" />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={salvar}>
                <Text style={styles.saveBtnText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2ff' },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1a237e', paddingHorizontal: 16, paddingVertical: 14 },
  navBtn: { padding: 8 },
  navBtnText: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  monthTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  sugestoesRow: { flexDirection: 'row', flexWrap: 'wrap', padding: 10, gap: 8 },
  sugestaoBtn: { backgroundColor: '#3949ab', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  sugestaoBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  empty: { textAlign: 'center', color: '#9e9e9e', marginTop: 40, fontSize: 15 },
  card: { backgroundColor: '#fff', marginHorizontal: 12, marginVertical: 6, borderRadius: 12, padding: 14, elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardDate: { fontSize: 14, fontWeight: '700', color: '#1a237e', flex: 1 },
  cardActions: { flexDirection: 'row', gap: 8 },
  editBtn: { padding: 4 },
  editBtnText: { fontSize: 18 },
  delBtn: { padding: 4 },
  delBtnText: { fontSize: 18 },
  cardBody: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
  cardStat: { fontSize: 14, color: '#555' },
  cardNum: { fontWeight: 'bold', color: '#1a237e' },
  cardTotal: { fontSize: 14, fontWeight: 'bold', color: '#c62828', marginLeft: 'auto' },
  footer: { backgroundColor: '#1a237e', padding: 14 },
  footerText: { color: '#e8eaf6', fontSize: 12, textAlign: 'center', marginBottom: 10 },
  statsBtn: { backgroundColor: '#ffd600', borderRadius: 25, paddingVertical: 12, alignItems: 'center' },
  statsBtnText: { color: '#1a237e', fontWeight: 'bold', fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a237e', marginBottom: 16, textAlign: 'center' },
  fieldGroup: { marginBottom: 14 },
  label: { fontSize: 13, color: '#555', marginBottom: 6, fontWeight: '600' },
  input: { borderWidth: 1.5, borderColor: '#c5cae9', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16, color: '#212121', backgroundColor: '#f5f5ff' },
  totalPreview: { textAlign: 'center', fontSize: 16, fontWeight: 'bold', color: '#c62828', marginBottom: 12 },
  dataRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dataAtual: { fontSize: 14, color: '#1a237e', fontWeight: '600' },
  linkText: { color: '#3949ab', fontSize: 13, textDecorationLine: 'underline' },
  datePickerBtn: { borderWidth: 1.5, borderColor: '#c5cae9', borderRadius: 10, padding: 12, backgroundColor: '#f5f5ff' },
  datePickerText: { fontSize: 15, color: '#1a237e', fontWeight: '600' },
  editDateLabel: { fontSize: 15, fontWeight: 'bold', color: '#1a237e', textAlign: 'center', marginBottom: 16 },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, borderWidth: 1.5, borderColor: '#9e9e9e', borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  cancelBtnText: { color: '#757575', fontWeight: '600', fontSize: 15 },
  saveBtn: { flex: 1, backgroundColor: '#1a237e', borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});