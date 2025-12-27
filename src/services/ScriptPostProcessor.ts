import type { ScriptLine } from './GeminiService';

export class ScriptPostProcessor {

    /* =======================
       CONSTANTS
       ======================= */

    // Increased threshold for better panel clustering
    private static readonly ROW_THRESHOLD = 80;

    // Threshold for considering text blocks in the same visual row
    private static readonly SAME_ROW_THRESHOLD = 40;

    /* =======================
       BOX ACCESSORS
       box_2d = [yMin, xMin, yMax, xMax]
       ======================= */

    private static yMin(b: number[]) { return b[0]; }
    private static yMax(b: number[]) { return b[2]; }
    private static xMax(b: number[]) { return b[3]; }

    /* =======================
       MAIN ENTRY
       ======================= */

    static process(rawLines: ScriptLine[]): ScriptLine[] {
        let lines = rawLines.filter(
            l => Array.isArray(l.box_2d) && l.box_2d.length === 4
        );

        lines = this.filterSFX(lines);
        lines = this.enforceReadingGroups(lines);

        const panels = this.clusterPanelsByGeometry(lines);
        return this.assembleFinalScript(panels);
    }

    /* =======================
       SFX FILTER
       ======================= */

    private static filterSFX(lines: ScriptLine[]): ScriptLine[] {
        const japaneseRegex = /[\u3040-\u30FF\u4E00-\u9FAF]/;

        return lines.filter(l => {
            const t = l.text?.trim();
            if (!t) return false;

            // Remove short Japanese SFX
            if (japaneseRegex.test(t) && t.length <= 6) return false;

            // Remove pure punctuation noise (just !? symbols)
            if (/^[!?]+$/.test(t)) return false;

            return true;
        });
    }

    /* =======================
       READING GROUP ASSIGNMENT
       ======================= */

    private static enforceReadingGroups(lines: ScriptLine[]): ScriptLine[] {
        return lines.map(l => {
            // Narrator character type = reading_group 1 (narration)
            // Everything else = reading_group 2 (dialogue)
            if (l.character_type === 'Narrator') {
                return { ...l, reading_group: 1 as const };
            }
            return { ...l, reading_group: 2 as const };
        });
    }

    /* =======================
       PANEL CLUSTERING
       ======================= */

    private static clusterPanelsByGeometry(lines: ScriptLine[]) {
        if (lines.length === 0) return [];

        // Sort by Y position first
        const sorted = [...lines].sort(
            (a, b) => this.yMin(a.box_2d) - this.yMin(b.box_2d)
        );

        const clusters: ScriptLine[][] = [];

        for (const line of sorted) {
            let placed = false;

            // Try to find an overlapping cluster
            for (const cluster of clusters) {
                const clusterTop = Math.min(...cluster.map(l => this.yMin(l.box_2d)));
                const clusterBottom = Math.max(...cluster.map(l => this.yMax(l.box_2d)));

                const lineTop = this.yMin(line.box_2d);
                const lineBottom = this.yMax(line.box_2d);

                // Check if this line's Y range overlaps with the cluster's Y range
                // Using a generous threshold to group visually adjacent elements
                const overlaps =
                    lineTop <= clusterBottom + this.ROW_THRESHOLD &&
                    lineBottom >= clusterTop - this.ROW_THRESHOLD;

                if (overlaps) {
                    cluster.push(line);
                    placed = true;
                    break;
                }
            }

            if (!placed) {
                clusters.push([line]);
            }
        }

        // Sort clusters: top-to-bottom, then right-to-left for same row
        return clusters
            .map(lines => ({
                lines,
                minY: Math.min(...lines.map(l => this.yMin(l.box_2d))),
                maxX: Math.max(...lines.map(l => this.xMax(l.box_2d)))
            }))
            .sort((a, b) => {
                const yDiff = a.minY - b.minY;
                if (Math.abs(yDiff) > this.ROW_THRESHOLD) return yDiff;
                // Same visual row: sort right-to-left (manga reading order)
                return b.maxX - a.maxX;
            });
    }

    /* =======================
       FINAL SCRIPT ASSEMBLY
       ======================= */

    private static assembleFinalScript(
        panels: { lines: ScriptLine[] }[]
    ): ScriptLine[] {

        const final: ScriptLine[] = [];
        let panelNum = 1;

        for (const panel of panels) {
            // Separate narration (reading_group 1) from dialogue (reading_group 2)
            const narration = panel.lines.filter(l => l.reading_group === 1);
            const dialogue = panel.lines.filter(l => l.reading_group === 2);

            // Sort within each group: top-to-bottom, then right-to-left
            const sortInside = (a: ScriptLine, b: ScriptLine) => {
                const yDiff = this.yMin(a.box_2d) - this.yMin(b.box_2d);
                if (Math.abs(yDiff) > this.SAME_ROW_THRESHOLD) return yDiff;
                // Same row: right-to-left (manga reading order)
                return this.xMax(b.box_2d) - this.xMax(a.box_2d);
            };

            narration.sort(sortInside);
            dialogue.sort(sortInside);

            // Narration comes first, then dialogue
            const merged = [...narration, ...dialogue];

            merged.forEach((line, idx) => {
                final.push({
                    ...line,
                    panel_number: panelNum,
                    reading_order: idx + 1
                });
            });

            panelNum++;
        }

        return final;
    }
}
