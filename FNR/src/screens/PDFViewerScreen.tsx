import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system/legacy';
import { useTheme } from 'react-native-paper';
import { AppColors } from '../theme/colors';

type Props = { route: { params: { uri: string } } };

export default function PDFViewerScreen({ route }: Props) {
  const { uri } = route.params;
  const theme = useTheme();
  const appColors = theme.colors as unknown as AppColors;
  const styles = useMemo(() => getPDFViewerStyles(appColors), [appColors]);

  const [payload, setPayload] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isRemote = useMemo(() => /^https?:\/\//i.test(uri), [uri]);
  const isLocal = useMemo(() => uri.startsWith('file://'), [uri]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        console.log('PDFViewer: Loading URI:', uri);
        
        if (isRemote) {
          if (!cancelled) setPayload(uri);
        } else if (isLocal) {
          console.log('PDFViewer: Reading local file as base64...');
          const b64 = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          console.log('PDFViewer: Base64 length:', b64.length);
          if (!cancelled) {
            setPayload(b64);
          }
        } else {
          if (!cancelled) setPayload(uri);
        }
        setLoading(false);
      } catch (e: any) {
        if (!cancelled) {
          setErr(String(e?.message ?? e));
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [uri, isRemote, isLocal]);

  if (err) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>PDF Error</Text>
        <Text style={styles.errorDetails}>{err}</Text>
      </View>
    );
  }

  if (loading || !payload) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={appColors.primary} />
        <Text style={styles.loadingText}>Loading PDF...</Text>
      </View>
    );
  }

  console.log('PDFViewer: Rendering WebView with base64 length:', payload.length);

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html: getHTMLWithPDF(payload, appColors) }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
        mixedContentMode="always"
        onMessage={(e) => {
          const data = e.nativeEvent.data;
          console.log('WebView message:', data);
          
          try {
            const msg = JSON.parse(data);
            if (msg.type === 'log') {
              console.log('[WebView]', msg.message);
            } else if (msg.type === 'error') {
              console.error('[WebView Error]', msg.error);
              setErr(msg.error);
            } else if (msg.type === 'loaded') {
              console.log('[WebView] PDF loaded with', msg.pages, 'pages');
            }
          } catch {
            console.log('[WebView raw]', data);
          }
        }}
        onError={(e) => {
          console.error('WebView error:', e.nativeEvent);
          setErr('WebView failed to load');
        }}
      />
    </View>
  );
}

function getHTMLWithPDF(base64Data: string, colors: AppColors): string {
  // Embed the entire PDF.js library inline to avoid CDN issues
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { 
      height: 100%; 
      background: ${colors.background};
      overflow: hidden;
    }
    #container { 
      position: absolute; 
      inset: 0; 
      overflow: auto; 
      background: ${colors.background};
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 10px 0;
    }
    canvas {
      display: block;
      margin: 10px auto;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      background: ${colors.surface};
      max-width: 100%;
      height: auto !important;
    }
    #loading {
      color: ${colors.text};
      font-family: system-ui;
      padding: 20px;
      text-align: center;
    }
    #error {
      color: ${colors.error};
      font-family: system-ui;
      padding: 20px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div id="container">
    <div id="loading">Loading PDF...</div>
    <div id="error" style="display:none;"></div>
  </div>
  
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  <script>
    (function() {
      const RN = window.ReactNativeWebView;
      const log = (m) => {
        console.log(m);
        RN && RN.postMessage(JSON.stringify({ type:'log', message: m }));
      };
      const error = (m) => {
        console.error(m);
        RN && RN.postMessage(JSON.stringify({ type:'error', error: m }));
        document.getElementById('loading').style.display = 'none';
        const errorEl = document.getElementById('error');
        errorEl.textContent = m;
        errorEl.style.display = 'block';
      };

      function b64ToUint8Array(b64) {
        try {
          const binary = atob(b64);
          const len = binary.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          return bytes;
        } catch (e) {
          throw new Error('Base64 decode error: ' + (e.message || e));
        }
      }

      async function renderPDF() {
        try {
          log('Starting PDF load...');
          
          // Check if PDF.js loaded
          if (typeof pdfjsLib === 'undefined') {
            throw new Error('PDF.js library failed to load from CDN');
          }
          
          // Set worker
          pdfjsLib.GlobalWorkerOptions.workerSrc = 
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

          const base64 = '${base64Data}';
          log('Base64 length: ' + base64.length);

          const bytes = b64ToUint8Array(base64);
          log('Decoded to ' + bytes.length + ' bytes');

          const loadingTask = pdfjsLib.getDocument({ data: bytes });
          const pdf = await loadingTask.promise;
          
          log('PDF loaded! Pages: ' + pdf.numPages);
          RN && RN.postMessage(JSON.stringify({ type: 'loaded', pages: pdf.numPages }));

          document.getElementById('loading').style.display = 'none';
          const container = document.getElementById('container');

          // Render each page
          const devicePixelRatio = window.devicePixelRatio || 1;
          
          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            
            // Calculate scale to fit screen width with padding
            const viewport = page.getViewport({ scale: 1.0 });
            const containerWidth = window.innerWidth - 20;
            const scale = containerWidth / viewport.width;
            const scaledViewport = page.getViewport({ scale });

            // Create canvas with high-DPI support
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            
            // Set actual canvas size (accounting for device pixel ratio)
            canvas.width = Math.floor(scaledViewport.width * devicePixelRatio);
            canvas.height = Math.floor(scaledViewport.height * devicePixelRatio);
            
            // Set CSS display size (what user sees)
            canvas.style.width = scaledViewport.width + 'px';
            canvas.style.height = scaledViewport.height + 'px';

            // Scale context to match device pixel ratio
            context.scale(devicePixelRatio, devicePixelRatio);

            // Enable high-quality rendering
            context.imageSmoothingEnabled = true;
            context.imageSmoothingQuality = 'high';

            container.appendChild(canvas);

            // Render page at higher resolution
            await page.render({
              canvasContext: context,
              viewport: scaledViewport
            }).promise;

            log('Rendered page ' + pageNum + '/' + pdf.numPages);
          }

          log('All pages rendered successfully');
        } catch (e) {
          error('PDF load error: ' + (e.message || e));
        }
      }

      // Wait for PDF.js to load, then render
      if (typeof pdfjsLib !== 'undefined') {
        renderPDF();
      } else {
        window.addEventListener('load', renderPDF);
      }
    })();
  </script>
</body>
</html>`;
}

const getPDFViewerStyles = (colors: AppColors) => StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background 
  },
  webview: { 
    flex: 1,
    backgroundColor: colors.background
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 18,
    color: colors.error,
    fontWeight: '700',
    marginBottom: 8,
  },
  errorDetails: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
});