import type { ScriptLine } from "../types/script";

export class ScriptPostProcessor {
    /**
     * Standardize coordinates to [ymin, xmin, ymax, xmax]
     */
    private static standardizeBox(box: number[]): [number, number, number, number] {
        if (!box || box.length !== 4) return [0, 0, 0, 0];
        return [box[0], box[1], box[2], box[3]];
    }

    /**
     * Vertical clustering to group panels
     * Using the strict PANEL_Y_GAP of 120 from requirements
     */
    private static assignPanelNumbers(lines: ScriptLine[]): ScriptLine[] {
        if (lines.length === 0) return [];

        // Sort purely by vertical position first
        const sorted = [...lines].sort((a, b) => a.box_2d[0] - b.box_2d[0]);

        let currentPanel = 1;
        let lastY = sorted[0].box_2d[0];
        const PANEL_Y_GAP = 120; // Strict gap threshold

        return sorted.map((line) => {
            // If this box is significantly lower than the previous one, starts a new panel row
            if (line.box_2d[0] - lastY > PANEL_Y_GAP) {
                currentPanel++;
            }
            lastY = line.box_2d[0];

            return {
                ...line,
                panel_number: currentPanel
            };
        });
    }

    /**
     * Sort text within panels
     * Rule: Top-to-Bottom (yMin ASC), then Right-to-Left (xMax DESC)
     */
    private static sortWithinPanels(lines: ScriptLine[]): ScriptLine[] {
        // Group by panel
        const panels = new Map<number, ScriptLine[]>();

        lines.forEach(line => {
            const p = line.panel_number || 1;
            if (!panels.has(p)) panels.set(p, []);
            panels.get(p)?.push(line);
        });

        let result: ScriptLine[] = [];
        const sortedPanelIds = Array.from(panels.keys()).sort((a, b) => a - b);

        for (const pid of sortedPanelIds) {
            const panelLines = panels.get(pid)!;

            // Sort logic: 
            // 1. Vertical bands (if Y difference > 50, it's a new line)
            // 2. Within band: Right to Left (Manga reading direction)
            panelLines.sort((a, b) => {
                const yDiff = Math.abs(a.box_2d[0] - b.box_2d[0]);

                if (yDiff > 50) {
                    // Significant vertical difference -> Top first
                    return a.box_2d[0] - b.box_2d[0];
                } else {
                    // Same line -> Right first (higher xMax)
                    return b.box_2d[3] - a.box_2d[3];
                }
            });

            // Enforce Narration First rule within visually similar blocks if needed
            // (Optional refinement based on strict requirements)

            result = result.concat(panelLines);
        }

        return result;
    }

    public static process(rawLines: ScriptLine[]): ScriptLine[] {
        console.log("[PostProcessor] Raw inputs:", rawLines.length);

        // 1. Standardize Boxes
        const standardized = rawLines.map(line => ({
            ...line,
            box_2d: this.standardizeBox(line.box_2d)
        }));

        // 2. Assign Panels (Vertical Clustering)
        const panelized = this.assignPanelNumbers(standardized);

        // 3. Sort (Geometrically)
        const sorted = this.sortWithinPanels(panelized);

        // 4. Re-assign reading_order index
        return sorted.map((line, index) => ({
            ...line,
            reading_order: index
        }));
    }
}
