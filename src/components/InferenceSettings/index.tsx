import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { Alert, Share, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { getBackendDevicesInfo } from 'llama.rn';
import {
  BUILD_BACKEND, DEFAULT_CONFIG, PROFILES, InferenceConfig, getInferenceConfig, saveInferenceConfig,
  getInferenceReports, subscribeInference,
} from '@/utils/inference';

export default function InferenceSettings() {
  const [config, setConfig] = useState<InferenceConfig>(DEFAULT_CONFIG);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [devices, setDevices] = useState('');
  const reports = useSyncExternalStore(subscribeInference, getInferenceReports);
  useEffect(() => { getInferenceConfig().then(c => { setConfig(c); setReady(true); }).catch(e => Alert.alert('Settings', String(e))); }, []);
  const label = { color: '#FFFFFF', fontSize: 14 };
  const muted = { color: '#B5B5BE', fontSize: 12 };
  const button = (text: string, action: () => void, selected = false) => (
    <TouchableOpacity key={text} disabled={!ready || busy} onPress={action}
      style={{ padding: 10, borderRadius: 8, backgroundColor: selected ? '#365DAD' : '#303039' }}>
      <Text style={label}>{text}</Text>
    </TouchableOpacity>
  );
  async function save() {
    setBusy(true);
    try {
      await saveInferenceConfig(config);
      Alert.alert('Сохранено / Saved', 'Настройки применятся перед следующим ответом. Модель будет перезагружена. / Applied before the next reply; the model will reload.');
    } catch (e) { Alert.alert('Settings', String(e)); } finally { setBusy(false); }
  }
  return <View style={{ backgroundColor: '#202027', padding: 16, borderRadius: 12, gap: 12 }}>
    <Text style={{ ...label, fontSize: 18, fontWeight: 'bold' }}>GPU Lab · v0.1.1</Text>
    <Text style={muted}>Adreno {BUILD_BACKEND === 'vulkan' ? 'Vulkan' : 'OpenCL'} · experimental</Text>
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {button('CPU', () => setConfig({ ...config, backend: 'cpu' }), config.backend === 'cpu')}
      {button(`GPU · ${BUILD_BACKEND}`, () => setConfig({ ...config, backend: BUILD_BACKEND }), config.backend === BUILD_BACKEND)}
    </View>
    {Object.entries(PROFILES).map(([name, profile]) => button(name, () => setConfig({ ...profile })))}
    {([['gpuLayers', 'GPU слои / layers (99 = all for most models)'], ['threads', 'CPU потоки / threads (1–16)'], ['batch', 'Batch (32–512)']] as const).map(([key, title]) =>
      <View key={key} style={{ gap: 4 }}><Text style={label}>{title}</Text>
        <TextInput accessibilityLabel={title} editable={ready && !busy} keyboardType="number-pad"
          value={String(config[key])} onChangeText={v => setConfig({ ...config, [key]: Number(v.replace(/\D/g, '')) })}
          style={{ color: '#FFF', borderWidth: 1, borderColor: '#55555F', borderRadius: 6, padding: 8 }} />
      </View>)}
    {([['mmap', 'Memory map (GGUF)'], ['flashAttention', 'Flash Attention · experimental']] as const).map(([key, title]) =>
      <View key={key} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={label}>{title}</Text><Switch disabled={!ready || busy} value={config[key]} onValueChange={v => setConfig({ ...config, [key]: v })} />
      </View>)}
    {button(`KV cache K: ${config.cacheK} · V: f16`, () => setConfig({ ...config, cacheK: config.cacheK === 'f16' ? 'q8_0' : 'f16' }))}
    <Text style={muted}>Профили — стартовые настройки, не результаты тестов. GPU может быть медленнее CPU. При ошибке уменьшите слои или выберите CPU. Flash Attention и Q8 K-cache зависят от модели и драйвера.</Text>
    {button(busy ? 'Saving…' : 'Применить / Apply', save)}
    {button('Проверить устройства / Detect devices', async () => {
      try { setDevices(JSON.stringify(await getBackendDevicesInfo(), null, 2)); } catch (e) { setDevices(String(e)); }
    })}
    {!!devices && <Text selectable style={muted}>{devices}</Text>}
    <Text style={label}>Последние измерения / Recent measurements</Text>
    <Text style={muted}>Скорость — из native timings, без времени загрузки. Сравнивайте одну модель, контекст и запрос в новых чатах; дайте телефону остыть. История хранится до закрытия приложения.</Text>
    {reports.slice(0, 6).map((r, i) => <View key={`${r.timestamp}-${i}`} style={{ gap: 3 }}>
      <Text style={label}>{r.backend} · {r.outputTps === undefined ? 'loaded' : `${r.outputTps.toFixed(2)} tok/s`}</Text>
      <Text style={muted}>{r.model} · {r.devices.join(', ') || 'CPU'} · load {(r.loadMs / 1000).toFixed(1)} s · ctx {r.contextLength} · {r.tokens ?? 0} tokens</Text>
      <Text selectable style={muted}>{r.library}</Text>
    </View>)}
    {reports.length > 0 && button('Поделиться результатами / Share results', () => { Share.share({ message: JSON.stringify(reports, null, 2) }).catch(e => Alert.alert('Share', String(e))); })}
  </View>;
}
