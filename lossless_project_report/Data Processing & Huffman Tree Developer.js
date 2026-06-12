const fs = require("fs");

class Node {
    constructor(char, freq, left = null, right = null) {
        this.char = char;
        this.freq = freq;
        this.left = left;
        this.right = right;
    }
}

function buildFrequencyTable(text) {
    const freq = {};
    for (const char of text) {
        freq[char] = (freq[char] || 0) + 1;
    }
    return freq;
}

function buildHuffmanTree(freqTable) {
    let nodes = Object.entries(freqTable).map(([char, count]) => new Node(char, count));

    while (nodes.length > 1) {
        nodes.sort((a, b) => a.freq - b.freq);
        const left = nodes.shift();
        const right = nodes.shift();
        const combined = new Node(null, left.freq + right.freq, left, right);
        nodes.push(combined);
    }
    return nodes[0];
}

function generateCodes(node, prefix = "", codeMap = {}) {
    if (!node) return codeMap;
    if (node.char !== null) {
        codeMap[node.char] = prefix || "0";
        return codeMap;
    }
    generateCodes(node.left, prefix + "0", codeMap);
    generateCodes(node.right, prefix + "1", codeMap);
    return codeMap;
}

module.exports = {
    Node,
    buildFrequencyTable,
    buildHuffmanTree,
    generateCodes
};

