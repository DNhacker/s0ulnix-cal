/**
 * s0ulnix Parser - Complete Implementation
 * Updated: Crossing logic ONLY works when explicitly enabled
 * Regular "Enter your data" section NEVER uses crossing logic
 * FIXED: box=value format no longer double-counts
 */

class s0ulnixParser {
    constructor() {
        this.BOX_MAPPING = {
            '1111': '101', '2222': '102', '3333': '103',
            '4444': '104', '5555': '105', '6666': '106',
            '7777': '107', '8888': '108', '9999': '109',
            '0000': '110',
            '111': '111', '222': '112', '333': '113',
            '444': '114', '555': '115', '666': '116',
            '777': '117', '888': '118', '999': '119',
            '000': '120'
        };
        
        this.SEPARATORS = /[\s*,/\\\-_|.'`=]+/;
        this.jcMode = false;
        this.enableCrossing = false;
        
        this.VALUE_PATTERNS = [
            /\{\{(\d+)\}\}/,
            /\{(\d+)\}/,
            /==\((\d+)\)/,
            /====\((\d+)\)/,
            /\((\d+)\)$/,
            /\((\d+)\)/,
            /=\((\d+)\)/,
            /==(\d+)/,
            /===(\d+)/,
            /=\s*(\d+)$/,
            /Rs\.(\d+)/i,
            /rs[,.]\s*(\d+)/i,
            /\/(\d+)$/,
            /\.\.\.(\d+)$/,
            /total\s*(\d+)/i,
            /\binto\s*\(\((\d+)\)\)/i,
            /\binto\s*(\d+)/i,
            /\s+(\d+)$/
        ];
    }

    setCrossingEnabled(enabled) {
        this.enableCrossing = enabled;
    }

    toggleJCMode() {
        this.jcMode = !this.jcMode;
        return this.jcMode;
    }

    getJCMode() {
        return this.jcMode;
    }

    setJCMode(enabled) {
        this.jcMode = enabled;
    }

    resetJCMode() {
        this.jcMode = false;
        return this.jcMode;
    }

    cleanInput(text) {
        let lines = text.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
        
        lines = lines.map(line => {
            line = line.replace(/\bintu\b/gi, '');
            line = line.replace(/\binto\b/gi, '');
            line = line.replace(/^total\s*/i, '');
            line = line.replace(/\s*total\s*$/i, '');
            line = line.replace(/\.sg$/i, '');
            line = line.replace(/\s+/g, ' ').trim();
            return line;
        });
        
        lines = lines.filter(l => l.length > 0);
        lines = [...new Set(lines)];
        
        return lines;
    }

    extractValue(line) {
        for (const pattern of this.VALUE_PATTERNS) {
            const match = line.match(pattern);
            if (match) {
                return parseInt(match[1]);
            }
        }
        
        const totalMatch = line.match(/==(\d+)total/);
        if (totalMatch) {
            return parseInt(totalMatch[1]);
        }
        
        return null;
    }

    extractCrossingBoxes(line) {
        let clean = line;
        
        for (const pattern of this.VALUE_PATTERNS) {
            clean = clean.replace(pattern, '');
        }
        
        clean = clean.replace(/\btotal\b/gi, '');
        clean = clean.replace(/\bintu\b/gi, '');
        clean = clean.replace(/\binto\b/gi, '');
        clean = clean.replace(/\.sg$/i, '');
        clean = clean
            .replace(/^[=\s]+/, '')
            .replace(/[=\s]+$/, '')
            .replace(/,\s*$/, '')
            .replace(/\.\s*$/, '')
            .replace(/\|\s*/g, '');
        
        const crossingString = clean.replace(/[\s*,/\\\-_|.'`=]+/g, '');
        
        if (crossingString.length > 0) {
            return crossingString;
        }
        
        const numbers = clean.match(/\d+/g);
        if (numbers && numbers.length > 0) {
            return numbers.join('');
        }
        
        return null;
    }

    calculateCrossing(line) {
        const value = this.extractValue(line);
        if (value === null) return null;
        
        const crossingString = this.extractCrossingBoxes(line);
        if (!crossingString) return null;
        
        const length = crossingString.length;
        if (length < 3 || length > 8) return null;
        
        let boxes;
        if (this.jcMode) {
            boxes = (length * length) - length;
        } else {
            boxes = length * length;
        }
        
        const total = boxes * value;
        
        return {
            crossingString: crossingString,
            length: length,
            boxes: boxes,
            value: value,
            total: total,
            jcMode: this.jcMode,
            display: `${boxes} boxes × ${value} = ${total} (${this.jcMode ? 'JC' : 'Standard'} Crossing: ${length} digits)`
        };
    }

    isCrossingFormat(line) {
        if (!this.enableCrossing) return false;
        
        const value = this.extractValue(line);
        if (value === null) return false;
        
        let clean = line;
        for (const pattern of this.VALUE_PATTERNS) {
            clean = clean.replace(pattern, '');
        }
        clean = clean.trim();
        
        const separatorMatch = clean.match(/[\s*,/\\\-_|.'`]/);
        if (separatorMatch) return false;
        
        const crossingString = clean.replace(/[^0-9]/g, '');
        if (!crossingString) return false;
        
        const length = crossingString.length;
        const isOnlyDigits = /^[0-9]+$/.test(clean);
        if (!isOnlyDigits) return false;
        
        return length >= 3 && length <= 8;
    }

    extractBoxes(line) {
        let clean = line;
        
        for (const pattern of this.VALUE_PATTERNS) {
            clean = clean.replace(pattern, '');
        }
        
        clean = clean.replace(/\btotal\b/gi, '');
        clean = clean.replace(/\bintu\b/gi, '');
        clean = clean.replace(/\binto\b/gi, '');
        clean = clean.replace(/\.sg$/i, '');
        clean = clean
            .replace(/^[=\s]+/, '')
            .replace(/[=\s]+$/, '')
            .replace(/,\s*$/, '')
            .replace(/\.\s*$/, '')
            .replace(/\|\s*/g, '');
        
        const parts = clean.split(this.SEPARATORS)
            .map(p => p.trim())
            .filter(p => p.length > 0 && /^\d+$/.test(p));
        
        if (parts.length === 0) {
            const numbers = clean.match(/\d+/g);
            if (numbers && numbers.length > 0) {
                return numbers.map(b => this.mapBoxNumber(b));
            }
        }
        
        return parts.map(box => this.mapBoxNumber(box));
    }

    mapBoxNumber(box) {
        const str = String(box);
        if (this.BOX_MAPPING[str]) {
            return this.BOX_MAPPING[str];
        }
        return str;
    }

    detectFormat(line) {
        const clean = line.replace(/\s+/g, '');
        
        if (clean.includes('intu(((') || clean.includes('intu((') || clean.includes('into(((')) {
            return 'INTU';
        }
        if (clean.match(/\binto\s+\d+$/i)) return 'INTO';
        if (clean.includes('==(') && clean.includes(').sg')) return 'SG';
        if (clean.match(/==\d+total/)) return 'TOTAL_FORMAT';
        if (clean.match(/total\d+$/i)) return 'TOTAL_END';
        if (clean.includes('|') && clean.includes('=')) return 'H';
        if (clean.match(/^\d+\(\d+\)\d+\(\d+\)/)) return 'I';
        if (clean.match(/\d+\(\d+\)\d+\/\d+\/\d+\(\d+\)/)) return 'Q';
        if (clean.match(/\d+=\d+\.\s*\d+=\d+\./)) return 'M';
        if (clean.match(/\d+=\d+\/\d+=\d+/)) return 'N';
        if (clean.match(/\d+\/\d+\s+\d+\/\d+/)) return 'T';
        if (clean.match(/^\d+\/\d+$/)) return 'O';
        if (clean.match(/^\d+\*\d+$/)) return 'D';
        if (clean.match(/\d+\*\d+\*\d+\(\d+\)/)) return 'E';
        if (clean.includes('*') && clean.includes('=')) return 'R';
        if (clean.match(/^[\d\-]+=\d+$/)) return 'B';
        if (clean.match(/^[\d_]+=\d+$/)) return 'G';
        if (clean.match(/^[\d,]+\(\d+\)$/)) return 'C';
        if (clean.match(/^[\d\/]+\/\d+$/)) return 'F';
        if (clean.includes('..') && clean.includes('(')) return 'J';
        if (clean.includes('....') || clean.match(/[\d.]*\.\d+$/)) return 'K';
        if (clean.match(/\d+\s+\d+\s+\(\d+\)/)) return 'L';
        if (clean.match(/^[\d\/]+\(\d+\)$/)) return 'P';
        if (clean.includes('.') && clean.includes('=')) return 'S';
        if (clean.includes('.') && clean.includes('(')) return 'U';
        if (clean.includes('Rs.') || clean.includes('rs.')) return 'V';
        if (clean.includes('====(')) return 'W';
        if (clean.includes('==') && !clean.includes('===')) return 'X';
        if (clean.includes('*') && clean.includes('*(')) return 'Y';
        if (clean.includes('.//')) return 'Z';
        if (clean.includes('rs,') || clean.includes('RS,')) return 'AA';
        if (clean.match(/^\d+=\d+$/)) return 'A';
        
        return 'UNKNOWN';
    }

    parseLine(line) {
        const trimmed = line.trim();
        
        // FIX #1: Single "01=70" format
        if (/^\d+=\d+$/.test(trimmed)) {
            const parts = trimmed.split('=');
            const box = this.mapBoxNumber(parts[0]);
            const value = parseInt(parts[1]);
            return {
                boxes: [box],
                value: value,
                total: value,
                format: 'A',
                source: line,
                isCrossing: false,
                boxesCount: 1,
                display: `1 box × ${value} = ${value}`
            };
        }
        
        // FIX #2: Comma-separated "01=70,02=70,03=70"
        if (/^\d+=\d+(,\s*\d+=\d+)+$/.test(trimmed)) {
            const pairs = trimmed.split(',').map(p => p.trim());
            const boxes = [];
            let grandTotal = 0;
            
            for (const pair of pairs) {
                const [box, val] = pair.split('=');
                const mappedBox = this.mapBoxNumber(box);
                const value = parseInt(val);
                boxes.push(mappedBox);
                grandTotal += value;
            }
            
            return {
                boxes: boxes,
                value: Math.round(grandTotal / boxes.length),
                total: grandTotal,
                format: 'A_MULTI',
                source: line,
                isCrossing: false,
                boxesCount: boxes.length,
                display: `${boxes.length} boxes = ${grandTotal}`
            };
        }
        
        // FIX #3: Hyphen+Equal "41-42-43=50"
        if (/^[\d\-]+=\d+$/.test(trimmed)) {
            const [boxPart, valuePart] = trimmed.split('=');
            const boxes = boxPart.split('-')
                .map(b => this.mapBoxNumber(b.trim()))
                .filter(b => b.length > 0);
            const value = parseInt(valuePart);
            return {
                boxes: boxes,
                value: value,
                total: boxes.length * value,
                format: 'B',
                source: line,
                isCrossing: false,
                boxesCount: boxes.length,
                display: `${boxes.length} boxes × ${value} = ${boxes.length * value}`
            };
        }
        
        // FIX #4: Comma+Parentheses "55,56,57(70)"
        if (/^[\d,]+\(\d+\)$/.test(trimmed)) {
            const match = trimmed.match(/^([\d,]+)\((\d+)\)$/);
            if (match) {
                const boxes = match[1].split(',')
                    .map(b => this.mapBoxNumber(b.trim()))
                    .filter(b => b.length > 0);
                const value = parseInt(match[2]);
                return {
                    boxes: boxes,
                    value: value,
                    total: boxes.length * value,
                    format: 'C',
                    source: line,
                    isCrossing: false,
                    boxesCount: boxes.length,
                    display: `${boxes.length} boxes × ${value} = ${boxes.length * value}`
                };
            }
        }
        
        // Check crossing format (only if enabled)
        if (this.isCrossingFormat(line)) {
            const result = this.calculateCrossing(line);
            if (result) {
                return {
                    boxes: [result.crossingString],
                    value: result.value,
                    total: result.total,
                    format: 'CROSSING',
                    source: line,
                    isCrossing: true,
                    crossingLength: result.length,
                    boxesCount: result.boxes,
                    display: result.display,
                    jcMode: this.jcMode
                };
            }
        }
        
        const format = this.detectFormat(line);
        let boxes = [];
        let value = this.extractValue(line);
        
        if (value === null) {
            const totalMatch = line.match(/==(\d+)total/i);
            if (totalMatch) value = parseInt(totalMatch[1]);
            
            const totalEndMatch = line.match(/total(\d+)$/i);
            if (totalEndMatch) value = parseInt(totalEndMatch[1]);
            
            const doubleParenMatch = line.match(/\(\((\d+)\)\)/);
            if (doubleParenMatch) value = parseInt(doubleParenMatch[1]);
            
            const intoMatch = line.match(/\binto\s+(\d+)$/i);
            if (intoMatch) value = parseInt(intoMatch[1]);
        }
        
        switch(format) {
            case 'INTU':
            case 'INTO':
                let cleanInto = line
                    .replace(/\bintu\b/gi, '')
                    .replace(/\binto\b/gi, '')
                    .replace(/\(\((\d+)\)\)/g, '')
                    .replace(/\((\d+)\)/g, '');
                boxes = cleanInto.split(/[\s,]+/)
                    .map(b => b.trim())
                    .filter(b => b.length > 0 && /^\d+$/.test(b))
                    .map(b => this.mapBoxNumber(b));
                break;
                
            case 'SG':
                const sgParts = line.split('==')[0].split('=');
                boxes = sgParts.map(b => this.mapBoxNumber(b.trim()));
                break;
                
            case 'TOTAL_FORMAT':
            case 'TOTAL_END':
                let totalClean = line
                    .replace(/==\d+total/i, '')
                    .replace(/total\d+$/i, '')
                    .replace(/total/i, '')
                    .replace(/==$/, '')
                    .replace(/=\s*$/, '');
                boxes = totalClean.split(/[=,\s]+/)
                    .map(b => b.trim())
                    .filter(b => b.length > 0 && /^\d+$/.test(b))
                    .map(b => this.mapBoxNumber(b));
                break;
                
            default:
                const result = this.parseStandardFormat(line);
                if (result) {
                    boxes = result.boxes;
                    if (value === null) value = result.value;
                }
                break;
        }
        
        if (boxes.length === 0) {
            const numbers = line.match(/\d+/g);
            if (numbers && numbers.length > 1) {
                if (value !== null) {
                    boxes = numbers.slice(0, -1).map(b => this.mapBoxNumber(b));
                } else {
                    boxes = numbers.map(b => this.mapBoxNumber(b));
                }
            }
        }
        
        if (boxes.length === 0) {
            const clean = line.replace(/[^0-9,.\s]/g, '');
            const parts = clean.split(/[\s,]+/).filter(p => p.length > 0);
            if (parts.length > 1) {
                if (value !== null) {
                    boxes = parts.slice(0, -1).map(b => this.mapBoxNumber(b));
                } else {
                    boxes = parts.map(b => this.mapBoxNumber(b));
                    value = 1;
                }
            }
        }
        
        boxes = boxes.filter(b => b && b.length > 0);
        
        if (boxes.length === 0) return null;
        if (value === null) value = 1;
        
        return {
            boxes: boxes,
            value: value,
            total: boxes.length * value,
            format: format,
            source: line,
            isCrossing: false,
            boxesCount: boxes.length,
            display: `${boxes.length} boxes × ${value} = ${boxes.length * value}`
        };
    }

    parseStandardFormat(line) {
        const formats = [
            { name: 'A', regex: /^(\d+)=(\d+)$/, parse: (m) => ({ boxes: [this.mapBoxNumber(m[1])], value: parseInt(m[2]) }) },
            { name: 'B', regex: /^([\d\-]+)=(\d+)$/, parse: (m) => ({ boxes: m[1].split('-').map(b => this.mapBoxNumber(b.trim())), value: parseInt(m[2]) }) },
            { name: 'C', regex: /^([\d,]+)\((\d+)\)$/, parse: (m) => ({ boxes: m[1].split(',').map(b => this.mapBoxNumber(b.trim())), value: parseInt(m[2]) }) },
            { name: 'D', regex: /^(\d+)\*(\d+)$/, parse: (m) => ({ boxes: [this.mapBoxNumber(m[1])], value: parseInt(m[2]) }) },
            { name: 'E', regex: /^([\d\*]+)\((\d+)\)$/, parse: (m) => ({ boxes: m[1].split('*').map(b => this.mapBoxNumber(b.trim())), value: parseInt(m[2]) }) },
            { name: 'F', regex: /^([\d\/]+)\/(\d+)$/, parse: (m) => ({ boxes: m[1].split('/').map(b => this.mapBoxNumber(b.trim())), value: parseInt(m[2]) }) },
            { name: 'G', regex: /^([\d_]+)=(\d+)$/, parse: (m) => ({ boxes: m[1].split('_').map(b => this.mapBoxNumber(b.trim())), value: parseInt(m[2]) }) },
            { name: 'J', regex: /^([\d\.]+)\((\d+)\)$/, parse: (m) => ({ boxes: m[1].split('..').map(b => this.mapBoxNumber(b.trim())), value: parseInt(m[2]) }) },
            { name: 'X', regex: /^([\d,]+)==(\d+)$/, parse: (m) => ({ boxes: m[1].split(',').map(b => this.mapBoxNumber(b.trim())), value: parseInt(m[2]) }) },
        ];
        
        for (const fmt of formats) {
            const match = line.match(fmt.regex);
            if (match) {
                return fmt.parse(match);
            }
        }
        
        return null;
    }

    parseBlocks(text) {
        const lines = this.cleanInput(text);
        const blocks = [];
        let i = 0;
        
        while (i < lines.length) {
            const line = lines[i];
            
            const totalMatch = line.match(/^total\s*(\d+)$/i);
            if (totalMatch) {
                i++;
                continue;
            }
            
            const value = this.extractValue(line);
            
            if (value !== null) {
                const result = this.parseLine(line);
                if (result) {
                    blocks.push(result);
                }
                i++;
            } else {
                let blockLines = [line];
                let j = i + 1;
                let foundValue = null;
                let valueLineIndex = -1;
                
                while (j < lines.length) {
                    const nextLine = lines[j];
                    const nextValue = this.extractValue(nextLine);
                    
                    if (nextValue !== null) {
                        foundValue = nextValue;
                        valueLineIndex = j;
                        blockLines.push(nextLine);
                        break;
                    } else {
                        blockLines.push(nextLine);
                        j++;
                    }
                }
                
                let allBoxes = [];
                for (const bl of blockLines) {
                    const boxes = this.extractBoxes(bl);
                    allBoxes.push(...boxes);
                }
                
                if (allBoxes.length > 0 && foundValue !== null) {
                    blocks.push({
                        boxes: allBoxes.map(b => this.mapBoxNumber(b)),
                        value: foundValue,
                        total: allBoxes.length * foundValue,
                        format: 'MULTI_LINE',
                        source: blockLines.join(' | '),
                        isCrossing: false,
                        boxesCount: allBoxes.length,
                        display: `${allBoxes.length} boxes × ${foundValue} = ${allBoxes.length * foundValue}`
                    });
                }
                
                i = valueLineIndex !== -1 ? valueLineIndex + 1 : lines.length;
            }
        }
        
        return blocks;
    }

    process(text) {
        const cleaned = this.cleanInput(text);
        const blocks = this.parseBlocks(text);
        
        let grandTotal = 0;
        const calculation = [];
        
        for (const block of blocks) {
            const total = block.total || block.boxes.length * block.value;
            grandTotal += total;
            
            calculation.push({
                source: block.source || block.boxes.join(','),
                boxes: block.isCrossing ? block.boxesCount : block.boxes.length,
                value: block.value,
                total: total,
                format: block.format || 'UNKNOWN',
                isCrossing: block.isCrossing || false,
                crossingLength: block.crossingLength || 0,
                display: block.display
            });
        }
        
        return {
            cleanedLines: cleaned,
            blocks: calculation,
            grandTotal: grandTotal,
            totalBlocks: blocks.length,
            totalBoxes: blocks.reduce((sum, b) => sum + (b.isCrossing ? b.boxesCount : b.boxes.length), 0)
        };
    }
}

if (typeof window !== 'undefined') {
    window.s0ulnixParser = s0ulnixParser;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = s0ulnixParser;
}
