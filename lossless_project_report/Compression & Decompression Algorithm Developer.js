function compressText(originalText, codeMap) {
    let compressedBits = "";
    for (const char of originalText) {
        compressedBits += codeMap[char];
    }
    return compressedBits;
}

function decompressText(compressedBits, rootNode) {
    let result = "";
    let current = rootNode;
    for (const bit of compressedBits) {
        current = bit === "0" ? current.left : current.right;
        if (!current.left && !current.right) {
            result += current.char;
            current = rootNode;
        }
    }
    return result;
}

function rebuildHuffmanTree(codeMap) {
    const root = new Node(null, 0);
    for (const char in codeMap) {
        let current = root;
        const bits = codeMap[char];
        for (const bit of bits) {
            if (bit === "0") {
                if (!current.left) current.left = new Node(null, 0);
                current = current.left;
            } else {
                if (!current.right) current.right = new Node(null, 0);
                current = current.right;
            }
        }
        current.char = char;
    }
    return root;
}

module.exports = {
    compressText,
    decompressText,
    rebuildHuffmanTree
};
