import React from 'react';
import { useReader } from '../context/ReaderContext';
import { Play, Pause, ChevronLeft, ChevronRight, Settings, Layout, ScrollText } from 'lucide-react';
import styles from './ReaderControls.module.css';

const BottomControlBar: React.FC = () => {
    const {
        isPlaying,
        setIsPlaying,
        nextPage,
        prevPage,
        currentPageIndex,
        chapter,
        isVoicePanelOpen,
        setVoicePanelOpen,
        viewMode,
        setViewMode
    } = useReader();

    if (!chapter) return null;

    const isLastPage = currentPageIndex === chapter.pages.length - 1;
    const isFirstPage = currentPageIndex === 0;

    return (
        <div className={styles.bottomBar}>
            {/* View Mode Toggle */}
            <button
                className={styles.iconButton}
                onClick={() => setViewMode(viewMode === 'single' ? 'vertical' : 'single')}
                aria-label="Toggle View Mode"
                style={{ marginRight: 8 }} // Spacer
            >
                {viewMode === 'single' ? <ScrollText size={24} /> : <Layout size={24} />}
            </button>

            <button
                className={styles.iconButton}
                onClick={prevPage}
                disabled={isFirstPage || viewMode === 'vertical'} // Disable nav in vertical mode
                aria-label="Previous Page"
                style={{ opacity: viewMode === 'vertical' ? 0.3 : 1 }}
            >
                <ChevronLeft size={24} />
            </button>

            <button
                className={`${styles.playButton} ${isPlaying ? styles.playing : ''}`}
                onClick={() => setIsPlaying(!isPlaying)}
                aria-label={isPlaying ? "Pause" : "Play"}
            >
                {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" />}
            </button>

            <button
                className={styles.iconButton}
                onClick={nextPage}
                disabled={isLastPage || viewMode === 'vertical'}
                aria-label="Next Page"
                style={{ opacity: viewMode === 'vertical' ? 0.3 : 1 }}
            >
                <ChevronRight size={24} />
            </button>

            <button
                className={`${styles.iconButton} ${styles.settingsButton} ${isVoicePanelOpen ? styles.active : ''}`}
                onClick={() => setVoicePanelOpen(!isVoicePanelOpen)}
                aria-label="Voice Settings"
            >
                <Settings size={24} />
            </button>
        </div>
    );
};

export default BottomControlBar;
