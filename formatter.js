/**
 * s0ulnix Formatter - Display Results
 */

class s0ulnixFormatter {
    constructor() {
        this.parser = new s0ulnixParser();
        this.entries = [];
        this.runningTotal = 0;
        this.manualTotal = 0;
        this.crossingTotal = 0;
        this.jcMode = false;
    }

    toggleJCMode() {
        this.jcMode = !this.jcMode;
        this.parser.toggleJCMode();
        return this.jcMode;
    }

    getJCMode() {
        return this.jcMode;
    }

    setJCMode(enabled) {
        this.jcMode = enabled;
        this.parser.setJCMode(enabled);
    }

    resetJCMode() {
        this.jcMode = false;
        this.parser.resetJCMode();
        return this.jcMode;
    }

    addManualAmount(amount, description = 'Manual') {
        if (isNaN(amount) || amount <= 0) return null;
        
        const entry = {
            id: Date.now(),
            type: 'manual',
            description: description,
            total: amount,
            timestamp: new Date().toLocaleTimeString()
        };
        
        this.entries.push(entry);
        this.manualTotal += amount;
        this.runningTotal += amount;
        
        return {
            entry: entry,
            runningTotal: this.runningTotal,
            totalEntries: this.entries.length
        };
    }

    addCrossingEntry(text) {
        this.parser.setCrossingEnabled(true);
        this.parser.setJCMode(this.jcMode);
        
        const result = this.parser.process(text);
        
        this.parser.setCrossingEnabled(false);
        
        if (result.blocks.length === 0) {
            return null;
        }
        
        const isCrossing = result.blocks.some(b => b.isCrossing);
        if (!isCrossing) {
            return null;
        }
        
        const entry = {
            id: Date.now(),
            type: 'crossing',
            text: text,
            blocks: result.blocks,
            total: result.grandTotal,
            timestamp: new Date().toLocaleTimeString(),
            jcMode: this.jcMode,
            totalBlocks: result.totalBlocks,
            totalBoxes: result.totalBoxes
        };
        
        this.entries.push(entry);
        this.crossingTotal += entry.total;
        this.runningTotal += entry.total;
        
        this.resetJCMode();
        
        return {
            entry: entry,
            runningTotal: this.runningTotal,
            totalEntries: this.entries.length
        };
    }

    addEntry(text) {
        const result = this.parser.process(text);
        
        if (result.blocks.length === 0) {
            return null;
        }
        
        const entry = {
            id: Date.now(),
            type: 'regular',
            text: text,
            blocks: result.blocks,
            total: result.grandTotal,
            totalBoxes: result.totalBoxes,
            totalBlocks: result.totalBlocks,
            timestamp: new Date().toLocaleTimeString()
        };
        
        this.entries.push(entry);
        this.runningTotal += entry.total;
        
        return {
            entry: entry,
            runningTotal: this.runningTotal,
            totalEntries: this.entries.length
        };
    }

    deleteLastEntry() {
        if (this.entries.length === 0) return null;
        
        const removed = this.entries.pop();
        this.runningTotal -= removed.total;
        
        if (removed.type === 'manual') {
            this.manualTotal -= removed.total;
        } else if (removed.type === 'crossing') {
            this.crossingTotal -= removed.total;
        }
        
        return {
            removed: removed,
            runningTotal: this.runningTotal,
            totalEntries: this.entries.length
        };
    }

    clearAll() {
        this.entries = [];
        this.runningTotal = 0;
        this.manualTotal = 0;
        this.crossingTotal = 0;
        this.resetJCMode();
    }

    getRunningTotal() {
        return {
            total: this.runningTotal,
            manual: this.manualTotal,
            crossing: this.crossingTotal,
            count: this.entries.length
        };
    }

    formatEntryResult(entry, isLast) {
        let html = '';
        const typeLabel = entry.type === 'manual' ? '📝 Manual' : 
                         entry.type === 'crossing' ? '✂️ Crossing' : 
                         entry.type === 'ai' ? '🪄 AI Formatted' : '📊 Regular';
        const typeClass = entry.type === 'manual' ? 'manual-entry' : 
                          entry.type === 'crossing' ? 'crossing-entry' : 
                          entry.type === 'ai' ? 'ai-entry' : 'regular-entry';
        
        if (isLast && (entry.type === 'regular' || entry.type === 'ai')) {
            html += `
                <div class="entry-result last-entry ${typeClass}" id="entry-${entry.id}">
                    <div class="entry-header">
                        <span class="entry-time">${entry.timestamp}</span>
                        <span class="entry-type">${typeLabel}</span>
                        <span class="entry-total">💰 ${entry.total}</span>
                    </div>
                    <div class="entry-details">
            `;
            
            let blockNumber = 1;
            for (const block of entry.blocks) {
                const icon = block.isCrossing ? '✂️' : (entry.type === 'ai' ? '🪄' : '📦');
                html += `
                    <div class="calculation-line">
                        <span class="line-input">${icon} #${blockNumber}</span>
                        <span class="line-result">${block.display}</span>
                    </div>
                `;
                blockNumber++;
            }
            
            html += `</div></div>`;
        } else if (isLast && entry.type === 'crossing') {
            html += `
                <div class="entry-result last-entry ${typeClass}" id="entry-${entry.id}">
                    <div class="entry-header">
                        <span class="entry-time">${entry.timestamp}</span>
                        <span class="entry-type">${typeLabel} ${entry.jcMode ? '🔀 JC ON' : ''}</span>
                        <span class="entry-total">💰 ${entry.total}</span>
                    </div>
                    <div class="entry-details">
            `;
            
            let blockNumber = 1;
            for (const block of entry.blocks) {
                html += `
                    <div class="calculation-line">
                        <span class="line-input">✂️ #${blockNumber}</span>
                        <span class="line-result">${block.display}</span>
                    </div>
                `;
                blockNumber++;
            }
            
            html += `</div></div>`;
        } else if (entry.type === 'manual') {
            html += `
                <div class="entry-result previous-entry ${typeClass}" id="entry-${entry.id}">
                    <div class="entry-header">
                        <span class="entry-time">${entry.timestamp}</span>
                        <span class="entry-type">${typeLabel}</span>
                        <span class="entry-total">💰 ${entry.total}</span>
                        <span class="entry-summary">${entry.description || 'Manual Amount'}</span>
                    </div>
                </div>
            `;
        } else {
            const summary = entry.type === 'crossing' ? 
                `✂️ ${entry.totalBlocks} crossings` : 
                `${entry.totalBlocks} blocks · ${entry.totalBoxes} boxes`;
            
            html += `
                <div class="entry-result previous-entry ${typeClass}" id="entry-${entry.id}">
                    <div class="entry-header">
                        <span class="entry-time">${entry.timestamp}</span>
                        <span class="entry-type">${typeLabel}</span>
                        <span class="entry-total">💰 ${entry.total}</span>
                        <span class="entry-summary">${summary}</span>
                    </div>
                </div>
            `;
        }
        
        return html;
    }

    formatAllEntries() {
        if (this.entries.length === 0) {
            return `
                <div class="empty-state">
                    <div class="icon">📝</div>
                    <p>No entries yet. Add your first list above!</p>
                </div>
            `;
        }
        
        let html = '';
        const reversed = [...this.entries].reverse();
        
        for (let i = 0; i < reversed.length; i++) {
            const entry = reversed[i];
            const isLast = (i === 0);
            html += this.formatEntryResult(entry, isLast);
        }
        
        const totals = this.getRunningTotal();
        html += `
            <div class="running-total">
                <span>📊 Total Entries: ${totals.count}</span>
                <span>📝 Manual: ${totals.manual}</span>
                <span>✂️ Crossing: ${totals.crossing}</span>
                <span>💰 Grand Total: ${totals.total}</span>
            </div>
        `;
        
        return html;
    }
}

if (typeof window !== 'undefined') {
    window.s0ulnixFormatter = s0ulnixFormatter;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = s0ulnixFormatter;
}
