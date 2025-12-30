import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system/legacy';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ChevronLeft, Settings, Mic, StopCircle } from 'lucide-react-native';
import { COLORS, SPACING } from '../constants/theme';
import { PdfStorageService } from '../services/PdfStorageService';
import { geminiService } from '../services/GeminiService';
import { AudioEngine } from '../services/AudioEngine';

export default function ReaderScreen() {
    const route = useRoute<any>();
    const navigation = useNavigation();
    const { pdfUrl, title, id: mangaId, initialPage = 1 } = route.params || {};

    console.log('[ReaderScreen] Mounted. PDF URL:', pdfUrl);

    const [loading, setLoading] = useState(true);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    // Store script context
    const [currentScript, setCurrentScript] = useState<any[]>([]);

    const webViewRef = useRef<WebView>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (loading) {
                console.log('[Reader] Loading timed out. Forcing UI.');
                setLoading(false);
            }
        }, 8000);

        return () => {
            clearTimeout(timer);
            AudioEngine.stop(); // Cleanup on unmount
        };
    }, []);

    const getFileDetails = (uri: string) => {
        if (!uri) return { folder: '', file: '' };
        const lastSlash = uri.lastIndexOf('/');
        return {
            folder: uri.substring(0, lastSlash + 1),
            file: uri.substring(lastSlash + 1)
        };
    };

    const { folder, file } = getFileDetails(pdfUrl);

    // PDF.js Viewer HTML (Enhanced for Canvas Capture)
    const viewerHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=3.0, minimum-scale=1.0, user-scalable=yes">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
    <script>
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    </script>
    <style>
        body { margin: 0; background: #000; height: 100vh; display: flex; flex-direction: column; justify-content: center; overflow: hidden; }
        #canvas-container { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; overflow: auto; }
        canvas { max-width: 100%; max-height: 100%; object-fit: contain; }
        #loader { color: white; font-family: sans-serif; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); }
        #page-info { position: absolute; bottom: 20px; left: 0; right: 0; text-align: center; color: rgba(255,255,255,0.7); font-family: sans-serif; pointer-events: none; z-index: 10; text-shadow: 0 1px 3px rgba(0,0,0,0.8); }
    </style>
</head>
<body>
    <div id="loader">Loading Document...</div>
    <div id="canvas-container"></div>
    <div id="page-info"></div>

    <script>
        const container = document.getElementById('canvas-container');
        const loader = document.getElementById('loader');
        const pageInfo = document.getElementById('page-info');

        let pdfDoc = null;
        let pageNum = ${initialPage};
        let pageRendering = false;
        let pageNumPending = null;
        let touchStartX = 0;
        let touchEndX = 0;
        let touchStartY = 0;
        
        let currentCanvas = null; // Track active canvas

        async function loadDocument() {
            try {
                const url = "${file}";
                const loadingTask = pdfjsLib.getDocument(url);
                pdfDoc = await loadingTask.promise;
                
                loader.style.display = 'none';
                if (pageNum > pdfDoc.numPages) pageNum = 1;
                renderPage(pageNum);
                
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'PDF_LOADED', totalPages: pdfDoc.numPages }));

            } catch (error) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', message: error.message }));
                loader.innerText = 'Error: ' + error.message;
            }
        }

        async function renderPage(num) {
            pageRendering = true;
            container.innerHTML = ''; 

            try {
                const page = await pdfDoc.getPage(num);
                const pixelRatio = window.devicePixelRatio || 1;
                const desiredScale = pixelRatio * 1.5; 
                const viewport = page.getViewport({ scale: desiredScale });
                
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                container.appendChild(canvas);
                currentCanvas = canvas;

                const renderContext = { canvasContext: context, viewport: viewport };
                await page.render(renderContext).promise;
                pageRendering = false;
                
                pageInfo.innerText = \`Page \${num} of \${pdfDoc.numPages}\`;

                if (pageNumPending !== null) {
                    renderPage(pageNumPending);
                    pageNumPending = null;
                }

                if (num === 1) {
                     // Generate Cover Logic (omitted for brevity, same as before)
                }

                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'PAGE_CHANGED',
                    page: num,
                    total: pdfDoc.numPages
                }));

            } catch (e) {
                console.error(e);
                pageRendering = false;
            }
        }
        
        // ... navigation functions ...
        function queueRenderPage(num) {
            if (pageRendering) pageNumPending = num; else renderPage(num);
        }
        function onPrevPage() { if (pageNum <= 1) return; pageNum--; queueRenderPage(pageNum); }
        function onNextPage() { if (pageNum >= pdfDoc.numPages) return; pageNum++; queueRenderPage(pageNum); }

        // --- Swipe Gestures (same as before) ---
        document.addEventListener('touchstart', e => {
            if (e.touches.length > 1) return;
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
        }, {passive: false});

        document.addEventListener('touchend', e => {
            if (e.changedTouches.length > 1) return;
            touchEndX = e.changedTouches[0].screenX;
            const touchEndY = e.changedTouches[0].screenY;
            handleGesture(touchStartX, touchStartY, touchEndX, touchEndY);
        }, {passive: false});

        function handleGesture(startX, startY, endX, endY) {
            const xDiff = endX - startX;
            const yDiff = endY - startY;
            if (Math.abs(xDiff) > Math.abs(yDiff) && Math.abs(xDiff) > 50) {
                if (window.visualViewport.scale > 1.2) return;
                if (xDiff < 0) onNextPage(); else onPrevPage(); 
            }
        }

        // --- LISTENERS FOR APP COMMANDS ---
        // We listen for 'CAPTURE_CANVAS' message from React Native
        document.addEventListener('message', function(event) {
             const message = JSON.parse(event.data);
             if (message.type === 'CAPTURE_CANVAS') {
                 if (currentCanvas) {
                     const dataUrl = currentCanvas.toDataURL('image/jpeg', 0.8);
                     window.ReactNativeWebView.postMessage(JSON.stringify({
                         type: 'CANVAS_CAPTURED',
                         data: dataUrl
                     }));
                 } else {
                     window.ReactNativeWebView.postMessage(JSON.stringify({ // Send empty if not ready
                         type: 'CANVAS_CAPTURED',
                         data: null
                     }));
                 }
             }
        });
        
        // Also support window.addEventListener for some webview versions
        window.addEventListener('message', function(event) {
             // same logic...
             try {
                const message = JSON.parse(event.data);
                if (message.type === 'CAPTURE_CANVAS' && currentCanvas) {
                     const dataUrl = currentCanvas.toDataURL('image/jpeg', 0.8);
                     window.ReactNativeWebView.postMessage(JSON.stringify({
                         type: 'CANVAS_CAPTURED',
                         data: dataUrl
                     }));
                }
             } catch(e) {}
        });

        loadDocument();
    </script>
</body>
</html>
    `;

    const handleMessage = async (event: any) => {
        try {
            console.log('[Reader] Message received from WebView:', event.nativeEvent.data.substring(0, 100)); // Log message
            const message = JSON.parse(event.nativeEvent.data);
            if (message.type === 'PDF_LOADED') {
                console.log('[Reader] PDF Loaded Message Processed');
                setLoading(false);
            } else if (message.type === 'PAGE_CHANGED') {
                if (file) {
                    PdfStorageService.saveProgress(file, message.page, message.total);
                }
                // Stop audio if page changes
                if (isPlaying) {
                    onStopAudio();
                }
            } else if (message.type === 'CANVAS_CAPTURED') {
                // Determine next step
                if (message.data) {
                    console.log(`[Reader] Canvas captured! Data length: ${message.data.length}`);
                    runGeminiAnalysis(message.data);
                } else {
                    console.log("[Reader] Canvas captured but data is null");
                    Alert.alert("Error", "Could not capture page image.");
                    setIsAnalyzing(false);
                }
            }
        } catch (e) {
            // Ignore parse errors
        }
    };

    // --- AI Voice Pipeline ---

    // 1. Trigger Capture
    const onStartVoiceAI = () => {
        if (loading) return;
        setIsAnalyzing(true);
        // Send command to WebView
        const script = `
            try {
                if(currentCanvas) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'CANVAS_CAPTURED',
                        data: currentCanvas.toDataURL('image/jpeg', 0.8)
                    }));
                } else {
                     window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'CANVAS_CAPTURED', data: null }));
                }
            } catch(e) { window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', message: e.message })); }
            true;
        `;
        webViewRef.current?.injectJavaScript(script);
    };

    // 2. Run Analysis (Gemini)
    const runGeminiAnalysis = async (base64Image: string) => {
        try {
            console.log("Analyzing page...");
            const script = await geminiService.analyzePage(base64Image);

            if (script.length > 0) {
                console.log(`Generated ${script.length} lines.`);
                setCurrentScript(script);
                setIsAnalyzing(false);
                setIsPlaying(true);

                // 3. Play Audio
                await AudioEngine.playScript(script, (line) => {
                    // Could highlight bubble here if we knew coordinates map back to WebView
                    console.log("Playing:", line.text);
                });

                setIsPlaying(false);
            } else {
                Alert.alert("No Dialogue", "Could not find any dialogue on this page.");
                setIsAnalyzing(false);
            }

        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to analyze page.");
            setIsAnalyzing(false);
        }
    };

    const onStopAudio = async () => {
        await AudioEngine.stop();
        setIsPlaying(false);
        setIsAnalyzing(false);
    };


    const source = React.useMemo(() => ({ html: viewerHtml, baseUrl: folder }), [folder, viewerHtml]);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                    <ChevronLeft color={COLORS.textPrimary} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{title || 'Reader'}</Text>
                <TouchableOpacity style={styles.iconBtn}>
                    <Settings color={COLORS.textPrimary} size={24} />
                </TouchableOpacity>
            </View>

            <View style={styles.webviewContainer}>
                <WebView
                    ref={webViewRef}
                    originWhitelist={['*']}
                    source={source}
                    onMessage={handleMessage}
                    style={{ backgroundColor: COLORS.bg }}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    allowFileAccess={true}
                    allowFileAccessFromFileURLs={true}
                    allowUniversalAccessFromFileURLs={true}
                    scalesPageToFit={true}
                    scrollEnabled={true}
                />

                {loading && (
                    <View style={styles.loaderOverlay}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                        <Text style={{ color: COLORS.textSecondary, marginTop: 10 }}>Loading Document...</Text>
                    </View>
                )}

                {isAnalyzing && (
                    <View style={styles.aiOverlay}>
                        <ActivityIndicator size="large" color="#FFF" />
                        <Text style={styles.aiText}>Analyzing Manga Page...</Text>
                    </View>
                )}
            </View>

            {!loading && (
                <View style={[styles.footer, { borderTopColor: COLORS.border, backgroundColor: COLORS.surface }]}>
                    {!isPlaying && !isAnalyzing ? (
                        <TouchableOpacity style={[styles.playBtn, { backgroundColor: COLORS.primary }]} onPress={onStartVoiceAI}>
                            <Mic fill="black" color="black" size={24} />
                            <Text style={styles.playText}>Give AI Voice</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={[styles.playBtn, { backgroundColor: COLORS.error }]} onPress={onStopAudio}>
                            <StopCircle fill="white" color="white" size={24} />
                            <Text style={[styles.playText, { color: 'white' }]}>Stop Voice</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    headerTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: 'bold', flex: 1, textAlign: 'center' },
    iconBtn: { padding: 8 },
    webviewContainer: { flex: 1 },
    loaderOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' },
    aiOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
    aiText: { color: 'white', marginTop: 16, fontSize: 16, fontWeight: '600' },
    footer: { padding: SPACING.lg, borderTopWidth: 1 },
    playBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 16, gap: 8 },
    playText: { color: 'black', fontWeight: 'bold', fontSize: 16 }
});
