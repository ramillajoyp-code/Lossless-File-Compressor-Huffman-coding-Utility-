<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Huffman Compression Tool</title>

<style>
*{
    margin:0;
    padding:0;
    box-sizing:border-box;
    font-family:Arial,sans-serif;
}

body{
    background:#f4f8fc;
    padding:30px;
}

.container{
    max-width:900px;
    margin:auto;
    background:white;
    padding:25px;
    border-radius:15px;
    box-shadow:0 4px 12px rgba(0,0,0,0.1);
}

h1{
    text-align:center;
    color:#0b5091;
}

.subtitle{
    text-align:center;
    color:#0861b5;
    margin-bottom:25px;
}

textarea{
    width:100%;
    height:180px;
    padding:12px;
    border:1px solid #ccc;
    border-radius:10px;
    resize:none;
}

.buttons{
    margin:20px 0;
    display:flex;
    gap:10px;
    flex-wrap:wrap;
}

button{
    padding:10px 18px;
    border:none;
    border-radius:8px;
    background:#0861b5;
    color:white;
    cursor:pointer;
}

button:hover{
    opacity:.9;
}

.section{
    margin-top:20px;
}

.output{
    background:#f8fafc;
    border:1px solid #dbeafe;
    border-radius:10px;
    padding:15px;
    min-height:120px;
    white-space:pre-wrap;
    overflow:auto;
}
</style>
</head>

<body>

<div class="container">

<h1>Huffman Compression Tool</h1>
<p class="subtitle">Lossless Data Compression Using Huffman Coding</p>

<input type="file" id="fileInput" accept=".txt"><br><br>

<div class="section">
<h2>Original Text</h2>
<textarea id="inputText"></textarea>
</div>

<div class="buttons">
<button onclick="compressData()">Compress</button>
<button onclick="decompressData()">Decompress</button>
<button onclick="downloadCompressed()">Download Compressed</button>
</div>

<div class="section">
<h2>Compressed Output</h2>
<div class="output" id="compressedOutput">
Compressed data will appear here...
</div>
</div>

<div class="section">
<h2>Decompressed Output</h2>
<div class="output" id="decompressedOutput">
Decompressed text will appear here...
</div>
</div>

</div>

<script>

// ======================
// HUFFMAN IMPLEMENTATION
// ======================

class Node{
    constructor(char,freq,left=null,right=null){
        this.char=char;
        this.freq=freq;
        this.left=left;
        this.right=right;
    }
}

function buildFrequencyTable(text){
    const freq={};

    for(const char of text){
        freq[char]=(freq[char]||0)+1;
    }

    return freq;
}

function buildHuffmanTree(freqTable){

    const nodes=[];

    for(const char in freqTable){
        nodes.push(new Node(char,freqTable[char]));
    }

    while(nodes.length>1){

        nodes.sort((a,b)=>a.freq-b.freq);

        const left=nodes.shift();
        const right=nodes.shift();

        const parent=new Node(
            null,
            left.freq+right.freq,
            left,
            right
        );

        nodes.push(parent);
    }

    return nodes[0];
}

function generateHuffmanCodes(root){

    const codes={};

    function traverse(node,code){

        if(!node) return;

        if(node.char!==null){
            codes[node.char]=code || "0";
        }

        traverse(node.left,code+"0");
        traverse(node.right,code+"1");
    }

    traverse(root,"");

    return codes;
}

function compressText(text,codes){

    let result="";

    for(const char of text){
        result+=codes[char];
    }

    return result;
}

function decompressText(binary,root){

    let result="";
    let current=root;

    for(const bit of binary){

        current=(bit==="0")
            ? current.left
            : current.right;

        if(current.char!==null){
            result+=current.char;
            current=root;
        }
    }

    return result;
}

// ======================
// UI FUNCTIONS
// ======================

let savedCompressed="";
let savedTree=null;

document
.getElementById("fileInput")
.addEventListener("change",function(e){

    const file=e.target.files[0];

    if(!file) return;

    const reader=new FileReader();

    reader.onload=function(event){
        document.getElementById("inputText").value=
            event.target.result;
    };

    reader.readAsText(file);
});

function compressData(){

    const text=
        document.getElementById("inputText").value;

    if(text.trim()===""){
        alert("Enter some text first.");
        return;
    }

    const freqTable=
        buildFrequencyTable(text);

    savedTree=
        buildHuffmanTree(freqTable);

    const codes=
        generateHuffmanCodes(savedTree);

    savedCompressed=
        compressText(text,codes);

    document.getElementById(
        "compressedOutput"
    ).textContent=
        "HUFFMAN CODES:\n\n"+
        JSON.stringify(codes,null,2)+
        "\n\nCOMPRESSED DATA:\n\n"+
        savedCompressed;
}

function decompressData(){

    if(savedCompressed==="" || !savedTree){
        alert("Compress first.");
        return;
    }

    const text=
        decompressText(
            savedCompressed,
            savedTree
        );

    document.getElementById(
        "decompressedOutput"
    ).textContent=text;
}

function downloadCompressed(){

    if(savedCompressed===""){
        alert("Compress first.");
        return;
    }

    const blob=
        new Blob(
            [savedCompressed],
            {type:"text/plain"}
        );

    const link=
        document.createElement("a");

    link.href=
        URL.createObjectURL(blob);

    link.download=
        "compressed.txt";

    link.click();
}

</script>

</body>
</html>
