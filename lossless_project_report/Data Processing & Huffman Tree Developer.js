const fs = require("fs");

// Huffman Tree Node
class Node {
    constructor(char, freq, left = null, right = null) {
        this.char = char;
        this.freq = freq;
        this.left = left;
        this.right = right;
    }
}

// Build Frequency Table
function buildFrequencyTable(text) {
    const freq = {};

    for (const char of text) {
        freq[char] = (freq[char] || 0) + 1;
    }

    return freq;
}

// Build Huffman Tree
function buildHuffmanTree(freqTable) {
    let nodes = [];

    for (const char in freqTable) {
        nodes.push(new Node(char, freqTable[char]));
    }

    while (nodes.length > 1) {
        nodes.sort((a, b) => a.freq - b.freq);

        const left = nodes.shift();
        const right = nodes.shift();

        nodes.push(
            new Node(
                null,
                left.freq + right.freq,
                left,
                right
            )
        );
    }

    return nodes[0];
}

// Generate Huffman Codes
function generateCodes(node, code = "", codes = {}) {
    if (!node) return codes;

    if (node.char !== null) {
        codes[node.char] = code || "0";
    }

    generateCodes(node.left, code + "0", codes);
    generateCodes(node.right, code + "1", codes);

    return codes;
}

// Compress Data
function compress(text, codes) {
    let compressed = "";

    for (const char of text) {
        compressed += codes[char];
    }

    return compressed;
}

// Decompress Data
function decompress(bits, tree) {
    let output = "";
    let current = tree;

    for (const bit of bits) {
        current = bit === "0"
            ? current.left
            : current.right;

        if (
            current.left === null &&
            current.right === null
        ) {
            output += current.char;
            current = tree;
        }
    }

    return output;
}

// Save Compressed File
function saveCompressedFile(
    outputFile,
    codes,
    compressedData
) {
    const packageData = {
        codes,
        data: compressedData
    };

    fs.writeFileSync(
        outputFile,
        JSON.stringify(packageData)
    );
}

// Load Compressed File
function loadCompressedFile(file) {
    return JSON.parse(
        fs.readFileSync(file, "utf8")
    );
}

// Rebuild Tree From Codes
function rebuildTree(codes) {
    const root = new Node(null, 0);

    for (const char in codes) {
        let current = root;
        const code = codes[char];

        for (const bit of code) {
            if (bit === "0") {
                if (!current.left)
                    current.left = new Node(
                        null,
                        0
                    );
                current = current.left;
            } else {
                if (!current.right)
                    current.right = new Node(
                        null,
                        0
                    );
                current = current.right;
            }
        }

        current.char = char;
    }

    return root;
}

// Main Compression Function
function compressFile(inputFile, outputFile) {
    const text = fs.readFileSync(
        inputFile,
        "utf8"
    );

    const freqTable =
        buildFrequencyTable(text);

    const tree =
        buildHuffmanTree(freqTable);

    const codes =
        generateCodes(tree);

    const compressedData =
        compress(text, codes);

    saveCompressedFile(
        outputFile,
        codes,
        compressedData
    );

    console.log("Compression Complete");
    console.log(
        `Original Size: ${
            text.length * 8
        } bits`
    );
    console.log(
        `Compressed Size: ${
            compressedData.length
        } bits`
    );

    console.log(
        `Compression Ratio: ${(
            (compressedData.length /
                (text.length * 8)) *
            100
        ).toFixed(2)}%`
    );
}

// Main Decompression Function
function decompressFile(
    compressedFile,
    outputFile
) {
    const packageData =
        loadCompressedFile(
            compressedFile
        );

    const tree = rebuildTree(
        packageData.codes
    );

    const text = decompress(
        packageData.data,
        tree
    );

    fs.writeFileSync(
        outputFile,
        text
    );

    console.log(
        "Decompression Complete"
    );
}

// Example Usage
compressFile(
    "input.txt",
    "compressed.huff"
);

decompressFile(
    "compressed.huff",
    "output.txt"
);
